import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Accordion, type AccordionSection } from './accordion'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { expectContentDirection, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Display/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** sections of related content opened when needed — the details under a ' +
          "summary, questions and answers, rarely used settings. Mantine's default Accordion " +
          '(a line under each section, the chevron at the end, turning when open) on the Radix ' +
          'accordion. One section open at a time by default (pressing it again closes it), or ' +
          'several with `multiple`. Keyboard: Enter or Space opens and closes, ArrowDown / ' +
          'ArrowUp move between headers, Home and End go to the first and last. Closed panels are ' +
          'not mounted.\n\n**When not:** the steps of a task (FormWizard); views of one record ' +
          '(Tabs); fields that may hold errors (FormSection `collapsible`, which keeps them ' +
          'mounted); content the user must see (show it).',
      },
    },
  },
  args: { items: [] },
  play: settle,
} satisfies Meta<typeof Accordion>

export default meta

type Story = StoryObj<typeof meta>

const SECTIONS: AccordionSection[] = [
  {
    value: 'payment',
    title: 'Payment terms',
    content:
      'Invoices are due 30 days after the issue date, unless the customer has its own terms.',
  },
  {
    value: 'delivery',
    title: 'Delivery',
    content: 'Goods leave the main warehouse within two working days.',
  },
  {
    value: 'returns',
    title: 'Returns',
    content: 'A return needs the original delivery note number.',
  },
]

/** One open at a time; the first is open. */
export const Default: Story = {
  render: () => (
    <div className="max-w-150">
      <Accordion items={SECTIONS} defaultValue={['payment']} />
    </div>
  ),
}

/** Several open at once (`multiple`), controlled; a disabled section. */
export const Multiple: Story = {
  render: function Render() {
    const [open, setOpen] = useState<string[]>(['payment', 'delivery'])
    return (
      <div className="flex max-w-150 flex-col gap-2">
        <Accordion
          multiple
          value={open}
          onValueChange={setOpen}
          items={[
            ...SECTIONS,
            { value: 'archive', title: 'Archive', content: null, disabled: true },
          ]}
        />
        <p className="m-0 text-sm text-secondary" data-testid="open">
          Open: {open.join(', ')}
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Returns' }))
    await expect(canvas.getByTestId('open')).toHaveTextContent('Open: payment, delivery, returns')
    await expect(canvas.getByRole('button', { name: 'Archive' })).toBeDisabled()
    await settle()
  },
}

/** Keyboard only: ArrowDown moves to the next header, Enter opens it and closes the other. */
export const Keyboard: Story = {
  render: () => (
    <div className="max-w-150">
      <Accordion items={SECTIONS} defaultValue={['payment']} headingLevel={4} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const first = canvas.getByRole('button', { name: 'Payment terms' })
    first.focus()
    await userEvent.keyboard('{ArrowDown}')
    const second = canvas.getByRole('button', { name: 'Delivery' })
    await expect(second).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(second).toHaveAttribute('aria-expanded', 'true')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('button', { name: 'Returns' })).toHaveFocus()
    await settle()
  },
}

/** Long text at phone width: headers and panels wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Accordion
        items={[{ value: 'long', title: LONG.label, content: LONG.description }, ...SECTIONS]}
        defaultValue={['long']}
      />
    </div>
  ),
}

/** Arabic sample text, right to left: the chevron at the end (left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-150">
        <Accordion
          items={[
            { value: 'a', title: ARABIC.label, content: ARABIC.description },
            { value: 'b', title: ARABIC.options[0] ?? '', content: ARABIC.value },
          ]}
          defaultValue={['a']}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-150">
        <Accordion
          items={[
            { value: 'a', title: JAPANESE.label, content: JAPANESE.description },
            { value: 'b', title: JAPANESE.options[0] ?? '', content: JAPANESE.value },
          ]}
          defaultValue={['a']}
        />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: headers and panels keep their own order. */
export const EnglishInRtl: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-150">
        <Accordion items={SECTIONS} defaultValue={['payment']} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(canvas.getByText('Payment terms'))
    await settle()
  },
}
