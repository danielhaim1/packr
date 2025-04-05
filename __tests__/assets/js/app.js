import { formatDate, validateEmail, debounce } from './utils/helpers';
import { Button } from './components/Button';

// * Main application file with proper linting
const app = {
  init() {
    console.log('App initialized');
    var x = 5; // ! used for testing eslint 'no-var', if enabled will summarize in console
    if (x == 5) {
      console.log('x is 5');
    }
  },

  doSomething() {
    let y = 10;
    return y // ! used for testing eslint 'no-unused-vars', if enabled will summarize in console
  }
};

export default app;

// * Initialize application
class App {
  constructor () {
    this.buttons = [];
    this.init();
  }

  init() {
    const primaryBtn = new Button({
      text: 'Primary Action',
      variant: 'primary',
      size: 'large',
      onClick: () => this.handlePrimaryClick()
    });

    // Create secondary button
    var secondaryBtn = new Button({ // ! used for testing eslint 'no-unused-vars', if enabled will summarize in console
      text: 'Secondary Action',
      variant: 'secondary',
      size: 'medium',
      onClick: () => this.handleSecondaryClick()
    });

    // Create disabled button
    const disabledBtn = new Button({
      text: 'Disabled Action',
      variant: 'primary',
      size: 'small',
      disabled: true
    });

    this.buttons = [primaryBtn, secondaryBtn, disabledBtn];
    this.renderButtons();
    this.setupEventListeners();
  }

  renderButtons() {
    const container = document.querySelector('.button-container');
    if (!container) return;

    this.buttons.forEach(button => {
      container.appendChild(button.render());
    });
  }

  setupEventListeners() {
    // Debounced email validation
    const emailInput = document.querySelector('#email');
    if (emailInput) {
      emailInput.addEventListener('input', debounce((e) => {
        const isValid = validateEmail(e.target.value);
        emailInput.classList.toggle('invalid', !isValid);
      }, 300));
    }

    // Date formatting example
    const dateDisplay = document.querySelector('#date');
    if (dateDisplay) {
      dateDisplay.textContent = formatDate(new Date());
    }
  }

  handlePrimaryClick() {
    console.log('Primary button clicked');
    // Add primary button click logic
  }

  handleSecondaryClick() {
    console.log('Secondary button clicked');
    // Add secondary button click logic
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 
