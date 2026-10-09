import { Eye, EyeOff } from 'lucide-react'
import {
  useId,
  useState,
  type ChangeEvent,
  type FocusEventHandler,
  type KeyboardEvent,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useLiro } from '../provider/liro-provider'
import { controlAttributes, Field, FieldMessage, fieldProps, type FieldBaseProps } from './field'

/*
 * PasswordField (BUILD-PLAN P5.6): a password with its show / hide toggle.
 * - Paste is always allowed (WCAG 3.3.8: a password manager pastes); nothing blocks it.
 * - The toggle is a 28px subtle button at the field's end, inside its frame (the target is 28px,
 *   above the 24px minimum), named "Show password" (`messages['password.show']`) with
 *   `aria-pressed`: pressed means the text is shown. The icon says the same (Eye, EyeOff). It
 *   keeps the caret where it was.
 * - `autoComplete` 'current-password' (sign in, the default) or 'new-password' (a new password),
 *   so password managers fill or offer to generate.
 * - A note "Caps Lock is on" under the field while it is on and the field has the focus
 *   (`messages['password.capsLock']`), a polite status.
 * - The text is written left to right in every language: a password is a code.
 */

export interface PasswordFieldProps extends FieldBaseProps {
  /** Controlled value. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  onChange?: (value: string) => void
  onBlur?: FocusEventHandler<HTMLInputElement>
  /** 'current-password' (default) to sign in; 'new-password' when choosing one. */
  autoComplete?: 'current-password' | 'new-password'
  /** The form field name. */
  name?: string
  /** Shown while the field is empty. From the application. */
  placeholder?: string
}

/** A password field: paste allowed, show and hide, the Caps Lock note. */
export function PasswordField(props: PasswordFieldProps) {
  const { messages, direction } = useLiro()
  const [shown, setShown] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const capsId = useId()
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState('CapsLock'))
  }
  return (
    <Field
      {...fieldProps({
        ...props,
        ...(capsLock ? { describedBy: [props.describedBy, capsId].filter(Boolean).join(' ') } : {}),
      })}
    >
      {(control) => (
        <>
          <div className="relative">
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              type={shown ? 'text' : 'password'}
              autoComplete={props.autoComplete ?? 'current-password'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              {...(props.value === undefined ? {} : { value: props.value })}
              {...(props.defaultValue === undefined ? {} : { defaultValue: props.defaultValue })}
              {...(props.name === undefined ? {} : { name: props.name })}
              {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                props.onChange?.(event.target.value)
              }
              onKeyDown={readCaps}
              onKeyUp={readCaps}
              onBlur={(event) => {
                setCapsLock(false)
                props.onBlur?.(event)
              }}
              // Room for the toggle at the end: 28px and 4px on each side of it.
              className={cn(
                'pe-10',
                direction === 'rtl' && 'text-end',
                control.readOnly && READ_ONLY,
              )}
            />
            {!control.readOnly && (
              <ButtonPrimitive
                family="neutral"
                emphasis="menu"
                shape="compact"
                aria-label={messages['password.show']}
                aria-pressed={shown}
                aria-controls={control.id}
                title={messages['password.show']}
                disabled={control.disabled}
                // Keeps the focus (and the caret) in the field when pressed with a pointer.
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onClick={() => {
                  setShown((value) => !value)
                }}
                className="absolute end-1 top-1 disabled:bg-transparent"
              >
                {shown ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </ButtonPrimitive>
            )}
          </div>
          {/* Always in the page, so the note is announced when it appears. */}
          <div role="status">
            {capsLock && (
              <FieldMessage id={capsId} tone="hint" className="mt-[5px]">
                {messages['password.capsLock']}
              </FieldMessage>
            )}
          </div>
        </>
      )}
    </Field>
  )
}
