import { describe, expect, it } from 'vitest'
import {
  ansiLines,
  applySgr,
  codeCopyText,
  codeLines,
  diffLine,
  isAnsiLanguage,
  isPlainLanguage,
  lineNumberDigits,
  parseAnsi,
  splitCodeLines,
  stripAnsi,
} from './code-block-logic'

const ESC = String.fromCharCode(27)

describe('splitCodeLines', () => {
  it('ignores one trailing newline and reads \\r\\n as \\n', () => {
    expect(splitCodeLines('a\r\nb\n')).toEqual(['a', 'b'])
    expect(splitCodeLines('a\n\nb')).toEqual(['a', '', 'b'])
    expect(splitCodeLines('')).toEqual([''])
    expect(splitCodeLines('a\n\n')).toEqual(['a', ''])
  })
})

describe('codeLines', () => {
  it('numbers the lines from startLine and marks the highlighted ones by their number', () => {
    const lines = codeLines('one\ntwo\nthree', { startLine: 41, highlightLines: [42] })
    expect(lines.map((line) => [line.number, line.highlighted])).toEqual([
      [41, false],
      [42, true],
      [43, false],
    ])
  })

  it('reads a diff: markers removed, meta lines without a number', () => {
    const lines = codeLines('@@ -1,2 +1,2 @@\n-old\n+new\n same', { diff: true })
    expect(lines.map((line) => [line.kind, line.text, line.number])).toEqual([
      ['meta', '@@ -1,2 +1,2 @@', null],
      ['removed', 'old', 1],
      ['added', 'new', 2],
      ['plain', 'same', 3],
    ])
  })

  it('leaves the markers alone without diff', () => {
    expect(codeLines('-1', {})[0]?.text).toBe('-1')
  })
})

describe('diffLine', () => {
  it('knows the file names and hunk headers', () => {
    expect(diffLine('--- a/x.json').kind).toBe('meta')
    expect(diffLine('+++ b/x.json').kind).toBe('meta')
    expect(diffLine('@@ -3 +3 @@').kind).toBe('meta')
    expect(diffLine('no marker')).toEqual({ kind: 'plain', text: 'no marker' })
  })
})

describe('lineNumberDigits', () => {
  it('is the width of the largest number', () => {
    expect(lineNumberDigits(codeLines('a\nb', { startLine: 99 }))).toBe(3)
    expect(lineNumberDigits(codeLines('a'))).toBe(1)
  })
})

describe('ANSI', () => {
  it('reads colours, bold and reset', () => {
    const { spans } = parseAnsi(`${ESC}[32m✓${ESC}[39m done ${ESC}[1;31mfailed${ESC}[0m`)
    expect(spans).toEqual([
      { text: '✓', style: { fg: 'green' } },
      { text: ' done ', style: {} },
      { text: 'failed', style: { bold: true, fg: 'red' } },
    ])
  })

  it('carries a style over to the next line', () => {
    const lines = ansiLines([`${ESC}[33mwarning`, 'still yellow', `${ESC}[0mplain`])
    expect(lines[1]).toEqual([{ text: 'still yellow', style: { fg: 'yellow' } }])
    expect(lines[2]).toEqual([{ text: 'plain', style: {} }])
  })

  it('draws bright black as grey, black and white as the text colour', () => {
    expect(applySgr({}, '90')).toEqual({ fg: 'gray' })
    expect(applySgr({ fg: 'red' }, '30')).toEqual({})
    expect(applySgr({}, '97')).toEqual({})
    expect(applySgr({}, '41')).toEqual({ bg: 'red' })
    expect(applySgr({ bold: true, dim: true }, '22')).toEqual({})
  })

  it('reads the basic 256 colours and never true colour', () => {
    expect(applySgr({}, '38;5;9')).toEqual({ fg: 'red' })
    expect(applySgr({}, '38;5;200')).toEqual({})
    expect(applySgr({ fg: 'red' }, '38;2;10;20;30;1')).toEqual({ bold: true })
  })

  it('drops other escape sequences and strips them for copying', () => {
    const text = `${ESC}[2K${ESC}[36mok${ESC}[0m`
    expect(parseAnsi(text).spans).toEqual([{ text: 'ok', style: { fg: 'cyan' } }])
    expect(stripAnsi(text)).toBe('ok')
  })
})

describe('codeCopyText', () => {
  it('copies the code only: no numbers, no markers, the diff after the change', () => {
    const diff = codeLines('@@ -1 +1 @@\n-old\n+new\n same', { diff: true })
    expect(codeCopyText(diff)).toBe('new\nsame')
    expect(codeCopyText(codeLines('a\n\nb\n', { startLine: 5 }))).toBe('a\n\nb')
  })

  it('copies terminal output without escape sequences', () => {
    expect(codeCopyText(codeLines(`${ESC}[31mred${ESC}[0m\nplain`), { ansi: true })).toBe(
      'red\nplain',
    )
  })
})

describe('languages', () => {
  it('never highlights plain text or terminal output', () => {
    expect(isPlainLanguage(undefined)).toBe(true)
    expect(isPlainLanguage('Text')).toBe(true)
    expect(isPlainLanguage('ansi')).toBe(true)
    expect(isPlainLanguage('json')).toBe(false)
    expect(isAnsiLanguage(' ANSI ')).toBe(true)
    expect(isAnsiLanguage('json')).toBe(false)
  })
})
