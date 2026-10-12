import type { TreeNode } from './tree-logic'

/*
 * Data of the TreeView and TreeTable stories (P5.9): fictitious, Serbian. Not part of the
 * package: nothing in src/index.ts imports this file. No classes here: Storybook compiles classes
 * only from *.stories.tsx files.
 */

/** An account's turnover and balance, as decimal strings (the application's numbers). */
export interface AccountFigures {
  debit: string
  credit: string
  balance: string
}

/** Cents of a decimal string with two decimals, for the stories' own sums (the application's). */
function cents(value: string): bigint {
  const [whole = '0', fraction = '0'] = value.split('.')
  const negative = whole.startsWith('-')
  const amount = BigInt(whole.replace('-', '')) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
  return negative ? -amount : amount
}

function text(amount: bigint): string {
  const negative = amount < 0n
  const absolute = negative ? -amount : amount
  const whole = absolute / 100n
  const fraction = (absolute % 100n).toString().padStart(2, '0')
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}`
}

/** A leaf account: its debit and credit; the balance is debit − credit. */
function account(code: string, label: string, debit: string, credit: string) {
  return {
    id: code,
    code,
    label,
    children: [],
    data: { debit, credit, balance: text(cents(debit) - cents(credit)) },
  } satisfies TreeNode<AccountFigures>
}

/** A group: the sums of its children, as the application's books give them. */
function group(
  code: string,
  label: string,
  children: TreeNode<AccountFigures>[],
): TreeNode<AccountFigures> {
  const sum = (key: keyof AccountFigures) =>
    text(children.reduce((total, child) => total + cents(child.data?.[key] ?? '0'), 0n))
  return {
    id: code,
    code,
    label,
    children,
    data: { debit: sum('debit'), credit: sum('credit'), balance: sum('balance') },
  }
}

/** The chart of accounts (kontni plan) of Kvadrat Gradnja d.o.o., January–September 2026. */
export const CHART_OF_ACCOUNTS: TreeNode<AccountFigures>[] = [
  group('0', 'Stalna imovina', [
    group('01', 'Nematerijalna imovina', [
      account('010', 'Ulaganja u razvoj', '1250000.00', '0.00'),
      account('014', 'Softver i ostala prava', '864500.00', '172900.00'),
    ]),
    group('02', 'Nekretnine, postrojenja i oprema', [
      account('020', 'Zemljište', '18400000.00', '0.00'),
      account('022', 'Građevinski objekti', '42750000.00', '1425000.00'),
      account('023', 'Postrojenja i oprema', '23618400.50', '3936400.25'),
    ]),
  ]),
  group('1', 'Zalihe', [
    group('10', 'Materijal', [
      account('101', 'Materijal u magacinu', '9845230.40', '7120450.10'),
      account('103', 'Rezervni delovi', '412800.00', '96300.00'),
    ]),
    group('13', 'Roba', [
      account('132', 'Roba u magacinu', '3218400.00', '2876150.00'),
      account('134', 'Roba u prometu na malo', '0.00', '0.00'),
    ]),
  ]),
  group('2', 'Kratkoročna potraživanja, plasmani i gotovina', [
    group('20', 'Potraživanja po osnovu prodaje', [
      account('204', 'Kupci u zemlji', '68412900.00', '51208330.60'),
      account('205', 'Kupci u inostranstvu', '7314250.00', '6980100.00'),
    ]),
    group('24', 'Gotovinski ekvivalenti i gotovina', [
      account('241', 'Tekući (poslovni) računi', '74120600.35', '69874215.80'),
      account('243', 'Blagajna', '312000.00', '298450.00'),
    ]),
    group('27', 'Porez na dodatu vrednost', [
      account('270', 'PDV u primljenim fakturama po opštoj stopi', '6418230.00', '6418230.00'),
      account('271', 'PDV u primljenim fakturama po posebnoj stopi', '84210.00', '84210.00'),
    ]),
  ]),
  group('3', 'Kapital', [
    group('30', 'Osnovni kapital', [
      account('302', 'Udeli društava s ograničenom odgovornošću', '0.00', '30000000.00'),
    ]),
    group('34', 'Neraspoređeni dobitak', [
      account('340', 'Neraspoređeni dobitak ranijih godina', '0.00', '12486000.00'),
    ]),
  ]),
  group('4', 'Dugoročna rezervisanja i obaveze', [
    group('43', 'Obaveze iz poslovanja', [
      account('435', 'Dobavljači u zemlji', '38214600.00', '45120380.50'),
      account('436', 'Dobavljači u inostranstvu', '2140000.00', '2386410.00'),
    ]),
    group('45', 'Obaveze za zarade i naknade zarada', [
      account('450', 'Obaveze za neto zarade i naknade zarada', '21840000.00', '24326500.00'),
    ]),
  ]),
]

/** The column totals of the whole chart: the books' sums. */
export const CHART_TOTALS: AccountFigures = (() => {
  const sum = (key: keyof AccountFigures) =>
    text(CHART_OF_ACCOUNTS.reduce((total, node) => total + cents(node.data?.[key] ?? '0'), 0n))
  return { debit: sum('debit'), credit: sum('credit'), balance: sum('balance') }
})()

/** Free and total pallet places of a warehouse location. */
export interface LocationFigures {
  free: string
  places: string
}

/** Warehouse locations of the Novi Sad warehouse; zone B and the yard load on demand. */
export const LOCATIONS: TreeNode<LocationFigures>[] = [
  {
    id: 'ns',
    code: 'NS',
    label: 'Magacin Novi Sad, Temerinski put 51',
    data: { free: '46', places: '320' },
    children: [
      {
        id: 'ns-a',
        code: 'A',
        label: 'Zona A — suva roba',
        data: { free: '18', places: '160' },
        children: [
          {
            id: 'ns-a-01',
            code: 'A-01',
            label: 'Prolaz A-01',
            data: { free: '6', places: '40' },
            children: [
              {
                id: 'ns-a-01-01',
                code: 'A-01-01',
                label: 'Regal A-01-01',
                data: { free: '2', places: '20' },
                children: [],
              },
              {
                id: 'ns-a-01-02',
                code: 'A-01-02',
                label: 'Regal A-01-02',
                data: { free: '4', places: '20' },
                children: [],
              },
            ],
          },
          {
            id: 'ns-a-02',
            code: 'A-02',
            label: 'Prolaz A-02',
            data: { free: '12', places: '120' },
            hasChildren: true,
          },
        ],
      },
      {
        id: 'ns-b',
        code: 'B',
        label: 'Zona B — rashlađena roba',
        description: '2–8 °C',
        data: { free: '28', places: '120' },
        hasChildren: true,
      },
      {
        id: 'ns-y',
        code: 'Y',
        label: 'Otvoreno skladište',
        data: { free: '0', places: '40' },
        hasChildren: true,
      },
    ],
  },
]

/** The children of zone B, as the application loads them. */
export const ZONE_B: TreeNode<LocationFigures>[] = [
  {
    id: 'ns-b-01',
    code: 'B-01',
    label: 'Komora B-01',
    data: { free: '12', places: '60' },
    children: [],
  },
  {
    id: 'ns-b-02',
    code: 'B-02',
    label: 'Komora B-02',
    data: { free: '16', places: '60' },
    children: [],
  },
]

/** The org units of Kvadrat Gradnja d.o.o. */
export const ORG_UNITS: TreeNode[] = [
  {
    id: 'kg',
    label: 'Kvadrat Gradnja d.o.o.',
    description: 'Novi Sad',
    children: [
      { id: 'uprava', label: 'Uprava', children: [] },
      {
        id: 'finansije',
        label: 'Sektor finansija',
        children: [
          { id: 'racunovodstvo', label: 'Računovodstvo', children: [] },
          { id: 'kontroling', label: 'Kontroling', children: [] },
          { id: 'nabavka', label: 'Nabavka', children: [] },
        ],
      },
      {
        id: 'proizvodnja',
        label: 'Sektor proizvodnje',
        children: [
          { id: 'liman', label: 'Gradilište Novi Sad — Liman 4', children: [] },
          { id: 'nbg', label: 'Gradilište Beograd — Blok 65', children: [] },
          {
            id: 'zrenjanin',
            label: 'Gradilište Zrenjanin',
            disabledReason: 'Closed on 31.03.2026: no new assignments.',
            children: [],
          },
        ],
      },
      { id: 'ljudski-resursi', label: 'Ljudski resursi', children: [] },
    ],
  },
]

/** The structure of a course. */
export const COURSE: TreeNode[] = [
  {
    id: 'm1',
    label: 'Modul 1: Uvod u knjigovodstvo',
    description: '4 lekcije · 1 h 10 min',
    children: [
      { id: 'l11', label: '1.1 Šta je knjigovodstvo', description: 'Video · 12 min', children: [] },
      { id: 'l12', label: '1.2 Bilans stanja', description: 'Video · 18 min', children: [] },
      { id: 'l13', label: '1.3 Bilans uspeha', description: 'Tekst · 15 min', children: [] },
      { id: 'q1', label: 'Provera znanja 1', description: 'Kviz · 10 pitanja', children: [] },
    ],
  },
  {
    id: 'm2',
    label: 'Modul 2: Kontni okvir',
    description: '3 lekcije · 55 min',
    children: [
      { id: 'l21', label: '2.1 Klase konta', description: 'Video · 20 min', children: [] },
      { id: 'l22', label: '2.2 Dvojno knjigovodstvo', description: 'Video · 25 min', children: [] },
      { id: 'q2', label: 'Provera znanja 2', description: 'Kviz · 8 pitanja', children: [] },
    ],
  },
  {
    id: 'm3',
    label: 'Modul 3: PDV u praksi',
    description: 'Otključava se po završetku modula 2',
    disabledReason: 'Locked until module 2 is finished.',
    hasChildren: true,
  },
]

/**
 * A long chart: 10 classes × 10 groups × 50 accounts (5,110 nodes), to show that a tree of
 * thousands scrolls without delay. Figures follow from the codes.
 */
export const LONG_CHART: TreeNode<AccountFigures>[] = Array.from({ length: 10 }, (_, c) =>
  group(
    String(c),
    `Klasa ${String(c)}`,
    Array.from({ length: 10 }, (_, g) =>
      group(
        `${String(c)}${String(g)}`,
        `Grupa ${String(c)}${String(g)}`,
        Array.from({ length: 50 }, (_, a) => {
          const code = `${String(c)}${String(g)}${String(a).padStart(2, '0')}`
          return account(
            code,
            `Konto ${code}`,
            `${String((a + 1) * 1000)}.00`,
            `${String(a * 250)}.50`,
          )
        }),
      ),
    ),
  ),
)

/** Arabic: a small chart of accounts. */
export const ARABIC_ACCOUNTS: TreeNode<AccountFigures>[] = [
  group('1', 'الأصول', [
    group('11', 'الأصول المتداولة', [
      account('111', 'النقدية في الصندوق', '15000.00', '3500.00'),
      account('112', 'الحسابات المصرفية', '240000.00', '96000.00'),
    ]),
    group('12', 'الأصول الثابتة', [account('121', 'المباني', '850000.00', '0.00')]),
  ]),
  group('2', 'الخصوم', [
    group('21', 'الموردون', [account('211', 'موردون محليون', '42000.00', '118000.00')]),
  ]),
]

/** Japanese: a small chart of accounts. */
export const JAPANESE_ACCOUNTS: TreeNode<AccountFigures>[] = [
  group('1', '資産', [
    group('11', '流動資産', [
      account('111', '現金', '120000.00', '45000.00'),
      account('112', '普通預金', '3200000.00', '1850000.00'),
    ]),
    group('12', '固定資産', [account('121', '建物', '15000000.00', '0.00')]),
  ]),
  group('2', '負債', [
    group('21', '買掛金', [account('211', '国内仕入先', '640000.00', '980000.00')]),
  ]),
]

/** Long names: an org unit and an account written out in full. */
export const LONG_NODES: TreeNode[] = [
  {
    id: 'long',
    label:
      'Sektor za investicije, razvoj projekata, pribavljanje građevinskih dozvola i saradnju sa lokalnom samoupravom',
    description:
      'Includes the project offices in Novi Sad, Beograd and Zrenjanin and the legal team that prepares the permit applications.',
    children: [
      {
        id: 'long-1',
        code: '0230-01-0004',
        label:
          'Postrojenja i oprema u izgradnji — kran Liebherr 81 K.1 na gradilištu Novi Sad — Liman 4, ulaz iz Ulice Bate Brkića',
        disabledReason:
          'Not selectable: the asset is still under construction and cannot be assigned to a cost centre until it is put into use.',
        children: [],
      },
      { id: 'long-2', label: 'Pravna služba', children: [] },
    ],
  },
]
