import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleAlert, CircleCheck, Clock } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusBadge, TONE_NAMES, toneFor, type Tone } from './status-badge'

/**
 * Appendix A.7: an example map from statuses to tones. It is data for Storybook only; the
 * application gives its own map to toneFor.
 */
const EXAMPLE_TONES: Record<string, Tone> = {
  draft: 'neutral',
  pending: 'warning',
  'in review': 'info',
  approved: 'success',
  posted: 'success',
  signed: 'info',
  sent: 'info',
  paid: 'success',
  'partially paid': 'warning',
  overdue: 'danger',
  rejected: 'danger',
  cancelled: 'danger',
  archived: 'neutral',
  active: 'success',
  inactive: 'neutral',
  locked: 'warning',
  error: 'danger',
}

function Surface({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-default bg-surface-raised p-4">
      {children}
    </div>
  )
}

const capitalised = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

const meta = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the state of a record in a list, a header or a card: "Paid", "Overdue", ' +
          '"Draft". The label comes from the application; the tone (success, warning, danger, ' +
          'info, neutral, premium) comes from `toneFor(status, map)` with a map the application ' +
          "gives as data. Text is always the tone's fg on its bg.\n\n" +
          '**When not:** for an action (use Button); for a message the user must read (Alert, ' +
          'P2.5); for long text: a badge never wraps. Colour is never the only signal: the label ' +
          'says the state.',
      },
    },
  },
  args: { label: 'Paid', tone: 'success' },
} satisfies Meta<typeof StatusBadge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** The six tones, without and with a border. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Surface>
        {TONE_NAMES.map((tone) => (
          <StatusBadge key={tone} label={capitalised(tone)} tone={tone} />
        ))}
      </Surface>
      <Surface>
        {TONE_NAMES.map((tone) => (
          <StatusBadge key={tone} label={capitalised(tone)} tone={tone} withBorder />
        ))}
      </Surface>
    </div>
  ),
}

/** On the page, raised and sunken surfaces: the dark tones are translucent and mix with each. */
export const OnSurfaces: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(
        ['bg-surface-page', 'bg-surface-raised', 'bg-surface-sunken', 'bg-surface-overlay'] as const
      ).map((surface) => (
        <div key={surface} className={`flex flex-wrap items-center gap-3 p-3 ${surface}`}>
          <code dir="ltr" className="w-40 font-mono text-xs text-secondary">
            {surface}
          </code>
          {TONE_NAMES.map((tone) => (
            <StatusBadge key={tone} label={capitalised(tone)} tone={tone} />
          ))}
        </div>
      ))}
    </div>
  ),
}

/** The example map of Appendix A.7, through toneFor. An unknown status is neutral. */
export const ToneForExample: Story = {
  name: 'toneFor with the example map',
  render: () => (
    <Surface>
      {[...Object.keys(EXAMPLE_TONES), 'unknown status'].map((status) => (
        <StatusBadge
          key={status}
          label={capitalised(status)}
          tone={toneFor(status, EXAMPLE_TONES)}
        />
      ))}
    </Surface>
  ),
}

/** With an icon: 4px between icon and label. */
export const WithIcon: Story = {
  render: () => (
    <Surface>
      <StatusBadge label="Paid" tone="success" icon={CircleCheck} />
      <StatusBadge label="Pending" tone="warning" icon={Clock} />
      <StatusBadge label="Overdue" tone="danger" icon={CircleAlert} withBorder />
    </Surface>
  ),
}

/** A badge never wraps, even with a long label. */
export const LongText: Story = {
  render: () => (
    <Surface>
      <StatusBadge label="Partially paid, waiting for the second instalment" tone="warning" />
    </Surface>
  ),
}

/** At phone width, badges beside a title. */
export const PhoneWidth: Story = {
  render: () => (
    <div className="w-[390px] max-w-full">
      <div className="flex flex-col gap-2 rounded-lg border border-default bg-surface-raised p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-h4">Order 2026-0142</span>
          <StatusBadge label="Overdue" tone="danger" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-h4">Order 2026-0143</span>
          <StatusBadge label="Paid" tone="success" />
        </div>
      </div>
    </div>
  ),
}

/** Arabic labels (sample text). */
export const Arabic: Story = {
  render: () => (
    <Surface>
      <span lang="ar" className="contents">
        <StatusBadge label="مدفوع" tone="success" />
        <StatusBadge label="متأخر" tone="danger" icon={CircleAlert} />
        <StatusBadge label="مسودة" tone="neutral" withBorder />
      </span>
    </Surface>
  ),
}

/** Japanese labels (sample text). */
export const Japanese: Story = {
  render: () => (
    <Surface>
      <span lang="ja" className="contents">
        <StatusBadge label="支払済み" tone="success" />
        <StatusBadge label="期限超過" tone="danger" icon={CircleAlert} />
        <StatusBadge label="下書き" tone="neutral" withBorder />
      </span>
    </Surface>
  ),
}
