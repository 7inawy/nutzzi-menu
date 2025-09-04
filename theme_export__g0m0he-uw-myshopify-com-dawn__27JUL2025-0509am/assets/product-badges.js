class ProductBadges extends HTMLElement {
  constructor() {
    super();
    this.productId = this.dataset.productId;
    this.position = this.dataset.position || 'top-left';
    this.badgeStyle = this.dataset.badgeStyle || 'rounded';
    this.saleBadgeType = this.dataset.saleBadgeType || 'percentage';
    this.newProductDays = parseInt(this.dataset.newProductDays) || 30;
    this.lowStockThreshold = parseInt(this.dataset.lowStockThreshold) || 5;
    this.showStockCount = this.dataset.showStockCount === 'true';
    this.customBadgeText = this.dataset.customBadgeText || 'Special';
    this.hideOnMobile = this.dataset.hideMobile === 'true';
    
    this.badges = [];
    this.productData = null;
    this.isLoading = false;
    
    this.init();
  }

  async init() {
    if (this.productId) {
      await this.loadProductData();
      this.renderBadges();
    } else {
      // For product cards, we'll get data from the parent element
      this.observeProductData();
    }
  }

  async loadProductData() {
    try {
      this.setLoading(true);
      
      const response = await fetch(`/products/${this.productId}.js`);
      if (!response.ok) {
        throw new Error('Failed to load product data');
      }
      
      this.productData = await response.json();
      this.renderBadges();
    } catch (error) {
      console.error('Error loading product data:', error);
    } finally {
      this.setLoading(false);
    }
  }

  observeProductData() {
    // For product cards, observe the parent element for product data
    const productCard = this.closest('.card-product, .product-card, [data-product-id]');
    if (productCard) {
      const observer = new MutationObserver(() => {
        this.extractProductData();
      });
      
      observer.observe(productCard, {
        childList: true,
        subtree: true,
        attributes: true
      });
      
      this.extractProductData();
    }
  }

  extractProductData() {
    // Extract product data from the DOM structure
    const productCard = this.closest('.card-product, .product-card, [data-product-id]');
    if (!productCard) return;

    // Try to get product data from various sources
    const productId = productCard.dataset.productId || 
                     productCard.querySelector('[data-product-id]')?.dataset.productId;
    
    if (productId && productId !== this.productId) {
      this.productId = productId;
      this.loadProductData();
    }
  }

  renderBadges() {
    if (!this.productData) return;

    this.clearBadges();
    
    const badges = this.generateBadges();
    badges.forEach(badge => {
      this.appendChild(badge);
    });
    
    this.badges = badges;
  }

  generateBadges() {
    const badges = [];
    
    // Sale badge
    if (this.shouldShowSaleBadge()) {
      badges.push(this.createSaleBadge());
    }
    
    // New badge
    if (this.shouldShowNewBadge()) {
      badges.push(this.createNewBadge());
    }
    
    // Sold out badge
    if (this.shouldShowSoldOutBadge()) {
      badges.push(this.createSoldOutBadge());
    }
    
    // Low stock badge
    if (this.shouldShowLowStockBadge()) {
      badges.push(this.createLowStockBadge());
    }
    
    // Pre-order badge
    if (this.shouldShowPreOrderBadge()) {
      badges.push(this.createPreOrderBadge());
    }
    
    // Back in stock badge
    if (this.shouldShowBackInStockBadge()) {
      badges.push(this.createBackInStockBadge());
    }
    
    // Custom badge
    if (this.shouldShowCustomBadge()) {
      badges.push(this.createCustomBadge());
    }
    
    return badges;
  }

  shouldShowSaleBadge() {
    if (!this.productData) return false;
    
    const variant = this.productData.variants?.[0];
    return variant && 
           variant.compare_at_price && 
           variant.compare_at_price > variant.price &&
           variant.available;
  }

  shouldShowNewBadge() {
    if (!this.productData) return false;
    
    const createdDate = new Date(this.productData.created_at);
    const now = new Date();
    const daysSinceCreated = (now - createdDate) / (1000 * 60 * 60 * 24);
    
    return daysSinceCreated <= this.newProductDays;
  }

  shouldShowSoldOutBadge() {
    if (!this.productData) return false;
    
    const variant = this.productData.variants?.[0];
    return variant && !variant.available;
  }

  shouldShowLowStockBadge() {
    if (!this.productData) return false;
    
    const variant = this.productData.variants?.[0];
    return variant && 
           variant.available &&
           variant.inventory_management === 'shopify' &&
           variant.inventory_quantity > 0 &&
           variant.inventory_quantity <= this.lowStockThreshold;
  }

  shouldShowPreOrderBadge() {
    if (!this.productData) return false;
    
    const variant = this.productData.variants?.[0];
    return variant && 
           !variant.available &&
           this.productData.tags?.includes('pre-order');
  }

  shouldShowBackInStockBadge() {
    if (!this.productData) return false;
    
    const variant = this.productData.variants?.[0];
    return variant && 
           !variant.available &&
           this.productData.tags?.includes('back-in-stock');
  }

  shouldShowCustomBadge() {
    return this.customBadgeText && this.customBadgeText.trim() !== '';
  }

  createSaleBadge() {
    const variant = this.productData.variants[0];
    let text = '';
    
    if (this.saleBadgeType === 'percentage') {
      const discount = ((variant.compare_at_price - variant.price) / variant.compare_at_price) * 100;
      text = `-${Math.round(discount)}%`;
    } else if (this.saleBadgeType === 'amount') {
      const discount = variant.compare_at_price - variant.price;
      text = `-${this.formatMoney(discount)}`;
    } else {
      text = window.productBadgeStrings?.sale || 'Sale';
    }
    
    return this.createBadge('sale', text);
  }

  createNewBadge() {
    const text = window.productBadgeStrings?.new || 'New';
    return this.createBadge('new', text);
  }

  createSoldOutBadge() {
    const text = window.productBadgeStrings?.sold_out || 'Sold Out';
    return this.createBadge('sold-out', text);
  }

  createLowStockBadge() {
    const variant = this.productData.variants[0];
    let text = '';
    
    if (this.showStockCount) {
      text = window.productBadgeStrings?.low_stock_count?.replace('[count]', variant.inventory_quantity) || 
             `Only ${variant.inventory_quantity} left`;
    } else {
      text = window.productBadgeStrings?.low_stock || 'Low Stock';
    }
    
    return this.createBadge('low-stock', text);
  }

  createPreOrderBadge() {
    const text = window.productBadgeStrings?.pre_order || 'Pre-order';
    return this.createBadge('pre-order', text);
  }

  createBackInStockBadge() {
    const text = window.productBadgeStrings?.back_in_stock || 'Back in Stock';
    return this.createBadge('back-in-stock', text);
  }

  createCustomBadge() {
    return this.createBadge('custom', this.customBadgeText);
  }

  createBadge(type, text) {
    const badge = document.createElement('div');
    badge.className = `product-badge product-badge--${type}`;
    badge.dataset.style = this.badgeStyle;
    badge.dataset.type = type;
    badge.textContent = text;
    
    // Add click handler for interactive badges
    if (type === 'low-stock') {
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', () => {
        this.handleLowStockClick();
      });
    }
    
    return badge;
  }

  handleLowStockClick() {
    // Trigger low stock alert or notification
    const event = new CustomEvent('product-badge:low-stock-click', {
      detail: { productId: this.productId, productData: this.productData }
    });
    document.dispatchEvent(event);
  }

  clearBadges() {
    this.badges.forEach(badge => {
      if (badge.parentNode === this) {
        this.removeChild(badge);
      }
    });
    this.badges = [];
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.classList.add('loading');
    } else {
      this.classList.remove('loading');
    }
  }

  formatMoney(cents) {
    return window.Shopify?.formatMoney?.(cents) || `$${(cents / 100).toFixed(2)}`;
  }

  // Public methods
  refresh() {
    if (this.productId) {
      this.loadProductData();
    }
  }

  addBadge(type, text) {
    const badge = this.createBadge(type, text);
    this.appendChild(badge);
    this.badges.push(badge);
  }

  removeBadge(type) {
    const badge = this.querySelector(`.product-badge--${type}`);
    if (badge) {
      this.removeChild(badge);
      this.badges = this.badges.filter(b => b !== badge);
    }
  }
}

customElements.define('product-badges', ProductBadges);

// Global manager for product badges instances
class ProductBadgesManager {
  constructor() {
    this.instances = new Set();
    this.init();
  }

  init() {
    // Find all product badges instances
    document.querySelectorAll('product-badges').forEach(element => {
      this.instances.add(element);
    });

    // Watch for new instances
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'PRODUCT-BADGES') {
              this.instances.add(node);
            }
            node.querySelectorAll('product-badges').forEach(element => {
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

    // Listen for product data updates
    document.addEventListener('product:updated', (event) => {
      this.updateProductBadges(event.detail.productId);
    });
  }

  updateProductBadges(productId) {
    this.instances.forEach(instance => {
      if (instance.productId === productId && instance.refresh) {
        instance.refresh();
      }
    });
  }

  refreshAll() {
    this.instances.forEach(instance => {
      if (instance.refresh) {
        instance.refresh();
      }
    });
  }
}

// Initialize the manager
document.addEventListener('DOMContentLoaded', () => {
  window.productBadgesManager = new ProductBadgesManager();
}); 