import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import {
  ConnectionState,
  EnvironmentMarker,
  ImpersonationBar,
  minutesLeft,
  OfflineIndicator,
  untilNextMinute,
} from './shell-markers'

const NOW = Date.parse('2026-10-06T14:07:30+02:00')

function render(node: React.ReactNode, locale = 'en') {
  return renderToStaticMarkup(
    <LiroProvider locale={locale} format={createFormat(locale)}>
      {node}
    </LiroProvider>,
  )
}

describe('minutesLeft', () => {
  it('rounds up to whole minutes, so the last minute reads "1"', () => {
    expect(minutesLeft('2026-10-06T14:30:00+02:00', NOW)).toBe(23)
    expect(minutesLeft('2026-10-06T14:08:00+02:00', NOW)).toBe(1)
    expect(minutesLeft('2026-10-06T14:07:31+02:00', NOW)).toBe(1)
  })

  it('is 0 at and after the end, and null for an unreadable instant', () => {
    expect(minutesLeft('2026-10-06T14:07:30+02:00', NOW)).toBe(0)
    expect(minutesLeft('2026-10-06T12:00:00+02:00', NOW)).toBe(0)
    expect(minutesLeft('half past two', NOW)).toBeNull()
  })

  it('reads the offset of the instant, not the device zone', () => {
    // 12:30 UTC is 14:30 in Novi Sad.
    expect(minutesLeft('2026-10-06T12:30:00Z', NOW)).toBe(23)
  })
})

describe('untilNextMinute', () => {
  it('waits until the shown number changes, not a fixed tick', () => {
    // 22 min 30 s left: the number (23) changes in 30 s.
    expect(untilNextMinute('2026-10-06T14:30:00+02:00', NOW)).toBe(30_000)
    // Exactly 2 minutes left: it changes in a full minute.
    expect(untilNextMinute('2026-10-06T14:09:30+02:00', NOW)).toBe(60_000)
  })

  it('stops after the end or for an unreadable instant', () => {
    expect(untilNextMinute('2026-10-06T14:00:00+02:00', NOW)).toBeNull()
    expect(untilNextMinute('soon', NOW)).toBeNull()
  })
})

describe('ImpersonationBar', () => {
  it('says whose account, the mode, the reason and the exit, as a named region', () => {
    const html = render(
      <ImpersonationBar
        person="Milica Petrović"
        mode="Read-only"
        reason="Support request 4821"
        onExit={() => undefined}
      />,
    )
    expect(html).toContain('aria-label="Session as another user"')
    expect(html).toContain('Viewing as Milica Petrović')
    expect(html).toContain('Read-only')
    expect(html).toContain('Reason: Support request 4821')
    expect(html).toContain('>Exit<')
    expect(html).not.toContain('Close')
  })

  it('writes the minutes left through the provider, and "Time is up" after the end', () => {
    const later = new Date(Date.now() + 1_234 * 60_000 - 5_000).toISOString()
    expect(
      render(<ImpersonationBar person="A" endsAt={later} onExit={() => undefined} />, 'sr-Latn-RS'),
    ).toContain('1.234 minutes left')
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(
      render(<ImpersonationBar person="A" endsAt={past} onExit={() => undefined} />),
    ).toContain('Time is up')
  })
})

describe('OfflineIndicator', () => {
  it('shows the strip only while offline, with the application’s text', () => {
    const offline = render(<OfflineIndicator offline waiting="3 changes are waiting." />)
    expect(offline).toContain('Offline')
    expect(offline).toContain('3 changes are waiting.')
    const online = render(<OfflineIndicator offline={false} waiting="3 changes are waiting." />)
    expect(online).not.toContain('3 changes are waiting.')
    // The live region stays in the page, empty, so a later change is announced.
    expect(online).toContain('role="status"')
  })
})

describe('EnvironmentMarker', () => {
  it('reads the name after "Environment:" and is never blue', () => {
    const html = render(<EnvironmentMarker label="Sandbox" />)
    expect(html).toContain('Environment:')
    expect(html).toContain('Sandbox')
    expect(html).toContain('status-warning')
    expect(html).not.toContain('status-info')
  })
})

describe('ConnectionState', () => {
  it('names each state in words, with the clock time from the instant', () => {
    const at = '2026-10-06T09:42:00+02:00'
    expect(render(<ConnectionState status="local" at={at} />)).toContain(
      'Saved on this device at 09:42 AM',
    )
    expect(render(<ConnectionState status="sending" />)).toContain('Sending…')
    expect(render(<ConnectionState status="sent" />)).toContain('>Sent<')
    const failed = render(<ConnectionState status="failed" onRetry={() => undefined} />)
    expect(failed).toContain('Not sent')
    expect(failed).toContain('Send again')
    expect(render(<ConnectionState status="failed" />)).not.toContain('Send again')
    expect(render(<ConnectionState status="sent" onRetry={() => undefined} />)).not.toContain(
      'Send again',
    )
  })
})
