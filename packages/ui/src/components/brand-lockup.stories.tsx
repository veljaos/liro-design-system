import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { BrandLockup } from './brand-lockup'
import { LIRO_BRAND } from './story-brand'
import { PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Brand/BrandLockup',
  component: BrandLockup,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the brand at the start of the application header, on status pages and ' +
          'on the sign-in screen: the icon and the wordmark side by side, then the product name ' +
          'as live text in the brand face, so the product name is data. One link home, named by ' +
          'the full product name ("Liro Business Apps").\n\n' +
          '**How:** the application passes the files of `@veljaos/tokens/brand/` (`icon`, ' +
          '`wordmark` for light surfaces, `wordmarkOnDark` for the dark theme) and the names. ' +
          "`size` 'md' (header: icon 28px, wordmark 20px, name 16px, 8px apart) or 'lg' (status " +
          'pages, sign-in). Below 48em the product name is left out; `compact` forces it.\n\n' +
          '**When not:** documents, e-mail and print take the brand files directly; the icon ' +
          'alone (a favicon, an app icon) is a file, not this component.',
      },
    },
  },
  args: { ...LIRO_BRAND, href: '#home' },
  play: settle,
} satisfies Meta<typeof BrandLockup>

export default meta

type Story = StoryObj<typeof meta>

/** The header size, as a link home named by the full product name. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const link = within(canvasElement).getByRole('link', { name: 'Liro Business Apps' })
    await expect(link).toHaveAttribute('href', '#home')
  },
}

/** Status pages and the sign-in screen. */
export const Large: Story = { args: { size: 'lg' } }

/** Without a link: an image named by the product name. */
export const WithoutLink: Story = {
  name: 'Without link',
  render: () => <BrandLockup {...LIRO_BRAND} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('img', { name: 'Liro Business Apps' }),
    ).toBeVisible()
  },
}

/** The brand alone, without a product name. */
export const BrandOnly: Story = {
  name: 'Brand only',
  render: () => (
    <BrandLockup
      brandName={LIRO_BRAND.brandName}
      icon={LIRO_BRAND.icon}
      wordmark={LIRO_BRAND.wordmark}
      wordmarkOnDark={LIRO_BRAND.wordmarkOnDark}
      href="#home"
    />
  ),
}

/** `compact`: the product name left out, as below 48em; the link keeps the full name. */
export const Compact: Story = {
  args: { compact: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.textContent).not.toContain('Business Apps')
    await expect(
      within(canvasElement).getByRole('link', { name: 'Liro Business Apps' }),
    ).toBeVisible()
  },
}

/** A long product name stays on one line. */
export const LongText: Story = {
  name: 'Long text',
  args: { productName: 'Business Apps for Accounting Offices' },
}

/** Both sizes in a 56px header bar, light and dark side by side. */
export const InHeader: Story = {
  name: 'In a header',
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['light', 'dark'] as const).map((theme) => (
        <div
          key={theme}
          data-liro-theme={theme}
          className="flex h-header items-center border-0 border-b border-solid border-default bg-surface-header px-6"
        >
          <StoryProvider colorScheme={theme}>
            <BrandLockup {...args} />
          </StoryProvider>
        </div>
      ))}
    </div>
  ),
}

/** At phone width the application passes `compact` (or leaves it to the 48em rule). */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="flex h-header items-center border-0 border-b border-solid border-default bg-surface-header px-4">
        <BrandLockup {...args} compact />
      </div>
    </PhoneFrame>
  ),
}

/** An Arabic product name, in a right-to-left page: the icon stands at the start (right). */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <BrandLockup {...args} productName="تطبيقات الأعمال" />
    </StoryProvider>
  ),
}

/** A Japanese product name. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <BrandLockup {...args} productName="ビジネスアプリ" />
    </StoryProvider>
  ),
}
