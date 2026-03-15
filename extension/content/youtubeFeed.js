import { showNotification } from './utils.js';
import { ICONS } from '../shared/icons.js';

const FEED_BUTTON_CLASS = 'extractmd-yt-feed-button';
const FEED_CARD_SELECTOR = [
  'ytd-rich-item-renderer',
  'ytd-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-playlist-video-renderer',
].join(', ');

let feedObserver = null;
let scanTimer = null;
let feedQuickExtractEnabled = false;

function injectFeedButtonStyles() {
  if (document.getElementById('extractmd-yt-feed-button-styles')) return;
  const style = document.createElement('style');
  style.id = 'extractmd-yt-feed-button-styles';
  style.textContent = `
    .${FEED_BUTTON_CLASS} {
      width: 28px;
      height: 28px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.35);
      color: rgba(226, 232, 240, 0.82);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 160ms ease;
      margin-right: 6px;
      opacity: 0.78;
      padding: 0;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      box-sizing: border-box;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .${FEED_BUTTON_CLASS}:hover {
      opacity: 1;
      border-color: rgba(45, 212, 191, 0.6);
      color: rgba(45, 212, 191, 0.95);
      background: rgba(20, 184, 166, 0.18);
    }
    .${FEED_BUTTON_CLASS} svg {
      width: 14px !important;
      height: 14px !important;
      display: block;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

export function isYouTubeFeedPage(pathname = window.location.pathname) {
  return pathname === '/' || pathname === '/feed/subscriptions' || pathname === '/playlist';
}

export function extractYouTubeVideoIdFromUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.searchParams.get('v') || '';
  } catch {
    return '';
  }
}

export function getVideoIdFromCard(card) {
  if (!card) return '';
  const links = card.querySelectorAll('a[href*="/watch?v="]');
  for (const link of links) {
    const videoId = extractYouTubeVideoIdFromUrl(link.getAttribute('href') || link.href);
    if (videoId) return videoId;
  }
  return '';
}

export function getVideoTitleFromCard(card) {
  if (!card) return '';
  const titleNode =
    card.querySelector('#video-title') ||
    card.querySelector('.yt-lockup-metadata-view-model__title') ||
    card.querySelector('[title][href*="/watch?v="]');
  const title =
    titleNode?.getAttribute('title') ||
    titleNode?.getAttribute('aria-label') ||
    titleNode?.textContent?.trim() ||
    '';
  return title.trim();
}

function getCardButtonContainer(card) {
  return (
    card.querySelector('#menu') ||
    card.querySelector('ytd-menu-renderer') ||
    card.querySelector('.yt-lockup-metadata-view-model__menu-button') ||
    card.querySelector('.yt-lockup-view-model__metadata') ||
    card.querySelector('.yt-lockup-metadata-view-model__text-container') ||
    card.querySelector('#meta') ||
    card
  );
}

function createFeedButton(videoId) {
  injectFeedButtonStyles();
  const button = document.createElement('button');
  button.type = 'button';
  button.className = FEED_BUTTON_CLASS;
  button.dataset.videoId = videoId;
  button.title = 'Extract transcript with ExtractMD (coming soon)';
  button.setAttribute('aria-label', 'Extract transcript with ExtractMD (coming soon)');
  button.innerHTML = ICONS.clipboard;
  return button;
}

function handleFeedButtonClick() {
  showNotification(
    'Feed transcript extraction is coming soon! For now, open the video and use the floating button.',
    'info'
  );
}

function placeButtonInContainer(container, button) {
  if (!container) return;
  if (
    container.matches('#menu') ||
    container.matches('ytd-menu-renderer') ||
    container.classList.contains('yt-lockup-metadata-view-model__menu-button')
  ) {
    container.prepend(button);
    return;
  }
  if (container.classList.contains('yt-lockup-metadata-view-model__text-container')) {
    const metadataRow = container.querySelector('.yt-lockup-metadata-view-model__metadata');
    if (metadataRow) {
      metadataRow.prepend(button);
      return;
    }
  }
  container.appendChild(button);
}

function attachButtonToCard(card) {
  if (!card || card.querySelector(`.${FEED_BUTTON_CLASS}`)) return;
  const videoId = getVideoIdFromCard(card);
  if (!videoId) return;

  const container = getCardButtonContainer(card);
  if (!container) return;

  const button = createFeedButton(videoId);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleFeedButtonClick();
  });
  placeButtonInContainer(container, button);
}

function removeFeedButtons() {
  const buttons = document.querySelectorAll(`.${FEED_BUTTON_CLASS}`);
  buttons.forEach((button) => button.remove());
}

function scanFeedCards() {
  if (!feedQuickExtractEnabled) {
    removeFeedButtons();
    return;
  }

  if (!isYouTubeFeedPage()) {
    removeFeedButtons();
    return;
  }

  if (window.__extractmd_domain_ignored) {
    removeFeedButtons();
    return;
  }

  const cards = document.querySelectorAll(FEED_CARD_SELECTOR);
  cards.forEach((card) => attachButtonToCard(card));
}

function setupFeedObserver() {
  if (feedObserver) return;

  feedObserver = new MutationObserver(() => {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanFeedCards();
    }, 300);
  });

  feedObserver.observe(document.body, { childList: true, subtree: true });
}

export function initYouTubeFeedFeatures() {
  chrome.storage.sync.get(
    {
      enableYouTubeIntegration: true,
      enableYouTubeFeedQuickExtract: true,
    },
    (items) => {
      feedQuickExtractEnabled =
        items.enableYouTubeIntegration !== false && items.enableYouTubeFeedQuickExtract !== false;

      if (!feedQuickExtractEnabled) {
        removeFeedButtons();
        return;
      }

      setupFeedObserver();
      scanFeedCards();
    }
  );
}
