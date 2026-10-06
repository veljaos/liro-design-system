/**
 * Contrast, measured after layers composite (Appendix B.6): a translucent token is mixed with
 * the opaque surface under it before its contrast is measured. The build fails when any pair
 * listed here is below its minimum (BUILD-PLAN P1.3, P1.4).
 */
import {
  FAMILIES,
  MEANINGS,
  ON_SELECTED,
  resolveColor,
  TONES,
  type Pair,
  type Theme,
} from './tokens.ts'

type Rgb = readonly [number, number, number]

/** A hex or rgba() colour, composited over `under` when translucent. */
export function toRgb(color: string, under: Rgb): Rgb {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color)
  if (hex !== null) {
    return [parseInt(hex[1] ?? '', 16), parseInt(hex[2] ?? '', 16), parseInt(hex[3] ?? '', 16)]
  }
  const rgba = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(color)
  if (rgba === null) throw new Error(`cannot read colour ${color}`)
  const alpha = Number(rgba[4])
  const channels = [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])]
  return channels.map((channel, index) =>
    Math.round(channel * alpha + (under[index] ?? 0) * (1 - alpha)),
  ) as unknown as Rgb
}

function luminance([red, green, blue]: Rgb): number {
  const linear = (channel: number) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

/** WCAG 2 contrast ratio of two opaque colours. */
export function contrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a) as [
    number,
    number,
  ]
  return (lighter + 0.05) / (darker + 0.05)
}

export interface ContrastCheck {
  /** What is measured, e.g. "dark: family destructive fg on subtle over raised". */
  name: string
  ratio: number
  minimum: number
}

/** WCAG 2.2 AA for normal text. */
const TEXT = 4.5
/** WCAG 2.2 AA 1.4.11 for the boundary of a control against what surrounds it. */
const NON_TEXT = 3
const BLACK: Rgb = [0, 0, 0]
const SURFACES = ['page', 'raised', 'sunken', 'overlay', 'header'] as const

function pick(pair: Pair, theme: Theme): string {
  return resolveColor(pair[theme === 'light' ? 0 : 1])
}

/** A text colour as it is on a selected row or card: its ON_SELECTED shade, if it has one. */
function pickOnSelected(variable: string, pair: Pair, theme: Theme): string {
  const shade = ON_SELECTED[theme][variable]
  return shade === undefined ? pick(pair, theme) : resolveColor(shade)
}

/** Every text-on-background pair of the families and tones, in both themes, on every surface. */
export function contrastChecks(): ContrastCheck[] {
  const checks: ContrastCheck[] = []
  const add = (name: string, text: Rgb, background: Rgb, minimum = TEXT) => {
    checks.push({ name, ratio: contrastRatio(text, background), minimum })
  }
  for (const theme of ['light', 'dark'] as const) {
    const onAccent = toRgb(pick(MEANINGS.text.onAccent, theme), BLACK)
    for (const surfaceName of SURFACES) {
      const surface = toRgb(pick(MEANINGS.surface[surfaceName], theme), BLACK)
      const over = `over ${surfaceName}`
      const hover = toRgb(pick(MEANINGS.surface.hover, theme), surface)

      for (const [family, parts] of Object.entries(FAMILIES)) {
        const label = `${theme}: family ${family}`
        // Filled (primary emphasis): white on the fill, its hover and its press.
        for (const part of ['solid', 'solidHover', 'solidActive'] as const) {
          add(`${label} on-accent on ${part}`, onAccent, toRgb(pick(parts[part], theme), surface))
        }
        const fg = (background: Rgb) => toRgb(pick(parts.fg, theme), background)
        // Subtle (menu emphasis): the family's text on the surface, and on its hover.
        add(`${label} fg on the surface ${over}`, fg(surface), surface)
        const fgHover = (background: Rgb) => toRgb(pick(parts.fgHover, theme), background)
        if ('subtle' in parts) {
          // Light (secondary emphasis): the family's text on its tint; on hover, the stronger
          // text on the stronger tint, which is also the hover of subtle (menu emphasis).
          const tint = toRgb(pick(parts.subtle, theme), surface)
          add(`${label} fg on subtle ${over}`, fg(tint), tint)
          // Subtle (menu emphasis) on hover: the stronger text on the tint.
          add(`${label} fgHover on subtle ${over}`, fgHover(tint), tint)
          const hoverTint = toRgb(pick(parts.subtleHover, theme), surface)
          add(`${label} fgHover on subtleHover ${over}`, fgHover(hoverTint), hoverTint)
        } else {
          // Neutral: default (secondary) and subtle (menu) hover on surface.hover.
          add(`${label} fgHover on surface.hover ${over}`, fgHover(hover), hover)
        }
      }

      // Controls (P2.1): the boundary of inputs, checkboxes and radios, and the off track of a
      // switch, against the surface around them (WCAG 1.4.11).
      add(
        `${theme}: border.control ${over}`,
        toRgb(pick(MEANINGS.border.control, theme), surface),
        surface,
        NON_TEXT,
      )

      // A selected row or card (P3.6): its text on surface.selected, and the border.selected bar
      // against the selected background and the surface around it (WCAG 1.4.11).
      const selected = toRgb(pick(MEANINGS.surface.selected, theme), surface)
      for (const textName of ['primary', 'secondary', 'tertiary'] as const) {
        add(
          `${theme}: text.${textName} on surface.selected ${over}`,
          toRgb(pick(MEANINGS.text[textName], theme), selected),
          selected,
        )
      }
      const selectedBorder = toRgb(pick(MEANINGS.border.selected, theme), surface)
      add(
        `${theme}: border.selected on surface.selected ${over}`,
        selectedBorder,
        selected,
        NON_TEXT,
      )
      add(`${theme}: border.selected ${over}`, selectedBorder, surface, NON_TEXT)

      // An invalid field (P2.2): its border takes status.danger.fg (WCAG 1.4.11).
      add(
        `${theme}: status.danger.fg as a border ${over}`,
        toRgb(pick(TONES.danger.fg, theme), surface),
        surface,
        NON_TEXT,
      )

      // Status tones: fg on bg (Appendix B.6), P1.4.
      for (const [tone, parts] of Object.entries(TONES)) {
        const background = toRgb(pick(parts.bg, theme), surface)
        add(
          `${theme}: tone ${tone} fg on bg ${over}`,
          toRgb(pick(parts.fg, theme), background),
          background,
        )
      }

      // Every tone's text straight on the surface (a field's error, a due date's text) and on a
      // selected row or card over it; every tone's badge (fg on bg) over a selected row; every
      // family's text on a selected row, as a subtle and as a light button (P4.3, owner).
      for (const [tone, parts] of Object.entries(TONES)) {
        add(`${theme}: tone ${tone} fg ${over}`, toRgb(pick(parts.fg, theme), surface), surface)
        const fg = (background: Rgb) =>
          toRgb(pickOnSelected(`status-${tone}-fg`, parts.fg, theme), background)
        add(`${theme}: tone ${tone} fg on surface.selected ${over}`, fg(selected), selected)
        const badge = toRgb(pick(parts.bg, theme), selected)
        add(`${theme}: tone ${tone} fg on bg on surface.selected ${over}`, fg(badge), badge)
      }
      for (const [family, parts] of Object.entries(FAMILIES)) {
        const fg = (background: Rgb) =>
          toRgb(pickOnSelected(`family-${family}-fg`, parts.fg, theme), background)
        add(`${theme}: family ${family} fg on surface.selected ${over}`, fg(selected), selected)
        if ('subtle' in parts) {
          const tint = toRgb(pick(parts.subtle, theme), selected)
          add(`${theme}: family ${family} fg on subtle on surface.selected ${over}`, fg(tint), tint)
        }
      }
    }

    // The avatar's initials (P3.6): text.primary on surface.sunken, which is opaque in both themes.
    const sunken = toRgb(pick(MEANINGS.surface.sunken, theme), BLACK)
    add(
      `${theme}: text.primary on surface.sunken (avatar)`,
      toRgb(pick(MEANINGS.text.primary, theme), sunken),
      sunken,
    )

    // The app lockup (P4.1): text.logo on the surfaces it stands on — the header, and the raised
    // surface of the status pages and the sign-in card.
    for (const name of ['header', 'raised'] as const) {
      const surface = toRgb(pick(MEANINGS.surface[name], theme), BLACK)
      add(
        `${theme}: text.logo on surface.${name}`,
        toRgb(pick(MEANINGS.text.logo, theme), surface),
        surface,
      )
    }

    // Tooltips (P2.1): text.onInverse on surface.inverse, which is opaque in both themes.
    const inverse = toRgb(pick(MEANINGS.surface.inverse, theme), BLACK)
    add(
      `${theme}: text.onInverse on surface.inverse`,
      toRgb(pick(MEANINGS.text.onInverse, theme), inverse),
      inverse,
    )
  }
  return checks
}

/** The checks below their minimum. */
export function contrastFailures(): ContrastCheck[] {
  return contrastChecks().filter((check) => check.ratio < check.minimum)
}
