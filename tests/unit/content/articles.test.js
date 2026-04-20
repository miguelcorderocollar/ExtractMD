import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('../../../extension/shared/storage.js', () => ({
  incrementKpi: vi.fn(),
}));

vi.mock('../../../extension/content/utils.js', () => ({
  copyToClipboard: vi.fn(),
  showNotification: vi.fn(),
  getSettings: vi.fn().mockResolvedValue({}),
  closeCurrentTab: vi.fn(),
  downloadMarkdownFile: vi.fn(),
  showSuccessNotificationWithTokens: vi.fn(),
}));

vi.mock('../../../extension/content/components/FloatingButton.js', () => ({
  createFloatingButton: vi.fn(() => ({
    appendTo: vi.fn(),
    show: vi.fn(),
    remove: vi.fn(),
    setLoading: vi.fn(),
    setSuccess: vi.fn(),
    setError: vi.fn(),
    setNormal: vi.fn(),
  })),
}));

vi.mock('gpt-tokenizer', () => ({
  encode: vi.fn((text) => ({ length: Math.ceil(text.length / 4) })),
}));

import { nodeToMarkdown } from '../../../extension/content/articles.js';

describe('Article markdown image handling', () => {
  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com/articles/post.html',
    });
    global.document = dom.window.document;
    global.window = dom.window;
    global.Node = dom.window.Node;
  });

  it('omits embedded data images', () => {
    const img = document.createElement('img');
    img.setAttribute('alt', 'Embedded chart');
    img.setAttribute('src', `data:image/png;base64,${'A'.repeat(200)}`);

    expect(nodeToMarkdown(img, true)).toBe('');
  });

  it('keeps linked images and resolves relative URLs', () => {
    const img = document.createElement('img');
    img.setAttribute('alt', 'Linked chart');
    img.setAttribute('src', '/images/chart.png');

    expect(nodeToMarkdown(img, true)).toBe(
      '![Linked chart](https://example.com/images/chart.png)\n\n'
    );
  });
});
