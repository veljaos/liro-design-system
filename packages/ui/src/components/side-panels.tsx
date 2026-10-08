import { ChevronDown } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * SidePanels (P4.5, the owner's decision, docs/decisions.md "Document page"): the panels beside a
 * document — history, attachments, comments, related documents, delivery status, presence
 * (Business Central's FactBoxes) — each collapsible with one click.
 * - Each panel: the raised surface, border.default, radius lg; its header is one button across
 *   the panel: the name (sm semibold), the count after it (xs text.secondary, tabular), a 14px
 *   ChevronDown at the end that turns when the panel is closed; padding md. Closed, only the
 *   header row stays. 16px between panels.
 * - One spacing rule for every panel (P4.9, the owner's review): the header (padding md), an sm
 *   (12px) gap, the body padded md at the sides and the bottom. The body's content adds no space
 *   of its own at its outer edges: the first and last rows of a KeyValueList, RelatedDocuments or
 *   ActivityList lose their outer padding here, so every panel's first row stands 12px under its
 *   header and its last row 16px above the panel's edge, whatever the content.
 * - Which panels are open is the application's (`open`, `onOpenChange`), so the Core can remember
 *   it. The content of a closed panel is not mounted.
 */

/**
 * The body's content starts and ends at the body's padding: the outer rows of the panel lists
 * (KeyValueList rows, RelatedDocuments, ActivityList) lose their own top and bottom padding.
 * Literal classes, so Tailwind finds them.
 */
const PANEL_BODY =
  '[&_[data-slot=key-value-item]:first-child]:pt-0 [&_[data-slot=key-value-item]:last-child]:pb-0 [&_[data-slot=panel-row]:first-child]:pt-0 [&_[data-slot=panel-row]:last-child]:pb-0'

/** One panel. */
export interface SidePanel {
  key: string
  /** The panel's name, from the application ("Attachments"). */
  title: string
  /** A count after the name ("3"). */
  count?: number
  content: ReactNode
}

export interface SidePanelsProps {
  panels: readonly SidePanel[]
  /** The keys of the open panels. */
  open: readonly string[]
  onOpenChange: (open: string[]) => void
  className?: string
}

function Panel({
  panel,
  isOpen,
  toggle,
}: {
  panel: SidePanel
  isOpen: boolean
  toggle: () => void
}) {
  const { format } = useLiro()
  const contentId = useId()
  return (
    <section
      data-slot="side-panel"
      className="overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary"
    >
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={toggle}
          className={cn(
            BUTTON_RESET,
            'box-border flex w-full cursor-pointer items-center gap-2 px-4 pt-4 text-start text-primary hover:bg-surface-hover',
            // Open: an sm (12px) gap to the body; closed: md (16px) under the header.
            isOpen ? 'pb-3' : 'pb-4',
            FOCUS_RING,
            '-outline-offset-2',
          )}
        >
          <span className={cn('text-sm font-semibold', TEXT_DIRECTION)}>{panel.title}</span>
          {panel.count !== undefined && (
            <span className="text-xs text-secondary tabular-nums">
              {format.number(String(panel.count))}
            </span>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'ms-auto size-3.5 shrink-0 text-secondary transition-transform duration-(--liro-duration-base)',
              !isOpen && '-rotate-90 rtl:rotate-90',
            )}
          />
        </button>
      </h2>
      {/* The header's 12px gap above, md (16px) at the sides and below, aligned with the header's
          text; the content's own outer padding is taken off (PANEL_BODY). */}
      <div id={contentId} hidden={!isOpen} className={cn('box-border px-4 pt-0 pb-4', PANEL_BODY)}>
        {isOpen && panel.content}
      </div>
    </section>
  )
}

/** The panels beside a document, each collapsible to its header. */
export function SidePanels({ panels, open, onOpenChange, className }: SidePanelsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {panels.map((panel) => {
        const isOpen = open.includes(panel.key)
        return (
          <Panel
            key={panel.key}
            panel={panel}
            isOpen={isOpen}
            toggle={() => {
              onOpenChange(isOpen ? open.filter((key) => key !== panel.key) : [...open, panel.key])
            }}
          />
        )
      })}
    </div>
  )
}
