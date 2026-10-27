import { describe, expect, it } from 'vitest'
import {
  autoOpen,
  changedStep,
  flattenTrace,
  isExternalLink,
  planProgress,
  queueGroups,
  summaryStatus,
  traceStatuses,
  uniqueSources,
  type TraceStep,
} from './trace-logic'

const READ: TraceStep = { id: 'a', title: 'Read statement 188' }
const MATCHING: TraceStep = {
  id: 'b',
  title: 'Matching payments',
  status: 'running',
  steps: [
    { id: 'b1', title: 'Matched 4 lines' },
    { id: 'b2', title: 'Match the rest', status: 'pending' },
  ],
}
const STEPS: TraceStep[] = [
  READ,
  MATCHING,
  { id: 'c', title: 'Post the matches', status: 'pending' },
]

describe('flattenTrace and traceStatuses', () => {
  it('lists nested steps after their parent, done by default', () => {
    expect(flattenTrace(STEPS).map((step) => step.id)).toEqual(['a', 'b', 'b1', 'b2', 'c'])
    expect(traceStatuses(STEPS)).toEqual({
      a: 'done',
      b: 'running',
      b1: 'done',
      b2: 'pending',
      c: 'pending',
    })
  })
})

describe('changedStep', () => {
  it('names the last step whose status changed, never a waiting one', () => {
    const before = traceStatuses(STEPS)
    const after: TraceStep[] = [
      READ,
      { ...MATCHING, status: 'done', title: 'Matched 12 payments' },
      { id: 'c', title: 'Posting the matches', status: 'running' },
    ]
    expect(changedStep(before, after)?.id).toBe('c')
    expect(changedStep(before, STEPS)).toBeNull()
    expect(changedStep({}, [{ id: 'x', title: 'Wait', status: 'pending' }])).toBeNull()
  })
})

describe('summaryStatus', () => {
  it('follows the steps', () => {
    expect(summaryStatus([])).toBe('done')
    expect(summaryStatus([{ id: '1', title: '' }])).toBe('done')
    expect(summaryStatus([{ id: '1', title: '', status: 'pending' }])).toBe('pending')
    expect(
      summaryStatus([
        { id: '1', title: '' },
        { id: '2', title: '', status: 'pending' },
      ]),
    ).toBe('running')
    expect(summaryStatus([{ id: '1', title: '', status: 'error' }, ...STEPS])).toBe('error')
  })
})

describe('planProgress and queueGroups', () => {
  it('counts the done steps of a plan', () => {
    expect(planProgress(STEPS)).toEqual({ done: 1, total: 3 })
  })

  it('splits a queue keeping the order', () => {
    const { toDo, completed } = queueGroups([
      { id: '1', title: 'One', done: true },
      { id: '2', title: 'Two', done: false },
      { id: '3', title: 'Three', done: true },
    ])
    expect(toDo.map((item) => item.id)).toEqual(['2'])
    expect(completed.map((item) => item.id)).toEqual(['1', '3'])
  })
})

describe('sources', () => {
  it('removes duplicates by id or address', () => {
    const unique = uniqueSources([
      { id: 'f', href: '#/sales/invoices/F-2026-0412' },
      { id: 'f', href: '#/elsewhere' },
      { id: 'g', href: '#/sales/invoices/F-2026-0412/' },
      { id: 'w', href: 'HTTPS://NBS.RS/en/' },
      { id: 'w2', href: 'https://nbs.rs/en' },
      { id: 'a', href: '#/accounts/2040' },
    ])
    expect(unique.map((item) => item.id)).toEqual(['f', 'w', 'a'])
  })

  it('opens http(s) addresses in a new tab unless told', () => {
    expect(isExternalLink({ href: 'https://nbs.rs' })).toBe(true)
    expect(isExternalLink({ href: '#/accounts/2040' })).toBe(false)
    expect(isExternalLink({ href: 'https://intranet', external: false })).toBe(false)
    expect(isExternalLink({ href: '/files/1', external: true })).toBe(true)
  })
})

describe('autoOpen', () => {
  it('opens while running and closes when done, unless the user toggled it', () => {
    expect(autoOpen('running', null)).toBe(true)
    expect(autoOpen('done', null)).toBe(false)
    expect(autoOpen('done', true)).toBe(true)
    expect(autoOpen('running', false)).toBe(false)
  })
})
