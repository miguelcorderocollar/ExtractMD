// Hacker News-specific logic for ExtractMD extension
import { copyToClipboard, showNotification, htmlToMarkdown, getSettings } from './utils.js';

let isProcessing = false;
let floatingButton = null;

function setButtonLoading() {
  if (!floatingButton) return;
  floatingButton.innerHTML = `<div class="button-emoji">⏳</div>`;
  floatingButton.style.background = 'rgba(255, 193, 7, 0.8)';
  floatingButton.style.border = '1px solid rgba(255, 193, 7, 0.3)';
  floatingButton.style.cursor = 'not-allowed';
  floatingButton.style.fontSize = '20px';
  floatingButton.style.opacity = '1';
}
function setButtonSuccess() {
  if (!floatingButton) return;
  floatingButton.innerHTML = `<div class="button-emoji">✅</div>`;
  floatingButton.style.background = 'rgba(76, 175, 80, 0.8)';
  floatingButton.style.border = '1px solid rgba(76, 175, 80, 0.3)';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '1';
}
function setButtonError() {
  if (!floatingButton) return;
  floatingButton.innerHTML = `<div class="button-emoji">❌</div>`;
  floatingButton.style.background = 'rgba(244, 67, 54, 0.8)';
  floatingButton.style.border = '1px solid rgba(244, 67, 54, 0.3)';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '1';
}
function setButtonNormal() {
  if (!floatingButton) return;
  floatingButton.innerHTML = `<div class="button-emoji">📝</div>`;
  floatingButton.style.background = 'rgba(255, 255, 255, 0.15)';
  floatingButton.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  floatingButton.style.cursor = 'pointer';
  floatingButton.style.fontSize = '24px';
  floatingButton.style.opacity = '0.7';
}

function handleHNFloatingButtonClick() {
  return async function() {
    try {
      isProcessing = true;
      setButtonLoading();
      let md = '';
      if (isHNItemPage()) {
        const settings = await new Promise(resolve => {
          chrome.storage.sync.get({
            hnIncludeAuthor: true,
            hnIncludeTime: true,
            hnIncludeReplies: true
          }, resolve);
        });
        md = extractHNCommentsMarkdown(settings);
        await copyToClipboard(md, true);
        // Increment KPI counter for HN Comments only if enabled
        chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
          if (items.enableUsageKpi !== false) {
            const stats = items.usageStats || {};
            stats.hn_comments = (stats.hn_comments || 0) + 1;
            chrome.storage.sync.set({ usageStats: stats });
          }
        });
        setButtonSuccess();
        showNotification('HN comments copied to clipboard!', 'success');
        // Check global jumpToDomain setting
        const globalSettings = await getSettings();
        if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
          chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
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
        await copyToClipboard(md, true);
        // Increment KPI counter for HN News only if enabled
        chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
          if (items.enableUsageKpi !== false) {
            const stats = items.usageStats || {};
            stats.hn_news = (stats.hn_news || 0) + 1;
            chrome.storage.sync.set({ usageStats: stats });
          }
        });
        setButtonSuccess();
        showNotification('HN news copied to clipboard!', 'success');
        // Check global jumpToDomain setting
        const globalSettings = await getSettings();
        if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
          chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
        }
      } else {
        setButtonError();
        showNotification('Not a supported HN page.', 'error');
      }
      setTimeout(() => {
        setButtonNormal();
        isProcessing = false;
      }, 2000);
    } catch (error) {
      setButtonError();
      showNotification('Failed to copy HN content.', 'error');
      setTimeout(() => {
        setButtonNormal();
        isProcessing = false;
      }, 3000);
    }
  };
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
  let result = comments.map(c => renderComment(c, 0)).join('\n');
  // Add title and URL
  const title = document.querySelector('title')?.textContent || '';
  const url = window.location.href;
  result = `# ${title}\n\n**URL:** ${url}\n\n` + result;
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
  if (!(isHNItemPage() || isHNNewsPage())) return;
  if (document.getElementById('yt-transcript-floating-button')) {
    console.debug('[ExtractMD] Floating button already exists (HN)');
    return;
  }
  floatingButton = document.createElement('div');
  floatingButton.id = 'yt-transcript-floating-button';
  floatingButton.innerHTML = `<div class="button-emoji">📝</div>`;
  floatingButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
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
    opacity: 0.7;
  `;
  floatingButton.addEventListener('mouseenter', () => {
    if (!isProcessing) {
      floatingButton.style.transform = 'translateY(-2px) scale(1.1)';
      floatingButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      floatingButton.style.opacity = '1';
      floatingButton.style.background = 'rgba(255, 255, 255, 0.25)';
    }
  });
  floatingButton.addEventListener('mouseleave', () => {
    if (!isProcessing) {
      floatingButton.style.transform = 'translateY(0) scale(1)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      floatingButton.style.opacity = '0.7';
      floatingButton.style.background = 'rgba(255, 255, 255, 0.15)';
    }
  });
  floatingButton.addEventListener('click', handleHNFloatingButtonClick());
  document.body.appendChild(floatingButton);
  setButtonNormal();
  console.debug('[ExtractMD] Floating button created and added to DOM (HN)');
} 