/**
 * <setting-group> Web Component
 * A container for grouping related settings with a title
 * 
 * @example
 * <setting-group title="Transcript Content">
 *   <setting-toggle setting-id="includeTimestamps" label="Include Timestamps"></setting-toggle>
 *   <setting-toggle setting-id="addTitleToTranscript" label="Include Video Title"></setting-toggle>
 * </setting-group>
 */
export class SettingGroup extends HTMLElement {
  static get observedAttributes() {
    return ['title'];
  }

  constructor() {
    super();
    this._slotContent = null;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'title') {
      const titleEl = this.querySelector('.group-title');
      if (titleEl) {
        titleEl.textContent = newValue;
      }
    }
  }

  get title() {
    return this.getAttribute('title') || '';
  }

  set title(value) {
    this.setAttribute('title', value);
  }

  render() {
    const title = this.title;
    
    // Create wrapper structure
    const wrapper = document.createElement('div');
    wrapper.className = 'settings-group';
    
    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'group-title';
      titleEl.textContent = title;
      wrapper.appendChild(titleEl);
    }
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'settings-group-content';
    
    // Move existing children to content container
    while (this.firstChild) {
      content.appendChild(this.firstChild);
    }
    
    wrapper.appendChild(content);
    this.appendChild(wrapper);
  }
}

// Register the custom element
if (!customElements.get('setting-group')) {
  customElements.define('setting-group', SettingGroup);
}

