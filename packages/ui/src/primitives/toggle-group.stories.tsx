import type { Meta, StoryObj } from '@storybook/react-vite'
import { internal, settle } from './story-helpers'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta = {
  title: 'Internal/Primitives/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    docs: {
      description: {
        component: internal(
          "One choice: toggles in a track, with Mantine SegmentedControl's look (view switches, PeriodField). Several choices: separate toggles with Mantine Chip's look (radius sm), a check and the neutral selection when pressed. Arrow keys follow the direction.",
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof ToggleGroup>

export default meta

type Story = StoryObj<typeof meta>

/** One pressed of three (single, segmented); two pressed of four (multiple, separate toggles with a check), one disabled. */
export const States: Story = {
  args: { type: 'single' },
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ToggleGroup type="single" defaultValue="month" aria-label="Period">
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
        <ToggleGroupItem value="quarter">Quarter</ToggleGroupItem>
        <ToggleGroupItem value="year">Year</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" defaultValue={['open', 'overdue']} aria-label="Show">
        <ToggleGroupItem value="open">Open</ToggleGroupItem>
        <ToggleGroupItem value="overdue">Overdue</ToggleGroupItem>
        <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
        <ToggleGroupItem value="archived" disabled>
          Archived
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
}
