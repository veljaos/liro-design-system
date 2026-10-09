import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SectionCard } from './cards'
import { at, HISTORY, OLDER_HISTORY, TODAY } from './collaboration-story-data'
import { HistoryList, type HistoryEntry } from './history-list'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Collaboration/HistoryList',
  component: HistoryList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the full history of a record — who did what, when, and what changed — ' +
          'newest first, grouped by day ("Today", "Yesterday", the date). Each entry: the actor ' +
          "with the marker of its kind (a person's avatar; the Bot icon and AgentMark for an " +
          'agent; a neutral icon for the system and for an integration such as SEF or a bank ' +
          "import), the time, the application's sentence, the changed fields as old → new " +
          '(values exactly as given), and "On behalf of …" when someone acted for someone else. ' +
          'Long histories page from the application (`hasMore`, `onLoadMore`, `loading`).\n\n' +
          "**When:** a record's or document's history on its page (a section). **When not:** the " +
          'latest few entries in a side panel (ActivityList); the states of one process with its ' +
          "next step (StatusTimeline); the dots of a document's lifecycle (LifecycleBar); a " +
          'conversation (MessageThread).',
      },
    },
  },
  args: { entries: HISTORY, label: 'History of F-2026-0410' },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-160">
        <SectionCard title="History">
          <HistoryList {...args} />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof HistoryList>

export default meta

type Story = StoryObj<typeof meta>

/**
 * F-2026-0410: created and issued by Dragan, delivered by SEF (an integration), a payment booked by
 * the bank import, a system reminder, the agent preparing a reminder for Milica.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const headings = canvas.getAllByRole('heading', { level: 3 })
    await expect(headings.map((heading) => heading.textContent)).toEqual([
      'Today',
      'Yesterday',
      '02.10.2026.',
      '25.09.2026.',
    ])
    // Newest first within a day.
    const today = canvas
      .getAllByRole('listitem')
      .filter((item) => item.getAttribute('data-slot') === 'history-entry')
      .slice(0, 2)
    await expect(today[0]).toHaveTextContent('Ivana Stojanović')
    await expect(today[1]).toHaveTextContent('Liro agent')
    await expect(canvas.getByText('On behalf of Milica Petrović')).toBeVisible()
    await expect(canvas.getAllByRole('img', { name: 'Integration' })).toHaveLength(2)
    await expect(canvas.getByRole('img', { name: 'System' })).toBeVisible()
    // Old and new values, with their words for assistive technology.
    await expect(canvas.getByText('86.420,35 RSD')).toBeVisible()
    await expect(canvas.getAllByText('Before:')[0]).toHaveClass('sr-only')
    await settle()
  },
}

/** "Show more" asks the application for older entries; a spinner stands in while it loads. */
export const Paging: Story = {
  render: function Render(args) {
    const [entries, setEntries] = useState<HistoryEntry[]>(HISTORY)
    const [loading, setLoading] = useState(false)
    return (
      <ExampleProvider>
        <div className="max-w-160">
          <SectionCard title="History">
            <HistoryList
              {...args}
              entries={entries}
              loading={loading}
              hasMore={entries.length === HISTORY.length}
              onLoadMore={() => {
                setLoading(true)
                setTimeout(() => {
                  setEntries([...HISTORY, ...OLDER_HISTORY])
                  setLoading(false)
                }, 300)
              }}
            />
          </SectionCard>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show more' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Loading…')
    await waitFor(() =>
      expect(canvas.getByText('Order N-2026-0149 confirmed by Medic Lab Niš d.o.o.')).toBeVisible(),
    )
    await expect(canvas.queryByRole('button', { name: 'Show more' })).toBeNull()
    await settle()
  },
}

/** The first page is loading: skeleton rows. */
export const Loading: Story = {
  args: { entries: [], loading: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('group')).toHaveAttribute('aria-busy', 'true')
  },
}

/** Nothing has happened yet. */
export const Empty: Story = {
  args: { entries: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No changes yet')).toBeVisible()
  },
}

const LONG: HistoryEntry[] = [
  {
    id: 'l1',
    at: at(TODAY, '10:12'),
    actor: { name: 'Aleksandra Katarina Milošević-Vukadinović' },
    onBehalfOf: 'Milica Petrović, finance manager and company administrator',
    text: 'Changed the delivery address on the invoice after the customer’s request by e-mail of 05.10.2026.',
    changes: [
      {
        field: 'Delivery address',
        from: 'Bulevar Nemanjića 25, 18000 Niš',
        to: 'Bulevar Mihajla Pupina 10a, fourth floor, office 412, entrance from the courtyard, 11070 Novi Beograd',
      },
      { field: 'Note', to: 'Deliver between 8:00 and 14:00.' },
      { field: 'Contact person', from: 'Petar Jovanović' },
    ],
  },
]

/** Long names, values and sentences in a phone frame: everything wraps, nothing overflows. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <SectionCard title="History">
            <HistoryList entries={LONG} label="History" />
          </SectionCard>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('group')
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth)
    // An emptied field shows "—" as its new value.
    await expect(within(list).getByText('—')).toBeVisible()
    await settle()
  },
}

/** Arabic text, right to left: the arrow between old and new values points left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <HistoryList
        label="السجل"
        entries={[
          {
            id: 'a1',
            at: at(TODAY, '09:02'),
            actor: { name: 'ليلى حسن' },
            text: 'غيّرت تاريخ الاستحقاق',
            changes: [{ field: 'تاريخ الاستحقاق', from: '2026-10-25', to: '2026-10-30' }],
          },
          {
            id: 'a2',
            at: at(TODAY, '08:15'),
            actor: { name: 'وكيل ليرو', kind: 'agent' },
            onBehalfOf: 'عمر خالد',
            text: 'أعدّ تذكيرًا بالدفع',
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <HistoryList
        label="履歴"
        entries={[
          {
            id: 'j1',
            at: at(TODAY, '09:02'),
            actor: { name: '山田 花子' },
            text: '支払期日を変更しました',
            changes: [{ field: '支払期日', from: '2026/10/25', to: '2026/10/30' }],
          },
          {
            id: 'j2',
            at: at(TODAY, '08:15'),
            actor: { name: '会計システム', kind: 'integration' },
            text: '入金を記帳しました',
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** English in a right-to-left page: names, sentences and the on-behalf line keep their order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider locale="ar">
      <HistoryList {...args} />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('On behalf of Milica Petrović'),
      canvas.getByText('Prepared a payment reminder for 86.420,35 RSD'),
    )
  },
}
