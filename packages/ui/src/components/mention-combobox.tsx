import { Bot } from 'lucide-react'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  AUTO_DIRECTION,
  OPTION,
  READ_ONLY,
  TEXT_DIRECTION,
  TEXT_ISOLATE,
} from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Textarea } from '../primitives/textarea'
import { useLiro } from '../provider/liro-provider'
import { ComboboxPopover, optionId } from './combobox-field'
import {
  filterChoices,
  MOVE_KEYS,
  moveActive,
  useDebouncedCallback,
  type MoveKey,
} from './combobox-logic'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import {
  insertMention,
  mentionQueryAt,
  mentionsInText,
  tokenBefore,
  type Mention,
  type MentionQuery,
} from './message-logic'
import { PersonAvatar } from './person'

/*
 * MentionCombobox (P5.1): a multi-line text field in which typing "@" offers people to mention.
 * The candidates come from the application: all of them (the field filters by name, ignoring case
 * and accents, as ComboboxField), or the results of its own search (`onSearch` after 300ms, with
 * `loading`), exactly as ComboboxField. Choosing one writes "@Name " into the text as one token —
 * Backspace right after it removes the whole name — and reports the mentions still in the text
 * (`onMentionsChange`, with their ids), so the application never reads names back into people.
 *
 * **WAI-ARIA:** the combobox pattern on a text area. The focus stays in the text; the list is a
 * listbox under it (the shared ComboboxPopover: a press never takes the focus), the active option
 * is announced through `aria-activedescendant`, the text area says it offers a list
 * (`aria-autocomplete="list"`, `aria-controls` while the list is open). `role="combobox"` is not
 * set: a text area may carry no role (ARIA in HTML), and it stays a multi-line text box. Keys while
 * the list is open: ArrowDown / ArrowUp (wrapping), Home / End, Enter or Tab chooses, Escape
 * closes it until the next "@". Each option: the 26px avatar (the Bot square for an agent), the
 * name and the application's line (a role).
 */

/** A person (or agent) who can be mentioned. */
export interface MentionCandidate {
  /** The application's id, reported with the mention. */
  id: string
  /** The full name, written after "@". */
  name: string
  /** A line under the name in the list ("Accountant"). */
  description?: string
  /** A photo's address. */
  src?: string
  /** An agent, shown with the Bot icon. */
  agent?: boolean
}

export interface MentionComboboxProps extends FieldBaseProps {
  /** Controlled text. */
  value?: string
  /** Uncontrolled initial text. */
  defaultValue?: string
  onChange?: (text: string) => void
  /** Who can be mentioned: everyone, or the results of the application's last search. */
  candidates: readonly MentionCandidate[]
  /** The application searches (after `searchDelay`) and passes the results as `candidates`. */
  onSearch?: (query: string) => void
  /** Milliseconds of quiet before `onSearch`. Default: 300. */
  searchDelay?: number
  /** The application is searching. */
  loading?: boolean
  /** The mentions in the text, whenever they change (a choice, a removal, an edit). */
  onMentionsChange?: (mentions: Mention[]) => void
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name. */
  name?: string
  /** Keys the field itself does not use (the composer sends on Enter). */
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  /** The on-screen keyboard's Enter key. */
  enterKeyHint?: 'enter' | 'send'
}

function sameMentions(a: readonly Mention[], b: readonly Mention[]): boolean {
  return a.length === b.length && a.every((mention, index) => mention.id === b[index]?.id)
}

/** A text area where "@" offers people to mention, each inserted as one token. */
export function MentionCombobox(props: MentionComboboxProps) {
  const { messages, locale } = useLiro()
  const listId = `${useId()}-mentions`
  const [innerText, setInnerText] = useState(props.defaultValue ?? '')
  const text = props.value ?? innerText
  const [chosen, setChosen] = useState<Mention[]>([])
  const [query, setQuery] = useState<MentionQuery | null>(null)
  const [dismissed, setDismissed] = useState<number | null>(null)
  const [active, setActive] = useState(0)
  const reported = useRef<Mention[]>([])
  const area = useRef<HTMLTextAreaElement | null>(null)
  const caretAfter = useRef<number | null>(null)
  const search = useDebouncedCallback(props.onSearch, props.searchDelay ?? 300)

  const options =
    props.onSearch === undefined
      ? filterChoices(
          props.candidates.map((candidate) => ({
            ...candidate,
            value: candidate.id,
            label: candidate.name,
          })),
          query?.query ?? '',
          locale,
        )
      : props.candidates.map((candidate) => ({
          ...candidate,
          value: candidate.id,
          label: candidate.name,
        }))
  const open = query !== null && query.start !== dismissed
  const showEmpty = open && options.length === 0 && props.loading !== true
  const visible = open && (options.length > 0 || props.loading === true || showEmpty)
  const listShown = visible && options.length > 0

  // The caret after an inserted or removed mention, once the new text is in the field.
  useLayoutEffect(() => {
    const caret = caretAfter.current
    if (caret === null || area.current === null) return
    caretAfter.current = null
    area.current.setSelectionRange(caret, caret)
  })

  const report = (nextText: string, nextChosen: readonly Mention[]) => {
    const mentions = mentionsInText(nextText, nextChosen)
    if (!sameMentions(mentions, reported.current)) {
      reported.current = mentions
      props.onMentionsChange?.(mentions)
    }
  }

  const changeText = (nextText: string, nextChosen: readonly Mention[] = chosen) => {
    setInnerText(nextText)
    props.onChange?.(nextText)
    report(nextText, nextChosen)
  }

  const readQuery = (element: HTMLTextAreaElement) => {
    const found =
      element.selectionStart === element.selectionEnd
        ? mentionQueryAt(element.value, element.selectionStart)
        : null
    if (found?.start !== query?.start || found?.query !== query?.query) {
      setQuery(found)
      setActive(0)
      if (found !== null && found.start !== dismissed) search(found.query)
    }
    if (found === null) setDismissed(null)
  }

  const choose = (index: number) => {
    const option = options[index]
    const element = area.current
    if (option === undefined || query === null || element === null) return
    const caret = element.selectionStart
    const inserted = insertMention(text, query, caret, option.name)
    const mention = { id: option.id, name: option.name }
    const nextChosen = [...chosen.filter((each) => each.id !== mention.id), mention]
    setChosen(nextChosen)
    caretAfter.current = inserted.caret
    setQuery(null)
    changeText(inserted.text, nextChosen)
  }

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
          if (listShown && (MOVE_KEYS as readonly string[]).includes(event.key)) {
            event.preventDefault()
            setActive(moveActive(event.key as MoveKey, active, options))
            return
          }
          if (listShown && (event.key === 'Enter' || event.key === 'Tab') && !event.shiftKey) {
            event.preventDefault()
            choose(active)
            return
          }
          if (open && event.key === 'Escape') {
            event.preventDefault()
            setDismissed(query.start)
            return
          }
          if (event.key === 'Backspace' && !control.readOnly) {
            const element = event.currentTarget
            if (element.selectionStart === element.selectionEnd) {
              const token = tokenBefore(element.value, element.selectionStart, chosen)
              if (token !== null) {
                event.preventDefault()
                caretAfter.current = token.start
                changeText(element.value.slice(0, token.start) + element.value.slice(token.end))
                return
              }
            }
          }
          props.onKeyDown?.(event)
        }
        const textarea = (
          <Textarea
            {...attributes}
            ref={area}
            value={text}
            dir={AUTO_DIRECTION.dir}
            aria-autocomplete="list"
            aria-controls={listShown ? listId : undefined}
            aria-activedescendant={listShown && active >= 0 ? optionId(listId, active) : undefined}
            {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
            {...(props.name === undefined ? {} : { name: props.name })}
            {...(props.enterKeyHint === undefined ? {} : { enterKeyHint: props.enterKeyHint })}
            className={cn(
              AUTO_DIRECTION.className,
              'max-h-40 min-h-15 [field-sizing:content]',
              control.readOnly && READ_ONLY,
            )}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
              if (control.readOnly) return
              changeText(event.target.value)
              readQuery(event.target)
            }}
            onSelect={(event) => {
              if (!control.readOnly) readQuery(event.currentTarget)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => {
              setQuery(null)
            }}
          />
        )
        if (control.disabled) return textarea
        let listContent: ReactNode = null
        if (options.length > 0) {
          listContent = (
            <div
              id={listId}
              role="listbox"
              aria-label={messages['mention.list']}
              className="max-h-55 overflow-y-auto"
            >
              {options.map((option, index) => (
                <div
                  key={option.id}
                  id={optionId(listId, index)}
                  role="option"
                  aria-selected={index === active}
                  data-highlighted={index === active ? '' : undefined}
                  data-index={index}
                  tabIndex={-1}
                  className={cn(OPTION, 'gap-3 px-2 py-1')}
                >
                  {option.agent === true ? (
                    <span
                      aria-hidden="true"
                      className="flex size-6.5 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-primary"
                    >
                      <Bot className="size-3.5" />
                    </span>
                  ) : (
                    <PersonAvatar
                      name={option.name}
                      size="sm"
                      {...(option.src === undefined ? {} : { src: option.src })}
                    />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className={cn('truncate', TEXT_DIRECTION)}>{option.name}</span>
                    {option.description !== undefined && (
                      <span className={cn('truncate text-xs', TEXT_DIRECTION)}>
                        {option.description}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )
        }
        return (
          <ComboboxPopover
            open={visible}
            onOpenChange={(next) => {
              if (!next && query !== null) setDismissed(query.start)
            }}
            onOptionHover={setActive}
            onOptionClick={choose}
            anchor={textarea}
          >
            {listContent}
            {props.loading === true && (
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
        )
      }}
    </Field>
  )
}
