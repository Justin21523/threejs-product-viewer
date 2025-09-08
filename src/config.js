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

  // Lighting settings
  lighting: {
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

  // Model loading settings
  model: {
    defaultUrl: '/assets/models/default-product.glb',
    loadingTimeout: 30000, // 30 seconds
    enableDraco: true,
    enableKTX2: true,
    enableMeshOpt: true,
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
    },
    performance: {
      targetFPS: 30,
      maxMemoryMB: 200,
      maxTriangles: 50000,
    },
    lighting: {
      directional: {
        shadow: {
          mapSize: { width: 1024, height: 1024 },
        },
      },
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
  },

  desktop: {
    // Use default configuration
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
 * Material presets for quick switching
 */
export const MATERIAL_PRESETS = {
  default: {
    name: 'Default',
    metalness: 0.0,
    roughness: 1.0,
    color: 0xffffff,
    emissive: 0x000000,
  },

  metallic: {
    name: 'Metallic',
    metalness: 1.0,
    roughness: 0.2,
    color: 0xcccccc,
    emissive: 0x000000,
  },

  matte: {
    name: 'Matte',
    metalness: 0.0,
    roughness: 0.8,
    color: 0xffffff,
    emissive: 0x000000,
  },

  glossy: {
    name: 'Glossy',
    metalness: 0.3,
    roughness: 0.1,
    color: 0xffffff,
    emissive: 0x000000,
  },
};

/**
 * Lighting presets for different scenarios
 */
export const LIGHTING_PRESETS = {
  studio: {
    name: 'Studio',
    ambient: { intensity: 0.3 },
    directional: { intensity: 1.2 },
    hemisphere: { intensity: 0.5 },
  },

  outdoor: {
    name: 'Outdoor',
    ambient: { intensity: 0.5 },
    directional: { intensity: 0.8 },
    hemisphere: { intensity: 0.7 },
  },

  dramatic: {
    name: 'Dramatic',
    ambient: { intensity: 0.1 },
    directional: { intensity: 2.0 },
    hemisphere: { intensity: 0.3 },
  },

  soft: {
    name: 'Soft',
    ambient: { intensity: 0.6 },
    directional: { intensity: 0.4 },
    hemisphere: { intensity: 0.8 },
  },
};
