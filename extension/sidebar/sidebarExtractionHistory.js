// Sidebar Extraction History
// Manages extraction history storage and dropdown UI

const MAX_HISTORY = 10;

/**
 * Add extraction to history
 * @param {Object} extraction - Extraction data
 */
export async function addToHistory(extraction) {
  const history = await getHistory();

  // Deduplicate by URL + timestamp proximity (within 5 seconds)
  const isDuplicate = history.some(
    (item) =>
      item.metadata.url === extraction.metadata.url &&
      Math.abs(item.timestamp - extraction.timestamp) < 5000
  );

  if (isDuplicate) {
    console.debug('[ExtractMD Sidebar] Duplicate extraction, skipping history add');
    return;
  }

  // Add to front (most recent first)
  history.unshift({
    id: `extraction_${extraction.timestamp}`,
    timestamp: extraction.timestamp,
    type: extraction.type,
    contentPreview: extraction.content.substring(0, 200) + '...',
    metadata: extraction.metadata,
    downloaded: extraction.downloaded,
  });

  // Keep only MAX_HISTORY entries (FIFO)
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  await chrome.storage.local.set({ extractionHistory: history });

  // Update badge on history button
  updateHistoryBadge(history.length);

  console.debug(`[ExtractMD Sidebar] Added to history: ${extraction.type}`);
}

/**
 * Get extraction history
 * @returns {Promise<Array>} History array
 */
export async function getHistory() {
  const result = await chrome.storage.local.get({ extractionHistory: [] });
  return result.extractionHistory || [];
}

/**
 * Clear extraction history
 */
export async function clearHistory() {
  await chrome.storage.local.set({ extractionHistory: [] });
  updateHistoryBadge(0);
  console.debug('[ExtractMD Sidebar] History cleared');
}

/**
 * Render history dropdown
 */
export async function renderHistoryDropdown() {
  const history = await getHistory();
  const listEl = document.getElementById('historyList');

  if (!listEl) return;

  if (history.length === 0) {
    listEl.innerHTML = '<div class="history-empty">No recent extractions</div>';
    return;
  }

  listEl.innerHTML = history
    .map(
      (item) => `
    <div class="history-item" data-id="${item.id}" data-type="${item.type}" data-timestamp="${item.timestamp}">
      <div class="history-item-header">
        <span class="history-item-icon">${getTypeIcon(item.type)}</span>
        <span class="history-item-type">${getTypeLabel(item.type)}</span>
        <span class="history-item-time">${formatRelativeTime(item.timestamp)}</span>
      </div>
      <div class="history-item-preview">${escapeHtml(item.contentPreview)}</div>
    </div>
  `
    )
    .join('');

  // Add click handlers
  listEl.querySelectorAll('.history-item').forEach((itemEl) => {
    itemEl.addEventListener('click', () => handleHistoryItemClick(itemEl.dataset.id));
  });
}

/**
 * Handle history item click (copy to clipboard)
 * @param {string} id - History item ID
 */
async function handleHistoryItemClick(id) {
  const history = await getHistory();
  const item = history.find((h) => h.id === id);

  if (!item) {
    console.warn('[ExtractMD Sidebar] History item not found:', id);
    return;
  }

  try {
    // Copy content preview to clipboard
    await navigator.clipboard.writeText(item.contentPreview);
    showToast('Content preview copied to clipboard', 'success');
    closeHistoryDropdown();
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error copying to clipboard:', error);
    showToast('Failed to copy to clipboard', 'error');
  }
}

/**
 * Toggle history dropdown visibility
 */
export function toggleHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  if (!dropdown) return;

  const isVisible = dropdown.style.display !== 'none';

  if (isVisible) {
    closeHistoryDropdown();
  } else {
    renderHistoryDropdown();
    dropdown.style.display = 'block';
  }
}

/**
 * Close history dropdown
 */
export function closeHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  if (dropdown) dropdown.style.display = 'none';
}

/**
 * Update history badge on button
 * @param {number} count - Number of history items
 */
function updateHistoryBadge(count) {
  const historyBtn = document.getElementById('historyBtn');
  if (!historyBtn) return;

  if (count > 0) {
    historyBtn.classList.add('has-history');
  } else {
    historyBtn.classList.remove('has-history');
  }
}

/**
 * Initialize history button badge on load
 */
export async function initializeHistoryBadge() {
  const history = await getHistory();
  updateHistoryBadge(history.length);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get icon for extraction type
 * @param {string} type - Extraction type
 * @returns {string} Icon emoji
 */
function getTypeIcon(type) {
  const icons = {
    youtube: '🎬',
    articles: '📄',
    hn_comments: '💬',
    hn_news: '📰',
    universal: '📋',
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
    universal: 'Web Page',
  };
  return labels[type] || 'Content';
}

/**
 * Format timestamp as relative time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show toast notification
 * @param {string} message - Message to show
 * @param {string} type - Toast type ('success' | 'error')
 */
function showToast(message, type = 'success') {
  // Try to use existing status bar
  const statusBar = document.getElementById('statusBar');
  const statusMessage = document.getElementById('statusMessage');

  if (statusBar && statusMessage) {
    statusMessage.textContent = message;
    statusBar.className = `status-bar ${type}`;
    statusBar.style.display = 'block';

    setTimeout(() => {
      statusBar.style.display = 'none';
    }, 3000);
  } else {
    console.log(`[ExtractMD Sidebar] ${type}: ${message}`);
  }
}
