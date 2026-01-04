// Utility functions have been moved to './content/utils.js' and are now imported below.
import {
  copyToClipboard,
  showNotification,
  htmlToMarkdown,
  sleep,
  getSettings,
} from './content/utils.js';
import { saveSetting } from './shared/storage.js';
import { initYouTubeFeatures, copyYouTubeTranscript } from './content/youtube.js';
import { initHackerNewsFeatures, performHNCopy } from './content/hackernews.js';
import { initArticleFeatures, performArticleCopy } from './content/articles.js';
import { initUniversalFeatures, performUniversalCopy } from './content/universal.js';

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const validPaths = ['', '/', '/news', '/newest', '/front', '/best', '/ask', '/show', '/jobs'];
  return validPaths.includes(window.location.pathname);
}

async function runInitForCurrentPage() {
  const settings = await getSettings();
  const ignoredDomains = (settings.ignoredDomains || '')
    .split('\n')
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  if (ignoredDomains.includes(window.location.hostname)) {
    console.debug(
      `[ExtractMD] Domain ${window.location.hostname} is ignored, skipping initialization`
    );
    // Set global flag so feature modules know to not create buttons
    window.__extractmd_domain_ignored = true;
    // Clear any existing copy function if it was set before (e.g. during SPA navigation)
    window.copyExtractMD = null;
    // Remove any existing floating button
    const existingButton = document.getElementById('extractmd-floating-button');
    if (existingButton) {
      existingButton.remove();
    }
    return;
  }

  // Clear the ignored flag
  window.__extractmd_domain_ignored = false;

  const isYouTubeDomain = window.location.hostname.includes('youtube.com');
  const isHNDomain = window.location.hostname.includes('ycombinator.com');

  if (isYouTubeDomain && window.location.pathname.includes('/watch')) {
    console.debug('[ExtractMD] Initializing YouTube features');
    window.copyExtractMD = copyYouTubeTranscript;
    initYouTubeFeatures();
  } else if (isHNDomain && (window.location.pathname.startsWith('/item') || isHNNewsPage())) {
    console.debug('[ExtractMD] Initializing Hacker News features');
    window.copyExtractMD = () => performHNCopy(false);
    initHackerNewsFeatures();
  } else if (isYouTubeDomain || isHNDomain) {
    // On YouTube/HN but not a supported page - do nothing, don't fall back to universal
    console.debug('[ExtractMD] On YouTube/HN domain but not a supported page, skipping extraction');
    window.copyExtractMD = null;
    const existingButton = document.getElementById('extractmd-floating-button');
    if (existingButton) {
      existingButton.remove();
    }
  } else {
    // Check for articles with substantial content
    const articles = document.querySelectorAll('article');
    const hasArticles =
      articles.length > 0 && Array.from(articles).some((a) => (a.textContent?.length || 0) > 500);

    if (hasArticles && settings.enableArticleIntegration !== false) {
      console.debug('[ExtractMD] Initializing Article features');
      window.copyExtractMD = () => performArticleCopy(false);
      initArticleFeatures();
    } else if (settings.enableUniversalIntegration !== false) {
      // Universal fallback
      console.debug('[ExtractMD] Initializing Universal features');
      window.copyExtractMD = () => performUniversalCopy(false);
      initUniversalFeatures();
    } else {
      console.debug('[ExtractMD] No extraction module available for this page');
      window.copyExtractMD = null;
    }
  }
}

runInitForCurrentPage();

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractMD') {
    const forceDownload = message.forceDownload === true;

    // Set the force download flag before calling extract
    if (forceDownload) {
      window.__extractmd_force_download = true;
    }

    if (window.copyExtractMD) {
      window.copyExtractMD();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No extraction function available' });
    }

    // Clear the flag after a short delay
    if (forceDownload) {
      setTimeout(() => {
        window.__extractmd_force_download = false;
      }, 100);
    }
  } else if (message.action === 'checkExtractAvailable') {
    // Check if extraction is available on this page
    const isAvailable = typeof window.copyExtractMD === 'function';
    sendResponse({ available: isAvailable });
  } else if (message.action === 'reinitialize') {
    // Re-run initialization (called when ignore status changes from popup)
    console.debug('[ExtractMD] Reinitializing due to settings change');
    // Small delay to ensure storage is updated before we check it
    setTimeout(() => {
      runInitForCurrentPage();
    }, 100);
    sendResponse({ success: true });
  }
  return true; // Keep message channel open for async response
});

/**
 * Toggle ExtractMD button for current domain (hide/show)
 * Equivalent to clicking the X on floating button or disable/enable on popup
 */
async function toggleExtractMDForDomain() {
  const domain = window.location.hostname;
  if (!domain) return;

  return new Promise((resolve) => {
    chrome.storage.sync.get({ ignoredDomains: '' }, (items) => {
      let domains = items.ignoredDomains
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      const isCurrentlyIgnored = domains.includes(domain);

      if (isCurrentlyIgnored) {
        // Remove from ignored list (enable ExtractMD)
        domains = domains.filter((d) => d !== domain);
        const newValue = domains.join('\n');
        saveSetting('ignoredDomains', newValue);

        // Clear the ignored flag
        window.__extractmd_domain_ignored = false;

        // Reinitialize ExtractMD for this page
        setTimeout(() => {
          runInitForCurrentPage();
        }, 100);

        // Show notification
        showNotification(`ExtractMD enabled for ${domain}`, 'success');

        console.debug(`[ExtractMD] Domain ${domain} removed from ignore list`);
        resolve();
      } else {
        // Add to ignored list (disable ExtractMD)
        domains.push(domain);
        const newValue = domains.join('\n');
        saveSetting('ignoredDomains', newValue);

        // Set global flag to prevent mutation observers from recreating the button
        window.__extractmd_domain_ignored = true;

        // Clear the copy function
        window.copyExtractMD = null;

        // Remove the floating button if it exists
        const existingButton = document.getElementById('extractmd-floating-button');
        if (existingButton && existingButton.parentNode) {
          existingButton.parentNode.removeChild(existingButton);
        }

        // Show notification
        showNotification(`ExtractMD disabled for ${domain}`, 'info');

        console.debug(`[ExtractMD] Domain ${domain} added to ignore list`);
        resolve();
      }
    });
  });
}

// Keep the old name for backward compatibility with background.js
window.hideExtractMDForDomain = toggleExtractMDForDomain;

// Make it available globally for background script
window.hideExtractMDForDomain = hideExtractMDForDomain;

// Listen for keyboard shortcut Ctrl+Shift+E (copy) and Ctrl+Shift+H (toggle hide/show)
document.addEventListener('keydown', (e) => {
  // Check for Ctrl+Shift (or Cmd+Shift on Mac)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;

  if (modifier && e.shiftKey && e.code === 'KeyE') {
    if (window.copyExtractMD) {
      console.debug('[ExtractMD] Shortcut triggered: Ctrl+Shift+E (copy)');
      // We don't always want to preventDefault because it might interfere with other things,
      // but for this specific shortcut it's usually what's intended.
      // e.preventDefault();
      window.copyExtractMD();
    }
  } else if (modifier && e.shiftKey && e.code === 'KeyH') {
    console.debug('[ExtractMD] Shortcut triggered: Ctrl+Shift+H (toggle hide/show)');
    e.preventDefault();
    toggleExtractMDForDomain();
  }
});

// Optionally, you can add a MutationObserver for SPA navigation, but only re-run the correct init
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(runInitForCurrentPage, 500);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
