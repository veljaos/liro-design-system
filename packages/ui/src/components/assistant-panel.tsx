import { Maximize2, Sparkles, SquarePen } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { buttonClassName, BUTTON_SHAPES } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { Tooltip } from './popover'
import { useLiro } from '../provider/liro-provider'
import { AssistantComposer, type AssistantComposerProps } from './assistant-composer'
import { CompactIconButton } from './button'
import { usePhone } from './use-phone'

/*
 * AssistantPanel: an assistant beside every page — a sheet at the end of the
 * screen (440px, full height; on a phone the whole screen), opened from the application's
 * button in AppShell's `agent` slot (`trigger`). The user asks in plain words; the panel shows
 * the conversation and keeps the question box at its bottom.
 * - **Header**: the application's title (the assistant's name), "New conversation" (a 28px pencil,
 *   `onNewConversation`), "Open as a page" (a link to the application's "Ask" page, `pageHref`)
 *   and Close.
 * - **The conversation** (`turns`): each turn is the user's question — on its own surface at the
 *   end side, "You asked" for assistive technology — and the application's answer (an
 *   AssistantAnswer). The list is a log, so a new answer is announced once it is no longer busy.
 *   When it opens or a turn is added, the last turn's question is scrolled to the top of the
 *   view (the answer is read from its start; nothing jumps while it is written).
 * - **Before the first question**: the application's `intro` and its suggested questions as
 *   buttons; a press asks it (`onAsk`).
 * - **The question box** (AssistantComposer, size 'panel') under the conversation, and the
 *   application's `note` under it ("Answers use only the data you may see.").
 * Generic: the assistant's name, the questions and the answers are the application's.
 */

/** One question and its answer in a conversation. */
export interface AssistantTurn {
  id: string
  /** The user's question, as asked. */
  question: ReactNode
  /** The answer: an AssistantAnswer from the application. */
  answer: ReactNode
}

export interface AssistantPanelProps {
  /** The assistant's name: the panel's title ("Liro Assistant"). */
  title: string
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The button that opens it (AppShell's `agent` slot). */
  trigger?: ReactElement
  /** The conversation so far, oldest first. */
  turns: readonly AssistantTurn[]
  /** Shown before the first question: what the assistant can do, from the application. */
  intro?: ReactNode
  /** Questions to start with, before the first question. */
  suggestions?: readonly string[]
  /** Asks a question (typed, suggested or a follow-up the application forwards). */
  onAsk: (question: string) => void
  /** The question box's other props (placeholder, busy, unavailable with its reason, value). */
  composer?: Omit<AssistantComposerProps, 'onAsk' | 'size'>
  /** A line under the question box, from the application. */
  note?: ReactNode
  /** Starts a new conversation: shows the button. */
  onNewConversation?: () => void
  /** The application's "Ask" page: shows "Open as a page". */
  pageHref?: string
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

/** The questions to start with: buttons that ask them. */
export function QuestionList({
  label,
  questions,
  onAsk,
  icon: Icon = Sparkles,
  className,
}: {
  label: ReactNode
  questions: readonly string[]
  onAsk: (question: string) => void
  icon?: typeof Sparkles
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <p id={id} className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}>
        {label}
      </p>
      <ul aria-labelledby={id} className="m-0 flex list-none flex-col gap-1.5 p-0">
        {questions.map((question) => (
          <li key={question} className="flex min-w-0">
            <button
              type="button"
              onClick={() => {
                onAsk(question)
              }}
              className={cn(
                BUTTON_RESET,
                FOCUS_RING,
                'flex min-h-8 min-w-0 cursor-pointer items-start gap-2 rounded-md border border-solid border-default bg-surface-raised px-3 py-1.5 text-start text-sm text-primary hover:bg-surface-hover',
              )}
            >
              <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-secondary" />
              <span dir="auto" className="min-w-0 break-words text-match-parent">
                {question}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The user's question in a conversation: on its own surface at the end side. */
export function AskedQuestion({ children }: { children: ReactNode }) {
  const { messages } = useLiro()
  return (
    <div className="flex min-w-0 justify-end ps-8">
      <p
        data-slot="asked-question"
        className={cn(
          'm-0 min-w-0 rounded-lg bg-surface-sunken px-3 py-2 text-sm break-words text-primary',
          TEXT_DIRECTION,
        )}
      >
        <span className="sr-only">{messages['assistant.youAsked']}: </span>
        {children}
      </p>
    </div>
  )
}

function Conversation(props: AssistantPanelProps) {
  const { messages } = useLiro()
  const body = useRef<HTMLDivElement>(null)
  const count = props.turns.length
  // On opening and on each new turn: the last question at the top of the view, and kept there
  // until the reader scrolls — a font that arrives or a turn above that grows moves the question
  // after the first placing. An answer growing below it moves nothing.
  useLayoutEffect(() => {
    const element = body.current
    if (element === null) return
    let pinned = true
    const pin = () => {
      if (!pinned) return
      const turns = element.querySelectorAll<HTMLElement>('[data-slot="assistant-turn"]')
      const last = turns[turns.length - 1]
      if (last === undefined) return
      element.scrollTop = Math.max(0, last.offsetTop - 16)
    }
    const release = () => {
      pinned = false
    }
    pin()
    const observer = new ResizeObserver(pin)
    observer.observe(element)
    for (const child of element.children) observer.observe(child)
    const reader = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const
    for (const type of reader) element.addEventListener(type, release, { passive: true })
    return () => {
      observer.disconnect()
      for (const type of reader) element.removeEventListener(type, release)
    }
  }, [count])
  return (
    <div
      ref={body}
      data-slot="assistant-conversation"
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
    >
      {count === 0 ? (
        <div className="flex flex-col gap-4 p-4">
          {props.intro !== undefined && (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.intro}</p>
          )}
          {props.suggestions !== undefined && props.suggestions.length > 0 && (
            <QuestionList
              label={messages['assistant.suggested']}
              questions={props.suggestions}
              onAsk={props.onAsk}
            />
          )}
        </div>
      ) : (
        <div
          role="log"
          aria-label={messages['assistant.conversation']}
          className="flex flex-col gap-6 p-4"
        >
          {props.turns.map((turn) => (
            <div key={turn.id} data-slot="assistant-turn" className="flex min-w-0 flex-col gap-3">
              <AskedQuestion>{turn.question}</AskedQuestion>
              {turn.answer}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** An assistant in a sheet at the end of the screen: the conversation and the question box. */
export function AssistantPanel(props: AssistantPanelProps) {
  const { messages, linkComponent: Link } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const change = (next: boolean) => {
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }
  return (
    <Sheet open={open} onOpenChange={change}>
      {props.trigger !== undefined && <SheetTrigger asChild>{props.trigger}</SheetTrigger>}
      <SheetContent
        side={phone ? 'full' : 'end'}
        aria-describedby={undefined}
        data-slot="assistant-panel"
        className={cn(
          'overflow-hidden',
          phone &&
            'pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]',
        )}
      >
        <DialogHeader
          className={cn(
            'shrink-0 gap-2 border-0 border-b border-solid border-default',
            phone && 'pt-[max(16px,env(safe-area-inset-top))]',
          )}
        >
          <DialogTitle className="min-w-0 flex-1">{props.title}</DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            {props.onNewConversation !== undefined && (
              <CompactIconButton
                icon={SquarePen}
                label={messages['assistant.newConversation']}
                onClick={props.onNewConversation}
              />
            )}
            {props.pageHref !== undefined && (
              <Tooltip label={messages['assistant.openPage']}>
                <Link
                  href={props.pageHref}
                  aria-label={messages['assistant.openPage']}
                  className={cn(
                    buttonClassName({ family: 'neutral', emphasis: 'menu', shape: 'compact' }),
                    'no-underline visited:text-family-neutral-fg',
                  )}
                >
                  <Maximize2 aria-hidden="true" className={BUTTON_SHAPES.compact.icon} />
                </Link>
              </Tooltip>
            )}
            <DialogCloseButton label={messages['dialog.close']} />
          </div>
        </DialogHeader>
        <Conversation {...props} />
        <div className="flex shrink-0 flex-col gap-2 border-0 border-t border-solid border-default p-4">
          <AssistantComposer {...props.composer} onAsk={props.onAsk} />
          {props.note !== undefined && (
            <p className={cn('m-0 text-xs text-tertiary', TEXT_DIRECTION)}>{props.note}</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
