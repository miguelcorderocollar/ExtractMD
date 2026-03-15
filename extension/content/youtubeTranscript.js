import { showNotification, sleep } from './utils.js';

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

  if (!showTranscriptButton) {
    throw new Error('Show transcript button not found. This video might not have a transcript.');
  }

  showTranscriptButton.click();
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
    throw new Error('Transcript failed to load within timeout period.');
  }
}

function buildTranscriptMetadata(settings = {}) {
  if (
    !settings.addTitleToTranscript &&
    !settings.addChannelToTranscript &&
    !settings.addUrlToTranscript
  ) {
    return '';
  }

  let metadata = '';
  const titleElem = document.querySelector('div#title h1 yt-formatted-string');
  const channelElem = document.querySelector('ytd-channel-name#channel-name a');
  const title = titleElem?.textContent?.trim() || '';
  const channelName = channelElem?.textContent?.trim() || '';
  const channelUrl = channelElem
    ? channelElem.href.startsWith('http')
      ? channelElem.href
      : `${window.location.origin}${channelElem.getAttribute('href')}`
    : '';
  const videoUrl = window.location.href;

  if (settings.addTitleToTranscript && title) metadata += `# ${title}\n`;
  if (settings.addChannelToTranscript && channelName) {
    metadata += `**Channel:** [${channelName}](${channelUrl})\n`;
  }
  if (settings.addUrlToTranscript && videoUrl) metadata += `**Video URL:** ${videoUrl}\n`;

  return metadata ? `${metadata}\n` : '';
}

function formatTimestampFromMs(ms) {
  const totalSeconds = Math.floor((ms || 0) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getCaptionTrackBaseUrl() {
  const captionTracks =
    window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) return '';

  const preferredTrack = captionTracks.find((track) => track?.kind !== 'asr') || captionTracks[0];
  return preferredTrack?.baseUrl || '';
}

function normalizeCaptionEventText(event) {
  const segs = Array.isArray(event?.segs) ? event.segs : [];
  if (segs.length === 0) return '';

  return segs
    .map((seg) => seg?.utf8 || '')
    .join('')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseCaptionEvents(events = [], includeTimestamps = true) {
  if (!Array.isArray(events)) return '';

  const lines = [];
  for (const event of events) {
    const text = normalizeCaptionEventText(event);
    if (!text) continue;
    const timestamp = formatTimestampFromMs(event?.tStartMs || 0);
    lines.push(includeTimestamps ? `[${timestamp}] ${text}` : text);
  }
  return lines.join('\n').trim();
}

export async function extractTranscriptFromCaptionTrack(settings = {}) {
  const baseUrl = getCaptionTrackBaseUrl();
  if (!baseUrl) {
    throw new Error('This video has no available caption track.');
  }

  const url = new URL(baseUrl);
  url.searchParams.set('fmt', 'json3');
  const response = await fetch(url.toString(), { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to download transcript track (${response.status}).`);
  }

  const data = await response.json();
  const transcript = parseCaptionEvents(data?.events || [], settings.includeTimestamps !== false);
  if (!transcript) {
    throw new Error('Transcript track is empty.');
  }

  return transcript;
}

export function extractTranscriptText(includeTimestamps = true) {
  let transcript = '';
  const allElements = Array.from(
    document.querySelectorAll(
      'ytd-transcript-segment-renderer, ytd-transcript-section-header-renderer, transcript-segment-view-model'
    )
  );

  allElements.forEach((element) => {
    if (element.tagName === 'YTD-TRANSCRIPT-SECTION-HEADER-RENDERER') {
      const headerText = element
        .querySelector('.shelf-header-layout-wiz__title')
        ?.textContent?.trim();
      if (headerText) transcript += `\n\n## ${headerText}\n`;
      return;
    }

    if (
      element.tagName !== 'YTD-TRANSCRIPT-SEGMENT-RENDERER' &&
      element.tagName !== 'TRANSCRIPT-SEGMENT-VIEW-MODEL'
    ) {
      return;
    }

    const timestamp = element
      .querySelector('.segment-timestamp, .ytwTranscriptSegmentViewModelTimestamp')
      ?.textContent?.trim();
    const text = element
      .querySelector('.segment-text, .yt-core-attributed-string')
      ?.textContent?.trim();

    if (!text) return;
    transcript += includeTimestamps && timestamp ? `[${timestamp}] ${text}\n` : `${text}\n`;
  });

  return transcript.trim();
}

function getCurrentVideoTitle() {
  const domTitle = document.querySelector('div#title h1 yt-formatted-string')?.textContent?.trim();
  if (domTitle) return domTitle;
  return (document.title || '').replace(/\s*-\s*YouTube\s*$/i, '').trim() || 'YouTube Video';
}

async function extractTranscriptFromDom(settings = {}) {
  await expandDescription();
  await clickShowTranscript();
  await waitForTranscriptContainer();
  return extractTranscriptText(settings.includeTimestamps !== false);
}

export async function extractYouTubeTranscriptPayload(settings = {}) {
  try {
    let transcriptBody = '';
    try {
      transcriptBody = await extractTranscriptFromCaptionTrack(settings);
    } catch {
      // Fallback for edge cases where caption tracks are not directly available
      transcriptBody = await extractTranscriptFromDom(settings);
    }

    const title = getCurrentVideoTitle();
    const markdown = `${buildTranscriptMetadata(settings)}${transcriptBody}`.trim();
    return { markdown, title };
  } catch (error) {
    showNotification(
      `Error: ${error.message || 'Transcript not available for this video.'}`,
      'error',
      true
    );
    throw error;
  }
}

export async function extractYouTubeTranscriptMarkdown(settings = {}) {
  const payload = await extractYouTubeTranscriptPayload(settings);
  return payload.markdown;
}
