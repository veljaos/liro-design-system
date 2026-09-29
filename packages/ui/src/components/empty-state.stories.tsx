import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, RefreshCw } from 'lucide-react'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { EmptyState, ErrorState } from './empty-state'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

const meta = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what a list, a table or a panel shows when it has nothing — and why. ' +
          '`empty`: nothing here yet, with the first step ("Create an invoice"); `no-results`: ' +
          'nothing matches, with a way to widen the search; `error`: loading failed, with a ' +
          'retry. The error never looks like the empty state (a different icon), because the ' +
          "user must react differently. Titles and texts come from the provider's messages " +
          'unless given. `compact` for cards and table bodies. `ErrorState` adds the case number ' +
          'to quote and a "report a problem" action.\n\n' +
          '**When not:** a problem with part of a page that still works (Alert); a failure the ' +
          'user just caused (Toast).',
      },
    },
  },
  play: settle,
} satisfies Meta<typeof EmptyState>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

/** The three variants with their default texts and a first step. */
export const Variants: Story = {
  render: () => (
    <div className="grid gap-8 md:grid-cols-3">
      <EmptyState action={{ label: 'Create an invoice', icon: Plus, onClick: noop }} />
      <EmptyState variant="no-results" action={{ label: 'Clear the filters', onClick: noop }} />
      <EmptyState variant="error" action={{ label: 'Try again', icon: RefreshCw, onClick: noop }} />
    </div>
  ),
}

/** Compact (24px icon, Mantine size sm), for a card or a table body; texts from the application. */
export const Compact: Story = {
  render: () => (
    <div className="max-w-100 rounded-md border border-default bg-surface-raised p-6">
      <EmptyState compact title="No attachments" description="Drop files here or choose them." />
    </div>
  ),
}

/** ErrorState: the case number to quote and a report action. */
export const ErrorWithCase: Story = {
  name: 'ErrorState, with a case number',
  render: () => (
    <ErrorState
      caseId="7F3A-21C9"
      action={{ label: 'Try again', icon: RefreshCw, onClick: noop }}
      reportAction={
        <Button family="neutral" icon={Plus} emphasis="menu" label="Report a problem" />
      }
    />
  ),
}

/** Long text at phone width: centred, wrapped, nothing clipped. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <EmptyState
        title={LONG.label}
        description={LONG.description}
        action={{ label: LONG.error, onClick: noop }}
      />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl">
      <ErrorState
        title={ARABIC.label}
        description={ARABIC.description}
        caseId="7F3A-21C9"
        action={{ label: ARABIC.value, onClick: noop }}
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja">
      <EmptyState
        variant="no-results"
        title={JAPANESE.label}
        description={JAPANESE.description}
        action={{ label: JAPANESE.value, onClick: noop }}
      />
    </div>
  ),
}
