// The tokens equal BUILD-PLAN Appendix A, read from the plan itself, so a value typed wrongly on
// either side fails here. The generated CSS declares every variable it or the theme refers to.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { FONT_PACKAGES, fontsCss, SHADCN, themeCss, tokensCss, tokensJson } from './generate.ts'
import {
  BRAND_STACK,
  BREAKPOINTS,
  COMMON,
  FONT_CJK_ORDER,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  HEADINGS,
  LEADING,
  MONO_STACK,
  sansStack,
  TRACKING,
  DURATION,
  EASING,
  LAYERS,
  MEANINGS,
  meaningEntries,
  RADIUS,
  RAMPS,
  resolveColor,
  SHADOWS,
  SIZES,
  SPACE,
  TONES,
} from './tokens.ts'

const plan = readFileSync(new URL('../../../BUILD-PLAN.md', import.meta.url), 'utf8')

/** The text of an appendix section, from its heading to the next heading of the same level. */
function section(heading: string): string {
  const start = plan.indexOf(`### ${heading}`)
  assert.notEqual(start, -1, `BUILD-PLAN has no section "${heading}"`)
  const end = plan.indexOf('\n### ', start + 4)
  return plan.slice(start, end === -1 ? undefined : end)
}

/** Table rows of a section, as trimmed cells, without the header and separator rows. */
function rows(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|[-| ]+\|$/.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim()),
    )
}

/** "none 0 · xxs 4px · …" after a label, as [name, value] pairs. */
function dotted(text: string, label: string): [string, string][] {
  const line = text.split('\n').find((candidate) => candidate.includes(label))
  assert.ok(line !== undefined, `no line "${label}"`)
  // The list ends at the end of the line or of its sentence ("… slow 250ms. Easing: …").
  const [list = ''] = line
    .slice(line.indexOf(label) + label.length)
    .replace(/\.$/, '')
    .split(/\. (?=[A-Z])/)
  return list.split(' · ').map((item) => {
    const match = /^\s*(.+?) `?([^`]+?)`?\s*$/.exec(item)
    assert.ok(match?.[1] !== undefined && match[2] !== undefined, `cannot read "${item}"`)
    return [match[1], match[2]]
  })
}

describe('values equal Appendix A.1', () => {
  it('has every ramp with its ten steps', () => {
    const table = rows(section('A.1')).slice(1)
    assert.equal(table.length, Object.keys(RAMPS).length)
    for (const [label = '', ...steps] of table) {
      const ramp = label.split(' ')[0] as keyof typeof RAMPS
      assert.deepEqual([...RAMPS[ramp]], steps, `ramp ${ramp}`)
    }
  })

  it('has the common colours', () => {
    const line = section('A.1')
      .split('\n')
      .find((candidate) => candidate.startsWith('Common:'))
    assert.ok(line !== undefined)
    const found = Object.fromEntries(
      [...line.matchAll(/`?(\w+)`? (#[0-9A-F]{6})/g)].map((match): [string, string] => [
        match[1] ?? '',
        match[2] ?? '',
      ]),
    )
    assert.deepEqual(found, COMMON)
  })
})

/** Expands "brand.solid / solidHover / solidActive" with "blue6 / blue7 / blue8". */
function expand(names: string, values: string): [string, string][] {
  const nameParts = names.split(' / ')
  const valueParts = values.split(' / ')
  const [first = ''] = nameParts
  const group = first.slice(0, first.indexOf('.'))
  const full = nameParts.map((name) => (name.includes('.') ? name : `${group}.${name}`))
  if (valueParts.length === 1) {
    return full.map((name) => [name, values])
  }
  assert.equal(full.length, valueParts.length, `cannot pair ${names} with ${values}`)
  return full.map((name, index) => [name, valueParts[index] ?? ''])
}

describe('meanings equal Appendix A.2', () => {
  const text = section('A.2')
  const [meaningsText = '', tonesText = ''] = text.split('Status tones')

  it('has every meaning with its light and dark value, and nothing else', () => {
    const expected: Record<string, [string, string]> = {}
    for (const [names = '', light = '', dark = ''] of rows(meaningsText).slice(1)) {
      const lights = expand(names, light)
      const darks = expand(names, dark)
      lights.forEach(([name, value], index) => {
        expected[name] = [value, darks[index]?.[1] ?? '']
      })
    }
    const actual: Record<string, [string, string]> = {}
    const groups: Record<string, Record<string, readonly [string, string]>> = MEANINGS
    for (const [group, members] of Object.entries(groups)) {
      for (const [name, pair] of Object.entries(members)) {
        actual[`${group}.${name}`] = [pair[0], pair[1]]
      }
    }
    assert.deepEqual(actual, expected)
  })

  it('has every status tone with fg, bg, border and solid', () => {
    const expected: Record<string, string[]> = {}
    for (const [tone = '', light = '', dark = ''] of rows(tonesText).slice(1)) {
      expected[tone] = [...light.split(' / '), ...dark.split(' / ')]
    }
    const actual = Object.fromEntries(
      Object.entries(TONES).map(([tone, parts]) => [
        tone,
        [
          parts.fg[0],
          parts.bg[0],
          parts.border[0],
          parts.solid[0],
          parts.fg[1],
          parts.bg[1],
          parts.border[1],
          parts.solid[1],
        ],
      ]),
    )
    assert.deepEqual(actual, expected)
  })

  it('resolves every reference to a colour', () => {
    for (const { variable, pair } of meaningEntries()) {
      for (const reference of pair) {
        assert.match(resolveColor(reference), /^(#[0-9A-F]{6}|rgba\([\d.,]+\))$/, variable)
      }
    }
  })

  it('keeps brand.solid and text.brand apart', () => {
    assert.notDeepEqual(MEANINGS.brand.solid, MEANINGS.text.brand)
  })
})

describe('spacing, radius, shadows, motion and layout equal Appendix A.3 and A.4', () => {
  const a3 = section('A.3')
  const a4 = section('A.4')

  it('has the spacing and radius steps', () => {
    assert.deepEqual(Object.entries(SPACE), dotted(a3, 'Spacing: '))
    assert.deepEqual(Object.entries(RADIUS), dotted(a3, 'Radius: '))
  })

  it('has the light shadows, and the dark ones with the listed opacities', () => {
    assert.deepEqual(
      Object.entries(SHADOWS).map(([size, pair]) => [size, pair[0]]),
      dotted(a3, 'Shadows, light: '),
    )
    const line = a3.split('\n').find((candidate) => candidate.includes('Shadows, dark'))
    const opacities = [...(line ?? '').matchAll(/\d\.\d\d/g)].map((match) => match[0])
    assert.deepEqual(
      Object.values(SHADOWS).map((pair) => pair[1]),
      Object.values(SHADOWS).map((pair, index) =>
        pair[0].replace(/rgba\(0,0,0,[\d.]+\)/, `rgba(0,0,0,${opacities[index] ?? ''})`),
      ),
    )
  })

  it('has the durations, easings, breakpoints and layers', () => {
    assert.deepEqual(Object.entries(DURATION), dotted(a4, 'Durations: '))
    assert.deepEqual(Object.entries(EASING), dotted(a4, 'Easing: '))
    assert.deepEqual(Object.entries(BREAKPOINTS), dotted(a4, 'Breakpoints: '))
    assert.deepEqual(Object.entries(LAYERS), dotted(a4, 'Layers (z-index): '))
  })

  it('has the layout sizes', () => {
    assert.deepEqual(Object.values(SIZES), ['56px', '1440px', '36px', '30px'])
    assert.match(
      a4,
      /header height 56px · content max width 1440px · control height 36px · small control 30px/,
    )
  })
})

describe('generated files', () => {
  const tokens = tokensCss()
  const theme = themeCss()
  const declared = new Set([...tokens.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1]))

  /** The declarations inside the block that starts with `selector {`. */
  function blockOf(selector: string): string {
    const start = tokens.indexOf(`${selector} {`)
    assert.notEqual(start, -1, `no block ${selector}`)
    return tokens.slice(start, tokens.indexOf('\n}', start))
  }

  it('declares every meaning and shadow in both themes', () => {
    const light = blockOf(":root,\n[data-liro-theme='light']")
    const dark = blockOf("[data-liro-theme='dark']")
    for (const { variable } of meaningEntries()) {
      assert.match(light, new RegExp(`${variable}:`))
      assert.match(dark, new RegExp(`${variable}:`))
    }
    for (const size of Object.keys(SHADOWS)) {
      assert.match(light, new RegExp(`--liro-shadow-${size}:`))
      assert.match(dark, new RegExp(`--liro-shadow-${size}:`))
    }
  })

  it('refers only to declared variables', () => {
    for (const [file, css] of [
      ['tokens.css', tokens],
      ['theme.css', theme],
    ] as const) {
      for (const match of css.matchAll(/var\((--[\w-]+)\)/g)) {
        const name = match[1] ?? ''
        assert.ok(
          declared.has(name),
          `${file} refers to ${name}, which tokens.css does not declare`,
        )
      }
    }
  })

  it('maps every shadcn variable onto a Liro meaning', () => {
    for (const [name, variable] of Object.entries(SHADCN)) {
      assert.match(tokens, new RegExp(`--${name}: var\\(${variable}\\);`))
      assert.ok(declared.has(variable), variable)
    }
  })

  it('keeps colour values out of the Tailwind theme, and removes Tailwind colours', () => {
    assert.doesNotMatch(theme, /#[0-9a-f]{3,8}\b|rgba?\(/i)
    assert.match(theme, /--color-\*: initial;/)
  })

  it('writes tokens.json with every meaning resolved', () => {
    const json = JSON.parse(tokensJson()) as {
      meaning: Record<'light' | 'dark', Record<string, Record<string, unknown>>>
    }
    assert.equal(json.meaning.light.surface?.page, RAMPS.gray[1])
    assert.equal(json.meaning.dark.surface?.page, COMMON.ink)
    assert.deepEqual(json.meaning.dark.status?.danger, {
      fg: RAMPS.red[3],
      bg: 'rgba(164,38,44,0.22)',
      border: 'rgba(164,38,44,0.50)',
      solid: RAMPS.red[6],
    })
  })
})

describe('typography equals Appendix A.5', () => {
  const a5 = section('A.5')
  /** The plan writes negative numbers with U+2212 MINUS SIGN. */
  const ascii = (pairs: [string, string][]) =>
    pairs.map(([name, value]): [string, string] => [name, value.replace('−', '-')])

  it('has the sizes, weights, line heights and letter spacing', () => {
    assert.deepEqual(
      Object.entries(FONT_SIZE),
      dotted(a5, 'Sizes: ').map(([name, value]): [string, string] => [
        name,
        value.replace(' (body)', ''),
      ]),
    )
    assert.deepEqual(Object.entries(FONT_WEIGHT), dotted(a5, 'Weights: '))
    assert.deepEqual(Object.entries(LEADING), dotted(a5, 'Line heights: '))
    assert.deepEqual(Object.entries(TRACKING), ascii(dotted(a5, 'Letter spacing: ')))
  })

  it('has the headings, all semibold', () => {
    assert.deepEqual(
      Object.entries(HEADINGS).map(([level, [size, lineHeight]]) => [
        level,
        `${size}/${lineHeight}`,
      ]),
      dotted(a5, 'Headings (all semibold): '),
    )
  })

  it('names the interface, brand and monospace faces', () => {
    assert.match(a5, /Interface face: Noto Sans/)
    assert.match(sansStack(FONT_CJK_ORDER.default), /^'Noto Sans Variable'/)
    assert.match(a5, /Space Grotesk with Inter fallback/)
    assert.match(BRAND_STACK, /^'Space Grotesk Variable', 'Inter Variable'/)
    assert.match(a5, /JetBrains Mono, Cascadia Code, system monospace/)
    assert.match(MONO_STACK, /^'JetBrains Mono', 'Cascadia Code', ui-monospace/)
  })
})

describe('fonts (P1.2)', () => {
  const tokens = tokensCss()
  const theme = themeCss()

  it('imports the font faces first, and keeps every subset downloadable on demand', () => {
    assert.match(tokens, /^\/\*[^]*?\*\/\n[^]*?@import '\.\/fonts\.css';/)
    assert.equal(tokens.indexOf('@import'), tokens.indexOf("@import './fonts.css';"))
    const stylesheets = FONT_PACKAGES.flatMap(({ name, stylesheets: names }) =>
      names.map((file) =>
        readFileSync(new URL(`../node_modules/${name}/${file}`, import.meta.url), 'utf8'),
      ),
    )
    const { css, files } = fontsCss(stylesheets)
    const faces = css.split('@font-face').slice(1)
    assert.equal(faces.length, files.length)
    for (const face of faces) {
      assert.match(face, /unicode-range: U\+/)
      assert.match(face, /url\(\.\/fonts\/[\w.[\]-]+\.woff2\)/)
    }
    for (const family of Object.values(FONT_FAMILY)) {
      assert.ok(css.includes(`font-family: '${family}';`), `fonts.css has no ${family}`)
    }
    // Serbian Cyrillic italics need an italic Noto Sans.
    assert.match(css, /font-family: 'Noto Sans Variable';\s*font-style: italic;/)
  })

  it('puts the right CJK family first for Chinese, Traditional Chinese and Japanese', () => {
    assert.match(
      tokens,
      /:where\(:lang\(ja\)\) \{\s*--liro-font-sans: [^;]*?'Noto Sans JP Variable', 'Noto Sans SC Variable'/,
    )
    assert.match(
      tokens,
      /:lang\(zh-Hant\)[^{]*\{\s*--liro-font-sans: [^;]*?'Noto Sans TC Variable', 'Noto Sans SC Variable'/,
    )
    assert.ok(tokens.indexOf(':lang(zh-Hant)') > tokens.indexOf(':where(:lang(zh))'))
  })

  it('gives Arabic script and CJK text the relaxed line height and no letter spacing', () => {
    assert.match(
      tokens,
      /:lang\(ar\)[^{]*:lang\(ja\)[^{]*:lang\(zh\)\) \{\s*--liro-leading-body: var\(--liro-leading-relaxed\);\s*--liro-tracking-body-text: 0;/,
    )
  })

  it('sets the body type in the base layer, and keeps the root font size', () => {
    assert.match(tokens, /@layer base \{/)
    assert.doesNotMatch(tokens, /:root[^{]*\{[^}]*[^-]font-size:/)
  })

  it('exposes the type scale to Tailwind and removes Tailwind’s own', () => {
    for (const reset of [
      '--font-*',
      '--text-*',
      '--font-weight-*',
      '--leading-*',
      '--tracking-*',
    ]) {
      assert.ok(theme.includes(`${reset}: initial;`), reset)
    }
    assert.match(theme, /--text-md: var\(--liro-font-size-md\);/)
    assert.match(theme, /--text-md--line-height: var\(--liro-leading-body\);/)
    assert.match(theme, /--text-h1--font-weight: var\(--liro-font-weight-semibold\);/)
    assert.match(theme, /--font-brand: var\(--liro-font-brand\);/)
  })
})
