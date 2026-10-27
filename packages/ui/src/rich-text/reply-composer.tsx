import { Command as CommandPrimitive } from 'cmdk'
import {
  ChevronDown,
  Link2,
  LockKeyhole,
  MessageSquareText,
  Paperclip,
  SendHorizontal,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { Button, IconButton } from '../components/button'
import { commandMatches } from '../components/command-logic'
import { FieldMessage } from '../components/field'
import type { MentionCandidate } from '../components/mention-combobox'
import { SEARCHABLE_FROM } from '../components/select-field'
import { Spinner } from '../components/spinner'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import type { MergeValues } from './merge-values'
import type { RichTextMergeField } from './rich-text'
import { RichTextField, type RichTextFieldHandle } from './rich-text-field'
import {
  EMPTY_RICH_TEXT,
  isRichTextEmpty,
  normalizeRichText,
  richTextValue,
  safeHref,
  type RichTextNode,
  type RichTextValue,
} from './rich-text-logic'

/*
 * ReplyComposer (P5.30): writes a reply to a conversation, or a note only the team sees, in
 * formatted text — a support desk's reply, a reply to a request, a note on a case. Built on
 * RichTextField (the `@veljaos/ui/rich-text` subpath), so its toolbar, shortcuts, paste rules,
 * merge fields and mentions are RichTextField's.
 *
 * - **Two modes** (`modes`, default both): a reply and an internal note, switched by a compact
 *   segmented control at the top that never wraps (P5.93 item 33; one choice, named "Message
 *   type"; the neutral selection, never blue, D17).
 *   The text is kept when the mode changes. The note's text box stands on surface.sunken and a
 *   line under the switch says who sees it ("Only your team sees internal notes."), with a lock —
 *   the same look as the note in the thread (MessageBubble `internal`). Labels from messages, or
 *   from `replyLabel` / `noteLabel` / `noteHint`. With one mode there is no switch.
 * - **Mentions** ("@") only in the note mode: a reply goes to someone outside the team.
 * - **Saved replies** (`savedReplies`, the application's texts): a "Saved replies" button opening
 *   a list, grouped, searched by typing from 11 replies (D20); the one chosen is inserted at the
 *   caret, replacing a selection (a reply of one paragraph joins the line). A saved reply may use
 *   merge fields ("Dear {{contact.firstName}}, … on {{incident_date}} … from {{date_now}}"): with
 *   `mergeValues` (this conversation's values) they are written in as it is inserted, dates and
 *   amounts through `format`, fields computed from 'today' or 'now' from the provider's day and
 *   the application's `now`; a field without a value stays a pill marked "No value" (P5.31).
 * - **Attachments:** the paperclip opens the file chooser (`accept`); the files go to `onAttach`,
 *   which checks and uploads them, and shows them in `attachments` (an AttachmentList) under the
 *   text — each file on one line, a long name shortened in the middle, its remove button on the
 *   file's line. Dropping files on the composer is the shortcut.
 * - **Insert a link** (`onInsertLink`, `insertLinkLabel`): the application opens its own search
 *   (a knowledge base, a catalogue: LookupDialog) and resolves with `{ text, href }` — or null when
 *   nothing was chosen; the link is inserted at the caret. Only http(s) and mailto links.
 * - **Send:** the button at the end ("Send" or "Add note"), filled — clearly the main action —
 *   once there is something to send (P5.93 item 33), or Ctrl/Cmd+Enter in the text. `onSend` receives the
 *   mode and the value (JSON, sanitized HTML, mentions, length); a promise keeps the text with a
 *   spinner until it resolves and empties it then; a rejection keeps it. Disabled while the text
 *   is empty. `unavailableReason` (P5.93): nothing can be written now — the text is read-only (the
 *   read-only look of every field), the tools and Send are unavailable, and the reason stands
 *   under the text in words.
 *
 * When not: a chat message or a comment without formatting (MessageComposer); a long document
 * (RichTextField on its own page).
 */

/** The composer's modes: a reply to the conversation, or a note only the team sees. */
export type ComposerMode = 'reply' | 'note'

/** A saved reply: the application's text, inserted at the caret. */
export interface SavedReply {
  id: string
  /** Its name in the list ("Invoice rejected: wrong VAT"). */
  label: string
  /** The group it is listed under. */
  group?: string
  /** The text: a document (Tiptap JSON), as RichTextField reports it. */
  content: RichTextNode
}

/** A link the application found, inserted at the caret. */
export interface ComposerLink {
  /** The link's text ("Why was my invoice rejected?"). */
  text: string
  /** Its address: http(s) or mailto. */
  href: string
}

/** What the composer sends. */
export interface ComposedReply {
  mode: ComposerMode
  value: RichTextValue
}

export interface ReplyComposerProps {
  /** The modes offered, in order. Default both; one mode shows no switch. */
  modes?: readonly ComposerMode[]
  /** Controlled mode. */
  mode?: ComposerMode
  /** Uncontrolled first mode. Default: the first of `modes`. */
  defaultMode?: ComposerMode
  onModeChange?: (mode: ComposerMode) => void
  /** The reply mode's name (the switch, the text box's name). Default from messages. */
  replyLabel?: string
  /** The note mode's name. Default from messages ("Internal note"). */
  noteLabel?: string
  /** Who sees a note, under the switch. Default from messages. */
  noteHint?: ReactNode
  /** Shown while a reply is empty. */
  placeholder?: string
  /** Shown while a note is empty. Default: `placeholder`. */
  notePlaceholder?: string
  /** The first text (a draft). */
  defaultValue?: RichTextNode | null
  /** Every change of the text: JSON, HTML, mentions, merge fields, length. */
  onChange?: (value: RichTextValue) => void
  /** Sends the reply or adds the note; a promise keeps the text until it resolves. */
  onSend: (reply: ComposedReply) => void | Promise<void>
  /** The application is sending. */
  sending?: boolean
  /**
   * Nothing can be written now, and why, from the application: the text is read-only, the tools
   * and Send are unavailable, and the reason stands under the text.
   */
  unavailableReason?: ReactNode
  /** A problem with the message, under the text. */
  error?: ReactNode
  /** Who "@" offers in a note. */
  mentionCandidates?: readonly MentionCandidate[]
  /** The application searches people (after 300ms). */
  onMentionSearch?: (query: string) => void
  mentionsLoading?: boolean
  /** Merge fields the text can use ("{{"), the application fills them in. */
  mergeFields?: readonly RichTextMergeField[]
  /**
   * The values of the merge fields for this conversation (P5.31): a saved reply, or a field
   * chosen from "{{", is inserted with its values written in ("Dear Milica, … on 12.10.2026.");
   * a field without a value stays a pill marked "No value" and a line names it. Fields computed
   * from 'today' or 'now' need none.
   */
  mergeValues?: MergeValues
  /** The application's "now" (an instant), for fields computed from it. */
  now?: string
  /** The application's saved replies. */
  savedReplies?: readonly SavedReply[]
  /** Files chosen or dropped; the application checks, uploads and lists them. */
  onAttach?: (files: File[]) => void
  /** The accepted types, as the `accept` attribute takes them (".pdf", "image/*"). */
  accept?: readonly string[]
  /** The files of this message, under the text (an AttachmentList). */
  attachments?: ReactNode
  /** Asks the application for a link (its own search); resolves with it, or null. */
  onInsertLink?: () => Promise<ComposerLink | null>
  /** The insert button's name ("Insert article"). Default from messages ("Insert a link"). */
  insertLinkLabel?: string
  /** More of the application's tools, after the composer's own. */
  tools?: ReactNode
  /** The text box's height in lines before it grows. Default: 4. */
  minRows?: number
  /** The text box's handle: insert at the caret, focus, empty. */
  ref?: Ref<RichTextFieldHandle>
  className?: string
}

/** The saved replies in their groups, groups in order of first appearance; ungrouped first. */
export function groupSavedReplies(
  replies: readonly SavedReply[],
): { group: string | undefined; replies: SavedReply[] }[] {
  const groups = new Map<string | undefined, SavedReply[]>()
  for (const reply of replies.filter((each) => each.group === undefined)) {
    groups.set(undefined, [...(groups.get(undefined) ?? []), reply])
  }
  for (const reply of replies.filter((each) => each.group !== undefined)) {
    groups.set(reply.group, [...(groups.get(reply.group) ?? []), reply])
  }
  return [...groups.entries()].map(([group, list]) => ({ group, replies: list }))
}

/** The link to insert, or null when its address is not one a link may have. */
export function linkNodes(link: ComposerLink): RichTextNode[] | null {
  const href = safeHref(link.href)
  const text = link.text.trim()
  if (href === null || text === '') return null
  return [
    { type: 'text', text, marks: [{ type: 'link', attrs: { href } }] },
    { type: 'text', text: ' ' },
  ]
}

/** Whether the key sends: Ctrl+Enter, or Cmd+Enter on a Mac, outside an IME composition. */
export function isSendKey(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  isComposing?: boolean
}): boolean {
  return event.key === 'Enter' && (event.ctrlKey || event.metaKey) && event.isComposing !== true
}

/** The saved replies: a button opening the list, searched by typing from 11. */
function SavedReplies({
  replies,
  disabled,
  onChoose,
}: {
  replies: readonly SavedReply[]
  disabled: boolean
  onChoose: (reply: SavedReply) => void
}) {
  const { messages, locale } = useLiro()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchable = replies.length >= SEARCHABLE_FROM
  const shown = searchable
    ? replies.filter((reply) =>
        commandMatches(
          {
            label: reply.label,
            ...(reply.group === undefined ? {} : { description: reply.group }),
          },
          query,
          locale,
        ),
      )
    : replies
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <ButtonPrimitive emphasis="menu" disabled={disabled} className="gap-1.5 px-2">
          <MessageSquareText aria-hidden="true" className="size-4 shrink-0" />
          <span className={TEXT_DIRECTION}>{messages['composer.savedReplies']}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
        </ButtonPrimitive>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="box-border w-80 p-1 shadow-md">
        <CommandPrimitive
          shouldFilter={false}
          label={messages['composer.savedReplies']}
          className="flex flex-col font-sans text-primary"
        >
          {searchable && (
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder={messages['composer.findSavedReply']}
              aria-label={messages['composer.findSavedReply']}
              className="mb-1 box-border block h-control w-full min-w-0 appearance-none rounded-md border border-solid border-control bg-surface-raised px-3 font-sans text-sm text-primary outline-none placeholder:text-tertiary focus:border-focus"
            />
          )}
          {shown.length === 0 && (
            <p
              role="status"
              className={cn('m-0 px-2.5 py-1.5 text-sm text-secondary', TEXT_DIRECTION)}
            >
              {messages['field.noResults']}
            </p>
          )}
          <CommandPrimitive.List
            label={messages['composer.savedReplies']}
            className="max-h-72 overflow-y-auto"
          >
            {groupSavedReplies(shown).map(({ group, replies: list }) => (
              <CommandPrimitive.Group
                key={group ?? ''}
                {...(group === undefined ? {} : { heading: group })}
                className="[&_[cmdk-group-heading]]:bidi-content [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-secondary"
              >
                {list.map((reply) => (
                  <CommandPrimitive.Item
                    key={reply.id}
                    value={reply.id}
                    onSelect={() => {
                      setOpen(false)
                      setQuery('')
                      onChoose(reply)
                    }}
                    className="box-border flex min-h-9 w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none data-[selected=true]:bg-surface-sunken"
                  >
                    <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{reply.label}</span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ))}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}

/** A reply or an internal note in formatted text, with saved replies, files and links. */
export function ReplyComposer({ ref: outer, ...props }: ReplyComposerProps) {
  const { messages } = useLiro()
  const modes = props.modes ?? (['reply', 'note'] as const)
  const [innerMode, setInnerMode] = useState<ComposerMode>(props.defaultMode ?? modes[0] ?? 'reply')
  const mode = props.mode ?? innerMode
  const note = mode === 'note'
  // The text as last reported (the first one from the draft), sent as it is.
  const [latest, setLatest] = useState<RichTextValue>(() =>
    richTextValue(normalizeRichText(props.defaultValue ?? EMPTY_RICH_TEXT)),
  )
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inner = useRef<RichTextFieldHandle | null>(null)
  const fileInput = useRef<HTMLInputElement | null>(null)

  const sending = busy || props.sending === true
  const disabled = props.unavailableReason !== undefined && props.unavailableReason !== null
  const reasonId = `${useId()}-reason`
  const canSend = !disabled && !sending && !isRichTextEmpty(latest.json)
  const label =
    mode === 'note'
      ? (props.noteLabel ?? messages['composer.note'])
      : (props.replyLabel ?? messages['composer.reply'])
  const modeLabel = (each: ComposerMode) =>
    each === 'note'
      ? (props.noteLabel ?? messages['composer.note'])
      : (props.replyLabel ?? messages['composer.reply'])
  const placeholder = note ? (props.notePlaceholder ?? props.placeholder) : props.placeholder

  const setHandle = useCallback(
    (handle: RichTextFieldHandle | null) => {
      inner.current = handle
      if (typeof outer === 'function') outer(handle)
      else if (outer !== undefined && outer !== null) outer.current = handle
    },
    [outer],
  )

  const changeMode = (next: ComposerMode) => {
    setInnerMode(next)
    props.onModeChange?.(next)
  }

  const send = (current: RichTextValue) => {
    if (!canSend) return
    const result = props.onSend({ mode, value: current })
    if (result instanceof Promise) {
      setBusy(true)
      result.then(
        () => {
          setBusy(false)
          inner.current?.clear()
        },
        () => {
          setBusy(false)
        },
      )
    } else {
      inner.current?.clear()
    }
  }
  const attach = (files: File[]) => {
    if (files.length > 0) props.onAttach?.(files)
  }
  const canDrop = props.onAttach !== undefined && !disabled

  // Ctrl/Cmd+Enter in the text sends, and files dropped on the composer are attached: listeners
  // on the frame (the text and the buttons inside it are the controls; dropping is a shortcut).
  const frame = useRef<HTMLDivElement | null>(null)
  const live = useRef<{
    send: () => void
    canDrop: boolean
    attach: (files: File[]) => void
    drag: (on: boolean) => void
  }>({ send: () => undefined, canDrop: false, attach: () => undefined, drag: () => undefined })
  useLayoutEffect(() => {
    live.current = {
      send: () => {
        send(latest)
      },
      canDrop,
      attach,
      drag: (on) => {
        setDragging(on)
      },
    }
  })
  useEffect(() => {
    const element = frame.current
    if (element === null) return
    const key = (event: globalThis.KeyboardEvent) => {
      if (!isSendKey(event)) return
      event.preventDefault()
      event.stopPropagation()
      live.current.send()
    }
    const over = (event: DragEvent) => {
      if (!live.current.canDrop || event.dataTransfer?.types.includes('Files') !== true) return
      event.preventDefault()
      live.current.drag(true)
    }
    const leave = (event: DragEvent) => {
      if (!element.contains(event.relatedTarget as Node | null)) live.current.drag(false)
    }
    const dropped = (event: DragEvent) => {
      if (!live.current.canDrop) return
      event.preventDefault()
      live.current.drag(false)
      live.current.attach([...(event.dataTransfer?.files ?? [])])
    }
    element.addEventListener('keydown', key, true)
    element.addEventListener('dragover', over)
    element.addEventListener('dragleave', leave)
    element.addEventListener('drop', dropped)
    return () => {
      element.removeEventListener('keydown', key, true)
      element.removeEventListener('dragover', over)
      element.removeEventListener('dragleave', leave)
      element.removeEventListener('drop', dropped)
    }
  }, [])

  return (
    <div
      data-slot="reply-composer"
      ref={frame}
      data-mode={mode}
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-lg font-sans',
        dragging && 'outline-2 outline-offset-4 outline-focus outline-dashed',
        props.className,
      )}
    >
      {modes.length > 1 && (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {/* A compact segmented control on one line (P5.93 item 33): a label too long for the
              room is shortened with an ellipsis, its whole text still the item's name. */}
          <ToggleGroup
            type="single"
            value={mode}
            aria-label={messages['composer.modes']}
            disabled={disabled}
            onValueChange={(value) => {
              if (value === 'reply' || value === 'note') changeMode(value)
            }}
            className="max-w-full min-w-0"
          >
            {modes.map((each) => (
              <ToggleGroupItem
                key={each}
                value={each}
                className="inline-flex min-w-0 flex-auto items-center justify-center gap-1.5"
              >
                {each === 'note' && (
                  <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0" />
                )}
                <span className={cn('min-w-0 truncate', TEXT_DIRECTION)}>{modeLabel(each)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {note && (
            <span
              data-slot="composer-note-hint"
              className={cn('min-w-0 text-xs text-secondary', TEXT_DIRECTION)}
            >
              {props.noteHint ?? messages['composer.noteHint']}
            </span>
          )}
        </div>
      )}
      <RichTextField
        ref={setHandle}
        label={label}
        hideLabel
        surface={note ? 'sunken' : 'raised'}
        minRows={props.minRows ?? 4}
        defaultValue={props.defaultValue ?? null}
        onChange={(next) => {
          setLatest(next)
          props.onChange?.(next)
        }}
        {...(placeholder === undefined ? {} : { placeholder })}
        {...(props.mergeFields === undefined ? {} : { mergeFields: props.mergeFields })}
        {...(props.mergeValues === undefined ? {} : { mergeValues: props.mergeValues })}
        {...(props.now === undefined ? {} : { now: props.now })}
        {...(note && props.mentionCandidates !== undefined
          ? { mentionCandidates: props.mentionCandidates }
          : {})}
        {...(note && props.onMentionSearch !== undefined
          ? { onMentionSearch: props.onMentionSearch }
          : {})}
        {...(note && props.mentionsLoading !== undefined
          ? { mentionsLoading: props.mentionsLoading }
          : {})}
        {...(disabled ? { readOnly: true, describedBy: reasonId } : {})}
        {...(props.error === undefined ? {} : { error: props.error })}
      />
      {disabled && (
        <FieldMessage id={reasonId} tone="hint">
          {props.unavailableReason}
        </FieldMessage>
      )}
      {props.attachments}
      <div className="flex flex-wrap items-center gap-1">
        {props.onAttach !== undefined && (
          <>
            <IconButton
              family="neutral"
              icon={Paperclip}
              emphasis="menu"
              label={messages['composer.attach']}
              disabled={disabled}
              onClick={() => fileInput.current?.click()}
            />
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              tabIndex={-1}
              aria-label={messages['composer.attach']}
              {...(props.accept === undefined ? {} : { accept: props.accept.join(',') })}
              onChange={(event) => {
                attach([...(event.currentTarget.files ?? [])])
                event.currentTarget.value = ''
              }}
            />
          </>
        )}
        {props.onInsertLink !== undefined && (
          <IconButton
            family="neutral"
            icon={Link2}
            emphasis="menu"
            label={props.insertLinkLabel ?? messages['composer.insertLink']}
            disabled={disabled}
            onClick={() => {
              void props.onInsertLink?.().then((link) => {
                const nodes = link === null ? null : linkNodes(link)
                if (nodes !== null) inner.current?.insert(nodes)
              })
            }}
          />
        )}
        {props.savedReplies !== undefined && props.savedReplies.length > 0 && (
          <SavedReplies
            replies={props.savedReplies}
            disabled={disabled}
            onChoose={(reply) => {
              inner.current?.insert(reply.content)
            }}
          />
        )}
        {props.tools}
        <span aria-hidden="true" className="min-w-0 flex-1" />
        <span className={cn('min-w-0 px-1 text-xs text-tertiary', TEXT_DIRECTION)}>
          {sending ? (
            <Spinner size="sm">
              <span className="text-xs text-secondary">{messages['message.sending']}</span>
            </Spinner>
          ) : disabled ? null : (
            messages['composer.sendHint']
          )}
        </span>
        {/* Clearly the main action once there is something to send (P5.93 item 33); at the
            row's end also when the row wraps. */}
        <span className="ms-auto flex">
          <Button
            family="primary"
            emphasis="primary"
            icon={SendHorizontal}
            label={note ? messages['composer.addNote'] : messages['composer.send']}
            disabled={!canSend}
            onClick={() => {
              send(latest)
            }}
          />
        </span>
      </div>
    </div>
  )
}
