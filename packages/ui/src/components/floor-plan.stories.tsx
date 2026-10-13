import type { Meta, StoryObj } from '@storybook/react-vite'
import { Merge } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { FloorPlan, type FloorPlanProps } from './floor-plan'
import { applyFloorChanges, footprint, type FloorChange, type FloorItem } from './floor-plan-logic'
import {
  MANY_AREAS,
  MANY_AREAS_ITEMS,
  MANY_AREAS_SIZE,
  HOTEL_AREAS,
  HOTEL_ITEMS,
  HOTEL_SIZE,
  HOTEL_STATES,
  OVERLAP_ITEMS,
  OVERLAP_WARNINGS,
  RESTAURANT_AREAS,
  RESTAURANT_ITEMS,
  RESTAURANT_PALETTE,
  RESTAURANT_SIZE,
  RESTAURANT_STATES,
} from './floor-plan-story-data'
import {
  BIN_AREAS,
  BIN_ITEMS,
  BIN_SIZE,
  BIN_STATES,
  WARD_AREAS,
  WARD_BACKGROUND,
  WARD_BACKGROUND_DARK,
  WARD_ITEMS,
  WARD_SIZE,
  WARD_STATES,
} from './floor-plan-places-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/**
 * The application around the plan: it keeps the items, applies every change it is told about
 * (new items get the next id) and chooses what the user chose; an opened item is written under
 * the plan.
 */
function Plan(
  props: Partial<Omit<FloorPlanProps, 'items'>> & {
    initial?: readonly FloorItem[]
    /** Writes each reported change under the plan (the edit stories). */
    showChanges?: boolean
  },
) {
  const { initial, showChanges, ...rest } = props
  const [items, setItems] = useState<readonly FloorItem[]>(initial ?? RESTAURANT_ITEMS)
  const [opened, setOpened] = useState<string | null>(null)
  const [changes, setChanges] = useState<readonly FloorChange[]>([])
  return (
    <div className="flex flex-col gap-3">
      <FloorPlan
        label="Restoran Kej, dinner service"
        width={RESTAURANT_SIZE.width}
        height={RESTAURANT_SIZE.height}
        areas={RESTAURANT_AREAS}
        states={RESTAURANT_STATES}
        onItemActivate={(item) => {
          setOpened(item.label)
        }}
        {...rest}
        items={items}
        onChange={(next) => {
          setChanges((current) => [...current, ...next])
          setItems((current) =>
            applyFloorChanges(current, next, () => `new-${String(current.length + 1)}`),
          )
          rest.onChange?.(next)
        }}
      />
      {opened !== null && (
        <p className="m-0 text-sm text-secondary bidi-content" data-testid="opened">
          Opened: {opened}
        </p>
      )}
      {showChanges === true && changes.length > 0 && (
        <p className="m-0 text-sm text-secondary bidi-content" data-testid="changes">
          {changes.map((change) => change.type).join(', ')}
        </p>
      )}
    </div>
  )
}

/** The restaurant's states and areas with labels in another language, in the same order. */
function statesIn(labels: readonly string[]) {
  return RESTAURANT_STATES.map((state, index) => ({
    ...state,
    label: labels[index] ?? state.label,
  }))
}
function areasIn(labels: readonly string[]) {
  return RESTAURANT_AREAS.map((area, index) => ({ ...area, label: labels[index] ?? area.label }))
}

/** The element of an item on the plan. */
function itemOf(canvasElement: HTMLElement, id: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-floor-item="${id}"]`)
  if (element === null) throw new Error(`no item ${id}`)
  return element
}

/**
 * Every label written on the plan lies inside its item (P5.28 item 24: never cut); what does not
 * fit is left out (`data-fit`), not clipped.
 */
async function labelsFit(canvasElement: HTMLElement) {
  for (const label of canvasElement.querySelectorAll<HTMLElement>('[data-floor-label]')) {
    if (label.dataset.fit === 'none') continue
    const item = label.parentElement?.getBoundingClientRect()
    const box = label.getBoundingClientRect()
    if (item === undefined) continue
    await expect(box.width).toBeLessThanOrEqual(item.width + 0.5)
    await expect(box.height).toBeLessThanOrEqual(item.height + 0.5)
  }
}

const meta = {
  title: 'Components/FloorPlan',
  component: FloorPlan,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the plan of a place — a restaurant, a café terrace, a hotel floor, a ' +
          'hall — with its tables, rooms, seats and places where the application puts them (plan ' +
          'units), areas as plain labelled regions (no walls, doors or windows: a real building ' +
          'plan is the `background` image), and each item’s state in words, tone and icon (the ' +
          'states are the application’s map: free, occupied, reserved, needs cleaning are only ' +
          'examples). One item chosen or several; Enter or a press opens it (`onItemActivate`).\n\n' +
          '**A physical place:** the plan is not mirrored in a right-to-left page — the room does ' +
          'not turn round —, the page around it is. The arrow keys go to the nearest item in that ' +
          'direction on the plan. It scales to its width (HTML boxes placed in percentages), keeps ' +
          'its targets at least 24px on a wide screen (it scrolls in its box instead), and zooms ' +
          'in steps.\n\n' +
          '**Labels are never cut:** the number and the state’s icon, then the guests ' +
          '(`planDetail`) on a second line; what does not fit an item is left out (measured at ' +
          'every width), and the list and the name say everything — the time is in the list.\n\n' +
          '**Areas:** with two or more, “All areas” or one at a time (a segmented control up to ' +
          'four, a select beyond); one area is drawn alone, fitted to the width. Takeaway and ' +
          'delivery are order channels of the till, not areas.\n\n' +
          '**List:** "Plan / List" shows the same items grouped by area with state, capacity and ' +
          'note — the accessible and the phone alternative. Phones open on it, a card per item; ' +
          'the plan, when opened, fits the screen’s width; there is no edit mode on a phone.\n\n' +
          '**Edit mode:** add from the palette; move by dragging (snapped to the grid), by the ' +
          'keys (Space picks up, arrows 1 unit, Shift 5, Space drops) or "Move to…"; resize by the ' +
          'corner or "Size…"; rotate 90°, duplicate, remove. The plan reports every change ' +
          '(`onChange`) and saves nothing; overlapping items are allowed and the application’s ' +
          '`warnings` flag them.\n\n' +
          '**When:** where the place itself matters — which table is by the window, which room is ' +
          'next to the lift. **When not:** records without a place (DataTable); bookings over time ' +
          '(ResourceSchedule); an event’s seats and guests (SeatingChart, built on this).',
      },
    },
  },
  args: {
    label: 'Restoran Kej, dinner service',
    items: RESTAURANT_ITEMS,
    width: RESTAURANT_SIZE.width,
    height: RESTAURANT_SIZE.height,
  },
  render: () => (
    <ExampleProvider>
      <Plan />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof FloorPlan>

export default meta

type Story = StoryObj<typeof meta>

/** Saturday's dinner service: the hall, the terrace and the bar, every table in its state. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', {
        name: 'Table 3, 4 guests · at 19:30, Reserved, 4 seats, Hall, Window seat asked for',
      }),
    ).toBeVisible()
    // On the plan: the number and the state, then the guests; the time is in the list (P5.28).
    await expect(itemOf(canvasElement, 't3')).toHaveTextContent('34 guests')
    await expect(itemOf(canvasElement, 't3')).not.toHaveTextContent('19:30')
    await labelsFit(canvasElement)
    // All areas, or one at a time (P5.28 item 26).
    await expect(canvas.getByRole('radio', { name: 'All areas' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvas.getByRole('list', { name: 'States' })).toHaveTextContent('Needs cleaning')
    // The plan is a physical place: never mirrored.
    await expect(
      canvasElement.querySelector('[data-slot="floor-plan-canvas"]')?.getAttribute('dir'),
    ).toBe('ltr')
    // Fixtures are drawn, not targets, outside edit mode; no walls, doors or windows (P5.28).
    await expect(itemOf(canvasElement, 'piano')).toHaveAttribute('aria-hidden', 'true')
  },
}

/** One table chosen: the 2px neutral frame and `aria-pressed`. */
export const Chosen: Story = {
  render: () => (
    <ExampleProvider>
      <Plan defaultSelected={['t7']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(itemOf(canvasElement, 't7')).toHaveAttribute('aria-pressed', 'true')
    await expect(itemOf(canvasElement, 't7')).toHaveAttribute('tabindex', '0')
    await expect(itemOf(canvasElement, 't1')).toHaveAttribute('tabindex', '-1')
  },
}

/** Several chosen (`selectionMode="multiple"`), e.g. the tables a party will take. */
export const SeveralChosen: Story = {
  name: 'Several chosen',
  render: () => (
    <ExampleProvider>
      <Plan selectionMode="multiple" defaultSelected={['t3', 't4']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(itemOf(canvasElement, 't3')).toHaveAttribute('aria-pressed', 'true')
    await expect(itemOf(canvasElement, 't4')).toHaveAttribute('aria-pressed', 'true')
  },
}

/**
 * The keys: from table 1 ArrowRight goes to table 2 and ArrowDown to table 5 — on the plan, in
 * both directions of the page; End goes to the last item; Enter opens it.
 */
export const Keyboard: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    itemOf(canvasElement, 't1').focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(itemOf(canvasElement, 't2')).toHaveFocus()
    await expect(itemOf(canvasElement, 't2')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{ArrowLeft}{ArrowDown}')
    await expect(itemOf(canvasElement, 't5')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(within(canvasElement).getByTestId('opened')).toHaveTextContent('Opened: Table 5')
    // Home goes to the first item in reading order: table 11, the terrace's, stands highest.
    await userEvent.keyboard('{Home}')
    await expect(itemOf(canvasElement, 't11')).toHaveFocus()
  },
}

/** A press chooses and opens. In multiple mode a press adds or removes. */
export const Pressing: Story = {
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Plan selectionMode="multiple" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(itemOf(canvasElement, 't13'))
    await userEvent.click(itemOf(canvasElement, 't15'))
    await expect(itemOf(canvasElement, 't13')).toHaveAttribute('aria-pressed', 'true')
    await expect(itemOf(canvasElement, 't15')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(itemOf(canvasElement, 't13'))
    await expect(itemOf(canvasElement, 't13')).toHaveAttribute('aria-pressed', 'false')
    itemOf(canvasElement, 't15').focus()
    await userEvent.keyboard(' ')
    await expect(itemOf(canvasElement, 't15')).toHaveAttribute('aria-pressed', 'false')
  },
}

/** The list: the same items by area, with state, capacity, detail and note. */
export const ListView: Story = {
  name: 'List',
  render: () => (
    <ExampleProvider>
      <Plan defaultView="list" defaultSelected={['t9']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Terrace' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Table 9/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvasElement).toHaveTextContent('Broken leg, waiting for the carpenter')
    await expect(canvas.queryByText('Piano')).toBeNull()
  },
}

/** Switching to the list and back. */
export const SwitchingViews: Story = {
  name: 'Switching views',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'List' }))
    await expect(canvas.getByRole('heading', { name: 'Hall' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Table 14/ }))
    await expect(canvas.getByTestId('opened')).toHaveTextContent('Opened: Table 14')
    await userEvent.click(canvas.getByRole('radio', { name: 'Plan' }))
    await expect(itemOf(canvasElement, 't14')).toHaveAttribute('aria-pressed', 'true')
  },
}

/** One area at a time (P5.28 item 26): the terrace alone, cropped and fitted. */
export const OneArea: Story = {
  name: 'One area',
  render: () => (
    <ExampleProvider>
      <Plan defaultArea="terrace" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('radio', { name: 'Terrace' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(canvasElement.querySelector('[data-floor-item="t1"]')).toBeNull()
    await expect(itemOf(canvasElement, 't15')).toBeVisible()
    await labelsFit(canvasElement)
  },
}

/** The switcher: the bar alone, its tables in the list too, then all areas again. */
export const ChoosingAnArea: Story = {
  name: 'Choosing an area, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: 'Bar' }))
    await expect(canvasElement.querySelector('[data-floor-item="t3"]')).toBeNull()
    await expect(itemOf(canvasElement, 't16')).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: 'List' }))
    await expect(canvas.queryByRole('heading', { name: 'Hall' })).toBeNull()
    await expect(canvas.getByRole('heading', { name: 'Bar' })).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: 'All areas' }))
    await expect(canvas.getByRole('heading', { name: 'Hall' })).toBeVisible()
  },
}

/** Seven areas: the switcher is a select, usable with many areas (P5.28 item 26). */
export const ManyAreas: Story = {
  name: 'Many areas',
  render: () => (
    <ExampleProvider>
      <Plan
        label="Vila Dunav, dinner service"
        initial={MANY_AREAS_ITEMS}
        areas={MANY_AREAS}
        width={MANY_AREAS_SIZE.width}
        height={MANY_AREAS_SIZE.height}
        defaultArea="garden"
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const area = within(canvasElement).getByRole('combobox', { name: 'Area' })
    await expect(area).toHaveTextContent('Garden')
    await expect(canvasElement.querySelector('[data-floor-item="t1"]')).toBeNull()
    await labelsFit(canvasElement)
  },
}

/** Seven areas on a phone: the list by area, the switcher a select across the width. */
export const ManyAreasPhone: Story = {
  name: 'Many areas, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Plan
            layout="phone"
            label="Vila Dunav, dinner service"
            initial={MANY_AREAS_ITEMS}
            areas={MANY_AREAS}
            width={MANY_AREAS_SIZE.width}
            height={MANY_AREAS_SIZE.height}
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('combobox', { name: 'Area' })).toHaveTextContent(
      'All areas',
    )
    await expect(
      within(canvasElement).getByRole('heading', { name: 'Winter garden' }),
    ).toBeVisible()
  },
}

/** Zoomed in twice (the plan scrolls inside its box); zoom out and fit. */
export const Zoomed: Story = {
  render: () => (
    <ExampleProvider>
      <Plan defaultZoom={2} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan-viewport"]')
    if (viewport === null) throw new Error('no viewport')
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth)
    await expect(within(canvasElement).getByRole('button', { name: 'Fit to width' })).toBeEnabled()
  },
}

/** The zoom buttons: in, in, out, fit. */
export const Zooming: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const plan = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan-canvas"]')
    if (plan === null) throw new Error('no plan')
    await expect(canvas.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await expect(plan.style.width).toBe('200%')
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom out' }))
    await expect(plan.style.width).toBe('150%')
    await userEvent.click(canvas.getByRole('button', { name: 'Fit to width' }))
    await expect(plan.style.width).toBe('100%')
  },
}

/**
 * Edit mode: the palette, the chosen table's actions and its corner handle, the grid; table 10
 * was pushed onto table 7 and the application warns about the overlap.
 */
export const Editing: Story = {
  render: () => (
    <ExampleProvider>
      <Plan
        editing
        palette={RESTAURANT_PALETTE}
        initial={OVERLAP_ITEMS}
        warnings={OVERLAP_WARNINGS}
        defaultSelected={['t10']}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'Change Table 10' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Add' })).toHaveTextContent('Round table')
    await expect(
      canvas.getByRole('button', {
        name: /^Table 10, Free, 4 seats, Hall, Warning: Overlaps Table 7$/,
      }),
    ).toBeVisible()
    // In edit mode the fixtures can be chosen too.
    await expect(itemOf(canvasElement, 'piano').tagName).toBe('BUTTON')
    await expect(canvasElement.querySelector('[data-slot="floor-resize"]')).not.toBeNull()
  },
}

/** "Move to…" open for the chosen table: x and y in plan units. */
export const MoveToDialog: Story = {
  name: 'Editing, Move to…',
  render: () => (
    <ExampleProvider>
      <Plan editing palette={RESTAURANT_PALETTE} defaultSelected={['t4']} defaultDialog="move" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', { name: 'Move Table 4' })
    await expect(within(dialog).getByRole('textbox', { name: 'X' })).toHaveValue('580')
    await expect(within(dialog).getByRole('textbox', { name: 'Y' })).toHaveValue('80')
  },
}

/** "Size…" open for the chosen table. */
export const SizeDialog: Story = {
  name: 'Editing, Size…',
  render: () => (
    <ExampleProvider>
      <Plan editing palette={RESTAURANT_PALETTE} defaultSelected={['t9']} defaultDialog="size" />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
    // The action, then the item on its own line (P5.28 item 6).
    const dialog = within(document.body).getByRole('dialog', { name: 'Resize Table 9' })
    await expect(within(dialog).getByRole('textbox', { name: 'Width' })).toHaveValue('340')
  },
}

/**
 * The keys in edit mode: Space picks up table 4, ArrowLeft moves it 1 unit and Shift+ArrowDown
 * 5, Space drops it — each step announced, one move reported; Escape cancels another.
 */
export const EditingKeyboard: Story = {
  name: 'Editing, keyboard',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Plan editing palette={RESTAURANT_PALETTE} showChanges />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    itemOf(canvasElement, 't4').focus()
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('status')).toHaveTextContent('Picked up Table 4 at 580, 80.')
    await userEvent.keyboard('{ArrowLeft}{Shift>}{ArrowDown}{/Shift}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Table 4: 579, 85.')
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('status')).toHaveTextContent('Dropped Table 4 at 579, 85.')
    await expect(canvas.getByTestId('changes')).toHaveTextContent('move')
    await expect(itemOf(canvasElement, 't4').style.insetInlineStart).toBe('48.25%')
    await userEvent.keyboard(' {ArrowRight}{Escape}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Move cancelled.')
    await expect(itemOf(canvasElement, 't4').style.insetInlineStart).toBe('48.25%')
  },
}

/** Dragging table 10 with the pointer: it snaps to the 10-unit grid. */
export const EditingDrag: Story = {
  name: 'Editing, dragging',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Plan editing palette={RESTAURANT_PALETTE} showChanges />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const table = itemOf(canvasElement, 't10')
    const box = table.getBoundingClientRect()
    const start = { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: table, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + 10, clientY: start.y } },
      { coords: { clientX: start.x + 80, clientY: start.y + 40 } },
    ])
    await expect(canvasElement.querySelector('[data-slot="floor-placeholder"]')).not.toBeNull()
    await user.pointer({
      keys: '[/MouseLeft]',
      coords: { clientX: start.x + 80, clientY: start.y + 40 },
    })
    await waitFor(async () => {
      await expect(within(canvasElement).getByTestId('changes')).toHaveTextContent('move')
    })
    const left = Number.parseFloat(itemOf(canvasElement, 't10').style.insetInlineStart)
    await expect(left).toBeGreaterThan(40)
    await expect(Math.round((left / 100) * RESTAURANT_SIZE.width) % 10).toBe(0)
  },
}

/** The chosen table's buttons: Rotate, Duplicate, Size… (typed), Remove; and the palette. */
export const EditingActions: Story = {
  name: 'Editing, actions',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Plan editing palette={RESTAURANT_PALETTE} defaultSelected={['t9']} showChanges />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Rotate 90°' }))
    const turned = footprint({ id: 't9', x: 60, y: 520, width: 340, height: 110, rotation: 90 })
    await expect(Number.parseFloat(itemOf(canvasElement, 't9').style.width)).toBeCloseTo(
      (turned.width / RESTAURANT_SIZE.width) * 100,
      3,
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Duplicate' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Size…' }))
    const dialog = await body.findByRole('dialog', { name: 'Resize Table 9' })
    const width = within(dialog).getByRole('textbox', { name: 'Width' })
    await userEvent.clear(width)
    await userEvent.type(width, '5000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await expect(dialog).toHaveTextContent('Enter a whole number from 5 to')
    await userEvent.clear(width)
    await userEvent.type(width, '120')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Apply' }))
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Round table' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Round table added.')
    await userEvent.click(canvas.getByRole('button', { name: 'Remove' }))
    await expect(canvas.getByTestId('changes')).toHaveTextContent(
      'rotate, add, resize, add, remove',
    )
    await expect(canvasElement.querySelector('[data-floor-item="t9"]')).toBeNull()
  },
}

/** Merging two tables is the application's: it adds its own button to the toolbar. */
export const ApplicationToolbar: Story = {
  name: 'Editing, the application’s toolbar',
  render: () => (
    <ExampleProvider>
      <Plan
        editing
        selectionMode="multiple"
        palette={RESTAURANT_PALETTE}
        defaultSelected={['t3', 't4']}
        toolbar={<Button family="neutral" icon={Merge} label="Merge tables 3 and 4" />}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Merge tables 3 and 4' })).toBeVisible()
    await expect(canvas.getByRole('group', { name: '2 chosen' })).toBeVisible()
  },
}

/** Warnings outside edit mode, with "Go to". */
export const Warnings: Story = {
  render: () => (
    <ExampleProvider>
      <Plan
        warnings={[
          { itemId: 't9', text: 'The party grew to 12; the table takes 10.', tone: 'danger' },
          { itemId: 't6', text: 'Waiting for cleaning since 19:10.' },
        ]}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Warnings' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Go to Table 9' })).toBeVisible()
  },
}

/** "Go to" moves the focus to the item on the plan. */
export const WarningsGoTo: Story = {
  name: 'Warnings, Go to',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Plan warnings={[{ itemId: 't6', text: 'Waiting for cleaning since 19:10.' }]} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Go to Table 6' }))
    await expect(itemOf(canvasElement, 't6')).toHaveFocus()
  },
}

/** A plan to read only: no choosing, no opening; the items are named pictures. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <FloorPlan
        label="Restoran Kej, dinner service"
        items={RESTAURANT_ITEMS}
        width={RESTAURANT_SIZE.width}
        height={RESTAURANT_SIZE.height}
        areas={RESTAURANT_AREAS}
        states={RESTAURANT_STATES}
        selectionMode="none"
        legend={false}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /^Table/ })).toBeNull()
    await expect(
      canvas.getByRole('img', { name: /^Table 7, 6 guests · at 20:00, Reserved/ }),
    ).toBeVisible()
    await expect(canvas.queryByRole('list', { name: 'States' })).toBeNull()
  },
}

/** Loading: a skeleton of the plan's shape. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Plan loading />
    </ExampleProvider>
  ),
}

/** No items yet. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Plan initial={[]} />
    </ExampleProvider>
  ),
}

/** No items yet, in edit mode: the palette adds the first. */
export const EmptyEditing: Story = {
  name: 'Empty, editing',
  render: () => (
    <ExampleProvider>
      <Plan initial={[]} editing palette={RESTAURANT_PALETTE} />
    </ExampleProvider>
  ),
}

/** Long names, notes and details: whole in the list and in every name. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Plan
        defaultView="list"
        initial={RESTAURANT_ITEMS.map((item) =>
          item.id === 't9'
            ? {
                ...item,
                label: 'Table 9 by the long window with the view of the Petrovaradin fortress',
                detail: '20:30 · 10 guests, the Nikolić family birthday dinner',
                note: 'Birthday: the cake is in the cold room; bring it at 22:00 with candles and the song, and the family asks for the corner to stay quiet.',
              }
            : item,
        )}
      />
    </ExampleProvider>
  ),
}

/**
 * The same plan with long second lines: a line that does not fit its table is left out on the
 * plan, never cut (P5.28 item 24); the list and the name say it whole.
 */
export const LongTextPlan: Story = {
  name: 'Long text, plan',
  render: () => (
    <ExampleProvider>
      <Plan
        initial={RESTAURANT_ITEMS.map((item) =>
          item.kind === 'table'
            ? {
                ...item,
                planDetail: 'Walk-in, 2 guests by the window',
                detail: item.detail ?? 'Walk-in, 2 guests by the window',
              }
            : item,
        )}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await labelsFit(canvasElement)
    await expect(
      canvasElement.querySelector('[data-floor-item="t9"] [data-floor-label]'),
    ).toHaveAttribute('data-fit', 'all')
    await expect(
      canvasElement.querySelector('[data-floor-item="t1"] [data-floor-label]'),
    ).toHaveAttribute('data-fit', 'name')
  },
}

/** A hotel floor: rooms in their housekeeping states. */
export const HotelFloor: Story = {
  name: 'Hotel floor',
  render: () => (
    <ExampleProvider>
      <FloorPlan
        label="Hotel Dunav, floor 2"
        items={HOTEL_ITEMS}
        width={HOTEL_SIZE.width}
        height={HOTEL_SIZE.height}
        areas={HOTEL_AREAS}
        states={HOTEL_STATES}
        onItemActivate={() => undefined}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', {
        name: 'Room 205, Out of order, 2 seats, Floor 2, Shower leaking, plumber on Monday',
      }),
    ).toBeVisible()
  },
}

/** On a phone the plan opens on the list. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Plan layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const plan = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan"]')
    await expect(plan?.dataset.view).toBe('list')
    if (plan !== null) await expect(plan.scrollWidth).toBeLessThanOrEqual(plan.clientWidth)
  },
}

/**
 * On a phone, the plan view when opened: it fits the screen's width, no sideways scrolling
 * (P5.28 item 27); a label that does not fit its table leaves out its second line or its icon,
 * never cut. The list is the equivalent of the small targets (WCAG 2.5.8).
 */
export const PhonePlan: Story = {
  name: 'Phone width, plan',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Plan layout="phone" defaultView="plan" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const viewport = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan-viewport"]')
    if (viewport === null) throw new Error('no viewport')
    await expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth)
    await labelsFit(canvasElement)
  },
}

/** On a phone, one area: the terrace alone fills the width, its tables larger. */
export const PhoneArea: Story = {
  name: 'Phone width, one area',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Plan layout="phone" defaultView="plan" defaultArea="terrace" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-floor-item="t1"]')).toBeNull()
    await expect(itemOf(canvasElement, 't14')).toBeVisible()
    await labelsFit(canvasElement)
  },
}

/** Edit mode is not offered on a phone (P5.28 item 27): a note says where to edit. */
export const PhoneEditing: Story = {
  name: 'Phone width, editing',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Plan layout="phone" editing palette={RESTAURANT_PALETTE} defaultSelected={['t4']} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Edit the plan on a computer or tablet.')).toBeVisible()
    await expect(canvas.queryByRole('group', { name: 'Add' })).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Move to…' })).toBeNull()
  },
}

/** Arabic names in a right-to-left page: the page turns, the plan does not. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Plan
        label="مطعم كيه، خدمة العشاء"
        states={statesIn(['متاحة', 'مشغولة', 'محجوزة', 'تحتاج إلى تنظيف', 'محظورة'])}
        areas={areasIn(['القاعة', 'الشرفة', 'البار'])}
        initial={RESTAURANT_ITEMS.map((item) => ({
          ...item,
          label:
            item.kind === 'table'
              ? `طاولة ${item.shortLabel ?? ''}`
              : item.label === 'Bar counter'
                ? 'منضدة البار'
                : 'بيانو',
          ...(item.note === undefined ? {} : { note: 'ملاحظة من النادل' }),
        }))}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      canvasElement.querySelector('[data-slot="floor-plan-canvas"]')?.getAttribute('dir'),
    ).toBe('ltr')
  },
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Plan
        label="レストラン・ケイ、ディナー"
        states={statesIn(['空席', '使用中', '予約済み', '清掃待ち', '使用不可'])}
        areas={areasIn(['ホール', 'テラス', 'バー'])}
        defaultView="list"
        initial={RESTAURANT_ITEMS.map((item) => ({
          ...item,
          label:
            item.kind === 'table'
              ? `テーブル ${item.shortLabel ?? ''}`
              : item.kind === 'bar'
                ? 'バーカウンター'
                : 'ピアノ',
          ...(item.note === undefined ? {} : { note: '窓際の席を希望' }),
        }))}
      />
    </StoryProvider>
  ),
}

// ── P5.25a: the building's drawing under the plan, polygon areas, how full ──

/** The building's drawing is drawn (a `data:` URI decodes at once; the play waits for it). */
async function drawingShown(canvasElement: HTMLElement) {
  await waitFor(async () => {
    const image = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="floor-plan-background"]',
    )
    await expect(image?.complete === true && image.naturalWidth > 0).toBe(true)
  })
}

/** Ward 3B as its plan: the building's drawing, rooms (two of them polygons) and beds. */
function Ward({ drawing = true, ...props }: Partial<FloorPlanProps> & { drawing?: boolean }) {
  return (
    <FloorPlan
      label="Ward 3B, beds"
      items={WARD_ITEMS}
      width={WARD_SIZE.width}
      height={WARD_SIZE.height}
      areas={WARD_AREAS}
      states={WARD_STATES}
      {...(drawing ? { background: WARD_BACKGROUND } : {})}
      onItemActivate={() => undefined}
      {...props}
    />
  )
}

/**
 * The building's own drawing under the plan (`background`, an image placed and scaled in plan
 * units): a ward's walls, doors and windows under its rooms and beds. The rooms are areas — four
 * rectangles, and the corridor with its lobby and room 5 round it as polygons; over a drawing the
 * areas are outlines only and their names stand on a small raised tag. The image is decorative:
 * the plan is read through its beds and the list. In the dark theme the drawing is inverted
 * (light lines), as no dark image is given.
 */
export const Background: Story = {
  render: () => (
    <ExampleProvider>
      <Ward />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    const image = canvasElement.querySelector('[data-slot="floor-plan-background"]')
    await expect(image).toHaveAttribute('alt', '')
    await expect(image).toHaveAttribute('aria-hidden', 'true')
    await expect(
      within(canvasElement).getByRole('button', {
        name: 'Bed 10, Blocked, Room 4, Oxygen outlet faulty; maintenance on 07.10.',
      }),
    ).toBeVisible()
    // Room 5's name is centred on its labelAt, the corridor's on its centroid.
    await expect(canvasElement.querySelector('[data-floor-area-label="r5"]')).toHaveTextContent(
      'Room 5',
    )
  },
}

/**
 * The application's own image for the dark theme (`srcDark`, white lines), placed on part of the
 * plan only (`x`, `y`, `width`, `height` in plan units) and faded (`opacity` 0.6); `alt` makes it
 * an image with words.
 */
export const BackgroundOwnDark: Story = {
  name: 'Background, own dark image',
  render: () => (
    <ExampleProvider>
      <Ward
        label="Ward 3B, beds (the drawing set in the plan)"
        width={1300}
        height={760}
        background={{
          ...WARD_BACKGROUND,
          srcDark: WARD_BACKGROUND_DARK,
          x: 50,
          y: 30,
          width: WARD_SIZE.width,
          height: WARD_SIZE.height,
          opacity: 0.6,
          alt: 'Drawing of ward 3B: six rooms along a corridor',
        }}
        areas={[]}
        items={WARD_ITEMS.map((item) => ({ ...item, x: item.x + 50, y: item.y + 30 }))}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    const image = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="floor-plan-background"]',
    )
    await expect(image).toHaveAccessibleName('Drawing of ward 3B: six rooms along a corridor')
    const dark = image?.closest('[data-liro-theme]')?.getAttribute('data-liro-theme') === 'dark'
    await expect(image?.getAttribute('src')).toBe(dark ? WARD_BACKGROUND_DARK : WARD_BACKGROUND.src)
    await expect(image?.style.opacity).toBe('0.6')
  },
}

/** Zoomed in: the drawing grows and scrolls with the beds, aligned. */
export const BackgroundZoomed: Story = {
  name: 'Background, zoomed',
  render: () => (
    <ExampleProvider>
      <Ward defaultZoom={2} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    const canvas = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan-canvas"]')
    const image = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan-background"]')
    // The drawing covers the plan at every zoom.
    await expect(image?.getBoundingClientRect().width).toBeCloseTo(
      canvas?.getBoundingClientRect().width ?? 0,
      0,
    )
  },
}

/** Edit mode over the drawing: the grid's dots over it, a bed chosen. */
export const BackgroundEditing: Story = {
  name: 'Background, editing',
  render: () => (
    <ExampleProvider>
      <Plan
        label="Ward 3B, beds"
        initial={WARD_ITEMS}
        width={WARD_SIZE.width}
        height={WARD_SIZE.height}
        areas={WARD_AREAS}
        states={WARD_STATES}
        background={WARD_BACKGROUND}
        editing
        palette={[{ id: 'bed', kind: 'place', label: 'Bed', width: 70, height: 140 }]}
        defaultSelected={['b7']}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    await expect(within(canvasElement).getByRole('group', { name: 'Change Bed 7' })).toBeVisible()
  },
}

/** Polygon areas without a drawing: filled like rectangles, names at labelAt or the centroid. */
export const PolygonAreas: Story = {
  name: 'Polygon areas',
  render: () => (
    <ExampleProvider>
      <Ward drawing={false} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="floor-plan-background"]')).toBeNull()
    const corridor = canvasElement.querySelector('svg[data-floor-area="corridor"] polygon')
    await expect(corridor?.getAttribute('points')).toBe(
      '0,300 1200,300 1200,400 700,400 700,520 500,520 500,400 0,400',
    )
  },
}

/** The list groups the beds by room, polygons and rectangles alike. */
export const PolygonAreasList: Story = {
  name: 'Polygon areas, list',
  render: () => (
    <ExampleProvider>
      <Ward defaultView="list" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const headings = within(canvasElement)
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)
    await expect(headings).toEqual(['Room 1', 'Room 2', 'Room 3', 'Room 4', 'Room 5', 'Isolation'])
  },
}

/** Bins of a store room with how full each is (`level`): a bar on the plan, words in the name. */
export const Level: Story = {
  render: () => (
    <ExampleProvider>
      <FloorPlan
        label="Store room, bins"
        items={BIN_ITEMS}
        width={BIN_SIZE.width}
        height={BIN_SIZE.height}
        areas={BIN_AREAS}
        states={BIN_STATES}
        onItemActivate={() => undefined}
        defaultSelected={['A-02-03']}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('button', { name: 'A-01-03, Low, 15% full, Zone A' }),
    ).toBeVisible()
    // The application's own words for a level.
    await expect(
      canvas.getByRole('button', {
        name: 'B-02-04, Blocked, About 40% full, Zone B, Shelf damaged by a forklift',
      }),
    ).toBeVisible()
    const bar = itemOf(canvasElement, 'B-BULK').querySelector<HTMLElement>(
      '[data-slot="floor-level"] > span',
    )
    await expect(bar?.style.width).toBe('clamp(0%, 62.5%, 100%)')
  },
}

/** The bins in the list: the level in words and a bar beside the state. */
export const LevelList: Story = {
  name: 'Level, list',
  render: () => (
    <ExampleProvider>
      <FloorPlan
        label="Store room, bins"
        items={BIN_ITEMS}
        width={BIN_SIZE.width}
        height={BIN_SIZE.height}
        areas={BIN_AREAS}
        states={BIN_STATES}
        onItemActivate={() => undefined}
        defaultView="list"
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('42,5% full')
    await expect(canvasElement).toHaveTextContent('About 40% full')
  },
}

/** On a phone: the ward's plan over its drawing, scrolling inside its box. */
export const BackgroundPhone: Story = {
  name: 'Background, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Ward layout="phone" defaultView="plan" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    const plan = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan"]')
    if (plan !== null) await expect(plan.scrollWidth).toBeLessThanOrEqual(plan.clientWidth)
  },
}

/** On a phone: the bins as a list, with their levels. */
export const LevelPhone: Story = {
  name: 'Level, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <FloorPlan
            label="Store room, bins"
            items={BIN_ITEMS}
            width={BIN_SIZE.width}
            height={BIN_SIZE.height}
            areas={BIN_AREAS}
            states={BIN_STATES}
            onItemActivate={() => undefined}
            layout="phone"
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const plan = canvasElement.querySelector<HTMLElement>('[data-slot="floor-plan"]')
    await expect(plan?.dataset.view).toBe('list')
    if (plan !== null) await expect(plan.scrollWidth).toBeLessThanOrEqual(plan.clientWidth)
  },
}

/** Arabic room names over the drawing in a right-to-left page: the plan is not mirrored. */
export const BackgroundArabic: Story = {
  name: 'Background, Arabic',
  render: () => (
    <StoryProvider locale="ar">
      <Ward
        label="الجناح 3ب، الأسرّة"
        areas={WARD_AREAS.map((area, index) => ({
          ...area,
          label:
            [
              'الغرفة 1',
              'الغرفة 2',
              'الغرفة 3',
              'محطة التمريض',
              'الممر',
              'الغرفة 4',
              'الغرفة 5',
              'العزل',
            ][index] ?? area.label,
        }))}
        items={WARD_ITEMS.map((item) => ({ ...item, label: `سرير ${item.shortLabel ?? ''}` }))}
        states={WARD_STATES.map((state, index) => ({
          ...state,
          label: ['متاح', 'مشغول', 'يحتاج إلى تنظيف', 'محظور'][index] ?? state.label,
        }))}
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await drawingShown(canvasElement)
    await expect(
      canvasElement.querySelector('[data-slot="floor-plan-canvas"]')?.getAttribute('dir'),
    ).toBe('ltr')
  },
}

/** Japanese bin names and the level's words in the list. */
export const LevelJapanese: Story = {
  name: 'Level, Japanese',
  render: () => (
    <StoryProvider locale="ja">
      <FloorPlan
        label="倉庫、棚"
        items={BIN_ITEMS.map((item) =>
          item.id === 'B-BULK' ? { ...item, label: 'バルク置き場 B', detail: 'パレット 4' } : item,
        )}
        width={BIN_SIZE.width}
        height={BIN_SIZE.height}
        areas={BIN_AREAS.map((area, index) => ({
          ...area,
          label: ['ゾーン A', 'ゾーン B'][index] ?? area.label,
        }))}
        states={BIN_STATES.map((state, index) => ({
          ...state,
          label: ['在庫あり', '残りわずか', '空', '使用不可'][index] ?? state.label,
        }))}
        onItemActivate={() => undefined}
        defaultView="list"
      />
    </StoryProvider>
  ),
}
