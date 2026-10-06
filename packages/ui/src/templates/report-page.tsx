import { Play } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/button'
import { usePhone } from '../components/use-phone'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader } from './page-header'

/*
 * ReportPage (P4.6, the owner's decision, docs/decisions.md "Report page"): a report's
 * parameters, its result, and its export.
 * - The title (visible: no tab names a report) and the export at the end of the header (the
 *   application's button: exports run as jobs).
 * - The parameters in one row in a card (raised, border.default, radius lg, padding md), the
 *   fields bottom-aligned, "Run report" at the end of the row (primary). On phones they stack and
 *   the button takes the full width.
 * - After a run the parameters collapse into a one-line summary ("Period: 01.01.–30.09.2026. ·
 *   Account: 2040 · Edit") so the result gets the room; "Edit" opens them again. Controlled with
 *   `parametersOpen` / `onParametersOpenChange`, or left to the page: open until the first run.
 * - The result under them (a table, a chart, an EmptyState before the first run).
 */

/** One parameter in the collapsed summary: its name and its value as the application writes it. */
export interface ReportParameterSummary {
  key: string
  label: string
  value: string
}

export interface ReportPageProps {
  title: string
  /** A line under the title. */
  subtitle?: ReactNode
  /** The export (and other report actions) at the end of the header. */
  actions?: ReactNode
  /** The parameter fields. */
  parameters: ReactNode
  /** The parameters as one line, shown when they are collapsed. */
  summary: readonly ReportParameterSummary[]
  /** Runs the report with the current parameters. */
  onRun: () => void
  /** The report is running: the button shows it, and is disabled. */
  running?: boolean
  /** Controlled: whether the parameters are open. Default: open until the first run. */
  parametersOpen?: boolean
  onParametersOpenChange?: (open: boolean) => void
  /** The result. */
  children: ReactNode
  layout?: 'desktop' | 'phone'
  className?: string
}

/** A report: its parameters (collapsing to a summary after a run), its result and its export. */
export function ReportPage(props: ReportPageProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [innerOpen, setInnerOpen] = useState(true)
  const open = props.parametersOpen ?? innerOpen
  const setOpen = (next: boolean) => {
    setInnerOpen(next)
    props.onParametersOpenChange?.(next)
  }

  return (
    <div
      data-slot="report-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      <section
        aria-label={messages['report.parameters']}
        className="box-border rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans"
      >
        {open ? (
          <div className={cn('flex gap-3', phone ? 'flex-col' : 'flex-wrap items-end')}>
            {props.parameters}
            <div className={cn(phone ? 'flex flex-col' : 'ms-auto')}>
              <Button
                family="primary"
                icon={Play}
                emphasis="primary"
                label={messages['report.run']}
                {...(props.running === true ? { 'aria-busy': true, disabled: true } : {})}
                onClick={() => {
                  props.onRun()
                  setOpen(false)
                }}
              />
            </div>
          </div>
        ) : (
          <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-primary">
            {props.summary.map((item, index) => (
              <span key={item.key} className="inline-flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-tertiary">
                    ·
                  </span>
                )}
                <span className={TEXT_DIRECTION}>
                  <span className="text-secondary">{item.label}: </span>
                  <bdi className="tabular-nums">{item.value}</bdi>
                </span>
              </span>
            ))}
            <span aria-hidden="true" className="text-tertiary">
              ·
            </span>
            <button
              type="button"
              aria-expanded={false}
              onClick={() => {
                setOpen(true)
              }}
              className={cn(
                BUTTON_RESET,
                'cursor-pointer rounded-sm text-sm text-link underline-offset-2 hover:underline',
                FOCUS_RING,
              )}
            >
              {messages['report.edit']}
            </button>
          </p>
        )}
      </section>
      <div className="flex min-w-0 flex-col gap-4">{props.children}</div>
    </div>
  )
}
