// Generic article extraction logic for ExtractMD extension

import { copyToClipboard, showNotification, getSettings, closeCurrentTab, setButtonLoading, setButtonSuccess, setButtonError, setButtonNormal, downloadMarkdownFile } from './utils.js';

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

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return charsToReplace[tag] || tag;
  });
}

async function showArticleInfoNotification(articles, highlightLongest = false) {
  const articleCount = articles.length;
  const articleText = articleCount === 1 ? 'Article' : 'Articles';

  // Try to get main headings from articles
  const headings = [];
  let longestIdx = -1;
  if (highlightLongest && articleCount > 1) {
    // Find the longest article by markdown length
    const lengths = await Promise.all(articles.map(async (article) => {
      const md = await extractArticleMarkdown(article, true);
      return md.length;
    }));
    longestIdx = lengths.indexOf(Math.max(...lengths));
  }
  articles.forEach((article, index) => {
    // Look for h1, h2, h3 tags within the article
    let heading = article.querySelector('h1, h2, h3')?.textContent?.trim();
    if (!heading) {
      // Fallback: try to get first paragraph or use article index
      const firstParagraph = article.querySelector('p')?.textContent?.trim();
      if (firstParagraph && firstParagraph.length > 50) {
        heading = firstParagraph.substring(0, 50) + '...';
      } else {
        heading = `Article ${index + 1}`;
      }
    }
    heading = escapeHtml(heading);
    if (highlightLongest && index === longestIdx) {
      heading = '⭐ • ' + heading;
    } else {
      heading = '• ' + heading;
    }
    headings.push(heading);
  });

  let message = `${articleCount} ${articleText} found`;
  if (headings.length > 0) {
    if (articleCount === 1) {
      message += `:<br>${headings[0]}`;
    } else {
      message += `:<br>${headings.slice(0, 3).join('<br>')}`;
      if (headings.length > 3) {
        message += `<br>... and ${headings.length - 3} more`;
      }
    }
  }

  showNotification(message, 'info');
}

function manageFloatingButtonForArticles() {
  const articles = Array.from(document.querySelectorAll('article'));
  let floatingButton = document.getElementById('yt-transcript-floating-button');
  if (articles.length > 0) {
    if (!floatingButton) {
      floatingButton = document.createElement('div');
      floatingButton.id = 'yt-transcript-floating-button';
      floatingButton.innerHTML = `<div class=\"button-emoji\">📝</div>`;
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
      // Show article info notification if setting is enabled
      chrome.storage.sync.get({ articleExporterShowInfo: true, articleExporterOnlyLongest: false }, function(settings) {
        if (settings.articleExporterShowInfo) {
          showArticleInfoNotification(articles, settings.articleExporterOnlyLongest);
        }
      });
      floatingButton.addEventListener('click', async () => {
        if (isProcessing) return;
        isProcessing = true;
        setButtonLoading(floatingButton);
        try {
          const settings = await new Promise(resolve => {
            chrome.storage.sync.get({ 
              articleExporterIncludeImages: true,
              articleExporterOnlyLongest: false,
              articleExporterShowInfo: true,
              articleExporterIncludeUrl: true,
              downloadInsteadOfCopy: false
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
          }
          
          // Add URL if setting is enabled
          if (settings.articleExporterIncludeUrl) {
            const pageUrl = window.location.href;
            const pageTitle = document.title || 'Article';
            md = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${md}`;
          }
          
          chrome.storage.sync.get({ downloadInsteadOfCopy: false }, function(items) {
            if (items.downloadInsteadOfCopy) {
              downloadMarkdownFile(md, document.title, 'ExtractMD');
              setButtonSuccess(floatingButton);
              if (settings.articleExporterOnlyLongest && totalArticles > 1) {
                showNotification(`1/${totalArticles} Articles downloaded as Markdown!`, 'success');
              } else {
                const articleText = processedCount === 1 ? 'Article' : 'Articles';
                showNotification(`${processedCount} ${articleText} downloaded as Markdown!`, 'success');
              }
            } else {
              copyToClipboard(md, true);
              setButtonSuccess(floatingButton);
              if (settings.articleExporterOnlyLongest && totalArticles > 1) {
                showNotification(`1/${totalArticles} Articles copied as Markdown!`, 'success');
              } else {
                const articleText = processedCount === 1 ? 'Article' : 'Articles';
                showNotification(`${processedCount} ${articleText} copied as Markdown!`, 'success');
              }
            }
          });
          
          // Increment KPI counter only if enabled
          chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
            if (items.enableUsageKpi !== false) {
              const stats = items.usageStats || {};
              stats.articles = (stats.articles || 0) + 1;
              chrome.storage.sync.set({ usageStats: stats });
            }
          });
          
          // Check global jumpToDomain setting
          const globalSettings = await getSettings();
          if (globalSettings.jumpToDomain && globalSettings.jumpToDomainUrl) {
            chrome.runtime.sendMessage({ action: 'openNewTab', url: globalSettings.jumpToDomainUrl });
          }
          // Close tab after extraction if setting is enabled
          if (globalSettings.closeTabAfterExtraction) {
            setTimeout(() => {
              closeCurrentTab();
            }, 500); // Wait 500ms after showing the notification
          }
          setTimeout(() => {
            setButtonNormal(floatingButton);
            isProcessing = false;
          }, 2000);
        } catch (e) {
          setButtonError(floatingButton);
          showNotification('Failed to copy article(s).', 'error');
          setTimeout(() => {
            setButtonNormal(floatingButton);
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