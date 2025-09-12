import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SceneManager } from './scene-manager.js';
import { CameraManager } from './camera-manager.js';
import { RendererManager } from './renderer-manager.js';
import { ModelManager } from './model-manager.js';
import { MaterialManager } from './material-manager.js';
import { LightingManager } from './lighting-manager.js';
import { FileDropHandler } from '../utils/file-drop-handler.js';
import { getConfig } from '../config.js';

/**
 * ProductViewer - Enhanced 3D product viewer with materials and lighting
 * Now includes complete material and lighting management systems
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
    this.modelManager = null;
    this.materialManager = null;
    this.lightingManager = null;

    // File handling
    this.fileDropHandler = null;

    // Controls
    this.controls = null;

    // State
    this.isInitialized = false;
    this.isDisposed = false;
    this.isAnimating = false;
    this.currentModel = null;

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

      // Initialize enhanced managers
      await this.initializeEnhancedManagers();

      // Setup controls
      this.setupControls();

      // Setup file handling
      this.setupFileHandling();

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
   * Initialize enhanced managers (materials, lighting, models)
   */
  async initializeEnhancedManagers() {
    // Initialize model manager
    this.modelManager = new ModelManager(
      this.rendererManager.getRenderer(),
      this.config
    );

    // Initialize material manager
    this.materialManager = new MaterialManager(this.config);

    // Initialize lighting manager
    this.lightingManager = new LightingManager(
      this.sceneManager.getScene(),
      this.config
    );

    // Connect manager events
    this.setupManagerEvents();

    console.log('ProductViewer: Enhanced managers initialized');
  }

  /**
   * Setup inter-manager event connections
   */
  setupManagerEvents() {
    // Model Manager Events
    this.modelManager.addEventListener('loadStart', event => {
      this.showLoadingOverlay();
      this.updateLoadingProgress(0, 'Loading model...');
      this.dispatchEvent({ type: 'modelLoadStart', url: event.url });
    });

    this.modelManager.addEventListener('loadProgress', event => {
      this.updateLoadingProgress(event.progress, event.stage);
    });

    this.modelManager.addEventListener('loadComplete', event => {
      this.hideLoadingOverlay();
      this.handleModelLoaded(event.model);
      this.dispatchEvent({ type: 'modelLoadComplete', model: event.model });
    });

    this.modelManager.addEventListener('loadError', event => {
      this.hideLoadingOverlay();
      this.handleError('Model loading failed', event.error);
    });

    // Material Manager Events
    this.materialManager.addEventListener('materialPresetApplied', event => {
      console.log(`Material preset "${event.preset}" applied to model`);
      this.rendererManager.requestRender();
      this.dispatchEvent({ type: 'materialChanged', preset: event.preset });
    });

    // Lighting Manager Events
    this.lightingManager.addEventListener('lightingPresetApplied', event => {
      console.log(`Lighting preset "${event.preset}" applied`);
      this.rendererManager.requestRender();
      this.dispatchEvent({ type: 'lightingChanged', preset: event.preset });
    });

    this.lightingManager.addEventListener('globalIntensityChanged', event => {
      this.rendererManager.requestRender();
    });
  }

  /**
   * Handle successful model loading
   * @param {THREE.Object3D} model - Loaded model
   */
  async handleModelLoaded(model) {
    // Remove previous model if exists
    if (this.currentModel) {
      this.sceneManager.removeObject('current-model');
    }

    // Add new model to scene
    this.sceneManager.addObject(model, 'current-model');
    this.currentModel = model;

    // Set current model for material manager
    this.materialManager.setCurrentModel(model);

    // Frame the model in view
    await this.cameraManager.frameObject(model);

    // Apply initial material preset if specified
    const initialPreset = this.config.materials?.defaultPreset || 'default';
    await this.materialManager.applyMaterialPreset(initialPreset);

    // Update UI
    this.updateModelInfo(model);

    console.log('ProductViewer: Model loaded and processed successfully');
  }

  /**
   * Setup file drop handling
   */
  setupFileHandling() {
    this.fileDropHandler = new FileDropHandler(this.container, {
      allowedExtensions: ['.glb', '.gltf'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      showDropZone: true,
      autoProcess: true,
    });

    // Handle file ready event
    this.fileDropHandler.addEventListener('fileready', async event => {
      try {
        const { file, url, cleanup } = event.detail;
        console.log(`Loading dropped file: ${file.name}`);

        await this.loadModel(url);

        // Cleanup object URL
        cleanup();

        // Hide file drop overlay
        this.fileDropHandler.setProcessingComplete();
      } catch (error) {
        this.handleError('File loading failed', error);
        this.fileDropHandler.resetState();
      }
    });

    // Handle file errors
    this.fileDropHandler.addEventListener('fileerror', event => {
      const { error } = event.detail;
      this.handleError('File validation failed', new Error(error));
    });

    console.log('ProductViewer: File drop handling initialized');
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

    // Populate UI with presets
    this.populateUIPresets();

    console.log('ProductViewer: UI initialized');
  }

  /**
   * Populate UI elements with material and lighting presets
   */
  populateUIPresets() {
    // Populate material presets
    const materialSelector =
      this.ui.controlPanel?.querySelector('#material-preset');
    if (materialSelector && this.materialManager) {
      const presets = this.materialManager.getAvailablePresets();
      materialSelector.innerHTML = '';

      presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        option.title = preset.description;
        materialSelector.appendChild(option);
      });
    }

    // Populate lighting presets
    const lightingSelector =
      this.ui.controlPanel?.querySelector('#lighting-preset');
    if (lightingSelector && this.lightingManager) {
      const presets = this.lightingManager.getAvailablePresets();
      lightingSelector.innerHTML = '';

      presets.forEach(preset => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        option.title = preset.description;
        lightingSelector.appendChild(option);
      });
    }
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
    // Upload model button
    const showFileDropBtn =
      this.ui.controlPanel.querySelector('#show-file-drop');
    if (showFileDropBtn) {
      showFileDropBtn.addEventListener('click', () => {
        if (this.fileDropHandler) {
          this.fileDropHandler.showDropZone();
        }
      });
    }

    // Material preset selector
    const materialSelector =
      this.ui.controlPanel.querySelector('#material-preset');
    if (materialSelector) {
      materialSelector.addEventListener('change', async e => {
        await this.setMaterialPreset(e.target.value);
      });
    }

    // Lighting preset selector
    const lightingSelector =
      this.ui.controlPanel.querySelector('#lighting-preset');
    if (lightingSelector) {
      lightingSelector.addEventListener('change', async e => {
        await this.setLightingPreset(e.target.value);
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

    // Screenshot button
    const captureBtn = this.ui.controlPanel.querySelector(
      '#capture-screenshot'
    );
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        this.captureScreenshot();
      });
    }

    // Shadow toggle button
    const shadowsBtn = this.ui.controlPanel.querySelector('#toggle-shadows');
    if (shadowsBtn) {
      shadowsBtn.addEventListener('click', () => {
        this.toggleShadows();
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

      // Update lighting animations
      if (this.lightingManager) {
        this.lightingManager.updateAnimations(
          this.rendererManager.getDeltaTime()
        );
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
    console.log(`ProductViewer: Loading model from ${url}`);
    return await this.modelManager.loadModel(url, options);
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
   * Set material preset for current model
   * @param {string} preset - Material preset name
   */
  async setMaterialPreset(preset) {
    if (this.materialManager && this.currentModel) {
      const success = await this.materialManager.applyMaterialPreset(preset);
      if (success) {
        console.log(`ProductViewer: Applied material preset "${preset}"`);
        this.dispatchEvent({ type: 'materialPresetChange', preset });
      }
    } else {
      console.warn('ProductViewer: No material manager or model available');
    }
  }

  /**
   * Set lighting preset
   * @param {string} preset - Lighting preset name
   */
  async setLightingPreset(preset) {
    if (this.lightingManager) {
      const success = await this.lightingManager.applyLightingPreset(preset);
      if (success) {
        console.log(`ProductViewer: Applied lighting preset "${preset}"`);
        this.dispatchEvent({ type: 'lightingPresetChange', preset });
      }
    } else {
      console.warn('ProductViewer: No lighting manager available');
    }
  }

  /**
   * Set lighting intensity (placeholder)
   * @param {number} intensity - Light intensity value
   */
  setLightIntensity(intensity) {
    if (this.lightingManager) {
      this.lightingManager.setGlobalIntensity(intensity);
      console.log(`ProductViewer: Set light intensity to ${intensity}`);
      this.dispatchEvent({ type: 'lightIntensityChange', intensity });
    }
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
   * Toggle shadows on/off
   */
  toggleShadows() {
    if (this.lightingManager) {
      const currentState = this.lightingManager.shadowsEnabled;
      this.lightingManager.setShadowsEnabled(!currentState);

      // Update renderer shadow settings
      this.rendererManager.setShadowsEnabled(!currentState);

      // Update button state
      const shadowsBtn = this.ui.controlPanel?.querySelector('#toggle-shadows');
      if (shadowsBtn) {
        shadowsBtn.classList.toggle('active', !currentState);
        shadowsBtn.innerHTML = !currentState
          ? '🌟 Shadows On'
          : '🌟 Shadows Off';
      }

      console.log(
        `ProductViewer: Shadows ${!currentState ? 'enabled' : 'disabled'}`
      );
      this.dispatchEvent({ type: 'shadowsToggle', enabled: !currentState });
    }
  }

  /**
   * Capture screenshot of current view
   * @param {Object} options - Screenshot options
   */
  captureScreenshot(options = {}) {
    if (this.rendererManager) {
      try {
        const dataURL = this.rendererManager.captureScreenshot({
          format: 'image/png',
          quality: 1.0,
          ...options,
        });

        if (dataURL) {
          // Create download link
          const link = document.createElement('a');
          link.download = `3d-model-screenshot-${Date.now()}.png`;
          link.href = dataURL;
          link.click();

          console.log('ProductViewer: Screenshot captured and downloaded');
          this.dispatchEvent({ type: 'screenshotCaptured', dataURL });
        }
      } catch (error) {
        console.error('ProductViewer: Screenshot capture failed:', error);
        this.handleError('Screenshot failed', error);
      }
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Update loading progress
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} message - Loading message
   */
  updateLoadingProgress(progress, message = 'Loading...') {
    const loadingBar = document.getElementById('loading-bar');
    const loadingText = document.querySelector('.loading-text');

    if (loadingBar) {
      loadingBar.style.width = `${progress}%`;
    }

    if (loadingText) {
      loadingText.textContent = message;
    }
  }

  /**
   * Update model information display
   * @param {THREE.Object3D} model - Current model
   */
  updateModelInfo(model) {
    if (this.modelManager) {
      const stats = this.modelManager._getModelStats(model);
      console.log('Model Statistics:', stats);

      this.dispatchEvent({
        type: 'modelInfoUpdated',
        stats,
      });
    }
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
   * Get enhanced viewer information
   * @returns {Object} Comprehensive viewer information
   */
  getInfo() {
    return {
      version: '1.0.0',
      isInitialized: this.isInitialized,
      isDisposed: this.isDisposed,
      isAnimating: this.isAnimating,
      deviceType: this.deviceType,
      environment: this.environment,
      hasCurrentModel: !!this.currentModel,
      performance: this.getPerformanceStats(),
      scene: this.sceneManager?.getStats(),
      camera: this.cameraManager?.getInfo(),
      renderer: this.rendererManager?.getInfo(),
      model: this.modelManager?.getInfo(),
      materials: this.materialManager?.getInfo(),
      lighting: this.lightingManager?.getInfo(),
    };
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    if (this.isDisposed) return;

    console.log('ProductViewer: Starting enhanced cleanup...');

    // Stop animation loop
    this.stopAnimationLoop();

    // Remove event listeners
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Dispose of file handler
    if (this.fileDropHandler) {
      this.fileDropHandler.dispose();
      this.fileDropHandler = null;
    }

    // Dispose of controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose of enhanced managers
    if (this.lightingManager) {
      this.lightingManager.dispose();
      this.lightingManager = null;
    }

    if (this.materialManager) {
      this.materialManager.dispose();
      this.materialManager = null;
    }

    if (this.modelManager) {
      this.modelManager.dispose();
      this.modelManager = null;
    }

    // Dispose of core managers
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
    this.currentModel = null;

    this.isDisposed = true;
    this.dispatchEvent({ type: 'disposed' });

    console.log('ProductViewer: Enhanced cleanup completed');
  }
}
