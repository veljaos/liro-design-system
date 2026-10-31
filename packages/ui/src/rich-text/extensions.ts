import { Extension, Node, mergeAttributes, type Extensions } from '@tiptap/core'
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import HardBreak from '@tiptap/extension-hard-break'
import Heading from '@tiptap/extension-heading'
import Italic from '@tiptap/extension-italic'
import Link from '@tiptap/extension-link'
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import { UndoRedo } from '@tiptap/extensions'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { HEADING_LEVELS, linkFromInput, MERGE_FIELD_KEY, safeHref } from './rich-text-logic'

/*
 * The editor's schema: Tiptap's MIT extensions only — document, paragraph, text, heading
 * (levels 2 and 3), bold, italic, underline, link, bulleted and numbered lists, line break, undo —
 * and three of our own: the merge field and the mention (atomic inline nodes) and the direction of
 * each block (`dir="auto"`, as a decoration, so the JSON stays free of it). Nothing else can enter
 * the document: what the schema does not know is dropped when HTML is pasted or set.
 */

/** Class names of the pills, shared with RichText (rich-text.tsx). */
const MERGE_FIELD_SHAPE =
  'inline-block rounded-sm border border-solid px-1 font-medium leading-tight whitespace-nowrap'

export const MERGE_FIELD_PILL = `${MERGE_FIELD_SHAPE} border-default bg-surface-sunken text-primary`

/**
 * A merge field without a value where the values were given: dashed, in the warning tone;
 * its name says "No value" too, never the look alone.
 */
export const MERGE_FIELD_MISSING = `${MERGE_FIELD_SHAPE} border-dashed border-status-warning-border bg-status-warning-bg text-status-warning-fg`

/** A mention: the name after "@", semibold, as MentionText. */
export const MENTION_TEXT = 'font-semibold text-primary'

/** The selected atom (a pill chosen with the arrows or a click) shows the focus ring. */
const SELECTED_NODE =
  '[&.ProseMirror-selectednode]:outline-2 [&.ProseMirror-selectednode]:outline-offset-1 [&.ProseMirror-selectednode]:outline-focus'

export interface MergeFieldOptions {
  /** The label of a key, from the application's list (the key when it is not there). */
  labelOf: (key: string) => string
  /** The name assistive technology reads: "Merge field: Customer name". */
  nameOf: (label: string) => string
  /** The values were given and this key has none: drawn and read as "No value". */
  missingOf?: (key: string) => boolean
  /** The name read for a field without a value: "No value: Incident date". */
  missingNameOf?: (label: string) => string
}

/**
 * A merge field: an atomic inline node with its key. JSON `{ type: 'mergeField', attrs: { key } }`;
 * HTML `<span data-merge-field="key">{{key}}</span>`; plain text "{{key}}". Drawn as a neutral
 * pill with its label, read as "Merge field: <label>".
 */
export const MergeField = Node.create<MergeFieldOptions>({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() {
    return { labelOf: (key) => key, nameOf: (label) => label }
  },
  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (element) => (element.getAttribute('data-merge-field') ?? '').trim(),
        renderHTML: (attributes) => ({ 'data-merge-field': String(attributes.key) }),
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-merge-field]',
        getAttrs: (element) =>
          MERGE_FIELD_KEY.test((element.getAttribute('data-merge-field') ?? '').trim())
            ? null
            : false,
      },
    ]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), `{{${String(node.attrs.key)}}}`]
  },
  renderText({ node }) {
    return `{{${String(node.attrs.key)}}}`
  },
  addNodeView() {
    return ({ node }) => {
      const key = String(node.attrs.key)
      const label = this.options.labelOf(key)
      const missing = this.options.missingOf?.(key) === true
      const dom = document.createElement('span')
      dom.setAttribute('data-merge-field', key)
      if (missing) dom.setAttribute('data-missing', '')
      dom.className = `${missing ? MERGE_FIELD_MISSING : MERGE_FIELD_PILL} ${SELECTED_NODE}`
      const name = document.createElement('span')
      name.className = 'sr-only'
      name.textContent =
        missing && this.options.missingNameOf !== undefined
          ? this.options.missingNameOf(label)
          : this.options.nameOf(label)
      const shown = document.createElement('span')
      shown.setAttribute('aria-hidden', 'true')
      shown.textContent = label
      dom.append(name, shown)
      return { dom }
    }
  },
})

/**
 * A mention: an atomic inline node with the person's id and name. JSON
 * `{ type: 'mention', attrs: { id, label } }`; HTML `<span data-mention="id">@Name</span>`.
 */
export const Mention = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-mention') ?? '',
        renderHTML: (attributes) => ({ 'data-mention': String(attributes.id) }),
      },
      label: {
        default: '',
        parseHTML: (element) => element.textContent.trim().replace(/^@/u, ''),
        renderHTML: () => ({}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-mention]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), `@${String(node.attrs.label)}`]
  },
  renderText({ node }) {
    return `@${String(node.attrs.label)}`
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span')
      dom.setAttribute('data-mention', String(node.attrs.id))
      dom.className = `${MENTION_TEXT} rounded-sm ${SELECTED_NODE}`
      dom.textContent = `@${String(node.attrs.label)}`
      return { dom }
    }
  },
})

function directions(doc: ProseMirrorNode): DecorationSet {
  const decorations: Decoration[] = []
  doc.descendants((node, position) => {
    if (!node.isTextblock) return true
    decorations.push(Decoration.node(position, position + node.nodeSize, { dir: 'auto' }))
    return false
  })
  return DecorationSet.create(doc, decorations)
}

/** Every paragraph and heading takes its direction from its own text (`dir="auto"`). */
const BlockDirection = Extension.create({
  name: 'blockDirection',
  addProseMirrorPlugins() {
    const key = new PluginKey<DecorationSet>('blockDirection')
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_config, state) => directions(state.doc),
          apply: (transaction, previous) =>
            transaction.docChanged ? directions(transaction.doc) : previous,
        },
        props: {
          decorations: (state) => key.getState(state),
        },
      }),
    ]
  },
})

/** Ctrl/Cmd+K opens the link dialog. */
const LinkShortcut = Extension.create<{ open: () => void }>({
  name: 'linkShortcut',
  addOptions() {
    return { open: () => undefined }
  },
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        this.options.open()
        return true
      },
    }
  },
})

/**
 * A list item without Tab and Shift+Tab: in a form, Tab moves to the next field (WCAG 2.1.2); the
 * lists are one level.
 */
const FlatListItem = ListItem.extend({
  addKeyboardShortcuts() {
    return { Enter: () => this.editor.commands.splitListItem(this.name) }
  },
})

/** The extensions of one RichTextField. */
export function richTextExtensions(
  options: MergeFieldOptions & { openLink: () => void },
): Extensions {
  return [
    Document,
    Paragraph,
    Text,
    Heading.configure({ levels: [...HEADING_LEVELS] }),
    Bold,
    Italic,
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      // A link in the text being edited is not a stop of its own (a click puts the caret in it):
      // out of the tab order, as in any contenteditable, and so not a pointer target of its own.
      HTMLAttributes: { rel: 'noopener noreferrer', target: null, class: null, tabindex: '-1' },
      isAllowedUri: (url) => safeHref(url) !== null,
      shouldAutoLink: (url) => linkFromInput(url) !== null,
    }),
    BulletList,
    OrderedList,
    FlatListItem,
    HardBreak,
    UndoRedo,
    MergeField.configure({
      labelOf: options.labelOf,
      nameOf: options.nameOf,
      ...(options.missingOf === undefined ? {} : { missingOf: options.missingOf }),
      ...(options.missingNameOf === undefined ? {} : { missingNameOf: options.missingNameOf }),
    }),
    Mention,
    BlockDirection,
    LinkShortcut.configure({ open: options.openLink }),
  ]
}
