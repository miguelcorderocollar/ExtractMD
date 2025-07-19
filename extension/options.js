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
    enableDarkTheme: document.getElementById('enableDarkTheme'),
    enableSidePanelPreview: document.getElementById('enableSidePanelPreview'),
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
    enableDarkTheme: false,
    enableSidePanelPreview: false,
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
    updateDarkTheme();
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
        if (key === 'enableDarkTheme') {
          updateDarkTheme();
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

  // Dark theme logic
  function updateDarkTheme() {
    if (settings.enableDarkTheme.checked) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Add side panel preview setting
  function createSidePanelPreviewSetting() {
    const container = document.createElement('div');
    container.style.margin = '16px 0';
    const label = document.createElement('label');
    label.textContent = 'Enable Side Panel Markdown Preview';
    label.style.fontWeight = '600';
    label.style.marginRight = '12px';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'enableSidePanelPreview';
    label.appendChild(checkbox);
    container.appendChild(label);
    document.body.appendChild(container);

    // Load setting
    chrome.storage.sync.get({ enableSidePanelPreview: false }, function(items) {
      checkbox.checked = !!items.enableSidePanelPreview;
    });

    // Save setting
    checkbox.addEventListener('change', function() {
      chrome.storage.sync.set({ enableSidePanelPreview: checkbox.checked });
    });
  }

  // Call this function when options page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSidePanelPreviewSetting);
  } else {
    createSidePanelPreviewSetting();
  }

  // Render KPI counters
  function renderKpiCounters(stats) {
    kpiCounters.innerHTML = `
      <span class="kpi-item"><svg class="kpi-logo" height="24" width="24" viewBox="0 0 461.001 461.001" xmlns="http://www.w3.org/2000/svg"><g fill='currentColor'><path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z"/></g></svg> YT: <b>${stats.youtube || 0}</b></span>
      <span class="kpi-item"><svg class="kpi-logo" height="24" width="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="article" fill='currentColor'><g><path d="M20.5,22H4c-0.2,0-0.3,0-0.5,0C1.6,22,0,20.4,0,18.5V6h5V2h19v16.5C24,20.4,22.4,22,20.5,22z M6.7,20h13.8c0.8,0,1.5-0.7,1.5-1.5V4H7v14.5C7,19,6.9,19.5,6.7,20z M2,8v10.5C2,19.3,2.7,20,3.5,20S5,19.3,5,18.5V8H2z"/></g><g><rect x="15" y="6" width="5" height="6"/></g><g><rect x="9" y="6" width="4" height="2"/></g><g><rect x="9" y="10" width="4" height="2"/></g><g><rect x="9" y="14" width="11" height="2"/></g></g></svg> Articles: <b>${stats.articles || 0}</b></span>
      <span class="kpi-item"><svg class="kpi-logo hn-svg" height="24" width="24" viewBox="4 4 188 188" xmlns="http://www.w3.org/2000/svg"><path fill='currentColor' d="m4 4h188v188h-188z"/><path d="m73.2521756 45.01 22.7478244 47.39130083 22.7478244-47.39130083h19.56569631l-34.32352071 64.48661468v41.49338532h-15.98v-41.49338532l-34.32352071-64.48661468z"/></svg> HN Comments: <b>${stats.hn_comments || 0}</b></span>
      <span class="kpi-item"><svg class="kpi-logo hn-svg" height="24" width="24" viewBox="4 4 188 188" xmlns="http://www.w3.org/2000/svg"><path fill='currentColor' d="m4 4h188v188h-188z"/><path d="m73.2521756 45.01 22.7478244 47.39130083 22.7478244-47.39130083h19.56569631l-34.32352071 64.48661468v41.49338532h-15.98v-41.49338532l-34.32352071-64.48661468z"/></svg> HN News: <b>${stats.hn_news || 0}</b></span>
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