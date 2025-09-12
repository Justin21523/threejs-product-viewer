import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * ModelManager handles all 3D model loading, caching, and optimization
 * Supports GLTF/GLB with Draco compression, KTX2 textures, and Meshopt compression
 */
export class ModelManager extends THREE.EventDispatcher {
  constructor(renderer, config = {}) {
    super();

    this.renderer = renderer;
    this.config = config;

    // Current model state
    this.currentModel = null;
    this.modelBounds = null;
    this.originalMaterials = new Map();

    // Caching system
    this.modelCache = new Map();
    this.maxCacheSize = config.maxCacheSize || 10;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      totalSize: 0,
    };

    // Loading queue and state
    this.loadingQueue = [];
    this.isLoading = false;
    this.loadingProgress = 0;

    // Loaders
    this.gltfLoader = null;
    this.dracoLoader = null;
    this.ktx2Loader = null;

    // Disposed state
    this._disposed = false;

    this.init();
  }

  /**
   * Initialize loaders and configure compression support
   */
  init() {
    console.log('ModelManager: Initializing loaders...');

    // Initialize DRACO loader for geometry compression
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });

    // Initialize KTX2 loader for texture compression
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/basis/');
    this.ktx2Loader.detectSupport(this.renderer);

    // Initialize GLTF loader with extensions
    this.gltfLoader = new GLTFLoader();

    if (this.config.model?.enableDraco !== false) {
      this.gltfLoader.setDRACOLoader(this.dracoLoader);
    }

    if (this.config.model?.enableKTX2 !== false) {
      this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    }

    if (this.config.model?.enableMeshOpt !== false) {
      this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }

    console.log('ModelManager: Loaders initialized with compression support');
  }

  /**
   * Load a 3D model from URL with caching and progress tracking
   * @param {string} url - Model file URL
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Group>} Loaded and processed model
   */
  async loadModel(url, options = {}) {
    if (!url) {
      throw new Error('ModelManager: Model URL is required');
    }

    console.log(`ModelManager: Loading model from ${url}`);
    this.dispatchEvent({ type: 'loadStart', url, options });

    try {
      // Check cache first
      if (this.modelCache.has(url) && !options.forceReload) {
        console.log(`ModelManager: Loading model from cache: ${url}`);
        this.cacheStats.hits++;
        const cachedModel = this.modelCache.get(url);
        return this._processLoadedModel(cachedModel.clone(), url, options);
      }

      this.cacheStats.misses++;

      // Set loading state
      this.isLoading = true;
      this.loadingProgress = 0;

      // Load model with progress tracking
      const gltf = await this._loadModelWithProgress(url, options);

      if (!gltf || !gltf.scene) {
        throw new Error(`Invalid model data received from ${url}`);
      }

      // Process the loaded model
      const processedModel = await this._processLoadedModel(
        gltf.scene,
        url,
        options
      );

      // Cache the original model for reuse
      this._addToCache(url, gltf.scene.clone());

      this.isLoading = false;
      this.dispatchEvent({
        type: 'loadComplete',
        model: processedModel,
        url,
        animations: gltf.animations || [],
      });

      return processedModel;
    } catch (error) {
      this.isLoading = false;
      const enhancedError = new Error(
        `Failed to load model from ${url}: ${error.message}`
      );
      enhancedError.originalError = error;
      enhancedError.url = url;

      this.dispatchEvent({ type: 'loadError', error: enhancedError, url });
      throw enhancedError;
    }
  }

  /**
   * Load model with detailed progress tracking
   * @param {string} url - Model URL
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} GLTF object
   * @private
   */
  _loadModelWithProgress(url, options) {
    return new Promise((resolve, reject) => {
      const timeout = this.config.model?.loadingTimeout || 30000;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Loading timeout after ${timeout}ms`));
      }, timeout);

      // Load with progress callback
      this.gltfLoader.load(
        url,
        // onLoad callback
        gltf => {
          clearTimeout(timeoutId);
          this.loadingProgress = 100;
          this.dispatchEvent({
            type: 'loadProgress',
            progress: 100,
            url,
            stage: 'complete',
          });
          resolve(gltf);
        },
        // onProgress callback
        progress => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            this.loadingProgress = percentComplete;
            this.dispatchEvent({
              type: 'loadProgress',
              progress: percentComplete,
              loaded: progress.loaded,
              total: progress.total,
              url,
              stage: 'downloading',
            });
          }
        },
        // onError callback
        error => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  /**
   * Process loaded model - optimize, analyze, and prepare for rendering
   * @param {THREE.Group} model - Raw loaded model
   * @param {string} url - Source URL
   * @param {Object} options - Processing options
   * @returns {THREE.Group} Processed model
   * @private
   */
  async _processLoadedModel(model, url, options = {}) {
    console.log('ModelManager: Processing loaded model...');
    this.dispatchEvent({
      type: 'loadProgress',
      progress: 90,
      stage: 'processing',
      url,
    });

    // Store original materials for later restoration
    this._storeOriginalMaterials(model);

    // Optimize model if requested
    if (options.optimize !== false) {
      this._optimizeModel(model);
    }

    // Calculate model bounds for camera framing
    this.modelBounds = new THREE.Box3().setFromObject(model);

    // Center model if requested
    if (options.center !== false) {
      this._centerModel(model);
    }

    // Apply material enhancements
    if (options.enhanceMaterials !== false) {
      this._enhanceMaterials(model);
    }

    // Set up shadows if enabled
    if (this.config.renderer?.shadowMap?.enabled) {
      this._setupShadows(model);
    }

    // Store reference to current model
    this.currentModel = model;

    console.log('ModelManager: Model processing completed');
    this.dispatchEvent({
      type: 'modelProcessed',
      model,
      bounds: this.modelBounds,
      url,
    });

    return model;
  }

  /**
   * Store original materials for later restoration
   * @param {THREE.Group} model - Model to analyze
   * @private
   */
  _storeOriginalMaterials(model) {
    this.originalMaterials.clear();

    model.traverse(child => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((material, index) => {
          const key = `${child.uuid}_${index}`;
          this.originalMaterials.set(key, material.clone());
        });
      }
    });

    console.log(
      `ModelManager: Stored ${this.originalMaterials.size} original materials`
    );
  }

  /**
   * Optimize model geometry and materials for better performance
   * @param {THREE.Group} model - Model to optimize
   * @private
   */
  _optimizeModel(model) {
    let geometryCount = 0;
    let materialCount = 0;

    model.traverse(child => {
      if (child.isMesh) {
        // Optimize geometry
        if (child.geometry) {
          // Compute vertex normals if missing
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }

          // Compute bounding sphere for frustum culling
          if (!child.geometry.boundingSphere) {
            child.geometry.computeBoundingSphere();
          }

          geometryCount++;
        }

        // Optimize materials
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          materials.forEach(material => {
            // Enable vertex colors if available
            if (child.geometry.attributes.color && !material.vertexColors) {
              material.vertexColors = true;
            }

            // Optimize material settings for performance
            if (
              material.isMeshStandardMaterial ||
              material.isMeshPhysicalMaterial
            ) {
              // Set appropriate material properties for better performance
              material.needsUpdate = true;
            }

            materialCount++;
          });
        }

        // Enable frustum culling
        child.frustumCulled = true;
      }
    });

    console.log(
      `ModelManager: Optimized ${geometryCount} geometries and ${materialCount} materials`
    );
  }

  /**
   * Center model at origin
   * @param {THREE.Group} model - Model to center
   * @private
   */
  _centerModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.sub(center);

    console.log(
      `ModelManager: Model centered at origin (offset: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`
    );
  }

  /**
   * Enhance materials for better visual quality
   * @param {THREE.Group} model - Model to enhance
   * @private
   */
  _enhanceMaterials(model) {
    let enhancedCount = 0;

    model.traverse(child => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach(material => {
          if (
            material.isMeshStandardMaterial ||
            material.isMeshPhysicalMaterial
          ) {
            // Enable environment mapping if available
            if (
              this.renderer
                .getContext()
                .getParameter(
                  this.renderer.getContext().MAX_CUBE_MAP_TEXTURE_SIZE
                ) > 0
            ) {
              material.envMapIntensity = material.envMapIntensity || 1.0;
            }

            // Ensure proper color space
            if (material.map) {
              material.map.colorSpace = THREE.SRGBColorSpace;
            }

            enhancedCount++;
          }
        });
      }
    });

    console.log(`ModelManager: Enhanced ${enhancedCount} materials`);
  }

  /**
   * Setup shadow casting and receiving for model
   * @param {THREE.Group} model - Model to setup shadows for
   * @private
   */
  _setupShadows(model) {
    let shadowCasters = 0;
    let shadowReceivers = 0;

    model.traverse(child => {
      if (child.isMesh) {
        // Enable shadow casting for opaque objects
        if (child.material && child.material.transparent !== true) {
          child.castShadow = true;
          shadowCasters++;
        }

        // Enable shadow receiving for ground-like objects
        child.receiveShadow = true;
        shadowReceivers++;
      }
    });

    console.log(
      `ModelManager: Setup shadows - ${shadowCasters} casters, ${shadowReceivers} receivers`
    );
  }

  /**
   * Add model to cache with size management
   * @param {string} url - Model URL
   * @param {THREE.Group} model - Model to cache
   * @private
   */
  _addToCache(url, model) {
    // Remove oldest entry if cache is full
    if (this.modelCache.size >= this.maxCacheSize) {
      const firstKey = this.modelCache.keys().next().value;
      const oldModel = this.modelCache.get(firstKey);
      this._disposeModel(oldModel);
      this.modelCache.delete(firstKey);
      console.log(
        `ModelManager: Removed ${firstKey} from cache (size limit reached)`
      );
    }

    // Add to cache
    this.modelCache.set(url, model);
    this.cacheStats.totalSize = this.modelCache.size;

    console.log(
      `ModelManager: Added ${url} to cache (${this.modelCache.size}/${this.maxCacheSize})`
    );
  }

  /**
   * Get current model bounds
   * @returns {THREE.Box3|null} Model bounding box
   */
  getModelBounds() {
    return this.modelBounds;
  }

  /**
   * Get current model
   * @returns {THREE.Group|null} Current model
   */
  getCurrentModel() {
    return this.currentModel;
  }

  /**
   * Remove current model from scene
   */
  removeCurrentModel() {
    if (this.currentModel) {
      this.dispatchEvent({ type: 'modelRemoved', model: this.currentModel });
      this.currentModel = null;
      this.modelBounds = null;
      console.log('ModelManager: Current model removed');
    }
  }

  /**
   * Get model loading progress
   * @returns {number} Progress percentage (0-100)
   */
  getLoadingProgress() {
    return this.loadingProgress;
  }

  /**
   * Check if currently loading
   * @returns {boolean} Loading status
   */
  isLoadingModel() {
    return this.isLoading;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      cacheSize: this.modelCache.size,
      maxCacheSize: this.maxCacheSize,
      hitRate:
        this.cacheStats.hits /
          (this.cacheStats.hits + this.cacheStats.misses) || 0,
    };
  }

  /**
   * Clear model cache
   */
  clearCache() {
    this.modelCache.forEach((model, url) => {
      this._disposeModel(model);
    });
    this.modelCache.clear();
    this.cacheStats.totalSize = 0;
    console.log('ModelManager: Cache cleared');
  }

  /**
   * Get model information and statistics
   * @returns {Object} Model information
   */
  getInfo() {
    const stats = this.currentModel
      ? this._getModelStats(this.currentModel)
      : null;

    return {
      hasCurrentModel: !!this.currentModel,
      isLoading: this.isLoading,
      loadingProgress: this.loadingProgress,
      modelBounds: this.modelBounds,
      cache: this.getCacheStats(),
      modelStats: stats,
      supportedFormats: ['gltf', 'glb'],
      compressionSupport: {
        draco: this.config.model?.enableDraco !== false,
        ktx2: this.config.model?.enableKTX2 !== false,
        meshopt: this.config.model?.enableMeshOpt !== false,
      },
    };
  }

  /**
   * Get detailed statistics for a model
   * @param {THREE.Group} model - Model to analyze
   * @returns {Object} Model statistics
   * @private
   */
  _getModelStats(model) {
    let meshCount = 0;
    let triangleCount = 0;
    let vertexCount = 0;
    let materialCount = 0;
    let textureCount = 0;

    const materials = new Set();
    const textures = new Set();

    model.traverse(child => {
      if (child.isMesh) {
        meshCount++;

        if (child.geometry) {
          const geometry = child.geometry;
          if (geometry.index) {
            triangleCount += geometry.index.count / 3;
          } else if (geometry.attributes.position) {
            triangleCount += geometry.attributes.position.count / 3;
          }

          if (geometry.attributes.position) {
            vertexCount += geometry.attributes.position.count;
          }
        }

        if (child.material) {
          const meshMaterials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          meshMaterials.forEach(material => {
            materials.add(material);

            // Count textures
            Object.values(material).forEach(value => {
              if (value && value.isTexture) {
                textures.add(value);
              }
            });
          });
        }
      }
    });

    return {
      meshCount,
      triangleCount: Math.floor(triangleCount),
      vertexCount,
      materialCount: materials.size,
      textureCount: textures.size,
    };
  }

  /**
   * Dispose of a model and its resources
   * @param {THREE.Group} model - Model to dispose
   * @private
   */
  _disposeModel(model) {
    if (!model) return;

    model.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach(material => {
          // Dispose textures
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
   * Clean up resources and dispose of manager
   */
  dispose() {
    if (this._disposed) return;

    console.log('ModelManager: Starting cleanup...');

    // Clear cache
    this.clearCache();

    // Dispose current model
    if (this.currentModel) {
      this._disposeModel(this.currentModel);
    }

    // Dispose loaders
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
    }

    // Clear references
    this.currentModel = null;
    this.modelBounds = null;
    this.originalMaterials.clear();
    this.loadingQueue = [];

    this._disposed = true;
    console.log('ModelManager: Cleanup completed');
  }
}
