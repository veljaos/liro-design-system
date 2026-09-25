import type { IconComponent } from './intents'

/** The six status tones (Appendix A.2). */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'premium'

export const TONE_NAMES: readonly Tone[] = [
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
  'premium',
]

/**
 * The tone of a status, looked up in a map the application gives as data (Appendix A.7 is an
 * example, in Storybook only). A status the map does not know gets `fallback`, by default neutral.
 */
export function toneFor(
  status: string,
  map: Readonly<Record<string, Tone>>,
  fallback: Tone = 'neutral',
): Tone {
  return Object.hasOwn(map, status) ? (map[status] ?? fallback) : fallback
}

/** Text on a tone is always the tone's fg on its bg (Appendix B.6). Every class is written out. */
const TONE_CLASSES: Record<Tone, { colours: string; border: string }> = {
  success: {
    colours: 'bg-status-success-bg text-status-success-fg',
    border: 'border-status-success-border',
  },
  warning: {
    colours: 'bg-status-warning-bg text-status-warning-fg',
    border: 'border-status-warning-border',
  },
  danger: {
    colours: 'bg-status-danger-bg text-status-danger-fg',
    border: 'border-status-danger-border',
  },
  info: { colours: 'bg-status-info-bg text-status-info-fg', border: 'border-status-info-border' },
  neutral: {
    colours: 'bg-status-neutral-bg text-status-neutral-fg',
    border: 'border-status-neutral-border',
  },
  premium: {
    colours: 'bg-status-premium-bg text-status-premium-fg',
    border: 'border-status-premium-border',
  },
}

/** The badge of the previous Design System ("button weights" in docs/decisions.md). */
const BASE =
  'inline-flex max-w-full shrink-0 items-center gap-1 rounded-xs px-1.5 py-0.5 align-middle font-sans text-xs leading-[1.4] font-semibold whitespace-nowrap'

export interface StatusBadgeProps {
  /** The status as the application names it, e.g. "Paid". */
  label: string
  tone: Tone
  /** Adds a 1px border in the tone's border colour. Default: no border. */
  withBorder?: boolean
  /** An optional icon before the label, 12px, e.g. from lucide-react. */
  icon?: IconComponent
}

/** A short status: the label on the tone's colours. It never wraps. */
export function StatusBadge({ label, tone, withBorder = false, icon: Icon }: StatusBadgeProps) {
  const { colours, border } = TONE_CLASSES[tone]
  const className = withBorder
    ? `${BASE} ${colours} border border-solid ${border}`
    : `${BASE} ${colours}`
  return (
    <span className={className} data-tone={tone}>
      {Icon === undefined ? null : <Icon aria-hidden="true" className="size-3 shrink-0" />}
      <span>{label}</span>
    </span>
  )
}
