// ExtractMD AI Chat Sidebar - Main Coordinator
// Manages dual-mode functionality and initializes all modules

import { DEFAULTS } from '../shared/defaults.js';
import { SidebarState } from './sidebarState.js';
import { initializeSidebarDomainToggle } from './sidebarDomainToggle.js';
import {
  toggleHistoryDropdown,
  closeHistoryDropdown,
  initializeHistoryBadge,
} from './sidebarExtractionHistory.js';
import { initializeHeaderExtractButton } from './sidebarQuickActions.js';
import { initializeDisabledMode } from './sidebarDisabledMode.js';
import { initializeEnabledMode } from './sidebarEnabledMode.js';

// Global state
let stateManager;

/**
 * Initialize the sidebar
 */
async function initialize() {
  console.debug('[ExtractMD Sidebar] Initializing...');

  // Initialize state manager
  stateManager = new SidebarState();
  await stateManager.initialize();

  // Load settings for accent color
  const allSettings = await chrome.storage.sync.get({
    accentColor: DEFAULTS.accentColor,
  });
  applyAccentColor(allSettings.accentColor);

  // Listen for accent color changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.accentColor) {
      applyAccentColor(changes.accentColor.newValue);
    }
  });

  // Initialize shared components (always present)
  initializeSharedComponents();

  // Initialize mode-specific components
  initializeDisabledMode();
  initializeEnabledMode(stateManager);

  // Update initial visibility
  stateManager.updateContentVisibility();

  // Listen for mode changes
  stateManager.onModeChange((newMode, oldMode) => {
    stateManager.updateContentVisibility();
    console.debug('[ExtractMD Sidebar] Mode changed:', oldMode, '->', newMode);
  });

  console.debug('[ExtractMD Sidebar] Initialized');
}

/**
 * Initialize shared components (present in both modes)
 */
function initializeSharedComponents() {
  // Domain toggle button (header)
  initializeSidebarDomainToggle();

  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // History button and dropdown
  const historyBtn = document.getElementById('historyBtn');
  if (historyBtn) {
    historyBtn.addEventListener('click', toggleHistoryDropdown);
  }

  // Initialize history badge
  initializeHistoryBadge();

  // Extract button in header
  initializeHeaderExtractButton(showHeaderStatus);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('historyDropdown');
    const historyBtn = document.getElementById('historyBtn');

    if (dropdown && dropdown.style.display !== 'none') {
      if (
        !dropdown.contains(e.target) &&
        e.target !== historyBtn &&
        !historyBtn.contains(e.target)
      ) {
        closeHistoryDropdown();
      }
    }
  });
}

/**
 * Show status in header (for extract button feedback)
 * @param {string} message - Status message
 * @param {string} type - Type ('success' | 'error')
 */
function showHeaderStatus(message, type = 'info') {
  // Use the global status bar
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

/**
 * Apply accent color to CSS variables
 */
function applyAccentColor(color) {
  if (!color) return;
  document.documentElement.style.setProperty('--accent', color);
  const hoverColor = adjustBrightness(color, -15);
  document.documentElement.style.setProperty('--accent-hover', hoverColor);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));

  const rr = Math.round(r).toString(16).padStart(2, '0');
  const gg = Math.round(g).toString(16).padStart(2, '0');
  const bb = Math.round(b).toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
