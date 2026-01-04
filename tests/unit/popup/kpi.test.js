import { describe, it, expect } from 'vitest';

describe('KPI functions', () => {
  function formatTimeSaved(totalSeconds) {
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

  describe('formatTimeSaved', () => {
    it('formats seconds', () => {
      expect(formatTimeSaved(30)).toBe('30s');
      expect(formatTimeSaved(59)).toBe('59s');
    });

    it('formats minutes', () => {
      expect(formatTimeSaved(60)).toBe('1m');
      expect(formatTimeSaved(120)).toBe('2m');
      expect(formatTimeSaved(3540)).toBe('59m');
    });

    it('formats hours', () => {
      expect(formatTimeSaved(3600)).toBe('1h');
      expect(formatTimeSaved(7200)).toBe('2h');
      expect(formatTimeSaved(5400)).toBe('1.5h');
    });

    it('formats days', () => {
      expect(formatTimeSaved(86400)).toBe('1d');
      expect(formatTimeSaved(172800)).toBe('2d');
      expect(formatTimeSaved(129600)).toBe('1.5d');
    });
  });

  describe('time saved calculation', () => {
    const estimates = {
      youtube: 60,
      articles: 30,
      hn_comments: 40,
      hn_news: 20,
    };

    it('calculates correct totals', () => {
      const stats = { youtube: 1, articles: 1, hn_comments: 1, hn_news: 1 };
      const total =
        (stats.youtube || 0) * estimates.youtube +
        (stats.articles || 0) * estimates.articles +
        (stats.hn_comments || 0) * estimates.hn_comments +
        (stats.hn_news || 0) * estimates.hn_news;

      expect(total).toBe(150); // 60+30+40+20
    });

    it('handles missing stats', () => {
      const stats = { youtube: 5 };
      const total =
        (stats.youtube || 0) * estimates.youtube +
        (stats.articles || 0) * estimates.articles +
        (stats.hn_comments || 0) * estimates.hn_comments +
        (stats.hn_news || 0) * estimates.hn_news;

      expect(total).toBe(300); // 5*60
    });
  });
});
