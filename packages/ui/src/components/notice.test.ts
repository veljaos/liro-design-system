import { describe, expect, it } from 'vitest'
import { noticeClosable, noticeDuration, noticeTakesPointer } from './notice'

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

describe('toasts never block (P5.90)', () => {
  it('gives success and info no close button; warnings and errors keep theirs', () => {
    expect(noticeClosable('success')).toBe(false)
    expect(noticeClosable('info')).toBe(false)
    expect(noticeClosable('loading')).toBe(false)
    expect(noticeClosable('warning')).toBe(true)
    expect(noticeClosable('error')).toBe(true)
  })

  it('lets clicks through a toast that is only read', () => {
    expect(noticeTakesPointer('success')).toBe(false)
    expect(noticeTakesPointer('info')).toBe(false)
    expect(noticeTakesPointer('success', true)).toBe(true)
    expect(noticeTakesPointer('error')).toBe(true)
    expect(noticeTakesPointer('warning')).toBe(true)
  })
})
