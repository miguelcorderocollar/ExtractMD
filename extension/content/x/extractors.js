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
