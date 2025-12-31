import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFloatingButton } from '../../../../extension/content/components/FloatingButton.js';

describe('FloatingButton component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up any buttons
    const buttons = document.querySelectorAll('#extractmd-floating-button');
    buttons.forEach(b => b.remove());
    container.remove();
  });

  describe('createFloatingButton', () => {
    it('creates a button element with correct structure', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      expect(controller).not.toBeNull();
      expect(controller.element).toBeDefined();
      expect(controller.element.id).toBe('extractmd-floating-button');
      expect(controller.element.innerHTML).toContain('📝');
    });

    it('uses custom emoji when provided', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick, emoji: '🎬' });
      
      expect(controller.element.innerHTML).toContain('🎬');
    });

    it('uses custom id when provided', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick, id: 'custom-button' });
      
      expect(controller.element.id).toBe('custom-button');
    });

    it('returns null if button with same id already exists', () => {
      const onClick = vi.fn();
      const first = createFloatingButton({ onClick });
      first.appendTo(document.body);
      
      const second = createFloatingButton({ onClick });
      
      expect(second).toBeNull();
    });

    it('calls onClick handler when clicked', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      controller.appendTo(document.body);
      
      controller.element.click();
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('dark variant (default)', () => {
    it('creates button with dark variant', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      // Verify button is created with correct structure
      expect(controller).not.toBeNull();
      expect(controller.element.tagName).toBe('DIV');
      expect(controller.element.id).toBe('extractmd-floating-button');
    });
  });

  describe('light variant', () => {
    it('creates button with light variant', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick, variant: 'light' });
      
      // Verify button is created with correct structure
      expect(controller).not.toBeNull();
      expect(controller.element.tagName).toBe('DIV');
      expect(controller.element.id).toBe('extractmd-floating-button');
    });
  });

  describe('state methods', () => {
    it('setLoading updates button to loading state', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      controller.setLoading();
      
      expect(controller.element.innerHTML).toContain('⏳');
      expect(controller.element.dataset.processing).toBe('true');
      expect(controller.element.style.cursor).toBe('not-allowed');
    });

    it('setSuccess updates button to success state', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      controller.setSuccess();
      
      expect(controller.element.innerHTML).toContain('✅');
      expect(controller.element.style.background).toContain('rgba(76, 175, 80');
    });

    it('setError updates button to error state', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      controller.setError();
      
      expect(controller.element.innerHTML).toContain('❌');
      expect(controller.element.style.background).toContain('rgba(244, 67, 54');
    });

    it('setNormal resets button to initial state', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick, emoji: '📝' });
      
      controller.setLoading();
      controller.setNormal();
      
      expect(controller.element.innerHTML).toContain('📝');
      expect(controller.element.dataset.processing).toBeUndefined();
      expect(controller.element.style.cursor).toBe('pointer');
    });
  });

  describe('visibility methods', () => {
    it('show makes button visible', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      controller.element.style.display = 'none';
      
      controller.show();
      
      expect(controller.element.style.display).toBe('flex');
    });

    it('hide makes button invisible', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      controller.hide();
      
      expect(controller.element.style.display).toBe('none');
    });
  });

  describe('DOM methods', () => {
    it('appendTo adds button to specified parent', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      
      controller.appendTo(container);
      
      expect(container.contains(controller.element)).toBe(true);
    });

    it('remove removes button from DOM', () => {
      const onClick = vi.fn();
      const controller = createFloatingButton({ onClick });
      controller.appendTo(container);
      
      controller.remove();
      
      expect(container.contains(controller.element)).toBe(false);
    });
  });
});

