import { isXArticlePage, getStatusId, isTopLevelTweet } from './detection.js';

export function findPrimaryXContainer(doc = document) {
  if (isXArticlePage()) {
    return (
      doc.querySelector('article[data-testid="article"]') ||
      doc.querySelector('main article[data-testid="article"]') ||
      doc.querySelector('article[data-testid="tweet"]') ||
      doc.querySelector('article[role="article"]') ||
      doc.querySelector('article')
    );
  }

  const statusId = getStatusId();
  const tweetArticles = Array.from(
    doc.querySelectorAll('article[data-testid="tweet"], article[role="article"]')
  ).filter(isTopLevelTweet);

  if (statusId) {
    const matched = tweetArticles.find((article) =>
      article.querySelector(`a[href*="/status/${statusId}"], a[href*="/i/web/status/${statusId}"]`)
    );
    if (matched) return matched;
  }

  return tweetArticles[0] || null;
}

export function waitForPrimaryXContainer({ timeoutMs = 7000 } = {}) {
  const existingContainer = findPrimaryXContainer(document);
  if (existingContainer) {
    return Promise.resolve(existingContainer);
  }

  return new Promise((resolve) => {
    let resolved = false;

    const cleanupAndResolve = (value) => {
      if (resolved) return;
      resolved = true;
      observer.disconnect();
      clearTimeout(timeoutId);
      resolve(value);
    };

    const observer = new MutationObserver(() => {
      const container = findPrimaryXContainer(document);
      if (container) {
        cleanupAndResolve(container);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const timeoutId = setTimeout(() => {
      cleanupAndResolve(null);
    }, timeoutMs);
  });
}
