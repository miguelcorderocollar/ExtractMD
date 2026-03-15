import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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

vi.mock('../../../extension/content/utils.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('../../../extension/content/handlers/copyHandler.js', () => ({
  handleCopyOrDownload: vi.fn().mockResolvedValue({ action: 'copy', tokens: 42 }),
}));

import {
  isXPostPage,
  isXArticlePage,
  findPrimaryXContainer,
  waitForPrimaryXContainer,
  extractXMarkdown,
} from '../../../extension/content/x.js';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/x');

const loadFixture = (name) => {
  document.body.innerHTML = readFileSync(join(fixtureDir, name), 'utf8');
};

describe('X content extractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.pushState({}, '', '/home');
  });

  it('detects X post and article routes', () => {
    expect(isXPostPage('/writer/status/123456')).toBe(true);
    expect(isXPostPage('/i/web/status/123456')).toBe(true);
    expect(isXPostPage('/home')).toBe(false);

    expect(isXArticlePage('/i/articles/987654')).toBe(true);
    expect(isXArticlePage('/i/articles/how-to-build-ai-workflows')).toBe(true);
    expect(isXArticlePage('/writer/status/123456')).toBe(false);
  });

  it('finds the primary post container for the current status URL', () => {
    loadFixture('post-basic.html');
    window.history.pushState({}, '', '/writer_one/status/9000000000000000001');

    const container = findPrimaryXContainer(document);
    expect(container).toBeTruthy();
    expect(container.id).toBe('main-post');
  });

  it('waits for the primary container to appear', async () => {
    window.history.pushState({}, '', '/writer_one/status/9000000000000000001');

    const pendingContainer = waitForPrimaryXContainer({ timeoutMs: 200 });
    setTimeout(() => {
      loadFixture('post-basic.html');
    }, 10);

    const container = await pendingContainer;
    expect(container).toBeTruthy();
    expect(container.id).toBe('main-post');
  });

  it('times out when waiting for a primary container', async () => {
    window.history.pushState({}, '', '/writer_one/status/9000000000000000001');

    const container = await waitForPrimaryXContainer({ timeoutMs: 30 });
    expect(container).toBeNull();
  });

  it('extracts metadata and markdown body from a standard post', () => {
    loadFixture('post-basic.html');
    window.history.pushState({}, '', '/writer_one/status/9000000000000000001');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.title).toBe('Building in public with markdown extraction.');
    expect(result.handle).toBe('@writer_one');
    expect(result.link).toBe(`${window.location.origin}/writer_one/status/9000000000000000001`);
    expect(result.markdown).not.toContain('# Building in public with markdown extraction.');
    expect(result.markdown).toContain('**Author:** Writer One (@writer_one)');
    expect(result.markdown).toContain('**Date:** 2026-01-17T12:34:56.000Z');
    expect(result.markdown).toContain('[Read more](https://example.com/post)');
    expect(result.markdown).not.toContain('This is a reply and should not be extracted.');
  });

  it('extracts rich media placeholders and quoted post markdown', () => {
    loadFixture('post-media-quote.html');
    window.history.pushState({}, '', '/creator_dev/status/9000000000000000002');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.markdown).toContain(
      '![Architecture sketch](https://pbs.twimg.com/media/example-one.jpg)'
    );
    expect(result.markdown).toContain(
      '![State transitions](https://pbs.twimg.com/media/example-two.jpg)'
    );
    expect(result.markdown).toContain(
      `- [Video attached on X](${window.location.origin}/creator_dev/status/9000000000000000002)`
    );
    expect(result.markdown).toContain('- [Launch note](https://example.com/launch-note)');
    expect(result.markdown).toContain('> Quoted post by @quoted_author');
    expect(result.markdown).toContain('> Quoted context that should render as blockquote text.');
  });

  it('scopes quote-card text and appends original post reference when available', () => {
    loadFixture('post-quote-reference.html');
    window.history.pushState({}, '', '/levelsio/status/2032923328181350415');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.date).toBe('2026-03-14T20:54:25.000Z');
    expect(result.markdown).toContain('I asked AI:');
    expect(result.markdown).toContain(
      '\n\nWho benefits financially if Europe brings in low/no income low educated non-culturally aligned welfare seekers from the third world?'
    );
    expect(result.markdown).toContain('\n\n1. Employers in low-wage sectors');
    expect(result.markdown).toContain(
      '\n- Construction, agriculture, food processing, cleaning, logistics'
    );
    expect(result.markdown).toContain('\n\nWho Bears the Costs');
    expect(result.markdown).not.toContain('&ZeroWidthSpace;');
    expect(result.markdown).toContain('### Quotes');
    expect(result.markdown).toContain('> Quoted post by @hispanicnomad');
    expect(result.markdown).toContain(
      "It's crazy because every time it looks like a European country is reclaiming its sanity."
    );
    expect(result.markdown).toContain('> They pull something like this off.');
    expect(result.markdown).toContain("> What's the reasoning behind this?");
    expect(result.markdown).not.toContain('[Original post](');

    const [beforeQuotesSection] = result.markdown.split('### Quotes');
    expect(beforeQuotesSection).not.toContain(
      "It's crazy because every time it looks like a European country is reclaiming its sanity."
    );
  });

  it('treats role-link quote cards without aria quote labels as quotes', () => {
    loadFixture('post-quote-role-link.html');
    window.history.pushState({}, '', '/levelsio/status/2032923328181350415');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.markdown).toContain('Main post body should stay separate from quote text.');
    expect(result.markdown).toContain('### Quotes');
    expect(result.markdown).toContain('> Quoted post by @hispanicnomad');
    expect(result.markdown).toContain('> Quote text should render in quote section, not body.');
    expect(result.markdown).not.toContain('[Original post](');

    const [beforeQuotesSection] = result.markdown.split('### Quotes');
    expect(beforeQuotesSection).not.toContain(
      'Quote text should render in quote section, not body.'
    );
  });

  it('falls back to permalink and poster thumbnail for blob-backed videos', () => {
    loadFixture('post-video-blob.html');
    window.history.pushState({}, '', '/video_author/status/9000000000000000004');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.markdown).toContain(
      `- [Video attached on X](${window.location.origin}/video_author/status/9000000000000000004)`
    );
    expect(result.markdown).toContain(
      'https://pbs.twimg.com/ext_tw_video_thumb/9000000000000000099/pu/img/sample-video-thumb.jpg'
    );
    expect(result.markdown).not.toContain(
      'blob:https://x.com/00000000-0000-4000-8000-000000000000'
    );
  });

  it('extracts long-form article body and title from article routes', () => {
    loadFixture('article-longform.html');
    window.history.pushState({}, '', '/i/articles/9000000000000000010');

    const result = extractXMarkdown({
      xIncludeImages: true,
      xIncludeVideos: true,
      xIncludeCards: true,
      xIncludeQuotes: true,
      xIncludeUrl: true,
      xIncludeMetricsContext: false,
    });

    expect(result.title).toBe('Designing resilient parsers for social content');
    expect(result.handle).toBe('@longform_author');
    expect(result.markdown).toContain(
      '![Hero image](https://pbs.twimg.com/media/article-hero.jpg)'
    );
    expect(result.markdown).toContain('Long-form articles on X can include paragraphs');
    expect(result.markdown).toContain('[this guide](https://example.com/guide)');
    expect(result.markdown).toContain(
      '![Longform diagram](https://pbs.twimg.com/media/article-image.jpg)'
    );
  });

  it('honors X content toggles for media, quotes, and URL', () => {
    loadFixture('post-media-quote.html');
    window.history.pushState({}, '', '/creator_dev/status/9000000000000000002');

    const result = extractXMarkdown({
      xIncludeImages: false,
      xIncludeVideos: false,
      xIncludeCards: false,
      xIncludeQuotes: false,
      xIncludeUrl: false,
      xIncludeMetricsContext: false,
    });

    expect(result.markdown).not.toContain('![Architecture sketch]');
    expect(result.markdown).not.toContain('Video attached on X');
    expect(result.markdown).not.toContain('Launch note');
    expect(result.markdown).not.toContain('Quoted post by');
    expect(result.markdown).not.toContain('**Link:**');
  });

  it('appends metrics context after metadata when enabled', () => {
    loadFixture('post-basic.html');
    window.history.pushState({}, '', '/writer_one/status/9000000000000000001');

    const result = extractXMarkdown({
      xIncludeMetricsContext: true,
    });

    expect(result.markdown).not.toContain('### Metrics Context');
    const linkIndex = result.markdown.indexOf('**Link:**');
    const extractedAtIndex = result.markdown.indexOf('- **Extracted At:**');
    expect(linkIndex).toBeGreaterThan(-1);
    expect(extractedAtIndex).toBeGreaterThan(linkIndex);
    expect(result.markdown).toContain('- **Extracted At:**');
    expect(result.markdown).toContain('- **Comments:** 123');
    expect(result.markdown).toContain('- **Reposts:** 456');
    expect(result.markdown).toContain('- **Likes:** 789');
    expect(result.markdown).toContain('- **Bookmarks:** 10');
    expect(result.markdown).toContain('- **Views:** 1112');
  });
});
