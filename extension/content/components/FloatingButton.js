// Shared Floating Button component for ExtractMD
// Used by YouTube, Hacker News, and Article extractors

import { ICONS } from '../../shared/icons.js';
import { DEFAULTS } from '../../shared/defaults.js';
import { isFullscreen } from '../utils.js';
import { ColorUtils } from '../../shared/theme-manager.js';

// Default position offset from bottom-right corner
const DEFAULT_OFFSET = { left: 0, up: 0 };
const DEFAULT_RIGHT = 20;
const DEFAULT_BOTTOM = 20;
const DRAG_THRESHOLD = 5; // pixels - movement less than this triggers click
const HOVER_DELAY_MS = 500; // ms before showing dismiss button

// Size configurations
const SIZE_CONFIG = {
  extraSmall: { size: 32, radius: 8, iconSize: 14 },
  small: { size: 40, radius: 10, iconSize: 18 },
  medium: { size: 48, radius: 12, iconSize: 22 },
  large: { size: 56, radius: 14, iconSize: 26 },
  extraLarge: { size: 64, radius: 16, iconSize: 30 },
};

// Transparency configurations (opacity values)
const TRANSPARENCY_CONFIG = {
  low: 0.3,
  medium: 0.5,
  high: 0.7,
  full: 1.0,
};

// Theme colors - base colors for light/dark mode (accent colors will be loaded dynamically)
const THEME = {
  light: {
    success: '#22c55e',
    error: '#ef4444',
    loading: '#f59e0b',
    iconColor: '#fafafa',
  },
  dark: {
    success: '#4ade80',
    error: '#f87171',
    loading: '#fbbf24',
    iconColor: '#171717',
  },
};

// CSS animation for loading dots
const LOADING_ANIMATION_CSS = `
  @keyframes extractmd-bounce {
    0%, 80%, 100% { transform: scale(1); opacity: 0.5; }
    40% { transform: scale(1.2); opacity: 1; }
  }
  .extractmd-dot { animation: extractmd-bounce 1.4s infinite ease-in-out both; }
  .extractmd-dot-1 { animation-delay: -0.32s; }
  .extractmd-dot-2 { animation-delay: -0.16s; }
  .extractmd-dot-3 { animation-delay: 0s; }
`;

/**
 * Detect if user prefers dark mode
 * @returns {boolean}
 */
function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get current theme colors based on system preference
 * Uses ColorUtils from theme-manager for consistent color manipulation
 * @param {string} accentColor - The accent color to use
 * @returns {Object}
 */
function getThemeColors(accentColor) {
  const dark = isDarkMode();
  const baseTheme = dark ? THEME.dark : THEME.light;

  // Generate variants using shared ColorUtils
  // Dark mode uses lighter accent, light mode uses base color
  const accent = dark ? ColorUtils.lighten(accentColor, 10) : accentColor;
  const accentHover = dark
    ? ColorUtils.lighten(accentColor, 20)
    : ColorUtils.darken(accentColor, 10);

  return {
    ...baseTheme,
    accent,
    accentHover,
  };
}

/**
 * Load saved position offset for a domain from chrome.storage.local
 * @param {string} domain - The domain to load position for
 * @returns {Promise<{left: number, up: number}>}
 */
async function loadPositionOffset(domain) {
  if (!domain) return DEFAULT_OFFSET;

  return new Promise((resolve) => {
    chrome.storage.local.get({ floatingButtonPositions: {} }, (items) => {
      const positions = items.floatingButtonPositions || {};
      resolve(positions[domain] || DEFAULT_OFFSET);
    });
  });
}

/**
 * Load all button settings from storage in a single call
 * @returns {Promise<{size: string, transparency: string, accentColor: string}>}
 */
async function loadButtonSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        floatingButtonSize: 'medium',
        floatingButtonTransparency: 'medium',
        accentColor: DEFAULTS.accentColor,
      },
      (items) => {
        resolve({
          size: items.floatingButtonSize || 'medium',
          transparency: items.floatingButtonTransparency || 'medium',
          accentColor: items.accentColor || DEFAULTS.accentColor,
        });
      }
    );
  });
}

/**
 * Save position offset for a domain to chrome.storage.local
 * @param {string} domain - The domain to save position for
 * @param {{left: number, up: number}} offset - The offset from default position
 */
function savePositionOffset(domain, offset) {
  if (!domain) return;

  chrome.storage.local.get({ floatingButtonPositions: {} }, (items) => {
    const positions = items.floatingButtonPositions || {};
    positions[domain] = offset;
    chrome.storage.local.set({ floatingButtonPositions: positions });
  });
}

/**
 * Add domain to ignored domains list
 * @param {string} domain - The domain to ignore
 * @returns {Promise<void>}
 */
async function addDomainToIgnoreList(domain) {
  if (!domain) return;

  return new Promise((resolve) => {
    chrome.storage.sync.get({ ignoredDomains: '' }, (items) => {
      let domains = items.ignoredDomains
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      if (!domains.includes(domain)) {
        domains.push(domain);
        const newValue = domains.join('\n');
        chrome.storage.sync.set({ ignoredDomains: newValue }, resolve);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Inject loading animation styles if not already present
 */
function injectAnimationStyles() {
  if (document.getElementById('extractmd-animation-styles')) return;

  const style = document.createElement('style');
  style.id = 'extractmd-animation-styles';
  style.textContent = LOADING_ANIMATION_CSS;
  document.head.appendChild(style);
}

/**
 * Creates a floating action button for ExtractMD
 * @param {Object} options - Configuration options
 * @param {Function} options.onClick - Click handler function
 * @param {string} [options.id='extractmd-floating-button'] - DOM element ID
 * @param {string} [options.domain] - Current domain for position persistence and ignore functionality
 * @param {boolean} [options.enableDrag=true] - Whether dragging to reposition is enabled
 * @param {boolean} [options.enableDismiss=true] - Whether the dismiss (X) button is enabled
 * @returns {Promise<Object|null>} Button controller with element and state methods
 */
export async function createFloatingButton({
  onClick,
  id = 'extractmd-floating-button',
  domain = '',
  enableDrag = true,
  enableDismiss = true,
}) {
  // Check if button already exists
  const existing = document.getElementById(id);
  if (existing) {
    return null;
  }

  // Inject animation styles
  injectAnimationStyles();

  // Load all settings in parallel for efficiency
  const [positionOffset, settings] = await Promise.all([
    domain ? loadPositionOffset(domain) : Promise.resolve(DEFAULT_OFFSET),
    loadButtonSettings(),
  ]);

  let currentOffset = { ...positionOffset };
  const sizeConfig = SIZE_CONFIG[settings.size] || SIZE_CONFIG.medium;
  const idleOpacity = TRANSPARENCY_CONFIG[settings.transparency] || TRANSPARENCY_CONFIG.medium;

  // Get theme colors using loaded accent color
  const colors = getThemeColors(settings.accentColor);

  const button = document.createElement('div');
  button.id = id;

  // Create inner content container for icon
  const contentContainer = document.createElement('div');
  contentContainer.className = 'extractmd-button-content';
  contentContainer.innerHTML = ICONS.clipboard;

  // Set content container styles individually for jsdom compatibility
  const cs = contentContainer.style;
  cs.width = `${sizeConfig.iconSize}px`;
  cs.height = `${sizeConfig.iconSize}px`;
  cs.display = 'flex';
  cs.alignItems = 'center';
  cs.justifyContent = 'center';
  cs.color = colors.iconColor;

  const svg = contentContainer.querySelector('svg');
  if (svg) {
    svg.style.width = '100%';
    svg.style.height = '100%';
  }
  button.appendChild(contentContainer);

  // Create dismiss button (hidden by default)
  const dismissBtn = document.createElement('div');
  dismissBtn.className = 'extractmd-dismiss-btn';
  dismissBtn.innerHTML = '×';

  // Set dismiss button styles individually
  const ds = dismissBtn.style;
  ds.position = 'absolute';
  ds.top = '-6px';
  ds.right = '-6px';
  ds.width = '18px';
  ds.height = '18px';
  ds.borderRadius = '50%';
  ds.background = colors.error;
  ds.color = 'white';
  ds.fontSize = '14px';
  ds.lineHeight = '18px';
  ds.textAlign = 'center';
  ds.cursor = 'pointer';
  ds.display = 'none';
  ds.zIndex = '10001';
  ds.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  ds.fontWeight = 'bold';
  button.appendChild(dismissBtn);

  // Calculate initial position with saved offset applied
  const initialRight = DEFAULT_RIGHT + currentOffset.left;
  const initialBottom = DEFAULT_BOTTOM + currentOffset.up;

  // Button styles - set individually for jsdom compatibility
  const bs = button.style;
  bs.position = 'fixed';
  bs.bottom = `${initialBottom}px`;
  bs.right = `${initialRight}px`;
  bs.borderRadius = `${sizeConfig.radius}px`;
  bs.width = `${sizeConfig.size}px`;
  bs.height = `${sizeConfig.size}px`;
  bs.cursor = 'pointer';
  bs.background = colors.accent;
  bs.border = 'none';
  bs.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  bs.zIndex = '10000';
  bs.display = 'flex';
  bs.alignItems = 'center';
  bs.justifyContent = 'center';
  bs.transition =
    'box-shadow 0.2s ease, opacity 0.2s ease, background 0.2s ease, transform 0.2s ease';
  bs.userSelect = 'none';
  bs.opacity = idleOpacity.toString();

  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let buttonStartRight = initialRight;
  let buttonStartBottom = initialBottom;
  let hasMoved = false;
  let justFinishedDragging = false; // Flag to prevent click after drag

  // Hover state for dismiss button
  let hoverTimeout = null;
  let isHovering = false;

  // Mouse down - start potential drag (only if dragging is enabled)
  button.addEventListener('mousedown', (e) => {
    if (!enableDrag) return; // Dragging disabled
    if (e.target === dismissBtn) return; // Don't start drag on dismiss button
    if (button.dataset.processing) return;

    isDragging = true;
    hasMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    // Get current position
    const computedStyle = window.getComputedStyle(button);
    buttonStartRight = parseInt(computedStyle.right, 10) || DEFAULT_RIGHT;
    buttonStartBottom = parseInt(computedStyle.bottom, 10) || DEFAULT_BOTTOM;

    // Prevent text selection during drag
    e.preventDefault();

    // Change cursor
    button.style.cursor = 'grabbing';
    button.style.transition = 'box-shadow 0.2s ease, opacity 0.2s ease, background 0.2s ease';
  });

  // Mouse move - handle drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = dragStartX - e.clientX; // Positive = moved left (increase right)
    const deltaY = dragStartY - e.clientY; // Positive = moved up (increase bottom)

    // Check if we've moved enough to consider it a drag
    if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
      hasMoved = true;
    }

    // Update position
    const newRight = Math.max(
      0,
      Math.min(window.innerWidth - sizeConfig.size - 4, buttonStartRight + deltaX)
    );
    const newBottom = Math.max(
      0,
      Math.min(window.innerHeight - sizeConfig.size - 4, buttonStartBottom + deltaY)
    );

    button.style.right = `${newRight}px`;
    button.style.bottom = `${newBottom}px`;
  };

  // Mouse up - end drag or trigger click
  const handleMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    button.style.cursor = 'pointer';

    if (hasMoved) {
      // Set flag to prevent the click event that follows mouseup
      justFinishedDragging = true;

      // Reset the flag after a short delay (after click event would have fired)
      setTimeout(() => {
        justFinishedDragging = false;
      }, 10);

      if (domain) {
        // Calculate and save the new offset
        const computedStyle = window.getComputedStyle(button);
        const currentRight = parseInt(computedStyle.right, 10) || DEFAULT_RIGHT;
        const currentBottom = parseInt(computedStyle.bottom, 10) || DEFAULT_BOTTOM;

        currentOffset = {
          left: currentRight - DEFAULT_RIGHT,
          up: currentBottom - DEFAULT_BOTTOM,
        };

        savePositionOffset(domain, currentOffset);
      }
    }

    hasMoved = false;
  };

  // Add document-level listeners for drag
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Click handler - only trigger if not dragging
  button.addEventListener('click', (e) => {
    if (e.target === dismissBtn) return; // Don't trigger on dismiss button
    if (button.dataset.processing) return;

    // If we just finished dragging, don't trigger click
    if (isDragging || justFinishedDragging) return;

    onClick();
  });

  // Hover effects
  button.addEventListener('mouseenter', () => {
    if (!button.dataset.processing) {
      isHovering = true;
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      button.style.opacity = '1';
      button.style.background = colors.accentHover;
      button.style.transform = 'scale(1.05)';

      // Start timer to show dismiss button (only if dismiss is enabled)
      if (domain && enableDismiss) {
        hoverTimeout = setTimeout(() => {
          if (isHovering && !isDragging) {
            dismissBtn.style.display = 'block';
          }
        }, HOVER_DELAY_MS);
      }
    }
  });

  button.addEventListener('mouseleave', () => {
    isHovering = false;

    // Clear hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    // Hide dismiss button
    dismissBtn.style.display = 'none';

    if (!button.dataset.processing) {
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      button.style.opacity = idleOpacity.toString();
      button.style.background = colors.accent;
      button.style.transform = 'scale(1)';
    }
  });

  // Dismiss button click handler
  dismissBtn.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (domain) {
      await addDomainToIgnoreList(domain);

      // Set global flag to prevent mutation observers from recreating the button
      window.__extractmd_domain_ignored = true;

      // Clear the copy function
      window.copyExtractMD = null;

      // Remove the button
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }

      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });

  // Helper to update icon
  const updateIcon = (iconHtml, color) => {
    contentContainer.innerHTML = iconHtml;
    contentContainer.style.color = color;
    const svg = contentContainer.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'width: 100%; height: 100%;';
    }
  };

  /**
   * Update visibility based on fullscreen/theater state
   */
  const updateVisibility = () => {
    if (isFullscreen()) {
      button.style.display = 'none';
    } else {
      // Only show if it wasn't explicitly hidden by other logic
      // Most of our content scripts use display 'flex' for visible
      if (!button.dataset.explicitHidden) {
        button.style.display = 'flex';
      }
    }
  };

  // Set up listeners for fullscreen changes
  document.addEventListener('fullscreenchange', updateVisibility);
  document.addEventListener('webkitfullscreenchange', updateVisibility);
  document.addEventListener('mozfullscreenchange', updateVisibility);
  document.addEventListener('MSFullscreenChange', updateVisibility);

  // For YouTube theater mode and other dynamic changes that don't trigger fullscreenchange
  if (window.location.hostname.includes('youtube.com')) {
    const ytObserver = new MutationObserver(updateVisibility);
    // Observe attributes on the watch element if it exists
    const watchElement = document.querySelector('ytd-watch-flexy');
    if (watchElement) {
      ytObserver.observe(watchElement, {
        attributes: true,
        attributeFilter: ['theater', 'fullscreen'],
      });
    }
    // Also observe the movie player for aria-pressed changes
    const player = document.querySelector('#movie_player');
    if (player) {
      ytObserver.observe(player, {
        attributes: true,
        subtree: true,
        attributeFilter: ['aria-pressed'],
      });
    }

    // Initial check
    updateVisibility();
  }

  // Controller object with state methods
  const controller = {
    element: button,

    /**
     * Set button to loading state
     */
    setLoading() {
      button.dataset.processing = 'true';
      updateIcon(ICONS.loading, colors.iconColor);
      button.style.background = colors.loading;
      button.style.cursor = 'not-allowed';
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
      dismissBtn.style.display = 'none';
    },

    /**
     * Set button to success state
     */
    setSuccess() {
      updateIcon(ICONS.success, colors.iconColor);
      button.style.background = colors.success;
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    },

    /**
     * Set button to error state
     */
    setError() {
      updateIcon(ICONS.error, colors.iconColor);
      button.style.background = colors.error;
      button.style.opacity = '1';
      button.style.transform = 'scale(1)';
    },

    /**
     * Reset button to normal state
     */
    setNormal() {
      delete button.dataset.processing;
      updateIcon(ICONS.clipboard, colors.iconColor);
      button.style.background = colors.accent;
      button.style.cursor = 'pointer';
      button.style.opacity = idleOpacity.toString();
      button.style.transform = 'scale(1)';
    },

    /**
     * Show the button
     */
    show() {
      delete button.dataset.explicitHidden;
      updateVisibility();
    },

    /**
     * Hide the button
     */
    hide() {
      button.dataset.explicitHidden = 'true';
      button.style.display = 'none';
    },

    /**
     * Remove button from DOM and clean up event listeners
     */
    remove() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      if (button.parentNode) {
        button.parentNode.removeChild(button);
      }
    },

    /**
     * Append button to DOM
     * @param {HTMLElement} [parent=document.body] - Parent element
     */
    appendTo(parent = document.body) {
      parent.appendChild(button);
    },
  };

  return controller;
}
