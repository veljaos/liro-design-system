import type { Meta, StoryObj } from '@storybook/react-vite'
import { ClipboardCheck, HardHat, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Alert } from '../components/alert'
import { Button } from '../components/button'
import { Questionnaire } from '../components/questionnaire'
import { QuizResult } from '../components/quiz-result'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { CoursePage, type CoursePageProps } from './course-page'
import { SAFETY_CERTIFICATE, SAFETY_QUIZ, safetyCourse } from './print-story-data'
import { PrintCertificate } from './print-templates'

const noop = () => undefined

/** The lesson "Manual handling of loads": text, a list, a warning. */
function HandlingLesson() {
  return (
    <>
      <p className={cn('m-0', TEXT_DIRECTION)}>
        Most injuries on Kvadrat Gradnja’s sites in 2025 came from lifting and carrying, not from
        falls. A load is heavy for the back long before it is too heavy for the arms: plan the lift,
        use the crane or a trolley where you can, and ask a colleague for anything over 25 kg.
      </p>
      <h3 className={cn('m-0 text-h5 text-primary', TEXT_DIRECTION)}>Before you lift</h3>
      <ul className="m-0 flex flex-col gap-1 ps-6">
        <li className={TEXT_DIRECTION}>
          Check the weight on the label or the delivery note; test it by tipping one edge.
        </li>
        <li className={TEXT_DIRECTION}>
          Clear the path to where the load goes, and find where you will set it down.
        </li>
        <li className={TEXT_DIRECTION}>Wear gloves for sharp edges, and safety boots — always.</li>
      </ul>
      <h3 className={cn('m-0 text-h5 text-primary', TEXT_DIRECTION)}>How to lift</h3>
      <p className={cn('m-0', TEXT_DIRECTION)}>
        Stand close to the load with your feet apart, bend your knees, keep your back straight and
        lift with your legs. Hold the load close to your body and turn with your feet, never with
        your back.
      </p>
      <Alert tone="warning" title="Never lift alone">
        Cement bags, blocks on a pallet and reinforcement bars over 25 kg are carried by two people
        or with a trolley.
      </Alert>
    </>
  )
}

/** The emblem of the certificate, an image from the application (D18). */
function Emblem() {
  return (
    <span className="flex size-16 items-center justify-center rounded-full border-2 border-solid border-strong text-primary">
      <HardHat aria-hidden="true" className="size-8" />
    </span>
  )
}

const COURSE: CoursePageProps = {
  title: 'Bezbednost i zdravlje na radu',
  subtitle: 'Occupational safety and health · required for Kvadrat Gradnja site workers',
  modules: safetyCourse(7),
  currentKey: 'handling',
  previous: { title: 'Cranes, slings and signals', href: '#learning/safety/cranes' },
  next: { title: 'Electrical safety on the site', href: '#learning/safety/electricity' },
  onMarkDone: noop,
}

/** The final test: every other lesson done, nothing after it. */
const FINAL: CoursePageProps = {
  title: COURSE.title,
  subtitle: COURSE.subtitle ?? '',
  modules: safetyCourse(11),
  currentKey: 'test',
  previous: { title: 'Fire safety and evacuation', href: '#learning/safety/fire' },
}

/** The course completed, the certificate offered. */
const COMPLETED: CoursePageProps = {
  ...FINAL,
  modules: safetyCourse(12),
  completion: {
    description: 'Completed on 10.10.2026. with 9 of 10 correct answers in the final test.',
    onDownload: noop,
    certificate: <PrintCertificate {...SAFETY_CERTIFICATE} logo={<Emblem />} />,
  },
}

/** The page in a phone frame. */
function PhonePage(args: CoursePageProps) {
  return (
    <PhoneFrame>
      <ExampleProvider>
        <CoursePage {...args} layout="phone">
          <HandlingLesson />
        </CoursePage>
      </ExampleProvider>
    </PhoneFrame>
  )
}

const meta = {
  title: 'Templates/CoursePage',
  component: CoursePage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a course to work through: the outline (modules and lessons, each ' +
          'lesson’s state in words — done, to do, locked with the application’s reason; the ' +
          'lesson shown is the neutral selection), the progress to completion ("7 of 12 ' +
          'lessons" over a bar), the lesson’s content, "Mark as done", and the previous and the ' +
          'next lesson at the bottom. A quiz is a lesson whose content is the general ' +
          'Questionnaire (P5.1); its outcome is a QuizResult ("9 of 10 correct", passed or not ' +
          'from the application). At completion the page offers the certificate: "Download ' +
          'certificate" and its preview (a PrintCertificate, P5.15). Phones: the content first, ' +
          'the outline in a drawer from "Course outline".\n\n' +
          '**When:** training and courses: occupational safety, onboarding, a school subject’s ' +
          'lessons.\n\n' +
          '**When not:** a guided form (FormWizard, Questionnaire alone); documentation that is ' +
          'read in any order (a DetailPage with a SectionBar).',
      },
    },
  },
  args: COURSE,
  render: (args) => (
    <ExampleProvider>
      <CoursePage {...args} layout="desktop">
        <HandlingLesson />
      </CoursePage>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof CoursePage>

export default meta

type Story = StoryObj<typeof meta>

/** A lesson in the middle of the course: 7 of 12 done, the final test locked. */
export const Default: Story = {
  name: 'Lesson',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Bezbednost i zdravlje na radu',
    )
    await expect(canvas.getByText('7 of 12 lessons')).toBeVisible()
    await expect(canvas.getByRole('progressbar', { name: 'Course progress' })).toBeVisible()
    const outline = canvas.getByRole('navigation', { name: 'Course outline' })
    const current = within(outline).getByRole('link', { current: 'page' })
    await expect(current).toHaveTextContent('Manual handling of loads')
    await expect(current).toHaveAttribute('data-state', 'todo')
    await expect(
      within(outline).getByText('Quiz · 10 questions · Locked: finish every lesson first'),
    ).toBeVisible()
    await expect(within(outline).queryByRole('link', { name: /Final test/ })).toBeNull()
    await expect(within(outline).getByText('1 of 3 done')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Mark as done' })).toBeEnabled()
    const pager = canvas.getByRole('navigation', { name: 'Lessons' })
    await expect(within(pager).getByRole('link', { name: /Next lesson/ })).toHaveAttribute(
      'href',
      '#learning/safety/electricity',
    )
  },
}

/** A lesson already done: "Lesson completed" instead of the button. */
export const LessonDone: Story = {
  name: 'Lesson done',
  args: {
    currentKey: 'cranes',
    previous: { title: 'Ladders and mobile platforms', href: '#learning/safety/ladders' },
    next: { title: 'Manual handling of loads', href: '#learning/safety/handling' },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Lesson completed')).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Mark as done' })).toBeNull()
  },
}

/** Saving "Mark as done": the button waits. */
export const MarkingDone: Story = {
  name: 'Marking as done',
  args: { markingDone: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Mark as done' })).toBeDisabled()
  },
}

/** Marking the lesson done: the outline, the progress and the lesson follow. */
function MarkDoneDemo(props: CoursePageProps) {
  const [done, setDone] = useState(7)
  return (
    <CoursePage
      {...props}
      layout="desktop"
      modules={safetyCourse(done)}
      onMarkDone={() => {
        setDone(8)
      }}
    >
      <HandlingLesson />
    </CoursePage>
  )
}

export const MarkDoneInteraction: Story = {
  name: 'Mark as done, interaction',
  tags: ['interaction'],
  render: (args) => (
    <ExampleProvider>
      <MarkDoneDemo {...args} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Mark as done' }))
    await expect(canvas.getByText('8 of 12 lessons')).toBeVisible()
    await expect(canvas.getByText('Lesson completed')).toBeVisible()
  },
}

/** The final test: the general Questionnaire as the lesson's content. */
export const Quiz: Story = {
  name: 'Quiz',
  render: () => (
    <ExampleProvider>
      <CoursePage {...FINAL} layout="desktop">
        <p className={cn('m-0', TEXT_DIRECTION)}>
          Ten questions on the whole course. You need 8 correct answers to pass; you may take the
          test again.
        </p>
        <div className="max-w-160 rounded-lg border border-solid border-default bg-surface-raised p-6">
          <Questionnaire
            label="Final test"
            questions={SAFETY_QUIZ}
            defaultAnswers={{ height: { value: '2' } }}
            defaultStep={{ kind: 'question', id: 'scaffolding' }}
            submitLabel="Submit answers"
            submitIcon={ClipboardCheck}
            onSubmit={noop}
          />
        </div>
      </CoursePage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('11 of 12 lessons')).toBeVisible()
    await expect(
      canvas.getByRole('group', {
        name: 'Who checks the scaffolding before work starts each day?',
      }),
    ).toBeVisible()
  },
}

/** The test not passed: the result, the answers, Retake. */
export const QuizFailed: Story = {
  name: 'Quiz result, not passed',
  render: () => (
    <ExampleProvider>
      <CoursePage {...FINAL} layout="desktop">
        <QuizResult
          title="Final test"
          headingLevel={3}
          correct={6}
          total={10}
          passed={false}
          requirement="You need 8 correct answers to pass."
          actions={<Button family="neutral" icon={RotateCcw} label="Take the test again" />}
          review={[
            {
              key: 'height',
              question: 'From what height must a worker be protected against falling?',
              answer: 'From 5 m',
              correct: false,
              correctAnswer: 'From 2 m',
            },
            {
              key: 'scaffolding',
              question: 'Who checks the scaffolding before work starts each day?',
              answer: 'A competent person named by the site manager',
              correct: true,
            },
          ]}
        />
      </CoursePage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('6 of 10 correct')).toBeVisible()
    await expect(canvas.getByText('Not passed')).toBeVisible()
    await expect(canvas.getByText('Correct answer: From 2 m')).toBeVisible()
  },
}

/** Completed: the test passed, the certificate offered with its preview. */
export const Completed: Story = {
  name: 'Completed with certificate',
  render: () => (
    <ExampleProvider>
      <CoursePage {...COMPLETED} layout="desktop">
        <QuizResult correct={9} total={10} passed requirement="You needed 8 correct answers." />
      </CoursePage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('12 of 12 lessons')).toBeVisible()
    const completion = canvas.getByRole('region', { name: 'Course completed' })
    await expect(
      within(completion).getByRole('button', { name: 'Download certificate' }),
    ).toBeEnabled()
    await expect(
      within(completion).getByRole('figure', { name: 'Certificate preview' }),
    ).toHaveTextContent('Nikola Marković')
    await expect(canvas.getByText('9 of 10 correct')).toBeVisible()
  },
}

/** The certificate is being prepared: the button waits. */
export const Downloading: Story = {
  name: 'Completed, certificate downloading',
  render: () => (
    <ExampleProvider>
      <CoursePage
        {...COMPLETED}
        completion={{ title: 'Training completed', onDownload: noop, downloading: true }}
        layout="desktop"
      >
        <QuizResult correct={9} total={10} passed />
      </CoursePage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const completion = within(canvasElement).getByRole('region', { name: 'Training completed' })
    await expect(
      within(completion).getByRole('button', { name: 'Download certificate' }),
    ).toBeDisabled()
  },
}

/** Loading: skeletons in the outline and the lesson. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="course-page"]')).toHaveAttribute(
      'aria-busy',
      'true',
    )
  },
}

/** A course without lessons. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <CoursePage
        title={COURSE.title}
        subtitle={COURSE.subtitle ?? ''}
        modules={[]}
        layout="desktop"
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No lessons yet')).toBeVisible()
    await expect(
      within(canvasElement).queryByRole('navigation', { name: 'Course outline' }),
    ).toBeNull()
  },
}

/** Long titles: they wrap in the outline and the pager. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Bezbednost i zdravlje na radu na gradilištima visokogradnje i niskogradnje',
    subtitle:
      'Occupational safety and health on building and civil-engineering sites · required for every Kvadrat Gradnja site worker before the first shift',
    previous: {
      title: 'Cranes, slings, hand signals and the radio communication with the crane operator',
      href: '#learning/safety/cranes',
    },
  },
}

/** On a phone: the lesson first, the outline in a drawer. */
export const Phone: Story = {
  render: (args) => <PhonePage {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Course outline' })).toBeVisible()
    await expect(canvas.queryByRole('navigation', { name: 'Course outline' })).toBeNull()
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="course-page"]')
    if (page !== null) await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** On a phone with the outline open: the locked test and its reason. */
export const PhoneOutline: Story = {
  name: 'Phone, outline open',
  args: { defaultOutlineOpen: true },
  render: (args) => <PhonePage {...args} />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Course outline' })
    await settle()
    await expect(within(dialog).getByRole('link', { current: 'page' })).toHaveTextContent(
      'Manual handling of loads',
    )
    await expect(within(dialog).getByText(/Locked: finish every lesson first/)).toBeVisible()
  },
}

/** Opening the outline on a phone and following a lesson closes it. */
export const PhoneOutlineInteraction: Story = {
  name: 'Phone, outline, interaction',
  tags: ['interaction'],
  render: (args) => <PhonePage {...args} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Course outline' }))
    const dialog = await within(document.body).findByRole('dialog', { name: 'Course outline' })
    await settle()
    await userEvent.click(
      within(dialog).getByRole('link', { name: /Ladders and mobile platforms/ }),
    )
    // Following a lesson closes the drawer (after its closing animation).
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
  },
}

/** Arabic. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <CoursePage
        layout="desktop"
        title="السلامة والصحة المهنية"
        subtitle="إلزامية لعمال الموقع"
        modules={[
          {
            key: 'm1',
            title: 'أساسيات السلامة',
            lessons: [
              {
                key: 'a',
                title: 'الحقوق والواجبات',
                href: '#a',
                state: 'done',
                detail: 'قراءة · ٨ دقائق',
              },
              { key: 'b', title: 'معدات الحماية', href: '#b', state: 'todo' },
              {
                key: 'c',
                title: 'الاختبار النهائي',
                href: '#c',
                state: 'locked',
                lockedReason: 'أكمل الدروس أولًا',
              },
            ],
          },
        ]}
        currentKey="b"
        previous={{ title: 'الحقوق والواجبات', href: '#a' }}
        onMarkDone={noop}
      >
        <p className={cn('m-0', TEXT_DIRECTION)}>ارتدِ الخوذة وحذاء السلامة دائمًا في الموقع.</p>
      </CoursePage>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <CoursePage
        layout="desktop"
        title="労働安全衛生"
        subtitle="現場作業員の必修講座"
        modules={[
          {
            key: 'm1',
            title: '安全の基本',
            lessons: [
              { key: 'a', title: '権利と義務', href: '#a', state: 'done', detail: '読み物 · 8分' },
              { key: 'b', title: '保護具', href: '#b', state: 'todo' },
              {
                key: 'c',
                title: '最終テスト',
                href: '#c',
                state: 'locked',
                lockedReason: '先にすべての課を修了してください',
              },
            ],
          },
        ]}
        currentKey="b"
        next={{ title: '最終テスト', href: '#c' }}
        onMarkDone={noop}
      >
        <p className={cn('m-0', TEXT_DIRECTION)}>
          現場では常にヘルメットと安全靴を着用してください。
        </p>
      </CoursePage>
    </StoryProvider>
  ),
}
