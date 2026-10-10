import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { MyShifts, type MyShiftsProps } from './my-shifts'
import { MY_SHIFTS, SWAP_COLLEAGUES } from './shift-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The screen on a phone, as an application shows it (scrolling inside the frame). */
function OnPhone(props: Partial<MyShiftsProps>) {
  return (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border h-full overflow-y-auto p-4">
          <MyShifts
            shifts={MY_SHIFTS}
            colleagues={() => SWAP_COLLEAGUES}
            onSwapSubmit={() => undefined}
            {...props}
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  )
}

const meta = {
  title: 'Components/Working time/MyShifts',
  component: MyShifts,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a person’s own upcoming shifts on a phone — by week (“This week”, “Next ' +
          'week”, then dates), each with the day, the shift’s name and times (“22:00–06:00 ' +
          '(+1)”, read as “… the next day”), the place and team, “Changed” with what changed ' +
          'since publishing, a swap request’s state in the application’s words, and “Request ' +
          'swap”, which opens ShiftSwapDialog.\n\n' +
          '**When:** the employee’s view of a published schedule.\n\n' +
          '**When not:** planning (ShiftPlanner); hours worked (the timesheet).',
      },
    },
  },
  args: { shifts: MY_SHIFTS },
  render: () => <OnPhone />,
  play: settle,
} satisfies Meta<typeof MyShifts>

export default meta

type Story = StoryObj<typeof meta>

/** On a phone (its home): this week, next week and a later week; a changed night shift. */
export const Default: Story = {
  name: 'Phone width',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: /^This week/ })).toBeVisible()
    await expect(canvas.getByText('Was Afternoon, 14:00–22:00')).toBeVisible()
    await expect(canvas.getAllByRole('button', { name: 'Request swap' })).toHaveLength(6)
  },
}

/** Wider, in a page column. */
export const Wide: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-140">
        <MyShifts
          shifts={MY_SHIFTS}
          headingLevel={2}
          title="Shifts of Ana Petrović"
          colleagues={() => SWAP_COLLEAGUES}
          onSwapSubmit={() => undefined}
          swapReasonRequired
        />
      </div>
    </ExampleProvider>
  ),
}

/** The swap dialog open for the changed night shift (a request being written, restored). */
export const SwapOpen: Story = {
  name: 'Request swap open',
  render: () => <OnPhone defaultSwapShift="m3" />,
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('dialog', { name: 'Request a swap' }),
    ).toHaveTextContent('22:00 to 06:00 the next day')
  },
}

/** Without swapping (the application offers none): no buttons. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border h-full overflow-y-auto p-4">
          <MyShifts shifts={MY_SHIFTS} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0)
  },
}

/** Nothing published yet. */
export const Empty: Story = {
  render: () => <OnPhone shifts={[]} />,
}

/** Loading: skeleton cards. */
export const Loading: Story = {
  render: () => <OnPhone loading />,
}

/** Long names, places and changes wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <OnPhone
      shifts={[
        {
          id: 'l1',
          date: '2026-10-08',
          label: 'Night with the ambulance standby for the northern suburbs',
          start: '22:00',
          end: '06:00',
          place: 'Dom zdravlja Novi Sad, main building, emergency department, second floor',
          team: 'Emergency and ambulance, the northern suburbs team',
          changed:
            'Was Afternoon, 14:00–22:00, at Klisa clinic; moved because of the training on Wednesday',
        },
      ]}
    />
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" today="2026-10-06">
      <div className="max-w-100 p-4">
        <MyShifts
          shifts={[
            {
              id: 'a1',
              date: '2026-10-07',
              label: 'صباحي',
              start: '06:00',
              end: '14:00',
              place: 'المبنى الرئيسي',
            },
            {
              id: 'a2',
              date: '2026-10-08',
              label: 'ليلي',
              start: '22:00',
              end: '06:00',
              place: 'المبنى الرئيسي',
              changed: 'كان مسائيًا',
            },
          ]}
          colleagues={() => [{ id: 'x', name: 'سارة أحمد' }]}
          onSwapSubmit={() => undefined}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" today="2026-10-06">
      <div className="max-w-100 p-4">
        <MyShifts
          shifts={[
            {
              id: 'j1',
              date: '2026-10-07',
              label: '早番',
              start: '06:00',
              end: '14:00',
              place: '本館',
            },
            {
              id: 'j2',
              date: '2026-10-08',
              label: '夜勤',
              start: '22:00',
              end: '06:00',
              place: '本館',
              changed: '遅番から変更',
            },
          ]}
          colleagues={() => [{ id: 'x', name: '佐藤 花子' }]}
          onSwapSubmit={() => undefined}
        />
      </div>
    </StoryProvider>
  ),
}

/** "Request swap" opens the dialog for that shift. */
export const RequestSwap: Story = {
  name: 'Request swap, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const first = within(canvasElement).getAllByRole('button', { name: 'Request swap' })[0]
    if (first === undefined) throw new Error('no swap button')
    await userEvent.click(first)
    const dialog = await within(document.body).findByRole('dialog', { name: 'Request a swap' })
    await expect(dialog).toHaveTextContent('06:00 to 14:00')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
    await expect(first).toHaveFocus()
  },
}
