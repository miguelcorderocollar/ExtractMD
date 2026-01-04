// Last extraction status display for ExtractMD popup

/**
 * Format relative time from timestamp
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string (e.g., "2 minutes ago")
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Get icon for extraction type
 * @param {string} type - Extraction type
 * @returns {string} Emoji icon
 */
function getTypeIcon(type) {
  const icons = {
    youtube: '🎬',
    articles: '📄',
    hn_comments: '💬',
    hn_news: '📰',
  };
  return icons[type] || '📋';
}

/**
 * Get label for extraction type
 * @param {string} type - Extraction type
 * @returns {string} Human-readable label
 */
function getTypeLabel(type) {
  const labels = {
    youtube: 'YouTube',
    articles: 'Article',
    hn_comments: 'HN Comments',
    hn_news: 'HN News',
  };
  return labels[type] || 'Content';
}

/**
 * Load and display last extraction status
 */
export function loadLastExtraction() {
  const section = document.getElementById('lastExtractionSection');
  const statusEl = document.getElementById('lastExtractionStatus');

  if (!section || !statusEl) return;

  chrome.storage.local.get(['lastExtraction'], (result) => {
    const last = result.lastExtraction;

    if (last && last.timestamp) {
      const relativeTime = formatRelativeTime(last.timestamp);
      const icon = getTypeIcon(last.type);
      const typeLabel = getTypeLabel(last.type);
      const action = last.downloaded ? 'Downloaded' : 'Copied';

      statusEl.innerHTML = `${icon} <strong>${action}</strong> ${typeLabel} ${relativeTime}`;
      section.style.display = 'block';
    } else {
      section.style.display = 'none';
    }
  });
}

/**
 * Initialize last extraction module
 */
export function initializeLastExtraction() {
  loadLastExtraction();

  // Listen for storage changes to update in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.lastExtraction) {
      loadLastExtraction();
    }
  });
}
