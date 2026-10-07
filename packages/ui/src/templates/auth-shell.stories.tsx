import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, within } from 'storybook/test'
import { Button } from '../components/button'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TextField } from '../components/text-field'
import { settle } from '../primitives/story-helpers'
import { AuthShell, type AuthShellProps } from './auth-shell'
import { BRAND } from './shell-story-data'

/** The footer an application might pass: links in text.tertiary in every state (owner). */
function Footer({ items }: { items: readonly string[] }) {
  return (
    <>
      {items.map((item) => (
        <a
          key={item}
          href={`#${item.toLowerCase()}`}
          className="text-tertiary no-underline visited:text-tertiary hover:text-secondary hover:underline"
        >
          {item}
        </a>
      ))}
    </>
  )
}

/** The first screen of an e-mail-first sign-in (its flow is the Core's, P5.6). */
function EmailStep({
  label,
  button,
  placeholder,
}: {
  label: string
  button: string
  placeholder: string
}) {
  return (
    <form
      className="flex flex-col gap-4 [&>button]:w-full"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <TextField label={label} type="email" autoComplete="email" placeholder={placeholder} />
      <Button intent="next" label={button} type="submit" />
    </form>
  )
}

const SIGN_IN: ReactNode = (
  <EmailStep label="Work e-mail" button="Continue" placeholder="name@company.rs" />
)

const meta = {
  title: 'Templates/AuthShell',
  component: AuthShell,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the frame of the sign-in screens — e-mail, password, one-time code, ' +
          'recovery: the text lockup centred above one 420px card, the footer (language, terms) ' +
          'under it.\n\n' +
          '**How:** `title` and `description` head the card; `children` is the step of the flow, ' +
          'built in the Core from the sign-in building blocks (P5.6); `footer` holds the ' +
          "application's links. On phones the card is the page, without a border.\n\n" +
          '**When not:** inside the application (AppShell); a page that cannot be used ' +
          '(StatusPage).',
      },
    },
  },
  args: {
    brand: BRAND,
    title: 'Sign in',
    description: 'Use the e-mail address your company gave you.',
    children: SIGN_IN,
    footer: <Footer items={['English', 'Terms', 'Privacy']} />,
  },
  render: (args: AuthShellProps) => (
    <ExampleProvider>
      <AuthShell {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AuthShell>

export default meta

type Story = StoryObj<typeof meta>

/** The e-mail step: lockup above the card, the footer below. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Liro Business Apps' })).toBeVisible()
    await expect(canvas.getByRole('main')).toHaveClass('max-w-105')
  },
}

/** Without a description or footer. */
export const Minimal: Story = {
  args: { description: undefined, footer: undefined, title: 'Enter the code' },
}

/** Long texts wrap inside the card. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Sign in to Kvadrat Gradnja d.o.o. and the other companies you work for',
    description:
      'Use the e-mail address your company gave you. If you work for several companies, you ' +
      'choose the company after signing in; your accountant may have invited you with another ' +
      'address.',
    children: (
      <EmailStep
        label="Work e-mail address used for your company account"
        button="Continue with this e-mail address"
        placeholder="name@company.rs"
      />
    ),
  },
}

/** Phone width: no card frame, 16px at the sides, the lockup above. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args: AuthShellProps) => (
    <PhoneFrame>
      <ExampleProvider>
        <AuthShell {...args} layout="phone" className="min-h-full" />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic texts in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <AuthShell
          brand={BRAND}
          title="تسجيل الدخول"
          description="استخدم عنوان البريد الإلكتروني الذي منحتك إياه شركتك."
          footer={<Footer items={['العربية', 'الشروط', 'الخصوصية']} />}
        >
          <EmailStep label="البريد الإلكتروني" button="متابعة" placeholder="name@example.com" />
        </AuthShell>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese texts. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <AuthShell
          brand={BRAND}
          title="サインイン"
          description="会社から提供されたメールアドレスを使用してください。"
          footer={<Footer items={['日本語', '利用規約', 'プライバシー']} />}
        >
          <EmailStep label="メールアドレス" button="続行" placeholder="name@example.com" />
        </AuthShell>
      </ExampleProvider>
    </StoryProvider>
  ),
}
