import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * SectionBar (P4.4, the owner's values, docs/decisions.md "Detail and record form pages"): for
 * long detail pages, a row of the page's section names that scrolls to each section and shows
 * the current one. Forms keep their tabs.
 * - Like the module tabs: a 40px row of links, start-aligned, 13px, 16px padding; the current
 *   section with the 2px blue line (border.brand); surface.page with a 1px border.default line
 *   under the row.
 * - Sticky under the AppShell's sticky top (`--liro-shell-top`), above the content.
 * - A `nav` landmark named by `messages['page.sections']`; the current link `aria-current`
 *   ("location"). A press scrolls to the section (smoothly, unless the user reduces motion) and
 *   moves the focus there; the current section follows the scroll (`currentSection`), except
 *   that a pressed section stays current until its scroll ends.
 * - The sections keep a scroll margin of the shell and the bar (SECTION_SCROLL_MARGIN), so a
 *   section reached by the bar or the keyboard is never hidden under them (WCAG 2.4.11).
 */

/** One section the bar names: its element's id and its name. */
export interface BarSection {
  id: string
  label: string
}

export interface SectionBarProps {
  sections: readonly BarSection[]
  className?: string
}

/** The scroll margin a section needs under the shell's sticky top and the 40px bar (16px air). */
export const SECTION_SCROLL_MARGIN = 'scroll-mt-[calc(var(--liro-shell-top,0px)+56px)]'

/**
 * The current section: the last one whose top has passed `line` (the bar's lower edge), or the
 * first while none has. `tops` are the sections' tops in the viewport, in page order.
 */
export function currentSection(tops: readonly number[], line: number): number {
  let current = 0
  tops.forEach((top, index) => {
    if (top <= line) current = index
  })
  return current
}

/** The page's sections, to jump between on a long page. */
export function SectionBar({ sections, className }: SectionBarProps) {
  const { messages } = useLiro()
  const [current, setCurrent] = useState(sections[0]?.id)
  const bar = useRef<HTMLElement>(null)
  // After a press, the pressed section stays current until its scroll ends, so the bar does not
  // run through the sections it passes on the way.
  const pressed = useRef<string | null>(null)
  const recompute = useRef<() => void>(() => undefined)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (pressed.current !== null) return
        const line = (bar.current?.getBoundingClientRect().bottom ?? 0) + 1
        const tops = sections.map(
          (section) =>
            document.getElementById(section.id)?.getBoundingClientRect().top ??
            Number.POSITIVE_INFINITY,
        )
        setCurrent(sections[currentSection(tops, line)]?.id)
      })
    }
    recompute.current = update
    update()
    // Every scroll on the page, in the capture phase: the scrolling element may be the window or
    // a container of the application (scroll events of an element do not bubble).
    document.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    }
  }, [sections])

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (target === null) return
    event.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
    setCurrent(id)
    pressed.current = id
    let timer = 0
    const release = () => {
      window.clearTimeout(timer)
      document.removeEventListener('scrollend', release, { capture: true })
      if (pressed.current !== id) return
      pressed.current = null
      recompute.current()
    }
    document.addEventListener('scrollend', release, { capture: true })
    // Without scrollend (an older engine), or when nothing needed to scroll.
    timer = window.setTimeout(release, 1000)
  }

  return (
    <nav
      ref={bar}
      data-slot="section-bar"
      aria-label={messages['page.sections']}
      className={cn(
        'sticky top-[var(--liro-shell-top,0px)] z-(--liro-layer-sticky) overflow-x-auto border-0 border-b border-solid border-default bg-surface-page [scrollbar-width:none]',
        className,
      )}
    >
      <ul className="m-0 flex h-10 list-none p-0">
        {sections.map((section) => {
          const active = section.id === current
          return (
            <li key={section.id} className="flex">
              <a
                href={`#${section.id}`}
                onClick={(event) => {
                  go(event, section.id)
                }}
                {...(active ? { 'aria-current': 'location' as const } : {})}
                className={cn(
                  '-mb-px flex items-center rounded-t-md border-0 border-b-2 border-solid border-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary no-underline hover:border-default hover:bg-surface-hover',
                  active && 'border-brand hover:border-brand',
                  FOCUS_RING,
                  '-outline-offset-2',
                  TEXT_DIRECTION,
                )}
              >
                {section.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
