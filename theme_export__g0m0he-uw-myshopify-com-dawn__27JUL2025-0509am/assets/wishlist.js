class Wishlist extends HTMLElement {
  constructor() {
    super();
    this.layout = 'grid';
    this.columnsDesktop = 4;
    this.columnsMobile = 2;
    this.showPrices = true;
    this.showVariants = true;
    this.showAvailability = true;
    this.showRemove = true;
    this.showShare = true;
    this.persistWishlist = true;
    this.animationDuration = 250;
    this.wishlistItems = new Map();
    this.isLoading = false;
    
    // DOM elements
    this.productCountElement = this.querySelector('[data-product-count]');
    this.shareButton = this.querySelector('[data-share-wishlist]');
    this.clearButton = this.querySelector('[data-clear-wishlist]');
    this.wishlistGrid = this.querySelector('[data-wishlist-grid]');
    this.emptyState = this.querySelector('[data-empty-state]');
    this.loadingState = this.querySelector('[data-loading-state]');
    this.shareModal = this.querySelector('[data-share-modal]');
    this.shareModalClose = this.querySelector('[data-close-share-modal]');
    this.shareUrlInput = this.querySelector('[data-share-url-input]');
    this.copyUrlButton = this.querySelector('[data-copy-url]');
    this.overlay = this.querySelector('[data-wishlist-overlay]');
    
    // Share options
    this.shareOptions = this.querySelectorAll('[data-share-option]');
  }

  connectedCallback() {
    this.initializeWishlist();
    this.bindEvents();
    this.loadWishlist();
    this.updateDisplay();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  initializeWishlist() {
    // Get configuration from data attributes
    this.layout = this.dataset.layout || 'grid';
    this.columnsDesktop = parseInt(this.dataset.columnsDesktop) || 4;
    this.columnsMobile = parseInt(this.dataset.columnsMobile) || 2;
    this.showPrices = this.dataset.showPrices === 'true';
    this.showVariants = this.dataset.showVariants === 'true';
    this.showAvailability = this.dataset.showAvailability === 'true';
    this.showRemove = this.dataset.showRemove === 'true';
    this.showShare = this.dataset.showShare === 'true';
    this.persistWishlist = this.dataset.persistWishlist === 'true';
    this.animationDuration = parseInt(this.dataset.animationDuration) || 250;

    // Set layout classes
    if (this.layout === 'list') {
      this.wishlistGrid.classList.add('wishlist__grid--list');
    }
  }

  bindEvents() {
    // Share wishlist button
    if (this.shareButton) {
      this.shareButton.addEventListener('click', () => this.openShareModal());
    }

    // Clear wishlist button
    if (this.clearButton) {
      this.clearButton.addEventListener('click', () => this.clearWishlist());
    }

    // Share modal events
    if (this.shareModalClose) {
      this.shareModalClose.addEventListener('click', () => this.closeShareModal());
    }

    if (this.copyUrlButton) {
      this.copyUrlButton.addEventListener('click', () => this.copyWishlistUrl());
    }

    // Share options
    this.shareOptions.forEach(option => {
      option.addEventListener('click', (event) => this.handleShareOption(event));
    });

    // Click outside to close modal
    document.addEventListener('click', (event) => this.handleOutsideClick(event));

    // Keyboard navigation
    this.addEventListener('keydown', (event) => this.handleKeydown(event));

    // Listen for wishlist events from other components
    document.addEventListener('wishlist:add', (event) => this.addToWishlist(event.detail));
    document.addEventListener('wishlist:remove', (event) => this.removeFromWishlist(event.detail));
    document.addEventListener('wishlist:clear', () => this.clearWishlist());
  }

  removeEventListeners() {
    // Remove event listeners to prevent memory leaks
    if (this.shareButton) {
      this.shareButton.removeEventListener('click', () => this.openShareModal());
    }
    if (this.clearButton) {
      this.clearButton.removeEventListener('click', () => this.clearWishlist());
    }
    if (this.shareModalClose) {
      this.shareModalClose.removeEventListener('click', () => this.closeShareModal());
    }
    if (this.copyUrlButton) {
      this.copyUrlButton.removeEventListener('click', () => this.copyWishlistUrl());
    }
  }

  loadWishlist() {
    if (!this.persistWishlist) return;
    
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const wishlistData = JSON.parse(savedWishlist);
        this.wishlistItems = new Map(Object.entries(wishlistData));
        this.updateDisplay();
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }
  }

  saveWishlist() {
    if (!this.persistWishlist) return;
    
    try {
      const wishlistData = Object.fromEntries(this.wishlistItems);
      localStorage.setItem('wishlist', JSON.stringify(wishlistData));
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  }

  addToWishlist(productData) {
    const productId = productData.id.toString();
    
    if (!this.wishlistItems.has(productId)) {
      this.wishlistItems.set(productId, {
        id: productId,
        title: productData.title,
        handle: productData.handle,
        image: productData.featured_image || productData.image,
        price: productData.price,
        compare_at_price: productData.compare_at_price,
        available: productData.available,
        variants: productData.variants || [],
        added_at: new Date().toISOString()
      });
      
      this.saveWishlist();
      this.updateDisplay();
      this.showNotification('Product added to wishlist');
    }
  }

  removeFromWishlist(productId) {
    if (this.wishlistItems.has(productId)) {
      this.wishlistItems.delete(productId);
      this.saveWishlist();
      this.updateDisplay();
      this.showNotification('Product removed from wishlist');
    }
  }

  clearWishlist() {
    this.wishlistItems.clear();
    this.saveWishlist();
    this.updateDisplay();
    this.showNotification('Wishlist cleared');
  }

  updateDisplay() {
    this.updateProductCount();
    this.updateWishlistGrid();
    this.updateEmptyState();
    this.updateClearButton();
  }

  updateProductCount() {
    if (this.productCountElement) {
      const count = this.wishlistItems.size;
      const countText = this.productCountElement.querySelector('.wishlist__count-text');
      if (countText) {
        countText.textContent = this.getLocalizedCount(count);
      }
    }
  }

  updateWishlistGrid() {
    if (!this.wishlistGrid) return;

    this.wishlistGrid.innerHTML = '';
    
    if (this.wishlistItems.size === 0) {
      return;
    }

    this.wishlistItems.forEach((product, productId) => {
      const productElement = this.createProductElement(product, productId);
      this.wishlistGrid.appendChild(productElement);
    });
  }

  createProductElement(product, productId) {
    const productElement = document.createElement('div');
    productElement.className = `wishlist__product ${this.layout === 'list' ? 'wishlist__product--list' : ''}`;
    productElement.dataset.productId = productId;

    const imageUrl = product.image || '/assets/no-image.png';
    const price = this.formatPrice(product.price);
    const comparePrice = product.compare_at_price ? this.formatPrice(product.compare_at_price) : null;
    const availability = this.getAvailabilityStatus(product.available);

    productElement.innerHTML = `
      <img 
        src="${imageUrl}" 
        alt="${product.title}"
        class="wishlist__product-image"
        loading="lazy"
      >
      <div class="wishlist__product-content">
        <h3 class="wishlist__product-title">
          <a href="/products/${product.handle}">${product.title}</a>
        </h3>
        
        ${this.showPrices ? `
          <div class="wishlist__product-price">
            ${comparePrice ? `<span class="wishlist__product-compare-price">${comparePrice}</span>` : ''}
            <span class="wishlist__product-current-price">${price}</span>
          </div>
        ` : ''}
        
        ${this.showVariants && product.variants && product.variants.length > 0 ? `
          <div class="wishlist__product-variants">
            ${product.variants.slice(0, 3).map(variant => `
              <span class="wishlist__product-variant">${variant.title}</span>
            `).join('')}
            ${product.variants.length > 3 ? `<span class="wishlist__product-variant">+${product.variants.length - 3} more</span>` : ''}
          </div>
        ` : ''}
        
        ${this.showAvailability ? `
          <div class="wishlist__product-availability wishlist__product-availability--${availability.status}">
            ${availability.text}
          </div>
        ` : ''}
        
        <div class="wishlist__product-actions">
          <button
            type="button"
            class="wishlist__add-to-cart-button"
            data-add-to-cart="${productId}"
            ${!product.available ? 'disabled' : ''}
          >
            ${product.available ? 'Add to cart' : 'Out of stock'}
          </button>
          
          ${this.showRemove ? `
            <button
              type="button"
              class="wishlist__remove-button"
              data-remove-from-wishlist="${productId}"
              aria-label="Remove from wishlist"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Add event listeners
    const addToCartButton = productElement.querySelector('[data-add-to-cart]');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', () => this.addToCart(productId));
    }

    const removeButton = productElement.querySelector('[data-remove-from-wishlist]');
    if (removeButton) {
      removeButton.addEventListener('click', () => this.removeFromWishlist(productId));
    }

    return productElement;
  }

  updateEmptyState() {
    if (!this.emptyState) return;

    if (this.wishlistItems.size === 0) {
      this.emptyState.classList.add('wishlist__empty--visible');
      this.wishlistGrid.style.display = 'none';
    } else {
      this.emptyState.classList.remove('wishlist__empty--visible');
      this.wishlistGrid.style.display = 'grid';
    }
  }

  updateClearButton() {
    if (!this.clearButton) return;

    if (this.wishlistItems.size > 0) {
      this.clearButton.style.display = 'block';
    } else {
      this.clearButton.style.display = 'none';
    }
  }

  async addToCart(productId) {
    const product = this.wishlistItems.get(productId);
    if (!product || !product.available) return;

    try {
      this.setLoading(true);
      
      // Add to cart using Dawn's cart API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            id: parseInt(productId),
            quantity: 1
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to add to cart');
      
      const result = await response.json();
      
      // Trigger cart update event
      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart: result }
      }));
      
      this.showNotification('Product added to cart');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showNotification('Failed to add to cart', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  openShareModal() {
    if (!this.shareModal) return;
    
    this.shareModal.classList.add('wishlist__share-modal--visible');
    this.overlay.classList.add('wishlist__overlay--visible');
    
    // Update share URL
    if (this.shareUrlInput) {
      const shareUrl = new URL(window.location);
      shareUrl.searchParams.set('wishlist', 'true');
      this.shareUrlInput.value = shareUrl.toString();
    }
  }

  closeShareModal() {
    if (!this.shareModal) return;
    
    this.shareModal.classList.remove('wishlist__share-modal--visible');
    this.overlay.classList.remove('wishlist__overlay--visible');
  }

  async copyWishlistUrl() {
    if (!this.shareUrlInput) return;
    
    try {
      await navigator.clipboard.writeText(this.shareUrlInput.value);
      this.showNotification('Wishlist URL copied to clipboard');
    } catch (error) {
      console.error('Error copying URL:', error);
      this.showNotification('Failed to copy URL', 'error');
    }
  }

  handleShareOption(event) {
    const option = event.currentTarget.dataset.shareOption;
    
    switch (option) {
      case 'copy':
        this.copyWishlistUrl();
        break;
      case 'email':
        this.shareViaEmail();
        break;
      case 'social':
        this.shareViaSocial();
        break;
    }
  }

  shareViaEmail() {
    const subject = encodeURIComponent('Check out my wishlist');
    const body = encodeURIComponent(`I've created a wishlist of products I love. Check it out: ${this.shareUrlInput?.value || window.location.href}`);
    const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_blank');
  }

  shareViaSocial() {
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: 'Check out my wishlist of products I love!',
        url: this.shareUrlInput?.value || window.location.href
      });
    } else {
      // Fallback to copy URL
      this.copyWishlistUrl();
    }
  }

  handleOutsideClick(event) {
    if (this.shareModal && this.shareModal.contains(event.target) && !event.target.closest('.wishlist__share-modal-content')) {
      this.closeShareModal();
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.shareModal?.classList.contains('wishlist__share-modal--visible')) {
      this.closeShareModal();
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.loadingState.classList.add('wishlist__loading--visible');
    } else {
      this.loadingState.classList.remove('wishlist__loading--visible');
    }
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `wishlist__notification wishlist__notification--${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
      notification.classList.add('wishlist__notification--visible');
    }, 100);
    
    // Remove notification
    setTimeout(() => {
      notification.classList.remove('wishlist__notification--visible');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  formatPrice(price) {
    // Format price based on shop's currency settings
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD'
    }).format(price / 100);
  }

  getAvailabilityStatus(available) {
    if (available) {
      return { status: 'in-stock', text: 'In stock' };
    } else {
      return { status: 'out-of-stock', text: 'Out of stock' };
    }
  }

  getLocalizedCount(count) {
    // This would be replaced with actual localization
    return `${count} product${count !== 1 ? 's' : ''}`;
  }

  // Public methods for external control
  getWishlistItems() {
    return Array.from(this.wishlistItems.values());
  }

  isInWishlist(productId) {
    return this.wishlistItems.has(productId.toString());
  }

  getWishlistCount() {
    return this.wishlistItems.size;
  }
}

// Global manager for wishlist
class WishlistManager {
  constructor() {
    this.components = new Map();
    this.init();
  }

  init() {
    // Initialize existing components
    document.querySelectorAll('wishlist').forEach(component => {
      this.registerComponent(component);
    });

    // Watch for new components
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'WISHLIST') {
              this.registerComponent(node);
            }
            node.querySelectorAll('wishlist').forEach(component => {
              this.registerComponent(component);
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

  registerComponent(component) {
    const sectionId = component.dataset.section;
    if (sectionId && !this.components.has(sectionId)) {
      this.components.set(sectionId, component);
    }
  }

  getComponent(sectionId) {
    return this.components.get(sectionId);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  addToWishlist(productData) {
    this.components.forEach(component => {
      component.addToWishlist(productData);
    });
  }

  removeFromWishlist(productId) {
    this.components.forEach(component => {
      component.removeFromWishlist(productId);
    });
  }

  clearWishlist() {
    this.components.forEach(component => {
      component.clearWishlist();
    });
  }
}

// Initialize the manager when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    customElements.define('wishlist', Wishlist);
    window.wishlistManager = new WishlistManager();
  });
} else {
  customElements.define('wishlist', Wishlist);
  window.wishlistManager = new WishlistManager();
} 