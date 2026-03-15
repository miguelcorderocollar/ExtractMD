export function isXPostPage(pathname = window.location.pathname) {
  return /\/status\/\d+/.test(pathname);
}

export function isXArticlePage(pathname = window.location.pathname) {
  return /\/i\/articles\/[^/]+/.test(pathname) || /\/articles\/[^/]+/.test(pathname);
}

export function getStatusId(pathname = window.location.pathname) {
  const match = pathname.match(/\/status\/(\d+)/);
  return match ? match[1] : null;
}

export function isTopLevelTweet(articleNode) {
  const parentTweet = articleNode.parentElement?.closest(
    'article[data-testid="tweet"], article[role="article"]'
  );
  return !parentTweet;
}
