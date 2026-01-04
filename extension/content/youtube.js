// YouTube-specific logic for ExtractMD extension
import { copyToClipboard, showNotification, sleep, getSettings, closeCurrentTab, downloadMarkdownFile, showSuccessNotificationWithTokens, isFullscreen } from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { encode } from 'gpt-tokenizer';

let floatingButtonController = null;
let isProcessing = false;
let currentUrl = window.location.href;


function startPlayerObserver() {
  // No-op - visibility is now handled by the FloatingButton component itself
}

async function expandDescription() {
  const expandButton = document.querySelector('tp-yt-paper-button#expand');
  if (expandButton) {
    expandButton.click();
    await sleep(500);
  }
}

async function clickShowTranscript() {
  let showTranscriptButton = null;
  let attempts = 0;
  const maxAttempts = 20;
  while (!showTranscriptButton && attempts < maxAttempts) {
    showTranscriptButton = document.querySelector('button[aria-label="Show transcript"]');
    if (!showTranscriptButton) {
      await sleep(500);
      attempts++;
    }
  }
  if (showTranscriptButton) {
    showTranscriptButton.click();
  } else {
    throw new Error('Show transcript button not found. This video might not have a transcript available.');
  }
}

async function waitForTranscriptAndCopy(settings = {}) {
  let transcriptContainer = null;
  let attempts = 0;
  const maxAttempts = 40;
  while (!transcriptContainer && attempts < maxAttempts) {
    transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer #segments-container');
    if (!transcriptContainer) {
      await sleep(500);
      attempts++;
    }
  }
  if (!transcriptContainer) {
    showNotification('❌ Transcript not found or not available for this video. Please check if the video has a transcript. If this persists, contact the developer.', 'error', true);
    throw new Error('Transcript failed to load within timeout period.');
  }
  let transcriptText = extractTranscriptText(settings.includeTimestamps !== false);
  let metaMd = '';
  if (settings.addTitleToTranscript || settings.addChannelToTranscript || settings.addUrlToTranscript) {
    let title = '';
    let channelName = '';
    let channelUrl = '';
    let videoUrl = window.location.href;
    const titleElem = document.querySelector('div#title h1 yt-formatted-string');
    if (titleElem) title = titleElem.textContent.trim();
    const channelElem = document.querySelector('ytd-channel-name#channel-name a');
    if (channelElem) {
      channelName = channelElem.textContent.trim();
      channelUrl = channelElem.href.startsWith('http') ? channelElem.href : (window.location.origin + channelElem.getAttribute('href'));
    }
    if (settings.addTitleToTranscript && title) metaMd += `# ${title}\n`;
    if (settings.addChannelToTranscript && channelName) metaMd += `**Channel:** [${channelName}](${channelUrl})\n`;
    if (settings.addUrlToTranscript && videoUrl) metaMd += `**Video URL:** ${videoUrl}\n`;
    if (metaMd) metaMd += '\n';
  }
  transcriptText = metaMd + transcriptText;
  const userSettings = await getSettings();
  chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, function (items) {
    if (items.downloadInsteadOfCopy) {
      // Use video title for filename
      let title = '';
      const titleElem = document.querySelector('div#title h1 yt-formatted-string');
      if (titleElem) title = titleElem.textContent.trim();
      downloadMarkdownFile(transcriptText, title, 'ExtractMD');
      showSuccessNotificationWithTokens('Transcript downloaded as .md!', transcriptText);
    } else {
      // Check token threshold
      let threshold = parseInt(items.downloadIfTokensExceed, 10);
      if (!isNaN(threshold) && threshold > 0) {
        const tokens = encode(transcriptText).length;
        if (tokens >= threshold * 1000) {
          let title = '';
          const titleElem = document.querySelector('div#title h1 yt-formatted-string');
          if (titleElem) title = titleElem.textContent.trim();
          downloadMarkdownFile(transcriptText, title, 'ExtractMD');
          showSuccessNotificationWithTokens('Transcript downloaded as .md (token threshold)!', transcriptText);
          return;
        }
      }
      // Timestamps already handled in extractTranscriptText, so pass true to avoid re-processing
      copyToClipboard(transcriptText, true);
      showSuccessNotificationWithTokens('Transcript copied to clipboard!', transcriptText);
    }
  });
  // Increment KPI counter
  incrementKpi('youtube');

  // Close tab after extraction if setting is enabled
  if (userSettings.closeTabAfterExtraction) {
    setTimeout(() => {
      closeCurrentTab();
    }, 500); // Wait 500ms after showing the notification
  }
}

export function extractTranscriptText(includeTimestamps = true) {
  const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
  const sections = document.querySelectorAll('ytd-transcript-section-header-renderer');
  let transcript = '';
  const allElements = Array.from(document.querySelectorAll('ytd-transcript-segment-renderer, ytd-transcript-section-header-renderer'));
  allElements.forEach(element => {
    if (element.tagName === 'YTD-TRANSCRIPT-SECTION-HEADER-RENDERER') {
      const headerText = element.querySelector('.shelf-header-layout-wiz__title')?.textContent?.trim();
      if (headerText) {
        transcript += `\n\n## ${headerText}\n`;
      }
    } else if (element.tagName === 'YTD-TRANSCRIPT-SEGMENT-RENDERER') {
      const timestamp = element.querySelector('.segment-timestamp')?.textContent?.trim();
      const text = element.querySelector('.segment-text')?.textContent?.trim();
      if (text) {
        if (includeTimestamps && timestamp) {
          transcript += `[${timestamp}] ${text}\n`;
        } else {
          transcript += `${text}\n`;
        }
      }
    }
  });
  return transcript.trim();
}

// Global function for background script
export async function copyYouTubeTranscript(settings = null) {
  try {
    let mergedSettings = settings;
    if (!settings) {
      mergedSettings = await new Promise(resolve => {
        chrome.storage.sync.get({
          includeTimestamps: true,
          addTitleToTranscript: true,
          addChannelToTranscript: true,
          addUrlToTranscript: true,
          jumpToDomain: false,
          jumpToDomainUrl: 'https://chat.openai.com/'
        }, resolve);
      });
    }
    await expandDescription();
    await clickShowTranscript();
    await waitForTranscriptAndCopy(mergedSettings);
    if (mergedSettings.jumpToDomain && mergedSettings.jumpToDomainUrl) {
      chrome.runtime.sendMessage({ action: 'openNewTab', url: mergedSettings.jumpToDomainUrl });
    }
  } catch (error) {
    showNotification('Error: ' + error.message, 'error');
    throw error;
  }
}

window.copyYouTubeTranscript = copyYouTubeTranscript;

export function initYouTubeFeatures() {
  console.debug('[ExtractMD] initYouTubeFeatures called');
  chrome.storage.sync.get({ enableYouTubeIntegration: true }, function (items) {
    if (items.enableYouTubeIntegration === false) return;
    // Ensure floating button is initialized after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.debug('[ExtractMD] DOMContentLoaded for YouTube');
        initializeFloatingButton();
      });
    } else {
      initializeFloatingButton();
    }

    // Also initialize on YouTube navigation (SPA behavior)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        if (floatingButtonController) {
          floatingButtonController.remove();
          floatingButtonController = null;
        }
        setTimeout(initializeFloatingButton, 1000);
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Monitor for fullscreen changes
    document.addEventListener('fullscreenchange', updateButtonVisibility);
    document.addEventListener('webkitfullscreenchange', updateButtonVisibility);
    document.addEventListener('mozfullscreenchange', updateButtonVisibility);
    // Monitor for YouTube player state changes (theater mode, fullscreen buttons)
    // No longer needed as FloatingButton handles this internally
  });
}

async function initializeFloatingButton() {
  console.debug('[ExtractMD] initializeFloatingButton (YouTube) called');
  if (!(window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch'))) return;
  if (document.getElementById('extractmd-floating-button')) {
    console.debug('[ExtractMD] Floating button already exists (YouTube)');
    return;
  }

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
      if (isProcessing) return;
      isProcessing = true;
      floatingButtonController.setLoading();
      try {
        await window.copyYouTubeTranscript();
        floatingButtonController.setSuccess();
        setTimeout(() => {
          floatingButtonController.setNormal();
          isProcessing = false;
        }, 2000);
      } catch (error) {
        floatingButtonController.setError();
        setTimeout(() => {
          floatingButtonController.setNormal();
          isProcessing = false;
        }, 3000);
      }
    }
  });

  if (floatingButtonController) {
    floatingButtonController.appendTo(document.body);
    console.debug('[ExtractMD] Floating button created and added to DOM (YouTube)');
  }
} 