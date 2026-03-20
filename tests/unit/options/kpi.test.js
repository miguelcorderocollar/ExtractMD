import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatTimeSaved,
  calculateTimeSaved,
  renderKpiCounters,
} from '../../../extension/options/kpi.js';
import { youtubeIcon } from '../../../extension/shared/icons.js';

describe('options/kpi module', () => {
  it('loads SVG icon strings for KPI rendering', () => {
    expect(youtubeIcon).toContain('<svg');
    expect(youtubeIcon).toContain('viewBox');
  });

  describe('formatTimeSaved', () => {
    it('formats seconds correctly', () => {
      expect(formatTimeSaved(30)).toBe('30s');
    });
  });

  describe('calculateTimeSaved', () => {
    it('calculates time saved from usage stats', () => {
      const stats = {
        youtube: 1,
        articles: 1,
        hn_comments: 1,
        hn_news: 1,
        x_posts: 1,
        universal: 1,
      };
      expect(calculateTimeSaved(stats)).toBe(60 + 30 + 40 + 20 + 35 + 25);
    });
  });

  describe('renderKpiCounters', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'kpi-counters';
      document.body.appendChild(container);

      const timeSaved = document.createElement('div');
      timeSaved.id = 'kpi-time-saved';
      document.body.appendChild(timeSaved);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('renders KPI cards with icons and values', () => {
      const stats = {
        youtube: 2,
        articles: 3,
        hn_comments: 1,
        hn_news: 4,
        x_posts: 5,
        universal: 6,
      };

      renderKpiCounters(stats, 7);

      const cards = container.querySelectorAll('.kpi-card');
      expect(cards.length).toBe(7);

      expect(container.querySelectorAll('.kpi-card-icon').length).toBe(7);
      expect((container.innerHTML.match(/<svg\b/gi) || []).length).toBe(7);

      expect(container.textContent).toContain('YouTube');
      expect(container.textContent).toContain('API Calls');

      const values = [...container.querySelectorAll('.kpi-card-value')].map((el) =>
        el.textContent.trim()
      );
      expect(values).toEqual(['2', '3', '1', '4', '5', '6', '7']);
    });
  });
});
