class CountdownTimer extends HTMLElement {
  constructor() {
    super();
    this.endDate = null;
    this.timezone = 'UTC';
    this.showDays = true;
    this.showHours = true;
    this.showMinutes = true;
    this.showSeconds = true;
    this.hideWhenExpired = false;
    this.expiredMessage = '';
    this.autoRestart = false;
    this.restartInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.timer = null;
    this.isExpired = false;
    this.initialEndDate = null;
    
    this.daysElement = this.querySelector('[data-days]');
    this.hoursElement = this.querySelector('[data-hours]');
    this.minutesElement = this.querySelector('[data-minutes]');
    this.secondsElement = this.querySelector('[data-seconds]');
    this.progressFillElement = this.querySelector('[data-progress-fill]');
    this.progressTextElement = this.querySelector('[data-progress-text]');
    this.expiredMessageElement = this.querySelector('[data-expired-message]');
  }

  connectedCallback() {
    this.initializeTimer();
    this.startTimer();
  }

  disconnectedCallback() {
    this.stopTimer();
  }

  initializeTimer() {
    // Get configuration from data attributes
    const endDate = this.dataset.endDate;
    const endTime = this.dataset.endTime;
    this.timezone = this.dataset.timezone || 'UTC';
    this.showDays = this.dataset.showDays === 'true';
    this.showHours = this.dataset.showHours === 'true';
    this.showMinutes = this.dataset.showMinutes === 'true';
    this.showSeconds = this.dataset.showSeconds === 'true';
    this.hideWhenExpired = this.dataset.hideWhenExpired === 'true';
    this.expiredMessage = this.dataset.expiredMessage || '';
    this.autoRestart = this.dataset.autoRestart === 'true';
    this.restartInterval = parseInt(this.dataset.restartInterval) * 1000 || 24 * 60 * 60 * 1000;

    // Parse end date and time
    if (endDate) {
      let dateString = endDate;
      if (endTime) {
        dateString += `T${endTime}`;
      }
      
      try {
        this.endDate = new Date(dateString);
        this.initialEndDate = new Date(dateString);
        
        // Adjust for timezone if specified
        if (this.timezone !== 'UTC') {
          const offset = this.getTimezoneOffset(this.timezone);
          this.endDate.setTime(this.endDate.getTime() + offset);
        }
      } catch (error) {
        console.error('Invalid countdown timer date:', error);
        this.hideTimer();
        return;
      }
    } else {
      console.error('No end date specified for countdown timer');
      this.hideTimer();
      return;
    }

    // Hide elements that shouldn't be shown
    this.updateVisibility();
  }

  startTimer() {
    this.updateTimer();
    this.timer = setInterval(() => {
      this.updateTimer();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateTimer() {
    const now = new Date();
    const timeLeft = this.endDate.getTime() - now.getTime();

    if (timeLeft <= 0) {
      this.handleExpired();
      return;
    }

    // Calculate time units
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update display
    this.updateDisplay(days, hours, minutes, seconds);
    this.updateProgress(timeLeft);
  }

  updateDisplay(days, hours, minutes, seconds) {
    if (this.daysElement && this.showDays) {
      this.daysElement.textContent = days.toString().padStart(2, '0');
    }
    
    if (this.hoursElement && this.showHours) {
      this.hoursElement.textContent = hours.toString().padStart(2, '0');
    }
    
    if (this.minutesElement && this.showMinutes) {
      this.minutesElement.textContent = minutes.toString().padStart(2, '0');
    }
    
    if (this.secondsElement && this.showSeconds) {
      this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }
  }

  updateProgress(timeLeft) {
    if (!this.progressFillElement || !this.progressTextElement) return;

    const totalTime = this.initialEndDate.getTime() - new Date(this.initialEndDate.getTime() - this.restartInterval).getTime();
    const elapsedTime = totalTime - timeLeft;
    const progress = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));

    this.progressFillElement.style.width = `${progress}%`;
    this.progressTextElement.textContent = `${Math.round(progress)}%`;
  }

  handleExpired() {
    this.isExpired = true;
    this.stopTimer();

    if (this.expiredMessageElement && this.expiredMessage) {
      this.expiredMessageElement.style.display = 'block';
      this.expiredMessageElement.textContent = this.expiredMessage;
    }

    if (this.hideWhenExpired) {
      this.hideTimer();
    } else {
      // Show expired state
      if (this.daysElement) this.daysElement.textContent = '00';
      if (this.hoursElement) this.hoursElement.textContent = '00';
      if (this.minutesElement) this.minutesElement.textContent = '00';
      if (this.secondsElement) this.secondsElement.textContent = '00';
      
      if (this.progressFillElement) this.progressFillElement.style.width = '100%';
      if (this.progressTextElement) this.progressTextElement.textContent = '100%';
    }

    // Auto restart if enabled
    if (this.autoRestart) {
      setTimeout(() => {
        this.restartTimer();
      }, 5000); // Wait 5 seconds before restarting
    }

    // Dispatch expired event
    this.dispatchEvent(new CustomEvent('countdown-expired', {
      detail: { sectionId: this.dataset.section }
    }));
  }

  restartTimer() {
    if (!this.autoRestart || !this.initialEndDate) return;

    // Set new end date based on restart interval
    this.endDate = new Date(this.initialEndDate.getTime() + this.restartInterval);
    this.isExpired = false;

    // Hide expired message
    if (this.expiredMessageElement) {
      this.expiredMessageElement.style.display = 'none';
    }

    // Show timer again if it was hidden
    if (this.hideWhenExpired) {
      this.style.display = 'block';
    }

    // Restart timer
    this.startTimer();

    // Dispatch restart event
    this.dispatchEvent(new CustomEvent('countdown-restarted', {
      detail: { sectionId: this.dataset.section, newEndDate: this.endDate }
    }));
  }

  updateVisibility() {
    if (!this.showDays && this.daysElement) {
      this.daysElement.closest('.countdown-timer__unit--days').style.display = 'none';
    }
    
    if (!this.showHours && this.hoursElement) {
      this.hoursElement.closest('.countdown-timer__unit--hours').style.display = 'none';
    }
    
    if (!this.showMinutes && this.minutesElement) {
      this.minutesElement.closest('.countdown-timer__unit--minutes').style.display = 'none';
    }
    
    if (!this.showSeconds && this.secondsElement) {
      this.secondsElement.closest('.countdown-timer__unit--seconds').style.display = 'none';
    }
  }

  hideTimer() {
    this.style.display = 'none';
  }

  getTimezoneOffset(timezone) {
    // Simple timezone offset calculation
    // In a production environment, you might want to use a proper timezone library
    const timezoneOffsets = {
      'EST': -5 * 60 * 60 * 1000,
      'CST': -6 * 60 * 60 * 1000,
      'MST': -7 * 60 * 60 * 1000,
      'PST': -8 * 60 * 60 * 1000,
      'GMT': 0,
      'UTC': 0
    };
    
    return timezoneOffsets[timezone] || 0;
  }
}

// Global manager for countdown timers
class CountdownTimerManager {
  constructor() {
    this.timers = new Map();
    this.init();
  }

  init() {
    // Initialize existing timers
    document.querySelectorAll('countdown-timer').forEach(timer => {
      this.registerTimer(timer);
    });

    // Watch for new timers
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'COUNTDOWN-TIMER') {
              this.registerTimer(node);
            }
            node.querySelectorAll('countdown-timer').forEach(timer => {
              this.registerTimer(timer);
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

  registerTimer(timer) {
    const sectionId = timer.dataset.section;
    if (sectionId && !this.timers.has(sectionId)) {
      this.timers.set(sectionId, timer);
      
      // Listen for timer events
      timer.addEventListener('countdown-expired', (event) => {
        this.handleTimerExpired(event.detail.sectionId);
      });
      
      timer.addEventListener('countdown-restarted', (event) => {
        this.handleTimerRestarted(event.detail.sectionId, event.detail.newEndDate);
      });
    }
  }

  handleTimerExpired(sectionId) {
    console.log(`Countdown timer ${sectionId} has expired`);
    // You can add custom logic here for when timers expire
  }

  handleTimerRestarted(sectionId, newEndDate) {
    console.log(`Countdown timer ${sectionId} has restarted with new end date: ${newEndDate}`);
    // You can add custom logic here for when timers restart
  }

  getTimer(sectionId) {
    return this.timers.get(sectionId);
  }

  getAllTimers() {
    return Array.from(this.timers.values());
  }

  pauseAllTimers() {
    this.timers.forEach(timer => {
      timer.stopTimer();
    });
  }

  resumeAllTimers() {
    this.timers.forEach(timer => {
      timer.startTimer();
    });
  }
}

// Initialize the manager when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    customElements.define('countdown-timer', CountdownTimer);
    window.countdownTimerManager = new CountdownTimerManager();
  });
} else {
  customElements.define('countdown-timer', CountdownTimer);
  window.countdownTimerManager = new CountdownTimerManager();
} 