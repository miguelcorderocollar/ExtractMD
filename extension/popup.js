// Popup script for ExtractMD settings, import/export

// Centralized defaults - single source of truth
export const DEFAULTS = {
    includeTimestamps: true,
    addTitleToTranscript: true,
    addChannelToTranscript: true,
    addUrlToTranscript: true,
    jumpToDomain: false,
    jumpToDomainUrl: 'https://chat.openai.com/',
    hnIncludeAuthor: true,
    hnIncludeTime: true,
    hnIncludeReplies: true,
    hnNewsIncludeTitle: true,
    hnNewsIncludeUrl: true,
    hnNewsIncludeSite: true,
    hnNewsIncludePoints: true,
    hnNewsIncludeAuthor: true,
    hnNewsIncludeTime: true,
    hnNewsIncludeComments: true,
    articleExporterIncludeImages: true,
    articleExporterOnlyLongest: false,
    articleExporterShowInfo: true,
    articleExporterIncludeUrl: true,
    hnIncludeUrl: true,
    hnIncludeItemText: true,
    enableUsageKpi: true,
    closeTabAfterExtraction: false,
    downloadInsteadOfCopy: false,
    downloadIfTokensExceed: 0,
    enableYouTubeIntegration: true,
    enableHackerNewsIntegration: true,
    enableArticleIntegration: true,
    showTokenCountInNotification: false,
    ignoredDomains: ''
};

// Helper: Save setting only if it differs from default, remove if it matches
export function saveSetting(key, value) {
    if (key in DEFAULTS) {
        if (JSON.stringify(value) === JSON.stringify(DEFAULTS[key])) {
            // Value matches default, remove from storage to save space
            chrome.storage.sync.remove(key);
        } else {
            // Value differs from default, save it
            chrome.storage.sync.set({ [key]: value });
        }
    } else {
        // Unknown key, save it anyway (future compatibility)
        chrome.storage.sync.set({ [key]: value });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Clean up orphaned/legacy data from storage on popup load
    chrome.storage.sync.get(['hiddenButtonsByDomain'], function(result) {
        if (result.hiddenButtonsByDomain) {
            chrome.storage.sync.remove('hiddenButtonsByDomain', function() {
                console.debug('[ExtractMD] Cleaned up orphaned hiddenButtonsByDomain data');
            });
        }
    });

    // Settings elements
    const includeTimestampsCheckbox = document.getElementById('includeTimestamps');
    const addTitleToTranscriptCheckbox = document.getElementById('addTitleToTranscript');
    const addChannelToTranscriptCheckbox = document.getElementById('addChannelToTranscript');
    const addUrlToTranscriptCheckbox = document.getElementById('addUrlToTranscript');
    const jumpToDomainCheckbox = document.getElementById('jumpToDomain');
    const jumpToDomainUrlInput = document.getElementById('jumpToDomainUrl');
    const hnIncludeAuthorCheckbox = document.getElementById('hnIncludeAuthor');
    const hnIncludeTimeCheckbox = document.getElementById('hnIncludeTime');
    const hnIncludeRepliesCheckbox = document.getElementById('hnIncludeReplies');
    const hnNewsIncludeTitleCheckbox = document.getElementById('hnNewsIncludeTitle');
    const hnNewsIncludeUrlCheckbox = document.getElementById('hnNewsIncludeUrl');
    const hnNewsIncludeSiteCheckbox = document.getElementById('hnNewsIncludeSite');
    const hnNewsIncludePointsCheckbox = document.getElementById('hnNewsIncludePoints');
    const hnNewsIncludeAuthorCheckbox = document.getElementById('hnNewsIncludeAuthor');
    const hnNewsIncludeTimeCheckbox = document.getElementById('hnNewsIncludeTime');
    const hnNewsIncludeCommentsCheckbox = document.getElementById('hnNewsIncludeComments');
    const articleExporterIncludeImagesCheckbox = document.getElementById('articleExporterIncludeImages');
    const articleExporterOnlyLongestCheckbox = document.getElementById('articleExporterOnlyLongest');
    const articleExporterShowInfoCheckbox = document.getElementById('articleExporterShowInfo');
    const articleExporterIncludeUrlCheckbox = document.getElementById('articleExporterIncludeUrl');
    const hnIncludeUrlCheckbox = document.getElementById('hnIncludeUrl');
    const hnIncludeItemTextCheckbox = document.getElementById('hnIncludeItemText');
    const statusDiv = document.getElementById('status');
    const enableUsageKpiCheckbox = document.getElementById('showUsageKpi');
    const closeTabAfterExtractionCheckbox = document.getElementById('closeTabAfterExtraction');
    const downloadInsteadOfCopyCheckbox = document.getElementById('downloadInsteadOfCopy');
    const enableYouTubeIntegrationCheckbox = document.getElementById('enableYouTubeIntegration');
    const enableHackerNewsIntegrationCheckbox = document.getElementById('enableHackerNewsIntegration');
    const enableArticleIntegrationCheckbox = document.getElementById('enableArticleIntegration');
    const downloadIfTokensExceedInput = document.getElementById('downloadIfTokensExceed');
    const showTokenCountInNotificationCheckbox = document.getElementById('showTokenCountInNotification');
    const ignoredDomainsTextarea = document.getElementById('ignoredDomains');
    const ignoreCurrentDomainBtn = document.getElementById('ignoreCurrentDomainBtn');
    const domainValidationError = document.getElementById('domainValidationError');

    // Import/Export elements
    const exportBtn = document.getElementById('exportSettingsBtn');
    const importBtn = document.getElementById('importSettingsBtn');
    const importFileInput = document.getElementById('importSettingsFile');

    // KPI elements
    const kpiSection = document.getElementById('kpi-section');
    const kpiCounters = document.getElementById('kpi-counters');
    const clearKpiBtn = document.getElementById('clearKpiBtn');

    // Load saved settings
    chrome.storage.sync.get(DEFAULTS, function(items) {
        includeTimestampsCheckbox.checked = items.includeTimestamps;
        addTitleToTranscriptCheckbox.checked = items.addTitleToTranscript;
        addChannelToTranscriptCheckbox.checked = items.addChannelToTranscript;
        addUrlToTranscriptCheckbox.checked = items.addUrlToTranscript;
        jumpToDomainCheckbox.checked = items.jumpToDomain;
        jumpToDomainUrlInput.value = items.jumpToDomainUrl;
        hnIncludeAuthorCheckbox.checked = items.hnIncludeAuthor;
        hnIncludeTimeCheckbox.checked = items.hnIncludeTime;
        hnIncludeRepliesCheckbox.checked = items.hnIncludeReplies;
        hnNewsIncludeTitleCheckbox.checked = items.hnNewsIncludeTitle;
        hnNewsIncludeUrlCheckbox.checked = items.hnNewsIncludeUrl;
        hnNewsIncludeSiteCheckbox.checked = items.hnNewsIncludeSite;
        hnNewsIncludePointsCheckbox.checked = items.hnNewsIncludePoints;
        hnNewsIncludeAuthorCheckbox.checked = items.hnNewsIncludeAuthor;
        hnNewsIncludeTimeCheckbox.checked = items.hnNewsIncludeTime;
        hnNewsIncludeCommentsCheckbox.checked = items.hnNewsIncludeComments;
        articleExporterIncludeImagesCheckbox.checked = items.articleExporterIncludeImages;
        articleExporterOnlyLongestCheckbox.checked = items.articleExporterOnlyLongest;
        articleExporterShowInfoCheckbox.checked = items.articleExporterShowInfo;
        articleExporterIncludeUrlCheckbox.checked = items.articleExporterIncludeUrl;
        hnIncludeUrlCheckbox.checked = items.hnIncludeUrl;
        hnIncludeItemTextCheckbox.checked = items.hnIncludeItemText;
        enableUsageKpiCheckbox.checked = items.enableUsageKpi !== false;
        closeTabAfterExtractionCheckbox.checked = items.closeTabAfterExtraction;
        downloadInsteadOfCopyCheckbox.checked = items.downloadInsteadOfCopy;
        downloadIfTokensExceedInput.value = items.downloadIfTokensExceed || '';
        enableYouTubeIntegrationCheckbox.checked = items.enableYouTubeIntegration !== false;
        enableHackerNewsIntegrationCheckbox.checked = items.enableHackerNewsIntegration !== false;
        enableArticleIntegrationCheckbox.checked = items.enableArticleIntegration !== false;
        showTokenCountInNotificationCheckbox.checked = items.showTokenCountInNotification === true;
        ignoredDomainsTextarea.value = items.ignoredDomains || '';
        
        // Update ignore button state on load
        updateIgnoreButtonState();
        
        // Hide/show both the collapsible and container for integrations
        const collapsibles = document.querySelectorAll('.collapsible');
        const containers = document.querySelectorAll('.container');
        // collapsibles/containers: 0=General, 1=YT, 2=HN Comments, 3=HN News, 4=Article
        if (collapsibles[1] && containers[1]) {
          const show = items.enableYouTubeIntegration !== false;
          collapsibles[1].style.display = show ? '' : 'none';
          containers[1].style.display = show ? '' : 'none';
        }
        if (collapsibles[2] && containers[2]) {
          const show = items.enableHackerNewsIntegration !== false;
          collapsibles[2].style.display = show ? '' : 'none';
          containers[2].style.display = show ? '' : 'none';
        }
        if (collapsibles[3] && containers[3]) {
          const show = items.enableHackerNewsIntegration !== false;
          collapsibles[3].style.display = show ? '' : 'none';
          containers[3].style.display = show ? '' : 'none';
        }
        if (collapsibles[4] && containers[4]) {
          const show = items.enableArticleIntegration !== false;
          collapsibles[4].style.display = show ? '' : 'none';
          containers[4].style.display = show ? '' : 'none';
        }
        document.getElementById('kpi-section').style.display = items.enableUsageKpi === false ? 'none' : 'flex';
    });

    // Save settings when changed
    includeTimestampsCheckbox.addEventListener('change', function() {
        saveSetting('includeTimestamps', includeTimestampsCheckbox.checked);
    });
    addTitleToTranscriptCheckbox.addEventListener('change', function(e) {
        saveSetting('addTitleToTranscript', e.target.checked);
    });
    addChannelToTranscriptCheckbox.addEventListener('change', function(e) {
        saveSetting('addChannelToTranscript', e.target.checked);
    });
    addUrlToTranscriptCheckbox.addEventListener('change', function(e) {
        saveSetting('addUrlToTranscript', e.target.checked);
    });
    jumpToDomainCheckbox.addEventListener('change', function() {
        saveSetting('jumpToDomain', jumpToDomainCheckbox.checked);
    });
    jumpToDomainUrlInput.addEventListener('input', function() {
        saveSetting('jumpToDomainUrl', jumpToDomainUrlInput.value);
    });
    hnIncludeAuthorCheckbox.addEventListener('change', function() {
        saveSetting('hnIncludeAuthor', hnIncludeAuthorCheckbox.checked);
    });
    hnIncludeTimeCheckbox.addEventListener('change', function() {
        saveSetting('hnIncludeTime', hnIncludeTimeCheckbox.checked);
    });
    hnIncludeRepliesCheckbox.addEventListener('change', function() {
        saveSetting('hnIncludeReplies', hnIncludeRepliesCheckbox.checked);
    });
    hnNewsIncludeTitleCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeTitle', hnNewsIncludeTitleCheckbox.checked);
    });
    hnNewsIncludeUrlCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeUrl', hnNewsIncludeUrlCheckbox.checked);
    });
    hnNewsIncludeSiteCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeSite', hnNewsIncludeSiteCheckbox.checked);
    });
    hnNewsIncludePointsCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludePoints', hnNewsIncludePointsCheckbox.checked);
    });
    hnNewsIncludeAuthorCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeAuthor', hnNewsIncludeAuthorCheckbox.checked);
    });
    hnNewsIncludeTimeCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeTime', hnNewsIncludeTimeCheckbox.checked);
    });
    hnNewsIncludeCommentsCheckbox.addEventListener('change', function() {
        saveSetting('hnNewsIncludeComments', hnNewsIncludeCommentsCheckbox.checked);
    });
    articleExporterIncludeImagesCheckbox.addEventListener('change', function() {
        saveSetting('articleExporterIncludeImages', articleExporterIncludeImagesCheckbox.checked);
    });
    articleExporterOnlyLongestCheckbox.addEventListener('change', function() {
        saveSetting('articleExporterOnlyLongest', articleExporterOnlyLongestCheckbox.checked);
    });
    articleExporterShowInfoCheckbox.addEventListener('change', function() {
        saveSetting('articleExporterShowInfo', articleExporterShowInfoCheckbox.checked);
    });
    articleExporterIncludeUrlCheckbox.addEventListener('change', function() {
        saveSetting('articleExporterIncludeUrl', articleExporterIncludeUrlCheckbox.checked);
    });
    hnIncludeUrlCheckbox.addEventListener('change', function() {
        saveSetting('hnIncludeUrl', hnIncludeUrlCheckbox.checked);
    });
    hnIncludeItemTextCheckbox.addEventListener('change', function() {
        saveSetting('hnIncludeItemText', hnIncludeItemTextCheckbox.checked);
    });
    enableUsageKpiCheckbox.addEventListener('change', function() {
        saveSetting('enableUsageKpi', enableUsageKpiCheckbox.checked);
        document.getElementById('kpi-section').style.display = enableUsageKpiCheckbox.checked ? 'flex' : 'none';
    });
    closeTabAfterExtractionCheckbox.addEventListener('change', function() {
        saveSetting('closeTabAfterExtraction', closeTabAfterExtractionCheckbox.checked);
    });
    downloadInsteadOfCopyCheckbox.addEventListener('change', function() {
        saveSetting('downloadInsteadOfCopy', downloadInsteadOfCopyCheckbox.checked);
    });
    downloadIfTokensExceedInput.addEventListener('input', function() {
        let val = parseInt(downloadIfTokensExceedInput.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        saveSetting('downloadIfTokensExceed', val);
    });
    showTokenCountInNotificationCheckbox.addEventListener('change', function() {
        saveSetting('showTokenCountInNotification', showTokenCountInNotificationCheckbox.checked);
    });

    // Domain validation regex: allows domains, localhost, and IP addresses
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost$|^(?:\d{1,3}\.){3}\d{1,3}$/i;

    function validateDomains(text) {
        const domains = text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
        for (const domain of domains) {
            if (!domainRegex.test(domain)) return false;
        }
        return true;
    }

    ignoredDomainsTextarea.addEventListener('input', function() {
        const value = ignoredDomainsTextarea.value;
        const isValid = validateDomains(value);
        
        if (isValid || value.trim() === '') {
            domainValidationError.style.display = 'none';
            ignoredDomainsTextarea.style.borderColor = '#e0e3ef';
            saveSetting('ignoredDomains', value);
            updateIgnoreButtonState();
        } else {
            domainValidationError.style.display = 'block';
            ignoredDomainsTextarea.style.borderColor = '#dc2626';
        }
    });

    function updateIgnoreButtonState() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    const domain = url.hostname;
                    if (!domain) return;

                    chrome.storage.sync.get({ ignoredDomains: '' }, function(items) {
                        const currentDomains = items.ignoredDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
                        const isIgnored = currentDomains.includes(domain);
                        
                        if (isIgnored) {
                            ignoreCurrentDomainBtn.innerHTML = '✅ Stop Ignoring';
                            ignoreCurrentDomainBtn.style.background = '#f0fdf4';
                            ignoreCurrentDomainBtn.style.color = '#166534';
                            ignoreCurrentDomainBtn.style.borderColor = '#bbf7d0';
                        } else {
                            ignoreCurrentDomainBtn.innerHTML = '🚫 Ignore Current';
                            ignoreCurrentDomainBtn.style.background = '#f3f4f6';
                            ignoreCurrentDomainBtn.style.color = '#374151';
                            ignoreCurrentDomainBtn.style.borderColor = '#bfc6e0';
                        }
                    });
                } catch (e) {}
            }
        });
    }

    ignoreCurrentDomainBtn.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    const domain = url.hostname;
                    
                    if (!domain) {
                        showStatus('Could not determine domain', 'error');
                        return;
                    }

                    chrome.storage.sync.get({ ignoredDomains: '' }, function(items) {
                        let currentDomains = items.ignoredDomains.split('\n').map(d => d.trim()).filter(d => d.length > 0);
                        
                        if (currentDomains.includes(domain)) {
                            // Un-ignore (remove)
                            currentDomains = currentDomains.filter(d => d !== domain);
                            const newValue = currentDomains.join('\n');
                            saveSetting('ignoredDomains', newValue);
                            ignoredDomainsTextarea.value = newValue;
                            showStatus(`Removed ${domain} from ignored domains`, 'success');
                            updateIgnoreButtonState();
                        } else {
                            // Ignore (add)
                            currentDomains.push(domain);
                            const newValue = currentDomains.join('\n');
                            saveSetting('ignoredDomains', newValue);
                            ignoredDomainsTextarea.value = newValue;
                            showStatus(`Added ${domain} to ignored domains`, 'success');
                            updateIgnoreButtonState();
                        }
                    });
                } catch (e) {
                    showStatus('Invalid URL', 'error');
                }
            }
        });
    });

    // Integration enable/disable toggles (no reload, update UI in-place)
    enableYouTubeIntegrationCheckbox.addEventListener('change', function() {
        saveSetting('enableYouTubeIntegration', enableYouTubeIntegrationCheckbox.checked);
        updateIntegrationVisibility();
    });
    enableHackerNewsIntegrationCheckbox.addEventListener('change', function() {
        saveSetting('enableHackerNewsIntegration', enableHackerNewsIntegrationCheckbox.checked);
        updateIntegrationVisibility();
    });
    enableArticleIntegrationCheckbox.addEventListener('change', function() {
        saveSetting('enableArticleIntegration', enableArticleIntegrationCheckbox.checked);
        updateIntegrationVisibility();
    });

    // Helper to update integration visibility and preserve General Settings open state
    function updateIntegrationVisibility() {
        // Preserve General Settings open state
        const generalOpen = containers[0].classList.contains('open');
        chrome.storage.sync.get({
            enableYouTubeIntegration: true,
            enableHackerNewsIntegration: true,
            enableArticleIntegration: true,
        }, function(items) {
            if (collapsibles[1] && containers[1]) {
                const show = items.enableYouTubeIntegration !== false;
                collapsibles[1].style.display = show ? '' : 'none';
                containers[1].style.display = show ? '' : 'none';
            }
            if (collapsibles[2] && containers[2]) {
                const show = items.enableHackerNewsIntegration !== false;
                collapsibles[2].style.display = show ? '' : 'none';
                containers[2].style.display = show ? '' : 'none';
            }
            if (collapsibles[3] && containers[3]) {
                const show = items.enableHackerNewsIntegration !== false;
                collapsibles[3].style.display = show ? '' : 'none';
                containers[3].style.display = show ? '' : 'none';
            }
            if (collapsibles[4] && containers[4]) {
                const show = items.enableArticleIntegration !== false;
                collapsibles[4].style.display = show ? '' : 'none';
                containers[4].style.display = show ? '' : 'none';
            }
            // Restore General Settings open state
            if (generalOpen) {
                containers[0].classList.add('open');
            } else {
                containers[0].classList.remove('open');
            }
        });
    }

    // Status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // Get extension name/version from manifest
    function getManifest(cb) {
        fetch(chrome.runtime.getURL('manifest.json'))
            .then(r => r.json())
            .then(cb)
            .catch(() => cb({ name: 'ExtractMD', version: 'unknown' }));
    }

    // Export settings
    exportBtn.addEventListener('click', function() {
        chrome.storage.sync.get(null, function(allSettings) {
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
            
            getManifest(function(manifest) {
                const exportData = {
                    extension: manifest.name || 'ExtractMD',
                    version: manifest.version || 'unknown',
                    timestamp: new Date().toISOString(),
                    settings: exportSettings
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ExtractMD-settings-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                showStatus('Settings exported!', 'success');
            });
        });
    });

    // Import settings
    importBtn.addEventListener('click', function() {
        importFileInput.value = '';
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data || typeof data !== 'object' || !data.settings) throw new Error('Invalid file');
                
                // Validate extension name
                if (data.extension !== 'ExtractMD') {
                    if (!confirm(`This file identifies as "${data.extension || 'unknown'}", not "ExtractMD". Import anyway?`)) {
                        return;
                    }
                }

                const settingsToImport = {};
                const schema = {
                    includeTimestamps: 'boolean',
                    addTitleToTranscript: 'boolean',
                    addChannelToTranscript: 'boolean',
                    addUrlToTranscript: 'boolean',
                    hnIncludeAuthor: 'boolean',
                    hnIncludeTime: 'boolean',
                    hnIncludeReplies: 'boolean',
                    hnIncludeUrl: 'boolean',
                    hnIncludeItemText: 'boolean',
                    hnNewsIncludeTitle: 'boolean',
                    hnNewsIncludeUrl: 'boolean',
                    hnNewsIncludeSite: 'boolean',
                    hnNewsIncludePoints: 'boolean',
                    hnNewsIncludeAuthor: 'boolean',
                    hnNewsIncludeTime: 'boolean',
                    hnNewsIncludeComments: 'boolean',
                    articleExporterIncludeImages: 'boolean',
                    articleExporterOnlyLongest: 'boolean',
                    articleExporterShowInfo: 'boolean',
                    articleExporterIncludeUrl: 'boolean',
                    jumpToDomain: 'boolean',
                    jumpToDomainUrl: 'string',
                    enableUsageKpi: 'boolean',
                    closeTabAfterExtraction: 'boolean',
                    downloadInsteadOfCopy: 'boolean',
                    downloadIfTokensExceed: 'number',
                    showTokenCountInNotification: 'boolean',
                    ignoredDomains: 'string',
                    enableYouTubeIntegration: 'boolean',
                    enableHackerNewsIntegration: 'boolean',
                    enableArticleIntegration: 'boolean'
                };

                // Filter and sanitize based on schema
                for (const key in schema) {
                    if (data.settings.hasOwnProperty(key)) {
                        const type = schema[key];
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

                // Explicitly ignore orphaned/legacy keys that are no longer used
                // (hiddenButtonsByDomain is legacy data not used in current codebase)

                chrome.storage.sync.set(settingsToImport, function() {
                    showStatus('Settings imported successfully!', 'success');
                    setTimeout(() => location.reload(), 1000);
                });
            } catch (err) {
                showStatus('Import failed: Invalid file', 'error');
                return;
            }
        };
        reader.readAsText(file);
    });

    // Accordion logic
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const container = this.nextElementSibling;
            if (container) {
                container.classList.toggle('open');
            }
        });
    });

    // Helper: Render KPI counters
    function renderKpiCounters(stats) {
        kpiCounters.innerHTML = `
            <span title="YouTube transcript copies">YT: <b>${stats.youtube || 0}</b></span>
            <span title="Article exports">Articles: <b>${stats.articles || 0}</b></span>
            <span title="HN comments exports">HN Comments: <b>${stats.hn_comments || 0}</b></span>
            <span title="HN news exports">HN News: <b>${stats.hn_news || 0}</b></span>
        `;

        // Calculate time saved
        const estimates = {
            youtube: 60,    
            articles: 30,   
            hn_comments: 40, 
            hn_news: 20   
        };

        const totalSeconds = 
            (stats.youtube || 0) * estimates.youtube +
            (stats.articles || 0) * estimates.articles +
            (stats.hn_comments || 0) * estimates.hn_comments +
            (stats.hn_news || 0) * estimates.hn_news;

        const timeSavedElement = document.getElementById('kpi-time-saved');
        if (totalSeconds > 0) {
            timeSavedElement.style.display = 'block';
            timeSavedElement.innerHTML = `Estimated time saved: ~<b>${formatTimeSaved(totalSeconds)}</b>`;
        } else {
            timeSavedElement.style.display = 'none';
        }
    }

    // Helper: Format time saved
    function formatTimeSaved(totalSeconds) {
        if (totalSeconds < 60) return `${totalSeconds}s`;
        
        const minutes = totalSeconds / 60;
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        }
        
        const hours = minutes / 60;
        if (hours < 24) {
            return `${hours.toFixed(1).replace('.0', '')}h`;
        }
        
        const days = hours / 24;
        return `${days.toFixed(1).replace('.0', '')}d`;
    }

    // Load and display KPI counters
    function loadKpiCounters() {
        chrome.storage.sync.get({ usageStats: {} }, function(items) {
            renderKpiCounters(items.usageStats || {});
        });
    }
    loadKpiCounters();

    // Clear KPI counters
    clearKpiBtn.addEventListener('click', function() {
        chrome.storage.sync.set({ usageStats: { youtube: 0, articles: 0, hn_comments: 0, hn_news: 0 } }, function() {
            loadKpiCounters();
            showStatus('Usage counters cleared!', 'success');
        });
    });
}); 