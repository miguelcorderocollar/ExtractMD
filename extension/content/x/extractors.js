import { DEFAULTS } from '../../shared/defaults.js';
import { isXArticlePage } from './detection.js';
import { findPrimaryXContainer } from './container.js';
import {
  extractUserMeta,
  extractDate,
  extractPermalink,
  extractMetricsContext,
  getTitleFromContent,
  isLongformPost,
} from './metadata.js';
import { extractMainBodyMarkdown } from './body.js';
import {
  extractImageMarkdown,
  extractMarkdownImageUrl,
  extractHeaderImageMarkdown,
  extractMediaBullets,
} from './media.js';
import { extractQuotedMarkdown } from './quotes.js';

const X_SETTINGS_DEFAULTS = {
  xIncludeImages: DEFAULTS.xIncludeImages,
  xIncludeVideos: DEFAULTS.xIncludeVideos,
  xIncludeCards: DEFAULTS.xIncludeCards,
  xIncludeQuotes: DEFAULTS.xIncludeQuotes,
  xIncludeUrl: DEFAULTS.xIncludeUrl,
  xIncludeMetricsContext: DEFAULTS.xIncludeMetricsContext,
};

export { X_SETTINGS_DEFAULTS };

function toMetricVariables(metrics) {
  const metricVariables = {
    comments: '',
    reposts: '',
    likes: '',
    bookmarks: '',
    views: '',
  };

  metrics.forEach(({ label, value }) => {
    const key = String(label || '')
      .trim()
      .toLowerCase();
    if (key === 'comments') metricVariables.comments = value;
    if (key === 'reposts') metricVariables.reposts = value;
    if (key === 'likes') metricVariables.likes = value;
    if (key === 'bookmarks') metricVariables.bookmarks = value;
    if (key === 'views') metricVariables.views = value;
  });

  return metricVariables;
}

function parseCompactMetricNumber(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/,/g, '');
  if (!normalized) return 0;

  const match = normalized.match(/^(\d+(?:\.\d+)?)([kKmMbB])?$/);
  if (!match) return 0;

  const base = Number.parseFloat(match[1]);
  if (Number.isNaN(base)) return 0;

  const suffix = match[2] ? match[2].toLowerCase() : '';
  const multiplier =
    suffix === 'k' ? 1_000 : suffix === 'm' ? 1_000_000 : suffix === 'b' ? 1_000_000_000 : 1;
  return Math.round(base * multiplier);
}

export function buildXApiVariables({
  title,
  displayName,
  handle,
  date,
  link,
  bodyMarkdown,
  metricVariables,
}) {
  const author = handle ? `${displayName || handle} (${handle})` : displayName || handle || '';

  return {
    title: title || '',
    author,
    display_name: displayName || '',
    handle: handle || '',
    date: date || '',
    link: link || '',
    content: bodyMarkdown || '',
    comments: parseCompactMetricNumber(metricVariables.comments),
    reposts: parseCompactMetricNumber(metricVariables.reposts),
    likes: parseCompactMetricNumber(metricVariables.likes),
    bookmarks: parseCompactMetricNumber(metricVariables.bookmarks),
    views: parseCompactMetricNumber(metricVariables.views),
    comments_text: metricVariables.comments || '',
    reposts_text: metricVariables.reposts || '',
    likes_text: metricVariables.likes || '',
    bookmarks_text: metricVariables.bookmarks || '',
    views_text: metricVariables.views || '',
    extracted_at: new Date().toISOString(),
  };
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
  const metrics = extractMetricsContext(container);
  const metricVariables = toMetricVariables(metrics);
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

  const apiVariables = buildXApiVariables({
    title,
    displayName,
    handle,
    date,
    link,
    bodyMarkdown,
    metricVariables,
  });

  return {
    markdown: markdown.replace(/\n{3,}/g, '\n\n').trim(),
    title,
    displayName,
    handle,
    date,
    link,
    bodyMarkdown,
    metrics,
    metricVariables,
    apiVariables,
  };
}
