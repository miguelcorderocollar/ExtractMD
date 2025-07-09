// Utility functions for ExtractMD extension

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      includeTimestamps: true,
      jumpToDomain: false,
      jumpToDomainUrl: 'https://chat.openai.com/',
      closeTabAfterExtraction: false
    }, (settings) => {
      resolve(settings);
    });
  });
}

export async function copyToClipboard(text, includeTimestamps) {
  let textToCopy = text;
  if (!includeTimestamps) {
    // Remove timestamps from the text
    textToCopy = text.replace(/\[\d+:\d+\]/g, '').replace(/\n\s*\n/g, '\n').trim();
  }
  try {
    await navigator.clipboard.writeText(textToCopy);
  } catch (error) {
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

/**
 * Shows a notification. Message can contain <br> for line breaks.
 * If you use user content, escape it for HTML.
 */
export function showNotification(message, type = 'info', prominent = false) {
  // Create a notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: ${prominent ? '20px 28px' : '12px 20px'};
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: ${prominent ? '18px' : '14px'};
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    transition: opacity 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
    text-align: left;
  `;
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#4CAF50';
      break;
    case 'error':
      notification.style.backgroundColor = '#f44336';
      break;
    default:
      notification.style.backgroundColor = '#2196F3';
  }
  notification.innerHTML = message;
  document.body.appendChild(notification);
  // Remove after 3 seconds (or 5s if prominent)
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, prominent ? 5000 : 3000);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function closeCurrentTab() {
  chrome.runtime.sendMessage({ action: 'closeCurrentTab' });
}

export function htmlToMarkdown(html) {
  let text = html
    .replace(/<p>/gi, '\n\n')
    .replace(/<a [^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, function(_, code) { return '```' + code + '```'; })
    .replace(/<[^>]+>/g, '') // Remove any other tags
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  // Replace placeholder with triple backticks
  text = text.replace(/\u007F\u007F\u007F/g, '```');
  return text.trim();
}

export function setButtonLoading(button) {
  if (!button) return;
  button.innerHTML = `<div class="button-emoji">⏳</div>`;
  button.style.background = 'rgba(255, 193, 7, 0.8)';
  button.style.border = '1px solid rgba(255, 193, 7, 0.3)';
  button.style.cursor = 'not-allowed';
  button.style.fontSize = '20px';
  button.style.opacity = '1';
}

export function setButtonSuccess(button) {
  if (!button) return;
  button.innerHTML = `<div class="button-emoji">✅</div>`;
  button.style.background = 'rgba(76, 175, 80, 0.8)';
  button.style.border = '1px solid rgba(76, 175, 80, 0.3)';
  button.style.fontSize = '24px';
  button.style.opacity = '1';
}

export function setButtonError(button) {
  if (!button) return;
  button.innerHTML = `<div class="button-emoji">❌</div>`;
  button.style.background = 'rgba(244, 67, 54, 0.8)';
  button.style.border = '1px solid rgba(244, 67, 54, 0.3)';
  button.style.fontSize = '24px';
  button.style.opacity = '1';
}

export function setButtonNormal(button) {
  if (!button) return;
  button.innerHTML = `<div class="button-emoji">📝</div>`;
  button.style.background = 'rgba(255, 255, 255, 0.15)';
  button.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  button.style.cursor = 'pointer';
  button.style.fontSize = '24px';
  button.style.opacity = '0.7';
}

export function downloadMarkdownFile(markdown, title = '', extensionName = 'ExtractMD') {
  let safeTitle = title || document.title || 'Untitled';
  safeTitle = safeTitle.replace(/[^a-zA-Z0-9\-_ ]/g, '').replace(/\s+/g, '_').substring(0, 50);
  const filename = `${safeTitle}_${extensionName}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
} 