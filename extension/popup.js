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
    const enablePageIntegrationCheckbox = document.getElementById('enablePageIntegration');
    const pageIncludeImagesCheckbox = document.getElementById('pageIncludeImages');
    const pageIncludeTablesCheckbox = document.getElementById('pageIncludeTables');
    const pageIncludeLinksCheckbox = document.getElementById('pageIncludeLinks');
    const pageOnlyMainSectionCheckbox = document.getElementById('pageOnlyMainSection');
    const pageSimplifyAggressivelyCheckbox = document.getElementById('pageSimplifyAggressively');
    const pageIncludeTitleCheckbox = document.getElementById('pageIncludeTitle');
    const pageIncludeUrlCheckbox = document.getElementById('pageIncludeUrl');
    const downloadIfTokensExceedInput = document.getElementById('downloadIfTokensExceed');
    const showTokenCountInNotificationCheckbox = document.getElementById('showTokenCountInNotification');

    // Import/Export elements
    const exportBtn = document.getElementById('exportSettingsBtn');
    const importBtn = document.getElementById('importSettingsBtn');
    const importFileInput = document.getElementById('importSettingsFile');

    // KPI elements
    const kpiSection = document.getElementById('kpi-section');
    const kpiCounters = document.getElementById('kpi-counters');
    const clearKpiBtn = document.getElementById('clearKpiBtn');
    // Domain toggle elements
    const domainToggleRow = document.getElementById('domainFloatingToggle');
    const domainToggleCheckbox = document.getElementById('toggleFloatingButtonOnDomain');

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
        enablePageIntegration: true,
        pageIncludeImages: true,
        pageIncludeTables: true,
        pageIncludeLinks: true,
        pageOnlyMainSection: true,
        pageSimplifyAggressively: true,
        pageIncludeTitle: true,
        pageIncludeUrl: true,
        showTokenCountInNotification: false,
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
        enablePageIntegrationCheckbox.checked = items.enablePageIntegration !== false;
        pageIncludeImagesCheckbox.checked = items.pageIncludeImages !== false;
        pageIncludeTablesCheckbox.checked = items.pageIncludeTables !== false;
        pageIncludeLinksCheckbox.checked = items.pageIncludeLinks !== false;
        pageOnlyMainSectionCheckbox.checked = items.pageOnlyMainSection !== false;
        pageSimplifyAggressivelyCheckbox.checked = items.pageSimplifyAggressively !== false;
        pageIncludeTitleCheckbox.checked = items.pageIncludeTitle !== false;
        pageIncludeUrlCheckbox.checked = items.pageIncludeUrl !== false;
        showTokenCountInNotificationCheckbox.checked = items.showTokenCountInNotification === true;
        // Hide/show both the collapsible and container for integrations
        const collapsibles = document.querySelectorAll('.collapsible');
        const containers = document.querySelectorAll('.container');
        // collapsibles/containers: 0=General, 1=YT, 2=HN Comments, 3=HN News, 4=Article, 5=Page
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
        if (collapsibles[5] && containers[5]) {
          const show = items.enablePageIntegration !== false;
          collapsibles[5].style.display = show ? '' : 'none';
          containers[5].style.display = show ? '' : 'none';
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
    pageIncludeImagesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageIncludeImages: pageIncludeImagesCheckbox.checked });
    });
    pageIncludeTablesCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageIncludeTables: pageIncludeTablesCheckbox.checked });
    });
    pageIncludeLinksCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageIncludeLinks: pageIncludeLinksCheckbox.checked });
    });
    pageOnlyMainSectionCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageOnlyMainSection: pageOnlyMainSectionCheckbox.checked });
    });
    pageSimplifyAggressivelyCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageSimplifyAggressively: pageSimplifyAggressivelyCheckbox.checked });
    });
    pageIncludeTitleCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageIncludeTitle: pageIncludeTitleCheckbox.checked });
    });
    pageIncludeUrlCheckbox.addEventListener('change', function() {
        chrome.storage.sync.set({ pageIncludeUrl: pageIncludeUrlCheckbox.checked });
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
        enablePageIntegrationCheckbox.addEventListener('change', function() {
            chrome.storage.sync.set({ enablePageIntegration: enablePageIntegrationCheckbox.checked }, function() {
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
                enablePageIntegration: true,
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
                if (collapsibles[5] && containers[5]) {
                    const show = items.enablePageIntegration !== false;
                    collapsibles[5].style.display = show ? '' : 'none';
                    containers[5].style.display = show ? '' : 'none';
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
                <span title="Page simplifications">Pages: <b>${stats.pages || 0}</b></span>
                <span title="HN comments exports">HN Comments: <b>${stats.hn_comments || 0}</b></span>
                <span title="HN news exports">HN News: <b>${stats.hn_news || 0}</b></span>
            `;
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
            chrome.storage.sync.set({ usageStats: { youtube: 0, articles: 0, pages: 0, hn_comments: 0, hn_news: 0 } }, function() {
                loadKpiCounters();
                showStatus('Usage counters cleared!', 'success');
            });
        });

    // Domain-specific floating button toggle
    function getHostnameFromUrl(url) {
      try { return new URL(url).hostname; } catch { return ''; }
    }
    function loadDomainToggle() {
      if (!domainToggleRow || !domainToggleCheckbox) return;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        const host = tab ? getHostnameFromUrl(tab.url || '') : '';
        if (!host) {
          domainToggleRow.style.display = 'none';
          return;
        }
        chrome.storage.sync.get({ hiddenButtonsByDomain: {} }, (items) => {
          const map = items.hiddenButtonsByDomain || {};
          const hidden = !!map[host];
          domainToggleCheckbox.checked = !hidden; // checkbox shows "show"
          domainToggleRow.style.display = '';
          domainToggleCheckbox.onchange = function() {
            const nextHidden = !domainToggleCheckbox.checked;
            const nextMap = { ...(items.hiddenButtonsByDomain || {}) };
            if (nextHidden) nextMap[host] = true; else delete nextMap[host];
            chrome.storage.sync.set({ hiddenButtonsByDomain: nextMap }, () => {
              if (tab && tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: 'extractmd_refresh_fab' });
              }
              showStatus(nextHidden ? 'Floating button hidden on this site.' : 'Floating button shown on this site.', 'success');
            });
          };
        });
      });
    }
    loadDomainToggle();
}); 