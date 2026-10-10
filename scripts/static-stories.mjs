// The check of "Visual stories are static" (P5.23, docs/decisions.md): a story that the visual
// test pictures renders its state directly from its args or initial state. A story whose play
// function clicks, types, presses keys, uploads, focuses, blurs, dispatches events or scrolls —
// itself or through a helper — must carry the tag "interaction", so the visual test skips it
// (apps/storybook/tests/visual.spec.ts). `pnpm test` runs it (scripts/static-stories.test.mjs).
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export const INTERACTION_TAG = 'interaction'

/** Objects whose every call acts on the page. */
const ACTING_OBJECTS = new Set(['userEvent', 'fireEvent', 'user'])
/** Methods that act on the page, whatever they are called on. */
const ACTING_METHODS = new Set([
  'click',
  'focus',
  'blur',
  'scrollIntoView',
  'scrollTo',
  'scrollBy',
  'dispatchEvent',
  'requestSubmit',
  'submit',
])
/** Properties whose assignment scrolls. */
const SCROLL_PROPERTIES = new Set(['scrollTop', 'scrollLeft'])

/**
 * Whether the node acts on the page itself (not through a named helper).
 * @param {ts.Node} node
 * @returns {boolean}
 */
function actsDirectly(node) {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const target = node.expression.expression
    const method = node.expression.name.text
    if (ts.isIdentifier(target) && ACTING_OBJECTS.has(target.text)) return true
    if (ACTING_METHODS.has(method)) return true
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
    ts.isPropertyAccessExpression(node.left) &&
    SCROLL_PROPERTIES.has(node.left.name.text)
  ) {
    return true
  }
  return false
}

/**
 * The names referenced inside the node.
 * @param {ts.Node} node
 * @returns {Set<string>}
 */
function referencedNames(node) {
  /** @type {Set<string>} */
  const names = new Set()
  /** @param {ts.Node} child */
  const visit = (child) => {
    if (ts.isIdentifier(child)) names.add(child.text)
    ts.forEachChild(child, visit)
  }
  visit(node)
  return names
}

/**
 * @param {ts.Node} node
 * @returns {boolean}
 */
function containsDirectAction(node) {
  let found = false
  /** @param {ts.Node} child */
  const visit = (child) => {
    if (found) return
    if (actsDirectly(child)) {
      found = true
      return
    }
    ts.forEachChild(child, visit)
  }
  visit(node)
  return found
}

/** @type {Map<string, Set<string>>} */
const moduleCache = new Map()

/**
 * The module's top-level functions (declarations and const arrow or function expressions) that
 * act on the page, directly or through another such function, with the ones imported from
 * relative modules.
 * @param {string} file
 * @returns {Set<string>}
 */
function actingFunctions(file) {
  const cached = moduleCache.get(file)
  if (cached !== undefined) return cached
  /** @type {Set<string>} */
  const result = new Set()
  moduleCache.set(file, result)
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  /** @type {Map<string, ts.Node>} */
  const bodies = new Map()
  /** @type {Set<string>} */
  const imported = new Set()
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
      bodies.set(statement.name.text, statement)
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const init = declaration.initializer
        if (
          ts.isIdentifier(declaration.name) &&
          init !== undefined &&
          (ts.isArrowFunction(init) || ts.isFunctionExpression(init))
        ) {
          bodies.set(declaration.name.text, init)
        }
      }
    } else if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.') &&
      statement.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      const base = resolve(dirname(file), statement.moduleSpecifier.text)
      const target = ['.ts', '.tsx', '/index.ts', '/index.tsx']
        .map((extension) => base + extension)
        .find((candidate) => existsSync(candidate))
      if (target === undefined) continue
      const there = actingFunctions(target)
      for (const element of statement.importClause.namedBindings.elements) {
        const original = (element.propertyName ?? element.name).text
        if (there.has(original)) imported.add(element.name.text)
      }
    }
  }
  for (const name of imported) result.add(name)
  let changed = true
  for (const [name, body] of bodies) {
    if (containsDirectAction(body)) result.add(name)
  }
  while (changed) {
    changed = false
    for (const [name, body] of bodies) {
      if (result.has(name)) continue
      for (const used of referencedNames(body)) {
        if (result.has(used)) {
          result.add(name)
          changed = true
          break
        }
      }
    }
  }
  return result
}

/**
 * @param {ts.Node | undefined} node
 * @returns {string[]}
 */
function stringArray(node) {
  if (node === undefined || !ts.isArrayLiteralExpression(node)) return []
  return node.elements.filter(ts.isStringLiteral).map((element) => element.text)
}

/**
 * @param {ts.ObjectLiteralExpression} object
 * @param {string} name
 * @returns {ts.PropertyAssignment | undefined}
 */
function property(object, name) {
  return object.properties.find(
    /** @returns {each is ts.PropertyAssignment} */
    (each) =>
      ts.isPropertyAssignment(each) && ts.isIdentifier(each.name) && each.name.text === name,
  )
}

/**
 * @param {ts.ObjectLiteralExpression} object
 * @returns {ts.ObjectLiteralElementLike | undefined}
 */
function playOf(object) {
  return object.properties.find(
    (each) =>
      (ts.isPropertyAssignment(each) || ts.isMethodDeclaration(each)) &&
      ts.isIdentifier(each.name) &&
      each.name.text === 'play',
  )
}

/**
 * The stories of one file: export name, whether its play acts on the page, and whether it is
 * tagged "interaction" (on the story or the file's meta).
 * @param {string} file
 * @returns {{ name: string, acts: boolean, tagged: boolean }[]}
 */
export function storiesOf(file) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  const acting = actingFunctions(file)
  /** @type {Map<string, ts.ObjectLiteralExpression>} */
  const objects = new Map()
  /** @type {string[]} */
  let metaTags = []
  /**
   * @param {ts.Expression | undefined} expression
   * @returns {ts.ObjectLiteralExpression | undefined}
   */
  const metaObject = (expression) => {
    let node = expression
    if (node === undefined) return undefined
    while (ts.isSatisfiesExpression(node) || ts.isAsExpression(node)) node = node.expression
    if (ts.isIdentifier(node)) {
      for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === node.text) {
            return metaObject(declaration.initializer)
          }
        }
      }
    }
    return node !== undefined && ts.isObjectLiteralExpression(node) ? node : undefined
  }
  for (const statement of source.statements) {
    if (ts.isExportAssignment(statement)) {
      const meta = metaObject(statement.expression)
      if (meta !== undefined) metaTags = stringArray(property(meta, 'tags')?.initializer)
    }
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      continue
    }
    for (const declaration of statement.declarationList.declarations) {
      let init = declaration.initializer
      while (init !== undefined && (ts.isSatisfiesExpression(init) || ts.isAsExpression(init))) {
        init = init.expression
      }
      if (
        ts.isIdentifier(declaration.name) &&
        init !== undefined &&
        ts.isObjectLiteralExpression(init)
      ) {
        objects.set(declaration.name.text, init)
      }
    }
  }
  /** @type {Map<string, boolean>} */
  const actsMemo = new Map()
  /**
   * @param {string} name
   * @param {Set<string>} seen
   * @returns {boolean}
   */
  const acts = (name, seen = new Set()) => {
    const known = actsMemo.get(name)
    if (known !== undefined) return known
    if (seen.has(name)) return false
    seen.add(name)
    const object = objects.get(name)
    if (object === undefined) return false
    let result = false
    const play = playOf(object)
    if (play !== undefined) {
      const body = ts.isPropertyAssignment(play) ? play.initializer : play
      if (ts.isPropertyAccessExpression(body) && ts.isIdentifier(body.expression)) {
        // play: Other.play
        result = acts(body.expression.text, seen)
      } else if (ts.isIdentifier(body)) {
        result = acting.has(body.text)
      } else {
        result =
          containsDirectAction(body) || [...referencedNames(body)].some((used) => acting.has(used))
      }
    } else {
      // A story spread from another inherits its play.
      for (const each of object.properties) {
        if (ts.isSpreadAssignment(each) && ts.isIdentifier(each.expression)) {
          if (acts(each.expression.text, seen)) result = true
        }
      }
    }
    actsMemo.set(name, result)
    return result
  }
  /**
   * @param {string} name
   * @param {Set<string>} seen
   * @returns {string[]}
   */
  const tagsOf = (name, seen = new Set()) => {
    if (seen.has(name)) return []
    seen.add(name)
    const object = objects.get(name)
    if (object === undefined) return []
    const own = property(object, 'tags')
    if (own !== undefined) return stringArray(own.initializer)
    for (const each of object.properties) {
      if (ts.isSpreadAssignment(each) && ts.isIdentifier(each.expression)) {
        const inherited = tagsOf(each.expression.text, seen)
        if (inherited.length > 0) return inherited
      }
    }
    return []
  }
  return [...objects.keys()]
    .filter((name) => name !== 'default')
    .map((name) => {
      const tags = [...metaTags, ...tagsOf(name)]
      return { name, acts: acts(name), tagged: tags.includes(INTERACTION_TAG) }
    })
}

/**
 * Every story file of the repository (tracked or new, not ignored).
 * @param {string} root
 * @returns {string[]}
 */
export function storyFiles(root) {
  const listed = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', '*.stories.tsx'],
    { cwd: root, encoding: 'utf8' },
  )
  return listed
    .split('\n')
    .filter((file) => file !== '' && !file.startsWith('.claude/'))
    .map((file) => join(root, file))
    .filter((file) => existsSync(file))
}

/**
 * The stories that act on the page without the "interaction" tag, as "file: Story".
 * @param {string} root
 * @returns {string[]}
 */
export function violations(root) {
  /** @type {string[]} */
  const found = []
  for (const file of storyFiles(root)) {
    for (const story of storiesOf(file)) {
      if (story.acts && !story.tagged) found.push(`${relative(root, file)}: ${story.name}`)
    }
  }
  return found
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href
) {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const found = violations(root)
  if (found.length > 0) {
    console.error(
      `${String(found.length)} pictured stories act on the page; tag them "interaction" and add a static story:\n${found.join('\n')}`,
    )
    process.exit(1)
  }
  console.log('Every pictured story is static.')
}
