/**
 * <setting-input> Web Component
 * A text or number input setting with label and description
 *
 * @example
 * <setting-input
 *   setting-id="jumpToDomainUrl"
 *   label="Target URL"
 *   description="URL to open after extraction"
 *   type="text"
 *   placeholder="https://chat.openai.com/">
 * </setting-input>
 *
 * <setting-input
 *   setting-id="downloadIfTokensExceed"
 *   label="Download if Tokens Exceed"
 *   description="Auto-download large extractions (thousands)"
 *   type="number"
 *   min="0"
 *   step="1">
 * </setting-input>
 *
 * @fires change - When the input value changes (on blur or Enter)
 * @fires input - When the input value changes (real-time)
 */
export class SettingInput extends HTMLElement {
  static get observedAttributes() {
    return [
      'value',
      'disabled',
      'label',
      'description',
      'type',
      'placeholder',
      'min',
      'max',
      'step',
    ];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    const input = this.querySelector('input');
    if (input) {
      input.removeEventListener('change', this._handleChange);
      input.removeEventListener('input', this._handleInput);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'value') {
      const input = this.querySelector('input');
      if (input) {
        input.value = newValue || '';
      }
    } else if (name === 'disabled') {
      const input = this.querySelector('input');
      if (input) {
        input.disabled = this.hasAttribute('disabled');
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

  get type() {
    return this.getAttribute('type') || 'text';
  }

  get placeholder() {
    return this.getAttribute('placeholder') || '';
  }

  get value() {
    const input = this.querySelector('input');
    return input ? input.value : this.getAttribute('value') || '';
  }

  set value(val) {
    this.setAttribute('value', val);
    const input = this.querySelector('input');
    if (input) {
      input.value = val;
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
    const type = this.type;
    const placeholder = this.placeholder;
    const value = this.getAttribute('value') || '';
    const disabled = this.disabled;
    const min = this.getAttribute('min');
    const max = this.getAttribute('max');
    const step = this.getAttribute('step');

    const isNumber = type === 'number';
    const inputClass = isNumber ? 'input-number' : 'input-text';

    // Build input attributes
    let inputAttrs = `type="${type}" id="${settingId}" class="${inputClass}"`;
    if (placeholder) inputAttrs += ` placeholder="${placeholder}"`;
    if (value) inputAttrs += ` value="${value}"`;
    if (disabled) inputAttrs += ' disabled';
    if (min !== null) inputAttrs += ` min="${min}"`;
    if (max !== null) inputAttrs += ` max="${max}"`;
    if (step !== null) inputAttrs += ` step="${step}"`;

    this.innerHTML = `
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">${label}</span>
          ${description ? `<span class="setting-desc">${description}</span>` : ''}
        </div>
        <input ${inputAttrs}>
      </div>
    `;
  }

  setupEventListeners() {
    const input = this.querySelector('input');
    if (input) {
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
              value: this.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
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

      input.addEventListener('change', this._handleChange);
      input.addEventListener('input', this._handleInput);
    }
  }

  /**
   * Get the input element for direct access
   * @returns {HTMLInputElement|null}
   */
  getInput() {
    return this.querySelector('input');
  }
}

// Register the custom element
if (!customElements.get('setting-input')) {
  customElements.define('setting-input', SettingInput);
}
