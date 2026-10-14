import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { IconButton } from '../components/button'
import type { ScanFeedback } from '../components/scan-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import type { PickStep } from '../components/warehouse-logic'
import {
  PICK_LINES,
  PICK_LINES_DONE,
  PICK_SUBTITLE,
  PICK_TITLE,
  SKIP_REASONS,
} from '../components/warehouse-story-data'
import { PickList, type PickListProps } from './pick-list'

/** A handheld scanner's screen: 360 × 740, touch density, Serbian figures. */
function Handheld({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame width={360} height={740}>
      <StoryProvider density="touch">
        <ExampleProvider>{children}</ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  )
}

const MENU = <IconButton intent="more" label="List menu" />

function Picking(props: Partial<PickListProps>) {
  return (
    <Handheld>
      <PickList
        title={PICK_TITLE}
        subtitle={PICK_SUBTITLE}
        lines={PICK_LINES}
        currentId="l5"
        step="location"
        onScan={() => undefined}
        onConfirm={() => undefined}
        onSkip={() => undefined}
        skipReasons={SKIP_REASONS}
        onSelectLine={() => undefined}
        onCameraScan={() => undefined}
        actions={MENU}
        {...props}
      />
    </Handheld>
  )
}

/** The application around the list: checks each scan against the current line. */
function PickingDemo({ onConfirm }: { onConfirm: (id: string, quantity: string | null) => void }) {
  const [step, setStep] = useState<PickStep>('location')
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  return (
    <Picking
      step={step}
      feedback={feedback}
      onScan={(code, at) => {
        const line = PICK_LINES.find((item) => item.id === 'l5')
        const expected = at === 'location' ? line?.location : line?.itemCode
        if (code === expected) {
          setFeedback({
            id: Date.now(),
            tone: 'success',
            text: at === 'location' ? `Location ${code}` : (line?.item ?? ''),
          })
          setStep(at === 'location' ? 'item' : 'quantity')
        } else {
          setFeedback({
            id: Date.now(),
            tone: 'error',
            text: `Wrong ${at === 'location' ? 'location' : 'item'}: ${code}`,
          })
        }
      }}
      onConfirm={onConfirm}
    />
  )
}

const meta = {
  title: 'Components/Warehouse/PickList',
  component: PickList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** picking on a handheld at 360px: the current line large (location, item, ' +
          'quantity to pick, picked so far), its steps in order — scan the location, scan the item, ' +
          'confirm the quantity — the progress “4 of 12”, skipping with a reason, and the route ' +
          'with every line’s state in words. **The application checks every scan** and moves the ' +
          'step and the line; the screen reports and shows its answer (with sound and vibration ' +
          'through `onFeedback`). Offline, the strip and the queue.\n\n' +
          '**When:** picking an order, a transfer, a replenishment.\n\n' +
          '**When not:** a desktop list of pick lists (ListPage); counting stock (StockCount).',
      },
    },
  },
  args: {
    title: PICK_TITLE,
    lines: PICK_LINES,
    currentId: 'l5',
    step: 'location',
    onScan: () => undefined,
    onConfirm: () => undefined,
  },
  render: () => <Picking />,
  play: settle,
} satisfies Meta<typeof PickList>

export default meta

type Story = StoryObj<typeof meta>

/** Line 5 of 12: scan its location. */
export const Default: Story = {
  name: 'Scan the location',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('4 of 12')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Location code' })).toBeVisible()
  },
}

/** The location confirmed; scan the item. */
export const ScanItem: Story = {
  name: 'Scan the item',
  render: () => (
    <Picking step="item" feedback={{ id: 1, tone: 'success', text: 'Location B-04-02' }} />
  ),
}

/** A wrong item scanned: the problem in words. */
export const WrongItem: Story = {
  name: 'Wrong item',
  render: () => (
    <Picking
      step="item"
      feedback={{
        id: 2,
        tone: 'error',
        text: 'This is Gips ploča 12,5 mm, not Fasadna mrežica. Put it back on C-01-01.',
      }}
    />
  ),
}

/** Both scanned; confirm the quantity. */
export const ConfirmQuantity: Story = {
  name: 'Confirm the quantity',
  render: () => <Picking step="quantity" />,
}

/**
 * Skipping with a reason (the dialog open, as restored). On the whole screen rather than in the
 * handheld frame: the confirmation is an alertdialog, and axe knows a modal is open only when its
 * backdrop covers the screen.
 */
export const Skip: Story = {
  name: 'Skip with a reason',
  render: () => (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="h-185 max-w-90">
          <PickList
            title={PICK_TITLE}
            subtitle={PICK_SUBTITLE}
            lines={PICK_LINES}
            currentId="l5"
            step="item"
            onScan={() => undefined}
            onConfirm={() => undefined}
            onSkip={() => undefined}
            skipReasons={SKIP_REASONS}
            defaultSkipOpen
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async () => {
    await settle()
    await expect(
      within(document.body).getByRole('alertdialog', { name: /^Skip line Fasadna mrežica/ }),
    ).toBeVisible()
  },
}

/** Every line done: Finish. */
export const AllDone: Story = {
  name: 'All done',
  render: () => <Picking lines={PICK_LINES_DONE} currentId={null} onFinish={() => undefined} />,
}

/** Offline with changes waiting; picking goes on. */
export const Offline: Story = {
  render: () => <Picking offline queued={3} step="item" />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('3 changes waiting to be sent')).toBeVisible()
  },
}

/** Loading. */
export const Loading: Story = {
  render: () => <Picking loading />,
}

/** A list without lines. */
export const Empty: Story = {
  render: () => <Picking lines={[]} currentId={null} />,
}

/** The route as text only (no line can be chosen), without skip or camera. */
export const Fixed: Story = {
  name: 'Fixed route',
  render: () => (
    <Handheld>
      <PickList
        title={PICK_TITLE}
        lines={PICK_LINES.slice(0, 6)}
        currentId="l5"
        step="location"
        onScan={() => undefined}
        onConfirm={() => undefined}
        inputMode="none"
      />
    </Handheld>
  ),
}

/** Long names and notes wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Picking
      title="Pick list PL-2026-0412 for the second phase of the residential building in Telep"
      subtitle="Kvadrat Gradnja d.o.o., gradilište Telep, Novi Sad · Magacin Novi Sad, ulaz 3"
      lines={[
        {
          id: 'x1',
          location: 'B-04-02-LEVO-GORE',
          item: 'Fasadna mrežica od staklenih vlakana 160 g/m², alkalno otporna, rolna 50 m',
          itemCode: '3870012500056',
          quantity: '1234.5',
          picked: '12',
          unit: 'm²',
          state: 'open',
          note: 'Take the rolls from the back of the shelf first; the front ones are reserved.',
        },
        ...PICK_LINES.slice(0, 3),
      ]}
      currentId="x1"
    />
  ),
}

/** Wider than a handheld (a tablet on a cart). */
export const Wide: Story = {
  name: 'Tablet width',
  render: () => (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="h-180 max-w-160">
          <PickList
            title={PICK_TITLE}
            subtitle={PICK_SUBTITLE}
            lines={PICK_LINES}
            currentId="l5"
            step="quantity"
            onScan={() => undefined}
            onConfirm={() => undefined}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Arabic, right to left: codes stay left to right. */
export const Arabic: Story = {
  render: () => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider locale="ar" density="touch">
        <PickList
          title="قائمة الالتقاط 412"
          subtitle="مستودع المدينة"
          lines={[
            {
              id: 'a1',
              location: 'A-01-02',
              item: 'إسمنت 25 كغ',
              quantity: '40',
              picked: '40',
              unit: 'كيس',
              state: 'picked',
            },
            {
              id: 'a2',
              location: 'B-04-02',
              item: 'شبكة الواجهات',
              quantity: '6',
              picked: null,
              unit: 'لفة',
              state: 'open',
            },
          ]}
          currentId="a2"
          step="item"
          onScan={() => undefined}
          onConfirm={() => undefined}
        />
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider locale="ja" density="touch">
        <PickList
          title="ピッキングリスト 412"
          subtitle="中央倉庫"
          lines={[
            {
              id: 'j1',
              location: 'A-01-02',
              item: 'セメント 25kg',
              quantity: '40',
              picked: '40',
              unit: '袋',
              state: 'picked',
            },
            {
              id: 'j2',
              location: 'B-04-02',
              item: '外壁用メッシュ',
              quantity: '6',
              picked: null,
              unit: '巻',
              state: 'open',
            },
          ]}
          currentId="j2"
          step="quantity"
          onScan={() => undefined}
          onConfirm={() => undefined}
        />
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Scan the location, then the item, then confirm the quantity. */
export const Picking3Steps: Story = {
  name: 'Picking, interaction',
  tags: ['interaction'],
  args: { onConfirm: fn() },
  render: (args) => <PickingDemo onConfirm={args.onConfirm} />,
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox', { name: 'Location code' }), 'B-04-02{Enter}')
    const item = await canvas.findByRole('textbox', { name: 'Item code' })
    await waitFor(async () => {
      await expect(item).toHaveFocus()
    })
    await userEvent.type(item, '3870012500056{Enter}')
    await userEvent.click(await canvas.findByRole('button', { name: 'Confirm quantity' }))
    await expect(args.onConfirm).toHaveBeenCalledWith('l5', '6')
  },
}
