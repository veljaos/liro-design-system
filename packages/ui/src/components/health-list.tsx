import { CircleAlert, CircleCheck, CircleHelp, CircleX, LoaderCircle, Wrench } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { healthFacts, type HealthFact, type HealthKind, type HealthTimes } from './health-logic'
import type { IconComponent } from './intents'
import { StatusBadge, type Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * HealthList (BUILD-PLAN P5.29): monitored things — connections to other systems, services,
 * queues, databases, servers, regions — each with its state, its figures, when it last worked and
 * when it last failed, and what can be done about it (Retry). Everything in it is the
 * application's: the state's words and tone, every figure, every time and every message. The list
 * judges nothing (it never turns a figure into a state) and counts nothing.
 *
 * - The state: a StatusBadge with the application's words ("Up", "Degraded", "Down", "In
 *   maintenance", "Unknown") and tone, and an icon from its `kind` (CircleCheck, CircleAlert,
 *   CircleX, Wrench, CircleHelp) — never colour alone (WCAG 1.4.1). The application may give
 *   another icon.
 * - Desktop: one card (raised, border.default, radius lg) with an optional title row, then a row
 *   per thing on one grid shared by every row (subgrid), so the columns line up: name (sm
 *   semibold) with its detail and the application's note (xs text.secondary); the state; the
 *   figures as label over value (xs text.secondary over sm medium, tabular); the last success and
 *   the last error with its message; the actions at the end. Rows are divided by border.subtle.
 * - Phones: one card per thing (P5.29, owner): the name and the state on top, the detail and note,
 *   then the figures and the times as label / value rows, the error's message in full, the actions
 *   at the bottom. The title stands above the cards (never cards in a card, P4.9).
 * - Actions are the application's (Retry, "Open log"): neutral secondary small buttons, each named
 *   with the thing ("Retry: SEF"); an action that returns a promise keeps its button busy until it
 *   settles, so it is not pressed twice.
 * - Loading: skeleton rows; nothing: the application's words (`emptyText`); a failed load: a danger
 *   Alert with the application's message.
 * - Which one: HealthList for things that are monitored continuously; StatusTimeline for one
 *   process's states in order; SetupChecklist for steps to do once; JobProgress for one long job.
 */

/** A thing's state, from the application. */
export interface HealthState {
  /** What it means, for the icon: up, degraded, down, maintenance, unknown. */
  kind: HealthKind
  /** The application's words: "Up", "Degraded", "Down", "In maintenance", "No report". */
  label: string
  /** The application's tone for this state (its status-to-tone map). */
  tone: Tone
  /** Another icon than the kind's. */
  icon?: IconComponent
}

/** One figure of a thing: "Uptime, 30 days" / "99,98 %". */
export interface HealthMetric {
  key: string
  label: string
  /** As the application writes it (through `format`, NumberText, MoneyText …). */
  value: ReactNode
}

/** An action on one thing. */
export interface HealthAction {
  key: string
  /** "Retry", "Open log". */
  label: string
  icon?: IconComponent
  /** A returned promise keeps the button busy until it settles. */
  onSelect: () => void | Promise<void>
}

/** One monitored thing, from the application. */
export interface HealthItem extends HealthTimes {
  id: string
  /** Its name: "SEF (e-invoicing)", "api-eu-1". */
  name: string
  /** A line under the name: what or where it is ("Production · Frankfurt"). */
  detail?: ReactNode
  state: HealthState
  /** The application's note on the current state ("Maintenance 15.10. 02:00–03:00"). */
  note?: ReactNode
  metrics?: readonly HealthMetric[]
  actions?: readonly HealthAction[]
}

export interface HealthListProps {
  items: readonly HealthItem[]
  /** Names the list for assistive technology, from the application ("Connections"). */
  label: string
  /** A heading above the rows (the card's title on a desktop, above the cards on a phone). */
  title?: string
  /** The title's level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** The application's actions for the whole list, at the end of the title row. */
  headerActions?: ReactNode
  /** Skeleton rows while the application loads the states. */
  loading?: boolean
  /** The application's words when there is nothing. Default `messages['health.empty']`. */
  emptyText?: string
  /** The application could not load the states: its message. */
  error?: string
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const KIND_ICONS: Record<HealthKind, IconComponent> = {
  up: CircleCheck,
  degraded: CircleAlert,
  down: CircleX,
  maintenance: Wrench,
  unknown: CircleHelp,
}

/** The icon of a state: the application's, else its kind's. */
export function healthIcon(state: HealthState): IconComponent {
  return state.icon ?? KIND_ICONS[state.kind]
}

/** Mantine Button 'xs' (30px), neutral "default", as SessionList's. */
const SMALL = 'min-h-control-sm gap-2 px-3.5 text-xs'

const CARD = 'rounded-lg border border-solid border-default bg-surface-raised'

/** The actions of one thing, each busy while its promise runs. */
function Actions({ item, phone }: { item: HealthItem; phone: boolean }) {
  const { messages } = useLiro()
  const [busy, setBusy] = useState<readonly string[]>([])
  const actions = item.actions ?? []
  if (actions.length === 0) return null
  return (
    <div className={cn('flex flex-wrap items-center gap-2', !phone && 'justify-end')}>
      {actions.map((action) => {
        const pending = busy.includes(action.key)
        const Icon = pending ? LoaderCircle : action.icon
        return (
          <ButtonPrimitive
            key={action.key}
            family="neutral"
            emphasis="secondary"
            aria-label={messages['health.actionNamed'](action.label, item.name)}
            aria-disabled={pending || undefined}
            aria-busy={pending || undefined}
            onClick={() => {
              if (pending) return
              const result = action.onSelect()
              if (!(result instanceof Promise)) return
              setBusy((list) => [...list, action.key])
              const done = () => {
                setBusy((list) => list.filter((each) => each !== action.key))
              }
              result.then(done, done)
            }}
            className={SMALL}
          >
            {Icon !== undefined && (
              <Icon
                aria-hidden="true"
                className={cn(
                  'size-3.5 shrink-0',
                  pending && 'animate-spin motion-reduce:animate-none',
                )}
              />
            )}
            <span className={TEXT_DIRECTION}>{action.label}</span>
          </ButtonPrimitive>
        )
      })}
    </div>
  )
}

function StateBadge({ state }: { state: HealthState }) {
  return (
    <span data-kind={state.kind} className="inline-flex">
      <StatusBadge label={state.label} tone={state.tone} icon={healthIcon(state)} />
    </span>
  )
}

/** The name, the detail and the note. */
function Name({ item }: { item: HealthItem }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className={cn('text-sm font-semibold break-words text-primary', TEXT_DIRECTION)}>
        {item.name}
      </span>
      {item.detail !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.detail}</span>
      )}
      {item.note !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.note}</span>
      )}
    </div>
  )
}

/** A fact's value: times are isolated (they start with a digit), messages take their direction. */
function FactValue({ fact }: { fact: HealthFact }) {
  if (fact.key === 'errorMessage') {
    return <span className={TEXT_DIRECTION}>{fact.value}</span>
  }
  return (
    <span dir="auto" className={cn('tabular-nums', TEXT_ISOLATE)}>
      {fact.value}
    </span>
  )
}

/** One thing as a row of the shared grid (desktop). */
function Row({ item }: { item: HealthItem }) {
  const { messages, format } = useLiro()
  const facts = healthFacts(item, format, messages)
  const metrics = item.metrics ?? []
  return (
    <li
      data-slot="health-item"
      data-kind={item.state.kind}
      className="col-span-full grid grid-cols-subgrid items-start gap-x-6 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
    >
      <Name item={item} />
      <div>
        <StateBadge state={item.state} />
      </div>
      <dl className="m-0 flex min-w-0 flex-wrap gap-x-6 gap-y-2">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex min-w-0 flex-col">
            <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{metric.label}</dt>
            <dd className="m-0 text-sm font-medium text-primary tabular-nums">
              <span dir="auto" className={TEXT_ISOLATE}>
                {metric.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <dl className="m-0 flex min-w-0 flex-col gap-1 text-xs">
        {facts
          .filter((fact) => fact.key !== 'errorMessage')
          .map((fact) => (
            <div key={fact.key} className="flex min-w-0 flex-wrap gap-x-1.5">
              <dt className={cn('text-secondary', TEXT_DIRECTION)}>{fact.label}</dt>
              <dd className="m-0 text-primary">
                <FactValue fact={fact} />
              </dd>
            </div>
          ))}
        {facts
          .filter((fact) => fact.key === 'errorMessage')
          .map((fact) => (
            <div key={fact.key} className="min-w-0">
              <dt className="sr-only">{fact.label}</dt>
              <dd className="m-0 break-words text-primary">
                <FactValue fact={fact} />
              </dd>
            </div>
          ))}
      </dl>
      <Actions item={item} phone={false} />
    </li>
  )
}

/** One thing as a card (phones). */
function ItemCard({ item }: { item: HealthItem }) {
  const { messages, format } = useLiro()
  const facts = healthFacts(item, format, messages)
  const metrics = item.metrics ?? []
  const lines: { key: string; label: string; value: ReactNode; full?: boolean }[] = [
    ...metrics.map((metric) => ({ key: metric.key, label: metric.label, value: metric.value })),
    ...facts.map((fact) => ({
      key: fact.key,
      label: fact.label,
      value: <FactValue fact={fact} />,
      full: fact.key === 'errorMessage',
    })),
  ]
  return (
    <li
      data-slot="health-item"
      data-kind={item.state.kind}
      className={cn(CARD, 'flex flex-col gap-3 p-4')}
    >
      <div className="flex items-start justify-between gap-3">
        <Name item={item} />
        <StateBadge state={item.state} />
      </div>
      {lines.length > 0 && (
        <dl className="m-0 flex flex-col">
          {lines.map((line) => (
            <div
              key={line.key}
              className={cn(
                'flex gap-x-4 border-0 border-t border-solid border-subtle py-1.5 text-sm',
                line.full === true ? 'flex-col' : 'items-baseline justify-between',
              )}
            >
              <dt className={cn('text-secondary', TEXT_DIRECTION)}>{line.label}</dt>
              <dd
                className={cn(
                  'm-0 min-w-0 font-medium break-words text-primary',
                  line.full !== true && 'text-end tabular-nums',
                )}
              >
                {line.full === true ? (
                  line.value
                ) : (
                  <span dir="auto" className={TEXT_ISOLATE}>
                    {line.value}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <Actions item={item} phone />
    </li>
  )
}

function Skeletons({ phone }: { phone: boolean }) {
  return (
    <>
      {[0, 1, 2].map((index) => (
        <li
          key={index}
          className={cn(
            phone
              ? cn(CARD, 'flex flex-col gap-2 p-4')
              : 'col-span-full flex items-center gap-6 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0',
          )}
        >
          <Skeleton className="h-3.5 w-40 max-w-full" />
          <Skeleton className="h-3.5 w-20 max-w-full" />
          <Skeleton className="h-3.5 w-56 max-w-full" />
        </li>
      ))}
    </>
  )
}

/** Monitored things: their state, figures, last success and last error, and what to do. */
export function HealthList(props: HealthListProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const titleId = useId()
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2' | 'h3' | 'h4'
  const loading = props.loading === true
  const header =
    props.title !== undefined || props.headerActions !== undefined ? (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
          !phone && 'border-0 border-b border-solid border-default px-4 py-3',
        )}
      >
        {props.title !== undefined && (
          <Heading
            id={titleId}
            className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}
          >
            {props.title}
          </Heading>
        )}
        {props.headerActions !== undefined && (
          <div className="ms-auto flex flex-wrap items-center gap-2">{props.headerActions}</div>
        )}
      </div>
    ) : null

  let body: ReactNode
  if (props.error !== undefined) {
    body = (
      <div className={phone ? undefined : 'p-4'}>
        <Alert tone="danger" title={props.error} />
      </div>
    )
  } else if (!loading && props.items.length === 0) {
    body = (
      <p className={cn('m-0 text-sm text-secondary', !phone && 'px-4 py-3', TEXT_DIRECTION)}>
        {props.emptyText ?? messages['health.empty']}
      </p>
    )
  } else {
    body = (
      <ul
        aria-label={props.label}
        aria-busy={loading || undefined}
        className={cn(
          'm-0 list-none p-0',
          phone
            ? 'flex flex-col gap-3'
            : // One grid for every row: the columns line up (each row is a subgrid of it).
              'grid grid-cols-[minmax(10rem,1.3fr)_minmax(6rem,auto)_minmax(0,1.5fr)_minmax(0,1.6fr)_auto] gap-x-6',
        )}
      >
        {loading ? (
          <Skeletons phone={phone} />
        ) : (
          props.items.map((item) =>
            phone ? <ItemCard key={item.id} item={item} /> : <Row key={item.id} item={item} />,
          )
        )}
      </ul>
    )
  }

  return (
    <section
      data-slot="health-list"
      {...(props.title === undefined ? {} : { 'aria-labelledby': titleId })}
      className={cn(
        'flex min-w-0 flex-col font-sans',
        phone ? 'gap-3' : cn(CARD, 'overflow-x-auto'),
        props.className,
      )}
    >
      {header}
      {body}
    </section>
  )
}
