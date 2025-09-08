import * as THREE from 'three';

/**
 * SceneManager handles all Three.js scene-related operations
 * Manages scene graph, objects, and provides centralized scene control
 */
export class SceneManager {
  constructor(config = {}) {
    this.config = config;
    this.scene = null;
    this.objects = new Map(); // Track all objects with IDs
    this.disposables = new Set(); // Track disposable resources
    this.background = null;
    this.environment = null;

    this._initialized = false;
    this._disposed = false;

    this.init();
  }

  /**
   * Initialize the scene with default settings
   */
  init() {
    if (this._initialized) return;

    // Create the main scene
    this.scene = new THREE.Scene();

    // Set up default background
    this.setBackground(this.config.scene?.backgroundColor || 0x000000);

    // Set up fog if enabled
    if (this.config.scene?.fog?.enabled) {
      this.setupFog(this.config.scene.fog);
    }

    // Initialize coordinate system helpers (development only)
    if (this.config.development?.showHelpers) {
      this.addHelpers();
    }

    this._initialized = true;
    console.log('SceneManager: Scene initialized successfully');
  }

  /**
   * Set the scene background
   * @param {number|THREE.Color|THREE.Texture|THREE.CubeTexture} background
   */
  setBackground(background) {
    if (typeof background === 'number') {
      this.scene.background = new THREE.Color(background);
    } else if (
      background instanceof THREE.Color ||
      background instanceof THREE.Texture ||
      background instanceof THREE.CubeTexture
    ) {
      this.scene.background = background;
    } else if (background === null) {
      this.scene.background = null;
    }

    this.background = background;
  }

  /**
   * Set the scene environment map for IBL (Image Based Lighting)
   * @param {THREE.CubeTexture|THREE.Texture} envMap - Environment map
   */
  setEnvironment(envMap) {
    this.scene.environment = envMap;
    this.environment = envMap;

    if (envMap) {
      console.log('SceneManager: Environment map applied for IBL');
    }
  }

  /**
   * Add an object to the scene with tracking
   * @param {THREE.Object3D} object - Object to add
   * @param {string} id - Unique identifier for the object
   * @param {Object} metadata - Additional metadata for the object
   */
  addObject(object, id, metadata = {}) {
    if (!object || !object.isObject3D) {
      throw new Error('SceneManager: Invalid object provided');
    }

    if (id && this.objects.has(id)) {
      console.warn(
        `SceneManager: Object with ID "${id}" already exists, replacing...`
      );
      this.removeObject(id);
    }

    // Add to scene
    this.scene.add(object);

    // Track the object
    if (id) {
      this.objects.set(id, {
        object,
        metadata,
        addedAt: Date.now(),
      });
    }

    // Track disposable resources
    this._trackDisposables(object);

    console.log(`SceneManager: Added object ${id || 'unnamed'} to scene`);
    return object;
  }

  /**
   * Remove an object from the scene
   * @param {string} id - Object ID to remove
   * @returns {boolean} Success status
   */
  removeObject(id) {
    const objectData = this.objects.get(id);
    if (!objectData) {
      console.warn(`SceneManager: Object with ID "${id}" not found`);
      return false;
    }

    const { object } = objectData;

    // Remove from scene
    this.scene.remove(object);

    // Remove from tracking
    this.objects.delete(id);

    // Dispose of resources if requested
    this._disposeObject(object);

    console.log(`SceneManager: Removed object "${id}" from scene`);
    return true;
  }

  /**
   * Get an object by ID
   * @param {string} id - Object ID
   * @returns {THREE.Object3D|null} The object or null if not found
   */
  getObject(id) {
    const objectData = this.objects.get(id);
    return objectData ? objectData.object : null;
  }

  /**
   * Get all objects in the scene
   * @returns {Map} Map of all tracked objects
   */
  getAllObjects() {
    return new Map(this.objects);
  }

  /**
   * Clear all objects from the scene
   * @param {boolean} dispose - Whether to dispose of resources
   */
  clearScene(dispose = true) {
    // Remove all tracked objects
    for (const [id, objectData] of this.objects) {
      this.scene.remove(objectData.object);
      if (dispose) {
        this._disposeObject(objectData.object);
      }
    }

    this.objects.clear();

    // Clear any remaining children that weren't tracked
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      this.scene.remove(child);
      if (dispose) {
        this._disposeObject(child);
      }
    }

    console.log('SceneManager: Scene cleared');
  }

  /**
   * Set up fog for the scene
   * @param {Object} fogConfig - Fog configuration
   */
  setupFog(fogConfig) {
    const { type, color, near, far, density } = fogConfig;

    if (type === 'linear') {
      this.scene.fog = new THREE.Fog(color, near, far);
    } else if (type === 'exponential') {
      this.scene.fog = new THREE.FogExp2(color, density);
    }

    console.log(`SceneManager: ${type} fog applied`);
  }

  /**
   * Add visual helpers for development
   */
  addHelpers() {
    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    gridHelper.name = 'GridHelper';
    this.scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.name = 'AxesHelper';
    this.scene.add(axesHelper);

    console.log('SceneManager: Development helpers added');
  }

  /**
   * Remove visual helpers
   */
  removeHelpers() {
    const helpersToRemove = [];
    this.scene.traverse(child => {
      if (
        child.name &&
        (child.name.includes('Helper') || child.name.includes('helper'))
      ) {
        helpersToRemove.push(child);
      }
    });

    helpersToRemove.forEach(helper => {
      this.scene.remove(helper);
      this._disposeObject(helper);
    });

    console.log('SceneManager: Helpers removed');
  }

  /**
   * Get scene statistics
   * @returns {Object} Scene statistics
   */
  getStats() {
    let triangles = 0;
    let vertices = 0;
    let materials = 0;
    let textures = 0;
    let objects = 0;

    this.scene.traverse(child => {
      objects++;

      if (child.isMesh) {
        if (child.geometry) {
          const geometry = child.geometry;
          if (geometry.index) {
            triangles += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangles += geometry.attributes.position.count / 3;
          }
          vertices += geometry.attributes.position
            ? geometry.attributes.position.count
            : 0;
        }

        if (child.material) {
          materials++;
          // Count textures in material
          const material = Array.isArray(child.material)
            ? child.material[0]
            : child.material;
          Object.values(material).forEach(value => {
            if (value && value.isTexture) {
              textures++;
            }
          });
        }
      }
    });

    return {
      objects,
      triangles: Math.floor(triangles),
      vertices,
      materials,
      textures,
      trackedObjects: this.objects.size,
      disposables: this.disposables.size,
    };
  }

  /**
   * Update scene (called every frame)
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Override in subclasses if needed
    // This is where you'd update animations, physics, etc.
  }

  /**
   * Track disposable resources for memory management
   * @param {THREE.Object3D} object - Object to track
   * @private
   */
  _trackDisposables(object) {
    object.traverse(child => {
      // Track geometries
      if (child.geometry) {
        this.disposables.add(child.geometry);
      }

      // Track materials
      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach(material => {
          this.disposables.add(material);

          // Track textures in materials
          Object.values(material).forEach(value => {
            if (value && value.isTexture) {
              this.disposables.add(value);
            }
          });
        });
      }
    });
  }

  /**
   * Dispose of an object and its resources
   * @param {THREE.Object3D} object - Object to dispose
   * @private
   */
  _disposeObject(object) {
    object.traverse(child => {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }

      // Dispose materials and textures
      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.forEach(material => {
          // Dispose textures first
          Object.values(material).forEach(value => {
            if (value && value.isTexture) {
              value.dispose();
            }
          });

          // Dispose material
          material.dispose();
        });
      }
    });
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    if (this._disposed) return;

    console.log('SceneManager: Starting cleanup...');

    // Clear the scene
    this.clearScene(true);

    // Dispose of tracked disposables
    this.disposables.forEach(disposable => {
      if (disposable && typeof disposable.dispose === 'function') {
        disposable.dispose();
      }
    });
    this.disposables.clear();

    // Clear references
    this.scene = null;
    this.objects.clear();
    this.background = null;
    this.environment = null;

    this._disposed = true;
    console.log('SceneManager: Cleanup completed');
  }

  /**
   * Get the Three.js scene object
   * @returns {THREE.Scene} The scene object
   */
  getScene() {
    return this.scene;
  }

  /**
   * Check if scene manager is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Check if scene manager is disposed
   * @returns {boolean} Disposal status
   */
  isDisposed() {
    return this._disposed;
  }
}
