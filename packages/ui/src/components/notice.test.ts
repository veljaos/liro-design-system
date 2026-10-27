import { describe, expect, it } from 'vitest'
import { noticeDuration, NOTICE_POINTER } from './notice'

describe('noticeDuration', () => {
  it('closes success, info and warning by themselves; errors and loading wait', () => {
    expect(noticeDuration('success')).toBe(4000)
    expect(noticeDuration('info')).toBe(4000)
    expect(noticeDuration('warning')).toBe(6000)
    expect(noticeDuration('error')).toBe(Infinity)
    expect(noticeDuration('loading')).toBe(Infinity)
  })
})

describe('noticeDuration with an action', () => {
  it('stays at least 8 seconds so the action can be reached; errors still wait', () => {
    expect(noticeDuration('success', true)).toBe(8000)
    expect(noticeDuration('warning', true)).toBe(8000)
    expect(noticeDuration('error', true)).toBe(Infinity)
  })
})

describe('toasts never block (P5.90, P5.93)', () => {
  it('lets clicks through a toast except on its buttons', () => {
    expect(NOTICE_POINTER.split(' ')).toEqual([
      'pointer-events-none',
      '[&_button]:pointer-events-auto',
    ])
  })
})
