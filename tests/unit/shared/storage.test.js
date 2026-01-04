import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, saveSetting, incrementKpi } from '../../../extension/shared/storage.js';
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
});
