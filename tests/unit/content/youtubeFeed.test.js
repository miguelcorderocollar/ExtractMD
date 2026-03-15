import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../extension/content/utils.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../../../extension/shared/icons.js', () => ({
  ICONS: {
    clipboard: '<svg></svg>',
    loading: '<svg></svg>',
    success: '<svg></svg>',
    error: '<svg></svg>',
  },
}));

import {
  isYouTubeFeedPage,
  extractYouTubeVideoIdFromUrl,
  getVideoIdFromCard,
  getVideoTitleFromCard,
} from '../../../extension/content/youtubeFeed.js';

describe('YouTube feed quick extract helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/');
  });

  it('detects supported feed routes', () => {
    expect(isYouTubeFeedPage('/')).toBe(true);
    expect(isYouTubeFeedPage('/feed/subscriptions')).toBe(true);
    expect(isYouTubeFeedPage('/playlist')).toBe(true);
    expect(isYouTubeFeedPage('/watch')).toBe(false);
  });

  it('extracts video id from absolute and relative watch URLs', () => {
    expect(extractYouTubeVideoIdFromUrl('/watch?v=abc123')).toBe('abc123');
    expect(extractYouTubeVideoIdFromUrl('https://www.youtube.com/watch?v=xyz987&t=20s')).toBe(
      'xyz987'
    );
    expect(extractYouTubeVideoIdFromUrl('https://www.youtube.com/shorts/abc123')).toBe('');
  });

  it('gets a card video id from watch links', () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="card">
        <a id="thumbnail" href="/watch?v=video001">thumb</a>
        <a id="video-title" href="/watch?v=video001">title</a>
      </ytd-rich-item-renderer>
    `;
    const card = document.getElementById('card');
    expect(getVideoIdFromCard(card)).toBe('video001');
    expect(getVideoTitleFromCard(card)).toBe('title');
  });

  it('returns empty id when card has no watch link', () => {
    document.body.innerHTML = `
      <ytd-rich-item-renderer id="card">
        <a id="thumbnail" href="/channel/my-channel">thumb</a>
      </ytd-rich-item-renderer>
    `;
    const card = document.getElementById('card');
    expect(getVideoIdFromCard(card)).toBe('');
    expect(getVideoTitleFromCard(card)).toBe('');
  });
});
