import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SECTION_SCROLL_MARGIN, SectionBar } from './section-bar'
import { StoryProvider } from './story-frames'

const SECTIONS = [
  { id: 'bar-general', label: 'General' },
  { id: 'bar-lines', label: 'Lines' },
  { id: 'bar-payment', label: 'Payment' },
  { id: 'bar-delivery', label: 'Delivery' },
]

const meta = {
  title: 'Components/Navigation/SectionBar',
  component: SectionBar,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a long detail page: a sticky row of its section names that scrolls to ' +
          'each section and marks the current one (the module tabs’ look, start-aligned). ' +
          'DetailPage shows it with `sectionBar`.\n\n' +
          '**When not:** a form (its tabs, FormTabs); a short page (two or three sections ' +
          'fit the screen).',
      },
    },
  },
  args: { sections: SECTIONS },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <SectionBar {...args} />
      {args.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          tabIndex={-1}
          className={`flex h-60 flex-col rounded-lg border border-solid border-default bg-surface-raised p-4 outline-none ${SECTION_SCROLL_MARGIN}`}
        >
          <h2 className="m-0 text-h4 text-primary">{section.label}</h2>
        </section>
      ))}
    </div>
  ),
  play: settle,
} satisfies Meta<typeof SectionBar>

export default meta

type Story = StoryObj<typeof meta>

/** The first section is current at the top of the page. */
export const Default: Story = {}

/** A press moves to the section and marks it. */
export const Press: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const nav = within(within(canvasElement).getByRole('navigation', { name: 'Sections' }))
    await userEvent.click(nav.getByRole('link', { name: 'Delivery' }))
    await expect(nav.getByRole('link', { name: 'Delivery' })).toHaveAttribute(
      'aria-current',
      'location',
    )
    // Back to the first section at once (whatever element scrolls), so the picture does not
    // depend on the smooth scroll's timing.
    document.getElementById('bar-general')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    await waitFor(async () => {
      await expect(nav.getByRole('link', { name: 'General' })).toHaveAttribute(
        'aria-current',
        'location',
      )
    })
  },
}

/** Long names: the row scrolls sideways on a narrow screen. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    sections: [
      { id: 'bar-a', label: 'General information and identification' },
      { id: 'bar-b', label: 'Employment history and contracts' },
      { id: 'bar-c', label: 'Payroll, taxes and contributions' },
    ],
  },
}

/** Arabic section names. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <SectionBar
        sections={[
          { id: 'ar-1', label: 'عام' },
          { id: 'ar-2', label: 'البنود' },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese section names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <SectionBar
        sections={[
          { id: 'ja-1', label: '一般' },
          { id: 'ja-2', label: '明細' },
        ]}
      />
    </StoryProvider>
  ),
}
