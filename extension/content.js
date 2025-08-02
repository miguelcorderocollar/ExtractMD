// Utility functions have been moved to './content/utils.js' and are now imported below.
import { copyToClipboard, showNotification, htmlToMarkdown, sleep, getSettings } from './content/utils.js';
import { initYouTubeFeatures } from './content/youtube.js';
import { initHackerNewsFeatures } from './content/hackernews.js';
import { initArticleFeatures } from './content/articles.js';

// Check if current domain is excluded
async function isDomainExcluded() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      enableDomainExclusion: false,
      excludedDomains: ''
    }, (settings) => {
      if (!settings.enableDomainExclusion) {
        resolve(false);
        return;
      }
      
      const currentDomain = window.location.hostname;
      const excludedDomains = settings.excludedDomains.split(',').map(d => d.trim()).filter(d => d);
      
      const isExcluded = excludedDomains.some(domain => {
        // Check exact match or subdomain match
        return currentDomain === domain || currentDomain.endsWith('.' + domain);
      });
      
      resolve(isExcluded);
    });
  });
}

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const validPaths = ['/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(window.location.pathname);
}

async function runInitForCurrentPage() {
  // Check if domain is excluded
  const excluded = await isDomainExcluded();
  if (excluded) {
    console.debug('[ExtractMD] Domain excluded, skipping initialization');
    return;
  }

  if (window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch')) {
    console.debug('[ExtractMD] Initializing YouTube features');
    initYouTubeFeatures();
  } else if (window.location.hostname.includes('ycombinator.com') && (window.location.pathname.startsWith('/item') || isHNNewsPage())) {
    console.debug('[ExtractMD] Initializing Hacker News features');
    initHackerNewsFeatures();
  } else {
    console.debug('[ExtractMD] Initializing Article features');
    initArticleFeatures();
  }
}

runInitForCurrentPage();

// Optionally, you can add a MutationObserver for SPA navigation, but only re-run the correct init
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(() => runInitForCurrentPage(), 500);
  }
});
observer.observe(document.body, { childList: true, subtree: true }); 