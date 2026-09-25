import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('keeps classes that do not conflict', () => {
    expect(cn('text-sm text-primary', 'font-sans font-regular')).toBe(
      'text-sm text-primary font-sans font-regular',
    )
    expect(cn('text-h4 text-secondary')).toBe('text-h4 text-secondary')
    expect(cn('border border-control')).toBe('border border-control')
  })

  it('lets a later class replace the one it conflicts with', () => {
    expect(cn('text-secondary', 'text-primary')).toBe('text-primary')
    expect(cn('text-h1', 'text-sm')).toBe('text-sm')
    expect(cn('font-semibold', 'font-regular')).toBe('font-regular')
    expect(cn('bg-surface-raised', 'bg-surface-overlay')).toBe('bg-surface-overlay')
    expect(cn('h-control', 'h-8')).toBe('h-8')
    expect(cn('leading-none', 'leading-base')).toBe('leading-base')
    expect(cn('tracking-body', 'tracking-caps')).toBe('tracking-caps')
    expect(cn('ps-3', 'ps-2')).toBe('ps-2')
  })

  it('drops false and undefined parts', () => {
    const disabled = false as boolean
    expect(cn('a', disabled && 'b', undefined, { c: true, d: false })).toBe('a c')
  })
})
