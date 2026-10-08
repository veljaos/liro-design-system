/*
 * The message protocol between DocumentFrame and the document viewer it hosts (P5.5), documented
 * for viewer authors in docs/document-frame.md. Every message is a plain object sent with
 * `postMessage`:
 *
 *   { protocol: 'liro-document-frame', version: 1, type: <name>, …payload }
 *
 * Viewer → host: 'loading', 'ready' (page, pageCount, zoom), 'page' (page, pageCount), 'zoom'
 * (zoom), 'error' (message?). Host → viewer: 'goToPage' (page), 'setZoom' (zoom). The viewer owns
 * the state: the host asks, and shows only what the viewer reports back.
 *
 * Pages count from 1. Zoom is a whole percentage (100 = actual size). Nothing here trusts the
 * message: anything that does not match exactly is ignored.
 */

export const FRAME_PROTOCOL = 'liro-document-frame'
export const FRAME_VERSION = 1

/** A message from the viewer. */
export type ViewerMessage =
  | { type: 'loading' }
  | { type: 'ready'; page: number; pageCount: number; zoom: number }
  | { type: 'page'; page: number; pageCount: number }
  | { type: 'zoom'; zoom: number }
  | { type: 'error'; message?: string }

/** A message to the viewer. */
export type HostMessage = { type: 'goToPage'; page: number } | { type: 'setZoom'; zoom: number }

/** The zoom levels the toolbar steps through, in percent. */
export const ZOOM_STEPS: readonly number[] = [50, 75, 100, 125, 150, 200, 300]

/** The smallest and largest zoom a viewer may report, in percent. */
export const ZOOM_LIMITS = { min: 10, max: 1000 } as const

/** The longest error text taken from a viewer (more is cut off, never shown whole). */
export const ERROR_TEXT_LIMIT = 300

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPage(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1
}

function isZoom(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= ZOOM_LIMITS.min &&
    value <= ZOOM_LIMITS.max
  )
}

/**
 * Reads a message from the viewer, or `null` when it is not one: another protocol, another
 * version, an unknown type, or a payload of the wrong shape (a page past the count, a zoom that is
 * not a number). The origin and the sender are checked before this (`originAllowed`).
 */
export function readViewerMessage(data: unknown): ViewerMessage | null {
  if (!isRecord(data)) return null
  if (data.protocol !== FRAME_PROTOCOL || data.version !== FRAME_VERSION) return null
  switch (data.type) {
    case 'loading':
      return { type: 'loading' }
    case 'ready':
      if (!isPage(data.page) || !isPage(data.pageCount) || data.page > data.pageCount) return null
      if (!isZoom(data.zoom)) return null
      return { type: 'ready', page: data.page, pageCount: data.pageCount, zoom: data.zoom }
    case 'page':
      if (!isPage(data.page) || !isPage(data.pageCount) || data.page > data.pageCount) return null
      return { type: 'page', page: data.page, pageCount: data.pageCount }
    case 'zoom':
      return isZoom(data.zoom) ? { type: 'zoom', zoom: data.zoom } : null
    case 'error':
      if (data.message === undefined) return { type: 'error' }
      if (typeof data.message !== 'string') return null
      return { type: 'error', message: data.message.slice(0, ERROR_TEXT_LIMIT) }
    default:
      return null
  }
}

/** The envelope of a message to the viewer. */
export function hostMessage(message: HostMessage) {
  return { protocol: FRAME_PROTOCOL, version: FRAME_VERSION, ...message }
}

/**
 * Whether a message's origin is the viewer's. Exact comparison only: no prefixes, no wildcards.
 * A viewer in a sandbox without `allow-same-origin` (or one given as `srcdoc`) has an opaque
 * origin, which arrives as the string "null"; the application then passes "null", and the sender
 * check (the message must come from the frame's own window) is what ties it to this frame.
 */
export function originAllowed(origin: string, allowedOrigin: string): boolean {
  return origin === allowedOrigin
}

/**
 * The target origin for messages to the viewer: its origin, so a frame navigated elsewhere never
 * receives them; "*" only for an opaque origin, which cannot be named (the messages carry nothing
 * but a page number or a zoom level).
 */
export function targetOrigin(allowedOrigin: string): string {
  return allowedOrigin === 'null' ? '*' : allowedOrigin
}

/** The next zoom step in a direction, or `null` at the end of the steps. */
export function zoomStep(zoom: number, direction: 'in' | 'out'): number | null {
  if (direction === 'in') return ZOOM_STEPS.find((step) => step > zoom) ?? null
  const smaller = ZOOM_STEPS.filter((step) => step < zoom)
  return smaller[smaller.length - 1] ?? null
}

/** What the host knows about the viewer. */
export interface FrameState {
  status: 'loading' | 'ready' | 'error'
  page: number
  pageCount: number
  zoom: number
  /** The viewer's own error text, when it gave one. */
  error?: string
}

export const INITIAL_FRAME_STATE: FrameState = {
  status: 'loading',
  page: 1,
  pageCount: 1,
  zoom: 100,
}

/**
 * The host's state after a message. 'page' and 'zoom' before 'ready' are kept (a viewer may report
 * its first page while it loads) but do not end the loading; anything after an error is ignored
 * until the frame is loaded again.
 */
export function frameReducer(state: FrameState, message: ViewerMessage): FrameState {
  if (state.status === 'error' && message.type !== 'loading') return state
  switch (message.type) {
    case 'loading':
      return { ...INITIAL_FRAME_STATE }
    case 'ready':
      return {
        status: 'ready',
        page: message.page,
        pageCount: message.pageCount,
        zoom: message.zoom,
      }
    case 'page':
      return { ...state, page: message.page, pageCount: message.pageCount }
    case 'zoom':
      return { ...state, zoom: message.zoom }
    case 'error':
      return message.message === undefined
        ? { ...state, status: 'error' }
        : { ...state, status: 'error', error: message.message }
  }
}
