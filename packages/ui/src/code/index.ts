// @veljaos/ui/code (P5.93): syntax highlighting for CodeBlock on Shiki (MIT; its JavaScript
// regular-expression engine, no WebAssembly). A subpath of its own, so Shiki loads only where an
// application asks for highlighting: CodeBlock itself is in `@veljaos/ui` and draws plain text,
// diffs and terminal colours without it.
export { CodeHighlighting } from './code-highlighting'
export {
  CODE_LANGUAGES,
  codeLanguage,
  HIGHLIGHT_LIMIT,
  highlightCode,
  LIRO_CODE_THEME,
  tokenKind,
  tokensFromShiki,
} from './highlighter'
export type { CodeLanguage, LiroCodeTheme, ShikiToken } from './highlighter'
