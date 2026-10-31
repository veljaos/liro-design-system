/*
 * Bank statement 189 of 7 October 2026 (Banca Intesa) of Kvadrat Gradnja d.o.o.: 1,240 lines,
 * generated (the bank statement works with 1,000+ lines). The buyers of
 * the Temerinski put apartments pay their October instalments; most pay with the instalment's
 * reference and are matched automatically, some pay without a reference (the Core suggests the
 * buyer's instalment), some pay part of it, a few payers are unknown, and the bank charges its
 * fees for the incoming payments. Every name, account, reference and amount is invented, from a
 * fixed seed, so the stories see the same statement every time. Amounts are whole paras
 * (BigInt); the closing balance is the opening one (statement 188's closing) plus the lines,
 * checked in `statementData`. Not part of the package. No classes here.
 */
import {
  decimal,
  statementData,
  STATEMENT,
  type BankLine,
  type LineSuggestion,
  type OpenItem,
  type StatementData,
} from './data-bank'
import { viewer } from '../../../../packages/ui/src/components/document-frame-story-data'

/** How many lines statement 189 has. */
export const LINES_189 = 1240

const FIRST = [
  'Ana',
  'Marko',
  'Jelena',
  'Nikola',
  'Milica',
  'Stefan',
  'Ivana',
  'Dušan',
  'Tamara',
  'Nemanja',
  'Jovana',
  'Luka',
  'Marija',
  'Filip',
  'Teodora',
  'Vuk',
  'Sara',
  'Aleksandar',
  'Katarina',
  'Đorđe',
  'Mina',
  'Uroš',
  'Nevena',
  'Miloš',
  'Isidora',
  'Lazar',
  'Sofija',
  'Bojan',
  'Dragana',
  'Ognjen',
]

const LAST = [
  'Petrović',
  'Nikolić',
  'Marković',
  'Đorđević',
  'Stojanović',
  'Ilić',
  'Pavlović',
  'Milošević',
  'Stanković',
  'Todorović',
  'Kostić',
  'Popović',
  'Mitić',
  'Savić',
  'Ristić',
  'Lazić',
  'Simić',
  'Vasić',
  'Obradović',
  'Kovačević',
  'Antić',
  'Tomić',
  'Ćirić',
  'Lukić',
  'Matić',
  'Živković',
  'Radović',
  'Bogdanović',
  'Krstić',
  'Gavrilović',
]

/** The instalments of the apartments' contracts, in whole paras. */
const INSTALMENTS = [38_500_00n, 42_750_00n, 51_200_00n, 64_900_00n, 72_300_00n, 85_000_00n]

/** A fixed pseudo-random sequence (mulberry32), so every run sees the same statement. */
function sequence(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function pick<Value>(values: readonly Value[], random: () => number): Value {
  const value = values[Math.floor(random() * values.length)]
  if (value === undefined) throw new Error('Example dataset: nothing to pick from')
  return value
}

/** A made-up account at a Serbian bank: bank code, account number and two check digits. */
function account(random: () => number): string {
  const bank = pick(['160', '170', '205', '265', '325', '340', '355'], random)
  const number = String(Math.floor(random() * 1e13)).padStart(13, '0')
  const check = String(10 + Math.floor(random() * 89))
  return `${bank}-${number}-${check}`
}

type Kind = 'exact' | 'noReference' | 'partial' | 'unknown' | 'fee'

/** What kind each line is: mostly exact instalments, and a fixed share of each other kind. */
function kindOf(index: number): Kind {
  if (index % 97 === 13) return 'unknown'
  if (index % 200 === 57) return 'fee'
  if (index % 53 === 11) return 'partial'
  if (index % 29 === 7) return 'noReference'
  return 'exact'
}

const STATEMENT_189 = {
  ...STATEMENT,
  number: '189',
  date: '2026-10-07',
  /** Statement 188's closing balance. */
  opening: STATEMENT.closing,
  file: 'izvod-189.pdf',
  imported: 'Imported from Banca Intesa on 07.10.2026. at 07:35',
}

const random = sequence(189)
const lines: BankLine[] = []
const openItems: OpenItem[] = []
const suggestions: Record<string, LineSuggestion> = {}
const candidates: StatementData['candidates'] = {}

for (let index = 0; index < LINES_189; index += 1) {
  const no = index + 1
  const id = `c${String(no)}`
  const kind = kindOf(index)
  const name = `${pick(FIRST, random)} ${pick(LAST, random)}`
  const partyAccount = account(random)
  const contract = `UG-2025-${String(1000 + index)}`
  const invoice = `F-2026-${String(2001 + index)}`
  const reference = `2610${String(no).padStart(5, '0')}`
  const instalment = pick(INSTALMENTS, random)
  const base = { id, no, valueDate: STATEMENT_189.date, party: name, partyAccount }

  if (kind === 'fee') {
    lines.push({
      ...base,
      party: 'Banca Intesa a.d. Beograd',
      partyAccount: '160-0000000000001-07',
      paras: -1_850_00n,
      code: '290',
      model: '',
      reference: '',
      purpose: 'Naknada za priliv, paket Biznis',
    })
    suggestions[id] = {
      decision: {
        kind: 'account',
        type: 'fee',
        account: '5530',
        text: 'Fees for incoming payments',
        costCentre: '',
      },
      reason: 'Recognised: a fee charged by Banca Intesa',
      labels: ['Bank fee', 'Charged by Banca Intesa'],
      match: 'exact',
    }
    continue
  }
  if (kind === 'unknown') {
    lines.push({
      ...base,
      paras: (5n + BigInt(Math.floor(random() * 25))) * 1_000_00n,
      code: '289',
      model: '',
      reference: '',
      purpose: 'Uplata',
    })
    candidates[id] = []
    continue
  }

  // An instalment: the buyer's invoice is open, whatever the payment says.
  openItems.push({
    id: invoice,
    kind: 'Invoice',
    side: 'customer',
    partner: name,
    due: '2026-10-05',
    paras: instalment,
  })
  const partial = kind === 'partial'
  const withReference = kind !== 'noReference'
  lines.push({
    ...base,
    paras: partial ? instalment / 2n : instalment,
    code: '289',
    model: withReference ? '97' : '',
    reference: withReference ? reference : '',
    purpose: withReference ? `Rata za stan po ugovoru ${contract}, oktobar 2026` : 'Rata oktobar',
  })
  suggestions[id] = {
    decision: { kind: 'close', items: [invoice], difference: 'open' },
    ...(kind === 'exact'
      ? {
          reason: 'Exact: amount and reference',
          labels: ['Amount matches', 'Reference matches'],
          match: 'exact' as const,
        }
      : kind === 'partial'
        ? {
            reason: 'Same buyer and reference; pays half of the instalment',
            labels: ['Same buyer', 'Reference matches', 'Pays part'],
            match: 'suggestion' as const,
          }
        : {
            reason: 'Same buyer and amount; the payment has no reference',
            labels: ['Same buyer', 'Amount matches', 'No reference'],
            match: 'suggestion' as const,
          }),
  }
  candidates[id] = [
    {
      id: invoice,
      reason: {
        text: kind === 'exact' ? 'Exact: amount and reference' : 'Same buyer, October instalment',
      },
    },
  ]
}

const closing = lines.reduce((total, line) => total + line.paras, STATEMENT_189.opening)

/** Statement 189: 1,240 generated lines. */
export const STATEMENT_189_DATA: StatementData = statementData({
  statement: { ...STATEMENT_189, closing },
  lines,
  suggestions,
  candidates,
  proformas: {},
  openItems,
  viewer: viewer({
    title: `Izvod br. ${STATEMENT_189.number}`,
    lang: 'sr-Latn',
    pages: [
      `<h1>Izvod br. ${STATEMENT_189.number} od 07.10.2026.</h1>
       <p>Banca Intesa a.d. Beograd. Račun ${STATEMENT_189.account}, Kvadrat Gradnja d.o.o., Novi Sad.</p>
       <p>Prethodno stanje: ${decimal(STATEMENT_189.opening)}. Novo stanje: ${decimal(closing)}.</p>
       <p>Stavke 1–${String(LINES_189)} su navedene u prilogu.</p>`,
      `<h2>Prve stavke</h2>
       <p>${lines
         .slice(0, 20)
         .map((each) => `${String(each.no)}. ${each.party}: ${each.purpose}`)
         .join('<br>')}</p>`,
    ],
  }),
})
