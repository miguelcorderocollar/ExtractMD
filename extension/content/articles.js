// Generic article extraction logic for ExtractMD extension

import { copyToClipboard, showNotification } from './utils.js';

let isProcessing = false;
let articleObserver = null;

async function extractArticleMarkdown(articleElem, includeImages) {
  function nodeToMarkdown(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const tag = node.tagName.toLowerCase();
    if (tag === 'h1') return `# ${node.textContent.trim()}\n\n`;
    if (tag === 'h2') return `## ${node.textContent.trim()}\n\n`;
    if (tag === 'h3') return `### ${node.textContent.trim()}\n\n`;
    if (tag === 'h4') return `#### ${node.textContent.trim()}\n\n`;
    if (tag === 'h5') return `##### ${node.textContent.trim()}\n\n`;
    if (tag === 'h6') return `###### ${node.textContent.trim()}\n\n`;
    if (tag === 'p') return `${Array.from(node.childNodes).map(nodeToMarkdown).join('')}\n\n`;
    if (tag === 'ul') return `\n${Array.from(node.children).map(li => `- ${nodeToMarkdown(li)}`).join('')}\n`;
    if (tag === 'ol') return `\n${Array.from(node.children).map((li, i) => `${i+1}. ${nodeToMarkdown(li)}`).join('')}\n`;
    if (tag === 'li') return `${Array.from(node.childNodes).map(nodeToMarkdown).join('')}`;
    if (tag === 'strong' || tag === 'b') return `**${node.textContent}**`;
    if (tag === 'em' || tag === 'i') return `*${node.textContent}*`;
    if (tag === 'blockquote') return `> ${node.textContent}\n\n`;
    if (tag === 'code') return '```' + node.textContent + '```';
    if (tag === 'pre') return '```' + node.textContent + '```';
    if (tag === 'img' && includeImages) {
      const alt = node.getAttribute('alt') || '';
      let src = node.getAttribute('src') || '';
      if (src) {
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
    }
    return Array.from(node.childNodes).map(nodeToMarkdown).join('');
  }
  let markdown = '';
  const children = Array.from(articleElem.childNodes);
  children.forEach(child => {
    const md = nodeToMarkdown(child);
    if (md && md.trim()) {
      markdown += md;
    }
  });
  return markdown.trim();
}

function manageFloatingButtonForArticles() {
  const articles = Array.from(document.querySelectorAll('article'));
  let floatingButton = document.getElementById('yt-transcript-floating-button');
  if (articles.length > 0) {
    if (!floatingButton) {
      floatingButton = document.createElement('div');
      floatingButton.id = 'yt-transcript-floating-button';
      floatingButton.innerHTML = `<div class="button-emoji">📝</div>`;
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
        floatingButton.innerHTML = `<div class=\"button-emoji\">⏳</div>`;
        try {
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({ 
              articleExporterIncludeImages: true,
              articleExporterOnlyLongest: false 
            }, resolve);
          });
          const currentArticles = Array.from(document.querySelectorAll('article'));
          let md = '';
          let articlesToProcess = currentArticles;
          let totalArticles = currentArticles.length;
          
          // If only longest article is enabled and there are multiple articles
          if (settings.articleExporterOnlyLongest && currentArticles.length > 1) {
            // Find the longest article by text content length
            const articleLengths = await Promise.all(currentArticles.map(async (article, index) => {
              const articleMd = await extractArticleMarkdown(article, settings.articleExporterIncludeImages);
              return { index, length: articleMd.length, article, markdown: articleMd };
            }));
            
            // Sort by length (descending) and take the longest
            articleLengths.sort((a, b) => b.length - a.length);
            const longestArticle = articleLengths[0];
            articlesToProcess = [longestArticle.article];
            md = longestArticle.markdown;
          } else {
            // Process all articles as before
            if (currentArticles.length === 1) {
              md = await extractArticleMarkdown(currentArticles[0], settings.articleExporterIncludeImages);
            } else {
              const mdArr = await Promise.all(currentArticles.map((a, i) => extractArticleMarkdown(a, settings.articleExporterIncludeImages).then(md => `## Article ${i+1}\n\n${md}`)));
              md = mdArr.join('\n\n---\n\n');
            }
          }
          
          await copyToClipboard(md, true);
          floatingButton.innerHTML = `<div class=\"button-emoji\">✅</div>`;
          
          // Update notification based on settings
          const processedCount = articlesToProcess.length;
          if (settings.articleExporterOnlyLongest && totalArticles > 1) {
            showNotification(`1/${totalArticles} Articles copied as Markdown!`, 'success');
          } else {
            const articleText = processedCount === 1 ? 'Article' : 'Articles';
            showNotification(`${processedCount} ${articleText} copied as Markdown!`, 'success');
          }
          setTimeout(() => {
            floatingButton.innerHTML = `<div class=\\"button-emoji\\">📝</div>`;
            isProcessing = false;
          }, 2000);
        } catch (e) {
          floatingButton.innerHTML = `<div class=\"button-emoji\">❌</div>`;
          showNotification('Failed to copy article(s).', 'error');
          setTimeout(() => {
            floatingButton.innerHTML = `<div class=\\"button-emoji\\">📝</div>`;
            isProcessing = false;
          }, 3000);
        }
      });
      document.body.appendChild(floatingButton);
      console.debug('[ExtractMD] Floating button created and added to DOM (Article)');
    } else {
      floatingButton.style.display = 'flex';
    }
  } else {
    if (floatingButton) {
      floatingButton.remove();
    }
  }
}

function setupArticleMutationObserver() {
  if (articleObserver) return;
  articleObserver = new MutationObserver(() => {
    manageFloatingButtonForArticles();
  });
  articleObserver.observe(document.body, { childList: true, subtree: true });
}

export function initArticleFeatures() {
  console.debug('[ExtractMD] initArticleFeatures called');
  setupArticleMutationObserver();
  manageFloatingButtonForArticles();
} 