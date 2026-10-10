/*
 * The examples' figures checked against each other when the examples load (P4.8 "one dataset",
 * extended for corrective documents in P5): a disagreement throws, so every example story fails
 * instead of showing two different amounts for one invoice. The application's work, played here;
 * components never add. No classes here.
 *
 * - A cancelled invoice (F-2026-0407, cancelled by ST-2026-0004) owes nothing and counts in no
 *   total, count or table: not open, not overdue, not in the overview's largest open invoices,
 *   not in the bank matching's open items, its customer's balance without it.
 * - A decreased invoice (F-2026-0410, decreased by KO-2026-0009) shows its total after the
 *   decrease and owes that less what was paid, in the list, on its page, in the overview, in its
 *   customer's balance.
 */
import { paras } from '../../../../packages/ui/src/components/amounts-story-data'
import { TOTALS_0410 } from './data-A'
import { CANCELLATION, CANCELLED_TOTALS, DECREASE, MEDIC_TOTALS } from './data-D2'
import { KNOWN_CUSTOMERS } from './data-E'
import { INVOICES, isOpen, LARGEST_OPEN, OVERDUE, OVERDUE_TOTAL } from './examples-story-data'
import {
  CLOCK_DAY,
  CLOCK_RECORDS,
  CORRECTED,
  CREW,
  ER_ASSIGNMENTS,
  ER_BALANCE,
  ER_COVERAGE,
  ER_PLAN,
  ER_PUBLISH,
  ER_ROWS,
  hundredths,
  STEFAN_SHIFTS,
  STORE_ASSIGNMENTS,
  STORE_COVERAGE,
  STORE_PUBLISH,
  STORE_ROWS,
  STORE_THIS_WEEK,
  SWAP_REQUESTS,
  TIMESHEET_LOCKED,
  TIMESHEET_OPEN,
  TOTALS_LOCKED,
  TOTALS_OPEN,
} from './data-G'
import {
  ABSENCES,
  ASSESSMENTS,
  ATTENDANCE_VALUE,
  BOOKINGS_BEFORE,
  CHOSEN_DOCTOR,
  DOCTOR_EVENTS,
  FINDING,
  FREE_SLOTS,
  GRADEBOOK_VALUE,
  JOVANA_BOOKING,
  JOVANA_SLOT,
  LUKA,
  SCHOOL,
  TODAY_LESSONS,
  UNAVAILABLE,
} from './data-H'

function fail(message: string): never {
  throw new Error(`Example dataset: ${message}`)
}

function invoice(number: string) {
  return INVOICES.find((each) => each.number === number) ?? fail(`${number} is missing`)
}

function balance(taxId: string): bigint {
  const customer = KNOWN_CUSTOMERS.find((each) => each.taxId === taxId)
  return customer === undefined ? fail(`customer ${taxId} is missing`) : paras(customer.balance)
}

/** What the list's open invoices of one customer owe. */
function openOf(taxId: string): bigint {
  return INVOICES.filter((each) => each.taxId === taxId && isOpen(each)).reduce(
    (total, each) => total + paras(each.open),
    0n,
  )
}

/** The checks; returns the facts they established, for the stories' play functions. */
export function checkDataset() {
  // Cancelled: F-2026-0407.
  const cancelled = invoice(CANCELLATION.invoice)
  if (cancelled.status !== 'Cancelled') fail(`${cancelled.number} is not Cancelled`)
  if (paras(cancelled.open) !== 0n) fail(`${cancelled.number} still owes ${cancelled.open}`)
  if (paras(cancelled.total) !== paras(CANCELLED_TOTALS.total)) {
    fail(`${cancelled.number}: the list's total differs from its document`)
  }
  if (isOpen(cancelled)) fail(`${cancelled.number} counts as open`)
  if (OVERDUE.includes(cancelled)) fail(`${cancelled.number} counts as overdue`)
  if (LARGEST_OPEN.includes(cancelled)) fail(`${cancelled.number} is among the largest open`)
  if (balance(cancelled.taxId) !== openOf(cancelled.taxId)) {
    fail(`${cancelled.customer}'s balance differs from its open invoices`)
  }
  for (const each of INVOICES) {
    if (each.status === 'Cancelled' && paras(each.open) !== 0n) fail(`${each.number} owes`)
  }

  // Decreased: F-2026-0410 by KO-2026-0009.
  const decreased = invoice('F-2026-0410')
  const corrected = paras(MEDIC_TOTALS.total) + paras(DECREASE.change)
  if (paras(decreased.total) !== corrected) fail(`${decreased.number}: total ignores the decrease`)
  if (paras(TOTALS_0410.corrected) !== corrected) fail(`${decreased.number}: page total differs`)
  if (paras(TOTALS_0410.due) !== paras(decreased.open))
    fail(`${decreased.number}: page due differs`)
  if (paras(DECREASE.newTotal) !== corrected) fail('KO-2026-0009: new total differs')
  if (balance(decreased.taxId) !== openOf(decreased.taxId)) {
    fail(`${decreased.customer}'s balance differs from its open invoices`)
  }

  // The overview's overdue receivables: what the overdue invoices of the list still owe.
  const overdue = OVERDUE.reduce((total, each) => total + paras(each.open), 0n)
  if (paras(OVERDUE_TOTAL) !== overdue) fail('overdue receivables differ from the list')

  return { overdueCount: OVERDUE.length, overdueTotal: OVERDUE_TOTAL }
}

/** Hundredths of a value, null as 0 (a total of nothing). */
function h(value: string | null | undefined): number {
  return value == null ? 0 : hundredths(value)
}

/** Minutes after midnight of an instant's clock ("2026-10-29T06:50:00+01:00" → 410). */
function clockOf(instant: string): number {
  const [hours = 0, minutes = 0] = instant.slice(11, 16).split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * P5.24 working time: the timesheet's totals add up both ways, the correction is the only
 * difference after the lock, the clock records give the timesheet's hours, the planners' hours
 * and coverage follow their shifts, the balance's differences and averages follow its hours.
 */
export function checkWorkingTime() {
  for (const [name, value, totals] of [
    ['open', TIMESHEET_OPEN, TOTALS_OPEN],
    ['locked', TIMESHEET_LOCKED, TOTALS_LOCKED],
  ] as const) {
    const byWorker = (id: string) =>
      CREW.reduce((t, worker) => t + h(totals.rowTotals.values[worker.id]?.[id]), 0)
    const byDay = (id: string) =>
      Object.values(totals.columnTotals.values[id] ?? {}).reduce((t: number, v) => t + h(v), 0)
    if (byWorker('worked') !== byDay('worked')) fail(`timesheet ${name}: worked hours differ`)
    if (byWorker('leave') !== byDay('leave')) fail(`timesheet ${name}: leave hours differ`)
    if (byWorker('total') !== byDay('worked') + byDay('leave')) {
      fail(`timesheet ${name}: total hours differ from the days`)
    }
    for (const worker of CREW) {
      const row = totals.rowTotals.values[worker.id]
      if (h(row?.total) !== h(row?.worked) + h(row?.leave)) fail(`${worker.label}: total differs`)
    }
    if (Object.keys(value).length !== CREW.length) fail(`timesheet ${name}: workers differ`)
  }
  const corrected = (t: typeof TOTALS_OPEN) => h(t.rowTotals.values[CORRECTED.row]?.total)
  const added = h(TIMESHEET_LOCKED[CORRECTED.row]?.[CORRECTED.column]?.hours)
  if (corrected(TOTALS_LOCKED) - corrected(TOTALS_OPEN) !== added) {
    fail('the locked month differs from the open one by more than the correction')
  }
  for (const record of CLOCK_RECORDS) {
    const worker = CREW.find((each) => each.label === record.person)
    if (worker === undefined) fail(`${record.person} is not in the crew`)
    const day = TIMESHEET_OPEN[worker.id]?.[CLOCK_DAY]
    if (h(record.duration) !== h(day?.hours)) fail(`${record.person}: clock and timesheet differ`)
    if (record.in === null || record.out === null) fail(`${record.person}: a time is missing`)
    const minutes = (clockOf(record.out) - clockOf(record.in) + 24 * 60) % (24 * 60)
    if (minutes * 100 !== h(record.duration) * 60) fail(`${record.person}: duration differs`)
  }

  const planner = (
    rows: readonly { id: string; hours?: string | null }[],
    assignments: readonly { rowId: string; date: string }[],
    coverage: Readonly<Record<string, { planned: string }>>,
    publish: { shifts: number },
    name: string,
  ) => {
    for (const row of rows) {
      const shifts = assignments.filter((each) => each.rowId === row.id).length
      if (h(row.hours) !== shifts * 800) fail(`${name}: ${row.id}'s hours differ`)
    }
    for (const [date, day] of Object.entries(coverage)) {
      const count = assignments.filter((each) => each.date === date).length
      if (Number(day.planned) !== count) fail(`${name}: coverage of ${date} differs`)
    }
    if (publish.shifts !== assignments.length) fail(`${name}: published shifts differ`)
  }
  planner(STORE_ROWS, STORE_ASSIGNMENTS, STORE_COVERAGE, STORE_PUBLISH, 'store')
  planner(ER_ROWS, ER_ASSIGNMENTS, ER_COVERAGE, ER_PUBLISH, 'emergency')

  // The swap requests: the shift is the person's, and whoever takes it is free that day.
  const works = (name: string, date: string) =>
    STORE_THIS_WEEK.some(
      (each) => each.date === date && each.rowId === name.split(' ')[0]?.toLowerCase(),
    )
  for (const request of SWAP_REQUESTS) {
    if (!works(request.from, request.shift.date)) fail(`${request.id}: not ${request.from}'s shift`)
    if (request.to !== null && request.back !== null && works(request.to, request.shift.date)) {
      fail(`${request.id}: ${request.to} already works that day`)
    }
  }
  const asked = STEFAN_SHIFTS.filter((each) => each.swapState !== undefined).map(
    (each) => each.date,
  )
  const requested = SWAP_REQUESTS.filter((each) => each.from === 'Stefan Lukić').map(
    (each) => each.shift.date,
  )
  if (asked.join() !== requested.join()) fail('Stefan’s swap differs from the requests')

  // The redistribution: difference = worked − planned, average × weeks = worked.
  const weeks = ER_PLAN.weeks.length
  const planned = ER_PLAN.weeks.reduce((t, week) => t + h(week.hours), 0)
  for (const row of ER_BALANCE) {
    if (row.worked === null) {
      if (row.difference !== null || row.average !== null)
        fail(`${row.name}: figures without hours`)
      continue
    }
    if (h(row.planned) !== planned) fail(`${row.name}: planned differs from the plan`)
    if (h(row.difference) !== h(row.worked) - h(row.planned)) fail(`${row.name}: difference`)
    const [whole = '0', fraction = ''] = (row.average ?? '0').split('.')
    const thousandths = Number(whole) * 1000 + Number((fraction + '000').slice(0, 3))
    if (thousandths * weeks !== h(row.worked) * 10) fail(`${row.name}: average differs`)
  }
  return { workers: CREW.length, records: CLOCK_RECORDS.length }
}

/**
 * P5.17 health and school: the portal offers only free times, Jovana's booking is one of them and
 * the clinic's schedule, the doctor's calendar and her finding show it; the parents' portal shows
 * the absences the teachers marked.
 */
export function checkIndustry() {
  const minutes = (local: string) => {
    const [hours = 0, mins = 0] = local.slice(11, 16).split(':').map(Number)
    return hours * 60 + mins
  }
  const overlaps = (a: { start: string; end?: string }, b: { start: string; end: string }) =>
    a.start.slice(0, 10) === b.start.slice(0, 10) &&
    minutes(a.start) < minutes(b.end) &&
    minutes(b.start) < minutes(a.end ?? a.start)
  for (const slot of FREE_SLOTS) {
    const busy = BOOKINGS_BEFORE.find(
      (each) => each.resourceId === slot.resourceId && overlaps(slot, each),
    )
    if (busy !== undefined) fail(`free time ${slot.start} is booked`)
    const away = UNAVAILABLE.find(
      (each) => each.resourceId === slot.resourceId && overlaps(slot, each),
    )
    if (away !== undefined) fail(`free time ${slot.start} is unavailable`)
  }
  const chosen = FREE_SLOTS.find((each) => each.id === JOVANA_SLOT)
  if (chosen?.start !== JOVANA_BOOKING.start) fail('Jovana’s booking is not a free time')
  if (FINDING.next !== JOVANA_BOOKING.start) fail('the finding’s next appointment differs')
  const own = [...BOOKINGS_BEFORE, JOVANA_BOOKING].filter((b) => b.resourceId === CHOSEN_DOCTOR)
  if (own.some((b) => !DOCTOR_EVENTS.some((event) => event.id === b.id))) {
    fail('the doctor’s calendar misses a booking')
  }

  const today = ABSENCES.filter((each) => each.date === SCHOOL.day).map((each) => each.lesson)
  const marked = TODAY_LESSONS.flatMap((lesson, index) =>
    ATTENDANCE_VALUE[LUKA]?.[lesson.id]?.code === 'absent' ? [index + 1] : [],
  )
  if (today.join() !== marked.join()) fail('Luka’s absences today differ from the grid')
  for (const assessment of ASSESSMENTS) {
    const away = ABSENCES.filter((each) => each.date === assessment.date).length
    if (away === 6 && GRADEBOOK_VALUE[LUKA]?.[assessment.id] !== undefined) {
      fail(`Luka has a mark on ${assessment.date ?? ''}, when he was away all day`)
    }
  }
  return { freeTimes: FREE_SLOTS.length, absences: ABSENCES.length }
}

/** Run once, when the examples load. */
export const DATASET = checkDataset()
export const WORKING_TIME = checkWorkingTime()
export const INDUSTRY = checkIndustry()
