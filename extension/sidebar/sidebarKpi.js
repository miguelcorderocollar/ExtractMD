// Sidebar KPI Module
// Display usage statistics in disabled mode

/**
 * Render KPI counters in compact inline format
 * @param {Object} stats - Usage stats object
 */
function renderKpiSummary(stats) {
  const kpiCounters = document.getElementById('kpiCountersDisabled');
  if (!kpiCounters) return;

  const youtube = stats.youtube || 0;
  const articles = stats.articles || 0;
  const hnComments = stats.hn_comments || 0;
  const hnNews = stats.hn_news || 0;
  const universal = stats.universal || 0;
  const total = youtube + articles + hnComments + hnNews + universal;

  if (total === 0) {
    kpiCounters.innerHTML = '<span class="kpi-empty">No extractions yet</span>';
    return;
  }

  kpiCounters.innerHTML = `
    <span class="kpi-item" title="YouTube transcript copies">
      <span class="kpi-label">YT</span>
      <span class="kpi-value">${youtube}</span>
    </span>
    <span class="kpi-item" title="Article exports">
      <span class="kpi-label">Art</span>
      <span class="kpi-value">${articles}</span>
    </span>
    <span class="kpi-item" title="HN comments exports">
      <span class="kpi-label">HN</span>
      <span class="kpi-value">${hnComments}</span>
    </span>
    <span class="kpi-item" title="HN news exports">
      <span class="kpi-label">News</span>
      <span class="kpi-value">${hnNews}</span>
    </span>
    <span class="kpi-item" title="Universal page exports">
      <span class="kpi-label">Web</span>
      <span class="kpi-value">${universal}</span>
    </span>
  `;
}

/**
 * Load and display KPI counters from storage
 */
export function loadKpiSummary() {
  chrome.storage.sync.get({ usageStats: {}, enableUsageKpi: true }, function (items) {
    const kpiSection = document.getElementById('kpiSectionDisabled');

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
