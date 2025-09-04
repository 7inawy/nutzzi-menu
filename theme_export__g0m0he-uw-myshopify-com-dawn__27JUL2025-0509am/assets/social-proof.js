class SocialProof extends HTMLElement {
  constructor() {
    super();
    this.layout = 'grid';
    this.autoplay = false;
    this.autoplaySpeed = 5000;
    this.showArrows = true;
    this.showDots = true;
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.autoplayTimer = null;
    this.isAnimating = false;
    
    this.slider = this.querySelector('.social-proof__slider');
    this.sliderList = this.querySelector('.social-proof__slider .social-proof__list');
    this.slides = this.querySelectorAll('.social-proof__slider .social-proof__item');
    this.arrows = this.querySelectorAll('.social-proof__arrow');
    this.dots = this.querySelectorAll('.social-proof__dot');
    this.prevArrow = this.querySelector('.social-proof__arrow--prev');
    this.nextArrow = this.querySelector('.social-proof__arrow--next');
  }

  connectedCallback() {
    this.initializeSlider();
    this.bindEvents();
  }

  disconnectedCallback() {
    this.stopAutoplay();
    this.removeEventListeners();
  }

  initializeSlider() {
    // Get configuration from data attributes
    this.layout = this.dataset.layout || 'grid';
    this.autoplay = this.dataset.autoplay === 'true';
    this.autoplaySpeed = parseInt(this.dataset.autoplaySpeed) * 1000 || 5000;
    this.showArrows = this.dataset.showArrows === 'true';
    this.showDots = this.dataset.showDots === 'true';

    // Only initialize slider functionality if layout is slider
    if (this.layout === 'slider' && this.slider) {
      this.totalSlides = this.slides.length;
      this.updateSliderState();
      
      if (this.autoplay) {
        this.startAutoplay();
      }
    }
  }

  bindEvents() {
    if (this.layout === 'slider') {
      // Arrow navigation
      if (this.prevArrow) {
        this.prevArrow.addEventListener('click', () => this.prevSlide());
      }
      
      if (this.nextArrow) {
        this.nextArrow.addEventListener('click', () => this.nextSlide());
      }

      // Dot navigation
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => this.goToSlide(index));
      });

      // Keyboard navigation
      this.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.prevSlide();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.nextSlide();
        }
      });

      // Touch/swipe support
      this.addTouchSupport();

      // Pause autoplay on hover
      if (this.autoplay) {
        this.addEventListener('mouseenter', () => this.stopAutoplay());
        this.addEventListener('mouseleave', () => this.startAutoplay());
      }

      // Intersection Observer for autoplay
      this.setupIntersectionObserver();
    }
  }

  removeEventListeners() {
    if (this.prevArrow) {
      this.prevArrow.removeEventListener('click', () => this.prevSlide());
    }
    
    if (this.nextArrow) {
      this.nextArrow.removeEventListener('click', () => this.nextSlide());
    }

    this.dots.forEach((dot) => {
      dot.removeEventListener('click', () => this.goToSlide());
    });
  }

  updateSliderState() {
    if (!this.sliderList) return;

    // Update slider position
    const slideWidth = 100 / this.getSlidesPerView();
    this.sliderList.style.transform = `translateX(-${this.currentSlide * slideWidth}%)`;

    // Update arrows state
    if (this.prevArrow) {
      this.prevArrow.disabled = this.currentSlide === 0;
      this.prevArrow.setAttribute('aria-disabled', this.currentSlide === 0);
    }
    
    if (this.nextArrow) {
      this.nextArrow.disabled = this.currentSlide >= this.totalSlides - this.getSlidesPerView();
      this.nextArrow.setAttribute('aria-disabled', this.currentSlide >= this.totalSlides - this.getSlidesPerView());
    }

    // Update dots state
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('social-proof__dot--active', index === this.currentSlide);
      dot.setAttribute('aria-current', index === this.currentSlide ? 'true' : 'false');
    });

    // Dispatch slide change event
    this.dispatchEvent(new CustomEvent('slide-changed', {
      detail: { 
        currentSlide: this.currentSlide,
        totalSlides: this.totalSlides,
        sectionId: this.dataset.section
      }
    }));
  }

  getSlidesPerView() {
    if (window.innerWidth >= 750) {
      return Math.min(parseInt(this.style.getPropertyValue('--social-proof-columns') || 3), this.totalSlides);
    }
    return 1;
  }

  prevSlide() {
    if (this.isAnimating || this.currentSlide === 0) return;
    
    this.currentSlide = Math.max(0, this.currentSlide - 1);
    this.updateSliderState();
    this.resetAutoplay();
  }

  nextSlide() {
    if (this.isAnimating || this.currentSlide >= this.totalSlides - this.getSlidesPerView()) return;
    
    this.currentSlide = Math.min(this.totalSlides - this.getSlidesPerView(), this.currentSlide + 1);
    this.updateSliderState();
    this.resetAutoplay();
  }

  goToSlide(index) {
    if (this.isAnimating || index < 0 || index >= this.totalSlides) return;
    
    this.currentSlide = index;
    this.updateSliderState();
    this.resetAutoplay();
  }

  startAutoplay() {
    if (!this.autoplay || this.autoplayTimer) return;
    
    this.autoplayTimer = setInterval(() => {
      if (this.currentSlide >= this.totalSlides - this.getSlidesPerView()) {
        this.currentSlide = 0; // Loop back to first slide
      } else {
        this.currentSlide++;
      }
      this.updateSliderState();
    }, this.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  resetAutoplay() {
    if (this.autoplay) {
      this.stopAutoplay();
      this.startAutoplay();
    }
  }

  addTouchSupport() {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      isDragging = false;
    };

    const handleTouchMove = (event) => {
      if (!startX || !startY) return;

      const currentX = event.touches[0].clientX;
      const currentY = event.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isDragging = true;
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event) => {
      if (!isDragging) return;

      const diffX = startX - event.changedTouches[0].clientX;
      const threshold = 50;

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }

      startX = 0;
      startY = 0;
      isDragging = false;
    };

    this.slider.addEventListener('touchstart', handleTouchStart, { passive: true });
    this.slider.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.slider.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (this.autoplay) {
              this.startAutoplay();
            }
          } else {
            this.stopAutoplay();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(this);
  }

  // Public methods for external control
  play() {
    this.startAutoplay();
  }

  pause() {
    this.stopAutoplay();
  }

  getCurrentSlide() {
    return this.currentSlide;
  }

  getTotalSlides() {
    return this.totalSlides;
  }
}

// Global manager for social proof components
class SocialProofManager {
  constructor() {
    this.components = new Map();
    this.init();
  }

  init() {
    // Initialize existing components
    document.querySelectorAll('social-proof').forEach(component => {
      this.registerComponent(component);
    });

    // Watch for new components
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'SOCIAL-PROOF') {
              this.registerComponent(node);
            }
            node.querySelectorAll('social-proof').forEach(component => {
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
      
      // Listen for component events
      component.addEventListener('slide-changed', (event) => {
        this.handleSlideChanged(event.detail);
      });
    }
  }

  handleSlideChanged(detail) {
    console.log(`Social proof slide changed: ${detail.currentSlide + 1}/${detail.totalSlides} in section ${detail.sectionId}`);
    // You can add custom analytics or tracking here
  }

  getComponent(sectionId) {
    return this.components.get(sectionId);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  pauseAll() {
    this.components.forEach(component => {
      component.pause();
    });
  }

  playAll() {
    this.components.forEach(component => {
      component.play();
    });
  }
}

// Initialize the manager when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    customElements.define('social-proof', SocialProof);
    window.socialProofManager = new SocialProofManager();
  });
} else {
  customElements.define('social-proof', SocialProof);
  window.socialProofManager = new SocialProofManager();
} 