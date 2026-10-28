import { cn } from '../primitives/cn'

/*
 * FileName (P5.93 item 5, the owner's fourth review: "long attachment names truncated in the
 * middle with the full name on hover/focus"). A file's name on one line: when it does not fit, the
 * middle gives way ("Izvestaj_o_izvrsenim_rad…konacna_verzija.pdf"), so its start and its end —
 * the version, the date, the extension — stay readable; a word is never broken. The whole name
 * stays in the text (only drawn shorter), so it is read and found in full; the place that shows it
 * puts the library's Tooltip with the whole name on the element that takes the focus (a link, a
 * tile), so the full name also shows on hover and on keyboard focus.
 */

/** How many characters of the name, before its extension, always stay at its end. */
export const FILE_NAME_TAIL = 10

/** The longest extension kept whole at the end (".docx", ".tar.gz" counts its last part). */
const EXTENSION_MAX = 8

/**
 * A file's name split for middle truncation: the start (which gives way) and the end that always
 * shows — the extension and up to `tail` characters before it. Short names are all start.
 */
export function splitFileName(name: string, tail: number = FILE_NAME_TAIL): [string, string] {
  const dot = name.lastIndexOf('.')
  const extension = dot > 0 && name.length - dot <= EXTENSION_MAX ? name.slice(dot) : ''
  const base = name.slice(0, name.length - extension.length)
  // Too short to give way in the middle: a start of at least as much as the end.
  if (base.length <= tail * 2) return [name, '']
  return [base.slice(0, base.length - tail), base.slice(base.length - tail) + extension]
}

export interface FileNameProps {
  name: string
  /** Text classes (size, weight, colour). */
  className?: string
}

/** A file's name on one line, shortened in the middle when it does not fit. */
export function FileName({ name, className }: FileNameProps) {
  const [start, end] = splitFileName(name)
  return (
    <bdi dir="auto" data-slot="file-name" className={cn('flex min-w-0 max-w-full', className)}>
      <span className="min-w-0 truncate">{start}</span>
      {end !== '' && <span className="shrink-0 whitespace-pre">{end}</span>}
    </bdi>
  )
}
