import { useState, type SyntheticEvent, type ReactNode } from 'react'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { Dialog } from './dialog'
import { TextField } from './text-field'
import type { IconComponent } from './intents'

/*
 * FileNameDialog (BUILD-PLAN P5.43): one name for a new folder, or a new name for a file or
 * folder ("Rename", the item bold under the title, D22). One field; Enter or the button submits.
 * An empty name says so; every other check is the application's: `onSubmit` returns the error in
 * its words ("A folder with this name already exists here."), or a promise of it, and the dialog
 * stays open with the error under the field.
 */

export interface FileNameDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The action, from the application ("New folder", "Rename"). */
  title: string
  /** The item renamed, bold under the title. */
  subject?: ReactNode
  /** The field's label. Default `messages['files.nameLabel']`. */
  label?: string
  /** The name at first (the current name when renaming). */
  defaultValue?: string
  /** The button's text ("Create", "Rename"). */
  confirmLabel: string
  /** The button's icon. */
  confirmIcon: IconComponent
  /**
   * Saves the name. Returns undefined when done (the dialog closes), or the application's error
   * (the dialog stays, the error under the field); a promise keeps the dialog busy meanwhile.
   */
  onSubmit: (name: string) => string | undefined | Promise<string | undefined>
  /** An error shown at first (the application restores the dialog as it was). */
  defaultError?: string
}

/** One name: a new folder, or renaming a file or folder. */
export function FileNameDialog(props: FileNameDialogProps) {
  const { messages } = useLiro()
  const [name, setName] = useState(props.defaultValue ?? '')
  const [error, setError] = useState<string | null>(props.defaultError ?? null)
  const [busy, setBusy] = useState(false)
  const close = () => props.onOpenChange?.(false)
  const settle = (result: string | undefined) => {
    if (typeof result === 'string') {
      setError(result)
      return
    }
    setError(null)
    close()
  }
  const submit = (event?: SyntheticEvent) => {
    event?.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setError(messages['files.nameRequired'])
      return
    }
    const result = props.onSubmit(trimmed)
    if (!(result instanceof Promise)) {
      settle(result)
      return
    }
    setBusy(true)
    result.then(
      (answer) => {
        setBusy(false)
        settle(answer)
      },
      () => {
        setBusy(false)
      },
    )
  }
  return (
    <Dialog
      {...(props.open === undefined ? {} : { open: props.open })}
      {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
      title={props.title}
      {...(props.subject === undefined ? {} : { subject: props.subject })}
      dismissible={!busy}
      actions={
        <>
          <Button
            intent="cancel"
            label={messages['dialog.cancel']}
            disabled={busy}
            onClick={close}
          />
          <Button
            family="primary"
            icon={props.confirmIcon}
            emphasis="primary"
            label={props.confirmLabel}
            disabled={busy}
            onClick={() => {
              submit()
            }}
          />
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <TextField
          label={props.label ?? messages['files.nameLabel']}
          value={name}
          onChange={(value) => {
            setName(value)
            setError(null)
          }}
          required
          {...(error === null ? {} : { error })}
          readOnly={busy}
        />
      </form>
    </Dialog>
  )
}
