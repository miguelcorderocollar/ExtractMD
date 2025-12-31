// Utility functions have been moved to './content/utils.js' and are now imported below.
import { copyToClipboard, showNotification, htmlToMarkdown, sleep, getSettings } from './content/utils.js';
import { initYouTubeFeatures, copyYouTubeTranscript } from './content/youtube.js';
import { initHackerNewsFeatures, performHNCopy } from './content/hackernews.js';
import { initArticleFeatures, performArticleCopy } from './content/articles.js';

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const validPaths = ['', '/', '/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(window.location.pathname);
}

function runInitForCurrentPage() {
  if (window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch')) {
    console.debug('[ExtractMD] Initializing YouTube features');
    window.copyExtractMD = copyYouTubeTranscript;
    initYouTubeFeatures();
  } else if (window.location.hostname.includes('ycombinator.com') && (window.location.pathname.startsWith('/item') || isHNNewsPage())) {
    console.debug('[ExtractMD] Initializing Hacker News features');
    window.copyExtractMD = () => performHNCopy(false);
    initHackerNewsFeatures();
  } else {
    console.debug('[ExtractMD] Initializing Article features');
    window.copyExtractMD = () => performArticleCopy(false);
    initArticleFeatures();
  }
}

runInitForCurrentPage();

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