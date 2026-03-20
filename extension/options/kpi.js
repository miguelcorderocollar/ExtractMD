// KPI display and time-saved calculation for ExtractMD options page

import {
  apiIcon,
  articleIcon,
  commentsIcon,
  hackernewsIcon,
  universalIcon,
  xIcon,
  youtubeIcon,
} from '../shared/icons.js';
import { showStatus } from './ui.js';

// Time estimates in seconds for each action type
const TIME_ESTIMATES = {
  youtube: 60,
  articles: 30,
  hn_comments: 40,
  hn_news: 20,
  x_posts: 35,
  universal: 25,
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
    (stats.hn_news || 0) * TIME_ESTIMATES.hn_news +
    (stats.x_posts || 0) * TIME_ESTIMATES.x_posts +
    (stats.universal || 0) * TIME_ESTIMATES.universal
  );
}

/**
 * Render KPI counters in the options page with card layout
 * @param {Object} stats - Usage stats object
 */
function kpiCard(iconSvg, title, label, value) {
  return `
        <div class="kpi-card" title="${title}">
            <span class="kpi-card-icon" aria-hidden="true">${iconSvg}</span>
            <div class="kpi-card-label">${label}</div>
            <div class="kpi-card-value">${value}</div>
        </div>`;
}

export function renderKpiCounters(stats, apiCallCount = 0) {
  const kpiCounters = document.getElementById('kpi-counters');
  if (!kpiCounters) return;

  const youtube = stats.youtube || 0;
  const articles = stats.articles || 0;
  const hnComments = stats.hn_comments || 0;
  const hnNews = stats.hn_news || 0;
  const xPosts = stats.x_posts || 0;
  const universal = stats.universal || 0;
  const totalApiCalls = Number(apiCallCount || 0);

  kpiCounters.innerHTML = [
    kpiCard(youtubeIcon, 'YouTube transcript copies', 'YouTube', youtube),
    kpiCard(articleIcon, 'Article exports', 'Articles', articles),
    kpiCard(commentsIcon, 'HN comments exports', 'HN Comments', hnComments),
    kpiCard(hackernewsIcon, 'HN news exports', 'HN News', hnNews),
    kpiCard(xIcon, 'X post/article exports', 'X', xPosts),
    kpiCard(universalIcon, 'Universal page exports', 'Universal', universal),
    kpiCard(apiIcon, 'Successful API requests sent from ExtractMD', 'API Calls', totalApiCalls),
  ].join('');

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
  chrome.storage.sync.get({ usageStats: {}, apiCallCount: 0 }, function (items) {
    renderKpiCounters(items.usageStats || {}, items.apiCallCount || 0);
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
    clearKpiBtn.addEventListener('click', function () {
      if (
        !confirm(
          'Clear all usage statistics and API call counts? This cannot be undone. Your saved settings are not affected.'
        )
      ) {
        return;
      }
      chrome.storage.sync.set(
        {
          usageStats: {
            youtube: 0,
            articles: 0,
            hn_comments: 0,
            hn_news: 0,
            x_posts: 0,
            universal: 0,
          },
          apiCallCount: 0,
        },
        function () {
          loadKpiCounters();
          showStatus('Usage counters cleared!', 'success');
        }
      );
    });
  }
}
