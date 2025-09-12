/**
 * 3D Product Viewer Pro - Main Entry Point
 * Initializes the viewer and sets up global functionality
 */

import { ProductViewer } from './core/viewer.js';

/**
 * Main application class
 */
class App {
  constructor() {
    this.viewer = null;
    this.isInitialized = false;

    // Bind methods
    this.handleViewerError = this.handleViewerError.bind(this);
    this.handleRetryClick = this.handleRetryClick.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('App: Starting initialization...');

      // Get container element
      const container = document.getElementById('viewer-container');
      if (!container) {
        throw new Error('Viewer container not found');
      }

      // Create viewer instance
      this.viewer = new ProductViewer(container, {
        // Custom configuration can be passed here
        development: {
          debug: true,
          verbose: true,
        },
      });

      // Setup event listeners
      this.setupEventListeners();

      // Initialize viewer
      await this.viewer.init();

      // Setup retry button functionality
      this.setupRetryButton();

      this.isInitialized = true;
      console.log('App: Initialization completed successfully');
    } catch (error) {
      console.error('App: Initialization failed:', error);
      this.handleViewerError('initialization', error);
    }
  }

  /**
   * Setup viewer event listeners
   */
  setupEventListeners() {
    if (!this.viewer) return;

    // Initialization events
    this.viewer.addEventListener('initStart', () => {
      console.log('App: Viewer initialization started');
    });

    this.viewer.addEventListener('initComplete', () => {
      console.log('App: Viewer initialization completed');
    });

    // Model loading events
    this.viewer.addEventListener('modelLoaded', event => {
      console.log('App: Model loaded successfully', event.model);
      this.updateLoadingProgress(100);
    });

    // Camera events
    this.viewer.addEventListener('cameraChange', () => {
      // Camera position changed - could trigger analytics here
    });

    this.viewer.addEventListener('cameraReset', () => {
      console.log('App: Camera reset to default position');
    });

    // Control events
    this.viewer.addEventListener('autoRotateToggle', event => {
      console.log(`App: Auto rotate ${event.enabled ? 'enabled' : 'disabled'}`);
    });

    // Material and lighting events
    this.viewer.addEventListener('materialPresetChange', event => {
      console.log(`App: Material preset changed to ${event.preset}`);
    });

    this.viewer.addEventListener('lightIntensityChange', event => {
      console.log(`App: Light intensity changed to ${event.intensity}`);
    });

    // Error handling
    this.viewer.addEventListener('error', this.handleViewerError);

    // Performance monitoring
    this.viewer.addEventListener('performanceWarning', event => {
      console.warn('App: Performance warning:', event.details);
    });
  }

  /**
   * Setup retry button functionality
   */
  setupRetryButton() {
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', this.handleRetryClick);
    }
  }

  /**
   * Handle viewer errors
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleViewerError(context, error) {
    console.error(`App: Viewer error in ${context}:`, error);

    // Show user-friendly error message
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');

    if (errorOverlay && errorMessage) {
      let userMessage = 'Something went wrong. Please try again.';

      // Customize message based on error type
      if (context === 'initialization') {
        userMessage =
          'Failed to initialize 3D viewer. Please check your browser compatibility.';
      } else if (context === 'modelLoading') {
        userMessage =
          'Failed to load 3D model. Please check your internet connection.';
      }

      errorMessage.textContent = userMessage;
      errorOverlay.classList.remove('hidden');
    }
  }

  /**
   * Handle retry button click
   */
  async handleRetryClick() {
    console.log('App: Retry button clicked');

    // Hide error overlay
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.classList.add('hidden');
    }

    // Try to reinitialize if viewer failed completely
    if (!this.isInitialized) {
      await this.init();
    } else if (this.viewer) {
      // Try to reload the model
      try {
        const defaultUrl = this.viewer.config.model?.defaultUrl;
        if (defaultUrl) {
          await this.viewer.loadModel(defaultUrl);
        }
      } catch (error) {
        this.handleViewerError('modelLoading', error);
      }
    }
  }

  /**
   * Update loading progress
   * @param {number} progress - Progress percentage (0-100)
   */
  updateLoadingProgress(progress) {
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }
  }

  /**
   * Show loading overlay with optional message
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = loadingOverlay?.querySelector('.loading-text');

    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }

    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Get application information
   * @returns {Object} App information
   */
  getInfo() {
    return {
      version: '1.0.0',
      isInitialized: this.isInitialized,
      viewer: this.viewer?.getInfo() || null,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cleanup application
   */
  dispose() {
    console.log('App: Starting cleanup...');

    if (this.viewer) {
      this.viewer.dispose();
      this.viewer = null;
    }

    // Remove event listeners
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.removeEventListener('click', this.handleRetryClick);
    }

    this.isInitialized = false;
    console.log('App: Cleanup completed');
  }

  /**
   * Capture screenshot
   */
  captureScreenshot() {
    if (!this.viewer) return;

    try {
      const dataURL = this.viewer.captureScreenshot({
        format: 'image/png',
        quality: 1.0,
      });

      if (dataURL) {
        // Create download link
        const link = document.createElement('a');
        link.download = `3d-model-screenshot-${Date.now()}.png`;
        link.href = dataURL;
        link.click();

        console.log('App: Screenshot captured and downloaded');
      }
    } catch (error) {
      console.error('App: Screenshot capture failed:', error);
    }
  }

  /**
   * Toggle shadows on/off
   */
  toggleShadows() {
    if (!this.viewer || !this.viewer.lightingManager) return;

    const currentState = this.viewer.lightingManager.shadowsEnabled;
    this.viewer.lightingManager.setShadowsEnabled(!currentState);

    // Update button state
    const shadowsBtn = document.querySelector('#toggle-shadows');
    if (shadowsBtn) {
      shadowsBtn.classList.toggle('active', !currentState);
    }

    console.log(`App: Shadows ${!currentState ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Global error handler
 */
function setupGlobalErrorHandling() {
  window.addEventListener('error', event => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

/**
 * Check WebGL support
 * @returns {boolean} WebGL support status
 */
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Initialize application when DOM is ready
 */
function initializeApp() {
  // Check WebGL support
  if (!checkWebGLSupport()) {
    console.error('WebGL is not supported in this browser');

    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');

    if (errorOverlay && errorMessage) {
      errorMessage.textContent =
        'Your browser does not support WebGL. Please update your browser or use a different one.';
      errorOverlay.classList.remove('hidden');
    }

    return;
  }

  // Setup global error handling
  setupGlobalErrorHandling();

  // Create and initialize app
  const app = new App();

  // Make app globally accessible for debugging
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    window.app = app;
    window.THREE = (async () => {
      const THREE = await import('three');
      return THREE;
    })();
  }

  // Initialize app
  app.init().catch(error => {
    console.error('Failed to initialize application:', error);
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for module usage
export { App, checkWebGLSupport };
