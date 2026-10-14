import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import {
  ChangeConfirmDialog,
  changeConfirmLabel,
  initialNotify,
  toggleNotify,
  type NotifyOption,
} from './change-confirm-dialog'
import { DialogHeading, dialogHeaderClass } from './dialog'

const OPTIONS: NotifyOption[] = [
  { id: 'patient', label: 'Notify the patient', defaultChecked: true },
  { id: 'doctor', label: 'Notify the doctor' },
  { id: 'nurse', label: 'Notify the nurse', defaultChecked: false },
]

function render(node: ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('initialNotify', () => {
  it('checks only what the application checks; nothing by default', () => {
    expect(initialNotify(OPTIONS)).toEqual(['patient'])
    expect(initialNotify([{ id: 'a', label: 'A' }])).toEqual([])
    expect(initialNotify(undefined)).toEqual([])
  })
})

describe('toggleNotify', () => {
  it('checks and unchecks one, keeping the options’ order', () => {
    expect(toggleNotify(OPTIONS, ['patient'], 'nurse', true)).toEqual(['patient', 'nurse'])
    expect(toggleNotify(OPTIONS, ['nurse'], 'patient', true)).toEqual(['patient', 'nurse'])
    expect(toggleNotify(OPTIONS, ['patient', 'nurse'], 'patient', false)).toEqual(['nurse'])
  })
})

describe('changeConfirmLabel', () => {
  it('says "Save and notify" while a message is checked, unless the application names it', () => {
    expect(changeConfirmLabel(messagesEn, 0, undefined)).toBe('Save')
    expect(changeConfirmLabel(messagesEn, 2, undefined)).toBe('Save and notify')
    expect(changeConfirmLabel(messagesEn, 2, 'Save plan')).toBe('Save plan')
  })
})

describe('ChangeConfirmDialog', () => {
  it('renders nothing while closed', () => {
    const html = render(
      <ChangeConfirmDialog
        title="Move appointment"
        changes={[{ label: 'Time', from: '11:30', to: '12:00' }]}
        onConfirm={() => undefined}
      />,
    )
    expect(html).not.toContain('Move appointment')
  })
})

describe('DialogHeading', () => {
  it('puts the record bold on its own line after the action, apart in the name', () => {
    const html = renderToStaticMarkup(<DialogHeading title="Correct" subject="Nenad Ilić, Wed 7" />)
    expect(html).toMatch(
      /<span[^>]*>Correct<\/span> <span data-slot="dialog-subject" class="[^"]*font-bold[^"]*">Nenad Ilić, Wed 7<\/span>/,
    )
  })

  it('is the title alone without a subject', () => {
    expect(renderToStaticMarkup(<DialogHeading title="Rename the report" />)).toBe(
      'Rename the report',
    )
    expect(dialogHeaderClass(undefined)).toBe('')
    expect(dialogHeaderClass('Nenad Ilić')).toBe('items-start')
  })
})
