import type { Editor } from '@tiptap/core'
import {
  Bold,
  Braces,
  ChevronDown,
  Italic,
  Link2,
  List,
  ListOrdered,
  RemoveFormatting,
  Underline,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenu as MenuRoot,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { useLiro } from '../provider/liro-provider'
import type { RichTextMergeField } from './rich-text'
import { toolbarKeyTarget } from './rich-text-logic'

/*
 * The formatting toolbar of RichTextField (P5.22), the WAI-ARIA toolbar pattern: one control in
 * the tab order (the last one used), the arrows move between the controls (following the screen in
 * right-to-left) and wrap, Home and End go to the ends. Every control is named from messages and
 * says its state: the toggles with `aria-pressed`, the style menu with the current style. A press
 * with the pointer keeps the focus (and the selection) in the text; a key press keeps it in the
 * toolbar, as the pattern's rich text example does. The menus put the focus back into the text
 * after a choice.
 *
 * Look: 28px controls (the compact icon button's size, targets ≥ 24px), radius sm, text.secondary;
 * hover surface.hover; pressed: the neutral selection — surface.selected with a border.selected
 * border and text.primary — never blue (D17).
 */

/** The state of the text at the caret, as the toolbar shows it. */
export interface ToolbarState {
  bold: boolean
  italic: boolean
  underline: boolean
  link: boolean
  bulletList: boolean
  orderedList: boolean
  block: 'paragraph' | 'heading' | 'subheading'
}

export const IDLE_TOOLBAR: ToolbarState = {
  bold: false,
  italic: false,
  underline: false,
  link: false,
  bulletList: false,
  orderedList: false,
  block: 'paragraph',
}

const CONTROL = cn(
  BUTTON_RESET,
  'inline-flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-sm border border-solid border-transparent text-sm text-secondary transition-colors duration-(--liro-duration-fast) ease-standard select-none',
  'enabled:hover:bg-surface-hover enabled:hover:text-primary',
  'aria-pressed:border-selected aria-pressed:bg-surface-selected aria-pressed:text-primary enabled:aria-pressed:hover:bg-surface-selected',
  'data-[state=open]:bg-surface-hover data-[state=open]:text-primary',
  'disabled:cursor-not-allowed disabled:text-disabled',
  FOCUS_RING,
)

export interface ToolbarProps {
  editor: Editor | null
  state: ToolbarState
  /** The id of the text the toolbar formats (none while it is loading). */
  controls: string | undefined
  disabled: boolean
  mergeFields: readonly RichTextMergeField[]
  onLink: () => void
  onInsertMergeField: (key: string) => void
}

/** The formatting toolbar above the text. */
export function Toolbar({
  editor,
  state,
  controls,
  disabled,
  mergeFields,
  onLink,
  onInsertMergeField,
}: ToolbarProps) {
  const { messages, direction } = useLiro()
  const [current, setCurrent] = useState(0)
  // The controls: 0 style, 1–3 bold / italic / underline, 4–5 lists, 6 link, 7 merge fields
  // (when offered), then clear formatting.
  const total = mergeFields.length > 0 ? 9 : 8
  const roving = current < total ? current : 0
  // A menu choice returns the focus to the text; Escape returns it to the menu's button.
  const chose = useRef(false)

  const run = (command: (editor: Editor) => void) => {
    if (editor !== null) command(editor)
  }
  const afterMenu = (event: Event) => {
    if (!chose.current) return
    chose.current = false
    event.preventDefault()
    editor?.commands.focus()
  }

  /** The roving tab index and focus handling of the control at `index`. */
  const rove = (index: number) => {
    return {
      'data-toolbar-control': index,
      tabIndex: index === roving ? 0 : -1,
      onFocus: () => {
        setCurrent(index)
      },
      disabled,
    }
  }

  /** A toggle (`pressed` true or false) or, with `pressed` null, an action. */
  const control = (
    index: number,
    label: string,
    Icon: LucideIcon,
    pressed: boolean | null,
    command: (editor: Editor) => void,
    shortcut?: string,
  ) => (
    <button
      type="button"
      {...rove(index)}
      aria-label={label}
      title={label}
      {...(pressed === null ? {} : { 'aria-pressed': pressed })}
      {...(shortcut === undefined ? {} : { 'aria-keyshortcuts': shortcut })}
      className={cn(CONTROL, 'w-7')}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={() => {
        run(command)
      }}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  )

  const styles: { value: ToolbarState['block']; label: string }[] = [
    { value: 'paragraph', label: messages['richText.paragraph'] },
    { value: 'heading', label: messages['richText.heading'] },
    { value: 'subheading', label: messages['richText.subheading'] },
  ]
  const currentStyle = styles.find((style) => style.value === state.block) ?? styles[0]

  const groups = new Map<string, RichTextMergeField[]>()
  for (const field of mergeFields) {
    const group = field.group ?? ''
    groups.set(group, [...(groups.get(group) ?? []), field])
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = toolbarKeyTarget(event.key, roving, total, direction)
    if (target === null) return
    event.preventDefault()
    setCurrent(target)
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-toolbar-control="${String(target)}"]`)
      ?.focus()
  }

  const separator = (
    <span
      aria-hidden="true"
      className="mx-1 h-4 w-0 shrink-0 border-0 border-s border-solid border-default"
    />
  )
  let mergeMenu: ReactNode = null
  if (mergeFields.length > 0) {
    mergeMenu = (
      <MenuRoot modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            {...rove(7)}
            aria-label={messages['richText.insertMergeField']}
            title={messages['richText.insertMergeField']}
            className={cn(CONTROL, 'px-1.5')}
            onMouseDown={(event) => {
              // Radix opens the menu on pointer down; the text keeps its selection.
              if (event.button === 0) event.preventDefault()
            }}
          >
            <Braces aria-hidden="true" className="size-4" />
            <ChevronDown aria-hidden="true" className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-w-80" onCloseAutoFocus={afterMenu}>
          {[...groups.entries()].map(([group, fields]) => (
            <DropdownMenuGroup key={group}>
              {group !== '' && <DropdownMenuLabel>{group}</DropdownMenuLabel>}
              {fields.map((field) => (
                <DropdownMenuItem
                  key={field.key}
                  onSelect={() => {
                    chose.current = true
                    onInsertMergeField(field.key)
                  }}
                >
                  <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{field.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </MenuRoot>
    )
  }

  return (
    <div
      role="toolbar"
      aria-label={messages['richText.toolbar']}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-0.5 border-0 border-b border-solid border-default px-1 py-1"
    >
      <MenuRoot modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            {...rove(0)}
            aria-label={messages['richText.textStyleCurrent'](currentStyle?.label ?? '')}
            title={messages['richText.textStyle']}
            className={cn(CONTROL, 'ps-2 pe-1.5')}
            onMouseDown={(event) => {
              if (event.button === 0) event.preventDefault()
            }}
          >
            <span className={cn('whitespace-nowrap', TEXT_DIRECTION)}>{currentStyle?.label}</span>
            <ChevronDown aria-hidden="true" className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onCloseAutoFocus={afterMenu}>
          <DropdownMenuRadioGroup
            value={state.block}
            onValueChange={(value) => {
              chose.current = true
              run((each) => {
                const chain = each.chain()
                if (value === 'heading') chain.setHeading({ level: 2 }).run()
                else if (value === 'subheading') chain.setHeading({ level: 3 }).run()
                else chain.setParagraph().run()
              })
            }}
          >
            {styles.map((style) => (
              <DropdownMenuRadioItem key={style.value} value={style.value}>
                <span
                  className={cn(
                    TEXT_DIRECTION,
                    style.value === 'heading' && 'text-h3',
                    style.value === 'subheading' && 'text-h4',
                  )}
                >
                  {style.label}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </MenuRoot>
      {separator}
      {control(
        1,
        messages['richText.bold'],
        Bold,
        state.bold,
        (each) => each.chain().toggleBold().run(),
        'Control+B Meta+B',
      )}
      {control(
        2,
        messages['richText.italic'],
        Italic,
        state.italic,
        (each) => each.chain().toggleItalic().run(),
        'Control+I Meta+I',
      )}
      {control(
        3,
        messages['richText.underline'],
        Underline,
        state.underline,
        (each) => each.chain().toggleUnderline().run(),
        'Control+U Meta+U',
      )}
      {separator}
      {control(4, messages['richText.bulletList'], List, state.bulletList, (each) =>
        each.chain().toggleBulletList().run(),
      )}
      {control(5, messages['richText.numberedList'], ListOrdered, state.orderedList, (each) =>
        each.chain().toggleOrderedList().run(),
      )}
      {separator}
      {control(6, messages['richText.link'], Link2, state.link, onLink, 'Control+K Meta+K')}
      {mergeMenu}
      {control(
        mergeFields.length > 0 ? 8 : 7,
        messages['richText.clearFormatting'],
        RemoveFormatting,
        null,
        (each) => each.chain().unsetAllMarks().clearNodes().run(),
      )}
    </div>
  )
}
