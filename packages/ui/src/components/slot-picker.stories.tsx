import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarArrowUp } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { slotKey } from './schedule-logic'
import { CLINIC_RESOURCES, FREE_SLOTS, ScheduleFrame } from './schedule-story-data'
import { SlotPicker, type SlotPickerProps } from './slot-picker'
import { PhoneFrame } from './story-frames'

const DOCTORS = CLINIC_RESOURCES.slice(0, 2)

/** The application around the picker: it keeps the chosen slot and says which. */
function Picker(props: Partial<SlotPickerProps>) {
  const [value, setValue] = useState<string | null>(props.defaultValue ?? null)
  const [said, setSaid] = useState('')
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <SlotPicker
        label="Appointment"
        description="Health centre Liman, Bulevar cara Lazara 75, Novi Sad"
        slots={FREE_SLOTS}
        {...props}
        value={value}
        onChange={(slot) => {
          setValue(slotKey(slot))
          setSaid(
            `Chosen: ${slot.start}${slot.resourceId === undefined ? '' : ` with ${slot.resourceId}`}`,
          )
        }}
      />
      <output className="text-sm text-secondary">{said}</output>
    </div>
  )
}

const meta = {
  title: 'Components/Scheduling/SlotPicker',
  component: SlotPicker,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing one free slot to book — an appointment, a consultation, a ' +
          'room — from the slots the application offers, grouped by day (today marked) and, ' +
          'with `resources`, by doctor or room within a day. One slot is chosen, with radio ' +
          'semantics: Tab enters the group, the arrows move between the slots (from the leading ' +
          'edge), Space chooses. Each slot shows its start; its name says the time, the day and ' +
          'the resource.\n\n' +
          '**States:** loading (skeleton chips), nothing free (an empty state with an optional ' +
          'action such as "Show next week"), error, read-only, disabled with its reason — the ' +
          'Field around it.\n\n' +
          '**When:** a person books a time that someone else has made available.\n\n' +
          '**When not:** planning shared people or rooms (ResourceSchedule); seeing one’s events ' +
          '(CalendarView); any time of day without offered slots (DateField with a time field).',
      },
    },
  },
  args: { label: 'Appointment', slots: FREE_SLOTS },
  render: () => (
    <ScheduleFrame>
      <Picker />
    </ScheduleFrame>
  ),
  play: settle,
} satisfies Meta<typeof SlotPicker>

export default meta

type Story = StoryObj<typeof meta>

/** Three days of free slots; nothing chosen yet. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radiogroup', { name: 'Appointment' })).toBeVisible()
    await expect(
      canvas.getByRole('radio', {
        name: /^10:30\sAM – 11:00\sAM, Wednesday, October 14, 2026$/,
      }),
    ).not.toBeChecked()
    await expect(canvas.getAllByRole('radio')).toHaveLength(12)
  },
}

/** Grouped by doctor within each day, one slot chosen. */
export const ByResource: Story = {
  name: 'By resource, chosen',
  render: () => (
    <ScheduleFrame>
      <Picker resources={DOCTORS} defaultValue="jovanovic@2026-10-15T08:30" />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('radio', {
        name: /^08:30\sAM – 09:00\sAM, Thursday, October 15, 2026, Dr Milica Jovanović$/,
      }),
    ).toBeChecked()
  },
}

/** The keyboard: the arrows move between slots across days; Space chooses. */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getAllByRole('radio')[0] ?? canvasElement)
    await expect(canvas.getByText('Chosen: 2026-10-14T10:30 with jovanovic')).toBeVisible()
    // The arrows move the focus (and, held, choose as they go); Space chooses the focused slot.
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(async () => {
      await expect(canvas.getAllByRole('radio')[1]).toHaveFocus()
    })
    await userEvent.keyboard(' ')
    await expect(canvas.getByText('Chosen: 2026-10-14T11:00 with jovanovic')).toBeVisible()
    await expect(canvas.getAllByRole('radio')[1]).toBeChecked()
  },
}

/** Loading: skeleton chips. */
export const Loading: Story = {
  render: () => (
    <ScheduleFrame>
      <Picker loading />
    </ScheduleFrame>
  ),
}

/** Nothing free: the empty state with the application's next step. */
export const Empty: Story = {
  render: () => (
    <ScheduleFrame>
      <Picker
        slots={[]}
        emptyAction={{ label: 'Show next week', icon: CalendarArrowUp, onClick: () => undefined }}
      />
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('No free slots')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show next week' })).toBeVisible()
  },
}

/** An error under the slots, a required mark; read-only; disabled with its reason. */
export const States: Story = {
  render: () => (
    <ScheduleFrame>
      <div className="flex flex-col gap-8">
        <Picker required error="Choose a time for the appointment." />
        <Picker readOnly defaultValue="jovanovic@2026-10-14T11:00" label="Appointment (booked)" />
        <Picker
          disabled
          disabledReason="The referral has expired: ask your doctor for a new one."
        />
      </div>
    </ScheduleFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('radiogroup', { name: /^Appointment/ })[0]).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(
      canvas.getByText('The referral has expired: ask your doctor for a new one.'),
    ).toBeVisible()
  },
}

/** Long labels and resource names wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ScheduleFrame>
      <Picker
        label="Ultrasound examination of the abdomen and the pelvis with a Doppler of the blood vessels"
        description="Bring the referral from your chosen doctor and the previous findings; come 15 minutes early and do not eat for six hours before the examination."
        resources={[
          {
            id: 'jovanovic',
            name: 'Prof. dr Aleksandra Radivojević-Stanković, Diagnostic room for ultrasound and Doppler examinations',
          },
          { id: 'kovacevic', name: 'Dr Nenad Kovačević' },
        ]}
        slots={FREE_SLOTS.slice(0, 4)}
      />
    </ScheduleFrame>
  ),
}

/** On a phone: the chips wrap within the width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ScheduleFrame>
        <div className="p-4">
          <Picker resources={DOCTORS} defaultValue="kovacevic@2026-10-14T14:30" />
        </div>
      </ScheduleFrame>
    </PhoneFrame>
  ),
}

/** Arabic labels in a right-to-left picker. */
export const Arabic: Story = {
  render: () => (
    <ScheduleFrame locale="ar">
      <SlotPicker
        label="موعد"
        description="اختر وقتًا مناسبًا"
        resources={[{ id: 'a', name: 'د. أحمد علي' }]}
        slots={[
          { start: '2026-10-14T09:00', end: '2026-10-14T09:30', resourceId: 'a' },
          { start: '2026-10-14T09:30', end: '2026-10-14T10:00', resourceId: 'a' },
          { start: '2026-10-15T11:00', end: '2026-10-15T11:30', resourceId: 'a' },
        ]}
        defaultValue="a@2026-10-14T09:30"
      />
    </ScheduleFrame>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: () => (
    <ScheduleFrame locale="ja">
      <SlotPicker
        label="予約時間"
        description="ご都合のよい時間を選んでください"
        resources={[{ id: 'a', name: '佐藤 医師' }]}
        slots={[
          { start: '2026-10-14T09:00', end: '2026-10-14T09:30', resourceId: 'a' },
          { start: '2026-10-14T09:30', end: '2026-10-14T10:00', resourceId: 'a' },
          { start: '2026-10-15T11:00', end: '2026-10-15T11:30', resourceId: 'a' },
        ]}
      />
    </ScheduleFrame>
  ),
}
