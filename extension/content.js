// Utility functions have been moved to './content/utils.js' and are now imported below.
import { copyToClipboard, showNotification, htmlToMarkdown, sleep, getSettings } from './content/utils.js';
import { initYouTubeFeatures } from './content/youtube.js';
import { initHackerNewsFeatures } from './content/hackernews.js';
import { initArticleFeatures } from './content/articles.js';
import { extractYouTubeMarkdown } from './content/youtube.js';

// --- Unified Preview Markdown Handler ---
import { encode } from 'gpt-tokenizer';
import { extractHNCommentsMarkdown, extractHNNewsMarkdown } from './content/hackernews.js';
import { extractArticleMarkdown } from './content/articles.js';

function isYouTubePage() {
  return window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch');
}
function isHNItemPage() {
  return window.location.hostname.includes('ycombinator.com') && window.location.pathname.startsWith('/item');
}
function isHNNewsPageUnified() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const path = window.location.pathname;
  const validPaths = ['', '/', '/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(path);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'extractmd_get_markdown_preview') {
    console.log('[ExtractMD][Unified] Received preview request from popup');
    (async () => {
      try {
        if (isYouTubePage()) {
          // --- YouTube ---
          const settings = await getSettings();
          const transcriptText = await extractYouTubeMarkdown(settings);
          console.log('[ExtractMD][Unified] Sending YouTube transcript preview to popup');
          sendResponse({ markdown: transcriptText });
        } else if (isHNItemPage()) {
          // --- HN Item ---
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({
              hnIncludeAuthor: true,
              hnIncludeTime: true,
              hnIncludeReplies: true,
              hnIncludeUrl: true,
              hnIncludeItemText: true
            }, resolve);
          });
          const md = extractHNCommentsMarkdown(settings);
          console.log('[ExtractMD][Unified] Sending HN item preview to popup');
          sendResponse({ markdown: md });
        } else if (isHNNewsPageUnified()) {
          // --- HN News ---
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({
              hnNewsIncludeTitle: true,
              hnNewsIncludeUrl: true,
              hnNewsIncludeSite: true,
              hnNewsIncludePoints: true,
              hnNewsIncludeAuthor: true,
              hnNewsIncludeTime: true,
              hnNewsIncludeComments: true
            }, resolve);
          });
          const md = extractHNNewsMarkdown(settings);
          console.log('[ExtractMD][Unified] Sending HN news preview to popup');
          sendResponse({ markdown: md });
        } else {
          // --- Articles ---
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({ 
              articleExporterIncludeImages: true,
              articleExporterOnlyLongest: false,
              articleExporterShowInfo: true,
              articleExporterIncludeUrl: true
            }, resolve);
          });
          const currentArticles = Array.from(document.querySelectorAll('article'));
          let md = '';
          if (currentArticles.length === 0) {
            console.log('[ExtractMD][Unified] No articles found for preview');
            sendResponse({ markdown: 'No articles found on this page.' });
            return;
          }
          if (settings.articleExporterOnlyLongest && currentArticles.length > 1) {
            // Find the longest article by text content length
            const articleLengths = await Promise.all(currentArticles.map(async (article, index) => {
              const articleMd = await extractArticleMarkdown(article, settings.articleExporterIncludeImages);
              return { index, length: articleMd.length, article, markdown: articleMd };
            }));
            // Sort by length (descending) and take the longest
            articleLengths.sort((a, b) => b.length - a.length);
            const longestArticle = articleLengths[0];
            md = longestArticle.markdown;
            // Add URL if setting is enabled
            if (settings.articleExporterIncludeUrl) {
              const pageUrl = window.location.href;
              const pageTitle = document.title || 'Article';
              md = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${md}`;
            }
          } else {
            // Process all articles as before
            if (currentArticles.length === 1) {
              md = await extractArticleMarkdown(currentArticles[0], settings.articleExporterIncludeImages);
            } else {
              const mdArr = await Promise.all(currentArticles.map((a, i) => extractArticleMarkdown(a, settings.articleExporterIncludeImages).then(md => `## Article ${i+1}\n\n${md}`)));
              md = mdArr.join('\n\n---\n\n');
            }
            // Add URL if setting is enabled
            if (settings.articleExporterIncludeUrl) {
              const pageUrl = window.location.href;
              const pageTitle = document.title || 'Article';
              md = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${md}`;
            }
          }
          console.log('[ExtractMD][Unified] Sending article preview to popup');
          sendResponse({ markdown: md });
        }
      } catch (e) {
        console.error('[ExtractMD][Unified] Error extracting preview:', e);
        sendResponse({ markdown: 'Unable to extract content for preview.' });
      }
    })();
    return true; // Indicates async response
  }
});

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const validPaths = ['/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(window.location.pathname);
}

function runInitForCurrentPage() {
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
    setTimeout(runInitForCurrentPage, 500);
  }
});
observer.observe(document.body, { childList: true, subtree: true }); 