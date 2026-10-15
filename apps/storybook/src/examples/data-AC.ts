import type { RichTextNode } from '../../../../packages/ui/src/rich-text'

/*
 * Group AC (P5.39): Liro's public blog and its authoring, on 14.10.2026. The posts, authors and
 * texts are invented; covers are drawings in the tokens' colours (screens-AC.tsx), never images.
 * Addresses at example.com.
 */

export const AC_TODAY = '2026-10-14'

export const AC_ROUTES = {
  home: '/blog',
  category: (id: string) => `/blog/category/${id}`,
  tag: (id: string) => `/blog/tag/${id}`,
  post: (slug: string) => `/blog/${slug}`,
  /** The search with the query typed last; and with a fixed query (the stories). */
  search: '/blog/search',
  searchFor: (query: string) => `/blog/search/${encodeURIComponent(query)}`,
  /** Authoring: the posts, one post, its schedule dialog, its preview. */
  posts: '/cms/blog',
  edit: (id: string) => `/cms/blog/${id}`,
  schedule: (id: string) => `/cms/blog/${id}/schedule`,
  preview: (id: string) => `/cms/blog/${id}/preview`,
  newPost: '/cms/blog/new',
}

export const BLOG_URL = 'https://blog.liro.example.com'

export interface Category {
  id: string
  label: string
}

export const CATEGORIES: readonly Category[] = [
  { id: 'e-invoicing', label: 'E-invoicing' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'payroll', label: 'Payroll' },
  { id: 'people', label: 'People' },
  { id: 'product', label: 'Product news' },
]

export const TAGS: readonly Category[] = [
  { id: 'sef', label: 'SEF' },
  { id: 'vat', label: 'VAT' },
  { id: 'month-end', label: 'Month end' },
  { id: 'small-business', label: 'Small business' },
  { id: 'accountants', label: 'Accountants' },
  { id: 'assistant', label: 'Liro Assistant' },
]

export interface Author {
  id: string
  name: string
  detail: string
}

export const AUTHORS: Record<string, Author> = {
  jelena: { id: 'jelena', name: 'Jelena Stanković', detail: 'Product manager, Liro' },
  marko: { id: 'marko', name: 'Marko Jelić', detail: 'Accountant, Knjigovodstvo Jelić' },
  snezana: { id: 'snezana', name: 'Snežana Jelić', detail: 'Accountant, Knjigovodstvo Jelić' },
  stefan: { id: 'stefan', name: 'Stefan Đorđević', detail: 'Payroll team, Liro support' },
  ana: { id: 'ana', name: 'Ana Kovač', detail: 'Accounts team, Liro support' },
}

export type PostState = 'Draft' | 'Scheduled' | 'Published'

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  tags: readonly string[]
  author: string
  /** Published (or to be), YYYY-MM-DD. */
  date: string
  /** The time it goes out when scheduled, HH:MM in Belgrade. */
  time?: string
  updated?: string
  readingTime: string
  state: PostState
  cover: number
  seoTitle: string
  seoDescription: string
  related: readonly string[]
  body: RichTextNode
}

const p = (text: string): RichTextNode => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const h2 = (text: string): RichTextNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text }],
})
const list = (...items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((text) => ({ type: 'listItem', content: [p(text)] })),
})
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })

const SEF_BODY = doc(
  p(
    'Most rejected e-invoices are rejected for one of five reasons. Each takes a minute to check before you send, and each is easier to fix before than after the buyer’s accounts department has seen it.',
  ),
  h2('The buyer is not registered'),
  p(
    'A company that is not registered in the e-invoicing system cannot receive an e-invoice. Liro checks the buyer when you choose them and says so on the invoice, before you send it.',
  ),
  h2('The buyer’s ID is wrong'),
  p(
    'A tax number with a missing digit, or a public body’s budget user number left out, returns the invoice at once. Copy the numbers from the buyer’s last invoice or contract, never from memory.',
  ),
  h2('The order number is missing'),
  p(
    'Public buyers reject an invoice without their order or contract number. Ask for it when you take the order, and keep it on the customer in Liro so that every invoice carries it.',
  ),
  h2('The amounts do not add up'),
  p(
    'The system checks that the lines, the VAT by rate and the total agree to the para. Liro computes them for you; an imported invoice is checked line by line before it goes out.',
  ),
  h2('What to do with a rejected invoice'),
  list(
    'Read the reason in the invoice’s history: it names the field.',
    'Correct the invoice and send it again; the number stays the same.',
    'If the buyer rejected it on purpose, issue a credit note instead.',
  ),
)

const short = (...texts: string[]) => doc(...texts.map(p))

export const POSTS: readonly Post[] = [
  {
    id: 'p1',
    slug: 'why-e-invoices-are-rejected',
    title: 'Why e-invoices are rejected, and how to avoid it',
    excerpt:
      'Five reasons the e-invoicing system returns an invoice, from a wrong buyer ID to a missing order number, and what to check before you send.',
    category: 'e-invoicing',
    tags: ['sef', 'small-business'],
    author: 'jelena',
    date: '2026-10-12',
    updated: '2026-10-14',
    readingTime: '6 min read',
    state: 'Published',
    cover: 0,
    seoTitle: 'Why e-invoices are rejected | Liro blog',
    seoDescription:
      'The five reasons SEF rejects an e-invoice and what to check before you send one.',
    related: ['p2', 'p5', 'p7'],
    body: SEF_BODY,
  },
  {
    id: 'p2',
    slug: 'closing-the-month-in-five-steps',
    title: 'Closing the month in five steps',
    excerpt: 'A checklist small companies and their accountants can share, from bank to VAT.',
    category: 'accounting',
    tags: ['month-end', 'accountants'],
    author: 'marko',
    date: '2026-10-05',
    readingTime: '4 min read',
    state: 'Published',
    cover: 1,
    seoTitle: 'Closing the month in five steps | Liro blog',
    seoDescription: 'A month-end checklist for small companies and their accountants.',
    related: ['p5', 'p1'],
    body: short(
      'Close the bank first: every statement imported and every line worked.',
      'Then the documents, the payroll, the VAT records and the report to the owner.',
    ),
  },
  {
    id: 'p3',
    slug: 'planning-shifts-on-a-building-site',
    title: 'Planning shifts on a building site',
    excerpt: 'Rotations, overtime and the working-time balance in one plan everyone can read.',
    category: 'people',
    tags: ['small-business'],
    author: 'ana',
    date: '2026-09-29',
    readingTime: '5 min read',
    state: 'Published',
    cover: 2,
    seoTitle: 'Planning shifts on a building site | Liro blog',
    seoDescription: 'Rotations, overtime and the working-time balance in one plan.',
    related: ['p2'],
    body: short('A site works in shifts; the plan should read like the site does.'),
  },
  {
    id: 'p4',
    slug: 'export-payroll-to-your-bank',
    title: 'Export payroll to your bank in one file',
    excerpt: 'One payment order file for every employee, checked before it leaves Liro.',
    category: 'payroll',
    tags: ['small-business'],
    author: 'stefan',
    date: '2026-09-22',
    readingTime: '3 min read',
    state: 'Published',
    cover: 3,
    seoTitle: 'Export payroll to your bank | Liro blog',
    seoDescription: 'One payment order file for every employee, checked before it leaves Liro.',
    related: ['p6'],
    body: short('Once the payroll is final, Liro writes one file your bank reads.'),
  },
  {
    id: 'p5',
    slug: 'statements-of-open-items',
    title: 'Statements of open items without the paper chase',
    excerpt: 'Send them, see who opened them, and settle the differences line by line.',
    category: 'accounting',
    tags: ['accountants', 'month-end'],
    author: 'snezana',
    date: '2026-09-14',
    readingTime: '7 min read',
    state: 'Published',
    cover: 4,
    seoTitle: 'Statements of open items without the paper chase | Liro blog',
    seoDescription: 'Send statements of open items, see who opened them, settle differences.',
    related: ['p2'],
    body: short('A statement of open items is a question to a partner: do you see what we see?'),
  },
  {
    id: 'p7',
    slug: 'vat-records-by-rate',
    title: 'VAT records by rate, explained',
    excerpt: 'What goes into the records, where Liro takes it from and how to check it.',
    category: 'e-invoicing',
    tags: ['vat', 'accountants'],
    author: 'snezana',
    date: '2026-09-02',
    readingTime: '8 min read',
    state: 'Published',
    cover: 5,
    seoTitle: 'VAT records by rate, explained | Liro blog',
    seoDescription: 'What goes into the VAT records and how to check them.',
    related: ['p1'],
    body: short('The VAT records follow the invoices; the return follows the records.'),
  },
  {
    id: 'p6',
    slug: 'payroll-in-2027',
    title: 'What changes in payroll in 2027',
    excerpt: 'The new non-taxable amount, the contribution base and what Liro does for you.',
    category: 'payroll',
    tags: ['small-business'],
    author: 'stefan',
    date: '2026-10-20',
    time: '08:00',
    readingTime: '5 min read',
    state: 'Scheduled',
    cover: 6,
    seoTitle: 'What changes in payroll in 2027 | Liro blog',
    seoDescription: 'The new non-taxable amount, the contribution base and what Liro does.',
    related: ['p4'],
    body: short('From January the payroll changes in three places; Liro follows all three.'),
  },
  {
    id: 'p8',
    slug: 'meet-the-liro-assistant',
    title: 'Meet the Liro Assistant',
    excerpt: 'Ask about your company in plain words; every action waits for your confirmation.',
    category: 'product',
    tags: ['assistant'],
    author: 'jelena',
    date: '2026-10-28',
    readingTime: '3 min read',
    state: 'Draft',
    cover: 7,
    seoTitle: 'Meet the Liro Assistant',
    seoDescription: '',
    related: [],
    body: doc(
      p(
        'The Liro Assistant answers questions about your company in plain words — which invoices are late, how revenue changed — and links every figure to the record it came from.',
      ),
      h2('It proposes, you decide'),
      p(
        'When it can do something for you, it proposes it on a card. Nothing happens until you confirm.',
      ),
    ),
  },
]

export function findPost(id: string): Post | undefined {
  return POSTS.find((each) => each.id === id || each.slug === id)
}

export const PUBLISHED = POSTS.filter((each) => each.state === 'Published').sort((a, b) =>
  b.date.localeCompare(a.date),
)

export function categoryLabel(id: string): string {
  return CATEGORIES.find((each) => each.id === id)?.label ?? id
}

export function tagLabel(id: string): string {
  return TAGS.find((each) => each.id === id)?.label ?? id
}

/** Where a query's words stand in a text, case-insensitive: ranges for snippetFromRanges. */
export function matchRanges(text: string, query: string): [number, number][] {
  const lower = text.toLowerCase()
  const ranges: [number, number][] = []
  for (const word of query
    .toLowerCase()
    .split(/\s+/)
    .filter((each) => each.length >= 3)) {
    let at = lower.indexOf(word)
    while (at >= 0) {
      ranges.push([at, at + word.length])
      at = lower.indexOf(word, at + word.length)
    }
  }
  return ranges
}

/** The published posts whose title or excerpt holds the query, newest first. */
export function searchPosts(query: string): Post[] {
  return PUBLISHED.filter(
    (each) =>
      matchRanges(each.title, query).length > 0 || matchRanges(each.excerpt, query).length > 0,
  )
}

/** The times a post can be scheduled at, in Belgrade. */
export const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '12:00', '15:00', '18:00'].map(
  (time) => ({ value: time, label: time }),
)

/** The blog's newsletter. */
export const NEWSLETTER = {
  title: 'Get Liro’s articles by e-mail',
  description: 'One e-mail a month with new articles and product news. No advertising.',
  consent: 'We use your address only for this newsletter. Every e-mail has an unsubscribe link.',
}

/** The Liro team member who writes in the blog's authoring. */
export const EDITOR = {
  name: 'Jelena Stanković',
  email: 'jelena.stankovic@example.com',
}
