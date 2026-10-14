import type { RichTextNode } from './rich-text-logic'

/*
 * Filling merge fields with values (BUILD-PLAN P5.38): a template's preview with the
 * application's sample data. Pure and tested (merge-fill.test.ts). The application fills real
 * messages on its server; these only draw the preview.
 */

/** A merge field written in plain text, as the subject line has it: "{{invoice.number}}". */
const PLAIN_FIELD = /\{\{\s*([A-Za-z0-9_.-]{1,64})\s*\}\}/g

/**
 * The document with each merge field whose key has a value replaced by that value as text (its
 * marks kept: a bold field stays bold). A field without a value stays a field, so the preview
 * shows what is still missing.
 */
export function fillMergeFields(
  doc: RichTextNode,
  values: Readonly<Record<string, string>>,
): RichTextNode {
  if (doc.type === 'mergeField') {
    const key = doc.attrs?.key
    if (typeof key === 'string' && Object.hasOwn(values, key)) {
      return {
        type: 'text',
        text: values[key] ?? '',
        ...(doc.marks === undefined ? {} : { marks: doc.marks }),
      }
    }
    return doc
  }
  if (doc.content === undefined) return doc
  const content = doc.content
    .map((child) => fillMergeFields(child, values))
    // An empty value leaves no empty text node behind (ProseMirror refuses them).
    .filter((child) => child.type !== 'text' || (child.text ?? '') !== '')
  return { ...doc, content }
}

/**
 * A plain text ("Invoice {{invoice.number}} from {{company.name}}") with the fields that have a
 * value replaced; the others stay as written.
 */
export function fillMergeText(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(PLAIN_FIELD, (whole, key: string) =>
    Object.hasOwn(values, key) ? (values[key] ?? '') : whole,
  )
}

/** The keys a plain text refers to, each once, in order. */
export function mergeTextKeys(text: string): string[] {
  const keys: string[] = []
  for (const match of text.matchAll(PLAIN_FIELD)) {
    const key = match[1]
    if (key !== undefined && !keys.includes(key)) keys.push(key)
  }
  return keys
}
