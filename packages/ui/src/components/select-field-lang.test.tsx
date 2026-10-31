import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { ComboboxField } from './combobox-field'
import { SelectField } from './select-field'

/* An option written in another language carries it, in the list and once chosen. */

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' },
]

describe('option languages', () => {
  it('gives a read-only SelectField the chosen option’s language', () => {
    const html = render(
      <SelectField id="l" label="Language" readOnly defaultValue="sr-Cyrl" options={LANGUAGES} />,
    )
    expect(html).toMatch(/<input[^>]*lang="sr-Cyrl"/)
  })

  it('gives a searched SelectField’s box the chosen option’s language', () => {
    const many = Array.from({ length: 11 }, (_, index) => ({
      value: `x${String(index)}`,
      label: `Option ${String(index)}`,
    }))
    const html = render(
      <SelectField
        id="l"
        label="Language"
        defaultValue="sr-Cyrl"
        options={[...many, ...LANGUAGES]}
      />,
    )
    const box = /<input[^>]*role="combobox"[^>]*>/.exec(html)?.[0]
    expect(box).toContain('lang="sr-Cyrl"')
  })

  it('leaves an option in the page’s language without one', () => {
    const html = render(
      <SelectField id="l" label="Language" readOnly defaultValue="en" options={LANGUAGES} />,
    )
    expect(html).not.toMatch(/<input[^>]*lang=/)
  })

  it('gives a read-only ComboboxField the chosen option’s language', () => {
    const html = render(
      <ComboboxField
        id="c"
        label="Language"
        readOnly
        value={{ value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' }}
        options={LANGUAGES}
      />,
    )
    expect(html).toMatch(/<input[^>]*lang="sr-Cyrl"/)
  })
})
