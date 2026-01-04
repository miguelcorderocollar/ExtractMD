import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../../../extension/shared/components/setting-input.js';
import { DEFAULTS } from '../../../../extension/shared/defaults.js';

describe('SettingInput Color Type', () => {
  let container;
  let element;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    element = document.createElement('setting-input');
    container.appendChild(element);
  });

  afterEach(() => {
    container.remove();
    vi.clearAllMocks();
  });

  describe('render', () => {
    it('renders color input correctly', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('value', '#ff0000');

      const input = element.querySelector('input');
      expect(input).not.toBeNull();
      expect(input.type).toBe('color');
      expect(input.value).toBe('#ff0000');
      expect(input.className).toBe('input-color');
    });

    it('renders reset button when reset-value is provided', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');

      const resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn).not.toBeNull();
      expect(resetBtn.textContent).toContain('Reset to Default');
      expect(resetBtn.dataset.resetValue).toBe('#14b8a6');
    });

    it('does not render reset button when reset-value is not provided', () => {
      element.setAttribute('setting-id', 'someColor');
      element.setAttribute('label', 'Some Color');
      element.setAttribute('type', 'color');

      const resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn).toBeNull();
    });

    it('wraps input in setting-input-wrapper when reset button exists', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');

      const wrapper = element.querySelector('.setting-input-wrapper');
      expect(wrapper).not.toBeNull();

      const input = wrapper.querySelector('input');
      const resetBtn = wrapper.querySelector('.reset-btn');
      expect(input).not.toBeNull();
      expect(resetBtn).not.toBeNull();
    });

    it('re-renders when reset-value attribute changes', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');

      let resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn).toBeNull();

      element.setAttribute('reset-value', '#14b8a6');

      resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn).not.toBeNull();
      expect(resetBtn.dataset.resetValue).toBe('#14b8a6');
    });
  });

  describe('events', () => {
    let changeHandler, inputHandler;

    beforeEach(() => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');
      element.setAttribute('value', '#ff0000');

      changeHandler = vi.fn();
      inputHandler = vi.fn();

      element.addEventListener('change', changeHandler);
      element.addEventListener('input', inputHandler);
    });

    it('triggers input event when color input changes', () => {
      const input = element.querySelector('input');

      input.value = '#00ff00';
      input.dispatchEvent(new Event('input'));

      expect(inputHandler).toHaveBeenCalledTimes(1);
      expect(inputHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            settingId: 'accentColor',
            value: '#00ff00',
          },
        })
      );
    });

    it('triggers change event when color input changes', () => {
      const input = element.querySelector('input');

      input.value = '#00ff00';
      input.dispatchEvent(new Event('change'));

      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            settingId: 'accentColor',
            value: '#00ff00',
          },
        })
      );
    });

    it('triggers events with correct settingId', () => {
      element.setAttribute('setting-id', 'customColor');
      const input = element.querySelector('input');

      input.value = '#0000ff';
      input.dispatchEvent(new Event('change'));

      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            settingId: 'customColor',
            value: '#0000ff',
          },
        })
      );
    });
  });

  describe('reset button functionality', () => {
    beforeEach(() => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');
      element.setAttribute('value', '#ff0000');
    });

    it('resets input value when reset button is clicked', () => {
      const input = element.querySelector('input');
      const resetBtn = element.querySelector('.reset-btn');

      expect(input.value).toBe('#ff0000');

      resetBtn.click();

      expect(input.value).toBe('#14b8a6');
      expect(element.getAttribute('value')).toBe('#14b8a6');
    });

    it('triggers input event on reset', () => {
      const inputHandler = vi.fn();
      element.addEventListener('input', inputHandler);

      const resetBtn = element.querySelector('.reset-btn');
      resetBtn.click();

      expect(inputHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            settingId: 'accentColor',
            value: '#14b8a6',
          },
        })
      );
    });

    it('triggers change event on reset', () => {
      const changeHandler = vi.fn();
      element.addEventListener('change', changeHandler);

      const resetBtn = element.querySelector('.reset-btn');
      resetBtn.click();

      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            settingId: 'accentColor',
            value: '#14b8a6',
          },
        })
      );
    });

    it('prevents default click behavior', () => {
      const resetBtn = element.querySelector('.reset-btn');
      const event = new MouseEvent('click', { bubbles: true });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      resetBtn.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('attribute changes', () => {
    it('updates input value when value attribute changes', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('value', '#ff0000');

      element.setAttribute('value', '#00ff00');

      const input = element.querySelector('input');
      expect(input.value).toBe('#00ff00');
    });

    it('updates input value when value property is set', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');

      element.value = '#ff0000';

      const input = element.querySelector('input');
      expect(input.value).toBe('#ff0000');
      expect(element.getAttribute('value')).toBe('#ff0000');
    });

    it('returns correct value from value property', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('value', '#ff0000');

      expect(element.value).toBe('#ff0000');
    });
  });

  describe('integration', () => {
    it('simulates settings loading with stored accent color', () => {
      // Create element as it would appear in options.html
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');

      // Simulate what loadSettings does - set the value property
      const storedColor = '#ff6b35'; // Orange color
      element.value = storedColor;

      // Verify the input element has the correct value
      const input = element.querySelector('input');
      expect(input.value).toBe(storedColor);

      // Verify the component's value property returns the correct value
      expect(element.value).toBe(storedColor);

      // Verify the reset button has the correct data
      const resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn).not.toBeNull();
      expect(resetBtn.dataset.resetValue).toBe(DEFAULTS.accentColor);
    });

    it('uses default color when no value is set', () => {
      element.setAttribute('setting-id', 'accentColor');
      element.setAttribute('label', 'Accent Color');
      element.setAttribute('type', 'color');
      element.setAttribute('reset-value', '#14b8a6');

      // Don't set any value - should use default

      const input = element.querySelector('input');
      expect(input.value).toBe('#000000'); // HTML color input default

      // But the component should have access to the reset value
      const resetBtn = element.querySelector('.reset-btn');
      expect(resetBtn.dataset.resetValue).toBe(DEFAULTS.accentColor);
    });
  });
});
