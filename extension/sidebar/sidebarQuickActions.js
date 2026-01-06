// Sidebar Quick Actions
// Extract button functionality for sidebar

/**
 * Check if the current domain is in the ignored list
 * @returns {Promise<boolean>} True if domain is ignored
 */
async function isDomainIgnored() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return false;

    const url = new URL(tab.url);
    const domain = url.hostname;

    const { ignoredDomains = '' } = await chrome.storage.sync.get({ ignoredDomains: '' });
    const domains = ignoredDomains
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    return domains.includes(domain);
  } catch (e) {
    console.error('[ExtractMD Sidebar] Error checking ignored domain:', e);
    return false;
  }
}

/**
 * Check if extraction is available on the current page
 * @returns {Promise<boolean>} True if extraction is available
 */
async function isExtractionAvailable() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return false;

    // Can't inject into chrome:// or other restricted URLs
    if (
      !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:')
    ) {
      return false;
    }

    // Send message to content script to check if extraction is available
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkExtractAvailable' });
    return response?.available === true;
  } catch (e) {
    // Content script not loaded or not responding
    console.debug('[ExtractMD Sidebar] Could not check extraction availability:', e.message);
    return false;
  }
}

/**
 * Handle extract button click
 * @param {HTMLElement} button - Extract button element
 * @param {Function} statusCallback - Callback to show status messages
 */
export async function handleExtract(button, statusCallback) {
  if (!button) return;

  const originalHTML = button.innerHTML;
  button.disabled = true;
  button.classList.add('loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      if (statusCallback) statusCallback('No active tab found', 'error');
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        if (window.copyExtractMD) {
          window.copyExtractMD();
        } else {
          console.warn('[ExtractMD] No extraction function available on this page');
        }
      },
    });

    if (statusCallback) statusCallback('Extraction triggered!', 'success');
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error triggering extraction:', error);
    if (statusCallback) statusCallback('Failed to extract', 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    button.innerHTML = originalHTML;
  }
}

/**
 * Initialize extract button in header
 * @param {Function} statusCallback - Callback to show status messages
 */
export async function initializeHeaderExtractButton(statusCallback) {
  const extractBtn = document.getElementById('extractBtn');
  if (!extractBtn) return;

  // Check if extraction is available
  const ignored = await isDomainIgnored();
  const available = await isExtractionAvailable();

  if (ignored || !available) {
    extractBtn.disabled = true;
    extractBtn.style.opacity = '0.5';
    extractBtn.title = 'Extraction not available on this page';
  } else {
    extractBtn.disabled = false;
    extractBtn.style.opacity = '1';
    extractBtn.title = 'Extract content from current page';

    extractBtn.addEventListener('click', () => handleExtract(extractBtn, statusCallback));
  }
}

/**
 * Initialize extract button in disabled mode
 * @param {Function} statusCallback - Callback to show status messages
 */
export async function initializeDisabledModeExtractButton(statusCallback) {
  const extractBtn = document.getElementById('extractNowBtnDisabled');
  if (!extractBtn) return;

  // Check if extraction is available
  const ignored = await isDomainIgnored();
  const available = await isExtractionAvailable();

  if (ignored || !available) {
    extractBtn.disabled = true;
    extractBtn.style.opacity = '0.5';
    extractBtn.innerHTML = '<span>Extraction not available</span>';
  } else {
    extractBtn.disabled = false;
    extractBtn.style.opacity = '1';

    extractBtn.addEventListener('click', () => handleExtract(extractBtn, statusCallback));
  }
}
