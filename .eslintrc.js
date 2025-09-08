module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },

  extends: ['eslint:recommended'],

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },

  globals: {
    THREE: 'readonly',
  },

  rules: {
    // Code quality rules
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'log'],
      },
    ],
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Style rules
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': 'error',
    'space-infix-ops': 'error',
    'eol-last': 'error',
    'no-trailing-spaces': 'error',

    // Best practices
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-duplicate-imports': 'error',

    // ES6+ features
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': [
      'error',
      {
        array: false,
        object: true,
      },
    ],

    // Function rules
    'function-paren-newline': ['error', 'multiline'],
    'max-params': ['warn', 4],
    'max-lines-per-function': ['warn', 100],

    // Comment rules
    'spaced-comment': ['error', 'always'],
    'multiline-comment-style': ['error', 'starred-block'],

    // Import rules (basic)
    'no-duplicate-imports': 'error',
  },

  overrides: [
    // Three.js specific rules
    {
      files: ['src/core/**/*.js'],
      rules: {
        'max-lines-per-function': ['warn', 150], // Allow longer functions for 3D code
        'max-params': ['warn', 6], // Allow more parameters for 3D constructors
      },
    },

    // Test files
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
        vitest: true,
      },
      rules: {
        'no-console': 'off',
        'max-lines-per-function': 'off',
      },
    },

    // Configuration files
    {
      files: ['*.config.js', 'vite.config.js', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
