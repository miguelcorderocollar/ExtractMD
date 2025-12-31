// Utility functions have been moved to './content/utils.js' and are now imported below.
import { copyToClipboard, showNotification, htmlToMarkdown, sleep, getSettings } from './content/utils.js';
import { initYouTubeFeatures, copyYouTubeTranscript } from './content/youtube.js';
import { initHackerNewsFeatures, performHNCopy } from './content/hackernews.js';
import { initArticleFeatures, performArticleCopy } from './content/articles.js';
import { initUniversalFeatures, performUniversalCopy } from './content/universal.js';

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const validPaths = ['', '/', '/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(window.location.pathname);
}

async function runInitForCurrentPage() {
  const settings = await getSettings();
  const ignoredDomains = (settings.ignoredDomains || '').split('\n').map(d => d.trim()).filter(d => d.length > 0);
  
  if (ignoredDomains.includes(window.location.hostname)) {
    console.debug(`[ExtractMD] Domain ${window.location.hostname} is ignored, skipping initialization`);
    // Clear any existing copy function if it was set before (e.g. during SPA navigation)
    window.copyExtractMD = null;
    // Remove any existing floating button
    const existingButton = document.getElementById('extractmd-floating-button');
    if (existingButton) {
      existingButton.remove();
    }
    return;
  }

  if (window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch')) {
    console.debug('[ExtractMD] Initializing YouTube features');
    window.copyExtractMD = copyYouTubeTranscript;
    initYouTubeFeatures();
  } else if (window.location.hostname.includes('ycombinator.com') && (window.location.pathname.startsWith('/item') || isHNNewsPage())) {
    console.debug('[ExtractMD] Initializing Hacker News features');
    window.copyExtractMD = () => performHNCopy(false);
    initHackerNewsFeatures();
  } else {
    // Check for articles with substantial content
    const articles = document.querySelectorAll('article');
    const hasArticles = articles.length > 0 && Array.from(articles).some(a => (a.textContent?.length || 0) > 500);
    
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
  }
  return true; // Keep message channel open for async response
});

// Listen for keyboard shortcut Ctrl+Shift+C
document.addEventListener('keydown', (e) => {
  // Check for Ctrl+Shift+C (or Cmd+Shift+C on Mac)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? e.metaKey : e.ctrlKey;
  
  if (modifier && e.shiftKey && e.code === 'KeyE') {
    if (window.copyExtractMD) {
      console.debug('[ExtractMD] Shortcut triggered: Ctrl+Shift+C');
      // We don't always want to preventDefault because it might interfere with other things,
      // but for this specific shortcut it's usually what's intended.
      // e.preventDefault(); 
      window.copyExtractMD();
    }
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