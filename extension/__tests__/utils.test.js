import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getSettings, 
  copyToClipboard, 
  htmlToMarkdown, 
  sleep,
  setButtonLoading,
  setButtonSuccess,
  setButtonError,
  setButtonNormal
} from '../content/utils.js';
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
});

