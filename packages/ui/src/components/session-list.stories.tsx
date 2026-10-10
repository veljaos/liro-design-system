import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SectionCard } from './cards'
import { SESSIONS } from './group-c-story-data'
import { SessionList, type SessionItem } from './session-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application's "This wasn't me": a link to its security flow. */
function NotMe({ session }: { session: SessionItem }) {
  return (
    <a
      href={`#security/report/${session.id}`}
      className="text-xs text-link no-underline visited:text-link hover:text-link hover:underline active:text-link"
    >
      This wasn’t me
    </a>
  )
}

const meta = {
  title: 'Components/Sign-in/SessionList',
  component: SessionList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the devices signed in to the person’s account: the device as the Core ' +
          'names it, the place, the address, the last activity (the instant’s own date and ' +
          'time), "This device" on the current one, and Sign out for the others (busy while the ' +
          'Core works). `extraAction` is a slot per row for the application’s "This wasn’t me"; ' +
          '"Sign out all other devices" under the list. Rows divided by lines, for a card the ' +
          'application gives it (a SectionCard in the account settings).\n\n' +
          '**When:** the account’s security settings; an administrator’s view of a user ' +
          '(`readOnly`).\n\n' +
          '**When not:** the history of sign-ins (a HistoryList, P5.1).',
      },
    },
  },
  args: { sessions: SESSIONS, label: 'Signed-in devices', onRevoke: fn(), onRevokeOthers: fn() },
  render: (args) => (
    <ExampleProvider>
      <SectionCard title="Signed-in devices" headingLevel={2} className="max-w-160">
        <SessionList {...args} />
      </SectionCard>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SessionList>

export default meta

type Story = StoryObj<typeof meta>

/** Four devices; Sign out of one is busy until the Core answers, then it is gone. */
export const Default: Story = {
  args: {
    extraAction: (session) => (session.current === true ? null : <NotMe session={session} />),
  },
  render: (args) => {
    function Example() {
      const [sessions, setSessions] = useState(SESSIONS)
      return (
        <ExampleProvider>
          <SectionCard title="Signed-in devices" headingLevel={2} className="max-w-160">
            <SessionList
              {...args}
              sessions={sessions}
              onRevoke={(session) =>
                new Promise<void>((resolve) => {
                  window.setTimeout(() => {
                    setSessions((list) => list.filter((each) => each.id !== session.id))
                    resolve()
                  }, 300)
                })
              }
            />
          </SectionCard>
        </ExampleProvider>
      )
    }
    return <Example />
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('This device')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Last active 06.10.2026. 08:15')
    // The current device has no Sign out of its own.
    await expect(canvas.queryByRole('button', { name: 'Sign out: Chrome on Windows' })).toBeNull()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  args: {
    extraAction: (session) => (session.current === true ? null : <NotMe session={session} />),
  },
  render: (args) => {
    function Example() {
      const [sessions, setSessions] = useState(SESSIONS)
      return (
        <ExampleProvider>
          <SectionCard title="Signed-in devices" headingLevel={2} className="max-w-160">
            <SessionList
              {...args}
              sessions={sessions}
              onRevoke={(session) =>
                new Promise<void>((resolve) => {
                  window.setTimeout(() => {
                    setSessions((list) => list.filter((each) => each.id !== session.id))
                    resolve()
                  }, 300)
                })
              }
            />
          </SectionCard>
        </ExampleProvider>
      )
    }
    return <Example />
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('This device')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Last active 06.10.2026. 08:15')
    // The current device has no Sign out of its own.
    await expect(canvas.queryByRole('button', { name: 'Sign out: Chrome on Windows' })).toBeNull()
    const revoke = canvas.getByRole('button', { name: 'Sign out: Edge on Windows' })
    await userEvent.click(revoke)
    await expect(revoke).toHaveAttribute('aria-busy', 'true')
    await waitFor(async () => {
      await expect(canvas.queryByText('Edge on Windows')).toBeNull()
    })
  },
}

/** Sign out all other devices. */
export const RevokeOthers: Story = {
  name: 'Sign out all others',
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Sign out all other devices' }),
    )
    await expect(args.onRevokeOthers).toHaveBeenCalled()
  },
}

/** Only this device: no Sign out, a line says so. */
export const Empty: Story = {
  name: 'Only this device',
  args: { sessions: SESSIONS.slice(0, 1) },
}

/** An administrator looks at a user's devices: nothing can be done here. */
export const ReadOnly: Story = {
  name: 'Read-only',
  args: { readOnly: true },
}

/** Loading: skeleton rows. */
export const Loading: Story = {
  args: { loading: true },
}

/** Long device names and places wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    sessions: [
      {
        id: 'l1',
        device:
          'Microsoft Edge for Business 141 on Windows 11 Enterprise (managed by Kvadrat Gradnja)',
        place: 'Sremska Kamenica, Petrovaradin, Novi Sad, South Bačka District, Serbia',
        address: '2a02:2a8:1:4c00::17',
        lastActive: '2026-10-06T10:42:00+02:00',
        current: true,
      },
      ...SESSIONS.slice(1, 3),
    ],
  },
}

/** At phone width the button goes under the text when it does not fit. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <SectionCard title="Signed-in devices" headingLevel={2}>
            <SessionList {...args} />
          </SectionCard>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic device names and places. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <SessionList
        {...args}
        label="الأجهزة"
        sessions={[
          {
            id: 'a1',
            device: 'كروم على ويندوز',
            place: 'دبي، الإمارات',
            lastActive: '2026-10-06T10:42:00+02:00',
            current: true,
          },
          {
            id: 'a2',
            device: 'سفاري على آيفون',
            kind: 'phone',
            place: 'الرياض، السعودية',
            lastActive: '2026-10-06T08:15:00+02:00',
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese device names and places. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <SessionList
        {...args}
        label="デバイス"
        sessions={[
          {
            id: 'j1',
            device: 'Windows の Chrome',
            place: '東京都、日本',
            lastActive: '2026-10-06T10:42:00+02:00',
            current: true,
          },
          {
            id: 'j2',
            device: 'iPhone の Safari',
            kind: 'phone',
            place: '大阪府、日本',
            lastActive: '2026-10-06T08:15:00+02:00',
          },
        ]}
      />
    </StoryProvider>
  ),
}
