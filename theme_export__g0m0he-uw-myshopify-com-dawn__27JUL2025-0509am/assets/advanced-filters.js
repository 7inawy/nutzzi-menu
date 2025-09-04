class AdvancedFilters extends HTMLElement {
  constructor() {
    super();
    this.layout = 'sidebar';
    this.mobileLayout = 'drawer';
    this.showCounts = true;
    this.showClearAll = true;
    this.autoApply = false;
    this.debounceDelay = 300;
    this.persistFilters = true;
    this.currentFilters = new Map();
    this.filterData = new Map();
    this.isLoading = false;
    this.debounceTimer = null;
    
    // DOM elements
    this.mobileToggle = this.querySelector('[data-filter-toggle]');
    this.sidebar = this.querySelector('[data-filter-sidebar]');
    this.closeButton = this.querySelector('[data-filter-close]');
    this.clearAllButton = this.querySelector('[data-clear-all-filters]');
    this.applyButton = this.querySelector('[data-apply-filters]');
    this.activeFiltersContainer = this.querySelector('[data-active-filters-list]');
    this.activeCountElement = this.querySelector('[data-active-count]');
    this.resultsCountElement = this.querySelector('[data-results-count]');
    this.sortSelect = this.querySelector('[data-sort-select]');
    
    // Filter groups
    this.priceRange = this.querySelector('[data-price-range]');
    this.priceMin = this.querySelector('[data-price-min]');
    this.priceMax = this.querySelector('[data-price-max]');
    this.vendorList = this.querySelector('[data-vendor-list]');
    this.typeList = this.querySelector('[data-type-list]');
    this.tagList = this.querySelector('[data-tag-list]');
    this.metafieldLists = this.querySelectorAll('[data-metafield-list]');
    
    // Group toggles
    this.groupToggles = this.querySelectorAll('[data-group-toggle]');
  }

  connectedCallback() {
    this.initializeFilters();
    this.bindEvents();
    this.loadFilterData();
    this.restoreFilters();
    this.updateActiveFilters();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  initializeFilters() {
    // Get configuration from data attributes
    this.layout = this.dataset.layout || 'sidebar';
    this.mobileLayout = this.dataset.mobileLayout || 'drawer';
    this.showCounts = this.dataset.showCounts === 'true';
    this.showClearAll = this.dataset.showClearAll === 'true';
    this.autoApply = this.dataset.autoApply === 'true';
    this.debounceDelay = parseInt(this.dataset.debounceDelay) || 300;
    this.persistFilters = this.dataset.persistFilters === 'true';

    // Set layout classes
    this.classList.add(`advanced-filters--${this.layout}`);
    
    if (this.mobileLayout === 'modal') {
      this.sidebar.classList.add('advanced-filters__sidebar--modal');
    }

    // Initialize price slider if available
    this.initializePriceSlider();
  }

  bindEvents() {
    // Mobile toggle
    if (this.mobileToggle) {
      this.mobileToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.closeSidebar());
    }

    // Clear all filters
    if (this.clearAllButton) {
      this.clearAllButton.addEventListener('click', () => this.clearAllFilters());
    }

    // Apply filters button
    if (this.applyButton) {
      this.applyButton.addEventListener('click', () => this.applyFilters());
    }

    // Group toggles
    this.groupToggles.forEach(toggle => {
      toggle.addEventListener('click', (event) => this.toggleGroup(event));
    });

    // Price range inputs
    if (this.priceMin) {
      this.priceMin.addEventListener('input', () => this.handlePriceChange());
    }
    if (this.priceMax) {
      this.priceMax.addEventListener('input', () => this.handlePriceChange());
    }

    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', () => this.handleSortChange());
    }

    // Click outside to close
    document.addEventListener('click', (event) => this.handleOutsideClick(event));

    // Keyboard navigation
    this.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  removeEventListeners() {
    // Remove event listeners to prevent memory leaks
    if (this.mobileToggle) {
      this.mobileToggle.removeEventListener('click', () => this.toggleSidebar());
    }
    if (this.closeButton) {
      this.closeButton.removeEventListener('click', () => this.closeSidebar());
    }
    if (this.clearAllButton) {
      this.clearAllButton.removeEventListener('click', () => this.clearAllFilters());
    }
    if (this.applyButton) {
      this.applyButton.removeEventListener('click', () => this.applyFilters());
    }
  }

  async loadFilterData() {
    try {
      this.setLoading(true);
      
      const collectionHandle = this.dataset.collection;
      if (!collectionHandle) return;

      // Load collection data
      const response = await fetch(`/collections/${collectionHandle}?view=filter-data`);
      if (!response.ok) throw new Error('Failed to load filter data');
      
      const data = await response.json();
      this.filterData = new Map(Object.entries(data));
      
      this.populateFilterOptions();
      this.updateFilterCounts();
      
    } catch (error) {
      console.error('Error loading filter data:', error);
      this.showError('Failed to load filter options');
    } finally {
      this.setLoading(false);
    }
  }

  populateFilterOptions() {
    // Populate vendor list
    if (this.vendorList && this.filterData.has('vendors')) {
      this.populateFilterList(this.vendorList, this.filterData.get('vendors'), 'vendor');
    }

    // Populate product type list
    if (this.typeList && this.filterData.has('types')) {
      this.populateFilterList(this.typeList, this.filterData.get('types'), 'type');
    }

    // Populate tag list
    if (this.tagList && this.filterData.has('tags')) {
      this.populateFilterList(this.tagList, this.filterData.get('tags'), 'tag');
    }

    // Populate metafield lists
    this.metafieldLists.forEach(list => {
      const metafieldKey = list.dataset.metafieldKey;
      if (this.filterData.has(`metafield_${metafieldKey}`)) {
        this.populateFilterList(list, this.filterData.get(`metafield_${metafieldKey}`), `metafield_${metafieldKey}`);
      }
    });
  }

  populateFilterList(container, items, filterType) {
    container.innerHTML = '';
    
    items.forEach(item => {
      const filterItem = document.createElement('div');
      filterItem.className = 'advanced-filters__filter-item';
      filterItem.innerHTML = `
        <input
          type="checkbox"
          class="advanced-filters__filter-checkbox"
          data-filter="${filterType}"
          data-value="${item.value}"
          id="${filterType}-${item.value}"
        >
        <label class="advanced-filters__filter-label" for="${filterType}-${item.value}">
          ${item.label}
        </label>
        ${this.showCounts ? `<span class="advanced-filters__filter-count">${item.count}</span>` : ''}
      `;
      
      const checkbox = filterItem.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => this.handleFilterChange(filterType, item.value, checkbox.checked));
      
      container.appendChild(filterItem);
    });
  }

  handleFilterChange(filterType, value, checked) {
    if (checked) {
      this.currentFilters.set(`${filterType}:${value}`, { type: filterType, value, label: this.getFilterLabel(filterType, value) });
    } else {
      this.currentFilters.delete(`${filterType}:${value}`);
    }

    this.updateActiveFilters();
    
    if (this.autoApply) {
      this.debounceApply();
    }
  }

  handlePriceChange() {
    const minPrice = this.priceMin?.value;
    const maxPrice = this.priceMax?.value;
    
    if (minPrice || maxPrice) {
      this.currentFilters.set('price', { type: 'price', min: minPrice, max: maxPrice });
    } else {
      this.currentFilters.delete('price');
    }

    this.updateActiveFilters();
    
    if (this.autoApply) {
      this.debounceApply();
    }
  }

  handleSortChange() {
    const sortValue = this.sortSelect?.value;
    if (sortValue) {
      this.currentFilters.set('sort', { type: 'sort', value: sortValue });
    } else {
      this.currentFilters.delete('sort');
    }

    this.updateActiveFilters();
    
    if (this.autoApply) {
      this.debounceApply();
    }
  }

  debounceApply() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.applyFilters();
    }, this.debounceDelay);
  }

  async applyFilters() {
    try {
      this.setLoading(true);
      
      const params = new URLSearchParams();
      
      // Add filters to URL params
      this.currentFilters.forEach((filter, key) => {
        switch (filter.type) {
          case 'price':
            if (filter.min) params.append('filter.v.price.gte', filter.min);
            if (filter.max) params.append('filter.v.price.lte', filter.max);
            break;
          case 'vendor':
            params.append('filter.v.vendor', filter.value);
            break;
          case 'type':
            params.append('filter.v.product_type', filter.value);
            break;
          case 'tag':
            params.append('filter.v.tag', filter.value);
            break;
          case 'sort':
            params.append('sort_by', filter.value);
            break;
          default:
            if (filter.type.startsWith('metafield_')) {
              const metafieldKey = filter.type.replace('metafield_', '');
              params.append(`filter.v.metafield.${metafieldKey}`, filter.value);
            }
        }
      });

      // Update URL
      const currentUrl = new URL(window.location);
      currentUrl.search = params.toString();
      
      // Save filters to localStorage if persistence is enabled
      if (this.persistFilters) {
        this.saveFilters();
      }

      // Navigate to filtered results
      window.location.href = currentUrl.toString();
      
    } catch (error) {
      console.error('Error applying filters:', error);
      this.showError('Failed to apply filters');
    } finally {
      this.setLoading(false);
    }
  }

  updateActiveFilters() {
    if (!this.activeFiltersContainer) return;

    this.activeFiltersContainer.innerHTML = '';
    
    this.currentFilters.forEach((filter, key) => {
      const activeFilter = document.createElement('div');
      activeFilter.className = 'advanced-filters__active-filter';
      activeFilter.innerHTML = `
        <span>${this.getFilterDisplayLabel(filter)}</span>
        <button
          type="button"
          class="advanced-filters__active-filter-remove"
          data-remove-filter="${key}"
          aria-label="Remove filter"
        >
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
      
      const removeButton = activeFilter.querySelector('[data-remove-filter]');
      removeButton.addEventListener('click', () => this.removeFilter(key));
      
      this.activeFiltersContainer.appendChild(activeFilter);
    });

    // Update active count
    if (this.activeCountElement) {
      this.activeCountElement.textContent = this.currentFilters.size;
    }
  }

  removeFilter(key) {
    this.currentFilters.delete(key);
    this.updateActiveFilters();
    
    // Update corresponding checkbox
    const [filterType, value] = key.split(':');
    const checkbox = this.querySelector(`[data-filter="${filterType}"][data-value="${value}"]`);
    if (checkbox) {
      checkbox.checked = false;
    }
    
    if (this.autoApply) {
      this.debounceApply();
    }
  }

  clearAllFilters() {
    this.currentFilters.clear();
    
    // Uncheck all checkboxes
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear price inputs
    if (this.priceMin) this.priceMin.value = '';
    if (this.priceMax) this.priceMax.value = '';
    
    this.updateActiveFilters();
    
    if (this.autoApply) {
      this.debounceApply();
    }
  }

  toggleSidebar() {
    this.sidebar.classList.toggle('advanced-filters__sidebar--open');
    
    // Add overlay for mobile
    if (this.sidebar.classList.contains('advanced-filters__sidebar--open')) {
      this.addOverlay();
    } else {
      this.removeOverlay();
    }
  }

  closeSidebar() {
    this.sidebar.classList.remove('advanced-filters__sidebar--open');
    this.removeOverlay();
  }

  addOverlay() {
    if (document.querySelector('.advanced-filters__overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'advanced-filters__overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    `;
    
    overlay.addEventListener('click', () => this.closeSidebar());
    document.body.appendChild(overlay);
  }

  removeOverlay() {
    const overlay = document.querySelector('.advanced-filters__overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  toggleGroup(event) {
    const toggle = event.currentTarget;
    const group = toggle.closest('.advanced-filters__group');
    const content = group.querySelector('[data-group-content]');
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    
    toggle.setAttribute('aria-expanded', !isExpanded);
    content.setAttribute('data-collapsed', isExpanded);
  }

  initializePriceSlider() {
    if (!this.priceRange) return;
    
    // Simple price slider implementation
    // In a production environment, you might want to use a proper slider library
    const slider = this.priceRange.querySelector('[data-price-slider]');
    if (!slider) return;
    
    // Add slider functionality here
    // This is a placeholder for the actual slider implementation
  }

  getFilterLabel(filterType, value) {
    // Get the display label for a filter value
    const items = this.filterData.get(filterType) || [];
    const item = items.find(item => item.value === value);
    return item ? item.label : value;
  }

  getFilterDisplayLabel(filter) {
    switch (filter.type) {
      case 'price':
        const parts = [];
        if (filter.min) parts.push(`$${filter.min}`);
        if (filter.max) parts.push(`$${filter.max}`);
        return parts.length > 0 ? `Price: ${parts.join(' - ')}` : 'Price';
      case 'vendor':
        return `Vendor: ${filter.label}`;
      case 'type':
        return `Type: ${filter.label}`;
      case 'tag':
        return `Tag: ${filter.label}`;
      case 'sort':
        return `Sort: ${filter.value}`;
      default:
        if (filter.type.startsWith('metafield_')) {
          return `${filter.type.replace('metafield_', '')}: ${filter.label}`;
        }
        return filter.label || filter.value;
    }
  }

  saveFilters() {
    const filtersData = Array.from(this.currentFilters.entries());
    localStorage.setItem('advanced-filters', JSON.stringify(filtersData));
  }

  restoreFilters() {
    if (!this.persistFilters) return;
    
    try {
      const savedFilters = localStorage.getItem('advanced-filters');
      if (savedFilters) {
        const filtersData = JSON.parse(savedFilters);
        this.currentFilters = new Map(filtersData);
        
        // Restore checkbox states
        this.currentFilters.forEach((filter, key) => {
          const [filterType, value] = key.split(':');
          const checkbox = this.querySelector(`[data-filter="${filterType}"][data-value="${value}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
        
        this.updateActiveFilters();
      }
    } catch (error) {
      console.error('Error restoring filters:', error);
    }
  }

  updateFilterCounts() {
    // Update result count if available
    if (this.resultsCountElement) {
      const totalProducts = this.filterData.get('total_products') || 0;
      this.resultsCountElement.textContent = `${totalProducts} products`;
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    
    if (loading) {
      this.classList.add('advanced-filters--loading');
    } else {
      this.classList.remove('advanced-filters--loading');
    }
  }

  showError(message) {
    // Show error message to user
    console.error(message);
    // You can implement a proper error display here
  }

  handleOutsideClick(event) {
    if (this.sidebar.classList.contains('advanced-filters__sidebar--open') &&
        !this.contains(event.target) &&
        !event.target.classList.contains('advanced-filters__overlay')) {
      this.closeSidebar();
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.sidebar.classList.contains('advanced-filters__sidebar--open')) {
      this.closeSidebar();
    }
  }

  // Public methods for external control
  getCurrentFilters() {
    return Array.from(this.currentFilters.entries());
  }

  setFilter(filterType, value, checked = true) {
    if (checked) {
      this.currentFilters.set(`${filterType}:${value}`, { type: filterType, value, label: this.getFilterLabel(filterType, value) });
    } else {
      this.currentFilters.delete(`${filterType}:${value}`);
    }
    this.updateActiveFilters();
  }

  clearFilters() {
    this.clearAllFilters();
  }
}

// Global manager for advanced filters
class AdvancedFiltersManager {
  constructor() {
    this.components = new Map();
    this.init();
  }

  init() {
    // Initialize existing components
    document.querySelectorAll('advanced-filters').forEach(component => {
      this.registerComponent(component);
    });

    // Watch for new components
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'ADVANCED-FILTERS') {
              this.registerComponent(node);
            }
            node.querySelectorAll('advanced-filters').forEach(component => {
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

  applyFiltersToAll(filters) {
    this.components.forEach(component => {
      filters.forEach(([filterType, value, checked]) => {
        component.setFilter(filterType, value, checked);
      });
    });
  }
}

// Initialize the manager when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    customElements.define('advanced-filters', AdvancedFilters);
    window.advancedFiltersManager = new AdvancedFiltersManager();
  });
} else {
  customElements.define('advanced-filters', AdvancedFilters);
  window.advancedFiltersManager = new AdvancedFiltersManager();
} 