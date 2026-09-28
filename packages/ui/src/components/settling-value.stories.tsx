import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE } from './field-story-data'
import { SettlingValue } from './settling-value'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Display/SettlingValue',
  component: SettlingValue,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a value the server recomputes while the user works — the total of a ' +
          'document while lines are typed, a balance. The last confirmed value stays still; ' +
          'after 300ms of waiting a small dot appears beside it (never a spinner instead of the ' +
          'number, never a blank, never an intermediate value); the width is reserved and the ' +
          'digits tabular, so nothing moves; screen readers hear the new value once, when it ' +
          'settles. `unavailableText` when no value can be shown.\n\n' +
          '**When not:** a value that does not change on its own (NumberText, MoneyText); a long ' +
          'job with progress (ProgressBar).',
      },
    },
  },
  args: { value: null },
  play: settle,
} satisfies Meta<typeof SettlingValue>

export default meta

type Story = StoryObj<typeof meta>

/** Cents as a decimal string; the story plays the application, which computes on the server. */
function centsToDecimal(cents: bigint): string {
  const sign = cents < 0n ? '-' : ''
  const absolute = cents < 0n ? -cents : cents
  const whole = absolute / 100n
  const fraction = (absolute % 100n).toString().padStart(2, '0')
  return `${sign}${whole.toString()}.${fraction}`
}

/**
 * Slow updates and fast typing: each change of the quantity asks "the server" for the total,
 * after the user pauses (300ms), and the answer takes `delay` ms. The total stays still meanwhile.
 */
function Calculator({ delay, label }: { delay: number; label: string }) {
  const [quantity, setQuantity] = useState('3')
  const [total, setTotal] = useState<string | null>(centsToDecimal(3n * 123450n))
  const [pending, setPending] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
    },
    [],
  )
  return (
    <div className="flex max-w-100 flex-col gap-3">
      <TextField
        label={label}
        description="Unit price 1,234.50 EUR"
        value={quantity}
        onChange={(text) => {
          setQuantity(text)
          setPending(true)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => {
            const count = /^\d{1,6}$/.test(text) ? BigInt(text) : null
            setTotal(count === null ? null : centsToDecimal(count * 123450n))
            setPending(false)
          }, 300 + delay)
        }}
      />
      <p className="m-0 flex items-center justify-between gap-4 text-sm">
        <span className="text-secondary">Total</span>
        <SettlingValue
          value={total}
          pending={pending}
          currency="EUR"
          reserveChars={16}
          unavailableText="Not available"
          className="font-semibold"
        />
      </p>
    </div>
  )
}

/** Slow answers (1.2 s): the dot appears after 300ms; the total never blanks or moves. */
export const SlowUpdates: Story = {
  name: 'Slow updates and fast typing',
  render: () => <Calculator delay={1200} label="Quantity" />,
}

/** Fast answers (100 ms): no dot at all, so nothing flickers. */
export const FastUpdates: Story = {
  name: 'Fast updates',
  render: () => <Calculator delay={100} label="Quantity" />,
}

/** The states side by side: settled, pending (with the dot), unavailable, empty. */
export const States: Story = {
  render: () => (
    <dl className="m-0 grid max-w-100 grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
      <dt className="text-secondary">Settled</dt>
      <dd className="m-0">
        <SettlingValue value="12345.6" currency="EUR" />
      </dd>
      <dt className="text-secondary">Pending</dt>
      <dd className="m-0">
        <PendingDemo />
      </dd>
      <dt className="text-secondary">Unavailable</dt>
      <dd className="m-0">
        <SettlingValue value={null} unavailableText="Offline" />
      </dd>
      <dt className="text-secondary">No value</dt>
      <dd className="m-0">
        <SettlingValue value={null} />
      </dd>
    </dl>
  ),
  play: async () => {
    // Past the 300ms delay, so the dot is in the picture.
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
  },
}

function PendingDemo() {
  return <SettlingValue value="12345.6" currency="EUR" pending />
}

/** Arabic sample text, right to left: the dot at the start (right), the minus sign in place. */
export const Arabic: Story = {
  render: () => (
    <p lang="ar" dir="rtl" className="m-0 flex items-center gap-4 text-sm">
      <span>{ARABIC.label}</span>
      <SettlingValue value="-1234.5" currency="EUR" pending />
    </p>
  ),
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    await settle()
  },
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <p lang="ja" className="m-0 flex items-center gap-4 text-sm">
      <span>{JAPANESE.label}</span>
      <SettlingValue value="1234" currency="JPY" decimals={0} />
    </p>
  ),
}
