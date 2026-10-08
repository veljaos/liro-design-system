import { describe, expect, it } from 'vitest'
import type { MenuEntry } from '../components/dropdown-menu'
import {
  fieldElementId,
  fieldRules,
  registerMenu,
  ruleCounts,
  rulesTone,
  type StatutoryRule,
} from './register-logic'

describe('registerMenu', () => {
  const actions: MenuEntry[] = [{ label: 'Correct entry', onSelect: () => undefined }]
  it('keeps the application’s actions for an open entry', () => {
    expect(registerMenu({}, actions, 'Locked')).toBe(actions)
    expect(registerMenu({ locked: false }, actions, 'Locked')).toBe(actions)
  })
  it('gives a locked entry one unavailable item that says why', () => {
    const menu = registerMenu({ locked: true }, actions, 'Locked period: entries cannot be changed')
    expect(menu).toHaveLength(1)
    expect(menu[0]).toMatchObject({
      label: 'Locked period: entries cannot be changed',
      disabled: true,
    })
  })
})

const RULES: StatutoryRule[] = [
  { id: 'r1', text: '3.6 must equal 3.2 × 20%', fields: ['3.2', '3.6'], result: 'passed' },
  { id: 'r2', text: '5.4 must equal 5.1 + 5.2 + 5.3', fields: ['5.4'], result: 'warning' },
  {
    id: 'r3',
    text: '5.4 must equal the input tax of 8e.6',
    fields: ['5.4', '8e.6'],
    result: 'failed',
    detail: 'Difference: 1.200,00 RSD',
  },
]

describe('rule checks', () => {
  it('shows, next to a field, the checks that did not pass, failures first', () => {
    expect(fieldRules(RULES, '5.4').map((rule) => rule.id)).toEqual(['r3', 'r2'])
    expect(fieldRules(RULES, '3.2')).toEqual([])
    expect(fieldRules(RULES, '8e.6').map((rule) => rule.id)).toEqual(['r3'])
  })

  it('counts the results and gives the summary’s tone', () => {
    expect(ruleCounts(RULES)).toEqual({ failed: 1, warning: 1, passed: 1 })
    expect(rulesTone(RULES)).toBe('danger')
    expect(rulesTone(RULES.filter((rule) => rule.result !== 'failed'))).toBe('warning')
    expect(rulesTone(RULES.filter((rule) => rule.result === 'passed'))).toBe('success')
    expect(rulesTone([])).toBe('success')
  })

  it('makes a valid element id of a field number and a React id', () => {
    expect(fieldElementId(':r1:', '8a.1')).toBe('-r1--statutory-field-8a-1')
  })
})
