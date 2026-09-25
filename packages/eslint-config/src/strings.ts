import type { Rule } from 'eslint'

/** A node as the rules read it: JSX node types are not in the ESTree types ESLint ships. */
interface AnyNode {
  type: string
  parent?: AnyNode | null
  name?: unknown
  key?: unknown
  computed?: boolean
  source?: unknown
}

/** A utility class split into its variants (`hover`, `md`, `dark`) and the utility itself. */
export interface ClassToken {
  variants: string[]
  utility: string
}

/**
 * Splits `md:hover:!-ml-4` into variants ['md', 'hover'] and utility 'ml-4'. Colons inside
 * brackets or parentheses (`[&:hover]:x`, `bg-(--a:b)`) do not split.
 */
export function splitClass(token: string): ClassToken {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const character of token) {
    if (character === '[' || character === '(') depth += 1
    if (character === ']' || character === ')') depth = Math.max(0, depth - 1)
    if (character === ':' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += character
    }
  }
  const utility = current.replace(/^!/, '').replace(/!$/, '').replace(/^-/, '')
  return { variants: parts, utility }
}

/** The whitespace-separated words of a string: class names, or words of any other text. */
export function words(text: string): string[] {
  return text.split(/\s+/).filter((word) => word !== '')
}

function isModuleSource(node: AnyNode): boolean {
  const parent = node.parent
  if (parent === null || parent === undefined) return false
  return (
    (parent.type === 'ImportDeclaration' ||
      parent.type === 'ExportNamedDeclaration' ||
      parent.type === 'ExportAllDeclaration' ||
      parent.type === 'ImportExpression' ||
      parent.type === 'TSExternalModuleReference') &&
    parent.source === node
  )
}

function isPropertyKey(node: AnyNode): boolean {
  const parent = node.parent
  return (
    parent !== null &&
    parent !== undefined &&
    (parent.type === 'Property' || parent.type === 'PropertyDefinition') &&
    parent.key === node &&
    parent.computed !== true
  )
}

/**
 * Listeners that call `check` with the text of every string literal and every piece of a
 * template literal, except module paths and object keys: where class names and CSS values live.
 */
export function stringListeners(
  check: (text: string, node: Rule.Node) => void,
): Pick<Rule.RuleListener, 'Literal' | 'TemplateElement'> {
  return {
    Literal(node) {
      if (typeof node.value !== 'string') return
      const anyNode = node as unknown as AnyNode
      if (isModuleSource(anyNode) || isPropertyKey(anyNode)) return
      check(node.value, node)
    },
    TemplateElement(node) {
      check(node.value.cooked ?? node.value.raw, node)
    },
  }
}

/** A property of an object literal written directly in a JSX `style` attribute: `style={{ … }}`. */
export interface StyleProperty {
  /** The property name, e.g. 'marginLeft'. */
  name: string
  /** The value when it is a string literal, otherwise null. */
  value: string | null
  node: Rule.Node
}

function propertyName(key: unknown): string | null {
  if (typeof key !== 'object' || key === null) return null
  const record = key as { type?: string; name?: unknown; value?: unknown }
  if (record.type === 'Identifier' && typeof record.name === 'string') return record.name
  if (record.type === 'Literal' && typeof record.value === 'string') return record.value
  return null
}

/** A listener that calls `check` for every property of an inline JSX style object. */
export function styleListener(
  check: (property: StyleProperty) => void,
): Pick<Rule.RuleListener, 'Property'> {
  return {
    Property(node) {
      const object = (node as unknown as AnyNode).parent
      const container = object?.parent
      const attribute = container?.parent
      if (
        object?.type !== 'ObjectExpression' ||
        container?.type !== 'JSXExpressionContainer' ||
        attribute?.type !== 'JSXAttribute'
      ) {
        return
      }
      const attributeName = attribute.name as { name?: unknown } | undefined
      if (attributeName?.name !== 'style') return
      const name = propertyName(node.key)
      if (name === null || node.computed) return
      const value =
        node.value.type === 'Literal' && typeof node.value.value === 'string'
          ? node.value.value
          : null
      check({ name, value, node })
    },
  }
}
