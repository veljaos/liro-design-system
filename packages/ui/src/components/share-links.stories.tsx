import type { Meta, StoryObj } from '@storybook/react-vite'
import { Mail } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ShareLinks } from './share-links'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const URL = 'https://blog.example.com/sef-rejected'

const TARGETS = [
  {
    key: 'mail',
    label: 'E-mail',
    href: `mailto:?subject=Why%20e-invoices%20are%20rejected&body=${encodeURIComponent(URL)}`,
    icon: Mail,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL)}`,
  },
]

const meta = {
  title: 'Components/Reading/ShareLinks',
  component: ShareLinks,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** share a page by its address: "Copy link" (a polite "Link copied" ' +
          'after it) and the application’s places to share as neutral link buttons with their ' +
          'words — never a network’s colour as a fill. An external place opens in a new tab.' +
          '\n\n**When to use:** under an article or a public record. **When not:** sending a ' +
          'record to someone inside the application (an action of the page).',
      },
    },
  },
  args: { url: URL, targets: TARGETS },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof ShareLinks>

export default meta

type Story = StoryObj<typeof meta>

/** "Share", Copy link, E-mail and LinkedIn. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Share' })
    await expect(within(group).getByRole('button', { name: 'Copy link' })).toBeVisible()
    await expect(within(group).getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'target',
      '_blank',
    )
  },
}

/** Only Copy link. */
export const CopyOnly: Story = {
  name: 'Copy link only',
  args: { targets: [] },
}

/** Long labels wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Share this article with a colleague',
    targets: [
      ...TARGETS,
      {
        key: 'team',
        label: 'Send to your accountant in the client portal',
        href: '#/portal/share',
      },
    ],
  },
}

/** Phone width: the buttons wrap. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    label: 'مشاركة',
    targets: [{ key: 'mail', label: 'البريد الإلكتروني', href: 'mailto:', icon: Mail }],
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
    label: '共有',
    targets: [{ key: 'mail', label: 'メール', href: 'mailto:', icon: Mail }],
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

/** Copy link: the status says what happened (the browser may refuse the clipboard). */
export const CopyInteraction: Story = {
  name: 'Copy link, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy link' }))
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent(
        /^(Link copied|The link could not be copied)$/,
      ),
    )
  },
}
