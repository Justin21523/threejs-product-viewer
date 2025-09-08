/**
 * Device detection and capability utilities
 * Provides information about user's device and browser capabilities
 */

/**
 * Detect device type based on screen size and capabilities
 * @returns {string} Device type ('mobile', 'tablet', 'desktop')
 */
export function detectDeviceType() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const userAgent = navigator.userAgent.toLowerCase();

  // Mobile device detection
  if (width <= 768 || (hasTouch && width <= 1024)) {
    return 'mobile';
  }

  // Tablet detection
  if (
    (width <= 1024 && hasTouch) ||
    userAgent.includes('tablet') ||
    userAgent.includes('ipad')
  ) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Check if device is mobile
 * @returns {boolean} True if mobile device
 */
export function isMobileDevice() {
  return detectDeviceType() === 'mobile';
}

/**
 * Check if device has touch capabilities
 * @returns {boolean} True if touch is supported
 */
export function hasTouchSupport() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get device pixel ratio with fallback
 * @returns {number} Device pixel ratio
 */
export function getPixelRatio() {
  return window.devicePixelRatio || 1;
}

/**
 * Check if device is in landscape orientation
 * @returns {boolean} True if landscape
 */
export function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait orientation
 * @returns {boolean} True if portrait
 */
export function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

/**
 * Get screen dimensions
 * @returns {Object} Screen dimensions
 */
export function getScreenDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    pixelRatio: getPixelRatio(),
  };
}

/**
 * Detect browser information
 * @returns {Object} Browser information
 */
export function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Browser detection
  let browser = 'Unknown';
  let version = 'Unknown';

  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    version = userAgent.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return {
    browser,
    version,
    userAgent,
    platform,
    language: navigator.language,
    languages: navigator.languages || [navigator.language],
  };
}

/**
 * Check WebGL support and capabilities
 * @returns {Object} WebGL information
 */
export function getWebGLInfo() {
  let gl;
  let canvas;

  try {
    canvas = document.createElement('canvas');
    gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
  } catch (e) {
    return {
      supported: false,
      version: null,
      error: e.message,
    };
  }

  if (!gl) {
    return {
      supported: false,
      version: null,
      error: 'WebGL not available',
    };
  }

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const version = gl.getParameter(gl.VERSION);
  const vendor = gl.getParameter(gl.VENDOR);
  const renderer = gl.getParameter(gl.RENDERER);

  return {
    supported: true,
    version: version,
    vendor: vendor,
    renderer: renderer,
    unmaskedVendor: debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      : 'Not available',
    unmaskedRenderer: debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'Not available',
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
    maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    extensions: gl.getSupportedExtensions() || [],
  };
}

/**
 * Get device performance category
 * @returns {string} Performance category ('low', 'medium', 'high')
 */
export function getPerformanceCategory() {
  const deviceType = detectDeviceType();
  const webglInfo = getWebGLInfo();
  const pixelRatio = getPixelRatio();
  const cores = navigator.hardwareConcurrency || 2;

  // Performance scoring
  let score = 0;

  // Device type scoring
  if (deviceType === 'desktop') score += 3;
  else if (deviceType === 'tablet') score += 2;
  else score += 1;

  // WebGL capabilities scoring
  if (webglInfo.supported) {
    score += 2;
    if (webglInfo.maxTextureSize >= 4096) score += 1;
    if (webglInfo.extensions.includes('EXT_texture_filter_anisotropic'))
      score += 1;
  }

  // Hardware scoring
  if (cores >= 8) score += 2;
  else if (cores >= 4) score += 1;

  if (pixelRatio <= 1.5) score += 1; // Lower pixel ratio = better performance

  // Memory estimation (rough)
  if (navigator.deviceMemory) {
    if (navigator.deviceMemory >= 8) score += 2;
    else if (navigator.deviceMemory >= 4) score += 1;
  }

  // Categorize performance
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * Check for reduced motion preference
 * @returns {boolean} True if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check for dark color scheme preference
 * @returns {boolean} True if user prefers dark scheme
 */
export function prefersDarkScheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Check if device is likely to have battery constraints
 * @returns {boolean} True if battery-constrained device
 */
export function isBatteryConstrained() {
  const deviceType = detectDeviceType();
  return deviceType === 'mobile' || deviceType === 'tablet';
}

/**
 * Get comprehensive device capabilities
 * @returns {Object} Complete device information
 */
export function getDeviceCapabilities() {
  const deviceType = detectDeviceType();
  const browserInfo = getBrowserInfo();
  const webglInfo = getWebGLInfo();
  const screenDims = getScreenDimensions();
  const performanceCategory = getPerformanceCategory();

  return {
    device: {
      type: deviceType,
      isMobile: isMobileDevice(),
      hasTouch: hasTouchSupport(),
      isLandscape: isLandscape(),
      batteryConstrained: isBatteryConstrained(),
      cores: navigator.hardwareConcurrency || 'Unknown',
      memory: navigator.deviceMemory || 'Unknown',
    },

    screen: screenDims,

    browser: browserInfo,

    webgl: webglInfo,

    performance: {
      category: performanceCategory,
      prefersReducedMotion: prefersReducedMotion(),
    },

    preferences: {
      darkScheme: prefersDarkScheme(),
      reducedMotion: prefersReducedMotion(),
      language: navigator.language,
    },

    features: {
      webgl: webglInfo.supported,
      webgl2: webglInfo.version?.includes('2.0') || false,
      touch: hasTouchSupport(),
      orientation: 'screen' in window && 'orientation' in screen,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      battery: 'getBattery' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      webAssembly: 'WebAssembly' in window,
    },
  };
}

/**
 * Log device capabilities for debugging
 */
export function logDeviceCapabilities() {
  const capabilities = getDeviceCapabilities();
  console.group('📱 Device Capabilities');
  console.log('Device Type:', capabilities.device.type);
  console.log('Performance Category:', capabilities.performance.category);
  console.log('WebGL Support:', capabilities.webgl.supported ? '✅' : '❌');
  console.log('Touch Support:', capabilities.device.hasTouch ? '✅' : '❌');
  console.log(
    'Screen:',
    `${capabilities.screen.width}x${capabilities.screen.height} (${capabilities.screen.pixelRatio}x)`
  );
  console.log(
    'Browser:',
    `${capabilities.browser.browser} ${capabilities.browser.version}`
  );
  console.log('Full Capabilities:', capabilities);
  console.groupEnd();
}

/**
 * Setup viewport meta tag for mobile devices
 */
export function setupMobileViewport() {
  if (isMobileDevice()) {
    let viewport = document.querySelector('meta[name="viewport"]');

    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }

    viewport.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  }
}
