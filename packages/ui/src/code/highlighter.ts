import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import {
  codeToTokensBase,
  createShikiPrimitiveAsync,
  type LanguageRegistration,
  type ShikiPrimitive,
  type ThemedToken,
  type ThemeRegistration,
} from '@shikijs/primitive'
import {
  CODE_TOKEN_KINDS,
  type CodeToken,
  type CodeTokenKind,
} from '../components/code-block-logic'

/*
 * Syntax highlighting for CodeBlock (P5.93, the owner's item 48), on Shiki (MIT): its tokenizer
 * (`@shikijs/primitive`), its JavaScript regular-expression engine (no WebAssembly) and its
 * grammars (`@shikijs/langs`), each language loaded the first time it is used. No Shiki theme is
 * shipped: the Liro code theme names CSS variables (`--liro-code-keyword` …), set from the Liro
 * tokens in styles.css, so both themes follow and no raw colour reaches the page. Tested in
 * highlighter.test.ts.
 */

const LANGUAGE_LOADERS = {
  bash: () => import('@shikijs/langs/bash'),
  csharp: () => import('@shikijs/langs/csharp'),
  css: () => import('@shikijs/langs/css'),
  dockerfile: () => import('@shikijs/langs/dockerfile'),
  dotenv: () => import('@shikijs/langs/dotenv'),
  go: () => import('@shikijs/langs/go'),
  graphql: () => import('@shikijs/langs/graphql'),
  html: () => import('@shikijs/langs/html'),
  http: () => import('@shikijs/langs/http'),
  ini: () => import('@shikijs/langs/ini'),
  java: () => import('@shikijs/langs/java'),
  javascript: () => import('@shikijs/langs/javascript'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  jsx: () => import('@shikijs/langs/jsx'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  powershell: () => import('@shikijs/langs/powershell'),
  python: () => import('@shikijs/langs/python'),
  sql: () => import('@shikijs/langs/sql'),
  tsx: () => import('@shikijs/langs/tsx'),
  typescript: () => import('@shikijs/langs/typescript'),
  xml: () => import('@shikijs/langs/xml'),
} satisfies Record<string, () => Promise<{ default: LanguageRegistration[] }>>

/** A language CodeBlock highlights. */
export type CodeLanguage = keyof typeof LANGUAGE_LOADERS

/**
 * The languages highlighted: what business applications show (payloads, queries, scripts). Every
 * grammar here is MIT (VS Code's, and those of dotenv, GraphQL, REST Client and Kotlin; noticed in
 * THIRD-PARTY-NOTICES.md); YAML and TOML are left out, their TextMate grammars carry no licence.
 */
export const CODE_LANGUAGES = Object.keys(LANGUAGE_LOADERS) as CodeLanguage[]

const ALIASES: Readonly<Record<string, CodeLanguage>> = {
  'c#': 'csharp',
  cjs: 'javascript',
  cs: 'csharp',
  cts: 'typescript',
  docker: 'dockerfile',
  env: 'dotenv',
  gql: 'graphql',
  js: 'javascript',
  kt: 'kotlin',
  mjs: 'javascript',
  mts: 'typescript',
  ps: 'powershell',
  ps1: 'powershell',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  ts: 'typescript',
  zsh: 'bash',
}

/** A language's name or alias ("ts", "yml", "C#") as the language highlighted; null if unknown. */
export function codeLanguage(name: string): CodeLanguage | null {
  const key = name.trim().toLowerCase()
  if (Object.hasOwn(LANGUAGE_LOADERS, key)) return key as CodeLanguage
  return ALIASES[key] ?? null
}

const THEME_NAME = 'liro'
const v = (name: string) => `var(--liro-code-${name})`

/**
 * The Liro code theme: TextMate scopes to the meanings of CodeTokenKind, each a CSS variable.
 * Unscoped text is the code's own colour (text.primary).
 */
export const LIRO_CODE_THEME: ThemeRegistration = {
  name: THEME_NAME,
  type: 'light',
  colors: { 'editor.foreground': v('text'), 'editor.background': v('background') },
  tokenColors: [
    {
      scope: ['punctuation', 'meta.brace', 'keyword.operator', 'meta.tag.sgml'],
      settings: { foreground: v('punctuation') },
    },
    {
      scope: [
        'keyword',
        'storage',
        'variable.language',
        'keyword.operator.new',
        'keyword.operator.expression',
      ],
      settings: { foreground: v('keyword') },
    },
    {
      scope: [
        'string',
        'punctuation.definition.string',
        'string.template punctuation',
        'markup.inline.raw',
        'markup.fenced_code',
      ],
      settings: { foreground: v('string') },
    },
    {
      scope: [
        'constant',
        'support.constant',
        'variable.other.constant',
        'variable.other.enummember',
        'entity.other.attribute-name',
      ],
      settings: { foreground: v('constant') },
    },
    {
      scope: [
        'entity.name',
        'support.function',
        'support.class',
        'support.type',
        'entity.other.inherited-class',
        'meta.function-call entity.name.function',
      ],
      settings: { foreground: v('entity') },
    },
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'],
      settings: { foreground: v('comment'), fontStyle: 'italic' },
    },
    {
      scope: ['markup.underline.link', 'string.other.link'],
      settings: { foreground: v('link'), fontStyle: 'underline' },
    },
    { scope: ['markup.inserted'], settings: { foreground: v('inserted') } },
    { scope: ['markup.deleted'], settings: { foreground: v('deleted') } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: v('invalid') } },
    { scope: ['markup.heading', 'markup.bold', 'strong'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic', 'emphasis'], settings: { fontStyle: 'italic' } },
  ],
}

const KINDS = new Set<string>(CODE_TOKEN_KINDS)

/** A Shiki token's colour as the Liro kind it names; nothing for plain text or any other colour. */
export function tokenKind(color: string | undefined): CodeTokenKind | undefined {
  const match = /^var\(--liro-code-([a-z]+)\)$/.exec(color ?? '')
  const name = match?.[1]
  return name !== undefined && KINDS.has(name) ? (name as CodeTokenKind) : undefined
}

/** Shiki's tokens as CodeTokens: text, the kind (never a colour) and the font style. */
export function tokensFromShiki(lines: readonly (readonly ThemedToken[])[]): CodeToken[][] {
  return lines.map((line) =>
    line.map((token) => {
      const kind = tokenKind(token.color)
      const style = token.fontStyle ?? 0
      return {
        text: token.content,
        ...(kind === undefined ? {} : { kind }),
        ...((style & 1) === 0 ? {} : { italic: true }),
        ...((style & 2) === 0 ? {} : { bold: true }),
        ...((style & 4) === 0 ? {} : { underline: true }),
      }
    }),
  )
}

/** Code longer than this is shown as plain text: highlighting it would hold the page. */
export const HIGHLIGHT_LIMIT = 100_000
/** A line longer than this is not tokenized (a minified file, a one-line payload). */
const LINE_LIMIT = 2_000

let primitive: Promise<ShikiPrimitive> | null = null
const loaded = new Map<CodeLanguage, Promise<void>>()

function shiki(): Promise<ShikiPrimitive> {
  primitive ??= createShikiPrimitiveAsync({
    themes: [LIRO_CODE_THEME],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  })
  return primitive
}

function loadLanguage(instance: ShikiPrimitive, language: CodeLanguage): Promise<void> {
  let loading = loaded.get(language)
  if (loading === undefined) {
    loading = LANGUAGE_LOADERS[language]().then((module) => instance.loadLanguage(module.default))
    loading.catch(() => {
      loaded.delete(language)
    })
    loaded.set(language, loading)
  }
  return loading
}

/**
 * Highlights code in a language (a name or an alias): one array of tokens per line, or null for
 * a language not in CODE_LANGUAGES or code over HIGHLIGHT_LIMIT. The first call loads Shiki's
 * tokenizer, and each language loads the first time it is used.
 */
export async function highlightCode(code: string, language: string): Promise<CodeToken[][] | null> {
  const id = codeLanguage(language)
  if (id === null || code.length > HIGHLIGHT_LIMIT) return null
  const instance = await shiki()
  await loadLanguage(instance, id)
  const tokens = codeToTokensBase(instance, code, {
    lang: id,
    theme: THEME_NAME,
    tokenizeMaxLineLength: LINE_LIMIT,
  })
  return tokensFromShiki(tokens)
}
