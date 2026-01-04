// Unit tests for storage usage display in options page
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the storage module to prevent actual chrome API calls
vi.mock('../../../extension/shared/storage.js', () => ({
  getStorageUsage: vi.fn().mockResolvedValue({
    bytes: 1000,
    kb: '1.0',
    percentage: 1,
  }),
}));

describe('Storage Usage Options Module', () => {
  let mockElement;

  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();

    // Mock DOM element
    mockElement = {
      innerHTML: '',
    };

    // Mock document.getElementById
    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'storage-usage-display') return mockElement;
        return null;
      }),
    };

    // Mock chrome storage
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, callback) => {
            const result = {};
            if (callback) callback(result);
            return Promise.resolve(result);
          }),
        },
        onChanged: {
          addListener: vi.fn(),
        },
      },
    };
  });

  describe('renderStorageUsage', () => {
    it('renders storage usage display correctly', async () => {
      const { renderStorageUsage } = await import('../../../extension/options/storageUsage.js');

      const usage = {
        bytes: 5120,
        kb: '5.0',
        percentage: 5,
      };

      renderStorageUsage(usage);

      expect(mockElement.innerHTML).toContain('Storage Used: 5.0 KB / 100 KB (5%)');
      expect(mockElement.innerHTML).toContain('title="Chrome sync storage usage (5120 bytes)"');
    });

    it('handles zero usage', async () => {
      const { renderStorageUsage } = await import('../../../extension/options/storageUsage.js');

      const usage = {
        bytes: 2,
        kb: '0.0',
        percentage: 0,
      };

      renderStorageUsage(usage);

      expect(mockElement.innerHTML).toContain('Storage Used: 0.0 KB / 100 KB (0%)');
    });

    it('handles high usage', async () => {
      const { renderStorageUsage } = await import('../../../extension/options/storageUsage.js');

      const usage = {
        bytes: 92160,
        kb: '90.0',
        percentage: 90,
      };

      renderStorageUsage(usage);

      expect(mockElement.innerHTML).toContain('Storage Used: 90.0 KB / 100 KB (90%)');
    });

    it('does nothing when element not found', async () => {
      // Mock element not found
      global.document.getElementById.mockReturnValue(null);

      const { renderStorageUsage } = await import('../../../extension/options/storageUsage.js');

      const usage = {
        bytes: 1000,
        kb: '1.0',
        percentage: 1,
      };

      // Should not throw error
      expect(() => renderStorageUsage(usage)).not.toThrow();
    });
  });

  describe('initializeStorageUsage', () => {
    it('initializes storage usage display and listeners', async () => {
      const { initializeStorageUsage } = await import('../../../extension/options/storageUsage.js');

      initializeStorageUsage();

      // Should have set up storage change listener
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });
  });
});
