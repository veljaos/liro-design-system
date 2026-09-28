import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ComboboxField, type ComboboxOption } from './combobox-field'
import { filterChoices } from './combobox-logic'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

/** A fictitious customer list, standing in for a server search. */
const CUSTOMERS: ComboboxOption[] = [
  { value: 'c1', label: 'Alfa Trade d.o.o.' },
  { value: 'c2', label: 'Beta Logistics' },
  { value: 'c3', label: 'Delta Foods (blocked)', disabled: true },
  { value: 'c4', label: 'Gama Print' },
  { value: 'c5', label: 'Omega Consulting' },
]

/** Types into the story's first combobox and waits for the list. */
async function typeInto(canvasElement: HTMLElement, text: string) {
  const input = within(canvasElement).getAllByRole('combobox')[0]
  if (input === undefined) return
  await userEvent.click(input)
  await userEvent.type(input, text, { delay: 0 })
  await new Promise((resolve) => setTimeout(resolve, 400))
  await settle()
}

const meta = {
  title: 'Components/Fields/ComboboxField',
  component: ComboboxField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one choice from a long list, found by typing: customers, articles, ' +
          'accounts. With `onSearch`, the application searches after a pause (`searchDelay`, ' +
          'default 300ms) and passes the results as `options`, with `loading` while it works; ' +
          'without it, the field filters `options` itself. Loading and "nothing found" appear in ' +
          'the list. Clearing the text clears the choice.\n\n' +
          '**When not:** a short list (SelectField); several choices (MultiSelectField).',
      },
    },
  },
  args: { label: 'Customer', options: CUSTOMERS, placeholder: 'Type to search' },
  play: settle,
} satisfies Meta<typeof ComboboxField>

export default meta

type Story = StoryObj<typeof meta>

/** A search that answers after 600ms, as a server would; the list opens while typing. */
export const Default: Story = {
  args: { description: 'Search by name', name: 'customer' },
  render: function Render(args) {
    const [value, setValue] = useState<ComboboxOption | null>(null)
    const [options, setOptions] = useState<ComboboxOption[]>(CUSTOMERS)
    const [loading, setLoading] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    return (
      <ComboboxField
        {...args}
        className="max-w-100"
        value={value}
        onChange={setValue}
        options={options}
        loading={loading}
        onSearch={(query) => {
          setLoading(true)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            setOptions(filterChoices(CUSTOMERS, query, 'en'))
            setLoading(false)
          }, 600)
        }}
      />
    )
  },
}

/** Filtering a known list, open after typing "a": the keyboard's option is highlighted. */
export const Open: Story = {
  render: (args) => (
    <div className="flex min-h-80 max-w-100 flex-col">
      <ComboboxField {...args} defaultValue={null} searchDelay={0} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await typeInto(canvasElement, 'a')
    const input = within(canvasElement).getAllByRole('combobox')[0]
    if (input !== undefined) await userEvent.keyboard('{ArrowDown}')
    await settle()
  },
}

/** While the application searches: the loading message. */
export const Loading: Story = {
  render: (args) => (
    <div className="flex min-h-40 max-w-100 flex-col">
      <ComboboxField {...args} options={[]} loading onSearch={() => undefined} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await typeInto(canvasElement, 'om')
  },
}

/** Nothing matches: the "nothing found" message. */
export const Empty: Story = {
  render: (args) => (
    <div className="flex min-h-40 max-w-100 flex-col">
      <ComboboxField {...args} options={[]} onSearch={() => undefined} searchDelay={0} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await typeInto(canvasElement, 'zz')
  },
}

/** Chosen, required with an error, read-only next to disabled. */
export const States: Story = {
  render: (args) => (
    <div className="flex max-w-100 flex-col gap-6">
      <ComboboxField {...args} defaultValue={CUSTOMERS[1] ?? null} />
      <ComboboxField {...args} required error="Choose the customer of the invoice" />
      <ComboboxField
        {...args}
        label="Customer (read-only)"
        readOnly
        defaultValue={CUSTOMERS[0] ?? null}
      />
      <ComboboxField
        {...args}
        label="Customer (disabled)"
        disabled
        disabledReason="The invoice is posted."
        defaultValue={CUSTOMERS[0] ?? null}
      />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: (args) => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <ComboboxField
        {...args}
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        defaultValue={{ value: 'long', label: LONG.value }}
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: (args) => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <ComboboxField
        {...args}
        label={ARABIC.label}
        description={ARABIC.description}
        placeholder={ARABIC.placeholder}
        options={ARABIC.options.map((label) => ({ value: label, label }))}
      />
      <ComboboxField
        {...args}
        label={ARABIC.label}
        readOnly
        defaultValue={{ value: 'v', label: ARABIC.value }}
      />
    </div>
  ),
}

export const Japanese: Story = {
  render: (args) => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <ComboboxField
        {...args}
        label={JAPANESE.label}
        description={JAPANESE.description}
        placeholder={JAPANESE.placeholder}
        options={JAPANESE.options.map((label) => ({ value: label, label }))}
      />
      <ComboboxField
        {...args}
        label={JAPANESE.label}
        readOnly
        defaultValue={{ value: 'v', label: JAPANESE.value }}
      />
    </div>
  ),
}
