import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import tsdoc from 'eslint-plugin-tsdoc';

export default [
  {
    ignores: ['**/dist', '**/dist-tsc', '**/node_modules', '**/.astro', 'design_handoff_cistern_homepage'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: {
      tsdoc,
    },
    rules: {
      // Prefer TS-aware unused vars; disable base rule to avoid false positives in type positions
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'tsdoc/syntax': 'warn',
    },
  },
];
