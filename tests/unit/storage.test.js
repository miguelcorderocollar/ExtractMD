import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSetting } from '../../extension/shared/storage.js';
import { DEFAULTS } from '../../extension/shared/defaults.js';
import { resetMockStorage } from './setup.js';

describe('storage patterns (saveSetting)', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  it('saves value to storage when it differs from default', async () => {
    const key = 'includeTimestamps';
    const newValue = !DEFAULTS[key];
    
    await saveSetting(key, newValue);
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: newValue }, expect.any(Function));
  });

  it('removes value from storage when it matches default', async () => {
    const key = 'includeTimestamps';
    const defaultValue = DEFAULTS[key];
    
    // First set it to something else
    await chrome.storage.sync.set({ [key]: !defaultValue });
    
    // Now save the default value
    await saveSetting(key, defaultValue);
    
    expect(chrome.storage.sync.remove).toHaveBeenCalledWith(key, expect.any(Function));
  });

  it('saves unknown keys anyway', async () => {
    const key = 'unknownKey';
    const value = 'someValue';
    
    await saveSetting(key, value);
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: value }, expect.any(Function));
  });
});

