/**
 * The Liro tokens, in one place (BUILD-PLAN P1.1, Appendix A). Three layers:
 *
 * 1. Values: colour ramps, spacing, radius, shadows, motion and layout sizes. Open; they may
 *    change freely.
 * 2. Meanings: a closed vocabulary (surface, text, border, brand, status). Each names one value
 *    per theme. Meanings change rarely and deliberately.
 * 3. Components choose a meaning, never a value. That layer lives in @veljaos/ui.
 *
 * The values are carried over 1:1 from the previous Design System. `scripts/build.ts` writes
 * dist/tokens.css, dist/theme.css and dist/tokens.json from this file; nothing else holds a value.
 *
 * A meaning refers to a value by name ('gray1', 'white', 'ink', 'inkRaised'), or gives a literal
 * where the appendix does ('rgba(255,255,255,0.05)', '#B3B0AD').
 */

/** A.1 Colour ramps, 0 = lightest, 9 = darkest. */
export const RAMPS = {
  blue: [
    '#E8F5FA',
    '#BDE3F5',
    '#93D1F0',
    '#68BEEF',
    '#3EACEB',
    '#1499E6',
    '#0078D4',
    '#0069BC',
    '#0059A4',
    '#004A8C',
  ],
  teal: [
    '#E4F7F7',
    '#B8E8E9',
    '#8CD9DA',
    '#5FC9CB',
    '#33BABC',
    '#17A8AB',
    '#038387',
    '#027276',
    '#026165',
    '#015052',
  ],
  gray: [
    '#FAF9F8',
    '#F3F2F1',
    '#EDEBE9',
    '#E1DFDD',
    '#D2D0CE',
    '#A19F9D',
    '#797775',
    '#605E5C',
    '#3B3A39',
    '#323130',
  ],
  green: [
    '#DFF6DD',
    '#C3EBC0',
    '#A3DD9F',
    '#7FCD7A',
    '#5ABC55',
    '#3AA835',
    '#1C8815',
    '#107C10',
    '#0B6A0B',
    '#054B05',
  ],
  orange: [
    '#FFF4CE',
    '#FFE7A0',
    '#FFD670',
    '#FFC043',
    '#FCA61F',
    '#F08C00',
    '#E56F01',
    '#D83B01',
    '#B83101',
    '#8F2601',
  ],
  red: [
    '#FDE7E9',
    '#F9C8CD',
    '#F3A3AB',
    '#EB7A85',
    '#E05360',
    '#CF3A48',
    '#BD2F3B',
    '#A4262C',
    '#8A1F24',
    '#6B171C',
  ],
  violet: [
    '#F3F0FF',
    '#E5DBFF',
    '#D0BFFF',
    '#B197FC',
    '#9775FA',
    '#845EF7',
    '#7950F2',
    '#7048E8',
    '#6741D9',
    '#5F3DC4',
  ],
} as const satisfies Record<string, readonly string[]>

export type RampName = keyof typeof RAMPS

/** A.1 Common colours. */
export const COMMON = {
  white: '#FFFFFF',
  black: '#000000',
  ink: '#1B1B1B',
  inkRaised: '#242424',
  inkSunken: '#141414',
  inkOverlay: '#2C2C2C',
} as const

export type CommonName = keyof typeof COMMON

/** A meaning in both themes: [light, dark]. */
export type Pair = readonly [light: string, dark: string]

/** A.2 Meanings. Keys become --liro-<group>-<kebab-case key>. */
export const MEANINGS = {
  surface: {
    page: ['gray1', 'ink'],
    raised: ['white', 'inkRaised'],
    sunken: ['gray2', 'inkSunken'],
    overlay: ['white', 'inkOverlay'],
    header: ['white', 'inkRaised'],
    hover: ['gray0', 'rgba(255,255,255,0.05)'],
    selected: ['blue0', 'rgba(0,120,212,0.18)'],
    disabled: ['gray2', 'rgba(255,255,255,0.06)'],
    backdrop: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.65)'],
    scrim: ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.55)'],
  },
  text: {
    primary: ['gray9', 'gray1'],
    secondary: ['gray7', '#B3B0AD'],
    tertiary: ['#6A6866', 'gray5'],
    disabled: ['gray5', 'gray6'],
    onAccent: ['white', 'white'],
    brand: ['blue7', 'blue4'],
    link: ['blue7', 'blue4'],
  },
  border: {
    default: ['gray3', '#3B3B3B'],
    strong: ['gray4', '#4D4D4D'],
    subtle: ['gray2', '#2E2E2E'],
    brand: ['blue6', 'blue5'],
    focus: ['blue6', 'blue4'],
  },
  brand: {
    solid: ['blue6', 'blue6'],
    solidHover: ['blue7', 'blue7'],
    solidActive: ['blue8', 'blue8'],
    subtle: ['blue0', 'rgba(0,120,212,0.16)'],
    subtleHover: ['blue1', 'rgba(0,120,212,0.26)'],
    onSolid: ['white', 'white'],
    accent: ['teal6', 'teal4'],
  },
} as const satisfies Record<string, Record<string, Pair>>

/** A.2 Status tones: fg (text), bg (background under that text), border, solid (bars and dots, never text). */
export const TONES = {
  success: {
    fg: ['green7', 'green3'],
    bg: ['green0', 'rgba(16,124,16,0.20)'],
    border: ['green2', 'rgba(16,124,16,0.45)'],
    solid: ['green7', 'green6'],
  },
  warning: {
    fg: ['orange8', 'orange3'],
    bg: ['orange0', 'rgba(216,59,1,0.20)'],
    border: ['orange2', 'rgba(216,59,1,0.45)'],
    solid: ['orange7', 'orange6'],
  },
  danger: {
    fg: ['red7', 'red3'],
    bg: ['red0', 'rgba(164,38,44,0.22)'],
    border: ['red2', 'rgba(164,38,44,0.50)'],
    solid: ['red7', 'red6'],
  },
  info: {
    fg: ['blue7', 'blue3'],
    bg: ['blue0', 'rgba(0,120,212,0.18)'],
    border: ['blue2', 'rgba(0,120,212,0.45)'],
    solid: ['blue6', 'blue6'],
  },
  neutral: {
    fg: ['gray9', 'gray1'],
    bg: ['gray1', 'rgba(255,255,255,0.07)'],
    border: ['gray3', '#3B3B3B'],
    solid: ['gray7', 'gray5'],
  },
  premium: {
    fg: ['violet7', 'violet3'],
    bg: ['violet0', 'rgba(121,80,242,0.20)'],
    border: ['violet2', 'rgba(121,80,242,0.45)'],
    solid: ['violet6', 'violet5'],
  },
} as const satisfies Record<string, Record<'fg' | 'bg' | 'border' | 'solid', Pair>>

export type Tone = keyof typeof TONES

/** A.3 Spacing. Tailwind's own scale (--spacing: 0.25rem) gives the same steps: p-1 = 4px … p-16 = 64px. */
export const SPACE = {
  none: '0',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
} as const

/** A.3 Radius. */
export const RADIUS = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

/** A.3 Shadows: the same offsets in both themes; dark uses a stronger black. */
const SHADOW_OFFSETS = {
  xs: '0 1px 2px',
  sm: '0 1px 4px',
  md: '0 2px 8px',
  lg: '0 4px 16px',
  xl: '0 8px 32px',
} as const

const SHADOW_OPACITY = {
  xs: ['0.06', '0.35'],
  sm: ['0.08', '0.40'],
  md: ['0.08', '0.45'],
  lg: ['0.10', '0.50'],
  xl: ['0.14', '0.60'],
} as const satisfies Record<keyof typeof SHADOW_OFFSETS, Pair>

type ShadowSize = keyof typeof SHADOW_OFFSETS

function shadow(size: ShadowSize): Pair {
  const [light, dark] = SHADOW_OPACITY[size]
  const offset = SHADOW_OFFSETS[size]
  return [`${offset} rgba(0,0,0,${light})`, `${offset} rgba(0,0,0,${dark})`]
}

export const SHADOWS: Record<ShadowSize, Pair> = {
  xs: shadow('xs'),
  sm: shadow('sm'),
  md: shadow('md'),
  lg: shadow('lg'),
  xl: shadow('xl'),
}

/** A.4 Motion. `prefers-reduced-motion: reduce` sets every duration to 0ms. */
export const DURATION = {
  instant: '75ms',
  fast: '100ms',
  base: '150ms',
  slow: '250ms',
} as const

export const EASING = {
  standard: 'cubic-bezier(0.33,0,0.67,1)',
  decelerate: 'cubic-bezier(0.1,0.9,0.2,1)',
  accelerate: 'cubic-bezier(0.9,0.1,1,0.2)',
} as const

/** A.4 Breakpoints. */
export const BREAKPOINTS = {
  xs: '36em',
  sm: '48em',
  md: '62em',
  lg: '75em',
  xl: '88em',
} as const

/** A.4 Sizes. */
export const SIZES = {
  headerHeight: '56px',
  contentMaxWidth: '1440px',
  controlHeight: '36px',
  controlHeightSm: '30px',
} as const

/** A.4 Layers (z-index). */
export const LAYERS = {
  base: '0',
  raised: '10',
  sticky: '100',
  header: '200',
  drawer: '300',
  modal: '400',
  popover: '500',
  toast: '600',
  tooltip: '700',
} as const

export type Theme = 'light' | 'dark'
export const THEMES: readonly Theme[] = ['light', 'dark']

const RAMP_REFERENCE = /^(blue|teal|gray|green|orange|red|violet)(\d)$/

/** A value reference ('gray1', 'white', 'inkRaised') as its ramp and step, or common name; null for a literal. */
export function parseReference(
  reference: string,
): { ramp: RampName; step: number } | { common: CommonName } | null {
  const match = RAMP_REFERENCE.exec(reference)
  if (match !== null) {
    return { ramp: match[1] as RampName, step: Number(match[2]) }
  }
  if (Object.hasOwn(COMMON, reference)) {
    return { common: reference as CommonName }
  }
  return null
}

/** The colour a reference or literal stands for. */
export function resolveColor(reference: string): string {
  const parsed = parseReference(reference)
  if (parsed === null) {
    return reference
  }
  if ('common' in parsed) {
    return COMMON[parsed.common]
  }
  const value = RAMPS[parsed.ramp][parsed.step]
  if (value === undefined) {
    throw new Error(`no step ${String(parsed.step)} in ramp ${parsed.ramp}`)
  }
  return value
}

/** camelCase → kebab-case, for CSS names. */
export function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

/** The name of a value variable: 'gray1' → '--liro-gray-1', 'inkRaised' → '--liro-ink-raised'. */
export function valueVariable(reference: string): string | null {
  const parsed = parseReference(reference)
  if (parsed === null) {
    return null
  }
  return 'common' in parsed
    ? `--liro-${kebab(parsed.common)}`
    : `--liro-${parsed.ramp}-${String(parsed.step)}`
}

/** MEANINGS and TONES, typed for iteration. */
const MEANING_GROUPS: Record<string, Record<string, Pair>> = MEANINGS
const TONE_GROUPS: Record<string, Record<string, Pair>> = TONES

/** Every meaning (A.2 including tones) as [CSS variable, light, dark], in a stable order. */
export function meaningEntries(): { variable: string; path: string; pair: Pair }[] {
  const entries: { variable: string; path: string; pair: Pair }[] = []
  for (const [group, meanings] of Object.entries(MEANING_GROUPS)) {
    for (const [name, pair] of Object.entries(meanings)) {
      entries.push({ variable: `--liro-${group}-${kebab(name)}`, path: `${group}.${name}`, pair })
    }
  }
  for (const [tone, parts] of Object.entries(TONE_GROUPS)) {
    for (const [part, pair] of Object.entries(parts)) {
      entries.push({
        variable: `--liro-status-${tone}-${part}`,
        path: `status.${tone}.${part}`,
        pair,
      })
    }
  }
  return entries
}

/** The tokens as data with every reference resolved, for renderers without CSS (dist/tokens.json). */
export function resolvedTokens() {
  const meanings = (theme: Theme) => {
    const index = theme === 'light' ? 0 : 1
    const pick = (pair: Pair) => resolveColor(pair[index])
    const groups = Object.fromEntries(
      Object.entries(MEANING_GROUPS).map(([group, members]) => [
        group,
        Object.fromEntries(Object.entries(members).map(([name, pair]) => [name, pick(pair)])),
      ]),
    )
    const status = Object.fromEntries(
      Object.entries(TONE_GROUPS).map(([tone, parts]) => [
        tone,
        Object.fromEntries(Object.entries(parts).map(([part, pair]) => [part, pick(pair)])),
      ]),
    )
    return { ...groups, status }
  }
  const shadows = (theme: Theme) =>
    Object.fromEntries(
      Object.entries(SHADOWS).map(([size, pair]) => [size, pair[theme === 'light' ? 0 : 1]]),
    )
  return {
    color: {
      ...Object.fromEntries(Object.entries(RAMPS).map(([ramp, steps]) => [ramp, [...steps]])),
      common: { ...COMMON },
    },
    meaning: { light: meanings('light'), dark: meanings('dark') },
    space: { ...SPACE },
    radius: { ...RADIUS },
    shadow: { light: shadows('light'), dark: shadows('dark') },
    motion: { duration: { ...DURATION }, easing: { ...EASING } },
    breakpoint: { ...BREAKPOINTS },
    size: { ...SIZES },
    layer: { ...LAYERS },
  }
}
