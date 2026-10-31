/*
 * Sample text for the field stories (fictitious data). Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */

/** Arabic samples: written right to left, marked with lang and dir. */
export const ARABIC = {
  label: 'اسم العميل',
  description: 'كما يظهر في الفاتورة',
  error: 'هذا الحقل مطلوب',
  value: 'شركة النور للتجارة',
  placeholder: 'ابحث بالاسم',
  reason: 'الفترة مغلقة',
  options: ['شهري', 'ربع سنوي', 'سنوي'],
}

/** Japanese samples, marked with lang. */
export const JAPANESE = {
  label: '顧客名',
  description: '請求書に表示される名前',
  error: 'この項目は必須です',
  value: '株式会社さくら商事',
  placeholder: '名前で検索',
  reason: '会計期間は締め済みです',
  options: ['月次', '四半期', '年次'],
}

/** Long text, to show wrapping. */
export const LONG = {
  label:
    'The address where the goods are delivered, when it differs from the registered address of the customer',
  description:
    'Used on the delivery note and the invoice. Leave it empty when the goods go to the registered address.',
  error:
    'The address is too long for the delivery note: shorten it to 120 characters or split it over two lines.',
  value:
    'Bulevar Mihajla Pupina 10a, fourth floor, office 412, entrance from the courtyard, 11070 Novi Beograd',
}

/**
 * Unbroken text: strings without a single space, which must wrap inside their box
 * rather than overflow it — an IBAN, a URL, a sixty-letter word.
 */
export const UNBROKEN = {
  iban: 'RS35260005601001611379RS35260005601001611379',
  url: 'https://portal.example.com/documents/2026/10/supplier-invoices/UF-2026-1187-attachment-scan.pdf',
  word: 'Donaudampfschiffahrtselektrizitätenhauptbetriebswerkbauunterbeamtengesellschaft',
}
