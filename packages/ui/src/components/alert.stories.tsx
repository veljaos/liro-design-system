import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Alert, Banner } from './alert'
import { Button } from './button'
import { EmptyState } from './empty-state'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { expectContentDirection, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a message in the page about what the user is looking at — the period ' +
          "is closed, the document was sent, a rate is missing. Mantine's Alert, light variant " +
          "(the owner's old look): the tone's subtle background, the title and icon in the " +
          "tone's colour. Tones neutral (the default, grey), info, success, warning, danger — info only when asked for, blue being kept for actions; warnings and dangers are " +
          'announced at once (`role="alert"`), the others politely. `onClose` makes it ' +
          'dismissible. `Banner` is the same look in one row across its container, with actions ' +
          'at the end, for something about the whole page or application.\n\n' +
          "**When not:** a result of the user's action that needs no staying (Toast); a problem " +
          'with one field (its error under the field); a question (ConfirmDialog).',
      },
    },
  },
  play: settle,
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

/** The five tones, with and without a title; the first has no tone, so it is neutral. */
export const Tones: Story = {
  render: () => (
    <div className="flex max-w-150 flex-col gap-4">
      <Alert title="Draft">This document is not sent yet.</Alert>
      <Alert tone="info" title="New exchange rates">
        Rates for 28 September are loaded.
      </Alert>
      <Alert tone="success" title="Sent">
        24 invoices were sent to the customers.
      </Alert>
      <Alert tone="warning" title="Rate from yesterday">
        Today&apos;s exchange rate is not published yet.
      </Alert>
      <Alert tone="danger" title="Period closed">
        Entries dated in August cannot be changed.
      </Alert>
      <Alert>Without a title or a tone: the message alone, neutral.</Alert>
    </div>
  ),
}

/** Dismissible: the close button (24px) removes it. */
export const Dismissible: Story = {
  render: function Render() {
    const [shown, setShown] = useState(true)
    return (
      <div className="min-h-30 max-w-150">
        {shown ? (
          <Alert
            tone="warning"
            title="Rate from yesterday"
            onClose={() => {
              setShown(false)
            }}
          >
            Today&apos;s exchange rate is not published yet.
          </Alert>
        ) : (
          <p className="m-0 text-sm text-secondary">Closed.</p>
        )}
      </div>
    )
  },
}

export const DismissibleInteraction: Story = {
  name: 'Dismissible, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [shown, setShown] = useState(true)
    return (
      <div className="min-h-30 max-w-150">
        {shown ? (
          <Alert
            tone="warning"
            title="Rate from yesterday"
            onClose={() => {
              setShown(false)
            }}
          >
            Today&apos;s exchange rate is not published yet.
          </Alert>
        ) : (
          <p className="m-0 text-sm text-secondary">Closed.</p>
        )}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(canvas.queryByRole('alert')).toBeNull())
    await userEvent.click(canvas.getByText('Closed.'))
  },
}

/** Banner: one row across the container, actions at the end. */
export const Banners: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Banner
        tone="danger"
        title="Offline."
        actions={<Button intent="refresh" label="Reconnect" />}
      >
        Changes are kept on this device until the connection returns.
      </Banner>
      <Banner tone="info" onClose={() => undefined}>
        The trial ends on 15 October 2026.
      </Banner>
      <Banner tone="success">The year 2025 is closed.</Banner>
    </div>
  ),
}

/** Long text at phone width: everything wraps; the banner's actions move under the text. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-4">
      <Alert tone="danger" title={LONG.label} onClose={() => undefined}>
        {LONG.error}
      </Alert>
      <Banner tone="warning" title={LONG.label} actions={<Button intent="edit" label="Review" />}>
        {LONG.description}
      </Banner>
    </div>
  ),
}

/** Arabic sample text, right to left: the icon at the start (right), the close button at the end. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-150 flex-col gap-4">
      <Alert tone="warning" title={ARABIC.label} onClose={() => undefined}>
        {ARABIC.description}
      </Alert>
      <Banner
        tone="danger"
        title={ARABIC.label}
        actions={<Button intent="refresh" label={ARABIC.value} />}
      >
        {ARABIC.error}
      </Banner>
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-150 flex-col gap-4">
      <Alert tone="success" title={JAPANESE.label}>
        {JAPANESE.description}
      </Alert>
      <Banner tone="info" onClose={() => undefined}>
        {JAPANESE.error}
      </Banner>
    </div>
  ),
}

/**
 * English in a right-to-left page (P3.6): alert, banner and empty-state texts keep their own
 * order ("3 invoices are ready to send." was ".invoices are ready to send 3"); icons, close
 * buttons and actions stay where right to left puts them.
 */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex max-w-150 flex-col gap-4">
        <Alert tone="info" title="Ready (3)" onClose={() => undefined}>
          3 invoices are ready to send.
        </Alert>
        <Banner tone="warning" actions={<Button intent="refresh" label="Reload" />}>
          Today&apos;s exchange rate is not published yet.
        </Banner>
        <EmptyState compact />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('3 invoices are ready to send.'),
      canvas.getByText('Ready (3)'),
      canvas.getByText("Today's exchange rate is not published yet."),
    )
    await settle()
  },
}
