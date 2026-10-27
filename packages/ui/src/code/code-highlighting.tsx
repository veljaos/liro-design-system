import type { ReactNode } from 'react'
import { CodeHighlighterProvider } from '../components/code-block'
import { highlightCode } from './highlighter'

/**
 * Highlights every CodeBlock inside it whose `language` is known (CODE_LANGUAGES), with Shiki and
 * the Liro code theme. Put it once around the application (beside LiroProvider), or around the
 * part that shows code. Outside it, CodeBlock shows plain text.
 */
export function CodeHighlighting({ children }: { children: ReactNode }) {
  return <CodeHighlighterProvider highlighter={highlightCode}>{children}</CodeHighlighterProvider>
}
