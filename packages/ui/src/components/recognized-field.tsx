import { Pencil, ScanSearch, TriangleAlert } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * RecognizedField (BUILD-PLAN P5.31): a field whose value the application read from a document
 * (a recognised invoice, a scanned receipt), with how sure the reading is and where it was read.
 * It wraps any field of the library: `children` renders the field and passes the note's id to
 * its `describedBy`, so the note is read with the field.
 * - Under the field, one line in xs: the application's confidence in its own words ("Confidence:
 *   98%"), text.secondary. The component never judges a figure: the application says which
 *   readings are uncertain (`low`), and those are marked with a TriangleAlert and words
 *   ("Low confidence", status.warning.fg, weight 500) before the confidence — never by colour
 *   alone. Once the user changed the value (`changed`) the reading no longer applies: "Changed by
 *   you" with a Pencil, text.secondary.
 * - "Show where it was read" (`onShowSource`): a link-styled button (text.link, a ScanSearch
 *   icon, 24px high) at the end of the line; the application highlights the region on its
 *   PageViewer. While the region is shown (`sourceShown`) the button is pressed (`aria-pressed`)
 *   and takes the neutral selection (surface.selected), never more blue (D17).
 */

export interface RecognizedFieldProps {
  /** The field, given the id of the note under it for its `describedBy`. */
  children: (describedBy: string) => ReactNode
  /** How sure the reading is, in the application's words ("98%", "From the QR code"). */
  confidence?: string
  /** The application marks this reading as uncertain: an icon and words, never colour alone. */
  low?: boolean
  /** The words for an uncertain reading. Default `messages['recognized.low']`. */
  lowLabel?: string
  /** The user changed the value: "Changed by you" in place of the confidence. */
  changed?: boolean
  /** Shows where the value was read (the application highlights it on the page). */
  onShowSource?: () => void
  /** The value's region is shown now: the button is pressed. */
  sourceShown?: boolean
  className?: string
}

/** A field with the application's confidence in its reading and "Show where it was read". */
export function RecognizedField(props: RecognizedFieldProps) {
  const { messages } = useLiro()
  const noteId = useId()
  const changed = props.changed === true
  const low = !changed && props.low === true
  const confidence =
    props.confidence === undefined ? null : messages['recognized.confidence'](props.confidence)
  return (
    <div
      data-slot="recognized-field"
      data-low={low ? 'true' : undefined}
      className={cn('flex min-w-0 flex-col gap-1', props.className)}
    >
      {props.children(noteId)}
      <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1">
        <p
          id={noteId}
          className={cn(
            'm-0 flex min-w-0 items-start gap-1 text-xs leading-tight',
            low ? 'text-status-warning-fg' : 'text-secondary',
          )}
        >
          {changed ? (
            <>
              <Pencil aria-hidden="true" className="mt-px size-3 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['recognized.changed']}</span>
            </>
          ) : low ? (
            <>
              <TriangleAlert aria-hidden="true" className="mt-px size-3 shrink-0" />
              <span className={TEXT_DIRECTION}>
                <span className="font-medium">{props.lowLabel ?? messages['recognized.low']}</span>
                {confidence !== null && (
                  <span className="text-secondary">
                    {' · '}
                    {confidence}
                  </span>
                )}
              </span>
            </>
          ) : (
            confidence !== null && <span className={TEXT_DIRECTION}>{confidence}</span>
          )}
        </p>
        {props.onShowSource !== undefined && (
          <button
            type="button"
            aria-pressed={props.sourceShown === true}
            onClick={props.onShowSource}
            className={cn(
              BUTTON_RESET,
              FOCUS_RING,
              'inline-flex min-h-6 cursor-pointer items-center gap-1 rounded-sm px-1 text-xs text-link hover:underline',
              props.sourceShown === true && 'bg-surface-selected',
            )}
          >
            <ScanSearch aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{messages['recognized.showSource']}</span>
          </button>
        )}
      </div>
    </div>
  )
}
