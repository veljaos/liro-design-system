/*
 * Sample data for the print template stories (P5.15) and the course stories (P5.12):
 * Kvadrat Gradnja d.o.o.'s invoices, the occupational-safety certificate of a site worker, a
 * school report, a specialist's finding. Fictitious; legal texts and codes are illustrative. The
 * amounts of the long invoice are computed here in whole paras (the application's arithmetic,
 * played by the story data; components never add, D4). Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import { createElement, type ReactElement } from 'react'
import { decimal, paras, sumUnits } from '../components/amounts-story-data'
import type { TaxRecap, TotalsRow } from '../components/document-totals'
import type { LineType } from '../components/line-types'
import type { PrintParty } from './print-templates'

export const SELLER: PrintParty = {
  key: 'seller',
  label: 'Seller',
  name: 'Kvadrat Gradnja d.o.o.',
  lines: ['Temerinski put 51', '21000 Novi Sad, Serbia'],
  details: [
    { key: 'pib', label: 'PIB', value: '109876543', numeric: true },
    { key: 'mb', label: 'MB', value: '21345678', numeric: true },
    { key: 'email', label: 'E-mail', value: 'office@kvadrat-gradnja.rs' },
  ],
}

export const BUYER: PrintParty = {
  key: 'buyer',
  label: 'Buyer',
  name: 'Vojvođanka Mlin a.d.',
  lines: ['Industrijska zona bb', '21400 Bačka Palanka, Serbia'],
  details: [
    { key: 'pib', label: 'PIB', value: '100234567', numeric: true },
    { key: 'mb', label: 'MB', value: '08012345', numeric: true },
    { key: 'email', label: 'E-mail', value: 'nabavka@vojvodjanka-mlin.rs' },
  ],
}

/** One printed line of an invoice. */
export interface PrintLine {
  id: string
  type: LineType
  item: string
  quantity?: string
  unit?: string
  price?: string
  vat?: string
  amount?: string
}

const CATALOGUE: readonly { item: string; unit: string; price: string; vat: string }[] = [
  { item: 'Ready-mixed concrete C25/30, pumped', unit: 'm³', price: '11850.00', vat: 'S 20%' },
  { item: 'Reinforcing steel B500B, cut and bent', unit: 'kg', price: '118.40', vat: 'S 20%' },
  { item: 'Formwork for walls, two-sided, rented', unit: 'm²', price: '960.00', vat: 'S 20%' },
  { item: 'Hollow clay blocks 25 × 19 × 38 cm', unit: 'pc', price: '96.50', vat: 'S 20%' },
  { item: 'Cement mortar M10 in bags of 25 kg', unit: 'bag', price: '540.00', vat: 'S 20%' },
  { item: 'Waterproofing membrane SBS 4 mm', unit: 'm²', price: '1240.00', vat: 'S 20%' },
  { item: 'Mineral wool boards 100 mm, facade', unit: 'm²', price: '1385.00', vat: 'S 20%' },
  { item: 'Crane hire with operator', unit: 'h', price: '7800.00', vat: 'S 20%' },
  { item: 'Site supervision by a licensed engineer', unit: 'h', price: '4200.00', vat: 'S 20%' },
  { item: 'Transport of material to the site', unit: 'trip', price: '9600.00', vat: 'S 20%' },
  { item: 'Technical documentation, printed copies', unit: 'set', price: '6400.00', vat: 'S 10%' },
]

/** price × quantity in whole paras, the quantity with up to two decimals. */
function lineAmount(price: string, quantity: string): bigint {
  return (paras(price) * paras(quantity)) / 100n
}

/**
 * A long invoice: `sections` sections of `perSection` lines each, a heading and a subtotal per
 * section, and its totals and recap (computed here in whole paras, rounded down to the para, as
 * the Core would send them).
 */
export function longInvoice(sections: number, perSection: number) {
  const lines: PrintLine[] = []
  const bases = { 'S 20%': 0n, 'S 10%': 0n }
  for (let section = 0; section < sections; section += 1) {
    lines.push({ id: `h${String(section)}`, type: 'heading', item: `Floor ${String(section + 1)}` })
    const amounts: bigint[] = []
    for (let index = 0; index < perSection; index += 1) {
      const entry = CATALOGUE[(section * perSection + index) % CATALOGUE.length]
      if (entry === undefined) continue
      const quantity = `${String((((section + 2) * (index + 3)) % 47) + 3)}.50`
      const amount = lineAmount(entry.price, quantity)
      amounts.push(amount)
      if (entry.vat === 'S 10%') bases['S 10%'] += amount
      else bases['S 20%'] += amount
      lines.push({
        id: `${String(section)}-${String(index)}`,
        type: 'line',
        item: entry.item,
        quantity,
        unit: entry.unit,
        price: entry.price,
        vat: entry.vat,
        amount: decimal(amount),
      })
    }
    lines.push({
      id: `s${String(section)}`,
      type: 'subtotal',
      item: `Total floor ${String(section + 1)}`,
      amount: decimal(sumUnits(amounts)),
    })
  }
  const tax20 = (bases['S 20%'] * 20n) / 100n
  const tax10 = (bases['S 10%'] * 10n) / 100n
  const net = bases['S 20%'] + bases['S 10%']
  const tax = tax20 + tax10
  const rows: TotalsRow[] = [
    { key: 'net', label: 'Total without VAT', value: decimal(net), currency: 'RSD' },
    { key: 'vat', label: 'VAT', value: decimal(tax), currency: 'RSD' },
  ]
  const recap: TaxRecap = {
    label: 'Recap by tax category',
    headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
    rows: [
      {
        key: 's20',
        category: 'S 20%',
        base: decimal(bases['S 20%']),
        rate: '20',
        tax: decimal(tax20),
      },
      {
        key: 's10',
        category: 'S 10%',
        base: decimal(bases['S 10%']),
        rate: '10',
        tax: decimal(tax10),
      },
    ],
  }
  const total: TotalsRow = {
    key: 'total',
    label: 'Amount due',
    value: decimal(net + tax),
    currency: 'RSD',
  }
  return { lines, rows, recap, total }
}

/** A school report's row: a subject and its grades. */
export interface GradeRow {
  id: string
  type: LineType
  subject: string
  grade?: string
  words?: string
  absences?: string
}

export const GRADES: GradeRow[] = [
  {
    id: 'srp',
    type: 'line',
    subject: 'Serbian language and literature',
    grade: '5',
    words: 'excellent',
    absences: '2',
  },
  {
    id: 'eng',
    type: 'line',
    subject: 'English language',
    grade: '5',
    words: 'excellent',
    absences: '0',
  },
  {
    id: 'ger',
    type: 'line',
    subject: 'German language',
    grade: '4',
    words: 'very good',
    absences: '1',
  },
  { id: 'art', type: 'line', subject: 'Fine arts', grade: '5', words: 'excellent', absences: '0' },
  { id: 'mus', type: 'line', subject: 'Music', grade: '5', words: 'excellent', absences: '0' },
  { id: 'his', type: 'line', subject: 'History', grade: '4', words: 'very good', absences: '3' },
  { id: 'geo', type: 'line', subject: 'Geography', grade: '4', words: 'very good', absences: '1' },
  { id: 'phy', type: 'line', subject: 'Physics', grade: '5', words: 'excellent', absences: '0' },
  {
    id: 'mat',
    type: 'line',
    subject: 'Mathematics',
    grade: '4',
    words: 'very good',
    absences: '2',
  },
  { id: 'bio', type: 'line', subject: 'Biology', grade: '5', words: 'excellent', absences: '0' },
  { id: 'che', type: 'line', subject: 'Chemistry', grade: '4', words: 'very good', absences: '1' },
  {
    id: 'tec',
    type: 'line',
    subject: 'Technology and engineering',
    grade: '5',
    words: 'excellent',
    absences: '0',
  },
  {
    id: 'inf',
    type: 'line',
    subject: 'Informatics and computing',
    grade: '5',
    words: 'excellent',
    absences: '0',
  },
  {
    id: 'pe',
    type: 'line',
    subject: 'Physical and health education',
    grade: '5',
    words: 'excellent',
    absences: '4',
  },
  {
    id: 'avg',
    type: 'subtotal',
    subject: 'Average grade',
    grade: '4,64',
    words: 'excellent',
    absences: '14',
  },
]

/** The finding's long text (anamnesis and the examination), for the long story. */
export const FINDING_PARAGRAPHS: readonly string[] = [
  'The patient, a 41-year-old site worker, comes on referral from the occupational medicine service for a periodic examination of a worker in a job with increased risk (work at height above 3 m, handling of loads over 25 kg).',
  'He reports occasional pain in the lower back after a full shift, without radiation into the legs, which passes with rest. He denies dizziness, loss of consciousness, chest pain or shortness of breath on exertion. He smokes ten cigarettes a day and drinks alcohol occasionally.',
  'Previous illnesses: an appendectomy in 2004; a fracture of the left radius in 2017, healed without consequences. No chronic therapy. No known allergies to medicines.',
  'On examination: conscious, oriented, eupnoeic, afebrile. Skin and visible mucous membranes of normal colour. Blood pressure 135/85 mmHg, pulse 72/min, regular. Heart sounds clear, no murmurs. Breathing vesicular on both sides, no added sounds.',
  'Spine: the physiological curves are kept; mild paravertebral muscle tension in the lumbar part; movements of full range, the end of flexion slightly painful. Lasègue negative on both sides. Neurological findings orderly.',
  'Visual acuity with correction 1,0 on both eyes; colour vision normal (Ishihara); field of vision normal. Hearing: audiometry shows a mild loss at 4 kHz on both sides, within the limits for the job.',
]

/**
 * The certificate at the end of the occupational-safety course (P5.12): Kvadrat Gradnja's site
 * worker Nikola Marković. Without the logo, which the stories draw.
 */
export const SAFETY_CERTIFICATE = {
  title: 'Certificate',
  subtitle: 'of completed training in occupational safety and health',
  lead: 'This certifies that',
  recipient: 'Nikola Marković',
  recipientDetail: 'Site worker, Kvadrat Gradnja d.o.o., born 14.03.1985. in Sombor',
  text: 'has completed the course “Bezbednost i zdravlje na radu” (occupational safety and health on construction sites, 12 lessons) and passed the final test with 9 of 10 correct answers.',
  number: 'No. BZR-2026-0142',
  issued: { place: 'Novi Sad', date: '2026-10-10' },
  signatures: [
    {
      id: 'officer',
      label: 'Occupational safety officer',
      name: 'Jelena Savić',
      detail: 'Licence BZR-0457',
    },
    { id: 'director', label: 'Director', name: 'Dragan Ilić' },
  ],
} as const

// ── P5.12 The occupational-safety course of Kvadrat Gradnja ──

/** The course's lessons, every one with its state as the application sends it. */
const SAFETY_LESSONS: readonly {
  module: string
  key: string
  title: string
  detail: string
}[] = [
  {
    module: 'basics',
    key: 'rights',
    title: 'Rights and duties on the site',
    detail: 'Reading · 8 min',
  },
  {
    module: 'basics',
    key: 'risks',
    title: 'Risk assessment of the workplace',
    detail: 'Video · 12 min',
  },
  {
    module: 'basics',
    key: 'ppe',
    title: 'Personal protective equipment',
    detail: 'Reading · 10 min',
  },
  {
    module: 'height',
    key: 'scaffolding',
    title: 'Scaffolding: assembly and daily checks',
    detail: 'Video · 14 min',
  },
  {
    module: 'height',
    key: 'falls',
    title: 'Fall protection and anchor points',
    detail: 'Reading · 9 min',
  },
  {
    module: 'height',
    key: 'ladders',
    title: 'Ladders and mobile platforms',
    detail: 'Reading · 7 min',
  },
  { module: 'loads', key: 'cranes', title: 'Cranes, slings and signals', detail: 'Video · 11 min' },
  {
    module: 'loads',
    key: 'handling',
    title: 'Manual handling of loads',
    detail: 'Reading · 9 min',
  },
  {
    module: 'loads',
    key: 'electricity',
    title: 'Electrical safety on the site',
    detail: 'Video · 10 min',
  },
  { module: 'emergency', key: 'first-aid', title: 'First aid', detail: 'Video · 15 min' },
  {
    module: 'emergency',
    key: 'fire',
    title: 'Fire safety and evacuation',
    detail: 'Reading · 8 min',
  },
  { module: 'emergency', key: 'test', title: 'Final test', detail: 'Quiz · 10 questions' },
]

const SAFETY_MODULES: readonly { key: string; title: string }[] = [
  { key: 'basics', title: '1. Basics of occupational safety' },
  { key: 'height', title: '2. Work at height' },
  { key: 'loads', title: '3. Machines and loads' },
  { key: 'emergency', title: '4. Emergencies' },
]

/**
 * The course with the first `done` lessons done; the final test is locked (with its reason)
 * until every other lesson is done.
 */
export function safetyCourse(done: number) {
  return SAFETY_MODULES.map((module) => ({
    key: module.key,
    title: module.title,
    lessons: SAFETY_LESSONS.filter((lesson) => lesson.module === module.key).map((lesson) => {
      const index = SAFETY_LESSONS.indexOf(lesson)
      const state: 'done' | 'todo' | 'locked' =
        index < done
          ? 'done'
          : lesson.key === 'test' && done < SAFETY_LESSONS.length - 1
            ? 'locked'
            : 'todo'
      return {
        key: lesson.key,
        title: lesson.title,
        detail: lesson.detail,
        href: `#learning/safety/${lesson.key}`,
        state,
        ...(state === 'locked' ? { lockedReason: 'finish every lesson first' } : {}),
      }
    }),
  }))
}

/** The final test's questions (illustrative, not legal advice). */
export const SAFETY_QUIZ = [
  {
    id: 'height',
    title: 'From what height must a worker be protected against falling?',
    type: 'single' as const,
    options: [
      { value: '1', label: 'From 1 m' },
      { value: '2', label: 'From 2 m' },
      { value: '5', label: 'From 5 m' },
    ],
  },
  {
    id: 'scaffolding',
    title: 'Who checks the scaffolding before work starts each day?',
    type: 'single' as const,
    options: [
      { value: 'any', label: 'Any worker who uses it' },
      { value: 'competent', label: 'A competent person named by the site manager' },
      { value: 'inspector', label: 'The labour inspector' },
    ],
  },
  {
    id: 'equipment',
    title: 'Which equipment must every worker wear on the site?',
    description: 'Choose every answer that applies.',
    type: 'multiple' as const,
    options: [
      { value: 'helmet', label: 'Safety helmet' },
      { value: 'boots', label: 'Safety boots' },
      { value: 'vest', label: 'High-visibility vest' },
      { value: 'gloves', label: 'Welding gloves' },
    ],
  },
]

// ── P5.28 The payment slip's IPS QR code, illustrative ──

/**
 * The modules of an illustrative QR-like code (29 × 29, the size of a version 3 code): the three
 * finder patterns and the timing lines of a real code, the rest from a hash of `text`. **It does
 * not scan:** the application makes the real IPS QR image from the payment's data; the stories
 * only need a stable picture in the slot.
 */
export function illustrativeCodeModules(text: string, size = 29): boolean[][] {
  let hash = 2166136261
  const next = () => {
    hash ^= hash << 13
    hash ^= hash >>> 17
    hash ^= hash << 5
    return (hash >>> 0) % 100
  }
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  const finder = (row: number, column: number) => {
    for (const [top, start] of [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ] as const) {
      const r = row - top
      const c = column - start
      if (r >= -1 && r <= 7 && c >= -1 && c <= 7) {
        if (r < 0 || r > 6 || c < 0 || c > 6) return false
        const ring = Math.min(r, c, 6 - r, 6 - c)
        return ring !== 1
      }
    }
    return undefined
  }
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => {
      const pattern = finder(row, column)
      if (pattern !== undefined) return pattern
      if (row === 6) return column % 2 === 0
      if (column === 6) return row % 2 === 0
      return next() < 48
    }),
  )
}

/** The illustrative code as an SVG image named by `label` (no classes: it takes the text colour). */
export function illustrativeCode(text: string, label: string): ReactElement {
  const modules = illustrativeCodeModules(text)
  const path = modules
    .flatMap((row, y) => row.map((on, x) => (on ? `M${String(x)} ${String(y)}h1v1h-1z` : '')))
    .join('')
  const size = modules.length
  return createElement(
    'svg',
    {
      role: 'img',
      'aria-label': label,
      viewBox: `-2 -2 ${String(size + 4)} ${String(size + 4)}`,
      width: '100%',
      height: '100%',
      shapeRendering: 'crispEdges',
      fill: 'currentColor',
    },
    createElement('path', { d: path }),
  )
}
