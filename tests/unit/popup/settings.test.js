import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULTS } from '../../../extension/shared/defaults.js';
import { loadSettings, attachSettingHandlers } from '../../../extension/popup/settings.js';
import { saveSetting } from '../../../extension/shared/storage.js';

describe('popup.js - DEFAULTS', () => {
  it('has all required settings', () => {
    expect(DEFAULTS).toHaveProperty('globalEnabled');
    expect(DEFAULTS).toHaveProperty('includeTimestamps');
    expect(DEFAULTS).toHaveProperty('jumpToDomain');
    expect(DEFAULTS).toHaveProperty('enableYouTubeIntegration');
    expect(DEFAULTS).toHaveProperty('enableHackerNewsIntegration');
    expect(DEFAULTS).toHaveProperty('enableArticleIntegration');
  });

  it('has proper default values', () => {
    expect(DEFAULTS.globalEnabled).toBe(true);
    expect(DEFAULTS.includeTimestamps).toBe(true);
    expect(DEFAULTS.jumpToDomain).toBe(false);
    expect(DEFAULTS.downloadInsteadOfCopy).toBe(false);
    expect(DEFAULTS.enableUsageKpi).toBe(true);
  });
});

describe('popup/settings.js - Setting Handlers', () => {
  let mockElement;

  beforeEach(() => {
    // Mock chrome.storage.sync.get
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, callback) => {
            callback(DEFAULTS);
          }),
        },
      },
    };

    // Mock document.getElementById
    mockElement = {
      checked: false,
      addEventListener: vi.fn(),
      value: '',
    };

    global.document = {
      getElementById: vi.fn((id) => {
        if (id === 'globalEnabled') return mockElement;
        return null;
      }),
    };

    // Mock saveSetting
    vi.mock('../../../extension/shared/storage.js', () => ({
      saveSetting: vi.fn(),
    }));
  });

  it('attaches change handler to globalEnabled checkbox', () => {
    attachSettingHandlers();

    expect(mockElement.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('calls saveSetting when globalEnabled checkbox changes', () => {
    attachSettingHandlers();

    // Get the change handler that was attached
    const changeHandler = mockElement.addEventListener.mock.calls.find(
      ([event]) => event === 'change'
    )[1];

    // Simulate checkbox change
    mockElement.checked = true;
    changeHandler();

    expect(saveSetting).toHaveBeenCalledWith('globalEnabled', true);
  });
});
