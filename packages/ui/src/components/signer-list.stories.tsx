import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { SectionCard } from './cards'
import { contractSigners, DECLINE_REASONS } from './group-c-story-data'
import { SignerList, type Signer, type SignerListProps } from './signer-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application around the list: signing (Liro Bridge) and declining change the signers. */
function Signing(props: Partial<SignerListProps> & { initial?: Signer[] }) {
  const [signers, setSigners] = useState<Signer[]>(props.initial ?? contractSigners('stefan'))
  return (
    <SignerList
      declineReasons={DECLINE_REASONS}
      declineMessage="RU-2026-017 goes back to Jelena Marković (HR) with your reason."
      {...props}
      signers={signers}
      onSign={(signer) =>
        new Promise<void>((resolve) => {
          window.setTimeout(() => {
            setSigners((list) =>
              list.map((each) =>
                each.id === signer.id
                  ? { ...each, state: 'signed', at: '2026-10-06T10:20:00+02:00' }
                  : each,
              ),
            )
            resolve()
          }, 300)
        })
      }
      onDecline={(signer, answer) => {
        const reason = DECLINE_REASONS.find((each) => each.value === answer.reason)?.label
        setSigners((list) =>
          list.map((each) =>
            each.id === signer.id
              ? {
                  ...each,
                  state: 'declined',
                  at: '2026-10-06T10:24:00+02:00',
                  reason: [reason, answer.text].filter(Boolean).join(': '),
                }
              : each,
          ),
        )
      }}
    />
  )
}

const meta = {
  title: 'Components/Signing/SignerList',
  component: SignerList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** who signs a document and where each stands: "1 of 3 signed", then the ' +
          'signers in order — waiting, signed (with the date and time), declined (with the ' +
          'reason) in words, never by colour alone. The current user’s row has Decline then ' +
          'Sign when it is their turn (`sequential`: in order; otherwise any waiting signer); ' +
          'before that it says whose turn comes first. Decline asks for the reason ' +
          '(ReasonConfirmDialog, the Core’s reasons or a text). **The signing itself is the ' +
          'Core’s or Liro Bridge’s**: the list reports the choice (`onSign`, `onDecline`).\n\n' +
          '**When:** a contract, a protocol, an approval that needs several signatures (with ' +
          'SigningPage).\n\n' +
          '**When not:** an approval with no signature (Approve / Reject in a worklist).',
      },
    },
  },
  args: { signers: contractSigners('stefan') },
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <Signing />
      </SectionCard>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof SignerList>

export default meta

type Story = StoryObj<typeof meta>

/** Stefan Nikolić (the current user) signs: busy while Liro Bridge works, then "2 of 3". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 of 3 signed')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Signed 05.10.2026. 14:12')
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 of 3 signed')).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Signed 05.10.2026. 14:12')
    const sign = canvas.getByRole('button', { name: 'Sign' })
    await userEvent.click(sign)
    await expect(sign).toHaveAttribute('aria-busy', 'true')
    await waitFor(async () => {
      await expect(canvas.getByText('2 of 3 signed')).toBeVisible()
    })
    await expect(canvasElement).toHaveTextContent('Signed 06.10.2026. 10:20')
    await expect(canvas.queryByRole('button', { name: 'Sign' })).toBeNull()
  },
}

/** Decline asks for the reason first; Cancel has the focus; the row then says why. */
export const Decline: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Decline' }))
    const dialog = within(await page.findByRole('alertdialog', { name: 'Decline to sign?' }))
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    const confirm = dialog.getByRole('button', { name: 'Decline' })
    await expect(confirm).toBeDisabled()
    await userEvent.click(dialog.getByRole('radio', { name: 'My personal data are wrong' }))
    await userEvent.click(confirm)
    await waitFor(async () => {
      await expect(canvasElement).toHaveTextContent('Declined 06.10.2026. 10:24')
    })
    await expect(canvasElement).toHaveTextContent('My personal data are wrong')
    await settle()
  },
}

/** Jelena Marković is the current user: Stefan signs first, so she has no Sign yet. */
export const NotYourTurn: Story = {
  name: 'Not yet your turn',
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <Signing initial={contractSigners('jelena')} />
      </SectionCard>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Sign' })).toBeNull()
    await expect(canvasElement).toHaveTextContent('Stefan Nikolić signs first')
  },
}

/** In any order: Jelena may sign before Stefan. */
export const AnyOrder: Story = {
  name: 'Any order',
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <Signing initial={contractSigners('jelena')} sequential={false} />
      </SectionCard>
    </ExampleProvider>
  ),
}

/** Someone declined: the document stops; nobody can sign. */
export const Declined: Story = {
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <Signing
          initial={contractSigners('jelena').map((signer) =>
            signer.id === 'stefan'
              ? {
                  ...signer,
                  state: 'declined',
                  at: '2026-10-06T09:02:00+02:00',
                  reason: 'The start date should be 09.11.2026., as agreed.',
                }
              : signer,
          )}
        />
      </SectionCard>
    </ExampleProvider>
  ),
}

/** Viewed by someone who does not sign (Milica): the states only, no actions. */
export const ReadOnly: Story = {
  name: 'Read-only (not a signer)',
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <SignerList signers={contractSigners('none')} />
      </SectionCard>
    </ExampleProvider>
  ),
}

/** Long names, roles and reasons wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <SectionCard title="Signatures" headingLevel={2} className="max-w-100">
        <SignerList
          signers={[
            {
              id: 'a',
              name: 'Aleksandra Vukosavljević-Stanković',
              role: 'Director and legal representative of Kvadrat Gradnja d.o.o., Novi Sad',
              state: 'declined',
              at: '2026-10-06T09:02:00+02:00',
              reason:
                'The probation period in article 4 differs from the three months agreed at the interview, and the place of work should name the office in Novi Sad.',
            },
            { id: 'b', name: 'Stefan Nikolić', role: 'Employee', state: 'waiting' },
          ]}
        />
      </SectionCard>
    </ExampleProvider>
  ),
}

/** At phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <SectionCard title="Signatures" headingLevel={2}>
            <Signing />
          </SectionCard>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic names and roles. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <SignerList
        className="max-w-100"
        signers={[
          {
            id: 'a',
            name: 'أحمد منصور',
            role: 'المدير',
            state: 'signed',
            at: '2026-10-05T14:12:00+02:00',
          },
          { id: 'b', name: 'سارة يوسف', role: 'الموظفة', state: 'waiting', current: true },
        ]}
        onSign={() => undefined}
        onDecline={() => undefined}
      />
    </StoryProvider>
  ),
}

/** Japanese names and roles. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <SignerList
        className="max-w-100"
        signers={[
          {
            id: 'a',
            name: '山田 太郎',
            role: '代表取締役',
            state: 'signed',
            at: '2026-10-05T14:12:00+02:00',
          },
          { id: 'b', name: '佐藤 花子', role: '従業員', state: 'waiting', current: true },
        ]}
        onSign={() => undefined}
        onDecline={() => undefined}
      />
    </StoryProvider>
  ),
}
