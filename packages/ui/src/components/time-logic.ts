/*
 * Reading a typed time of day (P5.90 item 12), without React: the one parser of TimeField,
 * ClockRecordList's correction and any other place a time is typed. Quick entry, as the date
 * fields read "010326": "630", "0630" and "6:30" are 06:30, "1430" is 14:30; with seconds "630" is
 * 06:30:00. The value is a clock time of the tenant, "HH:MM" or "HH:MM:SS" on a 24-hour clock;
 * unreadable text is null (B.4), never midnight.
 */

/** How a time is read. */
export interface TimeTextOptions {
  /** The value carries seconds ("HH:MM:SS"); typed without them they are ":00". */
  seconds?: boolean
}

/** Arabic-Indic (U+0660…) and Eastern Arabic-Indic (U+06F0…) digits as ASCII digits. */
function asciiDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => String((digit.codePointAt(0) ?? 0) % 16))
}

/** "am" / "pm" (also "a", "p", "a.m.") at the end, and the text before it. */
function meridiem(text: string): { rest: string; half: 'am' | 'pm' | null } {
  const match = /^(.*?)\s*([ap])\.?\s*(m\.?)?$/i.exec(text)
  if (match === null) return { rest: text, half: null }
  return {
    rest: match[1] ?? '',
    half: (match[2] ?? '').toLowerCase() === 'a' ? 'am' : 'pm',
  }
}

/** The hours, minutes and seconds of the digits and separators typed, or null. */
function timeParts(text: string): [string, string, string] | null {
  const separated = /^(\d{1,2})[:.,h ](\d{2})(?:[:.,](\d{2}))?$/.exec(text)
  if (separated !== null) return [separated[1] ?? '', separated[2] ?? '', separated[3] ?? '00']
  if (!/^\d{1,6}$/.test(text)) return null
  // Digits only, read from the end: the last pairs are seconds and minutes, the rest the hours.
  if (text.length <= 2) return [text, '00', '00']
  if (text.length <= 4) return [text.slice(0, -2), text.slice(-2), '00']
  return [text.slice(0, -4), text.slice(-4, -2), text.slice(-2)]
}

/**
 * A time of day as typed — "630", "0630", "6:30", "6.30", "06h30", "1430", "6:30 pm", "7" — as
 * "HH:MM" (with `seconds`, "HH:MM:SS": "630" is "06:30:00", "63015" is "06:30:15"), or null when
 * it is not a time of day. Empty text is null too; the caller tells empty from unreadable. Seconds
 * typed into a field without them are not dropped silently: the text is unreadable.
 */
export function parseTimeText(text: string, options: TimeTextOptions = {}): string | null {
  const { rest, half } = meridiem(asciiDigits(text.trim()))
  const parts = timeParts(rest.trim())
  if (parts === null) return null
  const [hoursText, minutes, seconds] = parts
  let hours = Number(hoursText)
  if (half !== null) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (half === 'pm' ? 12 : 0)
  }
  if (hours > 23 || Number(minutes) > 59 || Number(seconds) > 59) return null
  if (!options.seconds && seconds !== '00') return null
  const clock = `${String(hours).padStart(2, '0')}:${minutes}`
  return options.seconds ? `${clock}:${seconds}` : clock
}

/** Whether a value is a time of day as TimeField keeps it ("HH:MM", with `seconds` "HH:MM:SS"). */
export function isTimeValue(value: string, options: TimeTextOptions = {}): boolean {
  const pattern = options.seconds
    ? /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
    : /^([01]\d|2[0-3]):[0-5]\d$/
  return pattern.test(value)
}
