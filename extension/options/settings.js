// Settings load/save management for ExtractMD options page

import { DEFAULTS } from '../shared/defaults.js';
import { saveSetting } from '../shared/storage.js';
import { updateIgnoreButtonState } from './domainIgnore.js';
import {
  applyInitialIntegrationVisibility,
  updateIntegrationVisibility,
} from './integrationVisibility.js';
import { showStatus } from './ui.js';

/**
 * Mapping of setting keys to their DOM element IDs and types
 * Web Components use setting-id attribute, regular elements use id
 */
const SETTING_ELEMENTS = {
  // YouTube settings
  includeTimestamps: { id: 'includeTimestamps', type: 'checkbox' },
  addTitleToTranscript: { id: 'addTitleToTranscript', type: 'checkbox' },
  addChannelToTranscript: { id: 'addChannelToTranscript', type: 'checkbox' },
  addUrlToTranscript: { id: 'addUrlToTranscript', type: 'checkbox' },

  // HN Comments settings
  hnIncludeAuthor: { id: 'hnIncludeAuthor', type: 'checkbox' },
  hnIncludeTime: { id: 'hnIncludeTime', type: 'checkbox' },
  hnIncludeReplies: { id: 'hnIncludeReplies', type: 'checkbox' },
  hnIncludeUrl: { id: 'hnIncludeUrl', type: 'checkbox' },
  hnIncludeItemText: { id: 'hnIncludeItemText', type: 'checkbox' },

  // HN News settings
  hnNewsIncludeTitle: { id: 'hnNewsIncludeTitle', type: 'checkbox' },
  hnNewsIncludeUrl: { id: 'hnNewsIncludeUrl', type: 'checkbox' },
  hnNewsIncludeSite: { id: 'hnNewsIncludeSite', type: 'checkbox' },
  hnNewsIncludePoints: { id: 'hnNewsIncludePoints', type: 'checkbox' },
  hnNewsIncludeAuthor: { id: 'hnNewsIncludeAuthor', type: 'checkbox' },
  hnNewsIncludeTime: { id: 'hnNewsIncludeTime', type: 'checkbox' },
  hnNewsIncludeComments: { id: 'hnNewsIncludeComments', type: 'checkbox' },

  // Article settings
  articleExporterIncludeImages: { id: 'articleExporterIncludeImages', type: 'checkbox' },
  articleExporterOnlyLongest: { id: 'articleExporterOnlyLongest', type: 'checkbox' },
  articleExporterShowInfo: { id: 'articleExporterShowInfo', type: 'checkbox' },
  articleExporterIncludeUrl: { id: 'articleExporterIncludeUrl', type: 'checkbox' },

  // Universal settings
  universalIncludeImages: { id: 'universalIncludeImages', type: 'checkbox' },
  universalIncludeLinks: { id: 'universalIncludeLinks', type: 'checkbox' },
  universalIncludeUrl: { id: 'universalIncludeUrl', type: 'checkbox' },
  universalContentMode: { id: 'universalContentMode', type: 'select' },
  universalCustomSelector: { id: 'universalCustomSelector', type: 'text' },
  universalStripNav: { id: 'universalStripNav', type: 'checkbox' },
  universalPreserveCodeBlocks: { id: 'universalPreserveCodeBlocks', type: 'checkbox' },

  // General settings
  jumpToDomain: { id: 'jumpToDomain', type: 'checkbox' },
  jumpToDomainUrl: { id: 'jumpToDomainUrl', type: 'text' },
  enableUsageKpi: { id: 'showUsageKpi', type: 'checkbox', invertDefault: true },
  closeTabAfterExtraction: { id: 'closeTabAfterExtraction', type: 'checkbox' },
  downloadInsteadOfCopy: { id: 'downloadInsteadOfCopy', type: 'checkbox' },
  downloadIfTokensExceed: { id: 'downloadIfTokensExceed', type: 'number' },
  showTokenCountInNotification: { id: 'showTokenCountInNotification', type: 'checkbox' },
  ignoredDomains: { id: 'ignoredDomains', type: 'textarea' },
  accentColor: { id: 'accentColor', type: 'color' },

  // Integration toggles
  enableYouTubeIntegration: {
    id: 'enableYouTubeIntegration',
    type: 'checkbox',
    invertDefault: true,
  },
  enableHackerNewsIntegration: {
    id: 'enableHackerNewsIntegration',
    type: 'checkbox',
    invertDefault: true,
  },
  enableArticleIntegration: {
    id: 'enableArticleIntegration',
    type: 'checkbox',
    invertDefault: true,
  },
  enableUniversalIntegration: {
    id: 'enableUniversalIntegration',
    type: 'checkbox',
    invertDefault: true,
  },

  // Floating Button settings
  floatingButtonEnableDrag: { id: 'floatingButtonEnableDrag', type: 'checkbox' },
  floatingButtonEnableDismiss: { id: 'floatingButtonEnableDismiss', type: 'checkbox' },
  floatingButtonSize: { id: 'floatingButtonSize', type: 'select' },
  floatingButtonTransparency: { id: 'floatingButtonTransparency', type: 'select' },
};

/**
 * Find a setting element by its setting-id or id
 * Supports both Web Components and regular elements
 * @param {string} settingId - The setting ID to find
 * @returns {Element|null}
 */
function findSettingElement(settingId) {
  // First try to find a Web Component by setting-id attribute
  let element = document.querySelector(`[setting-id="${settingId}"]`);

  // Fall back to regular id lookup
  if (!element) {
    element = document.getElementById(settingId);
  }

  return element;
}

/**
 * Check if an element is a Web Component (custom element)
 * @param {Element} element
 * @returns {boolean}
 */
function isWebComponent(element) {
  return element && element.tagName && element.tagName.includes('-');
}

/**
 * Get the input element from a Web Component or return the element itself
 * @param {Element} element
 * @returns {Element}
 */
function getInputElement(element) {
  if (isWebComponent(element)) {
    // Try to get the inner input/select element
    const inner = element.querySelector('input, select, textarea');
    return inner || element;
  }
  return element;
}

/**
 * Load settings from storage and populate form elements
 */
export function loadSettings() {
  chrome.storage.sync.get(DEFAULTS, function (items) {
    for (const [key, config] of Object.entries(SETTING_ELEMENTS)) {
      const element = findSettingElement(config.id);
      if (!element) continue;

      const value = items[key];

      if (config.type === 'checkbox') {
        const checkedValue = config.invertDefault ? value !== false : value;

        if (isWebComponent(element)) {
          // For Web Components, set the checked property
          element.checked = checkedValue;
        } else {
          element.checked = checkedValue;
        }
      } else if (config.type === 'text' || config.type === 'textarea') {
        if (isWebComponent(element)) {
          element.value = value || '';
        } else {
          element.value = value || '';
        }
      } else if (config.type === 'number') {
        const inputEl = getInputElement(element);
        inputEl.value = value || '';
      } else if (config.type === 'select') {
        if (isWebComponent(element)) {
          element.value = value || 'auto';
        } else {
          element.value = value || '';
        }
      } else if (config.type === 'color') {
        if (isWebComponent(element)) {
          element.value = value || DEFAULTS.accentColor;
        } else {
          element.value = value || DEFAULTS.accentColor;
        }
      }
    }

    // Update ignore button state after loading
    updateIgnoreButtonState();

    // Apply initial integration visibility
    applyInitialIntegrationVisibility(items);

    // Update KPI section visibility
    const kpiSection = document.getElementById('kpi-section');
    if (kpiSection) {
      kpiSection.style.display = items.enableUsageKpi === false ? 'none' : 'flex';
    }
  });
}

/**
 * Attach save handlers to setting elements
 */
export function attachSettingHandlers() {
  for (const [key, config] of Object.entries(SETTING_ELEMENTS)) {
    const element = findSettingElement(config.id);
    if (!element) continue;

    if (config.type === 'checkbox') {
      // Handle both Web Components and regular checkboxes
      element.addEventListener('change', function (e) {
        // Get the checked value (Web Component provides it in detail, or from the input)
        let checked;
        if (e.detail && typeof e.detail.checked !== 'undefined') {
          checked = e.detail.checked;
        } else if (isWebComponent(element)) {
          checked = element.checked;
        } else {
          checked = element.checked;
        }

        saveSetting(key, checked);

        // Special handling for KPI visibility
        if (key === 'enableUsageKpi') {
          const kpiSection = document.getElementById('kpi-section');
          if (kpiSection) {
            kpiSection.style.display = checked ? 'flex' : 'none';
          }
        }

        // Special handling for integration visibility
        if (
          key === 'enableYouTubeIntegration' ||
          key === 'enableHackerNewsIntegration' ||
          key === 'enableArticleIntegration' ||
          key === 'enableUniversalIntegration'
        ) {
          updateIntegrationVisibility();
        }
      });
    } else if (config.type === 'text' || config.type === 'textarea' || config.type === 'color') {
      // Text inputs are handled separately (domain validation, etc.)
      if (key === 'jumpToDomainUrl' || key === 'universalCustomSelector') {
        const inputEl = getInputElement(element);
        inputEl.addEventListener('input', function () {
          saveSetting(key, inputEl.value);
        });
      }
      // ignoredDomains is handled by domainIgnore.js

      // Special handling for accent color with debouncing
      if (key === 'accentColor') {
        let debounceTimeout = null;
        const inputEl = getInputElement(element);

        const saveAndDispatch = (value) => {
          saveSetting(key, value);
          // Dispatch custom event for theme manager
          document.dispatchEvent(
            new CustomEvent('extractmd-setting-saved', {
              detail: { settingId: key, value },
            })
          );
        };

        // Debounced handler for input events (fires rapidly during color picker drag)
        const handleInput = (e) => {
          // Get value from CustomEvent detail (reset button) or from input element
          const value = e.detail?.value ?? inputEl.value;
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => saveAndDispatch(value), 150);
        };

        // Immediate handler for change event (fires once when picker closes or reset)
        const handleChange = (e) => {
          clearTimeout(debounceTimeout); // Cancel pending debounce
          debounceTimeout = null;
          // Get value from CustomEvent detail (reset button) or from input element
          const value = e.detail?.value ?? inputEl.value;
          saveAndDispatch(value);
        };

        // Attach to web component element to receive both native and synthetic events
        element.addEventListener('input', handleInput);
        element.addEventListener('change', handleChange);
      }
    } else if (config.type === 'number') {
      // Handle both Web Components and regular number inputs
      element.addEventListener('change', function (e) {
        let val;
        if (e.detail && typeof e.detail.value !== 'undefined') {
          val = parseInt(e.detail.value, 10);
        } else {
          const inputEl = getInputElement(element);
          val = parseInt(inputEl.value, 10);
        }
        if (isNaN(val) || val < 0) val = 0;
        saveSetting(key, val);
      });
    } else if (config.type === 'select') {
      element.addEventListener('change', function (e) {
        let value;
        if (e.detail && typeof e.detail.value !== 'undefined') {
          value = e.detail.value;
        } else if (isWebComponent(element)) {
          value = element.value;
        } else {
          value = element.value;
        }

        saveSetting(key, value);

        // Special handling for content mode selector visibility
        if (key === 'universalContentMode') {
          updateCustomSelectorVisibility(value);
        }
      });
    }
  }

  // Initialize custom selector visibility
  const contentModeEl = findSettingElement('universalContentMode');
  if (contentModeEl) {
    const value = isWebComponent(contentModeEl) ? contentModeEl.value : contentModeEl.value;
    updateCustomSelectorVisibility(value || 'auto');
  }
}

/**
 * Update visibility of custom selector input based on content mode
 */
function updateCustomSelectorVisibility(mode) {
  const customSelectorRow = document.getElementById('customSelectorRow');
  if (customSelectorRow) {
    customSelectorRow.style.display = mode === 'selector' ? 'flex' : 'none';
  }
}

/**
 * Reset all stored floating button positions
 * Clears all domain-specific position offsets from chrome.storage.local
 */
export function resetFloatingButtonPositions() {
  return new Promise((resolve) => {
    chrome.storage.local.remove('floatingButtonPositions', function () {
      console.debug('[ExtractMD] Reset all floating button positions');
      resolve();
    });
  });
}

/**
 * Clean up orphaned/legacy data from storage
 */
export function cleanupLegacyData() {
  chrome.storage.sync.get(['hiddenButtonsByDomain'], function (result) {
    if (result.hiddenButtonsByDomain) {
      chrome.storage.sync.remove('hiddenButtonsByDomain', function () {
        console.debug('[ExtractMD] Cleaned up orphaned hiddenButtonsByDomain data');
      });
    }
  });
}

/**
 * Initialize reset button for floating button positions
 */
function initializeResetPositionsButton() {
  const resetPositionsBtn = document.getElementById('resetPositionsBtn');
  if (resetPositionsBtn) {
    resetPositionsBtn.addEventListener('click', async function () {
      if (
        confirm(
          'Are you sure you want to reset all floating button positions? This will restore all buttons to their default positions.'
        )
      ) {
        await resetFloatingButtonPositions();
        showStatus('All floating button positions have been reset', 'success');
      }
    });
  }
}

/**
 * Initialize settings module
 */
export function initializeSettings() {
  cleanupLegacyData();
  loadSettings();
  attachSettingHandlers();
  initializeResetPositionsButton();
}
