import { CopyPlus, Replace, SkipForward } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from './actions'
import { Button } from './button'
import { CheckboxField } from './checkbox-field'
import { Dialog } from './dialog'
import { FileIcon } from './file-entry-parts'
import {
  momentText,
  resolveConflicts,
  sizeText,
  type ConflictChoice,
  type ConflictResolution,
} from './file-browser-logic'
import { usePhone } from './use-phone'

/*
 * NameConflictDialog (one decision, one click): what happens to an uploaded (or moved, or copied)
 * file whose name is already taken in its folder.
 * - One conflict at a time, in the order the application gives them: a short question as the
 *   title ("Keep both files?"), the file's name bold under it, where the other one is, then
 *   the two files compact side by side ("In the folder" / "Being uploaded"): the thumbnail (the
 *   application's, or the file's kind as an icon), the size and when each changed through
 *   `format`, and who (`owner`), so the choice is made knowing what is replaced.
 * - The answers are the buttons, and one press answers: Keep both (the main action, last, and
 *   focused when the dialog opens: nothing is lost; the new name is the application's,
 *   `keepBothName`, said under the files), Replace, Skip. Replace may be unavailable with the
 *   application's reason (`replaceUnavailable`: "Signed documents cannot be replaced"), said in
 *   words under the files. The three answers stand in one row (stacked on a phone), "Cancel
 *   upload" under them, secondary.
 * - With more than one waiting, "Do this for the other 2 conflicts" answers the rest the same way
 *   (`resolveConflicts`; a conflict that cannot be replaced still waits for its own answer), and
 *   "Conflict 1 of 3" says where the user is.
 * Each answer is reported (`onResolve`); the application takes them off `conflicts`, and the
 * dialog closes when none wait.
 */

/** Facts of one of the two files: its size and when it changed, from the application. */
export interface ConflictFile {
  modified?: string
  size?: string
  sizeUnit?: string
  /** Who owns it (the file in the folder) or uploads it, in the application's words. */
  owner?: string
  /** A small picture of it (an image address, decorative); default the kind's icon. */
  thumbnail?: string
}

/** A file whose name is taken in its folder. */
export interface NameConflict {
  id: string
  /** The name both files have. */
  name: string
  /** The folder, in words ("Contracts / 2026"). */
  folder: string
  /** The name the new file takes with Keep both, from the application ("Ugovor (1).pdf"). */
  keepBothName: string
  /** The file already in the folder. */
  existing?: ConflictFile
  /** The file being uploaded. */
  incoming?: ConflictFile
  /** Replace cannot be chosen, and why, in the application's words. */
  replaceUnavailable?: string
}

export interface NameConflictDialogProps {
  /** The conflicts still waiting, in order; the dialog is open while there is one. */
  conflicts: readonly NameConflict[]
  /** How many conflicts this upload had in all, for "Conflict 2 of 3". Default: the waiting. */
  total?: number
  /** The answers of one press: this conflict's, or every waiting one's with "Do this for…". */
  onResolve: (answers: ConflictResolution[]) => void
  /** Cancel upload: the application stops the files still waiting. */
  onCancel: () => void
  /** "Do this for the other N conflicts" ticked at first. */
  defaultApplyToAll?: boolean
  /** 'phone' stacks the buttons; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

function FileFacts({
  label,
  name,
  file,
}: {
  label: string
  name: string
  file: ConflictFile | undefined
}) {
  const { format, messages } = useLiro()
  const facts: string[] = []
  if (file !== undefined) {
    const size = sizeText(format, messages, file)
    if (size !== null) facts.push(size)
    if (file.modified !== undefined) facts.push(momentText(format, file.modified))
  }
  return (
    <div
      data-slot="conflict-file"
      className="flex min-w-0 items-start gap-2 rounded-md bg-surface-sunken p-2"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface-raised"
      >
        {file?.thumbnail === undefined ? (
          <FileIcon entry={{ name, kind: 'file' }} />
        ) : (
          <img src={file.thumbnail} alt="" className="size-full object-cover" />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('text-xs font-medium text-secondary', TEXT_DIRECTION)}>{label}</span>
        <span className={cn('text-sm text-primary tabular-nums', TEXT_DIRECTION)}>
          {facts.map((fact, index) => (
            <span key={index} className="bidi-isolate">
              {index > 0 && ' · '}
              {fact}
            </span>
          ))}
          {facts.length === 0 && '—'}
        </span>
        {file?.owner !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{file.owner}</span>
        )}
      </span>
    </div>
  )
}

/** Keep both / Replace / Skip for a file whose name is taken: one press answers. */
export function NameConflictDialog(props: NameConflictDialogProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [applyToAll, setApplyToAll] = useState(props.defaultApplyToAll ?? false)
  const keepBoth = useRef<HTMLButtonElement>(null)
  const reasonId = useId()
  const conflict = props.conflicts[0]
  const waiting = props.conflicts.length
  const total = Math.max(props.total ?? waiting, waiting)
  const index = total - waiting + 1
  const answer = (choice: ConflictChoice) => {
    const { resolved } = resolveConflicts(props.conflicts, choice, applyToAll && waiting > 1)
    props.onResolve(resolved)
    // The next conflict is a question of its own.
    setApplyToAll(props.defaultApplyToAll ?? false)
    // The dialog stays open for the next one: its default answer takes the focus again.
    keepBoth.current?.focus()
  }
  let body: ReactNode = null
  if (conflict !== undefined) {
    body = (
      <div className="flex flex-col gap-3">
        {total > 1 && (
          <p role="status" className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['conflict.progress'](
              index,
              format.number(String(index)),
              total,
              format.number(String(total)),
            )}
          </p>
        )}
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
          {messages['conflict.message'](conflict.folder)}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <FileFacts
            label={messages['conflict.existing']}
            name={conflict.name}
            file={conflict.existing}
          />
          <FileFacts
            label={messages['conflict.incoming']}
            name={conflict.name}
            file={conflict.incoming}
          />
        </div>
        <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
          {messages['conflict.keepBothHint'](conflict.keepBothName)}
        </p>
        {conflict.replaceUnavailable !== undefined && (
          <p id={reasonId} className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>
            {messages['conflict.replaceUnavailable'](conflict.replaceUnavailable)}
          </p>
        )}
        {waiting > 1 && (
          <CheckboxField
            label={messages['conflict.applyToOthers'](
              waiting - 1,
              format.number(String(waiting - 1)),
            )}
            checked={applyToAll}
            onChange={setApplyToAll}
          />
        )}
      </div>
    )
  }
  const replace =
    conflict?.replaceUnavailable === undefined ? (
      <Button
        family="caution"
        icon={Replace}
        label={messages['conflict.replace']}
        onClick={() => {
          answer('replace')
        }}
      />
    ) : (
      <UnavailableAction
        family="caution"
        icon={Replace}
        label={messages['conflict.replace']}
        reason={conflict.replaceUnavailable}
        reasonId={reasonId}
      />
    )
  return (
    <Dialog
      open={conflict !== undefined}
      onOpenChange={(open) => {
        if (!open) props.onCancel()
      }}
      title={messages['conflict.title']}
      {...(conflict === undefined ? {} : { subject: <bdi dir="auto">{conflict.name}</bdi> })}
      initialFocus={keepBoth}
      actions={
        // The three answers in one row (stacked on a phone), the main one last; Cancel upload
        // under them, secondary. The buttons fill their cells: big, clear targets.
        <div data-slot="action-row" className="flex w-full flex-col gap-2">
          <div
            className={cn(
              'grid gap-2 *:w-full *:min-w-0 [&_button]:w-full [&_button]:justify-center',
              phone ? 'grid-cols-1' : 'grid-cols-3',
            )}
          >
            <Button
              family="neutral"
              icon={SkipForward}
              label={messages['conflict.skip']}
              onClick={() => {
                answer('skip')
              }}
            />
            {replace}
            <ButtonPrimitive
              ref={keepBoth}
              family="primary"
              emphasis="primary"
              onClick={() => {
                answer('keepBoth')
              }}
            >
              <CopyPlus aria-hidden="true" className="size-3.75 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['conflict.keepBoth']}</span>
            </ButtonPrimitive>
          </div>
          <div className={cn('flex', phone && '*:w-full *:justify-center')}>
            <Button intent="cancel" label={messages['conflict.cancel']} onClick={props.onCancel} />
          </div>
        </div>
      }
    >
      {body}
    </Dialog>
  )
}
