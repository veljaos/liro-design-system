import type { CommonQuestion, QuestionCategory } from './common-questions'

/*
 * QuestionsAndAnswers' story data: 320 questions the employees of a fictitious
 * Serbian company ask HR, made without randomness — 80 situations (ten categories of eight) ×
 * four ways of asking about each. The same input gives the same list on every run, so pictures
 * stay still. Illustrative only: the days, documents and approvers are invented, not legal
 * advice. The employee portal example (apps/storybook/src/examples/data-Y.ts) shows them after its
 * own ten most asked questions.
 */

export const QA_CATEGORIES: QuestionCategory[] = [
  { id: 'personal', label: 'Personal data' },
  { id: 'leave', label: 'Leave' },
  { id: 'pay', label: 'Pay' },
  { id: 'documents', label: 'Documents' },
  { id: 'time', label: 'Working time' },
  { id: 'safety', label: 'Safety at work' },
  { id: 'equipment', label: 'Equipment and clothing' },
  { id: 'training', label: 'Training' },
  { id: 'travel', label: 'Business travel' },
  { id: 'benefits', label: 'Benefits' },
]

/** Which of the portal's requests starts a question's request, if any (the example maps it). */
export type StoryRequestKind = 'leave' | 'change'

/** A generated question: CommonQuestion's data and the kind of request that does it. */
export interface StoryQuestion extends CommonQuestion {
  category: string
  steps?: readonly string[]
  request?: StoryRequestKind
}

/** One situation: what is asked for, the proof, who decides and how long it takes. */
interface Situation {
  key: string
  /** As it reads after "request" ("annual leave", "a certificate of employment"). */
  name: string
  /** The document needed, as a list item ("A copy of the marriage certificate"). */
  proof: string
  /** Who decides ("your site manager"). */
  who: string
  /** How long it takes ("two working days"). */
  days: string
  /** More words it is found by, in English and Serbian. */
  keywords: string
}

/** The ten categories' eight situations each: [key, name, proof, who, days, keywords]. */
const SITUATIONS: Record<
  string,
  readonly (readonly [string, string, string, string, string, string])[]
> = {
  personal: [
    [
      'phone',
      'a change of my contact number',
      'Nothing: the new number is enough',
      'HR',
      'one working day',
      'mobile telefon broj',
    ],
    [
      'email',
      'a change of my private e-mail',
      'Nothing: the new address is enough',
      'HR',
      'one working day',
      'mail adresa',
    ],
    [
      'emergency',
      'a new emergency contact',
      'Nothing: the person’s name and number',
      'HR',
      'one working day',
      'contact family kontakt',
    ],
    [
      'name-spelling',
      'a correction of how my name is written',
      'A photo of the ID card',
      'HR',
      'two working days',
      'typo spelling ime',
    ],
    [
      'citizenship',
      'a change of citizenship in my records',
      'The certificate of citizenship',
      'HR',
      'five working days',
      'državljanstvo citizen',
    ],
    [
      'education',
      'a new degree in my records',
      'The diploma or a certified copy',
      'HR',
      'five working days',
      'diploma school fakultet',
    ],
    [
      'photo',
      'a new photo for my ID badge',
      'A recent photo, face to the camera',
      'HR',
      'three working days',
      'badge picture slika',
    ],
    [
      'bank-name',
      'a change of my bank’s name after a merger',
      'Nothing: HR updates it from the bank',
      'HR',
      'five working days',
      'bank merger banka',
    ],
  ],
  leave: [
    [
      'annual',
      'annual leave',
      'Nothing: the dates are enough',
      'your site manager',
      'two working days',
      'holiday vacation godišnji odmor',
    ],
    [
      'annual-split',
      'annual leave in two parts',
      'Nothing: the dates of both parts',
      'your site manager',
      'two working days',
      'holiday split godišnji',
    ],
    [
      'moving',
      'a day of paid leave for moving',
      'Proof of the new address',
      'your site manager',
      'two working days',
      'move selidba',
    ],
    [
      'blood',
      'a day of paid leave after giving blood',
      'The blood donor’s certificate',
      'HR',
      'one working day',
      'donor krv',
    ],
    [
      'exam',
      'paid leave for an exam',
      'The exam schedule from the school',
      'your site manager and then HR',
      'three working days',
      'school study ispit',
    ],
    [
      'unpaid',
      'unpaid leave',
      'A short note why, in your own words',
      'your site manager and then HR',
      'five working days',
      'neplaćeno unpaid',
    ],
    [
      'carry',
      'carrying annual leave into next year',
      'Nothing: HR checks the days left',
      'HR',
      'five working days',
      'remaining days prenos',
    ],
    [
      'care',
      'leave to care for a sick child',
      'The doctor’s note for the child',
      'HR',
      'two working days',
      'child care nega deteta',
    ],
  ],
  pay: [
    [
      'payslip-copy',
      'a signed copy of a payslip',
      'Nothing: name the month',
      'HR',
      'one working day',
      'platni listić payslip',
    ],
    [
      'advance',
      'an advance on my pay',
      'A short note why, in your own words',
      'the finance department',
      'five working days',
      'akontacija advance',
    ],
    [
      'overtime',
      'pay for overtime hours',
      'The hours signed by your site manager',
      'your site manager and then HR',
      'five working days',
      'prekovremeni overtime',
    ],
    [
      'night',
      'the night work supplement',
      'The shift plan of the month',
      'HR',
      'five working days',
      'noćni rad night shift',
    ],
    [
      'meal',
      'the meal allowance for days on site',
      'Nothing: HR reads the attendance',
      'HR',
      'five working days',
      'topli obrok meal',
    ],
    [
      'transport',
      'the transport allowance',
      'The address you travel from',
      'HR',
      'five working days',
      'prevoz bus ticket',
    ],
    [
      'correction',
      'a correction of my pay',
      'The payslip, with what is wrong marked',
      'HR',
      'five working days',
      'mistake error ispravka',
    ],
    [
      'garnishment',
      'information about a court deduction from my pay',
      'Nothing: name the court’s decision',
      'HR',
      'three working days',
      'administrativna zabrana deduction',
    ],
  ],
  documents: [
    [
      'employment',
      'a certificate of employment',
      'Nothing: say what it is for',
      'HR',
      'one working day',
      'potvrda o zaposlenju certificate',
    ],
    [
      'income',
      'a certificate of my income',
      'Nothing: name the months',
      'HR',
      'two working days',
      'potvrda o primanjima income',
    ],
    [
      'contract-copy',
      'a copy of my contract',
      'Nothing: HR sends it to Documents',
      'HR',
      'one working day',
      'ugovor contract',
    ],
    [
      'experience',
      'a certificate of my years of service',
      'Nothing: HR reads your records',
      'HR',
      'three working days',
      'radni staž experience',
    ],
    [
      'visa',
      'a letter for a visa application',
      'The embassy’s list of what it needs',
      'HR',
      'three working days',
      'embassy viza',
    ],
    [
      'tax',
      'a certificate of tax paid',
      'Nothing: name the year',
      'HR',
      'three working days',
      'porez tax',
    ],
    [
      'reference',
      'a reference letter',
      'Nothing: say who it is for',
      'your site manager and then HR',
      'five working days',
      'preporuka reference',
    ],
    [
      'health-card',
      'a stamp in my health insurance card',
      'Nothing: HR prints the confirmation',
      'HR',
      'one working day',
      'zdravstvena knjižica health',
    ],
  ],
  time: [
    [
      'swap',
      'a swap of shifts with a colleague',
      'Nothing: the colleague agrees in the portal',
      'your site manager',
      'one working day',
      'smena swap shift',
    ],
    [
      'late',
      'a late start on one day',
      'A short note why',
      'your site manager',
      'one working day',
      'kašnjenje late',
    ],
    [
      'early',
      'leaving early on one day',
      'A short note why',
      'your site manager',
      'one working day',
      'early leave odlazak',
    ],
    [
      'clock-fix',
      'a correction of a missed clock-in',
      'Nothing: write the time you came',
      'your site manager',
      'one working day',
      'evidencija clock',
    ],
    [
      'part-time',
      'working part time',
      'A short note why, in your own words',
      'your site manager and then HR',
      'ten working days',
      'nepuno radno vreme part',
    ],
    [
      'remote',
      'working from home on office days',
      'Nothing: name the days',
      'your manager',
      'two working days',
      'home office rad od kuće',
    ],
    [
      'weekend',
      'working on a Saturday',
      'Nothing: the site manager plans it',
      'your site manager',
      'two working days',
      'subota weekend',
    ],
    [
      'holiday-work',
      'working on a public holiday',
      'Nothing: the site manager plans it',
      'your site manager',
      'two working days',
      'praznik holiday',
    ],
  ],
  safety: [
    [
      'injury',
      'the forms after an injury at work',
      'The doctor’s report, when you have it',
      'the safety officer',
      'the same day',
      'povreda injury accident',
    ],
    [
      'near-miss',
      'a check after a near miss on site',
      'A photo of the place, if you can',
      'the safety officer',
      'the same day',
      'skoro nesreća near miss',
    ],
    [
      'medical',
      'a periodic medical check',
      'Nothing: HR books the appointment',
      'HR',
      'ten working days',
      'lekarski pregled medical',
    ],
    [
      'heights',
      'a permit to work at heights',
      'The medical certificate for work at heights',
      'the safety officer',
      'five working days',
      'visina heights',
    ],
    [
      'first-aid',
      'first aid training',
      'Nothing: HR enrols you',
      'the safety officer',
      'ten working days',
      'prva pomoć first aid',
    ],
    [
      'hazard',
      'a check of a hazard on site',
      'A photo of the hazard',
      'the safety officer',
      'the same day',
      'opasnost hazard',
    ],
    [
      'fire',
      'a fire safety briefing',
      'Nothing: HR enrols you',
      'the safety officer',
      'ten working days',
      'požar fire',
    ],
    [
      'heat',
      'a break in hot weather',
      'Nothing: the rules apply above 32 °C',
      'your site manager',
      'the same day',
      'vrućina heat',
    ],
  ],
  equipment: [
    [
      'helmet',
      'a new safety helmet',
      'The old helmet, at the warehouse',
      'the warehouse',
      'one working day',
      'šlem kaciga helmet',
    ],
    [
      'boots',
      'new safety boots',
      'Your shoe size',
      'the warehouse',
      'three working days',
      'cipele boots',
    ],
    [
      'gloves',
      'new work gloves',
      'Nothing: say the size',
      'the warehouse',
      'one working day',
      'rukavice gloves',
    ],
    [
      'jacket',
      'a winter work jacket',
      'Your size',
      'the warehouse',
      'five working days',
      'jakna jacket winter',
    ],
    [
      'glasses',
      'protective glasses',
      'Nothing: say if you wear glasses',
      'the warehouse',
      'one working day',
      'naočare glasses',
    ],
    [
      'tools',
      'a replacement for a broken tool',
      'The broken tool, at the warehouse',
      'the warehouse',
      'one working day',
      'alat tools',
    ],
    [
      'phone-work',
      'a work phone',
      'A short note why, in your own words',
      'your site manager',
      'five working days',
      'telefon mobile',
    ],
    [
      'locker',
      'a locker at the site',
      'Nothing: the site manager assigns one',
      'your site manager',
      'two working days',
      'ormarić locker',
    ],
  ],
  training: [
    [
      'course',
      'a professional course',
      'The course’s programme and price',
      'your site manager and then HR',
      'ten working days',
      'kurs course',
    ],
    [
      'licence',
      'a crane operator’s licence',
      'The medical certificate for the licence',
      'the training coordinator',
      'ten working days',
      'dozvola licence kran',
    ],
    [
      'language',
      'an English course',
      'Nothing: HR finds the group',
      'the training coordinator',
      'ten working days',
      'engleski language',
    ],
    [
      'forklift',
      'forklift training',
      'The medical certificate',
      'the training coordinator',
      'ten working days',
      'viljuškar forklift',
    ],
    [
      'mentor',
      'a mentor for a new colleague',
      'Nothing: name the colleague',
      'your site manager',
      'five working days',
      'mentor onboarding',
    ],
    [
      'conference',
      'a day at a building fair',
      'The fair’s programme',
      'your site manager',
      'five working days',
      'sajam fair',
    ],
    [
      'welding',
      'a welding certificate',
      'The medical certificate',
      'the training coordinator',
      'ten working days',
      'zavarivanje welding',
    ],
    [
      'digital',
      'training for the portal itself',
      'Nothing: HR shows you in ten minutes',
      'HR',
      'two working days',
      'portal app help',
    ],
  ],
  travel: [
    [
      'trip',
      'a business trip',
      'The trip’s plan: where, when, why',
      'your site manager',
      'two working days',
      'službeni put trip',
    ],
    [
      'per-diem',
      'the daily allowance for a trip',
      'The travel order, signed',
      'the finance department',
      'five working days',
      'dnevnica per diem',
    ],
    [
      'fuel',
      'fuel costs for my own car',
      'The fuel receipts and the distance',
      'the finance department',
      'five working days',
      'gorivo fuel car',
    ],
    ['hotel', 'a hotel for a trip', 'The trip’s dates', 'HR', 'two working days', 'hotel smeštaj'],
    [
      'abroad',
      'a business trip abroad',
      'A valid passport',
      'your site manager and then HR',
      'five working days',
      'inostranstvo abroad',
    ],
    [
      'advance-trip',
      'an advance for a trip',
      'The travel order',
      'the finance department',
      'three working days',
      'akontacija advance trip',
    ],
    [
      'company-car',
      'a company van for a trip',
      'A valid driving licence',
      'your site manager',
      'two working days',
      'kombi van vozilo',
    ],
    [
      'report',
      'settling a trip’s costs',
      'The receipts, photographed',
      'the finance department',
      'five working days',
      'obračun putnog naloga',
    ],
  ],
  benefits: [
    [
      'insurance',
      'the private health insurance',
      'Nothing: HR enrols you',
      'HR',
      'ten working days',
      'osiguranje insurance',
    ],
    [
      'family-insurance',
      'insurance for my family members',
      'The birth or marriage certificates',
      'HR',
      'ten working days',
      'family osiguranje',
    ],
    [
      'gym',
      'the sports card',
      'Nothing: HR orders it',
      'HR',
      'ten working days',
      'teretana gym sport',
    ],
    [
      'gift',
      'the children’s New Year gift',
      'Nothing: HR reads your records',
      'HR',
      'ten working days',
      'paketić gift',
    ],
    [
      'solidarity',
      'solidarity help after a loss',
      'The death certificate',
      'HR',
      'five working days',
      'solidarna pomoć',
    ],
    [
      'loan',
      'an interest-free loan',
      'A short note why, in your own words',
      'the finance department',
      'ten working days',
      'zajam loan',
    ],
    [
      'jubilee',
      'the jubilee award',
      'Nothing: HR reads your years of service',
      'HR',
      'ten working days',
      'jubilarna nagrada',
    ],
    [
      'vacation-pay',
      'the holiday bonus',
      'Nothing: it comes with the June pay',
      'HR',
      'ten working days',
      'regres bonus',
    ],
  ],
}

/** The first letter in capitals. */
function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** The four ways of asking about one situation. */
function questionsOf(category: string, situation: Situation): StoryQuestion[] {
  const { key, name, proof, who, days, keywords } = situation
  const request: StoryRequestKind | undefined =
    category === 'leave' ? 'leave' : category === 'personal' ? 'change' : undefined
  const base = { category, keywords, ...(request === undefined ? {} : { request }) }
  const proofLine = proof.startsWith('Nothing') ? proof : `${proof} — a photo is enough`
  return [
    {
      ...base,
      id: `${category}-${key}-need`,
      question: `What do I need to request ${name}?`,
      answer: `${proofLine}. ${sentence(who)} answers within ${days}.`,
      steps: [
        `Open the request for ${name} in the portal.`,
        proof.startsWith('Nothing') ? 'Fill it in; nothing to attach.' : 'Attach the proof.',
        `Send it; you get a notification when ${who} answers.`,
      ],
      ...(proof.startsWith('Nothing') ? {} : { documents: [proof] }),
    },
    {
      ...base,
      id: `${category}-${key}-who`,
      question: `Who approves a request for ${name}, and how long does it take?`,
      answer: `${sentence(who)}, usually within ${days}. You see each step on the request’s page.`,
    },
    {
      ...base,
      id: `${category}-${key}-withdraw`,
      question: `Can I withdraw a request for ${name} after I sent it?`,
      answer: `Yes, until ${who} has decided: open the request and press Withdraw. After that, write to HR.`,
      steps: ['Open the request in My requests.', 'Press Withdraw and say why in a few words.'],
    },
    {
      ...base,
      id: `${category}-${key}-phone`,
      question: `How do I request ${name} on my phone?`,
      answer:
        'In the portal on your phone: open the request, fill it in and take a photo of the proof with the camera. Nothing to print or bring.',
    },
  ]
}

/**
 * Every generated question: eight rounds, each with one situation of every category in turn
 * (its four ways of asking), so the first page mixes the categories as a "most asked" list does.
 */
export function storyQuestions(): StoryQuestion[] {
  const rounds = Math.max(...Object.values(SITUATIONS).map((each) => each.length))
  return Array.from({ length: rounds }, (_, round) =>
    QA_CATEGORIES.flatMap((category) => {
      const situation = SITUATIONS[category.id]?.[round]
      if (situation === undefined) return []
      const [key, name, proof, who, days, keywords] = situation
      return questionsOf(category.id, { key, name, proof, who, days, keywords })
    }),
  ).flat()
}

/** The 320 questions, made once. */
export const QA_QUESTIONS: StoryQuestion[] = storyQuestions()
