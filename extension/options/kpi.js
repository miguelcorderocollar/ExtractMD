// KPI display and time-saved calculation for ExtractMD options page

import { showStatus } from './ui.js';

// Time estimates in seconds for each action type
const TIME_ESTIMATES = {
    youtube: 60,
    articles: 30,
    hn_comments: 40,
    hn_news: 20
};

/**
 * Format seconds into human-readable time string
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} Formatted time string (e.g., "5m", "2.5h", "1d")
 */
export function formatTimeSaved(totalSeconds) {
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

/**
 * Calculate total time saved based on usage stats
 * @param {Object} stats - Usage stats object
 * @returns {number} Total seconds saved
 */
export function calculateTimeSaved(stats) {
    return (
        (stats.youtube || 0) * TIME_ESTIMATES.youtube +
        (stats.articles || 0) * TIME_ESTIMATES.articles +
        (stats.hn_comments || 0) * TIME_ESTIMATES.hn_comments +
        (stats.hn_news || 0) * TIME_ESTIMATES.hn_news
    );
}

/**
 * Render KPI counters in the options page with card layout
 * @param {Object} stats - Usage stats object
 */
export function renderKpiCounters(stats) {
    const kpiCounters = document.getElementById('kpi-counters');
    if (!kpiCounters) return;
    
    const youtube = stats.youtube || 0;
    const articles = stats.articles || 0;
    const hnComments = stats.hn_comments || 0;
    const hnNews = stats.hn_news || 0;
    
    kpiCounters.innerHTML = `
        <div class="kpi-card" title="YouTube transcript copies">
            <div class="kpi-card-label">YouTube</div>
            <div class="kpi-card-value">${youtube}</div>
        </div>
        <div class="kpi-card" title="Article exports">
            <div class="kpi-card-label">Articles</div>
            <div class="kpi-card-value">${articles}</div>
        </div>
        <div class="kpi-card" title="HN comments exports">
            <div class="kpi-card-label">HN Comments</div>
            <div class="kpi-card-value">${hnComments}</div>
        </div>
        <div class="kpi-card" title="HN news exports">
            <div class="kpi-card-label">HN News</div>
            <div class="kpi-card-value">${hnNews}</div>
        </div>
    `;

    const totalSeconds = calculateTimeSaved(stats);
    const timeSavedElement = document.getElementById('kpi-time-saved');
    
    if (timeSavedElement) {
        if (totalSeconds > 0) {
            timeSavedElement.textContent = `Estimated time saved: ~${formatTimeSaved(totalSeconds)}`;
        } else {
            timeSavedElement.textContent = '';
        }
    }
}

/**
 * Load and display KPI counters from storage
 */
export function loadKpiCounters() {
    chrome.storage.sync.get({ usageStats: {} }, function(items) {
        renderKpiCounters(items.usageStats || {});
    });
}

/**
 * Initialize KPI section with load and clear functionality
 */
export function initializeKpi() {
    const clearKpiBtn = document.getElementById('clearKpiBtn');
    
    // Load initial counters
    loadKpiCounters();
    
    // Set up clear button
    if (clearKpiBtn) {
        clearKpiBtn.addEventListener('click', function() {
            chrome.storage.sync.set({ 
                usageStats: { youtube: 0, articles: 0, hn_comments: 0, hn_news: 0 } 
            }, function() {
                loadKpiCounters();
                showStatus('Usage counters cleared!', 'success');
            });
        });
    }
}

