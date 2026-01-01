// Hacker News-specific logic for ExtractMD extension
import { copyToClipboard, showNotification, htmlToMarkdown, getSettings, closeCurrentTab, downloadMarkdownFile, showSuccessNotificationWithTokens } from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { encode } from 'gpt-tokenizer';

let isProcessing = false;
let floatingButtonController = null;

// Shared copy logic
export async function performHNCopy(updateButton = false) {
  if (isProcessing) return;
  isProcessing = true;
  if (updateButton && floatingButtonController) floatingButtonController.setLoading();
  
  try {
    let md = '';
    if (isHNItemPage()) {
      const settings = await new Promise(resolve => {
        chrome.storage.sync.get({
          hnIncludeAuthor: true,
          hnIncludeTime: true,
          hnIncludeReplies: true,
          hnIncludeUrl: true,
          hnIncludeItemText: true
        }, resolve);
      });
      md = extractHNCommentsMarkdown(settings);
      chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, function(items) {
        if (items.downloadInsteadOfCopy) {
          downloadMarkdownFile(md, document.title, 'ExtractMD');
          if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
          showSuccessNotificationWithTokens('HN comments downloaded as .md!', md);
        } else {
          // Check token threshold
          let threshold = parseInt(items.downloadIfTokensExceed, 10);
          if (!isNaN(threshold) && threshold > 0) {
            const tokens = encode(md).length;
            if (tokens >= threshold * 1000) {
              downloadMarkdownFile(md, document.title, 'ExtractMD');
              if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
              showSuccessNotificationWithTokens('HN comments downloaded as .md (token threshold)!', md);
              return;
            }
          }
          copyToClipboard(md, true);
          if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
          showSuccessNotificationWithTokens('HN comments copied to clipboard!', md);
        }
      });
      // Increment KPI counter for HN Comments
      incrementKpi('hn_comments');
      // Check global jumpToDomain setting
      const globalSettings = await getSettings();
      if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
        chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
      }
      // Close tab after extraction if setting is enabled
      if (globalSettings.closeTabAfterExtraction) {
        setTimeout(() => {
          closeCurrentTab();
        }, 500);
      }
    } else if (isHNNewsPage()) {
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
      md = extractHNNewsMarkdown(settings);
      chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, function(items) {
        if (items.downloadInsteadOfCopy) {
          downloadMarkdownFile(md, document.title, 'ExtractMD');
          if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
          showSuccessNotificationWithTokens('HN news downloaded as .md!', md);
        } else {
          // Check token threshold
          let threshold = parseInt(items.downloadIfTokensExceed, 10);
          if (!isNaN(threshold) && threshold > 0) {
            const tokens = encode(md).length;
            if (tokens >= threshold * 1000) {
              downloadMarkdownFile(md, document.title, 'ExtractMD');
              if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
              showSuccessNotificationWithTokens('HN news downloaded as .md (token threshold)!', md);
              return;
            }
          }
          copyToClipboard(md, true);
          if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
          showSuccessNotificationWithTokens('HN news copied to clipboard!', md);
        }
      });
      // Increment KPI counter for HN News
      incrementKpi('hn_news');
      // Check global jumpToDomain setting
      const globalSettings = await getSettings();
      if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
        chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
      }
      // Close tab after extraction if setting is enabled
      if (globalSettings.closeTabAfterExtraction) {
        setTimeout(() => {
          closeCurrentTab();
        }, 500);
      }
    } else {
      if (updateButton && floatingButtonController) floatingButtonController.setError();
      showNotification('Not a supported HN page.', 'error');
    }
    if (updateButton && floatingButtonController) {
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 2000);
    } else {
      isProcessing = false;
    }
  } catch (error) {
    if (updateButton && floatingButtonController) {
      floatingButtonController.setError();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 3000);
    } else {
      isProcessing = false;
    }
    showNotification('Failed to copy HN content.', 'error');
  }
}

function isHNItemPage() {
  return window.location.hostname.includes('ycombinator.com') && window.location.pathname.startsWith('/item');
}

function isHNNewsPage() {
  if (!window.location.hostname.includes('ycombinator.com')) return false;
  const path = window.location.pathname;
  const validPaths = ['', '/', '/news','/newest','/front','/best','/ask','/show','/jobs'];
  return validPaths.includes(path);
}

function extractHNCommentsMarkdown(settings) {
  // Only run on HN item pages
  if (!window.location.hostname.includes('ycombinator.com') || !window.location.pathname.startsWith('/item')) {
    throw new Error('Not on a Hacker News item page.');
  }
  // Parse all comment rows
  const rows = Array.from(document.querySelectorAll('tr.athing.comtr'));
  // Build a tree of comments
  const comments = [];
  const stack = [];
  rows.forEach(row => {
    const indentImg = row.querySelector('td.ind img');
    const indent = indentImg ? parseInt(indentImg.getAttribute('width') || '0', 10) / 40 : 0;
    const author = row.querySelector('.hnuser')?.textContent || '';
    const time = row.querySelector('.age a')?.textContent || '';
    const commentHtml = row.querySelector('.commtext')?.innerHTML || '';
    const commentText = htmlToMarkdown(commentHtml);
    const id = row.id;
    const comment = { id, author, time, commentText, indent, children: [] };
    // Place in tree
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    if (stack.length) {
      stack[stack.length - 1].children.push(comment);
    } else {
      comments.push(comment);
    }
    stack.push(comment);
  });
  // Build Markdown
  function renderComment(c, depth) {
    let md = '';
    if (settings.hnIncludeAuthor) md += `**${c.author}**`;
    if (settings.hnIncludeTime) md += (md ? ' · ' : '') + `_${c.time}_`;
    if (md) md += '\n';
    md += c.commentText + '\n';
    if (settings.hnIncludeReplies && c.children.length) {
      md += c.children.map(child => renderComment(child, depth + 1)).join('');
    }
    return md.split('\n').map(line => (depth > 0 ? '>'.repeat(depth) + ' ' + line : line)).join('\n') + '\n';
  }
  let itemTextMd = '';
  if (settings.hnIncludeItemText) {
    // Find the item text in the fatitem table
    const fatitem = document.querySelector('table.fatitem');
    if (fatitem) {
      const toptext = fatitem.querySelector('.toptext');
      if (toptext) {
        itemTextMd = htmlToMarkdown(toptext.innerHTML).trim();
      }
    }
  }
  let result = comments.map(c => renderComment(c, 0)).join('\n');
  // Add title, URL, and item text if enabled
  const title = document.querySelector('title')?.textContent || '';
  let header = `# ${title}\n\n`;
  if (settings.hnIncludeUrl) {
    const url = window.location.href;
    header += `**URL:** ${url}\n\n`;
  }
  if (itemTextMd) {
    header += `## Post Content\n\n${itemTextMd}\n\n`;
  }
  header += '## Comments\n\n';
  result = header + result;
  return result.trim();
}

function extractHNNewsMarkdown(settings) {
  // Only run on HN main/news pages
  if (!window.location.hostname.includes('ycombinator.com')) throw new Error('Not on HN');
  const path = window.location.pathname;
  const validPaths = ['', '/', '/news','/newest','/front','/best','/ask','/show','/jobs'];
  if (!validPaths.includes(path)) throw new Error('Not on HN news page');
  // Find all news items
  const tbodies = Array.from(document.querySelectorAll('tbody'));
  let newsRows = [];
  tbodies.forEach(tbody => {
    const rows = Array.from(tbody.querySelectorAll('tr.athing.submission'));
    if (rows.length) newsRows = newsRows.concat(rows);
  });
  // If not found, fallback to tr.athing
  if (newsRows.length === 0) {
    newsRows = Array.from(document.querySelectorAll('tr.athing'));
  }
  let md = '';
  newsRows.forEach(row => {
    let line = '';
    // Title
    if (settings.hnNewsIncludeTitle) {
      const title = row.querySelector('.titleline a')?.textContent?.trim() || '';
      line += `### ${title}\n`;
    }
    // URL
    if (settings.hnNewsIncludeUrl) {
      const url = row.querySelector('.titleline a')?.href || '';
      if (url) line += `[Link](${url})\n`;
    }
    // Site
    if (settings.hnNewsIncludeSite) {
      const site = row.querySelector('.sitestr')?.textContent?.trim() || '';
      if (site) line += `*Site:* ${site}\n`;
    }
    // Points, Author, Time, Comments
    const subtextRow = row.nextElementSibling;
    if (subtextRow && subtextRow.querySelector('.subtext')) {
      const subtext = subtextRow.querySelector('.subtext');
      // Points
      if (settings.hnNewsIncludePoints) {
        const points = subtext.querySelector('.score')?.textContent?.trim() || '';
        if (points) line += `*Points:* ${points}\n`;
      }
      // Author
      if (settings.hnNewsIncludeAuthor) {
        const author = subtext.querySelector('.hnuser')?.textContent?.trim() || '';
        if (author) line += `*By:* ${author}\n`;
      }
      // Time
      if (settings.hnNewsIncludeTime) {
        const time = subtext.querySelector('.age a')?.textContent?.trim() || '';
        if (time) line += `*Time:* ${time}\n`;
      }
      // Comments
      if (settings.hnNewsIncludeComments) {
        const comments = Array.from(subtext.querySelectorAll('a')).find(a => a.textContent.includes('comment'))?.textContent?.trim() || '';
        if (comments) line += `*Comments:* ${comments}\n`;
      }
    }
    md += line + '\n';
  });
  return md.trim();
}

export function initHackerNewsFeatures() {
  console.debug('[ExtractMD] initHackerNewsFeatures called');
  chrome.storage.sync.get({ 
    enableHackerNewsIntegration: true,
    floatingButtonEnableDrag: true,
    floatingButtonEnableDismiss: true
  }, async function(items) {
    if (items.enableHackerNewsIntegration === false) return;
    if (!(isHNItemPage() || isHNNewsPage())) return;
    if (document.getElementById('extractmd-floating-button')) {
      console.debug('[ExtractMD] Floating button already exists (HN)');
      return;
    }
    
    floatingButtonController = await createFloatingButton({
      variant: 'dark',
      emoji: '📝',
      domain: window.location.hostname,
      enableDrag: items.floatingButtonEnableDrag,
      enableDismiss: items.floatingButtonEnableDismiss,
      onClick: async () => {
        await performHNCopy(true);
      }
    });
    
    if (floatingButtonController) {
      floatingButtonController.appendTo(document.body);
      console.debug('[ExtractMD] Floating button created and added to DOM (HN)');
    }
  });
} 