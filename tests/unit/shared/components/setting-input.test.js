import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingInput } from '../../../../extension/shared/components/setting-input.js';

describe('SettingInput Web Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('setting-input')).toBe(SettingInput);
  });

  it('should render with label and description', () => {
    container.innerHTML = `
      <setting-input 
        setting-id="testInput" 
        label="Test Label" 
        description="Test description">
      </setting-input>
    `;

    const input = container.querySelector('setting-input');
    expect(input.querySelector('.setting-label').textContent).toBe('Test Label');
    expect(input.querySelector('.setting-desc').textContent).toBe('Test description');
  });

  it('should render text input by default', () => {
    container.innerHTML = `
      <setting-input setting-id="myInput" label="My Input"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    expect(inputEl).not.toBeNull();
    expect(inputEl.type).toBe('text');
    expect(inputEl.id).toBe('myInput');
  });

  it('should render number input when type="number"', () => {
    container.innerHTML = `
      <setting-input 
        setting-id="numInput" 
        label="Number" 
        type="number" 
        min="0" 
        max="100" 
        step="5">
      </setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    expect(inputEl.type).toBe('number');
    expect(inputEl.min).toBe('0');
    expect(inputEl.max).toBe('100');
    expect(inputEl.step).toBe('5');
  });

  it('should render with placeholder', () => {
    container.innerHTML = `
      <setting-input 
        setting-id="testInput" 
        label="URL" 
        placeholder="https://example.com">
      </setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    expect(inputEl.placeholder).toBe('https://example.com');
  });

  it('should dispatch change event when value changes', async () => {
    container.innerHTML = `
      <setting-input setting-id="testInput" label="Test"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    const eventPromise = new Promise((resolve) => {
      inputComponent.addEventListener('change', (e) => {
        resolve(e.detail);
      });
    });

    inputEl.value = 'new value';
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    const eventDetail = await eventPromise;
    expect(eventDetail.settingId).toBe('testInput');
    expect(eventDetail.value).toBe('new value');
  });

  it('should dispatch input event on real-time input', async () => {
    container.innerHTML = `
      <setting-input setting-id="testInput" label="Test"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    const eventPromise = new Promise((resolve) => {
      inputComponent.addEventListener('input', (e) => {
        resolve(e.detail);
      });
    });

    inputEl.value = 'typing';
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));

    const eventDetail = await eventPromise;
    expect(eventDetail.settingId).toBe('testInput');
    expect(eventDetail.value).toBe('typing');
  });

  it('should return settingId from setting-id attribute', () => {
    container.innerHTML = `
      <setting-input setting-id="customInput" label="Test"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    expect(inputComponent.settingId).toBe('customInput');
  });

  it('should return input element via getInput()', () => {
    container.innerHTML = `
      <setting-input setting-id="testInput" label="Test"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.getInput();

    expect(inputEl).not.toBeNull();
    expect(inputEl.tagName).toBe('INPUT');
  });

  it('should update value via property setter', () => {
    container.innerHTML = `
      <setting-input setting-id="testInput" label="Test"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    inputComponent.value = 'test value';

    expect(inputComponent.getAttribute('value')).toBe('test value');
    expect(inputComponent.querySelector('input').value).toBe('test value');
  });

  it('should parse number values for number inputs', async () => {
    container.innerHTML = `
      <setting-input setting-id="numInput" label="Number" type="number"></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    const inputEl = inputComponent.querySelector('input');

    const eventPromise = new Promise((resolve) => {
      inputComponent.addEventListener('change', (e) => {
        resolve(e.detail);
      });
    });

    inputEl.value = '42';
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));

    const eventDetail = await eventPromise;
    expect(eventDetail.value).toBe(42);
    expect(typeof eventDetail.value).toBe('number');
  });

  it('should handle disabled state', () => {
    container.innerHTML = `
      <setting-input setting-id="testInput" label="Test" disabled></setting-input>
    `;

    const inputComponent = container.querySelector('setting-input');
    expect(inputComponent.disabled).toBe(true);
    expect(inputComponent.querySelector('input').disabled).toBe(true);
  });
});
