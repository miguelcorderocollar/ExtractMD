// Storage usage display for ExtractMD options page

import { getStorageUsage } from '../shared/storage.js';

/**
 * Render storage usage display
 * @param {Object} usage - Usage object with bytes, kb, percentage
 */
export function renderStorageUsage(usage) {
  const storageElement = document.getElementById('storage-usage-display');
  if (!storageElement) return;

  const { kb, percentage } = usage;

  storageElement.innerHTML = `
    <div class="storage-usage" title="Chrome sync storage usage (${usage.bytes} bytes)">
      <span class="storage-text">Chrome Settings Storage Used: ${kb} KB / 100 KB (${percentage}%)</span>
    </div>
  `;
}

/**
 * Load and display storage usage
 */
export function loadStorageUsage() {
  getStorageUsage().then(renderStorageUsage);
}

/**
 * Initialize storage usage display
 */
export function initializeStorageUsage() {
  // Load initial usage
  loadStorageUsage();

  // Listen for storage changes to update display
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
      // Debounce updates to avoid excessive recalculations
      setTimeout(loadStorageUsage, 100);
    }
  });
}
