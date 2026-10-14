import { CircleStop, CornerDownRight, Flag, Lock, RotateCw, Square } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { AgentMark } from './agent-mark'
import { Alert } from './alert'
import {
  answerBusy,
  canReport,
  followUpsShown,
  shownBlocks,
  type AnswerBlock,
  type AnswerSourcesBlock,
  type AnswerState,
  type AnswerTableBlock,
} from './assistant-logic'
import { Button } from './button'
import { ReasonConfirmDialog, type ConfirmAnswer, type ConfirmReason } from './confirm-dialog'
import { Spinner } from './spinner'
import { usePhone } from './use-phone'

/*
 * AssistantAnswer (BUILD-PLAN P5.34): one answer of an assistant, drawn from the application's
 * data. Nothing here calls a model: the answer is a list of blocks — headings, paragraphs, short
 * lists, small tables, charts (a slot) and sources — and a state.
 * - **Labelled as AI-generated**: over the answer the assistant's name (`author`) and AgentMark
 *   with the words "AI-generated" (Bot icon, text.secondary; never blue, D17).
 * - **Tables** are real tables (caption, column headers, numbers at the end in tabular digits, a
 *   total row the application computed). Where the width is short — the side panel (`size`
 *   'panel') or a phone — each row is a small card: the first cell as its title, the others as
 *   label / value lines, so nothing scrolls sideways (D19). A row's `href` makes its first cell a
 *   link to the record it came from.
 * - **Charts** are a slot (`kind: 'chart'`): the application passes one from
 *   `@veljaos/ui/charts`, which keeps its own title, legend and "Show as table"; the main entry
 *   never loads the charts.
 * - **Sources**: the records the answer came from, a numbered list of links with a detail line.
 * - **States**: 'thinking' (a spinner and "Thinking…", a polite status); 'streaming' (the blocks
 *   so far, "Writing…" and Stop — the application renders the text it has; nothing here runs a
 *   timer); 'done'; 'stopped' (the blocks written, "Stopped. The answer may be incomplete." and
 *   Try again); 'error' (the application's words in a danger Alert with Try again, a neutral
 *   secondary button, D23); 'noAccess' (the application's words — "You do not have permission to
 *   see salaries." — in a neutral Alert with a lock: not a failure). While thinking or streaming
 *   the answer is `aria-busy`, so assistive technology reads it once it is written.
 * - **Follow-ups** under a complete answer: the application's questions as buttons; a press
 *   reports the question (`onFollowUp`).
 * - **Proposed actions** (`actions`): ProposedAction cards, after the blocks.
 * - **Report a wrong answer** under a complete or stopped answer: a small button opens
 *   ReasonConfirmDialog (the application's `reportReasons`, or a required text), titled by the
 *   action with the question as its subject (D22); `onReport` receives the reason. Then "Thank
 *   you. Your report was sent." (or controlled with `reported`).
 * Every word is the application's or a provider message; texts take their direction from their
 * content (D15).
 */

export interface AssistantAnswerProps {
  /** The answer's blocks, in order (the text so far while streaming). */
  blocks?: readonly AnswerBlock[]
  /** Default 'done'. */
  state?: AnswerState
  /** The words for 'error' and 'noAccess', from the application. */
  reason?: ReactNode
  /** The assistant's name over the answer ("Liro Assistant"). */
  author?: ReactNode
  /** The question answered: the subject of the report dialog. */
  question?: ReactNode
  /** Questions to ask next, under a complete answer. */
  followUps?: readonly string[]
  onFollowUp?: (question: string) => void
  /** ProposedAction cards, after the blocks. */
  actions?: ReactNode
  /** Stops the answer being written: shows Stop while streaming. */
  onStop?: () => void
  /** Asks again: Try again after an error or a stop. */
  onRetry?: () => void
  /** Reports a wrong answer with its reason: shows "Report a wrong answer". */
  onReport?: (answer: ConfirmAnswer) => void | Promise<void>
  /** The reasons to choose from when reporting; without them the text is required. */
  reportReasons?: readonly ConfirmReason[]
  /** The report was sent (controlled). */
  reported?: boolean
  /**
   * 'panel' (default): the side panel's narrow column — tables as cards. 'page': the "Ask" page's
   * reading column — larger text, tables as tables (cards on a phone).
   */
  size?: 'panel' | 'page'
  /** The level of the answer's headings. Default 3 ('panel'), 2 ('page'). */
  headingLevel?: 2 | 3 | 4
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

type Level = 2 | 3 | 4 | 5

function Heading({
  level,
  className,
  children,
}: {
  level: Level
  className: string
  children: ReactNode
}) {
  const Tag = `h${String(level)}` as 'h2'
  return <Tag className={className}>{children}</Tag>
}

/** A row's first cell, a link when the row names its record. */
function FirstCell({ href, children }: { href: string | undefined; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  if (href === undefined) return <>{children}</>
  return (
    <Link
      href={href}
      className={cn('rounded-sm text-link no-underline hover:underline', FOCUS_RING)}
    >
      {children}
    </Link>
  )
}

function cellClass(numeric: boolean | undefined) {
  return numeric === true
    ? cn('text-end tabular-nums whitespace-nowrap', TEXT_ISOLATE)
    : cn('text-start break-words', TEXT_DIRECTION)
}

/** A small table: a real table where there is room, cards where there is not. */
function AnswerTable({
  block,
  compact,
  level,
}: {
  block: AnswerTableBlock
  compact: boolean
  level: Level
}) {
  const captionId = useId()
  const [first, ...rest] = block.columns
  if (first === undefined) return null
  if (compact) {
    const rows = [
      ...block.rows.map((row) => ({ id: row.id, cells: row.cells, href: row.href, total: false })),
      ...(block.total === undefined
        ? []
        : [{ id: '__total', cells: block.total, href: undefined, total: true }]),
    ]
    return (
      <div data-slot="answer-table" className="flex min-w-0 flex-col gap-2">
        <Heading
          level={level}
          className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
        >
          <span id={captionId}>{block.caption}</span>
        </Heading>
        <ul aria-labelledby={captionId} className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                'box-border flex min-w-0 flex-col gap-1 rounded-md border border-solid p-3',
                row.total ? 'border-strong' : 'border-default',
              )}
            >
              <p
                className={cn('m-0 text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}
              >
                <FirstCell href={row.href}>{row.cells[first.key]}</FirstCell>
              </p>
              {rest.length > 0 && (
                <dl className="m-0 flex flex-col gap-0.5">
                  {rest.map((column) => (
                    <div key={column.key} className="flex min-w-0 items-baseline gap-3 text-sm">
                      <dt className={cn('min-w-0 flex-1 text-secondary', TEXT_DIRECTION)}>
                        {column.label}
                      </dt>
                      <dd
                        className={cn(
                          'm-0 min-w-0 text-primary',
                          row.total && 'font-semibold',
                          cellClass(column.numeric),
                        )}
                      >
                        {row.cells[column.key] ?? '—'}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  const head = 'border-0 border-b border-solid border-default px-2 py-2 text-xs font-medium'
  return (
    <div data-slot="answer-table" className="min-w-0">
      <table className="w-full border-collapse font-sans text-sm text-primary">
        <caption
          className={cn('pb-2 text-start text-sm font-semibold text-primary', TEXT_DIRECTION)}
        >
          {block.caption}
        </caption>
        <thead>
          <tr>
            {block.columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(head, 'text-secondary', cellClass(column.numeric))}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.id} className="border-0 border-b border-solid border-subtle">
              {block.columns.map((column, index) => (
                <td
                  key={column.key}
                  className={cn('px-2 py-2 align-top', cellClass(column.numeric))}
                >
                  {index === 0 ? (
                    <FirstCell href={row.href}>{row.cells[column.key]}</FirstCell>
                  ) : (
                    (row.cells[column.key] ?? '—')
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {block.total !== undefined && (
          <tfoot>
            <tr className="border-0 border-t border-solid border-strong">
              {block.columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-2 py-2 font-semibold', cellClass(column.numeric))}
                >
                  {block.total?.[column.key]}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

function AnswerSources({ block, level }: { block: AnswerSourcesBlock; level: Level }) {
  const { messages, linkComponent: Link } = useLiro()
  const titleId = useId()
  return (
    <div data-slot="answer-sources" className="flex min-w-0 flex-col gap-1.5">
      <Heading
        level={level}
        className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}
      >
        <span id={titleId}>{block.title ?? messages['assistant.sources']}</span>
      </Heading>
      <ol
        aria-labelledby={titleId}
        className="m-0 flex list-decimal flex-col gap-1 ps-5 text-sm text-secondary"
      >
        {block.items.map((item) => (
          <li key={item.id} className="min-w-0 ps-1">
            <span className="flex min-w-0 flex-col">
              <Link
                href={item.href}
                className={cn(
                  // At least 24px high, so two sources in a row are targets of their own.
                  'inline-flex min-h-6 items-center self-start rounded-sm text-link no-underline hover:underline',
                  FOCUS_RING,
                  TEXT_DIRECTION,
                )}
              >
                {item.label}
              </Link>
              {item.detail !== undefined && (
                <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{item.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** The answer's blocks. */
function Blocks({
  blocks,
  compact,
  page,
  level,
}: {
  blocks: readonly AnswerBlock[]
  compact: boolean
  page: boolean
  level: Level
}) {
  const text = page ? 'text-md' : 'text-sm'
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${String(index)}`
        switch (block.kind) {
          case 'heading':
            return (
              <Heading
                key={key}
                level={level}
                className={cn(
                  'm-0 font-semibold text-primary',
                  page ? 'text-h3' : 'text-sm',
                  TEXT_DIRECTION,
                )}
              >
                {block.text}
              </Heading>
            )
          case 'text':
            return (
              <p key={key} className={cn('m-0 break-words text-primary', text, TEXT_DIRECTION)}>
                {block.text}
              </p>
            )
          case 'list': {
            const List = block.ordered === true ? 'ol' : 'ul'
            return (
              <List
                key={key}
                className={cn(
                  'm-0 flex flex-col gap-1 ps-6 text-primary',
                  block.ordered === true ? 'list-decimal' : 'list-disc',
                  text,
                )}
              >
                {block.items.map((item, at) => (
                  <li key={at} className={cn('break-words', TEXT_DIRECTION)}>
                    {item}
                  </li>
                ))}
              </List>
            )
          }
          case 'table':
            return <AnswerTable key={key} block={block} compact={compact} level={level} />
          case 'chart':
            return (
              <div key={key} data-slot="answer-chart" className="min-w-0">
                {block.chart}
              </div>
            )
          case 'sources':
            return <AnswerSources key={key} block={block} level={level} />
          default:
            return null
        }
      })}
    </>
  )
}

/** One answer of an assistant: its blocks, its state, follow-ups, actions and the report. */
export function AssistantAnswer(props: AssistantAnswerProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const state = props.state ?? 'done'
  const page = props.size === 'page'
  const compact = !page || phone
  const level: Level = props.headingLevel ?? (page ? 2 : 3)
  const blocks = shownBlocks(state, props.blocks ?? [])
  const followUps = followUpsShown(state, props.followUps)
  const [reporting, setReporting] = useState(false)
  const [innerReported, setInnerReported] = useState(false)
  const reported = props.reported ?? innerReported
  const followUpsId = useId()
  const onReport = props.onReport

  return (
    <article
      data-slot="assistant-answer"
      data-state={state}
      aria-busy={answerBusy(state) || undefined}
      className={cn(
        'flex min-w-0 flex-col font-sans text-primary',
        page ? 'gap-4' : 'gap-3',
        props.className,
      )}
    >
      <p className="m-0 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {props.author !== undefined && (
          <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {props.author}
          </span>
        )}
        <AgentMark showLabel label={messages['assistant.generated']} />
      </p>
      {state === 'thinking' && (
        <Spinner size="sm">
          <span className="text-sm text-secondary">{messages['assistant.thinking']}</span>
        </Spinner>
      )}
      {state === 'error' && (
        <Alert
          tone="danger"
          {...(props.onRetry === undefined
            ? {}
            : {
                actions: (
                  <Button
                    family="neutral"
                    icon={RotateCw}
                    label={messages['assistant.retry']}
                    onClick={props.onRetry}
                  />
                ),
              })}
        >
          {props.reason}
        </Alert>
      )}
      {state === 'noAccess' && (
        <Alert tone="neutral" icon={Lock}>
          {props.reason}
        </Alert>
      )}
      <Blocks blocks={blocks} compact={compact} page={page} level={level} />
      {state === 'streaming' && (
        <div className="flex flex-wrap items-center gap-3">
          <Spinner size="sm">
            <span className="text-xs text-secondary">{messages['assistant.writing']}</span>
          </Spinner>
          {props.onStop !== undefined && (
            <Button
              family="neutral"
              icon={Square}
              label={messages['assistant.stop']}
              onClick={props.onStop}
            />
          )}
        </div>
      )}
      {state === 'stopped' && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="m-0 flex min-w-0 items-start gap-2 text-sm text-secondary">
            <CircleStop aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className={TEXT_DIRECTION}>{messages['assistant.stopped']}</span>
          </p>
          {props.onRetry !== undefined && (
            <Button
              family="neutral"
              icon={RotateCw}
              label={messages['assistant.retry']}
              onClick={props.onRetry}
            />
          )}
        </div>
      )}
      {props.actions !== undefined && <div className="flex flex-col gap-3">{props.actions}</div>}
      {followUps.length > 0 && (
        <div className="flex min-w-0 flex-col gap-1.5">
          <p
            id={followUpsId}
            className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}
          >
            {messages['assistant.followUps']}
          </p>
          <ul aria-labelledby={followUpsId} className="m-0 flex list-none flex-col gap-1.5 p-0">
            {followUps.map((question) => (
              <li key={question} className="flex min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    props.onFollowUp?.(question)
                  }}
                  className={cn(
                    BUTTON_RESET,
                    FOCUS_RING,
                    'flex min-h-8 min-w-0 cursor-pointer items-start gap-2 rounded-md border border-solid border-default bg-surface-raised px-3 py-1.5 text-start text-sm text-primary hover:bg-surface-hover',
                  )}
                >
                  <CornerDownRight
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-secondary rtl:-scale-x-100"
                  />
                  <span dir="auto" className="min-w-0 break-words text-match-parent">
                    {question}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {onReport !== undefined &&
        canReport(state) &&
        (reported ? (
          <p role="status" className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['assistant.reported']}
          </p>
        ) : (
          <div className="flex">
            <button
              type="button"
              onClick={() => {
                setReporting(true)
              }}
              className={cn(
                BUTTON_RESET,
                FOCUS_RING,
                'flex min-h-6 cursor-pointer items-center gap-1.5 rounded-sm text-xs text-secondary hover:text-primary hover:underline',
              )}
            >
              <Flag aria-hidden="true" className="size-3.5 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['assistant.report']}</span>
            </button>
            <ReasonConfirmDialog
              open={reporting}
              onOpenChange={setReporting}
              family="primary"
              actionIcon={Flag}
              title={messages['assistant.reportTitle']}
              {...(props.question === undefined ? {} : { subject: props.question })}
              message={messages['assistant.reportMessage']}
              confirmLabel={messages['assistant.reportSend']}
              {...(props.reportReasons === undefined ? {} : { reasons: props.reportReasons })}
              onConfirm={async (answer) => {
                await onReport(answer)
                setInnerReported(true)
              }}
            />
          </div>
        ))}
    </article>
  )
}
