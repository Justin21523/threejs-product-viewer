import * as THREE from 'three';

/**
 * MaterialManager handles all material-related operations
 * Provides material presets, real-time switching, and material enhancements
 */
export class MaterialManager extends THREE.EventDispatcher {
  constructor(config = {}) {
    super();

    this.config = config;

    // Material storage and state
    this.materials = new Map();
    this.presets = new Map();
    this.appliedMaterials = new Map(); // Track applied materials by object
    this.originalMaterials = new Map(); // Store original materials for restoration

    // Texture loading
    this.textureLoader = new THREE.TextureLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.textureCache = new Map();

    // Current state
    this.currentPreset = 'default';
    this.currentModel = null;

    this._disposed = false;

    this.init();
  }

  /**
   * Initialize material manager with default presets
   */
  async init() {
    console.log('MaterialManager: Initializing...');

    // Load material presets
    await this.loadMaterialPresets();

    // Create default materials
    this.createDefaultMaterials();

    console.log('MaterialManager: Initialization completed');
  }

  /**
   * Load material presets from configuration or external source
   */
  async loadMaterialPresets() {
    // Default material presets
    const defaultPresets = {
      default: {
        name: 'Default',
        description: 'Standard material with balanced properties',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0xffffff,
          metalness: 0.0,
          roughness: 1.0,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      metallic: {
        name: 'Metallic',
        description: 'Highly reflective metallic surface',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0xc0c0c0,
          metalness: 1.0,
          roughness: 0.1,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      matte: {
        name: 'Matte',
        description: 'Non-reflective matte finish',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0xffffff,
          metalness: 0.0,
          roughness: 0.9,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      glossy: {
        name: 'Glossy',
        description: 'Smooth glossy surface with some reflection',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0xffffff,
          metalness: 0.1,
          roughness: 0.1,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      glass: {
        name: 'Glass',
        description: 'Transparent glass material',
        type: 'MeshPhysicalMaterial',
        properties: {
          color: 0xffffff,
          metalness: 0.0,
          roughness: 0.0,
          transmission: 1.0,
          transparent: true,
          opacity: 0.9,
          ior: 1.5,
          thickness: 0.5,
        },
      },

      plastic: {
        name: 'Plastic',
        description: 'Smooth plastic material',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0x4a90e2,
          metalness: 0.0,
          roughness: 0.3,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      ceramic: {
        name: 'Ceramic',
        description: 'Smooth ceramic surface',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0xf8f8f8,
          metalness: 0.0,
          roughness: 0.2,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },

      carbon_fiber: {
        name: 'Carbon Fiber',
        description: 'Woven carbon fiber pattern',
        type: 'MeshStandardMaterial',
        properties: {
          color: 0x1a1a1a,
          metalness: 0.8,
          roughness: 0.4,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          transparent: false,
          opacity: 1.0,
        },
      },
    };

    // Store presets
    for (const [key, preset] of Object.entries(defaultPresets)) {
      this.presets.set(key, preset);
    }

    console.log(
      `MaterialManager: Loaded ${this.presets.size} material presets`
    );
  }

  /**
   * Create default material instances
   */
  createDefaultMaterials() {
    for (const [key, preset] of this.presets) {
      const material = this.createMaterialFromPreset(preset);
      this.materials.set(key, material);
    }

    console.log(
      `MaterialManager: Created ${this.materials.size} default materials`
    );
  }

  /**
   * Create a material from a preset definition
   * @param {Object} preset - Material preset
   * @returns {THREE.Material} Created material
   */
  createMaterialFromPreset(preset) {
    let material;

    switch (preset.type) {
      case 'MeshPhysicalMaterial':
        material = new THREE.MeshPhysicalMaterial();
        break;
      case 'MeshStandardMaterial':
        material = new THREE.MeshStandardMaterial();
        break;
      case 'MeshLambertMaterial':
        material = new THREE.MeshLambertMaterial();
        break;
      case 'MeshPhongMaterial':
        material = new THREE.MeshPhongMaterial();
        break;
      default:
        material = new THREE.MeshStandardMaterial();
    }

    // Apply properties
    this.applyMaterialProperties(material, preset.properties);

    // Set material name
    material.name = preset.name || 'Unnamed Material';

    return material;
  }

  /**
   * Apply properties to a material
   * @param {THREE.Material} material - Material to modify
   * @param {Object} properties - Properties to apply
   */
  applyMaterialProperties(material, properties) {
    for (const [key, value] of Object.entries(properties)) {
      if (material.hasOwnProperty(key)) {
        if (typeof value === 'number' && key === 'color') {
          material[key] = new THREE.Color(value);
        } else if (typeof value === 'number' && key === 'emissive') {
          material[key] = new THREE.Color(value);
        } else {
          material[key] = value;
        }
      }
    }

    material.needsUpdate = true;
  }

  /**
   * Apply material preset to the current model
   * @param {string} presetName - Name of the preset to apply
   * @param {THREE.Object3D} model - Model to apply material to (optional, uses current model if not provided)
   * @returns {Promise<boolean>} Success status
   */
  async applyMaterialPreset(presetName, model = null) {
    const targetModel = model || this.currentModel;

    if (!targetModel) {
      console.warn(
        'MaterialManager: No model available for material application'
      );
      return false;
    }

    const preset = this.presets.get(presetName);
    if (!preset) {
      console.warn(`MaterialManager: Preset "${presetName}" not found`);
      return false;
    }

    console.log(
      `MaterialManager: Applying material preset "${presetName}" to model`
    );

    try {
      // Store original materials if this is the first time
      if (this.currentPreset === 'default' && presetName !== 'default') {
        this.storeOriginalMaterials(targetModel);
      }

      // Create material from preset
      const material = this.createMaterialFromPreset(preset);

      // Apply to all meshes in the model
      let appliedCount = 0;
      targetModel.traverse(child => {
        if (child.isMesh) {
          // Store reference to applied material
          this.appliedMaterials.set(child.uuid, child.material);

          // Apply new material
          child.material = material;
          appliedCount++;
        }
      });

      this.currentPreset = presetName;

      console.log(
        `MaterialManager: Applied "${presetName}" to ${appliedCount} meshes`
      );

      this.dispatchEvent({
        type: 'materialPresetApplied',
        preset: presetName,
        material: material,
        appliedCount,
      });

      return true;
    } catch (error) {
      console.error('MaterialManager: Failed to apply material preset:', error);
      this.dispatchEvent({
        type: 'materialError',
        error: error.message,
        preset: presetName,
      });
      return false;
    }
  }

  /**
   * Store original materials for restoration
   * @param {THREE.Object3D} model - Model to store materials from
   */
  storeOriginalMaterials(model) {
    this.originalMaterials.clear();

    model.traverse(child => {
      if (child.isMesh && child.material) {
        // Clone the material to preserve original state
        const originalMaterial = Array.isArray(child.material)
          ? child.material.map(mat => mat.clone())
          : child.material.clone();

        this.originalMaterials.set(child.uuid, originalMaterial);
      }
    });

    console.log(
      `MaterialManager: Stored ${this.originalMaterials.size} original materials`
    );
  }

  /**
   * Restore original materials to the model
   * @param {THREE.Object3D} model - Model to restore materials to (optional)
   * @returns {boolean} Success status
   */
  restoreOriginalMaterials(model = null) {
    const targetModel = model || this.currentModel;

    if (!targetModel || this.originalMaterials.size === 0) {
      console.warn('MaterialManager: No original materials to restore');
      return false;
    }

    console.log('MaterialManager: Restoring original materials');

    let restoredCount = 0;
    targetModel.traverse(child => {
      if (child.isMesh && this.originalMaterials.has(child.uuid)) {
        child.material = this.originalMaterials.get(child.uuid);
        restoredCount++;
      }
    });

    this.currentPreset = 'original';

    console.log(
      `MaterialManager: Restored ${restoredCount} original materials`
    );
    this.dispatchEvent({ type: 'materialsRestored', restoredCount });

    return true;
  }

  /**
   * Create a custom material with specific properties
   * @param {string} name - Material name
   * @param {string} type - Material type
   * @param {Object} properties - Material properties
   * @returns {THREE.Material} Created material
   */
  createCustomMaterial(name, type = 'MeshStandardMaterial', properties = {}) {
    const preset = {
      name,
      type,
      properties,
    };

    const material = this.createMaterialFromPreset(preset);
    this.materials.set(name, material);

    console.log(`MaterialManager: Created custom material "${name}"`);
    return material;
  }

  /**
   * Load texture and apply to material property
   * @param {string} textureUrl - Texture file URL
   * @param {THREE.Material} material - Material to apply texture to
   * @param {string} property - Material property name (map, normalMap, etc.)
   * @returns {Promise<THREE.Texture>} Loaded texture
   */
  async loadAndApplyTexture(textureUrl, material, property = 'map') {
    try {
      // Check cache first
      if (this.textureCache.has(textureUrl)) {
        const texture = this.textureCache.get(textureUrl);
        material[property] = texture;
        material.needsUpdate = true;
        return texture;
      }

      console.log(
        `MaterialManager: Loading texture ${textureUrl} for ${property}`
      );

      const texture = await this.loadTexture(textureUrl);

      // Configure texture
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace =
        property === 'map' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;

      // Apply to material
      material[property] = texture;
      material.needsUpdate = true;

      // Cache texture
      this.textureCache.set(textureUrl, texture);

      console.log(`MaterialManager: Applied texture to ${property}`);
      this.dispatchEvent({
        type: 'textureApplied',
        textureUrl,
        material,
        property,
      });

      return texture;
    } catch (error) {
      console.error(
        `MaterialManager: Failed to load texture ${textureUrl}:`,
        error
      );
      this.dispatchEvent({
        type: 'textureError',
        error: error.message,
        textureUrl,
      });
      throw error;
    }
  }

  /**
   * Load texture with promise wrapper
   * @param {string} url - Texture URL
   * @returns {Promise<THREE.Texture>} Loaded texture
   */
  loadTexture(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => resolve(texture),
        progress => {
          // Progress callback (optional)
        },
        error => reject(error)
      );
    });
  }

  /**
   * Update material property in real-time
   * @param {string} propertyName - Property to update
   * @param {*} value - New value
   * @param {THREE.Object3D} model - Target model (optional)
   */
  updateMaterialProperty(propertyName, value, model = null) {
    const targetModel = model || this.currentModel;

    if (!targetModel) {
      console.warn('MaterialManager: No model available for material update');
      return;
    }

    let updatedCount = 0;
    targetModel.traverse(child => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach(material => {
          if (material.hasOwnProperty(propertyName)) {
            if (propertyName === 'color' || propertyName === 'emissive') {
              material[propertyName] = new THREE.Color(value);
            } else {
              material[propertyName] = value;
            }
            material.needsUpdate = true;
            updatedCount++;
          }
        });
      }
    });

    console.log(
      `MaterialManager: Updated ${propertyName} to ${value} on ${updatedCount} materials`
    );
    this.dispatchEvent({
      type: 'materialPropertyUpdated',
      property: propertyName,
      value,
      updatedCount,
    });
  }

  /**
   * Set current model for material operations
   * @param {THREE.Object3D} model - Model to work with
   */
  setCurrentModel(model) {
    this.currentModel = model;

    if (model) {
      // Analyze model materials
      const materialInfo = this.analyzeMaterials(model);
      console.log('MaterialManager: Current model set', materialInfo);

      this.dispatchEvent({
        type: 'currentModelChanged',
        model,
        materialInfo,
      });
    }
  }

  /**
   * Analyze materials in a model
   * @param {THREE.Object3D} model - Model to analyze
   * @returns {Object} Material analysis
   */
  analyzeMaterials(model) {
    const materials = new Set();
    const materialTypes = new Set();
    let meshCount = 0;

    model.traverse(child => {
      if (child.isMesh) {
        meshCount++;

        if (child.material) {
          const meshMaterials = Array.isArray(child.material)
            ? child.material
            : [child.material];

          meshMaterials.forEach(material => {
            materials.add(material);
            materialTypes.add(material.type);
          });
        }
      }
    });

    return {
      meshCount,
      uniqueMaterials: materials.size,
      materialTypes: Array.from(materialTypes),
      hasTextures: Array.from(materials).some(
        mat => mat.map || mat.normalMap || mat.roughnessMap || mat.metalnessMap
      ),
    };
  }

  /**
   * Get available material presets
   * @returns {Array} Array of preset information
   */
  getAvailablePresets() {
    return Array.from(this.presets.entries()).map(([key, preset]) => ({
      id: key,
      name: preset.name,
      description: preset.description,
      type: preset.type,
    }));
  }

  /**
   * Get current material preset
   * @returns {string} Current preset name
   */
  getCurrentPreset() {
    return this.currentPreset;
  }

  /**
   * Add a custom material preset
   * @param {string} id - Preset ID
   * @param {Object} preset - Preset definition
   */
  addMaterialPreset(id, preset) {
    this.presets.set(id, preset);

    // Create material instance
    const material = this.createMaterialFromPreset(preset);
    this.materials.set(id, material);

    console.log(`MaterialManager: Added custom preset "${id}"`);
    this.dispatchEvent({ type: 'presetAdded', id, preset });
  }

  /**
   * Remove a material preset
   * @param {string} id - Preset ID to remove
   * @returns {boolean} Success status
   */
  removeMaterialPreset(id) {
    if (this.presets.has(id)) {
      this.presets.delete(id);

      if (this.materials.has(id)) {
        this.materials.get(id).dispose();
        this.materials.delete(id);
      }

      console.log(`MaterialManager: Removed preset "${id}"`);
      this.dispatchEvent({ type: 'presetRemoved', id });
      return true;
    }

    return false;
  }

  /**
   * Get material manager information
   * @returns {Object} Manager information
   */
  getInfo() {
    return {
      currentPreset: this.currentPreset,
      availablePresets: this.getAvailablePresets().length,
      currentModel: !!this.currentModel,
      materialCount: this.materials.size,
      textureCache: this.textureCache.size,
      originalMaterialsStored: this.originalMaterials.size,
    };
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    if (this._disposed) return;

    console.log('MaterialManager: Starting cleanup...');

    // Dispose all materials
    this.materials.forEach(material => {
      material.dispose();
    });
    this.materials.clear();

    // Dispose textures
    this.textureCache.forEach(texture => {
      texture.dispose();
    });
    this.textureCache.clear();

    // Clear references
    this.presets.clear();
    this.appliedMaterials.clear();
    this.originalMaterials.clear();
    this.currentModel = null;

    this._disposed = true;
    console.log('MaterialManager: Cleanup completed');
  }
}
