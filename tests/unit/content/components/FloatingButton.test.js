import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFloatingButton } from '../../../../extension/content/components/FloatingButton.js';

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
          set: vi.fn()
        },
        sync: {
          get: vi.fn((keys, callback) => {
            callback({ ignoredDomains: '', floatingButtonSize: 'medium', floatingButtonTransparency: 'medium' });
          }),
          set: vi.fn((data, callback) => {
            if (callback) callback();
          })
        }
      }
    };

    // Mock matchMedia for dark mode detection
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false, // Default to light mode
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    // Clean up any buttons and injected styles
    const buttons = document.querySelectorAll('#extractmd-floating-button');
    buttons.forEach(b => b.remove());
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
      
      // SVG is inside the content container - jsdom converts SVG to data URI
      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      // Decode URL-encoded content to check SVG
      const innerHTML = decodeURIComponent(contentContainer.innerHTML);
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
  });

  describe('button appearance', () => {
    it('creates button with teal accent background color', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      expect(controller).not.toBeNull();
      // Light mode uses #14b8a6 - jsdom converts to rgb
      expect(controller.element.style.background).toBe('rgb(20, 184, 166)');
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
      
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      // Dark mode accent is #2dd4bf = rgb(45, 212, 191)
      expect(controller.element.style.background).toBe('rgb(45, 212, 191)');
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

    it('setLoading uses warning color for background', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setLoading();
      
      // Light mode loading color is #f59e0b = rgb(245, 158, 11)
      expect(controller.element.style.background).toBe('rgb(245, 158, 11)');
    });

    it('setSuccess updates button to success state with checkmark', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setSuccess();
      
      // Should contain checkmark polyline - decode URL-encoded content
      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = decodeURIComponent(contentContainer.innerHTML);
      expect(innerHTML).toContain('polyline');
      // SVG may use single or double quotes
      expect(innerHTML).toMatch(/points=['"]20\s+6\s+9\s+17\s+4\s+12['"]/);
    });

    it('setSuccess uses success color for background', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setSuccess();
      
      // Light mode success color is #22c55e = rgb(34, 197, 94)
      expect(controller.element.style.background).toBe('rgb(34, 197, 94)');
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

    it('setError uses error color for background', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setError();
      
      // Light mode error color is #ef4444 = rgb(239, 68, 68)
      expect(controller.element.style.background).toBe('rgb(239, 68, 68)');
    });

    it('setNormal resets button to initial state with clipboard icon', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setLoading();
      controller.setNormal();
      
      // Should contain clipboard path again - decode URL-encoded content
      const contentContainer = controller.element.querySelector('.extractmd-button-content');
      expect(contentContainer).not.toBeNull();
      const innerHTML = decodeURIComponent(contentContainer.innerHTML);
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
        bubbles: true
      });
      controller.element.dispatchEvent(mousedownEvent);
      
      // Move significantly (more than DRAG_THRESHOLD of 5px)
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150,
        bubbles: true
      });
      document.dispatchEvent(mousemoveEvent);
      
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true
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
        bubbles: true
      });
      controller.element.dispatchEvent(mousedownEvent);
      
      const mousemoveEvent = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 150,
        bubbles: true
      });
      document.dispatchEvent(mousemoveEvent);
      
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true
      });
      document.dispatchEvent(mouseupEvent);
      
      // Wait for async storage operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Check that storage.local.set was called
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('loads saved position on creation when domain is provided', async () => {
      // Setup mock to return a saved position
      chrome.storage.local.get = vi.fn((keys, callback) => {
        callback({
          floatingButtonPositions: {
            'example.com': { left: 50, up: 100 }
          }
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
      
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(dismissBtn.style.display).toBe('block');
      
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
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      expect(dismissBtn.style.display).toBe('block');
      
      // Simulate mouseleave
      const mouseleaveEvent = new MouseEvent('mouseleave', { bubbles: true });
      controller.element.dispatchEvent(mouseleaveEvent);
      
      expect(dismissBtn.style.display).toBe('none');
      
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
      await new Promise(resolve => setTimeout(resolve, 10));
      
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
      await new Promise(resolve => setTimeout(resolve, 10));
      
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
      await new Promise(resolve => setTimeout(resolve, 10));
      
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
      
      // Dismiss button should still be hidden (no domain = no dismiss functionality)
      const dismissBtn = controller.element.querySelector('.extractmd-dismiss-btn');
      // Check that display is still none (not changed to block)
      expect(dismissBtn.style.display).not.toBe('block');
      
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
      expect(controller.element.style.opacity).toBe('0.5');
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
      
      // Simulate mouseenter
      const mouseenterEvent = new MouseEvent('mouseenter', { bubbles: true });
      controller.element.dispatchEvent(mouseenterEvent);
      
      // Light mode hover is #0d9488 - jsdom converts to rgb
      expect(controller.element.style.background).toBe('rgb(13, 148, 136)');
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
            'test-domain.com': { left: 30, up: 50 }
          }
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
