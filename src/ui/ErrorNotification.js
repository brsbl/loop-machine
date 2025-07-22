/**
 * Error notification component for displaying audio loading errors
 */
export class ErrorNotification {
  constructor() {
    this.container = null;
    this.notifications = [];
  }

  /**
   * Initialize the notification container
   */
  init() {
    this.container = document.createElement('div');
    this.container.className = 'error-notifications';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * Show an error notification
   * @param {string} title 
   * @param {string} message 
   * @param {Object} options - { persistent: boolean, actions: Array }
   */
  show(title, message, options = {}) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
      background: #f44336;
      color: white;
      padding: 16px;
      margin-bottom: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;

    // Title
    const titleEl = document.createElement('div');
    titleEl.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
    `;
    titleEl.textContent = title;

    // Message
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      font-size: 14px;
      margin-bottom: ${options.actions ? '12px' : '0'};
    `;
    messageEl.textContent = message;

    // Actions
    if (options.actions) {
      const actionsEl = document.createElement('div');
      actionsEl.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      `;

      options.actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.label;
        button.style.cssText = `
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        `;
        button.addEventListener('click', () => {
          action.handler();
          if (!options.persistent) {
            this.remove(notification);
          }
        });
        actionsEl.appendChild(button);
      });

      notification.appendChild(titleEl);
      notification.appendChild(messageEl);
      notification.appendChild(actionsEl);
    } else {
      notification.appendChild(titleEl);
      notification.appendChild(messageEl);
    }

    // Close button for persistent notifications
    if (!options.persistent) {
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 24px;
      `;
      closeBtn.addEventListener('click', () => this.remove(notification));
      notification.appendChild(closeBtn);
      notification.style.position = 'relative';
      notification.style.paddingRight = '40px';
    }

    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Auto-remove after 5 seconds if not persistent
    if (!options.persistent) {
      setTimeout(() => this.remove(notification), 5000);
    }

    return notification;
  }

  /**
   * Show a warning notification
   * @param {string} title 
   * @param {string} message 
   * @param {Object} options 
   */
  showWarning(title, message, options = {}) {
    const notification = this.show(title, message, options);
    if (notification) {
      notification.style.background = '#ff9800';
    }
    return notification;
  }

  /**
   * Remove a notification
   * @param {HTMLElement} notification 
   */
  remove(notification) {
    if (notification && notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
          this.notifications.splice(index, 1);
        }
      }, 300);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach(notification => this.remove(notification));
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);