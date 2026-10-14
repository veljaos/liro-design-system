/*
 * Group AG's example data (P5.42, the organisation chart and similar hierarchies): Kvadrat
 * Gradnja d.o.o. on 14 October 2026 — forty people by their reporting lines, the director Nenad
 * Kovačević (as in groups A and C), Finance and administration, Human resources, Sales,
 * Procurement and warehouse with one vacant position, and Construction with the site managers of
 * Residential building Liman 4 (Snežana Popović, Nikola Marković's crew as in group Y), Bulevar
 * Evrope 24 (Dragan Marković's crew as in group G) and Hall B extension, Temerinski put 51. The
 * external accountant (Snežana Jelić, Knjigovodstvo Jelić) is not staff: she is a secondary
 * relation, listed in Milica Petrović's card. The units are the same people counted by unit; the
 * group is Kvadrat Holding d.o.o. with its companies and ownership shares. Every count is the
 * application's words, made here from the data. Invented; PIBs illustrative; e-mail addresses at
 * example.com. Not part of the package. No classes here.
 */
import type { HierarchyNode, Tone } from '@veljaos/ui'

export const AG_TODAY = '2026-10-14'

export const AG_ROUTES = {
  chart: '/hr/organisation',
  units: '/hr/organisation?view=units',
  /** Milica Petrović's card open. */
  card: '/hr/organisation?card=fin',
  /** The search for "Marković": three people. */
  search: '/hr/organisation?q=Marković',
  /** The Liman 4 site shown alone. */
  unit: '/hr/organisation?unit=liman',
  group: '/company/group',
  /** Kvadrat Beton d.o.o.'s card open. */
  groupCard: '/company/group?card=beton',
} as const

/** A person or position: what the chart shows, and what the card adds. */
interface Person {
  id: string
  parent: string | null
  name: string
  position: string
  unit: string
  /** A position without a person: `name` is the position. */
  vacant?: boolean
  badge?: { label: string; tone: Tone }
  phone?: string
  since?: string
}

const p = (
  id: string,
  parent: string | null,
  name: string,
  position: string,
  unit: string,
  extra: Partial<Person> = {},
): Person => ({ id, parent, name, position, unit, ...extra })

export const PEOPLE: Person[] = [
  p('ceo', null, 'Nenad Kovačević', 'Director', 'Management', { since: '2009-03-02' }),
  p('assistant', 'ceo', 'Ana Marić', 'Assistant to the director', 'Management'),
  // Finance and administration
  p('fin', 'ceo', 'Milica Petrović', 'Head of finance and administration', 'Finance', {
    since: '2014-09-01',
  }),
  p('fin-acc', 'fin', 'Ivana Stojanović', 'Accountant', 'Finance'),
  p('fin-pay', 'fin', 'Tamara Simić', 'Payroll and invoicing clerk', 'Finance'),
  // Human resources
  p('hr', 'ceo', 'Jelena Marković', 'HR manager', 'Human resources'),
  p('hr-asst', 'hr', 'Dragana Rakić', 'HR assistant', 'Human resources', {
    badge: { label: 'On leave', tone: 'warning' },
  }),
  // Sales
  p('sales', 'ceo', 'Dragan Ilić', 'Sales manager', 'Sales'),
  p('sales-eng', 'sales', 'Milena Jović', 'Sales engineer', 'Sales'),
  p('sales-est', 'sales', 'Petar Vuković', 'Estimator', 'Sales'),
  // Procurement and warehouse
  p('proc', 'ceo', 'Marko Đorđević', 'Procurement and warehouse manager', 'Procurement'),
  p('proc-buyer', 'proc', 'Ivan Lukić', 'Buyer', 'Procurement'),
  p('proc-store', 'proc', 'Zoran Bojović', 'Warehouse keeper', 'Procurement'),
  p(
    'proc-vacant',
    'proc',
    'Buyer, construction materials',
    'Open since 01.10.2026',
    'Procurement',
    {
      vacant: true,
    },
  ),
  // Construction
  p('con', 'ceo', 'Goran Medić', 'Head of construction', 'Construction', { since: '2012-04-16' }),
  p('con-plan', 'con', 'Jelena Stojković', 'Planning engineer', 'Construction'),
  p('liman', 'con', 'Snežana Popović', 'Site manager', 'Residential building Liman 4'),
  p('liman-ilic', 'liman', 'Marko Ilić', 'Foreman, crew Ilić', 'Residential building Liman 4'),
  p('l-1', 'liman-ilic', 'Petar Jovanović', 'Mason', 'Residential building Liman 4'),
  p('l-2', 'liman-ilic', 'Nikola Marković', 'Site worker', 'Residential building Liman 4'),
  p('l-3', 'liman-ilic', 'Milan Stanić', 'Carpenter', 'Residential building Liman 4'),
  p('l-4', 'liman-ilic', 'Dejan Kostić', 'Mason', 'Residential building Liman 4'),
  p(
    'liman-pet',
    'liman',
    'Miloš Petrović',
    'Foreman, crew Petrović',
    'Residential building Liman 4',
  ),
  p('l-5', 'liman-pet', 'Dušan Lazić', 'Labourer', 'Residential building Liman 4'),
  p('l-6', 'liman-pet', 'Bojan Simić', 'Steel fixer', 'Residential building Liman 4'),
  p('l-7', 'liman-pet', 'Luka Nikolić', 'Labourer', 'Residential building Liman 4'),
  p(
    'liman-jov',
    'liman',
    'Mika Jovanović',
    'Foreman, crew Jovanović',
    'Residential building Liman 4',
  ),
  p('l-8', 'liman-jov', 'Stevan Ristić', 'Roofer', 'Residential building Liman 4'),
  p('l-9', 'liman-jov', 'Aleksandar Pavlović', 'Facade worker', 'Residential building Liman 4'),
  p('bul', 'con', 'Stefan Nikolić', 'Site manager', 'Bulevar Evrope 24'),
  p('bul-fore', 'bul', 'Dragan Marković', 'Site foreman', 'Bulevar Evrope 24'),
  p('b-1', 'bul-fore', 'Milan Jovanović', 'Mason', 'Bulevar Evrope 24'),
  p('b-2', 'bul-fore', 'Nenad Ilić', 'Mason', 'Bulevar Evrope 24'),
  p('b-3', 'bul-fore', 'Zoran Petrović', 'Carpenter', 'Bulevar Evrope 24'),
  p('b-4', 'bul-fore', 'Goran Stevanović', 'Crane operator', 'Bulevar Evrope 24'),
  p('b-5', 'bul-fore', 'Bojan Đorđević', 'Electrician', 'Bulevar Evrope 24'),
  p('b-6', 'bul-fore', 'Vladimir Tomić', 'Labourer', 'Bulevar Evrope 24'),
  p('b-7', 'bul-fore', 'Marko Pavlović', 'Site guard, nights', 'Bulevar Evrope 24', {
    badge: { label: 'Nights', tone: 'neutral' },
  }),
  p('tem', 'con', 'Vuk Radić', 'Site manager', 'Hall B extension'),
  p('tem-fore', 'tem', 'Igor Babić', 'Foreman', 'Hall B extension'),
  p('t-1', 'tem-fore', 'Nemanja Kostić', 'Mason', 'Hall B extension'),
]

/** How many people stand under a person (the application's count; positions not counted). */
function peopleUnder(id: string): number {
  const below = PEOPLE.filter((person) => person.parent === id)
  return below.reduce(
    (sum, person) => sum + (person.vacant === true ? 0 : 1) + peopleUnder(person.id),
    0,
  )
}

function peopleWords(count: number): string {
  return `${String(count)} ${count === 1 ? 'person' : 'people'}`
}

/** The people as the chart's nodes: the head of a team with how many work under them. */
export const ORG_NODES: HierarchyNode[] = PEOPLE.map((person) => {
  const under = peopleUnder(person.id)
  return {
    id: person.id,
    parentId: person.parent,
    title: person.name,
    subtitle: person.position,
    ...(person.vacant === true ? { vacant: true, detail: person.unit } : { avatar: person.name }),
    ...(person.badge === undefined ? {} : { badge: person.badge }),
    ...(under >= 3 ? { count: `${peopleWords(under)} under` } : {}),
  }
})

/** Everyone on the staff (the vacant position is not a person). */
export const HEADCOUNT = PEOPLE.filter((person) => person.vacant !== true).length

/** Secondary (dotted-line) relations: listed in the person's card, never drawn. */
export const SECONDARY: Record<string, { label: string; with: string; note: string }[]> = {
  fin: [
    {
      label: 'Works with',
      with: 'Snežana Jelić, Knjigovodstvo Jelić',
      note: 'External accountant: the annual accounts, VAT and payroll tax returns.',
    },
  ],
  'con-plan': [
    {
      label: 'Also reports to',
      with: 'Dragan Ilić, Sales manager',
      note: 'Estimates for new offers, two days a week.',
    },
  ],
  'proc-store': [
    {
      label: 'Also works for',
      with: 'Snežana Popović, Site manager',
      note: 'The Liman 4 site store, Tuesdays and Thursdays.',
    },
  ],
}

export function personOf(id: string): Person | undefined {
  return PEOPLE.find((person) => person.id === id)
}

export function emailOf(person: Person): string {
  const plain = person.name
    .toLocaleLowerCase('sr-Latn')
    .replaceAll('č', 'c')
    .replaceAll('ć', 'c')
    .replaceAll('š', 's')
    .replaceAll('ž', 'z')
    .replaceAll('đ', 'dj')
    .replace(/[^a-z ]/g, '')
    .trim()
    .replace(/ +/g, '.')
  return `${plain}@example.com`
}

/** The units, each with its head and headcount (the people above, counted by unit). */
const UNIT_LIST: { id: string; parent: string | null; name: string; head: string }[] = [
  { id: 'u-co', parent: null, name: 'Kvadrat Gradnja d.o.o.', head: 'ceo' },
  { id: 'u-mgmt', parent: 'u-co', name: 'Management', head: 'ceo' },
  { id: 'u-fin', parent: 'u-co', name: 'Finance', head: 'fin' },
  { id: 'u-hr', parent: 'u-co', name: 'Human resources', head: 'hr' },
  { id: 'u-sales', parent: 'u-co', name: 'Sales', head: 'sales' },
  { id: 'u-proc', parent: 'u-co', name: 'Procurement', head: 'proc' },
  { id: 'u-con', parent: 'u-co', name: 'Construction', head: 'con' },
  { id: 'u-liman', parent: 'u-con', name: 'Residential building Liman 4', head: 'liman' },
  { id: 'u-bul', parent: 'u-con', name: 'Bulevar Evrope 24', head: 'bul' },
  { id: 'u-tem', parent: 'u-con', name: 'Hall B extension', head: 'tem' },
]

const SITE_UNITS = ['Residential building Liman 4', 'Bulevar Evrope 24', 'Hall B extension']

export const UNIT_NODES: HierarchyNode[] = UNIT_LIST.map((unit) => {
  const head = personOf(unit.head)
  const staff =
    unit.parent === null
      ? HEADCOUNT
      : unit.id === 'u-con'
        ? PEOPLE.filter(
            (person) => person.unit === 'Construction' || SITE_UNITS.includes(person.unit),
          ).length
        : PEOPLE.filter((person) => person.unit === unit.name && person.vacant !== true).length
  const vacancies = PEOPLE.filter(
    (person) => person.unit === unit.name && person.vacant === true,
  ).length
  return {
    id: unit.id,
    parentId: unit.parent,
    title: unit.name,
    subtitle: `Head: ${head?.name ?? ''}`,
    count: peopleWords(staff),
    ...(vacancies > 0
      ? { badge: { label: `${String(vacancies)} vacant`, tone: 'warning' as const } }
      : {}),
  }
})

// ── Kvadrat group ─────────────────────────────────────────────────────────────────────────────

export interface GroupCompany {
  id: string
  parent: string | null
  name: string
  activity: string
  taxId: string
  share?: string
  director: string
  employees: string
  associate?: boolean
}

export const COMPANIES: GroupCompany[] = [
  {
    id: 'holding',
    parent: null,
    name: 'Kvadrat Holding d.o.o.',
    activity: 'Parent company',
    taxId: '112640583',
    director: 'Nenad Kovačević',
    employees: '2 people',
  },
  {
    id: 'gradnja',
    parent: 'holding',
    name: 'Kvadrat Gradnja d.o.o.',
    activity: 'Construction',
    taxId: '108452317',
    share: '100%',
    director: 'Nenad Kovačević',
    employees: peopleWords(HEADCOUNT),
  },
  {
    id: 'stanovi',
    parent: 'gradnja',
    name: 'Liman 4 Stanovi d.o.o.',
    activity: 'Project company, Residential building Liman 4',
    taxId: '113207461',
    share: '51%',
    director: 'Goran Medić',
    employees: 'No employees',
  },
  {
    id: 'nekretnine',
    parent: 'gradnja',
    name: 'Kvadrat Nekretnine d.o.o.',
    activity: 'Sale and rental of flats',
    taxId: '111985302',
    share: '100%',
    director: 'Ana Marić',
    employees: '3 people',
  },
  {
    id: 'beton',
    parent: 'holding',
    name: 'Kvadrat Beton d.o.o.',
    activity: 'Ready-mix concrete',
    taxId: '110743658',
    share: '60%',
    director: 'Bojan Kovač',
    employees: '18 people',
  },
  {
    id: 'fasade',
    parent: 'holding',
    name: 'Novosadske fasade d.o.o.',
    activity: 'Facades',
    taxId: '109574320',
    share: '25%',
    director: 'Lazar Đukić',
    employees: '26 people',
    associate: true,
  },
]

export const GROUP_NODES: HierarchyNode[] = COMPANIES.map((company) => ({
  id: company.id,
  parentId: company.parent,
  title: company.name,
  subtitle: company.activity,
  detail: `PIB ${company.taxId}`,
  count: company.employees,
  ...(company.share === undefined ? {} : { lineLabel: company.share }),
  ...(company.associate === true
    ? { badge: { label: 'Associate', tone: 'neutral' as const } }
    : {}),
}))

/** Who owns the rest of a company that is not wholly owned (the application's register). */
export const OTHER_OWNERS: Record<string, string> = {
  stanovi: 'Stanogradnja Plus d.o.o. owns 49%.',
  beton: 'Dragan Kovač, a private person, owns 40%.',
  fasade: 'Three private persons own 75%.',
}
