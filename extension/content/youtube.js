// YouTube-specific logic for ExtractMD extension
import {
  copyToClipboard,
  downloadMarkdownFile,
  showSuccessNotificationWithTokens,
  getSettings,
  closeCurrentTab,
} from './utils.js';
import { incrementKpi } from '../shared/storage.js';
import { createFloatingButton } from './components/FloatingButton.js';
import { encode } from 'gpt-tokenizer';
import {
  extractTranscriptText,
  extractYouTubeTranscriptMarkdown,
  extractYouTubeTranscriptPayload,
} from './youtubeTranscript.js';

export { extractTranscriptText, extractYouTubeTranscriptMarkdown, extractYouTubeTranscriptPayload };

let floatingButtonController = null;
let isProcessing = false;

function getCurrentVideoTitle() {
  return document.querySelector('div#title h1 yt-formatted-string')?.textContent?.trim() || '';
}

async function getYouTubeTranscriptSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        includeTimestamps: true,
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

async function handleTranscriptOutput(transcriptText) {
  const outputSettings = await new Promise((resolve) => {
    chrome.storage.sync.get({ downloadInsteadOfCopy: false, downloadIfTokensExceed: 0 }, resolve);
  });

  if (outputSettings.downloadInsteadOfCopy) {
    downloadMarkdownFile(transcriptText, getCurrentVideoTitle(), 'ExtractMD');
    showSuccessNotificationWithTokens('Transcript downloaded as .md!', transcriptText);
    return;
  }

  const threshold = parseInt(outputSettings.downloadIfTokensExceed, 10);
  if (!isNaN(threshold) && threshold > 0) {
    const tokens = encode(transcriptText).length;
    if (tokens >= threshold * 1000) {
      downloadMarkdownFile(transcriptText, getCurrentVideoTitle(), 'ExtractMD');
      showSuccessNotificationWithTokens(
        'Transcript downloaded as .md (token threshold)!',
        transcriptText
      );
      return;
    }
  }

  await copyToClipboard(transcriptText, true);
  showSuccessNotificationWithTokens('Transcript copied to clipboard!', transcriptText);
}

// Global function for watch-page extraction
export async function copyYouTubeTranscript(settings = null) {
  const mergedSettings = settings || (await getYouTubeTranscriptSettings());
  const transcriptText = await extractYouTubeTranscriptMarkdown(mergedSettings);
  await handleTranscriptOutput(transcriptText);

  await incrementKpi('youtube');
  const userSettings = await getSettings();

  if (userSettings.closeTabAfterExtraction) {
    setTimeout(() => {
      closeCurrentTab();
    }, 500);
  }

  if (mergedSettings.jumpToDomain && mergedSettings.jumpToDomainUrl) {
    chrome.runtime.sendMessage({ action: 'openNewTab', url: mergedSettings.jumpToDomainUrl });
  }
}

window.copyYouTubeTranscript = copyYouTubeTranscript;
window.extractYouTubeTranscriptMarkdown = extractYouTubeTranscriptMarkdown;
window.extractYouTubeTranscriptPayload = extractYouTubeTranscriptPayload;

export function initYouTubeFeatures() {
  chrome.storage.sync.get({ enableYouTubeIntegration: true }, (items) => {
    if (items.enableYouTubeIntegration === false) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initializeFloatingButton();
      });
    } else {
      initializeFloatingButton();
    }

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
  });
}

async function initializeFloatingButton() {
  if (
    !(
      window.location.hostname.includes('youtube.com') &&
      window.location.pathname.includes('/watch')
    )
  ) {
    return;
  }
  if (document.getElementById('extractmd-floating-button')) return;

  const buttonSettings = await new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        floatingButtonEnableDrag: true,
        floatingButtonEnableDismiss: true,
      },
      resolve
    );
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
  }
}
