/*
 * The logic of the document blocks (P5.18), without React: which note texts a document shows,
 * and whether it has any. Tested in document-blocks.test.tsx.
 */

/** A template text the application offers for a document's notes (the Core's list). */
export interface NoteTemplate {
  value: string
  /** Its name in the list ("Payment terms"). */
  label: string
  /** The text the document shows. */
  text: string
}

/** A document's notes: the chosen templates in order, and the free note. */
export interface DocumentNotesValue {
  templates: readonly string[]
  note: string
}

/**
 * The texts a document shows, in order: the chosen templates as the user chose them (one that
 * is no longer in the list is left out), then the free note when it has any text.
 */
export function chosenNoteTexts(
  templates: readonly NoteTemplate[],
  value: DocumentNotesValue,
): { key: string; text: string }[] {
  const byValue = new Map(templates.map((template) => [template.value, template]))
  const texts: { key: string; text: string }[] = []
  for (const id of value.templates) {
    const template = byValue.get(id)
    if (template !== undefined) texts.push({ key: `template:${id}`, text: template.text })
  }
  if (value.note.trim() !== '') texts.push({ key: 'note', text: value.note.trim() })
  return texts
}

/** Whether a document has notes to show; without them DocumentPage leaves the block out. */
export function hasNotes(templates: readonly NoteTemplate[], value: DocumentNotesValue): boolean {
  return chosenNoteTexts(templates, value).length > 0
}
