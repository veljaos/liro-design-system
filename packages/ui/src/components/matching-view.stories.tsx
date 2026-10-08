import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { useLiro } from '../provider/liro-provider'
import { settle } from '../primitives/story-helpers'
import { MoneyText } from './display-text'
import { ARABIC, JAPANESE } from './field-story-data'
import { KeyFigures } from './key-figures'
import {
  decimalOf,
  manyOpenItems,
  matchOf,
  OPEN_INVOICES,
  remainingOf,
  STATEMENT_LINES,
  SUGGESTIONS,
  sumParas,
  type MatchingEntry,
  type MatchRecord,
  type SuggestionRecord,
} from './matching-story-data'
import {
  MatchingView,
  type MatchingItem,
  type MatchingMatch,
  type MatchingViewProps,
  type MatchSuggestion,
} from './matching-view'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** An entry of the story data by its id. */
function entry(entries: readonly MatchingEntry[], id: string): MatchingEntry {
  const found = entries.find((each) => each.id === id)
  if (found === undefined) throw new Error(id)
  return found
}

/** The args Storybook needs; every story renders its own demo. */
const NO_LIST = { title: '', items: [], selected: [], onSelectedChange: () => undefined }

/**
 * The application of the stories: it keeps the matches, works out what is left in whole paras
 * (matching-story-data.ts) and hands MatchingView ready items, suggestions and the summary.
 */
function MatchingDemo({
  left = STATEMENT_LINES,
  right = OPEN_INVOICES,
  suggestions = SUGGESTIONS,
  initialMatches = [],
  searchable = false,
  leftTitle = 'Statement 188',
  rightTitle = 'Open invoices',
  view = {},
}: {
  left?: readonly MatchingEntry[]
  right?: readonly MatchingEntry[]
  suggestions?: readonly SuggestionRecord[]
  initialMatches?: MatchRecord[]
  searchable?: boolean
  leftTitle?: string
  rightTitle?: string
  view?: Partial<MatchingViewProps>
}) {
  const { format } = useLiro()
  const [matches, setMatches] = useState<MatchRecord[]>(initialMatches)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [leftSelected, setLeftSelected] = useState<string[]>([])
  const [rightSelected, setRightSelected] = useState<string[]>([])
  const [leftSearch, setLeftSearch] = useState('')
  const [rightSearch, setRightSearch] = useState('')
  const money = (paras: bigint) => format.money(decimalOf(paras), 'RSD')

  const toItem = (entry: MatchingEntry, side: 'left' | 'right', paras?: bigint): MatchingItem => {
    const rest = remainingOf(entry, matches, side)
    return {
      id: entry.id,
      label: entry.label,
      title: entry.title,
      subtitle: entry.subtitle,
      amount: <MoneyText value={decimalOf(paras ?? entry.paras)} currency="RSD" />,
      ...(paras === undefined && rest !== entry.paras ? { remaining: `${money(rest)} left` } : {}),
    }
  }
  const open = (entries: readonly MatchingEntry[], side: 'left' | 'right', search: string) =>
    entries.filter(
      (entry) =>
        remainingOf(entry, matches, side) > 0n &&
        `${entry.title} ${entry.subtitle}`.toLowerCase().includes(search.trim().toLowerCase()),
    )
  const byId = (entries: readonly MatchingEntry[], ids: readonly string[]) =>
    ids.flatMap((id) => entries.filter((entry) => entry.id === id))

  const add = (leftIds: readonly string[], rightIds: readonly string[], how: string) => {
    const record = matchOf(
      `m${String(matches.length + 1)}-${leftIds.join('')}`,
      byId(left, leftIds),
      byId(right, rightIds),
      matches,
      how,
    )
    setMatches([...matches, record])
    setLeftSelected([])
    setRightSelected([])
  }

  const shownSuggestions: MatchSuggestion[] = suggestions
    .filter(
      (suggestion) =>
        !dismissed.includes(suggestion.id) &&
        byId(left, suggestion.left).every((entry) => remainingOf(entry, matches, 'left') > 0n) &&
        byId(right, suggestion.right).every((entry) => remainingOf(entry, matches, 'right') > 0n),
    )
    .map((suggestion) => {
      const leftEntries = byId(left, suggestion.left)
      const rightEntries = byId(right, suggestion.right)
      const leftTotal = sumParas(leftEntries.map((entry) => remainingOf(entry, matches, 'left')))
      const rightTotal = sumParas(rightEntries.map((entry) => remainingOf(entry, matches, 'right')))
      const last = rightEntries.at(-1)
      return {
        id: suggestion.id,
        left: leftEntries.map((entry) => toItem(entry, 'left')),
        right: rightEntries.map((entry) => toItem(entry, 'right')),
        label: `${leftEntries.map((entry) => entry.label).join(', ')} with ${rightEntries.map((entry) => entry.title).join(', ')}`,
        confidence: suggestion.confidence,
        ...(leftTotal < rightTotal && last !== undefined
          ? { note: `Leaves ${money(rightTotal - leftTotal)} open on ${last.title}` }
          : {}),
      }
    })

  const shownMatches: MatchingMatch[] = matches.map((match) => {
    const leftEntries = match.left.flatMap((each) =>
      byId(left, [each.id]).map((entry) => toItem(entry, 'left', each.paras)),
    )
    const rightEntries = match.right.flatMap((each) =>
      byId(right, [each.id]).map((entry) => toItem(entry, 'right', each.paras)),
    )
    return {
      id: match.id,
      left: leftEntries,
      right: rightEntries,
      label: `${leftEntries.map((entry) => entry.label).join(', ')} with ${rightEntries.map((entry) => entry.label).join(', ')}`,
      note: match.how,
    }
  })

  const matched = sumParas(matches.flatMap((match) => match.left.map((each) => each.paras)))
  const leftOpen = open(left, 'left', '')
  const unmatched = sumParas(leftOpen.map((entry) => remainingOf(entry, matches, 'left')))

  return (
    <MatchingView
      label={`Matching ${leftTitle}`}
      left={{
        title: leftTitle,
        description: `${format.number(String(left.length))} lines`,
        items: open(left, 'left', leftSearch).map((entry) => toItem(entry, 'left')),
        selected: leftSelected,
        onSelectedChange: setLeftSelected,
        ...(searchable ? { search: leftSearch, onSearchChange: setLeftSearch } : {}),
      }}
      right={{
        title: rightTitle,
        items: open(right, 'right', rightSearch).map((entry) => toItem(entry, 'right')),
        selected: rightSelected,
        onSelectedChange: setRightSelected,
        ...(searchable ? { search: rightSearch, onSearchChange: setRightSearch } : {}),
      }}
      onMatch={(leftIds, rightIds) => {
        add(leftIds, rightIds, 'Matched by hand')
      }}
      suggestions={shownSuggestions}
      onAcceptSuggestion={(id) => {
        const suggestion = suggestions.find((each) => each.id === id)
        if (suggestion !== undefined) add(suggestion.left, suggestion.right, 'Suggestion accepted')
      }}
      onDismissSuggestion={(id) => {
        setDismissed([...dismissed, id])
      }}
      matches={shownMatches}
      onUnmatch={(id) => {
        setMatches(matches.filter((match) => match.id !== id))
      }}
      summary={
        <KeyFigures
          items={[
            {
              key: 'matched',
              label: 'Matched',
              value: <MoneyText value={decimalOf(matched)} currency="RSD" />,
            },
            {
              key: 'left',
              label: 'Left on the statement',
              value: <MoneyText value={decimalOf(unmatched)} currency="RSD" />,
            },
            { key: 'lines', label: 'Lines left', value: format.number(String(leftOpen.length)) },
          ]}
        />
      }
      {...view}
    />
  )
}

const meta = {
  title: 'Components/Processes/MatchingView',
  component: MatchingView,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** reconciliation — two lists matched against each other: bank statement ' +
          'lines and open invoices, a supplier’s statement and the purchase ledger. The ' +
          'application’s suggestions come first, each with its confidence in words ("Exact: ' +
          'amount and reference", "Likely: amount"); then the two lists to match by hand; then ' +
          'the matches made, each with "Unmatch". A partial match (one payment to part of an ' +
          'invoice, or to several) shows what is left, written by the application. The summary ' +
          'at the top (what is matched, what is left) is the application’s.\n\n' +
          '**Keyboard:** each list is one tab stop (Tab goes to the other); ArrowDown / ArrowUp, ' +
          'Home / End, PageDown / PageUp by ten; Space selects; Enter matches the selection of ' +
          'both lists; Escape clears it. A press selects or deselects.\n\n' +
          '**When:** whenever two sets of records are paired by a person with the system’s ' +
          'help — statements, card settlements, intercompany balances.\n\n' +
          '**When not:** one list processed item by item (WorklistPage); choosing one record ' +
          'for a field (ComboboxField). The view computes nothing: amounts, what is left and ' +
          'whether two items may be matched are the Core’s.\n\n' +
          '**Phones:** one list at a time, switched at the top; the selection is kept.',
      },
    },
  },
  args: { label: 'Matching', left: NO_LIST, right: NO_LIST },
  render: () => (
    <ExampleProvider>
      <MatchingDemo />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof MatchingView>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The keyboard alone: line 4 and F-2026-0406 are selected with Space, matched with Enter, and
 * unmatched again.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const statement = canvas.getByRole('listbox', { name: 'Statement 188' })
    statement.focus()
    await userEvent.keyboard('{End}{ArrowUp} ')
    await expect(within(statement).getByRole('option', { name: /Zlatibor Turs/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.tab()
    const invoices = canvas.getByRole('listbox', { name: 'Open invoices' })
    await expect(invoices).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown} {Enter}')
    const matched = await canvas.findByRole('heading', { name: 'Matched' })
    await expect(matched.parentElement).toHaveTextContent('F-2026-0406')
    await expect(matched.parentElement).toHaveTextContent('Matched by hand')
    await expect(within(statement).queryByRole('option', { name: /Zlatibor Turs/ })).toBeNull()
    await expect(canvasElement).toHaveTextContent('33.612,80')
    await userEvent.click(canvas.getByRole('button', { name: /Unmatch: Line 4, Zlatibor Turs/ }))
    await expect(canvas.queryByRole('heading', { name: 'Matched' })).toBeNull()
    await settle()
  },
}

/** Accepting suggestions; the partial one leaves F-2026-0410 open with what is left. */
export const Suggestions: Story = {
  name: 'Suggestions and a partial match',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Leaves 36.420,35 RSD open on F-2026-0410')
    await userEvent.click(
      canvas.getByRole('button', { name: 'Match: Line 3, Medic Lab Niš d.o.o. with F-2026-0410' }),
    )
    const invoices = canvas.getByRole('listbox', { name: 'Open invoices' })
    await expect(within(invoices).getByRole('option', { name: /F-2026-0410/ })).toHaveTextContent(
      '36.420,35 RSD left',
    )
    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Dismiss suggestion: Line 4, Zlatibor Turs d.o.o. with F-2026-0406',
      }),
    )
    await expect(canvasElement).not.toHaveTextContent('Likely: amount and payer')
    await settle()
  },
}

/** One payment to two invoices: selected on both sides, matched once. */
export const OneToMany: Story = {
  name: 'One payment to two invoices',
  render: () => (
    <ExampleProvider>
      <MatchingDemo
        left={[
          {
            id: 'v1',
            label: 'Line 7, Vojvođanka Mlin a.d.',
            title: 'Vojvođanka Mlin a.d.',
            subtitle: 'Line 7 · Ref. F-2026-0392, F-2026-0390',
            paras: 21426000n,
          },
        ]}
        right={[
          {
            id: 'v2',
            label: 'F-2026-0392, Vojvođanka Mlin a.d.',
            title: 'F-2026-0392',
            subtitle: 'Vojvođanka Mlin a.d.',
            paras: 12870000n,
          },
          {
            id: 'v3',
            label: 'F-2026-0390, Vojvođanka Mlin a.d.',
            title: 'F-2026-0390',
            subtitle: 'Vojvođanka Mlin a.d.',
            paras: 8556000n,
          },
        ]}
        suggestions={[
          { id: 'v', left: ['v1'], right: ['v2', 'v3'], confidence: 'Exact: sum of two invoices' },
        ]}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('Exact: sum of two invoices')
    await userEvent.click(canvas.getByRole('option', { name: /Line 7/ }))
    await userEvent.click(canvas.getByRole('option', { name: /F-2026-0392/ }))
    await userEvent.click(canvas.getByRole('option', { name: /F-2026-0390/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Match' }))
    await expect(await canvas.findByRole('heading', { name: 'Matched' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Nothing left to match')
    await settle()
  },
}

/** Already matched: the statement is posted; nothing can be changed, the lists can be read. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <MatchingDemo
        initialMatches={[
          {
            id: 'm1',
            left: [{ id: 'l1', paras: 13595400n }],
            right: [{ id: 'r1', paras: 13595400n }],
            how: 'Suggestion accepted by Ivana Stojanović',
          },
        ]}
        view={{ readOnly: true }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /Unmatch/ })).toBeNull()
    await expect(canvas.queryByRole('button', { name: /^Match/ })).toBeNull()
    await expect(canvas.getByRole('listbox', { name: 'Statement 188' })).toHaveAttribute(
      'aria-readonly',
      'true',
    )
  },
}

/** Matching is closed for a reason the application gives. */
export const Unavailable: Story = {
  name: 'Disabled with a reason',
  render: () => (
    <ExampleProvider>
      <MatchingDemo
        view={{ matchUnavailableReason: 'Statement 188 is being imported again. Wait a moment.' }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(
      'Unavailable: Statement 188 is being imported again. Wait a moment.',
    )
  },
}

/** The first load: skeleton rows. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <MatchingDemo view={{ loading: true, suggestions: [] }} />
    </ExampleProvider>
  ),
}

/** Everything matched: both lists say so. */
export const Empty: Story = {
  name: 'Empty',
  render: () => (
    <ExampleProvider>
      <MatchingDemo left={[]} right={[]} suggestions={[]} />
    </ExampleProvider>
  ),
}

/** Long names and references wrap; amounts stay on one line with their currency. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <MatchingDemo
        left={[
          {
            id: 'x1',
            label: 'Line 1, Javno komunalno preduzeće',
            title:
              'Javno komunalno preduzeće „Vodovod i kanalizacija“ Novi Sad, Masarikova 17, 21000 Novi Sad',
            subtitle:
              'Line 1 · Ref. 97 1084523170000000412 · Plaćanje po računima F-2026-0412, F-2026-0403 i avansu A-2026-031',
            paras: 123456789012n,
          },
        ]}
        right={[
          {
            id: 'x2',
            label: 'F-2026-0412, Javno komunalno preduzeće',
            title: 'F-2026-0412',
            subtitle:
              'Javno komunalno preduzeće „Vodovod i kanalizacija“ Novi Sad · due 13.10.2026.',
            paras: 123456789012n,
          },
        ]}
        suggestions={[
          {
            id: 'x',
            left: ['x1'],
            right: ['x2'],
            confidence:
              'Likely: the amount and the payer’s account match; the reference has a different model',
          },
        ]}
      />
    </ExampleProvider>
  ),
}

/** 5,000 open items: searched, and only the rows in view are drawn. */
export const LargeList: Story = {
  name: 'Large list (5,000 items)',
  render: () => (
    <ExampleProvider>
      <MatchingDemo right={manyOpenItems(5000)} suggestions={[]} searchable />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const invoices = canvas.getByRole('listbox', { name: 'Open invoices' })
    await expect(within(invoices).getAllByRole('option').length).toBeLessThan(40)
    invoices.focus()
    await userEvent.keyboard('{End}')
    await waitFor(() =>
      expect(within(invoices).getByRole('option', { name: /F-2025-5000/ })).toBeVisible(),
    )
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search: Open invoices' }), '4999')
    await waitFor(() => expect(within(invoices).getAllByRole('option')).toHaveLength(1))
    await settle()
  },
}

/** Phone width: one list at a time; the selection is kept while switching. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <MatchingDemo suggestions={[]} view={{ layout: 'single' }} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('option', { name: /Drina Prevoz/ }))
    await userEvent.click(canvas.getByRole('radio', { name: /Open invoices/ }))
    await userEvent.click(canvas.getByRole('option', { name: /F-2026-0411/ }))
    await userEvent.click(canvas.getByRole('radio', { name: /Statement 188/ }))
    await expect(canvas.getByRole('radio', { name: /Statement 188/ })).toHaveTextContent(
      '1 selected',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Match' }))
    await expect(await canvas.findByRole('heading', { name: 'Matched' })).toBeVisible()
    const view = canvasElement.querySelector('[data-slot="matching-view"]')
    if (view === null) throw new Error('no view')
    await expect(view.scrollWidth).toBeLessThanOrEqual(view.clientWidth)
    await settle()
  },
}

/** Arabic text. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <MatchingDemo
        leftTitle="كشف الحساب ١٨٨"
        rightTitle="الفواتير المفتوحة"
        left={[
          { ...entry(STATEMENT_LINES, 'l2'), title: ARABIC.value, subtitle: ARABIC.description },
        ]}
        right={[{ ...entry(OPEN_INVOICES, 'r2'), subtitle: ARABIC.value }]}
        suggestions={[{ id: 'a', left: ['l2'], right: ['r2'], confidence: ARABIC.label }]}
      />
    </StoryProvider>
  ),
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <MatchingDemo
        leftTitle="入出金明細 188"
        rightTitle="未消込の請求書"
        left={[
          {
            ...entry(STATEMENT_LINES, 'l2'),
            title: JAPANESE.value,
            subtitle: JAPANESE.description,
          },
        ]}
        right={[{ ...entry(OPEN_INVOICES, 'r2'), subtitle: JAPANESE.value }]}
        suggestions={[{ id: 'j', left: ['l2'], right: ['r2'], confidence: JAPANESE.label }]}
      />
    </StoryProvider>
  ),
}
