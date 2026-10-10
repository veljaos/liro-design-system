import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { KeyValueList, SectionCard } from './cards'
import { MoneyText } from './display-text'
import { MaskedValue, type MaskedValueProps, type RevealRequest } from './masked-value'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The reasons a payroll application offers for seeing a salary. */
const SALARY_REASONS = [
  { value: 'payroll', label: 'Preparing this month’s payroll' },
  { value: 'correction', label: 'Correcting a payroll entry' },
  { value: 'audit', label: 'Audit requested by the director' },
]

/** The reasons a health record offers for seeing a diagnosis. */
const DIAGNOSIS_REASONS = [
  { value: 'treatment', label: 'Treating the patient now' },
  { value: 'referral', label: 'Writing a referral' },
  { value: 'emergency', label: 'Emergency care' },
]

const SALARY = <MoneyText value="184250.00" currency="RSD" />

/**
 * The application around the value: it records the reason, then passes the value (after a short
 * wait) — or refuses with `refuse`.
 */
function Salary(
  props: Partial<MaskedValueProps> & {
    refuse?: boolean
    onAsked?: (request: RevealRequest) => void
  },
) {
  const { refuse, onAsked, ...rest } = props
  const [value, setValue] = useState<ReactNode>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  return (
    <MaskedValue
      label="Gross salary"
      reasons={SALARY_REASONS}
      allowOther
      {...(value === undefined ? {} : { value })}
      {...(error === undefined ? {} : { error })}
      onReveal={(request) => {
        onAsked?.(request)
        return new Promise<void>((resolve, reject) => {
          window.setTimeout(() => {
            if (refuse === true) {
              setError('Your role may see salaries only during the payroll period.')
              reject(new Error('refused'))
            } else {
              setValue(SALARY)
              resolve()
            }
          }, 300)
        })
      }}
      onHide={() => {
        setValue(undefined)
      }}
      {...rest}
    />
  )
}

/** A record's values, one of them sensitive. */
function Record({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <SectionCard title="Employment">
        <KeyValueList
          items={[
            { label: 'Employee', value: 'Milica Petrović' },
            { label: 'Position', value: 'Site engineer' },
            { label: 'Start date', value: '01.03.2021.', numeric: true },
            { label: 'Gross salary', value: children },
          ]}
        />
      </SectionCard>
    </div>
  )
}

const meta = {
  title: 'Components/Display/MaskedValue',
  component: MaskedValue,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a sensitive value — a salary, a diagnosis, a personal number — that is ' +
          'shown only after the user says why. "Show" asks for a reason (the application’s list, ' +
          'optionally "Other" with words) with the note that the access is logged; ' +
          '`onReveal({ reason, text })` reports it, the application records it and passes ' +
          '`value`. A returned promise keeps the dialog working; a refusal (`error`) is shown in ' +
          'it. "Hide" (or `hideAfter`) masks the value again and calls `onHide`.\n\n' +
          '**The value is never in the page while masked:** the application passes it only after ' +
          'the reveal.\n\n' +
          '**States:** masked, asking, loading, shown, refused, not allowed (the reason in words ' +
          'beside an unavailable "Show"), read-only (the mask alone).\n\n' +
          '**When:** values whose every viewing must be justified and audited.\n\n' +
          '**When not:** a value the user may not see at all (leave it out); a password field ' +
          '(PasswordField); values that are merely long (KeyValueList).',
      },
    },
  },
  args: { label: 'Gross salary' },
  render: () => (
    <ExampleProvider>
      <Record>
        <Salary />
      </Record>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof MaskedValue>

export default meta

type Story = StoryObj<typeof meta>

/** A salary in an employee's record, masked. */
export const Default: Story = {
  name: 'Salary',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Gross salary: hidden')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Show Gross salary' })).toBeVisible()
    // The real value is not in the page.
    await expect(canvasElement.textContent).not.toContain('184.250')
  },
}

/** The salary shown after the reason, with "Hide". */
export const Shown: Story = {
  render: () => (
    <ExampleProvider>
      <Record>
        <MaskedValue label="Gross salary" value={SALARY} onHide={() => undefined} />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('184.250,00 RSD')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Hide Gross salary' })).toBeVisible()
  },
}

/** The whole way: Show, a reason, the value, Hide. */
export const RevealInteraction: Story = {
  name: 'Salary, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [asked, setAsked] = useState<RevealRequest | null>(null)
    return (
      <ExampleProvider>
        <Record>
          <Salary onAsked={setAsked} />
        </Record>
        <p className="text-xs text-secondary">
          Reported: {asked === null ? '—' : `${asked.reason ?? 'other'} ${asked.text}`}
        </p>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Show Gross salary' }))
    const dialog = await body.findByRole('dialog', { name: 'Show Gross salary' })
    const show = within(dialog).getByRole('button', { name: 'Show' })
    await expect(show).toBeDisabled()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Other' }))
    await userEvent.type(within(dialog).getByRole('textbox'), 'Bank loan certificate')
    await userEvent.click(show)
    await expect(await canvas.findByText('184.250,00 RSD')).toBeVisible()
    await expect(canvas.getByText('Reported: other Bank loan certificate')).toBeVisible()
    const hide = await canvas.findByRole('button', { name: 'Hide Gross salary' })
    await userEvent.click(hide)
    await expect(canvas.queryByText('184.250,00 RSD')).toBeNull()
    await waitFor(async () => {
      await expect(canvas.getByRole('button', { name: 'Show Gross salary' })).toHaveFocus()
    })
  },
}

/** A diagnosis in a health record: the reason dialog open, with "Other" chosen and its words. */
export const Diagnosis: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-2xl">
        <SectionCard title="Visit 06.10.2026., Dom zdravlja Novi Sad">
          <KeyValueList
            items={[
              { label: 'Patient', value: 'Jovana Nikolić' },
              { label: 'Doctor', value: 'dr Marko Stanković' },
              {
                label: 'Diagnosis',
                value: (
                  <MaskedValue
                    label="Diagnosis"
                    reasons={DIAGNOSIS_REASONS}
                    allowOther
                    onReveal={() => undefined}
                    defaultAsking
                    logNote="Access is logged in the patient’s record: your name, the time and the reason. The patient can see it."
                  />
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', { name: 'Show Diagnosis' })
    await settle()
    await expect(within(dialog).getAllByRole('radio')).toHaveLength(4)
    await expect(within(dialog).getByText(/The patient can see it/)).toBeVisible()
  },
}

/** Without a list the reason is written. */
export const WrittenReason: Story = {
  name: 'Written reason',
  render: () => (
    <ExampleProvider>
      <MaskedValue label="Personal number" onReveal={() => undefined} defaultAsking />
    </ExampleProvider>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Show Personal number',
    })
    await settle()
    await expect(within(dialog).getByRole('textbox', { name: /Why do you need/ })).toBeVisible()
    await expect(within(dialog).getByText(/Access is logged/)).toBeVisible()
  },
}

/** The value on its way after the reason was given. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Record>
        <MaskedValue label="Gross salary" loading />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('status', { name: 'Showing Gross salary…' }),
    ).toBeInTheDocument()
  },
}

/** The application refused: the reason beside the mask. */
export const Refused: Story = {
  name: 'Refused',
  render: () => (
    <ExampleProvider>
      <Record>
        <MaskedValue
          label="Gross salary"
          reasons={SALARY_REASONS}
          onReveal={() => undefined}
          error="Your role may see salaries only during the payroll period."
        />
      </Record>
    </ExampleProvider>
  ),
}

/** The refusal inside the dialog, which stays open. */
export const RefusedInDialog: Story = {
  name: 'Refused, in the dialog',
  render: () => (
    <ExampleProvider>
      <MaskedValue
        label="Gross salary"
        reasons={SALARY_REASONS}
        onReveal={() => undefined}
        error="Your role may see salaries only during the payroll period."
        defaultAsking
      />
    </ExampleProvider>
  ),
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog')
    await expect(within(dialog).getByRole('alert')).toHaveTextContent(/payroll period/)
    await settle()
  },
}

/** A refusal reached by asking: the dialog stays open with the application's words. */
export const RefusedInteraction: Story = {
  name: 'Refused, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Record>
        <Salary refuse />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Show Gross salary' }))
    const dialog = await within(document.body).findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'Preparing this month’s payroll' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await expect(await within(dialog).findByRole('alert')).toHaveTextContent(/payroll period/)
    await expect(dialog).toBeVisible()
  },
}

/** The user may not see it: "Show" is unavailable and the reason is in words. */
export const NotAllowed: Story = {
  name: 'Not allowed',
  render: () => (
    <ExampleProvider>
      <Record>
        <MaskedValue label="Gross salary" notAllowedReason="only payroll staff can see salaries." />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const show = canvas.getByRole('button', { name: 'Show Gross salary' })
    await expect(show).toHaveAttribute('aria-disabled', 'true')
    await expect(show).toHaveAccessibleDescription(
      'Not allowed: only payroll staff can see salaries.',
    )
  },
}

/** Read-only: only the mask (a printout, a summary). */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <Record>
        <MaskedValue label="Gross salary" readOnly />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryByRole('button')).toBeNull()
  },
}

/** `hideAfter`: the value masks itself again (here after 1 second). */
export const HideAfter: Story = {
  name: 'Hides by itself, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Record>
        <Salary hideAfter={1000} />
      </Record>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show Gross salary' }))
    const dialog = await within(document.body).findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('radio', { name: 'Preparing this month’s payroll' }),
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show' }))
    await expect(await canvas.findByText('184.250,00 RSD')).toBeVisible()
    await waitFor(
      async () => {
        await expect(canvas.queryByText('184.250,00 RSD')).toBeNull()
      },
      { timeout: 3000 },
    )
  },
}

/** Long reasons and a long refusal wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <div className="max-w-sm">
        <MaskedValue
          label="Diagnosis and the therapy prescribed at the last specialist examination"
          reasons={[
            {
              value: 'a',
              label:
                'I am the patient’s chosen doctor and I am preparing the referral to the specialist examination at the Clinical Centre of Vojvodina',
            },
            { value: 'b', label: 'Emergency care' },
          ]}
          onReveal={() => undefined}
          error="The record is locked while the patient’s request for the restriction of processing is being reviewed by the data protection officer."
        />
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the record and the dialog on a phone. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Record>
            <MaskedValue
              label="Gross salary"
              reasons={SALARY_REASONS}
              allowOther
              onReveal={() => undefined}
              defaultAsking
            />
          </Record>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await within(document.body).findByRole('dialog')
    await settle()
  },
}

/** Arabic. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex flex-col gap-4">
        <MaskedValue label="الراتب الإجمالي" onReveal={() => undefined} />
        <MaskedValue label="التشخيص" value="التهاب الشعب الهوائية الحاد" onHide={() => undefined} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="flex flex-col gap-4">
        <MaskedValue label="総支給額" onReveal={() => undefined} />
        <MaskedValue label="診断" value="急性気管支炎" onHide={() => undefined} />
      </div>
    </StoryProvider>
  ),
}
