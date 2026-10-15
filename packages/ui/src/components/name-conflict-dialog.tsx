import { ArrowRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { CheckboxField } from './checkbox-field'
import { Dialog } from './dialog'
import {
  momentText,
  resolveConflicts,
  sizeText,
  type ConflictChoice,
  type ConflictResolution,
} from './file-browser-logic'
import { RadioGroupField } from './radio-group-field'

/*
 * NameConflictDialog (BUILD-PLAN P5.43): "A file with this name exists" — what happens to an
 * uploaded (or moved, or copied) file whose name is already taken in its folder.
 * - One conflict at a time, in the order the application gives them: the question as the title,
 *   the file's name bold under it (D22), the folder in words, the two files side by side ("In the
 *   folder" / "Being uploaded": size and when each changed, through `format`, and who owns the
 *   one in the folder) so the choice is made knowing what is replaced.
 * - Three answers as radios: Replace, Keep both ("The new file is saved as Ugovor (1).pdf": the
 *   new name is the application's, `keepBothName`), Skip. Replace may be unavailable with the
 *   application's reason (`replaceUnavailable`: "Signed documents cannot be replaced").
 * - With more than one waiting, "Apply to all 3 conflicts" answers the rest the same way
 *   (`resolveConflicts`; a conflict that cannot be replaced still waits for its own answer), and
 *   "Conflict 1 of 3" says where the user is.
 * - Cancel upload / Continue (main last). Each Continue reports its answers (`onResolve`); the
 *   application takes them off `conflicts`, and the dialog closes when none wait.
 */

/** Facts of one of the two files: its size and when it changed, from the application. */
export interface ConflictFile {
  modified?: string
  size?: string
  sizeUnit?: string
  owner?: string
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
  /** The answers given with Continue: one, or every waiting one with "Apply to all". */
  onResolve: (answers: ConflictResolution[]) => void
  /** Cancel upload: the application stops the files still waiting. */
  onCancel: () => void
  /** The answer chosen at first. Default 'keepBoth' (nothing is lost). */
  defaultChoice?: ConflictChoice
  /** "Apply to all" ticked at first. */
  defaultApplyToAll?: boolean
}

function FileFacts({ label, file }: { label: string; file: ConflictFile | undefined }) {
  const { format, messages } = useLiro()
  const facts: string[] = []
  if (file !== undefined) {
    const size = sizeText(format, messages, file)
    if (size !== null) facts.push(size)
    if (file.modified !== undefined) facts.push(momentText(format, file.modified))
  }
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-md bg-surface-sunken px-3 py-2">
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
    </div>
  )
}

/** Replace / Keep both / Skip for a file whose name is taken, with "Apply to all". */
export function NameConflictDialog(props: NameConflictDialogProps) {
  const { messages, format } = useLiro()
  const [choice, setChoice] = useState<ConflictChoice>(props.defaultChoice ?? 'keepBoth')
  const [applyToAll, setApplyToAll] = useState(props.defaultApplyToAll ?? false)
  const conflict = props.conflicts[0]
  const waiting = props.conflicts.length
  const total = Math.max(props.total ?? waiting, waiting)
  const index = total - waiting + 1
  const replaceBlocked = conflict?.replaceUnavailable !== undefined
  const chosen: ConflictChoice = replaceBlocked && choice === 'replace' ? 'keepBoth' : choice
  const next = () => {
    const { resolved } = resolveConflicts(props.conflicts, chosen, applyToAll && waiting > 1)
    props.onResolve(resolved)
    // The next conflict is a question of its own.
    setChoice(props.defaultChoice ?? 'keepBoth')
    setApplyToAll(false)
  }
  let body: ReactNode = null
  if (conflict !== undefined) {
    body = (
      <div className="flex flex-col gap-4">
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
        <div className="flex flex-wrap items-stretch gap-2">
          <FileFacts label={messages['conflict.existing']} file={conflict.existing} />
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 self-center text-secondary rtl:-scale-x-100"
          />
          <FileFacts label={messages['conflict.incoming']} file={conflict.incoming} />
        </div>
        <RadioGroupField
          label={messages['conflict.choice']}
          value={chosen}
          onChange={(value) => {
            setChoice(value as ConflictChoice)
          }}
          options={[
            {
              value: 'replace',
              label: messages['conflict.replace'],
              description: conflict.replaceUnavailable ?? messages['conflict.replaceHint'],
              disabled: replaceBlocked,
            },
            {
              value: 'keepBoth',
              label: messages['conflict.keepBoth'],
              description: messages['conflict.keepBothHint'](conflict.keepBothName),
            },
            {
              value: 'skip',
              label: messages['conflict.skip'],
              description: messages['conflict.skipHint'],
            },
          ]}
        />
        {waiting > 1 && (
          <CheckboxField
            label={messages['conflict.applyToAll'](waiting, format.number(String(waiting)))}
            checked={applyToAll}
            onChange={setApplyToAll}
          />
        )}
      </div>
    )
  }
  return (
    <Dialog
      open={conflict !== undefined}
      onOpenChange={(open) => {
        if (!open) props.onCancel()
      }}
      title={messages['conflict.title']}
      {...(conflict === undefined ? {} : { subject: <bdi dir="auto">{conflict.name}</bdi> })}
      actions={
        <>
          <Button intent="cancel" label={messages['conflict.cancel']} onClick={props.onCancel} />
          <Button intent="next" label={messages['conflict.continue']} onClick={next} />
        </>
      }
    >
      {body}
    </Dialog>
  )
}
