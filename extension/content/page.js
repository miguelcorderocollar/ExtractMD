// Page simplifier extraction logic for ExtractMD extension

import { copyToClipboard, showNotification, getSettings, closeCurrentTab, setButtonLoading, setButtonSuccess, setButtonError, setButtonNormal, downloadMarkdownFile, showSuccessNotificationWithTokens, isFloatingButtonHiddenForCurrentDomain, attachHideAffordance, debounce, removeFloatingButton, onHiddenToggle } from './utils.js';
import { encode } from 'gpt-tokenizer';
import { Readability } from '@mozilla/readability';

let isProcessing = false;
let pageObserver = null;

function getCandidateRoots() {
  const selectors = [
    'main',
    'article',
    '[role="main"]',
    '#main',
    '.content',
    '.post',
    '.entry-content',
    '.post-content',
    '.article-body',
    '.article-content',
    '.page-content',
    '.blog-post',
    '.markdown-body',
    '.read__content',
    // Additional common content containers
    '.prose',
    '.article',
    '.story-body',
    '.post-body',
    '.entry',
    '.content-area',
    '.main-content',
    '[data-testid*="content"]',
    '[class*="article"]',
    '[class*="post"]',
    '[class*="entry"]',
  ];
  const candidates = new Set();
  selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => candidates.add(el)));
  // Always include body and first section as fallbacks
  if (document.body) candidates.add(document.body);
  const section = document.querySelector('section');
  if (section) candidates.add(section);
  return Array.from(candidates);
}

function cloneAndClean(root, simplifyAggressively = true) {
  const clone = root.cloneNode(true);
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'form', 'button', 'input', 'textarea', 'select',
    'nav', 'header', 'footer', 'aside',
    '.sidebar', '[role="complementary"]',
    '.advert', '.advertisement', '.ad', '.ads', '[class*="ad-"], [id*="ad-"]',
    '.share', '.sharing', '.social',
    '.comments', '#comments', '.related', '.newsletter', '.subscribe', '.cookie', '.gdpr', '.modal', '.popover', '.tooltip',
    '[aria-hidden="true"]', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
  ];
  // Always remove our own floating button if present
  const ownUiSelectors = ['#yt-transcript-floating-button'];
  clone.querySelectorAll(ownUiSelectors.join(',')).forEach(el => el.remove());
  if (simplifyAggressively) {
    clone.querySelectorAll(removeSelectors.join(',')).forEach(el => el.remove());
  } else {
    // Always remove scripts/styles etc
    clone.querySelectorAll(['script','style','noscript','iframe','svg','canvas'].join(',')).forEach(el => el.remove());
  }
  return clone;
}

function textLengthOf(node) {
  return (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim().length;
}

function chooseMainRoot(simplifyAggressively) {
  const candidates = getCandidateRoots();
  let best = null;
  let bestLen = 0;
  candidates.forEach(node => {
    const cleaned = cloneAndClean(node, simplifyAggressively);
    const len = textLengthOf(cleaned);
    if (len > bestLen) {
      best = node;
      bestLen = len;
    }
  });
  return best || document.body;
}

function getReadabilityRoot() {
  try {
    const cloned = document.cloneNode(true);
    const reader = new Readability(cloned);
    const article = reader.parse();
    if (article && article.content) {
      const parsed = new DOMParser().parseFromString(article.content, 'text/html');
      return parsed && parsed.body ? parsed.body : null;
    }
  } catch {}
  return null;
}

function nodeToMarkdown(node, opts) {
  const { includeImages, includeTables, includeLinks } = opts;
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  const tag = node.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) {
    const level = parseInt(tag[1], 10);
    return `${'#'.repeat(level)} ${node.textContent.trim()}\n\n`;
  }
  if (tag === 'p') {
    return `${Array.from(node.childNodes).map(n => nodeToMarkdown(n, opts)).join('').trim()}\n\n`;
  }
  if (tag === 'ul') {
    return `\n${Array.from(node.children).map(li => `- ${nodeToMarkdown(li, opts)}`).join('')}\n`;
  }
  if (tag === 'ol') {
    return `\n${Array.from(node.children).map((li, i) => `${i + 1}. ${nodeToMarkdown(li, opts)}`).join('')}\n`;
  }
  if (tag === 'li') {
    return `${Array.from(node.childNodes).map(n => nodeToMarkdown(n, opts)).join('').trim()}`;
  }
  if (tag === 'strong' || tag === 'b') {
    return `**${node.textContent}**`;
  }
  if (tag === 'em' || tag === 'i') {
    return `*${node.textContent}*`;
  }
  if (tag === 'blockquote') {
    return `> ${node.textContent.trim()}\n\n`;
  }
  if (tag === 'hr') {
    return '---\n\n';
  }
  if (tag === 'pre') {
    const codeEl = node.querySelector('code');
    const language = detectCodeLanguage(codeEl || node);
    const code = codeEl ? codeEl.textContent : node.textContent;
    const langBlock = language ? language : '';
    return `\`\`\`${langBlock}\n${code}\n\`\`\`\n\n`;
  }
  if (tag === 'code') {
    // Inline code formatting
    const text = node.textContent;
    return `\`${text}\``;
  }
  if ((tag === 'table' || tag === 'thead' || tag === 'tbody') && includeTables) {
    // Convert simple tables
    const table = tag === 'table' ? node : node.closest('table');
    if (table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      const mdRows = rows.map((tr, idx) => {
        const cells = Array.from(tr.querySelectorAll('th,td')).map(td => td.textContent.trim().replace(/\|/g, '\\|'));
        const line = `| ${cells.join(' | ')} |`;
        if (idx === 0) {
          const sep = `| ${cells.map(() => '---').join(' | ')} |`;
          return line + '\n' + sep;
        }
        return line;
      });
      return mdRows.join('\n') + '\n\n';
    }
  }
  if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    const text = node.textContent.trim();
    if (!includeLinks || !href) return text;
    let url = href;
    if (url && !url.match(/^https?:\/\//)) {
      if (url.startsWith('/')) {
        url = window.location.origin + url;
      } else {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        url = base + url;
      }
    }
    return `[${text || url}](${url})`;
  }
  if (tag === 'img' && includeImages) {
    const alt = node.getAttribute('alt') || '';
    let src = node.getAttribute('src') || '';
    if (!src) return '';
    if (!src.match(/^https?:\/\//)) {
      if (src.startsWith('/')) {
        src = window.location.origin + src;
      } else {
        const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
        src = base + src;
      }
    }
    return `![${alt}](${src})\n\n`;
  }
  // Default: recurse children
  return Array.from(node.childNodes).map(n => nodeToMarkdown(n, opts)).join('');
}

function detectCodeLanguage(element) {
  if (!element) return '';
  const classes = element.className || '';
  const match = classes.match(/language-([\w#+-]+)/i) || classes.match(/lang-([\w#+-]+)/i);
  if (match) return match[1];
  const data = element.getAttribute && (element.getAttribute('data-language') || element.getAttribute('data-lang'));
  return data || '';
}

async function extractPageMarkdown(options) {
  const {
    pageIncludeImages,
    pageIncludeTables,
    pageIncludeLinks,
    pageOnlyMainSection,
    pageSimplifyAggressively,
  } = options;

  const simplifyAggressively = pageSimplifyAggressively !== false;
  const includeImages = pageIncludeImages !== false;
  const includeTables = pageIncludeTables !== false;
  const includeLinks = pageIncludeLinks !== false;

  let root;
  if (pageOnlyMainSection !== false) {
    // Prefer Readability when extracting only the main section
    root = getReadabilityRoot() || chooseMainRoot(simplifyAggressively);
  } else {
    root = document.body;
  }

  const cleaned = cloneAndClean(root, simplifyAggressively);
  const md = nodeToMarkdown(cleaned, { includeImages, includeTables, includeLinks });
  return md.trim();
}

function hasArticleElements() {
  try {
    return document.querySelectorAll('article').length > 0;
  } catch { return false; }
}

function manageFloatingButtonForPage() {
  let floatingButton = document.getElementById('yt-transcript-floating-button');
  // Early exit on YouTube pages (handled by YouTube module only)
  try {
    const host = window.location.hostname || '';
    if (host.includes('youtube.com')) {
      if (floatingButton) floatingButton.remove();
      return;
    }
  } catch {}
  // Early exit if domain is hidden
  isFloatingButtonHiddenForCurrentDomain((hidden) => {
    if (hidden) {
      if (floatingButton) floatingButton.remove();
      return;
    }
    chrome.storage.sync.get({ enablePageIntegration: true, enableArticleIntegration: true }, function(settings) {
      if (settings.enablePageIntegration === false) {
        if (floatingButton) floatingButton.remove();
        return;
      }
      // If article integration is enabled and there are <article> tags, prefer Article feature button
      if (settings.enableArticleIntegration !== false && hasArticleElements()) {
        if (floatingButton) floatingButton.style.display = 'none';
        return;
      }
      // Determine if there is enough content to warrant showing the button
      const mainRoot = chooseMainRoot(true);
      const cleaned = cloneAndClean(mainRoot, true);
      const len = textLengthOf(cleaned);
      if (len < 200) {
        if (floatingButton) floatingButton.remove();
        return;
      }
      isFloatingButtonHiddenForCurrentDomain((hidden) => {
        if (hidden) {
          if (floatingButton) floatingButton.remove();
          return;
        }
        if (!floatingButton) {
        floatingButton = document.createElement('div');
        floatingButton.id = 'yt-transcript-floating-button';
        floatingButton.innerHTML = `<div class=\"button-emoji\">📝</div>`;
        floatingButton.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          color: #222;
          border: 1px solid #ccc;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          cursor: pointer;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          user-select: none;
          opacity: 1;
        `;
        floatingButton.addEventListener('mouseenter', () => {
          floatingButton.style.background = '#f3f4f6';
        });
        floatingButton.addEventListener('mouseleave', () => {
          floatingButton.style.background = 'rgba(255, 255, 255, 0.95)';
        });
      floatingButton.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        setButtonLoading(floatingButton);
        try {
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({
              pageIncludeImages: true,
              pageIncludeTables: true,
              pageIncludeLinks: true,
              pageOnlyMainSection: true,
              pageSimplifyAggressively: true,
              pageIncludeUrl: true,
              pageIncludeTitle: true,
              downloadInsteadOfCopy: false,
              downloadIfTokensExceed: 0,
            }, resolve);
          });

          let md = await extractPageMarkdown(settings);

          if (settings.pageIncludeUrl || settings.pageIncludeTitle) {
            const pageUrl = window.location.href;
            const pageTitle = document.title || 'Page';
            let header = '';
            if (settings.pageIncludeTitle) header += `# ${pageTitle}\n\n`;
            if (settings.pageIncludeUrl) header += `**URL:** ${pageUrl}\n\n`;
            if (header) md = `${header}---\n\n${md}`;
          }

          chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, function(items) {
            if (items.downloadInsteadOfCopy) {
              downloadMarkdownFile(md, document.title, 'ExtractMD');
              setButtonSuccess(floatingButton);
              showSuccessNotificationWithTokens('Page downloaded as Markdown!', md);
            } else {
              let threshold = parseInt(items.downloadIfTokensExceed, 10);
              if (!isNaN(threshold) && threshold > 0) {
                const tokens = encode(md).length;
                if (tokens >= threshold * 1000) {
                  downloadMarkdownFile(md, document.title, 'ExtractMD');
                  setButtonSuccess(floatingButton);
                  showSuccessNotificationWithTokens('Page downloaded as Markdown! (token threshold)', md);
                  return;
                }
              }
              copyToClipboard(md, true);
              setButtonSuccess(floatingButton);
              showSuccessNotificationWithTokens('Page copied as Markdown!', md);
            }
          });

          // Increment KPI counter only if enabled
          chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
            if (items.enableUsageKpi !== false) {
              const stats = items.usageStats || {};
              stats.pages = (stats.pages || 0) + 1;
              chrome.storage.sync.set({ usageStats: stats });
            }
          });

          // Global navigation and close behavior
          const globalSettings = await getSettings();
          if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
            chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
          }
          if (globalSettings.closeTabAfterExtraction) {
            setTimeout(() => { closeCurrentTab(); }, 500);
          }
          setTimeout(() => {
            setButtonNormal(floatingButton);
            isProcessing = false;
          }, 2000);
        } catch (e) {
          setButtonError(floatingButton);
          showNotification('Failed to copy page.', 'error');
          setTimeout(() => {
            setButtonNormal(floatingButton);
            isProcessing = false;
          }, 3000);
        }
      });
        document.body.appendChild(floatingButton);
        attachHideAffordance(floatingButton);
        console.debug('[ExtractMD] Floating button created and added to DOM (Page)');
        } else {
          floatingButton.style.display = 'flex';
        }
      });
    });
  });
}

function setupPageMutationObserver() {
  if (pageObserver) return;
  const debouncedManage = debounce(manageFloatingButtonForPage, 200);
  pageObserver = new MutationObserver(() => {
    debouncedManage();
  });
  pageObserver.observe(document.body, { childList: true, subtree: true });
}

export function initPageFeatures() {
  chrome.storage.sync.get({ enablePageIntegration: true }, function(items) {
    if (items.enablePageIntegration === false) return;
    isFloatingButtonHiddenForCurrentDomain((hidden) => {
      if (hidden) {
        removeFloatingButton();
        return;
      }
      setupPageMutationObserver();
      manageFloatingButtonForPage();
    });
    onHiddenToggle((hidden) => {
      if (hidden) {
        if (pageObserver) { pageObserver.disconnect(); pageObserver = null; }
        removeFloatingButton();
      } else {
        if (!pageObserver) setupPageMutationObserver();
        manageFloatingButtonForPage();
      }
    });
  });
}