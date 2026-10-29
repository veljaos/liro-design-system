import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { NewsletterSignup } from './newsletter-signup'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const noop = () => undefined

const meta = {
  title: 'Components/Reading/NewsletterSignup',
  component: NewsletterSignup,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an e-mail address to receive news, under an article or at the end ' +
          'of a list: the application’s title and line, the address (left to right, autofill) ' +
          'and Subscribe, the consent note. An empty or misshaped address is said under the ' +
          'field before anything is sent; `onSubscribe` may return a promise ' +
          '("Subscribing…"); then "Thank you — check your inbox to confirm.". The application ' +
          'subscribes and confirms.\n\n**When to use:** a public reading page. **When not:** ' +
          'notification settings of a signed-in user (SettingsPage); a contact form ' +
          '(TextField, TextAreaField).',
      },
    },
  },
  args: {
    title: 'Get Liro’s articles by e-mail',
    description: 'One e-mail a month with new articles and product news. No advertising.',
    consent: 'We use your address only for this newsletter. You can unsubscribe in every e-mail.',
    onSubscribe: noop,
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
} satisfies Meta<typeof NewsletterSignup>

export default meta

type Story = StoryObj<typeof meta>

/** The address and Subscribe in one row, the consent under them. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'E-mail address' })).toHaveAttribute(
      'type',
      'email',
    )
    await expect(canvas.getByRole('button', { name: 'Subscribe' })).toBeEnabled()
  },
}

/** Subscribe filled, where it is the page's main action. */
export const Primary: Story = {
  name: 'Main action',
  args: { emphasis: 'primary' },
}

/** Subscribing. */
export const Sending: Story = {
  args: { sending: true, defaultEmail: 'milica.petrovic@example.com' },
}

/** It failed: the application's words. */
export const Failed: Story = {
  name: 'Error',
  args: {
    defaultEmail: 'milica.petrovic@example.com',
    error: 'The address could not be subscribed. Try again in a minute.',
  },
}

/** Subscribed: only the thanks — no title, line, form or note (P5.94 item 11). */
export const Subscribed: Story = {
  args: { subscribed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Thank you — check your inbox to confirm.',
    )
    await expect(canvas.queryByRole('heading')).toBeNull()
    await expect(canvas.queryByRole('textbox')).toBeNull()
  },
}

/** Closed for now (P5.93): the address read-only, Subscribe unavailable, the reason in words. */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  args: { unavailableReason: 'The newsletter is paused until 1 November.' },
}

/** Long text wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title:
      'Get every new article about e-invoicing, accounting, payroll and the Liro product by e-mail, once a month',
    description:
      'We write about what changes in the rules for small companies and their accountants, how to work faster in Liro, and what is coming next — never advertising, never shared with anyone.',
    subscribeLabel: 'Subscribe to the monthly newsletter',
  },
}

/** Phone width: the field and the button under each other. */
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

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'احصل على مقالاتنا بالبريد الإلكتروني',
    description: 'رسالة واحدة في الشهر.',
    consent: 'نستخدم عنوانك لهذه النشرة فقط.',
    emailLabel: 'البريد الإلكتروني',
    subscribeLabel: 'اشترك',
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
    title: '記事をメールで受け取る',
    description: '月に一度のお知らせです。',
    consent: 'アドレスはこのニュースレターにのみ使用します。',
    emailLabel: 'メールアドレス',
    subscribeLabel: '購読する',
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

/** Nothing typed, then a misshaped address, then a good one: the thanks. */
export const SubscribeInteraction: Story = {
  name: 'Subscribe, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Subscribe' })
    await userEvent.click(button)
    await expect(canvasElement).toHaveTextContent('Enter your e-mail address.')
    const field = canvas.getByRole('textbox', { name: 'E-mail address' })
    await userEvent.type(field, 'milica@example')
    await userEvent.click(button)
    await expect(canvasElement).toHaveTextContent(
      'Enter an e-mail address such as name@example.com.',
    )
    await userEvent.type(field, '.com{Enter}')
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Thank you — check your inbox to confirm.',
    )
  },
}
