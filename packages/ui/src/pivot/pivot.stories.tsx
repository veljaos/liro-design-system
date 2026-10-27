import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { Pivot, type PivotProps } from './pivot'
import { EMPTY_PIVOT_LAYOUT, type PivotLayout } from './pivot-logic'
import {
  ARABIC_LABELS,
  FIELDS,
  JAPANESE_LABELS,
  LONG_LABELS,
  MONTH_LAYOUT,
  MONTH_RESULT,
  QUARTER_LAYOUT,
  QUARTER_RESULT,
  relabel,
  relabelFields,
  VIEWS,
} from './pivot-story-data'

const EXPORT = {
  formats: [
    { id: 'xlsx', label: 'Excel workbook (.xlsx)' },
    { id: 'csv', label: 'Comma-separated values (.csv)' },
  ],
}

/**
 * The pivot as an application keeps it: the layout the user chose, and the last thing reported
 * (a layout, a figure opened or an export) written under it. The story keeps one result: the
 * application would compute a new one for each layout.
 */
function Controlled(props: Partial<PivotProps> & { fixed?: boolean }) {
  const { fixed, value, ...rest } = props
  const [layout, setLayout] = useState<PivotLayout>(value ?? QUARTER_LAYOUT)
  const [last, setLast] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <Pivot
        label="Sales by region and quarter"
        fields={FIELDS}
        views={VIEWS}
        result={QUARTER_RESULT}
        onDrillDown={(cell) => {
          setLast(JSON.stringify(cell))
        }}
        exportAction={{
          ...EXPORT,
          onExport: (format) => {
            setLast(`export ${format}`)
          },
        }}
        {...rest}
        value={layout}
        {...(fixed === true
          ? {}
          : {
              onChange: (next: PivotLayout) => {
                setLayout(next)
                setLast(JSON.stringify(next))
              },
            })}
      />
      <p data-testid="last" dir="ltr" className="m-0 font-mono text-xs break-all text-secondary">
        {last}
      </p>
    </div>
  )
}

const meta = {
  title: 'Components/Pivot',
  component: Pivot,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/pivot` — a subpath of its own, built on TanStack Table, so the pivot’s ' +
          'code loads only where an analysis is drawn.\n\n' +
          '**What for:** an analysis the user arranges: which fields make the rows and the ' +
          'columns, which figures are shown with which aggregation (the application’s list: ' +
          'Sum, Average, Count…), which values are kept by the filters. Every change of the ' +
          'layout is reported through `onChange`; the application computes the cells, the ' +
          'subtotals and the totals and passes them back as decimal strings (`result`). The ' +
          'library never adds, averages or counts; null is “—”.\n\n' +
          '**Simple first** (P5.93): one card — the application’s suggested views (`views`) as ' +
          'its first row, the layout in one line of words, few buttons (Fields, one Expand all ' +
          '/ Collapse all, Export), then the grid. The user starts from a view.\n\n' +
          '**The chooser** (“Fields”, closed by default): an end sheet (full screen on phones) ' +
          'with four zones — Rows, Columns, Values, Filters — and the fields not used. A chip ' +
          'is dragged to another zone or place (the dragging rule, announced), or moved by its ' +
          'menu — never only by dragging. The grid behind it follows every change.\n\n' +
          '**The grid:** the application’s column tree as header rows (a quarter over its ' +
          'figures), row groups that open and close (the first level open), subtotals ' +
          'semibold, total columns and the grand total on the sunken surface as DataTable’s ' +
          'totals; the header stays below the shell and the first column at the start. A ' +
          'treegrid: arrows, Home / End, Page keys; Enter on a group opens or closes it, on a ' +
          'figure it opens its records (`onDrillDown`: the application shows them, e.g. in a ' +
          'Drawer with a DataTable). Export reports the format chosen; the application makes ' +
          'the file.\n\n' +
          '**When not:** a list of records (DataTable), a fixed report with known columns ' +
          '(ReportPage with a DataTable or TreeTable), an official form (StatutoryFormPage), a ' +
          'figure over time (the charts).',
      },
    },
  },
  args: {
    label: 'Sales by region and quarter',
    fields: FIELDS,
    value: QUARTER_LAYOUT,
    result: QUARTER_RESULT,
  },
} satisfies Meta<typeof Pivot>

export default meta

type Story = StoryObj<typeof meta>

/** Region and product line down, quarters across, two figures each; the chooser beside it. */
export const Default: Story = {
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = canvas.getByRole('treegrid', { name: 'Sales by region and quarter' })
    await expect(grid).toBeVisible()
    await expect(within(grid).getByRole('columnheader', { name: 'Q1 2026' })).toBeVisible()
    await expect(within(grid).getByRole('rowheader', { name: 'Total' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Fields' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.getByRole('button', { name: 'By region and quarter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(
      canvas.getByText(/Sum of Amount, Count of Orders by Region \/ Product line/),
    ).toBeVisible()
  },
}

/** The Fields sheet open: the four zones and the unused fields, the grid behind it. */
export const FieldsOpen: Story = {
  name: 'Fields',
  render: () => <Controlled defaultFieldsOpen />,
  play: async ({ canvasElement }) => {
    const sheet = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: 'Fields',
    })
    await waitFor(async () => {
      await expect(within(sheet).getByRole('heading', { name: 'Rows' })).toBeVisible()
    })
    const headings = within(sheet)
      .getAllByRole('heading', { level: 3 })
      .map((each) => each.textContent)
    await expect(headings).toEqual(['Rows', 'Columns', 'Values', 'Filters', 'Available fields'])
  },
}

/** Every group open (`defaultExpanded`). */
export const AllOpen: Story = {
  tags: ['!dev'],
  name: 'All groups open',
  render: () => <Controlled defaultExpanded={['north', 'south', 'west']} />,
}

/** Every group closed: the regions and their subtotals only. */
export const AllClosed: Story = {
  tags: ['!dev'],
  name: 'All groups closed',
  render: () => <Controlled defaultExpanded={[]} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('rowheader', { name: 'Hardware' })).toBeNull()
  },
}

/** One figure across months: one header row, a percent-free money grid. */
export const OneValue: Story = {
  tags: ['!dev'],
  name: 'One value',
  render: () => <Controlled value={MONTH_LAYOUT} result={MONTH_RESULT} />,
}

/** A fixed layout: no chooser (no `onChange`), the figures still open their records. */
export const FixedLayout: Story = {
  tags: ['!dev'],
  name: 'Fixed layout',
  render: () => <Controlled fixed />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('button', { name: 'Fields' })).toBeNull()
  },
}

/** Without drill-down or export: the figures are only read. */
export const ReadOnly: Story = {
  tags: ['!dev'],
  name: 'Read only',
}

/**
 * Everything controlled by the application (`expanded`, `fieldsOpen`), with an action of its own
 * before Export.
 */
export const ControlledState: Story = {
  tags: ['!dev'],
  name: 'Controlled state',
  render: function Render() {
    const [expanded, setExpanded] = useState<string[]>(['south'])
    const [open, setOpen] = useState(false)
    return (
      <Controlled
        expanded={expanded}
        onExpandedChange={setExpanded}
        fieldsOpen={open}
        onFieldsOpenChange={setOpen}
        actions={<Button family="neutral" icon={Bookmark} label="Save view" />}
        className="max-w-5xl"
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('rowheader', { name: 'Hardware' })).toHaveLength(1)
    await expect(canvas.getByRole('button', { name: 'Save view' })).toBeVisible()
  },
}

/** Nothing in Values yet: "Choose a value", with "Choose fields". */
export const ChooseAValue: Story = {
  name: 'Choose a value',
  render: () => <Controlled value={EMPTY_PIVOT_LAYOUT} result={null} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Choose a value')).toBeVisible()
  },
}

/** The first result being computed. */
export const Loading: Story = {
  render: () => <Controlled result={null} loading />,
}

/** A new result being computed: the old figures stay, "Updating…" at the end. */
export const Updating: Story = {
  tags: ['!dev'],
  render: () => <Controlled loading />,
}

export const Failed: Story = {
  render: () => (
    <Controlled
      result={null}
      error="The figures could not be computed. The analysis service did not answer."
      onRetry={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

/** The filters keep nothing the layout could show. */
export const NoFigures: Story = {
  tags: ['!dev'],
  name: 'No figures',
  render: () => (
    <Controlled
      value={{ ...QUARTER_LAYOUT, filters: [{ field: 'salesperson', values: ['sara'] }] }}
      result={{ columns: [], rows: [] }}
    />
  ),
}

export const LongText: Story = {
  tags: ['!dev'],
  name: 'Long text',
  render: () => (
    <Controlled result={relabel(QUARTER_RESULT, LONG_LABELS)} fields={relabelFields(LONG_LABELS)} />
  ),
}

/** A phone: the grid scrolls sideways with its first column at the start; Fields opens a sheet. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Controlled />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('treegrid')).toBeVisible()
    await expect(canvas.queryByRole('dialog', { name: 'Fields' })).toBeNull()
  },
}

/** The chooser in its sheet on a phone, as an application restores it. */
export const PhoneFields: Story = {
  tags: ['!dev'],
  name: 'Phone, fields',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Controlled defaultFieldsOpen layout="phone" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const sheet = await within(canvasElement).findByRole('dialog', { name: 'Fields' })
    // The sheet slides in (its first frame is transparent): wait until its content is shown.
    await waitFor(async () => {
      await expect(within(sheet).getByRole('heading', { name: 'Values' })).toBeVisible()
    })
  },
}

export const Arabic: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ar">
      <Controlled
        label="المبيعات حسب المنطقة والربع"
        fields={relabelFields(ARABIC_LABELS)}
        result={relabel(QUARTER_RESULT, ARABIC_LABELS)}
      />
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ja">
      <Controlled
        label="地域・四半期別の売上"
        fields={relabelFields(JAPANESE_LABELS)}
        result={relabel(QUARTER_RESULT, JAPANESE_LABELS)}
      />
    </StoryProvider>
  ),
}

/** The keys: into a figure, Enter opens its records; on a group, Enter closes it; the ends. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction', '!dev'],
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const grid = canvas.getByRole('treegrid')
    const north = within(grid).getByRole('rowheader', { name: 'North' })
    await expect(north).toHaveAttribute('tabindex', '0')
    north.focus()
    // The arrow towards the end: ArrowRight, or ArrowLeft in right to left.
    const toEnd = getComputedStyle(grid).direction === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}'
    await userEvent.keyboard(toEnd)
    const first = within(grid).getAllByRole('gridcell')[0]
    await waitFor(async () => {
      await expect(first).toHaveFocus()
    })
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('last')).toHaveTextContent(
      '{"rowKey":"north","columnKey":"q1:amount","rowPath":["North"],"columnPath":["Q1 2026","Amount"],"value":"1563013.37"}',
    )
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(canvas.getByTestId('last')).toHaveTextContent('"rowPath":["North","Hardware"]')
    // Back to the group's row header: Enter closes the group.
    await userEvent.keyboard('{ArrowUp}{Home}{Enter}')
    await waitFor(async () => {
      await expect(within(grid).getAllByRole('rowheader', { name: 'Hardware' })).toHaveLength(2)
    })
    await expect(north.closest('[role=row]')).toHaveAttribute('aria-expanded', 'false')
    // Ctrl+End: the grand total's last figure.
    await userEvent.keyboard('{Control>}{End}{/Control}')
    const totalRow = within(grid).getByRole('rowheader', { name: 'Total' }).closest('tr')
    await waitFor(async () => {
      await expect(totalRow?.lastElementChild).toHaveFocus()
    })
    // A press on a figure opens it too.
    await userEvent.click(totalRow?.lastElementChild ?? grid)
    await expect(canvas.getByTestId('last')).toHaveTextContent('"columnKey":"total:orders"')
  },
}

/** The chooser by its menus: a field moved to Columns, a field added to Rows, one removed. */
export const ChangeLayout: Story = {
  name: 'Change the layout, interaction',
  tags: ['interaction', '!dev'],
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const last = canvas.getByTestId('last')
    // One button opens or closes every group.
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse all' }))
    await expect(canvas.queryByRole('rowheader', { name: 'Hardware' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Expand all' }))
    await expect(canvas.getAllByRole('rowheader', { name: 'Hardware' })).toHaveLength(3)
    // A suggested view reports its layout.
    await userEvent.click(canvas.getByRole('button', { name: 'By region and month' }))
    await expect(last).toHaveTextContent('"rows":["region"],"columns":["month"]')
    await userEvent.click(canvas.getByRole('button', { name: 'By region and quarter' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Fields' }))
    const sheet = within(await body.findByRole('dialog', { name: 'Fields' }))
    await userEvent.click(sheet.getByRole('button', { name: 'Options: Product line' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move to Columns' }))
    await expect(last).toHaveTextContent('"rows":["region"],"columns":["quarter","line"]')
    await expect(sheet.getByRole('status')).toHaveTextContent(
      'Product line in Columns, position 2 of 2',
    )
    await userEvent.click(sheet.getByRole('button', { name: 'Add Month' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Add to Rows' }))
    await expect(last).toHaveTextContent('"rows":["region","month"]')
    await userEvent.click(sheet.getByRole('button', { name: 'Options: Month' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move up' }))
    await expect(last).toHaveTextContent('"rows":["month","region"]')
    await userEvent.click(sheet.getByRole('button', { name: 'Options: Orders' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Remove' }))
    await expect(last).toHaveTextContent('"values":[{"field":"amount","aggregation":"sum"}]')
    await userEvent.click(sheet.getByRole('button', { name: 'Add Orders to Values' }))
    await expect(last).toHaveTextContent('{"field":"orders","aggregation":"count"}')
    // The summary follows the layout; no view stands chosen for a layout of the user's own.
    await expect(
      canvas.getByText(/by Month \/ Region, across Quarter \/ Product line/),
    ).toBeVisible()
    await userEvent.click(sheet.getByRole('button', { name: 'Done' }))
    await waitFor(async () => {
      await expect(body.queryByRole('dialog', { name: 'Fields' })).toBeNull()
    })
    await expect(canvas.getByRole('button', { name: 'By region and quarter' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}

/**
 * Dragging a chip (the dragging rule): Product line from Rows to Columns, then Salesperson out
 * of the layout among the unused fields; each move reported and announced.
 */
export const DragFields: Story = {
  name: 'Drag a field, interaction',
  tags: ['interaction', '!dev'],
  render: () => <Controlled defaultFieldsOpen />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(document.body)
    const sheet = await body.findByRole('dialog', { name: 'Fields' })
    const chip = (field: string) => {
      const element = sheet.querySelector<HTMLElement>(`[data-drop-item="${field}"]`)
      if (element === null) throw new Error(`no chip ${field}`)
      return element
    }
    const zone = (name: string) => {
      const element = sheet.querySelector<HTMLElement>(`[data-drop-zone="${name}"]`)
      if (element === null) throw new Error(`no zone ${name}`)
      return element
    }
    await waitFor(async () => {
      await expect(within(sheet).getByRole('heading', { name: 'Rows' })).toBeVisible()
    })
    const drag = async (field: string, target: string) => {
      const from = chip(field).querySelector('svg')?.getBoundingClientRect()
      const to = zone(target).getBoundingClientRect()
      if (from === undefined) throw new Error('no handle')
      const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 }
      const end = { x: to.left + to.width / 2, y: to.bottom - 4 }
      await userEvent.pointer([
        {
          keys: '[MouseLeft>]',
          target: chip(field),
          coords: { clientX: start.x, clientY: start.y },
        },
        { coords: { clientX: start.x + 6, clientY: start.y + 6 } },
        { coords: { clientX: end.x, clientY: end.y } },
        { keys: '[/MouseLeft]', coords: { clientX: end.x, clientY: end.y } },
      ])
    }
    await drag('line', 'columns')
    await expect(canvas.getByTestId('last')).toHaveTextContent(
      '"rows":["region"],"columns":["quarter","line"]',
    )
    await expect(within(sheet).getByRole('status')).toHaveTextContent(
      'Product line in Columns, position 2 of 2',
    )
    await drag('salesperson', 'available')
    await expect(canvas.getByTestId('last')).toHaveTextContent('"filters":[]')
    await expect(within(sheet).getByRole('status')).toHaveTextContent(
      'Salesperson removed from the layout',
    )
  },
}

/** Export: a menu of the application's formats; the choice is reported. */
export const Export: Story = {
  name: 'Export, interaction',
  tags: ['interaction', '!dev'],
  render: () => <Controlled />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'Comma-separated values (.csv)' }),
    )
    await expect(canvas.getByTestId('last')).toHaveTextContent('export csv')
  },
}

/** On a phone: Fields opens the sheet, Done closes it. */
export const PhoneChooser: Story = {
  name: 'Phone, fields, interaction',
  tags: ['interaction', '!dev'],
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Controlled />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Fields' }))
    const sheet = await canvas.findByRole('dialog', { name: 'Fields' })
    await userEvent.click(within(sheet).getByRole('button', { name: 'Options: Region' }))
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'Move to Columns' }),
    )
    await expect(canvas.getByTestId('last')).toHaveTextContent('"rows":["line"]')
    await userEvent.click(within(sheet).getByRole('button', { name: 'Done' }))
    await waitFor(async () => {
      await expect(canvas.queryByRole('dialog', { name: 'Fields' })).toBeNull()
    })
  },
}
