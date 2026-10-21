/*
 * Group BW's example data (P5.82, client risk assessment): the application's risk questionnaire
 * (client type, activity, countries, ownership, services, how the client was taken on), the
 * answers of Kvadrat Gradnja d.o.o.'s last assessment that its review starts from, the reasons
 * the application accepts for an override, and what the application returns for a review. The
 * matrix, its points, the score, the band and the next review are the application's: the screens
 * never add points or choose a risk. Invented throughout. Not part of the package. No classes.
 */
import type { ConfirmReason, QuestionAnswers, QuestionDefinition } from '@veljaos/ui'
import {
  AML_OFFICER,
  AML_TODAY,
  amlAt,
  type AmlAssessment,
  type AmlClient,
  type AmlRisk,
} from './data-aml'

/** The application's risk questionnaire; "Ownership" asks about the owners above a company. */
export const RISK_QUESTIONS: readonly QuestionDefinition[] = [
  {
    id: 'client-type',
    title: 'What kind of client is it?',
    type: 'single',
    options: [
      { value: 'llc', label: 'Limited liability company' },
      { value: 'jsc', label: 'Joint-stock company' },
      { value: 'entrepreneur', label: 'Entrepreneur' },
      { value: 'association', label: 'Association or foundation' },
      { value: 'branch', label: 'Branch of a foreign company' },
    ],
  },
  {
    id: 'activity',
    title: 'What is the client’s main activity?',
    description: 'As registered, or as the client actually works when that differs.',
    type: 'single',
    options: [
      { value: 'construction', label: 'Construction' },
      { value: 'trade', label: 'Wholesale and trade in goods' },
      { value: 'retail', label: 'Retail and hospitality' },
      { value: 'agriculture', label: 'Agriculture and food' },
      { value: 'real-estate', label: 'Real estate' },
      { value: 'other', label: 'Another activity', other: true },
    ],
    otherLabel: 'The activity',
  },
  {
    id: 'country',
    title: 'Where does the client do business?',
    description: 'Where it buys, sells and holds accounts.',
    type: 'single',
    options: [
      { value: 'serbia', label: 'Serbia only' },
      { value: 'neighbours', label: 'Serbia and neighbouring countries' },
      { value: 'eu', label: 'Serbia and EU countries' },
      {
        value: 'listed',
        label: 'Also in a country on the higher-risk list',
        description: 'The list the application keeps.',
      },
    ],
  },
  {
    id: 'ownership',
    title: 'Who owns the client?',
    type: 'single',
    options: [
      { value: 'direct', label: 'Natural persons in Serbia, directly', next: 'products' },
      { value: 'domestic', label: 'Through a company in Serbia' },
      { value: 'foreign', label: 'Through a company abroad' },
      { value: 'undisclosed', label: 'The owners are not disclosed', next: 'products' },
    ],
  },
  {
    id: 'owners-known',
    title: 'Are all owners known, up to the natural persons?',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes, every owner is known' },
      { value: 'no', label: 'No, some owners are not known' },
    ],
  },
  {
    id: 'products',
    title: 'Which services does the client use?',
    type: 'multiple',
    options: [
      { value: 'bookkeeping', label: 'Bookkeeping' },
      { value: 'payroll', label: 'Payroll' },
      { value: 'tax', label: 'Tax returns' },
      { value: 'formation', label: 'Company formation and a registered address' },
      { value: 'payments', label: 'Handling the client’s payments' },
    ],
  },
  {
    id: 'channel',
    title: 'How was the client taken on?',
    type: 'single',
    options: [
      { value: 'in-person', label: 'In person' },
      { value: 'video', label: 'Remotely, with video identification' },
      { value: 'representative', label: 'Remotely, through a representative' },
    ],
  },
]

/** The answers of a client's last assessment, which its review starts from. */
export const LAST_ANSWERS: Readonly<Record<string, QuestionAnswers>> = {
  kvadrat: {
    'client-type': { value: 'llc' },
    activity: { value: 'construction' },
    country: { value: 'serbia' },
    ownership: { value: 'domestic' },
    'owners-known': { value: 'yes' },
    products: { value: ['bookkeeping', 'payroll', 'tax'] },
    channel: { value: 'in-person' },
  },
}

/** The reasons the application accepts for setting a risk over the assessment's. */
export const OVERRIDE_REASONS: readonly ConfirmReason[] = [
  { value: 'ownership', label: 'Ownership not fully known' },
  { value: 'adverse', label: 'Adverse information about the client' },
  { value: 'unusual', label: 'Activity unusual for the client' },
  { value: 'documented', label: 'Long relationship, fully documented' },
  { value: 'other', label: 'Another reason, in the details' },
]

/** The next review the application sets for a review made today, by the risk in force. */
const NEXT_REVIEW: Record<AmlRisk, string> = {
  Low: '2029-10-14',
  Medium: '2027-10-14',
  High: '2027-04-14',
}

/**
 * What the application returns for a review made today with the answers unchanged: the same
 * factors, points and score, a new number and date, the next review by its cycle. A changed
 * answer would come back from the application the same way, with its own result.
 */
export function reviewedAssessment(client: AmlClient): AmlAssessment {
  const previous = client.assessment
  const level = previous.override?.level ?? previous.level
  return {
    id: 'RA-2026-0201',
    on: AML_TODAY,
    by: AML_OFFICER.name,
    level: previous.level,
    score: previous.score,
    scale: previous.scale,
    band: previous.band,
    method: 'Illustrative risk matrix, version 2026-01',
    factors: previous.factors,
    nextReview: NEXT_REVIEW[level],
    ...(previous.override === undefined ? {} : { override: previous.override }),
  }
}

/** The client after the review: the new assessment, its history entry, the file complete again. */
export function reviewedClient(
  client: AmlClient,
  at: string = amlAt(AML_TODAY, '09:40'),
): AmlClient {
  const assessment = reviewedAssessment(client)
  const { kycNote, ...rest } = client
  return {
    ...rest,
    assessment,
    kyc: client.kyc === 'Review due' ? 'Complete' : client.kyc,
    ...(client.kyc === 'Review due' || kycNote === undefined ? {} : { kycNote }),
    history: [
      {
        id: `${client.id}-review-${AML_TODAY}`,
        at,
        actor: { name: AML_OFFICER.name },
        text: `Review: the risk stays ${assessment.level} (${assessment.score} points).`,
      },
      ...client.history,
    ],
  }
}
