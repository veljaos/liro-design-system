/*
 * The logic of barcode scanning, kept apart from the markup so it can
 * be unit-tested. A hardware scanner is a keyboard: it "types" the code in a burst,
 * a few milliseconds per character, and ends it with Enter. A person types more slowly (100ms or
 * more between keys). A burst of at least SCAN_MIN_LENGTH characters, each within
 * SCAN_MAX_INTERVAL of the one before, is a scan.
 */

/** The longest pause between two characters of one scan, in milliseconds. */
export const SCAN_MAX_INTERVAL = 50

/** The fewest characters a scan has (the shortest common codes, EAN-8 and UPC-E, have 8). */
export const SCAN_MIN_LENGTH = 4

export interface ScanOptions {
  /** Default SCAN_MAX_INTERVAL. */
  maxInterval?: number
  /** Default SCAN_MIN_LENGTH. */
  minLength?: number
}

/** Whether characters typed at these times (ms, in order) came from a scanner or a person. */
export function scanDecision(
  times: readonly number[],
  options: ScanOptions = {},
): 'scan' | 'typing' {
  const maxInterval = options.maxInterval ?? SCAN_MAX_INTERVAL
  const minLength = options.minLength ?? SCAN_MIN_LENGTH
  if (times.length < minLength) return 'typing'
  for (let index = 1; index < times.length; index += 1) {
    const previous = times[index - 1] ?? 0
    const current = times[index] ?? 0
    if (current - previous > maxInterval) return 'typing'
  }
  return 'scan'
}

/** The characters of a burst being received, and when each arrived. */
export interface ScanBuffer {
  text: string
  times: readonly number[]
}

export const EMPTY_SCAN_BUFFER: ScanBuffer = { text: '', times: [] }

/**
 * One key of a page-wide listener (PosShell `onScan`): a character joins the burst, or starts a
 * new one after a pause; Enter ends it, giving the code when the burst was a scan. Other keys
 * (Shift, which a scanner sends for capitals) change nothing.
 */
export function scanKey(
  buffer: ScanBuffer,
  key: string,
  time: number,
  options: ScanOptions = {},
): { buffer: ScanBuffer; code: string | null } {
  const maxInterval = options.maxInterval ?? SCAN_MAX_INTERVAL
  if (key === 'Enter') {
    const code =
      buffer.text !== '' && scanDecision(buffer.times, options) === 'scan' ? buffer.text : null
    return { buffer: EMPTY_SCAN_BUFFER, code }
  }
  if (key.length !== 1) return { buffer, code: null }
  const last = buffer.times.at(-1)
  if (last === undefined || time - last > maxInterval) {
    return { buffer: { text: key, times: [time] }, code: null }
  }
  return { buffer: { text: buffer.text + key, times: [...buffer.times, time] }, code: null }
}
