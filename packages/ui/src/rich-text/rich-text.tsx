import { Fragment, useMemo, type ReactNode } from 'react'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { MENTION_TEXT, MERGE_FIELD_PILL } from './extensions'
import { headingIdsByBlock, type RichTextHeading } from './rich-text-headings'
import {
  headingLevel,
  isRichTextEmpty,
  normalizeRichText,
  richTextFromHtml,
  safeHref,
  type RichTextMark,
  type RichTextNode,
} from './rich-text-logic'

/*
 * RichText (P5.22): the read-only view of a rich text value — what RichTextField shows when it is
 * read-only, and what a record shows of a stored note, letter or comment. It draws from the JSON
 * (preferred) or, without it, from stored HTML, which is first read into the same structure
 * (`richTextFromHtml`, the sanitizer): nothing of the HTML is inserted as it is, so a stored
 * fragment can never run a script or bring its own styles. React elements only, on the server as
 * in the browser.
 *
 * The look is the editor's (RICH_CONTENT, shared with RichTextField): 13px text, 8px between
 * blocks, the heading 16px and the subheading 14px semibold, lists indented 24px from the leading
 * edge, links underlined in the link colour, merge fields as neutral pills with their label (read
 * "Merge field: Customer name"), mentions semibold. Each paragraph and heading takes its direction
 * from its text (`dir="auto"`) and stays at the page's start side (`text-align: match-parent`).
 *
 * `headingIds` (P5.30 e, a long reading page): every h2 and h3 gets a stable id from its words
 * (`richTextHeadings`, the same ids a page's contents list), `tabIndex={-1}` so a contents link can
 * move the focus to it, and a scroll margin under the shell's sticky top (`--liro-shell-top` +
 * 16px), so a heading reached from the contents is never hidden under the shell (WCAG 2.4.11).
 */

/** One field the text can refer to: the Core fills it in when the document is made. */
export interface RichTextMergeField {
  /** The key stored in the value ("customer.name"): letters, digits, ".", "_" and "-". */
  key: string
  /** Its name for the user ("Customer name"). From the application. */
  label: string
  /** A heading the menu and the list group it under ("Customer"). */
  group?: string
}

/** The look of rich text content, in the editor and in the view. */
export const RICH_CONTENT = cn(
  // Blocks 8px apart (a gap: the margins below are all reset, as the package ships no reset).
  'flex flex-col gap-2 font-sans text-sm leading-normal text-primary wrap-break-word [&>*]:min-w-0',
  '[&_li+li]:mt-1 [&_li>*+*]:mt-1',
  '[&_p]:m-0 [&_p]:text-match-parent [&_h2]:m-0 [&_h2]:text-h3 [&_h2]:text-match-parent [&_h3]:m-0 [&_h3]:text-h4 [&_h3]:text-match-parent',
  '[&_ul]:m-0 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_a]:text-link [&_a]:underline [&_strong]:font-bold',
)

export interface RichTextProps {
  /** The value as Tiptap JSON, as RichTextField reports it. Preferred over `html`. */
  value?: RichTextNode | null
  /** Stored HTML, used when `value` is not given; sanitized before it is shown. */
  html?: string | null
  /** The merge fields' labels, so their pills show names instead of keys. */
  mergeFields?: readonly RichTextMergeField[]
  /** Shown when there is nothing to read. Default "—". */
  empty?: ReactNode
  /**
   * Gives every heading an id that starts with this prefix ("article"), for a page's contents
   * (`richTextHeadings(value, prefix)` lists the same ids).
   */
  headingIds?: string
  /** Layout classes (width, margins). */
  className?: string
}

/** A heading's anchor: reached from a page's contents below the shell's sticky top. */
const HEADING_ANCHOR = 'scroll-mt-[calc(var(--liro-shell-top,0px)+16px)] outline-none'

function wrapMarks(content: ReactNode, marks: readonly RichTextMark[] | undefined): ReactNode {
  const has = (type: string) => marks?.some((mark) => mark.type === type) === true
  let out = content
  if (has('underline')) out = <u>{out}</u>
  if (has('italic')) out = <em>{out}</em>
  if (has('bold')) out = <strong>{out}</strong>
  const link = marks?.find((mark) => mark.type === 'link')
  const href = safeHref(link?.attrs?.href)
  if (href !== null) {
    out = (
      <a href={href} rel="noopener noreferrer">
        {out}
      </a>
    )
  }
  return out
}

function attr(node: RichTextNode, name: string): string {
  const value = node.attrs?.[name]
  return typeof value === 'string' ? value : ''
}

/** A merge field's pill: its label shown, "Merge field: <label>" read. */
export function MergeFieldPill({ fieldKey, label }: { fieldKey: string; label: string }) {
  const { messages } = useLiro()
  return (
    <span data-merge-field={fieldKey} className={MERGE_FIELD_PILL}>
      <span className="sr-only">{messages['richText.mergeField'](label)}</span>
      <span aria-hidden="true">{label}</span>
    </span>
  )
}

function Inline({ node, labels }: { node: RichTextNode; labels: ReadonlyMap<string, string> }) {
  switch (node.type) {
    case 'text':
      return wrapMarks(node.text ?? '', node.marks)
    case 'hardBreak':
      return <br />
    case 'mergeField': {
      const key = attr(node, 'key')
      return wrapMarks(<MergeFieldPill fieldKey={key} label={labels.get(key) ?? key} />, node.marks)
    }
    case 'mention':
      return wrapMarks(
        <span data-mention={attr(node, 'id')} className={MENTION_TEXT}>
          @{attr(node, 'label')}
        </span>,
        node.marks,
      )
    default:
      return null
  }
}

function Block({
  node,
  labels,
  heading,
}: {
  node: RichTextNode
  labels: ReadonlyMap<string, string>
  /** A top-level heading's id (RichText's `headingIds`). */
  heading?: RichTextHeading | undefined
}) {
  const children = (node.content ?? []).map((child, index) => (
    <Fragment key={index}>
      {node.type === 'paragraph' || node.type === 'heading' ? (
        <Inline node={child} labels={labels} />
      ) : (
        <Block node={child} labels={labels} />
      )}
    </Fragment>
  ))
  switch (node.type) {
    case 'paragraph':
      // An empty line keeps its height, as in the editor.
      return <p dir="auto">{children.length === 0 ? <br /> : children}</p>
    case 'heading': {
      const anchor =
        heading === undefined ? {} : { id: heading.id, tabIndex: -1, className: HEADING_ANCHOR }
      return headingLevel(node.attrs?.level) === 2 ? (
        <h2 dir="auto" {...anchor}>
          {children}
        </h2>
      ) : (
        <h3 dir="auto" {...anchor}>
          {children}
        </h3>
      )
    }
    case 'bulletList':
      return <ul>{children}</ul>
    case 'orderedList': {
      const start = node.attrs?.start
      return <ol {...(typeof start === 'number' && start > 1 ? { start } : {})}>{children}</ol>
    }
    case 'listItem':
      return <li>{children}</li>
    default:
      return null
  }
}

/**
 * Rich text, read-only: a stored note, letter or comment, from its JSON or its HTML. Use it to
 * show what a RichTextField wrote; never to show HTML from anywhere else as it is.
 */
export function RichText({
  value,
  html,
  mergeFields,
  empty,
  headingIds,
  className,
}: RichTextProps) {
  const doc = useMemo(() => {
    if (value !== undefined && value !== null) return normalizeRichText(value)
    if (typeof html === 'string') return richTextFromHtml(html)
    return null
  }, [value, html])
  const labels = useMemo(
    () => new Map((mergeFields ?? []).map((field) => [field.key, field.label])),
    [mergeFields],
  )
  const headings = useMemo(
    () =>
      doc === null || headingIds === undefined
        ? new Map<number, RichTextHeading>()
        : headingIdsByBlock(doc, headingIds),
    [doc, headingIds],
  )
  if (doc === null || isRichTextEmpty(doc)) {
    return (
      <div className={cn(RICH_CONTENT, className)}>
        <p dir="auto" className="text-secondary">
          {empty ?? '—'}
        </p>
      </div>
    )
  }
  return (
    <div data-slot="rich-text" className={cn(RICH_CONTENT, className)}>
      {(doc.content ?? []).map((block, index) => (
        <Block key={index} node={block} labels={labels} heading={headings.get(index)} />
      ))}
    </div>
  )
}
