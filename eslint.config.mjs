// @ts-check
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import tseslint from 'typescript-eslint'

const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

export default [
  // Ignore heavy/irrelevant paths
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.d.ts',
    ],
  },

  // Next.js presets (fast, no type-checking)
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),

  // ESLint core + TS (syntax-only)
  ...tseslint.config(
    js.configs.recommended,
    tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      languageOptions: {
        parserOptions: {
          sourceType: 'module',
          ecmaVersion: 2023,
        },
      },
    },
  ),

  // Plugins + rules
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // Your earlier choice
      '@typescript-eslint/no-explicit-any': 'off',

      // Let "unused-imports" handle both imports & vars to avoid duplicates
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Import sorting: warn (still auto-fixable)
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',

      // Reduce noise
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },

  // Keep Prettier last
  eslintConfigPrettier,
]
