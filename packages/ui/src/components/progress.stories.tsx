import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { ProgressBar, Skeleton, Stepper } from './progress'

const meta = {
  title: 'Components/Feedback/Progress',
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component:
          '**Stepper** — the steps of a process and where the user is (a wizard, an onboarding); ' +
          'Mantine size sm with 32px icons in the primary colour (the old look). With ' +
          '`onStepClick` the steps become buttons. On phones (below 48em, or `layout="phone"`) ' +
          'it is one line, "Step 2 of 4 · Users", over a thin bar (P5.23). **ProgressBar** — how far a task has come ' +
          '(an import, an upload); 5px, fully rounded, filling from the start side, so it flips ' +
          'in right-to-left; always named by `label`. **Skeleton** — placeholder shapes while ' +
          'content loads, radius md; mark the loading region `aria-busy`.\n\n' +
          '**When not:** a spinner instead of a number that is only updating (SettlingValue, ' +
          'P2.8); a Stepper for navigation between independent pages (Tabs).',
      },
    },
  },
  args: { steps: [], active: 0 },
  play: settle,
} satisfies Meta<typeof Stepper>

export default meta

type Story = StoryObj<typeof meta>

const STEPS = [
  { label: 'Company', description: 'Name and tax number' },
  { label: 'Users', description: 'Who works in Liro' },
  { label: 'Bank accounts' },
  { label: 'Done' },
]

/** A step in the middle: earlier steps completed, the current one outlined. */
export const StepperDefault: Story = {
  name: 'Stepper',
  render: () => <Stepper steps={STEPS} active={1} />,
}

/** Clickable steps: the keyboard reaches each step; the current step moves. */
export const StepperClickable: Story = {
  name: 'Stepper, clickable',
  render: function Render() {
    const [active, setActive] = useState(2)
    return <Stepper steps={STEPS} active={active} onStepClick={setActive} />
  },
}

export const StepperClickableInteraction: Story = {
  name: 'Stepper, clickable, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [active, setActive] = useState(2)
    return <Stepper steps={STEPS} active={active} onStepClick={setActive} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Company/ }))
    await expect(canvas.getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step')
  },
}

/** Every step completed. */
export const StepperCompleted: Story = {
  name: 'Stepper, all completed',
  render: () => <Stepper steps={STEPS} active={STEPS.length} />,
}

/** ProgressBar at several values; it fills from the start side (the right in right-to-left). */
export const Bars: Story = {
  name: 'ProgressBar',
  render: () => (
    <div className="flex max-w-100 flex-col gap-4">
      <ProgressBar label="Import, not started" value={0} />
      <ProgressBar label="Import" value={35} />
      <ProgressBar label="Upload" value={7} max={12} />
      <ProgressBar label="Done" value={100} />
    </div>
  ),
}

/** Skeleton shapes standing in for a card while it loads. */
export const Skeletons: Story = {
  name: 'Skeleton',
  render: () => (
    <div aria-busy="true" className="flex max-w-100 flex-col gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  ),
}

/**
 * Phones (P5.23): one line "Step 2 of 4 · Users" with the current step's description, over a thin
 * bar filled to the current step — never a row of circles wrapping into two rows.
 */
export const StepperPhone: Story = {
  name: 'Stepper, phone',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6">
      <Stepper steps={STEPS} active={1} layout="phone" />
      <Stepper steps={STEPS} active={STEPS.length} layout="phone" />
    </div>
  ),
}

/** Long labels at phone width: the one line wraps as words, the bar stays one bar. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6">
      <Stepper
        layout="phone"
        steps={[
          { label: LONG.label, description: LONG.description },
          { label: 'Review' },
          { label: 'Send' },
        ]}
        active={0}
      />
      <ProgressBar label={LONG.label} value={60} />
    </div>
  ),
}

/** Arabic sample text, right to left: steps from the right, the bar filling from the right. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex flex-col gap-6">
      <Stepper
        steps={ARABIC.options.map((label) => ({ label, description: ARABIC.reason }))}
        active={1}
      />
      <ProgressBar label={ARABIC.label} value={35} />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex flex-col gap-6">
      <Stepper
        steps={JAPANESE.options.map((label) => ({ label, description: JAPANESE.reason }))}
        active={2}
      />
      <ProgressBar label={JAPANESE.label} value={70} />
    </div>
  ),
}
