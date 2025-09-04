if (!customElements.get('sticky-cart')) {
  customElements.define('sticky-cart', class StickyCart extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('.sticky-cart__button');
      this.countElement = this.querySelector('[data-cart-count]');
      this.totalElement = this.querySelector('[data-cart-total]');
      this.quickCheckoutButton = this.querySelector('[data-action="quick-checkout"]');
      
      this.position = this.dataset.position || 'bottom-right';
      this.showCount = this.dataset.showCount === 'true';
      this.showTotal = this.dataset.showTotal === 'true';
      this.quickActions = this.dataset.quickActions === 'true';
      this.autoHide = this.dataset.autoHide === 'true';
      this.hideDelay = parseInt(this.dataset.hideDelay) || 3;
      this.hideOnMobile = this.dataset.hideMobile === 'true';
      
      this.isVisible = true;
      this.hideTimeout = null;
      this.cartUpdateUnsubscriber = undefined;
      
      this.bindEvents();
      this.initializeCart();
    }

    connectedCallback() {
      this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        if (event.source === 'sticky-cart') return;
        this.onCartUpdate();
      });

      // Listen for slide-out cart events
      document.addEventListener('slide-out-cart:opened', () => {
        if (this.autoHide) {
          this.hide();
        }
      });

      document.addEventListener('slide-out-cart:closed', () => {
        if (this.autoHide) {
          this.show();
        }
      });
    }

    disconnectedCallback() {
      if (this.cartUpdateUnsubscriber) {
        this.cartUpdateUnsubscriber();
      }
    }

    bindEvents() {
      this.button.addEventListener('click', (event) => {
        event.preventDefault();
        const action = event.target.closest('[data-action]')?.dataset.action;
        
        if (action === 'open-cart') {
          this.openCart();
        } else if (action === 'quick-checkout') {
          this.quickCheckout();
        }
      });

      // Auto-hide functionality
      if (this.autoHide) {
        document.addEventListener('scroll', this.debounce(() => {
          this.handleScroll();
        }, 100));

        document.addEventListener('mousemove', this.debounce(() => {
          this.handleMouseMove();
        }, 100));
      }
    }

    async initializeCart() {
      try {
        await this.updateCartDisplay();
      } catch (error) {
        console.error('Error initializing sticky cart:', error);
      }
    }

    async onCartUpdate() {
      try {
        await this.updateCartDisplay();
        this.pulse();
      } catch (error) {
        console.error('Error updating sticky cart:', error);
      }
    }

    async updateCartDisplay() {
      try {
        const response = await fetch(`${routes.cart_url}.js`);
        const cart = await response.json();

        if (this.countElement) {
          this.countElement.textContent = cart.item_count;
          this.countElement.style.display = cart.item_count > 0 ? 'flex' : 'none';
        }

        if (this.totalElement) {
          this.totalElement.textContent = this.formatMoney(cart.total_price);
        }

        // Update visibility based on cart state
        if (cart.item_count === 0 && this.autoHide) {
          this.hide();
        } else {
          this.show();
        }
      } catch (error) {
        console.error('Error fetching cart data:', error);
      }
    }

    openCart() {
      this.setLoading(true);
      
      // Try to open slide-out cart first
      const slideOutCart = document.querySelector('slide-out-cart');
      if (slideOutCart && typeof slideOutCart.open === 'function') {
        slideOutCart.open();
      } else {
        // Fallback to cart drawer
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          cartDrawer.open();
        } else {
          // Fallback to cart page
          window.location.href = routes.cart_url;
        }
      }

      setTimeout(() => {
        this.setLoading(false);
      }, 500);
    }

    quickCheckout() {
      this.setLoading(true);
      
      // Redirect to checkout
      window.location.href = `${routes.cart_url}?checkout`;
    }

    show() {
      if (!this.isVisible) {
        this.style.opacity = '1';
        this.style.visibility = 'visible';
        this.style.transform = 'scale(1)';
        this.isVisible = true;
      }
    }

    hide() {
      if (this.isVisible) {
        this.style.opacity = '0';
        this.style.visibility = 'hidden';
        this.style.transform = 'scale(0.8)';
        this.isVisible = false;
      }
    }

    handleScroll() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      
      this.hideTimeout = setTimeout(() => {
        if (this.autoHide && !this.matches(':hover')) {
          this.hide();
        }
      }, this.hideDelay * 1000);
    }

    handleMouseMove() {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      
      this.show();
    }

    pulse() {
      this.button.classList.add('pulse');
      setTimeout(() => {
        this.button.classList.remove('pulse');
      }, 600);
    }

    setLoading(loading) {
      if (loading) {
        this.button.classList.add('loading');
        this.button.disabled = true;
      } else {
        this.button.classList.remove('loading');
        this.button.disabled = false;
      }
    }

    formatMoney(cents) {
      return window.Shopify?.formatMoney?.(cents) || `$${(cents / 100).toFixed(2)}`;
    }

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
  });
}

// Global manager for sticky cart instances
class StickyCartManager {
  constructor() {
    this.instances = new Set();
    this.init();
  }

  init() {
    // Find all sticky cart instances
    document.querySelectorAll('sticky-cart').forEach(element => {
      this.instances.add(element);
    });

    // Watch for new instances
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'STICKY-CART') {
              this.instances.add(node);
            }
            node.querySelectorAll('sticky-cart').forEach(element => {
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
  }

  updateAll() {
    this.instances.forEach(instance => {
      if (instance.updateCartDisplay) {
        instance.updateCartDisplay();
      }
    });
  }

  pulseAll() {
    this.instances.forEach(instance => {
      if (instance.pulse) {
        instance.pulse();
      }
    });
  }
}

// Initialize the manager
document.addEventListener('DOMContentLoaded', () => {
  window.stickyCartManager = new StickyCartManager();
}); 