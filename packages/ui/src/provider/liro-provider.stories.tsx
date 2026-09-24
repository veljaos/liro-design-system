import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../components/button'
import { useLiro } from './liro-provider'

/**
 * Shows what the Storybook toolbar changes: theme (colours), direction (the Start and End
 * labels swap sides), format locale and number scheme (separators and currency position),
 * money decimals (digits after the separator) and viewport (the frame width).
 */
function ToolbarSample() {
  const { locale, direction, colorScheme, format } = useLiro()
  const rows: [string, string][] = [
    ['Format locale', locale],
    ['Direction', direction],
    ['Theme', colorScheme],
    ['Number scheme', format.numberScheme],
    ['Money decimals', String(format.moneyDecimals)],
    ['Number', format.number('1234567.891')],
    ['Money', format.money('1234567.5', 'EUR')],
    ['Negative money', format.money('-42', 'RSD')],
  ]
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <div className="flex justify-between">
        <span>Start</span>
        <span>End</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([term, value]) => (
          <div key={term} className="contents">
            <dt>{term}</dt>
            <dd className="text-end tabular-nums">
              {/* bdi keeps a value in its own direction: without it, right-to-left text moves
                  the minus sign and the currency to the wrong side. */}
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end">
        <Button>Save</Button>
      </div>
    </div>
  )
}

const meta = {
  title: 'Foundations/LiroProvider',
  parameters: {
    docs: {
      description: {
        component:
          'Carries locale, direction, colour scheme and formatting to every component. ' +
          'Wrap the application in it once. Every story is already wrapped, through the toolbar.',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Switch any toolbar global; each one visibly changes this sample. */
export const ToolbarGlobals: Story = {
  render: () => <ToolbarSample />,
}
