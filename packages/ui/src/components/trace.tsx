import {
  ArrowUpRight,
  Bot,
  Brain,
  ChevronDown,
  Circle,
  CircleCheck,
  CircleDot,
  CircleX,
  FileText,
  Globe,
  Library,
  ListChecks,
  ListTodo,
  ListTree,
  SquareCheckBig,
} from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../primitives/collapsible'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { IconComponent } from './intents'
import {
  autoOpen,
  changedStep,
  isExternalLink,
  planProgress,
  queueGroups,
  statusOf,
  summaryStatus,
  traceStatuses,
  uniqueSources,
  type QueueItem,
  type TraceSource,
  type TraceStatus,
  type TraceStep,
} from './trace-logic'

/*
 * Trace (P5.93, the owner's item 49; shadcn/ui's Trace and AI Elements): the work an assistant
 * does, shown as calm rows. One row: an icon, a one-line title in the application's words, an
 * optional description (a count, a duration) and a status —
 * - done (the default): the title in the past tense, text.secondary, the step's icon;
 * - running: present tense; the title shimmers (with reduced motion: no shimmer, a spinner);
 * - pending: not started, text.tertiary and an empty circle;
 * - error: the failure in words, a danger CircleX.
 * The status is also said to assistive technology ("In progress", "Not started", "Failed").
 * A row with `detail` or `steps` opens and closes (a button with aria-expanded, a chevron at the
 * end); a row with `href` is a link (an external one opens in a new tab and says so); nested steps
 * hang under their row. Changes of status are announced politely, once each — never every token.
 *
 * On the row are built: Reasoning ("Thinking…" → "Thought for 5 s", open while thinking, closed
 * when done unless the user toggled it), ChainOfThought (a summary that opens into steps), Plan
 * ("2 of 5 done"), Queue (to do / completed), Task (steps as they happen, open while running),
 * Subagent (a handed-off run: its steps, duration and result) and Sources ("Used 4 records":
 * links through the provider's link component, duplicates removed). Each is one calm line until
 * opened. The words are the application's or provider messages; nothing here calls a model.
 */

const STATUS_ICON: Record<TraceStatus, IconComponent> = {
  done: CircleCheck,
  running: CircleDot,
  pending: Circle,
  error: CircleX,
}

const TITLE_COLOUR: Record<TraceStatus, string> = {
  done: 'text-secondary',
  running: 'text-primary',
  pending: 'text-tertiary',
  error: 'text-primary',
}

/** A status's words for assistive technology; none for done (the title says it). */
function useStatusWord(status: TraceStatus): string | null {
  const { messages } = useLiro()
  if (status === 'running') return messages['trace.running']
  if (status === 'pending') return messages['trace.pending']
  if (status === 'error') return messages['trace.failed']
  return null
}

/** The row's icon: the status's, or the step's own (an error always shows CircleX). */
function RowIcon({ status, icon }: { status: TraceStatus; icon: IconComponent | undefined }) {
  const Icon =
    status === 'error' || status === 'pending' ? STATUS_ICON[status] : (icon ?? STATUS_ICON[status])
  const colour =
    status === 'error'
      ? 'text-status-danger-fg'
      : status === 'pending'
        ? 'text-tertiary'
        : status === 'running'
          ? 'text-primary'
          : 'text-secondary'
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center"
    >
      <Icon className={cn('size-4', colour, status === 'running' && 'motion-reduce:hidden')} />
      {status === 'running' && (
        <span className="box-border hidden size-3.5 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent motion-reduce:inline-block motion-reduce:animate-none" />
      )}
    </span>
  )
}

interface RowProps {
  title: string
  description?: ReactNode
  status: TraceStatus
  icon?: IconComponent
  /** What opens under the row. */
  content?: ReactNode
  href?: string
  external?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** The row's line: icon, title (with its status for assistive technology) and description. */
function RowLine(props: RowProps & { trailing?: ReactNode; link?: boolean }) {
  const word = useStatusWord(props.status)
  return (
    <>
      <RowIcon status={props.status} icon={props.icon} />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
        <span
          className={cn(
            'min-w-0 break-words',
            props.link === true ? 'text-link group-hover:underline' : TITLE_COLOUR[props.status],
            props.status === 'running' && 'liro-shimmer',
            TEXT_DIRECTION,
          )}
        >
          {props.title}
          {word !== null && <span className="sr-only">, {word}</span>}
        </span>
        {props.description !== undefined && (
          <span className={cn('min-w-0 text-xs text-tertiary', TEXT_DIRECTION)}>
            {props.description}
          </span>
        )}
      </span>
      {props.trailing}
    </>
  )
}

const ROW =
  'flex min-h-7 w-full min-w-0 items-start gap-2 rounded-md px-1 py-1 text-start font-sans text-sm'

/** One row: static text, a link, or a button that opens what is under it. */
export function TraceRow(props: RowProps) {
  const { messages, linkComponent: Link } = useLiro()
  if (props.href !== undefined) {
    const external = isExternalLink({ href: props.href, external: props.external })
    const line = (
      <RowLine
        {...props}
        link
        trailing={
          external ? (
            <>
              <ArrowUpRight
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-secondary rtl:-scale-x-100"
              />
              <span className="sr-only"> {messages['trace.newTab']}</span>
            </>
          ) : undefined
        }
      />
    )
    const className = cn(ROW, FOCUS_RING, 'group no-underline hover:bg-surface-hover')
    return external ? (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={className}>
        {line}
      </a>
    ) : (
      <Link href={props.href} className={className}>
        {line}
      </Link>
    )
  }
  if (props.content === undefined) {
    return (
      <div className={ROW}>
        <RowLine {...props} />
      </div>
    )
  }
  return (
    <Collapsible
      {...(props.open === undefined ? {} : { open: props.open })}
      {...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen })}
      {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
      className="min-w-0"
    >
      <CollapsibleTrigger
        className={cn(BUTTON_RESET, FOCUS_RING, ROW, 'group cursor-pointer hover:bg-surface-hover')}
      >
        <RowLine
          {...props}
          trailing={
            <ChevronDown
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-secondary transition-transform duration-(--liro-duration-fast) group-data-[state=closed]:-rotate-90 motion-reduce:transition-none rtl:group-data-[state=closed]:rotate-90"
            />
          }
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ms-3 flex min-w-0 flex-col gap-2 border-0 border-s border-solid border-default ps-4 pt-1 pb-2">
          {props.content}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * A polite announcement when `key` changes: `text` is said once (adjusted while rendering, so
 * nothing is said on the first render and nothing twice).
 */
function useAnnouncement(key: string, text: string): string {
  const [seen, setSeen] = useState(key)
  const [said, setSaid] = useState('')
  if (key !== seen) {
    setSeen(key)
    setSaid(text)
  }
  return said
}

function Announcer({ text }: { text: string }) {
  return (
    <span role="status" className="sr-only">
      {text}
    </span>
  )
}

/** The steps under a row, as rows of their own. */
function StepRows({ steps, label }: { steps: readonly TraceStep[]; label?: string }) {
  return (
    <ul
      {...(label === undefined ? {} : { 'aria-label': label })}
      className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0"
    >
      {steps.map((step) => (
        <li key={step.id} className="min-w-0">
          <StepRow step={step} />
        </li>
      ))}
    </ul>
  )
}

function StepRow({ step }: { step: TraceStep }) {
  const nested = step.steps !== undefined && step.steps.length > 0
  const content =
    step.detail !== undefined || nested ? (
      <>
        {step.detail}
        {nested && <StepRows steps={step.steps ?? []} />}
      </>
    ) : undefined
  return (
    <TraceRow
      title={step.title}
      status={statusOf(step)}
      {...(step.description === undefined ? {} : { description: step.description })}
      {...(step.icon === undefined ? {} : { icon: step.icon })}
      {...(content === undefined ? {} : { content })}
      {...(step.href === undefined ? {} : { href: step.href })}
      {...(step.external === undefined ? {} : { external: step.external })}
      {...(step.defaultOpen === undefined ? {} : { defaultOpen: step.defaultOpen })}
    />
  )
}

/** Announces the last step whose status changed. */
function useStepAnnouncement(steps: readonly TraceStep[]): string {
  const statuses = traceStatuses(steps)
  const key = JSON.stringify(statuses)
  const [previous, setPrevious] = useState(statuses)
  const [said, setSaid] = useState('')
  if (JSON.stringify(previous) !== key) {
    const step = changedStep(previous, steps)
    setPrevious(statuses)
    if (step !== null) setSaid(step.title)
  }
  return said
}

export interface TraceProps {
  /** The steps, in order; each may hold steps of its own. */
  steps: readonly TraceStep[]
  /** Names the list for assistive technology ("Steps"). */
  label?: string
  className?: string
}

/** The steps an assistant takes, as rows: the generic pattern the others are built on. */
export function Trace(props: TraceProps) {
  const said = useStepAnnouncement(props.steps)
  return (
    <div data-slot="trace" className={cn('min-w-0 font-sans', props.className)}>
      <StepRows
        steps={props.steps}
        {...(props.label === undefined ? {} : { label: props.label })}
      />
      <Announcer text={said} />
    </div>
  )
}

/** Controlled or uncontrolled open state of a pattern's row. */
interface OpenProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

function openProps(props: OpenProps) {
  return {
    ...(props.open === undefined ? {} : { open: props.open }),
    ...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen }),
    ...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange }),
  }
}

/**
 * A row that opens by itself while the work runs and closes when it is done — unless the user
 * opened or closed it, which wins from then on.
 */
function useAutoOpen(status: TraceStatus, props: OpenProps) {
  const [toggled, setToggled] = useState<boolean | null>(props.defaultOpen ?? null)
  const open = props.open ?? autoOpen(status, toggled)
  return {
    open,
    onOpenChange: (next: boolean) => {
      setToggled(next)
      props.onOpenChange?.(next)
    },
  }
}

const WRAPPER = 'min-w-0 font-sans'

// ── Reasoning ─────────────────────────────────────────────────────────────────────────────────

export interface ReasoningProps extends OpenProps {
  /** 'running' while the assistant thinks, then 'done' (or 'error'). */
  status: Exclude<TraceStatus, 'pending'>
  /** The thinking as the application has it so far (text, paragraphs). */
  children?: ReactNode
  /** How long it thought, as the application writes it ("5 s"): "Thought for 5 s". */
  duration?: string
  /** Another title than "Thinking…" / "Thought for …" (an error's words). */
  title?: string
  className?: string
}

/** The assistant's thinking: "Thinking…" while it streams, "Thought for 5 s" once done. */
export function Reasoning(props: ReasoningProps) {
  const { messages } = useLiro()
  const { open, onOpenChange } = useAutoOpen(props.status, props)
  const title =
    props.title ??
    (props.status === 'running'
      ? messages['trace.thinking']
      : messages['trace.thought'](props.duration))
  const said = useAnnouncement(props.status, props.status === 'running' ? '' : title)
  return (
    <div data-slot="reasoning" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={title}
        status={props.status}
        icon={Brain}
        open={open}
        onOpenChange={onOpenChange}
        content={
          <div className={cn('flex min-w-0 flex-col gap-2 text-sm text-secondary', TEXT_DIRECTION)}>
            {props.children}
          </div>
        }
      />
      <Announcer text={said} />
    </div>
  )
}

// ── Chain of thought and Task ─────────────────────────────────────────────────────────────────

export interface ChainOfThoughtProps extends OpenProps {
  /** The summary line, in the application's words ("Checked 3 overdue invoices"). */
  title: string
  description?: ReactNode
  /** Default: from the steps (failed if one failed, running while one runs). */
  status?: TraceStatus
  steps: readonly TraceStep[]
  className?: string
}

/** A summary line that opens into the steps behind it. Closed by default. */
export function ChainOfThought(props: ChainOfThoughtProps) {
  const status = props.status ?? summaryStatus(props.steps)
  const said = useStepAnnouncement(props.steps)
  return (
    <div data-slot="chain-of-thought" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={props.title}
        status={status}
        icon={ListTree}
        {...(props.description === undefined ? {} : { description: props.description })}
        {...openProps(props)}
        content={<StepRows steps={props.steps} />}
      />
      <Announcer text={said} />
    </div>
  )
}

export interface TaskProps extends ChainOfThoughtProps {
  /** What the task produced, after its steps (a CodeBlock, a link, a sentence). */
  result?: ReactNode
}

/** The steps of one task as they happen: open while it runs, closed when done (unless toggled). */
export function Task(props: TaskProps) {
  const { messages } = useLiro()
  const status = props.status ?? summaryStatus(props.steps)
  const { open, onOpenChange } = useAutoOpen(status, props)
  const said = useStepAnnouncement(props.steps)
  return (
    <div data-slot="task" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={props.title}
        status={status}
        icon={SquareCheckBig}
        {...(props.description === undefined ? {} : { description: props.description })}
        open={open}
        onOpenChange={onOpenChange}
        content={
          <>
            <StepRows steps={props.steps} />
            {props.result !== undefined && (
              <Result label={messages['trace.result']}>{props.result}</Result>
            )}
          </>
        }
      />
      <Announcer text={said} />
    </div>
  )
}

function Result({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-1">
      <p id={id} className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
        {label}
      </p>
      <div className={cn('min-w-0 text-sm text-primary', TEXT_DIRECTION)}>{children}</div>
    </section>
  )
}

// ── Plan ──────────────────────────────────────────────────────────────────────────────────────

export interface PlanProps extends OpenProps {
  /** What the plan is for ("Close September"). */
  title: string
  /** The steps it plans, each with its status. */
  steps: readonly TraceStep[]
  /** Default: from the steps. */
  status?: TraceStatus
  className?: string
}

/** The steps the assistant plans to take and how far it has got: "2 of 5 done". */
export function Plan(props: PlanProps) {
  const { messages, format } = useLiro()
  const { done, total } = planProgress(props.steps)
  const progress = messages['trace.planProgress'](
    done,
    format.number(String(done)),
    total,
    format.number(String(total)),
  )
  const said = useAnnouncement(String(done), progress)
  return (
    <div data-slot="plan" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={props.title}
        description={progress}
        status={props.status ?? summaryStatus(props.steps)}
        icon={ListChecks}
        {...openProps(props)}
        content={<StepRows steps={props.steps} />}
      />
      <Announcer text={said} />
    </div>
  )
}

// ── Queue ─────────────────────────────────────────────────────────────────────────────────────

export interface QueueProps extends OpenProps {
  /** What the queue is ("Statement lines to match"). */
  title: string
  /** Default 'done' (a calm line); 'running' while the assistant works through it. */
  status?: TraceStatus
  items: readonly QueueItem[]
  className?: string
}

/** The assistant's to-do list: what is left and what is completed. */
export function Queue(props: QueueProps) {
  const { messages, format } = useLiro()
  const { toDo, completed } = queueGroups(props.items)
  const summary = messages['trace.queueSummary'](
    toDo.length,
    format.number(String(toDo.length)),
    completed.length,
    format.number(String(completed.length)),
  )
  const said = useAnnouncement(String(completed.length), summary)
  const group = (label: string, items: readonly QueueItem[], done: boolean) =>
    items.length > 0 && (
      <QueueGroup label={`${label} (${format.number(String(items.length))})`}>
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <TraceRow
              title={item.title}
              status={done ? 'done' : 'pending'}
              icon={done ? CircleCheck : Circle}
              {...(item.description === undefined ? {} : { description: item.description })}
              {...(item.detail === undefined ? {} : { content: item.detail })}
            />
          </li>
        ))}
      </QueueGroup>
    )
  return (
    <div data-slot="queue" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={props.title}
        description={summary}
        status={props.status ?? 'done'}
        icon={ListTodo}
        {...openProps(props)}
        content={
          <>
            {group(messages['trace.toDo'], toDo, false)}
            {group(messages['trace.completed'], completed, true)}
          </>
        }
      />
      <Announcer text={said} />
    </div>
  )
}

function QueueGroup({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p id={id} className={cn('m-0 px-1 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
        {label}
      </p>
      <ul aria-labelledby={id} className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0">
        {children}
      </ul>
    </div>
  )
}

// ── Subagent ──────────────────────────────────────────────────────────────────────────────────

export interface SubagentProps extends OpenProps {
  /** The agent the work was handed to ("Bank matcher"). */
  name: string
  /** What it does or did, in the application's words ("Matched 12 statement lines"). */
  title: string
  /** Default: from the steps; 'done' without steps. */
  status?: TraceStatus
  /** How long it ran, as the application writes it ("42 s"). */
  duration?: string
  steps?: readonly TraceStep[]
  /** What it handed back. */
  result?: ReactNode
  className?: string
}

/** A run handed to another agent: its steps, how long it took and what it handed back. */
export function Subagent(props: SubagentProps) {
  const { messages } = useLiro()
  const steps = props.steps ?? []
  const status = props.status ?? summaryStatus(steps)
  const said = useStepAnnouncement(steps)
  const statusSaid = useAnnouncement(
    status,
    status === 'done' || status === 'error' ? props.title : '',
  )
  return (
    <div data-slot="subagent" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={props.title}
        description={
          props.duration === undefined ? props.name : `${props.name} · ${props.duration}`
        }
        status={status}
        icon={Bot}
        {...openProps(props)}
        content={
          <>
            {steps.length > 0 && <StepRows steps={steps} />}
            {props.result !== undefined && (
              <Result label={messages['trace.result']}>{props.result}</Result>
            )}
          </>
        }
      />
      <Announcer text={statusSaid === '' ? said : statusSaid} />
    </div>
  )
}

// ── Sources ───────────────────────────────────────────────────────────────────────────────────

export interface SourcesProps extends OpenProps {
  /** The records and pages used; the same one twice is shown once. */
  items: readonly TraceSource[]
  /** Another title than "Used 4 records". */
  title?: string
  className?: string
}

/** The records the assistant used, as links: "Used 4 records". */
export function Sources(props: SourcesProps) {
  const { messages, format } = useLiro()
  const items = uniqueSources(props.items)
  const title =
    props.title ?? messages['trace.sourcesUsed'](items.length, format.number(String(items.length)))
  return (
    <div data-slot="sources" className={cn(WRAPPER, props.className)}>
      <TraceRow
        title={title}
        status="done"
        icon={Library}
        {...openProps(props)}
        content={
          <ul className="m-0 flex min-w-0 list-none flex-col gap-0.5 p-0">
            {items.map((item) => (
              <li key={item.id} className="min-w-0">
                <SourceRow item={item} />
              </li>
            ))}
          </ul>
        }
      />
    </div>
  )
}

function SourceRow({ item }: { item: TraceSource }) {
  const { messages, linkComponent: Link } = useLiro()
  const external = isExternalLink(item)
  const Icon = item.icon ?? (external ? Globe : FileText)
  const inner = (
    <>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-secondary" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn('min-w-0 break-words text-link group-hover:underline', TEXT_DIRECTION)}>
          {item.label}
          {external && <span className="sr-only"> {messages['trace.newTab']}</span>}
        </span>
        {item.detail !== undefined && (
          <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{item.detail}</span>
        )}
      </span>
      {external && (
        <ArrowUpRight
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-secondary rtl:-scale-x-100"
        />
      )}
    </>
  )
  const className = cn(ROW, FOCUS_RING, 'group no-underline hover:bg-surface-hover')
  return external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={item.href} className={className}>
      {inner}
    </Link>
  )
}
