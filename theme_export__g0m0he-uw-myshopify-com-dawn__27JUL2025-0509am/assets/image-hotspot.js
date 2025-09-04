/**
 * Image Hotspot Component
 * Provides interactive hotspots on images with tooltips and product information
 */

class ImageHotspot extends HTMLElement {
  constructor() {
    super();
    this.hotspots = this.querySelectorAll('[data-hotspot]');
    this.hotspotButtons = this.querySelectorAll('[data-hotspot-button]');
    this.tooltips = this.querySelectorAll('[data-tooltip]');
    this.tooltipCloseButtons = this.querySelectorAll('[data-tooltip-close]');
    this.legendButtons = this.querySelectorAll('[data-legend-button]');
    this.toggleAllButton = this.querySelector('[data-toggle-all-hotspots]');
    this.toggleRotationButton = this.querySelector('[data-toggle-rotation]');
    this.quickAddButtons = this.querySelectorAll('[data-quick-add]');
    
    // Configuration
    this.hotspotSize = parseInt(this.dataset.hotspotSize) || 40;
    this.tooltipWidth = parseInt(this.dataset.tooltipWidth) || 300;
    this.animationDuration = parseInt(this.dataset.animationDuration) || 300;
    this.showLabels = this.dataset.showLabels === 'true';
    this.showTooltips = this.dataset.showTooltips === 'true';
    this.autoRotate = this.dataset.autoRotate === 'true';
    this.rotationSpeed = parseInt(this.dataset.rotationSpeed) || 5;
    
    // State
    this.activeHotspot = null;
    this.isRotating = false;
    this.rotationInterval = null;
    this.currentRotationIndex = 0;
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupHotspots();
    this.setupTooltips();
    
    if (this.autoRotate) {
      this.startRotation();
    }
  }

  bindEvents() {
    // Hotspot button clicks
    this.hotspotButtons.forEach(button => {
      button.addEventListener('click', this.handleHotspotClick.bind(this));
      button.addEventListener('keydown', this.handleHotspotKeydown.bind(this));
    });
    
    // Tooltip close buttons
    this.tooltipCloseButtons.forEach(button => {
      button.addEventListener('click', this.handleTooltipClose.bind(this));
    });
    
    // Legend button clicks
    this.legendButtons.forEach(button => {
      button.addEventListener('click', this.handleLegendClick.bind(this));
    });
    
    // Control buttons
    if (this.toggleAllButton) {
      this.toggleAllButton.addEventListener('click', this.handleToggleAll.bind(this));
    }
    
    if (this.toggleRotationButton) {
      this.toggleRotationButton.addEventListener('click', this.handleToggleRotation.bind(this));
    }
    
    // Quick add buttons
    this.quickAddButtons.forEach(button => {
      button.addEventListener('click', this.handleQuickAdd.bind(this));
    });
    
    // Click outside to close tooltips
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    
    // Escape key to close tooltips
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
    
    // Resize handling
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
  }

  setupHotspots() {
    this.hotspots.forEach((hotspot, index) => {
      // Add animation delay for staggered appearance
      hotspot.style.animationDelay = `${index * 0.1}s`;
      
      // Ensure hotspots are positioned correctly
      this.updateHotspotPosition(hotspot);
    });
  }

  setupTooltips() {
    this.tooltips.forEach(tooltip => {
      // Position tooltips to avoid going off-screen
      this.positionTooltip(tooltip);
    });
  }

  handleHotspotClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const hotspot = button.closest('[data-hotspot]');
    const hotspotId = hotspot.dataset.hotspotId;
    
    if (this.activeHotspot === hotspotId) {
      this.closeHotspot(hotspotId);
    } else {
      this.openHotspot(hotspotId);
    }
  }

  handleHotspotKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleHotspotClick(event);
    }
  }

  handleTooltipClose(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const tooltip = button.closest('[data-tooltip]');
    const hotspot = tooltip.closest('[data-hotspot]');
    const hotspotId = hotspot.dataset.hotspotId;
    
    this.closeHotspot(hotspotId);
  }

  handleLegendClick(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const hotspotId = button.dataset.hotspotId;
    
    if (this.activeHotspot === hotspotId) {
      this.closeHotspot(hotspotId);
    } else {
      this.openHotspot(hotspotId);
    }
  }

  handleToggleAll(event) {
    event.preventDefault();
    
    if (this.activeHotspot) {
      this.closeAllHotspots();
    } else {
      this.openAllHotspots();
    }
  }

  handleToggleRotation(event) {
    event.preventDefault();
    
    if (this.isRotating) {
      this.stopRotation();
    } else {
      this.startRotation();
    }
  }

  handleQuickAdd(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const productId = button.dataset.productId;
    
    // Trigger quick add functionality
    this.triggerQuickAdd(productId);
  }

  handleOutsideClick(event) {
    if (!this.contains(event.target)) {
      this.closeAllHotspots();
    }
  }

  handleEscapeKey(event) {
    if (event.key === 'Escape') {
      this.closeAllHotspots();
    }
  }

  handleResize() {
    // Reposition tooltips on resize
    this.tooltips.forEach(tooltip => {
      if (tooltip.classList.contains('is-visible')) {
        this.positionTooltip(tooltip);
      }
    });
  }

  openHotspot(hotspotId) {
    // Close any currently open hotspot
    if (this.activeHotspot && this.activeHotspot !== hotspotId) {
      this.closeHotspot(this.activeHotspot);
    }
    
    const hotspot = this.querySelector(`[data-hotspot-id="${hotspotId}"]`);
    const tooltip = hotspot.querySelector('[data-tooltip]');
    const button = hotspot.querySelector('[data-hotspot-button]');
    const legendButton = this.querySelector(`[data-legend-button][data-hotspot-id="${hotspotId}"]`);
    
    if (hotspot && tooltip && this.showTooltips) {
      // Update hotspot state
      hotspot.classList.add('is-active');
      button.setAttribute('aria-expanded', 'true');
      
      // Show tooltip
      tooltip.classList.add('is-visible');
      
      // Update legend button
      if (legendButton) {
        legendButton.classList.add('is-active');
      }
      
      // Update active hotspot
      this.activeHotspot = hotspotId;
      
      // Position tooltip
      this.positionTooltip(tooltip);
      
      // Trigger custom event
      this.dispatchEvent(new CustomEvent('hotspotOpened', {
        detail: { hotspotId, hotspot }
      }));
    }
  }

  closeHotspot(hotspotId) {
    const hotspot = this.querySelector(`[data-hotspot-id="${hotspotId}"]`);
    const tooltip = hotspot?.querySelector('[data-tooltip]');
    const button = hotspot?.querySelector('[data-hotspot-button]');
    const legendButton = this.querySelector(`[data-legend-button][data-hotspot-id="${hotspotId}"]`);
    
    if (hotspot && tooltip) {
      // Update hotspot state
      hotspot.classList.remove('is-active');
      button.setAttribute('aria-expanded', 'false');
      
      // Hide tooltip
      tooltip.classList.remove('is-visible');
      
      // Update legend button
      if (legendButton) {
        legendButton.classList.remove('is-active');
      }
      
      // Clear active hotspot
      if (this.activeHotspot === hotspotId) {
        this.activeHotspot = null;
      }
      
      // Trigger custom event
      this.dispatchEvent(new CustomEvent('hotspotClosed', {
        detail: { hotspotId, hotspot }
      }));
    }
  }

  openAllHotspots() {
    this.hotspots.forEach(hotspot => {
      const hotspotId = hotspot.dataset.hotspotId;
      this.openHotspot(hotspotId);
    });
  }

  closeAllHotspots() {
    this.hotspots.forEach(hotspot => {
      const hotspotId = hotspot.dataset.hotspotId;
      this.closeHotspot(hotspotId);
    });
  }

  startRotation() {
    if (this.isRotating) return;
    
    this.isRotating = true;
    this.currentRotationIndex = 0;
    
    if (this.toggleRotationButton) {
      this.toggleRotationButton.textContent = this.toggleRotationButton.getAttribute('data-stop-text') || 'Stop Rotation';
    }
    
    this.rotationInterval = setInterval(() => {
      this.rotateToNextHotspot();
    }, this.rotationSpeed * 1000);
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('rotationStarted'));
  }

  stopRotation() {
    if (!this.isRotating) return;
    
    this.isRotating = false;
    
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
    
    if (this.toggleRotationButton) {
      this.toggleRotationButton.textContent = this.toggleRotationButton.getAttribute('data-start-text') || 'Start Rotation';
    }
    
    // Trigger custom event
    this.dispatchEvent(new CustomEvent('rotationStopped'));
  }

  rotateToNextHotspot() {
    const hotspotIds = Array.from(this.hotspots).map(hotspot => hotspot.dataset.hotspotId);
    
    if (hotspotIds.length === 0) return;
    
    // Close current hotspot
    if (this.activeHotspot) {
      this.closeHotspot(this.activeHotspot);
    }
    
    // Move to next hotspot
    this.currentRotationIndex = (this.currentRotationIndex + 1) % hotspotIds.length;
    const nextHotspotId = hotspotIds[this.currentRotationIndex];
    
    // Open next hotspot
    this.openHotspot(nextHotspotId);
  }

  positionTooltip(tooltip) {
    const hotspot = tooltip.closest('[data-hotspot]');
    const hotspotRect = hotspot.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = this.getBoundingClientRect();
    
    // Calculate initial position
    let left = 50; // Default center position
    
    // Check if tooltip would go off-screen
    const tooltipWidth = this.tooltipWidth;
    const hotspotLeft = parseFloat(hotspot.style.left);
    
    // Calculate left position to keep tooltip within viewport
    const minLeft = (tooltipWidth / 2) / containerRect.width * 100;
    const maxLeft = 100 - minLeft;
    
    if (hotspotLeft < minLeft) {
      left = minLeft;
    } else if (hotspotLeft > maxLeft) {
      left = maxLeft;
    } else {
      left = hotspotLeft;
    }
    
    // Apply position
    tooltip.style.left = `${left}%`;
  }

  updateHotspotPosition(hotspot) {
    // Ensure hotspot is within bounds
    const x = parseFloat(hotspot.style.left);
    const y = parseFloat(hotspot.style.top);
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    hotspot.style.left = `${clampedX}%`;
    hotspot.style.top = `${clampedY}%`;
  }

  triggerQuickAdd(productId) {
    // Dispatch custom event for quick add functionality
    this.dispatchEvent(new CustomEvent('quickAdd', {
      detail: { productId }
    }));
    
    // Also try to use existing quick add functionality if available
    if (window.QuickAdd) {
      window.QuickAdd.addToCart(productId);
    }
  }

  // Public methods
  openHotspotById(hotspotId) {
    this.openHotspot(hotspotId);
  }

  closeHotspotById(hotspotId) {
    this.closeHotspot(hotspotId);
  }

  startAutoRotation() {
    this.startRotation();
  }

  stopAutoRotation() {
    this.stopRotation();
  }

  // Cleanup
  destroy() {
    this.stopRotation();
    
    this.hotspotButtons.forEach(button => {
      button.removeEventListener('click', this.handleHotspotClick);
      button.removeEventListener('keydown', this.handleHotspotKeydown);
    });
    
    this.tooltipCloseButtons.forEach(button => {
      button.removeEventListener('click', this.handleTooltipClose);
    });
    
    this.legendButtons.forEach(button => {
      button.removeEventListener('click', this.handleLegendClick);
    });
    
    if (this.toggleAllButton) {
      this.toggleAllButton.removeEventListener('click', this.handleToggleAll);
    }
    
    if (this.toggleRotationButton) {
      this.toggleRotationButton.removeEventListener('click', this.handleToggleRotation);
    }
    
    this.quickAddButtons.forEach(button => {
      button.removeEventListener('click', this.handleQuickAdd);
    });
    
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
    window.removeEventListener('resize', this.handleResize);
  }
}

// Register the custom element
customElements.define('image-hotspot', ImageHotspot);

// Export for potential external use
window.ImageHotspot = ImageHotspot; 