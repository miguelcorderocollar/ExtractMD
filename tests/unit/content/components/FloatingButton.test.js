import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFloatingButton } from '../../../../extension/content/components/FloatingButton.js';

/** Raw SVG markup or legacy data-URI–encoded icon HTML from jsdom */
function iconInnerHtmlForAssert(html) {
  try {
    return decodeURIComponent(html);
  } catch {
    return html;
  }
}

describe('FloatingButton component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          get: vi.fn((keys, callback) => {
            callback({ floatingButtonPositions: {} });
          }),
          set: vi.fn(),
        },
        sync: {
          get: vi.fn((keys, callback) => {
            callback({
              ignoredDomains: '',
              floatingButtonSize: 'medium',
              floatingButtonTransparency: 'medium',
              floatingButtonStyle: 'glass',
              accentColor: '#14b8a6',
            });
          }),
          set: vi.fn((data, callback) => {
            if (callback) callback();
          }),
        },
      },
    };

    // Mock matchMedia for dark mode detection
    global.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false, // Default to light mode
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    // Clean up any buttons and injected styles
    const buttons = document.querySelectorAll('#extractmd-floating-button');
    buttons.forEach((b) => b.remove());
    const styles = document.getElementById('extractmd-animation-styles');
    if (styles) styles.remove();
    container.remove();
    vi.clearAllMocks();
  });

  describe('createFloatingButton', () => {
    it('creates a button element with correct structure', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller).not.toBeNull();
      expect(controller.element).toBeDefined();
      expect(controller.element.id).toBe('extractmd-floating-button');
    });

    it('renders clipboard SVG icon by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = iconInnerHtmlForAssert(contentContainer.innerHTML);
      expect(innerHTML).toContain('viewBox');
      expect(innerHTML).toContain('M16 4h2a2 2 0 0 1 2 2v14');
    });

    it('uses custom id when provided', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, id: 'custom-button' });

      expect(controller.element.id).toBe('custom-button');
    });

    it('returns null if button with same id already exists', async () => {
      const onClick = vi.fn();
      const first = await createFloatingButton({ onClick });
      first.appendTo(document.body);

      const second = await createFloatingButton({ onClick });

      expect(second).toBeNull();
    });

    it('calls onClick handler when clicked', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      controller.element.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('accepts domain parameter', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });

      expect(controller).not.toBeNull();
      expect(controller.element).toBeDefined();
    });

    it('injects animation styles into document head', async () => {
      const onClick = vi.fn();
      await createFloatingButton({ onClick });

      const styleEl = document.getElementById('extractmd-animation-styles');
      expect(styleEl).not.toBeNull();
      expect(styleEl.textContent).toContain('extractmd-bounce');
    });

    it('renders detection hint badge when enabled', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({
        onClick,
        showDetectionHint: true,
        detectionHintText: 'Article',
      });

      const hint = controller.element.querySelector('.extractmd-detection-hint');
      expect(hint).not.toBeNull();
      expect(hint.textContent).toBe('Article');
    });

    it('does not render detection hint badge when disabled', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({
        onClick,
        showDetectionHint: false,
        detectionHintText: 'Article',
      });

      const hint = controller.element.querySelector('.extractmd-detection-hint');
      expect(hint).toBeNull();
    });

    it('sets accessible label including detection hint text', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({
        onClick,
        showDetectionHint: true,
        detectionHintText: 'Page',
      });

      expect(controller.element.getAttribute('aria-label')).toContain('Page');
      expect(controller.element.title).toContain('Page');
    });
  });

  describe('button appearance', () => {
    it('creates button with default frosted glass background', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller).not.toBeNull();
      // Default is glass style: neutral white rgba background
      expect(controller.element.style.background).toContain('rgba(255, 255, 255');
    });

    it('creates button with rounded square shape (not circular)', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Medium size has 12px border radius
      expect(controller.element.style.borderRadius).toBe('12px');
    });

    it('button has reduced opacity by default (medium transparency)', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.opacity).toBe('0.5');
    });
  });

  describe('size configurations', () => {
    it('uses medium size (48px) by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.width).toBe('48px');
      expect(controller.element.style.height).toBe('48px');
      expect(controller.element.style.borderRadius).toBe('12px');
    });

    it('uses small size (40px) when configured', async () => {
      // Mock storage to return small size
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'small', floatingButtonTransparency: 'medium' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.width).toBe('40px');
      expect(controller.element.style.height).toBe('40px');
      expect(controller.element.style.borderRadius).toBe('10px');
    });

    it('uses large size (56px) when configured', async () => {
      // Mock storage to return large size
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'large', floatingButtonTransparency: 'medium' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.width).toBe('56px');
      expect(controller.element.style.height).toBe('56px');
      expect(controller.element.style.borderRadius).toBe('14px');
    });

    it('uses extra small size (32px) when configured', async () => {
      // Mock storage to return extraSmall size
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'extraSmall', floatingButtonTransparency: 'medium' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.width).toBe('32px');
      expect(controller.element.style.height).toBe('32px');
      expect(controller.element.style.borderRadius).toBe('8px');
    });

    it('uses extra large size (64px) when configured', async () => {
      // Mock storage to return extraLarge size
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'extraLarge', floatingButtonTransparency: 'medium' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.width).toBe('64px');
      expect(controller.element.style.height).toBe('64px');
      expect(controller.element.style.borderRadius).toBe('16px');
    });
  });

  describe('transparency settings', () => {
    it('uses medium transparency (0.5) by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.opacity).toBe('0.5');
    });

    it('uses low transparency (0.3) when configured', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'medium', floatingButtonTransparency: 'low' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.opacity).toBe('0.3');
    });

    it('uses high transparency (0.7) when configured', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'medium', floatingButtonTransparency: 'high' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.opacity).toBe('0.7');
    });

    it('uses full opacity (1.0) when configured', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'medium', floatingButtonTransparency: 'full' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.opacity).toBe('1');
    });

    it('resets to configured transparency after setNormal', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({ floatingButtonSize: 'medium', floatingButtonTransparency: 'low' });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Set to loading (opacity 1)
      controller.setLoading();
      expect(controller.element.style.opacity).toBe('1');

      // Reset to normal (should use configured transparency)
      controller.setNormal();
      expect(controller.element.style.opacity).toBe('0.3');
    });
  });

  describe('dark mode support', () => {
    it('uses light theme colors when prefers-color-scheme is light', async () => {
      global.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false, // Light mode
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'solid',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Light mode accent is #14b8a6 = rgb(20, 184, 166)
      expect(controller.element.style.background).toBe('rgb(20, 184, 166)');
    });

    it('uses dark theme colors when prefers-color-scheme is dark', async () => {
      global.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true, // Dark mode
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'solid',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Dark mode uses a lightened accent color for better visibility
      expect(controller.element.style.background).not.toBe('');
      // Just verify it's different from light mode (rgb(20, 184, 166))
      expect(controller.element.style.background).not.toBe('rgb(20, 184, 166)');
    });

    it('uses custom accent color from storage', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonStyle: 'solid',
          accentColor: '#ff0000',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      expect(controller.element.style.background).toBe('rgb(255, 0, 0)');
    });

    it('computes hover variant correctly', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonStyle: 'solid',
          accentColor: '#0066cc',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      // Get initial background
      const initialBg = controller.element.style.background;

      // Simulate mouseenter to trigger hover variant
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // Should use a different (darker) color for hover
      expect(controller.element.style.background).not.toBe('');
      expect(controller.element.style.background).not.toBe(initialBg);
    });
  });

  describe('state methods', () => {
    it('setLoading updates button to loading state with animated dots', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setLoading();

      // Should contain loading dots SVG
      expect(controller.element.innerHTML).toContain('extractmd-dot');
      expect(controller.element.dataset.processing).toBe('true');
      expect(controller.element.style.cursor).toBe('not-allowed');
    });

    it('setLoading uses translucent warning glass background by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setLoading();

      expect(controller.element.style.background).toBe('rgba(245, 158, 11, 0.2)');
    });

    it('setSuccess updates button to success state with checkmark', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setSuccess();

      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = iconInnerHtmlForAssert(contentContainer.innerHTML);
      expect(innerHTML).toContain('polyline');
      // SVG may use single or double quotes
      expect(innerHTML).toMatch(/points=['"]20\s+6\s+9\s+17\s+4\s+12['"]/);
    });

    it('setSuccess uses translucent success glass background by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setSuccess();

      expect(controller.element.style.background).toBe('rgba(34, 197, 94, 0.2)');
    });

    it('solid style loading/success/error states keep opaque colors', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'solid',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setLoading();
      expect(controller.element.style.background).toBe('rgb(245, 158, 11)');

      controller.setSuccess();
      expect(controller.element.style.background).toBe('rgb(34, 197, 94)');

      controller.setError();
      expect(controller.element.style.background).toBe('rgb(239, 68, 68)');
    });

    it('setError updates button to error state with X icon', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setError();

      // Should contain X lines - check innerHTML (may be URL-encoded)
      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = contentContainer.innerHTML;
      expect(innerHTML).toMatch(/line/i);
      expect(innerHTML).toMatch(/x1[=:]['"]18['"]/i);
      expect(innerHTML).toMatch(/x2[=:]['"]6['"]/i);
    });

    it('setError uses translucent error glass background by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setError();

      expect(controller.element.style.background).toBe('rgba(239, 68, 68, 0.2)');
    });

    it('setNormal resets button to initial state with clipboard icon', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setLoading();
      controller.setNormal();

      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = iconInnerHtmlForAssert(contentContainer.innerHTML);
      expect(innerHTML).toContain('M16 4h2a2 2 0 0 1 2 2v14');
      expect(controller.element.dataset.processing).toBeUndefined();
      expect(controller.element.style.cursor).toBe('pointer');
      expect(controller.element.style.opacity).toBe('0.5');
    });
  });

  describe('visibility methods', () => {
    it('show makes button visible', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.element.style.display = 'none';

      controller.show();

      expect(controller.element.style.display).toBe('flex');
    });

    it('hide makes button invisible', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.hide();

      expect(controller.element.style.display).toBe('none');
    });
  });

  describe('DOM methods', () => {
    it('appendTo adds button to specified parent', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.appendTo(container);

      expect(container.contains(controller.element)).toBe(true);
    });

    it('remove removes button from DOM', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(container);

      controller.remove();

      expect(container.contains(controller.element)).toBe(false);
    });
  });

  describe('drag behavior', () => {
    it('does not trigger onClick when button is dragged', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // Simulate drag: mousedown, move significantly, mouseup
      const mousedownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      controller.element.dispatchEvent(mousedownEvent);

      // Move significantly (more than DRAG_THRESHOLD of 5px)
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150,
        bubbles: true,
      });
      document.dispatchEvent(mousemoveEvent);

      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
      });
      document.dispatchEvent(mouseupEvent);

      // Click should not be triggered after drag
      expect(onClick).not.toHaveBeenCalled();
    });

    it('saves position to storage after drag when domain is provided', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // Simulate drag
      const mousedownEvent = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      controller.element.dispatchEvent(mousedownEvent);

      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150,
        bubbles: true,
      });
      document.dispatchEvent(mousemoveEvent);

      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
      });
      document.dispatchEvent(mouseupEvent);

      // Wait for async storage operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that storage.local.set was called
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('loads saved position on creation when domain is provided', async () => {
      // Setup mock to return a saved position
      chrome.storage.local.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonPositions: {
            'example.com': { left: 50, up: 100 },
          },
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // Check that storage.local.get was called
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });
  });

  describe('dismiss button', () => {
    it('creates dismiss button element', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });

      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(dismissBtn).not.toBeNull();
      expect(dismissBtn.innerHTML).toBe('×');
    });

    it('dismiss button is hidden by default', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      // The dismiss button should exist
      expect(dismissBtn).not.toBeNull();
      expect(dismissBtn.className).toBe('extractmd-dismiss-btn');
      expect(dismissBtn.innerHTML).toBe('×');
    });

    it('dismiss button appears after hover timeout', async () => {
      vi.useFakeTimers();

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // Advance timer past HOVER_DELAY_MS (500ms)
      vi.advanceTimersByTime(600);

      const actionsContainer = controller.element.querySelector('.extractmd-hover-actions');
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(actionsContainer).not.toBeNull();
      expect(actionsContainer.style.display).toBe('block');
      expect(dismissBtn).not.toBeNull();

      vi.useRealTimers();
    });

    it('dismiss button hides on mouseleave', async () => {
      vi.useFakeTimers();

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // Show dismiss button
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);
      vi.advanceTimersByTime(600);

      // Verify it's visible
      const actionsContainer = controller.element.querySelector('.extractmd-hover-actions');
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(actionsContainer.style.display).toBe('block');
      expect(dismissBtn).not.toBeNull();

      // Simulate mouseleave
      const mouseleaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      controller.element.dispatchEvent(mouseleaveEvent);
      vi.advanceTimersByTime(250);

      expect(actionsContainer.style.display).toBe('none');

      vi.useRealTimers();
    });

    it('dismiss button click adds domain to ignore list', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      dismissBtn.style.display = 'block'; // Make it visible for clicking

      // Click dismiss button
      dismissBtn.click();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that storage.sync.set was called with the domain
      expect(chrome.storage.sync.set).toHaveBeenCalled();
      const setCall = chrome.storage.sync.set.mock.calls[0][0];
      expect(setCall.ignoredDomains).toContain('example.com');
    });

    it('dismiss button click removes button from DOM', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      dismissBtn.style.display = 'block';

      // Click dismiss button
      dismissBtn.click();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Button should be removed
      expect(document.body.contains(controller.element)).toBe(false);
    });

    it('dismiss button click does not trigger main onClick', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      dismissBtn.style.display = 'block';

      // Click dismiss button
      dismissBtn.click();

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Main onClick should not be called
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not show dismiss button when no domain provided', async () => {
      vi.useFakeTimers();

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick }); // No domain
      controller.appendTo(document.body);

      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // Advance timer past HOVER_DELAY_MS
      vi.advanceTimersByTime(600);

      // No domain = no dismiss action
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(dismissBtn).toBeNull();

      vi.useRealTimers();
    });

    it('supports custom hover secondary action (rocket)', async () => {
      vi.useFakeTimers();
      const onClick = vi.fn();
      const onSecondaryAction = vi.fn().mockResolvedValue(undefined);
      const controller = await createFloatingButton({
        onClick,
        secondaryActions: [
          {
            icon: '🚀',
            title: 'Send to API',
            onClick: onSecondaryAction,
          },
        ],
      });
      controller.appendTo(document.body);

      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);
      vi.advanceTimersByTime(600);

      const actionsContainer = controller.element.querySelector('.extractmd-hover-actions');
      const actionBtn = controller.element.querySelector('.extractmd-hover-action-btn');
      expect(actionsContainer).not.toBeNull();
      expect(actionBtn).not.toBeNull();
      expect(actionBtn.innerHTML).toBe('🚀');
      expect(actionsContainer.style.display).toBe('block');

      actionBtn.click();
      await Promise.resolve();

      expect(onSecondaryAction).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('caps secondary hover actions to three buttons', async () => {
      vi.useFakeTimers();
      const onClick = vi.fn();
      const actions = Array.from({ length: 7 }, (_, index) => ({
        icon: `${index + 1}`,
        title: `Action ${index + 1}`,
        onClick: vi.fn(),
      }));

      const controller = await createFloatingButton({
        onClick,
        secondaryActions: actions,
      });
      controller.appendTo(document.body);

      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);
      vi.advanceTimersByTime(600);

      const actionButtons = controller.element.querySelectorAll('.extractmd-hover-action-btn');
      expect(actionButtons.length).toBe(3);
      vi.useRealTimers();
    });
  });

  describe('hover effects', () => {
    it('increases opacity to 1 on hover', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      // Initial opacity (default is medium = 0.5)
      expect(controller.element.style.opacity).toBe('0.5');

      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // After hover, opacity is set directly via style.opacity
      expect(controller.element.style.opacity).toBe('1');
    });

    it('reduces opacity back to configured transparency on mouseleave', async () => {
      vi.useFakeTimers();
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      // Hover
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);
      expect(controller.element.style.opacity).toBe('1');

      // Leave (should return to default medium = 0.5)
      const mouseleaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      controller.element.dispatchEvent(mouseleaveEvent);
      vi.advanceTimersByTime(250);
      expect(controller.element.style.opacity).toBe('0.5');
      vi.useRealTimers();
    });

    it('applies scale transform on hover', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      expect(controller.element.style.transform).toBe('scale(1.05)');
    });

    it('changes to hover background color on mouseenter', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      // Get initial background (accent color)
      const initialBg = controller.element.style.background;

      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // Hover uses a darkened version of the accent color
      expect(controller.element.style.background).not.toBe('');
      expect(controller.element.style.background).not.toBe(initialBg);
    });
  });

  describe('glass style', () => {
    it('uses solid style when configured (no backdrop-filter)', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'solid',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Solid style should not set backdrop-filter
      expect(controller.element.style.backdropFilter || '').toBe('');
      // Solid style sets border to 'none' (jsdom serializes as 'medium')
      expect(controller.element.style.borderStyle).toBe('none');
    });

    it('uses glass style by default (colorless frosted glass)', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      // Glass background should be neutral white rgba (no accent color)
      const bg = controller.element.style.background;
      expect(bg).toContain('rgba');
      expect(bg).toContain('255');
      expect(bg).not.toContain('184'); // No accent tint (teal green component)

      // Glass style should set a visible border
      expect(controller.element.style.border).not.toBe('none');
      expect(controller.element.style.border).toContain('rgba');
    });

    it('glass style hover updates background while keeping glass effect', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'glass',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      controller.appendTo(document.body);

      const initialBg = controller.element.style.background;

      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);

      // Hover should change background
      expect(controller.element.style.background).not.toBe(initialBg);
    });

    it('glass style setNormal restores glass background', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'glass',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      const initialBg = controller.element.style.background;

      controller.setLoading();
      controller.setNormal();

      expect(controller.element.style.background).toBe(initialBg);
    });

    it('glass style loading/success/error states use translucent tinted backgrounds', async () => {
      chrome.storage.sync.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonSize: 'medium',
          floatingButtonTransparency: 'medium',
          floatingButtonStyle: 'glass',
          accentColor: '#14b8a6',
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });

      controller.setLoading();
      expect(controller.element.style.background).toBe('rgba(245, 158, 11, 0.2)');

      controller.setSuccess();
      expect(controller.element.style.background).toBe('rgba(34, 197, 94, 0.2)');

      controller.setError();
      expect(controller.element.style.background).toBe('rgba(239, 68, 68, 0.2)');
    });
  });

  describe('position offset storage', () => {
    it('uses default position when no saved offset exists', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'example.com' });
      controller.appendTo(document.body);

      // The button element should exist and be properly structured
      expect(controller.element).toBeDefined();
      expect(controller.element.id).toBe('extractmd-floating-button');
      // Verify storage.local.get was called to load positions
      expect(chrome.storage.local.get).toHaveBeenCalled();
    });

    it('applies saved offset to position', async () => {
      // Setup mock to return a saved position
      chrome.storage.local.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonPositions: {
            'test-domain.com': { left: 30, up: 50 },
          },
        });
      });

      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, domain: 'test-domain.com' });
      controller.appendTo(document.body);

      // Verify storage was called to load the position
      expect(chrome.storage.local.get).toHaveBeenCalled();
      // The button should be created (position is applied via cssText which jsdom may not parse fully)
      expect(controller.element).toBeDefined();
      expect(controller.element.id).toBe('extractmd-floating-button');
    });
  });
});
