const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const electron = require('eslint-plugin-electron');
const node = require('eslint-plugin-node');
const security = require('eslint-plugin-security');

module.exports = [
  // Base JavaScript recommendations
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'dist/**',
      'out/**',
      'build/**',
      'node_modules/**',
      '.vite/**',
      'coverage/**',
      '*.min.js',
    ],
  },

  // Configuration files (Tailwind, PostCSS, etc.)
  {
    files: [
      '*.config.js',
      '*.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'electron-builder.json',
    ],
    plugins: {
      '@typescript-eslint': typescript,
      node: node,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      'node/no-unpublished-import': 'off',
      'no-console': 'off', // Allow console in config files
    },
  },

  // Main process configuration (Node.js environment)
  {
    files: ['src/main/**/*.{js,ts}', 'electron.main.{js,ts}', 'main.{js,ts}'],
    plugins: {
      '@typescript-eslint': typescript,
      electron: electron,
      node: node,
      security: security,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        global: 'readonly',
      },
    },

    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Electron main process specific
      'electron/no-node-integration': 'off', // Main process needs Node.js
      'electron/no-remote': 'error',
      'electron/no-renderer-require': 'error',

      // Node.js specific
      'node/no-unpublished-import': 'off',
      'node/no-missing-import': 'off', // TypeScript handles this
      'node/no-unsupported-features/es-syntax': 'off',

      // Security
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-child-process': 'warn',

      // General
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Renderer process configuration (Browser + Node.js integration)
  {
    files: ['src/renderer/**/*.{js,ts,jsx,tsx}', 'src/**/*.{jsx,tsx}'],
    plugins: {
      '@typescript-eslint': typescript,
      electron: electron,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        process: 'readonly', // Available if nodeIntegration is enabled
        require: 'readonly', // Available if nodeIntegration is enabled
      },
    },

    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Electron renderer specific
      'electron/no-node-integration': 'warn', // Warn about Node integration in renderer
      'electron/no-remote': 'error',
      'electron/no-renderer-require': 'warn',

      // React/JSX (if using React)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Preload scripts configuration
  {
    files: ['src/preload/**/*.{js,ts}', '**/preload.{js,ts}'],
    plugins: {
      '@typescript-eslint': typescript,
      electron: electron,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },

    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Preload specific - more restrictive
      'electron/no-node-integration': 'off', // Preload can use Node.js APIs
      'electron/no-remote': 'error',
      'electron/no-renderer-require': 'off',

      // Security - preload scripts need careful handling
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Vite configuration files
  {
    files: ['vite.config.{js,ts}', 'vite.*.config.{js,ts}'],
    plugins: {
      '@typescript-eslint': typescript,
      node: node,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
      },
    },

    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'node/no-unpublished-import': 'off',
      'no-console': 'off', // Allow console in config files
    },
  },

  // Test files configuration
  {
    files: [
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
      'tests/**/*.{js,ts}',
    ],
    plugins: {
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        vi: 'readonly', // Vitest globals
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // More lenient in tests
      'no-console': 'off', // Allow console in tests
    },
  },
];
