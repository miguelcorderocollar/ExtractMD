import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ColorUtils,
  ThemeManager,
  getThemeManager,
  getAccentColor,
} from '../../../extension/shared/theme-manager.js';

describe('ColorUtils', () => {
  describe('hexToHsl', () => {
    it('converts white correctly', () => {
      expect(ColorUtils.hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
    });

    it('converts black correctly', () => {
      expect(ColorUtils.hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
    });

    it('converts teal correctly', () => {
      expect(ColorUtils.hexToHsl('#14b8a6')).toEqual({ h: 173, s: 80, l: 40 });
    });

    it('handles 3-digit hex colors', () => {
      expect(ColorUtils.hexToHsl('#abc')).toEqual({ h: 210, s: 25, l: 73 });
    });
  });

  describe('hslToHex', () => {
    it('converts white correctly', () => {
      expect(ColorUtils.hslToHex({ h: 0, s: 0, l: 100 })).toBe('#ffffff');
    });

    it('converts black correctly', () => {
      expect(ColorUtils.hslToHex({ h: 0, s: 0, l: 0 })).toBe('#000000');
    });

    it('converts teal correctly', () => {
      expect(ColorUtils.hslToHex({ h: 176, s: 80, l: 40 })).toBe('#14b8ad');
    });
  });

  describe('darken', () => {
    it('darkens a color by default 10%', () => {
      expect(ColorUtils.darken('#14b8a6')).toBe('#0f8a7b');
    });

    it('darkens a color by custom percentage', () => {
      expect(ColorUtils.darken('#14b8a6', 20)).toBe('#0a5c52');
    });

    it('does not go below black', () => {
      expect(ColorUtils.darken('#000000', 50)).toBe('#000000');
    });
  });

  describe('lighten', () => {
    it('lightens a color by default 10%', () => {
      expect(ColorUtils.lighten('#14b8a6')).toBe('#19e6ce');
    });

    it('lightens a color by custom percentage', () => {
      expect(ColorUtils.lighten('#14b8a6', 20)).toBe('#47ebd8');
    });

    it('does not go above white', () => {
      expect(ColorUtils.lighten('#ffffff', 50)).toBe('#ffffff');
    });
  });

  describe('createLightVariants', () => {
    it('creates light mode variants from base color', () => {
      const variants = ColorUtils.createLightVariants('#14b8a6');

      expect(variants).toHaveProperty('base', '#14b8a6');
      expect(variants).toHaveProperty('hover');
      expect(variants).toHaveProperty('light');
      expect(variants).toHaveProperty('muted');
      // Hover should be darker than base
      expect(ColorUtils.hexToHsl(variants.hover).l).toBeLessThan(
        ColorUtils.hexToHsl(variants.base).l
      );
    });
  });

  describe('createDarkVariants', () => {
    it('creates dark mode variants from base color', () => {
      const variants = ColorUtils.createDarkVariants('#14b8a6');

      expect(variants).toHaveProperty('base');
      expect(variants).toHaveProperty('hover');
      expect(variants).toHaveProperty('light');
      expect(variants).toHaveProperty('muted');
      // Base should be lighter than original for dark mode visibility
      expect(ColorUtils.hexToHsl(variants.base).l).toBeGreaterThan(
        ColorUtils.hexToHsl('#14b8a6').l
      );
    });
  });
});

describe('ThemeManager', () => {
  let themeManager;
  let mockChrome;

  beforeEach(() => {
    // Mock chrome API
    mockChrome = {
      storage: {
        sync: {
          get: vi.fn((keys, callback) => {
            callback({ accentColor: '#14b8a6' });
          }),
        },
      },
    };
    global.chrome = mockChrome;

    // Mock matchMedia for dark mode detection
    global.window = {
      matchMedia: vi.fn().mockReturnValue({
        matches: false, // Default to light mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    };

    // Create new instance
    themeManager = new ThemeManager();
  });

  afterEach(() => {
    themeManager.destroy();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes with default color', () => {
      expect(themeManager.currentColor).toBe('#14b8a6');
      expect(themeManager.isInitialized).toBe(false);
    });

    it('creates light and dark variants from current color', () => {
      expect(themeManager.lightVariants).toHaveProperty('base');
      expect(themeManager.lightVariants).toHaveProperty('hover');
      expect(themeManager.lightVariants).toHaveProperty('light');
      expect(themeManager.lightVariants).toHaveProperty('muted');

      expect(themeManager.darkVariants).toHaveProperty('base');
      expect(themeManager.darkVariants).toHaveProperty('hover');
      expect(themeManager.darkVariants).toHaveProperty('light');
      expect(themeManager.darkVariants).toHaveProperty('muted');
    });
  });

  describe('updateAccentColor', () => {
    it('updates current color and regenerates both light and dark variants', () => {
      const newColor = '#ff0000';
      themeManager.updateAccentColor(newColor);

      expect(themeManager.currentColor).toBe(newColor);
      // Light variants use the base color directly
      expect(themeManager.lightVariants.base).toBe(newColor);
      // Dark variants use a lightened version
      expect(themeManager.darkVariants.base).not.toBe(newColor);
    });
  });

  describe('isDarkMode', () => {
    it('returns false when system prefers light mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: false });
      expect(themeManager.isDarkMode()).toBe(false);
    });

    it('returns true when system prefers dark mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: true });
      expect(themeManager.isDarkMode()).toBe(true);
    });
  });

  describe('applyTheme', () => {
    beforeEach(() => {
      // Mock document.documentElement
      const mockElement = {
        style: {
          setProperty: vi.fn(),
        },
      };
      global.document = {
        documentElement: mockElement,
      };
    });

    it('applies light mode CSS custom properties when in light mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: false });
      themeManager.applyTheme();

      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent',
        themeManager.lightVariants.base
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent-hover',
        themeManager.lightVariants.hover
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent-light',
        themeManager.lightVariants.light
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent-muted',
        themeManager.lightVariants.muted
      );
    });

    it('applies dark mode CSS custom properties when in dark mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: true });
      themeManager.applyTheme();

      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent',
        themeManager.darkVariants.base
      );
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--accent-hover',
        themeManager.darkVariants.hover
      );
    });
  });

  describe('getVariants', () => {
    it('returns light variants in light mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: false });
      expect(themeManager.getVariants()).toBe(themeManager.lightVariants);
    });

    it('returns dark variants in dark mode', () => {
      global.window.matchMedia.mockReturnValue({ matches: true });
      expect(themeManager.getVariants()).toBe(themeManager.darkVariants);
    });
  });

  describe('getVariant', () => {
    it('returns correct variant for current color scheme', () => {
      global.window.matchMedia.mockReturnValue({ matches: false });
      expect(themeManager.getVariant('hover')).toBe(themeManager.lightVariants.hover);
      expect(themeManager.getVariant('light')).toBe(themeManager.lightVariants.light);
    });

    it('returns base color for unknown variant', () => {
      global.window.matchMedia.mockReturnValue({ matches: false });
      expect(themeManager.getVariant('unknown')).toBe(themeManager.lightVariants.base);
    });
  });

  describe('resetToDefault', () => {
    it('resets to default teal color', () => {
      themeManager.updateAccentColor('#ff0000');
      themeManager.resetToDefault();

      expect(themeManager.currentColor).toBe('#14b8a6');
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    // Ensure singleton is reset before each test
    const manager = getThemeManager();
    manager.destroy();
  });

  describe('getThemeManager', () => {
    it('returns singleton instance', () => {
      // Mock matchMedia for getThemeManager to work
      global.window = {
        matchMedia: vi.fn().mockReturnValue({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }),
      };

      const manager1 = getThemeManager();
      const manager2 = getThemeManager();

      expect(manager1).toBe(manager2);

      // Cleanup
      manager1.destroy();
    });
  });

  describe('getAccentColor', () => {
    it('returns accent color from storage', async () => {
      const mockChrome = {
        storage: {
          sync: {
            get: vi.fn((keys, callback) => {
              callback({ accentColor: '#ff0000' });
            }),
          },
        },
      };
      global.chrome = mockChrome;

      const color = await getAccentColor();
      expect(color).toBe('#ff0000');
    });
  });
});
