import { encodeQR } from 'qr'
import { useMemo } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * QrCode (P5.40): a QR code drawn from a text — an IPS payment code (`ipsQrText`), a link to a
 * record, a pairing code. Encoded in the browser by `qr` 0.7.2 (MIT, no dependencies) and drawn as
 * one SVG path, so it is sharp at any size, in print too.
 *
 * - **Dark on light, always:** a code is read by a camera, and many readers fail on an inverted
 *   one, so the code stands on the light surface in both themes (`data-liro-theme="light"`, as
 *   paper in PrintPage), in the light theme's text colour — tokens only (D6).
 * - **The quiet zone** (`quietZone`, default 4 modules, as the standard asks) is part of the
 *   drawing: nothing may touch the code.
 * - **Error correction** (`errorCorrection`): 'medium' by default (15% of the code may be lost).
 * - **Named:** an image with `label` ("IPS QR code for the payment"); the text it holds is not read
 *   out (a payment code is a string of tags), show it beside the code when the user needs it.
 * - A text too long for any QR code shows the provider's message in its place, never a broken code.
 *
 * When not: a picture made by the application (pass it to the slot that wants an image).
 */

/** How much of the code may be damaged and still read. */
export type QrErrorCorrection = 'low' | 'medium' | 'quartile' | 'high'

/** The modules of a text's QR code (true = dark), or null when it does not fit in one. */
export function qrModules(
  text: string,
  errorCorrection: QrErrorCorrection = 'medium',
): boolean[][] | null {
  try {
    // The encoder keeps at least one module of border; it is cut off here (the quiet zone is drawn).
    return encodeQR(text, 'raw', { ecc: errorCorrection, border: 1 })
      .slice(1, -1)
      .map((row) => row.slice(1, -1))
  } catch {
    return null
  }
}

/** One SVG path of the dark modules, each row's runs joined ("M3 0h4v1h-4z"). */
export function qrPath(modules: readonly (readonly boolean[])[], offset = 0): string {
  let path = ''
  modules.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== true) {
        x += 1
        continue
      }
      const start = x
      while (x < row.length && row[x] === true) x += 1
      path += `M${String(start + offset)} ${String(y + offset)}h${String(x - start)}v1h-${String(x - start)}z`
    }
  })
  return path
}

export interface QrCodeProps {
  /** The text the code holds. */
  value: string
  /** The image's name ("IPS QR code for the payment"). */
  label: string
  /**
   * Width and height in px, quiet zone included (default 160), or 'fill': as large as its box (a
   * printout's 32mm slot).
   */
  size?: number | 'fill'
  /** Default 'medium'. */
  errorCorrection?: QrErrorCorrection
  /** The empty border in modules. Default 4. */
  quietZone?: number
  /** Layout classes (margins, alignment). */
  className?: string
}

/** A QR code from a text: dark on light in both themes, with its quiet zone, named. */
export function QrCode({
  value,
  label,
  size = 160,
  errorCorrection = 'medium',
  quietZone = 4,
  className,
}: QrCodeProps) {
  const { messages } = useLiro()
  const modules = useMemo(() => qrModules(value, errorCorrection), [value, errorCorrection])
  if (modules === null) {
    return (
      <span
        data-slot="qr-code"
        role="img"
        aria-label={label}
        style={size === 'fill' ? undefined : { width: size, minHeight: size }}
        className={cn(
          'inline-flex items-center justify-center rounded-sm border border-dashed border-default p-2 text-center text-xs text-secondary',
          size === 'fill' && 'size-full',
          TEXT_DIRECTION,
          className,
        )}
      >
        {messages['qr.tooLong']}
      </span>
    )
  }
  const extent = modules.length + quietZone * 2
  return (
    <span
      data-slot="qr-code"
      data-liro-theme="light"
      className={cn(
        'inline-flex shrink-0 bg-surface-raised text-primary [color-scheme:light]',
        size === 'fill' && 'aspect-square size-full',
        className,
      )}
    >
      <svg
        role="img"
        aria-label={label}
        width={size === 'fill' ? '100%' : size}
        height={size === 'fill' ? '100%' : size}
        viewBox={`0 0 ${String(extent)} ${String(extent)}`}
        shapeRendering="crispEdges"
        className="block"
      >
        <path d={qrPath(modules, quietZone)} fill="currentColor" />
      </svg>
    </span>
  )
}
