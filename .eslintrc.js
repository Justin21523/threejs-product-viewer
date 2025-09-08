module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
    worker: true,
  },

  extends: ["eslint:recommended", "prettier"],

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },

  plugins: ["import"],

  rules: {
    // Code quality rules
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "no-console": "warn",
    "no-debugger": "error",
    "no-alert": "error",

    // Modern JavaScript best practices
    "prefer-const": "error",
    "prefer-arrow-callback": "error",
    "prefer-template": "error",
    "no-var": "error",

    // Import/Export rules
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
    "import/no-unresolved": "off", // Handled by bundler
    "import/no-duplicates": "error",

    // Three.js specific rules
    "no-new": "off", // Three.js often uses 'new' for side effects

    // Performance considerations
    "no-loop-func": "error",
    "no-inner-declarations": "error",

    // Code style (handled by Prettier, but some logic rules)
    curly: ["error", "all"],
    eqeqeq: ["error", "always"],
    "no-implicit-coercion": "error",

    // Error prevention
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "require-atomic-updates": "error",
  },

  globals: {
    // Three.js globals
    THREE: "readonly",

    // Build-time constants
    __APP_VERSION__: "readonly",
    __BUILD_TIME__: "readonly",
    __DEV__: "readonly",
  },

  overrides: [
    // Test files
    {
      files: ["**/*.test.js", "**/*.spec.js"],
      env: {
        jest: true,
        vitest: true,
      },
      rules: {
        "no-console": "off",
      },
    },

    // Configuration files
    {
      files: ["*.config.js", "*.config.mjs"],
      env: {
        node: true,
      },
      rules: {
        "no-console": "off",
      },
    },

    // Worker files
    {
      files: ["**/*.worker.js"],
      env: {
        worker: true,
        browser: false,
      },
      globals: {
        self: "readonly",
        importScripts: "readonly",
      },
    },
  ],
};
