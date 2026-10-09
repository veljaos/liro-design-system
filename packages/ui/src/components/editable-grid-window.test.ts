import { describe, expect, it } from 'vitest'
import { ariaRowIndexes } from './editable-grid-window'

describe('ariaRowIndexes', () => {
  it('counts the header, each line and the notes under it, and the totals', () => {
    expect(ariaRowIndexes([false, true, false], 1, 1)).toEqual({ indexes: [2, 3, 5], count: 6 })
    expect(ariaRowIndexes([], 1, 0)).toEqual({ indexes: [], count: 1 })
  })
})
