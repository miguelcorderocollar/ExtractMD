import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSettings,
  saveSetting,
  incrementKpi,
  getStorageUsage,
} from '../../../extension/shared/storage.js';
import { DEFAULTS } from '../../../extension/shared/defaults.js';
import { resetMockStorage } from '../setup.js';

describe('shared/storage', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  describe('getSettings', () => {
    it('returns all defaults when called without arguments', async () => {
      const settings = await getSettings();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULTS, expect.any(Function));
      expect(settings).toEqual(DEFAULTS);
      expect(settings.globalEnabled).toBe(true); // Specifically check globalEnabled default
    });

    it('returns only requested keys when specified', async () => {
      const keys = ['includeTimestamps', 'jumpToDomain'];
      const settings = await getSettings(keys);

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(
        { includeTimestamps: true, jumpToDomain: false },
        expect.any(Function)
      );
      expect(settings.includeTimestamps).toBeDefined();
      expect(settings.jumpToDomain).toBeDefined();
    });

    it('returns stored values instead of defaults', async () => {
      // Pre-populate storage
      await chrome.storage.sync.set({ includeTimestamps: false });

      const settings = await getSettings(['includeTimestamps']);

      expect(settings.includeTimestamps).toBe(false);
    });

    it('merges defaults when storage returns empty object', async () => {
      // Simulate empty storage (no stored values)
      const settings = await getSettings(['globalEnabled', 'includeTimestamps']);

      expect(settings.globalEnabled).toBe(true); // Should be default value
      expect(settings.includeTimestamps).toBe(true); // Should be default value
    });
  });

  describe('saveSetting', () => {
    it('saves value to storage when it differs from default', () => {
      const key = 'includeTimestamps';
      const newValue = !DEFAULTS[key];

      saveSetting(key, newValue);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { [key]: newValue },
        expect.any(Function)
      );
    });

    it('removes value from storage when it matches default', () => {
      const key = 'includeTimestamps';
      const defaultValue = DEFAULTS[key];

      saveSetting(key, defaultValue);

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith(key, expect.any(Function));
    });

    it('saves unknown keys anyway for future compatibility', () => {
      const key = 'futureKey';
      const value = 'futureValue';

      saveSetting(key, value);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: value }, expect.any(Function));
    });
  });

  describe('incrementKpi', () => {
    it('increments the specified KPI type', async () => {
      await incrementKpi('youtube');

      // Check that storage.set was called with the incremented value
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(
        { usageStats: { youtube: 1 } },
        expect.any(Function)
      );
    });

    it('increments existing counter', async () => {
      // Pre-populate with existing stats
      await chrome.storage.sync.set({ usageStats: { youtube: 5 } });

      await incrementKpi('youtube');

      // Should be 5 + 1 = 6
      expect(chrome.storage.sync.set).toHaveBeenLastCalledWith(
        { usageStats: { youtube: 6 } },
        expect.any(Function)
      );
    });

    it('does not increment when KPI tracking is disabled', async () => {
      // Disable KPI tracking
      await chrome.storage.sync.set({ enableUsageKpi: false });
      vi.clearAllMocks();

      await incrementKpi('youtube');

      // Should not call set
      expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });

  describe('getStorageUsage', () => {
    it('calculates storage usage for empty storage', async () => {
      // Clear any existing data
      resetMockStorage();

      const usage = await getStorageUsage();

      expect(usage).toHaveProperty('bytes');
      expect(usage).toHaveProperty('kb');
      expect(usage).toHaveProperty('percentage');

      // Empty storage should have minimal usage (just {})
      expect(usage.bytes).toBeGreaterThan(0);
      expect(usage.kb).toBe('0.0');
      expect(usage.percentage).toBe(0);
    });

    it('calculates storage usage with data', async () => {
      // Set up some test data
      await chrome.storage.sync.set({
        testKey: 'testValue',
        anotherKey: { nested: 'object' },
        usageStats: { youtube: 5, articles: 3 },
      });

      const usage = await getStorageUsage();

      expect(usage.bytes).toBeGreaterThan(0);
      expect(typeof usage.kb).toBe('string');
      expect(typeof usage.percentage).toBe('number');
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });

    it('calculates usage with stored data', async () => {
      // Set up some test data that should result in measurable usage
      const testData = { testKey: 'testValue', numberKey: 42, largeField: 'x'.repeat(500) };
      await chrome.storage.sync.set(testData);

      const usage = await getStorageUsage();

      // Should have some usage (the exact amount depends on JSON serialization)
      expect(usage.bytes).toBeGreaterThan(10);
      expect(usage.kb).toMatch(/^\d+\.\d$/);
      expect(usage.percentage).toBeGreaterThan(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });

    it('calculates different usage for different data sizes', async () => {
      // Test with small data
      resetMockStorage();
      await chrome.storage.sync.set({ small: 'x'.repeat(100) });
      const smallUsage = await getStorageUsage();

      // Clear and test with larger data
      resetMockStorage();
      await chrome.storage.sync.set({ large: 'x'.repeat(1000) });
      const largeUsage = await getStorageUsage();

      // Large data should have more usage
      expect(largeUsage.bytes).toBeGreaterThan(smallUsage.bytes);
      expect(parseFloat(largeUsage.kb)).toBeGreaterThan(parseFloat(smallUsage.kb));
    });
  });
});
