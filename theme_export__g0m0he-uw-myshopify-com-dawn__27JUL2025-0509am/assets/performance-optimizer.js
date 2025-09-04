/**
 * Performance Optimizer
 * Advanced performance optimizations based on awesome-shopify best practices
 */

class PerformanceOptimizer extends HTMLElement {
  constructor() {
    super();
    this.lazyLoadThreshold = parseInt(this.dataset.lazyLoadThreshold) || 200;
    this.enablePerformanceMonitoring = this.dataset.enablePerformanceMonitoring === 'true';
    this.observer = null;
    this.performanceMetrics = {};
    
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupResourceHints();
    this.setupPerformanceMonitoring();
    this.optimizeImages();
    this.setupIntersectionObserver();
  }

  setupLazyLoading() {
    const lazyElements = this.querySelectorAll('.lazy-load');
    
    if (lazyElements.length === 0) return;

    // Create intersection observer for lazy loading
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: `${this.lazyLoadThreshold}px`
    });

    // Observe all lazy elements
    lazyElements.forEach(element => {
      this.observer.observe(element);
    });
  }

  loadElement(element) {
    if (element.tagName === 'IMG') {
      this.loadImage(element);
    } else if (element.tagName === 'VIDEO') {
      this.loadVideo(element);
    }
  }

  loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;
    
    if (src) {
      img.src = src;
      if (srcset) {
        img.srcset = srcset;
      }
      
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        this.dispatchEvent(new CustomEvent('imageLoaded', { detail: { element: img } }));
      });
    }
  }

  loadVideo(video) {
    const src = video.dataset.src;
    const source = video.querySelector('source');
    
    if (src) {
      video.src = src;
      if (source) {
        source.src = src;
      }
      
      video.addEventListener('loadeddata', () => {
        video.classList.add('loaded');
        this.dispatchEvent(new CustomEvent('videoLoaded', { detail: { element: video } }));
      });
    }
  }

  setupResourceHints() {
    // Preload critical resources
    this.preloadResource('{{ "base.css" | asset_url }}', 'style');
    this.preloadResource('{{ "global.js" | asset_url }}', 'script');
    
    // DNS prefetch for external domains
    this.dnsPrefetch('//cdn.shopify.com');
    this.dnsPrefetch('//fonts.googleapis.com');
  }

  preloadResource(href, as) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  }

  dnsPrefetch(href) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  }

  setupPerformanceMonitoring() {
    if (!this.enablePerformanceMonitoring) return;

    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor resource loading
    this.monitorResourceLoading();
    
    // Monitor user interactions
    this.monitorUserInteractions();
  }

  monitorCoreWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.performanceMetrics.fcp = entry.startTime;
            this.updateMetric('fcp', entry.startTime);
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.performanceMetrics.lcp = entry.startTime;
          this.updateMetric('lcp', entry.startTime);
        }
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.performanceMetrics.fid = entry.processingStart - entry.startTime;
          this.updateMetric('fid', this.performanceMetrics.fid);
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.performanceMetrics.cls = clsValue;
            this.updateMetric('cls', clsValue);
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.initiatorType === 'img' || entry.initiatorType === 'css' || entry.initiatorType === 'script') {
            this.logResourceTiming(entry);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  monitorUserInteractions() {
    let firstInteraction = true;
    
    ['click', 'keydown', 'scroll', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (firstInteraction) {
          this.performanceMetrics.firstInteraction = performance.now();
          firstInteraction = false;
        }
      }, { once: true, passive: true });
    });
  }

  updateMetric(metric, value) {
    const metricElement = this.querySelector(`[data-metric="${metric}"] span`);
    if (metricElement) {
      metricElement.textContent = `${value.toFixed(2)}ms`;
    }
  }

  logResourceTiming(entry) {
    console.log(`Resource: ${entry.name}, Duration: ${entry.duration}ms, Size: ${entry.transferSize} bytes`);
  }

  optimizeImages() {
    const images = this.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" if not already present
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add decoding="async" for better performance
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Add fetchpriority for critical images
      if (img.classList.contains('critical')) {
        img.setAttribute('fetchpriority', 'high');
      }
    });
  }

  setupIntersectionObserver() {
    // Monitor when elements come into view for analytics
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.trackElementView(entry.target);
        }
      });
    }, { threshold: 0.1 });

    // Observe all trackable elements
    this.querySelectorAll('[data-track-view]').forEach(element => {
      observer.observe(element);
    });
  }

  trackElementView(element) {
    const eventName = element.dataset.trackView || 'element_viewed';
    const eventData = {
      element: element.tagName,
      id: element.id,
      classes: element.className,
      timestamp: Date.now()
    };

    // Dispatch custom event for analytics
    this.dispatchEvent(new CustomEvent(eventName, { detail: eventData }));
    
    // Send to analytics if configured
    if (window.gtag) {
      gtag('event', eventName, eventData);
    }
  }

  // Public methods for external use
  getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  forceLoadElement(element) {
    this.loadElement(element);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Register the custom element
customElements.define('performance-optimizer', PerformanceOptimizer);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceOptimizer;
} 