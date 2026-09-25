import type { Meta, StoryObj } from '@storybook/react-vite'
import { internal, settle } from './story-helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'Internal/Primitives/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: internal(
          'Tabs with a 2px line and a brand edge under the active tab; arrow keys follow the direction. Tabs (P2.6), FormTabs (P3.5).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

const TABS = [
  { value: 'details', label: 'Details' },
  { value: 'lines', label: 'Lines' },
  { value: 'history', label: 'History' },
  { value: 'audit', label: 'Audit (no access)', disabled: true },
]

function Example({ orientation }: { orientation: 'horizontal' | 'vertical' }) {
  return (
    <Tabs defaultValue="lines" orientation={orientation} className="gap-4">
      <TabsList aria-label="Invoice sections">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="text-sm">
          The {tab.label.toLowerCase()} of the invoice.
        </TabsContent>
      ))}
    </Tabs>
  )
}

/** Horizontal, the second tab active, the last disabled. */
export const Horizontal: Story = {
  render: () => <Example orientation="horizontal" />,
}

/** Vertical: the line at the inline end. */
export const Vertical: Story = {
  render: () => <Example orientation="vertical" />,
}
