// Universal HTML-to-Markdown extraction for ExtractMD extension
// Fallback module for any website without specialized extractors

import TurndownService from 'turndown';
import {
  copyToClipboard,
  showNotification,
  getSettings,
  closeCurrentTab,
  downloadMarkdownFile,
  showSuccessNotificationWithTokens,
} from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { sendToConfiguredApi } from './handlers/apiHandler.js';
import {
  computeEnabledApiProfileSignature,
  getSecondaryApiActions,
} from './handlers/apiSecondaryActions.js';
import { encode } from 'gpt-tokenizer';

let isProcessing = false;
let isApiProcessing = false;
let universalObserver = null;
let floatingButtonController = null;
let floatingButtonUniversalApiSignature = '';
let universalStorageListenerAttached = false;

/**
 * Create and configure a Turndown service instance
 */
function createTurndownService(settings) {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  // Always remove these non-content elements
  turndown.remove([
    'script',
    'style',
    'noscript',
    'svg',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'select',
    'textarea',
  ]);

  // Remove images if setting is disabled
  if (!settings.universalIncludeImages) {
    turndown.remove(['img', 'picture', 'figure']);
  }

  // Remove links if setting is disabled (keep text content)
  if (!settings.universalIncludeLinks) {
    turndown.addRule('removeLinks', {
      filter: 'a',
      replacement: (content) => content,
    });
  }

  // Remove navigation elements if setting is enabled
  if (settings.universalStripNav) {
    turndown.remove(['nav', 'header', 'footer', 'aside']);
  }

  return turndown;
}

/**
 * Simple content finder - gets the body and lets Turndown do the work
 */
function findMainContent(mode, customSelector) {
  if (mode === 'selector' && customSelector) {
    return document.querySelector(customSelector) || document.body;
  }
  if (mode === 'main') {
    return document.querySelector('main') || document.body;
  }
  if (mode === 'full') {
    return document.body;
  }

  // Auto mode: try common patterns, fallback to body
  return (
    document.querySelector('main') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('article') ||
    document.body
  );
}

function buildUniversalApiVariables(markdown) {
  const pageTitle = document.title || 'Page';
  const pageUrl = window.location.href;
  const hostname = window.location.hostname || '';
  const wordCount = String(markdown || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    title: pageTitle,
    link: pageUrl,
    content: markdown,
    site: hostname,
    domain: hostname,
    word_count: wordCount,
    extracted_at: new Date().toISOString(),
  };
}

function extractUniversalMarkdown(settings) {
  const contentElement = findMainContent(
    settings.universalContentMode,
    settings.universalCustomSelector
  );
  if (!contentElement || !contentElement.textContent?.trim()) {
    throw new Error('No content found on this page');
  }

  const turndown = createTurndownService(settings);
  let markdown = turndown.turndown(contentElement.innerHTML);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  if (markdown.length < 100 && contentElement.textContent.trim().length > 100) {
    markdown = contentElement.textContent
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n');
  }

  if (settings.universalIncludeUrl) {
    const pageUrl = window.location.href;
    const pageTitle = document.title || 'Page';
    markdown = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${markdown}`;
  }

  return markdown;
}

/**
 * Perform the universal HTML-to-Markdown extraction
 */
export async function performUniversalCopy(updateButton = false) {
  if (isProcessing) return;
  isProcessing = true;
  if (updateButton && floatingButtonController) floatingButtonController.setLoading();

  try {
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          universalIncludeImages: true,
          universalIncludeLinks: true,
          universalIncludeUrl: true,
          universalContentMode: 'auto',
          universalCustomSelector: '',
          universalStripNav: true,
          universalPreserveCodeBlocks: true,
          downloadInsteadOfCopy: false,
          downloadIfTokensExceed: 0,
        },
        resolve
      );
    });

    const md = extractUniversalMarkdown(settings);

    // Handle copy/download based on settings
    const globalSettings = await getSettings();

    if (settings.downloadInsteadOfCopy || window.__extractmd_force_download) {
      downloadMarkdownFile(md, document.title, 'ExtractMD');
      if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
      showSuccessNotificationWithTokens('Page downloaded as Markdown!', md);
    } else {
      // Check token threshold
      const threshold = parseInt(settings.downloadIfTokensExceed, 10);
      if (!isNaN(threshold) && threshold > 0) {
        const tokens = encode(md).length;
        if (tokens >= threshold * 1000) {
          downloadMarkdownFile(md, document.title, 'ExtractMD');
          if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
          showSuccessNotificationWithTokens('Page downloaded as Markdown! (token threshold)', md);
          await incrementKpi('universal');
          handlePostCopyActions(globalSettings);
          resetProcessingState(updateButton);
          return;
        }
      }
      await copyToClipboard(md, true);
      if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
      showSuccessNotificationWithTokens('Page copied as Markdown!', md);
    }

    // Increment KPI counter
    await incrementKpi('universal');

    // Handle post-copy actions
    handlePostCopyActions(globalSettings);
    resetProcessingState(updateButton);
  } catch (e) {
    console.error('[ExtractMD] Universal extraction failed:', e);
    if (updateButton && floatingButtonController) {
      floatingButtonController.setError();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 3000);
    } else {
      isProcessing = false;
    }
    showNotification('Failed to extract page content.', 'error');
  }
}

async function performUniversalApiSend({ updateButton = false, profileId = '' } = {}) {
  if (isApiProcessing) return;
  isApiProcessing = true;
  if (updateButton && floatingButtonController) floatingButtonController.setLoading();

  try {
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          universalIncludeImages: true,
          universalIncludeLinks: true,
          universalIncludeUrl: true,
          universalContentMode: 'auto',
          universalCustomSelector: '',
          universalStripNav: true,
          universalPreserveCodeBlocks: true,
        },
        resolve
      );
    });

    const markdown = extractUniversalMarkdown(settings);
    const apiVariables = buildUniversalApiVariables(markdown);

    await sendToConfiguredApi({
      integration: 'universal',
      variables: apiVariables,
      profileId,
    });

    if (updateButton && floatingButtonController) {
      floatingButtonController.setSuccess();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isApiProcessing = false;
      }, 2000);
    } else {
      isApiProcessing = false;
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to send page content via API.';
    showNotification(message, 'error');
    if (updateButton && floatingButtonController) {
      floatingButtonController.setError();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isApiProcessing = false;
      }, 3000);
    } else {
      isApiProcessing = false;
    }
  }
}

/**
 * Reset processing state after extraction
 */
function resetProcessingState(updateButton) {
  if (updateButton && floatingButtonController) {
    setTimeout(() => {
      floatingButtonController.setNormal();
      isProcessing = false;
    }, 2000);
  } else {
    isProcessing = false;
  }
}

/**
 * Handle post-copy actions like jumping to domain or closing tab
 */
function handlePostCopyActions(settings) {
  if (settings.jumpToDomain && settings.jumpToDomainUrl) {
    chrome.runtime.sendMessage({ action: 'openNewTab', url: settings.jumpToDomainUrl });
  }
  if (settings.closeTabAfterExtraction) {
    setTimeout(() => {
      closeCurrentTab();
    }, 500);
  }
}

/**
 * Show notification about detected content
 */
function showContentInfoNotification(contentElement) {
  const wordCount = (contentElement.textContent || '').trim().split(/\s+/).length;
  const message = `Content detected<br><span style='font-weight:normal;font-size:13px;'>~${wordCount.toLocaleString()} words</span>`;
  showNotification(message, 'info');
}

/**
 * Manage the floating button for universal extraction
 */
async function manageFloatingButtonForUniversal() {
  // Don't create button if domain is ignored
  if (window.__extractmd_domain_ignored) {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    }
    return;
  }

  // Check if there's meaningful content on the page
  const contentElement = findMainContent('auto', '');
  const hasContent = contentElement && contentElement.textContent?.trim().length > 100;

  if (hasContent) {
    const buttonSettings = await new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          floatingButtonEnableDrag: true,
          floatingButtonEnableDismiss: true,
          floatingButtonShowDetectionHint: true,
          apiOutputEnabled: false,
          apiProfilesJson: '[]',
        },
        resolve
      );
    });

    const apiSignature = computeEnabledApiProfileSignature({
      apiProfilesJson: buttonSettings.apiProfilesJson,
      apiOutputEnabled: buttonSettings.apiOutputEnabled,
      integration: 'universal',
    });

    const existingButton = document.getElementById('extractmd-floating-button');
    if (existingButton && floatingButtonController) {
      if (apiSignature !== floatingButtonUniversalApiSignature) {
        floatingButtonController.remove();
        floatingButtonController = null;
      } else {
        floatingButtonController.show();
        return;
      }
    } else if (existingButton && !floatingButtonController) {
      existingButton.remove();
    }

    if (document.getElementById('extractmd-floating-button')) return;

    floatingButtonUniversalApiSignature = apiSignature;
    const secondaryActions = getSecondaryApiActions({
      apiProfilesJson: buttonSettings.apiProfilesJson,
      apiOutputEnabled: buttonSettings.apiOutputEnabled,
      integration: 'universal',
      onProfileAction: async (profileId) => {
        await performUniversalApiSend({ updateButton: true, profileId });
      },
    });

    floatingButtonController = await createFloatingButton({
      domain: window.location.hostname,
      enableDrag: buttonSettings.floatingButtonEnableDrag,
      enableDismiss: buttonSettings.floatingButtonEnableDismiss,
      showDetectionHint: buttonSettings.floatingButtonShowDetectionHint !== false,
      detectionHintText: 'Page',
      secondaryActions,
      onClick: async () => {
        await performUniversalCopy(true);
      },
    });

    if (floatingButtonController) {
      floatingButtonController.appendTo(document.body);
      console.debug('[ExtractMD] Floating button created and added to DOM (Universal)');

      // Show content info notification if setting is enabled
      chrome.storage.sync.get({ universalShowInfoNotification: false }, function (settings) {
        if (settings.universalShowInfoNotification) {
          showContentInfoNotification(contentElement);
        }
      });
    }
  } else {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    }
    floatingButtonUniversalApiSignature = '';
  }
}

/**
 * Set up mutation observer to handle dynamic content
 */
function setupUniversalMutationObserver() {
  if (universalObserver) return;

  let debounceTimer = null;

  universalObserver = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      manageFloatingButtonForUniversal();
    }, 500);
  });

  universalObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Initialize universal extraction features
 */
export function initUniversalFeatures() {
  chrome.storage.sync.get({ enableUniversalIntegration: true }, function (items) {
    if (items.enableUniversalIntegration === false) return;
    setupUniversalMutationObserver();
    manageFloatingButtonForUniversal();
    if (!universalStorageListenerAttached && chrome.storage?.onChanged) {
      universalStorageListenerAttached = true;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        if (!changes.apiProfilesJson && !changes.apiOutputEnabled) return;
        manageFloatingButtonForUniversal();
      });
    }
  });
}
