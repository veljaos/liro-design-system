import type { CSSProperties, ReactNode } from 'react'
import { expect, waitFor } from 'storybook/test'

/*
 * The sticky-header stories (P5.28 item 4). Not part of the package: nothing in src/index.ts
 * imports this file. Inline styles only: Storybook compiles Tailwind classes from *.stories.tsx
 * files alone.
 *
 * A picture cannot show scrolling, so these stories act (tag `interaction`): they scroll the page
 * under a shell and check where the header stands.
 */

/** The shell's sticky height in these stories, as AppShell's 56px header. */
export const SHELL_TOP = 56

/**
 * A page under a 56px sticky bar that publishes `--liro-shell-top` as AppShell does. With a size
 * it is a phone: the page scrolls inside its own 390px frame; without, the window scrolls.
 */
export function ShellPage({
  width,
  height,
  children,
}: {
  width?: number
  height?: number
  children: ReactNode
}) {
  const frame: CSSProperties =
    width === undefined
      ? {}
      : {
          width,
          height,
          maxWidth: '100%',
          overflowY: 'auto',
          outline: '1px solid var(--liro-border-default)',
        }
  return (
    <div data-slot="story-scroller" style={frame}>
      <div style={{ '--liro-shell-top': `${String(SHELL_TOP)}px` } as CSSProperties}>
        <div
          aria-hidden="true"
          data-slot="story-shell-bar"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 'var(--liro-layer-header)',
            height: SHELL_TOP,
            boxSizing: 'border-box',
            borderBottom: '1px solid var(--liro-border-default)',
            background: 'var(--liro-surface-header)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function bar(canvasElement: HTMLElement): HTMLElement {
  const found = canvasElement.querySelector<HTMLElement>('[data-slot="story-shell-bar"]')
  if (found === null) throw new Error('no shell bar')
  return found
}

/** The element that scrolls the story's page: the phone frame, else the document. */
function pageScroller(canvasElement: HTMLElement): Element {
  const frame = canvasElement.querySelector<HTMLElement>('[data-slot="story-scroller"]')
  if (frame !== null && frame.style.overflowY === 'auto') return frame
  return document.scrollingElement ?? document.documentElement
}

/** Two animation frames: the header's position is updated once a frame. */
export function nextFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

/** Scrolls the page so that `element`'s top stands `past` px above the shell's bottom edge. */
export async function scrollUnderShell(
  canvasElement: HTMLElement,
  element: Element,
  past: number,
): Promise<void> {
  const scroller = pageScroller(canvasElement)
  scroller.scrollTop +=
    element.getBoundingClientRect().top - bar(canvasElement).getBoundingClientRect().bottom + past
  await nextFrames()
}

/** The header stands right below the shell's bottom edge, never under it. */
export async function expectBelowShell(canvasElement: HTMLElement, head: Element): Promise<void> {
  const edge = bar(canvasElement).getBoundingClientRect().bottom
  await waitFor(async () => {
    await expect(Math.abs(head.getBoundingClientRect().top - edge)).toBeLessThanOrEqual(1)
  })
}

/**
 * Scrolls a region sideways by `by` px toward its end (to the left in right to left) and checks
 * that `first` (a first-column cell) stays where it was while `other` moves.
 */
export async function expectFirstColumnStays(
  region: HTMLElement,
  first: Element,
  other: Element,
  by = 200,
): Promise<void> {
  const rtl = getComputedStyle(region).direction === 'rtl'
  const firstBefore = first.getBoundingClientRect().left
  const otherBefore = other.getBoundingClientRect().left
  region.scrollLeft += rtl ? -by : by
  await nextFrames()
  await expect(Math.abs(first.getBoundingClientRect().left - firstBefore)).toBeLessThanOrEqual(1)
  await expect(Math.abs(other.getBoundingClientRect().left - otherBefore)).toBeGreaterThan(50)
}
