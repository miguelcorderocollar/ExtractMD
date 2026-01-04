import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSettings,
  copyToClipboard,
  htmlToMarkdown,
  sleep,
  setButtonLoading,
  setButtonSuccess,
  setButtonError,
  setButtonNormal,
  isFullscreen
} from '../../extension/content/utils.js';
import { resetMockStorage } from './setup.js';

describe('utils.js', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('getSettings', () => {
    it('returns default settings when storage is empty', async () => {
      const settings = await getSettings();
      expect(settings.includeTimestamps).toBe(true);
      expect(settings.jumpToDomain).toBe(false);
    });

    it('returns stored settings', async () => {
      await chrome.storage.sync.set({ includeTimestamps: false });
      const settings = await getSettings();
      expect(settings.includeTimestamps).toBe(false);
    });
  });

  describe('copyToClipboard', () => {
    it('calls navigator.clipboard.writeText', async () => {
      const mockWriteText = vi.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await copyToClipboard('test text', true);
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    it('strips timestamps when includeTimestamps is false', async () => {
      const mockWriteText = vi.fn().mockResolvedValue();
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      // Note: original code leaves a space if it follows the timestamp
      await copyToClipboard('[01:23] line 1\n[02:45] line 2', false);
      expect(mockWriteText).toHaveBeenCalledWith('line 1\n line 2');
    });
  });

  describe('htmlToMarkdown', () => {
    it('converts basic HTML tags', () => {
      const html = 'Text <p>Paragraph</p> <i>Italic</i><b>Bold</b>';
      const expected = 'Text \n\nParagraph *Italic***Bold**';
      expect(htmlToMarkdown(html)).toBe(expected);
    });

    it('converts links', () => {
      const html = '<a href="https://example.com">Link</a>';
      const expected = '[Link](https://example.com)';
      expect(htmlToMarkdown(html)).toBe(expected);
    });

    it('decodes HTML entities', () => {
      const html = '&quot;Quotes&quot; &amp; Symbols';
      const expected = '"Quotes" & Symbols';
      expect(htmlToMarkdown(html)).toBe(expected);
    });
  });

  describe('sleep', () => {
    it('resolves after specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90);
    });
  });

  describe('button state functions', () => {
    it('setButtonLoading updates button style and content', () => {
      const btn = document.createElement('button');
      setButtonLoading(btn);
      expect(btn.innerHTML).toContain('⏳');
      expect(btn.style.cursor).toBe('not-allowed');
    });

    it('setButtonSuccess updates button style and content', () => {
      const btn = document.createElement('button');
      setButtonSuccess(btn);
      expect(btn.innerHTML).toContain('✅');
    });

    it('setButtonError updates button style and content', () => {
      const btn = document.createElement('button');
      setButtonError(btn);
      expect(btn.innerHTML).toContain('❌');
    });

    it('setButtonNormal updates button style and content', () => {
      const btn = document.createElement('button');
      setButtonNormal(btn);
      expect(btn.innerHTML).toContain('📝');
      expect(btn.style.cursor).toBe('pointer');
    });
  });

  describe('isFullscreen (Regression Tests)', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
      // Clear native fullscreen mocks
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });

      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, hostname: 'example.com' };
    });

    it('detects native fullscreen', () => {
      Object.defineProperty(document, 'fullscreenElement', { value: {}, configurable: true });
      expect(isFullscreen()).toBe(true);
    });

    it('detects YouTube theater mode via ytd-watch-flexy attribute', () => {
      window.location.hostname = 'youtube.com';
      document.body.innerHTML = '<ytd-watch-flexy theater></ytd-watch-flexy>';
      expect(isFullscreen()).toBe(true);
    });

    it('detects YouTube fullscreen mode via ytd-watch-flexy attribute', () => {
      window.location.hostname = 'youtube.com';
      document.body.innerHTML = '<ytd-watch-flexy fullscreen></ytd-watch-flexy>';
      expect(isFullscreen()).toBe(true);
    });

    it('detects YouTube theater mode via ytp-size-button class', () => {
      window.location.hostname = 'youtube.com';
      document.body.innerHTML = '<button class="ytp-size-button" aria-pressed="true" aria-label="Modo cine (t)"></button>';
      expect(isFullscreen()).toBe(true);
    });

    it('detects YouTube fullscreen mode via ytp-fullscreen-button class', () => {
      window.location.hostname = 'youtube.com';
      document.body.innerHTML = '<button class="ytp-fullscreen-button" aria-pressed="true" aria-label="Pantalla completa (f)"></button>';
      expect(isFullscreen()).toBe(true);
    });

    it('returns false on YouTube when not in any special mode', () => {
      window.location.hostname = 'youtube.com';
      document.body.innerHTML = `
            <ytd-watch-flexy></ytd-watch-flexy>
            <button class="ytp-size-button" aria-pressed="false"></button>
            <button class="ytp-fullscreen-button" aria-pressed="false"></button>
        `;
      expect(isFullscreen()).toBe(false);
    });

    it('returns false on non-YouTube sites even with YT elements present', () => {
      window.location.hostname = 'example.com';
      document.body.innerHTML = '<ytd-watch-flexy theater></ytd-watch-flexy>';
      expect(isFullscreen()).toBe(false);
    });
  });
});

