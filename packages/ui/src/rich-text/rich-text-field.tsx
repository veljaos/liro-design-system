import type { Editor } from '@tiptap/core'
import type { EditorProps } from '@tiptap/pm/view'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { AlertTriangle, Bot, CircleAlert } from 'lucide-react'
import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'
import { ComboboxPopover, optionId } from '../components/combobox-field'
import {
  filterChoices,
  MOVE_KEYS,
  moveActive,
  useDebouncedCallback,
  type MoveKey,
} from '../components/combobox-logic'
import {
  Field,
  fieldProps,
  READ_ONLY_EMPTY,
  type FieldBaseProps,
  type FieldControl,
} from '../components/field'
import type { MentionCandidate } from '../components/mention-combobox'
import { PersonAvatar } from '../components/person'
import { OPTION, READ_ONLY, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { richTextExtensions } from './extensions'
import { LinkDialog } from './link-dialog'
import {
  mergeFieldText,
  missingMergeFields,
  resolveMergeFields,
  type MergeContext,
  type MergeValues,
} from './merge-values'
import { RICH_CONTENT, RichText, type RichTextMergeField } from './rich-text'
import {
  EMPTY_RICH_TEXT,
  isRichTextEmpty,
  normalizeRichText,
  richTextLength,
  richTextMergeFields,
  richTextValue,
  sanitizeRichHtml,
  suggestionAt,
  type RichTextNode,
  type RichTextSuggestion,
  type RichTextValue,
} from './rich-text-logic'
import { IDLE_TOOLBAR, Toolbar, type ToolbarState } from './toolbar'

/*
 * RichTextField (P5.22): formatted text — a letter template, a note, a comment — on Tiptap's MIT
 * packages only (no Pro or paid extension). A Field (label, description, error under it, required
 * mark, read-only as RichText in the read-only look of every field, P5.93) around a framed editor: the formatting
 * toolbar on top (toolbar.tsx), the text under it, the counter under the frame when `maxLength` is
 * set.
 *
 * - **The text box** is a contenteditable `role="textbox"` with `aria-multiline`, named by the
 *   label and described by the description, error, reason and counter. Its frame looks like an
 *   input's: border.control, radius md, the focus colour while anything inside has the focus, the
 *   danger colour when invalid. Each paragraph takes its direction
 *   from its text (`dir="auto"`).
 * - **Shortcuts:** Ctrl/Cmd+B, I, U (bold, italic, underline), K (the link dialog), Z / Shift+Z
 *   (undo, redo); Tiptap's own Ctrl/Cmd+Alt+2 / 3 (heading, subheading), Ctrl/Cmd+Shift+8 / 7
 *   (lists). Tab leaves the field (lists are one level deep).
 * - **Paste** keeps structure only: pasted HTML goes through `sanitizeRichHtml` first (Word's
 *   styles, classes, colours and fonts go, its paragraphs, bold, italic, underline, lists and
 *   links stay), and the schema knows nothing else.
 * - **Merge fields** (`mergeFields`): inserted from the toolbar's menu or by typing "{{", which
 *   offers the fields in a list under the text (the combobox pattern of MentionCombobox: the
 *   focus stays in the text, `aria-activedescendant`, ArrowDown / ArrowUp, Home / End, Enter or
 *   Tab chooses, Escape closes). A merge field is one atomic pill (neutral, never blue), read
 *   "Merge field: <label>".
 * - **Mentions** (`mentionCandidates`): "@" offers people as MentionCombobox does (P5.1): all of
 *   them filtered by name, or the application's search (`onMentionSearch` after 300ms, with
 *   `mentionsLoading`). A mention is one atomic node with the person's id.
 * - **The value** is Tiptap's JSON (`value` / `defaultValue`); `onChange` reports the JSON, the
 *   sanitized HTML, the mentions, the merge fields and the length (rich-text-logic.ts).
 * - **From outside** (P5.30): `ref` gives a handle that inserts content at the caret (where the
 *   caret was before a menu or dialog took the focus: a saved reply, a link the application
 *   found), puts the focus back into the text and empties it (after sending). `surface` 'sunken'
 *   draws the text box on surface.sunken (ReplyComposer's internal note).
 */

/** What a RichTextField's `ref` can do (P5.30). */
export interface RichTextFieldHandle {
  /**
   * Inserts content at the caret, replacing the selected text: a whole document (its blocks), a
   * list of nodes or plain text. The focus goes back into the text.
   */
  insert: (content: RichTextNode | readonly RichTextNode[] | string) => void
  /** Puts the focus into the text, keeping the caret where it was. */
  focus: () => void
  /** Empties the text (reported through `onChange`). */
  clear: () => void
}

export interface RichTextFieldProps extends FieldBaseProps {
  /** Controlled value: Tiptap's JSON, as `onChange` reported it. */
  value?: RichTextNode | null
  /** Uncontrolled initial value. */
  defaultValue?: RichTextNode | null
  /** Called on every change with the JSON, the sanitized HTML, mentions, merge fields and length. */
  onChange?: (value: RichTextValue) => void
  /** Called when the focus leaves the text. */
  onBlur?: () => void
  /** The fields the text can refer to: the toolbar's menu and the "{{" list offer them. */
  mergeFields?: readonly RichTextMergeField[]
  /**
   * The merge fields' values, for a text written to one recipient (a reply, a message) rather
   * than a template (P5.31): a field in the first value, one chosen from the menu or "{{", and
   * every field in content inserted through the handle (a saved reply), is written in as its value; a field without one
   * stays a pill marked "No value", and a line under the text names them. Fields computed from
   * 'today' or 'now' need no value. Without `mergeValues` the fields stay pills (a template).
   */
  mergeValues?: MergeValues
  /** The application's "now" (an instant), for fields computed from it. */
  now?: string
  /** Who "@" offers: everyone, or the results of the application's last search. */
  mentionCandidates?: readonly MentionCandidate[]
  /** The application searches (after `mentionSearchDelay`) and passes the results. */
  onMentionSearch?: (query: string) => void
  /** Milliseconds of quiet before `onMentionSearch`. Default: 300. */
  mentionSearchDelay?: number
  /** The application is searching for people. */
  mentionsLoading?: boolean
  /** Shown while the text is empty. From the application. */
  placeholder?: string
  /**
   * The most characters the text may have (`richTextLength`: a merge field, mention or line break
   * counts as one). A counter shows "120 / 2000"; beyond it the field says how many are too many
   * and is invalid, but nothing typed is lost.
   */
  maxLength?: number
  /** The value is still loading: lines of skeleton in place of the text. */
  loading?: boolean
  /** The text box's height in lines before it grows with its content. Default: 4. */
  minRows?: number
  /** The text box's surface: 'raised' (default) or 'sunken' (a note only the team sees). */
  surface?: 'raised' | 'sunken'
  /** A handle to insert content at the caret, focus and empty the text (P5.30). */
  ref?: Ref<RichTextFieldHandle>
}

/**
 * What the handle's `insert` gives Tiptap: a document's blocks (a saved reply is a whole document),
 * a list of nodes, or plain text as one text node.
 */
export function insertable(
  content: RichTextNode | readonly RichTextNode[] | string,
): RichTextNode | RichTextNode[] {
  if (typeof content === 'string') return content === '' ? [] : { type: 'text', text: content }
  if (Array.isArray(content)) return [...(content as readonly RichTextNode[])]
  const node = content as RichTextNode
  if (node.type !== 'doc') return node
  const blocks = node.content ?? []
  // One paragraph goes into the line at the caret, not as a paragraph of its own.
  const only = blocks.length === 1 ? blocks[0] : undefined
  return only?.type === 'paragraph' ? (only.content ?? []) : blocks
}

/** The state the toolbar and the lists read after each change. */
interface Snapshot {
  toolbar: ToolbarState
  suggestion: (RichTextSuggestion & { from: number; to: number }) | null
  length: number
  empty: boolean
  /** The keys of the merge fields in the text, each once, as a string (a stable selector value). */
  mergeKeys: string
}

function readSnapshot(editor: Editor): Snapshot {
  const { selection } = editor.state
  const { $from } = selection
  let suggestion: Snapshot['suggestion'] = null
  if (selection.empty && $from.parent.isTextblock) {
    let before = ''
    $from.parent.forEach((child, offset) => {
      if (offset >= $from.parentOffset) return
      before += child.isText ? (child.text ?? '').slice(0, $from.parentOffset - offset) : '￼'
    })
    const found = suggestionAt(before)
    if (found !== null) {
      suggestion = { ...found, from: $from.pos - (before.length - found.start), to: $from.pos }
    }
  }
  let block: ToolbarState['block'] = 'paragraph'
  if (editor.isActive('heading', { level: 2 })) block = 'heading'
  else if (editor.isActive('heading', { level: 3 })) block = 'subheading'
  return {
    toolbar: {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      link: editor.isActive('link'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      block,
    },
    suggestion,
    length: richTextLength(editor.getJSON() as RichTextNode),
    empty: editor.isEmpty,
    mergeKeys: richTextMergeFields(editor.getJSON() as RichTextNode).join(' '),
  }
}

/** One choice of the "{{" or "@" list. */
interface SuggestionOption {
  value: string
  label: string
  group?: string
  candidate?: MentionCandidate
}

/** A person in the "@" list: avatar (Bot square for an agent), name and the application's line. */
function MentionOption({ candidate }: { candidate: MentionCandidate }) {
  return (
    <>
      {candidate.agent === true ? (
        <span
          aria-hidden="true"
          className="flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-primary"
        >
          <Bot className="size-3.5" />
        </span>
      ) : (
        <PersonAvatar
          name={candidate.name}
          size="sm"
          {...(candidate.src === undefined ? {} : { src: candidate.src })}
        />
      )}
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate', TEXT_DIRECTION)}>{candidate.name}</span>
        {candidate.description !== undefined && (
          <span className={cn('truncate text-xs', TEXT_DIRECTION)}>{candidate.description}</span>
        )}
      </span>
    </>
  )
}

function joinIds(...ids: (string | undefined)[]): string | undefined {
  const joined = ids.filter((id) => id !== undefined && id !== '').join(' ')
  return joined === '' ? undefined : joined
}

/**
 * A field for formatted text: paragraphs, headings, lists, bold, italic, underline, links, merge
 * fields and mentions. Use it for templates, notes and comments that keep their formatting; for
 * plain text use TextAreaField, for a chat message MessageComposer.
 */
export function RichTextField({ ref, ...props }: RichTextFieldProps) {
  const { messages } = useLiro()
  const generated = useId()
  const id = props.id ?? `rich-${generated}`
  // The counter (not drawn when read-only) describes the text box, with the description and the
  // error.
  const counterId =
    props.maxLength === undefined || props.readOnly === true ? undefined : `${id}-count`
  const frame: RichTextFieldProps = { ...props, id }
  const describedBy = joinIds(props.describedBy, counterId)
  if (describedBy !== undefined) frame.describedBy = describedBy
  return (
    <Field {...fieldProps(frame)} group>
      {(control) =>
        control.readOnly ? (
          // A group named by the label: its text stays selectable and its links usable (a
          // textbox around them would hold links inside a text box).
          <div
            id={control.id}
            role="group"
            aria-labelledby={control.labelId}
            aria-describedby={control.describedBy}
            title={messages['field.readOnly']}
            className={cn('rounded-md border border-solid px-3 py-2', READ_ONLY)}
          >
            {isRichTextEmpty(props.value ?? props.defaultValue ?? null) ? (
              <span className="text-sm text-secondary">{READ_ONLY_EMPTY}</span>
            ) : (
              <RichText
                value={props.value ?? props.defaultValue ?? null}
                {...(props.mergeFields === undefined ? {} : { mergeFields: props.mergeFields })}
              />
            )}
          </div>
        ) : (
          <RichTextEditor {...props} handleRef={ref} control={control} counterId={counterId} />
        )
      }
    </Field>
  )
}

/** What the editor's callbacks read; replaced after every render. */
interface Live {
  labelOf: (key: string) => string
  nameOf: (label: string) => string
  missingOf: (key: string) => boolean
  missingNameOf: (label: string) => string
  openLink: () => void
  keyDown: (event: KeyboardEvent) => boolean
  change: (json: RichTextNode) => void
  blur: () => void
  search: (query: string) => void
  attributes: Record<string, string>
}

/** Holds the latest callbacks: the editor and its extensions are made once and call through it. */
class LiveCallbacks {
  value: Live = {
    labelOf: (key) => key,
    nameOf: (label) => label,
    missingOf: () => false,
    missingNameOf: (label) => label,
    openLink: () => undefined,
    keyDown: () => false,
    change: () => undefined,
    blur: () => undefined,
    search: () => undefined,
    attributes: {},
  }

  set(value: Live) {
    this.value = value
  }

  search(query: string) {
    this.value.search(query)
  }
}

function RichTextEditor({
  handleRef,
  ...props
}: Omit<RichTextFieldProps, 'ref'> & {
  handleRef: Ref<RichTextFieldHandle> | undefined
  control: FieldControl
  counterId: string | undefined
}) {
  const { messages, locale, format, today } = useLiro()
  const { control } = props
  const loading = props.loading === true
  const mergeFields = props.mergeFields ?? []
  const listId = `${control.id}-suggestions`
  // Values given: fields are written in as they are inserted (P5.31).
  const merge: MergeContext | null =
    props.mergeValues === undefined
      ? null
      : { fields: props.mergeFields, values: props.mergeValues, format, today, now: props.now }
  // The handle reads the latest values (it is made once per editor).
  const mergeRef = useRef(merge)
  useLayoutEffect(() => {
    mergeRef.current = merge
  })
  /** A merge field as it goes into the text: its value as text, or the field. */
  const mergeNode = (key: string): RichTextNode => {
    const text = merge === null ? null : mergeFieldText(key, merge)
    return text === null ? { type: 'mergeField', attrs: { key } } : { type: 'text', text }
  }
  const missingId = `${control.id}-missing`

  // The first text, with the values written in when they are given (a reply started from a
  // saved reply).
  const [initial] = useState(() => {
    const first = normalizeRichText(props.value ?? props.defaultValue ?? EMPTY_RICH_TEXT)
    return merge === null ? first : resolveMergeFields(first, merge).doc
  })
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkCurrent, setLinkCurrent] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState<number | null>(null)
  const lastEmitted = useRef<RichTextNode | null>(null)

  const [live] = useState(() => new LiveCallbacks())
  const [extensions] = useState(() =>
    richTextExtensions({
      labelOf: (key) => live.value.labelOf(key),
      nameOf: (label) => live.value.nameOf(label),
      missingOf: (key) => live.value.missingOf(key),
      missingNameOf: (label) => live.value.missingNameOf(label),
      openLink: () => {
        live.value.openLink()
      },
    }),
  )
  const [editorProps] = useState<EditorProps>(() => ({
    attributes: () => live.value.attributes,
    handleKeyDown: (_view, event) => live.value.keyDown(event),
    transformPastedHTML: (html) => sanitizeRichHtml(html),
  }))
  const editor = useEditor({
    extensions,
    editorProps,
    content: initial,
    editable: !loading,
    // The editor is made after the first render, so a server and the browser draw the same.
    immediatelyRender: false,
    // The look is ours (classes on the text), and no <style> element is added to the page.
    injectCSS: false,
    onUpdate: ({ editor: changed }) => {
      live.value.change(changed.getJSON() as RichTextNode)
    },
    onBlur: () => {
      live.value.blur()
    },
  })
  useImperativeHandle(
    handleRef,
    () => ({
      insert: (content) => {
        if (editor === null || editor.isDestroyed) return
        const merge = mergeRef.current
        const filled =
          merge === null || typeof content === 'string'
            ? content
            : Array.isArray(content)
              ? (resolveMergeFields(
                  { type: 'doc', content: [...(content as readonly RichTextNode[])] },
                  merge,
                ).doc.content ?? [])
              : resolveMergeFields(content as RichTextNode, merge).doc
        editor.chain().focus().insertContent(insertable(filled)).run()
      },
      focus: () => {
        if (editor !== null && !editor.isDestroyed) editor.commands.focus()
      },
      clear: () => {
        if (editor !== null && !editor.isDestroyed) editor.commands.clearContent(true)
      },
    }),
    [editor],
  )
  const snapshot = useEditorState({
    editor,
    selector: ({ editor: current }) => (current === null ? null : readSnapshot(current)),
  })
  const toolbar = snapshot?.toolbar ?? IDLE_TOOLBAR
  const suggestion = snapshot?.suggestion ?? null

  // The list under the text: merge fields after "{{", people after "@".
  let options: SuggestionOption[] = []
  if (suggestion?.kind === 'mergeField') {
    options = filterChoices(
      mergeFields.map((field) => ({
        value: field.key,
        label: field.label,
        ...(field.group === undefined ? {} : { group: field.group }),
      })),
      suggestion.query,
      locale,
    )
  } else if (suggestion?.kind === 'mention' && props.mentionCandidates !== undefined) {
    const people = props.mentionCandidates.map((candidate) => ({
      value: candidate.id,
      label: candidate.name,
      candidate,
    }))
    options =
      props.onMentionSearch === undefined ? filterChoices(people, suggestion.query, locale) : people
  }
  const offered =
    suggestion !== null &&
    (suggestion.kind === 'mergeField'
      ? mergeFields.length > 0
      : props.mentionCandidates !== undefined)
  const open = offered && suggestion.from !== dismissed
  const searching = suggestion?.kind === 'mention' && props.mentionsLoading === true
  const showEmpty = open && options.length === 0 && !searching
  const visible = open && (options.length > 0 || searching || showEmpty)
  const listShown = visible && options.length > 0

  // A new query starts the list at its first option; a closed one forgets Escape.
  const queryKey =
    suggestion === null ? '' : `${suggestion.kind}:${String(suggestion.from)}:${suggestion.query}`
  const [shownKey, setShownKey] = useState(queryKey)
  if (queryKey !== shownKey) {
    setShownKey(queryKey)
    setActive(0)
    if (suggestion === null) setDismissed(null)
  }
  const search = useDebouncedCallback(props.onMentionSearch, props.mentionSearchDelay ?? 300)
  // The application's search runs when the text after "@" changes.
  const mentionQuery = open && suggestion.kind === 'mention' ? suggestion.query : null
  useEffect(() => {
    if (mentionQuery !== null) live.search(mentionQuery)
  }, [live, mentionQuery])

  const choose = (index: number) => {
    const option = options[index]
    if (option === undefined || suggestion === null || editor === null) return
    const range = { from: suggestion.from, to: suggestion.to }
    if (suggestion.kind === 'mergeField') {
      editor.chain().focus().insertContentAt(range, mergeNode(option.value)).run()
    } else {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: 'mention', attrs: { id: option.value, label: option.label } },
          { type: 'text', text: ' ' },
        ])
        .run()
    }
  }

  // The fields in the text that have no value (values given): named under the text.
  const missingKeys =
    merge === null
      ? []
      : missingMergeFields(
          (snapshot?.mergeKeys ?? richTextMergeFields(initial).join(' '))
            .split(' ')
            .filter((key) => key !== ''),
          merge,
        )
  const missingLabels = missingKeys.map(
    (key) => mergeFields.find((field) => field.key === key)?.label ?? key,
  )
  const length = snapshot?.length ?? richTextLength(initial)
  const over = props.maxLength !== undefined && length > props.maxLength
  const invalid = control.invalid || over
  const autocomplete = mergeFields.length > 0 || props.mentionCandidates !== undefined
  const minRows = props.minRows ?? 4

  // The text box's attributes, read by ProseMirror (editorProps.attributes).
  const attributes: Record<string, string> = {
    id: control.id,
    role: 'textbox',
    'aria-multiline': 'true',
    'aria-labelledby': control.labelId,
    class: cn(
      RICH_CONTENT,
      'min-h-(--rich-min-height) px-3 py-2 whitespace-pre-wrap outline-none [font-variant-ligatures:none]',
      '[&_img.ProseMirror-separator]:m-0 [&_img.ProseMirror-separator]:inline [&_img.ProseMirror-separator]:border-0',
    ),
  }
  const describedBy = joinIds(control.describedBy, missingKeys.length > 0 ? missingId : undefined)
  if (describedBy !== undefined) attributes['aria-describedby'] = describedBy
  if (invalid) attributes['aria-invalid'] = 'true'
  if (control.required) attributes['aria-required'] = 'true'
  if (props.placeholder !== undefined) attributes['aria-placeholder'] = props.placeholder
  if (autocomplete) attributes['aria-autocomplete'] = 'list'
  if (listShown) {
    attributes['aria-controls'] = listId
    attributes['aria-activedescendant'] = optionId(listId, active)
  }
  const attributesKey = JSON.stringify(attributes)

  useLayoutEffect(() => {
    live.set({
      labelOf: (key) => mergeFields.find((field) => field.key === key)?.label ?? key,
      nameOf: (label) => messages['richText.mergeField'](label),
      missingOf: (key) => merge !== null && mergeFieldText(key, merge) === null,
      missingNameOf: (label) => messages['richText.mergeFieldMissing'](label),
      openLink: () => {
        if (editor === null || loading) return
        const href: unknown = editor.getAttributes('link').href
        setLinkCurrent(typeof href === 'string' ? href : null)
        setLinkOpen(true)
      },
      keyDown: (event) => {
        if (!open) return false
        if (listShown && (MOVE_KEYS as readonly string[]).includes(event.key)) {
          event.preventDefault()
          setActive(moveActive(event.key as MoveKey, active, options))
          return true
        }
        if (listShown && (event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) {
          event.preventDefault()
          choose(active)
          return true
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          setDismissed(suggestion.from)
          return true
        }
        return false
      },
      change: (json) => {
        lastEmitted.current = json
        props.onChange?.(richTextValue(json))
      },
      blur: () => {
        props.onBlur?.()
      },
      search,
      attributes,
    })
  })

  // ProseMirror reads the attributes again when they change.
  useLayoutEffect(() => {
    if (editor !== null && editor.isInitialized && !editor.isDestroyed) editor.view.setProps({})
  }, [editor, attributesKey])

  useEffect(() => {
    if (editor !== null && !editor.isDestroyed) editor.setEditable(!loading, false)
  }, [editor, loading])

  // A controlled value set by the application (not the one this field just reported).
  useEffect(() => {
    const value = props.value
    if (editor === null || editor.isDestroyed || value === undefined) return
    if (value === lastEmitted.current) return
    const next = normalizeRichText(value ?? EMPTY_RICH_TEXT)
    if (
      JSON.stringify(next) === JSON.stringify(normalizeRichText(editor.getJSON() as RichTextNode))
    ) {
      return
    }
    editor.commands.setContent(next, { emitUpdate: false })
  }, [editor, props.value])

  let listContent: ReactNode = null
  if (options.length > 0) {
    const grouped =
      suggestion?.kind === 'mergeField' && options.some((option) => option.group !== undefined)
    listContent = (
      <div
        id={listId}
        role="listbox"
        aria-label={
          suggestion?.kind === 'mergeField'
            ? messages['richText.mergeFields']
            : messages['mention.list']
        }
        className="max-h-55 overflow-y-auto"
      >
        {options.map((option, index) => (
          <div key={option.value}>
            {grouped &&
              option.group !== options[index - 1]?.group &&
              option.group !== undefined && (
                <div
                  role="presentation"
                  className={cn(
                    'px-2.5 pt-2 pb-1 text-xs font-semibold text-secondary',
                    TEXT_DIRECTION,
                  )}
                >
                  {option.group}
                </div>
              )}
            <div
              id={optionId(listId, index)}
              role="option"
              aria-selected={index === active}
              data-highlighted={index === active ? '' : undefined}
              data-index={index}
              tabIndex={-1}
              className={cn(OPTION, option.candidate !== undefined && 'gap-3 px-2 py-1')}
            >
              {option.candidate === undefined ? (
                <span className={cn('min-w-0 flex-1 truncate', TEXT_DIRECTION)}>
                  {option.label}
                </span>
              ) : (
                <MentionOption candidate={option.candidate} />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const textArea = (
    <div
      className="relative"
      style={{ '--rich-min-height': `calc(${String(minRows)}lh + 16px)` } as CSSProperties}
    >
      {loading ? (
        <div
          aria-busy="true"
          className="flex min-h-(--rich-min-height) flex-col gap-2.5 px-3 py-3 text-sm"
        >
          <span className="sr-only">{messages['field.loading']}</span>
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ) : editor === null ? (
        // Before the editor exists (the first render, or on a server): the same text, drawn.
        <div className="min-h-(--rich-min-height) px-3 py-2">
          <RichText
            value={initial}
            mergeFields={mergeFields}
            empty=""
            {...(props.mergeValues === undefined ? {} : { mergeValues: props.mergeValues })}
            {...(props.now === undefined ? {} : { now: props.now })}
          />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
      {!loading &&
        props.placeholder !== undefined &&
        (snapshot?.empty ?? isRichTextEmpty(initial)) && (
          <p
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute start-3 end-3 top-2 m-0 text-sm leading-normal text-tertiary',
              TEXT_DIRECTION,
            )}
          >
            {props.placeholder}
          </p>
        )}
    </div>
  )

  return (
    <>
      <div
        data-slot="rich-text-field"
        className={cn(
          'overflow-hidden rounded-md border border-solid font-sans transition-colors duration-(--liro-duration-fast) ease-standard',
          'border-control',
          props.surface === 'sunken' ? 'bg-surface-sunken' : 'bg-surface-raised',
          invalid ? 'border-status-danger-fg' : 'focus-within:border-focus',
        )}
      >
        <Toolbar
          editor={editor}
          state={toolbar}
          controls={loading ? undefined : control.id}
          disabled={loading}
          mergeFields={mergeFields}
          onLink={() => {
            live.value.openLink()
          }}
          onInsertMergeField={(key) => {
            editor?.chain().focus().insertContent(mergeNode(key)).run()
          }}
        />
        <ComboboxPopover
          open={visible}
          onOpenChange={(next) => {
            if (!next && suggestion !== null) setDismissed(suggestion.from)
          }}
          onOptionHover={setActive}
          onOptionClick={choose}
          anchor={textArea}
        >
          {listContent}
          {searching && (
            <p
              role="status"
              className={cn('m-0 px-2.5 py-1.5 text-center text-sm text-secondary', TEXT_ISOLATE)}
            >
              {messages['field.loading']}
            </p>
          )}
          {showEmpty && (
            <p
              role="status"
              className={cn('m-0 px-2.5 py-1.5 text-center text-sm text-secondary', TEXT_ISOLATE)}
            >
              {messages['field.noResults']}
            </p>
          )}
        </ComboboxPopover>
      </div>
      {missingKeys.length > 0 && (
        <p
          id={missingId}
          data-slot="merge-missing"
          className="m-0 mt-1 flex items-start gap-1 text-xs leading-tight text-status-warning-fg"
        >
          <AlertTriangle aria-hidden="true" className="mt-px size-3 shrink-0" />
          <span className={TEXT_DIRECTION}>
            {messages['richText.missingValues'](missingLabels)}
          </span>
        </p>
      )}
      {props.maxLength !== undefined && (
        <p
          id={props.counterId}
          className={cn(
            'm-0 mt-1 flex flex-wrap items-center justify-end gap-x-2 text-xs leading-tight tabular-nums',
            over ? 'text-status-danger-fg' : 'text-secondary',
          )}
        >
          {over && (
            <span className="flex items-center gap-1">
              <CircleAlert aria-hidden="true" className="size-3 shrink-0" />
              <span className={TEXT_DIRECTION}>
                {messages['richText.overLimit'](
                  length - props.maxLength,
                  format.number(String(length - props.maxLength)),
                )}
              </span>
            </span>
          )}
          <span aria-hidden="true" className={TEXT_ISOLATE}>
            {messages['richText.count'](
              format.number(String(length)),
              format.number(String(props.maxLength)),
            )}
          </span>
          <span className="sr-only">
            {messages['richText.countLabel'](
              format.number(String(length)),
              format.number(String(props.maxLength)),
            )}
          </span>
        </p>
      )}
      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        current={linkCurrent}
        onApply={(href, typed) => {
          if (editor === null) return
          if (editor.state.selection.empty && !editor.isActive('link')) {
            editor
              .chain()
              .insertContent({
                type: 'text',
                text: typed,
                marks: [{ type: 'link', attrs: { href } }],
              })
              .run()
          } else {
            editor.chain().extendMarkRange('link').setLink({ href }).run()
          }
        }}
        onRemove={() => {
          editor?.chain().extendMarkRange('link').unsetLink().run()
        }}
      />
    </>
  )
}
