/**
 * 3D Product Viewer Pro - Enhanced Main Entry Point
 * Phase 1.3: Materials and Lighting System Integration
 */

import { ProductViewer } from './core/viewer.js';

/**
 * Enhanced application class with advanced UI features
 */
class App {
  constructor() {
    this.viewer = null;
    this.isInitialized = false;
    this.toastContainer = null;
    this.currentToasts = [];

    // UI state
    this.isFullscreen = false;
    this.showingHelp = false;
    this.currentModel = null;

    // Bind methods
    this.handleViewerError = this.handleViewerError.bind(this);
    this.handleRetryClick = this.handleRetryClick.bind(this);
    this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
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

      // Setup toast system
      this.setupToastSystem();

      // Create viewer instance with enhanced configuration
      this.viewer = new ProductViewer(container, {
        development: {
          debug: true,
          verbose: true,
        },
        ui: {
          showPerformanceStats: true,
          showControlPanel: true,
        },
        features: {
          materials: true,
          lighting: true,
          screenshots: true,
          fileUpload: true,
        },
      });

      // Setup enhanced event listeners
      this.setupEventListeners();

      // Setup UI enhancements
      this.setupUIEnhancements();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Initialize viewer
      await this.viewer.init();

      // Setup retry button functionality
      this.setupRetryButton();

      this.isInitialized = true;
      this.showToast('3D Viewer initialized successfully!', 'success');

      console.log('App: Enhanced initialization completed successfully');
    } catch (error) {
      console.error('App: Initialization failed:', error);
      this.handleViewerError('initialization', error);
    }
  }
  /**
   * Setup toast notification system
   */
  setupToastSystem() {
    this.toastContainer = document.getElementById('toast-container');
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Message to display
   * @param {string} type - Toast type (success, error, warning, info)
   * @param {number} duration - Display duration in milliseconds
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add click to dismiss
    toast.addEventListener('click', () => {
      this.removeToast(toast);
    });

    this.toastContainer.appendChild(toast);
    this.currentToasts.push(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    // Limit number of toasts
    if (this.currentToasts.length > 5) {
      this.removeToast(this.currentToasts[0]);
    }
  }

  /**
   * Remove toast notification
   * @param {HTMLElement} toast - Toast element to remove
   */
  removeToast(toast) {
    const index = this.currentToasts.indexOf(toast);
    if (index > -1) {
      this.currentToasts.splice(index, 1);
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
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

    // Model events
    this.viewer.addEventListener('modelLoadStart', event => {
      console.log('App: Model loading started', event.url);
      this.showToast('Loading 3D model...', 'info', 0);
    });

    this.viewer.addEventListener('modelLoadComplete', event => {
      console.log('App: Model loaded successfully', event.model);
      this.currentModel = event.model;
      this.updateModelInfo(event.model);
      this.showToast('Model loaded successfully!', 'success');
      this.dismissLoadingToast();
    });

    // Camera events
    this.viewer.addEventListener('cameraChange', () => {
      // Could trigger analytics here
    });

    this.viewer.addEventListener('cameraReset', () => {
      console.log('App: Camera reset to default position');
      this.showToast('Camera reset', 'info', 1000);
    });

    // Control events
    this.viewer.addEventListener('autoRotateToggle', event => {
      const status = event.enabled ? 'enabled' : 'disabled';
      console.log(`App: Auto rotate ${status}`);
      this.showToast(`Auto rotate ${status}`, 'info', 1000);
    });

    // Material and lighting events
    this.viewer.addEventListener('materialChanged', event => {
      console.log(`App: Material changed to ${event.preset}`);
      this.showToast(`Applied ${event.preset} material`, 'success', 1500);
      this.updateMaterialDescription(event.preset);
    });

    this.viewer.addEventListener('lightingChanged', event => {
      console.log(`App: Lighting changed to ${event.preset}`);
      this.showToast(`Applied ${event.preset} lighting`, 'success', 1500);
      this.updateLightingDescription(event.preset);
    });

    this.viewer.addEventListener('lightIntensityChange', event => {
      this.updateIntensityValue(event.intensity);
    });

    this.viewer.addEventListener('shadowsToggle', event => {
      const status = event.enabled ? 'enabled' : 'disabled';
      this.showToast(`Shadows ${status}`, 'info', 1000);
    });

    this.viewer.addEventListener('screenshotCaptured', () => {
      this.showToast('Screenshot saved!', 'success', 2000);
    });

    // Error handling
    this.viewer.addEventListener('error', this.handleViewerError);

    // Performance monitoring
    this.viewer.addEventListener('performanceWarning', event => {
      console.warn('App: Performance warning:', event.details);
      this.showToast('Performance warning detected', 'warning', 3000);
    });
  }

  /**
   * Setup UI enhancements and interactive features
   */
  setupUIEnhancements() {
    // Setup collapsible sections
    this.setupCollapsibleSections();

    // Setup quick actions
    this.setupQuickActions();

    // Setup preset descriptions
    this.setupPresetDescriptions();

    // Setup advanced controls
    this.setupAdvancedControls();

    // Setup model info panel
    this.setupModelInfoPanel();

    // Setup shortcuts help
    this.setupShortcutsHelp();

    console.log('App: UI enhancements initialized');
  }

  /**
   * Setup collapsible control sections
   */
  setupCollapsibleSections() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible');

    collapsibleHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const content = header.parentElement.querySelector(
          '.collapsible-content'
        );
        if (content) {
          const isCollapsed = content.classList.contains('collapsed');

          if (isCollapsed) {
            content.classList.remove('collapsed');
            header.classList.remove('collapsed');
          } else {
            content.classList.add('collapsed');
            header.classList.add('collapsed');
          }
        }
      });
    });
  }

  /**
   * Setup quick action buttons
   */
  setupQuickActions() {
    const quickReset = document.getElementById('quick-reset');
    const quickRotate = document.getElementById('quick-rotate');
    const quickInfo = document.getElementById('quick-info');
    const quickFullscreen = document.getElementById('quick-fullscreen');

    if (quickReset) {
      quickReset.addEventListener('click', () => {
        this.viewer.resetCamera();
      });
    }

    if (quickRotate) {
      quickRotate.addEventListener('click', () => {
        this.viewer.toggleAutoRotate();
      });
    }

    if (quickInfo) {
      quickInfo.addEventListener('click', () => {
        this.toggleModelInfo();
      });
    }

    if (quickFullscreen) {
      quickFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }
  }

  /**
   * Setup preset descriptions update
   */
  setupPresetDescriptions() {
    const materialSelector = document.getElementById('material-preset');
    const lightingSelector = document.getElementById('lighting-preset');

    if (materialSelector) {
      materialSelector.addEventListener('change', e => {
        this.updateMaterialDescription(e.target.value);
      });
    }

    if (lightingSelector) {
      lightingSelector.addEventListener('change', e => {
        this.updateLightingDescription(e.target.value);
      });
    }
  }

  /**
   * Setup advanced control handlers
   */
  setupAdvancedControls() {
    // Wireframe toggle
    const wireframeToggle = document.getElementById('enable-wireframe');
    if (wireframeToggle) {
      wireframeToggle.addEventListener('change', e => {
        this.toggleWireframe(e.target.checked);
      });
    }

    // Helpers toggle
    const helpersToggle = document.getElementById('enable-helpers');
    if (helpersToggle) {
      helpersToggle.addEventListener('change', e => {
        this.toggleHelpers(e.target.checked);
      });
    }

    // Performance stats toggle
    const statsToggle = document.getElementById('enable-stats');
    if (statsToggle) {
      statsToggle.addEventListener('change', e => {
        this.togglePerformanceStats(e.target.checked);
      });
    }

    // Camera FOV slider
    const fovSlider = document.getElementById('camera-fov');
    if (fovSlider) {
      fovSlider.addEventListener('input', e => {
        this.updateCameraFOV(parseFloat(e.target.value));
      });
    }

    // Light intensity slider
    const intensitySlider = document.getElementById('light-intensity');
    if (intensitySlider) {
      intensitySlider.addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        this.viewer.setLightIntensity(value);
        this.updateIntensityValue(value);
      });
    }

    // Render quality selector
    const qualitySelector = document.getElementById('render-quality');
    if (qualitySelector) {
      qualitySelector.addEventListener('change', e => {
        this.updateRenderQuality(e.target.value);
      });
    }
  }

  /**
   * Setup model information panel
   */
  setupModelInfoPanel() {
    const closeBtn = document.getElementById('close-model-info');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideModelInfo();
      });
    }
  }

  /**
   * Setup keyboard shortcuts help
   */
  setupShortcutsHelp() {
    const closeBtn = document.querySelector('.close-shortcuts');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideShortcutsHelp();
      });
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboardShortcuts);
    console.log('App: Keyboard shortcuts initialized');
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

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyboardShortcuts(event) {
    // Ignore shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
      return;
    }

    const key = event.key.toLowerCase();
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;

    switch (key) {
      case 'r':
        event.preventDefault();
        this.viewer.resetCamera();
        break;

      case ' ':
        event.preventDefault();
        this.viewer.toggleAutoRotate();
        break;

      case 's':
        if (ctrl) {
          event.preventDefault();
          this.viewer.captureScreenshot();
        }
        break;

      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;

      case 'h':
        event.preventDefault();
        this.toggleHelpers();
        break;

      case 'i':
        event.preventDefault();
        this.toggleModelInfo();
        break;

      case '?':
        event.preventDefault();
        this.toggleShortcutsHelp();
        break;

      // Material presets (1-5)
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        event.preventDefault();
        if (shift) {
          this.applyLightingPresetByIndex(parseInt(key) - 1);
        } else {
          this.applyMaterialPresetByIndex(parseInt(key) - 1);
        }
        break;

      case 'escape':
        event.preventDefault();
        if (this.showingHelp) {
          this.hideShortcutsHelp();
        }
        break;
    }
  }

  /**
   * Apply material preset by index
   * @param {number} index - Preset index
   */
  applyMaterialPresetByIndex(index) {
    const materialSelector = document.getElementById('material-preset');
    if (materialSelector && materialSelector.options[index]) {
      const presetValue = materialSelector.options[index].value;
      materialSelector.value = presetValue;
      this.viewer.setMaterialPreset(presetValue);
    }
  }

  /**
   * Apply lighting preset by index
   * @param {number} index - Preset index
   */
  applyLightingPresetByIndex(index) {
    const lightingSelector = document.getElementById('lighting-preset');
    if (lightingSelector && lightingSelector.options[index]) {
      const presetValue = lightingSelector.options[index].value;
      lightingSelector.value = presetValue;
      this.viewer.setLightingPreset(presetValue);
    }
  }

  /**
   * Update material description
   * @param {string} preset - Material preset name
   */
  updateMaterialDescription(preset) {
    const descriptions = {
      default: 'Standard material with balanced properties',
      metallic: 'Highly reflective metallic surface',
      matte: 'Non-reflective matte finish',
      glossy: 'Smooth glossy surface with some reflection',
      glass: 'Transparent glass material',
      plastic: 'Smooth plastic material',
      ceramic: 'Smooth ceramic surface',
      carbon_fiber: 'Woven carbon fiber pattern',
    };

    const descElement = document.getElementById('material-description');
    if (descElement && descriptions[preset]) {
      descElement.textContent = descriptions[preset];
    }
  }

  /**
   * Update lighting description
   * @param {string} preset - Lighting preset name
   */
  updateLightingDescription(preset) {
    const descriptions = {
      studio: 'Professional studio setup with key, fill, and rim lights',
      outdoor: 'Natural outdoor lighting with sun and sky',
      dramatic: 'High contrast dramatic lighting with strong shadows',
      soft: 'Even, soft lighting with minimal shadows',
      night: 'Moody night lighting with cool tones',
    };

    const descElement = document.getElementById('lighting-description');
    if (descElement && descriptions[preset]) {
      descElement.textContent = descriptions[preset];
    }
  }

  /**
   * Update intensity value display
   * @param {number} intensity - Light intensity value
   */
  updateIntensityValue(intensity) {
    const valueElement = document.getElementById('intensity-value');
    if (valueElement) {
      valueElement.textContent = intensity.toFixed(1);
    }
  }

  /**
   * Update camera FOV
   * @param {number} fov - Field of view in degrees
   */
  updateCameraFOV(fov) {
    if (this.viewer && this.viewer.cameraManager) {
      this.viewer.cameraManager.setFieldOfView(fov);
    }

    const valueElement = document.getElementById('fov-value');
    if (valueElement) {
      valueElement.textContent = `${fov}°`;
    }
  }

  /**
   * Toggle wireframe mode
   * @param {boolean} enabled - Enable wireframe
   */
  toggleWireframe(enabled) {
    if (!this.currentModel) return;

    this.currentModel.traverse(child => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.wireframe = enabled;
          });
        } else {
          child.material.wireframe = enabled;
        }
      }
    });

    this.showToast(
      `Wireframe ${enabled ? 'enabled' : 'disabled'}`,
      'info',
      1000
    );
  }

  /**
   * Toggle helpers display
   * @param {boolean} enabled - Enable helpers
   */
  toggleHelpers(enabled) {
    if (this.viewer && this.viewer.lightingManager) {
      this.viewer.lightingManager.showShadowHelpers(enabled);
    }

    this.showToast(`Helpers ${enabled ? 'enabled' : 'disabled'}`, 'info', 1000);
  }

  /**
   * Toggle performance stats display
   * @param {boolean} enabled - Enable stats
   */
  togglePerformanceStats(enabled) {
    const statsElement = document.getElementById('performance-stats');
    if (statsElement) {
      statsElement.style.display = enabled ? 'block' : 'none';
    }
  }

  /**
   * Update render quality
   * @param {string} quality - Quality setting
   */
  updateRenderQuality(quality) {
    if (!this.viewer || !this.viewer.rendererManager) return;

    const renderer = this.viewer.rendererManager.getRenderer();

    switch (quality) {
      case 'high':
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        break;
      case 'medium':
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        break;
      case 'low':
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        break;
    }

    this.showToast(`Render quality: ${quality}`, 'info', 1500);
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          this.isFullscreen = true;
          this.showToast('Entered fullscreen mode', 'info', 1000);
        })
        .catch(() => {
          this.showToast('Fullscreen not supported', 'error', 2000);
        });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
        this.showToast('Exited fullscreen mode', 'info', 1000);
      });
    }
  }

  /**
   * Toggle model information panel
   */
  toggleModelInfo() {
    const infoPanel = document.getElementById('model-info');
    if (infoPanel) {
      const isVisible = !infoPanel.classList.contains('hidden');
      if (isVisible) {
        this.hideModelInfo();
      } else {
        this.showModelInfo();
      }
    }
  }

  /**
   * Show model information panel
   */
  showModelInfo() {
    const infoPanel = document.getElementById('model-info');
    if (infoPanel) {
      infoPanel.classList.remove('hidden');
    }
  }

  /**
   * Hide model information panel
   */
  hideModelInfo() {
    const infoPanel = document.getElementById('model-info');
    if (infoPanel) {
      infoPanel.classList.add('hidden');
    }
  }

  /**
   * Toggle shortcuts help
   */
  toggleShortcutsHelp() {
    const helpPanel = document.getElementById('shortcuts-help');
    if (helpPanel) {
      const isVisible = !helpPanel.classList.contains('hidden');
      if (isVisible) {
        this.hideShortcutsHelp();
      } else {
        this.showShortcutsHelp();
      }
    }
  }

  /**
   * Show shortcuts help
   */
  showShortcutsHelp() {
    const helpPanel = document.getElementById('shortcuts-help');
    if (helpPanel) {
      helpPanel.classList.remove('hidden');
      this.showingHelp = true;
    }
  }

  /**
   * Hide shortcuts help
   */
  hideShortcutsHelp() {
    const helpPanel = document.getElementById('shortcuts-help');
    if (helpPanel) {
      helpPanel.classList.add('hidden');
      this.showingHelp = false;
    }
  }

  /**
   * Update model information display
   * @param {THREE.Object3D} model - Current model
   */
  updateModelInfo(model) {
    if (!this.viewer || !this.viewer.modelManager) return;

    const stats = this.viewer.modelManager._getModelStats(model);

    // Update model info panel
    const elements = {
      filename: document.getElementById('model-filename'),
      filesize: document.getElementById('model-filesize'),
      meshes: document.getElementById('model-meshes'),
      materials: document.getElementById('model-materials'),
      vertices: document.getElementById('model-vertices'),
    };

    if (elements.filename) elements.filename.textContent = 'Current Model';
    if (elements.filesize) elements.filesize.textContent = '--';
    if (elements.meshes) elements.meshes.textContent = stats.meshCount;
    if (elements.materials)
      elements.materials.textContent = stats.materialCount;
    if (elements.vertices)
      elements.vertices.textContent = stats.vertexCount.toLocaleString();
  }

  /**
   * Dismiss loading toast
   */
  dismissLoadingToast() {
    const loadingToasts = this.currentToasts.filter(
      toast =>
        toast.textContent.includes('Loading') ||
        toast.textContent.includes('loading')
    );
    loadingToasts.forEach(toast => this.removeToast(toast));
  }

  /**
   * Setup retry button functionality
   */
  setupRetryButton() {
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', this.handleRetryClick);
    }

    const closeErrorBtn = document.getElementById('close-error');
    if (closeErrorBtn) {
      closeErrorBtn.addEventListener('click', () => {
        this.hideErrorOverlay();
      });
    }
  }

  /**
   * Handle viewer errors
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleViewerError(context, error) {
    console.error(`App: Viewer error in ${context}:`, error);

    let userMessage = 'Something went wrong. Please try again.';

    // Customize message based on error type
    if (context === 'initialization') {
      userMessage =
        'Failed to initialize 3D viewer. Please check your browser compatibility.';
    } else if (context === 'modelLoading' || context.includes('loading')) {
      userMessage =
        'Failed to load 3D model. Please check your internet connection.';
    }

    this.showErrorOverlay(userMessage);
    this.showToast(`Error: ${error.message}`, 'error', 5000);
  }

  /**
   * Handle retry button click
   */
  async handleRetryClick() {
    console.log('App: Retry button clicked');

    this.hideErrorOverlay();

    if (!this.isInitialized) {
      await this.init();
    } else if (this.viewer) {
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
   * Show error overlay
   * @param {string} message - Error message
   */
  showErrorOverlay(message) {
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');

    if (errorOverlay && errorMessage) {
      errorMessage.textContent = message;
      errorOverlay.classList.remove('hidden');
    }
  }

  /**
   * Hide error overlay
   */
  hideErrorOverlay() {
    const errorOverlay = document.getElementById('error-overlay');
    if (errorOverlay) {
      errorOverlay.classList.add('hidden');
    }
  }

  /**
   * Get enhanced application information
   * @returns {Object} App information
   */
  getInfo() {
    return {
      version: '1.3.0',
      phase: 'Materials & Lighting Integration',
      isInitialized: this.isInitialized,
      viewer: this.viewer?.getInfo() || null,
      features: {
        materials: true,
        lighting: true,
        fileUpload: true,
        screenshots: true,
        keyboardShortcuts: true,
        toastNotifications: true,
        advancedControls: true,
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clean up application resources
   */
  dispose() {
    console.log('App: Starting enhanced cleanup...');

    // Remove keyboard event listeners
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);

    // Clear toasts
    this.currentToasts.forEach(toast => this.removeToast(toast));
    this.currentToasts = [];

    // Dispose of viewer
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
    console.log('App: Enhanced cleanup completed');
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
 * Add CSS animation for toast slide out
 */
function addToastAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
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

  // Add CSS animations
  addToastAnimations();

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

    // Log app info for debugging
    console.log('Enhanced 3D Product Viewer Pro - Debug Info:');
    console.log('Phase: 1.3 - Materials & Lighting Integration');
    console.log('App accessible via: window.app');
    console.log('Three.js accessible via: window.THREE');
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
