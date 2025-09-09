// Utility functions for ExtractMD extension

import { encode } from 'gpt-tokenizer';

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
    // Remove timestamps in [mm:ss], [h:mm:ss], or [hh:mm:ss] formats
    textToCopy = text.replace(/\[\d{1,2}(:\d{2}){1,2}\]/g, '').replace(/\n\s*\n/g, '\n').trim();
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

/**
 * Shows a success notification, optionally appending token count if enabled in settings.
 * @param {string} message - The base message to show.
 * @param {string} text - The text to count tokens for.
 * @param {string} [type='success'] - Notification type (default: 'success').
 * @param {boolean} [prominent=false] - Whether to show as prominent notification.
 */
export function showSuccessNotificationWithTokens(message, text, type = 'success', prominent = false) {
  chrome.storage.sync.get({ showTokenCountInNotification: false }, function(items) {
    let msg = message;
    if (items.showTokenCountInNotification) {
      const tokens = encode(text).length;
      msg += `<br><span style='font-weight:normal;font-size:13px;'>${tokens} tokens</span>`;
    }
    showNotification(msg, type, prominent);
  });
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

export function getCurrentHostname() {
  try { return window.location.hostname || ''; } catch { return ''; }
}

export function getHiddenButtonsByDomain(cb) {
  chrome.storage.sync.get({ hiddenButtonsByDomain: {} }, (items) => {
    cb(items.hiddenButtonsByDomain || {});
  });
}

export function isFloatingButtonHiddenForCurrentDomain(cb) {
  const host = getCurrentHostname();
  getHiddenButtonsByDomain((map) => cb(!!map[host]));
}

export function setFloatingButtonHiddenForCurrentDomain(hidden, cb) {
  const host = getCurrentHostname();
  chrome.storage.sync.get({ hiddenButtonsByDomain: {} }, (items) => {
    const map = items.hiddenButtonsByDomain || {};
    if (hidden) {
      // Only store when hidden (disabled)
      map[host] = true;
    } else {
      // Remove from storage when enabled (back to default)
      delete map[host];
    }
    chrome.storage.sync.set({ hiddenButtonsByDomain: map }, cb);
  });
}

export function attachHideAffordance(floatingButton) {
  if (!floatingButton) return () => {};
  let hoverTimer = null;
  let badge = null;

  const showBadge = () => {
    if (badge) return;
    badge = document.createElement('div');
    badge.textContent = '×';
    badge.title = 'Hide on this site (Ctrl+Shift+F to toggle)';
    badge.style.cssText = `
      position: absolute;
      top: -6px;
      right: -6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #f44336;
      color: #fff;
      font-size: 12px;
      line-height: 18px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      z-index: 10001;
    `;
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      setFloatingButtonHiddenForCurrentDomain(true, () => {
        if (floatingButton && floatingButton.parentNode) {
          floatingButton.parentNode.removeChild(floatingButton);
        }
        showNotification('Floating button hidden on this site. Press Ctrl+Shift+F to show again.', 'success');
      });
    });
    // Ensure button is positioned properly
    if (!/position:\s*fixed/.test(floatingButton.style.cssText)) {
      floatingButton.style.position = 'fixed';
    }
    floatingButton.appendChild(badge);
  };

  const hideBadge = () => {
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    badge = null;
  };

  const onEnter = () => {
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(showBadge, 1000);
  };
  const onLeave = () => {
    if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
    hideBadge();
  };

  floatingButton.addEventListener('mouseenter', onEnter);
  floatingButton.addEventListener('mouseleave', onLeave);

  return () => {
    floatingButton.removeEventListener('mouseenter', onEnter);
    floatingButton.removeEventListener('mouseleave', onLeave);
    hideBadge();
  };
}

// Lightweight utilities to keep other modules clean
export function debounce(fn, wait = 200) {
  let timeoutId = null;
  return function(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      try { fn.apply(this, args); } catch {}
    }, wait);
  };
}

export function removeFloatingButton() {
  try {
    const btn = document.getElementById('yt-transcript-floating-button');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  } catch {}
}

export function onHiddenToggle(handler) {
  // Call handler with current hidden state when hiddenButtonsByDomain changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.hiddenButtonsByDomain) return;
    isFloatingButtonHiddenForCurrentDomain((hidden) => handler(!!hidden));
  });
}