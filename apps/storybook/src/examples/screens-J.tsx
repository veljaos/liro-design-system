import { ClipboardCheck, LogOut, RotateCcw } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AppShell,
  BackButton,
  Button,
  CoursePage,
  DateText,
  MoneyText,
  NumberText,
  PrintCertificate,
  PrintDocument,
  PrintFinding,
  PrintGradeReport,
  PrintTable,
  Questionnaire,
  QuizResult,
  useLiro,
  type ModuleTab,
  type PageBack,
  type PrintColumn,
  type PrintParty,
} from '@veljaos/ui'
import { QrCode } from '../../../../packages/ui/src/components/qr-code'
import type { ExampleRoute } from './example-app'
import { BRAND, Navigate, ROUTES } from './example-shell'
import { TOTAL_ROWS } from './screens-core'
import type { ExampleLine } from './examples-story-data'
import {
  CERTIFICATE,
  COURSE,
  courseAt,
  FIRST_ATTEMPT,
  GRADE_WORDS,
  gradeQuiz,
  INVOICE_FACTS,
  J_ROUTES,
  LAB_RESULTS,
  lessonIndex,
  lessonPath,
  LESSONS,
  PASS_MARK,
  PATIENT,
  PRINTED_INVOICE,
  PRINTED_LINES,
  PRINTED_TOTALS,
  PUPIL,
  QUIZ,
  REPORT_ROWS,
  REPORT_TOTALS,
  SECOND_ATTEMPT,
  SELLER,
  TEST_IN_PROGRESS,
  TEST_KEY,
  WORKER,
  type LabResult,
  type QuizAttempt,
  type ReportRow,
} from './data-J'

/*
 * Group J's example screens (P5.17): Learning and printouts.
 * - The occupational-safety course "Bezbednost i zdravlje na radu" as Nikola Marković, a site
 *   worker of Kvadrat Gradnja d.o.o., sees it in his own shell: a CoursePage with the outline
 *   (done, to do, locked with the reason), the lesson, "5 of 8 lessons", the final test on the
 *   general Questionnaire, its QuizResult (not passed, then passed) and the completion with the
 *   certificate's preview and "Download certificate". The lessons are taken in order: "Mark as
 *   done" saves (the route carries the saved progress) and opens the next one.
 * - Printouts, each a print preview with no application chrome — a bar with the way back and
 *   Print (hidden on paper) above the sheet: invoice F-2026-0412 from its page's "PDF" (the
 *   dataset's lines and totals), the course certificate, a pupil's report card from OŠ „Jovan
 *   Popović“ Novi Sad and a specialist's finding from Dom zdravlja Novi Sad.
 * The screens use only `@veljaos/ui`; grading, progress and every figure are the application's
 * (data-J.ts), checked in dataset-checks.ts.
 */

// ── The worker's shell ────────────────────────────────────────────────────────────────────────

const LEARNING_TABS: ModuleTab[] = [
  { key: 'courses', label: 'My courses', href: '#/learning', current: true },
  { key: 'certificates', label: 'Certificates', href: '#/learning/certificates' },
]

/** Nikola Marković's shell: his own sign-in, one company, Learning. */
function WorkerShell({ phone, children }: { phone: boolean; children: ReactNode }) {
  const navigate = useContext(Navigate)
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Learning', href: '#/learning' }, { label: COURSE.title }]}
      moduleTabs={LEARNING_TABS}
      user={{
        name: WORKER.name,
        email: WORKER.email,
        entries: [
          {
            label: 'Sign out',
            icon: LogOut,
            onSelect: () => {
              navigate(ROUTES.signIn)
            },
          },
        ],
      }}
    >
      {children}
    </AppShell>
  )
}

// ── The lessons ───────────────────────────────────────────────────────────────────────────────

function Paragraphs({ texts }: { texts: readonly string[] }) {
  return (
    <>
      {texts.map((text) => (
        <p key={text} className="bidi-content m-0">
          {text}
        </p>
      ))}
    </>
  )
}

/** The lessons' content, as the application stores it. */
const LESSON_CONTENT: Readonly<Record<string, ReactNode>> = {
  rights: (
    <Paragraphs
      texts={[
        'Kvadrat Gradnja provides safe work and the equipment for it; you work as you were trained, use the equipment you are given and report every hazard you see to the site manager.',
        'You may stop work that puts you or others in immediate danger, and you will not be held responsible for stopping it.',
      ]}
    />
  ),
  risks: (
    <Paragraphs
      texts={[
        'Every workplace on the site has its risk assessment: the hazards, how likely they are and the measures that keep them small. Your site manager shows you the assessment of your workplace before your first shift.',
        'When the work changes — a new machine, a new floor, work at night — the assessment is checked again before the work starts.',
      ]}
    />
  ),
  equipment: (
    <Paragraphs
      texts={[
        'On every site you wear a safety helmet, safety boots and a high-visibility vest. Gloves, goggles, ear protection and a harness are added where the work needs them.',
        'Check your equipment before each shift. Damaged equipment is replaced at the site store, at no cost to you.',
      ]}
    />
  ),
  scaffolding: (
    <Paragraphs
      texts={[
        'Scaffolding is assembled only by trained workers, following the manufacturer’s instructions and the assembly plan.',
        'Before work starts each day, a competent person named by the site manager checks it and signs the scaffolding tag. A red tag means: do not use.',
      ]}
    />
  ),
  falls: (
    <Paragraphs
      texts={[
        'From a height of 2 m, every worker is protected against falling: by guard rails first, by nets where rails cannot stand, and by a harness clipped to an anchor point where neither is possible.',
        'An anchor point is tested and marked. Never clip your harness to a guard rail or a pipe.',
      ]}
    />
  ),
  handling: (
    <>
      <p className="bidi-content m-0">
        Most injuries on Kvadrat Gradnja’s sites in 2025 came from lifting and carrying, not from
        falls. A load is heavy for the back long before it is too heavy for the arms: plan the lift,
        use the crane or a trolley where you can, and ask a colleague for anything over 25 kg.
      </p>
      <h3 className="bidi-content m-0 text-h5 text-primary">Before you lift</h3>
      <ul className="m-0 flex flex-col gap-1 ps-6">
        <li className="bidi-content">
          Check the weight on the label or the delivery note; test it by tipping one edge.
        </li>
        <li className="bidi-content">
          Clear the path to where the load goes, and find where you will set it down.
        </li>
        <li className="bidi-content">Wear gloves for sharp edges, and safety boots — always.</li>
      </ul>
      <h3 className="bidi-content m-0 text-h5 text-primary">How to lift</h3>
      <p className="bidi-content m-0">
        Stand close to the load with your feet apart, bend your knees, keep your back straight and
        lift with your legs. Hold the load close to your body and turn with your feet, never with
        your back.
      </p>
      <Alert tone="warning" title="Never lift alone">
        Cement bags, blocks on a pallet and reinforcement bars over 25 kg are carried by two people
        or with a trolley.
      </Alert>
    </>
  ),
  cranes: (
    <Paragraphs
      texts={[
        'Only a trained slinger attaches a load to the crane, with slings checked for wear and marked with their capacity.',
        'One signaller is named for each lift and is the only person who gives the crane operator signals; anyone may give the stop signal. Never stand under a suspended load.',
      ]}
    />
  ),
}

/** The pager's links: the lesson before, and the one after while it is not locked. */
function pager(index: number, done: number) {
  const before = LESSONS[index - 1]
  const after = index + 1 <= done ? LESSONS[index + 1] : undefined
  return {
    ...(before === undefined
      ? {}
      : { previous: { title: before.title, href: `#${lessonPath(before.key, done)}` } }),
    ...(after === undefined
      ? {}
      : { next: { title: after.title, href: `#${lessonPath(after.key, done)}` } }),
  }
}

/** A lesson of the course at the saved progress; "Mark as done" saves and moves on. */
export function CourseLessonScreen({
  phone,
  lessonKey,
  done,
  outlineOpen = false,
}: {
  phone: boolean
  lessonKey: string
  done: number
  outlineOpen?: boolean
}) {
  const navigate = useContext(Navigate)
  const index = lessonIndex(lessonKey)
  return (
    <WorkerShell phone={phone}>
      <div className="mx-auto box-border w-full max-w-content">
        <CoursePage
          layout={phone ? 'phone' : 'desktop'}
          title={COURSE.title}
          subtitle={COURSE.subtitle}
          modules={courseAt(done)}
          currentKey={lessonKey}
          defaultOutlineOpen={outlineOpen}
          {...pager(index, done)}
          onMarkDone={() => {
            navigate(lessonPath(lessonKey, done + 1))
          }}
        >
          {LESSON_CONTENT[lessonKey]}
        </CoursePage>
      </div>
    </WorkerShell>
  )
}

/**
 * An issuer's logo on a printout (an image from the application, D18): a mark and the name in the
 * logo colour, drawn here as an SVG.
 */
function Logo({ name, mark }: { name: string; mark: 'square' | 'cross' | 'school' }) {
  const shapes = {
    square: (
      <rect
        x="2.5"
        y="4.5"
        width="23"
        height="23"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
    ),
    cross: <path d="M10 4h8v8h8v8h-8v8h-8v-8H2v-8h8z" />,
    school: <path d="M14 3 2 9v3h24V9zM4 14h4v10H4zm8 0h4v10h-4zm8 0h4v10h-4zM2 26h24v3H2z" />,
  }
  return (
    <svg
      role="img"
      aria-label={name}
      viewBox="0 0 220 32"
      className="block h-8 w-auto text-logo"
      fill="currentColor"
    >
      {shapes[mark]}
      <text x="34" y="22" fontSize="16" fontWeight="700" fontFamily="var(--liro-font-brand)">
        {name}
      </text>
    </svg>
  )
}

function Certificate() {
  return (
    <PrintCertificate
      title={CERTIFICATE.title}
      subtitle={CERTIFICATE.subtitle}
      lead={CERTIFICATE.lead}
      recipient={CERTIFICATE.recipient}
      recipientDetail={CERTIFICATE.recipientDetail}
      text={CERTIFICATE.text}
      number={CERTIFICATE.number}
      issued={CERTIFICATE.issued}
      signatures={CERTIFICATE.signatures}
      logo={<Logo name="Kvadrat Gradnja" mark="square" />}
    />
  )
}

/**
 * The final test: the questions (Questionnaire), then the application's grade (QuizResult). Not
 * passed: the answers and "Take the test again"; passed: the course completed, the certificate.
 */
export function FinalTestScreen({
  phone,
  done: saved,
  attempt: restored = null,
}: {
  phone: boolean
  done: number
  attempt?: QuizAttempt | null
}) {
  const navigate = useContext(Navigate)
  const { format, today } = useLiro()
  const [done, setDone] = useState(saved)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(restored)
  const [round, setRound] = useState(0)
  const index = lessonIndex(TEST_KEY)
  const completed = done > index
  const mark = format.number(String(PASS_MARK))
  const content =
    attempt === null ? (
      <>
        <p className="bidi-content m-0">
          {`${format.number(String(QUIZ.length))} questions on the whole course. You need ${mark} correct answers to pass; you may take the test again.`}
        </p>
        <div
          className={`box-border w-full max-w-160 rounded-lg border border-solid border-default bg-surface-raised ${phone ? 'p-4' : 'p-6'}`}
        >
          <Questionnaire
            key={round}
            label="Final test"
            questions={QUIZ}
            headingLevel={3}
            {...(round === 0 && saved === index && restored === null
              ? {
                  defaultAnswers: TEST_IN_PROGRESS,
                  defaultStep: { kind: 'question' as const, id: 'equipment' },
                }
              : {})}
            submitLabel="Submit answers"
            submitIcon={ClipboardCheck}
            onSubmit={(answers) => {
              const graded = gradeQuiz(answers)
              setAttempt(graded)
              if (graded.passed) setDone(index + 1)
            }}
          />
        </div>
      </>
    ) : (
      <QuizResult
        title="Your result"
        headingLevel={3}
        correct={attempt.correct}
        total={attempt.total}
        passed={attempt.passed}
        requirement={
          attempt.passed
            ? `You needed ${mark} correct answers.`
            : `You need ${mark} correct answers to pass.`
        }
        {...(attempt.passed
          ? {}
          : {
              actions: (
                <Button
                  family="neutral"
                  icon={RotateCcw}
                  label="Take the test again"
                  onClick={() => {
                    setAttempt(null)
                    setRound((value) => value + 1)
                  }}
                />
              ),
              review: attempt.review,
            })}
      />
    )
  return (
    <WorkerShell phone={phone}>
      <div className="mx-auto box-border w-full max-w-content">
        <CoursePage
          layout={phone ? 'phone' : 'desktop'}
          title={COURSE.title}
          subtitle={COURSE.subtitle}
          modules={courseAt(done)}
          currentKey={TEST_KEY}
          {...pager(index, done)}
          {...(completed && attempt !== null
            ? {
                completion: {
                  description: `Completed on ${format.date(today)} with ${format.number(String(attempt.correct))} of ${format.number(String(attempt.total))} correct answers in the final test.`,
                  onDownload: () => {
                    navigate(J_ROUTES.certificate)
                  },
                  certificate: <Certificate />,
                },
              }
            : {})}
        >
          {content}
        </CoursePage>
      </div>
    </WorkerShell>
  )
}

// ── Print previews ────────────────────────────────────────────────────────────────────────────

/**
 * A printout as the application opens it: no shell, a bar with the way back and Print above the
 * sheet (the bar is left off the paper), the sheet on the page.
 */
function PrintPreview({
  title,
  back,
  children,
}: {
  title: string
  back?: PageBack
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2 print:hidden">
        {back !== undefined && <BackButton back={back} />}
        <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          {title}
        </p>
        <Button
          intent="print"
          label="Print"
          onClick={() => {
            window.print()
          }}
        />
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}

const INVOICE_COLUMNS: PrintColumn<ExampleLine>[] = [
  { key: 'item', header: 'Item', cell: (line) => line.item },
  {
    key: 'quantity',
    header: 'Quantity',
    align: 'end',
    cell: (line) => <NumberText value={line.quantity} />,
  },
  { key: 'unit', header: 'Unit', cell: (line) => line.unit, width: '12mm' },
  {
    key: 'price',
    header: 'Price',
    align: 'end',
    cell: (line) => <NumberText value={line.price} decimals={2} />,
  },
  { key: 'vat', header: 'VAT', cell: (line) => line.vat, width: '16mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** A footer of parts: it wraps between the parts, never inside a number. */
function FooterLine({ parts }: { parts: readonly string[] }) {
  return (
    <>
      {parts.map((part, index) => (
        <span key={part}>
          {index > 0 && ' · '}
          <span className="whitespace-nowrap">{part}</span>
        </span>
      ))}
    </>
  )
}

/**
 * Invoice F-2026-0412 on paper, as simple as a Stripe invoice (P5.28): the lines and totals its
 * page shows, from the same data; the amount due, the payment details and the IPS QR code; no
 * signatures.
 */
export function InvoicePrintScreen() {
  const { format } = useLiro()
  const invoice = PRINTED_INVOICE
  const seller: PrintParty = {
    key: 'seller',
    label: 'Seller',
    name: SELLER.name,
    lines: [SELLER.address, SELLER.city],
    details: [
      { key: 'pib', label: 'PIB', value: SELLER.taxId, numeric: true },
      { key: 'mb', label: 'MB', value: SELLER.registration, numeric: true },
      { key: 'email', label: 'E-mail', value: SELLER.email },
    ],
  }
  const buyer: PrintParty = {
    key: 'buyer',
    label: 'Buyer',
    name: invoice.customer,
    lines: [invoice.address],
    details: [
      { key: 'pib', label: 'PIB', value: invoice.taxId, numeric: true },
      { key: 'mb', label: 'MB', value: INVOICE_FACTS.buyerRegistration, numeric: true },
      { key: 'email', label: 'E-mail', value: INVOICE_FACTS.buyerEmail },
    ],
  }
  const due = `${format.money(PRINTED_TOTALS.due, 'RSD')} due ${format.date(invoice.due)}`
  return (
    <PrintPreview
      title={`Invoice ${invoice.number}`}
      back={{ href: `#${ROUTES.invoice(invoice.number)}`, label: invoice.number }}
    >
      <PrintDocument
        title="Invoice"
        number={invoice.number}
        logo={<Logo name="Kvadrat Gradnja" mark="square" />}
        footer={<FooterLine parts={[`Invoice ${invoice.number}`, due]} />}
        details={[
          {
            key: 'number',
            label: 'Invoice number',
            value: <bdi>{invoice.number}</bdi>,
            numeric: true,
          },
          {
            key: 'issued',
            label: 'Date of issue',
            value: <DateText value={invoice.issued} />,
            numeric: true,
          },
          {
            key: 'supplied',
            label: 'Date of supply',
            value: <DateText value={INVOICE_FACTS.supplied} />,
            numeric: true,
          },
          { key: 'due', label: 'Due date', value: <DateText value={invoice.due} />, numeric: true },
          { key: 'place', label: 'Place of issue', value: INVOICE_FACTS.place },
        ]}
        parties={[seller, buyer]}
        amountDue={{ value: PRINTED_TOTALS.due, currency: 'RSD', date: invoice.due }}
        payment={{
          title: 'Payment details',
          details: [
            { key: 'recipient', label: 'Recipient', value: `${SELLER.name}, Novi Sad` },
            {
              key: 'account',
              label: 'Account',
              value: <bdi>{`${SELLER.account} (${SELLER.bank})`}</bdi>,
              numeric: true,
            },
            {
              key: 'reference',
              label: 'Model and reference number',
              value: <bdi>{INVOICE_FACTS.reference}</bdi>,
              numeric: true,
            },
            { key: 'purpose', label: 'Purpose of payment', value: `Invoice ${invoice.number}` },
          ],
          code: (
            <QrCode
              value={INVOICE_FACTS.ipsPayload}
              label="IPS QR code for the payment"
              size="fill"
            />
          ),
          codeCaption: 'IPS QR',
        }}
        lines={{
          caption: 'Lines',
          columns: INVOICE_COLUMNS,
          rows: PRINTED_LINES,
          rowKey: (line) => line.id,
        }}
        totals={{
          label: 'Totals',
          rows: TOTAL_ROWS,
          total: { key: 'due', label: 'Amount due', value: PRINTED_TOTALS.due, currency: 'RSD' },
        }}
        notesTitle="Notes"
        notes={[
          `The advance ${INVOICE_FACTS.advance} is deducted from this invoice.`,
          `The pallet deposit of ${format.money(PRINTED_TOTALS.exempt, 'RSD')} is exempt from VAT and is returned when the pallets come back.`,
        ]}
      />
    </PrintPreview>
  )
}

/** The course certificate, from "Download certificate". */
export function CertificatePrintScreen() {
  return (
    <PrintPreview
      title={`Certificate ${CERTIFICATE.code}`}
      back={{ href: `#${J_ROUTES.completed}`, label: COURSE.title }}
    >
      <Certificate />
    </PrintPreview>
  )
}

const REPORT_COLUMNS: PrintColumn<ReportRow>[] = [
  { key: 'subject', header: 'Subject', cell: (row) => row.subject },
  {
    key: 'grade',
    header: 'Grade',
    align: 'end',
    width: '18mm',
    cell: (row) => (
      <NumberText value={row.grade} {...(row.type === 'subtotal' ? { decimals: 2 } : {})} />
    ),
  },
  {
    key: 'words',
    header: 'In words',
    width: '34mm',
    cell: (row) =>
      row.type === 'subtotal' ? REPORT_TOTALS.success.toLowerCase() : GRADE_WORDS[row.grade],
  },
  {
    key: 'absences',
    header: 'Hours absent',
    align: 'end',
    width: '26mm',
    cell: (row) => <NumberText value={row.absences} />,
  },
]

/** A pupil's report card for the school year 2025/26. */
export function ReportCardPrintScreen() {
  const school = 'OŠ „Jovan Popović“ Novi Sad'
  return (
    <PrintPreview title={`Report card, ${PUPIL.name}`}>
      <PrintGradeReport
        title="Report card"
        period="End of the school year 2025/26 · 7th grade"
        logo={<Logo name={school} mark="school" />}
        header={`${school} · Report card · ${PUPIL.name}, ${PUPIL.class}`}
        footer="OŠ „Jovan Popović“ · Braće Popović 1, 21000 Novi Sad · 021 6400 123"
        details={[
          { key: 'name', label: 'Pupil', value: PUPIL.name },
          { key: 'class', label: 'Class', value: PUPIL.class },
          {
            key: 'born',
            label: 'Date of birth',
            value: <DateText value={PUPIL.born} />,
            numeric: true,
          },
          { key: 'register', label: 'Register number', value: PUPIL.register, numeric: true },
          { key: 'teacher', label: 'Class teacher', value: PUPIL.teacher },
        ]}
        table={{
          caption: 'Final grades by subject',
          captionVisible: true,
          columns: REPORT_COLUMNS,
          rows: REPORT_ROWS,
          rowKey: (row) => row.id,
          lineType: (row) => row.type,
        }}
        summary={[
          {
            key: 'success',
            label: 'Overall success',
            value: (
              <>
                {REPORT_TOTALS.success} (<NumberText value={REPORT_TOTALS.average} decimals={2} />)
              </>
            ),
          },
          { key: 'conduct', label: 'Conduct', value: 'Exemplary (5)' },
          {
            key: 'absences',
            label: 'Hours absent',
            numeric: true,
            value: (
              <>
                <NumberText value={REPORT_TOTALS.excused} /> excused,{' '}
                <NumberText value={REPORT_TOTALS.unexcused} /> unexcused
              </>
            ),
          },
        ]}
        remarks={{
          title: 'Remarks',
          content: (
            <p className="bidi-content m-0">
              Mila is curious and reliable and helps her classmates. She took part in the municipal
              history competition and sings in the school choir.
            </p>
          ),
        }}
        issued={{ place: 'Novi Sad', date: '2026-06-26' }}
        signatures={[
          { id: 'teacher', label: 'Class teacher', name: PUPIL.teacher },
          { id: 'principal', label: 'Principal', name: PUPIL.principal },
        ]}
      />
    </PrintPreview>
  )
}

const LAB_COLUMNS: PrintColumn<LabResult>[] = [
  { key: 'test', header: 'Test', cell: (row) => row.test },
  {
    key: 'value',
    header: 'Result',
    align: 'end',
    cell: (row) => <NumberText value={row.value} />,
  },
  { key: 'flag', header: 'Flag', width: '16mm', cell: (row) => row.flag },
  {
    key: 'range',
    header: 'Reference range',
    align: 'end',
    cell: (row) =>
      row.low === undefined ? (
        <>
          {'< '}
          <NumberText value={row.high} />
        </>
      ) : (
        <>
          <NumberText value={row.low} />
          {' – '}
          <NumberText value={row.high} />
        </>
      ),
  },
  { key: 'unit', header: 'Unit', width: '20mm', cell: (row) => row.unit },
]

/** A specialist's finding from Dom zdravlja Novi Sad. */
export function FindingPrintScreen() {
  const { format } = useLiro()
  const number = 'IM-2026-14327'
  return (
    <PrintPreview title={`Specialist examination report ${number}`}>
      <PrintFinding
        title="Specialist examination report"
        number={number}
        logo={<Logo name="Dom zdravlja Novi Sad" mark="cross" />}
        header={`Dom zdravlja Novi Sad · Internal medicine · ${PATIENT.name}, ${number}`}
        footer="Dom zdravlja Novi Sad · Bulevar cara Lazara 75 · 021 4879 000"
        confidentiality="Confidential medical record. It may be shown only to the patient and to persons authorised by law."
        subjectTitle="Patient"
        subject={[
          { key: 'name', label: 'Name', value: PATIENT.name },
          {
            key: 'born',
            label: 'Date of birth',
            value: <DateText value={PATIENT.born} />,
            numeric: true,
          },
          {
            key: 'insurance',
            label: 'Health insurance number',
            value: PATIENT.insurance,
            numeric: true,
          },
          { key: 'doctor', label: 'Chosen doctor', value: PATIENT.chosenDoctor },
        ]}
        details={[
          {
            key: 'date',
            label: 'Examined on',
            value: <DateText value="2026-10-05" />,
            numeric: true,
          },
          {
            key: 'referral',
            label: 'Referral',
            value: `From ${PATIENT.chosenDoctor}, ${format.date('2026-09-22')}`,
          },
          { key: 'doctor', label: 'Specialist', value: 'dr Jasmina Kovač' },
        ]}
        sections={[
          {
            key: 'reason',
            title: 'Reason for referral',
            content: (
              <p className="bidi-content m-0">
                Raised blood pressure measured three times at the chosen doctor’s office; assessment
                and therapy.
              </p>
            ),
          },
          {
            key: 'history',
            title: 'History',
            content: (
              <Paragraphs
                texts={[
                  'Occasional headaches in the morning for about two months, without dizziness or chest pain. No shortness of breath on exertion; she climbs three floors without stopping.',
                  'Her mother had hypertension and a stroke at 70. She does not smoke. No regular therapy; no known allergies to medicines.',
                ]}
              />
            ),
          },
          {
            key: 'examination',
            title: 'Examination',
            content: (
              <p className="bidi-content m-0">
                Conscious, oriented, eupnoeic. Blood pressure 158/96 mmHg on the right arm and
                154/94 mmHg on the left, pulse 78/min, regular. Heart sounds clear, no murmurs.
                Breathing vesicular on both sides. No oedema of the legs. ECG: sinus rhythm, 76/min,
                no signs of ischaemia.
              </p>
            ),
          },
          {
            key: 'laboratory',
            title: 'Laboratory',
            content: (
              <PrintTable
                caption={`Laboratory results, ${format.date('2026-10-03')}`}
                captionVisible
                columns={LAB_COLUMNS}
                rows={LAB_RESULTS}
                rowKey={(row) => row.id}
              />
            ),
          },
          {
            key: 'diagnosis',
            title: 'Diagnosis',
            content: (
              <ul className="m-0 flex flex-col gap-1 ps-5">
                <li className="bidi-content">
                  <span dir="ltr">I10</span> Essential (primary) hypertension
                </li>
                <li className="bidi-content">
                  <span dir="ltr">E78.0</span> Pure hypercholesterolaemia
                </li>
                <li className="bidi-content">
                  <span dir="ltr">R73.9</span> Hyperglycaemia, unspecified
                </li>
              </ul>
            ),
          },
          {
            key: 'therapy',
            title: 'Therapy and recommendations',
            content: (
              <Paragraphs
                texts={[
                  'Ramipril 5 mg, one tablet in the morning; atorvastatin 20 mg, one tablet in the evening. Less salt, regular walks of 30 minutes, blood pressure measured at home twice a day and written down.',
                  'Glucose tolerance test (OGTT) at the laboratory. Follow-up at this office in 6 weeks, with the blood pressure diary and the results.',
                ]}
              />
            ),
          },
        ]}
        issued={{ place: 'Novi Sad', date: '2026-10-05' }}
        signatures={[
          {
            id: 'doctor',
            label: 'Specialist',
            name: 'dr Jasmina Kovač',
            detail: 'Specialist in internal medicine',
            // A facsimile of the signature, an image from the application.
            image: (
              <span
                role="img"
                aria-label="Signature of dr Jasmina Kovač"
                className="bidi-isolate pb-1 text-lg text-secondary italic"
              >
                J. Kovač
              </span>
            ),
          },
        ]}
      />
    </PrintPreview>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/** The course at every saved progress from Nikola's (5 of 8) to completed, every open lesson. */
function courseRoutes(): ExampleRoute[] {
  const routes: ExampleRoute[] = []
  for (let done = 5; done <= LESSONS.length; done += 1) {
    LESSONS.forEach((lesson, index) => {
      if (index > done) return
      const path = lessonPath(lesson.key, done)
      routes.push({
        path,
        render: (phone) =>
          lesson.key === TEST_KEY ? (
            <FinalTestScreen
              phone={phone}
              done={done}
              attempt={done > index ? SECOND_ATTEMPT : null}
            />
          ) : (
            <CourseLessonScreen phone={phone} lessonKey={lesson.key} done={done} />
          ),
      })
    })
  }
  return routes
}

/** Group J's screens, registered in example-app.tsx. */
export const GROUP_J_ROUTES: ExampleRoute[] = [
  ...courseRoutes(),
  {
    path: J_ROUTES.lessonOutline,
    render: (phone) => (
      <CourseLessonScreen phone={phone} lessonKey="handling" done={5} outlineOpen />
    ),
  },
  {
    path: J_ROUTES.testNotPassed,
    render: (phone) => (
      <FinalTestScreen phone={phone} done={lessonIndex(TEST_KEY)} attempt={FIRST_ATTEMPT} />
    ),
  },
  { path: J_ROUTES.certificate, render: () => <CertificatePrintScreen /> },
  { path: J_ROUTES.invoicePrint, render: () => <InvoicePrintScreen /> },
  { path: J_ROUTES.reportCard, render: () => <ReportCardPrintScreen /> },
  { path: J_ROUTES.finding, render: () => <FindingPrintScreen /> },
]
