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
          '**What for:** who may open a file or a folder, in the familiar pattern of the big file ' +
          'services (P5.93): “Add people or roles” with the access level and Invite; “People ' +
          'with access”, each with an access menu (the levels, then Remove access); “General ' +
          'access” — Restricted or Anyone with the link — and the link with a Copy button and ' +
          'an inline “Copied”, its expiry and an optional password. Every person, level and ' +
          'rule is the application’s; each change is reported as it is made. Phones: a ' +
          'full-screen sheet.\n\n' +
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
  args: { description: 'Harbour Homes Ltd. sees it in its client portal.' },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Share Site handover protocol.pdf',
    })
    await expect(within(dialog).getByText('From the folder Site documentation')).toBeVisible()
    await expect(
      within(dialog).getByRole('button', { name: 'View, access for Tom Hughes' }),
    ).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Invite' })).toBeVisible()
    await expect(within(dialog).getByRole('button', { name: 'Copy link' })).toBeVisible()
    await expect(within(dialog).getByText('Protected with a password')).toBeVisible()
  },
}

/** No link: general access Restricted, and what that means. */
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
    await expect(within(dialog).queryByRole('combobox', { name: 'General access' })).toBeNull()
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

/** Phone width: a full-screen sheet. */
export const Phone: Story = {
  args: { layout: 'phone' },
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
    title: 'مشاركة',
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
    title: '共有',
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

/**
 * "Anyone with the link" creates it; Copy says "Copied" beside it; a day that has passed is an
 * error; a person's access menu changes the level; back to Restricted asks once.
 */
export const LinkExpiry: Story = {
  name: 'Link and access, interaction',
  tags: ['interaction', '!dev'],
  render: function Render(args) {
    const [link, setLink] = useState<ShareLinkState | null>(null)
    const [access, setAccess] = useState<readonly ShareAccess[]>(args.access)
    return (
      <ShareDialog
        {...args}
        access={access}
        link={link}
        onLevelChange={(id, level) => {
          setAccess((current) =>
            current.map((each) => (each.id === id ? { ...each, level } : each)),
          )
        }}
        onCreateLink={() => {
          setLink({ url: 'https://files.example.com/s/new', expires: null, password: false })
        }}
        onRevokeLink={() => {
          setLink(null)
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
    const body = within(document.body)
    const dialog = within(body.getByRole('dialog', { name: /^Share/ }))
    await userEvent.click(dialog.getByRole('combobox', { name: 'General access' }))
    await userEvent.click(await body.findByRole('option', { name: 'Anyone with the link' }))
    await userEvent.click(await dialog.findByRole('button', { name: 'Copy link' }))
    // The browser may refuse the clipboard, as a real one can: either answer is said in place.
    await expect(await dialog.findByText(/^(Copied|The link could not be copied)$/)).toBeVisible()
    const expires = dialog.getByRole('textbox', { name: /^Expires/ })
    await userEvent.type(expires, '01.10.2026{Enter}')
    await waitFor(async () => {
      await expect(dialog.getByText('Choose a day after today.')).toBeVisible()
    })
    await userEvent.click(dialog.getByRole('button', { name: 'View, access for Tom Hughes' }))
    await userEvent.click(await body.findByRole('menuitemradio', { name: 'Edit' }))
    await expect(
      await dialog.findByRole('button', { name: 'Edit, access for Tom Hughes' }),
    ).toBeVisible()
    await userEvent.click(dialog.getByRole('combobox', { name: 'General access' }))
    await userEvent.click(await body.findByRole('option', { name: 'Restricted' }))
    const confirm = within(await body.findByRole('alertdialog'))
    await userEvent.click(confirm.getByRole('button', { name: 'Turn off the link' }))
    await waitFor(async () => {
      await expect(dialog.queryByRole('button', { name: 'Copy link' })).toBeNull()
    })
  },
}
