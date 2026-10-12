import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { MyShifts } from './my-shifts'
import { durationText, timeTexts } from './shift-parts'
import { ShiftPlanner } from './shift-planner'
import {
  BALANCE_PLAN,
  BALANCE_ROWS,
  HEALTH_ASSIGNMENTS,
  HEALTH_CONFLICTS,
  HEALTH_ROWS,
  HEALTH_TEMPLATES,
  MY_SHIFTS,
  WEEK,
} from './shift-story-data'
import { WorkingTimeBalance } from './working-time-balance'

const SERBIAN = createFormat('sr-Latn-RS')

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={SERBIAN} today="2026-10-06" weekStartsOn={1}>
      {node}
    </LiroProvider>,
  )
}

/** The markup without tags, for text checks. */
function text(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

describe('shift texts', () => {
  it('shows a template that crosses midnight with (+1) and reads it as the next day', () => {
    expect(timeTexts(SERBIAN, messagesEn, '22:00', '06:00')).toEqual({
      shown: '22:00–06:00 (+1)',
      spoken: '22:00 to 06:00 the next day',
    })
    expect(timeTexts(SERBIAN, messagesEn, '07:00', '15:00').shown).toBe('07:00–15:00')
  })

  it('writes a length in hours and minutes, never rounded', () => {
    expect(durationText(SERBIAN, messagesEn, '22:00', '06:00')).toBe('8 h')
    expect(durationText(SERBIAN, messagesEn, '06:00', '13:30')).toBe('7 h 30 min')
    expect(durationText(SERBIAN, messagesEn, 'x', '13:30')).toBeNull()
  })
})

describe('ShiftPlanner', () => {
  const planner = (extra: Partial<Parameters<typeof ShiftPlanner>[0]> = {}) =>
    render(
      <ShiftPlanner
        label="Shifts"
        rows={HEALTH_ROWS}
        templates={HEALTH_TEMPLATES}
        assignments={HEALTH_ASSIGNMENTS}
        conflicts={HEALTH_CONFLICTS}
        start={WEEK.start}
        end={WEEK.end}
        layout="desktop"
        onChange={() => undefined}
        {...extra}
      />,
    )

  it('names each cell by person, day, assignments in words and conflicts', () => {
    const html = planner()
    expect(html).toContain(
      'aria-label="Jelena Popović, petak, 9. oktobar 2026.: Morning, 06:00 to 14:00; Morning, 06:00 to 14:00, Changed; Problem: Double booking: Morning at Emergency and at Klisa clinic; Warning: Weekly hours above the illustrative limit of 48 h"',
    )
    expect(html).toContain('aria-label="Marko Jovanović, ponedeljak, 5. oktobar 2026.: No shift"')
  })

  it('puts one cell in the tab order and shows planned hours, null as "—"', () => {
    const html = planner()
    expect(html.match(/data-cell="[^"]+" tabindex="0"/g)).toHaveLength(1)
    expect(text(html)).toContain('56 h')
    expect(text(html)).toMatch(/Miloš Todorović Nurse .*—/)
  })

  it('lists the conflicts with "Go to", and offers the palette with keys', () => {
    const html = planner()
    expect(html).toContain('Go to Nikola Ilić, sreda, 7. oktobar 2026.')
    expect(text(html)).toContain('Night 22:00–06:00 (+1)')
    expect(html).toContain('Key 3')
  })

  it('shows no palette, menus or Publish when read only', () => {
    const html = planner({ readOnly: true, status: 'published', onPublish: () => undefined })
    expect(html).not.toContain('Key 1')
    expect(html).not.toContain('aria-haspopup="menu"')
    expect(text(html)).toContain('Published')
    expect(text(html)).not.toContain('Publish changes')
  })

  it('shows one day as a list on phones', () => {
    const html = planner({ layout: 'phone', day: '2026-10-09' })
    expect(text(html)).toContain('petak, 9. oktobar 2026.')
    expect(html).toContain('Change: Jelena Popović, petak, 9. oktobar 2026.')
    expect(html).not.toContain('<table')
  })
})

describe('MyShifts', () => {
  it('groups by week, names this and next week, and offers a swap where allowed', () => {
    const html = render(<MyShifts shifts={MY_SHIFTS} onSwapSubmit={() => undefined} />)
    const shown = text(html)
    expect(shown).toContain('This week')
    expect(shown).toContain('Next week')
    expect(shown).toContain('19.10.2026. – 25.10.2026.')
    expect(shown).toContain('Was Afternoon, 14:00–22:00')
    expect(html.match(/Request swap/g)).toHaveLength(6)
  })
})

describe('WorkingTimeBalance', () => {
  it('signs the difference, shows null as "—" and the warnings in words', () => {
    const html = render(
      <WorkingTimeBalance label="Balance" plan={BALANCE_PLAN} rows={BALANCE_ROWS} layout="table" />,
    )
    const shown = text(html)
    expect(shown).toContain('+36 h')
    expect(shown).toContain('-2 h')
    expect(shown).toContain('34,375 h')
    expect(shown).toContain('Average above the illustrative limit of 48 h')
    expect(shown).toContain('Week 4')
    expect(shown).toMatch(/Teodora Kovačević .*— .*— .*—/)
  })
})
