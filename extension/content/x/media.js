import { toAbsoluteUrl, normalizeWhitespace } from './markdown-renderer.js';
import { hasTweetAncestor } from './helpers.js';
import { extractPermalink } from './metadata.js';

export function extractImageMarkdown(container) {
  const imageNodes = Array.from(
    container.querySelectorAll(
      '[data-testid="tweetPhoto"] img[src], [data-testid="articleBody"] img[src], figure img[src], img[src*="pbs.twimg.com/media"]'
    )
  ).filter((img) => !hasTweetAncestor(img, container));

  const videoPosterNodes = Array.from(
    container.querySelectorAll('[data-testid="videoPlayer"] video[poster], video[poster]')
  ).filter((video) => !hasTweetAncestor(video, container));

  const uniqueImages = new Map();
  imageNodes.forEach((img) => {
    const src = toAbsoluteUrl(img.getAttribute('src') || '');
    if (!src || uniqueImages.has(src)) return;
    const alt = normalizeWhitespace(img.getAttribute('alt') || 'Image');
    uniqueImages.set(src, `![${alt}](${src})`);
  });

  videoPosterNodes.forEach((video) => {
    const src = toAbsoluteUrl(video.getAttribute('poster') || '');
    if (!src || uniqueImages.has(src)) return;
    const alt = normalizeWhitespace(video.getAttribute('aria-label') || 'Video thumbnail');
    uniqueImages.set(src, `![${alt}](${src})`);
  });

  return Array.from(uniqueImages.values());
}

export function extractMarkdownImageUrl(markdownImage) {
  const match = markdownImage.match(/!\[[^\]]*]\(([^)]+)\)/);
  return match?.[1] || '';
}

export function extractHeaderImageMarkdown(container) {
  const headerImageNode =
    container.querySelector(
      '[data-testid="twitterArticleReadView"] [data-testid="tweetPhoto"] img[src]'
    ) || container.querySelector('[data-testid="twitterArticleReadView"] video[poster]');

  if (!headerImageNode) return '';

  const src =
    headerImageNode.tagName.toLowerCase() === 'video'
      ? toAbsoluteUrl(headerImageNode.getAttribute('poster') || '')
      : toAbsoluteUrl(headerImageNode.getAttribute('src') || '');
  if (!src) return '';

  const rawAlt = normalizeWhitespace(
    headerImageNode.getAttribute('alt') || headerImageNode.getAttribute('aria-label') || ''
  );
  const alt = !rawAlt || /^image$/i.test(rawAlt) ? 'Hero image' : rawAlt;
  return `![${alt}](${src})`;
}

function isBlobMediaUrl(url) {
  return /^blob:/i.test(url);
}

export function extractMediaBullets(container, permalink = '') {
  const bullets = [];

  const videoNodes = Array.from(
    container.querySelectorAll('[data-testid="videoPlayer"] video, video')
  ).filter((videoNode) => !hasTweetAncestor(videoNode, container));
  const videoWrappers = Array.from(
    container.querySelectorAll('[data-testid="videoPlayer"], [data-testid="videoComponent"]')
  ).filter((videoNode) => !hasTweetAncestor(videoNode, container));

  const videoUrls = new Set();
  videoNodes.forEach((videoNode) => {
    const sourceNodes = Array.from(videoNode.querySelectorAll('source[src]'));
    const candidates = [
      videoNode.currentSrc,
      videoNode.getAttribute('src'),
      ...sourceNodes.map((sourceNode) => sourceNode.getAttribute('src')),
    ];
    candidates.forEach((candidate) => {
      const url = toAbsoluteUrl(candidate || '');
      if (!url || isBlobMediaUrl(url)) return;
      videoUrls.add(url);
    });
  });

  const hasVideo = videoNodes.length > 0 || videoWrappers.length > 0;
  videoUrls.forEach((videoUrl) => {
    bullets.push({ type: 'video', markdown: `- [Video](${videoUrl})` });
  });
  if (hasVideo && videoUrls.size === 0) {
    const fallbackLink = permalink || extractPermalink();
    bullets.push({
      type: 'video',
      markdown: fallbackLink ? `- [Video attached on X](${fallbackLink})` : '- Video attached on X',
    });
  }

  const cards = Array.from(
    container.querySelectorAll('[data-testid="card.wrapper"], [data-testid="card"]')
  ).filter((node) => !hasTweetAncestor(node, container));

  cards.forEach((card) => {
    const link = card.querySelector('a[href]');
    const href = toAbsoluteUrl(link?.getAttribute('href') || '');
    const text = normalizeWhitespace(link?.textContent || 'External card link');
    if (href) {
      bullets.push({ type: 'card', markdown: `- [${text}](${href})` });
    }
  });

  return bullets;
}
