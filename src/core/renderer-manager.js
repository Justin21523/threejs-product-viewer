import * as THREE from 'three';

/**
 * RendererManager handles all Three.js rendering operations
 * Manages WebGL renderer, render settings, and performance optimization
 */
export class RendererManager {
  constructor(container, config = {}) {
    this.container = container;
    this.config = config;
    this.renderer = null;
    this.canvas = null;
    this.renderTarget = null;

    // Performance monitoring
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.deltaTime = 0;

    // Render state
    this.shouldRender = true;
    this.renderOnDemand = false;
    this.needsRender = true;

    this._initialized = false;
    this._disposed = false;

    this.init();
  }

  /**
   * Initialize the WebGL renderer
   */
  init() {
    if (this._initialized) return;

    const rendererConfig = this.config.renderer || {};

    // Get or create canvas
    this.canvas =
      this.container.querySelector('#viewer-canvas') ||
      this.container.querySelector('canvas') ||
      this.createCanvas();

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: rendererConfig.antialias !== false,
      alpha: rendererConfig.alpha !== false,
      powerPreference: rendererConfig.powerPreference || 'high-performance',
      preserveDrawingBuffer: false, // Better performance
      failIfMajorPerformanceCaveat: false, // Allow fallback to software rendering
    });

    // Set renderer properties
    this.setupRenderer(rendererConfig);

    // Set initial size
    this.resize();

    // Setup event listeners
    this.setupEventListeners();

    this._initialized = true;
    console.log('RendererManager: WebGL renderer initialized successfully');
    console.log(
      'WebGL Version:',
      this.renderer.capabilities.getMaxAnisotropy()
    );
  }

  /**
   * Create a canvas element if none exists
   * @returns {HTMLCanvasElement} Created canvas element
   */
  createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'viewer-canvas';
    canvas.className = 'viewer-canvas';
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    this.container.appendChild(canvas);
    return canvas;
  }

  /**
   * Configure renderer settings
   * @param {Object} config - Renderer configuration
   */
  setupRenderer(config) {
    // Set pixel ratio (capped for performance)
    const pixelRatio =
      config.pixelRatio || Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(pixelRatio);

    // Set color space
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Enable shadows if configured
    if (config.shadowMap?.enabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = this.getShadowMapType(
        config.shadowMap.type
      );
    }

    // Set tone mapping
    if (config.toneMapping) {
      this.renderer.toneMapping = this.getToneMappingType(config.toneMapping);
      this.renderer.toneMappingExposure = config.toneMappingExposure || 1.0;
    }

    // Additional renderer settings
    this.renderer.physicallyCorrectLights = true; // More realistic lighting
    this.renderer.useLegacyLights = false; // Use modern lighting model

    console.log('RendererManager: Renderer configured with advanced settings');
  }

  /**
   * Get Three.js shadow map type from string
   * @param {string} type - Shadow map type name
   * @returns {number} Three.js shadow map constant
   */
  getShadowMapType(type) {
    switch (type) {
      case 'PCFSoftShadowMap':
        return THREE.PCFSoftShadowMap;
      case 'PCFShadowMap':
        return THREE.PCFShadowMap;
      case 'VSMShadowMap':
        return THREE.VSMShadowMap;
      default:
        return THREE.PCFSoftShadowMap;
    }
  }

  /**
   * Get Three.js tone mapping type from string
   * @param {string} type - Tone mapping type name
   * @returns {number} Three.js tone mapping constant
   */
  getToneMappingType(type) {
    switch (type) {
      case 'NoToneMapping':
        return THREE.NoToneMapping;
      case 'LinearToneMapping':
        return THREE.LinearToneMapping;
      case 'ReinhardToneMapping':
        return THREE.ReinhardToneMapping;
      case 'CineonToneMapping':
        return THREE.CineonToneMapping;
      case 'ACESFilmicToneMapping':
        return THREE.ACESFilmicToneMapping;
      default:
        return THREE.ACESFilmicToneMapping;
    }
  }

  /**
   * Setup event listeners for automatic resizing and visibility
   */
  setupEventListeners() {
    // Handle window resize
    window.addEventListener('resize', () => this.resize(), false);

    // Handle visibility change for performance
    document.addEventListener('visibilitychange', () => {
      this.shouldRender = !document.hidden;
      if (this.shouldRender) {
        this.needsRender = true;
      }
    });

    // Handle container resize (using ResizeObserver if available)
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * Resize renderer to match container size
   */
  resize() {
    if (!this.renderer || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;

    // Update renderer size
    this.renderer.setSize(width, height, false);

    // Mark as needing render
    this.needsRender = true;

    console.log(`RendererManager: Resized to ${width}x${height}`);

    return { width, height };
  }

  /**
   * Render a frame
   * @param {THREE.Scene} scene - Scene to render
   * @param {THREE.Camera} camera - Camera to render from
   */
  render(scene, camera) {
    if (!this.renderer || !this.shouldRender) return;

    // Skip rendering if not needed (for render-on-demand)
    if (this.renderOnDemand && !this.needsRender) return;

    // Update performance metrics
    this.updatePerformanceMetrics();

    // Render the scene
    this.renderer.render(scene, camera);

    // Mark render as completed
    this.needsRender = false;
    this.frameCount++;
  }

  /**
   * Update performance metrics (FPS, delta time)
   */
  updatePerformanceMetrics() {
    const currentTime = performance.now();

    if (this.lastFrameTime > 0) {
      this.deltaTime = currentTime - this.lastFrameTime;

      // Calculate FPS (smooth average)
      const currentFPS = 1000 / this.deltaTime;
      this.fps = this.fps * 0.9 + currentFPS * 0.1; // Smooth average
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Enable or disable render-on-demand mode
   * @param {boolean} enabled - Whether to enable render-on-demand
   */
  setRenderOnDemand(enabled) {
    this.renderOnDemand = enabled;
    if (enabled) {
      console.log(
        'RendererManager: Render-on-demand enabled for better performance'
      );
    } else {
      console.log('RendererManager: Continuous rendering enabled');
    }
  }

  /**
   * Mark that a new render is needed
   */
  requestRender() {
    this.needsRender = true;
  }

  /**
   * Enable or disable rendering
   * @param {boolean} enabled - Whether rendering should be enabled
   */
  setRenderingEnabled(enabled) {
    this.shouldRender = enabled;
    if (!enabled) {
      console.log('RendererManager: Rendering paused');
    } else {
      console.log('RendererManager: Rendering resumed');
      this.needsRender = true;
    }
  }

  /**
   * Set tone mapping exposure
   * @param {number} exposure - Exposure value
   */
  setToneMappingExposure(exposure) {
    if (this.renderer) {
      this.renderer.toneMappingExposure = exposure;
      this.needsRender = true;
    }
  }

  /**
   * Enable or disable shadows
   * @param {boolean} enabled - Whether shadows should be enabled
   */
  setShadowsEnabled(enabled) {
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
      this.needsRender = true;
      console.log(
        `RendererManager: Shadows ${enabled ? 'enabled' : 'disabled'}`
      );
    }
  }

  /**
   * Set shadow map type
   * @param {string} type - Shadow map type
   */
  setShadowMapType(type) {
    if (this.renderer) {
      this.renderer.shadowMap.type = this.getShadowMapType(type);
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
      console.log(`RendererManager: Shadow map type set to ${type}`);
    }
  }

  /**
   * Capture screenshot of current render
   * @param {Object} options - Screenshot options
   * @returns {string} Data URL of the screenshot
   */
  captureScreenshot(options = {}) {
    if (!this.renderer) return null;

    const { format = 'image/png', quality = 1.0, width, height } = options;

    let dataURL;

    if (
      width &&
      height &&
      (width !== this.canvas.width || height !== this.canvas.height)
    ) {
      // Render at custom resolution
      const originalSize = this.renderer.getSize(new THREE.Vector2());

      // Temporarily resize
      this.renderer.setSize(width, height, false);

      // Force a render (this will be at the new size)
      this.needsRender = true;

      // Capture at new size
      dataURL = this.canvas.toDataURL(format, quality);

      // Restore original size
      this.renderer.setSize(originalSize.x, originalSize.y, false);
      this.needsRender = true;
    } else {
      // Capture at current size
      dataURL = this.canvas.toDataURL(format, quality);
    }

    console.log(`RendererManager: Screenshot captured (${format})`);
    return dataURL;
  }

  /**
   * Get renderer capabilities and information
   * @returns {Object} Renderer information
   */
  getInfo() {
    if (!this.renderer) return null;

    const gl = this.renderer.getContext();
    const capabilities = this.renderer.capabilities;

    return {
      // WebGL context info
      webglVersion: capabilities.isWebGL2 ? '2.0' : '1.0',
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),

      // Capabilities
      maxAnisotropy: capabilities.getMaxAnisotropy(),
      maxTextureSize: capabilities.maxTextureSize,
      maxCubemapSize: capabilities.maxCubemapSize,
      maxAttributes: capabilities.maxAttributes,
      maxVertexUniforms: capabilities.maxVertexUniforms,
      maxFragmentUniforms: capabilities.maxFragmentUniforms,
      maxSamples: capabilities.maxSamples,

      // Current settings
      pixelRatio: this.renderer.getPixelRatio(),
      shadowMapEnabled: this.renderer.shadowMap.enabled,
      shadowMapType: this.renderer.shadowMap.type,
      toneMapping: this.renderer.toneMapping,
      toneMappingExposure: this.renderer.toneMappingExposure,
      outputColorSpace: this.renderer.outputColorSpace,

      // Performance metrics
      fps: Math.round(this.fps),
      deltaTime: Math.round(this.deltaTime * 100) / 100,
      frameCount: this.frameCount,

      // State
      shouldRender: this.shouldRender,
      renderOnDemand: this.renderOnDemand,
      needsRender: this.needsRender,
      isInitialized: this._initialized,
      isDisposed: this._disposed,
    };
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance metrics
   */
  getPerformanceStats() {
    const info = this.renderer ? this.renderer.info : null;

    return {
      fps: Math.round(this.fps),
      deltaTime: Math.round(this.deltaTime * 100) / 100,
      frameCount: this.frameCount,
      memory: info
        ? {
            geometries: info.memory.geometries,
            textures: info.memory.textures,
          }
        : null,
      render: info
        ? {
            calls: info.render.calls,
            triangles: info.render.triangles,
            points: info.render.points,
            lines: info.render.lines,
          }
        : null,
    };
  }

  /**
   * Reset performance counters
   */
  resetPerformanceStats() {
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.deltaTime = 0;

    if (this.renderer && this.renderer.info) {
      this.renderer.info.reset();
    }

    console.log('RendererManager: Performance stats reset');
  }

  /**
   * Set clear color
   * @param {number|string} color - Clear color
   * @param {number} alpha - Alpha value
   */
  setClearColor(color, alpha = 1) {
    if (this.renderer) {
      this.renderer.setClearColor(color, alpha);
      this.needsRender = true;
    }
  }

  /**
   * Set clear alpha
   * @param {number} alpha - Alpha value
   */
  setClearAlpha(alpha) {
    if (this.renderer) {
      this.renderer.setClearAlpha(alpha);
      this.needsRender = true;
    }
  }

  /**
   * Enable or disable auto clear
   * @param {boolean} enabled - Whether auto clear should be enabled
   */
  setAutoClear(enabled) {
    if (this.renderer) {
      this.renderer.autoClear = enabled;
      console.log(
        `RendererManager: Auto clear ${enabled ? 'enabled' : 'disabled'}`
      );
    }
  }

  /**
   * Get canvas element
   * @returns {HTMLCanvasElement} The canvas element
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Get WebGL renderer
   * @returns {THREE.WebGLRenderer} The renderer
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Get current render size
   * @returns {Object} Current size {width, height}
   */
  getSize() {
    if (!this.renderer) return { width: 0, height: 0 };

    const size = this.renderer.getSize(new THREE.Vector2());
    return { width: size.x, height: size.y };
  }

  /**
   * Get current FPS
   * @returns {number} Current FPS
   */
  getFPS() {
    return Math.round(this.fps);
  }

  /**
   * Get delta time
   * @returns {number} Delta time in milliseconds
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Check if rendering is enabled
   * @returns {boolean} Rendering status
   */
  isRenderingEnabled() {
    return this.shouldRender;
  }

  /**
   * Check if render is needed
   * @returns {boolean} Render needed status
   */
  isRenderNeeded() {
    return this.needsRender;
  }

  /**
   * Clean up renderer resources
   */
  dispose() {
    if (this._disposed) return;

    console.log('RendererManager: Starting cleanup...');

    // Remove event listeners
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.setRenderingEnabled);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Clear references
    this.canvas = null;
    this.container = null;
    this.renderTarget = null;

    this._disposed = true;
    console.log('RendererManager: Cleanup completed');
  }

  /**
   * Check if renderer manager is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Check if renderer manager is disposed
   * @returns {boolean} Disposal status
   */
  isDisposed() {
    return this._disposed;
  }
}
