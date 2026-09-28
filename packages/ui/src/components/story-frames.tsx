import type { ReactNode } from 'react'
import { LiroProvider, useLiro } from '../provider/liro-provider'

/*
 * Frames for overlay stories. Not part of the package: nothing in src/index.ts imports this file.
 * Inline styles only: Storybook compiles Tailwind classes from *.stories.tsx files alone.
 *
 * Overlays render into their provider's container with fixed positions, so a story cannot narrow
 * them with a wrapper. A nested provider inside a transformed frame keeps them inside it: an
 * element with a transform is the containing block of its fixed descendants.
 */

/** A nested provider in the story's theme; locale and direction may be given. */
export function StoryProvider({
  locale,
  direction,
  children,
}: {
  locale?: string
  direction?: 'ltr' | 'rtl'
  children: ReactNode
}) {
  const liro = useLiro()
  // With its own locale, the frame takes that locale's direction unless one is given.
  const dir = direction ?? (locale === undefined ? liro.direction : undefined)
  return (
    <LiroProvider
      locale={locale ?? liro.locale}
      {...(dir === undefined ? {} : { direction: dir })}
      colorScheme={liro.colorScheme}
      today={liro.today}
    >
      {children}
    </LiroProvider>
  )
}

/** A phone-sized frame (390 × 844px) whose overlays stay inside it. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        transform: 'translateZ(0)',
        width: 390,
        height: 844,
        maxWidth: '100%',
        overflow: 'hidden',
        outline: '1px solid var(--liro-border-default)',
      }}
    >
      <StoryProvider>{children}</StoryProvider>
    </div>
  )
}
