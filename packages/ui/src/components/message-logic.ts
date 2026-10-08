/*
 * The logic of the Message family and MentionCombobox (P5.1), kept apart from the markup so it can
 * be unit-tested (AGENTS.md C7): which messages start a run under their author's name, and
 * mentions. A mention is written into the text as "@" and the
 * person's name ("@Ivana Stojanović"); the component keeps the list of mentions chosen (their ids)
 * beside the text and reports it to the application. Text and ids travel together: the application
 * never parses names back into people.
 */

/** A person (or agent) that was mentioned. */
export interface Mention {
  /** The application's id of the person. */
  id: string
  /** The name as inserted after "@". */
  name: string
}

/** The mention being typed: where its "@" is and what follows it up to the caret. */
export interface MentionQuery {
  /** The index of the "@". */
  start: number
  /** The text typed after "@" (may be empty). */
  query: string
}

/** The longest query still read as a mention (names with spaces fit; a sentence does not). */
export const MENTION_QUERY_MAX = 40

/**
 * The mention being typed before the caret, or null: an "@" at the start of the text or after a
 * space or line break, followed up to the caret by at most `MENTION_QUERY_MAX` characters without
 * a line break or another "@", and with at most two spaces (a first, middle and last name). An "@"
 * inside a word (an e-mail address) is not a mention.
 */
export function mentionQueryAt(text: string, caret: number): MentionQuery | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  const previous = at === 0 ? '' : before.charAt(at - 1)
  if (previous !== '' && !/\s/u.test(previous)) return null
  const query = before.slice(at + 1)
  if (query.length > MENTION_QUERY_MAX || /[\n@]/u.test(query)) return null
  if (query.startsWith(' ')) return null
  if ((query.match(/ /gu) ?? []).length > 2) return null
  return { start: at, query }
}

/**
 * The text after choosing a mention: the typed "@query" is replaced by "@Name " and the caret goes
 * after the space.
 */
export function insertMention(
  text: string,
  query: MentionQuery,
  caret: number,
  name: string,
): { text: string; caret: number } {
  const token = `@${name} `
  return {
    text: text.slice(0, query.start) + token + text.slice(caret),
    caret: query.start + token.length,
  }
}

/**
 * The mention token that ends exactly at the caret ("…@Ivana Stojanović|"), for Backspace to remove
 * it whole: a mention is one token, not letters to delete one by one. Null when none ends there.
 */
export function tokenBefore(
  text: string,
  caret: number,
  mentions: readonly Mention[],
): { start: number; end: number } | null {
  for (const mention of mentions) {
    const token = `@${mention.name}`
    const start = caret - token.length
    if (start < 0 || text.slice(start, caret) !== token) continue
    const previous = start === 0 ? '' : text.charAt(start - 1)
    if (previous === '' || /\s/u.test(previous)) return { start, end: caret }
  }
  return null
}

/** The mentions still present in the text ("@Name" as a whole word), each once, in their order. */
export function mentionsInText(text: string, mentions: readonly Mention[]): Mention[] {
  const found: { mention: Mention; index: number }[] = []
  const seen = new Set<string>()
  for (const mention of mentions) {
    if (seen.has(mention.id)) continue
    const index = tokenIndex(text, mention.name, 0)
    if (index < 0) continue
    seen.add(mention.id)
    found.push({ mention, index })
  }
  return found.sort((a, b) => a.index - b.index).map((each) => each.mention)
}

/** The index of "@name" as a token (at a word start, ending at a word end) from `from`, or -1. */
function tokenIndex(text: string, name: string, from: number): number {
  const token = `@${name}`
  let index = text.indexOf(token, from)
  while (index >= 0) {
    const previous = index === 0 ? '' : text.charAt(index - 1)
    const next = text.charAt(index + token.length)
    const startsWord = previous === '' || /\s/u.test(previous)
    const endsWord = next === '' || !/[\p{L}\p{N}]/u.test(next)
    if (startsWord && endsWord) return index
    index = text.indexOf(token, index + 1)
  }
  return -1
}

/** A piece of a message's text: plain text, or a mention. */
export type MentionPart = { kind: 'text'; text: string } | { kind: 'mention'; mention: Mention }

/** The text cut into plain parts and mention tokens, so a message can show its mentions. */
export function splitMentions(text: string, mentions: readonly Mention[]): MentionPart[] {
  const tokens: { start: number; end: number; mention: Mention }[] = []
  // Longer names first, so "@Ana Marija" is not read as "@Ana".
  const byLength = [...mentions].sort((a, b) => b.name.length - a.name.length)
  for (const mention of byLength) {
    let index = tokenIndex(text, mention.name, 0)
    while (index >= 0) {
      const end = index + mention.name.length + 1
      if (!tokens.some((token) => index < token.end && end > token.start)) {
        tokens.push({ start: index, end, mention })
      }
      index = tokenIndex(text, mention.name, index + 1)
    }
  }
  tokens.sort((a, b) => a.start - b.start)
  const parts: MentionPart[] = []
  let position = 0
  for (const token of tokens) {
    if (token.start > position)
      parts.push({ kind: 'text', text: text.slice(position, token.start) })
    parts.push({ kind: 'mention', mention: token.mention })
    position = token.end
  }
  if (position < text.length) parts.push({ kind: 'text', text: text.slice(position) })
  return parts
}

/** The longest pause, in minutes, within which one author's messages form one run. */
export const RUN_MINUTES = 5

/**
 * Whether a message starts a run (its header shows the author and the time): the first message,
 * a different author than the previous one, another day, or more than `RUN_MINUTES` after it.
 * Messages of one run show only their bubbles, as a conversation reads.
 */
export function startsRun(
  previous: { authorKey: string; at: string } | undefined,
  message: { authorKey: string; at: string },
): boolean {
  if (previous === undefined) return true
  if (previous.authorKey !== message.authorKey) return true
  if (previous.at.slice(0, 10) !== message.at.slice(0, 10)) return true
  const gap = Date.parse(message.at) - Date.parse(previous.at)
  return Number.isNaN(gap) || gap > RUN_MINUTES * 60_000 || gap < 0
}
