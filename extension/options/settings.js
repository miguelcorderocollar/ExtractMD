// Settings load/save management for ExtractMD options page

import { DEFAULTS } from '../shared/defaults.js';
import { saveSetting } from '../shared/storage.js';
import { updateIgnoreButtonState } from './domainIgnore.js';
import { applyInitialIntegrationVisibility, updateIntegrationVisibility } from './integrationVisibility.js';

/**
 * Mapping of setting keys to their DOM element IDs
 * Format: { settingKey: { id: 'elementId', type: 'checkbox' | 'text' | 'number' } }
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
    
    // General settings
    jumpToDomain: { id: 'jumpToDomain', type: 'checkbox' },
    jumpToDomainUrl: { id: 'jumpToDomainUrl', type: 'text' },
    enableUsageKpi: { id: 'showUsageKpi', type: 'checkbox', invertDefault: true },
    closeTabAfterExtraction: { id: 'closeTabAfterExtraction', type: 'checkbox' },
    downloadInsteadOfCopy: { id: 'downloadInsteadOfCopy', type: 'checkbox' },
    downloadIfTokensExceed: { id: 'downloadIfTokensExceed', type: 'number' },
    showTokenCountInNotification: { id: 'showTokenCountInNotification', type: 'checkbox' },
    ignoredDomains: { id: 'ignoredDomains', type: 'textarea' },
    
    // Integration toggles
    enableYouTubeIntegration: { id: 'enableYouTubeIntegration', type: 'checkbox', invertDefault: true },
    enableHackerNewsIntegration: { id: 'enableHackerNewsIntegration', type: 'checkbox', invertDefault: true },
    enableArticleIntegration: { id: 'enableArticleIntegration', type: 'checkbox', invertDefault: true }
};

/**
 * Load settings from storage and populate form elements
 */
export function loadSettings() {
    chrome.storage.sync.get(DEFAULTS, function(items) {
        for (const [key, config] of Object.entries(SETTING_ELEMENTS)) {
            const element = document.getElementById(config.id);
            if (!element) continue;
            
            const value = items[key];
            
            if (config.type === 'checkbox') {
                // Handle invertDefault for boolean settings that default to true
                if (config.invertDefault) {
                    element.checked = value !== false;
                } else {
                    element.checked = value;
                }
            } else if (config.type === 'text' || config.type === 'textarea') {
                element.value = value || '';
            } else if (config.type === 'number') {
                element.value = value || '';
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
        const element = document.getElementById(config.id);
        if (!element) continue;
        
        if (config.type === 'checkbox') {
            element.addEventListener('change', function() {
                saveSetting(key, element.checked);
                
                // Special handling for KPI visibility
                if (key === 'enableUsageKpi') {
                    const kpiSection = document.getElementById('kpi-section');
                    if (kpiSection) {
                        kpiSection.style.display = element.checked ? 'flex' : 'none';
                    }
                }
                
                // Special handling for integration visibility
                if (key === 'enableYouTubeIntegration' || 
                    key === 'enableHackerNewsIntegration' || 
                    key === 'enableArticleIntegration') {
                    updateIntegrationVisibility();
                }
            });
        } else if (config.type === 'text' || config.type === 'textarea') {
            // Text inputs are handled separately (domain validation, etc.)
            if (key === 'jumpToDomainUrl') {
                element.addEventListener('input', function() {
                    saveSetting(key, element.value);
                });
            }
            // ignoredDomains is handled by domainIgnore.js
        } else if (config.type === 'number') {
            element.addEventListener('input', function() {
                let val = parseInt(element.value, 10);
                if (isNaN(val) || val < 0) val = 0;
                saveSetting(key, val);
            });
        }
    }
}

/**
 * Clean up orphaned/legacy data from storage
 */
export function cleanupLegacyData() {
    chrome.storage.sync.get(['hiddenButtonsByDomain'], function(result) {
        if (result.hiddenButtonsByDomain) {
            chrome.storage.sync.remove('hiddenButtonsByDomain', function() {
                console.debug('[ExtractMD] Cleaned up orphaned hiddenButtonsByDomain data');
            });
        }
    });
}

/**
 * Initialize settings module
 */
export function initializeSettings() {
    cleanupLegacyData();
    loadSettings();
    attachSettingHandlers();
}

