import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText, List, Paperclip } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { Breadcrumbs, CursorPagination, ShortcutHint, Tabs } from './navigation'

const meta = {
  title: 'Components/Navigation',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          '**Tabs** — parts of one screen shown one at a time, the tabs inside a module ' +
          '(Appendix B.8); the list is always centred; a hidden panel is not kept, so a dialog ' +
          'opened from a tab belongs at page level. **Breadcrumbs** — where the user is, from ' +
          "the third level on; links through the provider's `linkComponent`, the last item is " +
          'the current page. **CursorPagination** — only previous and next, with a count ' +
          'beside them, because lists page by cursor. **ShortcutHint** — a keyboard shortcut as ' +
          'keys.\n\n' +
          '**When not:** Tabs for moving between modules (the launchpad, P4.2); page numbers ' +
          '(never: the server pages by cursor).',
      },
    },
  },
  args: { items: [] },
  play: settle,
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

const TABS = [
  {
    value: 'general',
    label: 'General',
    icon: FileText,
    content: <p className="m-0 p-4 text-sm">General data of the invoice.</p>,
  },
  {
    value: 'lines',
    label: 'Lines',
    icon: List,
    content: <p className="m-0 p-4 text-sm">Twelve lines.</p>,
  },
  {
    value: 'files',
    label: 'Attachments',
    icon: Paperclip,
    content: <p className="m-0 p-4 text-sm">Two files.</p>,
  },
  { value: 'history', label: 'History', disabled: true, content: null },
]

/** Tabs: the arrow keys move between tabs; only the active panel is mounted. */
export const TabsDefault: Story = {
  name: 'Tabs',
  render: () => <Tabs items={TABS} label="Invoice F-114" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const general = canvas.getByRole('tab', { name: 'General' })
    await userEvent.click(general)
    const rtl = getComputedStyle(general).direction === 'rtl'
    await userEvent.keyboard(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    await expect(canvas.getByRole('tab', { name: 'Lines' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(canvas.queryByText('General data of the invoice.')).toBeNull()
  },
}

/** Breadcrumbs: links up to the current page, "›" between (mirrored in right-to-left). */
export const BreadcrumbsDefault: Story = {
  name: 'Breadcrumbs',
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Sales', href: '#sales' },
        { label: 'Invoices', href: '#invoices' },
        { label: 'F-114' },
      ]}
    />
  ),
}

/** CursorPagination: previous and next with the count at the start. */
export const Pagination: Story = {
  name: 'CursorPagination',
  render: function Render() {
    const [page, setPage] = useState(0)
    return (
      <CursorPagination
        className="max-w-150"
        hasPrevious={page > 0}
        hasNext={page < 2}
        onPrevious={() => {
          setPage(page - 1)
        }}
        onNext={() => {
          setPage(page + 1)
        }}
        count={`Rows ${String(page * 50 + 1)}–${String(page * 50 + 50)} of more than 100`}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByRole('button', { name: 'Previous' })).toBeEnabled()
  },
}

/** ShortcutHint. */
export const Shortcut: Story = {
  name: 'ShortcutHint',
  render: () => (
    <p className="m-0 flex items-center gap-2 text-sm">
      Search: <ShortcutHint keys={['Ctrl', 'K']} /> or <ShortcutHint keys={['⌘', 'K']} />
    </p>
  ),
}

/** Long labels at phone width: the tabs and the trail wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6">
      <Breadcrumbs items={[{ label: 'Sales', href: '#s' }, { label: LONG.label }]} />
      <Tabs
        items={[
          {
            value: 'a',
            label: 'Delivery address',
            content: <p className="m-0 p-4 text-sm">{LONG.value}</p>,
          },
          { value: 'b', label: 'Registered address', content: null },
          { value: 'c', label: 'Contacts', content: null },
        ]}
      />
      <CursorPagination
        hasPrevious
        hasNext
        onPrevious={() => undefined}
        onNext={() => undefined}
        count={LONG.description}
      />
    </div>
  ),
}

/** Arabic sample text, right to left: "›" points left; the chevrons mirror. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex flex-col gap-6">
      <Breadcrumbs
        items={ARABIC.options.map((label, index) =>
          index < 2 ? { label, href: '#a' } : { label },
        )}
      />
      <Tabs
        items={ARABIC.options.map((label) => ({
          value: label,
          label,
          content: <p className="m-0 p-4 text-sm">{ARABIC.description}</p>,
        }))}
      />
      <CursorPagination
        hasPrevious
        hasNext={false}
        onPrevious={() => undefined}
        onNext={() => undefined}
        count={ARABIC.value}
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex flex-col gap-6">
      <Breadcrumbs
        items={JAPANESE.options.map((label, index) =>
          index < 2 ? { label, href: '#j' } : { label },
        )}
      />
      <Tabs
        items={JAPANESE.options.map((label) => ({
          value: label,
          label,
          content: <p className="m-0 p-4 text-sm">{JAPANESE.description}</p>,
        }))}
      />
      <ShortcutHint keys={['Ctrl', 'K']} />
    </div>
  ),
}
