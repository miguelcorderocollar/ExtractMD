// Import/export functionality for ExtractMD popup

import { DEFAULTS, SETTING_SCHEMA } from '../shared/defaults.js';
import { showStatus, getManifest } from './ui.js';

/**
 * Export settings to JSON file
 */
export function exportSettings() {
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
      showStatus('Settings exported!', 'success');
    });
  });
}

/**
 * Import settings from file event
 * @param {Event} e - File input change event
 */
export function handleImportFile(e) {
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
        showStatus('Settings imported successfully!', 'success');
        setTimeout(() => location.reload(), 1000);
      });
    } catch {
      showStatus('Import failed: Invalid file', 'error');
    }
  };
  reader.readAsText(file);
}

/**
 * Initialize import/export functionality
 */
export function initializeImportExport() {
  const exportBtn = document.getElementById('exportSettingsBtn');
  const importBtn = document.getElementById('importSettingsBtn');
  const importFileInput = document.getElementById('importSettingsFile');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportSettings);
  }

  if (importBtn && importFileInput) {
    importBtn.addEventListener('click', function () {
      importFileInput.value = '';
      importFileInput.click();
    });

    importFileInput.addEventListener('change', handleImportFile);
  }
}
