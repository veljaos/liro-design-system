import { describe, expect, it } from 'vitest'
import {
  CODE_LANGUAGES,
  codeLanguage,
  highlightCode,
  tokenKind,
  tokensFromShiki,
} from './highlighter'

/** A colour Shiki might pass, built so no colour literal stands in the source. */
const HASH = '#'

describe('codeLanguage', () => {
  it('reads names and aliases, and nothing else', () => {
    expect(codeLanguage('JSON')).toBe('json')
    expect(codeLanguage('ts')).toBe('typescript')
    expect(codeLanguage('sh')).toBe('bash')
    expect(codeLanguage('yaml')).toBeNull()
    expect(codeLanguage('C#')).toBe('csharp')
    expect(codeLanguage('cobol')).toBeNull()
    expect(CODE_LANGUAGES).toContain('sql')
  })
})

describe('tokenKind and tokensFromShiki', () => {
  it('keeps only the Liro code theme’s kinds, never a colour', () => {
    expect(tokenKind('var(--liro-code-keyword)')).toBe('keyword')
    expect(tokenKind('var(--liro-code-text)')).toBeUndefined()
    expect(tokenKind(HASH + 'FF0000')).toBeUndefined()
    expect(tokenKind(undefined)).toBeUndefined()
    expect(
      tokensFromShiki([
        [
          { content: '// x', offset: 0, color: 'var(--liro-code-comment)', fontStyle: 1 },
          { content: ' y', offset: 4, color: HASH + '123456', fontStyle: 2 },
          { content: 'z', offset: 6, fontStyle: 4 },
        ],
      ]),
    ).toEqual([
      [
        { text: '// x', kind: 'comment', italic: true },
        { text: ' y', bold: true },
        { text: 'z', underline: true },
      ],
    ])
  })
})

describe('highlightCode', () => {
  it('highlights a payload line by line with the Liro kinds', async () => {
    const lines = await highlightCode('{\n  "status": 502,\n  "ok": false\n}', 'json')
    expect(lines).toHaveLength(4)
    const second = lines?.[1] ?? []
    expect(second.map((token) => token.text).join('')).toBe('  "status": 502,')
    expect(second.find((token) => token.text === '502')?.kind).toBe('constant')
    expect(second.some((token) => token.kind === 'entity')).toBe(true)
  })

  it('reads aliases and keeps comments italic', async () => {
    const lines = await highlightCode('-- overdue\nSELECT 1', 'SQL')
    expect(lines?.[0]?.[0]).toMatchObject({ kind: 'comment', italic: true })
    expect(lines?.[1]?.find((token) => token.text === 'SELECT')?.kind).toBe('keyword')
  })

  it('leaves unknown languages to plain text', async () => {
    expect(await highlightCode('x', 'cobol')).toBeNull()
  })
})
