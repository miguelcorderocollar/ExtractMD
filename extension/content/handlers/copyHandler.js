// Shared copy/download handler for ExtractMD
// Consolidates copy, download, token threshold, and KPI logic

import { getSettings, incrementKpi } from '../../shared/storage.js';
import { copyToClipboard, downloadMarkdownFile, showSuccessNotificationWithTokens, closeCurrentTab } from '../utils.js';
import { encode } from 'gpt-tokenizer';

/**
 * Handle copy or download action for extracted markdown
 * @param {string} markdown - The markdown content to copy/download
 * @param {Object} options - Options for the handler
 * @param {string} options.title - Title for the downloaded file
 * @param {string} options.kpiType - KPI type to increment (youtube, articles, hn_comments, hn_news)
 * @param {string} [options.successMessage] - Custom success message (default: based on action)
 * @param {Function} [options.onSuccess] - Callback after successful copy/download
 * @returns {Promise<{action: string, tokens: number}>} Result object with action taken and token count
 */
export async function handleCopyOrDownload(markdown, { title, kpiType, successMessage, onSuccess }) {
  // Get settings for copy/download behavior
  const settings = await new Promise(resolve => {
    chrome.storage.sync.get({
      downloadInsteadOfCopy: false,
      downloadIfTokensExceed: 0,
      jumpToDomain: false,
      jumpToDomainUrl: 'https://chat.openai.com/',
      closeTabAfterExtraction: false
    }, resolve);
  });

  const tokens = encode(markdown).length;
  let action = 'copy';
  let message = successMessage || 'Copied to clipboard!';

  // Determine action: force download, token threshold download, or copy
  if (settings.downloadInsteadOfCopy) {
    action = 'download';
    message = successMessage || 'Downloaded as .md!';
  } else {
    const threshold = parseInt(settings.downloadIfTokensExceed, 10);
    if (!isNaN(threshold) && threshold > 0 && tokens >= threshold * 1000) {
      action = 'download-threshold';
      message = successMessage || 'Downloaded as .md (token threshold)!';
    }
  }

  // Perform the action
  if (action === 'download' || action === 'download-threshold') {
    downloadMarkdownFile(markdown, title, 'ExtractMD');
  } else {
    await copyToClipboard(markdown, true);
  }

  // Show notification with token count
  showSuccessNotificationWithTokens(message, markdown);

  // Increment KPI counter
  await incrementKpi(kpiType);

  // Post-action behaviors
  if (settings.jumpToDomain && settings.jumpToDomainUrl) {
    chrome.runtime.sendMessage({ action: 'openNewTab', url: settings.jumpToDomainUrl });
  }

  if (settings.closeTabAfterExtraction) {
    setTimeout(() => closeCurrentTab(), 500);
  }

  // Call success callback if provided
  if (onSuccess) {
    onSuccess();
  }

  return { action, tokens };
}

