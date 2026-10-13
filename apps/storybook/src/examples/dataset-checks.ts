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

// ── P5.17 group J ──
// Invoice F-2026-0412 on paper shows the lines and totals of its page (the same objects); they
// must add up: each tax category's lines to its base, the bases, VAT and the exempt deposit to
// the total, the total less the advance to the amount due, as in the invoice list. The report
// card's average is the school's arithmetic: the mean of the final grades to two decimals, half
// up; its hours absent add up to the subjects' and to excused and unexcused.
import {
  FIRST_ATTEMPT,
  PASS_MARK,
  PRINTED_INVOICE,
  PRINTED_LINES,
  PRINTED_TOTALS,
  REPORT_TOTALS,
  SECOND_ATTEMPT,
  SUBJECTS,
} from './data-J'

function checkGroupJ() {
  const base = (vat: string) =>
    PRINTED_LINES.filter((line) => line.vat === vat).reduce(
      (total, line) => total + paras(line.amount),
      0n,
    )
  for (const line of PRINTED_LINES) {
    if ((paras(line.price) * paras(line.quantity)) / 100n !== paras(line.amount)) {
      fail(`${PRINTED_INVOICE.number}: line ${line.id} is not quantity × price`)
    }
  }
  const totals = PRINTED_TOTALS
  if (base('S 20%') !== paras(totals.base20)) fail(`${PRINTED_INVOICE.number}: base S 20% differs`)
  if (base('S 10%') !== paras(totals.base10)) fail(`${PRINTED_INVOICE.number}: base S 10% differs`)
  if (base('E') !== paras(totals.exempt)) fail(`${PRINTED_INVOICE.number}: exempt amount differs`)
  if ((paras(totals.base20) * 20n) / 100n !== paras(totals.vat20)) fail('VAT S 20% differs')
  if ((paras(totals.base10) * 10n) / 100n !== paras(totals.vat10)) fail('VAT S 10% differs')
  const total =
    paras(totals.base20) +
    paras(totals.vat20) +
    paras(totals.base10) +
    paras(totals.vat10) +
    paras(totals.exempt)
  if (total !== paras(totals.total)) fail(`${PRINTED_INVOICE.number}: total differs from its rows`)
  if (paras(PRINTED_INVOICE.total) !== total) fail(`${PRINTED_INVOICE.number}: list total differs`)
  if (total + paras(totals.advance) !== paras(totals.due)) fail('amount due differs')
  if (paras(PRINTED_INVOICE.open) !== paras(totals.due)) fail('list amount due differs')

  // The report card: the mean of the grades in hundredths, half up.
  const sum = SUBJECTS.reduce((total, row) => total + BigInt(row.grade), 0n)
  const thousandths = (sum * 1000n) / BigInt(SUBJECTS.length)
  if ((thousandths + 5n) / 10n !== paras(REPORT_TOTALS.average)) {
    fail('report card: the average grade differs from the grades')
  }
  const absent = SUBJECTS.reduce((total, row) => total + BigInt(row.absences), 0n)
  if (absent !== BigInt(REPORT_TOTALS.absences)) fail('report card: hours absent differ')
  if (BigInt(REPORT_TOTALS.excused) + BigInt(REPORT_TOTALS.unexcused) !== absent) {
    fail('report card: excused and unexcused hours differ from the total')
  }

  // The final test: the first attempt not passed, the second passed.
  if (FIRST_ATTEMPT.passed || FIRST_ATTEMPT.correct >= PASS_MARK) fail('first attempt passes')
  if (!SECOND_ATTEMPT.passed) fail('second attempt does not pass')
}

checkGroupJ()

// ── P5.17 group I: the till and the handheld ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import {
  cashOutcome,
  computeSale,
  COUNT_DIFFERENCES,
  COUNT_RECORDS,
  countItems,
  CURRENT_PICK,
  PICK_LINES,
  QUICK_AMOUNTS,
  SALE,
  SALE_FIGURES,
} from './data-I'

/**
 * The till's sale and the handheld's figures (P5.17): what the screens compute from the lines
 * equals what the data states — the subtotal, the loyalty discount, the total, the tax included
 * per category, the change from the first banknote offered; the pick list at "4 of 12" with its
 * current line open; every counted difference.
 */
export function checkGroupI() {
  const sale = computeSale(SALE)
  const vat = (category: string) =>
    sale.vat.find((each) => each.category === category)?.vat ?? fail(`no VAT ${category}`)
  if (SALE.length < 5 || SALE.length > 6) fail('the till’s cart has 5–6 lines')
  if (sale.subtotal !== paras(SALE_FIGURES.subtotal)) fail('the till’s subtotal differs')
  if (sale.discounts !== paras(SALE_FIGURES.discounts)) fail('the till’s discount differs')
  if (sale.total !== paras(SALE_FIGURES.total)) fail('the till’s total differs')
  if (sale.subtotal - sale.discounts !== sale.total) fail('the till’s total ignores the discount')
  if (vat('E') !== paras(SALE_FIGURES.vatE)) fail('the till’s VAT 10% differs')
  if (vat('Đ') !== paras(SALE_FIGURES.vatD)) fail('the till’s VAT 20% differs')
  const first = QUICK_AMOUNTS[0] ?? fail('no banknote offered')
  if (paras(first) !== paras(SALE_FIGURES.tendered)) fail('the cash tendered is not offered')
  const cash = cashOutcome(sale.total, SALE_FIGURES.tendered)
  if (cash.change === null || paras(cash.change) !== paras(SALE_FIGURES.change)) {
    fail('the till’s change differs')
  }
  const done = PICK_LINES.filter((line) => line.state !== 'open').length
  if (done !== 4 || PICK_LINES.length !== 12) fail('the pick list is not at 4 of 12')
  if (PICK_LINES.find((line) => line.id === CURRENT_PICK)?.state !== 'open') {
    fail('the current pick line is not open')
  }
  if (!PICK_LINES.some((line) => line.state === 'skipped' && line.note !== undefined)) {
    fail('no skipped line with its reason')
  }
  for (const item of countItems(COUNT_RECORDS)) {
    if (item.difference !== COUNT_DIFFERENCES[item.id]) fail(`count ${item.id}: difference differs`)
  }
  return { saleTotal: SALE_FIGURES.total, change: SALE_FIGURES.change }
}

/** Run once, when the examples load. */
export const GROUP_I = checkGroupI()

// ── P5.25 group K: floor plans and seating ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import { seatingCounts } from '../../../../packages/ui/src/components/seating-logic'
import { overlappingItems } from '../../../../packages/ui/src/components/floor-plan-logic'
import {
  BISTRO_TABLES,
  bistroItems,
  CAFE_TABLES,
  computeOrder,
  GALA_GUESTS,
  GALA_SEATED,
  GALA_TABLES,
  mergedBox,
  TABLE_3_FIGURES,
} from './data-K'

/**
 * The floor plans' and the seating's figures (P5.25): no two tables of Bistro Dunav overlap, a
 * party never exceeds its table, terrace tables 11 and 12 touch so they can be merged; table 3's
 * order on the café's till totals what the data states, its VAT included too; the gala dinner
 * seats 112 of 140, no seat twice and no seat a table does not have.
 */
export function checkGroupK() {
  const items = bistroItems(BISTRO_TABLES, (value) => value).filter((item) => item.kind === 'table')
  if (overlappingItems(items).length > 0) fail('Bistro Dunav: two tables overlap')
  for (const table of BISTRO_TABLES) {
    if (table.party !== undefined && table.party.size > table.seats) {
      fail(`Bistro Dunav: table ${String(table.number)} has more guests than seats`)
    }
  }
  const t11 = BISTRO_TABLES.find((table) => table.id === 't11')
  const t12 = BISTRO_TABLES.find((table) => table.id === 't12')
  if (t11 === undefined || t12 === undefined || mergedBox(t11, t12) === null) {
    fail('Bistro Dunav: tables 11 and 12 cannot be merged')
  }
  const order = computeOrder(CAFE_TABLES.find((table) => table.id === 't3')?.order ?? [])
  if (order.total !== paras(TABLE_3_FIGURES.total)) fail('Kod Mike: table 3’s total differs')
  if (order.vat !== paras(TABLE_3_FIGURES.vat)) fail('Kod Mike: table 3’s VAT differs')
  const counts = seatingCounts(GALA_GUESTS)
  if (counts.seated !== GALA_SEATED.seated || counts.total !== GALA_SEATED.total) {
    fail('the gala’s seated count differs')
  }
  const seats = new Set<string>()
  for (const guest of GALA_GUESTS) {
    if (guest.seat == null) continue
    const key = `${guest.seat.tableId}#${String(guest.seat.seat)}`
    if (seats.has(key)) fail(`the gala seats two guests on ${key}`)
    seats.add(key)
    const table = GALA_TABLES.find((each) => each.id === guest.seat?.tableId)
    if (table === undefined || guest.seat.seat > table.seats) fail(`no seat ${key} at the gala`)
  }
  if (new Set(GALA_GUESTS.map((guest) => guest.name)).size !== GALA_GUESTS.length) {
    fail('two gala guests share a name')
  }
  return counts
}

/** Run once, when the examples load. */
export const GROUP_K = checkGroupK()

// ── P5.25a group N: a warehouse, a ward, an office ──
import {
  areaContains,
  overlappingItems as overlappingN,
  type FloorArea,
  type FloorItem,
} from '../../../../packages/ui/src/components/floor-plan-logic'
import {
  bedItems,
  BEDS,
  binItems,
  BINS,
  DESK_BOOKINGS,
  deskItems,
  DESKS,
  OFFICE,
  OFFICE_AREAS,
  WARD_AREAS,
  WAREHOUSE_AREAS,
} from './data-N'
import {
  COUNT as COUNT_N,
  COUNT_RECORDS as COUNT_RECORDS_N,
  PICK_LINES as PICK_LINES_N,
} from './data-I'

/** Every place stands inside its own area (its centre), and no two places overlap. */
function placesFit(what: string, items: readonly FloorItem[], areas: readonly FloorArea[]) {
  for (const item of items) {
    const area = areas.find((each) => each.id === item.areaId)
    const centre = { x: item.x + item.width / 2, y: item.y + item.height / 2 }
    if (area === undefined || !areaContains(area, centre)) {
      fail(`${what}: ${item.label} is not inside its area`)
    }
  }
  if (overlappingN(items).length > 0) fail(`${what}: two places overlap`)
}

/**
 * The three plans of P5.25a: every bin, bed and desk inside its zone, room or area (polygons
 * included) and none overlapping; the pick list's locations hold its items and A-02-03 holds
 * what its count expects; occupied beds have a patient and only they; nobody books two desks a
 * day, and no booking is on a desk out of use.
 */
export function checkGroupN() {
  if (new Set(BINS.map((bin) => bin.code)).size !== BINS.length) fail('two bins share a code')
  placesFit('Magacin Novi Sad', binItems(BINS), WAREHOUSE_AREAS)
  for (const line of PICK_LINES_N) {
    const bin = BINS.find((each) => each.code === line.location)
    if (!bin?.stock.some((stock) => stock.itemCode === line.itemCode)) {
      fail(`Magacin Novi Sad: ${line.location} does not hold ${line.item}`)
    }
  }
  const counted = BINS.find((bin) => bin.code === COUNT_N.location)
  for (const record of COUNT_RECORDS_N) {
    const stock = counted?.stock.find((line) => line.itemCode === record.itemCode)
    if (stock?.quantity !== record.expected) {
      fail(`Magacin Novi Sad: ${COUNT_N.location} does not hold what the count expects`)
    }
  }
  placesFit('Interno odeljenje 3', bedItems(BEDS), WARD_AREAS)
  for (const bed of BEDS) {
    if ((bed.state === 'occupied') !== (bed.patient !== undefined)) {
      fail(`Interno odeljenje 3: bed ${String(bed.number)} and its patient disagree`)
    }
  }
  placesFit('the office', deskItems(DESKS, {}), OFFICE_AREAS)
  for (const [day, booked] of Object.entries(DESK_BOOKINGS)) {
    if (Object.values(booked).filter((name) => name === OFFICE.me).length > 1) {
      fail(`the office: two desks for ${OFFICE.me} on ${day}`)
    }
    if (new Set(Object.values(booked)).size !== Object.values(booked).length) {
      fail(`the office: someone books two desks on ${day}`)
    }
    for (const id of Object.keys(booked)) {
      const desk = DESKS.find((each) => each.id === id)
      if (desk === undefined || desk.outOfUse !== undefined) fail(`the office: ${id} on ${day}`)
    }
  }
  return { bins: BINS.length, beds: BEDS.length, desks: DESKS.length }
}

/** Run once, when the examples load. */
export const GROUP_N = checkGroupN()

// ── P5.28 pos: the till's fiscal flows and the tabs on tables ──
// (Imports here, inside the block, so the blocks merge without touching the top.)
import {
  advanceDeduction,
  dailyFigures,
  entryTotal,
  JOURNAL,
  MIXED_PARTS,
  ORIGINAL_ID,
  paymentFigures,
  REFUND_CHOICE,
  refundFigures,
  WEB_ORDER,
} from './data-I-fiscal'
import { BISTRO_VENUE, CAFE_VENUE, computeTab, equalShares, initialTabs } from './data-K-tabs'
import { computeSale as computeTill, SALE as TILL_SALE } from './data-I'

/** The figures the P5.28 stories state, against the application's arithmetic. */
export function checkFiscalAndTabs() {
  const sale = computeTill(TILL_SALE).total
  const mixed = paymentFigures(sale, MIXED_PARTS, '500', true)
  if (mixed.remaining !== paras('407') || mixed.change !== '93.00') {
    fail('the till: the mixed payment’s remaining amount or change differs')
  }
  for (const entry of JOURNAL) {
    if (entry.type === 'proforma') continue
    const paid = entry.payments.reduce((sum, part) => sum + paras(part.value), 0n)
    const total = entryTotal(entry)
    if (paid !== (total < 0n ? -total : total)) fail(`the journal: ${entry.number} is not paid`)
  }
  const original = JOURNAL.find((each) => each.id === ORIGINAL_ID)
  if (original === undefined || refundFigures(original, REFUND_CHOICE).total !== paras('240')) {
    fail('the refund example is not 240,00')
  }
  if (sale - advanceDeduction(sale, ['a2265']) !== paras('707')) {
    fail('the advances example does not leave 707,00 to pay')
  }
  if (computeTill(WEB_ORDER.lines).total !== paras(WEB_ORDER.payment.value)) {
    fail('the web order is not paid in full')
  }
  const day = dailyFigures(JOURNAL)
  if (day.net !== day.sales - day.refunds) fail('the daily report does not add up')
  const cafe = initialTabs(CAFE_VENUE)
  const t3 = cafe.t3
  if (t3 === undefined || computeTab(CAFE_VENUE, t3).total !== paras('1200')) {
    fail('Kafić Kod Mike: table 3’s tab is not 1.200,00')
  }
  const t1 = cafe.t1
  if (t1 === undefined || computeTab(CAFE_VENUE, t1).total !== paras('320')) {
    fail('Kafić Kod Mike: table 1’s 3 for 2 is not 320,00')
  }
  const shares = equalShares(paras('1200'), 4)
  if (shares.reduce((sum, each) => sum + each, 0n) !== paras('1200')) fail('the shares differ')
  const t7 = initialTabs(BISTRO_VENUE).t7
  if (t7 === undefined || computeTab(BISTRO_VENUE, t7).promotions.length !== 1) {
    fail('Bistro Dunav: table 7’s dessert promotion is missing')
  }
  return { journal: JOURNAL.length }
}

/** Run once, when the examples load. */
export const FISCAL_AND_TABS = checkFiscalAndTabs()
