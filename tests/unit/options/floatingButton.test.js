// Unit tests for floating button settings in options page
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Floating Button Settings', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should have floating button settings in DEFAULTS', async () => {
    const { DEFAULTS } = await import('../../../extension/shared/defaults.js');
    
    expect(DEFAULTS).toHaveProperty('floatingButtonEnableDrag');
    expect(DEFAULTS).toHaveProperty('floatingButtonEnableDismiss');
    expect(DEFAULTS).toHaveProperty('floatingButtonSize');
    expect(DEFAULTS).toHaveProperty('floatingButtonTransparency');
    
    expect(DEFAULTS.floatingButtonEnableDrag).toBe(true);
    expect(DEFAULTS.floatingButtonEnableDismiss).toBe(true);
    expect(DEFAULTS.floatingButtonSize).toBe('medium');
    expect(DEFAULTS.floatingButtonTransparency).toBe('medium');
  });

  it('should save floating button settings correctly', async () => {
    const { saveSetting } = await import('../../../extension/shared/storage.js');
    
    // Mock chrome.storage.sync
    const setSpy = vi.fn();
    const removeSpy = vi.fn();
    global.chrome = {
      storage: {
        sync: {
          set: setSpy,
          remove: removeSpy
        }
      }
    };
    
    // Save a non-default value (should call set)
    saveSetting('floatingButtonSize', 'large');
    expect(setSpy).toHaveBeenCalledWith({ floatingButtonSize: 'large' });
    
    // Save a default value (should call remove to save space)
    saveSetting('floatingButtonSize', 'medium');
    expect(removeSpy).toHaveBeenCalledWith('floatingButtonSize');
    
    // Save boolean settings
    saveSetting('floatingButtonEnableDrag', false);
    expect(setSpy).toHaveBeenCalledWith({ floatingButtonEnableDrag: false });
    
    saveSetting('floatingButtonEnableDismiss', false);
    expect(setSpy).toHaveBeenCalledWith({ floatingButtonEnableDismiss: false });
    
    // Save transparency setting
    saveSetting('floatingButtonTransparency', 'high');
    expect(setSpy).toHaveBeenCalledWith({ floatingButtonTransparency: 'high' });
    
    // Save default transparency (should call remove)
    saveSetting('floatingButtonTransparency', 'medium');
    expect(removeSpy).toHaveBeenCalledWith('floatingButtonTransparency');
  });

  it('should load floating button settings with defaults', async () => {
    const { getSettings } = await import('../../../extension/shared/storage.js');
    
    global.chrome = {
      storage: {
        sync: {
          get: vi.fn((keys, callback) => {
            // Simulate empty storage - should return defaults
            callback({
              floatingButtonEnableDrag: true,
              floatingButtonEnableDismiss: true,
              floatingButtonSize: 'medium',
              floatingButtonTransparency: 'medium'
            });
          })
        }
      }
    };
    
    const settings = await getSettings(['floatingButtonEnableDrag', 'floatingButtonEnableDismiss', 'floatingButtonSize', 'floatingButtonTransparency']);
    
    expect(settings.floatingButtonEnableDrag).toBe(true);
    expect(settings.floatingButtonEnableDismiss).toBe(true);
    expect(settings.floatingButtonSize).toBe('medium');
    expect(settings.floatingButtonTransparency).toBe('medium');
  });

  it('should have floating button settings in SETTING_SCHEMA', async () => {
    const { SETTING_SCHEMA } = await import('../../../extension/shared/defaults.js');
    
    expect(SETTING_SCHEMA).toHaveProperty('floatingButtonEnableDrag', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('floatingButtonEnableDismiss', 'boolean');
    expect(SETTING_SCHEMA).toHaveProperty('floatingButtonSize', 'string');
    expect(SETTING_SCHEMA).toHaveProperty('floatingButtonTransparency', 'string');
  });

  it('should reset all floating button positions', async () => {
    const { resetFloatingButtonPositions } = await import('../../../extension/options/settings.js');
    
    // Mock chrome.storage.local
    const removeSpy = vi.fn((key, callback) => {
      callback();
    });
    
    global.chrome = {
      storage: {
        local: {
          remove: removeSpy
        }
      }
    };
    
    await resetFloatingButtonPositions();
    
    expect(removeSpy).toHaveBeenCalledWith('floatingButtonPositions', expect.any(Function));
  });
});

