import { useId, type ReactNode } from 'react'
import { Checkbox } from '../primitives/checkbox'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { RadioGroup, RadioGroupItem } from '../primitives/radio-group'
import { useLiro } from '../provider/liro-provider'

/*
 * CandidateList (P5.23, the owner's review of the bank statement): the records the application
 * proposes for one decision, best first, each with the reason it is proposed, to choose one or
 * several — the open items a payment may close, the existing records a new one may duplicate,
 * the people a task may go to. The order, the reasons and what is preselected are the
 * application's; the list only shows them and reports the choice. It computes nothing (D4): a
 * figure arrives written (MoneyText).
 * - A row: the checkbox (several) or the radio (one) at the start; the title (sm medium), the
 *   subtitle (xs text.secondary), the reason (xs medium text.secondary, words, never colour); the
 *   figure at the end (sm medium, tabular, never wrapping). Rows 12px by 12px, divided by
 *   border.subtle lines, a line above the first and below the last (P4.9 rule 4: rows, never
 *   cards).
 * - The chosen rows are the neutral selection (D17): surface.selected with the 3px border.selected
 *   bar at the start; only the control is blue.
 * - The whole row is the control's label, so a press anywhere on it chooses; the keys are the
 *   native ones (Tab and Space for checkboxes, the arrows inside a radio group).
 */

/** One proposed record. */
export interface Candidate {
  id: string
  /** What it is ("F-2026-0402"), from the application. */
  title: ReactNode
  /** Its name as plain text, for assistive technology ("F-2026-0402, Drina Prevoz d.o.o."). */
  label: string
  /** A second line ("Drina Prevoz d.o.o. · due 08.10.2026."). */
  subtitle?: ReactNode
  /** Why it is proposed, in words ("Exact: amount and reference"). */
  reason?: ReactNode
  /** The one figure the choice depends on (an open amount through MoneyText). */
  figure?: ReactNode
}

export interface CandidateListProps {
  /** Names the group for assistive technology ("Open items to close"). */
  label: string
  /** The candidates, best first, in the application's order. */
  candidates: readonly Candidate[]
  /** The chosen ids. */
  selected: readonly string[]
  /** Reports the chosen ids, in the candidates' order. */
  onSelectedChange: (ids: string[]) => void
  /** Several may be chosen (checkboxes); false: one (radios). Default true. */
  multiple?: boolean
  /** Shown instead of the rows when there are none. Default: `messages['candidates.empty']`. */
  empty?: ReactNode
  className?: string
}

/**
 * The choice after one candidate is turned on or off: with `multiple` the others stay, otherwise
 * it alone; the ids in the candidates' order, unknown ids dropped.
 */
export function chooseCandidate(
  candidates: readonly { id: string }[],
  selected: readonly string[],
  id: string,
  on: boolean,
  multiple: boolean,
): string[] {
  const chosen = new Set(multiple ? selected : [])
  if (on) chosen.add(id)
  else chosen.delete(id)
  return candidates.map((each) => each.id).filter((each) => chosen.has(each))
}

function Body({ candidate }: { candidate: Candidate }) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {candidate.title}
        </span>
        {candidate.subtitle !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{candidate.subtitle}</span>
        )}
        {candidate.reason !== undefined && (
          <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>
            {candidate.reason}
          </span>
        )}
      </span>
      {candidate.figure !== undefined && (
        <span className="shrink-0 text-sm font-medium whitespace-nowrap text-primary tabular-nums">
          {candidate.figure}
        </span>
      )}
    </>
  )
}

const ROW = 'relative flex items-start gap-3 border-0 border-b border-solid border-subtle p-3'
const CHOSEN =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
const LABEL = 'flex min-w-0 flex-1 cursor-pointer items-start gap-4'

/** The records proposed for one decision, best first, each with its reason. */
export function CandidateList(props: CandidateListProps) {
  const { messages } = useLiro()
  const base = useId()
  const multiple = props.multiple ?? true
  const listClass = cn(
    'm-0 list-none border-0 border-t border-solid border-subtle p-0 font-sans',
    props.className,
  )

  if (props.candidates.length === 0) {
    return (
      <div data-slot="candidate-list" className={props.className}>
        {props.empty ?? (
          <p className={cn('m-0 py-3 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['candidates.empty']}
          </p>
        )}
      </div>
    )
  }

  const change = (id: string, on: boolean) => {
    props.onSelectedChange(chooseCandidate(props.candidates, props.selected, id, on, multiple))
  }

  if (!multiple) {
    return (
      <RadioGroup
        data-slot="candidate-list"
        aria-label={props.label}
        value={props.selected[0] ?? ''}
        onValueChange={(id) => {
          change(id, true)
        }}
        className={cn(listClass, 'gap-0')}
      >
        {props.candidates.map((candidate, index) => {
          const id = `${base}-${String(index)}`
          const chosen = props.selected.includes(candidate.id)
          return (
            <div key={candidate.id} className={cn(ROW, chosen && CHOSEN)}>
              <RadioGroupItem id={id} value={candidate.id} aria-label={candidate.label} />
              <label htmlFor={id} className={LABEL}>
                <Body candidate={candidate} />
              </label>
            </div>
          )
        })}
      </RadioGroup>
    )
  }

  return (
    <ul data-slot="candidate-list" aria-label={props.label} className={listClass}>
      {props.candidates.map((candidate, index) => {
        const id = `${base}-${String(index)}`
        const chosen = props.selected.includes(candidate.id)
        return (
          <li key={candidate.id} className={cn(ROW, chosen && CHOSEN)}>
            <Checkbox
              id={id}
              checked={chosen}
              onCheckedChange={(value) => {
                change(candidate.id, value === true)
              }}
              aria-label={candidate.label}
            />
            <label htmlFor={id} className={LABEL}>
              <Body candidate={candidate} />
            </label>
          </li>
        )
      })}
    </ul>
  )
}
