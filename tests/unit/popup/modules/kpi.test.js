import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimeSaved,
  calculateTimeSaved,
  renderKpiCounters,
} from '../../../../extension/popup/kpi.js';
import { resetMockStorage } from '../../setup.js';

describe('popup/kpi module', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  describe('formatTimeSaved', () => {
    it('formats seconds correctly', () => {
      expect(formatTimeSaved(30)).toBe('30s');
      expect(formatTimeSaved(59)).toBe('59s');
    });

    it('formats minutes correctly', () => {
      expect(formatTimeSaved(60)).toBe('1m');
      expect(formatTimeSaved(120)).toBe('2m');
      expect(formatTimeSaved(3599)).toBe('60m');
    });

    it('formats hours correctly', () => {
      expect(formatTimeSaved(3600)).toBe('1h');
      expect(formatTimeSaved(7200)).toBe('2h');
      expect(formatTimeSaved(5400)).toBe('1.5h');
    });

    it('formats days correctly', () => {
      expect(formatTimeSaved(86400)).toBe('1d');
      expect(formatTimeSaved(172800)).toBe('2d');
    });
  });

  describe('calculateTimeSaved', () => {
    it('calculates time saved from usage stats', () => {
      const stats = {
        youtube: 1, // 60s
        articles: 1, // 30s
        hn_comments: 1, // 40s
        hn_news: 1, // 20s
      };

      expect(calculateTimeSaved(stats)).toBe(150);
    });

    it('handles empty stats', () => {
      expect(calculateTimeSaved({})).toBe(0);
    });

    it('handles partial stats', () => {
      const stats = { youtube: 2 };
      expect(calculateTimeSaved(stats)).toBe(120);
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

    it('renders stats into DOM', () => {
      const stats = { youtube: 5, articles: 3, hn_comments: 2, hn_news: 1 };

      renderKpiCounters(stats);

      expect(container.innerHTML).toContain('YT: <b>5</b>');
      expect(container.innerHTML).toContain('Articles: <b>3</b>');
      expect(container.innerHTML).toContain('HN Comments: <b>2</b>');
      expect(container.innerHTML).toContain('HN News: <b>1</b>');
    });

    it('handles zero stats', () => {
      renderKpiCounters({});

      expect(container.innerHTML).toContain('YT: <b>0</b>');
    });
  });
});
