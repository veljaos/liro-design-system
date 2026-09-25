import type { Rule } from 'eslint'
import { splitClass, stringListeners, styleListener, words } from './strings.ts'

/** Physical Tailwind utilities, each with the logical one to use instead. */
const PHYSICAL_UTILITIES: { pattern: RegExp; instead: string }[] = [
  { pattern: /^(?:scroll-)?m[lr]-\S+$/, instead: 'ms-/me- (scroll-ms-/scroll-me-)' },
  { pattern: /^(?:scroll-)?p[lr]-\S+$/, instead: 'ps-/pe- (scroll-ps-/scroll-pe-)' },
  {
    pattern: /^(?:left|right)-(?:\d+(?:\.\d+)?|px|full|auto|\d+\/\d+|\[.+\]|\(.+\))$/,
    instead: 'start-/end-',
  },
  { pattern: /^text-(?:left|right)$/, instead: 'text-start/text-end' },
  {
    pattern: /^(?:float|clear)-(?:left|right)$/,
    instead: 'float-start/float-end, clear-start/clear-end',
  },
  { pattern: /^border-[lr](?:-\S+)?$/, instead: 'border-s/border-e' },
  {
    pattern: /^rounded-(?:[lr]|tl|tr|bl|br)(?:-\S+)?$/,
    instead: 'rounded-s/rounded-e/rounded-ss/rounded-se/rounded-es/rounded-ee',
  },
]

/** Physical style properties, each with the logical one to use instead. */
const PHYSICAL_STYLE: Record<string, string> = {
  marginLeft: 'marginInlineStart',
  marginRight: 'marginInlineEnd',
  paddingLeft: 'paddingInlineStart',
  paddingRight: 'paddingInlineEnd',
  left: 'insetInlineStart',
  right: 'insetInlineEnd',
  borderLeft: 'borderInlineStart',
  borderRight: 'borderInlineEnd',
  borderLeftWidth: 'borderInlineStartWidth',
  borderRightWidth: 'borderInlineEndWidth',
  borderLeftColor: 'borderInlineStartColor',
  borderRightColor: 'borderInlineEndColor',
  borderLeftStyle: 'borderInlineStartStyle',
  borderRightStyle: 'borderInlineEndStyle',
  borderTopLeftRadius: 'borderStartStartRadius',
  borderTopRightRadius: 'borderStartEndRadius',
  borderBottomLeftRadius: 'borderEndStartRadius',
  borderBottomRightRadius: 'borderEndEndRadius',
  scrollMarginLeft: 'scrollMarginInlineStart',
  scrollMarginRight: 'scrollMarginInlineEnd',
  scrollPaddingLeft: 'scrollPaddingInlineStart',
  scrollPaddingRight: 'scrollPaddingInlineEnd',
}

/** Style properties whose values 'left' and 'right' are physical. */
const PHYSICAL_VALUE_PROPERTIES = new Set(['textAlign', 'float', 'clear'])

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Logical properties only, so layouts follow the writing direction: ms-/me-/ps-/pe-/start-/end-/text-start, never ml-/left-/text-left.',
    },
    schema: [],
    messages: {
      physicalUtility:
        '"{{token}}" is physical and does not flip in right-to-left. Use {{instead}}.',
      physicalStyle: '"{{name}}" is physical and does not flip in right-to-left. Use {{instead}}.',
      physicalValue:
        '"{{name}}: {{value}}" is physical and does not flip in right-to-left. Use "{{instead}}".',
    },
  },
  create(context) {
    return {
      ...stringListeners((text, node) => {
        for (const token of words(text)) {
          const { utility } = splitClass(token)
          const match = PHYSICAL_UTILITIES.find(({ pattern }) => pattern.test(utility))
          if (match !== undefined) {
            context.report({
              node,
              messageId: 'physicalUtility',
              data: { token, instead: match.instead },
            })
          }
        }
      }),
      ...styleListener(({ name, value, node }) => {
        const instead = PHYSICAL_STYLE[name]
        if (instead !== undefined) {
          context.report({ node, messageId: 'physicalStyle', data: { name, instead } })
        } else if (PHYSICAL_VALUE_PROPERTIES.has(name) && (value === 'left' || value === 'right')) {
          context.report({
            node,
            messageId: 'physicalValue',
            data: {
              name,
              value,
              instead: `${name === 'textAlign' ? '' : 'inline-'}${value === 'left' ? 'start' : 'end'}`,
            },
          })
        }
      }),
    }
  },
}

export default rule
