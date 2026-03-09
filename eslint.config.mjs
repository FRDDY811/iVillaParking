import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  // 1. Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.vite/**',
      '**/prisma/migrations/**'
    ]
  },

  // 2. Base JS recommended
  js.configs.recommended,

  // 3. Base TS recommended for all TS files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}']
  })),

  // 4. Allow underscore-prefixed unused vars (common destructuring convention)
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },

  // 5. Client (React) rules
  {
    files: ['client/src/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  },

  // 5. Server (Node) globals — TS and JS files
  {
    files: ['server/**/*.{ts,tsx,js}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },

  // 6. Shared package
  {
    files: ['shared/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },

  // 7. Client test files — allow require() inside vi.hoisted and add vitest globals
  {
    files: ['client/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },

  // 7. Prettier — must be last to disable conflicting rules
  prettier
)
