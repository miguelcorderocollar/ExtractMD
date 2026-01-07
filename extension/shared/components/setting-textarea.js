/**
 * <setting-textarea> Web Component
 * A textarea setting with label and description
 *
 * @example
 * <setting-textarea
 *   setting-id="aiChatSystemPrompt"
 *   label="System Prompt"
 *   description="Instructions for the AI"
 *   placeholder="Enter instructions..."
 *   rows="8">
 * </setting-textarea>
 *
 * @fires change - When the textarea value changes (on blur)
 * @fires input - When the textarea value changes (real-time)
 */
export class SettingTextarea extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'label', 'description', 'placeholder', 'rows', 'cols'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    const textarea = this.querySelector('textarea');
    if (textarea) {
      textarea.removeEventListener('change', this._handleChange);
      textarea.removeEventListener('input', this._handleInput);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'value') {
      const textarea = this.querySelector('textarea');
      if (textarea) {
        textarea.value = newValue || '';
      }
    } else if (name === 'disabled') {
      const textarea = this.querySelector('textarea');
      if (textarea) {
        textarea.disabled = this.hasAttribute('disabled');
      }
    } else {
      this.render();
      this.setupEventListeners();
    }
  }

  get settingId() {
    return this.getAttribute('setting-id') || this.id || '';
  }

  get label() {
    return this.getAttribute('label') || '';
  }

  get description() {
    return this.getAttribute('description') || '';
  }

  get placeholder() {
    return this.getAttribute('placeholder') || '';
  }

  get rows() {
    return this.getAttribute('rows') || '4';
  }

  get cols() {
    return this.getAttribute('cols') || '';
  }

  get value() {
    const textarea = this.querySelector('textarea');
    return textarea ? textarea.value : this.getAttribute('value') || '';
  }

  set value(val) {
    this.setAttribute('value', val);
    const textarea = this.querySelector('textarea');
    if (textarea) {
      textarea.value = val;
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  render() {
    const settingId = this.settingId;
    const label = this.label;
    const description = this.description;
    const placeholder = this.placeholder;
    const value = this.getAttribute('value') || '';
    const disabled = this.disabled;
    const rows = this.rows;
    const cols = this.cols;

    // Build textarea attributes
    let textareaAttrs = `id="${settingId}" class="input-textarea"`;
    if (placeholder) textareaAttrs += ` placeholder="${placeholder}"`;
    if (disabled) textareaAttrs += ' disabled';
    if (rows) textareaAttrs += ` rows="${rows}"`;
    if (cols) textareaAttrs += ` cols="${cols}"`;

    this.innerHTML = `
      <div class="setting-row setting-row-textarea">
        <div class="setting-info">
          <span class="setting-label">${label}</span>
          ${description ? `<span class="setting-desc">${description}</span>` : ''}
        </div>
        <textarea ${textareaAttrs}>${value}</textarea>
      </div>
    `;
  }

  setupEventListeners() {
    const textarea = this.querySelector('textarea');
    if (textarea) {
      this._handleChange = (e) => {
        // Stop the native event from bubbling to prevent duplicate events
        e.stopPropagation();

        this.setAttribute('value', e.target.value);

        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            composed: true,
            detail: {
              settingId: this.settingId,
              value: e.target.value,
            },
          })
        );
      };

      this._handleInput = (e) => {
        // Stop the native event from bubbling to prevent duplicate events
        e.stopPropagation();

        this.dispatchEvent(
          new CustomEvent('input', {
            bubbles: true,
            composed: true,
            detail: {
              settingId: this.settingId,
              value: e.target.value,
            },
          })
        );
      };

      textarea.addEventListener('change', this._handleChange);
      textarea.addEventListener('input', this._handleInput);
    }
  }

  /**
   * Get the textarea element for direct access
   * @returns {HTMLTextAreaElement|null}
   */
  getTextarea() {
    return this.querySelector('textarea');
  }
}

// Register the custom element
if (!customElements.get('setting-textarea')) {
  customElements.define('setting-textarea', SettingTextarea);
}
