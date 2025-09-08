import * as THREE from 'three';

/**
 * CameraManager handles all camera-related operations
 * Manages perspective camera, view transitions, and presets
 */
export class CameraManager {
  constructor(config = {}) {
    this.config = config;
    this.camera = null;
    this.defaultPosition = new THREE.Vector3();
    this.defaultTarget = new THREE.Vector3();
    this.viewPresets = new Map();

    this._initialized = false;
    this._disposed = false;

    this.init();
  }

  /**
   * Initialize the camera with default settings
   */
  init() {
    if (this._initialized) return;

    const cameraConfig = this.config.camera || {};

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      cameraConfig.fov || 45,
      window.innerWidth / window.innerHeight,
      cameraConfig.near || 0.1,
      cameraConfig.far || 1000
    );

    // Set initial position
    const position = cameraConfig.position || { x: 0, y: 0, z: 5 };
    this.camera.position.set(position.x, position.y, position.z);

    // Set default target
    const target = cameraConfig.target || { x: 0, y: 0, z: 0 };
    this.camera.lookAt(target.x, target.y, target.z);

    // Store defaults for reset functionality
    this.defaultPosition.copy(this.camera.position);
    this.defaultTarget.set(target.x, target.y, target.z);

    // Initialize default view presets
    this.setupDefaultPresets();

    this._initialized = true;
    console.log('CameraManager: Camera initialized successfully');
  }

  /**
   * Set up default camera view presets
   */
  setupDefaultPresets() {
    this.addViewPreset('front', {
      position: { x: 0, y: 0, z: 5 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Front View',
    });

    this.addViewPreset('back', {
      position: { x: 0, y: 0, z: -5 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Back View',
    });

    this.addViewPreset('left', {
      position: { x: -5, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Left View',
    });

    this.addViewPreset('right', {
      position: { x: 5, y: 0, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Right View',
    });

    this.addViewPreset('top', {
      position: { x: 0, y: 5, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Top View',
    });

    this.addViewPreset('bottom', {
      position: { x: 0, y: -5, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Bottom View',
    });

    this.addViewPreset('isometric', {
      position: { x: 3.5, y: 3.5, z: 3.5 },
      target: { x: 0, y: 0, z: 0 },
      name: 'Isometric View',
    });
  }

  /**
   * Add a custom view preset
   * @param {string} id - Preset identifier
   * @param {Object} preset - Preset configuration
   */
  addViewPreset(id, preset) {
    if (!preset.position || !preset.target) {
      throw new Error(
        'CameraManager: View preset must have position and target'
      );
    }

    this.viewPresets.set(id, {
      ...preset,
      id,
      createdAt: Date.now(),
    });

    console.log(`CameraManager: View preset "${id}" added`);
  }

  /**
   * Apply a view preset with smooth transition
   * @param {string} presetId - Preset identifier
   * @param {number} duration - Transition duration in milliseconds
   * @returns {Promise} Promise that resolves when transition completes
   */
  async applyViewPreset(presetId, duration = 1000) {
    const preset = this.viewPresets.get(presetId);
    if (!preset) {
      throw new Error(`CameraManager: View preset "${presetId}" not found`);
    }

    const targetPosition = new THREE.Vector3(
      preset.position.x,
      preset.position.y,
      preset.position.z
    );

    const targetLookAt = new THREE.Vector3(
      preset.target.x,
      preset.target.y,
      preset.target.z
    );

    return this.animateToPosition(targetPosition, targetLookAt, duration);
  }

  /**
   * Animate camera to a specific position and target
   * @param {THREE.Vector3} targetPosition - Target position
   * @param {THREE.Vector3} targetLookAt - Target look-at point
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when animation completes
   */
  animateToPosition(targetPosition, targetLookAt, duration = 1000) {
    return new Promise(resolve => {
      const startPosition = this.camera.position.clone();
      const startLookAt = new THREE.Vector3();
      this.camera.getWorldDirection(startLookAt);
      startLookAt.add(this.camera.position);

      const startTime = performance.now();

      const animate = currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easeInOutCubic for smooth animation
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Interpolate position
        this.camera.position.lerpVectors(
          startPosition,
          targetPosition,
          easeProgress
        );

        // Interpolate look-at
        const currentLookAt = new THREE.Vector3().lerpVectors(
          startLookAt,
          targetLookAt,
          easeProgress
        );
        this.camera.lookAt(currentLookAt);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Reset camera to default position
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when reset completes
   */
  async resetToDefault(duration = 1000) {
    return this.animateToPosition(
      this.defaultPosition,
      this.defaultTarget,
      duration
    );
  }

  /**
   * Frame object in view (fit object to camera view)
   * @param {THREE.Object3D|THREE.Box3} object - Object or bounding box to frame
   * @param {number} padding - Additional padding factor (1.0 = no padding, 1.5 = 50% padding)
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise} Promise that resolves when framing completes
   */
  async frameObject(object, padding = 1.2, duration = 1000) {
    let box;

    // Get bounding box
    if (object.isBox3) {
      box = object;
    } else {
      box = new THREE.Box3().setFromObject(object);
    }

    // Calculate center and size
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate camera distance
    const fov = this.camera.fov * (Math.PI / 180);
    const distance = (maxDim * padding) / (2 * Math.tan(fov / 2));

    // Position camera to view object from current direction
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    const targetPosition = center
      .clone()
      .sub(direction.multiplyScalar(distance));

    return this.animateToPosition(targetPosition, center, duration);
  }

  /**
   * Update camera aspect ratio (call on window resize)
   * @param {number} width - New viewport width
   * @param {number} height - New viewport height
   */
  updateAspectRatio(width, height) {
    if (!this.camera) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    console.log(
      `CameraManager: Aspect ratio updated to ${(width / height).toFixed(2)}`
    );
  }

  /**
   * Set camera field of view
   * @param {number} fov - Field of view in degrees
   */
  setFieldOfView(fov) {
    if (!this.camera) return;

    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();

    console.log(`CameraManager: FOV set to ${fov} degrees`);
  }

  /**
   * Set camera near and far clipping planes
   * @param {number} near - Near clipping plane
   * @param {number} far - Far clipping plane
   */
  setClippingPlanes(near, far) {
    if (!this.camera) return;

    this.camera.near = near;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();

    console.log(
      `CameraManager: Clipping planes set to near=${near}, far=${far}`
    );
  }

  /**
   * Get current camera state
   * @returns {Object} Current camera state
   */
  getCameraState() {
    if (!this.camera) return null;

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);

    return {
      position: this.camera.position.clone(),
      rotation: this.camera.rotation.clone(),
      quaternion: this.camera.quaternion.clone(),
      direction: direction,
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far,
      zoom: this.camera.zoom,
    };
  }

  /**
   * Set camera state
   * @param {Object} state - Camera state to apply
   * @param {boolean} animate - Whether to animate to the new state
   * @param {number} duration - Animation duration if animated
   * @returns {Promise|undefined} Promise if animated, undefined otherwise
   */
  setCameraState(state, animate = false, duration = 1000) {
    if (!this.camera || !state) return;

    if (animate && state.position) {
      // Calculate target look-at point from position and direction
      const targetLookAt = state.position
        .clone()
        .add(state.direction || new THREE.Vector3(0, 0, -1));
      return this.animateToPosition(state.position, targetLookAt, duration);
    } else {
      // Apply state immediately
      if (state.position) this.camera.position.copy(state.position);
      if (state.rotation) this.camera.rotation.copy(state.rotation);
      if (state.quaternion) this.camera.quaternion.copy(state.quaternion);
      if (state.fov !== undefined) this.camera.fov = state.fov;
      if (state.zoom !== undefined) this.camera.zoom = state.zoom;
      if (state.near !== undefined) this.camera.near = state.near;
      if (state.far !== undefined) this.camera.far = state.far;

      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Get all available view presets
   * @returns {Map} Map of all view presets
   */
  getViewPresets() {
    return new Map(this.viewPresets);
  }

  /**
   * Get camera statistics and info
   * @returns {Object} Camera information
   */
  getInfo() {
    if (!this.camera) return null;

    const state = this.getCameraState();

    return {
      type: 'PerspectiveCamera',
      state,
      presets: Array.from(this.viewPresets.keys()),
      isInitialized: this._initialized,
      isDisposed: this._disposed,
    };
  }

  /**
   * Clean up camera resources
   */
  dispose() {
    if (this._disposed) return;

    console.log('CameraManager: Starting cleanup...');

    // Clear presets
    this.viewPresets.clear();

    // Clear references
    this.camera = null;
    this.defaultPosition = null;
    this.defaultTarget = null;

    this._disposed = true;
    console.log('CameraManager: Cleanup completed');
  }

  /**
   * Get the Three.js camera object
   * @returns {THREE.PerspectiveCamera} The camera object
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Check if camera manager is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Check if camera manager is disposed
   * @returns {boolean} Disposal status
   */
  isDisposed() {
    return this._disposed;
  }
}
