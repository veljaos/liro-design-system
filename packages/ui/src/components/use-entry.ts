import { useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'

/*
 * Typed entry for the number, money and date fields (BUILD-PLAN P2.3): the user types freely, and
 * the text is read when the user leaves the field or presses Enter. Owner's decision
 * (2026-09-28): unreadable text stays in the field, the value is null (never 0), and the field
 * reports it through `onValidityChange` and shows its own message.
 */

/** What reading the typed text gives. */
export interface Entry {
  /** The value read, or null when the text is empty or cannot be read. */
  value: string | null
  /** False when the text is not empty and cannot be read. */
  valid: boolean
}

/** The value props every typed field takes. */
export interface EntryProps {
  /** Controlled value, or null for empty. */
  value?: string | null
  /** Uncontrolled initial value. */
  defaultValue?: string | null
  /** Called when the value changes: on leaving the field, on Enter, or on a pick. */
  onChange?: (value: string | null) => void
  /**
   * Called when the text becomes unreadable (false) or readable again (true). While it is false
   * the value is null and the field shows its own error; a form should not save.
   */
  onValidityChange?: (valid: boolean) => void
}

/**
 * The value, the text shown and its validity. `read` turns text into a value; `show` turns a
 * value into text. A new value from the application (not the one the field just reported)
 * replaces any text being typed.
 */
export function useEntry(
  props: EntryProps,
  read: (text: string) => Entry,
  show: (value: string | null) => string,
) {
  const [inner, setInner] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? inner : props.value
  // The text while it differs from the value's own text (being typed, or unreadable).
  const [text, setText] = useState<string | null>(null)
  const [valid, setValid] = useState(true)
  const [reported, setReported] = useState(value)
  const [seen, setSeen] = useState(value)

  const changeValidity = (next: boolean) => {
    if (next !== valid) {
      setValid(next)
      props.onValidityChange?.(next)
    }
  }

  if (seen !== value) {
    setSeen(value)
    if (value !== reported) {
      setReported(value)
      setText(null)
      changeValidity(true)
    }
  }

  /** Sets a value chosen other than by typing (a calendar day, a preset). */
  const pick = (next: string | null) => {
    setText(null)
    changeValidity(true)
    if (next !== value) {
      setInner(next)
      setReported(next)
      props.onChange?.(next)
    }
  }

  /** Reads the typed text, if any. */
  const commit = () => {
    if (text === null) return
    const entry = read(text)
    changeValidity(entry.valid)
    if (entry.valid) setText(null)
    if (entry.value !== value) {
      setInner(entry.value)
      setReported(entry.value)
      props.onChange?.(entry.value)
    }
  }

  return { value, valid, text: text ?? show(value), setText, commit, pick }
}

/** The error a typed field shows: the application's, else its own for unreadable text. */
export function entryError(error: ReactNode, valid: boolean, message: string): ReactNode {
  if (error !== undefined && error !== null && error !== false) return error
  return valid ? undefined : message
}

/** The attributes of a typing area: the text, and reading it on Enter and on leaving. */
export function entryAttributes(
  entry: ReturnType<typeof useEntry>,
  props: { placeholder?: string; onBlur?: (event: FocusEvent<HTMLInputElement>) => void },
  readOnly: boolean,
) {
  return {
    type: 'text',
    autoComplete: 'off',
    value: entry.text,
    ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
    onChange: (event: { target: { value: string } }) => {
      if (!readOnly) entry.setText(event.target.value)
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') entry.commit()
    },
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      entry.commit()
      props.onBlur?.(event)
    },
  }
}
