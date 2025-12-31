// UI helper functions for ExtractMD popup

/**
 * Show a status message in the popup
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
export function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

/**
 * Get extension manifest info
 * @param {Function} callback - Callback with manifest object
 */
export function getManifest(callback) {
    fetch(chrome.runtime.getURL('manifest.json'))
        .then(r => r.json())
        .then(callback)
        .catch(() => callback({ name: 'ExtractMD', version: 'unknown' }));
}

