import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from './scene-manager.js';
import { CameraManager } from './camera-manager.js';
import { RendererManager } from './renderer-manager.js';
import { getConfig } from '../config.js';

/**
 * ProductViewer - Main 3D product viewer class
 * Orchestrates all managers and provides the main API
 */
export class ProductViewer extends THREE.EventDispatcher {
  constructor(container, options = {}) {
    super();

    // Validate container
    if (!container) {
      throw new Error('ProductViewer: Container element is required');
    }

    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!this.container) {
      throw new Error('ProductViewer: Container element not found');
    }

    // Detect device type and environment
    this.deviceType = this.detectDeviceType();
    this.environment = this.detectEnvironment();

    // Merge configuration
    this.config = getConfig(this.environment, this.deviceType);
    this.config = this.mergeOptions(this.config, options);

    // Core managers
    this.sceneManager = null;
    this.cameraManager = null;
    this.rendererManager = null;

    // Controls
    this.controls = null;

    // State
    this.isInitialized = false;
    this.isDisposed = false;
    this.isAnimating = false;

    // Performance monitoring
    this.performanceStats = {
      fps: 0,
      memory: 0,
      triangles: 0,
      renderCalls: 0,
    };

    // UI elements
    this.ui = {
      loadingOverlay: null,
      errorOverlay: null,
      controlPanel: null,
      performanceStats: null,
    };

    // Animation loop
    this.animationId = null;

    console.log('ProductViewer: Initializing...', {
      environment: this.environment,
      deviceType: this.deviceType,
      container: this.container,
    });
  }

  /**
   * Initialize the 3D viewer
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      console.warn('ProductViewer: Already initialized');
      return;
    }

    try {
      this.dispatchEvent({ type: 'initStart' });

      // Show loading overlay
      this.showLoadingOverlay();

      // Initialize core managers
      await this.initializeCore();

      // Setup controls
      this.setupControls();

      // Initialize UI
      this.initializeUI();

      // Setup event listeners
      this.setupEventListeners();

      // Start animation loop
      this.startAnimationLoop();

      // Load default model if specified
      if (this.config.model?.defaultUrl) {
        await this.loadModel(this.config.model.defaultUrl);
      }

      // Hide loading overlay
      this.hideLoadingOverlay();

      this.isInitialized = true;
      this.dispatchEvent({ type: 'initComplete' });

      console.log('ProductViewer: Initialization completed successfully');
    } catch (error) {
      this.handleError('Initialization failed', error);
      throw error;
    }
  }

  /**
   * Initialize core 3D managers
   */
  async initializeCore() {
    // Initialize scene manager
    this.sceneManager = new SceneManager(this.config);

    // Initialize camera manager
    this.cameraManager = new CameraManager(this.config);

    // Initialize renderer manager
    this.rendererManager = new RendererManager(this.container, this.config);

    // Update camera aspect ratio
    const size = this.rendererManager.getSize();
    this.cameraManager.updateAspectRatio(size.width, size.height);

    console.log('ProductViewer: Core managers initialized');
  }

  /**
   * Setup orbit controls
   */
  setupControls() {
    const camera = this.cameraManager.getCamera();
    const canvas = this.rendererManager.getCanvas();

    this.controls = new OrbitControls(camera, canvas);

    // Apply configuration
    const controlsConfig = this.config.controls || {};

    this.controls.enableDamping = controlsConfig.enableDamping !== false;
    this.controls.dampingFactor = controlsConfig.dampingFactor || 0.05;
    this.controls.enableZoom = controlsConfig.enableZoom !== false;
    this.controls.enablePan = controlsConfig.enablePan !== false;
    this.controls.enableRotate = controlsConfig.enableRotate !== false;
    this.controls.autoRotate = controlsConfig.autoRotate || false;
    this.controls.autoRotateSpeed = controlsConfig.autoRotateSpeed || 1.0;
    this.controls.minDistance = controlsConfig.minDistance || 2;
    this.controls.maxDistance = controlsConfig.maxDistance || 20;
    this.controls.minPolarAngle = controlsConfig.minPolarAngle || 0;
    this.controls.maxPolarAngle = controlsConfig.maxPolarAngle || Math.PI;

    // Setup touch controls for mobile
    if (this.deviceType === 'mobile' && controlsConfig.touches) {
      this.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    }

    // Listen for control changes to trigger render
    this.controls.addEventListener('change', () => {
      this.rendererManager.requestRender();
      this.dispatchEvent({ type: 'cameraChange' });
    });

    console.log('ProductViewer: Controls initialized');
  }

  /**
   * Initialize UI elements
   */
  initializeUI() {
    // Get UI elements
    this.ui.loadingOverlay = this.container.querySelector('#loading-overlay');
    this.ui.errorOverlay = this.container.querySelector('#error-overlay');
    this.ui.controlPanel = this.container.querySelector('#control-panel');
    this.ui.performanceStats =
      this.container.querySelector('#performance-stats');

    // Setup control panel event listeners
    this.setupControlPanelEvents();

    // Setup performance stats if enabled
    if (this.config.ui?.showPerformanceStats) {
      this.setupPerformanceMonitoring();
    } else if (this.ui.performanceStats) {
      this.ui.performanceStats.style.display = 'none';
    }

    console.log('ProductViewer: UI initialized');
  }

  /**
   * Setup control panel event listeners
   */
  setupControlPanelEvents() {
    if (!this.ui.controlPanel) return;

    // Auto rotate toggle
    const autoRotateToggle = this.ui.controlPanel.querySelector(
      '#auto-rotate-toggle'
    );
    if (autoRotateToggle) {
      autoRotateToggle.addEventListener('click', () => {
        this.toggleAutoRotate();
      });
    }

    // Reset camera button
    const resetCameraBtn = this.ui.controlPanel.querySelector('#reset-camera');
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        this.resetCamera();
      });
    }

    // Light intensity slider
    const lightIntensitySlider =
      this.ui.controlPanel.querySelector('#light-intensity');
    if (lightIntensitySlider) {
      lightIntensitySlider.addEventListener('input', e => {
        this.setLightIntensity(parseFloat(e.target.value));
      });
    }

    // Material preset selector
    const materialSelector =
      this.ui.controlPanel.querySelector('#material-preset');
    if (materialSelector) {
      materialSelector.addEventListener('change', e => {
        this.setMaterialPreset(e.target.value);
      });
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.ui.performanceStats) return;

    const fpsCounter = this.ui.performanceStats.querySelector('#fps-counter');
    const memoryUsage = this.ui.performanceStats.querySelector('#memory-usage');
    const triangleCount =
      this.ui.performanceStats.querySelector('#triangle-count');

    // Update performance stats every second
    setInterval(() => {
      const stats = this.getPerformanceStats();

      if (fpsCounter) fpsCounter.textContent = stats.fps;
      if (memoryUsage) memoryUsage.textContent = stats.memory;
      if (triangleCount) triangleCount.textContent = stats.triangles;
    }, 1000);
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle container resize
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    } else {
      window.addEventListener('resize', () => this.handleResize());
    }

    // Handle visibility change for performance
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseRendering();
      } else {
        this.resumeRendering();
      }
    });

    // Handle errors
    window.addEventListener('error', e => {
      console.error('ProductViewer: Global error:', e.error);
    });
  }

  /**
   * Start the animation/render loop
   */
  startAnimationLoop() {
    if (this.isAnimating) return;

    this.isAnimating = true;

    const animate = () => {
      if (!this.isAnimating || this.isDisposed) return;

      this.animationId = requestAnimationFrame(animate);

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Update scene manager
      if (this.sceneManager) {
        this.sceneManager.update(this.rendererManager.getDeltaTime());
      }

      // Render frame
      if (this.sceneManager && this.cameraManager && this.rendererManager) {
        this.rendererManager.render(
          this.sceneManager.getScene(),
          this.cameraManager.getCamera()
        );
      }

      // Update performance stats
      this.updatePerformanceStats();
    };

    animate();
    console.log('ProductViewer: Animation loop started');
  }

  /**
   * Stop the animation loop
   */
  stopAnimationLoop() {
    if (!this.isAnimating) return;

    this.isAnimating = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    console.log('ProductViewer: Animation loop stopped');
  }

  /**
   * Load a 3D model
   * @param {string} url - Model URL
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Object3D>} Loaded model
   */
  async loadModel(url, options = {}) {
    // This will be implemented in the next phase
    // For now, create a simple test cube
    console.log(`ProductViewer: Loading model from ${url}`);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);

    // Add to scene
    this.sceneManager.addObject(cube, 'test-model');

    // Frame the object in view
    await this.cameraManager.frameObject(cube);

    this.dispatchEvent({ type: 'modelLoaded', model: cube });

    return cube;
  }

  /**
   * Public API Methods
   */

  /**
   * Toggle auto rotation
   */
  toggleAutoRotate() {
    if (this.controls) {
      this.controls.autoRotate = !this.controls.autoRotate;

      const button = this.ui.controlPanel?.querySelector('#auto-rotate-toggle');
      if (button) {
        button.classList.toggle('active', this.controls.autoRotate);
      }

      this.dispatchEvent({
        type: 'autoRotateToggle',
        enabled: this.controls.autoRotate,
      });
    }
  }

  /**
   * Reset camera to default position
   */
  async resetCamera() {
    if (this.cameraManager) {
      await this.cameraManager.resetToDefault();
      this.dispatchEvent({ type: 'cameraReset' });
    }
  }

  /**
   * Set lighting intensity (placeholder)
   * @param {number} intensity - Light intensity value
   */
  setLightIntensity(intensity) {
    // This will be implemented when we add the lighting manager
    console.log(`ProductViewer: Setting light intensity to ${intensity}`);
    this.dispatchEvent({ type: 'lightIntensityChange', intensity });
  }

  /**
   * Set material preset (placeholder)
   * @param {string} preset - Material preset name
   */
  setMaterialPreset(preset) {
    // This will be implemented when we add the material manager
    console.log(`ProductViewer: Setting material preset to ${preset}`);
    this.dispatchEvent({ type: 'materialPresetChange', preset });
  }

  /**
   * Utility Methods
   */

  /**
   * Detect device type based on screen size and touch capability
   * @returns {string} Device type ('mobile', 'tablet', 'desktop')
   */
  detectDeviceType() {
    const width = window.innerWidth;
    const hasTouch = 'ontouchstart' in window;

    if (width < 768 || (hasTouch && width < 1024)) {
      return 'mobile';
    } else if (width < 1024 || hasTouch) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Detect environment (development/production)
   * @returns {string} Environment type
   */
  detectEnvironment() {
    return location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1' ||
      location.hostname === ''
      ? 'development'
      : 'production';
  }

  /**
   * Merge configuration options
   * @param {Object} defaultConfig - Default configuration
   * @param {Object} userOptions - User options
   * @returns {Object} Merged configuration
   */
  mergeOptions(defaultConfig, userOptions) {
    // Deep merge implementation
    const result = JSON.parse(JSON.stringify(defaultConfig));

    const merge = (target, source) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (typeof source[key] === 'object' && source[key] !== null) {
            target[key] = target[key] || {};
            merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      }
    };

    merge(result, userOptions);
    return result;
  }

  /**
   * Handle resize events
   */
  handleResize() {
    if (this.rendererManager) {
      const size = this.rendererManager.resize();
      if (this.cameraManager && size) {
        this.cameraManager.updateAspectRatio(size.width, size.height);
      }
    }
  }

  /**
   * Update performance statistics
   */
  updatePerformanceStats() {
    const rendererStats = this.rendererManager.getPerformanceStats();
    const sceneStats = this.sceneManager.getStats();

    this.performanceStats = {
      fps: rendererStats.fps,
      memory: this.getMemoryUsage(),
      triangles: sceneStats.triangles,
      renderCalls: rendererStats.render?.calls || 0,
    };
  }

  /**
   * Get memory usage
   * @returns {number} Memory usage in MB
   */
  getMemoryUsage() {
    if (performance.memory) {
      return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance stats
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  /**
   * UI Management Methods
   */

  /**
   * Show loading overlay
   */
  showLoadingOverlay() {
    if (this.ui.loadingOverlay) {
      this.ui.loadingOverlay.style.display = 'flex';
    }
  }

  /**
   * Hide loading overlay
   */
  hideLoadingOverlay() {
    if (this.ui.loadingOverlay) {
      this.ui.loadingOverlay.style.display = 'none';
    }
  }

  /**
   * Show error overlay
   * @param {string} message - Error message
   */
  showErrorOverlay(message) {
    if (this.ui.errorOverlay) {
      const messageElement =
        this.ui.errorOverlay.querySelector('#error-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
      this.ui.errorOverlay.classList.remove('hidden');
    }
  }

  /**
   * Hide error overlay
   */
  hideErrorOverlay() {
    if (this.ui.errorOverlay) {
      this.ui.errorOverlay.classList.add('hidden');
    }
  }

  /**
   * Handle errors
   * @param {string} context - Error context
   * @param {Error} error - Error object
   */
  handleError(context, error) {
    console.error(`ProductViewer ${context}:`, error);

    const message = error.message || 'An unknown error occurred';
    this.showErrorOverlay(`${context}: ${message}`);

    this.dispatchEvent({
      type: 'error',
      context,
      error: error.message,
    });
  }

  /**
   * Pause rendering for performance
   */
  pauseRendering() {
    if (this.rendererManager) {
      this.rendererManager.setRenderingEnabled(false);
    }
  }

  /**
   * Resume rendering
   */
  resumeRendering() {
    if (this.rendererManager) {
      this.rendererManager.setRenderingEnabled(true);
    }
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    if (this.isDisposed) return;

    console.log('ProductViewer: Starting cleanup...');

    // Stop animation loop
    this.stopAnimationLoop();

    // Remove event listeners
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Dispose of controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose of managers
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = null;
    }

    if (this.cameraManager) {
      this.cameraManager.dispose();
      this.cameraManager = null;
    }

    if (this.rendererManager) {
      this.rendererManager.dispose();
      this.rendererManager = null;
    }

    // Clear references
    this.container = null;
    this.config = null;
    this.ui = null;

    this.isDisposed = true;
    this.dispatchEvent({ type: 'disposed' });

    console.log('ProductViewer: Cleanup completed');
  }

  /**
   * Get viewer information
   * @returns {Object} Viewer information
   */
  getInfo() {
    return {
      version: '1.0.0',
      isInitialized: this.isInitialized,
      isDisposed: this.isDisposed,
      isAnimating: this.isAnimating,
      deviceType: this.deviceType,
      environment: this.environment,
      performance: this.getPerformanceStats(),
      scene: this.sceneManager?.getStats(),
      camera: this.cameraManager?.getInfo(),
      renderer: this.rendererManager?.getInfo(),
    };
  }
}
