import { Clock, Crosshair, LocateFixed, LogIn, Ruler } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { UnavailableAction } from '../components/actions'
import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { MapCanvas, type CanvasShape, type MapTiles } from './map-canvas'
import {
  circleBounds,
  geometryBounds,
  unionBounds,
  type LatLng,
  type MapAreaGeometry,
} from './map-logic'

/*
 * LocationCheck (BUILD-PLAN P5.41): is the person at the workplace? Made for a phone first. The
 * workplace's allowed area (a circle of metres or a polygon, from the application) and the
 * person's reported position with its accuracy circle, on a map; the state in words and a tone —
 * inside, outside, unknown, denied — always as the application decides it (it measures with
 * `distanceMeters` or its own rules); "Use my location" asks the application (`onLocate`), which
 * asks the browser and passes the position back: the library never calls `navigator.geolocation`.
 * The check-in is the application's action, unavailable with its reason in words when it may not
 * be used. Everything the map shows is also said in words (the position's accuracy and time,
 * the distance the application gives); the map is never mirrored.
 */

/** The allowed area: a circle of `radius` metres around `centre`, or a polygon. */
export type LocationArea =
  | { kind: 'circle'; centre: LatLng; radius: number }
  | { kind: 'polygon'; geometry: MapAreaGeometry }

/** A position the application got from the browser. */
export interface LocationFix extends LatLng {
  /** How sure it is, in metres (the browser's `coords.accuracy`), as a decimal string. */
  accuracy: string
  /** When it was taken: an instant ("2026-10-14T06:58:00+02:00"). */
  at: string
}

/** The application's verdict. */
export type LocationState = 'inside' | 'outside' | 'unknown' | 'denied'

export const LOCATION_STATES: readonly LocationState[] = ['inside', 'outside', 'unknown', 'denied']

/** Each state's tone and words. */
const STATE_LOOK: Readonly<
  Record<
    LocationState,
    {
      tone: 'success' | 'warning' | 'neutral'
      message: 'location.inside' | 'location.outside' | 'location.unknown' | 'location.denied'
    }
  >
> = {
  inside: { tone: 'success', message: 'location.inside' },
  outside: { tone: 'warning', message: 'location.outside' },
  unknown: { tone: 'neutral', message: 'location.unknown' },
  denied: { tone: 'warning', message: 'location.denied' },
}

/** The action that needs the place: checking in, from the application. */
export interface LocationAction {
  label: string
  onClick: () => void
  /** Why it cannot be used now, in the application's words; the action is then unavailable. */
  unavailableReason?: string
}

export interface LocationCheckProps {
  /** The workplace ("Site Liman 4"): the heading and the map's name. */
  label: string
  /** A line under it (the address). */
  detail?: string
  area: LocationArea
  /** The allowed area in words ("Within 150 m of the site gate"). */
  areaText?: string
  /** The person's position; absent or null when not known. */
  position?: LocationFix | null
  /** The application's verdict. */
  state: LocationState
  /** More about the state, in the application's words (why outside, how to turn location on). */
  stateDetail?: string
  /** How far the person is, in the application's words ("320 m from the allowed area"). */
  distance?: string
  /** Asks the application for the position; a returned promise shows "Finding your location…". */
  onLocate?: () => void | Promise<void>
  /** The application is finding the position (controlled). */
  locating?: boolean
  /** The check-in (or any action that needs the place). */
  action?: LocationAction
  /** The application's base map; without it only the area and the position are drawn. */
  tiles?: MapTiles
  /** The map's height in pixels. Default 260 on phones, 380 on a desktop. */
  height?: number
  /** Default: from the viewport (below 48em 'phone'). */
  layout?: 'desktop' | 'phone'
  className?: string
}

function Fact({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-secondary">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className={TEXT_DIRECTION}>{children}</span>
    </li>
  )
}

/** A workplace's allowed area, the person's position and the application's verdict. */
export function LocationCheck(props: LocationCheckProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const height = props.height ?? (phone ? 260 : 380)
  const [waiting, setWaiting] = useState(false)
  const [ready, setReady] = useState(false)
  const locating = props.locating === true || waiting
  const look = STATE_LOOK[props.state]
  const position = props.position ?? null

  const shapes = useMemo((): CanvasShape[] => {
    const list: CanvasShape[] = [
      props.area.kind === 'circle'
        ? {
            kind: 'circle',
            id: 'allowed',
            centre: props.area.centre,
            radius: props.area.radius,
            look: 'allowed',
          }
        : {
            kind: 'area',
            id: 'allowed',
            geometry: props.area.geometry,
            tone: 'neutral',
            selected: false,
            interactive: false,
          },
    ]
    if (position !== null) {
      const accuracy = Number(position.accuracy)
      if (Number.isFinite(accuracy) && accuracy > 0) {
        list.push({
          kind: 'circle',
          id: 'accuracy',
          centre: position,
          radius: accuracy,
          look: 'accuracy',
        })
      }
      list.push({ kind: 'dot', id: 'position', at: position, look: 'position' })
    }
    return list
  }, [props.area, position])

  const bounds = useMemo(() => {
    const area =
      props.area.kind === 'circle'
        ? circleBounds(props.area.centre, props.area.radius)
        : geometryBounds(props.area.geometry)
    if (position === null) return area
    const accuracy = Number(position.accuracy)
    return unionBounds([
      area,
      circleBounds(position, Number.isFinite(accuracy) && accuracy > 0 ? accuracy : 0),
    ])
  }, [props.area, position])

  const locate = () => {
    const result = props.onLocate?.()
    if (result instanceof Promise) {
      setWaiting(true)
      void result.finally(() => {
        setWaiting(false)
      })
    }
  }

  const panel = (
    <div className={cn('flex min-w-0 flex-col gap-4', !phone && 'w-96 shrink-0')}>
      <div className="flex flex-col gap-1">
        <h2 className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>{props.label}</h2>
        {props.detail !== undefined && (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{props.detail}</p>
        )}
      </div>
      <div data-slot="location-state" data-state={props.state}>
        <Alert tone={look.tone} title={messages[look.message]}>
          {props.stateDetail}
        </Alert>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {props.areaText !== undefined && <Fact icon={Crosshair}>{props.areaText}</Fact>}
        {props.distance !== undefined && <Fact icon={Ruler}>{props.distance}</Fact>}
        {position !== null && (
          <>
            <Fact icon={LocateFixed}>
              {messages['location.accuracy'](format.number(position.accuracy))}
            </Fact>
            <Fact icon={Clock}>{messages['location.takenAt'](format.time(position.at))}</Fact>
          </>
        )}
      </ul>
      <div className={cn('flex flex-col gap-2', !phone && 'items-start')}>
        {props.onLocate !== undefined && (
          <Button
            family="neutral"
            icon={LocateFixed}
            label={locating ? messages['location.locating'] : messages['location.locate']}
            disabled={locating}
            onClick={locate}
          />
        )}
        {props.action !== undefined &&
          (props.action.unavailableReason === undefined ? (
            <Button
              family="primary"
              emphasis="primary"
              icon={LogIn}
              label={props.action.label}
              onClick={props.action.onClick}
            />
          ) : (
            <UnavailableAction
              family="primary"
              emphasis="primary"
              icon={LogIn}
              label={props.action.label}
              reason={props.action.unavailableReason}
            />
          ))}
      </div>
      {locating && (
        <span className="sr-only" role="status">
          {messages['location.locating']}
        </span>
      )}
    </div>
  )

  return (
    <div
      data-slot="location-check"
      {...(ready ? { 'data-ready': '' } : {})}
      className={cn(
        'flex min-w-0 gap-4',
        phone ? 'flex-col' : 'flex-row items-start',
        props.className,
      )}
    >
      {panel}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <MapCanvas
          label={messages['map.name'](props.label)}
          shapes={shapes}
          bounds={bounds}
          tiles={props.tiles}
          height={height}
          onReady={() => {
            setReady(true)
          }}
        />
        <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
          <li className="flex items-center gap-1.5 text-xs text-secondary">
            <span className="box-border size-3 rounded-full border-2 border-dashed border-control bg-surface-sunken" />
            <span className={TEXT_DIRECTION}>{messages['location.allowed']}</span>
          </li>
          {position !== null && (
            <li className="flex items-center gap-1.5 text-xs text-secondary">
              <span className="box-border size-3 rounded-full border-2 border-solid border-default bg-surface-inverse" />
              <span className={TEXT_DIRECTION}>{messages['location.position']}</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
