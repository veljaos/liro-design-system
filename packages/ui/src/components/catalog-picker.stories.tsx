import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Button } from './button'
import { CatalogPicker, type CatalogPickerProps } from './catalog-picker'
import type { CatalogCategory, CatalogItem } from './catalog-picker-logic'
import {
  MANY_CATEGORIES,
  MANY_ITEMS,
  SERVICE_CATEGORIES,
  SERVICE_FILTERS,
  SERVICE_ITEMS,
  SERVICE_SECTIONS,
  withCombinations,
} from './catalog-picker-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application around the picker: it keeps the choice and says what does not combine. */
function Picker(props: Partial<CatalogPickerProps> & { startOpen?: boolean }) {
  const [open, setOpen] = useState(props.startOpen ?? true)
  const [chosen, setChosen] = useState<readonly string[]>(props.defaultSelected ?? [])
  const [done, setDone] = useState<string[]>([])
  const items = props.items ?? withCombinations(SERVICE_ITEMS, chosen)
  const names = done.map((id) => items.find((each) => each.id === id)?.name ?? id).join(', ')
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        intent="view"
        emphasis="secondary"
        label="Choose a service…"
        onClick={() => {
          setOpen(true)
        }}
      />
      <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {done.length === 0 ? 'No service chosen.' : `Chosen: ${names}`}
      </p>
      <CatalogPicker
        title="Choose a service"
        subject="Škoda Octavia · NS-482-KT"
        categories={SERVICE_CATEGORIES}
        sections={SERVICE_SECTIONS}
        filters={SERVICE_FILTERS}
        currency="RSD"
        countLabel={(count, text) => `${text} ${count === 1 ? 'service' : 'services'}`}
        {...props}
        items={items}
        open={open}
        onOpenChange={setOpen}
        selected={chosen}
        onSelectedChange={setChosen}
        onChoose={setDone}
      />
    </div>
  )
}

const meta = {
  title: 'Components/Catalogs/CatalogPicker',
  component: CatalogPicker,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing from a large catalogue — 50 to 1,500 services, products or ' +
          'courses — where radio buttons do not scale: a dialog (a full-screen sheet on phones) ' +
          'with the search first, filter chips, the application’s sections at the top (“Most ' +
          'chosen”, “Your recent”, “On discount”), the levels as a drill-down with a way back, and ' +
          'the items as cards (name, duration, who provides it, the price and its discount, the ' +
          'reason one cannot be chosen). One item: a press chooses it and closes; several ' +
          '(`multiple`): presses toggle and “Choose 2” confirms — what combines is the ' +
          'application’s answer (`unavailableReason`). Long lists show 40 cards and “Show ' +
          'more”.\n\n' +
          '**Keyboard:** the search has the focus when it opens; Tab reaches the chips, the ' +
          'levels and each list; in a list the arrows move between cards, Home / End, Enter or ' +
          'Space chooses.\n\n' +
          '**When:** booking a service, adding a product or a course from a catalogue the user ' +
          'browses — by levels, by what is usual, by what is on offer.\n\n' +
          '**When not:** a few options (RadioGroupField, SelectField); finding a known record ' +
          'by name or number (LookupField, LookupDialog); a till’s products (ProductGrid).',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: 'Choose a service',
    items: [],
    onChoose: () => undefined,
  },
  render: () => (
    <ExampleProvider>
      <Picker />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof CatalogPicker>

export default meta

type Story = StoryObj<typeof meta>

/** The picker's dialog, once open. */
async function picker(canvasElement: HTMLElement) {
  return within(
    await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: /Choose a service/,
    }),
  )
}

/** The top level: the search, the filters, the sections from data, the levels with counts. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('listbox', { name: 'Most chosen' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Maintenance.*5 services/ })).toBeVisible()
    await expect(
      dialog.getAllByRole('option', { name: /Oil change, small service/ })[0],
    ).toHaveTextContent('−20% until 31.10.')
  },
}

/** A level opened: "Back to Maintenance", its name, and its cards. */
export const Level: Story = {
  name: 'A level opened',
  render: () => (
    <ExampleProvider>
      <Picker defaultCategory="oil" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('button', { name: 'Back to Maintenance' })).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Oil and filters' })).toBeVisible()
  },
}

/** Drilling down and back, then choosing one: the dialog closes with the choice. */
export const DrillDown: Story = {
  name: 'Drilling down, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await userEvent.click(dialog.getByRole('button', { name: /^Tyres/ }))
    await userEvent.click(dialog.getByRole('button', { name: /^Changing tyres/ }))
    await expect(dialog.getByRole('heading', { name: 'Changing tyres' })).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Back to Tyres' }))
    await userEvent.click(dialog.getByRole('button', { name: /^Storing tyres/ }))
    // A card that cannot be chosen says why and changes nothing.
    const full = dialog.getByRole('option', { name: /Tyre storage/ })
    await expect(full).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(full)
    await expect(full).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Back to Tyres' }))
    await userEvent.click(dialog.getByRole('button', { name: /^Changing tyres/ }))
    await userEvent.click(dialog.getByRole('option', { name: /Balancing/ }))
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await expect(within(canvasElement).getByText('Chosen: Balancing, 4 wheels')).toBeVisible()
  },
}

/** Typing searches every level; a result shows where it stands. */
export const Searching: Story = {
  name: 'Searching',
  render: () => (
    <ExampleProvider>
      <Picker initialQuery="brake" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('status')).toHaveTextContent('3 found')
    await expect(dialog.getByRole('option', { name: /Brake fluid change/ })).toHaveTextContent(
      'Brakes',
    )
  },
}

/** Nothing found: "Clear search and filters" brings the catalogue back. */
export const NothingFound: Story = {
  name: 'Nothing found',
  render: () => (
    <ExampleProvider>
      <Picker initialQuery="sunroof" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('button', { name: 'Clear search and filters' })).toBeVisible()
  },
}

/** The keyboard: the arrows move between cards, Enter chooses. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await waitFor(() => expect(dialog.getByRole('searchbox')).toHaveFocus())
    await userEvent.type(dialog.getByRole('searchbox'), 'front')
    const first = dialog.getByRole('option', { name: /Front brake pads/ })
    first.focus()
    await userEvent.keyboard('{End}')
    await expect(dialog.getByRole('option', { name: /Front discs and pads/ })).toHaveFocus()
    await userEvent.keyboard('{Home}{Enter}')
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
    await expect(within(canvasElement).getByText('Chosen: Front brake pads')).toBeVisible()
  },
}

/** A filter pressed applies everywhere; the levels without a match go. */
export const Filtering: Story = {
  name: 'Filtering, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await userEvent.click(dialog.getByRole('button', { name: 'On discount' }))
    await expect(dialog.getByRole('button', { name: 'On discount' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(dialog.queryByRole('button', { name: /^Bodywork/ })).toBeNull()
  },
}

/**
 * Several: two chosen, and the application says the big service does not combine with the
 * small one.
 */
export const Several: Story = {
  name: 'Several chosen',
  render: () => (
    <ExampleProvider>
      <Picker multiple defaultSelected={['oil-small', 'tyres-swap']} defaultCategory="oil" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('option', { name: /small service/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(dialog.getByRole('option', { name: /Big service/ })).toHaveTextContent(
      'The big service already includes the small one.',
    )
    await expect(dialog.getByRole('button', { name: 'Choose 2' })).toBeVisible()
    // One footer, opaque, under the cards: they scroll in their own region above it (P5.93).
    const footer = document.body.querySelector<HTMLElement>(
      '[data-slot="catalog-picker"] [data-slot="dialog-footer"]',
    )
    const lists = document.body.querySelector<HTMLElement>('[data-slot="catalog-lists"]')
    if (footer === null || lists === null) throw new Error('no footer or lists')
    const probe = document.createElement('i')
    document.body.append(probe)
    const transparent = getComputedStyle(probe).backgroundColor
    probe.remove()
    await expect(getComputedStyle(footer).backgroundColor).not.toBe(transparent)
    await expect(lists.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      footer.getBoundingClientRect().top + 1,
    )
  },
}

export const SeveralInteraction: Story = {
  name: 'Several, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Picker multiple />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    const [diagnostics] = dialog.getAllByRole('option', { name: /Computer diagnostics/ })
    if (diagnostics === undefined) throw new Error('no diagnostics')
    await userEvent.click(diagnostics)
    const [tyres] = dialog.getAllByRole('option', { name: /Seasonal tyre change/ })
    if (tyres === undefined) throw new Error('no tyre change')
    await userEvent.click(tyres)
    await expect(dialog.getByText(/^Chosen: /)).toHaveTextContent(
      'Chosen: Computer diagnostics, Seasonal tyre change, 4 wheels',
    )
    await userEvent.click(dialog.getByRole('button', { name: 'Choose 2' }))
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull())
  },
}

/** 1,500 parts: 40 cards, then "Show more". */
export const ManyItems: Story = {
  name: '1,500 items',
  render: () => (
    <ExampleProvider>
      <Picker
        items={MANY_ITEMS}
        categories={MANY_CATEGORIES}
        sections={[]}
        filters={[]}
        initialQuery="part"
        countLabel={(count, text) => `${text} ${count === 1 ? 'part' : 'parts'}`}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getAllByRole('option')).toHaveLength(40)
    await expect(
      dialog.getByRole('button', { name: /^Show more \(40 of 1.?500 shown\)$/ }),
    ).toBeVisible()
  },
}

export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Picker loading />
    </ExampleProvider>
  ),
}

export const LoadError: Story = {
  name: 'Error',
  render: () => (
    <ExampleProvider>
      <Picker error="The services could not be loaded." onRetry={() => undefined} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    await expect(dialog.getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

export const Empty: Story = {
  name: 'Empty catalogue',
  render: () => (
    <ExampleProvider>
      <Picker items={[]} sections={[]} categories={[]} filters={[]} />
    </ExampleProvider>
  ),
}

const LONG_ITEMS: CatalogItem[] = [
  {
    id: 'long',
    name: 'Complete pre-winter preparation of the vehicle: coolant, wipers, battery test, lights and the heating system',
    categoryId: 'long-level',
    detail: '2 h 30 min, the car stays with us until the afternoon',
    provider: 'Bay 1 · Marko Jovanović-Stanković and the apprentice of the week',
    price: '1249900.00',
    originalPrice: '1399900.00',
    discount: '−10% for customers who booked the summer service with us this year',
  },
]
const LONG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'long-level',
    label: 'Seasonal preparation of passenger cars and light commercial vehicles',
    description: 'Before winter and before the summer holidays, with the checks the law asks for',
  },
]

export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Picker items={LONG_ITEMS} categories={LONG_CATEGORIES} sections={[]} filters={[]} />
    </ExampleProvider>
  ),
}

/** A phone: the full-screen sheet, the cards in one column. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Picker layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  // One column of cards, the price under the name; no Cancel — the X closes it (P5.93).
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await picker(canvasElement)
    for (const list of dialog.getAllByRole('listbox')) {
      await expect(getComputedStyle(list).gridTemplateColumns.split(' ')).toHaveLength(1)
    }
    await expect(dialog.queryByRole('button', { name: 'Cancel' })).toBeNull()
  },
}

export const PhoneLevel: Story = {
  name: 'Phone width, a level opened',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Picker layout="phone" defaultCategory="brakes" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

const ARABIC_CATEGORIES: CatalogCategory[] = [
  { id: 'ar-1', label: 'الصيانة' },
  { id: 'ar-2', label: 'الإطارات' },
]
const ARABIC_ITEMS: CatalogItem[] = [
  { id: 'a1', name: 'تغيير الزيت', categoryId: 'ar-1', detail: '45 دقيقة', price: '120' },
  { id: 'a2', name: 'تبديل الإطارات', categoryId: 'ar-2', detail: '40 دقيقة', price: '80' },
]

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Picker
        title="اختر خدمة"
        subject="تويوتا كورولا"
        items={ARABIC_ITEMS}
        categories={ARABIC_CATEGORIES}
        sections={[{ id: 's', label: 'الأكثر طلبًا', itemIds: ['a1'] }]}
        filters={[]}
        currency="د.إ"
        countLabel={(_, text) => `${text} خدمات`}
      />
    </StoryProvider>
  ),
}

const JAPANESE_ITEMS: CatalogItem[] = [
  { id: 'j1', name: 'オイル交換', detail: '45分', provider: '1番ピット', price: '5500' },
  { id: 'j2', name: 'タイヤ交換', detail: '40分', provider: 'タイヤピット', price: '4400' },
]

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Picker
        title="サービスを選択"
        items={JAPANESE_ITEMS}
        categories={[]}
        sections={[]}
        filters={[]}
        currency="¥"
      />
    </StoryProvider>
  ),
}
