// Quick action buttons for ExtractMD popup

import { showStatus } from './ui.js';

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
    console.error('[ExtractMD] Error checking ignored domain:', e);
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
    console.debug('[ExtractMD] Could not check extraction availability:', e.message);
    return false;
  }
}

/**
 * Handle Extract Now button click
 * Triggers extraction on the current page (respects user settings)
 */
async function handleExtractNow() {
  const extractBtn = document.getElementById('extractNowBtn');
  if (extractBtn) {
    extractBtn.disabled = true;
    extractBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Extracting...</span>';
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showStatus('No active tab found', 'error');
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

    showStatus('Extraction triggered!', 'success');
  } catch (error) {
    console.error('[ExtractMD] Error triggering extraction:', error);
    showStatus('Failed to extract', 'error');
  } finally {
    if (extractBtn) {
      extractBtn.disabled = false;
      extractBtn.innerHTML = '<span class="btn-icon">📋</span><span>Extract Now</span>';
    }
  }
}

/**
 * Handle Open Settings button click
 */
function handleOpenSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * Handle Open Sidebar button click
 * Opens the AI Chat sidebar panel
 */
async function handleOpenSidebar() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showStatus('No active tab found', 'error');
      return;
    }

    await chrome.sidePanel.open({ tabId: tab.id });
    showStatus('Sidebar opened', 'success');
  } catch (error) {
    console.error('[ExtractMD] Error opening sidebar:', error);
    showStatus('Failed to open sidebar', 'error');
  }
}

/**
 * Initialize Extract Now button visibility
 * Hides the button if domain is blacklisted or no content to extract
 */
async function initializeExtractButton() {
  const extractBtn = document.getElementById('extractNowBtn');
  const extractSection = extractBtn?.parentElement;

  if (!extractBtn || !extractSection) return;

  // Check if domain is ignored
  const ignored = await isDomainIgnored();
  if (ignored) {
    extractSection.style.display = 'none';
    return;
  }

  // Check if extraction is available
  const available = await isExtractionAvailable();
  if (!available) {
    extractSection.style.display = 'none';
    return;
  }

  // Show the button if both checks pass
  extractSection.style.display = 'block';
  extractBtn.addEventListener('click', handleExtractNow);
}

/**
 * Initialize quick actions module
 */
export function initializeQuickActions() {
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const openSidebarBtn = document.getElementById('openSidebarBtn');

  // Initialize extract button (async - handles visibility)
  initializeExtractButton();

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', handleOpenSettings);
  }

  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', handleOpenSidebar);
  }
}
