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
    const statusDiv = document.getElementById('status');

    // Helper: Render KPI counters
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

    // Status message
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // --- Preview Markdown logic ---
    const previewBtn = document.getElementById('previewMarkdownBtn');
    const previewDiv = document.getElementById('markdownPreview');
    if (previewBtn && previewDiv) {
        previewBtn.addEventListener('click', function() {
            console.log('[ExtractMD][Popup] Preview Markdown button clicked');
            previewDiv.style.display = 'block';
            previewDiv.textContent = 'Loading...';
            // Get the active tab
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                console.log('[ExtractMD][Popup] chrome.tabs.query result:', tabs);
                if (!tabs || !tabs[0]) {
                    previewDiv.textContent = 'No active tab.';
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, { action: 'extractmd_get_markdown_preview' }, function(response) {
                    if (chrome.runtime.lastError) {
                        console.error('[ExtractMD][Popup] Error sending message:', chrome.runtime.lastError.message);
                        previewDiv.textContent = 'Unable to get preview: ' + chrome.runtime.lastError.message;
                        return;
                    }
                    console.log('[ExtractMD][Popup] Received response:', response);
                    if (response && response.markdown) {
                        previewDiv.textContent = response.markdown;
                    } else {
                        previewDiv.textContent = 'No Markdown available for preview on this page.';
                    }
                });
            });
        });
    } else {
        console.warn('[ExtractMD][Popup] Preview button or preview div not found in DOM');
    }
}); 