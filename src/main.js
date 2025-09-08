/* src/main.js */
/**
 * 3D Product Viewer Pro - Main Entry Point
 *
 * This is the main entry point for the 3D Product Viewer application.
 * It handles initialization, error handling, and progressive loading.
 *
 * @author 3D Product Viewer Pro Team
 * @version 1.0.0
 */

import { ProductViewer } from '@core/viewer.js';
import { DeviceUtils } from '@utils/device-utils.js';
import { ErrorHandler } from '@utils/error-handler.js';
import { PerformanceMonitor } from '@utils/performance-monitor.js';

// Import styles
import '@styles/main.css';
import '@styles/components.css';
import '@styles/responsive.css';

/**
 * Application configuration
 */
const APP_CONFIG = {
  // Core settings
  debug: __DEV__,
  version: __APP_VERSION__,
  buildTime: __BUILD_TIME__,

  // Performance settings
  targetFPS: 60,
  maxMemoryMB: 500,

  // Feature flags
  features: {
    performanceMonitoring: true,
    autoQualityAdjustment: true,
    touchGestures: true,
    keyboardShortcuts: true,
    analytics: false, // Will be enabled in production
  },

  // Default model for demo
  defaultModel: {
    url: '/assets/models/demo-product.glb',
    position: [0, 0, 0],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
  },
};

/**
 * Application class - manages the entire application lifecycle
 */
class App {
  constructor() {
    this.viewer = null;
    this.performanceMonitor = null;
    this.errorHandler = null;
    this.isInitialized = false;

    // DOM elements
    this.loadingScreen = document.getElementById('loadingScreen');
    this.errorScreen = document.getElementById('errorScreen');
    this.loadingProgress = document.getElementById('loadingProgress');
    this.errorMessage = document.getElementById('errorMessage');
    this.viewerContainer = document.getElementById('viewer-container');

    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      this.updateLoadingProgress('Checking system compatibility...');

      // Check WebGL support
      if (!this.checkWebGLSupport()) {
        throw new Error('WebGL is not supported or disabled in your browser');
      }

      // Check device capabilities
      this.updateLoadingProgress('Analyzing device capabilities...');
      const deviceInfo = DeviceUtils.getDeviceInfo();
      this.logDeviceInfo(deviceInfo);

      // Initialize error handler
      this.updateLoadingProgress('Setting up error handling...');
      this.errorHandler = new ErrorHandler({
        onError: this.handleError,
        debug: APP_CONFIG.debug,
      });

      // Initialize performance monitor
      if (APP_CONFIG.features.performanceMonitoring) {
        this.updateLoadingProgress('Starting performance monitoring...');
        this.performanceMonitor = new PerformanceMonitor({
          targetFPS: APP_CONFIG.targetFPS,
          maxMemoryMB: APP_CONFIG.maxMemoryMB,
        });
      }

      // Initialize the 3D viewer
      this.updateLoadingProgress('Initializing 3D engine...');
      await this.initViewer();

      // Set up event listeners
      this.setupEventListeners();

      // Load initial content
      this.updateLoadingProgress('Loading default model...');
      await this.loadInitialModel();

      // Mark as initialized
      this.isInitialized = true;

      // Hide loading screen
      this.hideLoadingScreen();

      // Log successful initialization
      this.logInitializationSuccess();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Initialize the 3D viewer
   */
  async initViewer() {
    const viewerOptions = {
      container: this.viewerContainer,
      debug: APP_CONFIG.debug,
      features: APP_CONFIG.features,

      // Performance settings based on device capability
      performance: this.getPerformanceSettings(),

      // Event callbacks
      onLoadStart: () => this.updateLoadingProgress('Loading 3D model...'),
      onLoadProgress: progress =>
        this.updateLoadingProgress(`Loading: ${Math.round(progress * 100)}%`),
      onLoadComplete: () => this.updateLoadingProgress('Finalizing...'),
      onError: this.handleError,
    };

    this.viewer = new ProductViewer(viewerOptions);
    await this.viewer.init();
  }

  /**
   * Load the initial demo model
   */
  async loadInitialModel() {
    if (APP_CONFIG.defaultModel.url) {
      try {
        await this.viewer.loadModel(APP_CONFIG.defaultModel.url, {
          position: APP_CONFIG.defaultModel.position,
          scale: APP_CONFIG.defaultModel.scale,
          rotation: APP_CONFIG.defaultModel.rotation,
        });
      } catch (error) {
        console.warn('Failed to load default model:', error);
        // Continue without default model - viewer will show empty scene
      }
    }
  }

  /**
   * Get performance settings based on device capabilities
   */
  getPerformanceSettings() {
    const deviceInfo = DeviceUtils.getDeviceInfo();

    // Adjust quality based on device performance
    if (deviceInfo.isMobile) {
      return {
        shadowMapSize: 1024,
        antialias: false,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxLights: 3,
      };
    } else if (deviceInfo.isLowEnd) {
      return {
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxLights: 5,
      };
    } else {
      return {
        shadowMapSize: 4096,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 3),
        maxLights: 8,
      };
    }
  }

  /**
   * Set up global event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.handleResize);

    // Page visibility changes (for performance optimization)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Global error handling
    window.addEventListener('error', this.errorHandler.handleGlobalError);
    window.addEventListener(
      'unhandledrejection',
      this.errorHandler.handleUnhandledRejection
    );

    // Keyboard shortcuts
    if (APP_CONFIG.features.keyboardShortcuts) {
      document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.viewer && this.isInitialized) {
      this.viewer.handleResize();
    }
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (this.viewer && this.isInitialized) {
      if (document.hidden) {
        this.viewer.pause();
      } else {
        this.viewer.resume();
      }
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeydown(event) {
    // Only handle shortcuts when not typing in input fields
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA'
    ) {
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.viewer?.toggleAutoRotate();
        break;
      case 'KeyR':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.viewer?.resetCamera();
        }
        break;
      case 'KeyF':
        event.preventDefault();
        this.viewer?.toggleFullscreen();
        break;
      case 'KeyP':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.viewer?.captureScreenshot();
        }
        break;
    }
  }

  /**
   * Check WebGL support
   */
  checkWebGLSupport() {
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
   * Update loading progress text
   */
  updateLoadingProgress(message) {
    if (this.loadingProgress) {
      this.loadingProgress.textContent = message;
    }

    if (APP_CONFIG.debug) {
      console.log(`[Loading] ${message}`);
    }
  }

  /**
   * Hide loading screen with smooth transition
   */
  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('hidden');

      // Remove from DOM after transition
      setTimeout(() => {
        if (this.loadingScreen) {
          this.loadingScreen.style.display = 'none';
        }
      }, 500);
    }
  }

  /**
   * Show error screen
   */
  showErrorScreen(error) {
    // Hide loading screen
    if (this.loadingScreen) {
      this.loadingScreen.style.display = 'none';
    }

    // Show error screen
    if (this.errorScreen) {
      this.errorScreen.classList.add('visible');
    }

    // Update error message
    if (this.errorMessage && error) {
      this.errorMessage.textContent = this.getErrorMessage(error);
    }
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      // Handle specific error types
      if (error.message.includes('WebGL')) {
        return 'Your browser or device does not support WebGL, which is required for 3D graphics. Please try updating your browser or check if WebGL is enabled.';
      }

      if (
        error.message.includes('fetch') ||
        error.message.includes('network')
      ) {
        return 'Failed to load required resources. Please check your internet connection and try again.';
      }

      if (error.message.includes('model') || error.message.includes('GLTF')) {
        return 'Failed to load the 3D model. The file might be corrupted or in an unsupported format.';
      }

      return error.message;
    }

    return 'An unexpected error occurred. Please try refreshing the page.';
  }

  /**
   * Handle initialization errors
   */
  handleInitializationError(error) {
    console.error('Failed to initialize application:', error);

    if (this.errorHandler) {
      this.errorHandler.logError(error, 'initialization');
    }

    this.showErrorScreen(error);
  }

  /**
   * Handle runtime errors
   */
  handleError(error, context = 'runtime') {
    console.error(`Application error (${context}):`, error);

    if (this.errorHandler) {
      this.errorHandler.logError(error, context);
    }

    // For runtime errors, try to recover gracefully
    if (this.isInitialized && context !== 'initialization') {
      this.attemptErrorRecovery(error, context);
    } else {
      this.showErrorScreen(error);
    }
  }

  /**
   * Attempt to recover from runtime errors
   */
  attemptErrorRecovery(error, context) {
    try {
      switch (context) {
        case 'model-loading':
          // Try to reload the model or fall back to default
          console.warn('Model loading failed, attempting recovery...');
          break;

        case 'rendering':
          // Try to restart the render loop
          console.warn('Rendering error, attempting to restart...');
          this.viewer?.restartRenderer();
          break;

        default:
          // For unknown errors, just log and continue
          console.warn('Unknown error occurred, continuing...');
      }
    } catch (recoveryError) {
      console.error('Error recovery failed:', recoveryError);
      this.showErrorScreen(error);
    }
  }

  /**
   * Log device information for debugging
   */
  logDeviceInfo(deviceInfo) {
    if (APP_CONFIG.debug) {
      console.group('🔍 Device Information');
      console.log('Device Type:', deviceInfo.deviceType);
      console.log('Is Mobile:', deviceInfo.isMobile);
      console.log('Is Touch Device:', deviceInfo.isTouchDevice);
      console.log(
        'Screen Resolution:',
        `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`
      );
      console.log('Pixel Ratio:', deviceInfo.pixelRatio);
      console.log('User Agent:', deviceInfo.userAgent);
      console.log('WebGL Support:', deviceInfo.webglSupport);
      console.groupEnd();
    }
  }

  /**
   * Log successful initialization
   */
  logInitializationSuccess() {
    if (APP_CONFIG.debug) {
      console.group('🚀 Application Initialized Successfully');
      console.log('Version:', APP_CONFIG.version);
      console.log('Build Time:', APP_CONFIG.buildTime);
      console.log('Features:', APP_CONFIG.features);
      console.log('Performance Monitor:', !!this.performanceMonitor);
      console.log('Initialization Time:', performance.now().toFixed(2) + 'ms');
      console.groupEnd();
    }
  }

  /**
   * Cleanup resources when page unloads
   */
  dispose() {
    try {
      // Remove event listeners
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
      window.removeEventListener('error', this.errorHandler?.handleGlobalError);
      window.removeEventListener(
        'unhandledrejection',
        this.errorHandler?.handleUnhandledRejection
      );

      // Dispose viewer
      if (this.viewer) {
        this.viewer.dispose();
        this.viewer = null;
      }

      // Dispose performance monitor
      if (this.performanceMonitor) {
        this.performanceMonitor.dispose();
        this.performanceMonitor = null;
      }

      // Dispose error handler
      if (this.errorHandler) {
        this.errorHandler.dispose();
        this.errorHandler = null;
      }

      console.log('Application disposed successfully');
    } catch (error) {
      console.error('Error during disposal:', error);
    }
  }
}

/**
 * Application initialization and startup
 */
async function startApplication() {
  // Create app instance
  const app = new App();

  // Make app globally available for debugging
  if (APP_CONFIG.debug) {
    window.__APP__ = app;
  }

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    app.dispose();
  });

  // Start the application
  await app.init();

  return app;
}

/**
 * Document ready handler
 */
function onDocumentReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Start the application when DOM is ready
onDocumentReady(() => {
  startApplication().catch(error => {
    console.error('Failed to start application:', error);

    // Show basic error message if everything fails
    const errorScreen = document.getElementById('errorScreen');
    const errorMessage = document.getElementById('errorMessage');
    const loadingScreen = document.getElementById('loadingScreen');

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (errorScreen) errorScreen.classList.add('visible');
    if (errorMessage) {
      errorMessage.textContent =
        'Critical error: Failed to initialize the application. Please refresh the page or try a different browser.';
    }
  });
});
