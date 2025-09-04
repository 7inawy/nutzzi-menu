if (!customElements.get('quick-buy-button')) {
  customElements.define('quick-buy-button', class QuickBuyButton extends HTMLElement {
    constructor() {
      super();
      this.productId = this.dataset.productId;
      this.productUrl = this.dataset.productUrl;
      this.hasVariants = this.dataset.hasVariants === 'true';
      this.productTitle = this.dataset.productTitle;
      this.productImage = this.dataset.productImage;
      this.productPrice = this.dataset.productPrice;
      this.productComparePrice = this.dataset.productComparePrice;
      this.variants = this.dataset.variants ? JSON.parse(this.dataset.variants) : [];
      
      this.trigger = this.querySelector('.quick-buy-button__trigger');
      this.modal = null;
      
      this.init();
    }

    init() {
      this.trigger.addEventListener('click', this.handleClick.bind(this));
    }

    async handleClick(event) {
      event.preventDefault();
      
      if (this.hasVariants) {
        await this.showModal();
      } else {
        await this.addToCart();
      }
    }

    async showModal() {
      if (this.modal) {
        this.modal.show();
        return;
      }

      // Create modal content
      const modalContent = this.createModalContent();
      document.body.appendChild(modalContent);
      
      this.modal = new QuickBuyModal(modalContent, {
        productId: this.productId,
        productTitle: this.productTitle,
        productImage: this.productImage,
        productPrice: this.productPrice,
        productComparePrice: this.productComparePrice,
        variants: this.variants,
        onAddToCart: this.addToCart.bind(this)
      });
      
      this.modal.show();
    }

    createModalContent() {
      const modal = document.createElement('div');
      modal.className = 'quick-buy-modal modal';
      modal.id = `quick-buy-modal-${this.productId}`;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      
      modal.innerHTML = `
        <div class="modal__overlay" data-modal-close></div>
        <div class="modal__content">
          <div class="modal__header">
            <h2 class="modal__title">Quick Buy: ${this.productTitle}</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Close">
              <svg class="icon icon-close" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <div class="quick-buy-modal__product">
              <div class="quick-buy-modal__image">
                <img src="${this.productImage}" alt="${this.productTitle}" loading="lazy">
              </div>
              <div class="quick-buy-modal__info">
                <h3 class="quick-buy-modal__product-title">${this.productTitle}</h3>
                <div class="quick-buy-modal__price">
                  <span class="price">${this.productPrice}</span>
                  ${this.productComparePrice ? `<span class="price price--compare">${this.productComparePrice}</span>` : ''}
                </div>
                <div class="quick-buy-modal__variants">
                  ${this.createVariantOptions()}
                </div>
                <div class="quick-buy-modal__quantity">
                  <label class="quick-buy-modal__quantity-label">Quantity</label>
                  <quantity-input class="quantity">
                    <button class="quantity__button" name="minus" type="button">
                      <svg class="icon icon-minus" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M19 13H5v-2h14v2z"/>
                      </svg>
                    </button>
                    <input class="quantity__input" type="number" name="quantity" value="1" min="1">
                    <button class="quantity__button" name="plus" type="button">
                      <svg class="icon icon-plus" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </quantity-input>
                </div>
                <div class="quick-buy-modal__actions">
                  <button type="button" class="button button--full-width button--primary quick-buy-modal__add-to-cart">
                    <span class="quick-buy-modal__button-text">Add to Cart</span>
                    <span class="quick-buy-modal__button-loading hidden">Adding...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      return modal;
    }

    createVariantOptions() {
      if (!this.variants.length) return '';
      
      const options = {};
      this.variants.forEach(variant => {
        variant.options.forEach((option, index) => {
          if (!options[index]) {
            options[index] = {
              name: variant.option_names[index],
              values: new Set()
            };
          }
          options[index].values.add(option);
        });
      });

      return Object.entries(options).map(([index, option]) => `
        <div class="quick-buy-modal__option">
          <label class="quick-buy-modal__option-label">${option.name}</label>
          <div class="quick-buy-modal__option-values">
            ${Array.from(option.values).map(value => `
              <input type="radio" 
                     id="option-${index}-${value}" 
                     name="option-${index}" 
                     value="${value}" 
                     class="quick-buy-modal__option-input"
                     ${Array.from(option.values)[0] === value ? 'checked' : ''}
                     data-option-index="${index}"
                     data-option-value="${value}">
              <label for="option-${index}-${value}" class="quick-buy-modal__option-button">
                ${value}
              </label>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    async addToCart(variantId = null, quantity = 1) {
      try {
        this.setLoading(true);
        
        const formData = {
          items: [{
            id: variantId || this.productId,
            quantity: quantity
          }]
        };

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        const result = await response.json();
        
        // Trigger cart update event
        this.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { items: result.items },
          bubbles: true
        }));

        // Show success message
        this.showMessage('Product added to cart successfully!', 'success');
        
        // Close modal if open
        if (this.modal) {
          this.modal.hide();
        }

      } catch (error) {
        console.error('Error adding to cart:', error);
        this.showMessage('Failed to add product to cart. Please try again.', 'error');
      } finally {
        this.setLoading(false);
      }
    }

    setLoading(loading) {
      if (loading) {
        this.classList.add('loading');
        this.trigger.disabled = true;
      } else {
        this.classList.remove('loading');
        this.trigger.disabled = false;
      }
    }

    showMessage(message, type = 'info') {
      // Create or update message element
      let messageEl = this.querySelector('.quick-buy-modal__message');
      if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'quick-buy-modal__message';
        this.appendChild(messageEl);
      }
      
      messageEl.textContent = message;
      messageEl.className = `quick-buy-modal__message quick-buy-modal__message--${type}`;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageEl.remove();
      }, 3000);
    }
  });
}

// Quick Buy Modal Class
class QuickBuyModal {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.isOpen = false;
    
    this.init();
  }

  init() {
    // Close on overlay click
    this.element.querySelector('[data-modal-close]').addEventListener('click', () => {
      this.hide();
    });

    // Close on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    // Add to cart button
    this.element.querySelector('.quick-buy-modal__add-to-cart').addEventListener('click', () => {
      this.handleAddToCart();
    });

    // Variant selection
    this.element.querySelectorAll('.quick-buy-modal__option-input').forEach(input => {
      input.addEventListener('change', () => {
        this.updateVariantSelection();
      });
    });

    // Quantity input
    const quantityInput = this.element.querySelector('quantity-input');
    if (quantityInput) {
      quantityInput.addEventListener('change', (event) => {
        this.quantity = parseInt(event.target.value) || 1;
      });
    }
  }

  show() {
    this.element.setAttribute('open', '');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Focus first focusable element
    const firstFocusable = this.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  hide() {
    this.element.removeAttribute('open');
    this.isOpen = false;
    document.body.style.overflow = '';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 300);
  }

  updateVariantSelection() {
    const selectedOptions = {};
    
    this.element.querySelectorAll('.quick-buy-modal__option-input:checked').forEach(input => {
      selectedOptions[input.dataset.optionIndex] = input.dataset.optionValue;
    });

    // Find matching variant
    const matchingVariant = this.options.variants.find(variant => {
      return variant.options.every((option, index) => {
        return selectedOptions[index] === option;
      });
    });

    if (matchingVariant) {
      this.selectedVariantId = matchingVariant.id;
      this.updatePrice(matchingVariant);
    }
  }

  updatePrice(variant) {
    const priceEl = this.element.querySelector('.quick-buy-modal__price');
    if (priceEl && variant) {
      const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: window.Shopify?.currency?.active || 'USD'
      }).format(variant.price / 100);
      
      const comparePrice = variant.compare_at_price ? 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: window.Shopify?.currency?.active || 'USD'
        }).format(variant.compare_at_price / 100) : null;

      priceEl.innerHTML = `
        <span class="price">${price}</span>
        ${comparePrice ? `<span class="price price--compare">${comparePrice}</span>` : ''}
      `;
    }
  }

  async handleAddToCart() {
    const button = this.element.querySelector('.quick-buy-modal__add-to-cart');
    const buttonText = button.querySelector('.quick-buy-modal__button-text');
    const buttonLoading = button.querySelector('.quick-buy-modal__button-loading');
    
    try {
      button.classList.add('loading');
      buttonText.style.display = 'none';
      buttonLoading.style.display = 'inline';
      
      const quantity = parseInt(this.element.querySelector('.quantity__input').value) || 1;
      const variantId = this.selectedVariantId || this.options.productId;
      
      if (this.options.onAddToCart) {
        await this.options.onAddToCart(variantId, quantity);
      }
      
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
    } finally {
      button.classList.remove('loading');
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }
}

// Quick Buy Container for loading products
if (!customElements.get('quick-buy-container')) {
  customElements.define('quick-buy-container', class QuickBuyContainer extends HTMLElement {
    constructor() {
      super();
      this.productsToShow = parseInt(this.dataset.productsToShow) || 4;
      this.collection = this.dataset.collection || 'all';
      this.grid = this.querySelector('.quick-buy-grid');
      
      this.init();
    }

    async init() {
      await this.loadProducts();
    }

    async loadProducts() {
      try {
        const url = this.collection === 'all' 
          ? '/products.json?limit=' + this.productsToShow
          : '/collections/' + this.collection + '/products.json?limit=' + this.productsToShow;
        
        const response = await fetch(url);
        const data = await response.json();
        
        this.renderProducts(data.products);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    }

    renderProducts(products) {
      this.grid.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
      const variant = product.variants[0];
      const image = product.featured_image || product.images[0];
      
      return `
        <div class="card-wrapper">
          <div class="card card--product">
            <div class="card__inner">
              <div class="card__media">
                <div class="media media--transparent">
                  <img src="${image}" alt="${product.title}" loading="lazy" width="300" height="300">
                </div>
              </div>
              <div class="card__content">
                <h3 class="card__heading">
                  <a href="${product.url}" class="full-unstyled-link">
                    ${product.title}
                  </a>
                </h3>
                <div class="card__price">
                  <span class="price">${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: window.Shopify?.currency?.active || 'USD'
                  }).format(variant.price / 100)}</span>
                </div>
                <quick-buy-button
                  data-product-id="${product.id}"
                  data-product-url="${product.url}"
                  data-has-variants="${product.variants.length > 1}"
                  data-product-title="${product.title}"
                  data-product-image="${image}"
                  data-product-price="${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: window.Shopify?.currency?.active || 'USD'
                  }).format(variant.price / 100)}"
                  data-variants='${JSON.stringify(product.variants)}'
                >
                  <button class="button button--full-width button--secondary quick-buy-button__trigger">
                    <svg class="icon icon-cart" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span class="quick-buy-button__text">Quick Buy</span>
                  </button>
                </quick-buy-button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  });
} 