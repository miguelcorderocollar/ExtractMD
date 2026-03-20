// YouTube-specific logic for ExtractMD extension
import {
  copyToClipboard,
  downloadMarkdownFile,
  showSuccessNotificationWithTokens,
  sleep,
  showNotification,
  getSettings,
  closeCurrentTab,
} from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { runIntegrationApiSend } from './handlers/apiSendWorkflow.js';
import {
  computeEnabledApiProfileSignature,
  getSecondaryApiActions,
} from './handlers/apiSecondaryActions.js';
import { encode } from 'gpt-tokenizer';

let floatingButtonController = null;
let isProcessing = false;
let isApiProcessing = false;
let floatingButtonYouTubeApiSignature = '';
let youtubeStorageListenerAttached = false;

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
    throw new Error(
      'Show transcript button not found. This video might not have a transcript available.'
    );
  }
}

async function waitForTranscriptContainer() {
  let transcriptContainer = null;
  let attempts = 0;
  const maxAttempts = 40;
  while (!transcriptContainer && attempts < maxAttempts) {
    transcriptContainer = document.querySelector(
      'ytd-transcript-segment-list-renderer #segments-container, macro-markers-panel-item-view-model, transcript-segment-view-model'
    );
    if (!transcriptContainer) {
      await sleep(500);
      attempts++;
    }
  }
  if (!transcriptContainer) {
    showNotification(
      '❌ Transcript not found or not available for this video. Please check if the video has a transcript. If this persists, contact the developer.',
      'error',
      true
    );
    throw new Error('Transcript failed to load within timeout period.');
  }
  return transcriptContainer;
}

function collectYouTubeMetadata(settings = {}) {
  let title = '';
  let channelName = '';
  let channelUrl = '';
  const videoUrl = window.location.href;
  const titleElem = document.querySelector('div#title h1 yt-formatted-string');
  if (titleElem) title = titleElem.textContent.trim();

  const channelElem = document.querySelector('ytd-channel-name#channel-name a');
  if (channelElem) {
    channelName = channelElem.textContent.trim();
    channelUrl = channelElem.href.startsWith('http')
      ? channelElem.href
      : window.location.origin + channelElem.getAttribute('href');
  }

  const publishedDateMeta =
    document.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content') || '';

  let metadataMarkdown = '';
  if (settings.addTitleToTranscript && title) metadataMarkdown += `# ${title}\n`;
  if (settings.addChannelToTranscript && channelName) {
    metadataMarkdown += `**Channel:** [${channelName}](${channelUrl})\n`;
  }
  if (settings.addUrlToTranscript && videoUrl) metadataMarkdown += `**Video URL:** ${videoUrl}\n`;
  if (metadataMarkdown) metadataMarkdown += '\n';

  return {
    title,
    channelName,
    channelUrl,
    videoUrl,
    publishedDate: publishedDateMeta,
    metadataMarkdown,
  };
}

export function buildYouTubeApiVariables({
  title = '',
  channelName = '',
  channelUrl = '',
  publishedDate = '',
  videoUrl = '',
  transcriptMarkdown = '',
  extractedAt = '',
}) {
  return {
    title,
    author: channelName,
    channel_name: channelName,
    channel_url: channelUrl,
    date: publishedDate,
    link: videoUrl,
    content: transcriptMarkdown,
    extracted_at: extractedAt || new Date().toISOString(),
  };
}

async function extractYouTubeTranscriptData(settings = {}) {
  await waitForTranscriptContainer();
  const includeChapters = settings.includeChapters !== false;
  let transcriptText = extractTranscriptText(settings.includeTimestamps !== false, includeChapters);
  const metadata = collectYouTubeMetadata(settings);

  if (includeChapters) {
    const chapters = extractChapters();
    const chaptersMd = formatChaptersSection(chapters);
    if (chaptersMd) {
      metadata.metadataMarkdown += chaptersMd + '\n\n';
    }
  }

  transcriptText = (metadata.metadataMarkdown || '') + transcriptText;
  const extractedAt = new Date().toISOString();
  const apiVariables = buildYouTubeApiVariables({
    title: metadata.title,
    channelName: metadata.channelName,
    channelUrl: metadata.channelUrl,
    publishedDate: metadata.publishedDate,
    videoUrl: metadata.videoUrl,
    transcriptMarkdown: transcriptText,
    extractedAt,
  });

  return {
    transcriptText,
    title: metadata.title,
    apiVariables,
  };
}

async function waitForTranscriptAndCopy(settings = {}) {
  const { transcriptText, title } = await extractYouTubeTranscriptData(settings);
  const userSettings = await getSettings();
  chrome.storage.sync.get(
    { downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 },
    function (items) {
      if (items.downloadInsteadOfCopy) {
        downloadMarkdownFile(transcriptText, title, 'ExtractMD');
        showSuccessNotificationWithTokens('Transcript downloaded as .md!', transcriptText);
      } else {
        // Check token threshold
        let threshold = parseInt(items.downloadIfTokensExceed, 10);
        if (!isNaN(threshold) && threshold > 0) {
          const tokens = encode(transcriptText).length;
          if (tokens >= threshold * 1000) {
            downloadMarkdownFile(transcriptText, title, 'ExtractMD');
            showSuccessNotificationWithTokens(
              'Transcript downloaded as .md (token threshold)!',
              transcriptText
            );
            return;
          }
        }
        // Timestamps already handled in extractTranscriptText, so pass true to avoid re-processing
        copyToClipboard(transcriptText, true);
        showSuccessNotificationWithTokens('Transcript copied to clipboard!', transcriptText);
      }
    }
  );
  // Increment KPI counter
  incrementKpi('youtube');

  // Close tab after extraction if setting is enabled
  if (userSettings.closeTabAfterExtraction) {
    setTimeout(() => {
      closeCurrentTab();
    }, 500); // Wait 500ms after showing the notification
  }
}

export function extractChapters() {
  const chapters = [];

  // Old UI: chapter headers inside transcript section headers
  document.querySelectorAll('ytd-transcript-section-header-renderer').forEach((el) => {
    const title = el.querySelector('.shelf-header-layout-wiz__title')?.textContent?.trim();
    if (title) chapters.push({ title });
  });

  // New UI: chapter view models
  document.querySelectorAll('timeline-chapter-view-model').forEach((el) => {
    const title = el.querySelector('.ytwTimelineChapterViewModelTitle')?.textContent?.trim();
    const timestamp = el
      .querySelector('.ytwTimelineChapterViewModelTimestamp')
      ?.textContent?.trim();
    if (title) chapters.push({ title, timestamp });
  });

  return chapters;
}

export function formatChaptersSection(chapters) {
  if (!chapters.length) return '';
  const lines = chapters.map((ch) => {
    return ch.timestamp ? `- ${ch.title} (${ch.timestamp})` : `- ${ch.title}`;
  });
  return `## Chapters\n${lines.join('\n')}`;
}

export function extractTranscriptText(includeTimestamps = true, includeChapters = true) {
  let transcript = '';
  const allElements = Array.from(
    document.querySelectorAll(
      'ytd-transcript-segment-renderer, ytd-transcript-section-header-renderer, transcript-segment-view-model, timeline-chapter-view-model'
    )
  );
  allElements.forEach((element) => {
    const tag = element.tagName;
    if (includeChapters && tag === 'YTD-TRANSCRIPT-SECTION-HEADER-RENDERER') {
      const headerText = element
        .querySelector('.shelf-header-layout-wiz__title')
        ?.textContent?.trim();
      if (headerText) {
        transcript += `\n\n## ${headerText}\n`;
      }
    } else if (includeChapters && tag === 'TIMELINE-CHAPTER-VIEW-MODEL') {
      const headerText = element
        .querySelector('.ytwTimelineChapterViewModelTitle')
        ?.textContent?.trim();
      if (headerText) {
        transcript += `\n\n## ${headerText}\n`;
      }
    } else if (
      tag === 'YTD-TRANSCRIPT-SEGMENT-RENDERER' ||
      tag === 'TRANSCRIPT-SEGMENT-VIEW-MODEL'
    ) {
      const timestamp = element
        .querySelector('.segment-timestamp, .ytwTranscriptSegmentViewModelTimestamp')
        ?.textContent?.trim();
      const text = element
        .querySelector('.segment-text, .yt-core-attributed-string')
        ?.textContent?.trim();
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
      mergedSettings = await new Promise((resolve) => {
        chrome.storage.sync.get(
          {
            includeTimestamps: true,
            includeChapters: true,
            addTitleToTranscript: true,
            addChannelToTranscript: true,
            addUrlToTranscript: true,
            jumpToDomain: false,
            jumpToDomainUrl: 'https://chat.openai.com/',
          },
          resolve
        );
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

async function performYouTubeApiSend({ updateButton = false, profileId = '' } = {}) {
  await runIntegrationApiSend({
    integration: 'youtube',
    profileId,
    updateButton,
    defaultErrorMessage: 'Failed to send YouTube content via API.',
    getIsProcessing: () => isApiProcessing,
    setIsProcessing: (value) => {
      isApiProcessing = value;
    },
    getFloatingButtonController: () => floatingButtonController,
    prepareVariables: async () => {
      const settings = await new Promise((resolve) => {
        chrome.storage.sync.get(
          {
            includeTimestamps: true,
            includeChapters: true,
            addTitleToTranscript: true,
            addChannelToTranscript: true,
            addUrlToTranscript: true,
          },
          resolve
        );
      });

      await expandDescription();
      await clickShowTranscript();
      const { apiVariables } = await extractYouTubeTranscriptData(settings);
      return apiVariables;
    },
  });
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
      subtree: true,
    });

    // Monitor for YouTube player state changes (theater mode, fullscreen buttons)
    // No longer needed as FloatingButton handles this internally

    if (!youtubeStorageListenerAttached && chrome.storage?.onChanged) {
      youtubeStorageListenerAttached = true;
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'sync') return;
        if (!changes.apiProfilesJson && !changes.apiOutputEnabled) return;
        initializeFloatingButton();
      });
    }
  });
}

async function initializeFloatingButton() {
  console.debug('[ExtractMD] initializeFloatingButton (YouTube) called');
  if (
    !(
      window.location.hostname.includes('youtube.com') &&
      window.location.pathname.includes('/watch')
    )
  )
    return;

  const buttonSettings = await new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        floatingButtonEnableDrag: true,
        floatingButtonEnableDismiss: true,
        apiOutputEnabled: false,
        apiProfilesJson: '[]',
      },
      resolve
    );
  });

  const apiSignature = computeEnabledApiProfileSignature({
    apiProfilesJson: buttonSettings.apiProfilesJson,
    apiOutputEnabled: buttonSettings.apiOutputEnabled,
    integration: 'youtube',
  });

  const existingDomButton = document.getElementById('extractmd-floating-button');
  if (existingDomButton && floatingButtonController) {
    if (apiSignature !== floatingButtonYouTubeApiSignature) {
      floatingButtonController.remove();
      floatingButtonController = null;
    } else {
      floatingButtonController.show();
      return;
    }
  } else if (existingDomButton && !floatingButtonController) {
    existingDomButton.remove();
  }

  if (document.getElementById('extractmd-floating-button')) return;

  floatingButtonYouTubeApiSignature = apiSignature;
  const secondaryActions = getSecondaryApiActions({
    apiProfilesJson: buttonSettings.apiProfilesJson,
    apiOutputEnabled: buttonSettings.apiOutputEnabled,
    integration: 'youtube',
    onProfileAction: async (profileId) => {
      await performYouTubeApiSend({ updateButton: true, profileId });
    },
  });

  floatingButtonController = await createFloatingButton({
    domain: window.location.hostname,
    enableDrag: buttonSettings.floatingButtonEnableDrag,
    enableDismiss: buttonSettings.floatingButtonEnableDismiss,
    secondaryActions,
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
      } catch {
        floatingButtonController.setError();
        setTimeout(() => {
          floatingButtonController.setNormal();
          isProcessing = false;
        }, 3000);
      }
    },
  });

  if (floatingButtonController) {
    floatingButtonController.appendTo(document.body);
    console.debug('[ExtractMD] Floating button created and added to DOM (YouTube)');
  }
}
