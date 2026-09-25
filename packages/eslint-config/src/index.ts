import type { Linter } from 'eslint'

/**
 * Rules for applications that use the Liro Design System.
 * P1.1 adds the colour rules (no raw colour utilities, no arbitrary colour values).
 */
const config: Linter.Config[] = [
  {
    name: '@veljaos/eslint-config/imports',
    rules: {
      // Consumers import @veljaos/ui only: never Radix, never a primitive or an internal path.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@radix-ui/*'],
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
  },
]

export default config
