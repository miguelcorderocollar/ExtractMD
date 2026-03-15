import { normalizeWhitespace, renderInlineMarkdown } from './markdown-renderer.js';

export function hasTweetAncestor(node, rootTweet) {
  if (!rootTweet || rootTweet.getAttribute('data-testid') !== 'tweet') return false;
  const nearestTweet = node.closest('article[data-testid="tweet"]');
  return Boolean(nearestTweet && nearestTweet !== rootTweet);
}

function getAriaLabelText(node, scopeRoot) {
  const ariaLabelledBy = node.getAttribute('aria-labelledby') || '';
  if (!ariaLabelledBy) return '';
  const doc = scopeRoot?.ownerDocument || document;
  return ariaLabelledBy
    .split(/\s+/)
    .map((id) => doc.getElementById(id))
    .filter(Boolean)
    .map((labelNode) => normalizeWhitespace(labelNode.textContent || ''))
    .filter(Boolean)
    .join(' ');
}

export function isQuoteCard(node, scopeRoot) {
  if (!node || node === scopeRoot) return false;
  const hasTweetText = Boolean(node.querySelector('[data-testid="tweetText"]'));
  if (!hasTweetText) return false;

  if (node.hasAttribute('aria-labelledby')) {
    const labelText = getAriaLabelText(node, scopeRoot);
    if (/\bquote\b/i.test(labelText)) {
      return true;
    }
  }

  // Fallback for quote cards that do not expose a "Quote" aria label in DOM/localization.
  if (node.getAttribute('role') !== 'link') return false;
  const hasUserName = Boolean(node.querySelector('[data-testid="User-Name"]'));
  if (!hasUserName) return false;
  const hasStatusSignal = Boolean(
    node.querySelector('time, a[href*="/status/"], a[href*="/i/web/status/"]')
  );
  return hasStatusSignal;
}

export function findNearestQuoteCard(node, rootTweet) {
  let current = node?.parentElement || null;
  while (current && current !== rootTweet) {
    if (isQuoteCard(current, rootTweet)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function isQuotedContextNode(node, rootTweet) {
  return hasTweetAncestor(node, rootTweet) || Boolean(findNearestQuoteCard(node, rootTweet));
}

export function collectQuoteCards(container) {
  const candidates = Array.from(container.querySelectorAll('[aria-labelledby], [role="link"]'))
    .filter((node) => isQuoteCard(node, container))
    .filter((node) => !node.querySelector('article[data-testid="tweet"]'));

  return candidates.filter(
    (node, _, all) => !all.some((other) => other !== node && node.contains(other))
  );
}

function isListLikeLine(line) {
  return /^(?:[-*+]|\d+\.)\s+/.test(line);
}

function shouldJoinWrappedLine(previousLine, nextLine) {
  if (!previousLine || !nextLine) return false;
  if (/^[-*+]\s+/.test(previousLine) && !isListLikeLine(nextLine)) return true;
  if (isListLikeLine(previousLine) || isListLikeLine(nextLine)) return false;
  if (/^>/.test(previousLine) || /^>/.test(nextLine)) return false;
  if (/[.:;!?]$/.test(previousLine)) return false;
  if (/^["'“‘(]/.test(nextLine)) return false;
  return /^[a-z0-9]/.test(nextLine);
}

function formatStructuredText(rawText) {
  const zeroWidthStripped = (rawText || '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  const normalizedLines = zeroWidthStripped
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim());

  while (normalizedLines.length > 0 && !normalizedLines[0]) normalizedLines.shift();
  while (normalizedLines.length > 0 && !normalizedLines[normalizedLines.length - 1]) {
    normalizedLines.pop();
  }

  const compactBlankLines = [];
  normalizedLines.forEach((line) => {
    if (!line) {
      if (compactBlankLines[compactBlankLines.length - 1] !== '') {
        compactBlankLines.push('');
      }
      return;
    }
    compactBlankLines.push(line);
  });

  const mergedWrappedLines = [];
  compactBlankLines.forEach((line) => {
    if (!line) {
      if (mergedWrappedLines[mergedWrappedLines.length - 1] !== '') {
        mergedWrappedLines.push('');
      }
      return;
    }

    const previousLine = mergedWrappedLines[mergedWrappedLines.length - 1] || '';
    if (previousLine && shouldJoinWrappedLine(previousLine, line)) {
      mergedWrappedLines[mergedWrappedLines.length - 1] = `${previousLine} ${line}`;
      return;
    }

    mergedWrappedLines.push(line);
  });

  return mergedWrappedLines.join('\n').trim();
}

export function renderTweetTextMarkdown(node) {
  const rawMarkdown = Array.from(node.childNodes)
    .map((childNode) => renderInlineMarkdown(childNode))
    .join('');
  return formatStructuredText(rawMarkdown);
}
