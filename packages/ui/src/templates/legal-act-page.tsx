import { Bell, BellOff, Bookmark, BookmarkCheck, Copy, GitCompare, PanelRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ActionGroup, type ActionItem } from '../components/actions'
import { Button } from '../components/button'
import type { LegalAct } from '../components/legal-model'
import {
  LEGAL_PANEL_KEYS,
  LegalArticleSummary,
  useLegalPanels,
  useVersionRange,
  type LegalPanelsOptions,
} from '../components/legal-panels'
import { versionsNewestFirst, shownVersion, versionAsOf } from '../components/legal-panels-logic'
import { Skeleton } from '../components/progress'
import { SelectField } from '../components/select-field'
import { SidePanels } from '../components/side-panels'
import { StatusBadge } from '../components/status-badge'
import { usePhone } from '../components/use-phone'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { useLangAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { BackButton, type PageBack } from './page-header'

/*
 * LegalActPage (BUILD-PLAN P5.27 a, c, f): one legal act — a law, a by-law, a company's internal
 * rulebook — read on its own page, in the invoice's DocumentPage layout: the act at the start, the
 * side panels at the end (300px from lg, 75em) with "Hide panels" / "Show panels", the same
 * header, padding and breakpoints. A thin template on DocumentPage's parts (BackButton, SidePanels,
 * the panel toggle, the grid), not DocumentPage itself: an act has no lines, totals or
 * counterparty, its header carries the gazette and the version, and on phones its panels are a
 * sheet, not a stack under a long text.
 * - **Header:** back; the title (h1, in the act's language: `lang` from `act.lang`, D15) and its
 *   status (StatusBadge from the act's LegalStatus — never blue); a line "Law · Illustrative
 *   National Assembly" (type and issuer); the gazette line — `gazetteName` and every reference,
 *   the original first, each a link when it has an address; "Version as of 11.10.2026." with the
 *   version picker. **The picker is a SelectField over `versions`** (newest first, each named by
 *   its days, "(current)" after the one in force), not a date field: the versions are the
 *   application's discrete list, so a choice names exactly one text and nothing has to be
 *   resolved; "as of" is `asOf`, or today for the current version and an older version's first
 *   day. The banner slot (`banner`) stands above everything ("Illustrative", a repeal notice).
 * - **Actions** (ActionGroup, at the end; narrow rows move the first ones into "More"): Compare
 *   versions, Copy citation, Print / PDF, Watch for changes, Bookmark — each shown when its
 *   callback is given, words from messages. A reading page has no main action, so every one is
 *   secondary (D13 allows none primary); Bookmark, the most used, is last and stays in the row.
 *   Watch and Bookmark show their state in the label and icon: "Stop watching" (BellOff) while
 *   watching, "Remove bookmark" (BookmarkCheck) while bookmarked; the states are the
 *   application's (`watching`, `bookmarked`).
 * - **Body:** one card — the `toolbar` (the contents button and the search in the act, from the
 *   text components) on top with a line under it, then the `text`. `loading` shows skeleton
 *   lines in the card (`aria-busy`).
 * - **Panels** (`useLegalPanels`): Versions, History of changes, Legal hierarchy, References,
 *   Court practice and opinions, My notes and bookmarks. With `selectedArticleId` they narrow to
 *   that article and `LegalArticleSummary` stands above them with "Back to the whole act"
 *   (`onArticleClear`). Open panels: `panelsOpen` (controlled) or `defaultPanelsOpen` (default
 *   all); the whole column: `panelsHidden` or `defaultPanelsHidden`.
 * - **Below 75em** the panels stand under the act (as DocumentPage); **phones (below 48em)**: the
 *   act full width, and "Details" (PanelRight) in the header opens the panels in a full-screen
 *   sheet (the P4.9d sheet of the company switcher, the specification, LookupDialog's phone
 *   form): the title "Details", the close button, the summary and the panels scrolling under it.
 *   `panelSheetOpen` / `defaultPanelSheetOpen` / `onPanelSheetOpenChange`. Article actions and
 *   the contents drawer are the text components'.
 */

export interface LegalActPageProps extends Omit<LegalPanelsOptions, 'act'> {
  /** The act and the version shown (`act.versionId`). */
  act: LegalAct
  /** The gazette's name before its numbers ("Illustrative Gazette"), from the application. */
  gazetteName?: string
  back?: PageBack
  /** Above the whole page: an "Illustrative" note, a repeal notice. */
  banner?: ReactNode
  /** The day of "Version as of …" (YYYY-MM-DD); default today, or an older version's first day. */
  asOf?: string
  /** "Compare versions" in the header. */
  onCompareVersions?: () => void
  /** "Copy citation": the application writes the citation and copies it. */
  onCopyCitation?: () => void
  /** "Print / PDF": the application opens its print route (PrintLegalAct). */
  onPrint?: () => void
  /** Whether the user watches the act for changes; "Watch for changes" shows with `onWatchChange`. */
  watching?: boolean
  onWatchChange?: (watching: boolean) => void
  /** Whether the act is bookmarked; "Bookmark" shows with `onBookmarkChange`. */
  bookmarked?: boolean
  onBookmarkChange?: (bookmarked: boolean) => void
  /** On top of the text's card: the contents button and the search in the act. */
  toolbar?: ReactNode
  /** The act's text (LegalText), from the application. */
  text: ReactNode
  /** Skeletons in place of the text. */
  loading?: boolean
  /** "Back to the whole act" in the narrowed panel. */
  onArticleClear?: () => void
  /** The keys of the open panels (`LEGAL_PANEL_KEYS`), controlled; with their change. */
  panelsOpen?: readonly string[]
  /** The panels open at first, uncontrolled. Default: every panel. */
  defaultPanelsOpen?: readonly string[]
  onPanelsOpenChange?: (open: string[]) => void
  /** The whole side column hidden (from 75em), controlled; with its change. */
  panelsHidden?: boolean
  /** Hidden at first, uncontrolled. Default false. */
  defaultPanelsHidden?: boolean
  onPanelsHiddenChange?: (hidden: boolean) => void
  /** Phones: the panels' sheet open, controlled; its first state, uncontrolled; its change. */
  panelSheetOpen?: boolean
  defaultPanelSheetOpen?: boolean
  onPanelSheetOpenChange?: (open: boolean) => void
  /**
   * 'desktop', 'narrow' (below 75em: the panels under the act) or 'phone' (the panels in a
   * sheet); default by the viewport.
   */
  layout?: 'desktop' | 'narrow' | 'phone'
  className?: string
}

/** The header's actions, those whose callbacks are given, Bookmark last. */
function useActions(props: LegalActPageProps): ActionItem[] {
  const { messages } = useLiro()
  const actions: ActionItem[] = []
  if (props.onCompareVersions !== undefined) {
    actions.push({
      key: 'compare',
      family: 'neutral',
      icon: GitCompare,
      label: messages['legalPage.compareVersions'],
      onClick: props.onCompareVersions,
    })
  }
  if (props.onCopyCitation !== undefined) {
    actions.push({
      key: 'citation',
      family: 'neutral',
      icon: Copy,
      label: messages['legalPage.copyCitation'],
      onClick: props.onCopyCitation,
    })
  }
  if (props.onPrint !== undefined) {
    actions.push({
      key: 'print',
      intent: 'print',
      emphasis: 'secondary',
      label: messages['legalPage.print'],
      onClick: props.onPrint,
    })
  }
  const onWatch = props.onWatchChange
  if (onWatch !== undefined) {
    const on = props.watching === true
    actions.push({
      key: 'watch',
      family: 'neutral',
      icon: on ? BellOff : Bell,
      label: on ? messages['legalPage.unwatch'] : messages['legalPage.watch'],
      onClick: () => {
        onWatch(!on)
      },
    })
  }
  const onBookmark = props.onBookmarkChange
  if (onBookmark !== undefined) {
    const on = props.bookmarked === true
    actions.push({
      key: 'bookmark',
      family: 'neutral',
      icon: on ? BookmarkCheck : Bookmark,
      label: on ? messages['legalPage.unbookmark'] : messages['legalPage.bookmark'],
      onClick: () => {
        onBookmark(!on)
      },
    })
  }
  return actions
}

function TextSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="mt-3 h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  )
}

/** One legal act: its header, gazette and version, the text, and the side panels. */
export function LegalActPage(props: LegalActPageProps) {
  const { messages, format, today, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const layout = props.layout ?? (viewportPhone ? 'phone' : 'desktop')
  const phone = layout === 'phone'
  const beside = layout === 'desktop'
  const lang = useLangAttribute(props.act.lang)
  const range = useVersionRange()

  const [innerOpen, setInnerOpen] = useState<readonly string[]>(
    props.defaultPanelsOpen ?? LEGAL_PANEL_KEYS,
  )
  const open = props.panelsOpen ?? innerOpen
  const changeOpen = (next: string[]) => {
    setInnerOpen(next)
    props.onPanelsOpenChange?.(next)
  }
  const [innerHidden, setInnerHidden] = useState(props.defaultPanelsHidden === true)
  const hidden = beside && (props.panelsHidden ?? innerHidden)
  const changeHidden = (next: boolean) => {
    setInnerHidden(next)
    props.onPanelsHiddenChange?.(next)
  }
  const [innerSheet, setInnerSheet] = useState(props.defaultPanelSheetOpen === true)
  const sheetOpen = props.panelSheetOpen ?? innerSheet
  const changeSheet = (next: boolean) => {
    setInnerSheet(next)
    props.onPanelSheetOpenChange?.(next)
  }

  const { act } = props
  const panels = useLegalPanels({ ...props, act })
  const version = shownVersion(act)
  const actions = useActions(props)

  const summary =
    props.selectedArticleId === undefined ? null : (
      <LegalArticleSummary
        act={act}
        articleId={props.selectedArticleId}
        {...(props.practice === undefined ? {} : { practice: props.practice })}
        {...(props.onArticleClear === undefined ? {} : { onArticleClear: props.onArticleClear })}
      />
    )
  const panelColumn = (
    <div className="flex min-w-0 flex-col gap-4">
      {summary}
      <SidePanels panels={panels} open={open} onOpenChange={changeOpen} />
    </div>
  )

  const toggle = beside ? (
    // The icon mirrors in right-to-left: the panels stand at the inline end (as DocumentPage).
    <span className="hidden lg:contents rtl:[&_svg]:-scale-x-100">
      <Button
        family="neutral"
        emphasis="menu"
        icon={PanelRight}
        label={hidden ? messages['document.showPanels'] : messages['document.hidePanels']}
        aria-pressed={!hidden}
        onClick={() => {
          changeHidden(!hidden)
        }}
      />
    </span>
  ) : null

  const sheet = phone ? (
    <Sheet open={sheetOpen} onOpenChange={changeSheet}>
      <span className="contents rtl:[&_svg]:-scale-x-100">
        <SheetTrigger asChild>
          <Button
            family="neutral"
            emphasis="secondary"
            icon={PanelRight}
            label={messages['legalPage.details']}
          />
        </SheetTrigger>
      </span>
      <SheetContent
        side="full"
        aria-describedby={undefined}
        className="overflow-hidden pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]"
      >
        <DialogHeader className="shrink-0 items-start border-0 border-b border-solid border-default pt-[max(16px,env(safe-area-inset-top))]">
          <DialogTitle>{messages['legalPage.details']}</DialogTitle>
          <DialogCloseButton label={messages['dialog.close']} />
        </DialogHeader>
        <div
          data-slot="legal-panel-sheet"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-page p-4"
        >
          {panelColumn}
        </div>
      </SheetContent>
    </Sheet>
  ) : null

  const hasActions = actions.length > 0 || toggle !== null || sheet !== null
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {props.back !== undefined && <BackButton back={props.back} />}
          <h1 {...lang} className={cn('m-0 min-w-0 text-h1 text-primary', TEXT_DIRECTION)}>
            {act.title}
          </h1>
          <StatusBadge label={act.status.label} tone={act.status.tone} />
        </div>
        <p
          className={cn(
            'm-0 text-sm text-secondary',
            props.back !== undefined && 'ms-10',
            TEXT_DIRECTION,
          )}
        >
          {act.type} · {act.issuer}
        </p>
      </div>
      {hasActions && (
        <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
          {toggle}
          {sheet}
          {actions.length > 0 && <ActionGroup actions={actions} />}
        </div>
      )}
    </div>
  )

  const facts = (
    <div
      data-slot="legal-act-facts"
      className={cn('flex flex-col gap-2', props.back !== undefined && !phone && 'ms-10')}
    >
      {act.gazette.length > 0 && (
        <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>
          {props.gazetteName !== undefined && <>{props.gazetteName} </>}
          {act.gazette.map((reference, index) => (
            <span key={reference.id}>
              {index > 0 && ', '}
              {reference.href === undefined ? (
                reference.label
              ) : (
                <Link
                  href={reference.href}
                  // Underlined (a link in a line of text is not told by colour alone) and 24px
                  // high: the numbers stand close together (WCAG 2.5.8).
                  className={cn(
                    'inline-flex min-h-6 items-center rounded-sm text-link underline',
                    FOCUS_RING,
                    // An inline-flex box starts a paragraph of its own: its own direction.
                    TEXT_ISOLATE,
                  )}
                >
                  {reference.label}
                </Link>
              )}
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={cn('m-0 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {messages['legalPage.versionAsOf'](format.date(versionAsOf(version, today, props.asOf)))}
        </p>
        {act.versions.length > 1 && (
          <SelectField
            label={messages['legalPage.version']}
            hideLabel
            className={phone ? 'w-full' : 'w-72'}
            options={versionsNewestFirst(act.versions).map((each) => ({
              value: each.id,
              label: messages['legalPage.versionOption'](range(each), each.to === undefined),
            }))}
            value={act.versionId}
            onChange={(value) => {
              if (value !== '' && value !== act.versionId) props.onVersionChange?.(value)
            }}
          />
        )}
      </div>
    </div>
  )

  const body = (
    <section
      data-slot="legal-act-body"
      aria-label={act.title}
      className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary"
    >
      {props.toolbar !== undefined && props.toolbar !== null && (
        <div
          data-slot="legal-act-toolbar"
          className="border-0 border-b border-solid border-subtle px-4 py-3"
        >
          {props.toolbar}
        </div>
      )}
      {props.loading === true ? (
        <div
          role="status"
          aria-busy="true"
          aria-label={messages['legalPage.loading']}
          className={phone ? 'p-4' : 'p-6'}
        >
          <TextSkeleton />
        </div>
      ) : (
        <div {...lang} data-slot="legal-act-text" className={phone ? 'p-4' : 'p-6'}>
          {props.text}
        </div>
      )}
    </section>
  )

  return (
    <div
      data-slot="legal-act-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <div className="flex flex-col gap-4">
        {props.banner}
        {header}
        {facts}
      </div>
      {phone || hidden ? (
        body
      ) : (
        <div
          className={cn('grid grid-cols-1 gap-6', beside && 'lg:grid-cols-[minmax(0,1fr)_300px]')}
        >
          {body}
          <aside aria-label={messages['document.panels']} className="min-w-0">
            {panelColumn}
          </aside>
        </div>
      )}
    </div>
  )
}
