// LinkedIn Jobs extraction module for ExtractMD
// Extracts job details from LinkedIn job pages

import { showNotification } from './utils.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { handleCopyOrDownload } from './handlers/copyHandler.js';
import { runIntegrationApiSend } from './handlers/apiSendWorkflow.js';
import {
  computeEnabledApiProfileSignature,
  getSecondaryApiActions,
} from './handlers/apiSecondaryActions.js';

let isProcessing = false;
let isApiProcessing = false;
let linkedInObserver = null;
let floatingButtonController = null;
let floatingButtonLinkedInApiSignature = '';
let linkedInStorageListenerAttached = false;

/**
 * Detect whether the current page is a supported LinkedIn job page
 */
export function isLinkedInJobPage() {
  const { pathname, search } = window.location;
  if (pathname.startsWith('/jobs/view/')) return true;
  if (pathname.startsWith('/jobs/search-results/')) {
    return new URLSearchParams(search).has('currentJobId');
  }
  // DEPRIORITIZED: /jobs/collections/ uses a legacy Ember-based DOM (no SDUI attributes).
  // Detection is kept so the floating button appears, but extraction throws a clear error.
  if (pathname.startsWith('/jobs/collections/')) {
    return new URLSearchParams(search).has('currentJobId');
  }
  return false;
}

/**
 * Extract the job ID from the current page URL
 */
export function getLinkedInJobId() {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);

  // /jobs/view/{id}
  const viewMatch = pathname.match(/\/jobs\/view\/(\d+)/);
  if (viewMatch) return viewMatch[1];

  // currentJobId param
  const currentJobId = params.get('currentJobId');
  if (currentJobId) return currentJobId;

  // referenceJobId fallback
  const refId = params.get('referenceJobId');
  if (refId) return refId;

  return null;
}

/**
 * Get page type classification
 */
function getPageType() {
  const { pathname } = window.location;
  if (pathname.startsWith('/jobs/view/')) return 'view';
  if (pathname.startsWith('/jobs/search-results/')) return 'search_results';
  if (pathname.startsWith('/jobs/collections/')) return 'collections';
  return 'view';
}

/**
 * Build the canonical job URL
 */
function getCanonicalJobUrl(jobId) {
  return `https://www.linkedin.com/jobs/view/${jobId}/`;
}

/**
 * Decode external apply link from LinkedIn redirect URL
 */
export function decodeLinkedInRedirectUrl(redirectUrl) {
  if (!redirectUrl) return null;
  try {
    const url = new URL(redirectUrl, window.location.origin);
    if (url.pathname.startsWith('/redir/redirect')) {
      const target = url.searchParams.get('url');
      if (target) return decodeURIComponent(target);
    }
  } catch {
    // Not a valid URL, return as-is
  }
  return redirectUrl;
}

/**
 * Extract company name from aria-label attributes.
 * LinkedIn uses: aria-label="Company, PALFINGER AG."
 */
function extractCompanyName() {
  const companyEl = document.querySelector('[aria-label^="Company,"]');
  if (companyEl) {
    const label = companyEl.getAttribute('aria-label') || '';
    const match = label.match(/^Company,\s*(.+?)\.?$/);
    if (match) return match[1].trim();
  }

  const logoEl = document.querySelector('[aria-label^="Company logo for,"]');
  if (logoEl) {
    const label = logoEl.getAttribute('aria-label') || '';
    const match = label.match(/^Company logo for,\s*(.+?)\.?$/);
    if (match) return match[1].trim();
  }

  return '';
}

/**
 * Extract company URL from links containing /company/
 */
function extractCompanyUrl() {
  const link = document.querySelector('a[href*="/company/"]');
  if (link) {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('/')) return `https://www.linkedin.com${href}`;
    return href;
  }
  return '';
}

/**
 * Extract the job title.
 * On LinkedIn, the title is in a prominent <p> element near the top of the card.
 */
function extractJobTitle() {
  const companyEl = document.querySelector('[aria-label^="Company,"]');
  if (companyEl) {
    let ancestor = companyEl.parentElement;
    for (let i = 0; i < 15 && ancestor; i++) {
      const paragraphs = ancestor.querySelectorAll('p');
      for (const p of paragraphs) {
        if (p.closest('[data-testid="expandable-text-box"]')) continue;
        const text = p.textContent?.trim() || '';
        if (text.length > 3 && text.length < 200 && !text.includes('·') && !text.includes('ago')) {
          const aboutHeading = findAboutTheJobHeading();
          if (
            !aboutHeading ||
            p.compareDocumentPosition(aboutHeading) & Node.DOCUMENT_POSITION_FOLLOWING
          ) {
            return text.replace(/\s+/g, ' ').trim();
          }
        }
      }
      ancestor = ancestor.parentElement;
    }
  }

  const aboutHeading = findAboutTheJobHeading();
  if (aboutHeading) {
    let container = aboutHeading.parentElement;
    for (let i = 0; i < 10 && container; i++) {
      const ps = container.querySelectorAll('p');
      for (const p of ps) {
        if (p.closest('[data-testid="expandable-text-box"]')) continue;
        const text = p.textContent?.trim() || '';
        if (text.length > 3 && text.length < 200 && !text.includes('·') && !text.includes('ago')) {
          return text;
        }
      }
      container = container.parentElement;
    }
  }

  return '';
}

/**
 * Find the "About the job" heading element
 */
function findAboutTheJobHeading() {
  const headings = document.querySelectorAll('h2');
  for (const h of headings) {
    if (h.textContent?.trim() === 'About the job') return h;
  }
  return null;
}

/**
 * Check whether the job description content has been loaded into the DOM.
 * On individual job pages the content is present immediately; on search-results
 * pages the detail pane is lazy-loaded and may still contain skeleton placeholders.
 */
function isJobDetailContentReady() {
  return Boolean(
    document.querySelector('[data-testid="expandable-text-box"]') ||
    document.querySelector('[data-sdui-component*="aboutTheJob"]') ||
    findAboutTheJobHeading()
  );
}

/**
 * Wait for job description content to appear in the DOM.
 * Needed on search-results pages where the detail pane is lazy-loaded.
 * @param {string} pageType
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
async function waitForJobDetailContent(pageType, timeoutMs = 4000) {
  // Individual job pages have content immediately
  if (pageType === 'view') return;

  if (isJobDetailContentReady()) return;

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (isJobDetailContentReady()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Job details are still loading. Please try again in a moment.'));
      }
    }, 250);
  });
}

/**
 * Extract location, posted time, and applicant count from metadata.
 * LinkedIn structure: <span>Location</span> · <span>2 weeks ago</span> · <span>N people clicked apply</span>
 */
function extractMetadata() {
  let locationText = '';
  let postedRelative = '';
  let applicantCountText = '';

  // Find metadata paragraph near the company info
  // It contains "·" separators between location, time, and applicant count
  const companyEl = document.querySelector('[aria-label^="Company,"]');
  if (companyEl) {
    let ancestor = companyEl.parentElement;
    for (let i = 0; i < 15 && ancestor; i++) {
      const paragraphs = ancestor.querySelectorAll('p');
      for (const p of paragraphs) {
        const text = p.textContent?.trim() || '';
        if (text.includes('·')) {
          // Split by · to get location, time, applicants
          const parts = text
            .split('·')
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length >= 1) locationText = parts[0];
          if (parts.length >= 2) postedRelative = parts[1];
          if (parts.length >= 3) applicantCountText = parts[2];
          return { locationText, postedRelative, applicantCountText };
        }
      }
      ancestor = ancestor.parentElement;
    }
  }

  return { locationText, postedRelative, applicantCountText };
}

/**
 * Extract workplace type (On-site/Hybrid/Remote) and employment type (Full-time, etc.)
 * These appear as link/button text with specific values.
 */
function extractTypeLabels() {
  let workplaceType = '';
  let employmentType = '';

  const workplaceValues = ['remote', 'hybrid', 'on-site', 'onsite'];
  const employmentValues = [
    'full-time',
    'part-time',
    'contract',
    'internship',
    'temporary',
    'freelance',
    'volunteer',
  ];

  // Look for short text spans/links that match known type values
  const spans = document.querySelectorAll('span, a');
  for (const span of spans) {
    const text = span.textContent?.trim().toLowerCase() || '';
    // Must be short text (not nested in a larger paragraph)
    if (text.length > 30) continue;
    if (span.closest('p')?.textContent?.includes('·')) continue; // Skip metadata

    if (!workplaceType && workplaceValues.includes(text)) {
      workplaceType = span.textContent?.trim() || '';
    }
    if (!employmentType && employmentValues.includes(text)) {
      employmentType = span.textContent?.trim() || '';
    }
  }

  return { workplaceType, employmentType };
}

/**
 * Check if the job is verified.
 * Uses aria-label="Verified job" which is stable across LinkedIn versions.
 */
function isVerifiedJob() {
  return Boolean(document.querySelector('[aria-label="Verified job"]'));
}

/**
 * Extract the job description as markdown.
 * Uses data-testid="expandable-text-box" which contains the description HTML,
 * or falls back to finding content after the "About the job" heading.
 */
function extractDescriptionMarkdown() {
  // Primary: data-testid="expandable-text-box"
  const expandable = document.querySelector('[data-testid="expandable-text-box"]');
  if (expandable && expandable.innerHTML.length > 50) {
    return htmlToMarkdown(expandable.innerHTML);
  }

  // Secondary: find the aboutTheJob SDUI component content
  const aboutJob = document.querySelector(
    '[data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.aboutTheJob"]'
  );
  if (aboutJob) {
    // The content is typically in the next sibling or child container
    const content =
      aboutJob.querySelector('p > [tabindex]') || aboutJob.querySelector('[tabindex]');
    if (content && content.innerHTML.length > 50) {
      return htmlToMarkdown(content.innerHTML);
    }
  }

  // Fallback: find content after "About the job" heading
  const heading = findAboutTheJobHeading();
  if (heading) {
    let sibling = heading.parentElement?.nextElementSibling;
    for (let i = 0; i < 5 && sibling; i++) {
      if (sibling.innerHTML && sibling.innerHTML.length > 100) {
        // Check it's actual job content (not an ad or other section)
        const text = sibling.textContent || '';
        if (text.length > 100) {
          return htmlToMarkdown(sibling.innerHTML);
        }
      }
      sibling = sibling.nextElementSibling;
    }
  }

  return '';
}

/**
 * Extract apply button info.
 * Uses aria-label="Apply on company website" for external apply,
 * or button with text "Easy Apply" for LinkedIn apply.
 */
function extractApplyInfo() {
  // External apply link
  const externalApply = document.querySelector('[aria-label="Apply on company website"]');
  if (externalApply) {
    const href = externalApply.getAttribute('href') || '';
    const label = externalApply.textContent?.trim() || 'Apply';
    let applyUrl = href;
    let applyType = 'external';

    if (href.includes('/redir/redirect')) {
      applyUrl = decodeLinkedInRedirectUrl(href) || href;
    }

    return { label, url: applyUrl, type: applyType };
  }

  // Easy Apply button
  const easyApply =
    document.querySelector('[aria-label="Easy Apply"]') ||
    document.querySelector('button[aria-label*="Easy Apply"]');
  if (easyApply) {
    return { label: 'Easy Apply', url: '', type: 'linkedin' };
  }

  // Generic apply button
  const applyBtn = document.querySelector('[aria-label*="Apply"]');
  if (applyBtn) {
    const href = applyBtn.getAttribute('href') || '';
    const label = applyBtn.textContent?.trim() || 'Apply';
    let applyType = 'linkedin';
    let applyUrl = href;
    if (href.includes('/redir/redirect')) {
      applyUrl = decodeLinkedInRedirectUrl(href) || href;
      applyType = 'external';
    }
    return { label, url: applyUrl, type: applyType };
  }

  return { label: '', url: '', type: 'linkedin' };
}

/**
 * Extract similar jobs from the similarJobs SDUI component.
 */
function extractSimilarJobs() {
  const similarSection = document.querySelector(
    '[data-sdui-component="com.linkedin.sdui.generated.jobseeker.dsl.impl.similarJobs"]'
  );
  if (!similarSection) return [];

  const jobs = [];
  const links = similarSection.querySelectorAll('a[href*="/jobs/view/"]');
  const seen = new Set();

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const idMatch = href.match(/\/jobs\/view\/(\d+)/);
    if (!idMatch || seen.has(idMatch[1])) return;
    seen.add(idMatch[1]);

    const title = link.textContent?.trim() || '';
    if (!title) return;

    jobs.push({
      title,
      company: '',
      location: '',
      url: href.startsWith('/') ? `https://www.linkedin.com${href}` : href,
      job_id: idMatch[1],
    });
  });

  return jobs;
}

/**
 * Simple HTML to Markdown converter for job descriptions
 */
function htmlToMarkdown(html) {
  let md = html;

  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');

  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Paragraphs and line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');

  // Bold and italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Links
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Remove remaining tags
  md = md.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#x27;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

/**
 * Build the markdown output for a LinkedIn job
 */
function buildMarkdown(jobData) {
  const lines = [];

  if (jobData.job_title) {
    lines.push(`# ${jobData.job_title}`);
    lines.push('');
  }

  if (jobData.company_name) {
    const companyLine = jobData.company_url
      ? `[${jobData.company_name}](${jobData.company_url})`
      : jobData.company_name;
    lines.push(`**Company:** ${companyLine}`);
  }

  if (jobData.location_text) {
    lines.push(`**Location:** ${jobData.location_text}`);
  }

  if (jobData.workplace_type) {
    lines.push(`**Workplace:** ${jobData.workplace_type}`);
  }

  if (jobData.employment_type) {
    lines.push(`**Type:** ${jobData.employment_type}`);
  }

  if (jobData.posted_relative) {
    lines.push(`**Posted:** ${jobData.posted_relative}`);
  }

  if (jobData.verified_job) {
    lines.push('**Verified** ✓');
  }

  if (jobData.applicant_count_text) {
    lines.push(`**Applicants:** ${jobData.applicant_count_text}`);
  }

  lines.push('');

  if (jobData.description_markdown) {
    lines.push('## About the job');
    lines.push('');
    lines.push(jobData.description_markdown);
    lines.push('');
  }

  if (jobData.source_url) {
    lines.push(`---`);
    lines.push(`[View on LinkedIn](${jobData.source_url})`);
  }

  return lines.join('\n');
}

/**
 * Extract all job data from the current page
 */
export async function extractLinkedInJobData() {
  const jobId = getLinkedInJobId();
  if (!jobId) {
    throw new Error('Could not find job ID on this page.');
  }

  const pageType = getPageType();

  // DEPRIORITIZED: /jobs/collections/ uses a legacy Ember-based DOM (no SDUI attributes).
  // Extraction may produce incomplete results. Navigate to the individual job page for full support.
  if (pageType === 'collections') {
    throw new Error(
      'Collections page extraction is not fully supported. Please open the job directly.'
    );
  }

  // On search-results pages the detail pane is lazy-loaded; wait for content to appear
  await waitForJobDetailContent(pageType);

  // Check for login wall
  const loginWall =
    document.querySelector('.join-cta') ||
    document.querySelector('[data-test-id="login-modal"]') ||
    document.querySelector('.auth-wall');
  if (loginWall) {
    const hasDescription =
      document.querySelector('[data-testid="expandable-text-box"]') ||
      document.querySelector('[data-sdui-component*="aboutTheJob"]');
    if (!hasDescription) {
      throw new Error('Please sign in to LinkedIn to view this job.');
    }
  }

  const jobTitle = extractJobTitle();
  const companyName = extractCompanyName();
  const companyUrl = extractCompanyUrl();
  const { locationText, postedRelative, applicantCountText } = extractMetadata();
  const { workplaceType, employmentType } = extractTypeLabels();
  const verifiedJob = isVerifiedJob();
  const descriptionMarkdown = extractDescriptionMarkdown();
  const applyInfo = extractApplyInfo();
  const similarJobs = extractSimilarJobs();

  if (!jobTitle && !descriptionMarkdown) {
    throw new Error('Could not extract job details. The page may still be loading.');
  }

  const sourceUrl = window.location.href;
  const canonicalUrl = getCanonicalJobUrl(jobId);

  const jobData = {
    source_url: sourceUrl,
    page_type: pageType,
    job_id: jobId,
    canonical_job_url: canonicalUrl,
    job_title: jobTitle,
    company_name: companyName,
    company_url: companyUrl,
    location_text: locationText,
    workplace_type: workplaceType,
    employment_type: employmentType,
    posted_relative: postedRelative,
    verified_job: verifiedJob,
    applicant_count_text: applicantCountText,
    description_markdown: descriptionMarkdown,
    apply_label: applyInfo.label,
    apply_url: applyInfo.url,
    apply_type: applyInfo.type,
    extracted_at: new Date().toISOString(),
    similar_jobs: similarJobs,
  };

  const markdown = buildMarkdown(jobData);

  const apiVariables = {
    title: jobTitle,
    company: companyName,
    author: companyName,
    date: postedRelative,
    link: canonicalUrl,
    content: descriptionMarkdown,
    location: locationText,
    salary: '',
    extracted_at: jobData.extracted_at,
  };

  return { markdown, apiVariables, jobData };
}

// -- Copy handler --

export async function performLinkedInJobsCopy(updateButton = false) {
  if (isProcessing) return;
  isProcessing = true;

  if (updateButton && floatingButtonController) {
    floatingButtonController.setLoading();
  }

  try {
    const result = await extractLinkedInJobData();

    await handleCopyOrDownload(result.markdown, {
      title: result.jobData.job_title || document.title || 'LinkedIn Job',
      kpiType: 'linkedin_jobs',
      successMessage: 'LinkedIn job copied as Markdown!',
    });

    if (updateButton && floatingButtonController) {
      floatingButtonController.setSuccess();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 2000);
    } else {
      isProcessing = false;
    }
  } catch (error) {
    console.error('[ExtractMD] LinkedIn Jobs extraction failed:', error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to extract LinkedIn job details.';
    showNotification(message, 'error');

    if (updateButton && floatingButtonController) {
      floatingButtonController.setError();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 3000);
    } else {
      isProcessing = false;
    }
  }
}

// -- API send handler --

export async function performLinkedInJobsApiSend({ updateButton = false, profileId = '' } = {}) {
  await runIntegrationApiSend({
    integration: 'linkedin_jobs',
    profileId,
    updateButton,
    defaultErrorMessage: 'Failed to send LinkedIn job via API.',
    getIsProcessing: () => isApiProcessing,
    setIsProcessing: (value) => {
      isApiProcessing = value;
    },
    getFloatingButtonController: () => floatingButtonController,
    onError: (error) => {
      console.error('[ExtractMD] LinkedIn Jobs API send failed:', error);
    },
    prepareVariables: async () => {
      const result = await extractLinkedInJobData();
      return result.apiVariables;
    },
  });
}

// -- Floating button management --

async function manageFloatingButtonForLinkedInJobs() {
  if (window.__extractmd_domain_ignored) {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    } else {
      const existingDomButton = document.getElementById('extractmd-floating-button');
      if (existingDomButton) existingDomButton.remove();
    }
    return;
  }

  if (!isLinkedInJobPage()) {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    } else {
      const existingDomButton = document.getElementById('extractmd-floating-button');
      if (existingDomButton) existingDomButton.remove();
    }
    return;
  }

  const buttonSettings = await new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        floatingButtonEnableDrag: true,
        floatingButtonEnableDismiss: true,
        apiOutputEnabled: false,
        apiProfilesJson: '[]',
      },
      resolve
    );
  });

  const apiSignature = computeEnabledApiProfileSignature({
    apiProfilesJson: buttonSettings.apiProfilesJson,
    apiOutputEnabled: buttonSettings.apiOutputEnabled,
    integration: 'linkedin_jobs',
  });

  const existingDomButton = document.getElementById('extractmd-floating-button');
  if (existingDomButton && floatingButtonController) {
    if (apiSignature !== floatingButtonLinkedInApiSignature) {
      floatingButtonController.remove();
      floatingButtonController = null;
    } else {
      floatingButtonController.show();
      return;
    }
  } else if (existingDomButton && !floatingButtonController) {
    existingDomButton.remove();
  }

  if (document.getElementById('extractmd-floating-button')) {
    if (floatingButtonController) {
      floatingButtonController.show();
    }
    return;
  }

  if (floatingButtonController) {
    floatingButtonController.remove();
    floatingButtonController = null;
  }

  floatingButtonLinkedInApiSignature = apiSignature;

  const secondaryActions = getSecondaryApiActions({
    apiProfilesJson: buttonSettings.apiProfilesJson,
    apiOutputEnabled: buttonSettings.apiOutputEnabled,
    integration: 'linkedin_jobs',
    onProfileAction: async (profileId) => {
      await performLinkedInJobsApiSend({ updateButton: true, profileId });
    },
  });

  floatingButtonController = await createFloatingButton({
    domain: window.location.hostname,
    enableDrag: buttonSettings.floatingButtonEnableDrag,
    enableDismiss: buttonSettings.floatingButtonEnableDismiss,
    showDetectionHint: true,
    detectionHintText: 'Job',
    secondaryActions,
    onClick: async () => {
      await performLinkedInJobsCopy(true);
    },
  });

  if (floatingButtonController) {
    floatingButtonController.appendTo(document.body);
    console.debug('[ExtractMD] Floating button created and added to DOM (LinkedIn Jobs)');
  }
}

// -- Mutation observer for SPA job panel changes --

function setupLinkedInMutationObserver() {
  if (linkedInObserver) return;

  let debounceTimer = null;
  linkedInObserver = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      manageFloatingButtonForLinkedInJobs();
    }, 500);
  });

  linkedInObserver.observe(document.body, { childList: true, subtree: true });
}

// -- Init --

export function initLinkedInJobsFeatures() {
  chrome.storage.sync.get({ enableLinkedInJobsIntegration: true }, function (items) {
    if (items.enableLinkedInJobsIntegration === false) return;
    setupLinkedInMutationObserver();
    manageFloatingButtonForLinkedInJobs();

    if (!linkedInStorageListenerAttached && chrome.storage?.onChanged) {
      linkedInStorageListenerAttached = true;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        if (!changes.apiProfilesJson && !changes.apiOutputEnabled) return;
        manageFloatingButtonForLinkedInJobs();
      });
    }
  });
}
