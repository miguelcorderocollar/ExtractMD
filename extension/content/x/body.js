import { normalizeMarkdownBlock, renderBlockMarkdown } from './markdown-renderer.js';
import { isQuotedContextNode, renderTweetTextMarkdown } from './helpers.js';

function getTextContainers(container) {
  const richText = container.querySelector('[data-testid="longformRichTextComponent"]');
  if (richText) {
    const contentsDiv = richText.querySelector('[data-contents="true"]');
    if (contentsDiv) {
      return Array.from(contentsDiv.children);
    }
  }

  const tweetTextNodes = Array.from(container.querySelectorAll('[data-testid="tweetText"]')).filter(
    (node) => !isQuotedContextNode(node, container)
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

export function extractMainBodyMarkdown(container) {
  const blocks = getTextContainers(container)
    .map((node) => {
      const isTweetTextNode =
        node?.nodeType === Node.ELEMENT_NODE && node.getAttribute('data-testid') === 'tweetText';
      if (isTweetTextNode) {
        return renderTweetTextMarkdown(node);
      }
      return normalizeMarkdownBlock(renderBlockMarkdown(node));
    })
    .filter(Boolean);
  return blocks.join('\n\n').trim();
}
