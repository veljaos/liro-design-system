import type { Meta, StoryObj } from '@storybook/react-vite'
import { House, LogIn, RotateCcw } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { BRAND } from './shell-story-data'
import { StatusPage, type StatusPageProps } from './status-page'

const HOME = { label: 'Go to home page', href: '#home', icon: House }

const meta = {
  title: 'Templates/StatusPage',
  component: StatusPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the full page shown instead of the application when it cannot be used ' +
          'here: not signed in (401), not in the plan (402), no access (403), not found (404), ' +
          'an error (500, with the case number), maintenance, and a suspension (of the user’s account or of a company). The one ' +
          'place where centring is right.\n\n' +
          '**How:** `kind` chooses the tone, the icon, the code above the title and the default ' +
          'texts (from `messages`, so the Core translates them); `title`, `description` and ' +
          '`eyebrow` (`null` removes the code) may replace them. At most two actions: the main ' +
          'one filled, the other in the default look; with `href` they are links through the ' +
          "provider's `linkComponent`, in their own colours in every link state.\n\n" +
          '**When not:** an error inside a page that otherwise works (ErrorState in its place); ' +
          'a missing list item (EmptyState); a short notice (Banner).',
      },
    },
  },
  args: { kind: 'notFound', brand: BRAND },
  render: (args: StatusPageProps) => (
    <ExampleProvider>
      <StatusPage {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof StatusPage>

export default meta

type Story = StoryObj<typeof meta>

/** 404: grey, the bare code above the title, home as the one action. */
export const NotFound: Story = {
  name: 'Not found (404)',
  args: { primaryAction: HOME },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await expect(canvas.getByText('404')).toBeVisible()
    // The action is a link drawn as the filled button, in its own colours (never visited purple).
    const link = canvas.getByRole('link', { name: 'Go to home page' })
    await expect(getComputedStyle(link).textDecorationLine).toBe('none')
    await expect(link.className).toContain('visited:text-on-accent')
  },
}

/** 401: the session ended. Warning, not blue: a session ending is not a failure. */
export const Unauthenticated: Story = {
  name: 'Not signed in (401)',
  args: {
    kind: 'unauthenticated',
    primaryAction: { label: 'Sign in', href: '#sign-in', icon: LogIn },
  },
}

/** 402: a module outside the company's plan. */
export const PlanRequired: Story = {
  name: 'Not in the plan (402)',
  args: {
    kind: 'planRequired',
    description: 'Payroll is available in the Pro plan. Your administrator can change the plan.',
    primaryAction: { label: 'See plans', href: '#plans' },
    secondaryAction: HOME,
  },
}

/** 403: no permission for this page. */
export const Forbidden: Story = {
  name: 'No access (403)',
  args: { kind: 'forbidden', primaryAction: HOME },
}

/** 500: the case number to quote; "Try again" and home. */
export const ServerError: Story = {
  name: 'Error (500)',
  args: {
    kind: 'error',
    caseId: 'LRO-7F3K-2Q9M',
    primaryAction: { label: 'Try again', icon: RotateCcw, onClick: () => undefined },
    secondaryAction: HOME,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('LRO-7F3K-2Q9M')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

/** Maintenance: no code above the title, no action. */
export const Maintenance: Story = {
  args: {
    kind: 'maintenance',
    description: 'The application is being updated and will be back by 22:00.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('p.font-brand')).toBeNull()
  },
}

/**
 * A suspended company: danger, no code. The subject (`subject`) is a company the user works for,
 * named by the application; the default texts say so.
 */
export const Suspended: Story = {
  name: 'Suspended company',
  args: {
    kind: 'suspended',
    subject: { kind: 'company', name: 'Kvadrat Gradnja d.o.o.' },
    secondaryAction: { label: 'Sign out', href: '#sign-out' },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Company suspended')
    await expect(canvasElement).toHaveTextContent('Access for Kvadrat Gradnja d.o.o. is suspended.')
  },
}

/** The user's own account suspended (the default subject). */
export const SuspendedAccount: Story = {
  name: 'Suspended account',
  args: {
    kind: 'suspended',
    secondaryAction: { label: 'Sign out', href: '#sign-out' },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Account suspended')
    await expect(canvasElement).toHaveTextContent('Your account is suspended.')
  },
}

/** Long texts wrap in the 440px column; the line above the title replaced by the application. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    kind: 'forbidden',
    eyebrow: 'Accounting · Journal entries',
    title: 'You do not have access to journal entries of closed accounting periods',
    description:
      'Your role "Accountant – accounts payable" allows journal entries only in open periods. ' +
      'Ask Milica Petrović, the administrator of Kvadrat Gradnja d.o.o., to change your role, ' +
      'or open the period from the closing settings.',
    primaryAction: { label: 'Request access from the administrator', href: '#request' },
    secondaryAction: HOME,
  },
}

/** Phone width: the same column, the buttons full width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <StatusPage
          kind="error"
          brand={BRAND}
          caseId="LRO-7F3K-2Q9M"
          primaryAction={{ label: 'Try again', icon: RotateCcw }}
          secondaryAction={HOME}
          className="min-h-full"
        />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic texts in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <StatusPage
          kind="notFound"
          brand={BRAND}
          title="الصفحة غير موجودة"
          description="ربما كُتب العنوان بشكل خاطئ، أو نُقلت الصفحة أو حُذفت."
          primaryAction={{ label: 'الصفحة الرئيسية', href: '#home', icon: House }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese texts. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <StatusPage
          kind="maintenance"
          brand={BRAND}
          title="メンテナンス中です"
          description="アプリケーションを更新しています。22時までに再開します。"
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
