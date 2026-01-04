import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { extractTranscriptText } from '../../../extension/content/youtube.js';

// Mock the dependencies of youtube.js since we're importing it
vi.mock('../../../extension/content/utils.js', () => ({
  copyToClipboard: vi.fn(),
  showNotification: vi.fn(),
  sleep: vi.fn(),
  getSettings: vi.fn(),
  closeCurrentTab: vi.fn(),
  downloadMarkdownFile: vi.fn(),
  showSuccessNotificationWithTokens: vi.fn(),
  isFullscreen: vi.fn()
}));

vi.mock('../../../extension/shared/storage.js', () => ({
  incrementKpi: vi.fn()
}));

vi.mock('../../../extension/content/components/FloatingButton.js', () => ({
  createFloatingButton: vi.fn()
}));

vi.mock('gpt-tokenizer', () => ({
  encode: vi.fn(() => ({ length: 0 }))
}));

describe('YouTube content script logic', () => {
  describe('extractTranscriptText', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <ytd-transcript-segment-renderer>
          <div class="segment-timestamp">0:00</div>
          <div class="segment-text">Hello and welcome</div>
        </ytd-transcript-segment-renderer>
        <ytd-transcript-segment-renderer>
          <div class="segment-timestamp">0:05</div>
          <div class="segment-text">to this video</div>
        </ytd-transcript-segment-renderer>
        <ytd-transcript-section-header-renderer>
          <div class="shelf-header-layout-wiz__title">Chapter 1</div>
        </ytd-transcript-section-header-renderer>
        <ytd-transcript-segment-renderer>
          <div class="segment-timestamp">1:30</div>
          <div class="segment-text">Let's get started</div>
        </ytd-transcript-segment-renderer>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('includes timestamps when includeTimestamps is true', () => {
      const result = extractTranscriptText(true);

      expect(result).toContain('[0:00]');
      expect(result).toContain('[0:05]');
      expect(result).toContain('[1:30]');
      expect(result).toContain('Hello and welcome');
      expect(result).toContain('to this video');
      expect(result).toContain('## Chapter 1');
    });

    it('excludes timestamps when includeTimestamps is false', () => {
      const result = extractTranscriptText(false);

      expect(result).not.toContain('[0:00]');
      expect(result).not.toContain('[0:05]');
      expect(result).not.toContain('[1:30]');
      expect(result).toContain('Hello and welcome');
      expect(result).toContain('to this video');
      expect(result).toContain('## Chapter 1');
    });

    it('handles segments without timestamps', () => {
      document.body.innerHTML = `
        <ytd-transcript-segment-renderer>
          <div class="segment-text">Text without timestamp</div>
        </ytd-transcript-segment-renderer>
      `;

      const result = extractTranscriptText(true);
      expect(result).toBe('Text without timestamp');
      expect(result).not.toContain('[');
    });
  });
});
