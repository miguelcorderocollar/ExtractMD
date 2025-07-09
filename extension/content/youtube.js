// YouTube-specific logic for ExtractMD extension
import { copyToClipboard, showNotification, sleep, getSettings, closeCurrentTab, setButtonLoading, setButtonSuccess, setButtonError, setButtonNormal, downloadMarkdownFile } from './utils.js';

let floatingButton = null;
let isProcessing = false;
let currentUrl = window.location.href;

function isVideoFullscreen() {
  if (document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement || 
      document.msFullscreenElement) {
    return true;
  }
  const theaterModeButton = document.querySelector('button[aria-label="Theater mode (t)"]');
  if (theaterModeButton && theaterModeButton.getAttribute('aria-pressed') === 'true') {
    return true;
  }
  const fullscreenButton = document.querySelector('button[aria-label="Full screen (f)"]');
  if (fullscreenButton && fullscreenButton.getAttribute('aria-pressed') === 'true') {
    return true;
  }
  return false;
}

function updateButtonVisibility() {
  if (!floatingButton) return;
  if (isVideoFullscreen()) {
    floatingButton.style.display = 'none';
  } else {
    floatingButton.style.display = 'flex';
  }
}

function startPlayerObserver() {
  const playerControls = document.querySelector('#movie_player');
  if (playerControls) {
    playerObserver.observe(playerControls, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-pressed']
    });
  }
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
  let transcriptText = extractTranscriptText();
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
  chrome.storage.sync.get({ downloadInsteadOfCopy: false }, function(items) {
    if (items.downloadInsteadOfCopy) {
      // Use video title for filename
      let title = '';
      const titleElem = document.querySelector('div#title h1 yt-formatted-string');
      if (titleElem) title = titleElem.textContent.trim();
      downloadMarkdownFile(transcriptText, title, 'ExtractMD');
      showNotification('Transcript downloaded as .md!', 'success');
    } else {
      copyToClipboard(transcriptText, userSettings.includeTimestamps);
      showNotification('Transcript copied to clipboard!', 'success');
    }
  });
  // Increment KPI counter only if enabled
  chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
    if (items.enableUsageKpi !== false) {
      const stats = items.usageStats || {};
      stats.youtube = (stats.youtube || 0) + 1;
      chrome.storage.sync.set({ usageStats: stats });
    }
  });
  
  // Close tab after extraction if setting is enabled
  if (userSettings.closeTabAfterExtraction) {
    setTimeout(() => {
      closeCurrentTab();
    }, 500); // Wait 500ms after showing the notification
  }
}

function extractTranscriptText() {
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
        if (timestamp) {
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
window.copyYouTubeTranscript = async function(settings = null) {
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
};

export function initYouTubeFeatures() {
  console.debug('[ExtractMD] initYouTubeFeatures called');
  chrome.storage.sync.get({ enableYouTubeIntegration: true }, function(items) {
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
        if (floatingButton && floatingButton.parentNode) {
          floatingButton.parentNode.removeChild(floatingButton);
          floatingButton = null;
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
    document.addEventListener('MSFullscreenChange', updateButtonVisibility);

    // Monitor for YouTube player state changes (theater mode, fullscreen buttons)
    const playerObserver = new MutationObserver(() => {
      updateButtonVisibility();
    });
    startPlayerObserver();
    // Also start player observer on YouTube navigation
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(startPlayerObserver, 1000);
      }
    });
    urlObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function initializeFloatingButton() {
  console.debug('[ExtractMD] initializeFloatingButton (YouTube) called');
  if (!(window.location.hostname.includes('youtube.com') && window.location.pathname.includes('/watch'))) return;
  if (document.getElementById('yt-transcript-floating-button')) {
    console.debug('[ExtractMD] Floating button already exists (YouTube)');
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
  floatingButton.addEventListener('click', async () => {
    if (isProcessing) return;
    isProcessing = true;
    setButtonLoading(floatingButton);
    try {
      await window.copyYouTubeTranscript();
      setButtonSuccess(floatingButton);
      setTimeout(() => {
        setButtonNormal(floatingButton);
        isProcessing = false;
      }, 2000);
    } catch (error) {
      setButtonError(floatingButton);
      setTimeout(() => {
        setButtonNormal(floatingButton);
        isProcessing = false;
      }, 3000);
    }
  });
  document.body.appendChild(floatingButton);
  console.debug('[ExtractMD] Floating button created and added to DOM (YouTube)');
  updateButtonVisibility();
} 