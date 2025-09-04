if (!customElements.get('quick-view-button')) {
  customElements.define('quick-view-button', class QuickViewButton extends HTMLElement {
    constructor() {
      super();
      this.productId = this.dataset.productId;
      this.productUrl = this.dataset.productUrl;
      this.productTitle = this.dataset.productTitle;
      this.productImage = this.dataset.productImage;
      this.productPrice = this.dataset.productPrice;
      this.productComparePrice = this.dataset.productComparePrice;
      this.productDescription = this.dataset.productDescription;
      this.productVendor = this.dataset.productVendor;
      this.productType = this.dataset.productType;
      this.productTags = this.dataset.productTags;
      this.productAvailable = this.dataset.productAvailable === 'true';
      this.productVariantsCount = parseInt(this.dataset.productVariantsCount) || 0;
      this.productOptions = this.dataset.productOptions ? JSON.parse(this.dataset.productOptions) : [];
      this.productVariants = this.dataset.productVariants ? JSON.parse(this.dataset.productVariants) : [];
      
      this.trigger = this.querySelector('.quick-view-button__trigger');
      this.modal = null;
      
      this.init();
    }

    init() {
      this.trigger.addEventListener('click', this.handleClick.bind(this));
    }

    async handleClick(event) {
      event.preventDefault();
      await this.showModal();
    }

    async showModal() {
      if (this.modal) {
        this.modal.show();
        return;
      }

      // Create modal content
      const modalContent = this.createModalContent();
      document.body.appendChild(modalContent);
      
      this.modal = new QuickViewModal(modalContent, {
        productId: this.productId,
        productTitle: this.productTitle,
        productImage: this.productImage,
        productPrice: this.productPrice,
        productComparePrice: this.productComparePrice,
        productDescription: this.productDescription,
        productVendor: this.productVendor,
        productType: this.productType,
        productTags: this.productTags,
        productAvailable: this.productAvailable,
        productVariantsCount: this.productVariantsCount,
        productOptions: this.productOptions,
        productVariants: this.productVariants,
        onAddToCart: this.addToCart.bind(this)
      });
      
      this.modal.show();
    }

    createModalContent() {
      const modal = document.createElement('div');
      modal.className = 'quick-view-modal modal';
      modal.id = `quick-view-modal-${this.productId}`;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      
      modal.innerHTML = `
        <div class="modal__overlay" data-modal-close></div>
        <div class="modal__content modal--large">
          <div class="modal__header">
            <h2 class="modal__title">Quick View: ${this.productTitle}</h2>
            <button type="button" class="modal__close" data-modal-close aria-label="Close">
              <svg class="icon icon-close" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <div class="quick-view-modal__product">
              <div class="quick-view-modal__gallery">
                <div class="quick-view-modal__main-image">
                  <img src="${this.productImage}" alt="${this.productTitle}" loading="lazy" class="quick-view-modal__image">
                </div>
                ${this.createThumbnails()}
              </div>
              <div class="quick-view-modal__info">
                <div class="quick-view-modal__header">
                  <h3 class="quick-view-modal__product-title">${this.productTitle}</h3>
                  ${this.productVendor ? `<p class="quick-view-modal__vendor">${this.productVendor}</p>` : ''}
                  <div class="quick-view-modal__price">
                    <span class="price">${this.productPrice}</span>
                    ${this.productComparePrice ? `<span class="price price--compare">${this.productComparePrice}</span>` : ''}
                  </div>
                  <div class="quick-view-modal__availability">
                    <span class="quick-view-modal__availability-text ${this.productAvailable ? 'available' : 'unavailable'}">
                      ${this.productAvailable ? 'In stock' : 'Sold out'}
                    </span>
                  </div>
                </div>
                <div class="quick-view-modal__description">
                  <h4 class="quick-view-modal__description-title">Description</h4>
                  <div class="quick-view-modal__description-content">
                    ${this.productDescription}
                  </div>
                </div>
                ${this.createProductDetails()}
                <div class="quick-view-modal__actions">
                  <a href="${this.productUrl}" class="button button--full-width button--primary quick-view-modal__view-details">
                    View Full Details
                  </a>
                  ${this.productAvailable ? `
                    <button type="button" class="button button--full-width button--secondary quick-view-modal__add-to-cart" data-product-id="${this.productId}">
                      <svg class="icon icon-cart" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                      Add to Cart
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      return modal;
    }

    createThumbnails() {
      if (this.productVariants.length <= 1) return '';
      
      const thumbnails = this.productVariants
        .filter(variant => variant.image)
        .slice(0, 5)
        .map((variant, index) => `
          <button type="button" class="quick-view-modal__thumbnail ${index === 0 ? 'active' : ''}" 
                  data-media-id="${variant.id}" 
                  data-media-url="${variant.image}" 
                  aria-label="View image ${index + 1}">
            <img src="${variant.image}" alt="${variant.title}" loading="lazy" width="100" height="100">
          </button>
        `).join('');
      
      return thumbnails ? `<div class="quick-view-modal__thumbnails">${thumbnails}</div>` : '';
    }

    createProductDetails() {
      let details = '';
      
      if (this.productType) {
        details += `
          <div class="quick-view-modal__type">
            <span class="quick-view-modal__type-label">Type:</span>
            <span class="quick-view-modal__type-value">${this.productType}</span>
          </div>
        `;
      }
      
      if (this.productTags) {
        const tags = this.productTags.split(', ').slice(0, 5);
        details += `
          <div class="quick-view-modal__tags">
            <span class="quick-view-modal__tags-label">Tags:</span>
            <div class="quick-view-modal__tags-list">
              ${tags.map(tag => `<span class="quick-view-modal__tag">${tag}</span>`).join('')}
            </div>
          </div>
        `;
      }
      
      if (this.productVariantsCount > 1) {
        details += `
          <div class="quick-view-modal__variants">
            <h4 class="quick-view-modal__variants-title">Variants</h4>
            <div class="quick-view-modal__variants-list">
              ${this.productOptions.map(option => `
                <div class="quick-view-modal__option">
                  <span class="quick-view-modal__option-name">${option.name}:</span>
                  <div class="quick-view-modal__option-values">
                    ${option.values.join(', ')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
      
      return details;
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
      let messageEl = this.querySelector('.quick-view-modal__message');
      if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'quick-view-modal__message';
        this.appendChild(messageEl);
      }
      
      messageEl.textContent = message;
      messageEl.className = `quick-view-modal__message quick-view-modal__message--${type}`;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageEl.remove();
      }, 3000);
    }
  });
}

// Quick View Modal Class
class QuickViewModal {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.isOpen = false;
    this.currentImageIndex = 0;
    
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
    const addToCartBtn = this.element.querySelector('.quick-view-modal__add-to-cart');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        this.handleAddToCart();
      });
    }

    // Thumbnail navigation
    this.element.querySelectorAll('.quick-view-modal__thumbnail').forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', () => {
        this.switchImage(index, thumbnail.dataset.mediaUrl);
      });
    });
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

  switchImage(index, imageUrl) {
    // Update main image
    const mainImage = this.element.querySelector('.quick-view-modal__image');
    if (mainImage && imageUrl) {
      mainImage.src = imageUrl;
    }

    // Update active thumbnail
    this.element.querySelectorAll('.quick-view-modal__thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });

    this.currentImageIndex = index;
  }

  async handleAddToCart() {
    const button = this.element.querySelector('.quick-view-modal__add-to-cart');
    if (!button) return;
    
    try {
      button.disabled = true;
      button.innerHTML = '<span>Adding...</span>';
      
      if (this.options.onAddToCart) {
        await this.options.onAddToCart();
      }
      
    } catch (error) {
      console.error('Error in handleAddToCart:', error);
    } finally {
      button.disabled = false;
      button.innerHTML = `
        <svg class="icon icon-cart" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
        Add to Cart
      `;
    }
  }
}

// Quick View Container for loading products
if (!customElements.get('quick-view-container')) {
  customElements.define('quick-view-container', class QuickViewContainer extends HTMLElement {
    constructor() {
      super();
      this.productsToShow = parseInt(this.dataset.productsToShow) || 4;
      this.collection = this.dataset.collection || 'all';
      this.grid = this.querySelector('.quick-view-grid');
      
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
                <quick-view-button
                  data-product-id="${product.id}"
                  data-product-url="${product.url}"
                  data-product-title="${product.title}"
                  data-product-image="${image}"
                  data-product-price="${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: window.Shopify?.currency?.active || 'USD'
                  }).format(variant.price / 100)}"
                  data-product-description="${product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : ''}"
                  data-product-vendor="${product.vendor || ''}"
                  data-product-type="${product.product_type || ''}"
                  data-product-tags="${product.tags ? product.tags.join(', ') : ''}"
                  data-product-available="${product.available}"
                  data-product-variants-count="${product.variants.length}"
                  data-product-options='${JSON.stringify(product.options_with_values || [])}'
                  data-product-variants='${JSON.stringify(product.variants || [])}'
                >
                  <button class="button button--full-width button--tertiary quick-view-button__trigger">
                    <svg class="icon icon-eye" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                    <span class="quick-view-button__text">Quick View</span>
                  </button>
                </quick-view-button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  });
} 