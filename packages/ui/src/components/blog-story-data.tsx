import type { RichTextNode } from '../rich-text/rich-text-logic'
import type { ArticleSummary } from './article-list'

/*
 * Story data of the reading components (P5.39): a fictitious blog. Covers are drawings in the
 * tokens' colours (no images, no raw colours); they follow the theme. No classes here: story data
 * is not a Tailwind source.
 */

const ACCENTS = [
  'var(--liro-chart-category1)',
  'var(--liro-chart-category2)',
  'var(--liro-chart-category3)',
  'var(--liro-chart-category4)',
  'var(--liro-chart-category5)',
]

/** A placeholder cover: shapes in the tokens' colours, decided by `variant`. */
export function Cover({ variant = 0 }: { variant?: number }) {
  const accent = ACCENTS[variant % ACCENTS.length] ?? 'var(--liro-chart-main)'
  const shift = (variant * 23) % 60
  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <rect width="160" height="90" fill="var(--liro-surface-sunken)" />
      <circle cx={40 + shift} cy="70" r="46" fill="var(--liro-brand-subtle)" />
      <rect x={90 - shift / 2} y="18" width="44" height="44" rx="6" fill={accent} opacity="0.85" />
      <path
        d={`M0 ${String(60 - (variant % 3) * 8)} L160 ${String(30 + (variant % 4) * 6)}`}
        stroke="var(--liro-border-strong)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

export const ARTICLES: ArticleSummary[] = [
  {
    id: 'sef-rejected',
    title: 'Why e-invoices are rejected, and how to avoid it',
    href: '#/blog/sef-rejected',
    excerpt:
      'Five reasons the e-invoicing system returns an invoice, from a wrong buyer ID to a missing order number, and what to check before you send.',
    category: 'E-invoicing',
    author: 'Jelena Stanković',
    date: '2026-10-12',
    readingTime: '6 min read',
    cover: <Cover variant={0} />,
  },
  {
    id: 'close-month',
    title: 'Closing the month in five steps',
    href: '#/blog/close-month',
    excerpt: 'A checklist small companies and their accountants can share.',
    category: 'Accounting',
    author: 'Marko Jelić',
    date: '2026-10-05',
    readingTime: '4 min read',
    cover: <Cover variant={1} />,
  },
  {
    id: 'payroll-2027',
    title: 'What changes in payroll in 2027',
    href: '#/blog/payroll-2027',
    excerpt: 'The new non-taxable amount, the contribution base and what Liro does for you.',
    category: 'Payroll',
    author: 'Stefan Đorđević',
    date: '2026-09-28',
    readingTime: '5 min read',
    cover: <Cover variant={2} />,
  },
  {
    id: 'assistant',
    title: 'Meet the Liro Assistant',
    href: '#/blog/assistant',
    excerpt: 'Ask about your company in plain words; every action waits for your confirmation.',
    category: 'Product news',
    author: 'Jelena Stanković',
    date: '2026-09-21',
    readingTime: '3 min read',
    cover: <Cover variant={3} />,
  },
  {
    id: 'ios',
    title: 'Statements of open items without the paper chase',
    href: '#/blog/ios',
    excerpt: 'Send them, see who opened them, and settle the differences line by line.',
    category: 'Accounting',
    author: 'Snežana Jelić',
    date: '2026-09-14',
    readingTime: '7 min read',
    cover: <Cover variant={4} />,
  },
  {
    id: 'shifts',
    title: 'Planning shifts on a building site',
    href: '#/blog/shifts',
    excerpt: 'Rotations, overtime and the working-time balance in one plan.',
    category: 'People',
    author: 'Ana Kovač',
    date: '2026-09-07',
    readingTime: '5 min read',
    cover: <Cover variant={5} />,
  },
]

const p = (text: string): RichTextNode => ({
  type: 'paragraph',
  content: [{ type: 'text', text }],
})
const h2 = (text: string): RichTextNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [{ type: 'text', text }],
})

/** A long article's body: four sections. */
export const ARTICLE_BODY: RichTextNode = {
  type: 'doc',
  content: [
    p(
      'Most rejected e-invoices are rejected for one of five reasons. Each takes a minute to check before you send, and each is easier to fix before than after.',
    ),
    h2('The buyer is not registered'),
    p(
      'A company that is not registered in the e-invoicing system cannot receive an e-invoice. Liro checks the buyer when you choose them and says so on the invoice.',
    ),
    h2('The buyer ID is wrong'),
    p(
      'A tax number with a missing digit, or a public body’s budget user number left out, returns the invoice at once. Copy the numbers from the buyer’s last invoice or contract.',
    ),
    h2('The order number is missing'),
    p(
      'Public buyers reject an invoice without their order or contract number. Ask for it when you take the order, and keep it on the customer.',
    ),
    h2('The amounts do not add up'),
    p(
      'The system checks that the lines, the VAT by rate and the total agree to the para. Liro computes them for you; an imported invoice is checked line by line.',
    ),
  ],
}

export const ARABIC_ARTICLES: ArticleSummary[] = [
  {
    id: 'a1',
    title: 'لماذا تُرفض الفواتير الإلكترونية',
    href: '#/a1',
    excerpt: 'خمسة أسباب شائعة وكيف تتجنبها قبل الإرسال.',
    category: 'الفوترة الإلكترونية',
    author: 'يلينا',
    date: '2026-10-12',
    readingTime: '6 دقائق',
    cover: <Cover variant={0} />,
  },
  {
    id: 'a2',
    title: 'إغلاق الشهر في خمس خطوات',
    href: '#/a2',
    excerpt: 'قائمة مراجعة للشركات الصغيرة.',
    category: 'المحاسبة',
    author: 'ماركو',
    date: '2026-10-05',
    readingTime: '4 دقائق',
    cover: <Cover variant={1} />,
  },
]

export const JAPANESE_ARTICLES: ArticleSummary[] = [
  {
    id: 'j1',
    title: '電子請求書が却下される理由',
    href: '#/j1',
    excerpt: '送信前に確認すべき5つのポイント。',
    category: '電子請求',
    author: 'イェレナ',
    date: '2026-10-12',
    readingTime: '6分',
    cover: <Cover variant={0} />,
  },
  {
    id: 'j2',
    title: '5つのステップで月次決算',
    href: '#/j2',
    excerpt: '小さな会社のためのチェックリスト。',
    category: '会計',
    author: 'マルコ',
    date: '2026-10-05',
    readingTime: '4分',
    cover: <Cover variant={1} />,
  },
]
