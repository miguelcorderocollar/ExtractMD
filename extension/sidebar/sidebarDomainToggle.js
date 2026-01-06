// Sidebar Domain Toggle Module
// Handles domain ignore/restore functionality in the AI Chat sidebar

/**
 * Get the current active tab's domain
 * @returns {Promise<string|null>} The domain or null if not available
 */
async function getCurrentDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return null;

    const url = new URL(tab.url);
    return url.hostname;
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error getting current domain:', error);
    return null;
  }
}

/**
 * Check if a domain is in the ignored list
 * @param {string} domain - The domain to check
 * @returns {Promise<boolean>} True if domain is ignored
 */
async function isDomainIgnored(domain) {
  if (!domain) return false;

  try {
    const { ignoredDomains = '' } = await chrome.storage.sync.get({ ignoredDomains: '' });
    const domains = ignoredDomains
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    return domains.includes(domain);
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error checking ignored domain:', error);
    return false;
  }
}

/**
 * Toggle domain ignore status (add or remove from ignored list)
 * @param {string} domain - The domain to toggle
 * @returns {Promise<boolean>} True if domain is now ignored, false if enabled
 */
async function toggleDomainIgnore(domain) {
  if (!domain) return false;

  try {
    const { ignoredDomains = '' } = await chrome.storage.sync.get({ ignoredDomains: '' });
    let domains = ignoredDomains
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const isCurrentlyIgnored = domains.includes(domain);

    if (isCurrentlyIgnored) {
      // Remove domain from ignored list
      domains = domains.filter((d) => d !== domain);
    } else {
      // Add domain to ignored list
      domains.push(domain);
    }

    // Save back to storage
    const newValue = domains.join('\n');
    await chrome.storage.sync.set({ ignoredDomains: newValue });

    // Send message to content script to reinitialize
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        await chrome.tabs.sendMessage(tab.id, { action: 'reinitialize' });
      }
    } catch (error) {
      // Content script might not be loaded, that's okay
      console.debug('[ExtractMD Sidebar] Could not send reinitialize message:', error.message);
    }

    return !isCurrentlyIgnored; // Return new state
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error toggling domain:', error);
    throw error;
  }
}

/**
 * Update domain toggle button visual state and tooltip
 * @param {boolean} isIgnored - Whether domain is currently ignored
 * @param {string} domain - The current domain
 */
function updateDomainToggleButton(isIgnored, domain) {
  const button = document.getElementById('domainToggleBtn');
  if (!button) return;

  // Remove all state classes
  button.classList.remove('domain-ignored', 'domain-enabled');

  // Add appropriate state class
  if (isIgnored) {
    button.classList.add('domain-ignored');
    button.title = `Domain ignored: ${domain}\nClick to enable`;
  } else {
    button.classList.add('domain-enabled');
    button.title = `Domain enabled: ${domain}\nClick to ignore`;
  }
}

/**
 * Show status message in sidebar
 * @param {string} message - Message to show
 * @param {string} type - Type of message ('success', 'error', 'info')
 */
function showStatus(message, type = 'info') {
  const statusBar = document.getElementById('statusBar');
  const statusMessage = document.getElementById('statusMessage');

  if (!statusBar || !statusMessage) return;

  statusMessage.textContent = message;
  statusBar.className = `status-bar ${type}`;
  statusBar.style.display = 'block';

  // Hide after 3 seconds
  setTimeout(() => {
    statusBar.style.display = 'none';
  }, 3000);
}

/**
 * Check if current URL is restricted (chrome://, about:, etc.)
 * @param {string} domain - The domain to check
 * @returns {boolean} True if restricted
 */
function isRestrictedDomain(domain) {
  if (!domain) return true;
  return (
    domain.startsWith('chrome') ||
    domain === 'localhost' ||
    domain.startsWith('127.0.0.1') ||
    domain.startsWith('about')
  );
}

/**
 * Handle domain toggle button click
 */
async function handleDomainToggle() {
  const button = document.getElementById('domainToggleBtn');
  if (!button || button.disabled) return;

  try {
    const domain = await getCurrentDomain();

    if (!domain) {
      showStatus('Could not determine current domain', 'error');
      return;
    }

    // Toggle the domain
    const nowIgnored = await toggleDomainIgnore(domain);

    // Update button state
    updateDomainToggleButton(nowIgnored, domain);

    // Show status message
    if (nowIgnored) {
      showStatus(`Domain "${domain}" will be ignored`, 'success');
    } else {
      showStatus(`Domain "${domain}" is now enabled`, 'success');
    }
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error in handleDomainToggle:', error);
    showStatus('Failed to toggle domain', 'error');
  }
}

/**
 * Initialize the sidebar domain toggle button
 */
export async function initializeSidebarDomainToggle() {
  const button = document.getElementById('domainToggleBtn');
  if (!button) {
    console.warn('[ExtractMD Sidebar] Domain toggle button not found');
    return;
  }

  try {
    const domain = await getCurrentDomain();

    if (!domain || isRestrictedDomain(domain)) {
      // Disable button for restricted URLs
      button.disabled = true;
      button.style.opacity = '0.5';
      button.title = 'Cannot toggle for this URL';
      return;
    }

    // Enable button
    button.disabled = false;
    button.style.opacity = '1';

    // Check current state
    const isIgnored = await isDomainIgnored(domain);

    // Update button state
    updateDomainToggleButton(isIgnored, domain);

    // Add click listener
    button.addEventListener('click', handleDomainToggle);

    console.debug('[ExtractMD Sidebar] Domain toggle initialized for:', domain);
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error initializing domain toggle:', error);
    button.disabled = true;
    button.title = 'Error loading domain status';
  }
}
