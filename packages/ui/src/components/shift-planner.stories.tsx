import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { createFormat } from '../provider/format'
import type { ShiftAssignment, ShiftChange } from './shift-logic'
import { ShiftPlanner, type ShiftPlannerProps } from './shift-planner'
import {
  applyShiftChanges,
  HEALTH_ASSIGNMENTS,
  HEALTH_CONFLICTS,
  HEALTH_COVERAGE,
  HEALTH_GROUPINGS,
  HEALTH_PUBLISH,
  HEALTH_ROTATIONS,
  HEALTH_ROWS,
  HEALTH_TEMPLATES,
  STORE_ASSIGNMENTS,
  STORE_CONFLICTS,
  STORE_COVERAGE,
  STORE_GROUPINGS,
  STORE_PUBLISH,
  STORE_ROTATIONS,
  STORE_ROWS,
  STORE_TEMPLATES,
  WEEK,
} from './shift-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application around the planner: it applies each change and moves the period. */
function Planner(props: Partial<ShiftPlannerProps>) {
  const counter = useRef(0)
  const [assignments, setAssignments] = useState<readonly ShiftAssignment[]>(
    props.assignments ?? STORE_ASSIGNMENTS,
  )
  const [period, setPeriod] = useState({
    start: props.start ?? WEEK.start,
    end: props.end ?? WEEK.end,
  })
  const [status, setStatus] = useState(props.status)
  const [changed, setChanged] = useState(props.changedSincePublishing)
  return (
    <ShiftPlanner
      label="Shifts, Prodavnica 12"
      rows={STORE_ROWS}
      templates={STORE_TEMPLATES}
      groupings={STORE_GROUPINGS}
      rotations={STORE_ROTATIONS}
      conflicts={STORE_CONFLICTS}
      coverage={STORE_COVERAGE}
      publishCounts={STORE_PUBLISH}
      {...props}
      assignments={assignments}
      start={period.start}
      end={period.end}
      onPeriodChange={setPeriod}
      {...(status === undefined ? {} : { status })}
      {...(changed === undefined ? {} : { changedSincePublishing: changed })}
      onPublish={async () => {
        await new Promise((resolve) => setTimeout(resolve, 400))
        setStatus('published')
        setChanged(false)
      }}
      {...(props.readOnly === true
        ? {}
        : {
            onChange: (changes: ShiftChange[]) => {
              setAssignments((current) =>
                applyShiftChanges(current, changes, () => `n${String((counter.current += 1))}`),
              )
              if (status === 'published') setChanged(true)
            },
          })}
    />
  )
}

/** A day as the cells name it in the example stories: the Serbian tenant's long date. */
const SERBIAN = createFormat('sr-Latn-RS')
function day(date: string): string {
  return SERBIAN.dateLong(date)
}

/** The cell button of a person's day, by its name's start. */
function cell(canvasElement: HTMLElement, name: string, day: string): HTMLElement {
  const found = within(canvasElement)
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-label')?.startsWith(`${name}, ${day}:`) === true)
  if (found === undefined) throw new Error(`no cell for ${name}, ${day}`)
  return found
}

/** Whether the story's page runs right to left (the toolbar's direction). */
function rtl(canvasElement: HTMLElement): boolean {
  const planner = canvasElement.querySelector('[data-slot="shift-planner"]') ?? canvasElement
  return getComputedStyle(planner).direction === 'rtl'
}

const meta = {
  title: 'Components/Working time/ShiftPlanner',
  component: ShiftPlanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**What for:** planning who works when — people × the days of a week or a period, ' +
          'each cell holding zero or more of the application’s shift templates (a template ' +
          'whose end is not after its start crosses midnight: “22:00–06:00 (+1)”, read as “… ' +
          'the next day”). Rows grouped by team or site under collapsible headings; planned ' +
          'hours at the row’s end, coverage at the column’s foot; the schedule’s state and ' +
          'Publish (with a confirmation that states the application’s counts); “Apply ' +
          'rotation…” fills days from a rotation pattern.\n\n' +
          '**Assigning — three ways (WCAG 2.5.7):** the keyboard (arrows, Shift+arrows for a ' +
          'range, a template’s key assigns it, Delete removes, Enter opens the cell’s menu); the ' +
          'menu (click a cell: the templates, “Move … to…”, “Remove …”); dragging a template from ' +
          'the palette, or an assignment to another cell (pointer events: it lifts, a neutral ' +
          'dashed placeholder shows where it lands).\n\n' +
          '**The planner never decides validity:** rest between shifts, double booking and ' +
          'weekly hours arrive as conflicts from the application, shown with an icon, in the ' +
          'cell’s name and in the “Conflicts” summary with “Go to”. Legal limits are not encoded; ' +
          'the stories’ limits are illustrative.\n\n' +
          '**Phones:** one day at a time, a list of people with their shifts and a menu each.\n\n' +
          '**When:** shift work planned ahead and published — a store, a 24/7 facility.\n\n' +
          '**When not:** hours actually worked per day (the timesheet); a person’s own shifts ' +
          '(MyShifts); work in stages (KanbanBoard).',
      },
    },
  },
  args: {
    label: 'Shifts, Prodavnica 12',
    rows: STORE_ROWS,
    templates: STORE_TEMPLATES,
    assignments: STORE_ASSIGNMENTS,
    start: WEEK.start,
    end: WEEK.end,
  },
  render: () => (
    <ExampleProvider>
      <Planner status="draft" defaultGroupBy="team" />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ShiftPlanner>

export default meta

type Story = StoryObj<typeof meta>

/** The store's week by team: a draft with conflicts (an icon, the words in the cell’s name). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const luka = cell(canvasElement, 'Luka Đorđević', day('2026-10-08'))
    await expect(luka.getAttribute('aria-label')).toContain(
      'Problem: Two shifts at the same time: Late and Inventory',
    )
    await expect(luka.getAttribute('aria-label')).toContain('21:00 to 05:00 the next day')
    await expect(within(canvasElement).getByRole('heading', { name: 'Conflicts' })).toBeVisible()
  },
}

/**
 * The 24/7 health facility: rotating Morning 06–14, Afternoon 14–22 and Night 22–06 (+1),
 * grouped by site (a doctor in both sites), one person without planned hours ("—").
 */
export const HealthFacility: Story = {
  name: 'Health facility, by site',
  render: () => (
    <ExampleProvider>
      <Planner
        label="Shifts, Dom zdravlja"
        rows={HEALTH_ROWS}
        templates={HEALTH_TEMPLATES}
        assignments={HEALTH_ASSIGNMENTS}
        groupings={HEALTH_GROUPINGS}
        rotations={HEALTH_ROTATIONS}
        conflicts={HEALTH_CONFLICTS}
        coverage={HEALTH_COVERAGE}
        publishCounts={HEALTH_PUBLISH}
        defaultGroupBy="site"
        defaultCollapsed={['klisa']}
        status="draft"
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Klisa clinic' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.getAllByText('22:00–06:00 (+1)').length).toBeGreaterThan(0)
  },
}

/** A range selected with Shift and the arrows: neutral, surface.selected with its border. */
export const SelectedRange: Story = {
  name: 'Selected range',
  render: () => (
    <ExampleProvider>
      <Planner
        status="draft"
        defaultSelection={{
          anchor: { rowId: 'stefan', date: '2026-10-09' },
          focus: { rowId: 'milica', date: '2026-10-11' },
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      cell(canvasElement, 'Milica Stojanović', day('2026-10-11')).getAttribute('aria-label'),
    ).toContain('selected')
  },
}

/** "Apply rotation…" open for the selected people (the rows of the range). */
export const ApplyRotation: Story = {
  name: 'Apply rotation',
  render: () => (
    <ExampleProvider>
      <Planner
        status="draft"
        defaultRotationOpen
        defaultSelection={{
          anchor: { rowId: 'stefan', date: '2026-10-05' },
          focus: { rowId: 'milica', date: '2026-10-05' },
        }}
      />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Apply a rotation' })
    await expect(dialog).toHaveTextContent('Stefan Nikolić')
    await expect(within(dialog).getByRole('status')).toHaveTextContent(
      '10 assignments will be added.',
    )
  },
}

/** Published, then changed: "Changed since publishing" and "Publish changes". */
export const ChangedSincePublishing: Story = {
  name: 'Changed since publishing',
  render: () => (
    <ExampleProvider>
      <Planner status="published" changedSincePublishing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Changed since publishing')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Publish changes' })).toBeVisible()
  },
}

/** Read only (a published schedule for someone who may not change it): no palette or menus. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <Planner status="published" readOnly />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('group', { name: 'Templates' })).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Publish' })).toBeNull()
  },
}

/** Loading: skeletons. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Planner loading />
    </ExampleProvider>
  ),
}

/** A plan without people. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Planner rows={[]} assignments={[]} conflicts={{}} status="draft" />
    </ExampleProvider>
  ),
}

/** Long names, subtitles, template names and conflicts wrap; the grid scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Planner
        status="draft"
        rows={[
          {
            id: 'jovana',
            name: 'Jovana Marković-Radosavljević Petrović',
            subtitle: 'Store manager, responsible for cash handling and the evening close',
            hours: '40',
          },
          ...STORE_ROWS.slice(1, 3),
        ]}
        templates={[
          {
            id: 'early',
            label: 'Early, with the delivery from the central warehouse',
            short: 'E',
            start: '07:00',
            end: '15:00',
          },
          ...STORE_TEMPLATES.slice(1),
        ]}
        conflicts={{
          jovana: {
            '2026-10-06': [
              {
                tone: 'warning',
                text: 'Less than the illustrative 12 hours of rest between the evening close on Monday and the delivery on Tuesday morning',
              },
            ],
          },
        }}
      />
    </ExampleProvider>
  ),
}

/** On a phone: one day at a time, the people with their shifts and a menu each. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto p-4">
          <Planner
            layout="phone"
            status="draft"
            defaultGroupBy="team"
            day="2026-10-08"
            label="Shifts, Prodavnica 12"
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText(day('2026-10-08'))).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: `Change: Luka Đorđević, ${day('2026-10-08')}` }),
    ).toBeVisible()
    const planner = canvasElement.querySelector<HTMLElement>('[data-slot="shift-planner"]')
    if (planner !== null) await expect(planner.scrollWidth).toBeLessThanOrEqual(planner.clientWidth)
  },
}

/** The health facility on a phone, its day switched by the application (`day`). */
export const PhoneHealth: Story = {
  name: 'Phone width, health facility',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto p-4">
          <Planner
            layout="phone"
            label="Shifts, Dom zdravlja"
            rows={HEALTH_ROWS}
            templates={HEALTH_TEMPLATES}
            assignments={HEALTH_ASSIGNMENTS}
            groupings={HEALTH_GROUPINGS}
            conflicts={HEALTH_CONFLICTS}
            coverage={HEALTH_COVERAGE}
            publishCounts={HEALTH_PUBLISH}
            rotations={HEALTH_ROTATIONS}
            status="published"
            day="2026-10-09"
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

const ARABIC_ROWS = [
  { id: 'a', name: 'سارة أحمد', subtitle: 'أمينة صندوق', hours: '40' },
  { id: 'b', name: 'محمد علي', subtitle: 'مخزن', hours: '32' },
]
const ARABIC_TEMPLATES = [
  { id: 'm', label: 'صباحي', short: 'ص', start: '07:00', end: '15:00' },
  { id: 'n', label: 'ليلي', short: 'ل', start: '22:00', end: '06:00', tone: 'premium' as const },
]

/** Arabic, right to left: the first day at the right; the arrows follow the reading direction. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" today="2026-10-06">
      <Planner
        label="جدول المناوبات"
        rows={ARABIC_ROWS}
        templates={ARABIC_TEMPLATES}
        groupings={[]}
        assignments={[
          { id: 'x1', rowId: 'a', date: '2026-10-05', templateId: 'm' },
          { id: 'x2', rowId: 'b', date: '2026-10-06', templateId: 'n' },
        ]}
        conflicts={{ b: { '2026-10-07': [{ tone: 'warning', text: 'راحة أقل من 11 ساعة' }] } }}
        coverage={{}}
        status="draft"
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" today="2026-10-06">
      <Planner
        label="シフト表"
        rows={[
          { id: 'a', name: '佐藤 花子', subtitle: 'レジ', hours: '40' },
          { id: 'b', name: '鈴木 一郎', subtitle: '品出し', hours: '32' },
        ]}
        templates={[
          { id: 'm', label: '早番', short: '早', start: '07:00', end: '15:00' },
          { id: 'n', label: '夜勤', short: '夜', start: '22:00', end: '06:00', tone: 'premium' },
        ]}
        groupings={[]}
        assignments={[
          { id: 'x1', rowId: 'a', date: '2026-10-05', templateId: 'm' },
          { id: 'x2', rowId: 'b', date: '2026-10-06', templateId: 'n' },
        ]}
        conflicts={{ b: { '2026-10-07': [{ tone: 'warning', text: '休息が11時間未満です' }] } }}
        coverage={{}}
        status="draft"
      />
    </StoryProvider>
  ),
}

// ── Interaction stories ──

/**
 * The keyboard: walk to Stefan's Saturday, select Saturday and Sunday with Shift+arrow, press
 * "2" (Late), then Delete on Sunday; each change announced.
 */
export const KeyboardAssignment: Story = {
  name: 'Keyboard assignment, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const forward = rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}'
    const saturday = cell(canvasElement, 'Stefan Nikolić', day('2026-10-10'))
    await userEvent.click(saturday)
    await userEvent.keyboard('{Escape}')
    await userEvent.keyboard(`{Shift>}${forward}{/Shift}`)
    await expect(cell(canvasElement, 'Stefan Nikolić', day('2026-10-11'))).toHaveFocus()
    await expect(canvas.getByRole('status')).toHaveTextContent('2 days selected.')
    await userEvent.keyboard('2')
    await expect(canvas.getByRole('status')).toHaveTextContent('Late assigned to 2 days.')
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Stefan Nikolić', day('2026-10-10')).getAttribute('aria-label'),
      ).toContain('Late, 15:00 to 23:00')
    })
    await userEvent.keyboard('{Escape}{Delete}')
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Stefan Nikolić', day('2026-10-11')).getAttribute('aria-label'),
      ).toContain('No shift')
    })
    await expect(canvas.getByRole('status')).toHaveTextContent('2 assignments removed.')
  },
}

/** The cell's menu (Enter): assign from the list, then "Move … to…" another day. */
export const MenuAndMove: Story = {
  name: 'Menu and move, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    const sunday = cell(canvasElement, 'Teodora Kovačević', day('2026-10-11'))
    sunday.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(await body.findByRole('menuitem', { name: /^Early/ }))
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Teodora Kovačević', day('2026-10-11')).getAttribute('aria-label'),
      ).toContain('Early, 07:00 to 15:00')
    })
    cell(canvasElement, 'Teodora Kovačević', day('2026-10-11')).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move Early to…' }))
    const dialog = await body.findByRole('dialog', { name: 'Move Early' })
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Day' }))
    await userEvent.click(await body.findByRole('option', { name: day('2026-10-10') }))
    await userEvent.click(await within(dialog).findByRole('button', { name: 'Move' }))
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Teodora Kovačević', day('2026-10-10')).getAttribute('aria-label'),
      ).toContain('Early')
    })
  },
}

/** Dragging: a template from the palette onto a day, and an assignment to another person. */
export const Dragging: Story = {
  name: 'Dragging, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const user = userEvent.setup()
    const drag = async (from: HTMLElement, to: HTMLElement, check?: () => Promise<void>) => {
      const a = from.getBoundingClientRect()
      const b = to.getBoundingClientRect()
      const start = { x: a.left + 8, y: a.top + a.height / 2 }
      const end = { x: b.left + b.width / 2, y: b.top + b.height / 2 }
      await user.pointer([
        { keys: '[MouseLeft>]', target: from, coords: { clientX: start.x, clientY: start.y } },
        { coords: { clientX: start.x + 8, clientY: start.y + 4 } },
        { coords: { clientX: (start.x + end.x) / 2, clientY: (start.y + end.y) / 2 } },
        { coords: { clientX: end.x, clientY: end.y } },
      ])
      await check?.()
      await user.pointer({ keys: '[/MouseLeft]', coords: { clientX: end.x, clientY: end.y } })
    }
    const palette = canvasElement.querySelector<HTMLElement>('[data-template="late"]')
    if (palette === null) throw new Error('no palette template')
    await drag(palette, cell(canvasElement, 'Jovana Marković', day('2026-10-11')), async () => {
      // While held: the template lifts and a neutral placeholder marks the cell.
      await expect(palette).toHaveAttribute('data-dragging')
      await expect(
        canvasElement.querySelector('[data-slot="shift-drop-placeholder"]'),
      ).not.toBeNull()
    })
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Jovana Marković', day('2026-10-11')).getAttribute('aria-label'),
      ).toContain('Late')
    })
    const chip = cell(
      canvasElement,
      'Jovana Marković',
      day('2026-10-05'),
    ).querySelector<HTMLElement>('[data-assignment]')
    if (chip === null) throw new Error('no assignment')
    await drag(chip, cell(canvasElement, 'Nemanja Pavlović', day('2026-10-05')))
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Nemanja Pavlović', day('2026-10-05')).getAttribute('aria-label'),
      ).toContain('Early')
    })
  },
}

/** "Apply rotation…": a pattern for two people over the week, reported as additions. */
export const Rotation: Story = {
  name: 'Rotation, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Planner status="draft" assignments={[]} conflicts={{}} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Apply rotation…' }))
    const dialog = await body.findByRole('dialog', { name: 'Apply a rotation' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await expect(dialog).toHaveTextContent('Choose at least one person.')
    const people = within(dialog).getByRole('combobox', { name: /People/ })
    await userEvent.click(people)
    await userEvent.type(people, 'Stefan', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await userEvent.type(people, 'Milica', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(within(dialog).getByRole('status')).toHaveTextContent(
      '10 assignments will be added.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await waitFor(async () => {
      await expect(
        cell(canvasElement, 'Milica Stojanović', day('2026-10-07')).getAttribute('aria-label'),
      ).toContain('Late, 15:00 to 23:00')
    })
  },
}

/** Publishing: the confirmation states the counts; the state becomes Published. */
export const Publishing: Story = {
  name: 'Publishing, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Publish' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await expect(dialog).toHaveTextContent(
      '27 shifts for 6 people will be visible to them. 3 conflicts are still open.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Publish' }))
    await waitFor(async () => {
      await expect(canvas.getByText('Published')).toBeVisible()
    })
    await expect(canvas.queryByRole('button', { name: 'Publish' })).toBeNull()
  },
}

/** "Go to" in the conflicts summary moves the focus to the cell; the period moves a week. */
export const GoToAndPeriod: Story = {
  name: 'Go to and period, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: `Go to Nemanja Pavlović, ${day('2026-10-10')}` }),
    )
    await waitFor(async () => {
      await expect(cell(canvasElement, 'Nemanja Pavlović', day('2026-10-10'))).toHaveFocus()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Next period' }))
    await expect(canvas.getAllByText('12.10.2026.').length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole('button', { name: 'Today' }))
    await expect(canvas.getAllByText('05.10.2026.').length).toBeGreaterThan(0)
    await userEvent.click(canvas.getByRole('radio', { name: 'By person' }))
    await expect(canvas.queryByRole('button', { name: 'Tills' })).toBeNull()
  },
}
