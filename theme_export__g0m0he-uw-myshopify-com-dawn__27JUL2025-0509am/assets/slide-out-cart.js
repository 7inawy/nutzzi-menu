if (!customElements.get('slide-out-cart')) {
  customElements.define('slide-out-cart', class SlideOutCart extends HTMLElement {
    constructor() {
      super();
      this.isOpen = false;
      this.cartData = null;
      this.isLoading = false;
      
      this.overlay = this.querySelector('.slide-out-cart__overlay');
      this.panel = this.querySelector('.slide-out-cart__panel');
      this.itemsContainer = this.querySelector('.slide-out-cart__items');
      this.emptyContainer = this.querySelector('.slide-out-cart__empty');
      this.subtotalPrice = this.querySelector('.slide-out-cart__subtotal-price');
      this.notesInput = this.querySelector('.slide-out-cart__notes-input');
      
      this.showCartNotes = this.dataset.showCartNotes === 'true';
      this.showShippingCalculator = this.dataset.showShippingCalculator === 'true';
      this.showTaxes = this.dataset.showTaxes === 'true';
      this.showDiscounts = this.dataset.showDiscounts === 'true';
      this.autoOpen = this.dataset.autoOpen === 'true';
      this.autoOpenDelay = parseInt(this.dataset.autoOpenDelay) || 3;
      
      this.init();
    }

    init() {
      // Close on overlay click
      this.overlay.addEventListener('click', () => {
        this.close();
      });

      // Close on close button click
      this.querySelectorAll('[data-cart-close]').forEach(button => {
        button.addEventListener('click', () => {
          this.close();
        });
      });

      // Close on escape key
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Cart notes auto-save
      if (this.notesInput) {
        this.notesInput.addEventListener('input', this.debounce(() => {
          this.updateCartNotes();
        }, 500));
      }

      // Listen for cart update events
      document.addEventListener('cart:updated', () => {
        this.loadCart();
      });

      // Auto-open functionality
      if (this.autoOpen) {
        setTimeout(() => {
          this.open();
        }, this.autoOpenDelay * 1000);
      }

      // Initial cart load
      this.loadCart();
    }

    async loadCart() {
      try {
        this.setLoading(true);
        
        const response = await fetch('/cart.js');
        if (!response.ok) {
          throw new Error('Failed to load cart');
        }
        
        this.cartData = await response.json();
        this.renderCart();
        
      } catch (error) {
        console.error('Error loading cart:', error);
        this.showMessage('Failed to load cart. Please try again.', 'error');
      } finally {
        this.setLoading(false);
      }
    }

    renderCart() {
      if (!this.cartData) return;

      if (this.cartData.item_count === 0) {
        this.showEmptyState();
      } else {
        this.showCartItems();
      }

      this.updateSubtotal();
    }

    showEmptyState() {
      this.itemsContainer.style.display = 'none';
      this.emptyContainer.style.display = 'flex';
      this.querySelector('.slide-out-cart__footer').style.display = 'none';
    }

    showCartItems() {
      this.emptyContainer.style.display = 'none';
      this.itemsContainer.style.display = 'block';
      this.querySelector('.slide-out-cart__footer').style.display = 'block';

      this.itemsContainer.innerHTML = this.cartData.items.map(item => this.createCartItemHTML(item)).join('');
      
      // Add event listeners to cart items
      this.addCartItemEventListeners();
    }

    createCartItemHTML(item) {
      const image = item.image || item.featured_image;
      const imageHTML = image ? `
        <div class="slide-out-cart__item-image">
          <img src="${image}" alt="${item.title}" loading="lazy" width="100" height="100">
        </div>
      ` : '';

      const variantHTML = item.variant_title ? `
        <div class="slide-out-cart__item-variant">
          <span class="slide-out-cart__item-option">${item.variant_title}</span>
        </div>
      ` : '';

      const propertiesHTML = item.properties && Object.keys(item.properties).length > 0 ? `
        <div class="slide-out-cart__item-properties">
          ${Object.entries(item.properties).map(([key, value]) => `
            <span class="slide-out-cart__item-property">${key}: ${value}</span>
          `).join('')}
        </div>
      ` : '';

      const originalPriceHTML = item.original_price !== item.final_price ? `
        <span class="slide-out-cart__item-price-original">${this.formatMoney(item.original_price)}</span>
      ` : '';

      return `
        <div class="slide-out-cart__item" data-cart-item data-item-key="${item.key}">
          ${imageHTML}
          <div class="slide-out-cart__item-content">
            <div class="slide-out-cart__item-info">
              <h3 class="slide-out-cart__item-title">
                <a href="${item.url}" class="slide-out-cart__item-link">${item.title}</a>
              </h3>
              ${variantHTML}
              ${propertiesHTML}
            </div>
            <div class="slide-out-cart__item-price">
              ${originalPriceHTML}
              <span class="slide-out-cart__item-price-final">${this.formatMoney(item.final_price)}</span>
            </div>
            <div class="slide-out-cart__item-quantity">
              <quantity-input class="quantity">
                <button class="quantity__button" name="minus" type="button" data-quantity-minus>
                  <svg class="icon icon-minus" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                    <path d="M19 13H5v-2h14v2z"/>
                  </svg>
                </button>
                <input class="quantity__input" type="number" name="quantity" value="${item.quantity}" min="0" data-quantity-input>
                <button class="quantity__button" name="plus" type="button" data-quantity-plus>
                  <svg class="icon icon-plus" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </quantity-input>
            </div>
            <div class="slide-out-cart__item-total">
              <span class="slide-out-cart__item-total-label">Total</span>
              <span class="slide-out-cart__item-total-price">${this.formatMoney(item.final_line_price)}</span>
            </div>
            <button type="button" class="slide-out-cart__item-remove" data-remove-item>
              <svg class="icon icon-remove" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div class="slide-out-cart__item-loading" style="display: none;">
            <div class="loading-spinner">
              <svg class="icon icon-spinner" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12 4v2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </div>
          </div>
        </div>
      `;
    }

    addCartItemEventListeners() {
      // Quantity controls
      this.querySelectorAll('[data-quantity-minus]').forEach(button => {
        button.addEventListener('click', (event) => {
          const item = event.target.closest('[data-cart-item]');
          const input = item.querySelector('[data-quantity-input]');
          const currentQuantity = parseInt(input.value);
          if (currentQuantity > 1) {
            this.updateItemQuantity(item.dataset.itemKey, currentQuantity - 1);
          }
        });
      });

      this.querySelectorAll('[data-quantity-plus]').forEach(button => {
        button.addEventListener('click', (event) => {
          const item = event.target.closest('[data-cart-item]');
          const input = item.querySelector('[data-quantity-input]');
          const currentQuantity = parseInt(input.value);
          this.updateItemQuantity(item.dataset.itemKey, currentQuantity + 1);
        });
      });

      this.querySelectorAll('[data-quantity-input]').forEach(input => {
        input.addEventListener('change', (event) => {
          const item = event.target.closest('[data-cart-item]');
          const quantity = parseInt(event.target.value);
          if (quantity >= 0) {
            this.updateItemQuantity(item.dataset.itemKey, quantity);
          }
        });
      });

      // Remove item
      this.querySelectorAll('[data-remove-item]').forEach(button => {
        button.addEventListener('click', (event) => {
          const item = event.target.closest('[data-cart-item]');
          this.removeItem(item.dataset.itemKey);
        });
      });
    }

    async updateItemQuantity(itemKey, quantity) {
      const item = this.querySelector(`[data-item-key="${itemKey}"]`);
      if (!item) return;

      try {
        this.setItemLoading(item, true);
        
        const formData = {
          id: itemKey,
          quantity: quantity
        };

        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to update quantity');
        }

        const result = await response.json();
        this.cartData = result;
        this.renderCart();
        
        // Trigger cart update event
        this.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { items: result.items },
          bubbles: true
        }));

      } catch (error) {
        console.error('Error updating quantity:', error);
        this.showMessage('Failed to update quantity. Please try again.', 'error');
      } finally {
        this.setItemLoading(item, false);
      }
    }

    async removeItem(itemKey) {
      const item = this.querySelector(`[data-item-key="${itemKey}"]`);
      if (!item) return;

      try {
        this.setItemLoading(item, true);
        
        const formData = {
          id: itemKey,
          quantity: 0
        };

        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to remove item');
        }

        const result = await response.json();
        this.cartData = result;
        this.renderCart();
        
        // Trigger cart update event
        this.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { items: result.items },
          bubbles: true
        }));

        this.showMessage('Item removed from cart', 'success');

      } catch (error) {
        console.error('Error removing item:', error);
        this.showMessage('Failed to remove item. Please try again.', 'error');
      } finally {
        this.setItemLoading(item, false);
      }
    }

    async updateCartNotes() {
      if (!this.notesInput) return;

      try {
        const formData = {
          note: this.notesInput.value
        };

        const response = await fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to update cart notes');
        }

      } catch (error) {
        console.error('Error updating cart notes:', error);
      }
    }

    updateSubtotal() {
      if (this.subtotalPrice && this.cartData) {
        this.subtotalPrice.textContent = this.formatMoney(this.cartData.total_price);
      }
    }

    setItemLoading(item, loading) {
      const loadingEl = item.querySelector('.slide-out-cart__item-loading');
      const contentEl = item.querySelector('.slide-out-cart__item-content');
      
      if (loading) {
        loadingEl.style.display = 'flex';
        contentEl.style.opacity = '0.5';
        contentEl.style.pointerEvents = 'none';
      } else {
        loadingEl.style.display = 'none';
        contentEl.style.opacity = '1';
        contentEl.style.pointerEvents = 'auto';
      }
    }

    setLoading(loading) {
      this.isLoading = loading;
      if (loading) {
        this.classList.add('loading');
      } else {
        this.classList.remove('loading');
      }
    }

    open() {
      this.setAttribute('open', '');
      this.isOpen = true;
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element
      const firstFocusable = this.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    close() {
      this.removeAttribute('open');
      this.isOpen = false;
      document.body.style.overflow = '';
    }

    showMessage(message, type = 'info') {
      // Remove existing messages
      this.querySelectorAll('.slide-out-cart__message').forEach(msg => msg.remove());
      
      // Create new message
      const messageEl = document.createElement('div');
      messageEl.className = `slide-out-cart__message slide-out-cart__message--${type}`;
      messageEl.textContent = message;
      
      this.appendChild(messageEl);
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageEl.remove();
      }, 3000);
    }

    formatMoney(cents) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(cents / 100);
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

// Global cart trigger functionality
class CartTrigger {
  constructor() {
    this.cart = document.querySelector('slide-out-cart');
    this.triggers = document.querySelectorAll('[data-cart-trigger]');
    
    this.init();
  }

  init() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        this.openCart();
      });
    });
  }

  openCart() {
    if (this.cart) {
      this.cart.open();
    }
  }
}

// Initialize cart trigger when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CartTrigger();
}); 