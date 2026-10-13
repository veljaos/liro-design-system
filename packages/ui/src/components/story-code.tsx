/*
 * A stand-in for a QR code in stories and examples (P5.28): a 25 × 25 grid with the three finder
 * squares and modules drawn from the text by a fixed sequence, so the same text always draws the
 * same picture (pictures must be stable). It is NOT a readable QR code: the application draws the
 * real one (the fiscal receipt's code, an instant payment's code). Not part of the package:
 * nothing in src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files; the code takes the text colour (`currentColor`).
 */

const SIZE = 25

/** The finder squares' cells: 7 × 7 at three corners, with a ring of quiet space. */
function inFinder(x: number, y: number): boolean | null {
  for (const [ox, oy] of [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ] as const) {
    const dx = x - ox
    const dy = y - oy
    if (dx >= -1 && dx <= 7 && dy >= -1 && dy <= 7) {
      if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false
      const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6
      const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
      return ring || core
    }
  }
  return null
}

/** The dark cells of the stand-in for this text. */
export function storyCodeCells(text: string): [number, number][] {
  // A small linear congruential sequence seeded by the text (FNV-1a).
  let seed = 2166136261
  for (const char of text) {
    seed ^= char.codePointAt(0) ?? 0
    seed = Math.imul(seed, 16777619) >>> 0
  }
  const cells: [number, number][] = []
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const finder = inFinder(x, y)
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const dark = finder ?? seed % 100 < 47
      if (dark) cells.push([x, y])
    }
  }
  return cells
}

/** A QR code's stand-in, named for assistive technology. */
export function StoryCode({
  text,
  label,
  size = 112,
}: {
  /** What the real code would hold (a link); only seeds the picture. */
  text: string
  /** The image's name ("Fiscal receipt code"). */
  label: string
  /** Its width and height in px. */
  size?: number
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`-2 -2 ${String(SIZE + 4)} ${String(SIZE + 4)}`}
      shapeRendering="crispEdges"
    >
      {storyCodeCells(text).map(([x, y]) => (
        <rect
          key={`${String(x)}-${String(y)}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}
