/**
 * Combined Listing Component
 * Provides filtering, sorting, and pagination for multiple products in one listing
 */

class CombinedListing extends HTMLElement {
  constructor() {
    super();
    this.products = this.querySelectorAll('[data-product]');
    this.productsGrid = this.querySelector('[data-products-grid]');
    this.layoutButtons = this.querySelectorAll('[data-layout]');
    this.filterToggle = this.querySelector('[data-filter-toggle]');
    this.filterSidebar = this.querySelector('[data-filter-sidebar]');
    this.filterClose = this.querySelector('[data-filter-close]');
    this.filterCheckboxes = this.querySelectorAll('[data-filter]');
    this.filterClear = this.querySelector('[data-filter-clear]');
    this.sortSelect = this.querySelector('[data-sort-select]');
    this.pagination = this.querySelector('[data-pagination]');
    this.paginationPrev = this.querySelector('[data-pagination-prev]');
    this.paginationNext = this.querySelector('[data-pagination-next]');
    this.paginationPages = this.querySelector('[data-pagination-pages]');
    this.noResults = this.querySelector('[data-no-results]');
    this.loading = this.querySelector('[data-loading]');
    this.quickAddButtons = this.querySelectorAll('[data-quick-add]');
    this.quickViewButtons = this.querySelectorAll('[data-quick-view]');
    this.wishlistButtons = this.querySelectorAll('[data-wishlist-toggle]');
    this.compareButtons = this.querySelectorAll('[data-compare-toggle]');
    
    // Configuration
    this.layout = this.dataset.layout || 'grid';
    this.productsPerRow = parseInt(this.dataset.productsPerRow) || 4;
    this.productsPerRowMobile = parseInt(this.dataset.productsPerRowMobile) || 2;
    this.showVendor = this.dataset.showVendor === 'true';
    this.showRating = this.dataset.showRating === 'true';
    this.showQuickAdd = this.dataset.showQuickAdd === 'true';
    this.showQuickView = this.dataset.showQuickView === 'true';
    this.showWishlist = this.dataset.showWishlist === 'true';
    this.showCompare = this.dataset.showCompare === 'true';
    this.enableFilters = this.dataset.enableFilters === 'true';
    this.enableSorting = this.dataset.enableSorting === 'true';
    this.enablePagination = this.dataset.enablePagination === 'true';
    this.productsPerPage = parseInt(this.dataset.productsPerPage) || 12;
    
    // State
    this.allProducts = Array.from(this.products);
    this.filteredProducts = [...this.allProducts];
    this.sortedProducts = [...this.allProducts];
    this.currentPage = 1;
    this.activeFilters = {
      product_type: [],
      vendor: [],
      price: { min: 0, max: Infinity }
    };
    this.sortBy = 'manual';
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupProducts();
    this.setupPagination();
    this.updateDisplay();
  }

  bindEvents() {
    // Layout toggle
    this.layoutButtons.forEach(button => {
      button.addEventListener('click', this.handleLayoutChange.bind(this));
    });
    
    // Filter toggle
    if (this.filterToggle) {
      this.filterToggle.addEventListener('click', this.handleFilterToggle.bind(this));
    }
    
    if (this.filterClose) {
      this.filterClose.addEventListener('click', this.handleFilterClose.bind(this));
    }
    
    // Filter checkboxes
    this.filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', this.handleFilterChange.bind(this));
    });
    
    // Filter clear
    if (this.filterClear) {
      this.filterClear.addEventListener('click', this.handleFilterClear.bind(this));
    }
    
    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', this.handleSortChange.bind(this));
    }
    
    // Pagination
    if (this.paginationPrev) {
      this.paginationPrev.addEventListener('click', this.handlePaginationPrev.bind(this));
    }
    
    if (this.paginationNext) {
      this.paginationNext.addEventListener('click', this.handlePaginationNext.bind(this));
    }
    
    // Quick actions
    this.quickAddButtons.forEach(button => {
      button.addEventListener('click', this.handleQuickAdd.bind(this));
    });
    
    this.quickViewButtons.forEach(button => {
      button.addEventListener('click', this.handleQuickView.bind(this));
    });
    
    this.wishlistButtons.forEach(button => {
      button.addEventListener('click', this.handleWishlistToggle.bind(this));
    });
    
    this.compareButtons.forEach(button => {
      button.addEventListener('click', this.handleCompareToggle.bind(this));
    });
    
    // Price range inputs
    const priceInputs = this.querySelectorAll('[data-price-input-min], [data-price-input-max]');
    priceInputs.forEach(input => {
      input.addEventListener('input', this.handlePriceInput.bind(this));
    });
    
    // Click outside filter sidebar
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    
    // Escape key
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    
    // Resize
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
  }

  setupProducts() {
    this.allProducts.forEach(product => {
      // Add data attributes for filtering
      const productId = product.dataset.productId;
      const productType = product.dataset.productType;
      const productVendor = product.dataset.productVendor;
      const productPrice = parseFloat(product.dataset.productPrice) || 0;
      const productAvailable = product.dataset.productAvailable === 'true';
      
      // Store additional data
      product.dataset.originalIndex = this.allProducts.indexOf(product);
      product.dataset.price = productPrice;
      product.dataset.available = productAvailable;
    });
  }

  setupPagination() {
    if (!this.enablePagination) return;
    
    this.totalPages = Math.ceil(this.allProducts.length / this.productsPerPage);
    this.updatePagination();
  }

  handleLayoutChange(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const newLayout = button.dataset.layout;
    
    // Update active button
    this.layoutButtons.forEach(btn => btn.classList.remove('is-active'));
    button.classList.add('is-active');
    
    // Update layout
    this.layout = newLayout;
    this.updateLayout();
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('layoutChanged', {
      detail: { layout: newLayout }
    }));
  }

  handleFilterToggle(event) {
    event.preventDefault();
    
    if (this.filterSidebar) {
      this.filterSidebar.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    }
  }

  handleFilterClose(event) {
    event.preventDefault();
    
    if (this.filterSidebar) {
      this.filterSidebar.classList.remove('is-visible');
      document.body.style.overflow = '';
    }
  }

  handleFilterChange(event) {
    const checkbox = event.currentTarget;
    const filterType = checkbox.dataset.filter;
    const filterValue = checkbox.value;
    const isChecked = checkbox.checked;
    
    // Update active filters
    if (isChecked) {
      if (!this.activeFilters[filterType].includes(filterValue)) {
        this.activeFilters[filterType].push(filterValue);
      }
    } else {
      this.activeFilters[filterType] = this.activeFilters[filterType].filter(value => value !== filterValue);
    }
    
    this.applyFilters();
  }

  handlePriceInput(event) {
    const input = event.currentTarget;
    const isMin = input.hasAttribute('data-price-input-min');
    const value = parseFloat(input.value) || 0;
    
    if (isMin) {
      this.activeFilters.price.min = value;
    } else {
      this.activeFilters.price.max = value === 0 ? Infinity : value;
    }
    
    this.applyFilters();
  }

  handleFilterClear(event) {
    event.preventDefault();
    
    // Clear all checkboxes
    this.filterCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear price inputs
    const priceInputs = this.querySelectorAll('[data-price-input-min], [data-price-input-max]');
    priceInputs.forEach(input => {
      input.value = '';
    });
    
    // Reset active filters
    this.activeFilters = {
      product_type: [],
      vendor: [],
      price: { min: 0, max: Infinity }
    };
    
    this.applyFilters();
    
    // Close filter sidebar
    this.handleFilterClose(event);
  }

  handleSortChange(event) {
    const sortBy = event.currentTarget.value;
    this.sortBy = sortBy;
    this.applySorting();
  }

  handlePaginationPrev(event) {
    event.preventDefault();
    
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.updateDisplay();
    }
  }

  handlePaginationNext(event) {
    event.preventDefault();
    
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.updateDisplay();
    }
  }

  handlePaginationPage(event) {
    event.preventDefault();
    
    const page = parseInt(event.currentTarget.dataset.page);
    if (page && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePagination();
      this.updateDisplay();
    }
  }

  handleQuickAdd(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    const hasVariants = button.dataset.productHasVariants === 'true';
    
    if (hasVariants) {
      // Open quick view modal for products with variants
      this.openQuickView(productId);
    } else {
      // Add to cart directly
      this.addToCart(productId);
    }
  }

  handleQuickView(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    
    this.openQuickView(productId);
  }

  handleWishlistToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    
    this.toggleWishlist(productId, button);
  }

  handleCompareToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    
    this.toggleCompare(productId, button);
  }

  handleOutsideClick(event) {
    if (this.filterSidebar && this.filterSidebar.classList.contains('is-visible')) {
      if (!this.filterSidebar.contains(event.target) && !this.filterToggle.contains(event.target)) {
        this.handleFilterClose(event);
      }
    }
  }

  handleEscapeKey(event) {
    if (event.key === 'Escape') {
      if (this.filterSidebar && this.filterSidebar.classList.contains('is-visible')) {
        this.handleFilterClose(event);
      }
    }
  }

  handleResize() {
    // Update layout on resize
    this.updateLayout();
  }

  applyFilters() {
    this.filteredProducts = this.allProducts.filter(product => {
      const productType = product.dataset.productType;
      const productVendor = product.dataset.productVendor;
      const productPrice = parseFloat(product.dataset.price) || 0;
      
      // Check product type filter
      if (this.activeFilters.product_type.length > 0) {
        if (!this.activeFilters.product_type.includes(productType)) {
          return false;
        }
      }
      
      // Check vendor filter
      if (this.activeFilters.vendor.length > 0) {
        if (!this.activeFilters.vendor.includes(productVendor)) {
          return false;
        }
      }
      
      // Check price filter
      if (productPrice < this.activeFilters.price.min || productPrice > this.activeFilters.price.max) {
        return false;
      }
      
      return true;
    });
    
    this.applySorting();
    this.currentPage = 1;
    this.updatePagination();
    this.updateDisplay();
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('filtersApplied', {
      detail: { 
        activeFilters: this.activeFilters,
        filteredCount: this.filteredProducts.length,
        totalCount: this.allProducts.length
      }
    }));
  }

  applySorting() {
    this.sortedProducts = [...this.filteredProducts];
    
    switch (this.sortBy) {
      case 'best-selling':
        this.sortedProducts.sort((a, b) => {
          const aSales = parseInt(a.dataset.sales || '0');
          const bSales = parseInt(b.dataset.sales || '0');
          return bSales - aSales;
        });
        break;
        
      case 'title-ascending':
        this.sortedProducts.sort((a, b) => {
          const aTitle = a.querySelector('.combined-listing__product-title').textContent.trim();
          const bTitle = b.querySelector('.combined-listing__product-title').textContent.trim();
          return aTitle.localeCompare(bTitle);
        });
        break;
        
      case 'title-descending':
        this.sortedProducts.sort((a, b) => {
          const aTitle = a.querySelector('.combined-listing__product-title').textContent.trim();
          const bTitle = b.querySelector('.combined-listing__product-title').textContent.trim();
          return bTitle.localeCompare(aTitle);
        });
        break;
        
      case 'price-ascending':
        this.sortedProducts.sort((a, b) => {
          const aPrice = parseFloat(a.dataset.price) || 0;
          const bPrice = parseFloat(b.dataset.price) || 0;
          return aPrice - bPrice;
        });
        break;
        
      case 'price-descending':
        this.sortedProducts.sort((a, b) => {
          const aPrice = parseFloat(a.dataset.price) || 0;
          const bPrice = parseFloat(b.dataset.price) || 0;
          return bPrice - aPrice;
        });
        break;
        
      case 'created-ascending':
        this.sortedProducts.sort((a, b) => {
          const aCreated = new Date(a.dataset.created || 0);
          const bCreated = new Date(b.dataset.created || 0);
          return aCreated - bCreated;
        });
        break;
        
      case 'created-descending':
        this.sortedProducts.sort((a, b) => {
          const aCreated = new Date(a.dataset.created || 0);
          const bCreated = new Date(b.dataset.created || 0);
          return bCreated - aCreated;
        });
        break;
        
      default: // manual
        this.sortedProducts.sort((a, b) => {
          const aIndex = parseInt(a.dataset.originalIndex) || 0;
          const bIndex = parseInt(b.dataset.originalIndex) || 0;
          return aIndex - bIndex;
        });
    }
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('sortingApplied', {
      detail: { sortBy: this.sortBy }
    }));
  }

  updateDisplay() {
    if (this.loading) {
      this.loading.style.display = 'block';
    }
    
    // Hide all products
    this.allProducts.forEach(product => {
      product.style.display = 'none';
    });
    
    // Show filtered and sorted products
    let productsToShow = this.sortedProducts;
    
    if (this.enablePagination) {
      const startIndex = (this.currentPage - 1) * this.productsPerPage;
      const endIndex = startIndex + this.productsPerPage;
      productsToShow = this.sortedProducts.slice(startIndex, endIndex);
    }
    
    productsToShow.forEach(product => {
      product.style.display = 'block';
    });
    
    // Update layout
    this.updateLayout();
    
    // Show/hide no results
    if (this.noResults) {
      if (this.sortedProducts.length === 0) {
        this.noResults.style.display = 'block';
        this.productsGrid.style.display = 'none';
      } else {
        this.noResults.style.display = 'none';
        this.productsGrid.style.display = 'grid';
      }
    }
    
    // Hide loading
    if (this.loading) {
      this.loading.style.display = 'none';
    }
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('displayUpdated', {
      detail: { 
        visibleCount: productsToShow.length,
        totalFiltered: this.sortedProducts.length
      }
    }));
  }

  updateLayout() {
    if (this.layout === 'list') {
      this.productsGrid.classList.add('combined-listing__products--list');
      this.allProducts.forEach(product => {
        product.classList.add('combined-listing__product--list');
      });
    } else {
      this.productsGrid.classList.remove('combined-listing__products--list');
      this.allProducts.forEach(product => {
        product.classList.remove('combined-listing__product--list');
      });
    }
  }

  updatePagination() {
    if (!this.enablePagination || !this.pagination) return;
    
    this.totalPages = Math.ceil(this.sortedProducts.length / this.productsPerPage);
    
    // Update prev/next buttons
    if (this.paginationPrev) {
      this.paginationPrev.disabled = this.currentPage <= 1;
    }
    
    if (this.paginationNext) {
      this.paginationNext.disabled = this.currentPage >= this.totalPages;
    }
    
    // Update page numbers
    if (this.paginationPages) {
      this.paginationPages.innerHTML = '';
      
      const maxVisiblePages = 5;
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.type = 'button';
        pageButton.className = 'combined-listing__pagination-page';
        pageButton.textContent = i;
        pageButton.dataset.page = i;
        
        if (i === this.currentPage) {
          pageButton.classList.add('is-active');
        }
        
        pageButton.addEventListener('click', this.handlePaginationPage.bind(this));
        this.paginationPages.appendChild(pageButton);
      }
    }
  }

  addToCart(productId) {
    // Dispatch custom event for cart functionality
    this.dispatchEvent(new CustomEvent('addToCart', {
      detail: { productId }
    }));
    
    // Also try to use existing cart functionality if available
    if (window.Cart) {
      window.Cart.addItem(productId, 1);
    }
  }

  openQuickView(productId) {
    // Dispatch custom event for quick view functionality
    this.dispatchEvent(new CustomEvent('openQuickView', {
      detail: { productId }
    }));
    
    // Also try to use existing quick view functionality if available
    if (window.QuickView) {
      window.QuickView.open(productId);
    }
  }

  toggleWishlist(productId, button) {
    const isInWishlist = button.classList.contains('is-active');
    
    if (isInWishlist) {
      button.classList.remove('is-active');
      // Remove from wishlist
      this.dispatchEvent(new CustomEvent('removeFromWishlist', {
        detail: { productId }
      }));
    } else {
      button.classList.add('is-active');
      // Add to wishlist
      this.dispatchEvent(new CustomEvent('addToWishlist', {
        detail: { productId }
      }));
    }
  }

  toggleCompare(productId, button) {
    const isInCompare = button.classList.contains('is-active');
    
    if (isInCompare) {
      button.classList.remove('is-active');
      // Remove from compare
      this.dispatchEvent(new CustomEvent('removeFromCompare', {
        detail: { productId }
      }));
    } else {
      button.classList.add('is-active');
      // Add to compare
      this.dispatchEvent(new CustomEvent('addToCompare', {
        detail: { productId }
      }));
    }
  }

  // Public methods
  setLayout(layout) {
    this.layout = layout;
    this.updateLayout();
  }

  setFilters(filters) {
    this.activeFilters = { ...this.activeFilters, ...filters };
    this.applyFilters();
  }

  setSorting(sortBy) {
    this.sortBy = sortBy;
    this.applySorting();
    this.updateDisplay();
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.updateDisplay();
    }
  }

  refresh() {
    this.applyFilters();
    this.updateDisplay();
  }

  // Cleanup
  destroy() {
    this.layoutButtons.forEach(button => {
      button.removeEventListener('click', this.handleLayoutChange);
    });
    
    if (this.filterToggle) {
      this.filterToggle.removeEventListener('click', this.handleFilterToggle);
    }
    
    if (this.filterClose) {
      this.filterClose.removeEventListener('click', this.handleFilterClose);
    }
    
    this.filterCheckboxes.forEach(checkbox => {
      checkbox.removeEventListener('change', this.handleFilterChange);
    });
    
    if (this.filterClear) {
      this.filterClear.removeEventListener('click', this.handleFilterClear);
    }
    
    if (this.sortSelect) {
      this.sortSelect.removeEventListener('change', this.handleSortChange);
    }
    
    if (this.paginationPrev) {
      this.paginationPrev.removeEventListener('click', this.handlePaginationPrev);
    }
    
    if (this.paginationNext) {
      this.paginationNext.removeEventListener('click', this.handlePaginationNext);
    }
    
    this.quickAddButtons.forEach(button => {
      button.removeEventListener('click', this.handleQuickAdd);
    });
    
    this.quickViewButtons.forEach(button => {
      button.removeEventListener('click', this.handleQuickView);
    });
    
    this.wishlistButtons.forEach(button => {
      button.removeEventListener('click', this.handleWishlistToggle);
    });
    
    this.compareButtons.forEach(button => {
      button.removeEventListener('click', this.handleCompareToggle);
    });
    
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Register the custom element
customElements.define('combined-listing', CombinedListing);

// Export for potential external use
window.CombinedListing = CombinedListing; 