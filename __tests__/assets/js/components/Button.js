// * Button component with different variants and states
export class Button {
  constructor (options = {}) {
    this.text = options.text || 'Click me'; this.variant = options.variant || 'primary';
    this.size = options.size || 'medium';
    this.disabled = options.disabled || false;
    this.onClick = options.onClick || (() => { });
  }

  render() {
    const button = document.createElement('button');
    button.textContent = this.text;
    button.className = `btn btn-${this.variant} btn-${this.size}`;
    button.disabled = this.disabled;

    if (!this.disabled) {
      button.addEventListener('click', this.onClick);
    }

    return button;
  }

  setText(text) {
    this.text = text;
  }

  setVariant(variant) {
    this.variant = variant;
  }

  setSize(size) {
    this.size = size;
  }

  setDisabled(disabled) {
    this.disabled = disabled;
  }
} 