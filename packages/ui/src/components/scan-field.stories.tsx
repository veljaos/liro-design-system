import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ScanField, type ScanFeedback, type ScanFieldProps } from './scan-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Handheld({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-90">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

/** The application around the field: it knows two codes and answers each scan. */
function Warehouse(props: Partial<ScanFieldProps>) {
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  return (
    <ScanField
      label="Item code"
      onCameraScan={() => undefined}
      {...props}
      feedback={feedback}
      onScan={(code, source) => {
        props.onScan?.(code, source)
        setFeedback(
          code === '3870012500056'
            ? { id: Date.now(), tone: 'success', text: 'Fasadna mrežica 160 g/m² — 1 roll counted' }
            : {
                id: Date.now(),
                tone: 'error',
                text: `Unknown code ${code}. Scan it again or type it.`,
              },
        )
      }}
    />
  )
}

const meta = {
  title: 'Components/Warehouse/ScanField',
  component: ScanField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the field a barcode scanner types into. A scanner is a fast keyboard that ' +
          'ends with Enter: the field reports each code with its source (`scanner` when the ' +
          'characters came as a burst, `keyboard` when a person typed them), empties itself and ' +
          'keeps the focus for the next scan. The application checks the code and answers with ' +
          '`feedback` — an icon and words, never colour alone — and plays a sound or vibrates in ' +
          '`onFeedback`. An optional camera button calls the application’s `onCameraScan`.\n\n' +
          '**When:** picking, counting, receiving, a till’s product search.\n\n' +
          '**When not:** choosing from a list (ComboboxField, LookupField); a code to type in a form ' +
          '(TextField with `direction="ltr"`).',
      },
    },
  },
  args: { label: 'Item code', onScan: () => undefined, placeholder: 'Scan or type the code' },
  render: (args) => (
    <Handheld>
      <ScanField {...args} />
    </Handheld>
  ),
  play: settle,
} satisfies Meta<typeof ScanField>

export default meta

type Story = StoryObj<typeof meta>

/** Ready for a scan, with the camera button. */
export const Default: Story = {
  args: { onCameraScan: () => undefined, description: 'Scan the barcode on the package.' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Item code' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Scan with camera' })).toBeVisible()
  },
}

/** The application's answer: success. */
export const Success: Story = {
  args: {
    feedback: { id: 1, tone: 'success', text: 'Fasadna mrežica 160 g/m² — 1 roll counted' },
  },
}

/** The application's answer: a problem. */
export const Problem: Story = {
  name: 'Error',
  args: {
    feedback: {
      id: 2,
      tone: 'error',
      text: 'Unknown code 8600123456789. Scan it again or type it.',
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent(
      'Problem: Unknown code 8600123456789',
    )
  },
}

/** Text standing typed (a restored screen), the on-screen keyboard kept closed. */
export const Typed: Story = {
  args: { defaultValue: '38700125', inputMode: 'none' },
}

/** Disabled, with its reason. */
export const Disabled: Story = {
  args: {
    disabled: true,
    disabledReason: 'Scan the location first.',
    onCameraScan: () => undefined,
  },
}

/** The field's own error (the application's). */
export const FieldError: Story = {
  name: 'Field error',
  args: { error: 'This location is closed for counting.', required: true },
}

/** Long label, description and answer wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'The code of the item on the shelf, from its label or its package',
    description: 'Hold the scanner about 20 cm from the code; a long code may take a moment.',
    feedback: {
      id: 3,
      tone: 'error',
      text: 'The code 3870012500056 belongs to Fasadna mrežica 160 g/m², which is not on this pick list. Put it back on shelf B-04-02.',
    },
    onCameraScan: () => undefined,
  },
}

/** On a handheld (360px). */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="p-4">
            <ScanField
              {...args}
              onCameraScan={() => undefined}
              feedback={{ id: 1, tone: 'success', text: 'Location B-04-02' }}
            />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the code stays left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-90">
        <ScanField
          label="رمز الصنف"
          onScan={() => undefined}
          onCameraScan={() => undefined}
          cameraLabel="المسح بالكاميرا"
          defaultValue="6281000123"
          feedback={{ id: 1, tone: 'success', text: 'تمت إضافة الصنف' }}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-90">
        <ScanField
          label="商品コード"
          onScan={() => undefined}
          onCameraScan={() => undefined}
          cameraLabel="カメラで読み取る"
          feedback={{ id: 1, tone: 'error', text: '不明なコードです' }}
        />
      </div>
    </StoryProvider>
  ),
}

/** Typed by a person: reported as 'keyboard'; the answer appears and is passed on once. */
export const Scanning: Story = {
  name: 'Scanning, interaction',
  tags: ['interaction'],
  args: { onScan: fn(), onFeedback: fn() },
  render: (args) => (
    <Handheld>
      <Warehouse
        onScan={args.onScan}
        {...(args.onFeedback === undefined ? {} : { onFeedback: args.onFeedback })}
      />
    </Handheld>
  ),
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Item code' })
    // A person: 80ms between keys.
    await userEvent.setup({ delay: 80 }).type(input, '3870012500056{Enter}')
    await expect(args.onScan).toHaveBeenCalledWith('3870012500056', 'keyboard')
    await expect(input).toHaveValue('')
    await expect(input).toHaveFocus()
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('Done: Fasadna mrežica')
    })
    await expect(args.onFeedback).toHaveBeenCalledTimes(1)
  },
}

/**
 * A burst of keys (as a scanner sends them) is reported as 'scanner'. The interval is widened to
 * 1s (`scanOptions`), so a busy test machine cannot make the burst look typed.
 */
export const Burst: Story = {
  name: 'Scanner burst, interaction',
  tags: ['interaction'],
  args: { onScan: fn(), scanOptions: { maxInterval: 1000 } },
  play: async ({ canvasElement, args }) => {
    await settle()
    const input = within(canvasElement).getByRole('textbox', { name: 'Item code' })
    // A scanner: every key at once.
    await userEvent.setup({ delay: null }).type(input, '8600123456789{Enter}')
    await expect(args.onScan).toHaveBeenCalledWith('8600123456789', 'scanner')
  },
}
