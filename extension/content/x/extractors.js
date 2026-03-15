import { DEFAULTS } from '../../shared/defaults.js';
import { isXArticlePage } from './detection.js';
import { findPrimaryXContainer } from './container.js';
import {
  toAbsoluteUrl,
  normalizeWhitespace,
  normalizeMarkdownBlock,
  renderInlineMarkdown,
  renderBlockMarkdown,
} from './markdown-renderer.js';

const X_SETTINGS_DEFAULTS = {
  xIncludeImages: DEFAULTS.xIncludeImages,
  xIncludeVideos: DEFAULTS.xIncludeVideos,
  xIncludeCards: DEFAULTS.xIncludeCards,
  xIncludeQuotes: DEFAULTS.xIncludeQuotes,
  xIncludeUrl: DEFAULTS.xIncludeUrl,
  xIncludeMetricsContext: DEFAULTS.xIncludeMetricsContext,
};

export { X_SETTINGS_DEFAULTS };

function hasTweetAncestor(node, rootTweet) {
  if (!rootTweet || rootTweet.getAttribute('data-testid') !== 'tweet') return false;
  const nearestTweet = node.closest('article[data-testid="tweet"]');
  return Boolean(nearestTweet && nearestTweet !== rootTweet);
}

function extractUserMeta(container) {
  const userNameBlock = container.querySelector('[data-testid="User-Name"]');
  if (!userNameBlock) {
    return { displayName: '', handle: '' };
  }

  const profileLink = userNameBlock.querySelector('a[href^="/"]');
  const displayName = normalizeWhitespace(profileLink?.textContent || '');

  let handle = '';
  const handleFromText = userNameBlock.textContent?.match(/@\w{1,15}/)?.[0] || '';
  if (handleFromText) {
    handle = handleFromText;
  } else if (profileLink) {
    const match = profileLink.getAttribute('href')?.match(/^\/([A-Za-z0-9_]+)$/);
    if (match) {
      handle = `@${match[1]}`;
    }
  }

  return { displayName, handle };
}

function extractDate(container) {
  const timeNode = container.querySelector('time');
  if (!timeNode) return '';
  return timeNode.getAttribute('datetime') || normalizeWhitespace(timeNode.textContent || '');
}

function extractPermalink() {
  const match = window.location.pathname.match(/^\/[^/]+\/status\/\d+/);
  if (match) {
    return new URL(match[0], window.location.origin).href;
  }
  return window.location.origin + window.location.pathname;
}

function getTextContainers(container) {
  const richText = container.querySelector('[data-testid="longformRichTextComponent"]');
  if (richText) {
    const contentsDiv = richText.querySelector('[data-contents="true"]');
    if (contentsDiv) {
      return Array.from(contentsDiv.children);
    }
  }

  const tweetTextNodes = Array.from(container.querySelectorAll('[data-testid="tweetText"]')).filter(
    (node) => !hasTweetAncestor(node, container)
  );
  if (tweetTextNodes.length > 0) return tweetTextNodes;

  const articleBody = container.querySelector('[data-testid="articleBody"]');
  if (articleBody) {
    return Array.from(
      articleBody.querySelectorAll('h1, h2, h3, p, li, blockquote, pre, code, img')
    );
  }

  return Array.from(container.querySelectorAll('p, h1, h2, h3, li, blockquote, pre, code, img'));
}

function extractMainBodyMarkdown(container) {
  const blocks = getTextContainers(container)
    .map((node) => renderBlockMarkdown(node))
    .map((text) => normalizeMarkdownBlock(text))
    .filter(Boolean);
  return blocks.join('\n\n').trim();
}

function extractImageMarkdown(container) {
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

function extractMarkdownImageUrl(markdownImage) {
  const match = markdownImage.match(/!\[[^\]]*]\(([^)]+)\)/);
  return match?.[1] || '';
}

function extractHeaderImageMarkdown(container) {
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

function extractMediaBullets(container, permalink = '') {
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
  if (hasVideo) {
    if (videoUrls.size === 0) {
      const fallbackLink = permalink || extractPermalink();
      bullets.push({
        type: 'video',
        markdown: fallbackLink
          ? `- [Video attached on X](${fallbackLink})`
          : '- Video attached on X',
      });
    }
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

function extractQuotedMarkdown(container) {
  const quotes = Array.from(container.querySelectorAll('article[data-testid="tweet"]')).filter(
    (quote) => {
      if (quote === container) return false;
      const nearestParentTweet = quote.parentElement?.closest('article[data-testid="tweet"]');
      return nearestParentTweet === container;
    }
  );

  if (quotes.length === 0) return '';

  const quoteBlocks = quotes
    .map((quote) => {
      const { displayName, handle } = extractUserMeta(quote);
      const quoteTextNodes = Array.from(quote.querySelectorAll('[data-testid="tweetText"]')).filter(
        (node) => !hasTweetAncestor(node, quote)
      );
      const quoteText = normalizeWhitespace(
        quoteTextNodes.map((node) => renderInlineMarkdown(node)).join(' ')
      );

      if (!quoteText) return '';

      const author = handle || displayName || '@unknown';
      const lines = [
        `> Quoted post by ${author}`,
        ...quoteText.split('\n').map((line) => `> ${normalizeWhitespace(line)}`),
      ];
      return lines.join('\n');
    })
    .filter(Boolean);

  return quoteBlocks.join('\n\n');
}

function normalizeMetricValue(value) {
  return normalizeWhitespace(value).replace(/\s+/g, '');
}

function parseMetricsFromText(text) {
  if (!text) return {};

  const normalizedText = normalizeWhitespace(text);
  const patterns = [
    {
      key: 'comments',
      label: 'Comments',
      regex: /([\d.,]+(?:\s?[kKmMbB])?)\s+(?:repl(?:y|ies)|comments?)\b/i,
    },
    { key: 'reposts', label: 'Reposts', regex: /([\d.,]+(?:\s?[kKmMbB])?)\s+reposts?\b/i },
    { key: 'likes', label: 'Likes', regex: /([\d.,]+(?:\s?[kKmMbB])?)\s+likes?\b/i },
    { key: 'bookmarks', label: 'Bookmarks', regex: /([\d.,]+(?:\s?[kKmMbB])?)\s+bookmarks?\b/i },
    { key: 'views', label: 'Views', regex: /([\d.,]+(?:\s?[kKmMbB])?)\s+views?\b/i },
  ];

  const parsed = {};
  patterns.forEach(({ key, label, regex }) => {
    const match = normalizedText.match(regex);
    if (match?.[1]) {
      parsed[key] = { label, value: normalizeMetricValue(match[1]) };
    }
  });

  return parsed;
}

function extractMetricsContext(container) {
  const keywordRegex = /\b(repl(?:y|ies)|comments?|reposts?|likes?|bookmarks?|views?)\b/gi;

  const groupCandidates = Array.from(container.querySelectorAll('[role="group"][aria-label]'))
    .map((node) => normalizeWhitespace(node.getAttribute('aria-label') || ''))
    .filter(Boolean);

  const scoredCandidate = groupCandidates
    .map((text) => {
      const matches = text.match(keywordRegex);
      return { text, score: matches ? matches.length : 0 };
    })
    .sort((a, b) => b.score - a.score)[0];

  const parsedFromGroup =
    scoredCandidate && scoredCandidate.score > 0 ? parseMetricsFromText(scoredCandidate.text) : {};

  const parsedFromButtons = {};
  Array.from(container.querySelectorAll('button[aria-label], a[aria-label]')).forEach((node) => {
    const ariaLabel = normalizeWhitespace(node.getAttribute('aria-label') || '');
    if (!ariaLabel) return;
    const parsed = parseMetricsFromText(ariaLabel);
    Object.entries(parsed).forEach(([key, value]) => {
      if (!parsedFromButtons[key]) {
        parsedFromButtons[key] = value;
      }
    });
  });

  const merged = {
    comments: parsedFromGroup.comments || parsedFromButtons.comments,
    reposts: parsedFromGroup.reposts || parsedFromButtons.reposts,
    likes: parsedFromGroup.likes || parsedFromButtons.likes,
    bookmarks: parsedFromGroup.bookmarks || parsedFromButtons.bookmarks,
    views: parsedFromGroup.views || parsedFromButtons.views,
  };

  return Object.values(merged).filter(Boolean);
}

function getTitleFromContent(container, bodyMarkdown) {
  const articleTitle = container.querySelector('[data-testid="twitter-article-title"]');
  if (articleTitle?.textContent?.trim()) {
    return normalizeWhitespace(articleTitle.textContent);
  }

  const articleHeading = container.querySelector('h1');
  if (articleHeading?.textContent?.trim()) {
    return normalizeWhitespace(articleHeading.textContent);
  }

  const firstLine = bodyMarkdown
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .find(Boolean);
  if (firstLine) {
    const withoutLinks = firstLine.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    const firstSentenceMatch = withoutLinks.match(/^.{1,140}?[.!?](?:\s|$)/);
    return (firstSentenceMatch ? firstSentenceMatch[0] : withoutLinks).trim();
  }

  return normalizeWhitespace(document.title || 'X Content');
}

function isLongformPost(container) {
  return Boolean(
    container.querySelector(
      '[data-testid="twitter-article-title"], [data-testid="longformRichTextComponent"]'
    )
  );
}

export function extractXMarkdown(settings = {}) {
  const effectiveSettings = { ...X_SETTINGS_DEFAULTS, ...settings };
  const container = findPrimaryXContainer(document);

  if (!container) {
    throw new Error('No X post/article container found on this page.');
  }

  const { displayName, handle } = extractUserMeta(container);
  const date = extractDate(container);
  const link = extractPermalink();
  const bodyMarkdown = extractMainBodyMarkdown(container);
  const title = getTitleFromContent(container, bodyMarkdown);
  const isLongformContent = isXArticlePage() || isLongformPost(container);
  const includeTitleHeading = isLongformContent;
  const headerImageMarkdown =
    effectiveSettings.xIncludeImages && isLongformContent
      ? extractHeaderImageMarkdown(container)
      : '';

  let markdown = includeTitleHeading ? `# ${title}\n\n` : '';
  if (headerImageMarkdown) {
    markdown += `${headerImageMarkdown}\n\n`;
  }

  if (displayName || handle) {
    const author = handle ? `${displayName || handle} (${handle})` : displayName;
    markdown += `**Author:** ${author}\n`;
  }
  if (date) {
    markdown += `**Date:** ${date}\n`;
  }
  if (effectiveSettings.xIncludeUrl && link) {
    markdown += `**Link:** ${link}\n`;
  }
  if (effectiveSettings.xIncludeMetricsContext) {
    const metrics = extractMetricsContext(container);
    markdown += `- **Extracted At:** ${new Date().toISOString()}\n`;
    metrics.forEach(({ label, value }) => {
      markdown += `- **${label}:** ${value}\n`;
    });
    markdown += '\n';
  }
  markdown += '\n---\n\n';

  if (bodyMarkdown) {
    markdown += `${bodyMarkdown}\n\n`;
  }

  if (effectiveSettings.xIncludeImages) {
    const images = extractImageMarkdown(container);
    const inlineImageUrls = new Set(
      Array.from(bodyMarkdown.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)).map((match) => match[1])
    );
    const headerImageUrl = extractMarkdownImageUrl(headerImageMarkdown);
    const nonInlineImages = images.filter((imageMarkdown) => {
      const imageUrl = extractMarkdownImageUrl(imageMarkdown);
      if (!imageUrl) return true;
      if (inlineImageUrls.has(imageUrl)) return false;
      if (headerImageUrl && imageUrl === headerImageUrl) return false;
      return true;
    });
    if (nonInlineImages.length > 0) {
      markdown += `### Images\n\n${nonInlineImages.join('\n\n')}\n\n`;
    }
  }

  if (effectiveSettings.xIncludeVideos || effectiveSettings.xIncludeCards) {
    const mediaBullets = extractMediaBullets(container, link)
      .filter((bullet) => {
        if (bullet.type === 'video') return effectiveSettings.xIncludeVideos;
        if (bullet.type === 'card') return effectiveSettings.xIncludeCards;
        return true;
      })
      .map((bullet) => bullet.markdown);
    if (mediaBullets.length > 0) {
      markdown += `### Media\n\n${mediaBullets.join('\n')}\n\n`;
    }
  }

  if (effectiveSettings.xIncludeQuotes) {
    const quoteMarkdown = extractQuotedMarkdown(container);
    if (quoteMarkdown) {
      markdown += `### Quotes\n\n${quoteMarkdown}\n\n`;
    }
  }

  return {
    markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
    title,
    displayName,
    handle,
    date,
    link,
  };
}
