import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { imagesReady, providers } from './group-c-story-data'
import { ProviderSignInButtons } from './sign-in'
import { PhoneFrame, StoryProvider } from './story-frames'

/** The application's handler: which provider was pressed. */
const onProvider = fn()

async function ready() {
  await settle()
  await imagesReady()
}

const meta = {
  title: 'Components/Sign-in/ProviderSignInButtons',
  component: ProviderSignInButtons,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** "Continue with Microsoft" and "Continue with Google": signing in through ' +
          'the company’s identity provider. Neutral default buttons, full width, 8px apart; each ' +
          'provider’s **official mark** keeps its own colours at 18px — never the provider’s ' +
          'colour as the button’s fill. The "or" divider (`divider`: above or below) separates ' +
          'them from the e-mail form.\n\n' +
          '**Marks:** `mark` "microsoft" or "google" draws that provider’s official mark, ' +
          'shipped with this component exactly as each provider’s sign-in branding rules give ' +
          'it; another provider’s mark is the address of the application’s file. Microsoft and Google and their marks are trademarks of their owners; use ' +
          'them only for signing in with that provider. The labels are the application’s and ' +
          'follow the providers’ wording ("Continue with …", "Sign in with …").\n\n' +
          '**States:** `loading` on the pressed provider (busy, the others unavailable until the ' +
          'redirect), `disabled` per provider or for all.\n\n' +
          '**When:** in EmailFirstForm (`providers`), or alone above a password step.\n\n' +
          '**When not:** linking an account to a provider in settings (a normal Button).',
      },
    },
  },
  args: { providers: providers() },
  render: (args) => (
    <div className="max-w-90">
      <ProviderSignInButtons {...args} />
    </div>
  ),
  play: ready,
} satisfies Meta<typeof ProviderSignInButtons>

export default meta

type Story = StoryObj<typeof meta>

/** The two providers; a press starts that provider's sign-in. */
export const Default: Story = {
  args: { providers: providers(undefined, onProvider) },
  play: async () => {
    await ready()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  args: { providers: providers(undefined, onProvider) },
  play: async ({ canvasElement }) => {
    await ready()
    const canvas = within(canvasElement)
    await userEvent.tab()
    await expect(canvas.getByRole('button', { name: 'Continue with Microsoft' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(canvas.getByRole('button', { name: 'Continue with Google' }))
    const marks = Array.from(canvasElement.querySelectorAll('[data-slot="provider-mark"]'))
    await expect(marks.map((mark) => mark.getAttribute('aria-hidden'))).toEqual(['true', 'true'])
    await expect(onProvider).toHaveBeenCalledWith('microsoft')
    await expect(onProvider).toHaveBeenCalledWith('google')
  },
}

/** With the divider above, as under the e-mail form. */
export const DividerAbove: Story = {
  name: 'Divider above',
  args: { divider: 'above' },
}

/** With the divider below, as above the e-mail form. */
export const DividerBelow: Story = {
  name: 'Divider below',
  args: { divider: 'below' },
}

/** Microsoft pressed: its button is busy, Google waits; a second press does nothing. */
export const Loading: Story = {
  args: {
    providers: providers().map((provider) =>
      provider.id === 'microsoft' ? { ...provider, loading: true } : provider,
    ),
  },
  play: async ({ canvasElement }) => {
    await ready()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Continue with Microsoft' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Continue with Google' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/** Google is not offered to this company now (the application's reason stands beside it). */
export const Disabled: Story = {
  name: 'Disabled with reason',
  render: (args) => (
    <div className="flex max-w-90 flex-col gap-2">
      <ProviderSignInButtons
        {...args}
        providers={providers().map((provider) =>
          provider.id === 'google' ? { ...provider, disabled: true } : provider,
        )}
      />
      <p className="m-0 text-xs text-secondary">
        Kvadrat Gradnja d.o.o. allows only its Microsoft accounts.
      </p>
    </div>
  ),
}

/** Long labels wrap inside the button, centred, never cut. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    providers: providers([
      'Continue with the Microsoft account of Kvadrat Gradnja d.o.o. (Entra ID)',
      'Continue with the Google Workspace account your company gave you',
    ]),
    divider: 'above',
  },
}

/** At phone width the buttons span the screen less the page's 16px. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ProviderSignInButtons {...args} divider="above" />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic labels; the mark stays at the button's start (its right in right-to-left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-90">
        <ProviderSignInButtons
          divider="above"
          providers={providers(['المتابعة باستخدام Microsoft', 'المتابعة باستخدام Google'])}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-90">
        <ProviderSignInButtons
          divider="above"
          providers={providers(['Microsoft で続行', 'Google で続行'])}
        />
      </div>
    </StoryProvider>
  ),
}
