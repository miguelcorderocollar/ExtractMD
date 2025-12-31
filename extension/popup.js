// Popup script for ExtractMD settings, import/export

document.addEventListener('DOMContentLoaded', function() {
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
    chrome.storage.sync.get({
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
        ignoredDomains: '',
    }, function(items) {
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
        chrome.storage.sync.set({ includeTimestamps: includeTimestampsCheckbox.checked });
    });
    addTitleToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addTitleToTranscript: e.target.checked });
    });
    addChannelToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addChannelToTranscript: e.target.checked });
    });
    addUrlToTranscriptCheckbox.addEventListener('change', function(e) {
        chrome.storage.sync.set({ addUrlToTranscript: e.target.checked });
    });
    jumpToDomainCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ jumpToDomain: jumpToDomainCheckbox.checked });
    });
    jumpToDomainUrlInput.addEventListener('input', function() {
        chrome.storage.sync.set({ jumpToDomainUrl: jumpToDomainUrlInput.value });
    });
    hnIncludeAuthorCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeAuthor: hnIncludeAuthorCheckbox.checked });
    });
    hnIncludeTimeCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeTime: hnIncludeTimeCheckbox.checked });
    });
    hnIncludeRepliesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeReplies: hnIncludeRepliesCheckbox.checked });
    });
    hnNewsIncludeTitleCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeTitle: hnNewsIncludeTitleCheckbox.checked });
    });
    hnNewsIncludeUrlCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeUrl: hnNewsIncludeUrlCheckbox.checked });
    });
    hnNewsIncludeSiteCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeSite: hnNewsIncludeSiteCheckbox.checked });
    });
    hnNewsIncludePointsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludePoints: hnNewsIncludePointsCheckbox.checked });
    });
    hnNewsIncludeAuthorCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeAuthor: hnNewsIncludeAuthorCheckbox.checked });
    });
    hnNewsIncludeTimeCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeTime: hnNewsIncludeTimeCheckbox.checked });
    });
    hnNewsIncludeCommentsCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnNewsIncludeComments: hnNewsIncludeCommentsCheckbox.checked });
    });
    articleExporterIncludeImagesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ articleExporterIncludeImages: articleExporterIncludeImagesCheckbox.checked });
    });
    articleExporterOnlyLongestCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ articleExporterOnlyLongest: articleExporterOnlyLongestCheckbox.checked });
    });
    articleExporterShowInfoCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ articleExporterShowInfo: articleExporterShowInfoCheckbox.checked });
    });
    articleExporterIncludeUrlCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ articleExporterIncludeUrl: articleExporterIncludeUrlCheckbox.checked });
    });
    hnIncludeUrlCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeUrl: hnIncludeUrlCheckbox.checked });
    });
    hnIncludeItemTextCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ hnIncludeItemText: hnIncludeItemTextCheckbox.checked });
    });
    enableUsageKpiCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ enableUsageKpi: enableUsageKpiCheckbox.checked }, function() {
            document.getElementById('kpi-section').style.display = enableUsageKpiCheckbox.checked ? 'flex' : 'none';
        });
    });
    closeTabAfterExtractionCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ closeTabAfterExtraction: closeTabAfterExtractionCheckbox.checked });
    });
    downloadInsteadOfCopyCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ downloadInsteadOfCopy: downloadInsteadOfCopyCheckbox.checked });
    });
    downloadIfTokensExceedInput.addEventListener('input', function() {
        let val = parseInt(downloadIfTokensExceedInput.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        chrome.storage.sync.set({ downloadIfTokensExceed: val });
    });
    showTokenCountInNotificationCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ showTokenCountInNotification: showTokenCountInNotificationCheckbox.checked });
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
            chrome.storage.sync.set({ ignoredDomains: value }, function() {
                updateIgnoreButtonState();
            });
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
                            chrome.storage.sync.set({ ignoredDomains: newValue }, function() {
                                ignoredDomainsTextarea.value = newValue;
                                showStatus(`Removed ${domain} from ignored domains`, 'success');
                                updateIgnoreButtonState();
                            });
                        } else {
                            // Ignore (add)
                            currentDomains.push(domain);
                            const newValue = currentDomains.join('\n');
                            chrome.storage.sync.set({ ignoredDomains: newValue }, function() {
                                ignoredDomainsTextarea.value = newValue;
                                showStatus(`Added ${domain} to ignored domains`, 'success');
                                updateIgnoreButtonState();
                            });
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
        chrome.storage.sync.set({ enableYouTubeIntegration: enableYouTubeIntegrationCheckbox.checked }, function() {
            updateIntegrationVisibility();
        });
    });
    enableHackerNewsIntegrationCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ enableHackerNewsIntegration: enableHackerNewsIntegrationCheckbox.checked }, function() {
            updateIntegrationVisibility();
        });
    });
    enableArticleIntegrationCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ enableArticleIntegration: enableArticleIntegrationCheckbox.checked }, function() {
            updateIntegrationVisibility();
        });
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
        chrome.storage.sync.get(null, function(settings) {
            getManifest(function(manifest) {
                const exportData = {
                    extension: manifest.name || 'ExtractMD',
                    version: manifest.version || 'unknown',
                    timestamp: new Date().toISOString(),
                    settings
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
                chrome.storage.sync.set(data.settings, function() {
                    // Reload UI with new settings
                    location.reload();
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