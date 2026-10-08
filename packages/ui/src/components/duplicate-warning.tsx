import { ExternalLink, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { buttonClassName, BUTTON_SHAPES } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Alert } from './alert'
import { Button } from './button'
import { ReasonConfirmDialog, type ConfirmAnswer, type ConfirmReason } from './confirm-dialog'
import { RelatedDocuments, type RelatedDocument } from './panel-lists'

/*
 * DuplicateWarning (BUILD-PLAN P5.19): the Core found records that look like the one being
 * created — the same tax number, or the same name — and says so before anything is saved, in the
 * record form and in an import's preview.
 * - A warning Alert (the tone's background, icon and title): the title and text from the
 *   application ("A customer with tax number 104987265 exists"), then the existing records as
 *   links — kind, number or name, state — through the provider's linkComponent (RelatedDocuments:
 *   P4.9 rule 7, a reference is a link with its kind and state).
 * - Two choices: "Open existing" (with one match, a link to it drawn as a button) and "Create
 *   anyway" (the main choice last). When the application asks for a reason (`reasonRequired`), Create
 *   anyway opens a ReasonConfirmDialog first (its list of reasons, or a written one) and reports
 *   the answer.
 * The DS finds no duplicates itself: the matches are the Core's.
 */

export interface DuplicateWarningProps {
  /** The title; default `messages['duplicate.title']` ("This may be a duplicate"). */
  title?: string
  /** Why the Core thinks so, in its words ("Same tax number: 104987265."). */
  message?: ReactNode
  /** The existing records, each a link with its kind, number or name, and state. */
  matches: readonly RelatedDocument[]
  /** Go on and create the new record. With `reasonRequired`, called with the answer. */
  onCreateAnyway?: (answer?: ConfirmAnswer) => void | Promise<void>
  /** The Create anyway button's text; default `messages['duplicate.createAnyway']`. */
  createAnywayLabel?: string
  /** The application asks why a duplicate is created (ReasonConfirmDialog). */
  reasonRequired?: boolean
  /** The reasons to choose from (the Core's list); without them the reason is written. */
  reasons?: readonly ConfirmReason[]
  /** The reason dialog's message, from the application. */
  reasonMessage?: ReactNode
  className?: string
}

/** A warning that the record may already exist, with links to it and the two choices. */
export function DuplicateWarning(props: DuplicateWarningProps) {
  const { messages, linkComponent: Link } = useLiro()
  const [asking, setAsking] = useState(false)
  const single = props.matches.length === 1 ? props.matches[0] : undefined
  const createLabel = props.createAnywayLabel ?? messages['duplicate.createAnyway']
  return (
    <Alert
      tone="warning"
      title={props.title ?? messages['duplicate.title']}
      {...(props.className === undefined ? {} : { className: props.className })}
    >
      <div data-slot="duplicate-warning" className="flex flex-col gap-3">
        {props.message !== undefined && <div className={TEXT_DIRECTION}>{props.message}</div>}
        <RelatedDocuments items={props.matches} label={messages['duplicate.existing']} />
        {(single !== undefined || props.onCreateAnyway !== undefined) && (
          <div className="flex flex-wrap items-center gap-2">
            {single !== undefined && (
              <Link
                href={single.href}
                className={cn(
                  buttonClassName({ family: 'neutral', emphasis: 'secondary', shape: 'text' }),
                  'no-underline visited:text-family-neutral-fg hover:bg-surface-hover hover:text-family-neutral-fg-hover',
                )}
              >
                <ExternalLink aria-hidden="true" className={BUTTON_SHAPES.text.icon} />
                <span className={TEXT_DIRECTION}>{messages['duplicate.openExisting']}</span>
              </Link>
            )}
            {props.onCreateAnyway !== undefined && (
              <Button
                family="caution"
                icon={Plus}
                emphasis="secondary"
                label={createLabel}
                onClick={() => {
                  if (props.reasonRequired === true) setAsking(true)
                  else void props.onCreateAnyway?.()
                }}
              />
            )}
          </div>
        )}
      </div>
      {props.reasonRequired === true && props.onCreateAnyway !== undefined && (
        <ReasonConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          family="caution"
          actionIcon={Plus}
          title={messages['duplicate.reasonTitle']}
          {...(props.reasonMessage === undefined ? {} : { message: props.reasonMessage })}
          confirmLabel={createLabel}
          {...(props.reasons === undefined ? {} : { reasons: props.reasons })}
          onConfirm={(answer) => props.onCreateAnyway?.(answer)}
        />
      )}
    </Alert>
  )
}
