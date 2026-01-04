// UI helper functions for ExtractMD options page

// Toast state
let toastElement = null;
let toastTimeout = null;
let toastHideTimeout = null;

/**
 * Show a status message in the options page
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
export function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = `status-message visible ${type}`;
  setTimeout(() => {
    statusDiv.classList.remove('visible');
  }, 3000);
}

/**
 * Show a compact save toast notification
 * This is debounced - multiple calls will reset the timer and only show one toast
 * @param {string} [message='Saved'] - Short message to display
 * @param {string} [type='success'] - 'success' or 'error'
 */
export function showSaveToast(message = 'Saved', type = 'success') {
  // Clear any pending timeouts
  if (toastTimeout) clearTimeout(toastTimeout);
  if (toastHideTimeout) clearTimeout(toastHideTimeout);

  // Create or reuse toast element
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'save-toast';
    document.body.appendChild(toastElement);
  }

  // Update content and show
  toastElement.innerHTML = `
        <svg class="save-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            ${
              type === 'success'
                ? '<polyline points="20 6 9 17 4 12"></polyline>'
                : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
            }
        </svg>
        <span>${message}</span>
    `;
  toastElement.className = `save-toast ${type} visible`;

  // Hide after 1.5 seconds
  toastHideTimeout = setTimeout(() => {
    toastElement.classList.remove('visible');
  }, 1500);
}

/**
 * Initialize save toast listener for storage changes
 */
export function initializeSaveToast() {
  // Listen for our custom save event
  document.addEventListener('extractmd-setting-saved', () => {
    showSaveToast('Saved');
  });
}

/**
 * Get extension manifest info
 * @param {Function} callback - Callback with manifest object
 */
export function getManifest(callback) {
  fetch(chrome.runtime.getURL('manifest.json'))
    .then((r) => r.json())
    .then(callback)
    .catch(() => callback({ name: 'ExtractMD', version: 'unknown' }));
}
