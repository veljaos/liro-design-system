import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Calendar } from '../primitives/calendar'
import { LiroProvider } from '../provider/liro-provider'
import { ScreenContext } from '../provider/screen'
import { isSearchable, SEARCHABLE_FROM, SelectField } from './select-field'
import { useBelowMd, usePhone } from './use-phone'

/*
 * P5.28 items 1, 3 and 11: a phone frame's screen makes the components inside behave as on a
 * phone, and a long SelectField is searched by typing.
 */

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

function Probe() {
  return <span>{`${String(usePhone())} ${String(useBelowMd())}`}</span>
}

const pupils = Array.from({ length: 12 }, (_, index) => ({
  value: `p${String(index + 1)}`,
  label: `Pupil ${String(index + 1)}`,
}))

describe('the phone screen', () => {
  it('is a phone inside a phone frame whatever the window, and not outside it', () => {
    expect(render(<Probe />)).toContain('false false')
    expect(
      render(
        <ScreenContext value={{ element: null, phone: true }}>
          <Probe />
        </ScreenContext>,
      ),
    ).toContain('true true')
  })
})

describe('SelectField with many options (P5.28 item 3)', () => {
  it('is searched from SEARCHABLE_FROM options unless the application says otherwise', () => {
    expect(SEARCHABLE_FROM).toBe(11)
    expect(isSearchable(10)).toBe(false)
    expect(isSearchable(11)).toBe(true)
    expect(isSearchable(3, true)).toBe(true)
    expect(isSearchable(40, false)).toBe(false)
  })

  it('renders a combobox text box with the chosen label and a chevron', () => {
    const html = render(
      <SelectField id="pupil" label="Pupil" options={pupils} defaultValue="p3" name="pupil" />,
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-autocomplete="list"')
    expect(html).toContain('value="Pupil 3"')
    expect(html).toContain('type="hidden" name="pupil" value="p3"')
    expect(html).toContain('lucide-chevron-down')
  })

  it('keeps the plain list when searchable is false, and a clear button when clearable', () => {
    const plain = render(
      <SelectField id="a" label="Pupil" options={pupils} searchable={false} defaultValue="p1" />,
    )
    expect(plain).toContain('data-slot="select-trigger"')
    expect(plain).not.toContain('aria-autocomplete="list"')
    const clearable = render(
      <SelectField id="b" label="Pupil" options={pupils} clearable defaultValue="p1" />,
    )
    expect(clearable).toContain('aria-label="Clear"')
  })
})

describe('Calendar fullWidth (PeriodField on a phone)', () => {
  it('stretches the month and its days across the width', () => {
    const labels = { previousMonth: 'Previous', nextMonth: 'Next', navigation: 'Months' }
    const wide = render(
      <Calendar labels={labels} mode="single" defaultMonth={new Date(2026, 9, 1)} fullWidth />,
    )
    expect(wide).toContain('table-fixed')
    expect(wide).toMatch(/class="[^"]*\bw-full\b[^"]*"/)
    const narrow = render(
      <Calendar labels={labels} mode="single" defaultMonth={new Date(2026, 9, 1)} />,
    )
    expect(narrow).not.toContain('table-fixed')
    expect(narrow).toContain('w-9')
  })
})
