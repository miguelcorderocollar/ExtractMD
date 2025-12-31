import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleCopyOrDownload } from '../../../../extension/content/handlers/copyHandler.js';
import { resetMockStorage } from '../../setup.js';

// Mock the utils module
vi.mock('../../../../extension/content/utils.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  downloadMarkdownFile: vi.fn(),
  showSuccessNotificationWithTokens: vi.fn(),
  closeCurrentTab: vi.fn()
}));

// Import mocked functions
import { copyToClipboard, downloadMarkdownFile, showSuccessNotificationWithTokens, closeCurrentTab } from '../../../../extension/content/utils.js';

describe('copyHandler', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  describe('handleCopyOrDownload', () => {
    const testMarkdown = '# Test\n\nThis is test content.';
    const testOptions = {
      title: 'Test Document',
      kpiType: 'articles'
    };

    it('copies to clipboard by default', async () => {
      const result = await handleCopyOrDownload(testMarkdown, testOptions);

      expect(result.action).toBe('copy');
      expect(copyToClipboard).toHaveBeenCalledWith(testMarkdown, true);
      expect(downloadMarkdownFile).not.toHaveBeenCalled();
    });

    it('downloads when downloadInsteadOfCopy is enabled', async () => {
      await chrome.storage.sync.set({ downloadInsteadOfCopy: true });

      const result = await handleCopyOrDownload(testMarkdown, testOptions);

      expect(result.action).toBe('download');
      expect(downloadMarkdownFile).toHaveBeenCalledWith(testMarkdown, 'Test Document', 'ExtractMD');
      expect(copyToClipboard).not.toHaveBeenCalled();
    });

    it('shows success notification with token count', async () => {
      await handleCopyOrDownload(testMarkdown, testOptions);

      expect(showSuccessNotificationWithTokens).toHaveBeenCalled();
    });

    it('increments KPI counter', async () => {
      await handleCopyOrDownload(testMarkdown, testOptions);

      // Check that storage.set was called with usageStats
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        expect.objectContaining({ usageStats: expect.any(Object) }),
        expect.any(Function)
      );
    });

    it('calls onSuccess callback if provided', async () => {
      const onSuccess = vi.fn();
      
      await handleCopyOrDownload(testMarkdown, { ...testOptions, onSuccess });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('uses custom success message if provided', async () => {
      const customMessage = 'Custom success!';
      
      await handleCopyOrDownload(testMarkdown, { ...testOptions, successMessage: customMessage });

      expect(showSuccessNotificationWithTokens).toHaveBeenCalledWith(customMessage, testMarkdown);
    });

    it('opens new tab when jumpToDomain is enabled', async () => {
      await chrome.storage.sync.set({ 
        jumpToDomain: true, 
        jumpToDomainUrl: 'https://example.com' 
      });

      await handleCopyOrDownload(testMarkdown, testOptions);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'openNewTab',
        url: 'https://example.com'
      });
    });

    it('returns token count in result', async () => {
      const result = await handleCopyOrDownload(testMarkdown, testOptions);

      expect(result.tokens).toBeDefined();
      expect(typeof result.tokens).toBe('number');
      expect(result.tokens).toBeGreaterThan(0);
    });
  });
});

