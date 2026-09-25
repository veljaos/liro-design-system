import type { ESLint, Linter } from 'eslint'
import logicalProperties from './logical-properties.ts'
import noRawColors from './no-raw-colors.ts'

/** The Liro rules, as an ESLint plugin. The configurations below register it as `liro`. */
export const plugin = {
  meta: { name: '@veljaos/eslint-config' },
  rules: {
    'no-raw-colors': noRawColors,
    'logical-properties': logicalProperties,
  },
} satisfies ESLint.Plugin

/**
 * Colours only through Liro meanings, and logical properties only (BUILD-PLAN sections 2 and 6).
 * The Design System applies this to its own code too.
 */
export const tokenRules: Linter.Config = {
  name: '@veljaos/eslint-config/tokens',
  plugins: { liro: plugin },
  rules: {
    'liro/no-raw-colors': 'error',
    'liro/logical-properties': 'error',
  },
}

/** Consumers import @veljaos/ui only: never Radix, never a primitive or an internal path. */
export const importRules: Linter.Config = {
  name: '@veljaos/eslint-config/imports',
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            // Radix ships as @radix-ui/* packages and as the single package radix-ui.
            group: ['@radix-ui/*', 'radix-ui', 'radix-ui/*'],
            message:
              'Use the components of @veljaos/ui; Radix primitives are internal to the Design System.',
          },
          {
            group: ['@veljaos/ui/*', '!@veljaos/ui/styles.css'],
            message: 'Import from @veljaos/ui; internal paths are not part of its API.',
          },
        ],
      },
    ],
  },
}

/** Rules for applications that use the Liro Design System. */
const config: Linter.Config[] = [importRules, tokenRules]

export default config
