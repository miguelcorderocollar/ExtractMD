// Generic article extraction logic for ExtractMD extension

import { copyToClipboard, showNotification, getSettings, closeCurrentTab, downloadMarkdownFile, showSuccessNotificationWithTokens } from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { encode } from 'gpt-tokenizer';

let isProcessing = false;
let articleObserver = null;
let floatingButtonController = null;

// Shared copy logic
export async function performArticleCopy(updateButton = false) {
  if (isProcessing) return;
  isProcessing = true;
  if (updateButton && floatingButtonController) floatingButtonController.setLoading();
  
  try {
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get({ 
        articleExporterIncludeImages: true,
        articleExporterOnlyLongest: false,
        articleExporterShowInfo: true,
        articleExporterIncludeUrl: true,
        downloadInsteadOfCopy: false,
        downloadIfTokensExceed: 0
      }, resolve);
    });
    const currentArticles = Array.from(document.querySelectorAll('article'));
    let md = '';
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
    if (settings.articleExporterIncludeUrl && !(settings.articleExporterOnlyLongest && currentArticles.length > 1)) {
      const pageUrl = window.location.href;
      const pageTitle = document.title || 'Article';
      md = `# ${pageTitle}\n\n**URL:** ${pageUrl}\n\n---\n\n${md}`;
    }
    
    chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, function(items) {
      const processedCount = settings.articleExporterOnlyLongest && totalArticles > 1 ? 1 : totalArticles;
      if (items.downloadInsteadOfCopy) {
        downloadMarkdownFile(md, document.title, 'ExtractMD');
        if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
        if (settings.articleExporterOnlyLongest && totalArticles > 1) {
          showSuccessNotificationWithTokens(`1/${totalArticles} Articles downloaded as Markdown!`, md);
        } else {
          const articleText = processedCount === 1 ? 'Article' : 'Articles';
          showSuccessNotificationWithTokens(`${processedCount} ${articleText} downloaded as Markdown!`, md);
        }
      } else {
        // Check token threshold
        let threshold = parseInt(items.downloadIfTokensExceed, 10);
        if (!isNaN(threshold) && threshold > 0) {
          const tokens = encode(md).length;
          if (tokens >= threshold * 1000) {
            downloadMarkdownFile(md, document.title, 'ExtractMD');
            if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
            if (settings.articleExporterOnlyLongest && totalArticles > 1) {
              showSuccessNotificationWithTokens(`1/${totalArticles} Articles downloaded as Markdown! (token threshold)`, md);
            } else {
              const articleText = processedCount === 1 ? 'Article' : 'Articles';
              showSuccessNotificationWithTokens(`${processedCount} ${articleText} downloaded as Markdown! (token threshold)`, md);
            }
            return;
          }
        }
        copyToClipboard(md, true);
        if (updateButton && floatingButtonController) floatingButtonController.setSuccess();
        if (settings.articleExporterOnlyLongest && totalArticles > 1) {
          showSuccessNotificationWithTokens(`1/${totalArticles} Articles copied as Markdown!`, md);
        } else {
          const articleText = processedCount === 1 ? 'Article' : 'Articles';
          showSuccessNotificationWithTokens(`${processedCount} ${articleText} copied as Markdown!`, md);
        }
      }
    });
    
    // Increment KPI counter
    incrementKpi('articles');
    
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
    if (updateButton && floatingButtonController) {
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 2000);
    } else {
      isProcessing = false;
    }
  } catch (e) {
    if (updateButton && floatingButtonController) {
      floatingButtonController.setError();
      setTimeout(() => {
        floatingButtonController.setNormal();
        isProcessing = false;
      }, 3000);
    } else {
      isProcessing = false;
    }
    showNotification('Failed to copy article(s).', 'error');
  }
}

export function nodeToMarkdown(node, includeImages) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }
  const tag = node.tagName.toLowerCase();
  // Skip SVG and other non-markdown elements to avoid attribute errors
  if (tag === 'svg' || tag === 'script' || tag === 'style' || tag === 'noscript') {
    return '';
  }
  if (tag === 'h1') return `# ${node.textContent.trim()}\n\n`;
  if (tag === 'h2') return `## ${node.textContent.trim()}\n\n`;
  if (tag === 'h3') return `### ${node.textContent.trim()}\n\n`;
  if (tag === 'h4') return `#### ${node.textContent.trim()}\n\n`;
  if (tag === 'h5') return `##### ${node.textContent.trim()}\n\n`;
  if (tag === 'h6') return `###### ${node.textContent.trim()}\n\n`;
  if (tag === 'p') return `${Array.from(node.childNodes).map(n => nodeToMarkdown(n, includeImages)).join('')}\n\n`;
  if (tag === 'ul') return `\n${Array.from(node.children).map(li => `- ${nodeToMarkdown(li, includeImages)}`).join('\n')}\n`;
  if (tag === 'ol') return `\n${Array.from(node.children).map((li, i) => `${i+1}. ${nodeToMarkdown(li, includeImages)}`).join('\n')}\n`;
  if (tag === 'li') return `${Array.from(node.childNodes).map(n => nodeToMarkdown(n, includeImages)).join('')}`;
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
  return Array.from(node.childNodes).map(n => nodeToMarkdown(n, includeImages)).join('');
}

export async function extractArticleMarkdown(articleElem, includeImages) {
  let markdown = '';
  const children = Array.from(articleElem.childNodes);
  children.forEach(child => {
    const md = nodeToMarkdown(child, includeImages);
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

async function manageFloatingButtonForArticles() {
  // Don't create button if domain is ignored
  if (window.__extractmd_domain_ignored) {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
    }
    return;
  }
  
  const articles = Array.from(document.querySelectorAll('article'));
  const existingButton = document.getElementById('extractmd-floating-button');
  
  if (articles.length > 0) {
    if (!existingButton) {
      // Load floating button settings
      const buttonSettings = await new Promise(resolve => {
        chrome.storage.sync.get({
          floatingButtonEnableDrag: true,
          floatingButtonEnableDismiss: true
        }, resolve);
      });
      
      floatingButtonController = await createFloatingButton({
        domain: window.location.hostname,
        enableDrag: buttonSettings.floatingButtonEnableDrag,
        enableDismiss: buttonSettings.floatingButtonEnableDismiss,
        onClick: async () => {
          await performArticleCopy(true);
        }
      });
      
      if (floatingButtonController) {
        floatingButtonController.appendTo(document.body);
        console.debug('[ExtractMD] Floating button created and added to DOM (Article)');
        
        // Show article info notification if setting is enabled
        chrome.storage.sync.get({ articleExporterShowInfo: true, articleExporterOnlyLongest: false }, function(settings) {
          if (settings.articleExporterShowInfo) {
            showArticleInfoNotification(articles, settings.articleExporterOnlyLongest);
          }
        });
      }
    } else if (floatingButtonController) {
      floatingButtonController.show();
    }
  } else {
    if (floatingButtonController) {
      floatingButtonController.remove();
      floatingButtonController = null;
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
  chrome.storage.sync.get({ enableArticleIntegration: true }, function(items) {
    if (items.enableArticleIntegration === false) return;
    setupArticleMutationObserver();
    manageFloatingButtonForArticles();
  });
} 