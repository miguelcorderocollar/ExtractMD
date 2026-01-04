// ExtractMD Theme Manager - Dynamic Accent Color System
// Centralized theme management with live color generation and CSS variable injection

import { DEFAULTS } from './defaults.js';

/**
 * Color manipulation utilities
 */
export class ColorUtils {
  /**
   * Convert hex color to HSL
   * @param {string} hex - Hex color (e.g., '#14b8a6')
   * @returns {Object} - { h, s, l } values (0-360, 0-100, 0-100)
   */
  static hexToHsl(hex) {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Convert to RGB
    let r, g, b;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }

    // Convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * Convert HSL to hex color
   * @param {Object} hsl - { h, s, l } values
   * @returns {string} - Hex color
   */
  static hslToHex(hsl) {
    const { h, s, l } = hsl;
    const hNorm = h / 360;
    const sNorm = s / 100;
    const lNorm = l / 100;

    let r, g, b;

    if (sNorm === 0) {
      r = g = b = lNorm; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
      const p = 2 * lNorm - q;

      r = hue2rgb(p, q, hNorm + 1 / 3);
      g = hue2rgb(p, q, hNorm);
      b = hue2rgb(p, q, hNorm - 1 / 3);
    }

    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Darken a color by percentage
   * @param {string} hex - Hex color
   * @param {number} percent - Percentage to darken (0-100)
   * @returns {string} - Darkened hex color
   */
  static darken(hex, percent = 10) {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.max(0, hsl.l - percent);
    return this.hslToHex(hsl);
  }

  /**
   * Lighten a color by percentage
   * @param {string} hex - Hex color
   * @param {number} percent - Percentage to lighten (0-100)
   * @returns {string} - Lightened hex color
   */
  static lighten(hex, percent = 10) {
    const hsl = this.hexToHsl(hex);
    hsl.l = Math.min(100, hsl.l + percent);
    return this.hslToHex(hsl);
  }

  /**
   * Create color variants from base color for light mode
   * @param {string} baseColor - Base hex color
   * @returns {Object} - Color variants
   */
  static createLightVariants(baseColor) {
    return {
      base: baseColor,
      hover: this.darken(baseColor, 10),
      light: this.lighten(baseColor, 45),
      muted: this.lighten(baseColor, 30),
    };
  }

  /**
   * Create color variants from base color for dark mode
   * Dark mode uses lighter/brighter variants for visibility
   * @param {string} baseColor - Base hex color
   * @returns {Object} - Color variants
   */
  static createDarkVariants(baseColor) {
    return {
      base: this.lighten(baseColor, 10),
      hover: this.lighten(baseColor, 20),
      light: this.darken(baseColor, 30),
      muted: this.darken(baseColor, 20),
    };
  }
}

/**
 * Theme Manager - Centralized theme management
 */
export class ThemeManager {
  constructor() {
    this.currentColor = DEFAULTS.accentColor;
    this.lightVariants = ColorUtils.createLightVariants(this.currentColor);
    this.darkVariants = ColorUtils.createDarkVariants(this.currentColor);
    this.isInitialized = false;
    this.eventListeners = new Map();
    this._mediaQuery = null;
  }

  /**
   * Initialize theme manager
   */
  async initialize() {
    if (this.isInitialized) return;

    // Load saved accent color
    await this.loadAccentColor();

    // Apply initial theme
    this.applyTheme();

    // Set up event listeners
    this.setupEventListeners();

    // Listen for system color scheme changes
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._handleColorSchemeChange = () => this.applyTheme();
    this._mediaQuery.addEventListener('change', this._handleColorSchemeChange);

    this.isInitialized = true;
  }

  /**
   * Load accent color from storage
   */
  async loadAccentColor() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ accentColor: DEFAULTS.accentColor }, (result) => {
        this.updateAccentColor(result.accentColor);
        resolve();
      });
    });
  }

  /**
   * Update accent color and regenerate variants
   * @param {string} color - New hex color
   */
  updateAccentColor(color) {
    this.currentColor = color;
    this.lightVariants = ColorUtils.createLightVariants(color);
    this.darkVariants = ColorUtils.createDarkVariants(color);
  }

  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  isDarkMode() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  /**
   * Apply theme to document root via CSS variables
   */
  applyTheme() {
    const root = document.documentElement;
    const variants = this.isDarkMode() ? this.darkVariants : this.lightVariants;

    // Apply CSS custom properties based on current color scheme
    root.style.setProperty('--accent', variants.base);
    root.style.setProperty('--accent-hover', variants.hover);
    root.style.setProperty('--accent-light', variants.light);
    root.style.setProperty('--accent-muted', variants.muted);
  }

  /**
   * Set up event listeners for live theme updates
   */
  setupEventListeners() {
    // Listen for setting saved events
    const handleSettingSaved = (event) => {
      if (event.detail?.settingId === 'accentColor') {
        this.updateAccentColor(event.detail.value);
        this.applyTheme();
      }
    };

    document.addEventListener('extractmd-setting-saved', handleSettingSaved);
    this.eventListeners.set('extractmd-setting-saved', handleSettingSaved);
  }

  /**
   * Get current accent color
   * @returns {string} - Current hex color
   */
  getAccentColor() {
    return this.currentColor;
  }

  /**
   * Get color variants for current color scheme
   * @returns {Object} - Color variants
   */
  getVariants() {
    return this.isDarkMode() ? this.darkVariants : this.lightVariants;
  }

  /**
   * Get specific variant for current color scheme
   * @param {string} variant - Variant name (hover, light, muted)
   * @returns {string} - Variant color
   */
  getVariant(variant) {
    const variants = this.getVariants();
    return variants[variant] || variants.base;
  }

  /**
   * Reset to default color
   */
  resetToDefault() {
    this.updateAccentColor(DEFAULTS.accentColor);
    this.applyTheme();
  }

  /**
   * Clean up event listeners and reset state
   */
  destroy() {
    for (const [event, handler] of this.eventListeners) {
      document.removeEventListener(event, handler);
    }
    this.eventListeners.clear();

    // Clean up media query listener
    if (this._mediaQuery && this._handleColorSchemeChange) {
      this._mediaQuery.removeEventListener('change', this._handleColorSchemeChange);
      this._mediaQuery = null;
      this._handleColorSchemeChange = null;
    }

    this.isInitialized = false;

    // Reset singleton so next getThemeManager() creates fresh instance
    resetThemeManagerInstance();
  }
}

// Singleton instance
let themeManagerInstance = null;

/**
 * Reset singleton instance (used internally by destroy())
 */
function resetThemeManagerInstance() {
  themeManagerInstance = null;
}

/**
 * Get theme manager singleton
 * @returns {ThemeManager} - Theme manager instance
 */
export function getThemeManager() {
  if (!themeManagerInstance) {
    themeManagerInstance = new ThemeManager();
  }
  return themeManagerInstance;
}

/**
 * Initialize theme manager (for options page)
 */
export async function initializeTheme() {
  const themeManager = getThemeManager();
  await themeManager.initialize();
  return themeManager;
}

/**
 * Get accent color for content scripts (lightweight)
 * @returns {Promise<string>} - Accent color
 */
export async function getAccentColor() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ accentColor: DEFAULTS.accentColor }, (result) => {
      resolve(result.accentColor);
    });
  });
}

/**
 * Get hover variant for content scripts (lightweight)
 * @param {string} baseColor - Base color
 * @returns {string} - Hover color
 */
export function getHoverVariant(baseColor) {
  return ColorUtils.darken(baseColor, 10);
}
