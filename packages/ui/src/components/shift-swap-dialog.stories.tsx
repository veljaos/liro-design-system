import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { MY_SHIFTS, SWAP_COLLEAGUES } from './shift-story-data'
import { ShiftSwapDialog, type ShiftSwapRequest } from './shift-swap-dialog'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const NIGHT = MY_SHIFTS[2] ?? {
  id: 'm3',
  date: '2026-10-08',
  label: 'Night',
  start: '22:00',
  end: '06:00',
}

const meta = {
  title: 'Components/Working time/ShiftSwapDialog',
  component: ShiftSwapDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a person asks to hand one of their shifts over — to anyone qualified, or ' +
          'to a colleague from the application’s list, who may give one of their own shifts ' +
          'back — with a reason. The shift is shown on top (day, name, times: “22:00–06:00 ' +
          '(+1)”, read as “… the next day”, place). It reports the request (`onSubmit`); who ' +
          'qualifies and the approval are the application’s (the approval is a worklist).\n\n' +
          '**When:** from MyShifts’ “Request swap”, or a shift’s menu in the application.\n\n' +
          '**When not:** changing the plan itself (ShiftPlanner); approving a request ' +
          '(WorklistPage).',
      },
    },
  },
  args: { shift: NIGHT, colleagues: SWAP_COLLEAGUES, onSubmit: () => undefined },
  render: (args) => (
    <ExampleProvider>
      <ShiftSwapDialog
        {...args}
        defaultOpen
        trigger={<Button family="neutral" icon={ArrowLeftRight} label="Request swap" />}
      />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ShiftSwapDialog>

export default meta

type Story = StoryObj<typeof meta>

/** Open, to anyone qualified (the default). */
export const Default: Story = {
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Request a swap' })
    await expect(dialog).toHaveTextContent('22:00 to 06:00 the next day')
    await expect(within(dialog).getByRole('radio', { name: 'Anyone qualified' })).toBeChecked()
  },
}

/** To a colleague, taking one of their shifts back, with a reason (a request being written). */
export const WithColleague: Story = {
  name: 'With a colleague',
  render: (args) => (
    <ExampleProvider>
      <ShiftSwapDialog
        {...args}
        defaultOpen
        defaultValue={{
          colleagueId: 'marko',
          takeShiftId: 't2',
          reason: 'A family celebration on Thursday evening.',
        }}
      />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Request a swap' })
    await expect(within(dialog).getByRole('radio', { name: 'A colleague' })).toBeChecked()
    await expect(
      within(dialog).getByRole('combobox', { name: 'Their shift you take instead' }),
    ).toBeVisible()
  },
}

/** Only colleagues (no "Anyone qualified"), and the reason is required. */
export const ColleaguesOnly: Story = {
  name: 'Colleagues only, reason required',
  render: (args) => (
    <ExampleProvider>
      <ShiftSwapDialog {...args} defaultOpen allowAnyone={false} reasonRequired />
    </ExampleProvider>
  ),
}

/** The application is sending it: the dialog stays and shows it is working. */
export const Sending: Story = {
  render: (args) => (
    <ExampleProvider>
      <ShiftSwapDialog {...args} defaultOpen loading />
    </ExampleProvider>
  ),
}

/** Long names, places and reasons wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: (args) => (
    <ExampleProvider>
      <ShiftSwapDialog
        {...args}
        shift={{
          ...NIGHT,
          label: 'Night with the ambulance standby for the northern suburbs',
          place: 'Dom zdravlja Novi Sad, main building, emergency department, second floor',
        }}
        colleagues={[
          {
            id: 'long',
            name: 'Aleksandra Milovanović-Stanojević',
            note: 'Emergency and General practice, qualified for night shifts with the ambulance',
          },
        ]}
        defaultOpen
        defaultValue={{
          colleagueId: 'long',
          reason:
            'My daughter’s school performance is on Thursday evening and I promised to be there; I can take any of Aleksandra’s mornings next week instead.',
        }}
      />
    </ExampleProvider>
  ),
}

/** On a phone, as MyShifts opens it. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <ShiftSwapDialog {...args} defaultOpen />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <ShiftSwapDialog
        {...args}
        shift={{ ...NIGHT, label: 'ليلي', place: 'المركز الصحي، المبنى الرئيسي' }}
        colleagues={[{ id: 'a', name: 'سارة أحمد', note: 'الطوارئ' }]}
        defaultOpen
        defaultValue={{ colleagueId: 'a', reason: 'مناسبة عائلية مساء الخميس.' }}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <ShiftSwapDialog
        {...args}
        shift={{ ...NIGHT, label: '夜勤', place: '中央病院 本館' }}
        colleagues={[{ id: 'a', name: '佐藤 花子', note: '救急' }]}
        defaultOpen
        defaultValue={{ colleagueId: 'a', reason: '木曜日の夜に家族の行事があります。' }}
      />
    </StoryProvider>
  ),
}

/** The application around the dialog: it shows the request it received. */
function SwapAndReport() {
  const [sent, setSent] = useState<ShiftSwapRequest | null>(null)
  return (
    <ExampleProvider>
      <ShiftSwapDialog
        shift={NIGHT}
        colleagues={SWAP_COLLEAGUES}
        reasonRequired
        onSubmit={async (request) => {
          await new Promise((resolve) => setTimeout(resolve, 300))
          setSent(request)
        }}
        trigger={<Button family="neutral" icon={ArrowLeftRight} label="Request swap" />}
      />
      <output className="mt-4 block text-sm">{sent === null ? '' : JSON.stringify(sent)}</output>
    </ExampleProvider>
  )
}

/** Sending a request: a colleague and the reason are required; the request is reported. */
export const Request: Story = {
  name: 'Request, interaction',
  tags: ['interaction'],
  render: () => <SwapAndReport />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Request swap' }))
    const dialog = await body.findByRole('dialog', { name: 'Request a swap' })
    await userEvent.click(within(dialog).getByRole('radio', { name: 'A colleague' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
    await expect(dialog).toHaveTextContent('Choose a colleague.')
    await expect(dialog).toHaveTextContent('Write a reason.')
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Colleague/ }))
    await userEvent.click(await body.findByRole('option', { name: /Marko Jovanović/ }))
    await userEvent.type(await within(dialog).findByRole('textbox', { name: /Reason/ }), 'Exam')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
    await waitFor(async () => {
      await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
        '"colleagueId":"marko"',
      )
    })
  },
}
