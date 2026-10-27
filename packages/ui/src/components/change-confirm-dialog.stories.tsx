import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { CandidateList } from './candidate-list'
import {
  ChangeConfirmDialog,
  type ChangeConfirmAnswer,
  type ChangeLine,
  type NotifyOption,
} from './change-confirm-dialog'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const MOVE: ChangeLine[] = [
  { label: 'Doctor', from: 'dr Marko Stanković', to: 'dr Nada Grujić' },
  { label: 'Time', from: '14.10.2026. 11:30', to: '14.10.2026. 12:00' },
]

const NOTIFY: NotifyOption[] = [
  {
    id: 'patient',
    label: 'Notify Jovana Nikolić by SMS',
    description: 'To 064 123 4567: the new doctor and time.',
    defaultChecked: true,
  },
  { id: 'doctor', label: 'Notify dr Nada Grujić in Liro' },
]

const meta = {
  title: 'Components/Overlays/ChangeConfirmDialog',
  component: ChangeConfirmDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** moving something other people rely on — an appointment, a shift, a ' +
          'reservation, a seat, a room or a bed — is never final, and never messages anyone, ' +
          'until the user confirms it (P5.28, the owner’s review). A drag, a “Move to…” or a ' +
          '“Transfer…” only proposes the change; the application opens this dialog with it and ' +
          'applies it on Save. The title is the action, the record bold under it; the change ' +
          'old → new, one line per field; who it concerns; the application’s own check as a ' +
          'warning; then one checkbox per message the application can send (“Notify …”), set ' +
          'as the application decides — with any checked the button says “Save and notify”. ' +
          'Cancel changes nothing.\n\n' +
          '**When:** a move or a change of a booking, a shift, a seating plan or a stay; the ' +
          'Save of pending changes (every change a line, the record in its label).\n\n' +
          '**When not:** a change only the user relies on (their own draft); a delete or ' +
          'anything that cannot be undone (ConfirmDialog); a decision with a reason ' +
          '(ReasonConfirmDialog).',
      },
    },
  },
  args: {
    title: 'Move appointment',
    subject: 'Jovana Nikolić, check-up',
    changes: MOVE,
    affected: ['Jovana Nikolić (patient)', 'dr Marko Stanković', 'dr Nada Grujić'],
    notify: NOTIFY,
    onConfirm: () => undefined,
  },
  render: (args) => (
    <ExampleProvider>
      <ChangeConfirmDialog
        {...args}
        defaultOpen
        trigger={<Button family="neutral" icon={CalendarClock} label="Move appointment" />}
      />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ChangeConfirmDialog>

export default meta

type Story = StoryObj<typeof meta>

/** A dragged appointment: the change, who it concerns, the patient's SMS checked. */
export const Default: Story = {
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move appointment Jovana Nikolić, check-up',
    })
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'dr Marko StankovićAfter:dr Nada Grujić',
    )
    await expect(
      within(dialog).getByRole('checkbox', { name: /Notify Jovana Nikolić by SMS/ }),
    ).toBeChecked()
    await expect(
      within(dialog).getByRole('checkbox', { name: 'Notify dr Nada Grujić in Liro' }),
    ).not.toBeChecked()
    await expect(within(dialog).getByRole('button', { name: 'Save and notify' })).toBeVisible()
  },
}

/** Nothing to send, or nothing checked: the button is plain Save. */
export const WithoutMessages: Story = {
  name: 'Without messages',
  args: {
    title: 'Move shift',
    subject: 'Stefan Lukić, Thursday 15 October 2026',
    changes: [{ label: 'Shift', from: 'Early, 07:00–15:00', to: 'Late, 15:00–23:00' }],
    notify: [],
    description: 'The schedule is not published yet: nobody sees this change before Publish.',
  },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).queryByRole('checkbox')).toBeNull()
    await expect(within(dialog).getByRole('button', { name: 'Save' })).toBeVisible()
  },
}

/** The application's check of the change: a warning; the user still decides. */
export const WithWarning: Story = {
  name: 'With a warning',
  args: {
    warning: 'dr Nada Grujić has another patient booked until 12:00; this one would wait.',
  },
  play: async () => {
    await settle()
    await expect(within(document.body).getByRole('alert')).toHaveTextContent(
      'another patient booked',
    )
  },
}

/** The application is saving: Save busy, Cancel disabled, the dialog stays. */
export const Saving: Story = {
  args: { loading: true },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
  },
}

/** Pending changes saved together: every change a line, the record in its label. */
export const PendingChanges: Story = {
  name: 'Pending changes',
  args: {
    title: 'Save the seating plan',
    subject: 'Gala dinner, 24.10.2026.',
    changes: [
      { key: 'ana', label: 'Ana Petrović', from: 'Table 3, seat 2', to: 'Table 1, seat 5' },
      { key: 'ivan', label: 'Ivan Kostić', from: null, to: 'Table 4, seat 9' },
      { key: 'mila', label: 'Mila Jović', from: 'Table 6, seat 1', to: '' },
    ],
    affected: '3 guests',
    notify: [{ id: 'guests', label: 'Notify the 3 guests by e-mail' }],
    confirmLabel: 'Save plan',
  },
  play: async () => {
    await settle()
    const list = within(document.body).getByRole('list', { name: 'Changes' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3)
    await expect(list).toHaveTextContent('—')
    await expect(within(document.body).getByRole('button', { name: 'Save plan' })).toBeVisible()
  },
}

/** Long names and values wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Move appointment to another doctor of the clinic on the same day',
    subject:
      'Aleksandra Milovanović-Stanojević, control of blood pressure with the readings from home',
    changes: [
      {
        label: 'Doctor',
        from: 'dr Marko Stanković, general practice, Ambulanta Liman',
        to: 'dr Nada Grujić, general practice, Ambulanta Detelinara',
      },
      { label: 'Time', from: '14.10.2026. 11:30', to: '14.10.2026. 12:00' },
    ],
    notify: [
      {
        id: 'patient',
        label: 'Notify Aleksandra Milovanović-Stanojević by SMS and by e-mail',
        description:
          'The message names the new doctor, the new place and the time, and asks her to come 10 minutes early.',
        defaultChecked: true,
      },
    ],
  },
}

/** On a phone, as the clinic's schedule opens it after a drag. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <ChangeConfirmDialog {...args} defaultOpen />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the arrow points from the old value to the new one. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <ChangeConfirmDialog
        {...args}
        title="نقل الموعد"
        subject="سارة أحمد، فحص"
        changes={[
          { label: 'الطبيب', from: 'د. علي حسن', to: 'د. منى خالد' },
          { label: 'الوقت', from: '11:30', to: '12:00' },
        ]}
        affected="سارة أحمد"
        notify={[{ id: 'p', label: 'إبلاغ سارة أحمد برسالة نصية', defaultChecked: true }]}
        defaultOpen
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <ChangeConfirmDialog
        {...args}
        title="予約の移動"
        subject="佐藤 花子、健康診断"
        changes={[
          { label: '医師', from: '田中 一郎', to: '鈴木 次郎' },
          { label: '時間', from: '11:30', to: '12:00' },
        ]}
        affected="佐藤 花子"
        notify={[{ id: 'p', label: '佐藤 花子にSMSで知らせる', defaultChecked: true }]}
        defaultOpen
      />
    </StoryProvider>
  ),
}

/** The application around the dialog: it shows what it was asked to save and send. */
function MoveAndReport() {
  const [saved, setSaved] = useState<ChangeConfirmAnswer | null>(null)
  return (
    <ExampleProvider>
      <ChangeConfirmDialog
        title="Move appointment"
        subject="Jovana Nikolić, check-up"
        changes={MOVE}
        notify={NOTIFY}
        onConfirm={async (answer) => {
          await new Promise((resolve) => setTimeout(resolve, 300))
          setSaved(answer)
        }}
        trigger={<Button family="neutral" icon={CalendarClock} label="Move appointment" />}
      />
      <output className={cn('mt-4 block text-sm', TEXT_DIRECTION)}>
        {saved === null ? '' : JSON.stringify(saved)}
      </output>
    </ExampleProvider>
  )
}

/**
 * Cancel changes nothing; unchecking the SMS makes the button plain Save, and Save reports the
 * messages chosen.
 */
export const Confirm: Story = {
  name: 'Confirm, interaction',
  tags: ['interaction'],
  render: () => <MoveAndReport />,
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    const open = within(canvasElement).getByRole('button', { name: 'Move appointment' })
    await userEvent.click(open)
    let dialog = await body.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(/^$/)
    await userEvent.click(open)
    dialog = await body.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Notify Jovana Nikolić/ }))
    await userEvent.click(within(dialog).getByRole('checkbox', { name: /Notify dr Nada Grujić/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save and notify' }))
    await waitFor(async () => {
      await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
        '{"notify":["doctor"]}',
      )
    })
  },
}

// P5.28 floor: the choice that makes the change, in the same dialog.
const FREE_TABLES = [
  { id: 't10', title: 'Table 10', label: 'Table 10, Hall, 6 seats', subtitle: 'Hall · 6 seats' },
  {
    id: 't15',
    title: 'Table 15',
    label: 'Table 15, Terrace, 6 seats',
    subtitle: 'Terrace · 6 seats',
  },
]

/** The application around the dialog: the free tables as a choice; the change follows it. */
function MoveGuests() {
  const [to, setTo] = useState('t10')
  const chosen = FREE_TABLES.find((table) => table.id === to)
  return (
    <ExampleProvider>
      <ChangeConfirmDialog
        defaultOpen
        title="Move guests"
        subject="Table 8 · Kovačević, 6 guests"
        changes={[{ label: 'Table', from: 'Table 8 · Hall', to: `${chosen?.title ?? ''} · Hall` }]}
        notify={[{ id: 'guest', label: 'Notify Kovačević by SMS' }]}
        onConfirm={() => undefined}
      >
        <CandidateList
          label="Free tables with enough seats"
          candidates={FREE_TABLES}
          selected={[to]}
          multiple={false}
          onSelectedChange={(ids) => {
            setTo(ids[0] ?? to)
          }}
        />
      </ChangeConfirmDialog>
    </ExampleProvider>
  )
}

/**
 * `children`: the application's own choice above the change (P5.28, the restaurant's free
 * tables), so the move is chosen and confirmed in one dialog.
 */
export const WithChoice: Story = {
  name: 'With a choice',
  render: () => <MoveGuests />,
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Move guests Table 8 · Kovačević, 6 guests',
    })
    await expect(
      within(dialog).getByRole('radiogroup', { name: 'Free tables with enough seats' }),
    ).toBeVisible()
    await expect(within(dialog).getByRole('list', { name: 'Changes' })).toHaveTextContent(
      'Table 10',
    )
  },
}
