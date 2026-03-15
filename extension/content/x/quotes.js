import {
  hasTweetAncestor,
  findNearestQuoteCard,
  collectQuoteCards,
  renderTweetTextMarkdown,
} from './helpers.js';
import { extractUserMeta } from './metadata.js';

export function extractQuotedMarkdown(container) {
  const nestedTweetQuotes = Array.from(
    container.querySelectorAll('article[data-testid="tweet"]')
  ).filter((quote) => {
    if (quote === container) return false;
    const nearestParentTweet = quote.parentElement?.closest('article[data-testid="tweet"]');
    return nearestParentTweet === container;
  });

  const quoteCards = collectQuoteCards(container);

  if (nestedTweetQuotes.length === 0 && quoteCards.length === 0) return '';

  const nestedTweetQuoteBlocks = nestedTweetQuotes
    .map((quote) => {
      const { displayName, handle } = extractUserMeta(quote);
      const quoteTextNodes = Array.from(quote.querySelectorAll('[data-testid="tweetText"]')).filter(
        (node) => !hasTweetAncestor(node, quote)
      );
      const quoteText = quoteTextNodes
        .map((node) => renderTweetTextMarkdown(node))
        .join('\n\n')
        .trim();

      if (!quoteText) return '';

      const author = handle || displayName || '@unknown';
      const lines = [
        `> Quoted post by ${author}`,
        ...quoteText.split('\n').map((line) => (line ? `> ${line}` : '>')),
      ];
      return lines.join('\n');
    })
    .filter(Boolean);

  const quoteCardBlocks = quoteCards
    .map((quoteCard) => {
      const { displayName, handle } = extractUserMeta(quoteCard);
      const quoteTextNodes = Array.from(
        quoteCard.querySelectorAll('[data-testid="tweetText"]')
      ).filter((node) => findNearestQuoteCard(node, container) === quoteCard);
      const quoteText = quoteTextNodes
        .map((node) => renderTweetTextMarkdown(node))
        .join('\n\n')
        .trim();
      if (!quoteText) return '';

      const author = handle || displayName || '@unknown';
      const lines = [
        `> Quoted post by ${author}`,
        ...quoteText.split('\n').map((line) => (line ? `> ${line}` : '>')),
      ];
      return lines.join('\n');
    })
    .filter(Boolean);

  return [...nestedTweetQuoteBlocks, ...quoteCardBlocks].join('\n\n');
}
