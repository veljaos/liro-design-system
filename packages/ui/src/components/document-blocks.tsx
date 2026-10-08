import { Ban, Maximize2 } from 'lucide-react'
import type { RowData } from '@tanstack/react-table'
import type { ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { Banner } from './alert'
import { Button } from './button'
import type { DataTableColumn } from './data-table'
import { MoneyText, NumberText } from './display-text'
import { chosenNoteTexts, type DocumentNotesValue, type NoteTemplate } from './document-logic'
import { MultiSelectField } from './multi-select-field'
import type { Tone } from './status-badge'
import { TextAreaField } from './text-field'

/*
 * The blocks of a complex document (BUILD-PLAN P5.18; docs/p5-notes/group-D2.md). DocumentPage
 * renders them in a fixed order — header (with the currency block) → "Based on" references →
 * lines (with the specification's summary row) → totals → notes → attachments — and leaves out a
 * block without content. All rules, codes, numbers and legal texts come from the application;
 * these blocks only present them (D1, D5).
 */

// ── References ──────────────────────────────────────────────────────────────────────────────

/** One referenced document: a link showing its number, named with its kind and state. */
export interface DocumentReference {
  key: string
  /** The document's number ("A-2026-038"). */
  number: string
  /** Its page, followed through the provider's linkComponent. */
  href: string
  /** The kind in the singular, for the link's name ("Advance invoice"). Default: the group's. */
  kind?: string
  /**
   * Its state (P4.9 rule 7): small text after the number in the tone's text colour — the words
   * carry it — and part of the link's accessible name.
   */
  status?: { label: string; tone?: Tone }
}

/** The references of one kind ("Advances A-2026-038, A-2026-044"). */
export interface DocumentReferenceGroup {
  key: string
  /** The kind as shown before the numbers, from the application ("Advances"). */
  label: string
  /** The kind in the singular for the links' names ("Advance invoice"). Default: `label`. */
  kind?: string
  items: readonly DocumentReference[]
}

export interface DocumentReferencesProps {
  groups: readonly DocumentReferenceGroup[]
  /**
   * The lead before the references: "Based on" by default (`messages['references.basedOn']`);
   * "Cancels", "Corrects" for the back-links of a cancellation or a corrective document.
   */
  label?: string
  className?: string
}

/** The text colour of a state's words; neutral is secondary text. Literal classes for Tailwind. */
const STATE_TEXT: Record<Tone, string> = {
  neutral: 'text-secondary',
  info: 'text-status-info-fg',
  success: 'text-status-success-fg',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
  premium: 'text-status-premium-fg',
}

/** Link colours named for every state (P4.4). */
const LINK =
  'rounded-sm text-link no-underline visited:text-link hover:text-link hover:underline active:text-link'

/**
 * The documents this one is based on, in one line of links (P5.18): "Based on: Proforma
 * PR-2026-031 · Advances A-2026-038, A-2026-044 · Contract 12/2026". Wraps on narrow screens.
 */
export function DocumentReferences({ groups, label, className }: DocumentReferencesProps) {
  const { messages, linkComponent: Link } = useLiro()
  const lead = label ?? messages['references.basedOn']
  if (groups.every((group) => group.items.length === 0)) return null
  return (
    <div
      data-slot="document-references"
      className={cn(
        'flex flex-wrap items-baseline gap-x-2 gap-y-1 font-sans text-sm text-primary',
        className,
      )}
    >
      <span className={cn('text-secondary', TEXT_DIRECTION)}>
        {messages['references.lead'](lead)}
      </span>
      <ul
        aria-label={lead}
        className="m-0 flex list-none flex-wrap items-baseline gap-x-2 gap-y-1 p-0"
      >
        {groups
          .filter((group) => group.items.length > 0)
          .map((group, index) => (
            <li key={group.key} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-tertiary">
                  ·
                </span>
              )}
              <span className={cn('text-secondary', TEXT_DIRECTION)}>{group.label}</span>
              {group.items.map((item, itemIndex) => (
                <span key={item.key} className="inline-flex items-baseline gap-1">
                  <Link
                    href={item.href}
                    aria-label={messages['references.link'](
                      item.kind ?? group.kind ?? group.label,
                      item.number,
                      item.status?.label,
                    )}
                    className={cn(LINK, 'font-medium tabular-nums', FOCUS_RING)}
                  >
                    <span dir="ltr">{item.number}</span>
                  </Link>
                  {item.status !== undefined && (
                    // Read as part of the link's name; shown here for the eye.
                    <span
                      aria-hidden="true"
                      className={cn(
                        'text-xs font-medium',
                        STATE_TEXT[item.status.tone ?? 'neutral'],
                        TEXT_DIRECTION,
                      )}
                    >
                      {item.status.label}
                    </span>
                  )}
                  {itemIndex < group.items.length - 1 && (
                    <span aria-hidden="true" className="-ms-1 text-secondary">
                      {messages['references.listSeparator']}
                    </span>
                  )}
                </span>
              ))}
            </li>
          ))}
      </ul>
    </div>
  )
}

// ── Currency ────────────────────────────────────────────────────────────────────────────────

export interface DocumentCurrencyProps {
  /** The document's currency ("EUR"). */
  currency: string
  /** The home currency ("RSD"). */
  homeCurrency: string
  /** Home-currency units for one unit of `currency`: a decimal string ("117.1825"). */
  rate: string
  /** The rate's date, YYYY-MM-DD. */
  rateDate: string
  className?: string
}

/**
 * The currency block of a foreign-currency document (P5.18), in the header's details: the
 * currency, the rate ("1 EUR = 117,1825 RSD") and its date, each a label above its value as the
 * header's other values. The lines stay in the document's currency; the home-currency amounts
 * are only in the totals (`DocumentTotals` `exchange`).
 */
export function DocumentCurrency(props: DocumentCurrencyProps) {
  const { messages, format } = useLiro()
  const items = [
    { key: 'currency', label: messages['document.currency'], value: props.currency },
    {
      key: 'rate',
      label: messages['document.exchangeRate'],
      value: messages['document.rate'](
        props.currency,
        props.homeCurrency,
        format.number(props.rate),
      ),
    },
    { key: 'date', label: messages['document.rateDate'], value: format.date(props.rateDate) },
  ]
  return (
    <dl
      data-slot="document-currency"
      className={cn('m-0 flex flex-wrap gap-x-8 gap-y-3 font-sans', props.className)}
    >
      {items.map((item) => (
        <div key={item.key} className="flex flex-col gap-0.5">
          <dt className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.label}</dt>
          <dd className="m-0 text-sm font-medium text-primary tabular-nums">
            <bdi>{item.value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  )
}

// ── Notes ───────────────────────────────────────────────────────────────────────────────────

export interface DocumentNotesProps {
  /** The template texts the application offers (the Core's list), each with its name and text. */
  templates: readonly NoteTemplate[]
  /** The chosen templates, in order, and the free note. */
  value: DocumentNotesValue
  onChange?: (value: DocumentNotesValue) => void
  /** 'view' (default): the texts as the document prints them; 'edit': choose and write. */
  mode?: 'view' | 'edit'
  /** Default: `messages['notes.templates']`. */
  templatesLabel?: string
  /** Default: `messages['notes.free']`. */
  noteLabel?: string
  className?: string
}

/**
 * The notes of a document (P5.18): template texts chosen from the application's list and a free
 * note. In view mode the texts in order as the document shows them; in edit mode the templates
 * are chosen by name (MultiSelectField) with their texts under it, and the free note is a text
 * area. A document without notes passes none (`hasNotes`), so the block is not rendered.
 */
export function DocumentNotes(props: DocumentNotesProps) {
  const { messages } = useLiro()
  const texts = chosenNoteTexts(props.templates, props.value)
  const paragraphs = (
    <div className="flex flex-col gap-2">
      {texts.map((text) => (
        <p
          key={text.key}
          className={cn('m-0 text-sm break-words whitespace-pre-line text-primary', TEXT_DIRECTION)}
        >
          {text.text}
        </p>
      ))}
    </div>
  )
  if (props.mode !== 'edit') {
    return (
      <div data-slot="document-notes" className={cn('font-sans', props.className)}>
        {paragraphs}
      </div>
    )
  }
  const change = (next: Partial<DocumentNotesValue>) => {
    props.onChange?.({ ...props.value, ...next })
  }
  const chosen = texts.filter((text) => text.key !== 'note')
  return (
    <div
      data-slot="document-notes"
      className={cn('flex flex-col gap-4 font-sans', props.className)}
    >
      <div className="flex flex-col gap-2">
        <MultiSelectField
          label={props.templatesLabel ?? messages['notes.templates']}
          options={props.templates.map((template) => ({
            value: template.value,
            label: template.label,
          }))}
          value={props.value.templates}
          onChange={(templates) => {
            change({ templates })
          }}
        />
        {chosen.length > 0 && (
          <div className="flex flex-col gap-1">
            {chosen.map((text) => (
              <p
                key={text.key}
                className={cn(
                  'm-0 text-xs break-words whitespace-pre-line text-secondary',
                  TEXT_DIRECTION,
                )}
              >
                {text.text}
              </p>
            ))}
          </div>
        )}
      </div>
      <TextAreaField
        label={props.noteLabel ?? messages['notes.free']}
        rows={3}
        value={props.value.note}
        onChange={(note) => {
          change({ note })
        }}
      />
    </div>
  )
}

// ── Specification ───────────────────────────────────────────────────────────────────────────

export interface DocumentSpecificationProps {
  /** The specification's name, from the application ("Specification of works"). */
  title: string
  /** The number of positions. */
  count: number
  /** Its amount: a decimal string, computed by the application. */
  amount: string
  currency: string
  decimals?: number
  /** A line under the sheet's title ("IS-2026-007 · Contract 12/2026"). */
  description?: ReactNode
  /** The full specification: a DataTable of its positions (groups, subtotals) and its recap. */
  children: ReactNode
  /** Controlled open state of the full view, and its change. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

/**
 * A long specification is not inside the lines table (P5.18): one summary row in the lines'
 * card — "Specification of works: 300 positions, 2.418.300,00 RSD" — with "Open", which shows the
 * whole specification read-only in a full-screen sheet (the document stays under it; Escape and
 * the close button return to it, the focus back on "Open").
 */
export function DocumentSpecification(props: DocumentSpecificationProps) {
  const { messages, format } = useLiro()
  const amount = format.money(
    props.amount,
    props.currency,
    props.decimals === undefined ? {} : { decimals: props.decimals },
  )
  const summary = messages['specification.summary'](
    props.title,
    props.count,
    format.number(String(props.count)),
    amount,
  )
  return (
    <Sheet
      {...(props.open === undefined ? {} : { open: props.open })}
      {...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen })}
      {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
    >
      <div
        data-slot="document-specification"
        className={cn(
          'flex flex-wrap items-center justify-between gap-x-4 gap-y-2 font-sans',
          props.className,
        )}
      >
        <p className={cn('m-0 min-w-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {summary}
        </p>
        <SheetTrigger asChild>
          <Button
            family="neutral"
            icon={Maximize2}
            emphasis="secondary"
            label={messages['specification.open']}
          />
        </SheetTrigger>
      </div>
      <SheetContent
        side="full"
        {...(props.description === undefined ? { 'aria-describedby': undefined } : {})}
        className="overflow-hidden pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]"
      >
        <DialogHeader className="shrink-0 items-start border-0 border-b border-solid border-default pt-[max(16px,env(safe-area-inset-top))]">
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle>{props.title}</DialogTitle>
            {props.description !== undefined && (
              <DialogDescription className="text-xs text-secondary">
                {props.description}
              </DialogDescription>
            )}
          </div>
          <DialogCloseButton label={messages['dialog.close']} />
        </DialogHeader>
        <div
          data-slot="specification-body"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          {props.children}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Cancellation ────────────────────────────────────────────────────────────────────────────

export interface CancellationBannerProps {
  /** Who cancelled it, from the application. */
  by: string
  /** When: an ISO instant in the tenant's offset ("2026-10-06T11:20:00+02:00"). */
  at: string
  /** The reason given in the cancellation dialog. */
  reason: string
  /** The cancellation document, a link ("Cancellation document ST-2026-0004"). */
  document?: { kind: string; number: string; href: string }
  /** Default: `messages['document.cancelledTitle']`. */
  title?: string
  /** Default 'neutral' (a state, not an error); 'danger' where the Core wants it louder. */
  tone?: 'neutral' | 'danger'
  className?: string
}

/**
 * The marker of a cancelled document (P5.18), at the top of its page: "Cancelled. Cancelled by
 * Milica Petrović on 06.10.2026. at 11:20. Reason: … Cancellation document ST-2026-0004". The
 * date and time are the tenant's (`format.date`, `format.time`). The PDF's marker is the Core's.
 */
export function CancellationBanner(props: CancellationBannerProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const date = /^\d{4}-\d{2}-\d{2}/.exec(props.at)?.[0] ?? props.at
  return (
    <Banner
      tone={props.tone ?? 'neutral'}
      icon={Ban}
      title={props.title ?? messages['document.cancelledTitle']}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      {messages['document.cancelledBy'](props.by, format.date(date), format.time(props.at))}{' '}
      {messages['document.cancelReason'](props.reason)}
      {props.document !== undefined && (
        <>
          {' '}
          <Link href={props.document.href} className={cn(LINK, 'font-medium', FOCUS_RING)}>
            {props.document.kind} <span dir="ltr">{props.document.number}</span>
          </Link>
        </>
      )}
    </Banner>
  )
}

// ── Corrective documents ────────────────────────────────────────────────────────────────────

export interface ChangeTextProps {
  /** The change: a decimal string, negative for a decrease. */
  value: string | null | undefined
  /** With it, an amount; without, a number. */
  currency?: string
  decimals?: number
  className?: string
}

/**
 * A change on a corrective document (P5.18): "+" for an increase, "-" for a decrease, through the
 * provider's format (`sign: 'always'`), never rounded; "—" when empty.
 */
export function ChangeText({ value, currency, decimals, className }: ChangeTextProps) {
  const { format } = useLiro()
  if (value === undefined || value === null || value === '') {
    return <span className={cn('text-tertiary', className)}>—</span>
  }
  const options = { sign: 'always' as const, ...(decimals === undefined ? {} : { decimals }) }
  return (
    <bdi className={cn('font-medium whitespace-nowrap tabular-nums', className)}>
      {currency === undefined
        ? format.number(value, options)
        : format.money(value, currency, options)}
    </bdi>
  )
}

/** One value of a corrected line, as three columns. */
export interface CorrectionColumnSpec<Row> {
  /** The columns' ids are `<id>.original`, `<id>.change` and `<id>.new`. */
  id: string
  original: (row: Row) => string | null
  change: (row: Row) => string | null
  next: (row: Row) => string | null
  /** The headers; defaults `messages['correction.original' | 'correction.change' | 'correction.new']`. */
  headers?: { original?: ReactNode; change?: ReactNode; next?: ReactNode }
  /** With it, amounts; without, numbers. */
  currency?: string
  decimals?: number
}

function CorrectionHeader({ part }: { part: 'original' | 'change' | 'new' }) {
  const { messages } = useLiro()
  return <>{messages[`correction.${part}`]}</>
}

/**
 * The Original / Change / New columns of a corrective document's lines (P5.18): a decrease or an
 * increase against one document or several, each line's value before, its change (signed) and
 * after — all from the application, nothing computed. Use one call per corrected value (the
 * quantity, the amount) and give its headers when there are several.
 */
export function correctionColumns<Row extends RowData>(
  spec: CorrectionColumnSpec<Row>,
): DataTableColumn<Row>[] {
  const value = (text: string | null) =>
    spec.currency === undefined ? (
      <NumberText
        value={text}
        {...(spec.decimals === undefined ? {} : { decimals: spec.decimals })}
      />
    ) : (
      <MoneyText
        value={text}
        currency={spec.currency}
        {...(spec.decimals === undefined ? {} : { decimals: spec.decimals })}
      />
    )
  return [
    {
      id: `${spec.id}.original`,
      header: spec.headers?.original ?? <CorrectionHeader part="original" />,
      align: 'end',
      numeric: true,
      cell: (row) => value(spec.original(row)),
    },
    {
      id: `${spec.id}.change`,
      header: spec.headers?.change ?? <CorrectionHeader part="change" />,
      align: 'end',
      numeric: true,
      cell: (row) => (
        <ChangeText
          value={spec.change(row)}
          {...(spec.currency === undefined ? {} : { currency: spec.currency })}
          {...(spec.decimals === undefined ? {} : { decimals: spec.decimals })}
        />
      ),
    },
    {
      id: `${spec.id}.new`,
      header: spec.headers?.next ?? <CorrectionHeader part="new" />,
      align: 'end',
      numeric: true,
      cell: (row) => value(spec.next(row)),
    },
  ]
}
