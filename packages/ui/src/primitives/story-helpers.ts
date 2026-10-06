/*
 * Helpers for the internal primitive stories. Not part of the package: nothing in src/index.ts
 * imports this file.
 */

/**
 * A play function that waits until the enter animations of overlays have finished, so the
 * accessibility check sees them at full opacity. Endless animations (a skeleton's pulse) are
 * not waited for.
 */
export async function settle(): Promise<void> {
  // The fonts first: a chart draws its plot once they are ready (charts.tsx, Plot), then two
  // frames for it to render and measure.
  await document.fonts.ready
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
  const finite = document
    .getAnimations()
    .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
  await Promise.all(finite.map((animation) => animation.finished.catch(() => undefined)))
}

/** The description of an internal primitive's story page. */
export function internal(what: string): string {
  return (
    `**Internal primitive.** Not exported from \`@veljaos/ui\` (AGENTS.md D10): Liro components ` +
    `are built from it. ${what}`
  )
}
