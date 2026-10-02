import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { Spinner } from './spinner'
import { expectContentDirection, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Feedback/Spinner',
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** something is in progress and how far it has come is not known — a job ' +
          'sending documents, a panel loading. The Design System\'s own loader (Mantine "oval") ' +
          'in three sizes: sm 14px, md 20px, lg 28px. It is a `role="status"`: named by `label` ' +
          '(default "Loading…") when alone, or by the text given as its children, shown beside ' +
          'it.\n\n**When not:** progress that is known (ProgressBar); a number that is only ' +
          'updating (SettlingValue); a page or list loading for the first time (Skeleton); a ' +
          'button that is working (its own `loading`).',
      },
    },
  },
  args: {},
  play: settle,
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

/** Alone, named "Loading…" for assistive technology. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status', { name: 'Loading…' })).toBeVisible()
    await settle()
  },
}

/** The three sizes, and one with its text beside it. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-4">
        <Spinner size="sm" label="Loading the rows" />
        <Spinner size="md" />
        <Spinner size="lg" label="Loading the document" />
      </div>
      <Spinner>Sending 24 invoices…</Spinner>
    </div>
  ),
}

/** Long text at phone width: the text wraps beside the spinner. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Spinner>{LONG.description}</Spinner>
    </div>
  ),
}

/** Arabic sample text, right to left: the spinner at the start (right). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Spinner>{ARABIC.description}</Spinner>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Spinner>{JAPANESE.description}</Spinner>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: "Sending 24 invoices…" keeps its order. */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Spinner>24 invoices are being sent…</Spinner>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await expectContentDirection(within(canvasElement).getByText('24 invoices are being sent…'))
    await settle()
  },
}
