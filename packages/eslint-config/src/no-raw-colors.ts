import type { Rule } from 'eslint'
import { splitClass, stringListeners, styleListener, words } from './strings.ts'

/** Tailwind CSS 4.3's colour palette. */
const PALETTE = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'mauve',
  'olive',
  'mist',
  'taupe',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]

/** `bg-red-500`, `text-gray-700/50`, `ring-offset-white`: any utility ending in a palette colour. */
const RAW_UTILITY = new RegExp(
  `^(?:[a-z]+-)+(?:(?:${PALETTE.join('|')})-\\d{2,3}|black|white)(?:/\\S+)?$`,
)

/** `#fff`, `#0078d4`, `#0078d4cc`; not `&#123;` or `#section-2`. */
const HEX = /(?<![\w&#])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/i

/** `rgb(…)`, `hsl(…)`, `oklch(…)`, `color-mix(…)`, … */
const COLOR_FUNCTION = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\(/i

const COLOR_STYLE_PROPERTY =
  /^(?:color|background|fill|stroke|outline|border(?:Top|Right|Bottom|Left|Inline|Block)?(?:Start|End)?)$|Color$/

/** Values a colour property may take that are not a colour. */
const NOT_A_COLOR = new Set([
  'transparent',
  'currentcolor',
  'inherit',
  'initial',
  'unset',
  'revert',
  'none',
])

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Colours come from Liro meanings only: no raw colour utilities, arbitrary colour values, colour literals or dark: variants.',
    },
    schema: [],
    messages: {
      rawUtility:
        '"{{token}}" is a raw colour. Use a Liro meaning (bg-surface-raised, text-secondary, border-strong, bg-status-danger-bg, …).',
      hex: '"{{token}}" is a colour literal. Colours live only in @veljaos/tokens; use a Liro meaning.',
      colorFunction:
        '"{{token}}" is a colour value. Colours live only in @veljaos/tokens; use a Liro meaning.',
      namedColor:
        '"{{value}}" is a raw colour. Use a Liro variable, e.g. var(--liro-text-secondary).',
      darkVariant:
        '"{{token}}" uses the dark: variant. Themes switch through the tokens; a component never styles a theme itself.',
    },
  },
  create(context) {
    return {
      ...stringListeners((text, node) => {
        for (const token of words(text)) {
          const { variants, utility } = splitClass(token)
          if (variants.includes('dark')) {
            context.report({ node, messageId: 'darkVariant', data: { token } })
          } else if (RAW_UTILITY.test(utility)) {
            context.report({ node, messageId: 'rawUtility', data: { token } })
          } else if (HEX.test(token)) {
            context.report({ node, messageId: 'hex', data: { token } })
          } else if (COLOR_FUNCTION.test(token)) {
            context.report({ node, messageId: 'colorFunction', data: { token } })
          }
        }
      }),
      ...styleListener(({ name, value, node }) => {
        if (value === null || !COLOR_STYLE_PROPERTY.test(name)) return
        const trimmed = value.trim()
        // Hex values and colour functions are reported by the string check above.
        if (/^[a-z]+$/i.test(trimmed) && !NOT_A_COLOR.has(trimmed.toLowerCase())) {
          context.report({ node, messageId: 'namedColor', data: { value } })
        }
      }),
    }
  },
}

export default rule
