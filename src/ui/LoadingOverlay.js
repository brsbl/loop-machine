/**
 * Loading overlay component with progress bar and retry functionality
 */
export class LoadingOverlay {
  constructor() {
    this.element = null;
    this.progressBar = null;
    this.statusText = null;
    this.retryButton = null;
    this.onRetry = null;
  }

  /**
   * Create and display the loading overlay
   */
  show() {
    this.create();
    document.body.appendChild(this.element);
  }

  /**
   * Hide the loading overlay
   */
  hide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Create the overlay DOM elements
   */
  create() {
    // Create overlay container
    this.element = document.createElement('div');
    this.element.className = 'loading-overlay';
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'loading-content';
    content.style.cssText = `
      background: #1e1e1e;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      min-width: 300px;
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Loading Audio Samples';
    title.style.cssText = `
      color: #fff;
      margin: 0 0 20px 0;
      font-size: 18px;
    `;

    // Progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 100%;
      height: 20px;
      background: #333;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    `;

    // Progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: #4CAF50;
      transition: width 0.3s ease;
    `;
    progressContainer.appendChild(this.progressBar);

    // Status text
    this.statusText = document.createElement('div');
    this.statusText.style.cssText = `
      color: #888;
      font-size: 14px;
      margin-bottom: 20px;
    `;
    this.statusText.textContent = 'Initializing...';

    // Retry button (hidden by default)
    this.retryButton = document.createElement('button');
    this.retryButton.textContent = 'Retry Failed Samples';
    this.retryButton.style.cssText = `
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: none;
    `;
    this.retryButton.addEventListener('click', () => {
      if (this.onRetry) {
        this.retryButton.disabled = true;
        this.retryButton.textContent = 'Retrying...';
        this.onRetry();
      }
    });

    // Assemble
    content.appendChild(title);
    content.appendChild(progressContainer);
    content.appendChild(this.statusText);
    content.appendChild(this.retryButton);
    this.element.appendChild(content);
  }

  /**
   * Update progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} status - Status message
   */
  updateProgress(progress, status = '') {
    if (this.progressBar) {
      this.progressBar.style.width = `${progress}%`;
    }
    if (this.statusText && status) {
      this.statusText.textContent = status;
    }
  }

  /**
   * Show error state with retry option
   * @param {string} message 
   */
  showError(message) {
    if (this.statusText) {
      this.statusText.textContent = message;
      this.statusText.style.color = '#f44336';
    }
    if (this.retryButton) {
      this.retryButton.style.display = 'inline-block';
      this.retryButton.disabled = false;
      this.retryButton.textContent = 'Retry Failed Samples';
    }
  }

  /**
   * Show partial success state
   * @param {number} loaded 
   * @param {number} total 
   */
  showPartialSuccess(loaded, total) {
    if (this.statusText) {
      this.statusText.textContent = `Loaded ${loaded}/${total} samples. Using fallback sounds for failed samples.`;
      this.statusText.style.color = '#ff9800';
    }
    if (this.retryButton) {
      this.retryButton.style.display = 'inline-block';
      this.retryButton.style.background = '#ff9800';
      this.retryButton.textContent = 'Try Loading Original Samples Again';
    }
  }
}