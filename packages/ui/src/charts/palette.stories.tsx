import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'
import { expect } from 'storybook/test'
import { ExampleProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'

/*
 * The chart colours with their contrast against the card (P4.7c, owner), measured in the story's
 * theme: the swatch's computed colour and the card's, by the WCAG formula. Every mark needs 3:1
 * (WCAG 1.4.11); `contrast.ts` checks the same in the build.
 */

const COLOURS = [
  { token: 'chart.main', name: 'Main series' },
  { token: 'chart.comparison', name: 'Comparison' },
  { token: 'chart.other', name: 'Other' },
  { token: 'chart.category1', name: 'Categorical 1 — blue' },
  { token: 'chart.category2', name: 'Categorical 2 — magenta' },
  { token: 'chart.category3', name: 'Categorical 3 — purple' },
  { token: 'chart.category4', name: 'Categorical 4 — teal' },
  { token: 'chart.category5', name: 'Categorical 5 — indigo' },
] as const

/** The channels of a computed colour ("rgb(0, 120, 212)"), 0–255. */
function channels(computed: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = (computed.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  return [r, g, b]
}

function luminance([r, g, b]: [number, number, number]): number {
  const linear = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function ratio(a: string, b: string): number {
  const [high, low] = [luminance(channels(a)), luminance(channels(b))].sort((x, y) => y - x)
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05)
}

function Palette() {
  const { format } = useLiro()
  const card = useRef<HTMLDivElement>(null)
  const [ratios, setRatios] = useState<Record<string, number>>({})
  useEffect(() => {
    const element = card.current
    if (element === null) return
    const surface = getComputedStyle(element).backgroundColor
    const measured: Record<string, number> = {}
    for (const swatch of element.querySelectorAll<HTMLElement>('[data-token]')) {
      measured[swatch.dataset.token ?? ''] = ratio(
        getComputedStyle(swatch).backgroundColor,
        surface,
      )
    }
    setRatios(measured)
  }, [])
  return (
    <div
      ref={card}
      className="box-border max-w-140 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans"
    >
      <h3 className="m-0 mb-3 text-sm font-semibold text-primary">Chart colours on the card</h3>
      <table className="w-full border-collapse text-sm text-primary">
        <thead>
          <tr>
            <th className="border-0 border-b border-solid border-default py-1.5 text-start font-semibold">
              Colour
            </th>
            <th className="border-0 border-b border-solid border-default py-1.5 text-start font-semibold">
              Token
            </th>
            <th className="border-0 border-b border-solid border-default py-1.5 text-end font-semibold">
              Contrast
            </th>
          </tr>
        </thead>
        <tbody>
          {COLOURS.map((colour) => {
            const value = ratios[colour.token]
            return (
              <tr key={colour.token}>
                <td className="border-0 border-b border-solid border-subtle py-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      data-token={colour.token}
                      aria-hidden="true"
                      className="inline-block size-4 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: `var(--liro-${colour.token.replace('.', '-')})`,
                      }}
                    />
                    {colour.name}
                  </span>
                </td>
                <td className="border-0 border-b border-solid border-subtle py-1.5 font-mono text-xs text-secondary">
                  {colour.token}
                </td>
                <td
                  data-ratio={colour.token}
                  className="border-0 border-b border-solid border-subtle py-1.5 text-end tabular-nums"
                >
                  {value === undefined ? '—' : `${format.number(value.toFixed(2))}:1`}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const meta = {
  title: 'Charts/Palette',
  parameters: {
    docs: {
      description: {
        component:
          '**The chart colours** and their contrast against the card, measured in the chosen ' +
          'theme. One series is the main blue, a second the comparison grey. Three or more series ' +
          'use the categorical palette in this fixed order — blue, magenta, purple, teal, indigo — ' +
          'chosen so that none reads as a status (no red, orange or green), every pair of ' +
          'neighbours stays apart for colour-blind readers (checked with the palette validator in ' +
          'both themes) and every hue reaches 3:1 on the card.',
      },
    },
  },
  render: () => (
    <ExampleProvider>
      <Palette />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    for (const cell of canvasElement.querySelectorAll<HTMLElement>('[data-ratio]')) {
      const value = Number(cell.textContent.replace(':1', '').replace(',', '.'))
      await expect(value, cell.dataset.ratio).toBeGreaterThanOrEqual(3)
    }
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Every chart colour with its measured contrast (at least 3:1). */
export const Palette_: Story = { name: 'Palette' }
