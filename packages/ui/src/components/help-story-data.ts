import { BookOpen, FileCheck, KeyRound, Landmark, Rocket, Wallet } from 'lucide-react'
import type { RichTextNode } from '../rich-text/rich-text-logic'
import type { CategoryCard } from './category-grid'
import type { SatisfactionOption } from './help-logic'
import type { LinkSuggestion } from './link-suggestions'
import type { SearchResult } from './search-result-list'

/*
 * Sample data for the help-centre stories: a support portal's rating scale, help
 * articles and their categories — fictitious. Not part of the package: nothing in src/index.ts
 * imports this file. No classes here: Storybook compiles classes only from *.stories.tsx files.
 */

/** The application's five steps, lowest first, each with words. */
export const SCALE: SatisfactionOption[] = [
  { value: '1', label: 'Very dissatisfied' },
  { value: '2', label: 'Dissatisfied' },
  { value: '3', label: 'Neither' },
  { value: '4', label: 'Satisfied' },
  { value: '5', label: 'Very satisfied' },
]

export const LONG_SCALE: SatisfactionOption[] = [
  { value: '1', label: 'Very dissatisfied: the problem is still not solved' },
  { value: '2', label: 'Dissatisfied: solved, but it took far too long' },
  { value: '3', label: 'Neither satisfied nor dissatisfied with the help' },
  { value: '4', label: 'Satisfied: solved within the promised time' },
  { value: '5', label: 'Very satisfied: solved quickly and explained clearly' },
]

export const ARABIC_SCALE: SatisfactionOption[] = [
  { value: '1', label: 'غير راضٍ جدًا' },
  { value: '2', label: 'غير راضٍ' },
  { value: '3', label: 'محايد' },
  { value: '4', label: 'راضٍ' },
  { value: '5', label: 'راضٍ جدًا' },
]

export const JAPANESE_SCALE: SatisfactionOption[] = [
  { value: '1', label: 'とても不満' },
  { value: '2', label: '不満' },
  { value: '3', label: 'どちらでもない' },
  { value: '4', label: '満足' },
  { value: '5', label: 'とても満足' },
]

/** Help articles proposed while a customer describes a rejected invoice. */
export const SUGGESTIONS: LinkSuggestion[] = [
  {
    id: 'sef-rejected',
    title: 'Why was my SEF invoice rejected?',
    href: '#/kb/sef-rejected',
    meta: 'E-invoicing',
    summary:
      'Read the rejection message, fix the buyer, the dates or the amounts, and send the invoice again.',
  },
  {
    id: 'sef-send',
    title: 'Send an invoice to SEF',
    href: '#/kb/sef-send',
    meta: 'E-invoicing',
    summary: 'From a draft to "Sent to SEF": what Liro checks before it sends.',
  },
  {
    id: 'sef-cancel',
    title: 'Cancel or correct an invoice in SEF',
    href: '#/kb/sef-cancel',
    meta: 'E-invoicing',
    summary: 'When to cancel, when to issue a correction, and what the buyer sees.',
  },
]

export const LONG_SUGGESTIONS: LinkSuggestion[] = [
  {
    id: 'long',
    title:
      'Why an electronic invoice sent to a buyer registered under a different tax number in the public register can be rejected, and how to send it again',
    href: '#/kb/long',
    meta: 'E-invoicing · Sending and receiving · Problems with buyers',
    summary:
      'The register keeps the tax number the buyer had on the invoice date. If the buyer changed its form or merged with another company, the invoice must name the new number; this article shows where to look it up, how to change the buyer on a rejected draft and how to send it again without a new number.',
  },
]

export const ARABIC_SUGGESTIONS: LinkSuggestion[] = [
  {
    id: 'a1',
    title: 'لماذا رُفضت فاتورتي الإلكترونية؟',
    href: '#/kb/a1',
    meta: 'الفوترة الإلكترونية',
    summary: 'اقرأ رسالة الرفض، وصحّح بيانات المشتري أو التواريخ، ثم أرسل الفاتورة مرة أخرى.',
  },
  {
    id: 'a2',
    title: 'إرسال فاتورة إلى النظام',
    href: '#/kb/a2',
    meta: 'الفوترة الإلكترونية',
    summary: 'من المسودة إلى «أُرسلت»: ما الذي يتحقق منه النظام قبل الإرسال.',
  },
]

export const JAPANESE_SUGGESTIONS: LinkSuggestion[] = [
  {
    id: 'j1',
    title: '電子請求書が差し戻されたのはなぜですか？',
    href: '#/kb/j1',
    meta: '電子請求書',
    summary: '差し戻しメッセージを確認し、取引先・日付・金額を直してから再送信します。',
  },
  {
    id: 'j2',
    title: '請求書を送信する',
    href: '#/kb/j2',
    meta: '電子請求書',
    summary: '下書きから「送信済み」まで：送信前に確認される項目。',
  },
]

/** The help centre's categories. */
export const CATEGORIES: CategoryCard[] = [
  {
    id: 'e-invoicing',
    title: 'E-invoicing',
    href: '#/kb/e-invoicing',
    count: '5 articles',
    icon: FileCheck,
    description: 'Send, receive, cancel and correct invoices in SEF.',
  },
  {
    id: 'accounts',
    title: 'Accounts',
    href: '#/kb/accounts',
    count: '4 articles',
    icon: KeyRound,
    description: 'Sign-in, two-factor sign-in, users and what they may do.',
  },
  {
    id: 'payroll',
    title: 'Payroll',
    href: '#/kb/payroll',
    count: '3 articles',
    icon: Wallet,
    description: 'Monthly runs, payslips and the export to your bank.',
  },
  {
    id: 'banking',
    title: 'Banking',
    href: '#/kb/banking',
    count: '3 articles',
    icon: Landmark,
    description: 'Import statements and match payments.',
  },
  {
    id: 'start',
    title: 'Getting started',
    href: '#/kb/start',
    count: '3 articles',
    icon: Rocket,
    description: 'Set up your company and invite your accountant.',
  },
]

export const ARABIC_CATEGORIES: CategoryCard[] = [
  {
    id: 'a1',
    title: 'الفوترة الإلكترونية',
    href: '#/kb/a1',
    count: '5 مقالات',
    icon: FileCheck,
    description: 'إرسال الفواتير واستلامها وإلغاؤها.',
  },
  {
    id: 'a2',
    title: 'الحسابات',
    href: '#/kb/a2',
    count: '4 مقالات',
    icon: KeyRound,
    description: 'تسجيل الدخول والمستخدمون والصلاحيات.',
  },
  {
    id: 'a3',
    title: 'الرواتب',
    href: '#/kb/a3',
    count: '3 مقالات',
    icon: Wallet,
    description: 'الرواتب الشهرية والتصدير إلى البنك.',
  },
]

export const JAPANESE_CATEGORIES: CategoryCard[] = [
  {
    id: 'j1',
    title: '電子請求書',
    href: '#/kb/j1',
    count: '5件の記事',
    icon: FileCheck,
    description: '請求書の送信、受信、取消し。',
  },
  {
    id: 'j2',
    title: 'アカウント',
    href: '#/kb/j2',
    count: '4件の記事',
    icon: KeyRound,
    description: 'サインイン、二要素認証、ユーザーと権限。',
  },
  {
    id: 'j3',
    title: '給与',
    href: '#/kb/j3',
    count: '3件の記事',
    icon: BookOpen,
    description: '月次給与と銀行への出力。',
  },
]

/** A search for "rejected" across the help articles. */
export const RESULTS: SearchResult[] = [
  {
    id: 'sef-rejected',
    title: ['Why was my SEF invoice ', { match: 'rejected' }, '?'],
    href: '#/kb/sef-rejected',
    meta: 'E-invoicing · Updated 08.10.2026.',
    snippet: [
      'When SEF ',
      { match: 'rejects' },
      ' an invoice, Liro shows its message on the invoice. Most invoices are ',
      { match: 'rejected' },
      ' for the buyer, the dates or the amounts…',
    ],
  },
  {
    id: 'sef-cancel',
    title: 'Cancel or correct an invoice in SEF',
    href: '#/kb/sef-cancel',
    meta: 'E-invoicing · Updated 30.09.2026.',
    snippet: [
      '…an invoice the buyer ',
      { match: 'rejected' },
      ' cannot be cancelled; change the draft and send it again.',
    ],
  },
  {
    id: 'receive',
    title: 'Receive supplier invoices from SEF',
    href: '#/kb/receive',
    meta: 'E-invoicing · Updated 22.09.2026.',
    snippet: [
      '…accept or ',
      { match: 'reject' },
      ' each incoming invoice within 15 days; a ',
      { match: 'rejected' },
      ' invoice goes back to the supplier with your reason.',
    ],
  },
]

export const ARABIC_RESULTS: SearchResult[] = [
  {
    id: 'a1',
    title: ['لماذا ', { match: 'رُفضت' }, ' فاتورتي الإلكترونية؟'],
    href: '#/kb/a1',
    meta: 'الفوترة الإلكترونية',
    snippet: [
      'عندما ',
      { match: 'تُرفض' },
      ' الفاتورة يعرض النظام رسالة الرفض على الفاتورة نفسها.',
    ],
  },
]

export const JAPANESE_RESULTS: SearchResult[] = [
  {
    id: 'j1',
    title: ['電子請求書が', { match: '差し戻された' }, 'のはなぜですか？'],
    href: '#/kb/j1',
    meta: '電子請求書',
    snippet: ['請求書が', { match: '差し戻される' }, 'と、そのメッセージが請求書に表示されます。'],
  },
]

const text = (value: string): RichTextNode => ({ type: 'text', text: value })
const paragraph = (value: string): RichTextNode => ({ type: 'paragraph', content: [text(value)] })
const heading = (level: 2 | 3, value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})

/** A long help article: four sections, one with a subsection. */
export const ARTICLE: RichTextNode = {
  type: 'doc',
  content: [
    paragraph(
      'When SEF rejects an invoice, Liro shows the rejection message on the invoice and sets its status to Rejected. Most invoices are rejected for one of three reasons.',
    ),
    heading(2, 'Read the rejection message'),
    paragraph('Open the invoice. The message stands at the top, in the words SEF sent it.'),
    heading(2, 'The buyer is not registered'),
    paragraph('The buyer’s tax number must be registered in SEF on the invoice date.'),
    heading(3, 'A buyer that changed its form'),
    paragraph('Name the tax number the buyer has now, not the one on an older contract.'),
    heading(2, 'The dates or amounts do not match'),
    paragraph('The delivery date must not be after the invoice date.'),
    heading(2, 'Send the invoice again'),
    paragraph('Change the draft and choose Send to SEF. The invoice keeps its number.'),
  ],
}
