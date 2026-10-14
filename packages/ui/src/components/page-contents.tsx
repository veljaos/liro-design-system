import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { currentEntry, type ContentsEntry } from './help-logic'
import { usePhone } from './use-phone'

/*
 * PageContents (BUILD-PLAN P5.30 e): "On this page" — the headings of one long reading page (a
 * help article, a policy, a guide) as links, the current one marked while the reader scrolls.
 * For one page's headings; a document's structure to browse is TreeView, a legal act's is
 * LegalContents, and a detail page's sections are the SectionBar.
 * - A `nav` named by its title ("On this page", or the application's `title`; xs semibold
 *   text.secondary). The entries are links (sm, text.secondary, hover text.primary), a
 *   subsection (level 3) indented 12px; each 4px 12px with a 2px start line in border.subtle.
 *   The current entry is text.primary medium with the line in border.selected and
 *   `aria-current="location"` — neutral, never blue (D17: it is a place, not an action).
 * - A press scrolls to the heading (smoothly, unless the user reduces motion), moves the focus
 *   to it (the heading needs `tabIndex={-1}`; RichText's `headingIds` gives it) and keeps that
 *   entry current until the scroll ends. The headings need a scroll margin under the shell's
 *   sticky top (RichText's `headingIds` gives it: `--liro-shell-top` + 16px), WCAG 2.4.11.
 * - The current entry follows the scroll (`currentEntry`): the last heading whose top has passed
 *   the line just under the shell's sticky top (`--liro-shell-top`).
 * - Desktop: a list in the page's side column, `sticky` under the shell's sticky top if asked.
 *   Phones (`layout="phone"` or the viewport): a disclosure button with the title and a chevron
 *   (`aria-expanded`), closed unless `defaultOpen`; the list opens under it.
 */

export interface PageContentsProps {
  /** The page's headings, in order; their ids are the heading elements' ids. */
  entries: readonly ContentsEntry[]
  /** The title. Default `messages['pageContents.title']` ("On this page"). */
  title?: string
  /** A press on an entry, after the page scrolled to it. */
  onNavigate?: (id: string) => void
  /** Desktop: stays in view under the shell's sticky top while the page scrolls. */
  sticky?: boolean
  /** Phones: the list is open at first. */
  defaultOpen?: boolean
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The shell's sticky height as the element sees it (0 without a shell). */
function shellTop(element: HTMLElement | null): number {
  if (element === null) return 0
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue('--liro-shell-top'))
  return Number.isFinite(value) ? value : 0
}

/** The headings of one long page, to jump to; the current one follows the scroll. */
export function PageContents(props: PageContentsProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const listId = useId()
  const [open, setOpen] = useState(props.defaultOpen === true)
  const [current, setCurrent] = useState(props.entries[0]?.id)
  const nav = useRef<HTMLElement>(null)
  const pressed = useRef<string | null>(null)
  const recompute = useRef<() => void>(() => undefined)
  const title = props.title ?? messages['pageContents.title']

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (pressed.current !== null) return
        const line = shellTop(nav.current) + 24
        const tops = props.entries.map(
          (entry) =>
            document.getElementById(entry.id)?.getBoundingClientRect().top ??
            Number.POSITIVE_INFINITY,
        )
        const index = currentEntry(tops, line)
        setCurrent(index < 0 ? undefined : props.entries[index]?.id)
      })
    }
    recompute.current = update
    update()
    // Every scroll, in the capture phase: the scrolling element may be the window or a container
    // (a phone frame's page); an element's scroll events do not bubble.
    document.addEventListener('scroll', update, { capture: true, passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', update, { capture: true })
      window.removeEventListener('resize', update)
    }
  }, [props.entries])

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
    props.onNavigate?.(id)
  }

  const list = (
    <ul id={listId} className="m-0 flex list-none flex-col p-0">
      {props.entries.map((entry) => {
        const active = entry.id === current
        return (
          <li key={entry.id} className="flex min-w-0">
            <a
              href={`#${entry.id}`}
              onClick={(event) => {
                go(event, entry.id)
              }}
              {...(active ? { 'aria-current': 'location' as const } : {})}
              className={cn(
                'box-border flex min-h-7 min-w-0 flex-1 items-center border-0 border-s-2 border-solid py-1 pe-2 font-sans text-sm break-words no-underline',
                entry.level === 3 ? 'ps-6' : 'ps-3',
                active
                  ? 'border-selected font-medium text-primary visited:text-primary hover:text-primary'
                  : 'border-subtle text-secondary visited:text-secondary hover:text-primary',
                FOCUS_RING,
                '-outline-offset-2',
                TEXT_DIRECTION,
              )}
            >
              {entry.label}
            </a>
          </li>
        )
      })}
    </ul>
  )

  if (phone) {
    return (
      <nav
        ref={nav}
        aria-label={title}
        data-slot="page-contents"
        className={cn(
          'flex min-w-0 flex-col rounded-md border border-solid border-default bg-surface-raised font-sans',
          props.className,
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          {...(open ? { 'aria-controls': listId } : {})}
          onClick={() => {
            setOpen((value) => !value)
          }}
          className={cn(
            BUTTON_RESET,
            FOCUS_RING,
            '-outline-offset-2',
            'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-sm font-medium text-primary',
          )}
        >
          <span className={TEXT_DIRECTION}>{title}</span>
          <ChevronDown aria-hidden="true" className={cn('size-4 shrink-0', open && 'rotate-180')} />
        </button>
        {open && <div className="px-3 pb-3">{list}</div>}
      </nav>
    )
  }

  return (
    <nav
      ref={nav}
      aria-label={title}
      data-slot="page-contents"
      className={cn(
        'flex min-w-0 flex-col gap-2 font-sans',
        props.sticky === true && 'sticky top-[calc(var(--liro-shell-top,0px)+16px)]',
        props.className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('text-xs font-semibold text-secondary', TEXT_DIRECTION)}
      >
        {title}
      </span>
      {list}
    </nav>
  )
}
