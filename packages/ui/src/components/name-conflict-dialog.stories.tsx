import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { ConflictResolution } from './file-browser-logic'
import { CONFLICTS, CRANE_CONFLICT, photoUri } from './file-story-data'
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

/** The crane photo with both pictures, as the application shows them. */
const CRANE_PHOTOS: NameConflict = {
  ...CRANE_CONFLICT,
  existing: { ...CRANE_CONFLICT.existing, thumbnail: photoUri(3) },
  incoming: {
    ...CRANE_CONFLICT.incoming,
    thumbnail: photoUri(4),
    owner: 'Uploaded by you',
  },
}

const meta = {
  title: 'Components/Files/NameConflictDialog',
  component: Queue,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what happens to an uploaded, moved or copied file whose name is taken ' +
          'in its folder — one decision, one press: a short question, the two files compact ' +
          'side by side (thumbnail, size, date, who), and the answers as buttons: Keep both (the ' +
          'default, focused; the new name is the application’s), Replace, Skip; “Do this for the ' +
          'other N conflicts” when more wait; “Cancel upload” secondary. Replace can be ' +
          'unavailable with the application’s reason. Phones stack the buttons.\n\n' +
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

/**
 * One photo's name is taken: a short question, the two photos side by side, and the three answers
 * as buttons — Keep both (focused at first: nothing is lost), Replace, Skip; one press answers.
 */
export const Default: Story = {
  args: { conflicts: [CRANE_PHOTOS] },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog', {
      name: 'Keep both files? Crane inspection.jpg',
    })
    await expect(within(dialog).getByRole('button', { name: 'Keep both' })).toHaveFocus()
    await expect(
      within(dialog).getByText('Keep both saves the new file as Crane inspection (1).jpg.'),
    ).toBeVisible()
    await expect(within(dialog).getByText('3,2 MB')).toBeVisible()
    await expect(within(dialog).queryByRole('radio')).toBeNull()
  },
}

/** Three conflicts: "Conflict 1 of 3" and "Do this for the other 2 conflicts". */
export const Several: Story = {
  args: { conflicts: CONFLICTS },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    await expect(within(dialog).getByText('Conflict 1 of 3')).toBeVisible()
    await expect(
      within(dialog).getByRole('checkbox', { name: 'Do this for the other 2 conflicts' }),
    ).not.toBeChecked()
  },
}

/** A signed document cannot be replaced: Replace says why, in words under the files. */
export const ReplaceUnavailable: Story = {
  name: 'Replace unavailable',
  args: { conflicts: CONFLICTS.slice(1, 2) },
  play: async () => {
    await settle()
    const dialog = within(document.body).getByRole('dialog')
    const replace = within(dialog).getByRole('button', { name: 'Replace' })
    await expect(replace).toHaveAttribute('aria-disabled', 'true')
    await expect(replace).toHaveAccessibleDescription(
      'Replace is unavailable: Signed documents cannot be replaced; upload it as a new version.',
    )
  },
}

/** "Do this for the other 2 conflicts" ticked at first. */
export const ReplaceAll: Story = {
  name: 'Do this for the others',
  tags: ['!dev'],
  args: { conflicts: CONFLICTS, defaultApplyToAll: true },
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

/** Phone width: a bottom sheet, the buttons stacked across it. */
export const Phone: Story = {
  args: { conflicts: [CRANE_PHOTOS, ...CONFLICTS.slice(1)] },
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

/**
 * One press answers: Skip the first; the second is the signed document (Replace unavailable), so
 * Keep both with "Do this for the other conflict" answers it and the last one.
 */
export const ApplyToAll: Story = {
  name: 'Do this for the others, interaction',
  tags: ['interaction', '!dev'],
  args: { conflicts: CONFLICTS },
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(document.body)
    await userEvent.click(body.getByRole('button', { name: 'Skip' }))
    await waitFor(async () => {
      await expect(body.getByText('Conflict 2 of 3')).toBeVisible()
    })
    await expect(body.getByRole('button', { name: 'Keep both' })).toHaveFocus()
    await userEvent.click(body.getByRole('checkbox', { name: 'Do this for the other conflict' }))
    await userEvent.click(body.getByRole('button', { name: 'Keep both' }))
    await expect(within(canvasElement).getByTestId('answers')).toHaveTextContent(
      'c-1:skip c-2:keepBoth c-3:keepBoth',
    )
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
  },
}
