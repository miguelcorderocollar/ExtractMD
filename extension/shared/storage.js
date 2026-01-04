// Shared storage utilities for ExtractMD
// Used by popup and content scripts

import { DEFAULTS } from './defaults.js';

/**
 * Get settings from chrome.storage.sync, with defaults applied
 * @param {string[]|null} keys - Specific keys to fetch, or null for all defaults
 * @returns {Promise<Object>} Settings object with defaults applied
 */
export function getSettings(keys = null) {
  const toGet = keys ? pick(DEFAULTS, keys) : DEFAULTS;
  return new Promise((resolve) => {
    chrome.storage.sync.get(toGet, resolve);
  });
}

/**
 * Save a single setting to chrome.storage.sync
 * Removes key if value matches default (saves storage space)
 * Dispatches a custom event for UI feedback
 * @param {string} key - Setting key
 * @param {any} value - Setting value
 */
export function saveSetting(key, value) {
  const onComplete = () => {
    // Dispatch event for UI feedback (options page listens for this)
    if (typeof document !== 'undefined') {
      document.dispatchEvent(
        new CustomEvent('extractmd-setting-saved', {
          detail: { key, value },
        })
      );
    }
  };

  if (key in DEFAULTS) {
    if (JSON.stringify(value) === JSON.stringify(DEFAULTS[key])) {
      // Value matches default, remove from storage to save space
      chrome.storage.sync.remove(key, onComplete);
    } else {
      // Value differs from default, save it
      chrome.storage.sync.set({ [key]: value }, onComplete);
    }
  } else {
    // Unknown key, save it anyway (future compatibility)
    chrome.storage.sync.set({ [key]: value }, onComplete);
  }
}

/**
 * Increment a KPI counter if usage tracking is enabled
 * @param {string} type - KPI type (youtube, articles, hn_comments, hn_news)
 */
export async function incrementKpi(type) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function (items) {
      if (items.enableUsageKpi !== false) {
        const stats = items.usageStats || {};
        stats[type] = (stats[type] || 0) + 1;
        chrome.storage.sync.set({ usageStats: stats }, resolve);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Pick specific keys from an object
 * @param {Object} obj - Source object
 * @param {string[]} keys - Keys to pick
 * @returns {Object} New object with only specified keys
 */
function pick(obj, keys) {
  if (!keys) return obj;
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}
