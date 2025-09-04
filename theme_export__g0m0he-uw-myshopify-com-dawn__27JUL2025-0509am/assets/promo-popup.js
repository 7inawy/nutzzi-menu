class PromoPopup extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.dataset.section;
    this.delay = parseInt(this.dataset.delay) || 5;
    this.duration = parseFloat(this.dataset.duration) || 0.3;
    this.trigger = this.dataset.trigger || 'time';
    this.scrollPercentage = parseInt(this.dataset.scrollPercentage) || 50;
    this.exitIntent = this.dataset.exitIntent === 'true';
    this.showOnce = this.dataset.showOnce === 'true';
    this.cookieDuration = parseInt(this.dataset.cookieDuration) || 7;
    this.hideOnMobile = this.dataset.hideMobile === 'true';
    
    this.isOpen = false;
    this.hasShown = false;
    this.scrollTriggered = false;
    this.exitTriggered = false;
    
    this.cookieName = `promo-popup-${this.sectionId}`;
    
    this.bindEvents();
    this.init();
  }

  bindEvents() {
    // Close button and overlay clicks
    this.querySelectorAll('[data-popup-close]').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        this.close();
      });
    });

    // Keyboard events
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') {
        this.close();
      }
    });

    // Newsletter form submission
    const newsletterForm = this.querySelector('.promo-popup__newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (event) => {
        this.handleNewsletterSubmit(event);
      });
    }
  }

  init() {
    // Check if popup should be shown
    if (this.shouldShow()) {
      this.setupTriggers();
    }
  }

  shouldShow() {
    // Check if already shown and show once is enabled
    if (this.showOnce && this.getCookie(this.cookieName)) {
      return false;
    }

    // Check if hidden on mobile
    if (this.hideOnMobile && window.innerWidth <= 749) {
      return false;
    }

    return true;
  }

  setupTriggers() {
    switch (this.trigger) {
      case 'time':
        this.setupTimeTrigger();
        break;
      case 'scroll':
        this.setupScrollTrigger();
        break;
      case 'exit':
        this.setupExitTrigger();
        break;
    }
  }

  setupTimeTrigger() {
    setTimeout(() => {
      if (!this.hasShown) {
        this.show();
      }
    }, this.delay * 1000);
  }

  setupScrollTrigger() {
    const handleScroll = () => {
      if (this.scrollTriggered || this.hasShown) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;

      if (scrollPercent >= this.scrollPercentage) {
        this.scrollTriggered = true;
        this.show();
      }
    };

    window.addEventListener('scroll', this.debounce(handleScroll, 100));
  }

  setupExitTrigger() {
    const handleMouseLeave = (event) => {
      if (this.exitTriggered || this.hasShown) return;

      // Only trigger if mouse leaves from the top of the page
      if (event.clientY <= 0) {
        this.exitTriggered = true;
        this.show();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
  }

  show() {
    if (this.hasShown) return;

    this.hasShown = true;
    this.isOpen = true;
    this.setAttribute('open', '');
    
    // Add body class to prevent scrolling
    document.body.classList.add('overflow-hidden');
    
    // Focus management
    this.focus();
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('promo-popup:opened', {
      detail: { sectionId: this.sectionId }
    }));

    // Set cookie if show once is enabled
    if (this.showOnce) {
      this.setCookie(this.cookieName, 'shown', this.cookieDuration);
    }
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.removeAttribute('open');
    
    // Remove body class
    document.body.classList.remove('overflow-hidden');
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('promo-popup:closed', {
      detail: { sectionId: this.sectionId }
    }));
  }

  async handleNewsletterSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const emailInput = form.querySelector('input[name="contact[email]"]');
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!emailInput || !submitButton) return;

    const email = emailInput.value.trim();
    
    if (!this.validateEmail(email)) {
      this.showError(emailInput, 'Please enter a valid email address');
      return;
    }

    // Disable form during submission
    submitButton.disabled = true;
    submitButton.textContent = 'Subscribing...';

    try {
      const formData = new FormData(form);
      const response = await fetch('/contact#contact_form', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        this.showSuccess(emailInput, 'Thank you for subscribing!');
        form.reset();
        
        // Close popup after successful subscription
        setTimeout(() => {
          this.close();
        }, 2000);
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      this.showError(emailInput, 'Subscription failed. Please try again.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Subscribe';
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  showError(input, message) {
    // Remove existing error
    this.removeError(input);
    
    // Add error styling
    input.classList.add('error');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'promo-popup__error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
      color: #dc3545;
      font-size: 1.2rem;
      margin-top: 0.5rem;
    `;
    
    input.parentNode.appendChild(errorElement);
  }

  showSuccess(input, message) {
    // Remove existing error
    this.removeError(input);
    
    // Create success message
    const successElement = document.createElement('div');
    successElement.className = 'promo-popup__success';
    successElement.textContent = message;
    successElement.style.cssText = `
      color: #28a745;
      font-size: 1.2rem;
      margin-top: 0.5rem;
    `;
    
    input.parentNode.appendChild(successElement);
  }

  removeError(input) {
    input.classList.remove('error');
    const existingError = input.parentNode.querySelector('.promo-popup__error');
    if (existingError) {
      existingError.remove();
    }
  }

  // Cookie management
  setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Utility functions
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Public methods
  open() {
    this.show();
  }

  hide() {
    this.close();
  }
}

customElements.define('promo-popup', PromoPopup);

// Global manager for promo popup instances
class PromoPopupManager {
  constructor() {
    this.instances = new Set();
    this.init();
  }

  init() {
    // Find all promo popup instances
    document.querySelectorAll('promo-popup').forEach(element => {
      this.instances.add(element);
    });

    // Watch for new instances
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'PROMO-POPUP') {
              this.instances.add(node);
            }
            node.querySelectorAll('promo-popup').forEach(element => {
              this.instances.add(element);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Listen for global events
    document.addEventListener('promo-popup:opened', (event) => {
      this.handlePopupOpened(event.detail.sectionId);
    });

    document.addEventListener('promo-popup:closed', (event) => {
      this.handlePopupClosed(event.detail.sectionId);
    });
  }

  handlePopupOpened(sectionId) {
    // Close other popups when one opens
    this.instances.forEach(instance => {
      if (instance.sectionId !== sectionId && instance.isOpen) {
        instance.close();
      }
    });
  }

  handlePopupClosed(sectionId) {
    // Handle any cleanup when popup closes
    console.log(`Promo popup ${sectionId} closed`);
  }

  openAll() {
    this.instances.forEach(instance => {
      if (instance.open) {
        instance.open();
      }
    });
  }

  closeAll() {
    this.instances.forEach(instance => {
      if (instance.close) {
        instance.close();
      }
    });
  }
}

// Initialize the manager
document.addEventListener('DOMContentLoaded', () => {
  window.promoPopupManager = new PromoPopupManager();
}); 