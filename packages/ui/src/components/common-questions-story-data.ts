import type { CommonQuestion, QuestionCategory } from './common-questions'

/*
 * CommonQuestions' story data (P5.94 item 20): what the employees of a fictitious company keep
 * asking HR. Illustrative only: the answers, documents and days are invented, not legal advice;
 * a real portal's questions are its application's. `action` is added by each story.
 */

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  { id: 'personal', label: 'Personal data' },
  { id: 'leave', label: 'Leave' },
  { id: 'pay', label: 'Pay' },
  { id: 'documents', label: 'Documents' },
]

export const QUESTIONS: CommonQuestion[] = [
  {
    id: 'id-card',
    category: 'personal',
    question: 'I changed my ID card. Do I have to tell my employer?',
    answer:
      'Only when something on it changed that HR keeps: your address or your surname. A new card with the same details needs nothing.',
    steps: [
      'Open My details and check your address and surname.',
      'If one changed, press Request a change and attach a photo of the new card.',
    ],
    documents: ['A photo or copy of the new ID card (both sides)'],
    keywords: 'identity card lična karta',
  },
  {
    id: 'address',
    category: 'personal',
    question: 'What do I need to change my address?',
    answer: 'A change request with proof of the new address. HR updates it within two days.',
    steps: [
      'Press Report a change of address.',
      'Write the new address and attach the proof.',
      'You get a notification when HR has updated it.',
    ],
    documents: ['Residence certificate, or the new ID card with the new address'],
    keywords: 'moving moved residence',
  },
  {
    id: 'account',
    category: 'pay',
    question: 'How do I change the bank account my pay goes to?',
    answer:
      'Send a change request with a bank statement before the 25th; the next pay goes to the new account.',
    steps: [
      'Press Change the salary account.',
      'Write the new account number and attach the statement.',
    ],
    documents: ['A bank statement or contract with the account number and your name'],
    keywords: 'salary bank account IBAN',
  },
  {
    id: 'surname',
    category: 'personal',
    question: 'I got married. What changes, and what do I bring?',
    answer:
      'You have five working days of paid leave for the wedding. If you take a new surname, HR changes it once you have the new ID card.',
    steps: [
      'Request paid leave with the reason Wedding and attach the marriage certificate.',
      'After the new ID card, send a change request for the surname.',
    ],
    documents: ['Marriage certificate', 'The new ID card, when the surname changes'],
    keywords: 'wedding married surname name',
  },
  {
    id: 'child',
    category: 'leave',
    question: 'I had a child. What changes?',
    answer:
      'Five working days of paid leave for the birth; maternity or parental leave is requested separately, with the doctor’s papers.',
    steps: [
      'Request paid leave with the reason Birth of a child.',
      'Bring the birth certificate to HR for the tax relief and the health insurance.',
    ],
    documents: ['Birth certificate of the child'],
    keywords: 'baby birth maternity parental',
  },
  {
    id: 'sick',
    category: 'leave',
    question: 'I am sick. How do I report it?',
    answer:
      'Tell your manager the same day; then request sick leave and attach the doctor’s note when you have it.',
    steps: [
      'Call or message your manager before your shift.',
      'Request sick leave; a photo of the doctor’s note is enough.',
    ],
    documents: ['Doctor’s note'],
    keywords: 'ill illness doctor sick note',
  },
  {
    id: 'relief',
    category: 'pay',
    question: 'How do I claim a tax relief for a dependent family member?',
    answer:
      'HR adds it to your pay from the next month once it has the documents that show the person depends on you.',
    documents: [
      'Birth or marriage certificate of the family member',
      'Proof that they have no income of their own',
    ],
    keywords: 'tax relief dependant child spouse',
  },
  {
    id: 'certificate',
    category: 'documents',
    question: 'I need a certificate of employment for the bank. How do I get one?',
    answer: 'Ask for it in Documents; HR signs it electronically, usually the same day.',
  },
]

/** The same set, in Arabic (story text only). */
export const ARABIC_QUESTIONS: CommonQuestion[] = [
  {
    id: 'address',
    category: 'personal',
    question: 'ماذا أحتاج لتغيير عنواني؟',
    answer: 'طلب تغيير مع إثبات العنوان الجديد. تقوم الموارد البشرية بتحديثه خلال يومين.',
    steps: ['اضغط على الإبلاغ عن تغيير العنوان.', 'اكتب العنوان الجديد وأرفق الإثبات.'],
    documents: ['شهادة الإقامة'],
  },
  {
    id: 'sick',
    category: 'leave',
    question: 'أنا مريض. كيف أبلغ عن ذلك؟',
    answer: 'أخبر مديرك في نفس اليوم، ثم اطلب إجازة مرضية وأرفق تقرير الطبيب.',
    documents: ['تقرير الطبيب'],
  },
]

export const ARABIC_CATEGORIES: QuestionCategory[] = [
  { id: 'personal', label: 'البيانات الشخصية' },
  { id: 'leave', label: 'الإجازات' },
]

/** The same set, in Japanese (story text only). */
export const JAPANESE_QUESTIONS: CommonQuestion[] = [
  {
    id: 'address',
    category: 'personal',
    question: '住所を変更するには何が必要ですか？',
    answer: '新しい住所の証明を添えて変更を申請してください。人事部が2日以内に更新します。',
    steps: ['「住所変更を届け出る」を押します。', '新しい住所を書き、証明を添付します。'],
    documents: ['住民票'],
  },
  {
    id: 'sick',
    category: 'leave',
    question: '病気です。どう報告すればいいですか？',
    answer: '当日中に上司に伝え、その後、病気休暇を申請して医師の診断書を添付してください。',
    documents: ['医師の診断書'],
  },
]

export const JAPANESE_CATEGORIES: QuestionCategory[] = [
  { id: 'personal', label: '個人情報' },
  { id: 'leave', label: '休暇' },
]
