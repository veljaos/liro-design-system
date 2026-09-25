import { useLangAttribute } from '@veljaos/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  HEADINGS,
  LEADING,
  TRACKING,
} from '../../../../packages/tokens/src/tokens'

interface Sample {
  script: string
  lang: string
  /** The sample's own direction: text in another language also carries its direction. */
  dir: 'ltr' | 'rtl'
  text: string
  italic?: boolean
}

/** One sentence per script class (BUILD-PLAN section 2): "Every screen in every module looks and behaves the same." */
const SCRIPTS: Sample[] = [
  {
    script: 'Latin',
    lang: 'sr-Latn',
    dir: 'ltr',
    text: 'Svaki ekran u svakom modulu izgleda i ponaša se isto.',
  },
  {
    script: 'Cyrillic',
    lang: 'sr-Cyrl',
    dir: 'ltr',
    text: 'Сваки екран у сваком модулу изгледа и понаша се исто.',
  },
  {
    script: 'Cyrillic, italic: Serbian letterforms of б, г, д, п, т',
    lang: 'sr-Cyrl',
    dir: 'ltr',
    text: 'Добар дан, где је тачан преглед?',
    italic: true,
  },
  {
    script: 'Greek',
    lang: 'el',
    dir: 'ltr',
    text: 'Κάθε οθόνη σε κάθε ενότητα έχει την ίδια εμφάνιση και συμπεριφορά.',
  },
  {
    script: 'Arabic',
    lang: 'ar',
    dir: 'rtl',
    text: 'كل شاشة في كل وحدة تبدو وتعمل بالطريقة نفسها.',
  },
  {
    script: 'Hebrew',
    lang: 'he',
    dir: 'rtl',
    text: 'כל מסך בכל מודול נראה ומתנהג באותו אופן.',
  },
  {
    script: 'Chinese, simplified',
    lang: 'zh-Hans',
    dir: 'ltr',
    text: '每个模块中的每个屏幕看起来和操作起来都一样。',
  },
  {
    script: 'Chinese, traditional',
    lang: 'zh-Hant',
    dir: 'ltr',
    text: '每個模組中的每個畫面看起來和操作起來都一樣。',
  },
  {
    script: 'Japanese',
    lang: 'ja',
    dir: 'ltr',
    text: 'すべてのモジュールのすべての画面が同じように見え、同じように動作します。',
  },
]

/** The same Han characters, drawn by each language's family: lang decides which. */
const SHARED_HAN = '直 角 骨 過 化'
const HAN_LANGS = ['zh-Hans', 'zh-Hant', 'ja']

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex max-w-content flex-col gap-4">
      <h2 className="m-0 text-h2">{title}</h2>
      <p className="m-0 max-w-3xl text-secondary">{intro}</p>
      {children}
    </div>
  )
}

function ScriptRow({ sample }: { sample: Sample }) {
  const lang = useLangAttribute(sample.lang)
  return (
    <tr className="border-t border-subtle">
      <th scope="row" className="py-2 pe-4 text-start align-top font-regular text-secondary">
        {sample.script}
        <br />
        <code dir="ltr" className="font-mono text-xs">
          lang=&quot;{sample.lang}&quot;
        </code>
      </th>
      <td className="py-2 align-top">
        <p
          {...lang}
          dir={sample.dir}
          className={`m-0 text-lg ${sample.italic === true ? 'italic' : ''}`}
        >
          {sample.text}
        </p>
      </td>
    </tr>
  )
}

function HanRow({ lang }: { lang: string }) {
  const attribute = useLangAttribute(lang)
  return (
    <li className="flex items-baseline gap-3">
      <code dir="ltr" className="w-20 font-mono text-xs text-secondary">
        {lang}
      </code>
      <span {...attribute} dir="ltr" className="text-xl">
        {SHARED_HAN}
      </span>
    </li>
  )
}

function Scripts() {
  return (
    <Page
      title="Scripts"
      intro="One sentence in each of the seven script classes, in the interface face (Noto Sans and its script families). Each font subset downloads only when a character needs it. Text whose language differs from the page carries lang (useLangAttribute): Serbian Cyrillic italics then use Serbian letterforms, and Japanese is not drawn with Chinese glyphs. Arabic and CJK text take the relaxed line height and no letter spacing."
    >
      <table className="w-full max-w-4xl border-collapse">
        <caption className="sr-only">Sample sentences by script</caption>
        <tbody>
          {SCRIPTS.map((sample) => (
            <ScriptRow key={`${sample.lang}-${sample.script}`} sample={sample} />
          ))}
        </tbody>
      </table>
      <section aria-label="Shared Han characters" className="flex flex-col gap-2">
        <h3 className="m-0 text-h3">The same characters, three languages</h3>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {HAN_LANGS.map((lang) => (
            <HanRow key={lang} lang={lang} />
          ))}
        </ul>
      </section>
    </Page>
  )
}

/** Tailwind finds classes by reading the source, so the utilities are written out. */
const SIZE_CLASSES: Record<keyof typeof FONT_SIZE, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
  xl: 'text-xl',
}
const WEIGHT_CLASSES: Record<keyof typeof FONT_WEIGHT, string> = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}
const HEADING_CLASSES: Record<keyof typeof HEADINGS, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  h5: 'text-h5',
  h6: 'text-h6',
}
const LEADING_CLASSES: Record<keyof typeof LEADING, string> = {
  tight: 'leading-tight',
  base: 'leading-base',
  relaxed: 'leading-relaxed',
}
const TRACKING_CLASSES: Record<keyof typeof TRACKING, string> = {
  heading: 'tracking-heading',
  body: 'tracking-body',
  caps: 'tracking-caps uppercase',
}

const AMOUNTS = ['1,111.11', '88,808.00', '404.40', '12,345.67']

function Row({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-subtle py-2">
      <span className="w-32 text-sm text-secondary">{label}</span>
      <code dir="ltr" className="w-40 font-mono text-xs text-secondary">
        {value}
      </code>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  )
}

function List({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col">
      <h3 className="m-0 pb-1 text-h4">{title}</h3>
      <ul className="m-0 list-none p-0">{children}</ul>
    </section>
  )
}

function TypeScale() {
  return (
    <Page
      title="Type scale"
      intro="Appendix A.5. Sizes text-xs … text-xl (text-md is the body), weights font-regular … font-bold, headings text-h1 … text-h6 (all semibold), line heights leading-tight|base|relaxed, letter spacing tracking-heading|body|caps. Faces: font-sans (interface), font-brand (wordmark, status pages), font-mono. Amounts use tabular digits (tabular-nums)."
    >
      <List title="Headings">
        {Object.entries(HEADINGS).map(([level, [size, lineHeight]]) => (
          <Row key={level} label={level} value={`${size}/${lineHeight}`}>
            <span className={HEADING_CLASSES[level as keyof typeof HEADINGS]}>
              Settings of the organisation
            </span>
          </Row>
        ))}
      </List>
      <List title="Sizes">
        {Object.entries(FONT_SIZE).map(([name, size]) => (
          <Row key={name} label={name} value={size}>
            <span className={SIZE_CLASSES[name as keyof typeof FONT_SIZE]}>
              Every screen looks and behaves the same.
            </span>
          </Row>
        ))}
      </List>
      <List title="Weights">
        {Object.entries(FONT_WEIGHT).map(([name, weight]) => (
          <Row key={name} label={name} value={weight}>
            <span className={WEIGHT_CLASSES[name as keyof typeof FONT_WEIGHT]}>
              Every screen looks and behaves the same.
            </span>
          </Row>
        ))}
      </List>
      <List title="Line heights">
        {Object.entries(LEADING).map(([name, value]) => (
          <Row key={name} label={name} value={value}>
            <span className={`block max-w-md ${LEADING_CLASSES[name as keyof typeof LEADING]}`}>
              Every screen in every module looks and behaves the same, so a person who learns one
              screen knows them all.
            </span>
          </Row>
        ))}
      </List>
      <List title="Letter spacing">
        {Object.entries(TRACKING).map(([name, value]) => (
          <Row key={name} label={name} value={value}>
            <span className={TRACKING_CLASSES[name as keyof typeof TRACKING]}>
              Every screen looks the same
            </span>
          </Row>
        ))}
      </List>
      <List title="Faces">
        <Row label="sans" value="font-sans">
          <span className="font-sans">Liro — Every screen looks the same</span>
        </Row>
        <Row label="brand" value="font-brand">
          <span className="font-brand text-xl">Liro — Every screen looks the same</span>
        </Row>
        <Row label="mono" value="font-mono">
          <span className="font-mono">const total = &quot;1234.56&quot;</span>
        </Row>
      </List>
      <List title="Digits">
        <Row label="proportional" value="default">
          <span className="inline-flex flex-col items-end">
            {AMOUNTS.map((amount) => (
              <span key={amount}>{amount}</span>
            ))}
          </span>
        </Row>
        <Row label="tabular" value="tabular-nums">
          <span className="inline-flex flex-col items-end tabular-nums">
            {AMOUNTS.map((amount) => (
              <span key={amount}>{amount}</span>
            ))}
          </span>
        </Row>
      </List>
    </Page>
  )
}

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'The type of Appendix A.5 and the fonts of seven script classes, shipped with ' +
          '@veljaos/tokens (fonts.css, imported by tokens.css). Use the text-*, font-*, leading-* ' +
          'and tracking-* utilities; never set a font family or size by hand. Mark text whose ' +
          'language differs from the page with lang, through useLangAttribute.',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const ScriptsStory: Story = { name: 'Scripts', render: () => <Scripts /> }

export const Scale: Story = { name: 'Type scale', render: () => <TypeScale /> }
