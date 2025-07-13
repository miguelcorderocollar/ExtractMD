// ExtractMD Options Page Script

document.addEventListener('DOMContentLoaded', function() {
  // Settings elements
  const settings = {
    enableYouTubeIntegration: document.getElementById('enableYouTubeIntegration'),
    enableHackerNewsIntegration: document.getElementById('enableHackerNewsIntegration'),
    enableArticleIntegration: document.getElementById('enableArticleIntegration'),
    jumpToDomain: document.getElementById('jumpToDomain'),
    jumpToDomainUrl: document.getElementById('jumpToDomainUrl'),
    showUsageKpi: document.getElementById('showUsageKpi'),
    closeTabAfterExtraction: document.getElementById('closeTabAfterExtraction'),
    downloadInsteadOfCopy: document.getElementById('downloadInsteadOfCopy'),
    downloadIfTokensExceed: document.getElementById('downloadIfTokensExceed'),
    showTokenCountInNotification: document.getElementById('showTokenCountInNotification'),
    includeTimestamps: document.getElementById('includeTimestamps'),
    addTitleToTranscript: document.getElementById('addTitleToTranscript'),
    addChannelToTranscript: document.getElementById('addChannelToTranscript'),
    addUrlToTranscript: document.getElementById('addUrlToTranscript'),
    hnIncludeAuthor: document.getElementById('hnIncludeAuthor'),
    hnIncludeTime: document.getElementById('hnIncludeTime'),
    hnIncludeReplies: document.getElementById('hnIncludeReplies'),
    hnIncludeUrl: document.getElementById('hnIncludeUrl'),
    hnIncludeItemText: document.getElementById('hnIncludeItemText'),
    hnNewsIncludeTitle: document.getElementById('hnNewsIncludeTitle'),
    hnNewsIncludeUrl: document.getElementById('hnNewsIncludeUrl'),
    hnNewsIncludeSite: document.getElementById('hnNewsIncludeSite'),
    hnNewsIncludePoints: document.getElementById('hnNewsIncludePoints'),
    hnNewsIncludeAuthor: document.getElementById('hnNewsIncludeAuthor'),
    hnNewsIncludeTime: document.getElementById('hnNewsIncludeTime'),
    hnNewsIncludeComments: document.getElementById('hnNewsIncludeComments'),
    articleExporterIncludeImages: document.getElementById('articleExporterIncludeImages'),
    articleExporterOnlyLongest: document.getElementById('articleExporterOnlyLongest'),
    articleExporterShowInfo: document.getElementById('articleExporterShowInfo'),
    articleExporterIncludeUrl: document.getElementById('articleExporterIncludeUrl'),
  };

  // Import/Export elements
  const exportBtn = document.getElementById('exportSettingsBtn');
  const importBtn = document.getElementById('importSettingsBtn');
  const importFileInput = document.getElementById('importSettingsFile');

  // KPI elements
  const kpiCounters = document.getElementById('kpi-counters');
  const clearKpiBtn = document.getElementById('clearKpiBtn');

  // Load saved settings
  chrome.storage.sync.get({
    enableYouTubeIntegration: true,
    enableHackerNewsIntegration: true,
    enableArticleIntegration: true,
    jumpToDomain: false,
    jumpToDomainUrl: 'https://chat.openai.com/',
    showUsageKpi: true,
    closeTabAfterExtraction: false,
    downloadInsteadOfCopy: false,
    downloadIfTokensExceed: 0,
    showTokenCountInNotification: false,
    includeTimestamps: true,
    addTitleToTranscript: true,
    addChannelToTranscript: true,
    addUrlToTranscript: true,
    hnIncludeAuthor: true,
    hnIncludeTime: true,
    hnIncludeReplies: true,
    hnIncludeUrl: true,
    hnIncludeItemText: true,
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
  }, function(items) {
    for (const key in settings) {
      if (!settings[key]) continue;
      if (settings[key].type === 'checkbox') {
        settings[key].checked = !!items[key];
      } else if (settings[key].type === 'number') {
        settings[key].value = items[key] || '';
      } else {
        settings[key].value = items[key] || '';
      }
    }
    updateIntegrationVisibility();
    updateKpiVisibility();
  });

  // Save settings on change
  for (const key in settings) {
    if (!settings[key]) continue;
    settings[key].addEventListener('change', function(e) {
      let value;
      if (settings[key].type === 'checkbox') {
        value = settings[key].checked;
      } else if (settings[key].type === 'number') {
        value = parseInt(settings[key].value, 10);
        if (isNaN(value) || value < 0) value = 0;
      } else {
        value = settings[key].value;
      }
      chrome.storage.sync.set({ [key]: value }, function() {
        if ([
          'enableYouTubeIntegration',
          'enableHackerNewsIntegration',
          'enableArticleIntegration',
        ].includes(key)) {
          updateIntegrationVisibility();
        }
        if (key === 'showUsageKpi') {
          updateKpiVisibility();
        }
      });
    });
  }

  // Integration section visibility
  function updateIntegrationVisibility() {
    document.getElementById('ytSection').style.display = settings.enableYouTubeIntegration.checked ? '' : 'none';
    document.getElementById('hnCommentsSection').style.display = settings.enableHackerNewsIntegration.checked ? '' : 'none';
    document.getElementById('hnNewsSection').style.display = settings.enableHackerNewsIntegration.checked ? '' : 'none';
    document.getElementById('articleSection').style.display = settings.enableArticleIntegration.checked ? '' : 'none';
  }

  // KPI section visibility
  function updateKpiVisibility() {
    document.querySelector('.kpi-section').style.display = settings.showUsageKpi.checked ? '' : 'none';
  }

  // Render KPI counters
  function renderKpiCounters(stats) {
    kpiCounters.innerHTML = `
      <span class="kpi-item"><img src="images/youtube.svg" class="kpi-logo" alt="YouTube"> YT: <b>${stats.youtube || 0}</b></span>
      <span class="kpi-item"><img src="images/hackernews.svg" class="kpi-logo" alt="HN Comments"> HN Comments: <b>${stats.hn_comments || 0}</b></span>
      <span class="kpi-item"><img src="images/hackernews.svg" class="kpi-logo" alt="HN News"> HN News: <b>${stats.hn_news || 0}</b></span>
      <span class="kpi-item"><img src="images/article.svg" class="kpi-logo" alt="Article"> Articles: <b>${stats.articles || 0}</b></span>
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
    chrome.storage.sync.set({ usageStats: {} }, function() {
      loadKpiCounters();
    });
  });

  // Export settings
  exportBtn.addEventListener('click', function() {
    chrome.storage.sync.get(null, function(settings) {
      // Ensure usageStats is present and up to date
      chrome.storage.sync.get({ usageStats: {} }, function(statsObj) {
        settings.usageStats = statsObj.usageStats || {};
        const exportData = {
          extension: 'ExtractMD',
          version: '2.0',
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
        // Always restore usageStats if present, or keep current if not
        chrome.storage.sync.get({ usageStats: {} }, function(currentStats) {
          const mergedSettings = { ...data.settings };
          if (!mergedSettings.usageStats) {
            mergedSettings.usageStats = currentStats.usageStats || {};
          }
          chrome.storage.sync.set(mergedSettings, function() {
            location.reload();
          });
        });
      } catch (err) {
        alert('Import failed: Invalid file');
        return;
      }
    };
    reader.readAsText(file);
  });
}); 