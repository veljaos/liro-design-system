import type { Meta, StoryObj } from '@storybook/react-vite'
import { Send } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { DefinedForm, type DefinedFormHandle } from './defined-form'
import type { DefinedValues } from './defined-form-logic'
import {
  ARABIC_REQUEST,
  FILLED,
  JAPANESE_REQUEST,
  LONG,
  REQUEST,
  SERBIAN,
  WITH_CUSTOM,
  WITH_EXTRAS,
} from './defined-form-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Forms/DefinedForm',
  component: DefinedForm,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a form drawn from the application’s field definitions — the JSON it ' +
          'keeps for a document type, a report to an authority or a request: sections of fields, ' +
          'each with its type (text, long text, e-mail, number, amount, date, select, several ' +
          'choices, radio, checkbox, switch, or a custom field the application draws), label, ' +
          'hint, options, whether it is required, and conditions (`visibleWhen`, `requiredWhen`: ' +
          '`equals`, `notEquals`, `oneOf`, `filled`, combined with `all`, `any`, `not`). The form ' +
          'is the library’s own FormSection cards and fields, so it looks and works as any ' +
          'hand-written form; a hidden field keeps its value but is not submitted. Missing ' +
          'values are said in words under their fields when `showMissing` is set or after the ' +
          'handle’s `check()`, which also focuses the first problem and returns the values to ' +
          'submit; the application’s own checks come back as `errors`. `readOnly` shows a ' +
          'numbered or sent document’s data as text; `lang` marks definitions written in another ' +
          'language. The pure rules (`definedFormState`, `definedConditionHolds`, ' +
          '`definedFormProblems` for the application’s tests) are exported.\n\n' +
          '**When to use:** forms whose fields the application defines as data — document ' +
          'templates (P5.66), reports to authorities (P5.87), configurable requests. **When ' +
          'not:** a form designed once for one screen (write it with FormSection and the fields, ' +
          'or RecordFormPage); questions asked one at a time with branching (Questionnaire). The ' +
          'document itself, its preview and its PDF are the application’s (DocumentFrame).',
      },
    },
  },
  args: { sections: REQUEST },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-3xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof DefinedForm>

export default meta

type Story = StoryObj<typeof meta>

/** The definitions as the user first sees them: required marks, no messages yet. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Requester' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: /^Name/ })).toBeRequired()
    // "What exactly" shows only for "Other"; the address only for a courier.
    await expect(canvas.queryByRole('textbox', { name: /What exactly/ })).toBeNull()
    await expect(canvas.queryByRole('textbox', { name: /Delivery address/ })).toBeNull()
  },
}

/** Filled in: the courier's address shows, because the delivery is by courier. */
export const Filled: Story = {
  args: { defaultValues: FILLED },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('textbox', { name: /Delivery address/ }),
    ).toHaveValue('Harbour Street 12, 2nd floor')
  },
}

/** Missing values said in words under their fields (`showMissing`). */
export const Missing: Story = {
  name: 'Missing values',
  args: { showMissing: true, defaultValues: { name: 'Mia Novak', category: 'other' } },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('Fill in this field.').length).toBeGreaterThan(0)
    await expect(canvas.getAllByText('Choose an option.').length).toBeGreaterThan(0)
    await expect(canvas.getByText('Tick this to go on.')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: /What exactly/ })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  },
}

/** The application's own checks, by field id, under their fields. */
export const ApplicationErrors: Story = {
  name: 'Error',
  args: {
    defaultValues: { ...FILLED, email: 'mia.novak@example' },
    errors: {
      email: 'This address has no domain ending; write it as name@company.com.',
      neededBy: 'The supplier needs at least ten working days.',
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('The supplier needs at least ten working days.'),
    ).toBeVisible()
  },
}

/** Read only: a numbered or sent document's data in the read-only look, without required marks. */
export const ReadOnly: Story = {
  name: 'Read only',
  args: { defaultValues: FILLED, readOnly: true },
}

/**
 * Fields the application filled in or the user may not change (read only), and a folded section
 * of rarely used fields.
 */
export const ReadOnlyFieldsAndCollapsible: Story = {
  name: 'Read-only fields, collapsible section',
  args: { sections: WITH_EXTRAS, defaultValues: { number: 'REQ-2026-0141' } },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Cost centre' })).toHaveAttribute('readonly')
    await expect(canvas.getByRole('button', { name: 'More details' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  },
}

/** Long texts from the application wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: { sections: LONG, showMissing: true },
}

/** No definitions yet (the application loads them): nothing is drawn. */
export const Empty: Story = {
  args: { sections: [] },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelectorAll('[data-slot="field"]')).toHaveLength(0)
  },
}

/** A custom field: the application draws its lines between the defined fields. */
export const Custom: Story = {
  name: 'Custom field',
  args: {
    sections: WITH_CUSTOM,
    defaultValues: { supplier: 'Northwind Supplies Ltd.', lines: ['Paper A4', 'Toner'] },
    renderCustom: (field, control) => (
      <fieldset className="m-0 rounded-md border border-solid border-default p-3">
        <legend className="bidi-content px-1 text-sm font-semibold">{field.label}</legend>
        <ul className="m-0 ps-5 text-sm">
          {(Array.isArray(control.value) ? (control.value as string[]) : []).map((line) => (
            <li key={line} className="bidi-content">
              {line}
            </li>
          ))}
        </ul>
      </fieldset>
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Toner')).toBeVisible()
  },
}

/** Definitions written in Serbian on an English page: their texts carry `lang` (D15). */
export const OtherLanguage: Story = {
  name: 'Definitions in another language',
  args: { sections: SERBIAN, lang: 'sr-Latn' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Zahtev za opremu')).toHaveAttribute(
      'lang',
      'sr-Latn',
    )
  },
}

/** Phone width: one column; the conditions and messages as on a desktop. */
export const Phone: Story = {
  args: { showMissing: true, defaultValues: { name: 'Mia Novak', delivery: 'courier' } },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: { sections: ARABIC_REQUEST, defaultValues: { name: 'ليلى حداد', category: 'other' } },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: { sections: JAPANESE_REQUEST, defaultValues: { name: '山田 花子' }, showMissing: true },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The application's side: it keeps the values and checks before sending. */
function Sending({ start }: { start?: DefinedValues }) {
  const form = useRef<DefinedFormHandle>(null)
  const [values, setValues] = useState<DefinedValues>(start ?? {})
  const [result, setResult] = useState<ReactNode>(null)
  return (
    <div className="flex flex-col gap-4">
      <DefinedForm ref={form} sections={REQUEST} values={values} onChange={setValues} />
      <div className="flex items-center justify-end gap-3">
        <p role="status" className="bidi-content m-0 text-sm text-secondary">
          {result}
        </p>
        <Button
          family="primary"
          icon={Send}
          emphasis="primary"
          label="Send request"
          onClick={() => {
            const check = form.current?.check()
            if (check === undefined) return
            setResult(
              check.valid
                ? `Sent with ${String(Object.keys(check.values).length)} values.`
                : `${String(check.missing.length + check.unreadable.length)} fields need attention.`,
            )
          }}
        />
      </div>
    </div>
  )
}

/** Choosing "Other" asks what; choosing the courier asks for the address. */
export const Conditions: Story = {
  name: 'Conditions, interaction',
  tags: ['interaction'],
  render: () => <Sending />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Other' }))
    await expect(await canvas.findByRole('textbox', { name: /What exactly/ })).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: 'Laptop' }))
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: /What exactly/ })).toBeNull()
    })
    await userEvent.click(canvas.getByRole('radio', { name: 'By courier' }))
    await expect(await canvas.findByRole('textbox', { name: /Delivery address/ })).toBeVisible()
  },
}

/** Send with values missing: the words under each, the focus on the first; then send. */
export const Check: Story = {
  name: 'Check before sending, interaction',
  tags: ['interaction'],
  render: () => <Sending start={{ ...FILLED, name: '', agree: false }} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
    await expect(await canvas.findByText('2 fields need attention.')).toBeVisible()
    const name = canvas.getByRole('textbox', { name: /^Name/ })
    await waitFor(async () => {
      await expect(name).toHaveFocus()
    })
    await expect(name).toHaveAccessibleDescription('Fill in this field.')
    await userEvent.type(name, 'Mia Novak')
    await userEvent.click(canvas.getByRole('checkbox', { name: /I will return the equipment/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
    await expect(await canvas.findByText(/Sent with \d+ values\./)).toBeVisible()
    await expect(canvas.queryByText('Fill in this field.')).toBeNull()
  },
}
