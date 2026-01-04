import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingToggle } from '../../../../extension/shared/components/setting-toggle.js';

describe('SettingToggle Web Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('setting-toggle')).toBe(SettingToggle);
  });

  it('should render with label and description', () => {
    container.innerHTML = `
      <setting-toggle 
        setting-id="testSetting" 
        label="Test Label" 
        description="Test description">
      </setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.querySelector('.setting-label').textContent).toBe('Test Label');
    expect(toggle.querySelector('.setting-desc').textContent).toBe('Test description');
  });

  it('should render checkbox with correct id', () => {
    container.innerHTML = `
      <setting-toggle setting-id="mySetting" label="My Setting"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    const input = toggle.querySelector('input[type="checkbox"]');
    expect(input).not.toBeNull();
    expect(input.id).toBe('mySetting');
  });

  it('should be checked when checked attribute is present', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test" checked></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.checked).toBe(true);
    expect(toggle.querySelector('input').checked).toBe(true);
  });

  it('should be unchecked when checked attribute is absent', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.checked).toBe(false);
    expect(toggle.querySelector('input').checked).toBe(false);
  });

  it('should update checked state via property', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    toggle.checked = true;

    expect(toggle.hasAttribute('checked')).toBe(true);
    expect(toggle.querySelector('input').checked).toBe(true);
  });

  it('should dispatch change event when toggled', async () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    const input = toggle.querySelector('input');

    const eventPromise = new Promise((resolve) => {
      toggle.addEventListener('change', (e) => {
        resolve(e.detail);
      });
    });

    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    const eventDetail = await eventPromise;
    expect(eventDetail.settingId).toBe('testSetting');
    expect(eventDetail.checked).toBe(true);
  });

  it('should return settingId from setting-id attribute', () => {
    container.innerHTML = `
      <setting-toggle setting-id="customId" label="Test"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.settingId).toBe('customId');
  });

  it('should return input element via getInput()', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    const input = toggle.getInput();

    expect(input).not.toBeNull();
    expect(input.tagName).toBe('INPUT');
    expect(input.type).toBe('checkbox');
  });

  it('should handle disabled state', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test" disabled></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.disabled).toBe(true);
    expect(toggle.querySelector('input').disabled).toBe(true);
  });

  it('should render without description', () => {
    container.innerHTML = `
      <setting-toggle setting-id="testSetting" label="Test Only"></setting-toggle>
    `;

    const toggle = container.querySelector('setting-toggle');
    expect(toggle.querySelector('.setting-label').textContent).toBe('Test Only');
    expect(toggle.querySelector('.setting-desc')).toBeNull();
  });
});
