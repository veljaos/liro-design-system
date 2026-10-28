/*
 * The pure rules of CodeBlock (P5.93): lines, their numbers, diff lines and highlighted lines,
 * ANSI colours in logs and the text the copy button copies. Tested in code-block-logic.test.ts.
 * Nothing here highlights syntax: that is `@veljaos/ui/code` (Shiki), which returns CodeTokens.
 */

/**
 * The meaning of a highlighted piece of code, from the Liro code theme. Each is drawn with a CSS
 * variable, `--liro-code-<kind>`, set from the Liro tokens in styles.css ("Code").
 */
export type CodeTokenKind =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'constant'
  | 'entity'
  | 'punctuation'
  | 'link'
  | 'inserted'
  | 'deleted'
  | 'invalid'

export const CODE_TOKEN_KINDS: readonly CodeTokenKind[] = [
  'comment',
  'keyword',
  'string',
  'constant',
  'entity',
  'punctuation',
  'link',
  'inserted',
  'deleted',
  'invalid',
]

/** A piece of a highlighted line: its text and, unless it is plain text, its kind. */
export interface CodeToken {
  text: string
  kind?: CodeTokenKind
  italic?: boolean
  bold?: boolean
  underline?: boolean
}

/**
 * Highlights code: the lines' tokens (one array per line of `code`), or null when the language is
 * not known. `@veljaos/ui/code` gives one built on Shiki (`CodeHighlighting`).
 */
export type CodeHighlighter = (code: string, language: string) => Promise<CodeToken[][] | null>

/**
 * A line's kind: 'plain', a diff's 'added' or 'removed' line, or a diff's 'meta' line (a hunk
 * header "@@ -1,4 +1,5 @@", or the file names "--- a/…" and "+++ b/…").
 */
export type CodeLineKind = 'plain' | 'added' | 'removed' | 'meta'

export interface CodeLine {
  /** The line's place in the code, from 0. */
  index: number
  /** Its number in the gutter; null for a diff's meta line. */
  number: number | null
  kind: CodeLineKind
  /** The text shown, without a diff's marker. */
  text: string
  /** One of the lines the application points at (`highlightLines`). */
  highlighted: boolean
}

export interface CodeLineOptions {
  /** Read "+", "-" and " " at the start of each line as a diff. */
  diff?: boolean
  /** The number of the first line. Default 1. */
  startLine?: number
  /** The numbers of the lines to highlight, counted from `startLine`. */
  highlightLines?: readonly number[]
}

/** The lines of a text: "\r\n" read as "\n"; a trailing newline does not make an empty last line. */
export function splitCodeLines(code: string): string[] {
  const text = code.replace(/\r\n?/g, '\n')
  const lines = text.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines
}

/** One line of a unified diff: its kind and its text without the marker. */
export function diffLine(raw: string): { kind: CodeLineKind; text: string } {
  if (raw.startsWith('@@') || raw.startsWith('+++ ') || raw.startsWith('--- ')) {
    return { kind: 'meta', text: raw }
  }
  if (raw.startsWith('+')) return { kind: 'added', text: raw.slice(1) }
  if (raw.startsWith('-')) return { kind: 'removed', text: raw.slice(1) }
  if (raw.startsWith(' ')) return { kind: 'plain', text: raw.slice(1) }
  return { kind: 'plain', text: raw }
}

/**
 * The lines CodeBlock draws: numbered from `startLine` (a diff's meta lines get no number), each
 * with its kind and whether the application highlights it.
 */
export function codeLines(code: string, options: CodeLineOptions = {}): CodeLine[] {
  const start = options.startLine ?? 1
  const highlighted = new Set(options.highlightLines ?? [])
  let next = start
  return splitCodeLines(code).map((raw, index) => {
    const { kind, text } =
      options.diff === true ? diffLine(raw) : { kind: 'plain' as const, text: raw }
    const number = kind === 'meta' ? null : next
    if (number !== null) next += 1
    return {
      index,
      number,
      kind,
      text,
      highlighted: number !== null && highlighted.has(number),
    }
  })
}

/** How many digits the gutter needs: those of the largest line number (at least one). */
export function lineNumberDigits(lines: readonly CodeLine[]): number {
  let largest = 0
  for (const line of lines) if (line.number !== null && line.number > largest) largest = line.number
  return Math.max(1, String(largest).length)
}

// ── ANSI colours (terminal output and logs) ────────────────────────────────────────────────────

/** A terminal colour as the Liro code theme draws it; black and white are the text's own colour. */
export type AnsiColor = 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'gray'

export interface AnsiStyle {
  fg?: AnsiColor
  bg?: AnsiColor
  bold?: boolean
  dim?: boolean
  italic?: boolean
  underline?: boolean
}

/** A run of text in one style. */
export interface AnsiSpan {
  text: string
  style: AnsiStyle
}

const ESC = String.fromCharCode(27)
/** Every escape sequence: SGR ("ESC [ 31 m") and the others (cursor moves), which are dropped. */
const ESCAPE = new RegExp(`${ESC}\\[([0-9;?]*)([A-Za-z])`, 'g')

/** The eight basic colours by their offset (30–37, 40–47, 90–97, 100–107). */
const BASIC: readonly (AnsiColor | undefined)[] = [
  undefined, // black: the text's own colour
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  undefined, // white: the text's own colour
]

function basicColor(offset: number, bright: boolean): AnsiColor | undefined {
  // Bright black is the grey of secondary output (timestamps, dim notes).
  if (bright && offset === 0) return 'gray'
  return BASIC[offset]
}

function without(style: AnsiStyle, ...keys: (keyof AnsiStyle)[]): AnsiStyle {
  const keep = (key: keyof AnsiStyle) => !keys.includes(key) && style[key] !== undefined
  return {
    ...(keep('fg') ? { fg: style.fg } : {}),
    ...(keep('bg') ? { bg: style.bg } : {}),
    ...(keep('bold') ? { bold: style.bold } : {}),
    ...(keep('dim') ? { dim: style.dim } : {}),
    ...(keep('italic') ? { italic: style.italic } : {}),
    ...(keep('underline') ? { underline: style.underline } : {}),
  }
}

function withColor(style: AnsiStyle, key: 'fg' | 'bg', color: AnsiColor | undefined): AnsiStyle {
  const rest = without(style, key)
  return color === undefined ? rest : { ...rest, [key]: color }
}

/** A style after one SGR sequence's parameters ("1;31", "0", "38;5;9"). */
export function applySgr(style: AnsiStyle, parameters: string): AnsiStyle {
  const codes = parameters === '' ? [0] : parameters.split(';').map((part) => Number(part) || 0)
  let next = style
  for (let at = 0; at < codes.length; at += 1) {
    const code = codes[at] ?? 0
    if (code === 0) next = {}
    else if (code === 1) next = { ...next, bold: true }
    else if (code === 2) next = { ...next, dim: true }
    else if (code === 3) next = { ...next, italic: true }
    else if (code === 4) next = { ...next, underline: true }
    else if (code === 22) next = without(next, 'bold', 'dim')
    else if (code === 23) next = without(next, 'italic')
    else if (code === 24) next = without(next, 'underline')
    else if (code >= 30 && code <= 37) next = withColor(next, 'fg', basicColor(code - 30, false))
    else if (code === 39) next = without(next, 'fg')
    else if (code >= 40 && code <= 47) next = withColor(next, 'bg', basicColor(code - 40, false))
    else if (code === 49) next = without(next, 'bg')
    else if (code >= 90 && code <= 97) next = withColor(next, 'fg', basicColor(code - 90, true))
    else if (code >= 100 && code <= 107) next = withColor(next, 'bg', basicColor(code - 100, true))
    else if (code === 38 || code === 48) {
      // 256 colours ("38;5;n"): the 16 basic ones are read, the others leave the text plain.
      // True colour ("38;2;r;g;b") is never drawn: raw colours are not the Liro theme's.
      const key = code === 38 ? 'fg' : 'bg'
      if (codes[at + 1] === 5) {
        const index = codes[at + 2] ?? -1
        next = withColor(
          next,
          key,
          index >= 0 && index < 16 ? basicColor(index % 8, index >= 8) : undefined,
        )
        at += 2
      } else if (codes[at + 1] === 2) {
        next = without(next, key)
        at += 4
      }
    }
  }
  return next
}

/** One line of terminal output as styled runs, from the style the previous line ended in. */
export function parseAnsi(
  text: string,
  start: AnsiStyle = {},
): { spans: AnsiSpan[]; end: AnsiStyle } {
  const spans: AnsiSpan[] = []
  let style = start
  let last = 0
  const push = (piece: string) => {
    if (piece === '') return
    const previous = spans[spans.length - 1]
    if (previous !== undefined && sameStyle(previous.style, style)) previous.text += piece
    else spans.push({ text: piece, style })
  }
  for (const match of text.matchAll(ESCAPE)) {
    push(text.slice(last, match.index))
    if (match[2] === 'm') style = applySgr(style, match[1] ?? '')
    last = match.index + match[0].length
  }
  push(text.slice(last))
  return { spans, end: style }
}

function sameStyle(first: AnsiStyle, second: AnsiStyle): boolean {
  return (
    first.fg === second.fg &&
    first.bg === second.bg &&
    first.bold === second.bold &&
    first.dim === second.dim &&
    first.italic === second.italic &&
    first.underline === second.underline
  )
}

/** Terminal output's lines as styled runs; a style carries over to the next line. */
export function ansiLines(lines: readonly string[]): AnsiSpan[][] {
  let style: AnsiStyle = {}
  return lines.map((line) => {
    const parsed = parseAnsi(line, style)
    style = parsed.end
    return parsed.spans
  })
}

/** Text without its escape sequences. */
export function stripAnsi(text: string): string {
  return text.replace(ESCAPE, '')
}

/**
 * What the copy button copies: the code only — no line numbers, no diff markers. A diff copies the
 * code after the change (unchanged and added lines; removed and meta lines left out); terminal
 * output copies its text without escape sequences.
 */
export function codeCopyText(lines: readonly CodeLine[], options: { ansi?: boolean } = {}): string {
  return lines
    .filter((line) => line.kind === 'plain' || line.kind === 'added')
    .map((line) => (options.ansi === true ? stripAnsi(line.text) : line.text))
    .join('\n')
}

/** The languages CodeBlock never sends to a highlighter: plain text and terminal output. */
export function isPlainLanguage(language: string | undefined): boolean {
  if (language === undefined) return true
  const name = language.trim().toLowerCase()
  return (
    name === '' ||
    name === 'text' ||
    name === 'plain' ||
    name === 'txt' ||
    name === 'ansi' ||
    name === 'log'
  )
}

/** Terminal output whose ANSI colours CodeBlock draws itself. */
export function isAnsiLanguage(language: string | undefined): boolean {
  return language?.trim().toLowerCase() === 'ansi'
}
