import { type ReactNode } from 'react'
import { LiroProvider, numericFormat, useLiro } from '@veljaos/ui'

/*
 * Two pieces the Phase 5 example screens share (first written for group G, P5.24): the tenant's
 * provider settings (`Tenant`) and the page's frame (`Frame`).
 */

/**
 * The tenant's digits in its own time zone (instants with an offset are shown there): numbers and
 * numeric dates as a Serbian company writes them, never its month or weekday names (P5.28 item 2).
 */
const TENANT_DIGITS = numericFormat('sr-Latn-RS', 'Europe/Belgrade')

/**
 * The tenant's settings these screens need beyond the examples' provider: its instants are shown
 * in Europe/Belgrade, whatever the device's zone, and `today` may be the day a screen is set on
 * (the clinic's). The week starts on Monday because the examples' locale names the tenant's region
 * ("en-RS", `tenantLocale`); the calendars count from it. The Core passes both from the tenant's
 * settings.
 */
export function Tenant({ today, children }: { today?: string; children: ReactNode }) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={liro.locale}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      messages={liro.messages}
      format={TENANT_DIGITS}
      today={today ?? liro.today}
      timeZone="Europe/Belgrade"
      linkComponent={liro.linkComponent}
    >
      {children}
    </LiroProvider>
  )
}

/** The page's frame: 24px and the content width on a desktop, 16px on a phone. */
export function Frame({
  phone,
  wide = false,
  children,
}: {
  phone: boolean
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={
        phone
          ? 'box-border flex w-full min-w-0 flex-col gap-4 p-4'
          : wide
            ? 'box-border flex w-full min-w-0 flex-col gap-6 p-6'
            : 'mx-auto box-border flex w-full max-w-content min-w-0 flex-col gap-6 p-6'
      }
    >
      {children}
    </div>
  )
}
