// KPI summary display for ExtractMD popup (simplified version)

/**
 * Render KPI counters in compact format
 * @param {Object} stats - Usage stats object
 */
function renderKpiSummary(stats) {
    const kpiCounters = document.getElementById('kpi-counters');
    if (!kpiCounters) return;
    
    const youtube = stats.youtube || 0;
    const articles = stats.articles || 0;
    const hnComments = stats.hn_comments || 0;
    const hnNews = stats.hn_news || 0;
    const total = youtube + articles + hnComments + hnNews;
    
    if (total === 0) {
        kpiCounters.innerHTML = '<span style="color: #999; font-size: 12px;">No extractions yet</span>';
        return;
    }
    
    kpiCounters.innerHTML = `
        <span title="YouTube transcript copies"><span style="font-size: 10px; color: #999;">YT</span><b>${youtube}</b></span>
        <span title="Article exports"><span style="font-size: 10px; color: #999;">Art</span><b>${articles}</b></span>
        <span title="HN comments exports"><span style="font-size: 10px; color: #999;">HN</span><b>${hnComments}</b></span>
        <span title="HN news exports"><span style="font-size: 10px; color: #999;">News</span><b>${hnNews}</b></span>
    `;
}

/**
 * Load and display KPI counters from storage
 */
export function loadKpiSummary() {
    chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function(items) {
        const kpiSection = document.getElementById('kpi-section');
        
        // Hide section if KPIs are disabled
        if (kpiSection) {
            kpiSection.style.display = items.enableUsageKpi === false ? 'none' : 'block';
        }
        
        if (items.enableUsageKpi !== false) {
            renderKpiSummary(items.usageStats || {});
        }
    });
}

/**
 * Initialize KPI summary module
 */
export function initializeKpiSummary() {
    loadKpiSummary();
    
    // Listen for storage changes to update in real-time
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && (changes.usageStats || changes.enableUsageKpi)) {
            loadKpiSummary();
        }
    });
}

