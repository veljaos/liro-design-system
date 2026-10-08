import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import {
  frameReducer,
  hostMessage,
  INITIAL_FRAME_STATE,
  originAllowed,
  readViewerMessage,
  targetOrigin,
  zoomStep,
  type FrameState,
  type HostMessage,
} from './document-frame-protocol'
import { ErrorState } from './empty-state'
import { Skeleton } from './progress'

export {
  FRAME_PROTOCOL,
  FRAME_VERSION,
  frameReducer,
  hostMessage,
  INITIAL_FRAME_STATE,
  originAllowed,
  readViewerMessage,
  targetOrigin,
  ZOOM_STEPS,
  zoomStep,
} from './document-frame-protocol'
export type { FrameState, HostMessage, ViewerMessage } from './document-frame-protocol'

/*
 * DocumentFrame (BUILD-PLAN P5.5; the protocol in docs/document-frame.md): a document viewer from
 * another origin (the Core's PDF viewer, a signing service's preview) in a sandboxed iframe, with
 * the Design System's toolbar around it.
 *
 * - Isolation: `sandbox="allow-scripts"` — no `allow-same-origin` unless the application allows
 *   it (`allowSameOrigin`), no forms, popups, top navigation or downloads; no referrer. Every
 *   message is checked: it must come from this frame's own window, from `allowedOrigin` exactly,
 *   and match the protocol (`readViewerMessage`, tested); anything else is ignored. Messages to
 *   the viewer go to `allowedOrigin` only ("*" only for an opaque origin, "null", which cannot be
 *   named; they carry only a page number or a zoom level).
 * - The viewer owns its state: the toolbar asks ('goToPage', 'setZoom') and shows what the viewer
 *   reports back ('ready', 'page', 'zoom'), never a guess.
 * - Toolbar (a row above the frame, 8px by 12px, a 1px border.default line under it): previous
 *   and next page (28px compact buttons, the chevrons mirrored in right-to-left), "Page 3 of 12"
 *   (both numbers through `format.number`, announced politely), zoom out, the zoom level through
 *   `format.percent`, zoom in (steps 50–300%, `ZOOM_STEPS`). Buttons are disabled at the ends and
 *   until the viewer is ready.
 * - Loading: a page-shaped skeleton over the frame until 'ready'; the region is `aria-busy`.
 *   Error: the viewer's 'error', or no 'ready' within `timeout` (default 20 s): an ErrorState
 *   ("The document could not be shown.", or the viewer's own text) with "Try again", which loads
 *   the frame anew.
 * - The frame: radius md, a 1px border.default border, the sunken surface behind the pages; its
 *   height is the application's (`className`, default 480px).
 */

export interface DocumentFrameProps {
  /** Names the frame for assistive technology ("Employment contract RU-2026-017"). */
  title: string
  /** The viewer's address (on `allowedOrigin`). */
  src?: string
  /** The viewer as a document (stories, tests); its origin is opaque: `allowedOrigin` "null". */
  srcDoc?: string
  /** The viewer's origin exactly ("https://viewer.liro.rs"); "null" for an opaque origin. */
  allowedOrigin: string
  /** Gives the viewer its own origin's rights (cookies, storage). Default false. */
  allowSameOrigin?: boolean
  /** How long to wait for the viewer's 'ready', in ms. Default 20000. */
  timeout?: number
  /** Called with what the viewer reports (page, count, zoom, status). */
  onStateChange?: (state: FrameState) => void
  /** Layout classes (the frame's height, e.g. "h-[70vh]"). */
  className?: string
}

/** How long the frame waits for the viewer's 'ready' by default. */
export const FRAME_TIMEOUT = 20_000

function ToolButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <ButtonPrimitive
      family="neutral"
      emphasis="menu"
      shape="compact"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </ButtonPrimitive>
  )
}

/** A document viewer from another origin, sandboxed, with page and zoom controls. */
export function DocumentFrame(props: DocumentFrameProps) {
  const { messages, format } = useLiro()
  const frame = useRef<HTMLIFrameElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, dispatch] = useReducer(frameReducer, INITIAL_FRAME_STATE)
  const [timedOut, setTimedOut] = useState(false)
  const timeout = props.timeout ?? FRAME_TIMEOUT
  const { allowedOrigin, onStateChange } = props

  useEffect(() => {
    const listen = (event: MessageEvent) => {
      const own = frame.current?.contentWindow
      if (own === null || own === undefined || event.source !== own) return
      if (!originAllowed(event.origin, allowedOrigin)) return
      const message = readViewerMessage(event.data)
      if (message !== null) dispatch(message)
    }
    window.addEventListener('message', listen)
    return () => {
      window.removeEventListener('message', listen)
    }
  }, [allowedOrigin])

  useEffect(() => {
    if (state.status !== 'loading') return
    const timer = window.setTimeout(() => {
      setTimedOut(true)
    }, timeout)
    return () => {
      window.clearTimeout(timer)
    }
  }, [state.status, timeout, attempt])

  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  const send = (message: HostMessage) => {
    frame.current?.contentWindow?.postMessage(hostMessage(message), targetOrigin(allowedOrigin))
  }
  const retry = () => {
    dispatch({ type: 'loading' })
    setTimedOut(false)
    setAttempt((count) => count + 1)
  }

  const failed = state.status === 'error' || (timedOut && state.status === 'loading')
  const ready = state.status === 'ready' && !failed
  const zoomOut = zoomStep(state.zoom, 'out')
  const zoomIn = zoomStep(state.zoom, 'in')
  const sandbox =
    props.allowSameOrigin === true ? 'allow-scripts allow-same-origin' : 'allow-scripts'

  return (
    <div
      data-slot="document-frame"
      data-status={failed ? 'error' : state.status}
      className={cn(
        'flex h-120 min-h-0 flex-col overflow-hidden rounded-md border border-solid border-default bg-surface-sunken font-sans',
        props.className,
      )}
    >
      <div
        role="group"
        aria-label={messages['frame.toolbar']}
        className="flex flex-wrap items-center gap-x-4 gap-y-1 border-0 border-b border-solid border-default bg-surface-raised px-3 py-2"
      >
        <div className="flex items-center gap-1">
          <ToolButton
            label={messages['frame.previousPage']}
            disabled={!ready || state.page <= 1}
            onClick={() => {
              send({ type: 'goToPage', page: state.page - 1 })
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </ToolButton>
          <span
            role="status"
            className={cn(
              'min-w-24 text-center text-xs whitespace-nowrap tabular-nums',
              ready ? 'text-primary' : 'text-tertiary',
              TEXT_DIRECTION,
            )}
          >
            {ready &&
              messages['frame.page'](
                state.page,
                format.number(String(state.page)),
                state.pageCount,
                format.number(String(state.pageCount)),
              )}
          </span>
          <ToolButton
            label={messages['frame.nextPage']}
            disabled={!ready || state.page >= state.pageCount}
            onClick={() => {
              send({ type: 'goToPage', page: state.page + 1 })
            }}
          >
            <ChevronRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </ToolButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolButton
            label={messages['frame.zoomOut']}
            disabled={!ready || zoomOut === null}
            onClick={() => {
              if (zoomOut !== null) send({ type: 'setZoom', zoom: zoomOut })
            }}
          >
            <ZoomOut aria-hidden="true" className="size-4" />
          </ToolButton>
          <span
            className={cn(
              'min-w-12 text-center text-xs whitespace-nowrap tabular-nums',
              ready ? 'text-primary' : 'text-tertiary',
            )}
          >
            {ready && (
              <>
                <span className="sr-only">
                  {messages['frame.zoom'](format.percent(String(state.zoom)))}
                </span>
                <span aria-hidden="true">{format.percent(String(state.zoom))}</span>
              </>
            )}
          </span>
          <ToolButton
            label={messages['frame.zoomIn']}
            disabled={!ready || zoomIn === null}
            onClick={() => {
              if (zoomIn !== null) send({ type: 'setZoom', zoom: zoomIn })
            }}
          >
            <ZoomIn aria-hidden="true" className="size-4" />
          </ToolButton>
        </div>
      </div>
      <div className="relative min-h-0 flex-1" aria-busy={state.status === 'loading' && !failed}>
        <iframe
          key={attempt}
          ref={frame}
          title={props.title}
          sandbox={sandbox}
          referrerPolicy="no-referrer"
          {...(props.src === undefined ? {} : { src: props.src })}
          {...(props.srcDoc === undefined ? {} : { srcDoc: props.srcDoc })}
          className={cn(
            'absolute inset-0 box-border size-full border-0',
            (failed || state.status === 'loading') && 'invisible',
          )}
        />
        {state.status === 'loading' && !failed && (
          <div
            data-slot="document-frame-loading"
            className="absolute inset-0 flex justify-center overflow-hidden p-6"
          >
            <span className="sr-only">{messages['frame.loading']}</span>
            <div className="flex w-full max-w-120 flex-col gap-3 rounded-sm bg-surface-raised p-8">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-6">
            <ErrorState
              compact
              title={messages['frame.error']}
              description={
                state.status === 'error'
                  ? (state.error ?? messages['empty.errorDescription'])
                  : messages['frame.timeout']
              }
              action={{ label: messages['frame.retry'], onClick: retry }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
