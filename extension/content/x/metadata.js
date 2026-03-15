import { getStatusId } from './detection.js';
import { toAbsoluteUrl, normalizeWhitespace } from './markdown-renderer.js';
import { isQuotedContextNode } from './helpers.js';

export function extractUserMeta(container) {
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

function isStatusPermalink(url) {
  if (!url) return false;
  try {
    return /\/(?:i\/web\/)?status\/\d+/.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

export function extractDate(container) {
  const statusId = getStatusId();
  if (statusId) {
    const primaryStatusTimeNode = container.querySelector(
      `a[href*="/status/${statusId}"] time, a[href*="/i/web/status/${statusId}"] time`
    );
    if (primaryStatusTimeNode && !isQuotedContextNode(primaryStatusTimeNode, container)) {
      return (
        primaryStatusTimeNode.getAttribute('datetime') ||
        normalizeWhitespace(primaryStatusTimeNode.textContent || '')
      );
    }
  }

  const linkedStatusTimeNode = Array.from(container.querySelectorAll('a[href] time')).find(
    (timeNode) => {
      const parentLink = timeNode.closest('a[href]');
      const href = toAbsoluteUrl(parentLink?.getAttribute('href') || '');
      return isStatusPermalink(href) && !isQuotedContextNode(timeNode, container);
    }
  );
  if (linkedStatusTimeNode) {
    return (
      linkedStatusTimeNode.getAttribute('datetime') ||
      normalizeWhitespace(linkedStatusTimeNode.textContent || '')
    );
  }

  const timeNode = Array.from(container.querySelectorAll('time')).find(
    (candidate) => !isQuotedContextNode(candidate, container)
  );
  if (!timeNode) return '';
  return timeNode.getAttribute('datetime') || normalizeWhitespace(timeNode.textContent || '');
}

export function extractPermalink() {
  const match = window.location.pathname.match(/^\/[^/]+\/status\/\d+/);
  if (match) {
    return new URL(match[0], window.location.origin).href;
  }
  return window.location.origin + window.location.pathname;
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

export function extractMetricsContext(container) {
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

export function getTitleFromContent(container, bodyMarkdown) {
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

export function isLongformPost(container) {
  return Boolean(
    container.querySelector(
      '[data-testid="twitter-article-title"], [data-testid="longformRichTextComponent"]'
    )
  );
}
