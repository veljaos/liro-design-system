import {
  ArrowLeft,
  ArrowRight,
  Circle,
  CircleCheck,
  ListTree,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '../components/button'
import { Drawer } from '../components/dialog'
import { EmptyState } from '../components/empty-state'
import { ProgressBar, Skeleton } from '../components/progress'
import { usePhone } from '../components/use-phone'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  courseProgress,
  findLesson,
  moduleProgress,
  type CourseLesson,
  type CourseModule,
  type LessonState,
} from './course-logic'

/*
 * CoursePage (BUILD-PLAN P5.12): a course to work through — its outline, the lesson being shown,
 * the progress to completion, the way to the previous and the next lesson. The modules, the
 * lessons, their states and the lesson's content are the application's; quizzes are the general
 * Questionnaire (P5.1) in the lesson's slot, their outcome a QuizResult; the certificate at
 * completion is a PrintCertificate (P5.15) passed as its preview.
 * - Header: the course's title (h1) and a line under it at the start; the progress at the end
 *   on desktop, under the title on phones: "7 of 12 lessons" (`format.number`) over a ProgressBar.
 * - Outline (desktop: a 300px card at the start that scrolls with the page — a course's outline is
 *   taller than the view, so a sticky one hid its last lessons or needed a scroll of its own, and
 *   the pager at the lesson's end leads on; phones: a Drawer from
 *   the start side, opened by "Course outline" above the lesson — the content first): the
 *   modules (h3, "3 of 4 done"), each a list of lessons. A lesson's state in words, with an icon:
 *   done (CircleCheck in success, "Done" in its line), to do (Circle), locked (Lock, "Locked:
 *   <the application's reason>" in its line; not a link). The lesson being shown is the selected
 *   one: surface.selected with the border.selected bar at the start, semibold,
 *   `aria-current="page"` — neutral, never blue (D17). Every lesson row is square and full width,
 *   flush with the card's (or the drawer's) edges, and the card ends at its last row: no empty
 *   strip under it (P5.28 item 14, the owner's review).
 * - Lesson (h2, its detail line), the application's content, then "Mark as done" (the page's
 *   one primary action) while the lesson is to do, or "Lesson completed" once it is done; then
 *   the pager: the previous lesson at the start, the next at the end, each a link with its
 *   title.
 * - Completion (`completion`): a block above the lesson — "Course completed", the application's
 *   line, "Download certificate", and the certificate's preview, at most 640px wide (the sheet
 *   scaled to it).
 * - Loading: skeletons in the outline and the lesson (`aria-busy`); a course without lessons:
 *   an EmptyState.
 */

/** The previous or the next lesson, for the pager. */
export interface CourseLessonLink {
  title: string
  href: string
}

/** The block shown when the course is completed. */
export interface CourseCompletion {
  /** Default: `messages['course.completed']`. */
  title?: string
  /** A line from the application ("Completed on 10.10.2026. with 9 of 10 correct answers."). */
  description?: ReactNode
  /** Downloads the certificate (the application makes the file). */
  onDownload?: () => void
  /** The certificate is being prepared: the button waits. */
  downloading?: boolean
  /** The certificate's preview: a PrintCertificate (P5.15). */
  certificate?: ReactNode
}

export interface CoursePageProps {
  /** The course's name: the h1. */
  title: string
  /** A line under it ("Required for site workers · about 2 hours"). */
  subtitle?: string
  modules: readonly CourseModule[]
  /** The lesson being shown (its key); its content is `children`. */
  currentKey?: string
  /** The lesson's content (text, a video, a Questionnaire, a QuizResult). */
  children?: ReactNode
  previous?: CourseLessonLink
  next?: CourseLessonLink
  /** Marks the lesson being shown as done; "Mark as done" shows while it is to do. */
  onMarkDone?: () => void
  /** The application is saving it: the button waits. */
  markingDone?: boolean
  /** The course is completed: the certificate. */
  completion?: CourseCompletion
  /** The course is loading: skeletons. */
  loading?: boolean
  /** The phone's outline drawer is open when the page first shows. */
  defaultOutlineOpen?: boolean
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

const STATE_ICON: Record<LessonState, LucideIcon> = {
  done: CircleCheck,
  todo: Circle,
  locked: Lock,
}

/** The outline's inset: 12px in the desktop card, 16px in the phone's drawer (its own inset). */
const INSET = { card: 'px-3', drawer: 'px-4' } as const

function LessonItem({
  lesson,
  current,
  onFollow,
  inset,
}: {
  lesson: CourseLesson
  current: boolean
  onFollow?: (() => void) | undefined
  inset: keyof typeof INSET
}) {
  const { messages, linkComponent: Link } = useLiro()
  const Icon = STATE_ICON[lesson.state]
  const state =
    lesson.state === 'done'
      ? messages['course.done']
      : lesson.state === 'locked'
        ? lesson.lockedReason === undefined
          ? messages['course.locked']
          : messages['course.lockedReason'](lesson.lockedReason)
        : undefined
  const line = [lesson.detail, state].filter((part) => part !== undefined).join(' · ')
  const body = (
    <>
      <Icon
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-4 shrink-0',
          lesson.state === 'done' ? 'text-status-success-fg' : 'text-tertiary',
        )}
      />
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-sm', current && 'font-semibold', TEXT_DIRECTION)}>
          {lesson.title}
        </span>
        {line !== '' && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{line}</span>
        )}
      </span>
    </>
  )
  // Square and full width: the selected row's background and bar meet the container's edges.
  const box = cn(
    'flex min-h-10 items-start gap-2 border-0 border-s-2 border-solid py-2',
    INSET[inset],
  )
  if (lesson.state === 'locked') {
    return (
      <div data-state="locked" className={cn(box, 'border-transparent text-secondary')}>
        {body}
      </div>
    )
  }
  return (
    <Link
      href={lesson.href}
      data-state={lesson.state}
      {...(current ? { 'aria-current': 'page' } : {})}
      {...(onFollow === undefined ? {} : { onClick: onFollow })}
      className={cn(
        box,
        'font-sans text-primary no-underline visited:text-primary hover:text-primary active:text-primary',
        current
          ? 'border-selected bg-surface-selected'
          : 'border-transparent hover:bg-surface-hover',
        FOCUS_RING,
        '-outline-offset-2',
      )}
    >
      {body}
    </Link>
  )
}

function Outline({
  modules,
  currentKey,
  onFollow,
  inset,
}: {
  modules: readonly CourseModule[]
  currentKey: string | undefined
  onFollow?: (() => void) | undefined
  inset: keyof typeof INSET
}) {
  const { messages, format } = useLiro()
  return (
    <ol
      data-slot="course-outline"
      // In the drawer the rows reach its edges: out of its 16px inset.
      className={cn('m-0 flex list-none flex-col gap-4 p-0', inset === 'drawer' && '-mx-4')}
    >
      {modules.map((module) => {
        const count = moduleProgress(module)
        return (
          <li key={module.key} className="flex flex-col gap-1">
            <div className={cn('flex flex-col', INSET[inset])}>
              <h3 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                {module.title}
              </h3>
              <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
                {messages['course.moduleProgress'](
                  format.number(String(count.done)),
                  format.number(String(count.total)),
                )}
              </span>
            </div>
            <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
              {module.lessons.map((lesson) => (
                <li key={lesson.key}>
                  <LessonItem
                    lesson={lesson}
                    current={lesson.key === currentKey}
                    onFollow={onFollow}
                    inset={inset}
                  />
                </li>
              ))}
            </ol>
          </li>
        )
      })}
    </ol>
  )
}

function Progress({ modules }: { modules: readonly CourseModule[] }) {
  const { messages, format } = useLiro()
  const count = courseProgress(modules)
  return (
    <div data-slot="course-progress" className="flex w-full max-w-80 flex-col gap-1.5">
      <span className={cn('text-sm text-secondary tabular-nums', TEXT_DIRECTION)}>
        {messages['course.progress'](
          count.done,
          count.total,
          format.number(String(count.done)),
          format.number(String(count.total)),
        )}
      </span>
      <ProgressBar
        label={messages['course.progressLabel']}
        value={count.done}
        max={Math.max(count.total, 1)}
      />
    </div>
  )
}

function Pager({
  previous,
  next,
}: {
  previous?: CourseLessonLink | undefined
  next?: CourseLessonLink | undefined
}) {
  const { messages, linkComponent: Link } = useLiro()
  if (previous === undefined && next === undefined) return null
  const link = (target: CourseLessonLink, side: 'previous' | 'next') => {
    const Arrow = side === 'previous' ? ArrowLeft : ArrowRight
    return (
      <Link
        href={target.href}
        rel={side === 'previous' ? 'prev' : 'next'}
        className={cn(
          'flex min-w-0 flex-1 items-start gap-2 rounded-md border border-solid border-default px-3 py-2.5 font-sans no-underline hover:bg-surface-hover sm:max-w-80',
          side === 'next' && 'ms-auto flex-row-reverse text-end',
          FOCUS_RING,
        )}
      >
        <Arrow
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-secondary rtl:-scale-x-100"
        />
        <span className="flex min-w-0 flex-col">
          <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
            {side === 'previous' ? messages['course.previous'] : messages['course.next']}
          </span>
          <span className={cn('text-sm font-medium text-link', TEXT_ISOLATE)}>{target.title}</span>
        </span>
      </Link>
    )
  }
  return (
    <nav
      aria-label={messages['course.pager']}
      data-slot="course-pager"
      className="flex gap-3 border-0 border-t border-solid border-default pt-4"
    >
      {previous !== undefined && link(previous, 'previous')}
      {next !== undefined && link(next, 'next')}
    </nav>
  )
}

function Completion({ completion }: { completion: CourseCompletion }) {
  const { messages } = useLiro()
  return (
    <section
      data-slot="course-completion"
      aria-label={completion.title ?? messages['course.completed']}
      className="flex flex-col gap-4 rounded-lg border border-solid border-default bg-surface-raised p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <CircleCheck
            aria-hidden="true"
            className="mt-0.5 size-6 shrink-0 text-status-success-fg"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>
              {completion.title ?? messages['course.completed']}
            </h2>
            {completion.description !== undefined && (
              <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
                {completion.description}
              </p>
            )}
          </div>
        </div>
        {completion.onDownload !== undefined && (
          <Button
            intent="download"
            emphasis="primary"
            label={messages['course.downloadCertificate']}
            disabled={completion.downloading === true}
            onClick={completion.onDownload}
          />
        )}
      </div>
      {completion.certificate !== undefined && (
        <figure
          aria-label={messages['course.certificatePreview']}
          className="m-0 w-full max-w-160 overflow-hidden rounded-md border border-solid border-default"
        >
          {completion.certificate}
        </figure>
      )}
    </section>
  )
}

function LessonSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function OutlineSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-3 pb-3">
      <Skeleton className="h-4 w-1/2" />
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} className="h-8 w-full" />
      ))}
    </div>
  )
}

/** A course: outline, the lesson, progress, previous and next, "Mark as done", the certificate. */
export function CoursePage(props: CoursePageProps) {
  const { messages } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [outlineOpen, setOutlineOpen] = useState(props.defaultOutlineOpen === true)
  const loading = props.loading === true
  const empty = !loading && props.modules.length === 0
  const lesson = findLesson(props.modules, props.currentKey)

  const lessonArea = loading ? (
    <LessonSkeleton />
  ) : empty ? (
    <EmptyState
      title={messages['course.empty']}
      description={messages['course.emptyDescription']}
    />
  ) : (
    <article data-slot="course-lesson" className="flex min-w-0 flex-col gap-4">
      {lesson !== undefined && (
        <div className="flex flex-col gap-0.5">
          <h2 className={cn('m-0 text-h3 text-primary', TEXT_DIRECTION)}>{lesson.title}</h2>
          {lesson.detail !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{lesson.detail}</p>
          )}
        </div>
      )}
      <div className={cn('flex min-w-0 flex-col gap-4 text-md text-primary', TEXT_DIRECTION)}>
        {props.children}
      </div>
      {lesson?.state === 'done' && (
        <p
          data-slot="course-lesson-done"
          className="m-0 flex items-center gap-2 text-sm font-medium text-status-success-fg"
        >
          <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
          <span className={TEXT_DIRECTION}>{messages['course.lessonDone']}</span>
        </p>
      )}
      {lesson?.state === 'todo' && props.onMarkDone !== undefined && (
        <div className="flex justify-end">
          <Button
            intent="confirm"
            label={messages['course.markDone']}
            disabled={props.markingDone === true}
            onClick={props.onMarkDone}
          />
        </div>
      )}
      <Pager previous={props.previous} next={props.next} />
    </article>
  )

  const header = (
    <header
      className={cn('flex gap-4', phone ? 'flex-col' : 'flex-wrap items-end justify-between')}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>{props.title}</h1>
        {props.subtitle !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.subtitle}</p>
        )}
      </div>
      {!empty &&
        (loading ? (
          <Skeleton className="h-9 w-full max-w-80" />
        ) : (
          <Progress modules={props.modules} />
        ))}
    </header>
  )

  return (
    <div
      data-slot="course-page"
      aria-busy={loading || undefined}
      className={cn(
        'box-border flex w-full min-w-0 flex-col gap-6 font-sans text-primary',
        phone ? 'p-4' : 'p-6',
      )}
    >
      {header}
      {props.completion !== undefined && !loading && <Completion completion={props.completion} />}
      {phone ? (
        <>
          {!empty && (
            <div>
              <Drawer
                title={messages['course.outline']}
                open={outlineOpen}
                onOpenChange={setOutlineOpen}
                trigger={
                  <Button family="neutral" icon={ListTree} label={messages['course.outline']} />
                }
              >
                {loading ? (
                  <OutlineSkeleton />
                ) : (
                  <nav aria-label={messages['course.outline']}>
                    <Outline
                      modules={props.modules}
                      currentKey={props.currentKey}
                      inset="drawer"
                      onFollow={() => {
                        setOutlineOpen(false)
                      }}
                    />
                  </nav>
                )}
              </Drawer>
            </div>
          )}
          {lessonArea}
        </>
      ) : (
        <div className={cn('flex items-start gap-6', empty && 'flex-col')}>
          {!empty && (
            <nav
              aria-label={messages['course.outline']}
              // No padding under the last row (P5.28 item 14); the card clips the square rows.
              className="box-border flex w-75 shrink-0 flex-col gap-3 overflow-hidden rounded-lg border border-solid border-default bg-surface-raised pt-3"
            >
              <h2 className={cn('m-0 px-3 text-sm font-semibold text-secondary', TEXT_DIRECTION)}>
                {messages['course.outline']}
              </h2>
              {loading ? (
                <OutlineSkeleton />
              ) : (
                <Outline modules={props.modules} currentKey={props.currentKey} inset="card" />
              )}
            </nav>
          )}
          <div className="flex min-w-0 flex-1 flex-col">{lessonArea}</div>
        </div>
      )}
    </div>
  )
}
