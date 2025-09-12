/**
 * Global configuration for 3D Product Viewer Pro
 * Contains default settings, performance budgets, and feature flags
 */

export const DEFAULT_CONFIG = {
  // Rendering settings
  renderer: {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    shadowMap: {
      enabled: true,
      type: 'PCFSoftShadowMap', // THREE.PCFSoftShadowMap
    },
    outputColorSpace: 'srgb', // THREE.SRGBColorSpace
    toneMapping: 'ACESFilmic', // THREE.ACESFilmicToneMapping
    toneMappingExposure: 1.0,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
  },

  // Camera settings
  camera: {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 0, z: 5 },
    target: { x: 0, y: 0, z: 0 },
  },

  // Controls settings
  controls: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    autoRotate: false,
    autoRotateSpeed: 1.0,
    minDistance: 2,
    maxDistance: 20,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    touches: {
      ONE: 'ROTATE', // THREE.TOUCH.ROTATE
      TWO: 'DOLLY_PAN', // THREE.TOUCH.DOLLY_PAN
    },
  },

  // Enhanced lighting settings
  lighting: {
    defaultPreset: 'studio',
    globalIntensity: 1.0,
    shadowsEnabled: true,
    animations: {
      enabled: false,
      speed: 1.0,
    },
    environment: {
      enabled: false,
      url: null, // Path to HDRI file
    },
    ambient: {
      color: 0x404040,
      intensity: 0.3,
    },
    directional: {
      color: 0xffffff,
      intensity: 1.0,
      position: { x: 10, y: 10, z: 5 },
      castShadow: true,
      shadow: {
        mapSize: { width: 2048, height: 2048 },
        camera: {
          near: 0.5,
          far: 50,
          left: -10,
          right: 10,
          top: 10,
          bottom: -10,
        },
      },
    },
    hemisphere: {
      skyColor: 0xffffbb,
      groundColor: 0x080820,
      intensity: 0.5,
    },
  },

  // Enhanced material settings
  materials: {
    defaultPreset: 'default',
    textureCache: true,
    enhanceMaterials: true,
    supportedFormats: ['.jpg', '.png', '.hdr', '.exr'],
  },

  // Model loading settings
  model: {
    defaultUrl: '/assets/models/default-product.glb',
    loadingTimeout: 30000, // 30 seconds
    enableDraco: true,
    enableKTX2: true,
    enableMeshOpt: true,
    center: true,
    optimize: true,
    maxCacheSize: 10,
  },

  // Performance budgets
  performance: {
    targetFPS: 60,
    minFPS: 30,
    maxMemoryMB: 500,
    maxTriangles: 100000,
    enableLOD: true,
    enableFrustumCulling: true,
    enableOcclusion: false,
  },

  // UI settings
  ui: {
    showLoadingOverlay: true,
    showPerformanceStats: true, // Set to false in production
    showControlPanel: true,
    autoHideControls: true,
    autoHideDelay: 3000, // 3 seconds
    theme: 'dark',
  },

  // Feature flags
  features: {
    animations: true,
    materials: true,
    lighting: true,
    screenshots: true,
    fullscreen: true,
    fileUpload: true,
    vr: false, // WebXR support
    ar: false, // WebXR AR support
  },

  // Error handling
  errors: {
    maxRetries: 3,
    retryDelay: 1000,
    showErrorOverlay: true,
    logToConsole: true,
  },

  // Development settings
  development: {
    debug: false,
    verbose: false,
    showHelpers: false,
    enableStats: true,
  },
};

/**
 * Environment-specific configuration overrides
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    development: {
      debug: true,
      verbose: true,
      showHelpers: true,
    },
    ui: {
      showPerformanceStats: true,
    },
    lighting: {
      animations: {
        enabled: true,
      },
    },
  },

  production: {
    development: {
      debug: false,
      verbose: false,
      showHelpers: false,
    },
    ui: {
      showPerformanceStats: false,
    },
    performance: {
      targetFPS: 30, // Lower target for mobile compatibility
    },
  },
};

/**
 * Device-specific configuration adjustments
 */
export const DEVICE_CONFIG = {
  mobile: {
    renderer: {
      pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
      antialias: false,
      shadowMap: {
        enabled: true,
        type: 'PCFShadowMap', // Less expensive shadow type
      },
    },
    performance: {
      targetFPS: 30,
      maxMemoryMB: 200,
      maxTriangles: 50000,
    },
    lighting: {
      globalIntensity: 0.8, // Slightly dimmer for better performance
      shadowsEnabled: true,
      directional: {
        shadow: {
          mapSize: { width: 1024, height: 1024 },
        },
      },
    },
    materials: {
      enhanceMaterials: false, // Disable material enhancements for performance
    },
  },

  tablet: {
    renderer: {
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    },
    performance: {
      targetFPS: 45,
      maxMemoryMB: 350,
    },
    lighting: {
      globalIntensity: 0.9,
    },
  },

  desktop: {
    // Use default configuration
  },
};

/**
 * Material presets for quick switching
 */
export const MATERIAL_PRESETS = {
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

/**
 * Lighting presets for different scenarios
 */
export const LIGHTING_PRESETS = {
  studio: {
    name: 'Studio',
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
  },

  outdoor: {
    name: 'Outdoor',
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
  },

  dramatic: {
    name: 'Dramatic',
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
  },

  soft: {
    name: 'Soft',
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
  },

  night: {
    name: 'Night',
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
  },
};

/**
 * Merges configuration objects deeply
 * @param {Object} target - Target configuration object
 * @param {Object} source - Source configuration object
 * @returns {Object} Merged configuration
 */
export function mergeConfig(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = mergeConfig(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

/**
 * Gets the appropriate configuration for the current environment and device
 * @param {string} environment - Current environment ('development' | 'production')
 * @param {string} deviceType - Device type ('mobile' | 'tablet' | 'desktop')
 * @returns {Object} Final configuration object
 */
export function getConfig(environment = 'development', deviceType = 'desktop') {
  let config = { ...DEFAULT_CONFIG };

  // Apply environment overrides
  if (ENVIRONMENT_CONFIG[environment]) {
    config = mergeConfig(config, ENVIRONMENT_CONFIG[environment]);
  }

  // Apply device-specific overrides
  if (DEVICE_CONFIG[deviceType]) {
    config = mergeConfig(config, DEVICE_CONFIG[deviceType]);
  }

  return config;
}

/**
 * Get material preset by ID
 * @param {string} id - Material preset ID
 * @returns {Object|null} Material preset or null
 */
export function getMaterialPreset(id) {
  return MATERIAL_PRESETS[id] || null;
}

/**
 * Get lighting preset by ID
 * @param {string} id - Lighting preset ID
 * @returns {Object|null} Lighting preset or null
 */
export function getLightingPreset(id) {
  return LIGHTING_PRESETS[id] || null;
}

/**
 * Get all available material presets
 * @returns {Array} Array of material preset info
 */
export function getAllMaterialPresets() {
  return Object.entries(MATERIAL_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    description: preset.description,
    type: preset.type,
  }));
}

/**
 * Get all available lighting presets
 * @returns {Array} Array of lighting preset info
 */
export function getAllLightingPresets() {
  return Object.entries(LIGHTING_PRESETS).map(([id, preset]) => ({
    id,
    name: preset.name,
    description: preset.description,
    lightCount: preset.lights.length,
  }));
}
