// Sidebar Disabled Mode Container
// Initializes and manages all disabled mode features

import { initializeDisabledModeExtractButton } from './sidebarQuickActions.js';
import { initializeKpiSummary } from './sidebarKpi.js';
import { initializeLastExtraction } from './sidebarLastExtraction.js';
import { initializeImportExport } from './sidebarImportExport.js';

/**
 * Show status message in disabled mode
 * @param {string} message - Message to show
 * @param {string} type - Type ('success' | 'error' | 'info')
 */
function showDisabledModeStatus(message, type = 'info') {
  const statusEl = document.getElementById('statusDisabled');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status-toast-disabled ${type} visible`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 3000);
}

/**
 * Initialize current domain display
 */
async function initializeDomainDisplay() {
  const domainEl = document.getElementById('currentDomainDisabled');
  if (!domainEl) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      domainEl.textContent = url.hostname;
    } else {
      domainEl.textContent = '---';
    }
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error getting domain:', error);
    domainEl.textContent = '---';
  }
}

/**
 * Initialize domain toggle button in disabled mode
 */
async function initializeDomainToggle() {
  const domainEl = document.getElementById('currentDomainDisabled');
  const toggleBtn = document.getElementById('toggleDomainBtnDisabled');

  if (!domainEl || !toggleBtn) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    const url = new URL(tab.url);
    const domain = url.hostname;

    // Check if domain is currently ignored
    const { ignoredDomains = '' } = await chrome.storage.sync.get({ ignoredDomains: '' });
    const domains = ignoredDomains
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    const isIgnored = domains.includes(domain);

    // Update button text
    toggleBtn.textContent = isIgnored ? 'Enable' : 'Ignore';
    if (isIgnored) {
      toggleBtn.classList.add('enabled');
    } else {
      toggleBtn.classList.remove('enabled');
    }

    // Add click handler
    toggleBtn.addEventListener('click', async () => {
      let updatedDomains;
      if (isIgnored) {
        // Remove domain
        updatedDomains = domains.filter((d) => d !== domain);
        showDisabledModeStatus(`Domain "${domain}" enabled`, 'success');
      } else {
        // Add domain
        updatedDomains = [...domains, domain];
        showDisabledModeStatus(`Domain "${domain}" will be ignored`, 'success');
      }

      await chrome.storage.sync.set({ ignoredDomains: updatedDomains.join('\n') });

      // Send reinitialize message to content script
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'reinitialize' });
      } catch (error) {
        console.debug('[ExtractMD Sidebar] Could not send reinitialize message:', error.message);
      }

      // Reload to update button state
      setTimeout(() => location.reload(), 500);
    });
  } catch (error) {
    console.error('[ExtractMD Sidebar] Error initializing domain toggle:', error);
  }
}

/**
 * Initialize settings button
 */
function initializeSettingsButton() {
  const settingsBtn = document.getElementById('openSettingsBtnDisabled');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Initialize disabled mode
 */
export function initializeDisabledMode() {
  console.debug('[ExtractMD Sidebar] Initializing disabled mode...');

  // Initialize domain display
  initializeDomainDisplay();

  // Initialize domain toggle
  initializeDomainToggle();

  // Initialize extract button
  initializeDisabledModeExtractButton(showDisabledModeStatus);

  // Initialize KPI summary
  initializeKpiSummary();

  // Initialize last extraction
  initializeLastExtraction();

  // Initialize import/export
  initializeImportExport(showDisabledModeStatus);

  // Initialize settings button
  initializeSettingsButton();

  console.debug('[ExtractMD Sidebar] Disabled mode initialized');
}
