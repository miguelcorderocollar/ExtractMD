import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSetting, DEFAULTS } from '../popup.js';
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
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: newValue });
  });

  it('removes value from storage when it matches default', async () => {
    const key = 'includeTimestamps';
    const defaultValue = DEFAULTS[key];
    
    // First set it to something else
    await chrome.storage.sync.set({ [key]: !defaultValue });
    
    // Now save the default value
    await saveSetting(key, defaultValue);
    
    expect(chrome.storage.sync.remove).toHaveBeenCalledWith(key);
  });

  it('saves unknown keys anyway', async () => {
    const key = 'unknownKey';
    const value = 'someValue';
    
    await saveSetting(key, value);
    
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [key]: value });
  });
});

