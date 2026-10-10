import { PanelRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../components/button'
import { SectionCard } from '../components/cards'
import { DocumentTotals, type DocumentTotalsProps } from '../components/document-totals'
import { KeyFigures, type KeyFigure } from '../components/key-figures'
import { LifecycleBar, type LifecycleStep } from '../components/lifecycle-bar'
import { SidePanels, type SidePanel } from '../components/side-panels'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'

/*
 * DocumentPage (BUILD-PLAN P4.5, the most important template; the owner's decisions,
 * docs/decisions.md "Document page"): one business document — an invoice, an order, a journal
 * entry — read or edited on its own page.
 * - The lifecycle bar above the header (LifecycleBar): where the document stands.
 * - The header: back, the document's number (h1), status, actions at the end; with side panels, a
 *   subtle neutral "Hide panels" / "Show panels" button (PanelRight, mirrored in right-to-left)
 *   before the actions.
 * - The counterparty only (the user's own company is in the AppShell header): a label from the
 *   application ("Customer", "Supplier") in xs text.secondary, the name sm semibold, the tax number
 *   and the address xs text.secondary; then the key figures (KeyFigures).
 * - The lines (an EditableGrid or a read-only DataTable, from the application) in one card, edge
 *   to edge, without a title by default (the column headers say what it is), the table header at
 *   the card's top; the totals (DocumentTotals) under them at the end, inside the same card.
 * - Further sections (notes, payment terms) as SectionCards under the lines.
 * - The header is a set of slots (P4.9, the owner's review): the Core decides what a document's
 *   header shows — `counterparty` (the customer block), `keyFigures` (amount due, total, due date …,
 *   any two to four, or none), `details` (the values the system filled in on a draft, as
 *   ChangeableValues). A slot left out takes no room.
 * - A draft is as simple as possible (P4.9): the application passes no side panels (attachments
 *   only when there are some), two header actions (Preview, Issue invoice), the filled-in values as
 *   `details`, and an EditableGrid with unit, tax category and amount per line.
 * - The side panels (SidePanels) in a 300px column from lg (75em), as DetailPage; the whole
 *   column can be hidden (`panelsHidden`), and the document takes the full width. Below 75em and
 *   on phones the panels stand under the document, and the whole-column button is not shown. Both
 *   states are the application's (callbacks), so the Core can remember them.
 * - Complex documents (P5.18), a fixed block order: header (with `banner` above it — a cancelled
 *   document's marker — and the `currency` block in it) → "Based on" `references` → lines (with
 *   the `specification` summary row under them) → totals (recap, deductions, home-currency
 *   equivalents, footnotes) → `notes` → `attachments` → the other sections. A block without
 *   content is not rendered. Phones keep the same order.
 */

/** A titled block of the document (notes, attachments): a SectionCard in the fixed order. */
export interface DocumentBlock {
  title: string
  content: ReactNode
  actions?: ReactNode
}

/** The document's other party. */
export interface Counterparty {
  /** "Customer" on sales, "Supplier" on purchases: from the application. */
  label: string
  name: string
  /** The tax number line ("PIB 104987265"). */
  taxId?: string
  address?: string
}

/** A section under the lines (notes, payment terms). */
export interface DocumentSection {
  key: string
  title: string
  content: ReactNode
  actions?: ReactNode
}

export interface DocumentPageProps {
  /** The document's number: the page's h1. */
  title: string
  back?: PageBack
  /** After the number: a StatusBadge. */
  status?: ReactNode
  /** The page's actions, the main one last. */
  actions?: ReactNode
  /** Where the document stands in its life. */
  lifecycle?: { steps: readonly LifecycleStep[]; current: number; label: string }
  counterparty?: Counterparty
  keyFigures?: readonly KeyFigure[]
  /**
   * The document's own values under the counterparty — on a draft, the values the system filled
   * in (number, issue date, due date) as ChangeableValues, in one wrapping row. Every draft's
   * header is built this way (P5.23): changeable values with their field, read-only ones (a
   * "Based on" link) as ChangeableValues without a field, so they align.
   */
  details?: ReactNode
  /**
   * A title over the lines' card. Default: none — the table's column headers say what it is,
   * and the table starts at the card's top (owner, P4.5). A card that holds the page's only
   * table has no title (P5.23): pass one only when the page has more than one table.
   */
  linesTitle?: string
  /**
   * The lines: an EditableGrid or a DataTable (with `inCard`). Nothing (null) leaves the lines'
   * card out unless a specification or totals stand in it.
   */
  lines: ReactNode
  /** Actions in the lines' header ("Add from order"). */
  linesActions?: ReactNode
  /**
   * The totals under the lines, computed by the application: rows, the final row, and (P5.18) the
   * recap by tax category, the deductions, the home-currency equivalents and the footnotes.
   */
  totals?: Omit<DocumentTotalsProps, 'className'>
  /**
   * A marker above the whole document (P5.18): a cancelled document's `CancellationBanner`.
   */
  banner?: ReactNode
  /** The currency block of a foreign-currency document (`DocumentCurrency`), in the header. */
  currency?: ReactNode
  /**
   * The documents this one is based on (`DocumentReferences`), one line between the header and
   * the lines; also the back-links of a cancellation or a corrective document.
   */
  references?: ReactNode
  /**
   * A long specification's summary row (`DocumentSpecification`), in the lines' card under the
   * lines and above the totals.
   */
  specification?: ReactNode
  /** The notes block (`DocumentNotes`), after the lines and totals (P5.18). */
  notes?: DocumentBlock
  /**
   * The attachments block, after the notes (P5.18): the files, each with its "send with the
   * document" flag.
   */
  attachments?: DocumentBlock
  sections?: readonly DocumentSection[]
  /** The side panels (history, attachments, comments, related documents, delivery, presence). */
  panels?: readonly SidePanel[]
  /** The keys of the open panels, and their change. */
  panelsOpen?: readonly string[]
  onPanelsOpenChange?: (open: string[]) => void
  /** The whole side column hidden (from 75em), and its change. */
  panelsHidden?: boolean
  onPanelsHiddenChange?: (hidden: boolean) => void
  /**
   * 'desktop', 'narrow' (below 75em: the panels under the document) or 'phone'; default by the
   * viewport.
   */
  layout?: 'desktop' | 'narrow' | 'phone'
  className?: string
}

function CounterpartyBlock({ party }: { party: Counterparty }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 font-sans">
      <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{party.label}</span>
      <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>{party.name}</span>
      {party.taxId !== undefined && (
        <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
          {party.taxId}
        </span>
      )}
      {party.address !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{party.address}</span>
      )}
    </div>
  )
}

/** One business document: its life, header, counterparty, lines, totals and side panels. */
export function DocumentPage(props: DocumentPageProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const layout = props.layout ?? (viewportPhone ? 'phone' : 'desktop')
  const phone = layout === 'phone'
  const hasPanels = props.panels !== undefined && props.panels.length > 0
  // The whole-column button and the hidden state apply only where the panels stand beside the
  // document; below 75em CSS puts them under it (`layout` 'narrow' forces that in a frame).
  const beside = layout === 'desktop'
  const hidden = beside && props.panelsHidden === true

  const toggle =
    hasPanels && beside && props.onPanelsHiddenChange !== undefined ? (
      // The icon mirrors in right-to-left: the panels stand at the inline end.
      <span className="hidden lg:contents rtl:[&_svg]:-scale-x-100">
        <Button
          family="neutral"
          emphasis="menu"
          icon={PanelRight}
          label={hidden ? messages['document.showPanels'] : messages['document.hidePanels']}
          aria-pressed={!hidden}
          onClick={() => props.onPanelsHiddenChange?.(!hidden)}
        />
      </span>
    ) : undefined

  const actions =
    toggle === undefined && props.actions === undefined ? undefined : (
      <>
        {toggle}
        {props.actions}
      </>
    )

  const hasLines = props.lines !== null && props.lines !== undefined && props.lines !== false
  const hasSpecification = props.specification !== undefined && props.specification !== null
  const blocks = [props.notes, props.attachments].filter(
    (block): block is DocumentBlock => block !== undefined,
  )

  const document = (
    <div className="flex min-w-0 flex-col gap-4">
      {(hasLines || hasSpecification || props.totals !== undefined) && (
        <SectionCard
          {...(props.linesTitle === undefined ? {} : { title: props.linesTitle })}
          headingLevel={2}
          flush
          {...(props.linesActions === undefined ? {} : { actions: props.linesActions })}
        >
          {props.lines}
          {hasSpecification && (
            <div
              className={cn(
                'px-4 py-3',
                hasLines && 'border-0 border-t border-solid border-subtle',
              )}
            >
              {props.specification}
            </div>
          )}
          {props.totals !== undefined && (
            <div
              className={cn(
                'px-4 py-4',
                (hasLines || hasSpecification) && 'border-0 border-t border-solid border-subtle',
              )}
            >
              <DocumentTotals {...props.totals} {...(phone ? { className: 'max-w-none' } : {})} />
            </div>
          )}
        </SectionCard>
      )}
      {blocks.map((block, index) => (
        <SectionCard
          key={block === props.notes ? 'notes' : `block-${String(index)}`}
          title={block.title}
          headingLevel={2}
          {...(block.actions === undefined ? {} : { actions: block.actions })}
        >
          {block.content}
        </SectionCard>
      ))}
      {props.sections?.map((section) => (
        <SectionCard
          key={section.key}
          title={section.title}
          headingLevel={2}
          {...(section.actions === undefined ? {} : { actions: section.actions })}
        >
          {section.content}
        </SectionCard>
      ))}
    </div>
  )

  const panels = hasPanels ? (
    <aside aria-label={messages['document.panels']} className="min-w-0">
      <SidePanels
        panels={props.panels ?? []}
        open={props.panelsOpen ?? []}
        onOpenChange={props.onPanelsOpenChange ?? (() => undefined)}
      />
    </aside>
  ) : null

  return (
    <div
      data-slot="document-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <div className="flex flex-col gap-4">
        {props.banner}
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
          {...(actions === undefined ? {} : { actions })}
        />
        {props.counterparty !== undefined && <CounterpartyBlock party={props.counterparty} />}
        {props.details !== undefined && (
          <div data-slot="document-details" className="flex flex-wrap items-start gap-x-8 gap-y-3">
            {props.details}
          </div>
        )}
        {props.currency}
        {props.keyFigures !== undefined && props.keyFigures.length > 0 && (
          <KeyFigures items={props.keyFigures} layout={phone ? 'phone' : 'desktop'} />
        )}
        {props.references}
      </div>
      {panels === null || hidden ? (
        document
      ) : (
        <div
          className={cn('grid grid-cols-1 gap-6', beside && 'lg:grid-cols-[minmax(0,1fr)_300px]')}
        >
          {document}
          {panels}
        </div>
      )}
    </div>
  )
}
