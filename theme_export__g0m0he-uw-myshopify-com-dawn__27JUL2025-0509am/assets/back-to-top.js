/**
 * Back to Top Button Component
 * Provides smooth scrolling back to top functionality with enhanced UX
 */

class BackToTop extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector('[data-back-to-top-button]');
    this.scrollThreshold = 300;
    this.scrollDuration = 800;
    this.isScrolling = false;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkScrollPosition();
  }

  bindEvents() {
    // Scroll event listener
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Click event listener
    this.button.addEventListener('click', this.handleClick.bind(this));
    
    // Keyboard event listener
    this.button.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Resize event listener for responsive behavior
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
  }

  handleScroll() {
    if (!this.isScrolling) {
      requestAnimationFrame(() => {
        this.checkScrollPosition();
      });
    }
  }

  checkScrollPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > this.scrollThreshold) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    if (!this.classList.contains('is-visible')) {
      this.classList.add('is-visible');
      this.button.setAttribute('aria-hidden', 'false');
    }
  }

  hide() {
    if (this.classList.contains('is-visible')) {
      this.classList.remove('is-visible');
      this.button.setAttribute('aria-hidden', 'true');
    }
  }

  handleClick(event) {
    event.preventDefault();
    this.scrollToTop();
  }

  handleKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.scrollToTop();
    }
  }

  handleResize() {
    // Recalculate scroll threshold based on viewport height
    this.scrollThreshold = Math.max(300, window.innerHeight * 0.3);
  }

  scrollToTop() {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    this.button.classList.add('is-loading');
    
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const startTime = performance.now();
    
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.scrollDuration, 1);
      const easedProgress = easeInOutCubic(progress);
      
      const currentPosition = startPosition - (startPosition * easedProgress);
      window.scrollTo(0, currentPosition);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        this.isScrolling = false;
        this.button.classList.remove('is-loading');
        
        // Focus management for accessibility
        this.button.focus();
        
        // Announce to screen readers
        this.announceScrollComplete();
      }
    };
    
    requestAnimationFrame(animateScroll);
  }

  announceScrollComplete() {
    // Create a temporary element to announce the scroll completion
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = this.button.getAttribute('aria-label') + ' - ' + 
      (window.innerWidth > 480 ? 'تم العودة إلى أعلى الصفحة' : 'تم العودة للأعلى');
    
    document.body.appendChild(announcement);
    
    // Remove the announcement after a short delay
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }

  // Public method to programmatically scroll to top
  scrollToTopProgrammatically() {
    this.scrollToTop();
  }

  // Public method to show/hide the button
  setVisibility(visible) {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  // Cleanup method
  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    this.button.removeEventListener('click', this.handleClick);
    this.button.removeEventListener('keydown', this.handleKeydown);
  }
}

// Register the custom element
customElements.define('back-to-top', BackToTop);

// Export for potential external use
window.BackToTop = BackToTop; 