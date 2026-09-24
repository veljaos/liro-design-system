// Root ESLint configuration. Changing this file is a protected change (BUILD-PLAN rule 10).
import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const TS_FILES = ['**/*.{ts,tsx,mts,cts}']
const TEST_FILES = ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}']

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/storybook-static/',
    '**/coverage/',
    '**/playwright-report/',
    '**/test-results/',
    // Not a workspace package: its dependencies exist only in the temporary install made by
    // `pnpm consumer-check`, which typechecks it there against the packed type declarations.
    'apps/consumer-check/',
  ]),

  {
    linterOptions: {
      // No rule may be switched off from inside a file; exceptions go through this config.
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
  },

  js.configs.recommended,

  {
    files: TS_FILES,
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // @ts-ignore, @ts-nocheck and @ts-expect-error are not allowed outside test files.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': true,
          'ts-check': false,
        },
      ],
    },
  },

  {
    files: TEST_FILES,
    rules: {
      // Tests may assert that a call is a type error, with a stated reason.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-expect-error': 'allow-with-description',
          'ts-check': false,
        },
      ],
    },
  },

  {
    files: ['**/*.{jsx,tsx}'],
    extends: [jsxA11y.flatConfigs.strict],
  },

  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
  },

  prettier,
)
