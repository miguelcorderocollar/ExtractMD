// X (Twitter) specific extraction - thin orchestrator
// Extraction logic lives in x/ submodules

import { showNotification } from './utils.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { handleCopyOrDownload } from './handlers/copyHandler.js';
import { isXPostPage, isXArticlePage } from './x/detection.js';
import { findPrimaryXContainer, waitForPrimaryXContainer } from './x/container.js';
import { extractXMarkdown, X_SETTINGS_DEFAULTS } from './x/extractors.js';

export { isXPostPage, isXArticlePage, findPrimaryXContainer, waitForPrimaryXContainer };
export { extractXMarkdown };

let isProcessing = false;
let xObserver = null;
let floatingButtonController = null;

export async function performXCopy(updateButton = false) {
  if (isProcessing) return;
  isProcessing = true;

  if (updateButton && floatingButtonController) {
    floatingButtonController.setLoading();
  }

  try {
    const settings = await new Promise((resolve) => {
      chrome.storage.sync.get(X_SETTINGS_DEFAULTS, resolve);
    });

    const readyContainer = await waitForPrimaryXContainer({ timeoutMs: 7000 });
    if (!readyContainer) {
      throw new Error('X content is still loading. Please try again in a moment.');
    }

    const result = extractXMarkdown(settings);

    await handleCopyOrDownload(result.markdown, {
      title: result.title || document.title || 'X Content',
      kpiType: 'x_posts',
      successMessage: 'X content copied as Markdown!',
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
    console.error('[ExtractMD] X extraction failed:', error);
    const message =
      error instanceof Error && error.message ? error.message : 'Failed to extract X content.';
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

async function manageFloatingButtonForX() {
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

  const supportedPage = isXPostPage() || isXArticlePage();
  const hasContainer = Boolean(findPrimaryXContainer(document));

  if (!supportedPage || !hasContainer) {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    } else {
      const existingDomButton = document.getElementById('extractmd-floating-button');
      if (existingDomButton) existingDomButton.remove();
    }
    return;
  }

  if (document.getElementById('extractmd-floating-button')) {
    if (floatingButtonController) {
      floatingButtonController.show();
    }
    return;
  }

  // Clean up stale controller if DOM button was removed externally
  if (floatingButtonController) {
    floatingButtonController.remove();
    floatingButtonController = null;
  }

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
      await performXCopy(true);
    },
  });

  if (floatingButtonController) {
    floatingButtonController.appendTo(document.body);
    console.debug('[ExtractMD] Floating button created and added to DOM (X)');
  }
}

function setupXMutationObserver() {
  if (xObserver) return;

  let debounceTimer = null;
  xObserver = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      manageFloatingButtonForX();
    }, 400);
  });

  xObserver.observe(document.body, { childList: true, subtree: true });
}

export function initXFeatures() {
  chrome.storage.sync.get({ enableXIntegration: true }, function (items) {
    if (items.enableXIntegration === false) return;
    setupXMutationObserver();
    manageFloatingButtonForX();
  });
}
