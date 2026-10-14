import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ACCESS, CANDIDATES, LEVELS } from './file-story-data'
import { ShareDialog, type ShareAccess, type ShareLinkState } from './share-dialog'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const LINK: ShareLinkState = {
  url: 'https://files.example.com/s/7Kq2-Harbour-handover',
  expires: '2026-10-31',
  password: true,
}

const meta = {
  title: 'Components/Files/ShareDialog',
  component: ShareDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** who may open a file or a folder — people, roles or a client’s portal, ' +
          'each with View or Edit (the application’s levels) — and an external link with an ' +
          'expiry date and an optional password; who has access now, where it comes from, and ' +
          'revoking it. Every person, level and rule is the application’s; each change is ' +
          'reported as it is made.\n\n' +
          '**When to use:** "Share…" on a file or a folder. **When not:** sharing a public page ' +
          'by its address (ShareLinks); permissions of a role across the application ' +
          '(PermissionMatrix).',
      },
    },
  },
  args: {
    open: true,
    subject: 'Site handover protocol.pdf',
    levels: LEVELS,
    candidates: CANDIDATES,
    access: ACCESS,
    link: LINK,
    onAdd: () => undefined,
    onLevelChange: () => undefined,
    onRevoke: () => undefined,
    onCreateLink: () => undefined,
    onLinkChange: () => undefined,
    onRevokeLink: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ShareDialog>

export default meta

type Story = StoryObj<typeof meta>

/** Four with access (the owner, a role from the folder, a person, a client portal) and a link. */
export const Default: Story = {
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Share Site handover protocol.pdf',
    })
    await expect(within(dialog).getByText('From the folder Site documentation')).toBeVisible()
    await expect(
      within(dialog).getByRole('button', { name: 'Remove access: Tom Hughes' }),
    ).toBeVisible()
    await expect(within(dialog).getByText('Protected with a password')).toBeVisible()
  },
}

/** No link yet: what one does, and "Create link". */
export const NoLink: Story = {
  name: 'No link',
  args: { link: null },
}

/** Only the owner. */
export const OnlyOwner: Story = {
  name: 'Only the owner',
  args: { access: ACCESS.slice(0, 1), link: null },
}

/** A staff file: never by link, and only HR adds people. */
export const Restricted: Story = {
  args: {
    subject: 'Ravi Patel',
    link: null,
    linkUnavailable: 'Staff files are never shared by link.',
    addUnavailable: 'Only HR gives access to staff files.',
    access: ACCESS.slice(0, 2),
  },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByText('Staff files are never shared by link.')).toBeVisible()
    await expect(within(dialog).queryByRole('button', { name: 'Create link' })).toBeNull()
  },
}

const LONG_ACCESS: ShareAccess[] = [
  {
    id: 'long',
    name: 'Harbour Homes Ltd., residential development department for the northern sites',
    kind: 'portal',
    detail: 'Client portal: Oliver Grant, Mia Thompson-Whitaker and four more people',
    level: 'view',
    inherited: 'From the folder Site documentation / Harbour Road site / Handover',
  },
]

/** Long names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    subject:
      'Site handover protocol for the residential blocks C and D, signed after the second inspection round.pdf',
    access: [...ACCESS.slice(0, 1), ...LONG_ACCESS],
  },
}

/** Phone width: a bottom sheet. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    subject: 'محضر التسليم.pdf',
    levels: [
      { value: 'view', label: 'عرض' },
      { value: 'edit', label: 'تعديل' },
    ],
    candidates: [{ id: 'x', label: 'سارة حداد' }],
    access: [
      { id: 'o', name: 'سارة حداد', kind: 'person', level: 'edit', owner: true },
      { id: 'p', name: 'عمر خليل', kind: 'person', level: 'view' },
    ],
    link: null,
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    subject: '引き渡し記録.pdf',
    levels: [
      { value: 'view', label: '閲覧' },
      { value: 'edit', label: '編集' },
    ],
    candidates: [{ id: 'x', label: '山田 花子' }],
    access: [
      { id: 'o', name: '山田 花子', kind: 'person', level: 'edit', owner: true },
      { id: 'p', name: '佐藤 一郎', kind: 'person', level: 'view' },
    ],
    link: null,
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Create a link, give it a day that has passed (an error), then a later one. */
export const LinkExpiry: Story = {
  name: 'Link expiry, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [link, setLink] = useState<ShareLinkState | null>(null)
    return (
      <ShareDialog
        {...args}
        link={link}
        onCreateLink={() => {
          setLink({ url: 'https://files.example.com/s/new', expires: null, password: false })
        }}
        onLinkChange={(change) => {
          setLink((current) =>
            current === null
              ? current
              : {
                  ...current,
                  ...(change.expires === undefined ? {} : { expires: change.expires }),
                },
          )
        }}
      />
    )
  },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create link' }))
    const expires = await within(dialog).findByRole('textbox', { name: /^Expires/ })
    await userEvent.type(expires, '01.10.2026{Enter}')
    await waitFor(async () => {
      await expect(within(dialog).getByText('Choose a day after today.')).toBeVisible()
    })
  },
}
