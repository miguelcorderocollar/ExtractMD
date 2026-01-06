// Sidebar Import/Export Module
// Settings import/export functionality for disabled mode

import { DEFAULTS, SETTING_SCHEMA } from '../shared/defaults.js';

/**
 * Get manifest data
 * @param {Function} callback - Callback with manifest object
 */
function getManifest(callback) {
  fetch(chrome.runtime.getURL('manifest.json'))
    .then((response) => response.json())
    .then((manifest) => callback(manifest))
    .catch((error) => {
      console.error('[ExtractMD Sidebar] Error loading manifest:', error);
      callback({});
    });
}

/**
 * Export settings to JSON file
 * @param {Function} statusCallback - Callback to show status messages
 */
export function exportSettings(statusCallback) {
  chrome.storage.sync.get(null, function (allSettings) {
    // Remove orphaned/unused data from export
    const cleanSettings = { ...allSettings };
    delete cleanSettings.hiddenButtonsByDomain; // Legacy unused data

    // Only export non-default values (optimization)
    const exportSettings = {};
    for (const key in cleanSettings) {
      // Always export usageStats (special case)
      if (key === 'usageStats') {
        exportSettings[key] = cleanSettings[key];
        continue;
      }
      // Only export if value differs from default
      if (key in DEFAULTS) {
        if (JSON.stringify(cleanSettings[key]) !== JSON.stringify(DEFAULTS[key])) {
          exportSettings[key] = cleanSettings[key];
        }
      } else {
        // Export unknown keys (future compatibility)
        exportSettings[key] = cleanSettings[key];
      }
    }

    getManifest(function (manifest) {
      const exportData = {
        extension: manifest.name || 'ExtractMD',
        version: manifest.version || 'unknown',
        timestamp: new Date().toISOString(),
        settings: exportSettings,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ExtractMD-settings-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      if (statusCallback) statusCallback('Settings exported!', 'success');
    });
  });
}

/**
 * Import settings from file event
 * @param {Event} e - File input change event
 * @param {Function} statusCallback - Callback to show status messages
 */
export function handleImportFile(e, statusCallback) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data || typeof data !== 'object' || !data.settings) {
        throw new Error('Invalid file');
      }

      // Validate extension name
      if (data.extension !== 'ExtractMD') {
        if (
          !confirm(
            `This file identifies as "${data.extension || 'unknown'}", not "ExtractMD". Import anyway?`
          )
        ) {
          return;
        }
      }

      const settingsToImport = {};

      // Filter and sanitize based on schema
      for (const key in SETTING_SCHEMA) {
        if (Object.prototype.hasOwnProperty.call(data.settings, key)) {
          const type = SETTING_SCHEMA[key];
          const val = data.settings[key];
          if (type === 'boolean') settingsToImport[key] = !!val;
          else if (type === 'number') settingsToImport[key] = parseInt(val, 10) || 0;
          else if (type === 'string') settingsToImport[key] = String(val);
        }
      }

      // Handle usageStats separately
      if (data.settings.usageStats && typeof data.settings.usageStats === 'object') {
        settingsToImport.usageStats = data.settings.usageStats;
      }

      chrome.storage.sync.set(settingsToImport, function () {
        if (statusCallback) statusCallback('Settings imported successfully!', 'success');
        setTimeout(() => location.reload(), 1000);
      });
    } catch {
      if (statusCallback) statusCallback('Import failed: Invalid file', 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * Initialize import/export functionality
 * @param {Function} statusCallback - Callback to show status messages
 */
export function initializeImportExport(statusCallback) {
  const exportBtn = document.getElementById('exportSettingsBtnDisabled');
  const importBtn = document.getElementById('importSettingsBtnDisabled');
  const importFileInput = document.getElementById('importSettingsFileDisabled');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportSettings(statusCallback));
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', function () {
      importFileInput.value = '';
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => handleImportFile(e, statusCallback));
  }
}
