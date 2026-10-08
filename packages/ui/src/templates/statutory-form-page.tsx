import { CircleCheck, CircleX, PencilLine, TriangleAlert, Undo2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Alert } from '../components/alert'
import { Button, CompactIconButton } from '../components/button'
import { SectionCard } from '../components/cards'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { Drawer } from '../components/dialog'
import { DateText, MoneyText } from '../components/display-text'
import { LifecycleBar, type LifecycleStep } from '../components/lifecycle-bar'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'
import {
  fieldElementId,
  fieldRules,
  ruleCounts,
  rulesTone,
  type StatutoryRule,
} from './register-logic'

/*
 * StatutoryFormPage (BUILD-PLAN P5.20): a page that mirrors an official form (a VAT return, a
 * statistical report) with its own section and field numbers ("3.2", "8a.1"). Field definitions,
 * numbering, rules and texts come from the Core as data; the page computes nothing.
 * - **Status** draft → checked → submitted: a LifecycleBar above the header (the document's dots
 *   and lines, P4.5 — reused, not a second stepper; the steps and their names are the Core's).
 * - **Sections** as SectionCards (h2), each a table: No. | Description | the previous period
 *   (`previousLabel`, the comparison column) | this period (`currentLabel`); on phones each field
 *   is a row of a flat list with the two periods under its name.
 * - **Drill-down:** an amount with `sources` is a button (the link colour, dotted underline) that
 *   opens a Drawer from the end listing its source documents — each a link with its kind, number,
 *   state, date and amount (P4.9 rule 7) — and the field's value under them.
 * - **Manual overrides:** a field with `editor` has a 28px pencil ("Change 3.2") that turns the
 *   amount into the application's field with Cancel and Save; an overridden value carries a
 *   neutral "Changed manually" badge, who and when, the computed value, and "Use computed value"
 *   (the way back). The Core keeps both values.
 * - **Rule checks** ("5.4 must equal 5.1 + 5.2 + 5.3", results from the Core): under each field
 *   they concern (failed in danger, warnings in warning, with icon and words), and in a summary
 *   Alert above the sections with the counts and a "Go to 5.4" button per open check.
 * - `readOnly` (a submitted form): no pencils and no way back; the drill-down stays.
 * Print and export are the application's actions in the header (the main one last).
 */

/** A document behind an amount. */
export interface SourceDocument {
  key: string
  /** The kind ("Invoice", "Credit note"). */
  type: string
  /** Its number ("F-2026-0412"). */
  number: string
  /** Its page, through the provider's linkComponent. */
  href: string
  /** Its state: a StatusBadge. */
  status?: ReactNode
  /** Its date, YYYY-MM-DD. */
  date?: string
  /** Its share of the field's amount, a decimal string. */
  amount: string
}

/** A value typed over the computed one: who and when (the application's words), and the computed value. */
export interface StatutoryOverride {
  /** The value the books give, a decimal string. */
  computed: string
  /** Who changed it ("Ivana Stojanović"). */
  by: string
  /** When, as the application writes it ("05.10.2026. 14:12"). */
  at: string
}

/** One numbered field of the form. */
export interface StatutoryField {
  id: string
  /** The form's own number ("3.2", "8a.1"). */
  number: string
  /** The form's text for the field. */
  label: string
  /** This period's value, a decimal string; null when empty. */
  value: string | null
  /** The previous period's value (the comparison column). */
  previous?: string | null
  /** Default: the page's `currency`. */
  currency?: string
  decimals?: number
  /** The documents behind the amount: the amount opens them. */
  sources?: readonly SourceDocument[]
  /** The value was typed over the computed one. */
  override?: StatutoryOverride
  /** The application's field to type a value over the computed one (MoneyField, its label hidden). */
  editor?: ReactNode
  /** A result line of the form ("Tax payable"): drawn semibold. */
  total?: boolean
}

/** One section of the form. */
export interface StatutorySection {
  key: string
  /** Its title as the form writes it ("3. Turnover and VAT at the general rate"). */
  title: string
  description?: string
  fields: readonly StatutoryField[]
}

export interface StatutoryFormPageProps {
  /** The form's name and period: the page's visible h1 ("VAT return, September 2026"). */
  title: string
  subtitle?: ReactNode
  back?: PageBack
  /** After the title: a StatusBadge. */
  status?: ReactNode
  /** Print, Export, Check, Submit — the main one last. */
  actions?: ReactNode
  /** The form's status steps (draft → checked → submitted), above the header. */
  lifecycle?: { steps: readonly LifecycleStep[]; current: number; label: string }
  sections: readonly StatutorySection[]
  /** The rule checks and their results, from the Core. */
  rules?: readonly StatutoryRule[]
  /** The amounts' currency (a field may have its own). */
  currency: string
  /** The column of this period ("September 2026"). */
  currentLabel: string
  /** The comparison column ("August 2026"); without it there is none. */
  previousLabel?: string
  /** The field being changed (its editor shown); controlled with `onEditingChange`. */
  editing?: string | null
  onEditingChange?: (field: string | null) => void
  /** Saves the value typed in a field's editor; a promise keeps the editor until it settles. */
  onSaveOverride?: (field: string) => void | Promise<void>
  /** Goes back to the computed value of an overridden field. */
  onUseComputed?: (field: string) => void
  /** A submitted form: no changes, no way back; the drill-down stays. */
  readOnly?: boolean
  /** Above the sections, under the checks: the application's Alert (e.g. the deadline). */
  notice?: ReactNode
  /** 'phone' forces the phone layout; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const RULE_LOOK = {
  failed: { icon: CircleX, fg: 'text-status-danger-fg', key: 'statutory.checkFailed' },
  warning: { icon: TriangleAlert, fg: 'text-status-warning-fg', key: 'statutory.checkWarning' },
  passed: { icon: CircleCheck, fg: 'text-status-success-fg', key: 'statutory.checkPassed' },
} as const

/** A rule's result as a line: an icon, the state in words, the rule and what was found. */
function RuleLine({ rule }: { rule: StatutoryRule }) {
  const { messages } = useLiro()
  const look = RULE_LOOK[rule.result]
  const Icon = look.icon
  return (
    <span className={cn('flex items-start gap-1 text-xs whitespace-normal', look.fg)}>
      <Icon aria-hidden="true" className="mt-px size-3.5 shrink-0" />
      <span className={TEXT_DIRECTION}>
        <span className="font-semibold">{messages[look.key]}:</span> {rule.text}
        {rule.detail !== undefined && <> · {rule.detail}</>}
      </span>
    </span>
  )
}

/** An official form: numbered fields, drill-down, overrides, rule checks, status. */
export function StatutoryFormPage(props: StatutoryFormPageProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const prefix = useId()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const rules = props.rules ?? []
  const [ownEditing, setOwnEditing] = useState<string | null>(null)
  const editing = props.editing === undefined ? ownEditing : props.editing
  const setEditing = (field: string | null) => {
    setOwnEditing(field)
    props.onEditingChange?.(field)
  }
  const [saving, setSaving] = useState(false)
  const [drill, setDrill] = useState<StatutoryField | null>(null)
  const readOnly = props.readOnly === true
  const currencyOf = (field: StatutoryField) => field.currency ?? props.currency
  const money = (field: StatutoryField, value: string) =>
    format.money(
      value,
      currencyOf(field),
      field.decimals === undefined ? {} : { decimals: field.decimals },
    )
  const amountText = (field: StatutoryField, value: string | null | undefined) => (
    <MoneyText
      value={value ?? null}
      currency={currencyOf(field)}
      {...(field.decimals === undefined ? {} : { decimals: field.decimals })}
    />
  )

  const goTo = (field: string) => {
    const target = document.getElementById(fieldElementId(prefix, field))
    target?.scrollIntoView({ block: 'center' })
    target?.focus({ preventScroll: true })
  }

  const current = (field: StatutoryField) => {
    if (editing === field.id && field.editor !== undefined) {
      return (
        <span className="flex flex-col items-end gap-2">
          <span className="w-full min-w-40">{field.editor}</span>
          <span className="flex flex-wrap justify-end gap-2">
            <Button
              intent="cancel"
              label={messages['dialog.cancel']}
              disabled={saving}
              onClick={() => {
                setEditing(null)
              }}
            />
            <Button
              intent="save"
              label={messages['statutory.saveOverride']}
              disabled={saving}
              onClick={() => {
                const result = props.onSaveOverride?.(field.id)
                if (result instanceof Promise) {
                  setSaving(true)
                  void result
                    .then(() => {
                      setEditing(null)
                    })
                    .finally(() => {
                      setSaving(false)
                    })
                } else setEditing(null)
              }}
            />
          </span>
        </span>
      )
    }
    const amount =
      field.sources !== undefined && field.value !== null ? (
        <button
          type="button"
          aria-label={messages['statutory.showSources'](field.number, money(field, field.value))}
          onClick={() => {
            setDrill(field)
          }}
          className={cn(
            BUTTON_RESET,
            'cursor-pointer rounded-sm text-link underline decoration-dotted underline-offset-2 hover:decoration-solid',
            FOCUS_RING,
          )}
        >
          {amountText(field, field.value)}
        </button>
      ) : (
        amountText(field, field.value)
      )
    return (
      <span className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1">
          <span className={cn(field.total === true && 'font-semibold')}>{amount}</span>
          {field.editor !== undefined && !readOnly && (
            <CompactIconButton
              intent="edit"
              label={messages['value.change'](field.number)}
              onClick={() => {
                setEditing(field.id)
              }}
            />
          )}
        </span>
        {field.override !== undefined && (
          <span className="flex flex-col items-end gap-0.5 text-xs whitespace-normal text-secondary">
            <StatusBadge
              tone="neutral"
              icon={PencilLine}
              label={messages['statutory.overridden']}
            />
            <span className={TEXT_DIRECTION}>
              {messages['statutory.overriddenBy'](field.override.by, field.override.at)}
            </span>
            <span className="tabular-nums">
              {messages['statutory.computed'](money(field, field.override.computed))}
            </span>
            {!readOnly && props.onUseComputed !== undefined && (
              <Button
                family="neutral"
                icon={Undo2}
                emphasis="menu"
                label={messages['statutory.useComputed']}
                onClick={() => {
                  props.onUseComputed?.(field.id)
                }}
              />
            )}
          </span>
        )}
      </span>
    )
  }

  const columns: DataTableColumn<StatutoryField>[] = [
    {
      id: 'number',
      header: messages['statutory.number'],
      numeric: true,
      cell: (field) => (
        <span
          id={fieldElementId(prefix, field.id)}
          tabIndex={-1}
          dir="ltr"
          className={cn(
            'rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-focus',
            field.total === true && 'font-semibold',
          )}
        >
          {field.number}
        </span>
      ),
    },
    {
      id: 'label',
      header: messages['statutory.description'],
      cell: (field) => (
        <span className="flex min-w-48 flex-col gap-1 whitespace-normal">
          <span className={cn(field.total === true && 'font-semibold')}>{field.label}</span>
          {fieldRules(rules, field.id).map((rule) => (
            <RuleLine key={rule.id} rule={rule} />
          ))}
        </span>
      ),
    },
    ...(props.previousLabel === undefined
      ? []
      : [
          {
            id: 'previous',
            header: props.previousLabel,
            align: 'end',
            numeric: true,
            cell: (field) => (
              <span className="text-secondary">{amountText(field, field.previous)}</span>
            ),
          } satisfies DataTableColumn<StatutoryField>,
        ]),
    {
      id: 'current',
      header: props.currentLabel,
      align: 'end',
      numeric: true,
      cell: current,
    },
  ]

  const counts = ruleCounts(rules)
  const count = (value: number) => format.number(String(value))
  const open = rules.filter((rule) => rule.result !== 'passed')
  const summaryTitle = [
    counts.failed > 0 && messages['statutory.checksFailed'](counts.failed, count(counts.failed)),
    counts.warning > 0 &&
      messages['statutory.checksWarnings'](counts.warning, count(counts.warning)),
    counts.passed > 0 && messages['statutory.checksPassed'](counts.passed, count(counts.passed)),
  ]
    .filter((part) => part !== false)
    .join(' · ')
  const numberOf = (id: string) =>
    props.sections.flatMap((section) => section.fields).find((field) => field.id === id)?.number

  return (
    <div
      data-slot="statutory-form-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-4 p-6',
        props.className,
      )}
    >
      {props.lifecycle !== undefined && (
        <LifecycleBar
          steps={props.lifecycle.steps}
          current={props.lifecycle.current}
          label={props.lifecycle.label}
          layout={phone ? 'phone' : 'desktop'}
        />
      )}
      <PageHeader
        title={props.title}
        {...(props.back === undefined ? {} : { back: props.back })}
        {...(props.status === undefined ? {} : { status: props.status })}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      {rules.length > 0 && (
        <Alert tone={rulesTone(rules)} title={summaryTitle}>
          {open.length > 0 && (
            <ul
              aria-label={messages['statutory.checks']}
              className="m-0 flex list-none flex-col gap-2 p-0"
            >
              {open.map((rule) => {
                const first = rule.fields[0]
                const number = first === undefined ? undefined : numberOf(first)
                return (
                  <li key={rule.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <RuleLine rule={rule} />
                    {first !== undefined && number !== undefined && (
                      <button
                        type="button"
                        onClick={() => {
                          goTo(first)
                        }}
                        className={cn(
                          BUTTON_RESET,
                          'min-h-6 cursor-pointer rounded-sm text-xs font-semibold text-link underline underline-offset-2',
                          FOCUS_RING,
                        )}
                      >
                        {messages['statutory.goToField'](number)}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Alert>
      )}
      {props.notice}
      {props.sections.map((section) => (
        <SectionCard
          key={section.key}
          title={section.title}
          headingLevel={2}
          flush
          {...(section.description === undefined ? {} : { description: section.description })}
        >
          <DataTable
            label={section.title}
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={columns}
            rows={section.fields}
            getRowId={(field) => field.id}
            getRowLabel={(field) => `${field.number} ${field.label}`}
            mobile={{
              title: (field) => (
                <span className="flex flex-col gap-1 whitespace-normal">
                  <span className={cn(field.total === true && 'font-semibold')}>
                    <span dir="ltr">{field.number}</span> {field.label}
                  </span>
                  {fieldRules(rules, field.id).map((rule) => (
                    <RuleLine key={rule.id} rule={rule} />
                  ))}
                </span>
              ),
              details: props.previousLabel === undefined ? ['current'] : ['previous', 'current'],
            }}
          />
        </SectionCard>
      ))}
      {drill !== null && (
        <Drawer
          side="end"
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setDrill(null)
          }}
          title={`${drill.number} ${drill.label}`}
          description={props.currentLabel}
          actions={
            <Button
              intent="cancel"
              label={messages['dialog.close']}
              onClick={() => {
                setDrill(null)
              }}
            />
          }
        >
          {(drill.sources ?? []).length === 0 ? (
            <p className="m-0 text-sm text-secondary">{messages['statutory.noSources']}</p>
          ) : (
            <ul
              aria-label={messages['statutory.sources']}
              className="m-0 flex list-none flex-col p-0 font-sans"
            >
              {(drill.sources ?? []).map((source) => (
                <li
                  key={source.key}
                  className="flex items-center justify-between gap-3 border-0 border-b border-solid border-subtle py-2 first:pt-0"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={source.href}
                      className={cn(
                        'flex min-w-0 flex-col rounded-sm text-sm no-underline hover:underline',
                        FOCUS_RING,
                      )}
                    >
                      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                        {source.type}
                      </span>
                      <span dir="ltr" className="text-start font-medium text-link tabular-nums">
                        {source.number}
                      </span>
                    </Link>
                    {source.date !== undefined && (
                      <span className="text-xs text-secondary">
                        <DateText value={source.date} />
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-medium">{amountText(drill, source.amount)}</span>
                    {source.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="m-0 flex items-baseline justify-between gap-3 border-0 border-t border-solid border-strong pt-2 text-sm font-semibold">
            <span className={TEXT_DIRECTION}>{messages['statutory.fieldValue'](drill.number)}</span>
            {amountText(drill, drill.value)}
          </p>
        </Drawer>
      )}
    </div>
  )
}
