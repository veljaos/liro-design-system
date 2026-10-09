/*
 * The logic of CodeInput (P5.6), kept apart from the markup so it can be unit-tested (AGENTS.md
 * C7): which characters a code takes, how typed or pasted text fills the boxes, and where the
 * arrow keys move.
 */

/** 'numeric': digits only (a code sent by text message or an authenticator app). */
export type CodeKind = 'numeric' | 'alphanumeric'

/**
 * The characters of a code in `text`: digits for a numeric code; letters and digits, in upper
 * case, for an alphanumeric one. Spaces, dashes and anything else are dropped, so a code pasted
 * as "123 456" or "ABCD-EFGH" is read whole.
 */
export function codeCharacters(text: string, kind: CodeKind): string[] {
  const allowed = kind === 'numeric' ? /[0-9]/ : /[0-9A-Z]/
  // Western digits only: a code is compared as the server sent it.
  return Array.from(text.toUpperCase()).filter((character) => allowed.test(character))
}

/** The boxes of a value: one character or '' per box; a space in the value is an empty box. */
export function codeBoxes(value: string, length: number): string[] {
  return Array.from({ length }, (_, index) => {
    const character = value[index] ?? ''
    return character === ' ' ? '' : character
  })
}

/** The value of the boxes: an empty box is a space; trailing empty boxes are left out. */
export function codeValue(boxes: readonly string[]): string {
  return boxes
    .map((box) => (box === '' ? ' ' : box))
    .join('')
    .trimEnd()
}

/** Every box holds a character. */
export function codeComplete(boxes: readonly string[]): boolean {
  return boxes.length > 0 && boxes.every((box) => box !== '')
}

/**
 * The boxes after `text` was typed or pasted into the box at `index`, and the box that takes the
 * focus. A text with at least as many characters as there are boxes is a whole code: it fills
 * every box from the first, whichever box it was pasted into. A shorter text fills the boxes from
 * `index` on. A text without a usable character changes nothing.
 */
export function fillCode(
  boxes: readonly string[],
  index: number,
  text: string,
  kind: CodeKind,
): { boxes: string[]; focus: number } {
  const characters = codeCharacters(text, kind)
  const length = boxes.length
  if (characters.length === 0) return { boxes: [...boxes], focus: index }
  if (characters.length >= length) {
    return { boxes: characters.slice(0, length), focus: length - 1 }
  }
  const next = [...boxes]
  characters.forEach((character, offset) => {
    if (index + offset < length) next[index + offset] = character
  })
  return { boxes: next, focus: Math.min(index + characters.length, length - 1) }
}

/**
 * The box the focus moves to from `index` for a key, or null when the key does not move it. The
 * boxes run in `direction` (CodeInput writes a code left to right in every language, as numbers
 * are); the arrow that points forward moves forward (Appendix B.7: from the leading edge).
 */
export function codeKeyTarget(
  key: string,
  index: number,
  length: number,
  direction: 'ltr' | 'rtl',
): number | null {
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  let target: number
  switch (key) {
    case forward:
      target = index + 1
      break
    case backward:
      target = index - 1
      break
    case 'Home':
      target = 0
      break
    case 'End':
      target = length - 1
      break
    default:
      return null
  }
  return target >= 0 && target < length && target !== index ? target : null
}

/**
 * Backspace in the box at `index`: a box with a character is emptied and keeps the focus; an
 * empty box empties the one before it and moves there.
 */
export function eraseCode(
  boxes: readonly string[],
  index: number,
): { boxes: string[]; focus: number } {
  const next = [...boxes]
  if (next[index] !== '' && next[index] !== undefined) {
    next[index] = ''
    return { boxes: next, focus: index }
  }
  if (index === 0) return { boxes: next, focus: 0 }
  next[index - 1] = ''
  return { boxes: next, focus: index - 1 }
}
