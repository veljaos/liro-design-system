import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { PlanComparison } from './plan-comparison'
import {
  ARABIC_FEATURES,
  ARABIC_PLANS,
  FEATURES,
  JAPANESE_FEATURES,
  JAPANESE_PLANS,
  LONG_PLANS,
  PLANS,
  PLANS_WITH_REASON,
} from './plan-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Administration/PlanComparison',
  component: PlanComparison,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** plans side by side — what each costs and what it offers — and one of ' +
          'them chosen: a subscription’s tiers, a service’s packages, a membership’s levels. ' +
          'A radio group: on a desktop a table (plans as columns, features as rows, grouped), on ' +
          'a phone one card per plan with its features. The plan in use says “Current plan” in ' +
          'words; the chosen one is the neutral selection (surface.selected, a border.selected ' +
          'bar), never a colour alone. A plan that cannot be chosen is disabled with its reason. ' +
          'The plans, prices, features and what each offers are the application’s; the ' +
          'component reports the chosen plan’s id and never prices or recommends.\n\n' +
          '**When to use:** changing a plan, choosing a package before signing up — a choice ' +
          'among two to four tiers that differ by many features. **When not:** a choice among ' +
          'options that differ by a name only (RadioGroupField or SelectField); a price list ' +
          'without a choice (DataTable or KeyValueList); more than four plans (they no longer ' +
          'fit side by side — split the choice).',
      },
    },
  },
  args: {
    label: 'Choose a plan',
    plans: PLANS,
    features: FEATURES,
    current: 'business',
    layout: 'desktop',
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-4xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof PlanComparison>

export default meta

type Story = StoryObj<typeof meta>

/** Three plans, Business in use and chosen; Pro includes Projects, Business sells it as an add-on. */
export const Default: Story = {
  args: {
    defaultValue: 'business',
    description: 'Prices per month, without VAT. A change applies from today.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const group = canvas.getByRole('radiogroup', { name: 'Choose a plan' })
    await expect(within(group).getAllByRole('radio')).toHaveLength(3)
    await expect(within(group).getByRole('radio', { name: 'Business' })).toBeChecked()
    await expect(canvas.getByText('Current plan')).toBeVisible()
    await expect(canvas.getByRole('rowheader', { name: 'Employees and payroll' })).toBeVisible()
    await expect(canvas.getAllByText('Not included').length).toBeGreaterThan(0)
  },
}

/** Another plan chosen: its column is the neutral selection; Business stays the current plan. */
export const Chosen: Story = {
  args: { defaultValue: 'pro' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Pro' })).toBeChecked()
    await expect(canvas.getByRole('radio', { name: 'Business' })).toHaveAccessibleDescription(
      /Current plan/,
    )
  },
}

/** A plan that cannot be chosen: its radio is disabled and the reason stands under it. */
export const Unavailable: Story = {
  name: 'Plan not available',
  args: { plans: PLANS_WITH_REASON, defaultValue: 'business' },
  play: async ({ canvasElement }) => {
    await settle()
    const start = within(canvasElement).getByRole('radio', { name: 'Start' })
    await expect(start).toBeDisabled()
    await expect(start).toHaveAccessibleDescription(/you have 24/)
  },
}

/** Nothing can be chosen, with the reason under the label. */
export const Disabled: Story = {
  args: {
    defaultValue: 'business',
    disabled: true,
    disabledReason: 'Only the account owner can change the plan.',
  },
}

/** The application's error under the label. */
export const WithError: Story = {
  name: 'Error',
  args: { error: 'Choose a plan to continue.' },
}

/** Long names, prices and descriptions wrap inside their columns. */
export const LongText: Story = {
  name: 'Long text',
  args: { plans: LONG_PLANS, current: 'basic', defaultValue: 'basic' },
}

/** Phone width: one card per plan, its features listed under it. */
export const Phone: Story = {
  args: { layout: 'phone', defaultValue: 'pro' },
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

/** Arabic: the columns run from the right; the arrows follow. */
export const Arabic: Story = {
  args: {
    label: 'اختر خطة',
    plans: ARABIC_PLANS,
    features: ARABIC_FEATURES,
    currentLabel: 'الخطة الحالية',
    defaultValue: 'pro',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-4xl">
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
    label: 'プランを選択',
    plans: JAPANESE_PLANS,
    features: JAPANESE_FEATURES,
    currentLabel: '現在のプラン',
    defaultValue: 'business',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-4xl">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/**
 * A press on a plan's name chooses it; the arrows move the choice and skip the plan that cannot
 * be chosen.
 */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  args: { plans: PLANS_WITH_REASON },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('Business'))
    const business = canvas.getByRole('radio', { name: 'Business' })
    await expect(business).toBeChecked()
    await expect(business).toHaveFocus()
    // Held down until the next plan is chosen: the group chooses on the focus the key moved.
    await userEvent.keyboard('{ArrowDown>}')
    await waitFor(async () => {
      await expect(canvas.getByRole('radio', { name: 'Pro' })).toBeChecked()
    })
    await userEvent.keyboard('{/ArrowDown}')
    await userEvent.keyboard('{ArrowDown>}')
    // Start cannot be chosen: the focus goes round to Business.
    await waitFor(async () => {
      await expect(business).toBeChecked()
    })
    await userEvent.keyboard('{/ArrowDown}')
    await expect(canvas.getByRole('radio', { name: 'Start' })).not.toBeChecked()
  },
}
