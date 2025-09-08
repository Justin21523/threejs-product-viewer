import { defineConfig } from "vite";
import { resolve } from "path";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === "production";
  const isAnalyze = mode === "analyze";

  return {
    // Base public path
    base: "./",

    // Development server configuration
    server: {
      host: "0.0.0.0",
      port: 3000,
      open: true,
      cors: true,
      // Enable hot reload for Three.js files
      watch: {
        include: ["src/**/*.js", "public/**/*"],
      },
    },

    // Build configuration
    build: {
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: !isProduction,
      minify: isProduction ? "terser" : false,

      // Optimize chunk splitting for better caching
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
        output: {
          // Separate vendor chunks for better caching
          manualChunks: {
            "three-core": ["three"],
            "three-addons": ["three/examples/jsm/loaders/GLTFLoader"],
            vendor: ["three"],
          },
          // Use content hash for long-term caching
          chunkFileNames: isProduction
            ? "assets/js/[name].[hash].js"
            : "assets/js/[name].js",
          entryFileNames: isProduction
            ? "assets/js/[name].[hash].js"
            : "assets/js/[name].js",
          assetFileNames: isProduction
            ? "assets/[ext]/[name].[hash].[ext]"
            : "assets/[ext]/[name].[ext]",
        },
      },

      // Terser configuration for production optimization
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : {},

      // Asset optimization
      assetsInlineLimit: 4096,

      // Bundle size warnings
      chunkSizeWarningLimit: 1000,
    },

    // Plugins configuration
    plugins: [
      // Legacy browser support
      legacy({
        targets: ["> 1%", "last 2 versions", "not dead", "not ie 11"],
        additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
        renderLegacyChunks: true,
        polyfills: [
          "es.symbol",
          "es.array.filter",
          "es.promise",
          "es.promise.finally",
        ],
      }),

      // Bundle analyzer for performance monitoring
      ...(isAnalyze
        ? [
            {
              name: "bundle-analyzer",
              generateBundle() {
                import("rollup-plugin-analyzer").then(
                  ({ default: analyzer }) => {
                    analyzer({
                      hideDeps: true,
                      limit: 20,
                    });
                  }
                );
              },
            },
          ]
        : []),
    ],

    // Resolve configuration
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@core": resolve(__dirname, "src/core"),
        "@components": resolve(__dirname, "src/ui/components"),
        "@utils": resolve(__dirname, "src/utils"),
        "@styles": resolve(__dirname, "src/styles"),
        "@assets": resolve(__dirname, "public/assets"),
      },
    },

    // CSS configuration
    css: {
      devSourcemap: !isProduction,
      preprocessorOptions: {
        css: {
          charset: false,
        },
      },
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: !isProduction,
    },

    // Optimization configuration
    optimizeDeps: {
      include: [
        "three",
        "three/examples/jsm/loaders/GLTFLoader",
        "three/examples/jsm/loaders/DRACOLoader",
        "three/examples/jsm/controls/OrbitControls",
      ],
      exclude: [],
    },

    // Worker configuration for Web Workers
    worker: {
      format: "es",
    },
  };
});
