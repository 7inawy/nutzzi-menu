/**
 * Infinite Scroll Component
 * Provides smooth infinite scrolling for product collections with enhanced UX
 */

class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector('[data-infinite-scroll-container]');
    this.loading = this.querySelector('[data-infinite-scroll-loading]');
    this.loadMore = this.querySelector('[data-infinite-scroll-load-more]');
    this.loadMoreButton = this.querySelector('[data-infinite-scroll-load-more-button]');
    this.end = this.querySelector('[data-infinite-scroll-end]');
    this.error = this.querySelector('[data-infinite-scroll-error]');
    this.progress = this.querySelector('[data-infinite-scroll-progress]');
    this.progressFill = this.querySelector('[data-infinite-scroll-progress-fill]');
    this.progressText = this.querySelector('[data-infinite-scroll-progress-text]');
    this.remainingCount = this.querySelector('[data-infinite-scroll-remaining-count]');
    
    // Configuration
    this.currentPage = parseInt(this.dataset.currentPage) || 1;
    this.totalPages = parseInt(this.dataset.totalPages) || 1;
    this.productsPerPage = parseInt(this.dataset.productsPerPage) || 24;
    this.totalProducts = parseInt(this.dataset.totalProducts) || 0;
    this.collectionHandle = this.dataset.collection;
    this.baseUrl = this.dataset.url;
    this.autoLoad = this.dataset.autoLoad === 'true';
    this.showLoadingIndicator = this.dataset.showLoadingIndicator === 'true';
    this.showEndMessage = this.dataset.showEndMessage === 'true';
    this.scrollThreshold = parseInt(this.dataset.scrollThreshold) || 200;
    this.loadingDelay = parseInt(this.dataset.loadingDelay) || 500;
    
    // State
    this.isLoading = false;
    this.hasReachedEnd = false;
    this.hasError = false;
    this.observer = null;
    this.loadingTimeout = null;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateProgress();
    this.updateRemainingCount();
    
    if (this.autoLoad) {
      this.setupIntersectionObserver();
    }
  }

  bindEvents() {
    // Load more button click
    if (this.loadMoreButton) {
      this.loadMoreButton.addEventListener('click', this.handleLoadMore.bind(this));
    }
    
    // Retry button click
    const retryButton = this.querySelector('[data-infinite-scroll-retry]');
    if (retryButton) {
      retryButton.addEventListener('click', this.handleRetry.bind(this));
    }
    
    // Reset button click
    const resetButton = this.querySelector('[data-infinite-scroll-reset]');
    if (resetButton) {
      resetButton.addEventListener('click', this.handleReset.bind(this));
    }
    
    // Scroll event for auto-load
    if (this.autoLoad) {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }
  }

  setupIntersectionObserver() {
    // Create a sentinel element for intersection observation
    this.sentinel = document.createElement('div');
    this.sentinel.style.height = '1px';
    this.sentinel.style.width = '100%';
    this.appendChild(this.sentinel);
    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.isLoading && !this.hasReachedEnd) {
            this.loadMoreProducts();
          }
        });
      },
      {
        rootMargin: `${this.scrollThreshold}px`
      }
    );
    
    this.observer.observe(this.sentinel);
  }

  handleScroll() {
    if (this.isLoading || this.hasReachedEnd) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - this.scrollThreshold) {
      this.loadMoreProducts();
    }
  }

  handleLoadMore() {
    if (!this.isLoading && !this.hasReachedEnd) {
      this.loadMoreProducts();
    }
  }

  handleRetry() {
    this.hasError = false;
    this.hideError();
    this.loadMoreProducts();
  }

  handleReset() {
    // Reset to first page
    this.currentPage = 1;
    this.hasReachedEnd = false;
    this.hasError = false;
    this.hideEnd();
    this.hideError();
    this.updateProgress();
    this.updateRemainingCount();
    
    // Reload the page to show first page
    window.location.reload();
  }

  async loadMoreProducts() {
    if (this.isLoading || this.hasReachedEnd) return;
    
    this.isLoading = true;
    this.showLoading();
    
    try {
      // Add loading delay for better UX
      await this.delay(this.loadingDelay);
      
      const nextPage = this.currentPage + 1;
      const url = this.buildUrl(nextPage);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract products from the response
      const newProducts = doc.querySelectorAll('.card-product');
      
      if (newProducts.length === 0) {
        this.hasReachedEnd = true;
        this.hideLoading();
        this.showEnd();
        return;
      }
      
      // Add new products to the container
      newProducts.forEach(product => {
        const clonedProduct = product.cloneNode(true);
        this.container.appendChild(clonedProduct);
      });
      
      // Update state
      this.currentPage = nextPage;
      this.totalProducts += newProducts.length;
      
      // Update UI
      this.updateProgress();
      this.updateRemainingCount();
      
      // Check if we've reached the end
      if (this.currentPage >= this.totalPages) {
        this.hasReachedEnd = true;
        this.showEnd();
      }
      
      // Trigger custom event
      this.dispatchEvent(new CustomEvent('productsLoaded', {
        detail: {
          products: newProducts,
          currentPage: this.currentPage,
          totalProducts: this.totalProducts
        }
      }));
      
    } catch (error) {
      console.error('Error loading more products:', error);
      this.hasError = true;
      this.showError();
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  buildUrl(page) {
    const url = new URL(this.baseUrl);
    url.searchParams.set('page', page);
    return url.toString();
  }

  showLoading() {
    if (this.showLoadingIndicator && this.loading) {
      this.loading.classList.add('is-visible');
    }
    
    if (this.loadMoreButton) {
      this.loadMoreButton.classList.add('is-loading');
    }
  }

  hideLoading() {
    if (this.loading) {
      this.loading.classList.remove('is-visible');
    }
    
    if (this.loadMoreButton) {
      this.loadMoreButton.classList.remove('is-loading');
    }
  }

  showEnd() {
    if (this.showEndMessage && this.end) {
      this.end.classList.add('is-visible');
    }
    
    if (this.loadMore) {
      this.loadMore.classList.remove('is-visible');
    }
  }

  hideEnd() {
    if (this.end) {
      this.end.classList.remove('is-visible');
    }
  }

  showError() {
    if (this.error) {
      this.error.classList.add('is-visible');
    }
  }

  hideError() {
    if (this.error) {
      this.error.classList.remove('is-visible');
    }
  }

  updateProgress() {
    if (this.progress && this.progressFill) {
      const progress = (this.currentPage / this.totalPages) * 100;
      this.progressFill.style.width = `${progress}%`;
      
      if (this.progressText) {
        this.progressText.textContent = `الصفحة ${this.currentPage} من ${this.totalPages}`;
      }
    }
  }

  updateRemainingCount() {
    if (this.remainingCount) {
      const remaining = this.totalProducts - (this.currentPage * this.productsPerPage);
      if (remaining > 0) {
        this.remainingCount.textContent = `(${remaining} منتج متبقي)`;
        this.remainingCount.style.display = 'inline';
      } else {
        this.remainingCount.style.display = 'none';
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods
  loadMore() {
    this.handleLoadMore();
  }

  reset() {
    this.handleReset();
  }

  retry() {
    this.handleRetry();
  }

  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
    }
    
    window.removeEventListener('scroll', this.handleScroll);
    
    if (this.loadMoreButton) {
      this.loadMoreButton.removeEventListener('click', this.handleLoadMore);
    }
  }
}

// Register the custom element
customElements.define('infinite-scroll', InfiniteScroll);

// Export for potential external use
window.InfiniteScroll = InfiniteScroll; 