import { Check, ChevronDown, Copy, WrapText } from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import {
  ansiLines,
  codeCopyText,
  codeLines,
  isAnsiLanguage,
  isPlainLanguage,
  lineNumberDigits,
  type AnsiSpan,
  type CodeHighlighter,
  type CodeLine,
  type CodeToken,
} from './code-block-logic'

/*
 * CodeBlock (shadcn/ui's Code Block): code, a payload, terminal output
 * or a diff, as the application gives it.
 * - **Header** (optional): a title — a file name or a label ("Response 502", "webhook.json") —
 *   and the actions at the end: the application's (`actions`), "Wrap lines" (`wrapToggle`, a
 *   pressed toggle) and Copy. Without a title, Copy floats at the end of the first line.
 * - **Copy** copies the code only: no line numbers, no diff markers, no escape sequences (a diff
 *   copies the code after the change). "Copied" is announced politely; a browser that refuses says
 *   so in words.
 * - **Lines**: numbers (`lineNumbers`, from `startLine`), a diff's added and removed lines (`diff`,
 *   or `language="diff"`: a tint and a "+" / "−" marker, never colour alone), lines the application
 *   points at (`highlightLines`, warning.bg with a bar). Gutters are not selectable.
 * - **Wrap** (`wrap`): long lines wrap instead of scrolling sideways.
 * - **Height cap** (`maxHeight`): the code scrolls inside. A block that scrolls is a tab stop, so
 *   the keyboard scrolls it; it is a region named by its title (or `label`).
 * - **Size** 'sm' for tool output and logs inside a row (12px text, tighter padding).
 * - **Colours**: syntax highlighting comes from `@veljaos/ui/code` (Shiki), given through
 *   `CodeHighlighting`, so the main entry never loads it; without it the code is plain text.
 *   `language="ansi"` draws a terminal's colours (CodeBlock reads them itself). Every colour is a
 *   `--liro-code-*` variable set from the Liro tokens (styles.css, "Code"): the Liro code theme.
 * - The code is always left to right (`dir="ltr"`); the header follows the page.
 */

const HighlighterContext = createContext<CodeHighlighter | null>(null)

/**
 * Gives every CodeBlock inside a highlighter. Applications use `CodeHighlighting` from
 * `@veljaos/ui/code`, which passes Shiki's; another highlighter can be given here.
 */
export function CodeHighlighterProvider({
  highlighter,
  children,
}: {
  highlighter: CodeHighlighter
  children: ReactNode
}) {
  return <HighlighterContext.Provider value={highlighter}>{children}</HighlighterContext.Provider>
}

export interface CodeBlockProps {
  /** The code, payload or output as text. A trailing newline is ignored. */
  code: string
  /**
   * The language ("json", "ts", "sql", "bash", "xml"…), highlighted inside `CodeHighlighting`;
   * "ansi" draws a terminal's colours; "diff" reads the lines as a diff; none: plain text.
   */
  language?: string
  /** The header's title: a file name or a label ("webhook.json", "Response 502"). */
  title?: ReactNode
  /** Names the code for assistive technology when there is no title. Default "Code". */
  label?: string
  /** Numbers the lines. */
  lineNumbers?: boolean
  /** The first line's number. Default 1. */
  startLine?: number
  /** Reads "+" and "-" at the start of the lines as added and removed lines. */
  diff?: boolean
  /** The numbers of the lines to point at (counted from `startLine`). */
  highlightLines?: readonly number[]
  /** Wraps long lines instead of scrolling sideways. Default false. */
  wrap?: boolean
  /** Shows "Wrap lines" in the header, so the user can switch it. */
  wrapToggle?: boolean
  /** The code's height limit in pixels: it scrolls inside. */
  maxHeight?: number
  /** 'md' (default) or 'sm' for tool output and logs in a row. */
  size?: 'md' | 'sm'
  /** 'danger' for a failure's output (an error response, a failed run's log). */
  tone?: 'neutral' | 'danger'
  /** Shows Copy. Default true. */
  copy?: boolean
  /** The application's actions in the header (Download). */
  actions?: ReactNode
  className?: string
}

/** The inline style of a highlighted token: its colour from the Liro code theme. */
function tokenStyle(token: CodeToken): CSSProperties | undefined {
  const style: CSSProperties = {}
  if (token.kind !== undefined) style.color = `var(--liro-code-${token.kind})`
  if (token.italic === true) style.fontStyle = 'italic'
  if (token.bold === true) style.fontWeight = 600
  if (token.underline === true) style.textDecorationLine = 'underline'
  return Object.keys(style).length === 0 ? undefined : style
}

/** The inline style of a run of terminal output, from the Liro code theme. */
function ansiStyle(span: AnsiSpan): CSSProperties | undefined {
  const { fg, bg, bold, dim, italic, underline } = span.style
  const style: CSSProperties = {}
  if (fg !== undefined) style.color = `var(--liro-code-ansi-${fg})`
  else if (dim === true) style.color = 'var(--liro-code-ansi-gray)'
  if (bg !== undefined) style.backgroundColor = `var(--liro-code-ansi-bg-${bg})`
  if (bold === true) style.fontWeight = 600
  if (italic === true) style.fontStyle = 'italic'
  if (underline === true) style.textDecorationLine = 'underline'
  return Object.keys(style).length === 0 ? undefined : style
}

interface Highlighted {
  language: string
  /** The line texts the tokens were made for. */
  texts: readonly string[]
  tokens: CodeToken[][] | null
}

/**
 * The tokens of the lines, from the highlighter in context. While new code streams in, the lines
 * already highlighted keep their tokens; only a changed line is plain until it is highlighted.
 */
function useHighlighting(lines: readonly CodeLine[], language: string | undefined) {
  const highlighter = useContext(HighlighterContext)
  const wanted = highlighter !== null && language !== undefined && !isPlainLanguage(language)
  const source = lines.map((line) => line.text).join('\n')
  const [result, setResult] = useState<Highlighted | null>(null)
  useEffect(() => {
    if (!wanted) return
    let live = true
    const texts = source.split('\n')
    highlighter(source, language).then(
      (tokens) => {
        if (live) setResult({ language, texts, tokens })
      },
      () => {
        if (live) setResult({ language, texts, tokens: null })
      },
    )
    return () => {
      live = false
    }
  }, [wanted, highlighter, source, language])
  const usable = wanted && result !== null && result.language === language ? result : null
  const ready = !wanted || (usable !== null && usable.texts.join('\n') === source)
  const tokensOf = (line: CodeLine): CodeToken[] | null => {
    if (usable?.tokens == null) return null
    if (usable.texts[line.index] !== line.text) return null
    return usable.tokens[line.index] ?? null
  }
  return { ready, tokensOf }
}

const LINE_BACKGROUND: Record<CodeLine['kind'], string> = {
  plain: '',
  added: 'bg-status-success-bg',
  removed: 'bg-status-danger-bg',
  meta: 'text-secondary',
}

/** Code, a payload, terminal output or a diff, with a title, Copy and line numbers. */
export function CodeBlock(props: CodeBlockProps) {
  const { messages } = useLiro()
  const titleId = useId()
  const codeId = useId()
  const ansi = isAnsiLanguage(props.language)
  const diff = props.diff === true || props.language?.trim().toLowerCase() === 'diff'
  const lines = codeLines(props.code, {
    diff,
    ...(props.startLine === undefined ? {} : { startLine: props.startLine }),
    ...(props.highlightLines === undefined ? {} : { highlightLines: props.highlightLines }),
  })
  const ansiRuns = ansi ? ansiLines(lines.map((line) => line.text)) : null
  // A diff's own tint marks its lines; "diff" itself is never sent to the highlighter.
  const highlightLanguage =
    props.language?.trim().toLowerCase() === 'diff' ? undefined : props.language
  const { ready, tokensOf } = useHighlighting(lines, highlightLanguage)
  const [wrapChoice, setWrapChoice] = useState<boolean | null>(null)
  const wrap = wrapChoice ?? props.wrap === true
  const [copied, setCopied] = useState<'copied' | 'failed' | null>(null)
  const copyTimer = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current)
    },
    [],
  )
  const small = props.size === 'sm'
  const danger = props.tone === 'danger'
  const showCopy = props.copy !== false
  const hasHeader =
    props.title !== undefined || props.actions !== undefined || props.wrapToggle === true
  const digits = props.lineNumbers === true ? lineNumberDigits(lines) : 0
  const marked = diff || lines.some((line) => line.highlighted)

  // A block that scrolls (a height limit, or long lines without wrapping) is a tab stop.
  const scroller = useRef<HTMLPreElement>(null)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const element = scroller.current
    if (element === null) return
    const measure = () => {
      setScrolls(
        element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const content = element.firstElementChild
    if (content !== null) observer.observe(content)
    return () => {
      observer.disconnect()
    }
  }, [])

  const onCopy = () => {
    const done = (state: 'copied' | 'failed') => {
      setCopied(state)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => {
        setCopied(null)
      }, 2000)
    }
    const text = codeCopyText(lines, { ansi })
    try {
      navigator.clipboard.writeText(text).then(
        () => {
          done('copied')
        },
        () => {
          done('failed')
        },
      )
    } catch {
      done('failed')
    }
  }

  const copyButton = showCopy && (
    <CompactIconButton
      icon={copied === 'copied' ? Check : Copy}
      label={copied === 'copied' ? messages['code.copied'] : messages['code.copy']}
      onClick={onCopy}
    />
  )

  const text = small ? 'text-xs' : 'text-sm'
  return (
    <div
      data-slot="code-block"
      data-ready={ready ? 'true' : 'false'}
      data-tone={danger ? 'danger' : undefined}
      className={cn(
        'flex min-w-0 flex-col overflow-clip rounded-md border border-solid bg-surface-sunken font-sans text-primary',
        danger ? 'border-status-danger-border' : 'border-default',
        props.className,
      )}
    >
      {hasHeader && (
        <div
          className={cn(
            'flex min-w-0 items-center gap-2 border-0 border-b border-solid',
            small ? 'min-h-8 ps-2 pe-0.5' : 'min-h-9 ps-3 pe-1',
            danger
              ? 'border-status-danger-border bg-status-danger-bg'
              : 'border-default bg-surface-sunken',
          )}
        >
          <span
            id={titleId}
            className={cn(
              'min-w-0 flex-1 text-xs font-medium',
              danger ? 'text-status-danger-fg' : 'text-secondary',
              TEXT_DIRECTION,
            )}
          >
            {props.title}
          </span>
          {props.actions}
          {props.wrapToggle === true && (
            <button
              type="button"
              aria-pressed={wrap}
              aria-label={messages['code.wrap']}
              title={messages['code.wrap']}
              onClick={() => {
                setWrapChoice(!wrap)
              }}
              className={cn(
                'm-0 box-border inline-flex size-7 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-md border-0 bg-transparent p-0 text-family-neutral-fg hover:bg-surface-hover aria-pressed:bg-surface-selected',
                FOCUS_RING,
              )}
            >
              <WrapText aria-hidden="true" className="size-4" />
            </button>
          )}
          {copyButton}
        </div>
      )}
      {/* Left to right, so the floating Copy stays over the end of the code's first line. */}
      <div dir="ltr" className="relative min-w-0">
        <pre
          ref={scroller}
          id={codeId}
          dir="ltr"
          role="region"
          {...(props.title !== undefined
            ? { 'aria-labelledby': titleId }
            : { 'aria-label': props.label ?? messages['code.label'] })}
          // A tab stop only while it scrolls, so the keyboard can scroll it (WCAG 2.1.1, axe
          // scrollable-region-focusable), as DataTable's area.
          {...(scrolls ? { tabIndex: 0 } : {})}
          style={props.maxHeight === undefined ? undefined : { maxHeight: props.maxHeight }}
          className={cn(
            'm-0 min-w-0 overflow-auto font-mono leading-normal',
            text,
            small ? 'py-1.5' : 'py-2.5',
            FOCUS_RING,
            'focus-visible:outline-offset-[-2px]',
          )}
        >
          <code className={cn('block font-mono', wrap ? 'min-w-0' : 'w-max min-w-full')}>
            {lines.map((line, at) => {
              const tokens = ansiRuns === null ? tokensOf(line) : null
              const runs = ansiRuns?.[at]
              return (
                <span
                  key={line.index}
                  data-line={line.kind}
                  data-highlighted={line.highlighted || undefined}
                  className={cn(
                    'flex',
                    LINE_BACKGROUND[line.kind],
                    line.highlighted && 'bg-status-warning-bg',
                  )}
                >
                  {marked && (
                    <span
                      aria-hidden={line.kind === 'plain' && !line.highlighted ? true : undefined}
                      className={cn(
                        'w-4 shrink-0 text-center select-none',
                        line.kind === 'added' && 'text-status-success-fg',
                        line.kind === 'removed' && 'text-status-danger-fg',
                        line.highlighted && 'shadow-[inset_2px_0_0_var(--liro-status-warning-fg)]',
                      )}
                    >
                      {line.kind === 'added' && (
                        <>
                          <span aria-hidden="true">+</span>
                          <span className="sr-only">{messages['code.added']} </span>
                        </>
                      )}
                      {line.kind === 'removed' && (
                        <>
                          <span aria-hidden="true">−</span>
                          <span className="sr-only">{messages['code.removed']} </span>
                        </>
                      )}
                      {line.highlighted && line.kind === 'plain' && (
                        <span className="sr-only">{messages['code.highlighted']} </span>
                      )}
                    </span>
                  )}
                  {props.lineNumbers === true && (
                    <span
                      aria-hidden="true"
                      style={{ minWidth: `${String(digits)}ch` }}
                      className={cn(
                        'box-content shrink-0 text-end text-tertiary tabular-nums select-none',
                        small ? 'ps-2' : 'ps-3',
                      )}
                    >
                      {line.number ?? ''}
                    </span>
                  )}
                  <span
                    className={cn(
                      'min-w-0 flex-1',
                      wrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre',
                      small ? 'px-2' : 'px-3',
                      // Room for the floating Copy on the first line.
                      at === 0 && showCopy && !hasHeader && 'pe-10',
                    )}
                  >
                    {runs !== undefined
                      ? runs.map((run, index) => (
                          <span key={index} style={ansiStyle(run)}>
                            {run.text}
                          </span>
                        ))
                      : tokens !== null
                        ? tokens.map((token, index) => (
                            <span key={index} style={tokenStyle(token)}>
                              {token.text}
                            </span>
                          ))
                        : line.text}
                    {'\n'}
                  </span>
                </span>
              )
            })}
          </code>
        </pre>
        {!hasHeader && copyButton !== false && (
          <div className="absolute end-1 top-1 rounded-md bg-surface-sunken">{copyButton}</div>
        )}
      </div>
      <p
        role="status"
        className={
          copied === 'failed'
            ? cn(
                'm-0 border-0 border-t border-solid border-default px-3 py-1.5 text-xs text-status-danger-fg',
                TEXT_DIRECTION,
              )
            : 'sr-only'
        }
      >
        {copied === 'copied'
          ? messages['code.copied']
          : copied === 'failed'
            ? messages['code.copyFailed']
            : ''}
      </p>
    </div>
  )
}

/**
 * A failure's raw response or log, shown on request (HealthList, Diagram's run): "Show details"
 * opens a small CodeBlock under the words of the failure. Not exported: the application passes
 * the text, the components show it.
 */
export function CodeDetails({
  code,
  language,
  label,
}: {
  code: string
  language?: string | undefined
  /** Names the code ("Last error details: SEF"). */
  label: string
}) {
  const { messages } = useLiro()
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpen(!open)
        }}
        className={cn(
          'm-0 box-border inline-flex min-h-6 cursor-pointer appearance-none items-center gap-1 rounded-sm border-0 bg-transparent p-0 font-sans text-xs text-link hover:underline',
          FOCUS_RING,
        )}
      >
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 transition-transform duration-(--liro-duration-fast) motion-reduce:transition-none',
            !open && '-rotate-90 rtl:rotate-90',
          )}
        />
        <span className={TEXT_DIRECTION}>
          {open ? messages['code.hideDetail'] : messages['code.showDetail']}
        </span>
      </button>
      <div id={id} hidden={!open} className="w-full min-w-0">
        {open && (
          <CodeBlock
            code={code}
            label={label}
            size="sm"
            wrap
            maxHeight={240}
            tone="danger"
            {...(language === undefined ? {} : { language })}
          />
        )}
      </div>
    </div>
  )
}
