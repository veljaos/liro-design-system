import type { Meta, StoryObj } from '@storybook/react-vite'
import { settle } from '../primitives/story-helpers'
import { PersonAvatar, PersonName } from './person'

const meta = {
  title: 'Components/Display/Person',
  component: PersonName,
  parameters: {
    docs: {
      description: {
        component:
          '**PersonAvatar** — a photo, or the initials of the first and the last word of the ' +
          'name ("Ana Marija Jovanović" → AJ; Appendix B.9), in a neutral grey (blue is kept for actions). ' +
          'Decorative by default, because the name is written beside it; give `alt` when it ' +
          'stands alone. **PersonName** — the name with its avatar and an optional line (a role, ' +
          'an e-mail).\n\n' +
          '**When not:** several people at once (PresenceAvatars, P5.2); marking an agent ' +
          '(AgentMark, P5.2).',
      },
    },
  },
  args: { name: '' },
  play: settle,
} satisfies Meta<typeof PersonName>

export default meta

type Story = StoryObj<typeof meta>

/** Names with one line, two lines and without the avatar. */
export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <PersonName name="Ana Jovanović" />
      <PersonName name="Ana Marija Jovanović" description="Bookkeeper" />
      <PersonName name="Marko Petrović" withAvatar={false} description="marko@example.com" />
    </div>
  ),
}

/** Avatars: initials in both sizes, a photo that does not load (initials stay), speaking alt. */
export const Avatars: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <PersonAvatar name="Ana Jovanović" />
      <PersonAvatar name="Ana Jovanović" size="sm" />
      <PersonAvatar name="Ćirić" />
      <PersonAvatar name="Љиљана Ђорђевић" />
      <PersonAvatar name="Nikola Tesla" src="data:," alt="Nikola Tesla" />
    </div>
  ),
}

/** Long names at phone width: truncated with an ellipsis, the avatar keeps its size. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[240px] max-w-full flex-col gap-4">
      <PersonName
        name="Aleksandra Katarina Milošević-Vukadinović"
        description="Head of accounting and financial reporting"
      />
      <PersonName name="Aleksandra Katarina Milošević-Vukadinović" />
    </div>
  ),
}

/** Arabic sample text, right to left: the avatar at the start (right). */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex flex-col items-start gap-4">
      <PersonName name="ليلى حسن" description="محاسبة" />
      <PersonName name="عمر خالد" />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex flex-col items-start gap-4">
      <PersonName name="山田 花子" description="経理部" />
      <PersonName name="佐藤 健" />
    </div>
  ),
}
