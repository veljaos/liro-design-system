import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AgentMark } from './agent-mark'
import { MANY_PRESENT, PRESENT } from './collaboration-story-data'
import { PresenceAvatars } from './presence-avatars'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Collaboration/Presence and AgentMark',
  component: PresenceAvatars,
  parameters: {
    docs: {
      description: {
        component:
          '**PresenceAvatars — what for:** who else has this record open, so two people do not ' +
          'change it at once: up to `max` avatars (3), then "+N" (the count through ' +
          '`format.number`). The row is one button: its name and tooltip list everyone ("Also ' +
          'here: Dragan Ilić, Liro agent (agent)"); pressing it lists the people with the ' +
          "application's line (Viewing, Editing). **When:** the header of a record or document " +
          'that several people work on. **When not:** the people of a record (owner, approvers): ' +
          'PersonName; an activity log: HistoryList.\n\n' +
          '**AgentMark — what for:** one marker after every name that belongs to an agent (a ' +
          'machine actor): the Bot icon, neutral (never blue: an agent is not an action), the ' +
          'word "Agent" for assistive technology and in a tooltip; `showLabel` writes the word. ' +
          '**When:** wherever an agent is named — messages, history, presence, questions. ' +
          '**When not:** the system or an integration (HistoryList marks those with their own ' +
          'neutral icons).',
      },
    },
  },
  args: { people: PRESENT },
  play: settle,
} satisfies Meta<typeof PresenceAvatars>

export default meta

type Story = StoryObj<typeof meta>

/** Dragan and the Liro agent are viewing the invoice; the agent has the Bot square. */
export const Default: Story = {
  render: (args) => (
    <ExampleProvider>
      <PresenceAvatars {...args} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'Also here: Dragan Ilić, Liro agent (agent)' }),
    ).toBeVisible()
    await settle()
  },
}

/** Six people, three shown: "+3" through format.number; the name lists all six. */
export const Overflow: Story = {
  args: { people: MANY_PRESENT, max: 3 },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(button).toHaveTextContent('+3')
    await expect(button.getAttribute('aria-label')).toContain('Snežana Popović')
    await settle()
  },
}

/** Keyboard: Tab focuses the row and shows the names; Enter opens the list with AgentMark. */
export const Keyboard: Story = {
  args: { people: MANY_PRESENT, max: 2 },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    const body = within(document.body)
    await waitFor(() => expect(body.getByRole('tooltip')).toBeInTheDocument())
    await userEvent.keyboard('{Enter}')
    const list = await body.findByRole('dialog', { name: 'Who is here' })
    await expect(within(list).getByText('Preparing a payment reminder')).toBeVisible()
    await expect(within(list).getAllByText('Agent').length).toBeGreaterThan(0)
    await settle()
  },
}

/** AgentMark beside names: the icon only (the word for assistive technology), and with its word. */
export const AgentMarks: Story = {
  name: 'AgentMark',
  render: () => (
    <div className="flex flex-col items-start gap-3 text-sm text-primary">
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold">Liro agent</span>
        <AgentMark />
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-semibold">Liro agent</span>
        <AgentMark showLabel />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The word is there for assistive technology in both, visible only with showLabel.
    await expect(canvas.getAllByText('Agent')).toHaveLength(2)
    await expect(canvas.getAllByText('Agent')[0]).toHaveClass('sr-only')
    await settle()
  },
}

/** No one else here: nothing is shown. */
export const Empty: Story = {
  args: { people: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button')).toBeNull()
  },
}

/** Long names on a phone: the list truncates them, the row keeps its size. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-semibold text-primary">F-2026-0410</span>
        <PresenceAvatars
          people={[
            {
              id: 'a',
              name: 'Aleksandra Katarina Milošević-Vukadinović',
              description: 'Head of accounting and financial reporting, viewing',
            },
            ...MANY_PRESENT,
          ]}
        />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    await within(document.body).findByRole('dialog', { name: 'Who is here' })
    await settle()
  },
}

/** Arabic names, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PresenceAvatars
        people={[
          { id: '1', name: 'ليلى حسن', description: 'تشاهد' },
          { id: '2', name: 'عمر خالد', description: 'يعدّل' },
          { id: '3', name: 'وكيل ليرو', agent: true },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PresenceAvatars
        people={[
          { id: '1', name: '山田 花子', description: '閲覧中' },
          { id: '2', name: '佐藤 健', description: '編集中' },
        ]}
      />
    </StoryProvider>
  ),
}

/** English in a right-to-left page: the names in the list keep their order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <PresenceAvatars people={PRESENT} />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button'))
    const list = await within(document.body).findByRole('dialog')
    await expectContentDirection(within(list).getByText('Dragan Ilić'))
    await settle()
  },
}
