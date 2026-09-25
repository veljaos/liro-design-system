import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
// The token source itself, so this page shows exactly what @veljaos/tokens publishes.
import {
  BREAKPOINTS,
  COMMON,
  DURATION,
  EASING,
  kebab,
  LAYERS,
  meaningEntries,
  RADIUS,
  RAMPS,
  resolveColor,
  SHADOWS,
  SIZES,
  SPACE,
  THEMES,
  TONES,
  type Theme,
  type Tone,
} from '../../../../packages/tokens/src/tokens'

/** Tailwind finds classes by reading the source, so each tone's classes are written out. */
const TONE_CLASSES: Record<Tone, { sample: string; dot: string }> = {
  success: {
    sample: 'border-status-success-border bg-status-success-bg text-status-success-fg',
    dot: 'bg-status-success-solid',
  },
  warning: {
    sample: 'border-status-warning-border bg-status-warning-bg text-status-warning-fg',
    dot: 'bg-status-warning-solid',
  },
  danger: {
    sample: 'border-status-danger-border bg-status-danger-bg text-status-danger-fg',
    dot: 'bg-status-danger-solid',
  },
  info: {
    sample: 'border-status-info-border bg-status-info-bg text-status-info-fg',
    dot: 'bg-status-info-solid',
  },
  neutral: {
    sample: 'border-status-neutral-border bg-status-neutral-bg text-status-neutral-fg',
    dot: 'bg-status-neutral-solid',
  },
  premium: {
    sample: 'border-status-premium-border bg-status-premium-bg text-status-premium-fg',
    dot: 'bg-status-premium-solid',
  },
}

const THEME_NAMES: Record<Theme, string> = { light: 'Light', dark: 'Dark' }

function Swatch({ variable }: { variable: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-8 shrink-0 rounded-sm border border-default"
      style={{ background: `var(${variable})` }}
    />
  )
}

function Code({ children }: { children: ReactNode }) {
  // Variable names and values read left to right in either direction.
  return (
    <code dir="ltr" className="font-mono text-xs break-all">
      {children}
    </code>
  )
}

/** One theme, whatever the toolbar says: the same markup, only data-liro-theme differs. */
function ThemePanel({ theme, children }: { theme: Theme; children: ReactNode }) {
  return (
    <section
      data-liro-theme={theme}
      aria-label={THEME_NAMES[theme]}
      className="flex min-w-0 flex-col gap-4 rounded-lg border border-default bg-surface-page p-4 text-primary"
    >
      <h3 className="m-0 text-lg font-semibold">{THEME_NAMES[theme]}</h3>
      {children}
    </section>
  )
}

function BothThemes({ render }: { render: (theme: Theme) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {THEMES.map((theme) => (
        <ThemePanel key={theme} theme={theme}>
          {render(theme)}
        </ThemePanel>
      ))}
    </div>
  )
}

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex max-w-content flex-col gap-4">
      <h2 className="m-0 text-xl font-semibold">{title}</h2>
      <p className="m-0 max-w-3xl text-secondary">{intro}</p>
      {children}
    </div>
  )
}

function ColourValues() {
  return (
    <Page
      title="Colour values"
      intro="Layer 1. The ramps of Appendix A.1, 0 lightest to 9 darkest, as --liro-<ramp>-<step>. Components never use them directly; they choose a meaning."
    >
      {Object.entries(RAMPS).map(([ramp, steps]) => (
        <section key={ramp} aria-label={ramp} className="flex flex-col gap-2">
          <h3 className="m-0 font-semibold">{ramp}</h3>
          <ul className="m-0 list-none p-0 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {steps.map((value, step) => (
              <li key={value} className="flex items-center gap-2">
                <Swatch variable={`--liro-${ramp}-${String(step)}`} />
                <span className="flex flex-col">
                  <span className="text-sm">{step}</span>
                  <Code>{value}</Code>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section aria-label="common" className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold">common</h3>
        <ul className="m-0 list-none p-0 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(COMMON).map(([name, value]) => (
            <li key={name} className="flex items-center gap-2">
              <Swatch variable={`--liro-${kebab(name)}`} />
              <span className="flex flex-col">
                <span className="text-sm">{name}</span>
                <Code>{value}</Code>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  )
}

function Meanings() {
  const groups = new Map<string, ReturnType<typeof meaningEntries>>()
  for (const entry of meaningEntries().filter(({ path }) => !path.startsWith('status.'))) {
    const group = entry.path.split('.')[0] ?? ''
    groups.set(group, [...(groups.get(group) ?? []), entry])
  }
  return (
    <Page
      title="Meanings"
      intro="Layer 2. The semantic tokens of Appendix A.2, in both themes side by side. The markup of both panels is identical: only data-liro-theme differs, so the themes switch without a single component rule. Translucent dark values assume the page behind them."
    >
      <BothThemes
        render={(theme) =>
          [...groups.entries()].map(([group, entries]) => (
            <table key={group} className="w-full table-fixed border-collapse text-sm">
              <caption className="pb-1 text-start font-semibold">{group}</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Colour</th>
                  <th scope="col">Variable</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(({ variable, pair }) => (
                  <tr key={variable} className="border-t border-subtle">
                    <td className="w-10 py-1 align-middle">
                      <Swatch variable={variable} />
                    </td>
                    <td className="py-1 pe-2">
                      <Code>{variable}</Code>
                    </td>
                    <td className="py-1 text-secondary">
                      <Code>{resolveColor(pair[theme === 'light' ? 0 : 1])}</Code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))
        }
      />
    </Page>
  )
}

function StatusTones() {
  return (
    <Page
      title="Status tones"
      intro="The six tones of Appendix A.2. Text on a tone is always its fg on its bg, with its border. The solid colour is for bars and dots, never for text."
    >
      <BothThemes
        render={() => (
          <ul className="m-0 list-none p-0 flex flex-col gap-2">
            {(Object.keys(TONES) as Tone[]).map((tone) => (
              <li key={tone} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`inline-block size-3 rounded-full ${TONE_CLASSES[tone].dot}`}
                />
                <span
                  className={`rounded-sm border px-2 py-0.5 text-sm ${TONE_CLASSES[tone].sample}`}
                >
                  {tone}
                </span>
                <Code>--liro-status-{tone}-fg / -bg / -border / -solid</Code>
              </li>
            ))}
          </ul>
        )}
      />
    </Page>
  )
}

function SpacingRadiusShadows() {
  return (
    <Page
      title="Spacing, radius and shadows"
      intro="Appendix A.3. Tailwind's spacing scale gives the same steps (p-1 = 4px, p-2 = 8px, p-3 = 12px, p-4 = 16px, p-6 = 24px, p-8 = 32px, p-12 = 48px, p-16 = 64px). Radius: rounded-xs … rounded-xl, rounded-full. Shadows: shadow-xs … shadow-xl, stronger in the dark theme."
    >
      <section aria-label="Spacing" className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold">Spacing</h3>
        <ul className="m-0 list-none p-0 flex flex-col gap-1">
          {Object.entries(SPACE).map(([name, value]) => (
            <li key={name} className="flex items-center gap-3">
              <span className="w-12 text-sm">{name}</span>
              <span
                aria-hidden="true"
                className="block h-3 bg-brand-solid"
                style={{ inlineSize: `var(--liro-space-${name})` }}
              />
              <Code>{value}</Code>
            </li>
          ))}
        </ul>
      </section>
      <section aria-label="Radius" className="flex flex-col gap-2">
        <h3 className="m-0 font-semibold">Radius</h3>
        <ul className="m-0 list-none p-0 flex flex-wrap gap-4">
          {Object.entries(RADIUS).map(([name, value]) => (
            <li key={name} className="flex flex-col items-center gap-1">
              <span
                aria-hidden="true"
                className="block size-12 border-2 border-brand bg-surface-selected"
                style={{ borderRadius: `var(--liro-radius-${name})` }}
              />
              <span className="text-sm">{name}</span>
              <Code>{value}</Code>
            </li>
          ))}
        </ul>
      </section>
      <BothThemes
        render={(theme) => (
          <ul className="m-0 list-none p-0 flex flex-wrap gap-4">
            {Object.entries(SHADOWS).map(([name, pair]) => (
              <li
                key={name}
                className="flex w-40 flex-col gap-1 rounded-md bg-surface-raised p-3"
                style={{ boxShadow: `var(--liro-shadow-${name})` }}
              >
                <span className="text-sm font-semibold">shadow-{name}</span>
                <Code>{pair[theme === 'light' ? 0 : 1]}</Code>
              </li>
            ))}
          </ul>
        )}
      />
    </Page>
  )
}

function ValueTable({ caption, rows }: { caption: string; rows: [string, string, string][] }) {
  return (
    <table className="w-full max-w-3xl table-fixed border-collapse text-sm">
      <caption className="pb-1 text-start font-semibold">{caption}</caption>
      <thead>
        <tr className="text-start text-secondary">
          <th scope="col" className="py-1 pe-2 text-start font-normal">
            Name
          </th>
          <th scope="col" className="py-1 pe-2 text-start font-normal">
            Variable
          </th>
          <th scope="col" className="py-1 text-start font-normal">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, variable, value]) => (
          <tr key={variable} className="border-t border-subtle">
            <td className="py-1 pe-2">{name}</td>
            <td className="py-1 pe-2">
              <Code>{variable}</Code>
            </td>
            <td className="py-1">
              <Code>{value}</Code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function rowsOf(prefix: string, values: Record<string, string>): [string, string, string][] {
  return Object.entries(values).map(([name, value]) => [
    name,
    `--liro-${prefix}-${kebab(name)}`,
    value,
  ])
}

function MotionAndLayout() {
  return (
    <Page
      title="Motion and layout"
      intro="Appendix A.4. With prefers-reduced-motion: reduce, every duration is 0ms. Breakpoints are the Tailwind screens xs … xl (media queries cannot read variables, so the variables are for reference). Sizes: h-header, h-control, h-control-sm, max-w-content. Layers: z-(--liro-layer-modal)."
    >
      <ValueTable caption="Durations" rows={rowsOf('duration', DURATION)} />
      <ValueTable caption="Easing" rows={rowsOf('ease', EASING)} />
      <ValueTable caption="Breakpoints" rows={rowsOf('breakpoint', BREAKPOINTS)} />
      <ValueTable caption="Sizes" rows={rowsOf('size', SIZES)} />
      <ValueTable caption="Layers (z-index)" rows={rowsOf('layer', LAYERS)} />
    </Page>
  )
}

const meta = {
  title: 'Foundations/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Every value and meaning of @veljaos/tokens. Three layers: values (the ramps, open) → ' +
          'meanings (surface, text, border, brand, status; a closed vocabulary) → components, which ' +
          'choose a meaning and never a value. Use the semantic utilities (bg-surface-raised, ' +
          'text-secondary, border-strong, bg-status-danger-bg) or the --liro-* variables; raw ' +
          'colours are removed from the Tailwind theme and forbidden by @veljaos/eslint-config.',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Values: Story = { name: 'Colour values', render: () => <ColourValues /> }

export const MeaningsInBothThemes: Story = {
  name: 'Meanings',
  render: () => <Meanings />,
}

export const Tones: Story = { name: 'Status tones', render: () => <StatusTones /> }

export const SpacingRadiusAndShadows: Story = {
  name: 'Spacing, radius, shadows',
  render: () => <SpacingRadiusShadows />,
}

export const Motion: Story = { name: 'Motion and layout', render: () => <MotionAndLayout /> }
