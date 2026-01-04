// Utility functions for ExtractMD extension

import { encode } from 'gpt-tokenizer';
import { getSettings as getSettingsFromStorage } from '../shared/storage.js';

// Re-export getSettings from shared storage module
export async function getSettings() {
  return getSettingsFromStorage();
}

/**
 * Robust detection of fullscreen or theater modes across websites.
 * Includes generic native fullscreen and site-specific theater modes.
 * @returns {boolean}
 */
export function isFullscreen() {
  // Check native browser fullscreen
  if (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ) {
    return true;
  }

  // YouTube specific checks (Theater Mode, etc.)
  if (window.location.hostname.includes('youtube.com')) {
    // Check YouTube specific attributes on the watch element
    const watchElement = document.querySelector('ytd-watch-flexy');
    if (watchElement) {
      if (watchElement.hasAttribute('fullscreen')) return true;
      if (watchElement.hasAttribute('theater')) return true;
    }

    // Fallback to buttons using standard classes instead of localized aria-labels
    const theaterButton = document.querySelector('.ytp-size-button');
    if (theaterButton && theaterButton.getAttribute('aria-pressed') === 'true') {
      return true;
    }

    const fullscreenButton = document.querySelector('.ytp-fullscreen-button');
    if (fullscreenButton && fullscreenButton.getAttribute('aria-pressed') === 'true') {
      return true;
    }
  }

  // TODO: Add other site-specific theater or "dim lights" detections here if needed
  // For now, native fullscreen covers most cases (Netflix, Twitch, etc.)

  return false;
}

export async function copyToClipboard(text, includeTimestamps) {
  let textToCopy = text;
  if (!includeTimestamps) {
    // Remove timestamps in [mm:ss], [h:mm:ss], or [hh:mm:ss] formats
    textToCopy = text
      .replace(/\[\d{1,2}(:\d{2}){1,2}\]/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
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

// Notification theme colors matching ExtractMD design system
const NOTIFICATION_THEME = {
  light: {
    success: { bg: '#dcfce7', text: '#22c55e', border: '#bbf7d0' },
    error: { bg: '#fee2e2', text: '#ef4444', border: '#fecaca' },
    info: { bg: '#ccfbf1', text: '#14b8a6', border: '#99f6e4' },
    shadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  dark: {
    success: { bg: '#14532d', text: '#4ade80', border: '#166534' },
    error: { bg: '#450a0a', text: '#f87171', border: '#7f1d1d' },
    info: { bg: '#134e4a', text: '#2dd4bf', border: '#115e59' },
    shadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
};

// SVG icons for notifications
const NOTIFICATION_ICONS = {
  success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
  info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
};

/**
 * Detect if user prefers dark mode
 * @returns {boolean}
 */
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Inject notification animation styles if not already present
 */
function injectNotificationStyles() {
  if (document.getElementById('extractmd-notification-styles')) return;

  const style = document.createElement('style');
  style.id = 'extractmd-notification-styles';
  style.textContent = `
    @keyframes extractmd-slide-in {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes extractmd-fade-out {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(20px); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Shows a notification. Message can contain <br> for line breaks.
 * If you use user content, escape it for HTML.
 */
export function showNotification(message, type = 'info', prominent = false) {
  // Inject animation styles
  injectNotificationStyles();

  // Get theme colors
  const theme = isDarkMode() ? NOTIFICATION_THEME.dark : NOTIFICATION_THEME.light;
  const colors = theme[type] || theme.info;
  const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;

  // Create notification container
  const notification = document.createElement('div');
  notification.className = 'extractmd-notification';

  // Apply styles individually for better compatibility
  const s = notification.style;
  s.position = 'fixed';
  s.top = '20px';
  s.right = '20px';
  s.display = 'flex';
  s.alignItems = 'flex-start';
  s.gap = '12px';
  s.padding = prominent ? '16px 20px' : '12px 16px';
  s.borderRadius = '8px';
  s.background = colors.bg;
  s.color = colors.text;
  s.border = `1px solid ${colors.border}`;
  s.fontFamily = "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace";
  s.fontSize = prominent ? '14px' : '13px';
  s.fontWeight = '500';
  s.zIndex = '10000';
  s.boxShadow = theme.shadow;
  s.maxWidth = '360px';
  s.wordWrap = 'break-word';
  s.textAlign = 'left';
  s.lineHeight = '1.5';
  s.animation = 'extractmd-slide-in 200ms ease forwards';

  // Create icon container
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  `;
  iconContainer.innerHTML = icon;

  // Create message container
  const messageContainer = document.createElement('div');
  messageContainer.style.cssText = `
    flex: 1;
    min-width: 0;
  `;
  messageContainer.innerHTML = message;

  // Assemble notification
  notification.appendChild(iconContainer);
  notification.appendChild(messageContainer);
  document.body.appendChild(notification);

  // Remove after delay (3s normal, 5s prominent)
  const duration = prominent ? 5000 : 3000;
  setTimeout(() => {
    notification.style.animation = 'extractmd-fade-out 200ms ease forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 200);
  }, duration);
}

/**
 * Shows a success notification, optionally appending token count if enabled in settings.
 * @param {string} message - The base message to show.
 * @param {string} text - The text to count tokens for.
 * @param {string} [type='success'] - Notification type (default: 'success').
 * @param {boolean} [prominent=false] - Whether to show as prominent notification.
 */
export function showSuccessNotificationWithTokens(
  message,
  text,
  type = 'success',
  prominent = false
) {
  chrome.storage.sync.get({ showTokenCountInNotification: false }, function (items) {
    let msg = message;
    if (items.showTokenCountInNotification) {
      const tokens = encode(text).length;
      msg += `<br><span style='font-weight:400;font-size:12px;opacity:0.85;'>${tokens.toLocaleString()} tokens</span>`;
    }
    showNotification(msg, type, prominent);
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, function (_, code) {
      return '```' + code + '```';
    })
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
  safeTitle = safeTitle
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
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
