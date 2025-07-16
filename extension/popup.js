// Popup script for ExtractMD settings, import/export

document.addEventListener('DOMContentLoaded', function() {
    // Apply dark theme if enabled in settings
    chrome.storage.sync.get({ enableDarkTheme: false }, function(items) {
        if (items.enableDarkTheme) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });

    // Add handler for opening options page
    const openOptionsBtn = document.getElementById('openOptionsBtn');
    if (openOptionsBtn) {
      openOptionsBtn.addEventListener('click', () => {
        if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          window.open('options.html', '_blank');
        }
      });
    }

    // KPI elements
    const kpiSection = document.getElementById('kpi-section');
    const kpiCounters = document.getElementById('kpi-counters');
    const clearKpiBtn = document.getElementById('clearKpiBtn');
    const statusDiv = document.getElementById('status');

    // Helper: Render KPI counters
    function renderKpiCounters(stats) {
        kpiCounters.innerHTML = `
            <span class="kpi-item"><img src="images/youtube.svg" class="kpi-logo" alt="YouTube"> YT: <b>${stats.youtube || 0}</b></span>
            <span class="kpi-item"><img src="images/article.svg" class="kpi-logo" alt="Article"> Articles: <b>${stats.articles || 0}</b></span>
            <span class="kpi-item"><img src="images/hackernews.svg" class="kpi-logo" alt="HN Comments"> HN Comments: <b>${stats.hn_comments || 0}</b></span>
            <span class="kpi-item"><img src="images/hackernews.svg" class="kpi-logo" alt="HN News"> HN News: <b>${stats.hn_news || 0}</b></span>
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
        chrome.storage.sync.set({ usageStats: { youtube: 0, articles: 0, hn_comments: 0, hn_news: 0 } }, function() {
            loadKpiCounters();
            showStatus('Usage counters cleared!', 'success');
        });
    });

    // Status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}); 