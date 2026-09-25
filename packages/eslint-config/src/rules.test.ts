import { ESLint, RuleTester } from 'eslint'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import config, { plugin } from './index.ts'
import { splitClass } from './strings.ts'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const tester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe('splitClass', () => {
  it.each([
    ['bg-red-500', [], 'bg-red-500'],
    ['md:hover:!-ml-4', ['md', 'hover'], 'ml-4'],
    ['[&:hover]:text-left', ['[&:hover]'], 'text-left'],
    ['data-[state=open]:bg-(--a)', ['data-[state=open]'], 'bg-(--a)'],
    ['bg-red-500!', [], 'bg-red-500'],
  ])('%s', (token, variants, utility) => {
    expect(splitClass(token)).toEqual({ variants, utility })
  })
})

tester.run('no-raw-colors', plugin.rules['no-raw-colors'], {
  valid: [
    'const a = "bg-surface-raised text-secondary border-strong"',
    'const a = "bg-status-danger-bg text-status-danger-fg"',
    'const a = "bg-brand-solid/80 hover:bg-brand-solid-hover"',
    'const a = "bg-(--liro-surface-sunken) text-[var(--liro-text-tertiary)]"',
    'const a = "bg-transparent text-current whitespace-nowrap"',
    'import "./red-500.css"',
    'const a = { "bg-red-500": true }',
    'const a = "&#123; and #section"',
    '<p style={{ color: "var(--liro-text-primary)", borderColor: "currentColor" }} />',
    '<p style={{ width: "red" }} />',
  ],
  invalid: [
    { code: 'const a = "bg-red-500"', errors: [{ messageId: 'rawUtility' }] },
    { code: 'const a = "text-slate-50 border-x-zinc-950"', errors: 2 },
    { code: 'const a = `hover:bg-white ${b}`', errors: [{ messageId: 'rawUtility' }] },
    { code: 'const a = "bg-[#fff]"', errors: [{ messageId: 'hex' }] },
    { code: 'const a = "#0078D4"', errors: [{ messageId: 'hex' }] },
    { code: 'const a = "0 1px 2px rgba(0,0,0,0.06)"', errors: [{ messageId: 'colorFunction' }] },
    { code: 'const a = "text-[oklch(0.5_0.1_200)]"', errors: [{ messageId: 'colorFunction' }] },
    { code: 'const a = "dark:text-primary"', errors: [{ messageId: 'darkVariant' }] },
    { code: '<p style={{ color: "red" }} />', errors: [{ messageId: 'namedColor' }] },
    { code: '<p style={{ backgroundColor: "#fff" }} />', errors: [{ messageId: 'hex' }] },
  ],
})

tester.run('logical-properties', plugin.rules['logical-properties'], {
  valid: [
    'const a = "ms-4 me-2 ps-3 pe-1 start-0 end-0 text-start border-s rounded-ss-md"',
    'const a = "mx-4 px-2 inset-x-0 float-start"',
    'const a = "Reads right-to-left"',
    '<p style={{ marginInlineStart: 8, textAlign: "start", float: "inline-end" }} />',
    'const style = { marginLeft: 8 }',
  ],
  invalid: [
    { code: 'const a = "ml-4"', errors: [{ messageId: 'physicalUtility' }] },
    { code: 'const a = "md:-mr-px sm:pl-2 pr-[3px]"', errors: 3 },
    { code: 'const a = "left-0 right-1/2 -left-[4px]"', errors: 3 },
    { code: 'const a = "text-left float-right clear-left"', errors: 3 },
    { code: 'const a = "border-l border-r-2 rounded-l-md rounded-br"', errors: 4 },
    { code: 'const a = "scroll-ml-2 scroll-pr-4"', errors: 2 },
    { code: '<p style={{ paddingRight: 4 }} />', errors: [{ messageId: 'physicalStyle' }] },
    { code: '<p style={{ float: "left" }} />', errors: [{ messageId: 'physicalValue' }] },
  ],
})

/** "expect:" comments of a fixture, as rule IDs by line. */
function expectations(path: string): Map<number, string[]> {
  const expected = new Map<number, string[]>()
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      const match = /expect: ([\w/, -]+?)(?: \*\/\}|$)/.exec(line)
      if (match?.[1] !== undefined) {
        expected.set(
          index + 1,
          match[1].split(',').map((rule) => rule.trim()),
        )
      }
    })
  return expected
}

describe('fixtures, linted with the published configuration', () => {
  const eslint = new ESLint({
    cwd: fileURLToPath(new URL('../fixtures/', import.meta.url)),
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.tsx'],
        languageOptions: {
          parser: tseslint.parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
      },
      ...config,
    ],
  })

  it.each(['invalid.tsx', 'valid.tsx'])('%s reports exactly its expect: comments', async (file) => {
    const path = fileURLToPath(new URL(`../fixtures/${file}`, import.meta.url))
    const [result] = await eslint.lintFiles([path])
    const actual = new Map<number, string[]>()
    for (const message of result?.messages ?? []) {
      actual.set(message.line, [
        ...(actual.get(message.line) ?? []),
        message.ruleId ?? message.message,
      ])
    }
    const sort = (map: Map<number, string[]>) =>
      [...map.entries()].map(([line, rules]) => [line, [...rules].sort()]).sort()
    expect(sort(actual)).toEqual(sort(expectations(path)))
    if (file === 'invalid.tsx') {
      expect(actual.size).toBeGreaterThan(20)
    }
  })
})
