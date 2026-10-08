import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AuthShell } from '../templates/auth-shell'
import { BRAND } from '../templates/shell-story-data'
import { imagesReady, providers } from './group-c-story-data'
import { EmailFirstForm } from './sign-in'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** A sentence with the application's link, as the Core passes into a slot. */
function Line({ text, link }: { text: string; link: string }) {
  return (
    <>
      {text}{' '}
      <a
        href="#sign-in-help"
        className="text-link underline visited:text-link hover:text-link active:text-link"
      >
        {link}
      </a>
    </>
  )
}

async function ready() {
  await settle()
  await imagesReady()
}

const meta = {
  title: 'Components/Sign-in/EmailFirstForm',
  component: EmailFirstForm,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the first step of signing in, inside AuthShell (shadcn’s login-05 ' +
          'shape): the e-mail, a full-width Continue, then the "or" divider and the providers’ ' +
          'buttons (ProviderSignInButtons), and lines for "No account?" and the terms. The Core ' +
          'decides the next step from the address: a password (PasswordField), a code ' +
          '(CodeInput) or the company’s identity provider.\n\n' +
          '**How:** `onSubmit` receives the trimmed address; `error`, `loading`, `disabled` with ' +
          '`disabledReason` are the application’s. `providers` (each with its official mark ' +
          'file) and `providersPosition` place the other ways in; `signUp` and `terms` are slots ' +
          'for the application’s sentences and links. The label and the button default to ' +
          '`messages` ("E-mail", "Continue").\n\n' +
          '**When:** any sign-in or sign-up that starts with the address.\n\n' +
          '**When not:** a password change or a profile form (TextField, PasswordField).',
      },
    },
  },
  args: { onSubmit: fn() },
  render: (args) => (
    <div className="max-w-90">
      <EmailFirstForm {...args} />
    </div>
  ),
  play: ready,
} satisfies Meta<typeof EmailFirstForm>

export default meta

type Story = StoryObj<typeof meta>

/** Continue first, then the providers; Enter submits the trimmed address. */
export const Default: Story = {
  args: {
    placeholder: 'name@company.rs',
    providers: providers(),
    signUp: <Line text="No account?" link="Ask your administrator" />,
    terms: <Line text="By continuing you accept the" link="terms of use and privacy policy" />,
  },
  play: async ({ canvasElement, args }) => {
    await ready()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'E-mail' })
    await expect(field).toHaveAttribute('autocomplete', 'username')
    await userEvent.type(field, '  milica.petrovic@kvadratgradnja.rs {Enter}')
    await expect(args.onSubmit).toHaveBeenCalledWith('milica.petrovic@kvadratgradnja.rs')
    // The providers are neutral buttons named by their labels; the marks are decorative.
    const microsoft = canvas.getByRole('button', { name: 'Continue with Microsoft' })
    await expect(microsoft).toHaveAttribute('data-family', 'neutral')
    await expect(microsoft.querySelector('img')).toHaveAttribute('alt', '')
    await expect(canvas.getByText('or')).toBeVisible()
  },
}

/** The providers first and the e-mail under the divider. */
export const ProvidersFirst: Story = {
  name: 'Providers first',
  args: { providers: providers(), providersPosition: 'before' },
}

/** Without providers: the field and Continue only. */
export const EmailOnly: Story = {
  name: 'E-mail only',
  args: { label: 'Work e-mail', defaultValue: 'milica.petrovic@kvadratgradnja.rs' },
}

/** The Core found no account: the error under the field. */
export const WithError: Story = {
  name: 'Error',
  args: {
    defaultValue: 'milica.petrovic@kvadratgradnja.com',
    error: 'No account uses this address. Check it, or ask your administrator for an invitation.',
    providers: providers(),
  },
  play: async ({ canvasElement }) => {
    await ready()
    const field = within(canvasElement).getByRole('textbox', { name: 'E-mail' })
    await expect(field).toHaveAttribute('aria-invalid', 'true')
    await expect(field).toHaveAccessibleDescription(/No account uses this address/)
  },
}

/** The address is being checked: Continue is busy and cannot be pressed again. */
export const Loading: Story = {
  args: {
    defaultValue: 'milica.petrovic@kvadratgradnja.rs',
    loading: true,
    providers: providers(),
  },
  play: async ({ canvasElement, args }) => {
    await ready()
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'Continue' })
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    await expect(args.onSubmit).not.toHaveBeenCalled()
  },
}

/** Signing in is paused: the reason under the field, every button unavailable. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  args: {
    disabled: true,
    disabledReason: 'Signing in is paused for maintenance until 22:00.',
    providers: providers(),
  },
}

/** Long labels and texts wrap; nothing is cut. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'The e-mail address your company registered for you in Liro Business Apps',
    description: 'If you work for several companies, use the address of the one you open most.',
    submitLabel: 'Continue with this e-mail address and choose the company after',
    providers: providers([
      'Continue with the Microsoft account of Kvadrat Gradnja d.o.o.',
      'Continue with the Google Workspace account of your company',
    ]),
    terms: (
      <Line
        text="By continuing you accept the terms of use of Liro Business Apps, the data processing agreement of your company and the"
        link="privacy policy"
      />
    ),
  },
}

/** Inside AuthShell on a phone: the card is the page, nothing overflows at 360px. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <AuthShell brand={BRAND} title="Sign in" layout="phone" className="min-h-full">
          <EmailFirstForm
            {...args}
            placeholder="name@company.rs"
            providers={providers()}
            signUp={<Line text="No account?" link="Ask your administrator" />}
          />
        </AuthShell>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await ready()
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="auth-shell"]')
    await expect(shell).not.toBeNull()
    if (shell !== null) await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth)
  },
}

/** Arabic labels in a right-to-left page; the arrow of Continue mirrors. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-90">
        <EmailFirstForm
          {...args}
          label="البريد الإلكتروني للعمل"
          submitLabel="متابعة"
          placeholder="name@example.com"
          providers={providers(['المتابعة باستخدام Microsoft', 'المتابعة باستخدام Google'])}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-90">
        <EmailFirstForm
          {...args}
          label="会社のメールアドレス"
          submitLabel="続行"
          placeholder="name@example.com"
          providers={providers(['Microsoft で続行', 'Google で続行'])}
        />
      </div>
    </StoryProvider>
  ),
}
