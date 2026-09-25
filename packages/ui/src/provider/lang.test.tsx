import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { langAttribute, useLangAttribute } from './lang'
import { LiroProvider } from './liro-provider'

describe('langAttribute', () => {
  it.each([
    ['sr-Cyrl', 'sr-Latn-RS', { lang: 'sr-Cyrl' }],
    ['sr-Latn', 'sr-Cyrl-RS', { lang: 'sr-Latn' }],
    ['ja', 'zh-Hans', { lang: 'ja' }],
    ['zh-Hant', 'zh-Hans', { lang: 'zh-Hant' }],
    ['ar', 'en', { lang: 'ar' }],
    ['en-GB', 'en', {}],
    ['sr-RS', 'sr-Latn', {}],
    ['sr', 'sr-Cyrl-RS', { lang: 'sr' }],
    ['ja-JP', 'ja', {}],
    [undefined, 'en', {}],
    ['', 'en', {}],
  ])('%j on a %s page gives %j', (text, page, expected) => {
    expect(langAttribute(text, page)).toEqual(expected)
  })

  it('reads the page locale from LiroProvider', () => {
    function Sample({ lang }: { lang: string }) {
      return <span {...useLangAttribute(lang)}>text</span>
    }
    const html = renderToStaticMarkup(
      <LiroProvider locale="sr-Latn-RS">
        <Sample lang="sr-Cyrl" />
        <Sample lang="sr-Latn" />
      </LiroProvider>,
    )
    expect(html).toContain('<span lang="sr-Cyrl">text</span><span>text</span>')
  })
})
