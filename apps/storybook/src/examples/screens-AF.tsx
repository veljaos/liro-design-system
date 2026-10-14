import { useState } from 'react'
import { notice, useLiro } from '@veljaos/ui'
import {
  distanceMeters,
  LocationCheck,
  type LocationFix,
  type LocationState,
} from '../../../../packages/ui/src/map'
import type { ExampleRoute } from './example-app'
import { EmployeePortal, Page } from './screens-Y'
import { AF_ROUTES, FIX_AT_SITE, FIX_ON_THE_WAY, SITE_GATE, SITE_RADIUS } from './data-AE'

/*
 * Group AF's example screen (P5.41, a location check): Nikola Marković checks in at the site
 * "Liman 4" from his phone on 14.10.2026, in Kvadrat Gradnja's employee portal (group Y). The
 * application asks the browser for the position when he presses "Use my location" (here: a fixed
 * answer after a moment), measures the distance to the site gate (`distanceMeters`), and decides:
 * inside 150 m he may check in; outside, unknown or with location turned off, the check-in is
 * unavailable with its reason. No tiles: nothing is fetched.
 */

export { AF_ROUTES }

type Start = 'inside' | 'outside' | 'unknown' | 'denied'

function SiteCheckIn({ phone, start }: { phone: boolean; start: Start }) {
  const { format } = useLiro()
  const [fix, setFix] = useState<LocationFix | null>(
    start === 'inside' ? FIX_AT_SITE : start === 'outside' ? FIX_ON_THE_WAY : null,
  )
  const [checkedIn, setCheckedIn] = useState(false)
  const metres = fix === null ? null : distanceMeters(fix, SITE_GATE)
  // The application's verdict.
  const state: LocationState =
    start === 'denied' && fix === null
      ? 'denied'
      : metres === null
        ? 'unknown'
        : metres <= SITE_RADIUS
          ? 'inside'
          : 'outside'
  const reason =
    state === 'outside'
      ? 'Check in when you are at the site.'
      : state === 'denied'
        ? 'Location is needed to check in at this site.'
        : state === 'unknown'
          ? 'Share your location first.'
          : undefined
  return (
    <EmployeePortal phone={phone} current="shifts">
      <Page>
        <LocationCheck
          layout={phone ? 'phone' : 'desktop'}
          label="Site Liman 4"
          detail="Bulevar cara Lazara 4, Novi Sad · Morning shift 07:00–15:00"
          area={{ kind: 'circle', centre: SITE_GATE, radius: SITE_RADIUS }}
          areaText="Within 150 m of the site gate"
          position={fix}
          state={state}
          {...(state === 'outside'
            ? { stateDetail: 'Kvadrat Gradnja asks for your position at the site to check in.' }
            : state === 'denied'
              ? {
                  stateDetail:
                    'Location is turned off for this site. Allow it in your browser’s settings, or ask your site manager to check you in.',
                }
              : checkedIn && fix !== null
                ? { stateDetail: `Checked in at ${format.time(fix.at)}.` }
                : {})}
          {...(metres === null
            ? {}
            : { distance: `${format.number(String(Math.round(metres)))} m from the site gate` })}
          onLocate={() =>
            new Promise<void>((resolve) => {
              window.setTimeout(() => {
                setFix(FIX_AT_SITE)
                resolve()
              }, 400)
            })
          }
          action={{
            label: checkedIn ? 'Checked in' : 'Check in',
            onClick: () => {
              setCheckedIn(true)
              notice.success('Checked in at Site Liman 4.')
            },
            ...(reason === undefined
              ? checkedIn
                ? { unavailableReason: 'You are already checked in for this shift.' }
                : {}
              : { unavailableReason: reason }),
          }}
        />
      </Page>
    </EmployeePortal>
  )
}

export const GROUP_AF_ROUTES: ExampleRoute[] = [
  { path: AF_ROUTES.checkIn, render: (phone) => <SiteCheckIn phone={phone} start="inside" /> },
  { path: AF_ROUTES.outside, render: (phone) => <SiteCheckIn phone={phone} start="outside" /> },
  { path: AF_ROUTES.unknown, render: (phone) => <SiteCheckIn phone={phone} start="unknown" /> },
  { path: AF_ROUTES.denied, render: (phone) => <SiteCheckIn phone={phone} start="denied" /> },
]
