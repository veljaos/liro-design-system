import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import {
  FormDateField,
  FormMoneyField,
  FormSelectField,
  FormSwitchField,
  FormTextField,
  useFocusFirstInvalid,
} from '../form'
import { settle } from '../primitives/story-helpers'
import { ActionGroup } from './actions'
import { Button } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import {
  FormActions,
  FormFullWidth,
  FormSection,
  FormTabs,
  FormWizard,
  useUnsavedChangesGuard,
} from './form-layout'
import { focusFirstInvalid } from './form-logic'
import { NumberField } from './number-field'
import { SelectField } from './select-field'
import { expectContentDirection, StoryProvider } from './story-frames'
import { TextAreaField, TextField } from './text-field'

const meta = {
  title: 'Components/Forms/Form layout',
  component: FormSection,
  parameters: {
    docs: {
      description: {
        component:
          '**FormSection** — a titled card of fields in 1–3 columns (one on phones); ' +
          '`FormFullWidth` spans the row; `collapsible` folds rarely used fields away. ' +
          '**FormTabs** — the tabs of a long form, as the first row of the form card (start-' +
          'aligned; its sections are drawn flat inside); a tab with errors shows a warning icon ' +
          'and says so. **FormActions** — the actions at the top and, once they scroll out of ' +
          'view, in a bar at the bottom ("Unsaved changes" when `dirty`): the two sets are never ' +
          'visible together. **useUnsavedChangesGuard** — asks ' +
          'before leaving with unsaved changes. **FormWizard** — a form in checked steps. ' +
          '**focusFirstInvalid(form)** — after a failed save: opens the tab or section with the ' +
          'first error and focuses it. **@veljaos/ui/form** binds the fields to React Hook Form.' +
          '\n\n**When not:** a short edit beside a list (a Drawer); one question (a Dialog).',
      },
    },
  },
  args: { title: '', children: null },
  play: settle,
} satisfies Meta<typeof FormSection>

export default meta

type Story = StoryObj<typeof meta>

const CUSTOMER = (
  <>
    <TextField label="Name" defaultValue="Alfa Trade d.o.o." />
    <TextField label="Tax number" defaultValue="101234567" />
    <TextField label="City" defaultValue="Novi Sad" />
    <SelectField
      label="Payment terms"
      defaultValue="30"
      options={[
        { value: '15', label: '15 days' },
        { value: '30', label: '30 days' },
      ]}
    />
    <FormFullWidth>
      <TextAreaField label="Note" description="Printed on every invoice." />
    </FormFullWidth>
  </>
)

/** Sections: two columns (default), one and three, a full-width field, header actions. */
export const Sections: Story = {
  render: () => (
    <div className="flex max-w-240 flex-col gap-4">
      <FormSection
        title="Customer"
        description="As on the contract."
        actions={<Button intent="edit" label="Edit" />}
      >
        {CUSTOMER}
      </FormSection>
      <FormSection title="Contact" columns={3}>
        <TextField label="Person" />
        <TextField label="Phone" type="tel" />
        <TextField label="E-mail" type="email" />
      </FormSection>
      <FormSection title="Delivery" columns={1} className="max-w-120">
        <TextField label="Street" />
      </FormSection>
    </div>
  ),
}

/** Collapsible: closed by default; a second one opened with `defaultOpen`. Opening shows the fields. */
export const Collapsible: Story = {
  render: () => (
    <div className="flex max-w-240 flex-col gap-4">
      <FormSection title="More details" collapsible>
        <TextField label="Reference" />
        <TextField label="Cost centre" />
      </FormSection>
      <FormSection title="Bank" collapsible defaultOpen>
        <TextField label="Account" />
      </FormSection>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox', { name: 'Reference' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'More details' }))
    await waitFor(() => expect(canvas.getByRole('textbox', { name: 'Reference' })).toBeVisible())
    await settle()
  },
}

/** A record form whose save fails: tabs with errors, and the first error revealed and focused. */
function RecordForm(props: { stickyActions?: 'auto' | 'always' | 'never'; long?: boolean }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [name, setName] = useState('Alfa Trade d.o.o.')
  const [street, setStreet] = useState('')
  const [attempts, setAttempts] = useState(0)
  const submitted = attempts > 0
  const dirty = name !== 'Alfa Trade d.o.o.' || street !== ''
  const streetError = submitted && street === '' ? 'Enter the street.' : undefined
  const save = () => {
    setAttempts((count) => count + 1)
  }
  // After each failed save, once the errors are drawn.
  useEffect(() => {
    if (attempts > 0 && formRef.current !== null) focusFirstInvalid(formRef.current)
  }, [attempts])
  const filler = (count: number) =>
    Array.from({ length: count }, (_, index) => (
      <TextField key={index} label={`Field ${String(index + 1)}`} />
    ))
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      className="max-w-240"
    >
      <FormActions
        dirty={dirty}
        {...(props.stickyActions === undefined ? {} : { stickyActions: props.stickyActions })}
        actions={
          <ActionGroup
            actions={[
              { key: 'cancel', intent: 'cancel', label: 'Cancel' },
              { key: 'save', intent: 'save', label: 'Save', onClick: save },
            ]}
          />
        }
      >
        <FormTabs
          label="Customer"
          items={[
            {
              value: 'general',
              label: 'General',
              content: (
                <FormSection title="Customer">
                  <TextField label="Name" value={name} onChange={setName} />
                  {props.long === true && filler(14)}
                </FormSection>
              ),
            },
            {
              value: 'address',
              label: 'Address',
              hasErrors: streetError !== undefined,
              content: (
                <FormSection title="Address">
                  <TextField
                    label="Street"
                    required
                    value={street}
                    onChange={setStreet}
                    {...(streetError === undefined ? {} : { error: streetError })}
                  />
                </FormSection>
              ),
            },
          ]}
        />
      </FormActions>
    </form>
  )
}

/** Save with an empty required field in another tab: the tab shows the icon, opens, and the field takes the focus. */
export const TabsWithErrors: Story = {
  name: 'Tabs with errors',
  render: () => <RecordForm stickyActions="never" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(canvas.getByRole('textbox', { name: /^Street/ })).toHaveFocus())
    await expect(canvas.getByRole('tab', { name: 'Address — has errors' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await settle()
  },
}

/**
 * A long form in a scrolling area ('auto'): no bottom bar while the top actions are in view;
 * scrolled down, the bar shows with "Unsaved changes" — never both sets at once.
 */
export const BottomBarWhileScrolling: Story = {
  name: 'Bottom bar while scrolling',
  render: () => (
    <div data-testid="scroller" className="h-130 overflow-y-auto">
      <RecordForm long />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const name = canvas.getByRole('textbox', { name: 'Name' })
    await userEvent.type(name, ' Group')
    await expect(canvas.queryByText('Unsaved changes')).toBeNull()
    const scroller = canvas.getByTestId('scroller')
    scroller.scrollTop = scroller.scrollHeight
    await waitFor(() => expect(canvas.getByText('Unsaved changes')).toBeVisible())
    await settle()
  },
}

/** A short form that fits: 'auto' shows no bottom bar (a second set of buttons would read as a bug). */
export const ShortForm: Story = {
  name: 'Short form (no bottom bar)',
  render: () => <RecordForm />,
}

/** 'always' forces the bottom bar on a short form. */
export const BarAlways: Story = {
  name: 'Bottom bar always',
  render: () => <RecordForm stickyActions="always" />,
}

function GuardedForm() {
  const [value, setValue] = useState('')
  const [left, setLeft] = useState(false)
  const guard = useUnsavedChangesGuard(value !== '')
  return (
    <div className="flex max-w-120 flex-col gap-4">
      <Button
        intent="back"
        label="Back to the list"
        onClick={() => {
          guard.confirmLeave(() => {
            setLeft(true)
          })
        }}
      />
      <TextField label="Name" value={value} onChange={setValue} />
      {left && <p className="m-0 text-sm">Left the form.</p>}
      {guard.dialog}
    </div>
  )
}

/** With unsaved changes, leaving asks first; "Stay" keeps the form. */
export const UnsavedChangesGuard: Story = {
  name: 'Unsaved changes guard',
  render: () => <GuardedForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), 'Beta')
    await userEvent.click(canvas.getByRole('button', { name: 'Back to the list' }))
    await body.findByRole('alertdialog', { name: 'Leave without saving?' })
    await settle()
  },
}

function Wizard() {
  const [name, setName] = useState('')
  const [checked, setChecked] = useState(false)
  const [amount, setAmount] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  return (
    <div className="flex max-w-180 flex-col gap-4">
      <FormWizard
        steps={[
          {
            label: 'Customer',
            description: 'Who pays',
            content: (
              <FormSection title="Customer" columns={1}>
                <TextField
                  label="Name"
                  required
                  value={name}
                  onChange={setName}
                  {...(checked && name === '' ? { error: 'Enter the name.' } : {})}
                />
              </FormSection>
            ),
            validate: () => {
              setChecked(true)
              return name !== ''
            },
          },
          {
            label: 'Amount',
            content: (
              <FormSection title="Amount" columns={1}>
                <NumberField label="Amount" decimals={2} value={amount} onChange={setAmount} />
              </FormSection>
            ),
          },
          { label: 'Confirm', content: <p className="m-0 text-sm">Ready to create.</p> },
        ]}
        onFinish={() => {
          setDone(true)
        }}
      />
      {done && <p className="m-0 text-sm">Created.</p>}
    </div>
  )
}

/** Next checks the step: an empty required name stays with its error focused; Back keeps what was typed. */
export const WizardSteps: Story = {
  name: 'Wizard',
  render: () => <Wizard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await waitFor(() => expect(canvas.getByRole('textbox', { name: /^Name/ })).toHaveFocus())
    await userEvent.type(canvas.getByRole('textbox', { name: /^Name/ }), 'Alfa')
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await canvas.findByRole('textbox', { name: 'Amount' })
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }))
    await expect(await canvas.findByRole('textbox', { name: /^Name/ })).toHaveValue('Alfa')
    await settle()
  },
}

interface Invoice {
  customer: string
  issued: string | null
  total: string | null
  currency: string
  paid: boolean
}

function BoundForm({ children }: { children?: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null)
  const { control, handleSubmit, formState } = useForm<Invoice>({
    defaultValues: { customer: '', issued: null, total: null, currency: 'EUR', paid: false },
  })
  useFocusFirstInvalid(formRef, formState)
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        void handleSubmit(() => undefined)(event)
      }}
      className="flex max-w-180 flex-col gap-4"
    >
      <FormSection title="Invoice">
        <FormTextField
          control={control}
          name="customer"
          label="Customer"
          required
          rules={{ required: 'Enter the customer.' }}
        />
        <FormDateField control={control} name="issued" label="Issue date" />
        <FormMoneyField control={control} name="total" label="Total" currency="EUR" />
        <FormSelectField
          control={control}
          name="currency"
          label="Currency"
          options={[
            { value: 'EUR', label: 'EUR' },
            { value: 'RSD', label: 'RSD' },
          ]}
        />
        <FormSwitchField control={control} name="paid" label="Paid" />
      </FormSection>
      {children}
      <div className="flex justify-end">
        <Button intent="save" label="Save" type="submit" />
      </div>
    </form>
  )
}

/**
 * @veljaos/ui/form: the fields bound to React Hook Form. Saving with an empty required customer
 * shows the rule's message and focuses the field; unreadable text in Total also blocks saving.
 */
export const ReactHookForm: Story = {
  name: 'React Hook Form binding',
  render: () => <BoundForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: /^Total/ }), 'abc{Tab}')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(await canvas.findByText('Enter the customer.')).toBeVisible()
    await waitFor(() => expect(canvas.getByRole('textbox', { name: /^Customer/ })).toHaveFocus())
    await expect(canvas.getByText('Enter a number')).toBeVisible()
    await settle()
  },
}

/** Long text at phone width: one column, long labels wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <FormSection title={LONG.label} description={LONG.description}>
        <TextField label={LONG.label} description={LONG.description} />
        <TextField label="City" />
      </FormSection>
      <div className="mt-4">
        <FormSection title={LONG.label} collapsible defaultOpen>
          <TextField label="Reference" />
        </FormSection>
      </div>
    </div>
  ),
}

/** Arabic sample text, right to left: the chevron of a closed section points to the start of reading (left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex max-w-240 flex-col gap-4">
        <FormSection title={ARABIC.label} description={ARABIC.description}>
          <TextField label={ARABIC.label} defaultValue={ARABIC.value} />
          <TextField label={ARABIC.options[0] ?? ''} />
        </FormSection>
        <FormSection title={ARABIC.options[1] ?? ''} collapsible>
          <TextField label={ARABIC.options[2] ?? ''} />
        </FormSection>
        <FormTabs
          items={[
            { value: 'a', label: ARABIC.options[0] ?? '', content: null },
            { value: 'b', label: ARABIC.options[1] ?? '', content: null, hasErrors: true },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="flex max-w-240 flex-col gap-4">
        <FormSection title={JAPANESE.label} description={JAPANESE.description}>
          <TextField label={JAPANESE.label} defaultValue={JAPANESE.value} />
          <TextField label={JAPANESE.options[0] ?? ''} />
        </FormSection>
        <FormTabs
          items={[
            { value: 'a', label: JAPANESE.options[0] ?? '', content: null },
            { value: 'b', label: JAPANESE.options[1] ?? '', content: null, hasErrors: true },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/**
 * English in a right-to-left page (P3.6): section titles, tab labels and "Unsaved changes" keep
 * their own order; the grid, the tabs and the bottom bar stay right to left.
 */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <FormActions
        dirty
        stickyActions="always"
        actions={<ActionGroup actions={[{ key: 'save', intent: 'save', label: 'Save (draft)' }]} />}
      >
        <FormSection title="Customer (main office)" description="3 fields are required.">
          <TextField label="Name" defaultValue="Alfa Trade d.o.o." />
          <TextField label="Tax number" direction="ltr" defaultValue="100123456" />
          <SelectField
            label="Payment terms"
            options={[
              { value: '30', label: '30 days' },
              { value: '60', label: '60 days' },
            ]}
            defaultValue="30"
          />
        </FormSection>
      </FormActions>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('Customer (main office)'),
      canvas.getByText('Unsaved changes'),
    )
    // Free text takes its direction from itself ("Alfa Trade d.o.o." keeps its full stop at the
    // end) and stays at the page's start side; a code is left to right; a chosen option reads
    // as written.
    const name = canvas.getByDisplayValue('Alfa Trade d.o.o.')
    await expect(name).toHaveAttribute('dir', 'auto')
    await expect(getComputedStyle(name).textAlign).toBe('right')
    await expect(canvas.getByDisplayValue('100123456')).toHaveAttribute('dir', 'ltr')
    await expect(
      canvas.getAllByText('30 days').some((element) => element.getAttribute('dir') === 'auto'),
    ).toBe(true)
    await settle()
  },
}
