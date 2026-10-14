import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { EmailPreview } from './email-preview'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Logo({ name = 'Kvadrat Gradnja' }: { name?: string }) {
  return <span className="font-brand text-md font-bold text-primary">{name}</span>
}

function Body() {
  return (
    <div className="flex flex-col gap-4">
      <p className="bidi-content m-0">Dear Gradska toplana Novi Sad,</p>
      <p className="bidi-content m-0">
        please find attached invoice F-2026-0431 of 14.10.2026. for the works on the heating
        substation in Liman 4.
      </p>
      <p className="bidi-content m-0 text-md font-semibold">1.284.600,00 RSD due 13.11.2026.</p>
      <p className="bidi-content m-0">
        Pay to account 160-0000000123456-78 with reference 97 2026-0431, or scan the IPS QR code in
        the attached PDF.{' '}
        <a href="#/invoice" className="text-link">
          View the invoice online
        </a>
        .
      </p>
      <p className="bidi-content m-0">
        Kind regards,
        <br />
        Kvadrat Gradnja d.o.o.
      </p>
    </div>
  )
}

const FOOTER =
  'Kvadrat Gradnja d.o.o. · Bulevar Mihajla Pupina 10, Novi Sad · You receive this e-mail because you are our customer.'

const meta = {
  title: 'Components/Messages/EmailPreview',
  component: EmailPreview,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an e-mail as its reader will see it, with the application’s sample ' +
          'data filled in — at a desktop mail client’s width (600px) or a phone’s (360px), in a ' +
          'light or a dark mail client (Width and Mail client switches). The message is as ' +
          'simple as the printouts (D27): From, To and Subject over a thin rule, the logo at ' +
          'the start, the body, a small grey footer; black and grey, no boxes. `lang` marks a ' +
          'variant in another language.\n\n**When to use:** beside a template editor, before ' +
          '"Send test". **When not:** a document to print (PrintPage); a sent e-mail in a ' +
          'conversation (MessageList).',
      },
    },
  },
  args: {
    from: 'Kvadrat Gradnja d.o.o. <billing@example.com>',
    to: 'Gradska toplana Novi Sad <accounts@example.com>',
    subject: 'Invoice F-2026-0431 from Kvadrat Gradnja d.o.o.',
    logo: <Logo />,
    footer: FOOTER,
    children: <Body />,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-[44rem]">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof EmailPreview>

export default meta

type Story = StoryObj<typeof meta>

/** A desktop mail client, light. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: 'E-mail preview' })
    await expect(region).toHaveTextContent('Invoice F-2026-0431 from Kvadrat Gradnja d.o.o.')
    await expect(canvas.getByRole('radio', { name: 'Desktop' })).toBeChecked()
  },
}

/** A phone's mail client: 360px. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  args: { defaultWidth: 'phone' },
}

/** A dark mail client: the message in the dark scheme whatever the page's theme. */
export const Dark: Story = {
  name: 'Dark mail client',
  args: { defaultScheme: 'dark' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="email-message"]')).toHaveAttribute(
      'data-liro-theme',
      'dark',
    )
  },
}

/** A dark phone client. */
export const DarkPhone: Story = {
  name: 'Dark mail client, phone width',
  args: { defaultScheme: 'dark', defaultWidth: 'phone' },
}

/** Without the switches: the preview alone. */
export const WithoutControls: Story = {
  name: 'Without switches',
  args: { controls: false },
}

/** The Serbian Cyrillic variant in an English interface: the message carries its language. */
export const Cyrillic: Story = {
  name: 'Serbian Cyrillic variant',
  args: {
    lang: 'sr-Cyrl',
    subject: 'Рачун F-2026-0431 од Kvadrat Gradnja d.o.o.',
    children: (
      <div className="flex flex-col gap-4">
        <p className="bidi-content m-0">Поштовани,</p>
        <p className="bidi-content m-0">у прилогу вам шаљемо рачун F-2026-0431 од 14.10.2026.</p>
        <p className="bidi-content m-0 text-md font-semibold">1.284.600,00 RSD доспева 13.11.2026.</p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="email-message"]')).toHaveAttribute(
      'lang',
      'sr-Cyrl',
    )
  },
}

/** Long subject, sender and footer wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    from: 'Kvadrat Gradnja d.o.o., accounting department for residential construction projects <residential.projects.accounting@example.com>',
    subject:
      'Invoice F-2026-0431 for the works on the heating substation in the residential building Liman 4, phase three, with the interim situation attached',
  },
}

/** On a phone the preview takes the screen's width. */
export const Phone: Story = {
  args: { layout: 'phone' },
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

/** Arabic interface, Arabic message. */
export const Arabic: Story = {
  args: {
    from: 'شركة البناء <billing@example.com>',
    to: 'accounts@example.com',
    subject: 'الفاتورة F-2026-0431',
    logo: <Logo name="شركة البناء" />,
    footer: 'تصلك هذه الرسالة لأنك من عملائنا.',
    children: (
      <div className="flex flex-col gap-4">
        <p className="bidi-content m-0">مرحبًا،</p>
        <p className="bidi-content m-0">نرسل إليكم الفاتورة F-2026-0431 بمبلغ 1.284.600,00 RSD.</p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-[44rem]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    from: '建設会社 <billing@example.com>',
    subject: '請求書 F-2026-0431 のお知らせ',
    logo: <Logo name="建設会社" />,
    footer: 'このメールはお客様にお送りしています。',
    children: (
      <div className="flex flex-col gap-4">
        <p className="bidi-content m-0">いつもお世話になっております。</p>
        <p className="bidi-content m-0">請求書 F-2026-0431（1.284.600,00 RSD）を添付いたします。</p>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-[44rem]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The switches: Phone narrows the message, Dark turns the client dark. */
export const SwitchInteraction: Story = {
  name: 'Switches, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const message = canvasElement.querySelector('[data-slot="email-message"]')
    await userEvent.click(canvas.getByRole('radio', { name: 'Phone' }))
    await expect(message).toHaveAttribute('data-width', 'phone')
    await userEvent.click(canvas.getByRole('radio', { name: 'Dark' }))
    await expect(message).toHaveAttribute('data-liro-theme', 'dark')
  },
}
