import * as THREE from 'three';

/**
 * LightingManager handles all lighting operations
 * Provides multiple lighting setups, real-time adjustments, and environment mapping
 */
export class LightingManager extends THREE.EventDispatcher {
  constructor(scene, config = {}) {
    super();

    this.scene = scene;
    this.config = config;

    // Light storage and state
    this.lights = new Map();
    this.lightPresets = new Map();
    this.shadowHelpers = new Map();

    // Environment mapping
    this.environmentMap = null;
    this.cubeTextureLoader = new THREE.CubeTextureLoader();
    this.rgbeLoader = null; // Will be initialized if needed

    // Current state
    this.currentPreset = 'studio';
    this.globalIntensity = 1.0;
    this.shadowsEnabled = true;

    // Light animation
    this.animatedLights = new Set();
    this.animationSpeed = 1.0;

    this._disposed = false;

    this.init();
  }

  /**
   * Initialize lighting manager with default setup
   */
  async init() {
    console.log('LightingManager: Initializing...');

    // Load lighting presets
    await this.loadLightingPresets();

    // Create default lighting setup
    await this.setupDefaultLighting();

    // Apply initial preset
    await this.applyLightingPreset(this.currentPreset);

    console.log('LightingManager: Initialization completed');
  }

  /**
   * Load predefined lighting presets
   */
  async loadLightingPresets() {
    const defaultPresets = {
      studio: {
        name: 'Studio Lighting',
        description: 'Professional studio setup with key, fill, and rim lights',
        lights: [
          {
            type: 'DirectionalLight',
            name: 'keyLight',
            color: 0xffffff,
            intensity: 1.2,
            position: [10, 10, 5],
            target: [0, 0, 0],
            castShadow: true,
            shadowMapSize: [2048, 2048],
            shadowCamera: {
              near: 0.5,
              far: 50,
              left: -10,
              right: 10,
              top: 10,
              bottom: -10,
            },
          },
          {
            type: 'DirectionalLight',
            name: 'fillLight',
            color: 0xffffff,
            intensity: 0.4,
            position: [-8, 6, 3],
            target: [0, 0, 0],
            castShadow: false,
          },
          {
            type: 'DirectionalLight',
            name: 'rimLight',
            color: 0xffffff,
            intensity: 0.6,
            position: [0, 8, -8],
            target: [0, 0, 0],
            castShadow: false,
          },
          {
            type: 'AmbientLight',
            name: 'ambient',
            color: 0x404040,
            intensity: 0.3,
          },
        ],
        environment: null,
      },

      outdoor: {
        name: 'Outdoor Lighting',
        description: 'Natural outdoor lighting with sun and sky',
        lights: [
          {
            type: 'DirectionalLight',
            name: 'sun',
            color: 0xffffcc,
            intensity: 1.0,
            position: [15, 20, 10],
            target: [0, 0, 0],
            castShadow: true,
            shadowMapSize: [2048, 2048],
            shadowCamera: {
              near: 0.5,
              far: 100,
              left: -20,
              right: 20,
              top: 20,
              bottom: -20,
            },
          },
          {
            type: 'HemisphereLight',
            name: 'sky',
            skyColor: 0x87ceeb,
            groundColor: 0x8b7355,
            intensity: 0.6,
          },
          {
            type: 'AmbientLight',
            name: 'ambient',
            color: 0x404040,
            intensity: 0.2,
          },
        ],
        environment: null,
      },

      dramatic: {
        name: 'Dramatic Lighting',
        description: 'High contrast dramatic lighting with strong shadows',
        lights: [
          {
            type: 'SpotLight',
            name: 'mainSpot',
            color: 0xffffff,
            intensity: 2.0,
            position: [8, 12, 8],
            target: [0, 0, 0],
            angle: Math.PI / 6,
            penumbra: 0.3,
            distance: 50,
            decay: 2,
            castShadow: true,
            shadowMapSize: [2048, 2048],
          },
          {
            type: 'SpotLight',
            name: 'accent',
            color: 0x4488ff,
            intensity: 0.8,
            position: [-6, 8, -6],
            target: [0, 0, 0],
            angle: Math.PI / 4,
            penumbra: 0.5,
            distance: 30,
            decay: 2,
            castShadow: false,
          },
          {
            type: 'AmbientLight',
            name: 'ambient',
            color: 0x080808,
            intensity: 0.1,
          },
        ],
        environment: null,
      },

      soft: {
        name: 'Soft Lighting',
        description: 'Even, soft lighting with minimal shadows',
        lights: [
          {
            type: 'DirectionalLight',
            name: 'main',
            color: 0xffffff,
            intensity: 0.6,
            position: [5, 8, 5],
            target: [0, 0, 0],
            castShadow: true,
            shadowMapSize: [1024, 1024],
            shadowCamera: {
              near: 0.5,
              far: 30,
              left: -8,
              right: 8,
              top: 8,
              bottom: -8,
            },
          },
          {
            type: 'HemisphereLight',
            name: 'hemisphere',
            skyColor: 0xffffff,
            groundColor: 0xcccccc,
            intensity: 0.8,
          },
          {
            type: 'AmbientLight',
            name: 'ambient',
            color: 0x404040,
            intensity: 0.6,
          },
        ],
        environment: null,
      },

      night: {
        name: 'Night Scene',
        description: 'Moody night lighting with cool tones',
        lights: [
          {
            type: 'DirectionalLight',
            name: 'moonlight',
            color: 0xaaccff,
            intensity: 0.4,
            position: [8, 15, 12],
            target: [0, 0, 0],
            castShadow: true,
            shadowMapSize: [1024, 1024],
          },
          {
            type: 'PointLight',
            name: 'streetLight',
            color: 0xffaa44,
            intensity: 1.5,
            position: [6, 8, 6],
            distance: 20,
            decay: 2,
            castShadow: false,
          },
          {
            type: 'AmbientLight',
            name: 'ambient',
            color: 0x001122,
            intensity: 0.2,
          },
        ],
        environment: null,
      },
    };

    // Store presets
    for (const [key, preset] of Object.entries(defaultPresets)) {
      this.lightPresets.set(key, preset);
    }

    console.log(
      `LightingManager: Loaded ${this.lightPresets.size} lighting presets`
    );
  }

  /**
   * Setup default lighting configuration
   */
  async setupDefaultLighting() {
    const lightingConfig = this.config.lighting || {};

    // Enable shadows if configured
    if (lightingConfig.shadows !== false) {
      this.shadowsEnabled = true;
    }

    console.log('LightingManager: Default lighting setup completed');
  }

  /**
   * Apply a lighting preset to the scene
   * @param {string} presetName - Name of the preset to apply
   * @returns {Promise<boolean>} Success status
   */
  async applyLightingPreset(presetName) {
    const preset = this.lightPresets.get(presetName);
    if (!preset) {
      console.warn(`LightingManager: Preset "${presetName}" not found`);
      return false;
    }

    console.log(`LightingManager: Applying lighting preset "${presetName}"`);

    try {
      // Remove existing lights
      this.removeAllLights();

      // Create and add lights from preset
      for (const lightConfig of preset.lights) {
        const light = this.createLightFromConfig(lightConfig);
        this.addLight(lightConfig.name, light);
      }

      // Apply environment map if specified
      if (preset.environment) {
        await this.loadEnvironmentMap(preset.environment);
      }

      this.currentPreset = presetName;

      console.log(
        `LightingManager: Applied "${presetName}" with ${preset.lights.length} lights`
      );
      this.dispatchEvent({
        type: 'lightingPresetApplied',
        preset: presetName,
        lightCount: preset.lights.length,
      });

      return true;
    } catch (error) {
      console.error('LightingManager: Failed to apply lighting preset:', error);
      this.dispatchEvent({
        type: 'lightingError',
        error: error.message,
        preset: presetName,
      });
      return false;
    }
  }

  /**
   * Create a light from configuration
   * @param {Object} config - Light configuration
   * @returns {THREE.Light} Created light
   */
  createLightFromConfig(config) {
    let light;

    switch (config.type) {
      case 'DirectionalLight':
        light = new THREE.DirectionalLight(config.color, config.intensity);
        if (config.position) {
          light.position.set(...config.position);
        }
        if (config.target) {
          light.target.position.set(...config.target);
        }
        if (config.castShadow) {
          this.setupDirectionalLightShadows(light, config);
        }
        break;

      case 'PointLight':
        light = new THREE.PointLight(
          config.color,
          config.intensity,
          config.distance || 0,
          config.decay || 1
        );
        if (config.position) {
          light.position.set(...config.position);
        }
        if (config.castShadow) {
          this.setupPointLightShadows(light, config);
        }
        break;

      case 'SpotLight':
        light = new THREE.SpotLight(
          config.color,
          config.intensity,
          config.distance || 0,
          config.angle || Math.PI / 3,
          config.penumbra || 0,
          config.decay || 1
        );
        if (config.position) {
          light.position.set(...config.position);
        }
        if (config.target) {
          light.target.position.set(...config.target);
        }
        if (config.castShadow) {
          this.setupSpotLightShadows(light, config);
        }
        break;

      case 'AmbientLight':
        light = new THREE.AmbientLight(config.color, config.intensity);
        break;

      case 'HemisphereLight':
        light = new THREE.HemisphereLight(
          config.skyColor || config.color,
          config.groundColor || 0x000000,
          config.intensity
        );
        if (config.position) {
          light.position.set(...config.position);
        }
        break;

      default:
        console.warn(`LightingManager: Unknown light type "${config.type}"`);
        light = new THREE.AmbientLight(config.color, config.intensity);
    }

    light.name = config.name;
    return light;
  }

  /**
   * Setup shadows for directional light
   * @param {THREE.DirectionalLight} light - Light to setup
   * @param {Object} config - Shadow configuration
   */
  setupDirectionalLightShadows(light, config) {
    light.castShadow = this.shadowsEnabled;

    if (config.shadowMapSize) {
      light.shadow.mapSize.width = config.shadowMapSize[0];
      light.shadow.mapSize.height = config.shadowMapSize[1];
    }

    if (config.shadowCamera) {
      const shadow = config.shadowCamera;
      light.shadow.camera.near = shadow.near || 0.5;
      light.shadow.camera.far = shadow.far || 50;
      light.shadow.camera.left = shadow.left || -10;
      light.shadow.camera.right = shadow.right || 10;
      light.shadow.camera.top = shadow.top || 10;
      light.shadow.camera.bottom = shadow.bottom || -10;
    }

    // Improve shadow quality
    light.shadow.bias = -0.0001;
    light.shadow.normalBias = 0.02;
  }

  /**
   * Setup shadows for point light
   * @param {THREE.PointLight} light - Light to setup
   * @param {Object} config - Shadow configuration
   */
  setupPointLightShadows(light, config) {
    light.castShadow = this.shadowsEnabled;

    if (config.shadowMapSize) {
      light.shadow.mapSize.width = config.shadowMapSize[0];
      light.shadow.mapSize.height = config.shadowMapSize[1];
    }

    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = light.distance || 25;
  }

  /**
   * Setup shadows for spot light
   * @param {THREE.SpotLight} light - Light to setup
   * @param {Object} config - Shadow configuration
   */
  setupSpotLightShadows(light, config) {
    light.castShadow = this.shadowsEnabled;

    if (config.shadowMapSize) {
      light.shadow.mapSize.width = config.shadowMapSize[0];
      light.shadow.mapSize.height = config.shadowMapSize[1];
    }

    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = light.distance || 25;
    light.shadow.camera.fov = (light.angle * 180) / Math.PI;
  }

  /**
   * Add a light to the scene
   * @param {string} name - Light name
   * @param {THREE.Light} light - Light object
   */
  addLight(name, light) {
    // Remove existing light with same name
    if (this.lights.has(name)) {
      this.removeLight(name);
    }

    // Add to scene
    this.scene.add(light);

    // Add target if it exists (for directional and spot lights)
    if (light.target && light.target !== this.scene) {
      this.scene.add(light.target);
    }

    // Store reference
    this.lights.set(name, light);

    console.log(`LightingManager: Added light "${name}" (${light.type})`);
  }

  /**
   * Remove a light from the scene
   * @param {string} name - Light name
   * @returns {boolean} Success status
   */
  removeLight(name) {
    const light = this.lights.get(name);
    if (!light) {
      return false;
    }

    // Remove from scene
    this.scene.remove(light);

    // Remove target if it exists
    if (light.target && light.target.parent) {
      this.scene.remove(light.target);
    }

    // Remove from storage
    this.lights.delete(name);

    // Remove helper if exists
    if (this.shadowHelpers.has(name)) {
      this.scene.remove(this.shadowHelpers.get(name));
      this.shadowHelpers.delete(name);
    }

    console.log(`LightingManager: Removed light "${name}"`);
    return true;
  }

  /**
   * Remove all lights from the scene
   */
  removeAllLights() {
    for (const [name, light] of this.lights) {
      this.scene.remove(light);
      if (light.target && light.target.parent) {
        this.scene.remove(light.target);
      }
    }

    // Remove all helpers
    for (const [name, helper] of this.shadowHelpers) {
      this.scene.remove(helper);
    }

    this.lights.clear();
    this.shadowHelpers.clear();

    console.log('LightingManager: Removed all lights');
  }

  /**
   * Set global light intensity multiplier
   * @param {number} intensity - Global intensity (0-2)
   */
  setGlobalIntensity(intensity) {
    this.globalIntensity = Math.max(0, Math.min(2, intensity));

    for (const [name, light] of this.lights) {
      if (light.intensity !== undefined) {
        // Store original intensity if not already stored
        if (!light.userData.originalIntensity) {
          light.userData.originalIntensity = light.intensity;
        }

        light.intensity =
          light.userData.originalIntensity * this.globalIntensity;
      }
    }

    console.log(
      `LightingManager: Set global intensity to ${this.globalIntensity}`
    );
    this.dispatchEvent({
      type: 'globalIntensityChanged',
      intensity: this.globalIntensity,
    });
  }

  /**
   * Set specific light intensity
   * @param {string} lightName - Name of the light
   * @param {number} intensity - Light intensity
   */
  setLightIntensity(lightName, intensity) {
    const light = this.lights.get(lightName);
    if (!light) {
      console.warn(`LightingManager: Light "${lightName}" not found`);
      return;
    }

    light.userData.originalIntensity = intensity;
    light.intensity = intensity * this.globalIntensity;

    console.log(
      `LightingManager: Set "${lightName}" intensity to ${intensity}`
    );
    this.dispatchEvent({
      type: 'lightIntensityChanged',
      lightName,
      intensity,
    });
  }

  /**
   * Set light color
   * @param {string} lightName - Name of the light
   * @param {number|string} color - Light color
   */
  setLightColor(lightName, color) {
    const light = this.lights.get(lightName);
    if (!light) {
      console.warn(`LightingManager: Light "${lightName}" not found`);
      return;
    }

    light.color.set(color);

    console.log(`LightingManager: Set "${lightName}" color`);
    this.dispatchEvent({
      type: 'lightColorChanged',
      lightName,
      color,
    });
  }

  /**
   * Enable or disable shadows globally
   * @param {boolean} enabled - Shadow enabled state
   */
  setShadowsEnabled(enabled) {
    this.shadowsEnabled = enabled;

    for (const [name, light] of this.lights) {
      if (light.castShadow !== undefined) {
        light.castShadow = enabled;
      }
    }

    console.log(`LightingManager: Shadows ${enabled ? 'enabled' : 'disabled'}`);
    this.dispatchEvent({
      type: 'shadowsToggled',
      enabled,
    });
  }

  /**
   * Load and apply environment map for IBL
   * @param {string|Array} environmentPath - Path to environment map or array of cube faces
   * @returns {Promise<THREE.Texture>} Loaded environment map
   */
  async loadEnvironmentMap(environmentPath) {
    try {
      console.log('LightingManager: Loading environment map...');

      let envMap;

      if (Array.isArray(environmentPath)) {
        // Load cube texture from 6 faces
        envMap = await this.loadCubeTexture(environmentPath);
      } else if (
        environmentPath.endsWith('.hdr') ||
        environmentPath.endsWith('.exr')
      ) {
        // Load HDR/EXR environment map
        envMap = await this.loadHDRTexture(environmentPath);
      } else {
        throw new Error('Unsupported environment map format');
      }

      // Apply to scene
      this.scene.environment = envMap;
      this.environmentMap = envMap;

      console.log('LightingManager: Environment map applied');
      this.dispatchEvent({
        type: 'environmentMapLoaded',
        environmentMap: envMap,
      });

      return envMap;
    } catch (error) {
      console.error('LightingManager: Failed to load environment map:', error);
      this.dispatchEvent({
        type: 'environmentMapError',
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load cube texture for environment mapping
   * @param {Array} faces - Array of 6 face URLs [px, nx, py, ny, pz, nz]
   * @returns {Promise<THREE.CubeTexture>} Loaded cube texture
   */
  loadCubeTexture(faces) {
    return new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        faces,
        texture => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        error => reject(error)
      );
    });
  }

  /**
   * Load HDR texture for environment mapping
   * @param {string} url - HDR file URL
   * @returns {Promise<THREE.Texture>} Loaded HDR texture
   */
  async loadHDRTexture(url) {
    // Dynamically import RGBELoader if needed
    if (!this.rgbeLoader) {
      const { RGBELoader } = await import(
        'three/examples/jsm/loaders/RGBELoader.js'
      );
      this.rgbeLoader = new RGBELoader();
    }

    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        url,
        texture => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.LinearSRGBColorSpace;
          resolve(texture);
        },
        undefined,
        error => reject(error)
      );
    });
  }

  /**
   * Remove environment map
   */
  removeEnvironmentMap() {
    if (this.environmentMap) {
      this.scene.environment = null;
      this.environmentMap.dispose();
      this.environmentMap = null;

      console.log('LightingManager: Environment map removed');
      this.dispatchEvent({ type: 'environmentMapRemoved' });
    }
  }

  /**
   * Add light animation
   * @param {string} lightName - Name of the light to animate
   * @param {Object} animation - Animation configuration
   */
  addLightAnimation(lightName, animation) {
    const light = this.lights.get(lightName);
    if (!light) {
      console.warn(
        `LightingManager: Light "${lightName}" not found for animation`
      );
      return;
    }

    light.userData.animation = {
      ...animation,
      startTime: Date.now(),
      originalPosition: light.position.clone(),
      originalIntensity: light.intensity,
    };

    this.animatedLights.add(lightName);

    console.log(`LightingManager: Added animation to light "${lightName}"`);
  }

  /**
   * Remove light animation
   * @param {string} lightName - Name of the light
   */
  removeLightAnimation(lightName) {
    const light = this.lights.get(lightName);
    if (light && light.userData.animation) {
      delete light.userData.animation;
      this.animatedLights.delete(lightName);

      console.log(
        `LightingManager: Removed animation from light "${lightName}"`
      );
    }
  }

  /**
   * Update animated lights (call every frame)
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  updateAnimations(deltaTime) {
    if (this.animatedLights.size === 0) return;

    const currentTime = Date.now();

    for (const lightName of this.animatedLights) {
      const light = this.lights.get(lightName);
      if (!light || !light.userData.animation) continue;

      const anim = light.userData.animation;
      const elapsed = (currentTime - anim.startTime) * this.animationSpeed;

      if (anim.type === 'orbit') {
        // Orbital animation around a point
        const angle = (elapsed / 1000) * (anim.speed || 1);
        const radius = anim.radius || 10;
        const center = anim.center || new THREE.Vector3(0, 0, 0);

        light.position.x = center.x + Math.cos(angle) * radius;
        light.position.z = center.z + Math.sin(angle) * radius;
        light.position.y = center.y + (anim.height || 0);

        // Update target to look at center
        if (light.target) {
          light.target.position.copy(center);
        }
      } else if (anim.type === 'pulse') {
        // Pulsing intensity animation
        const frequency = anim.frequency || 1;
        const amplitude = anim.amplitude || 0.5;
        const offset =
          Math.sin((elapsed / 1000) * frequency * Math.PI * 2) * amplitude;

        light.intensity = anim.originalIntensity + offset;
      } else if (anim.type === 'sway') {
        // Swaying position animation
        const frequency = anim.frequency || 0.5;
        const amplitude = anim.amplitude || 2;
        const offset =
          Math.sin((elapsed / 1000) * frequency * Math.PI * 2) * amplitude;

        if (anim.axis === 'x') {
          light.position.x = anim.originalPosition.x + offset;
        } else if (anim.axis === 'y') {
          light.position.y = anim.originalPosition.y + offset;
        } else {
          light.position.z = anim.originalPosition.z + offset;
        }
      }
    }
  }

  /**
   * Set animation speed multiplier
   * @param {number} speed - Animation speed (0.1 - 5.0)
   */
  setAnimationSpeed(speed) {
    this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
    console.log(
      `LightingManager: Animation speed set to ${this.animationSpeed}x`
    );
  }

  /**
   * Show shadow camera helpers for debugging
   * @param {boolean} show - Whether to show helpers
   */
  showShadowHelpers(show = true) {
    if (show) {
      for (const [name, light] of this.lights) {
        if (light.castShadow && light.shadow && light.shadow.camera) {
          const helper = new THREE.CameraHelper(light.shadow.camera);
          helper.name = `${name}_shadowHelper`;
          this.scene.add(helper);
          this.shadowHelpers.set(name, helper);
        }
      }
      console.log('LightingManager: Shadow helpers shown');
    } else {
      for (const [name, helper] of this.shadowHelpers) {
        this.scene.remove(helper);
      }
      this.shadowHelpers.clear();
      console.log('LightingManager: Shadow helpers hidden');
    }
  }

  /**
   * Get light by name
   * @param {string} name - Light name
   * @returns {THREE.Light|null} Light object or null
   */
  getLight(name) {
    return this.lights.get(name) || null;
  }

  /**
   * Get all lights
   * @returns {Map} Map of all lights
   */
  getAllLights() {
    return new Map(this.lights);
  }

  /**
   * Get available lighting presets
   * @returns {Array} Array of preset information
   */
  getAvailablePresets() {
    return Array.from(this.lightPresets.entries()).map(([key, preset]) => ({
      id: key,
      name: preset.name,
      description: preset.description,
      lightCount: preset.lights.length,
    }));
  }

  /**
   * Get current lighting preset
   * @returns {string} Current preset name
   */
  getCurrentPreset() {
    return this.currentPreset;
  }

  /**
   * Add custom lighting preset
   * @param {string} id - Preset ID
   * @param {Object} preset - Preset definition
   */
  addLightingPreset(id, preset) {
    this.lightPresets.set(id, preset);
    console.log(`LightingManager: Added custom preset "${id}"`);
    this.dispatchEvent({ type: 'presetAdded', id, preset });
  }

  /**
   * Remove lighting preset
   * @param {string} id - Preset ID
   * @returns {boolean} Success status
   */
  removeLightingPreset(id) {
    if (this.lightPresets.has(id)) {
      this.lightPresets.delete(id);
      console.log(`LightingManager: Removed preset "${id}"`);
      this.dispatchEvent({ type: 'presetRemoved', id });
      return true;
    }
    return false;
  }

  /**
   * Get lighting analysis for current setup
   * @returns {Object} Lighting analysis
   */
  analyzeLighting() {
    const analysis = {
      totalLights: this.lights.size,
      lightTypes: {},
      shadowCasters: 0,
      totalIntensity: 0,
      hasEnvironmentMap: !!this.environmentMap,
      animatedLights: this.animatedLights.size,
    };

    for (const [name, light] of this.lights) {
      // Count by type
      analysis.lightTypes[light.type] =
        (analysis.lightTypes[light.type] || 0) + 1;

      // Count shadow casters
      if (light.castShadow) {
        analysis.shadowCasters++;
      }

      // Sum intensity
      if (light.intensity !== undefined) {
        analysis.totalIntensity += light.intensity;
      }
    }

    return analysis;
  }

  /**
   * Get lighting manager information
   * @returns {Object} Manager information
   */
  getInfo() {
    return {
      currentPreset: this.currentPreset,
      globalIntensity: this.globalIntensity,
      shadowsEnabled: this.shadowsEnabled,
      lightCount: this.lights.size,
      animatedLights: this.animatedLights.size,
      hasEnvironmentMap: !!this.environmentMap,
      availablePresets: this.getAvailablePresets().length,
      analysis: this.analyzeLighting(),
    };
  }

  /**
   * Clean up and dispose of all resources
   */
  dispose() {
    if (this._disposed) return;

    console.log('LightingManager: Starting cleanup...');

    // Remove all lights
    this.removeAllLights();

    // Remove environment map
    this.removeEnvironmentMap();

    // Clear helpers
    for (const [name, helper] of this.shadowHelpers) {
      this.scene.remove(helper);
    }
    this.shadowHelpers.clear();

    // Clear references
    this.lightPresets.clear();
    this.animatedLights.clear();

    this._disposed = true;
    console.log('LightingManager: Cleanup completed');
  }
}
