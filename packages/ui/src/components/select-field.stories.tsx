import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SelectField, type SelectOption } from './select-field'
import { PhoneFrame } from './story-frames'

const CURRENCIES: SelectOption[] = [
  { value: 'rsd', label: 'Serbian dinar' },
  { value: 'eur', label: 'Euro', group: 'Foreign' },
  { value: 'usd', label: 'US dollar', group: 'Foreign' },
  { value: 'chf', label: 'Swiss franc (no exchange rate today)', group: 'Foreign', disabled: true },
]

/** A class of 30 pupils: more than ten options, so the list is searched. */
const PUPILS: SelectOption[] = [
  'Ana Babić',
  'Bojan Cvetković',
  'Dragana Đorđević',
  'Đorđe Erić',
  'Elena Filipović',
  'Filip Gajić',
  'Goran Hadžić',
  'Hana Ilić',
  'Ivan Jakovljević',
  'Jana Kostić',
  'Katarina Lazić',
  'Lazar Marković',
  'Luka Jovanović',
  'Marija Nikolić',
  'Milan Obradović',
  'Milica Pavlović',
  'Nemanja Radić',
  'Nina Savić',
  'Ognjen Tomić',
  'Petar Urošević',
  'Sara Vasić',
  'Stefan Vuković',
  'Tamara Zec',
  'Teodora Živković',
  'Uroš Antić',
  'Vanja Bogdanović',
  'Vuk Ćirić',
  'Zoran Dimitrijević',
  'Željka Džamić',
  'Žarko Gavrilović',
].map((label, index) => ({ value: `p${String(index + 1)}`, label }))

/** Options longer than a phone's width: they wrap inside the list. */
const LONG_OPTIONS: SelectOption[] = [
  { value: 'early', label: 'Mon 12.10. 06:00–14:00, Prodavnica 12, cash desk 2 (Marko Petrović)' },
  { value: 'late', label: 'Tue 13.10. 14:00–22:00, Prodavnica 12, warehouse and receiving' },
  { value: 'night', label: 'Wed 14.10. 22:00–06:00 (+1), Prodavnica 12, inventory count' },
]

const meta = {
  title: 'Components/Fields/SelectField',
  component: SelectField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one choice from a list the application already has, optionally in ' +
          'groups. Read only shows the chosen label in the read-only look. From 11 options the list is ' +
          'searched by typing (`searchable`): a text box with the chevron; a press shows ' +
          'every option, typing filters them. The list never runs off the screen: it keeps 8px ' +
          'inside it and a long option wraps; it scrolls with the finger, without scroll buttons.\n\n' +
          '**When not:** a long list or one searched on the server (ComboboxField); several ' +
          'choices (MultiSelectField); two to five options that should all be visible ' +
          '(RadioGroupField).',
      },
    },
  },
  args: { label: 'Currency', options: CURRENCIES, placeholder: 'Choose a currency' },
  play: settle,
} satisfies Meta<typeof SelectField>

export default meta

type Story = StoryObj<typeof meta>

/** Choosing updates the value; options in a group under a heading, one disabled. */
export const Default: Story = {
  args: { description: 'The currency of the whole document', name: 'currency' },
  render: function Render(args) {
    const [value, setValue] = useState<string | undefined>(undefined)
    return (
      <SelectField
        {...args}
        {...(value === undefined ? {} : { value })}
        onChange={setValue}
        className="max-w-100"
      />
    )
  },
}

/** Empty, required with an error, read only (the read-only look, an empty value "—"). */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <SelectField label="Currency" options={CURRENCIES} placeholder="Choose a currency" />
      <SelectField
        label="Currency"
        options={CURRENCIES}
        required
        placeholder="Choose a currency"
        error="Choose the currency of the invoice"
      />
      <SelectField label="Currency (read-only)" options={CURRENCIES} readOnly defaultValue="eur" />
    </div>
  ),
}

export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <SelectField
        label={LONG.label}
        description={LONG.description}
        error={LONG.error}
        options={[{ value: 'long', label: LONG.value }]}
        defaultValue="long"
      />
    </div>
  ),
}

export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <SelectField
        label={ARABIC.label}
        description={ARABIC.description}
        options={ARABIC.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="1"
      />
      <SelectField
        label={ARABIC.label}
        readOnly
        options={ARABIC.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="2"
      />
    </div>
  ),
}

export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <SelectField
        label={JAPANESE.label}
        description={JAPANESE.description}
        options={JAPANESE.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="1"
      />
      <SelectField
        label={JAPANESE.label}
        readOnly
        options={JAPANESE.options.map((label, index) => ({ value: String(index), label }))}
        defaultValue="2"
      />
    </div>
  ),
}

/** More than ten options (a class of 30 pupils): the list is searched by typing. */
export const ManyOptions: Story = {
  name: 'Many options, searched by typing',
  args: { label: 'Pupil', options: PUPILS, placeholder: 'Choose a pupil', defaultValue: 'p13' },
  render: (args) => <SelectField {...args} className="max-w-100" />,
}

/** Typing filters, ignoring case and accents; ArrowDown and Enter choose. */
export const ManyOptionsInteraction: Story = {
  name: 'Many options, searched by typing, interaction',
  tags: ['interaction'],
  args: { label: 'Pupil', options: PUPILS, placeholder: 'Choose a pupil' },
  render: function Render(args) {
    const [value, setValue] = useState('')
    return (
      <div className="flex max-w-100 flex-col gap-2">
        <SelectField {...args} value={value} onChange={setValue} />
        <p className="m-0 text-sm bidi-content">Chosen: {value === '' ? '—' : value}</p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const input = canvas.getByRole('combobox', { name: 'Pupil' })
    await userEvent.click(input)
    await expect(await body.findAllByRole('option')).toHaveLength(30)
    await userEvent.type(input, 'zivk', { delay: 0 })
    const options = await body.findAllByRole('option')
    await expect(options).toHaveLength(1)
    await expect(options[0]).toHaveTextContent('Teodora Živković')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(canvas.getByText('Chosen: p24')).toBeInTheDocument()
    await expect(input).toHaveValue('Teodora Živković')
    await settle()
  },
}

/** On a phone the searched list opens under the field, inside the screen. */
export const ManyOptionsPhone: Story = {
  name: 'Many options, phone, open',
  render: () => (
    <PhoneFrame>
      <div className="flex flex-col gap-4 p-4">
        <SelectField label="Pupil" options={PUPILS} defaultValue="p13" defaultOpen />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findAllByRole('option')).toHaveLength(30)
    await settle()
  },
}

/**
 * A short list with options longer than the phone is wide: the list keeps 8px inside the screen
 * and the options wrap; the page never scrolls sideways.
 */
export const LongOptionsPhone: Story = {
  name: 'Long options, phone, open',
  render: () => (
    <PhoneFrame>
      <div className="flex flex-col gap-4 p-4">
        <SelectField
          label="Their shift you take instead"
          options={LONG_OPTIONS}
          placeholder="Choose a shift"
          defaultOpen
        />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const list = await body.findByRole('listbox')
    const frame = canvasElement.querySelector('[data-liro-phone-frame]')
    await settle()
    const box = list.getBoundingClientRect()
    const screen = frame?.getBoundingClientRect()
    await expect(screen).toBeDefined()
    await expect(box.left).toBeGreaterThanOrEqual((screen?.left ?? 0) + 7)
    await expect(box.right).toBeLessThanOrEqual((screen?.right ?? 0) - 7)
  },
}

/**
 * Languages in their own names: each option carries its language (`lang`), in the
 * list and once chosen, so a screen reader reads "Srpski" as Serbian in an English page.
 */
export const OwnLanguages: Story = {
  name: 'Languages in their own names, open',
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <SelectField
        label="Language"
        defaultValue="sr-Latn"
        defaultOpen
        options={[
          { value: 'en', label: 'English' },
          { value: 'sr-Latn', label: 'Srpski (latinica)', lang: 'sr-Latn' },
          { value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const option = await body.findByRole('option', { name: 'Српски (ћирилица)' })
    await expect(option.querySelector('[lang="sr-Cyrl"]')).not.toBeNull()
    // The chosen option's text in the trigger keeps its language.
    // The open list hides the rest of the page from assistive technology (Radix), the trigger too.
    const trigger = canvas.getByRole('combobox', { name: 'Language', hidden: true })
    await expect(trigger.querySelector('[lang="sr-Latn"]')).not.toBeNull()
    await settle()
  },
}
