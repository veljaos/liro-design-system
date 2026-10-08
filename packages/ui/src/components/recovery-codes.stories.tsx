import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { RECOVERY_CODES } from './group-c-story-data'
import { RecoveryCodes } from './recovery-codes'
import { PhoneFrame, StoryProvider } from './story-frames'

const HEADING = 'Liro Business Apps — milica.petrovic@kvadratgradnja.rs'

/** The browser's clipboard in a story: it may refuse, as a real one can. */
function stubClipboard(works: boolean) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: () => (works ? Promise.resolve() : Promise.reject(new Error('Not allowed'))),
    },
  })
}

const meta = {
  title: 'Components/Sign-in/RecoveryCodes',
  component: RecoveryCodes,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the recovery codes that sign a person in when the second factor is ' +
          'lost. **Shown once**: a warning above them; the codes in monospace, left to right, ' +
          'selectable; Copy, Download (a text file made in the browser — nothing is fetched) and ' +
          'Print (the codes alone, not the page). "I have saved these codes" enables Continue. ' +
          '`onAction` tells the application which way was used, for its security log.\n\n' +
          '**When:** after turning on two-step sign-in, and after making new codes.\n\n' +
          '**When not:** showing an API key or a password (they are not shown once in a list; ' +
          'a read-only TextField with a copy action).',
      },
    },
  },
  args: {
    codes: RECOVERY_CODES,
    heading: HEADING,
    onContinue: fn(),
    onAction: fn(),
  },
  render: (args) => (
    <div className="max-w-105">
      <RecoveryCodes {...args} />
    </div>
  ),
  play: settle,
} satisfies Meta<typeof RecoveryCodes>

export default meta

type Story = StoryObj<typeof meta>

/** Copy announces "Copied"; Continue is enabled only after the confirmation. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    await settle()
    stubClipboard(true)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Recovery codes' })).toHaveTextContent(
      'k7qm-3rtd',
    )
    const next = canvas.getByRole('button', { name: 'Continue' })
    await expect(next).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('Copied')
    })
    await expect(args.onAction).toHaveBeenCalledWith('copy')
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I have saved these codes' }))
    await expect(next).toBeEnabled()
    await userEvent.click(next)
    await expect(args.onContinue).toHaveBeenCalled()
  },
}

/** The browser refused to copy: the line says what to do instead. */
export const CopyRefused: Story = {
  name: 'Copy refused',
  play: async ({ canvasElement }) => {
    await settle()
    stubClipboard(false)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('could not be copied')
    })
  },
}

/** Download makes the text file in the browser (`recoveryCodesText`) and reports it. */
export const Download: Story = {
  play: async ({ canvasElement, args }) => {
    await settle()
    const made: string[] = []
    // The component clicks a link to a file made in the browser; the story keeps the browser on
    // the page and records the link.
    const keep = (event: MouseEvent) => {
      if (event.target instanceof HTMLAnchorElement) {
        event.preventDefault()
        made.push(event.target.download, event.target.href.slice(0, 5))
      }
    }
    document.addEventListener('click', keep, true)
    try {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Download' }))
    } finally {
      document.removeEventListener('click', keep, true)
    }
    await expect(made).toEqual(['kvadrat-gradnja-recovery-codes.txt', 'blob:'])
    await expect(args.onAction).toHaveBeenCalledWith('download')
  },
  args: { fileName: 'kvadrat-gradnja-recovery-codes.txt' },
}

/** The Core is making the codes: skeleton lines, every action unavailable. */
export const Loading: Story = {
  args: { loading: true, codes: [] },
}

/** A long heading and a long button text; the codes keep their columns. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    continueLabel: 'I have kept the codes; continue to the home page of Kvadrat Gradnja d.o.o.',
  },
}

/** One column at phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <RecoveryCodes {...args} layout="phone" />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic texts from the provider's messages; the codes stay left to right. */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-105">
        <RecoveryCodes {...args} continueLabel="متابعة" />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-105">
        <RecoveryCodes {...args} continueLabel="続行" heading="Liro Business Apps — 佐藤" />
      </div>
    </StoryProvider>
  ),
}
