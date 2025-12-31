import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SettingGroup } from '../../../../extension/shared/components/setting-group.js';

describe('SettingGroup Web Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('setting-group')).toBe(SettingGroup);
  });

  it('should render with title', () => {
    container.innerHTML = `
      <setting-group title="My Group">
        <div>Content</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    const title = group.querySelector('.group-title');
    
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('My Group');
  });

  it('should wrap content in settings-group class', () => {
    container.innerHTML = `
      <setting-group title="Test">
        <div id="child">Child Content</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    const wrapper = group.querySelector('.settings-group');
    
    expect(wrapper).not.toBeNull();
  });

  it('should preserve child content', () => {
    container.innerHTML = `
      <setting-group title="Test">
        <div id="first">First</div>
        <div id="second">Second</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    const first = group.querySelector('#first');
    const second = group.querySelector('#second');
    
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first.textContent).toBe('First');
    expect(second.textContent).toBe('Second');
  });

  it('should render without title if not provided', () => {
    container.innerHTML = `
      <setting-group>
        <div>Content only</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    const title = group.querySelector('.group-title');
    
    expect(title).toBeNull();
  });

  it('should return title from title attribute', () => {
    container.innerHTML = `
      <setting-group title="Custom Title">
        <div>Content</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    expect(group.title).toBe('Custom Title');
  });

  it('should update title when attribute changes', () => {
    container.innerHTML = `
      <setting-group title="Original">
        <div>Content</div>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    group.setAttribute('title', 'Updated Title');
    
    const titleEl = group.querySelector('.group-title');
    expect(titleEl.textContent).toBe('Updated Title');
  });

  it('should work with nested setting components', () => {
    container.innerHTML = `
      <setting-group title="Settings">
        <setting-toggle setting-id="test1" label="Toggle 1"></setting-toggle>
        <setting-toggle setting-id="test2" label="Toggle 2"></setting-toggle>
      </setting-group>
    `;
    
    const group = container.querySelector('setting-group');
    const toggles = group.querySelectorAll('setting-toggle');
    
    expect(toggles.length).toBe(2);
  });
});

