import { Bot, CircleAlert, SendHorizontal } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Bubble, BubbleContent } from '../primitives/bubble'
import { Marker, MarkerContent } from '../primitives/marker'
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from '../primitives/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
} from '../primitives/message-scroller'
import { useLiro } from '../provider/liro-provider'
import { AgentMark } from './agent-mark'
import { Button } from './button'
import { groupByDayOf } from './day-groups'
import { EmptyState } from './empty-state'
import { dayHeading } from './day-groups'
import { MentionCombobox, type MentionCandidate } from './mention-combobox'
import { splitMentions, startsRun, type Mention } from './message-logic'
import { PersonAvatar } from './person'
import { Skeleton } from './progress'
import { Spinner } from './spinner'

/*
 * The Message family (P5.1) for comments on a record and task conversations, on the shadcn/ui
 * Bubble, Marker, Message and Message Scroller primitives (owner, P3.6).
 *
 * - **MessageBubble:** one message — the author (PersonAvatar 'sm' and the name, AgentMark after
 *   an agent's name, the Bot square as its avatar), the time (`format.time`, or the application's
 *   text), the text in a Bubble and an optional part under it (`extra`: a questionnaire, files).
 *   **No blue bubbles (D17):** others' messages stand at the start on the raised surface with a
 *   border, the user's own at the end on surface.sunken, without the avatar and name (the word
 *   "You" for assistive technology). Side and surface tell them apart, never colour alone.
 *   A message being sent says so in its footer (a spinner and "Sending…"); a failed one says
 *   "Not sent" in the danger colour with an icon, and Retry.
 * - **MessageList:** the messages oldest first, as a conversation reads, on Message Scroller: it
 *   opens at the latest, keeps the latest in view while the reader is at the end, keeps the
 *   reader's place otherwise, and shows "Jump to latest" (or "2 new messages" when messages
 *   arrived while the reader was away) at the bottom. A day separator (a Marker between lines:
 *   "Today", "Yesterday", the date) starts each day; messages of one author within 5 minutes form
 *   a run under one header (`startsRun`). The list is a `log`, so new messages are announced
 *   politely. Its height is the container's (`className`).
 * - **MessageComposer:** a MentionCombobox (the "@" list of people) and a toolbar: the
 *   application's tools at the start (attach), the hint "Enter sends, Shift+Enter starts a new
 *   line", the Send button at the end (the primary family, light weight: the page keeps its one
 *   filled button). Enter sends, Shift+Enter breaks the line, Enter while choosing a mention
 *   chooses it. `onSend` may return a promise: the text stays as sent (typing waits; the field
 *   keeps its look and the focus) with a spinner until it resolves, and is cleared then; a
 *   rejection keeps it. Disabled with a visible reason.
 *   `attachments` is a slot above the toolbar for the files added to the message.
 * - **MessageThread:** the list and the composer under it, in one column.
 *
 * Which one: MessageThread for a conversation (comments on a record, a task's discussion);
 * ActivityList (P4.9) stays the compact list of the latest comments in a side panel; HistoryList
 * is the record's history.
 */

/** Who wrote a message. */
export interface MessageAuthor {
  /** A stable key for runs of messages; default: the name. */
  id?: string
  name: string
  src?: string
  /** An agent: AgentMark after the name, the Bot square as avatar. */
  agent?: boolean
}

export interface MessageBubbleProps {
  author: MessageAuthor
  /** The user's own message: at the end, on the sunken surface, without avatar and name. */
  own?: boolean
  /** When: an ISO instant in the tenant's offset. Its time is shown (`format.time`). */
  at?: string
  /** The time as the application writes it (instead of `format.time(at)`). */
  time?: ReactNode
  /** The message itself. */
  children: ReactNode
  /** A part inside the bubble under the text: a questionnaire, files. */
  extra?: ReactNode
  /** Being sent, or not sent. */
  status?: 'sending' | 'failed'
  /** Sends a failed message again. */
  onRetry?: () => void
  /** Shows the avatar, the name and the time. Default: true (MessageList hides them inside a run). */
  showAuthor?: boolean
  className?: string
}

function AuthorAvatar({ author }: { author: MessageAuthor }) {
  if (author.agent === true) {
    return (
      <MessageAvatar aria-hidden="true" className="text-primary">
        <Bot className="size-3.5" />
      </MessageAvatar>
    )
  }
  return (
    <MessageAvatar>
      <PersonAvatar
        name={author.name}
        size="sm"
        {...(author.src === undefined ? {} : { src: author.src })}
      />
    </MessageAvatar>
  )
}

/** One message: author, time, the text in a bubble, its state. */
export function MessageBubble({
  author,
  own = false,
  at,
  time,
  children,
  extra,
  status,
  onRetry,
  showAuthor = true,
  className,
}: MessageBubbleProps) {
  const { messages, format } = useLiro()
  const shownTime = time ?? (at === undefined ? undefined : format.time(at))
  const timeElement =
    shownTime === undefined ? null : (
      <time
        {...(at === undefined ? {} : { dateTime: at })}
        dir="ltr"
        className="text-xs text-tertiary tabular-nums"
      >
        {shownTime}
      </time>
    )
  const name = own ? messages['message.you'] : author.name
  return (
    <Message align={own ? 'end' : 'start'} data-own={own || undefined} className={className}>
      {!own &&
        (showAuthor ? (
          <AuthorAvatar author={author} />
        ) : (
          <span aria-hidden="true" className="w-6.5 shrink-0" />
        ))}
      <MessageContent>
        {showAuthor ? (
          <MessageHeader>
            {own ? (
              <span className="sr-only">{name}</span>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                  {name}
                </span>
                {author.agent === true && <AgentMark />}
              </span>
            )}
            {timeElement}
          </MessageHeader>
        ) : (
          <span className="sr-only">{name}</span>
        )}
        <Bubble
          surface={own ? 'sunken' : 'raised'}
          align={own ? 'end' : 'start'}
          className={extra === undefined ? undefined : 'w-full max-w-xl'}
        >
          <BubbleContent className={extra === undefined ? undefined : 'w-full'}>
            <div className="whitespace-pre-wrap">{children}</div>
            {extra !== undefined && <div className="mt-3">{extra}</div>}
          </BubbleContent>
        </Bubble>
        {status === 'sending' && (
          <MessageFooter>
            <Spinner size="sm">
              <span className="text-xs text-secondary">{messages['message.sending']}</span>
            </Spinner>
          </MessageFooter>
        )}
        {status === 'failed' && (
          <MessageFooter>
            <span role="alert" className="inline-flex items-center gap-1 text-status-danger-fg">
              <CircleAlert aria-hidden="true" className="size-3 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['message.failed']}</span>
            </span>
            {onRetry !== undefined && (
              <button
                type="button"
                onClick={onRetry}
                className="min-h-6 cursor-pointer rounded-sm border-0 bg-transparent p-0 font-sans text-xs text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {messages['message.retry']}
              </button>
            )}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  )
}

export interface MentionTextProps {
  /** The message's text with "@Name" tokens. */
  text: string
  /** The mentions in it (from the composer's report). */
  mentions: readonly Mention[]
}

/** A message's text with its mentions drawn as names (semibold), not as plain "@" text. */
export function MentionText({ text, mentions }: MentionTextProps) {
  return (
    <>
      {splitMentions(text, mentions).map((part, index) =>
        part.kind === 'text' ? (
          <span key={index}>{part.text}</span>
        ) : (
          <span key={index} data-mention={part.mention.id} className="font-semibold">
            @{part.mention.name}
          </span>
        ),
      )}
    </>
  )
}

/** One message of a list. */
export interface ThreadMessage {
  id: string
  author: MessageAuthor
  /** The user's own message. */
  own?: boolean
  /** When: an ISO instant in the tenant's offset. */
  at: string
  /** The text; its mentions are drawn as names. */
  text?: string
  /** The mentions in `text`. */
  mentions?: readonly Mention[]
  /** Any other content instead of `text`. */
  content?: ReactNode
  /** A part inside the bubble under the text (an agent's questionnaire, files). */
  extra?: ReactNode
  status?: 'sending' | 'failed'
  /**
   * The whole message drawn by the application instead of a bubble — an AgentQuestion, which
   * draws the agent's bubble itself. It always shows its author.
   */
  element?: ReactNode
}

export interface MessageListProps {
  /** The messages, in any order (shown oldest first). */
  messages: readonly ThreadMessage[]
  /** The scrolling region's name ("Comments on F-2026-0410"). */
  label: string
  /** Sends a failed message again. */
  onRetry?: (message: ThreadMessage) => void
  /** The first messages are loading. */
  loading?: boolean
  /** The list's height comes from here (h-96, flex-1). */
  className?: string
}

/** "Jump to latest", or the count of messages that arrived while the reader was away. */
function JumpToLatest({ count }: { count: number }) {
  const { messages, format } = useLiro()
  const { end } = useMessageScrollerScrollable()
  const [seen, setSeen] = useState(count)
  if (!end && seen !== count) setSeen(count)
  const added = Math.max(0, count - seen)
  return (
    <MessageScrollerButton>
      <span className={TEXT_DIRECTION}>
        {added > 0
          ? messages['message.newMessages'](added, format.number(String(added)))
          : messages['message.jumpToLatest']}
      </span>
    </MessageScrollerButton>
  )
}

/** Keeps the user's own new message in view: sending scrolls to the end. */
function FollowOwn({ last }: { last: ThreadMessage | undefined }) {
  const { scrollToEnd } = useMessageScroller()
  const previous = useRef(last?.id)
  useEffect(() => {
    if (last === undefined || last.id === previous.current) return
    previous.current = last.id
    if (last.own === true) scrollToEnd({ behavior: 'auto' })
  }, [last, scrollToEnd])
  return null
}

/** Messages oldest first, the latest kept in view, a separator for each day. */
export function MessageList({
  messages: items,
  label,
  onRetry,
  loading,
  className,
}: MessageListProps) {
  const { messages, format, today } = useLiro()
  if (items.length === 0) {
    return (
      <div className={cn('flex min-h-0 flex-col justify-center', className)}>
        {loading === true ? (
          <div aria-busy="true" className="flex flex-col gap-3">
            <span className="sr-only">{messages['field.loading']}</span>
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex gap-2">
                <Skeleton className="size-6.5 shrink-0 rounded-xl" />
                <Skeleton className="h-14 w-full max-w-80 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            title={messages['message.emptyTitle']}
            description={messages['message.emptyDescription']}
          />
        )}
      </div>
    )
  }
  const groups = groupByDayOf(items, (item) => item.at, today, 'oldest')
  const ordered = groups.flatMap((group) => group.items)
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller data-slot="message-list" className={cn('min-h-40', className)}>
        <MessageScrollerViewport label={label}>
          <MessageScrollerContent className="box-border p-1">
            {groups.map((group) => [
              <MessageScrollerItem key={`day-${group.day}`}>
                <Marker variant="separator" className="py-1">
                  <MarkerContent>
                    {dayHeading(group, messages, (day) => format.date(day))}
                  </MarkerContent>
                </Marker>
              </MessageScrollerItem>,
              ...group.items.map((item) => {
                const previous = ordered[ordered.indexOf(item) - 1]
                const run = startsRun(
                  previous === undefined || previous.element !== undefined
                    ? undefined
                    : { authorKey: previous.author.id ?? previous.author.name, at: previous.at },
                  { authorKey: item.author.id ?? item.author.name, at: item.at },
                )
                if (item.element !== undefined) {
                  return (
                    <MessageScrollerItem key={item.id} messageId={item.id}>
                      {item.element}
                    </MessageScrollerItem>
                  )
                }
                return (
                  <MessageScrollerItem
                    key={item.id}
                    messageId={item.id}
                    className={run ? undefined : '-mt-2'}
                  >
                    <MessageBubble
                      author={item.author}
                      own={item.own === true}
                      at={item.at}
                      showAuthor={run}
                      {...(item.extra === undefined ? {} : { extra: item.extra })}
                      {...(item.status === undefined ? {} : { status: item.status })}
                      {...(onRetry === undefined
                        ? {}
                        : {
                            onRetry: () => {
                              onRetry(item)
                            },
                          })}
                    >
                      {item.content ??
                        (item.text === undefined ? null : (
                          <MentionText text={item.text} mentions={item.mentions ?? []} />
                        ))}
                    </MessageBubble>
                  </MessageScrollerItem>
                )
              }),
            ])}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <JumpToLatest count={items.length} />
        <FollowOwn last={ordered.at(-1)} />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

/** What the composer sends. */
export interface ComposedMessage {
  text: string
  /** The people mentioned in the text, with their ids. */
  mentions: Mention[]
}

export interface MessageComposerProps {
  /** The field's name for assistive technology ("Comment"); not shown. */
  label: string
  /** Shown while the field is empty ("Write a comment"). */
  placeholder?: string
  /** Controlled text. */
  value?: string
  /** Uncontrolled initial text. */
  defaultValue?: string
  onChange?: (text: string) => void
  /** Sends the message; a promise keeps the text (read-only, with a spinner) until it resolves. */
  onSend: (message: ComposedMessage) => void | Promise<void>
  /** The application is sending. */
  sending?: boolean
  /** No message can be written. Give `disabledReason`. */
  disabled?: boolean
  /** Why, shown under the field. */
  disabledReason?: ReactNode
  /** A problem with the message, shown under the field. */
  error?: ReactNode
  /** People who can be mentioned with "@". Without it, "@" is plain text. */
  candidates?: readonly MentionCandidate[]
  /** The application searches people (MentionCombobox). */
  onSearch?: (query: string) => void
  /** The application is searching people. */
  loading?: boolean
  /** The files added to the message, above the toolbar (an AttachmentList). */
  attachments?: ReactNode
  /** Buttons at the start of the toolbar (attach a file). */
  tools?: ReactNode
  className?: string
}

/** Writes a message: Enter sends, Shift+Enter breaks the line, "@" mentions. */
export function MessageComposer(props: MessageComposerProps) {
  const { messages } = useLiro()
  const [innerText, setInnerText] = useState(props.defaultValue ?? '')
  const text = props.value ?? innerText
  const [mentions, setMentions] = useState<Mention[]>([])
  const [busy, setBusy] = useState(false)
  const sending = busy || props.sending === true
  const disabled = props.disabled === true
  const canSend = !disabled && !sending && text.trim() !== ''

  const setText = (next: string) => {
    setInnerText(next)
    props.onChange?.(next)
  }
  // While sending, the text is kept as sent (typing waits); the field keeps its look and focus.
  const type = (next: string) => {
    if (!sending) setText(next)
  }

  const send = () => {
    if (!canSend) return
    const result = props.onSend({ text: text.trim(), mentions })
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
          setText('')
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      setText('')
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    send()
  }

  return (
    <div
      data-slot="message-composer"
      className={cn('flex min-w-0 flex-col gap-2 font-sans', props.className)}
    >
      <MentionCombobox
        label={props.label}
        hideLabel
        value={text}
        onChange={type}
        candidates={props.candidates ?? []}
        onMentionsChange={setMentions}
        onKeyDown={onKeyDown}
        enterKeyHint="send"
        {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
        {...(props.onSearch === undefined ? {} : { onSearch: props.onSearch })}
        {...(props.loading === undefined ? {} : { loading: props.loading })}
        {...(disabled ? { disabled: true } : {})}
        {...(props.disabledReason === undefined ? {} : { disabledReason: props.disabledReason })}
        {...(props.error === undefined ? {} : { error: props.error })}
      />
      {props.attachments}
      <div className="flex flex-wrap items-center gap-2">
        {props.tools}
        <span className={cn('min-w-0 flex-1 text-xs text-tertiary', TEXT_DIRECTION)}>
          {sending ? (
            <Spinner size="sm">
              <span className="text-xs text-secondary">{messages['message.sending']}</span>
            </Spinner>
          ) : disabled ? null : (
            messages['message.sendHint']
          )}
        </span>
        <Button
          family="primary"
          icon={SendHorizontal}
          label={messages['message.send']}
          disabled={!canSend}
          onClick={send}
        />
      </div>
    </div>
  )
}

export interface MessageThreadProps {
  /** The messages, in any order. */
  messages: readonly ThreadMessage[]
  /** The list's name ("Comments on F-2026-0410"). */
  label: string
  /** The composer under the list. */
  composer: MessageComposerProps
  onRetry?: (message: ThreadMessage) => void
  loading?: boolean
  /** The thread's height comes from here (h-[28rem]); the list takes what the composer leaves. */
  className?: string
}

/** A conversation: the messages and the composer under them. */
export function MessageThread(props: MessageThreadProps) {
  return (
    <div
      data-slot="message-thread"
      className={cn('flex min-h-0 min-w-0 flex-col gap-3', props.className)}
    >
      <MessageList
        messages={props.messages}
        label={props.label}
        className="min-h-0 flex-1"
        {...(props.onRetry === undefined ? {} : { onRetry: props.onRetry })}
        {...(props.loading === undefined ? {} : { loading: props.loading })}
      />
      <MessageComposer {...props.composer} />
    </div>
  )
}
