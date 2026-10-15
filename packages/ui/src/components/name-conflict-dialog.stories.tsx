import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { ConflictResolution } from './file-browser-logic'
import { CONFLICTS, CRANE_CONFLICT } from './file-story-data'
import { NameConflictDialog, type NameConflict } from './name-conflict-dialog'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The dialog with the application's queue: answered conflicts leave it. */
function Queue(props: Parameters<typeof NameConflictDialog>[0]) {
  const [waiting, setWaiting] = useState<readonly NameConflict[]>(props.conflicts)
  const [answers, setAnswers] = useState<ConflictResolution[]>([])
  return (
    <>
      <NameConflictDialog
        {...props}
        conflicts={waiting}
        total={props.total ?? props.conflicts.length}
        onResolve={(resolved) => {
          setAnswers((list) => [...list, ...resolved])
          setWaiting((list) => list.filter((each) => !resolved.some((r) => r.id === each.id)))
        }}
        onCancel={() => {
          setWaiting([])
        }}
      />
      <p data-testid="answers">
        {answers.map((answer) => `${answer.id}:${answer.choice}`).join(' ')}
      </p>
    </>
  )
}

const meta = {
  title: 'Components/Files/NameConflictDialog',
  component: Queue,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** “A file with this name exists” — what happens to an uploaded, moved ' +
          'or copied file whose name is taken in its folder: Replace, Keep both (the new name is ' +
          'the application’s) or Skip, with the two files side by side, and “Apply to all” when ' +
          'more wait. Replace can be unavailable with the application’s reason.\n\n' +
          '**When to use:** an upload or a move into a folder where names are unique. **When ' +
          'not:** a new version of the same file (VersionList’s “Upload a new version”); a ' +
          'duplicate record (DuplicateWarning).',
      },
    },
  },
  args: {
    conflicts: CONFLICTS.slice(0, 1),
    onResolve: () => undefined,
    onCancel: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof Queue>

export default meta

type Story = StoryObj<typeof meta>

/** One photo's name is taken: Keep both is chosen at first, so nothing is lost. */
export const Default: Story = {
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'A file with this name exists Crane inspection.jpg',
    })
    await expect(within(dialog).getByRole('radio', { name: /^Keep both/ })).toBeChecked()
    await expect(
      within(dialog).getByText('The new file is saved as Crane inspection (1).jpg.'),
    ).toBeVisible()
    await expect(within(dialog).getByText('3,2 MB')).toBeVisible()
  },
}

/** Three conflicts: "Conflict 1 of 3" and "Apply to all 3 conflicts". */
export const Several: Story = {
  args: { conflicts: CONFLICTS },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByText('Conflict 1 of 3')).toBeVisible()
    await expect(
      within(dialog).getByRole('checkbox', { name: 'Apply to all 3 conflicts' }),
    ).not.toBeChecked()
  },
}

/** A signed document cannot be replaced: the application's reason under Replace. */
export const ReplaceUnavailable: Story = {
  name: 'Replace unavailable',
  args: { conflicts: CONFLICTS.slice(1, 2) },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByRole('radio', { name: /^Replace/ })).toBeDisabled()
  },
}

/** Replace chosen at first, "Apply to all" ticked. */
export const ReplaceAll: Story = {
  name: 'Replace, apply to all',
  args: { conflicts: CONFLICTS, defaultChoice: 'replace', defaultApplyToAll: true },
}

/** Long names. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    conflicts: [
      {
        ...CRANE_CONFLICT,
        name: 'Crane inspection of the tower crane at the northern entrance, October 2026, with the inspector’s notes.jpg',
        folder: 'Site documentation / Harbour Road site / Photos / Inspections by the authority',
        keepBothName:
          'Crane inspection of the tower crane at the northern entrance, October 2026, with the inspector’s notes (1).jpg',
      },
    ],
  },
}

/** Phone width: a bottom sheet. */
export const Phone: Story = {
  args: { conflicts: CONFLICTS },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic. */
export const Arabic: Story = {
  args: {
    conflicts: [
      {
        id: 'a',
        name: 'فحص الرافعة.jpg',
        folder: 'موقع طريق الميناء',
        keepBothName: 'فحص الرافعة (1).jpg',
        existing: { size: '3.2', sizeUnit: 'ميغابايت', modified: '2026-10-10T07:48:00+02:00' },
        incoming: { size: '3.4', sizeUnit: 'ميغابايت', modified: '2026-10-14T09:31:00+02:00' },
      },
    ],
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
    conflicts: [
      {
        id: 'j',
        name: 'クレーン点検.jpg',
        folder: 'ハーバーロード現場',
        keepBothName: 'クレーン点検 (1).jpg',
        existing: { size: '3.2', sizeUnit: 'MB', modified: '2026-10-10T07:48:00+02:00' },
        incoming: { size: '3.4', sizeUnit: 'MB', modified: '2026-10-14T09:31:00+02:00' },
      },
    ],
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

/** Skip the first, then Replace with "Apply to all": the signed one still asks on its own. */
export const ApplyToAll: Story = {
  name: 'Apply to all, interaction',
  tags: ['interaction'],
  args: { conflicts: CONFLICTS },
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(body.getByRole('radio', { name: /^Skip/ }))
    await userEvent.click(body.getByRole('button', { name: 'Continue' }))
    await waitFor(async () => {
      await expect(body.getByText('Conflict 2 of 3')).toBeVisible()
    })
    // The second is the signed document: Replace cannot be chosen; Keep both for it and the rest.
    await userEvent.click(body.getByRole('checkbox', { name: 'Apply to all 2 conflicts' }))
    await userEvent.click(body.getByRole('button', { name: 'Continue' }))
    await expect(within(canvasElement).getByTestId('answers')).toHaveTextContent(
      'c-1:skip c-2:keepBoth c-3:keepBoth',
    )
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
  },
}
