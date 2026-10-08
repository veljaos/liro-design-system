/*
 * The logic of CommandPalette, kept apart from the markup so it can be unit-tested (AGENTS.md C7):
 * which items match what was typed, and which parts of a label to highlight.
 */

/** Lower case in the page's locale, without accents: "Čačak" and "cacak" match. */
export function fold(text: string, locale: string): string {
  return text
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
}

/** The words of a query. */
export function words(query: string): string[] {
  return query
    .trim()
    .split(/\s+/u)
    .filter((word) => word !== '')
}

/**
 * Whether an item matches: every word of the query appears in its label, its description or one
 * of its keywords, ignoring case and accents. An empty query matches everything.
 */
export function commandMatches(
  item: { label: string; description?: string; keywords?: readonly string[] },
  query: string,
  locale: string,
): boolean {
  const haystack = fold(
    [item.label, item.description ?? '', ...(item.keywords ?? [])].join(' '),
    locale,
  )
  return words(query).every((word) => haystack.includes(fold(word, locale)))
}

/** A piece of a label: highlighted when it matches the query. */
export interface LabelPart {
  text: string
  match: boolean
}

/**
 * The label cut into pieces, the ones that match a word of the query highlighted. Case is ignored
 * in the page's locale; accents are compared as written (folding them would move the positions).
 */
export function highlightParts(label: string, query: string, locale: string): LabelPart[] {
  const lower = label.toLocaleLowerCase(locale)
  const marked = new Array<boolean>(label.length).fill(false)
  for (const word of words(query)) {
    const needle = word.toLocaleLowerCase(locale)
    // Only when lowering keeps the length, so positions in `lower` are positions in `label`.
    if (needle === '' || lower.length !== label.length) continue
    let at = lower.indexOf(needle)
    while (at !== -1) {
      marked.fill(true, at, at + needle.length)
      at = lower.indexOf(needle, at + needle.length)
    }
  }
  const parts: LabelPart[] = []
  for (let index = 0; index < label.length; index += 1) {
    const match = marked[index] === true
    const last = parts.at(-1)
    if (last?.match === match) last.text += label.charAt(index)
    else parts.push({ text: label.charAt(index), match })
  }
  return parts
}

/** Whether a key press opens the palette: Ctrl or Cmd with K or P. */
export function opensPalette(event: {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}): boolean {
  const key = event.key.toLowerCase()
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    (key === 'k' || key === 'p')
  )
}
