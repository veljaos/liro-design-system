import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SETUP_STEPS } from './group-c-story-data'
import { SetupChecklist } from './setup-checklist'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/SetupChecklist',
  component: SetupChecklist,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the first-run steps of a new company — company data, the e-invoicing ' +
          'connection, importing customers, the first invoice — with the progress ("2 of 5 ' +
          'done") and **resume**: the step to do now (the Core’s `current`, else the first step ' +
          'still to do) is highlighted the neutral way and carries the main action; the other ' +
          'open steps have small actions; a blocked step says what it waits for; a done step may ' +
          'offer "Change". Steps, states and actions are the Core’s; actions are links or ' +
          'buttons.\n\n' +
          '**When:** a new company’s home until it is set up; a module’s first use.\n\n' +
          '**When not:** a multi-step form (FormWizard); questions that lead to a document ' +
          '(Questionnaire, P5.1); the stages of one document (LifecycleBar).',
      },
    },
  },
  args: { steps: SETUP_STEPS, title: 'Set up Stanić Elektro STR' },
  render: (args) => (
    <ExampleProvider>
      <SetupChecklist {...args} className="max-w-160" />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SetupChecklist>

export default meta

type Story = StoryObj<typeof meta>

/** Two of five done; "Import customers" is next (the blocked bank step is skipped). */
export const Default: Story = {
  args: { description: 'Five steps before the first invoice goes to SEF.' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('2 of 5 done')
    await expect(canvas.getByRole('progressbar', { name: '2 of 5 done' })).toBeVisible()
    const next = canvasElement.querySelector('[aria-current="step"]')
    await expect(next).toHaveTextContent('Import customers')
    // The resumed step's action is the main one: a link drawn as the primary button.
    await expect(
      within(next as HTMLElement).getByRole('link', { name: 'Import customers' }),
    ).toHaveClass('bg-family-primary-solid')
    await expect(canvasElement).toHaveTextContent(
      'Waiting for Banca Intesa to confirm the agreement.',
    )
  },
}

/** The application marks the first invoice as current: it is highlighted instead. */
export const Current: Story = {
  name: 'Current from the application',
  args: {
    steps: SETUP_STEPS.map((step) =>
      step.id === 'customers'
        ? { ...step, state: 'done', doneNote: 'Imported 214 customers' }
        : step.id === 'invoice'
          ? { ...step, state: 'current' }
          : step,
    ),
  },
}

/** Every step done. */
export const AllDone: Story = {
  name: 'All done',
  args: {
    steps: SETUP_STEPS.map((step) => ({
      ...step,
      state: 'done',
      doneNote: step.doneNote ?? 'Completed by Milica Petrović',
    })),
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('5 of 5 done')
    await expect(canvasElement.querySelector('[aria-current="step"]')).toBeNull()
  },
}

/** Loading: skeleton rows, no progress yet. */
export const Loading: Story = {
  args: { loading: true },
}

/** Buttons instead of links (the application handles the press). */
export const Buttons: Story = {
  args: {
    steps: SETUP_STEPS.map((step) =>
      step.action === undefined
        ? step
        : { ...step, action: { label: step.action.label, onClick: () => undefined } },
    ),
  },
}

/** Long titles, descriptions and reasons wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Set up Stanić Elektro STR, Bulevar oslobođenja 112, Novi Sad, before the first invoice',
    steps: [
      {
        id: 'bank',
        title: 'Connect the bank statements of every account the company has at Banca Intesa',
        description:
          'The bank sends the statements every morning at 06:00; Liro matches the payments with the open invoices and shows what is left to you.',
        state: 'blocked',
        blockedReason:
          'Waiting for Banca Intesa to confirm the agreement signed at the Novi Sad branch; the bank usually answers within three working days.',
      },
      ...SETUP_STEPS.slice(2, 3),
    ],
  },
}

/** At phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <SetupChecklist {...args} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic steps; the highlight bar at the start (the right). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <SetupChecklist
        className="max-w-160"
        title="إعداد الشركة"
        steps={[
          { id: 'a', title: 'بيانات الشركة', state: 'done' },
          {
            id: 'b',
            title: 'استيراد العملاء',
            state: 'todo',
            action: { label: 'استيراد', href: '#a' },
          },
          {
            id: 'c',
            title: 'الفاتورة الأولى',
            state: 'todo',
            action: { label: 'فاتورة جديدة', href: '#c' },
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese steps. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <SetupChecklist
        className="max-w-160"
        title="会社の設定"
        steps={[
          { id: 'a', title: '会社情報', state: 'done' },
          {
            id: 'b',
            title: '顧客のインポート',
            state: 'todo',
            action: { label: 'インポート', href: '#a' },
          },
          { id: 'c', title: '最初の請求書', state: 'blocked', blockedReason: '銀行の確認待ち' },
        ]}
      />
    </StoryProvider>
  ),
}
