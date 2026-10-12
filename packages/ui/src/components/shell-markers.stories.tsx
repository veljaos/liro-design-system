import type { Meta, StoryObj } from '@storybook/react-vite'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import {
  ConnectionState,
  EnvironmentMarker,
  ImpersonationBar,
  OfflineIndicator,
} from './shell-markers'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/** An end instant `minutes` from now (less a second, so the whole minutes read `minutes`). */
function inMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000 - 1_000).toISOString()
}

/** The impersonation bar of the stories: support for Milica Petrović, 23 minutes left. */
function SupportSession({ onExit = () => undefined }: { onExit?: () => void }) {
  const [endsAt] = useState(() => inMinutes(23))
  return (
    <ImpersonationBar
      person="Milica Petrović"
      mode="Read-only"
      reason="Support request 4821"
      endsAt={endsAt}
      onExit={onExit}
    />
  )
}

const meta = {
  title: 'Components/Feedback/Shell markers',
  component: ImpersonationBar,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the markers that tell where and how the user is working, placed in the ' +
          'AppShell’s slots. `ImpersonationBar` — a session in someone else’s account (support, ' +
          'an accountant for a client): whose account, the mode, the reason and the minutes left ' +
          '(the application passes the end instant; the bar redraws as each minute passes), and ' +
          '"Exit"; never dismissible, above the header and sticky with it, in the warning tone. ' +
          '`OfflineIndicator` — the connection is lost: a neutral strip under the header for as ' +
          'long as it lasts, with what is waiting in the application’s words; it goes without a ' +
          'trace when the connection returns, and assistive technology hears "Back online" once. ' +
          '`EnvironmentMarker` — Sandbox, Demo, Test: a bordered badge after the brand, on phones ' +
          'too, warning by default, never blue. `ConnectionState` — where a draft is: saved on ' +
          'this device, sending, sent, or not sent with "Send again"; small text in a ' +
          '`role="status"` beside the draft’s actions.\n\n' +
          '**When:** whenever the state is true — the markers decide nothing; the Core knows the ' +
          'session, the connection and the environment.\n\n' +
          '**When not:** a message about one page’s content (Alert); an application-wide notice ' +
          'such as a trial ending or a maintenance window (a Banner in AppShell’s `banners`); the ' +
          'result of an action (Toast); a long job (JobProgress).',
      },
    },
  },
  args: { person: 'Milica Petrović', onExit: fn() },
  render: () => (
    <ExampleProvider>
      <SupportSession />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ImpersonationBar>

export default meta

type Story = StoryObj<typeof meta>

/** All four together, as they stand in the shell (AppShell has the full picture). */
export const Default: Story = {
  render: () => (
    <ExampleProvider>
      <div className="flex flex-col gap-6">
        <SupportSession />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-primary">Liro Business Apps</span>
          <EnvironmentMarker label="Sandbox" />
        </div>
        <OfflineIndicator
          offline
          waiting="3 changes are kept on this device and sent when the connection returns."
        />
        <ConnectionState status="local" at="2026-10-06T14:12:00+02:00" />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('region', { name: 'Session as another user' })
    await expect(bar).toHaveTextContent('Viewing as Milica Petrović')
    await expect(bar).toHaveTextContent('23 minutes left')
    await expect(within(bar).queryByRole('button', { name: 'Close' })).toBeNull()
    await expect(canvas.getByText('Environment:')).toBeInTheDocument()
    await expect(canvas.getByText('Saved on this device at 14:12')).toBeVisible()
  },
}

/** The bar's only way out: "Exit" ends the session (the application's). */
export const Exit: Story = {
  tags: ['interaction'],
  render: (args) => (
    <ExampleProvider>
      <SupportSession onExit={args.onExit} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement, args }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Exit' }))
    await expect(args.onExit).toHaveBeenCalledOnce()
  },
}

/** No reason, no end time; and a session whose time is up (the Core ends it). */
export const ImpersonationVariants: Story = {
  name: 'Impersonation, without reason and time is up',
  render: () => (
    <ExampleProvider>
      <div className="flex flex-col gap-4">
        <ImpersonationBar
          person="Kvadrat Gradnja d.o.o."
          mode="Full access"
          onExit={() => undefined}
        />
        <ImpersonationBar
          person="Jelena Marković"
          mode="Read-only"
          endsAt="2026-10-06T09:00:00+02:00"
          exitLabel="Return to my account"
          onExit={() => undefined}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Time is up')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Return to my account' })).toBeVisible()
  },
}

/**
 * Going offline and back: the strip appears with what is waiting; when the connection returns it
 * goes, and the live region says "Back online" once.
 */
export const OfflineAndBack: Story = {
  name: 'Offline and back',
  render: function Render() {
    const [offline, setOffline] = useState(false)
    return (
      <ExampleProvider>
        <div className="flex flex-col gap-4">
          <div>
            <Button
              family="neutral"
              icon={RefreshCw}
              label={offline ? 'Simulate: connection returns' : 'Simulate: connection lost'}
              onClick={() => {
                setOffline(!offline)
              }}
            />
          </div>
          <OfflineIndicator
            offline={offline}
            waiting="2 changes are kept on this device and sent when the connection returns."
            action={<Button intent="refresh" label="Try now" emphasis="secondary" />}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/2 changes are kept/)).toBeNull()
    await settle()
  },
}

export const OfflineAndBackInteraction: Story = {
  name: 'Offline and back, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [offline, setOffline] = useState(false)
    return (
      <ExampleProvider>
        <div className="flex flex-col gap-4">
          <div>
            <Button
              family="neutral"
              icon={RefreshCw}
              label={offline ? 'Simulate: connection returns' : 'Simulate: connection lost'}
              onClick={() => {
                setOffline(!offline)
              }}
            />
          </div>
          <OfflineIndicator
            offline={offline}
            waiting="2 changes are kept on this device and sent when the connection returns."
            action={<Button intent="refresh" label="Try now" emphasis="secondary" />}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByText(/2 changes are kept/)).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate: connection lost' }))
    await expect(canvas.getByText(/2 changes are kept/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Try now' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Simulate: connection returns' }))
    await waitFor(() => expect(canvas.queryByText(/2 changes are kept/)).toBeNull())
    const live = canvasElement.querySelector('[data-slot="offline-indicator"] [role="status"]')
    await expect(live).toHaveTextContent('Back online')
  },
}

/** Every state of a draft; "Send again" only after a failure, when the application can. */
export const ConnectionStates: Story = {
  name: 'Connection states',
  render: function Render() {
    const [sent, setSent] = useState(0)
    return (
      <ExampleProvider>
        <div className="flex flex-col items-start gap-3">
          <ConnectionState status="local" />
          <ConnectionState status="local" at="2026-10-06T14:12:00+02:00" />
          <ConnectionState status="sending" />
          <ConnectionState status="sent" at="2026-10-06T14:13:00+02:00" />
          <ConnectionState
            status="failed"
            onRetry={() => {
              setSent(sent + 1)
            }}
          />
          <ConnectionState status="failed" />
          <output className="text-xs text-secondary">Sent again: {sent}</output>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Saved on this device')).toBeVisible()
    await expect(canvas.getByText('Sent at 14:13')).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: 'Send again' })).toHaveLength(1)
    await settle()
  },
}

export const ConnectionStatesInteraction: Story = {
  name: 'Connection states, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [sent, setSent] = useState(0)
    return (
      <ExampleProvider>
        <div className="flex flex-col items-start gap-3">
          <ConnectionState status="local" />
          <ConnectionState status="local" at="2026-10-06T14:12:00+02:00" />
          <ConnectionState status="sending" />
          <ConnectionState status="sent" at="2026-10-06T14:13:00+02:00" />
          <ConnectionState
            status="failed"
            onRetry={() => {
              setSent(sent + 1)
            }}
          />
          <ConnectionState status="failed" />
          <output className="text-xs text-secondary">Sent again: {sent}</output>
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Saved on this device')).toBeVisible()
    await expect(canvas.getByText('Sent at 14:13')).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: 'Send again' })).toHaveLength(1)
    await userEvent.click(canvas.getByRole('button', { name: 'Send again' }))
    await expect(canvas.getByText('Sent again: 1')).toBeVisible()
  },
}

/** The environments: warning by default; other tones when the application chooses, never blue. */
export const Environments: Story = {
  render: () => (
    <ExampleProvider>
      <div className="flex flex-wrap items-center gap-4">
        <EnvironmentMarker label="Sandbox" />
        <EnvironmentMarker label="Demo" tone="premium" />
        <EnvironmentMarker label="Test" tone="neutral" />
        <EnvironmentMarker label="Training" tone="success" />
        <EnvironmentMarker label="Staging" tone="danger" />
      </div>
    </ExampleProvider>
  ),
}

/** Long texts wrap; the exit and the action keep their place at the end. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <div className="flex max-w-150 flex-col gap-4">
        <ImpersonationBar
          person="Poljoprivredno-industrijski kombinat Banat Agrar d.o.o."
          mode="Read-only, no documents can be issued"
          reason={LONG.description}
          endsAt="2026-10-06T09:00:00+02:00"
          onExit={() => undefined}
        />
        <OfflineIndicator
          offline
          waiting={LONG.error}
          action={<Button intent="refresh" label="Try now" emphasis="secondary" />}
        />
        <ConnectionState status="failed" onRetry={() => undefined} />
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the bars wrap under one another, the exit stays in reach. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="flex flex-col gap-4">
          <SupportSession />
          <OfflineIndicator offline layout="phone" waiting="3 changes are kept on this device." />
          <div className="flex items-center gap-4 px-4">
            <span className="text-sm font-semibold text-primary">Liro</span>
            <EnvironmentMarker label="Sandbox" />
          </div>
          <div className="px-4">
            <ConnectionState status="sending" />
          </div>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const frame = canvasElement.querySelector('[data-slot="impersonation-bar"]')?.parentElement
    await expect(frame?.scrollWidth).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left: the icon at the start (right), the exit at the end. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex flex-col gap-4">
        <ImpersonationBar
          person={ARABIC.value}
          mode={ARABIC.options[0] ?? ''}
          reason={ARABIC.reason}
          onExit={() => undefined}
        />
        <OfflineIndicator offline waiting={ARABIC.description} />
        <div className="flex items-center gap-4">
          <EnvironmentMarker label={ARABIC.label} />
          <ConnectionState status="failed" onRetry={() => undefined} />
        </div>
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="flex flex-col gap-4">
        <ImpersonationBar
          person={JAPANESE.value}
          mode={JAPANESE.options[0] ?? ''}
          reason={JAPANESE.reason}
          onExit={() => undefined}
        />
        <OfflineIndicator offline waiting={JAPANESE.description} />
        <div className="flex items-center gap-4">
          <EnvironmentMarker label={JAPANESE.label} />
          <ConnectionState status="sent" />
        </div>
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page (P3.6): the sentences keep their order, the layout is RTL. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="flex flex-col gap-4">
          <ImpersonationBar person="Milica Petrović" mode="Read-only" onExit={() => undefined} />
          <OfflineIndicator offline waiting="3 changes are waiting." />
          <ConnectionState status="failed" onRetry={() => undefined} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('Viewing as Milica Petrović'),
      canvas.getByText('3 changes are waiting.'),
      canvas.getByText('Not sent. It is kept on this device.'),
    )
  },
}
