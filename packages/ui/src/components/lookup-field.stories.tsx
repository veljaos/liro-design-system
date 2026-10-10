import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { LookupCreateDrawer } from './lookup-create-drawer'
import { LookupField } from './lookup-field'
import type { LookupCreateKind, LookupOption } from './lookup-logic'
import { KINDS, RECENT, searchCatalogue, TAX_CATEGORIES, UNITS } from './lookup-story-data'
import { expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/*
 * LookupField (BUILD-PLAN P5.19): stories over a catalogue of 20,011 records (the story data's),
 * searched by a pretend server that answers after 400ms.
 */

const CREATE: LookupCreateKind[] = [
  { kind: 'service', noun: 'service' },
  { kind: 'item', noun: 'item' },
]

/** The application around the field: its search, its results and its loading state. */
function useCatalogue(delay = 400, query?: string) {
  const [results, setResults] = useState<LookupOption[]>(() =>
    query === undefined || query === '' ? [] : searchCatalogue(query),
  )
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onSearch = (query: string) => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setResults(searchCatalogue(query))
      setLoading(false)
    }, delay)
  }
  return { results, loading, onSearch }
}

type Args = Partial<ComponentProps<typeof LookupField>>

/** A LookupField with the pretend server, recent records and kinds; `extra` adds or overrides. */
function Lookup(extra: Args & { initial?: LookupOption | null }) {
  const { initial = null, ...props } = extra
  const [value, setValue] = useState<LookupOption | null>(initial)
  const catalogue = useCatalogue(400, props.defaultQuery)
  return (
    <LookupField
      label="Item or service"
      className="max-w-120"
      recent={RECENT}
      kinds={KINDS}
      {...catalogue}
      value={value}
      onChange={setValue}
      {...props}
    />
  )
}

/** Types into the story's lookup and waits for the pretend server (300ms quiet + 400ms). */
async function search(canvasElement: HTMLElement, text: string) {
  const input = within(canvasElement).getAllByRole('combobox')[0]
  if (input === undefined) return
  await userEvent.click(input)
  await userEvent.type(input, text, { delay: 0 })
  await waitFor(() => expect(within(document.body).queryByText('Loading…')).toBeNull(), {
    timeout: 3000,
  })
  await new Promise((resolve) => setTimeout(resolve, 800))
  await waitFor(() => expect(within(document.body).queryByText('Loading…')).toBeNull(), {
    timeout: 3000,
  })
  await settle()
}

const meta = {
  title: 'Components/Fields/LookupField',
  component: LookupField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one record from a catalogue of tens of thousands — customers, items, ' +
          'services, fixed assets, accounts — in a form or a document line (EditableGrid’s ' +
          '`lookup` column). The application searches while the user types (`onSearch` after ' +
          '300ms of quiet, `loading` while it works); the field never filters a catalogue ' +
          'itself. While nothing is typed it shows the **recent** records; the results are ' +
          '**grouped by kind** (`kinds`: Items, Services, Fixed assets), each with a second line ' +
          'and an end detail such as the stock. After the results: **"+ Create <kind> “…”"** ' +
          '(`create`, `onCreate`: the application opens `LookupCreateDrawer` or its own form), a ' +
          '**one-off** entry where the application allows it (`allowOneOff`), and **"Search ' +
          'all…"** last (`onSearchAll`: the application opens its LookupDialog with the text). ' +
          'Keys: the WAI-ARIA combobox — ArrowDown/Up (wrapping), PageDown/Up by ten, Home/End ' +
          'while the list is open, Enter chooses, Escape closes, Alt+ArrowDown opens; while ' +
          'something is typed the first record found is active, so Enter takes it. The list is ' +
          'virtualised (rows of known heights) and opens on typing, an arrow or a press — never ' +
          'on Tab alone.\n\n' +
          '**When:** any choice from a catalogue that can hold more than a few hundred records.\n\n' +
          '**When not:** a known short list (SelectField, or ComboboxField filtering its own ' +
          'options); several choices (MultiSelectField); browsing with filters and columns (the ' +
          'LookupDialog that "Search all…" opens).',
      },
    },
  },
  args: { label: 'Item or service', results: [], onSearch: () => undefined },
  play: settle,
} satisfies Meta<typeof LookupField>

export default meta

type Story = StoryObj<typeof meta>

/** Typing "armat": items, services and fixed assets in their groups; Enter takes the first. */
export const Default: Story = {
  render: () => (
    <Lookup
      defaultQuery="armat"
      description="Name, code or asset number"
      create={CREATE}
      onCreate={() => undefined}
      onSearchAll={() => undefined}
      name="record"
    />
  ),
  play: async () => {
    await expect(await within(document.body).findByRole('listbox')).toBeVisible()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  render: () => (
    <Lookup
      description="Name, code or asset number"
      create={CREATE}
      onCreate={() => undefined}
      onSearchAll={() => undefined}
      name="record"
    />
  ),
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'armat')
    const body = within(document.body)
    const listbox = body.getByRole('listbox', { name: 'Item or service' })
    // Items first, then services, then fixed assets; each record's name carries its kind.
    await expect(
      within(listbox).getByRole('option', { name: /Armaturna mreža Q188.*Item/ }),
    ).toBeVisible()
    await expect(
      within(listbox).getByRole('option', { name: /Montaža armature.*Service/ }),
    ).toBeVisible()
    const input = within(canvasElement).getByRole('combobox', { name: /Item or service/ })
    // The rows below are drawn as the list scrolls to them (virtualised): walk there by key.
    const activeName = () =>
      document.getElementById(input.getAttribute('aria-activedescendant') ?? '')?.textContent ?? ''
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(activeName()).toBe('Search all…'))
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await waitFor(() => expect(activeName()).toBe('Create service “armat”'))
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(() => expect(activeName()).toMatch(/^Savijačica armature.*Fixed asset/))
    // Home: the first record; Enter takes the one after it.
    await userEvent.keyboard('{Home}')
    await waitFor(() => expect(activeName()).toMatch(/^Armaturna mreža Q188/))
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(input).toHaveValue('Armatura B500B Ø12, 12 m')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await settle()
  },
}

/** Nothing typed: the recent records first; ArrowDown opens and walks them. */
export const RecentFirst: Story = {
  name: 'Recent records first',
  render: () => <Lookup defaultQuery="" onSearchAll={() => undefined} />,
  play: async () => {
    await expect(await within(document.body).findByRole('listbox')).toBeVisible()
    await settle()
  },
}

export const RecentFirstInteraction: Story = {
  name: 'Recent records first, interaction',
  tags: ['interaction'],
  render: () => <Lookup onSearchAll={() => undefined} />,
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.click(input)
    await settle()
    const listbox = within(document.body).getByRole('listbox')
    await expect(within(listbox).getByText('Recent')).toBeVisible()
    await expect(within(listbox).getAllByRole('option')).toHaveLength(4)
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(within(listbox).getByRole('option', { name: /Prevoz kamionom/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{Escape}')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await settle()
    await expect(input).toHaveAttribute('aria-expanded', 'true')
  },
}

/** "+ Create service …" opens the panel with the typed name; Create fills the field. */
function CreateFlow() {
  const [value, setValue] = useState<LookupOption | null>(null)
  const [creating, setCreating] = useState<{ kind: LookupCreateKind; query: string } | null>(null)
  const [open, setOpen] = useState(false)
  const catalogue = useCatalogue()
  const input = useRef<HTMLDivElement>(null)
  return (
    <div ref={input}>
      <LookupField
        label="Item or service"
        className="max-w-120"
        kinds={KINDS}
        {...catalogue}
        value={value}
        onChange={setValue}
        create={CREATE}
        onCreate={(kind, query) => {
          const target = CREATE.find((each) => each.kind === kind)
          if (target === undefined) return
          setCreating({ kind: target, query })
          setOpen(true)
        }}
      />
      {creating !== null && (
        <LookupCreateDrawer
          open={open}
          onOpenChange={setOpen}
          kind={creating.kind}
          initialName={creating.query}
          units={UNITS}
          taxCategories={TAX_CATEGORIES}
          currency="RSD"
          defaultUnit="HUR"
          defaultTaxCategory="S20"
          onCreate={(draft) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({ value: 'USL-101', label: draft.name, kind: draft.kind })
              }, 300)
            })
          }
          onCreated={setValue}
          onCloseFocus={() => {
            input.current?.querySelector('input')?.focus()
          }}
        />
      )}
    </div>
  )
}

export const Create: Story = {
  name: 'Create from the typed text',
  tags: ['interaction'],
  render: () => <CreateFlow />,
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'Montaža skele')
    const body = within(document.body)
    await expect(body.getByText('Nothing found')).toBeVisible()
    // The first entry is "+ Create service …": not active until chosen (Enter must not create).
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await settle()
    const panel = body.getByRole('dialog', { name: 'New service' })
    await expect(within(panel).getByRole('textbox', { name: /Name/ })).toHaveValue('Montaža skele')
    await expect(within(panel).getByRole('textbox', { name: /Name/ })).toHaveFocus()
    await userEvent.type(within(panel).getByRole('textbox', { name: /^Price/ }), '1850')
    await userEvent.click(within(panel).getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(body.queryByRole('dialog', { name: 'New service' })).toBeNull())
    const field = within(canvasElement).getByRole('combobox', { name: 'Item or service' })
    await expect(field).toHaveValue('Montaža skele')
    await waitFor(() => expect(field).toHaveFocus())
    await settle()
  },
}

/** The create panel on its own, with the application's message under a field. */
export const CreatePanel: Story = {
  name: 'Create panel with an error',
  render: () => (
    <LookupCreateDrawer
      open
      onOpenChange={() => undefined}
      kind={{ kind: 'service', noun: 'service' }}
      initialName="Montaža skele"
      units={UNITS}
      taxCategories={TAX_CATEGORIES}
      currency="RSD"
      defaultUnit="HUR"
      defaultTaxCategory="S20"
      errors={{ price: 'Enter the price per hour.' }}
      onCreate={() => Promise.resolve(null)}
    />
  ),
}

/** A one-off line where the application allows it; "Search all…" hands over the text. */
function OneOffAndSearchAll() {
  const [value, setValue] = useState<LookupOption | null>(null)
  const [all, setAll] = useState<string | null>(null)
  const catalogue = useCatalogue()
  return (
    <div className="flex max-w-120 flex-col gap-2">
      <LookupField
        label="Item or service"
        kinds={KINDS}
        {...catalogue}
        value={value}
        onChange={setValue}
        allowOneOff
        searchDelay={200}
        onSearchAll={setAll}
      />
      <p className="m-0 text-sm text-secondary" data-testid="outcome">
        {value?.oneOff === true ? `One-off line: ${value.label}. ` : ''}
        {all === null ? '' : `The application opens its full search for “${all}”.`}
      </p>
    </div>
  )
}

export const OneOff: Story = {
  name: 'One-off line and Search all…',
  tags: ['interaction'],
  render: () => <OneOffAndSearchAll />,
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'Popravka kapije')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(within(canvasElement).getByTestId('outcome')).toHaveTextContent(
      'One-off line: Popravka kapije.',
    )
    await search(canvasElement, ' 2')
    await userEvent.keyboard('{End}{Enter}')
    await expect(within(canvasElement).getByTestId('outcome')).toHaveTextContent(
      'The application opens its full search for “Popravka kapije 2”.',
    )
  },
}

/** The search is running: the last results stay, with the loading message above them. */
export const Loading: Story = {
  render: () => (
    <LookupField
      label="Item or service"
      className="max-w-120"
      kinds={KINDS}
      results={searchCatalogue('cement')}
      loading
      defaultQuery="cement"
      onSearch={() => undefined}
    />
  ),
  play: async () => {
    await expect(await within(document.body).findByRole('listbox')).toBeVisible()
    await settle()
  },
}

export const LoadingInteraction: Story = {
  name: 'Loading, interaction',
  tags: ['interaction'],
  render: () => (
    <LookupField
      label="Item or service"
      className="max-w-120"
      kinds={KINDS}
      results={searchCatalogue('cement')}
      loading
      onSearch={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.type(input, 'cement')
    await settle()
    await expect(within(document.body).getByRole('status')).toHaveTextContent('Loading…')
  },
}

/**
 * 20,011 records: a two-letter search finds hundreds; only the rows in view are in the page, and
 * PageDown moves by ten.
 */
export const ManyResults: Story = {
  name: 'Hundreds of results (virtualised)',
  tags: ['interaction'],
  render: function Render() {
    const [value, setValue] = useState<LookupOption | null>(null)
    const [results, setResults] = useState<LookupOption[]>([])
    return (
      <LookupField
        label="Item"
        className="max-w-120"
        kinds={KINDS}
        results={results}
        onSearch={(query) => {
          setResults(searchCatalogue(query, 600))
        }}
        value={value}
        onChange={setValue}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.type(input, 'kl')
    await waitFor(
      () => expect(within(document.body).queryAllByRole('option').length).toBeGreaterThan(5),
      { timeout: 3000 },
    )
    const options = within(document.body).getAllByRole('option')
    await expect(options.length).toBeLessThan(40)
    await expect(options[0]).toHaveAttribute('aria-setsize', '600')
    await userEvent.keyboard('{PageDown}{PageDown}')
    await settle()
    const active = input.getAttribute('aria-activedescendant') ?? ''
    await expect(document.getElementById(active)).toHaveAttribute('aria-posinset', '21')
  },
}

export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <Lookup readOnly initial={{ value: 'USL-014', label: 'Montaža armature', kind: 'service' }} />
  ),
}

export const Disabled: Story = {
  name: 'Disabled with a reason',
  render: () => (
    <Lookup
      disabled
      disabledReason="The invoice is issued: its lines can no longer change."
      initial={{ value: 'USL-014', label: 'Montaža armature', kind: 'service' }}
    />
  ),
}

export const WithError: Story = {
  name: 'Error',
  render: () => <Lookup required error="Choose an item, a service or a fixed asset." />,
}

export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Lookup
      label={LONG.label}
      description={LONG.description}
      error={LONG.error}
      initial={{ value: 'long', label: LONG.value }}
    />
  ),
}

/** Phone width: the list stays inside the screen. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div style={{ padding: 16 }}>
        <Lookup
          defaultQuery="prevoz"
          create={CREATE}
          onCreate={() => undefined}
          onSearchAll={() => undefined}
        />
      </div>
    </PhoneFrame>
  ),
}

export const PhoneInteraction: Story = {
  name: 'Phone width, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <div style={{ padding: 16 }}>
        <Lookup create={CREATE} onCreate={() => undefined} onSearchAll={() => undefined} />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'prevoz')
    // The list stays inside the phone's frame (no sideways overflow).
    const content = document.querySelector('[data-slot="popover-content"]')
    const frame = content?.closest('[style*="translateZ"]')
    const box = content?.getBoundingClientRect()
    const bounds = frame?.getBoundingClientRect()
    await expect(box).toBeDefined()
    await expect(bounds).toBeDefined()
    if (box === undefined || bounds === undefined) return
    await expect(box.left).toBeGreaterThanOrEqual(bounds.left - 1)
    await expect(box.right).toBeLessThanOrEqual(bounds.right + 1)
  },
}

/** Arabic sample text, right to left: the list's rows and their details follow the direction. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <LookupField
        label={ARABIC.label}
        description={ARABIC.description}
        className="max-w-120"
        kinds={[{ key: 'item', heading: ARABIC.options[0] ?? '', label: ARABIC.options[0] ?? '' }]}
        results={[
          {
            value: 'a1',
            label: ARABIC.value,
            kind: 'item',
            description: 'ART-0112',
            detail: '240',
          },
        ]}
        onSearch={() => undefined}
        defaultQuery=""
        recent={[{ value: 'a1', label: ARABIC.value, kind: 'item', description: 'ART-0112' }]}
      />
    </StoryProvider>
  ),
  play: async () => {
    await expect(await within(document.body).findByRole('listbox')).toBeVisible()
    await settle()
  },
}

export const ArabicInteraction: Story = {
  name: 'Arabic, interaction',
  tags: ['interaction'],
  render: () => (
    <StoryProvider locale="ar">
      <LookupField
        label={ARABIC.label}
        description={ARABIC.description}
        className="max-w-120"
        kinds={[{ key: 'item', heading: ARABIC.options[0] ?? '', label: ARABIC.options[0] ?? '' }]}
        results={[
          {
            value: 'a1',
            label: ARABIC.value,
            kind: 'item',
            description: 'ART-0112',
            detail: '240',
          },
        ]}
        onSearch={() => undefined}
        recent={[{ value: 'a1', label: ARABIC.value, kind: 'item', description: 'ART-0112' }]}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await settle()
    await expect(within(document.body).getByRole('option', { name: /شركة النور/ })).toBeVisible()
  },
}

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <LookupField
        label={JAPANESE.label}
        description={JAPANESE.description}
        className="max-w-120"
        placeholder={JAPANESE.placeholder}
        defaultValue={{ value: 'j1', label: JAPANESE.value }}
        results={[]}
        onSearch={() => undefined}
        defaultQuery=""
        recent={[{ value: 'j1', label: JAPANESE.value, description: 'C-0042' }]}
      />
    </StoryProvider>
  ),
  play: async () => {
    await expect(await within(document.body).findByRole('listbox')).toBeVisible()
    await settle()
  },
}

export const JapaneseInteraction: Story = {
  name: 'Japanese, interaction',
  tags: ['interaction'],
  render: () => (
    <StoryProvider locale="ja">
      <LookupField
        label={JAPANESE.label}
        description={JAPANESE.description}
        className="max-w-120"
        placeholder={JAPANESE.placeholder}
        defaultValue={{ value: 'j1', label: JAPANESE.value }}
        results={[]}
        onSearch={() => undefined}
        recent={[{ value: 'j1', label: JAPANESE.value, description: 'C-0042' }]}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('combobox'))
    await settle()
    await expect(within(document.body).getByRole('option', { name: /さくら/ })).toBeVisible()
  },
}

/** An Arabic page whose texts fell back to English: each text keeps its own word order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <Lookup defaultQuery="prevoz" create={CREATE} onCreate={() => undefined} />
    </StoryProvider>
  ),
}

export const EnglishInRtlInteraction: Story = {
  name: 'English in RTL, interaction',
  tags: ['interaction'],
  render: () => (
    <StoryProvider locale="ar">
      <Lookup create={CREATE} onCreate={() => undefined} />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await search(canvasElement, 'prevoz')
    const option = within(document.body).getByRole('option', { name: /Prevoz kamionom/ })
    const text = option.querySelector('.bidi-content')
    if (text !== null) await expectContentDirection(text)
  },
}
