import { useEffect, useId, useState, type SubmitEvent } from 'react'
import { Dialog } from '../components/dialog'
import { TextField } from '../components/text-field'
import { TEXT_DIRECTION } from '../primitives/classes'
import { ButtonPrimitive } from '../primitives/button'
import { useLiro } from '../provider/liro-provider'
import { linkFromInput } from './rich-text-logic'

/*
 * The link dialog of RichTextField: one address field (left to right), Apply, and Remove
 * link when the text already is one. The address is completed and checked by `linkFromInput`
 * ("liro.rs" → "https://liro.rs", "ana@firma.rs" → "mailto:…"); anything but http(s) and mailto is
 * refused with `richText.linkInvalid`. Enter applies. A dialog: one action with one outcome.
 */

export interface LinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The address of the link at the caret, when there is one. */
  current: string | null
  onApply: (href: string, typed: string) => void
  onRemove: () => void
}

/** The dialog that sets, changes or removes a link. */
export function LinkDialog(props: LinkDialogProps) {
  const { messages } = useLiro()
  const formId = useId()
  // The form is drawn anew each time the dialog opens, so it starts from the current address.
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={messages['richText.link']}
      actions={
        <>
          {props.current !== null && (
            <ButtonPrimitive
              family="destructive"
              emphasis="menu"
              className="me-auto"
              onClick={() => {
                props.onRemove()
                props.onOpenChange(false)
              }}
            >
              <span className={TEXT_DIRECTION}>{messages['richText.linkRemove']}</span>
            </ButtonPrimitive>
          )}
          <ButtonPrimitive
            family="neutral"
            emphasis="secondary"
            onClick={() => {
              props.onOpenChange(false)
            }}
          >
            <span className={TEXT_DIRECTION}>{messages['dialog.cancel']}</span>
          </ButtonPrimitive>
          <ButtonPrimitive family="primary" emphasis="primary" type="submit" form={formId}>
            <span className={TEXT_DIRECTION}>{messages['richText.linkApply']}</span>
          </ButtonPrimitive>
        </>
      }
    >
      {props.open && <LinkForm {...props} formId={formId} />}
    </Dialog>
  )
}

function LinkForm(props: LinkDialogProps & { formId: string }) {
  const { messages } = useLiro()
  const [text, setText] = useState(props.current ?? '')
  const [invalid, setInvalid] = useState(false)
  const inputId = `${props.formId}-address`
  // The address field takes the focus (the dialog would give it to its close button).
  useEffect(() => {
    document.getElementById(inputId)?.focus()
  }, [inputId])
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const href = linkFromInput(text)
    if (href === null) {
      setInvalid(true)
      return
    }
    props.onApply(href, text.trim())
    props.onOpenChange(false)
  }
  return (
    <form id={props.formId} noValidate onSubmit={submit}>
      <TextField
        id={inputId}
        label={messages['richText.linkAddress']}
        description={messages['richText.linkHint']}
        type="url"
        autoComplete="url"
        value={text}
        onChange={(next) => {
          setText(next)
          setInvalid(false)
        }}
        {...(invalid ? { error: messages['richText.linkInvalid'] } : {})}
      />
    </form>
  )
}
