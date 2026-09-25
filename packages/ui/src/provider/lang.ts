import { intlLocale } from './format'
import { useLiro } from './liro-provider'

/** Language and script of a tag; Serbian without a script is Latin (intlLocale, Appendix B.1). */
function languageAndScript(tag: string): string {
  const locale = new Intl.Locale(intlLocale(tag)).maximize()
  return `${locale.language}-${locale.script ?? ''}`
}

/**
 * The `lang` attribute for text in `textLang` on a page in `pageLocale`: `{ lang: textLang }`
 * when the language or the script differ, otherwise nothing. Text whose language differs from the
 * page must carry `lang`, so that Serbian Cyrillic italics use Serbian letterforms and Japanese
 * does not render with Chinese glyphs (BUILD-PLAN P1.2). A region alone ('en' and 'en-GB') does
 * not change the text's rendering and needs no attribute.
 */
export function langAttribute(textLang: string | undefined, pageLocale: string): { lang?: string } {
  if (textLang === undefined || textLang === '') return {}
  return languageAndScript(textLang) === languageAndScript(pageLocale) ? {} : { lang: textLang }
}

/** `langAttribute` against the locale of the nearest LiroProvider. Spread it onto the element. */
export function useLangAttribute(textLang: string | undefined): { lang?: string } {
  return langAttribute(textLang, useLiro().locale)
}
