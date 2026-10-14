import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DateField } from './date-field'
import { FormGrid } from './form-layout'
import { MoneyField } from './number-field'
import { PageViewer } from './page-viewer'
import { SAMPLE_PAGES, SAMPLE_REGIONS } from './page-viewer-story-data'
import { RecognizedField } from './recognized-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Fields/RecognizedField',
  component: RecognizedField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a field whose value the application read from a document — a ' +
          'recognised invoice, a scanned receipt — with how sure the reading is, in the ' +
          'application’s words, and "Show where it was read", which highlights the region on ' +
          'the PageViewer beside it. It wraps any field: `children` receives the id of the note ' +
          'for the field’s `describedBy`. The component never judges a figure: the application ' +
          'says which readings are uncertain (`low`), and those are marked with an icon and ' +
          'words, never colour alone. Once the user changes a value, "Changed by you" replaces ' +
          'the confidence.\n\n' +
          '**When to use:** reviewing what was recognised before it is posted. **When not:** a ' +
          'value the system filled in from its own records (ChangeableValue); a plain field.',
      },
    },
  },
  args: {
    children: (describedBy: string) => (
      <TextField label="Number" defaultValue="INV-1001" direction="ltr" describedBy={describedBy} />
    ),
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-sm">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof RecognizedField>

export default meta

type Story = StoryObj<typeof meta>

const noop = () => undefined

/** A sure reading: its confidence, and where it was read. */
export const Default: Story = {
  args: { onShowSource: noop, confidence: '98%' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Number' })).toHaveAccessibleDescription(
      'Confidence: 98%',
    )
    await expect(canvas.getByRole('button', { name: 'Show where it was read' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

/** The application marks the reading as uncertain: an icon and "Low confidence". */
export const LowConfidence: Story = {
  name: 'Low confidence',
  args: {
    onShowSource: noop,
    confidence: '61%',
    low: true,
    children: (describedBy: string) => (
      <DateField label="Due date" defaultValue="2026-11-05" describedBy={describedBy} />
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('textbox', { name: 'Due date' }),
    ).toHaveAccessibleDescription(/Low confidence · Confidence: 61%/)
  },
}

/** The region is shown on the page: the button is pressed (the neutral selection). */
export const SourceShown: Story = {
  name: 'Source shown',
  args: { onShowSource: noop, confidence: '98%', sourceShown: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Show where it was read' }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

/** The user changed the value: the reading no longer applies. */
export const Changed: Story = {
  name: 'Changed by the user',
  args: { onShowSource: noop, changed: true, low: true, confidence: '61%' },
}

/** Nothing was found on the page: the application's words, the field empty. */
export const NotFound: Story = {
  name: 'Not found',
  args: {
    low: true,
    lowLabel: 'Not found on the page',
    children: (describedBy: string) => <TextField label="Order number" describedBy={describedBy} />,
  },
}

/** Read-only: the value as text, the reading still told. */
export const ReadOnly: Story = {
  name: 'Read-only',
  args: {
    onShowSource: noop,
    confidence: '98%',
    children: (describedBy: string) => (
      <TextField label="Number" value="INV-1001" readOnly describedBy={describedBy} />
    ),
  },
}

/** Disabled with its reason. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  args: {
    onShowSource: noop,
    confidence: '98%',
    children: (describedBy: string) => (
      <TextField
        label="Number"
        value="INV-1001"
        disabled
        disabledReason="The document is posted."
        describedBy={describedBy}
      />
    ),
  },
}

/** The field's own error under it, the uncertain reading under that. */
export const WithError: Story = {
  name: 'Error',
  args: {
    onShowSource: noop,
    low: true,
    confidence: '44%',
    children: (describedBy: string) => (
      <MoneyField
        label="Total"
        currency="GBP"
        defaultValue={null}
        error="Enter the total."
        required
        describedBy={describedBy}
      />
    ),
  },
}

/** Long words from the application. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    onShowSource: noop,
    low: true,
    lowLabel: 'The reading is uncertain because the stamp covers part of the printed date',
    confidence: '52%, read from a stamped area',
    children: (describedBy: string) => (
      <DateField
        label="Date the goods were delivered to the site, as printed under the stamp"
        defaultValue="2026-10-06"
        describedBy={describedBy}
      />
    ),
  },
}

/** Phone width. */
export const Phone: Story = {
  args: { onShowSource: noop, low: true, confidence: '61%' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    onShowSource: noop,
    low: true,
    confidence: '61%',
    lowLabel: 'ثقة منخفضة',
    children: (describedBy: string) => (
      <TextField label="المورّد" defaultValue="شركة النور للتوريدات" describedBy={describedBy} />
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    onShowSource: noop,
    confidence: '97%',
    children: (describedBy: string) => (
      <TextField label="仕入先" defaultValue="北風商事株式会社" describedBy={describedBy} />
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The fields beside the page: the application keeps which region is shown. */
function Review({ start }: { start: string | null }) {
  const [shown, setShown] = useState<string | null>(start)
  const source = (id: string) => ({
    sourceShown: shown === id,
    onShowSource: () => {
      setShown((current) => (current === id ? null : id))
    },
  })
  return (
    <div className="grid grid-cols-2 gap-6">
      <PageViewer
        label="Invoice INV-1001, Northwind Supplies Ltd."
        pages={SAMPLE_PAGES}
        regions={SAMPLE_REGIONS}
        highlight={shown}
        className="h-[30rem]"
      />
      <FormGrid columns={1}>
        <RecognizedField confidence="99%" {...source('supplier')}>
          {(describedBy) => (
            <TextField
              label="Supplier"
              defaultValue="Northwind Supplies Ltd."
              describedBy={describedBy}
            />
          )}
        </RecognizedField>
        <RecognizedField confidence="98%" {...source('number')}>
          {(describedBy) => (
            <TextField
              label="Number"
              defaultValue="INV-1001"
              direction="ltr"
              describedBy={describedBy}
            />
          )}
        </RecognizedField>
        <RecognizedField confidence="61%" low {...source('due')}>
          {(describedBy) => (
            <DateField label="Due date" defaultValue="2026-11-05" describedBy={describedBy} />
          )}
        </RecognizedField>
        <RecognizedField confidence="97%" {...source('total')}>
          {(describedBy) => (
            <MoneyField
              label="Total"
              currency="GBP"
              defaultValue="720.00"
              describedBy={describedBy}
            />
          )}
        </RecognizedField>
      </FormGrid>
    </div>
  )
}

const wide = [
  (Story: () => ReactNode) => (
    <ExampleProvider>
      <div className="max-w-4xl">
        <Story />
      </div>
    </ExampleProvider>
  ),
]

/** Beside the page: the due date's region shown. */
export const BesideThePage: Story = {
  name: 'Beside the page',
  render: () => <Review start="due" />,
  decorators: wide,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText('Highlighted: Due date, page 1 of 2'),
    ).toBeInTheDocument()
  },
}

/** "Show where it was read" on the total turns the viewer to page 2; pressed again, it hides. */
export const ShowSource: Story = {
  name: 'Show where it was read, interaction',
  tags: ['interaction'],
  render: () => <Review start={null} />,
  decorators: wide,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole('button', { name: 'Show where it was read' })
    const total = buttons[3]
    if (total === undefined) throw new Error('Four fields expected')
    await userEvent.click(total)
    await expect(total).toHaveAttribute('aria-pressed', 'true')
    await waitFor(async () => {
      await expect(canvas.getByText('Page 2 of 2')).toBeVisible()
    })
    await expect(canvas.getByText('Highlighted: Total, page 2 of 2')).toBeInTheDocument()
    await userEvent.click(total)
    await expect(total).toHaveAttribute('aria-pressed', 'false')
    await expect(canvasElement.querySelector('[data-slot="page-viewer-highlight"]')).toBeNull()
  },
}
