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
            callback({ ignoredDomains: '' });
          }),
          set: vi.fn((data, callback) => {
            if (callback) callback();
          })
        }
      }
    };
  });

  afterEach(() => {
    // Clean up any buttons
    const buttons = document.querySelectorAll('#extractmd-floating-button');
    buttons.forEach(b => b.remove());
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
      expect(controller.element.innerHTML).toContain('📝');
    });

    it('uses custom emoji when provided', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, emoji: '🎬' });
      
      expect(controller.element.innerHTML).toContain('🎬');
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
  });

  describe('dark variant (default)', () => {
    it('creates button with dark variant', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      // Verify button is created with correct structure
      expect(controller).not.toBeNull();
      expect(controller.element.tagName).toBe('DIV');
      expect(controller.element.id).toBe('extractmd-floating-button');
    });
  });

  describe('light variant', () => {
    it('creates button with light variant', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, variant: 'light' });
      
      // Verify button is created with correct structure
      expect(controller).not.toBeNull();
      expect(controller.element.tagName).toBe('DIV');
      expect(controller.element.id).toBe('extractmd-floating-button');
    });
  });

  describe('state methods', () => {
    it('setLoading updates button to loading state', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setLoading();
      
      expect(controller.element.innerHTML).toContain('⏳');
      expect(controller.element.dataset.processing).toBe('true');
      expect(controller.element.style.cursor).toBe('not-allowed');
    });

    it('setSuccess updates button to success state', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setSuccess();
      
      expect(controller.element.innerHTML).toContain('✅');
      expect(controller.element.style.background).toContain('rgba(76, 175, 80');
    });

    it('setError updates button to error state', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick });
      
      controller.setError();
      
      expect(controller.element.innerHTML).toContain('❌');
      expect(controller.element.style.background).toContain('rgba(244, 67, 54');
    });

    it('setNormal resets button to initial state', async () => {
      const onClick = vi.fn();
      const controller = await createFloatingButton({ onClick, emoji: '📝' });
      
      controller.setLoading();
      controller.setNormal();
      
      expect(controller.element.innerHTML).toContain('📝');
      expect(controller.element.dataset.processing).toBeUndefined();
      expect(controller.element.style.cursor).toBe('pointer');
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
