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
import { encode } from 'gpt-tokenizer';

let isProcessing = false;
let universalObserver = null;
let floatingButtonController = null;

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

    // Find the content element
    const contentElement = findMainContent(
      settings.universalContentMode,
      settings.universalCustomSelector
    );

    if (!contentElement || !contentElement.textContent?.trim()) {
      throw new Error('No content found on this page');
    }

    // Create Turndown service
    const turndown = createTurndownService(settings);

    // Convert to Markdown using innerHTML (Turndown handles HTML string better)
    let md = turndown.turndown(contentElement.innerHTML);

    // Clean up excessive whitespace
    md = md.replace(/\n{3,}/g, '\n\n').trim();

    // If we got very little content, the page might use complex structures
    // Fallback to just extracting text content
    if (md.length < 100 && contentElement.textContent.trim().length > 100) {
      md = contentElement.textContent
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n');
    }

    // Add URL header if setting is enabled
    if (settings.universalIncludeUrl) {
      const pageUrl = window.location.href;
      const pageTitle = document.title || 'Page';
      md = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${md}`;
    }

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

  const existingButton = document.getElementById('extractmd-floating-button');

  // Check if there's meaningful content on the page
  const contentElement = findMainContent('auto', '');
  const hasContent = contentElement && contentElement.textContent?.trim().length > 100;

  if (hasContent) {
    if (!existingButton) {
      // Load floating button settings
      const buttonSettings = await new Promise((resolve) => {
        chrome.storage.sync.get(
          {
            floatingButtonEnableDrag: true,
            floatingButtonEnableDismiss: true,
          },
          resolve
        );
      });

      floatingButtonController = await createFloatingButton({
        domain: window.location.hostname,
        enableDrag: buttonSettings.floatingButtonEnableDrag,
        enableDismiss: buttonSettings.floatingButtonEnableDismiss,
        onClick: async () => {
          await performUniversalCopy(true);
        },
      });

      if (floatingButtonController) {
        floatingButtonController.appendTo(document.body);
        console.debug('[ExtractMD] Floating button created and added to DOM (Universal)');
        showContentInfoNotification(contentElement);
      }
    } else if (floatingButtonController) {
      floatingButtonController.show();
    }
  } else {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    }
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
  });
}
