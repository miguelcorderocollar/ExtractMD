import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingSelect } from '../../../../extension/shared/components/setting-select.js';

/**
 * Helper to wait for component to render (handles async connectedCallback)
 */
const waitForRender = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

describe('SettingSelect Web Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('setting-select')).toBe(SettingSelect);
  });

  it('should render with label and description', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Select Option');
    selectComponent.setAttribute('description', 'Choose an option');
    selectComponent.setOptions([
      { value: 'a', text: 'Option A' },
      { value: 'b', text: 'Option B' },
    ]);
    container.appendChild(selectComponent);

    expect(selectComponent.querySelector('.setting-label').textContent).toBe('Select Option');
    expect(selectComponent.querySelector('.setting-desc').textContent).toBe('Choose an option');
  });

  it('should render select with correct id', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'mySelect');
    selectComponent.setAttribute('label', 'My Select');
    selectComponent.setOptions([{ value: 'x', text: 'X' }]);
    container.appendChild(selectComponent);

    const selectEl = selectComponent.querySelector('select');
    expect(selectEl).not.toBeNull();
    expect(selectEl.id).toBe('mySelect');
  });

  it('should render options from setOptions method', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setOptions([
      { value: 'first', text: 'First' },
      { value: 'second', text: 'Second' },
      { value: 'third', text: 'Third' },
    ]);
    container.appendChild(selectComponent);

    const options = selectComponent.querySelectorAll('select option');

    expect(options.length).toBe(3);
    expect(options[0].value).toBe('first');
    expect(options[0].textContent).toBe('First');
    expect(options[2].value).toBe('third');
  });

  it('should set initial value from attribute', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setAttribute('value', 'second');
    selectComponent.setOptions([
      { value: 'first', text: 'First' },
      { value: 'second', text: 'Second' },
    ]);
    container.appendChild(selectComponent);

    expect(selectComponent.value).toBe('second');
  });

  it('should dispatch change event when value changes', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setOptions([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    container.appendChild(selectComponent);

    const selectEl = selectComponent.querySelector('select');

    const eventPromise = new Promise((resolve) => {
      selectComponent.addEventListener('change', (e) => {
        resolve(e.detail);
      });
    });

    selectEl.value = 'b';
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));

    const eventDetail = await eventPromise;
    expect(eventDetail.settingId).toBe('testSelect');
    expect(eventDetail.value).toBe('b');
  });

  it('should return settingId from setting-id attribute', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'customSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setOptions([{ value: 'x', text: 'X' }]);
    container.appendChild(selectComponent);

    expect(selectComponent.settingId).toBe('customSelect');
  });

  it('should return select element via getSelect()', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setOptions([{ value: 'x', text: 'X' }]);
    container.appendChild(selectComponent);

    const selectEl = selectComponent.getSelect();

    expect(selectEl).not.toBeNull();
    expect(selectEl.tagName).toBe('SELECT');
  });

  it('should update value via property setter', async () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');
    selectComponent.setOptions([
      { value: 'first', text: 'First' },
      { value: 'second', text: 'Second' },
    ]);
    container.appendChild(selectComponent);

    selectComponent.value = 'second';

    expect(selectComponent.getAttribute('value')).toBe('second');
  });

  it('should work with light DOM options when created programmatically', () => {
    const selectComponent = document.createElement('setting-select');
    selectComponent.setAttribute('setting-id', 'testSelect');
    selectComponent.setAttribute('label', 'Test');

    // Add options before appending
    const opt1 = document.createElement('option');
    opt1.value = 'alpha';
    opt1.textContent = 'Alpha';
    selectComponent.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = 'beta';
    opt2.textContent = 'Beta';
    selectComponent.appendChild(opt2);

    container.appendChild(selectComponent);

    // Options should be captured
    const options = selectComponent.querySelectorAll('select option');
    expect(options.length).toBe(2);
    expect(options[0].value).toBe('alpha');
  });
});
