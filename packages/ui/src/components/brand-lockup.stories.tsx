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
          '**What for:** the application’s name at the start of the header, on status pages and ' +
          'on the sign-in screen: "Liro Business Apps" as text in the brand face and colour, ' +
          'the brand bold and the product regular, one line, no icon. Both names are data. One ' +
          'link home, named by the full product name.\n\n' +
          "**How:** `brandName`, `productName`, `href`; `size` 'md' (header, 20px) or 'lg' " +
          '(24px). Below 48em only the brand name; `compact` forces it.\n\n' +
          '**When not:** documents, e-mail, print, the favicon and the installed app take the ' +
          'brand files of `@veljaos/tokens/brand/` directly.',
      },
    },
  },
  args: { ...LIRO_BRAND, href: '#home' },
  // The lockup stands on the header or on a raised surface (status pages, sign-in): the logo
  // colour reaches 4.53:1 on them, not on the grey page (P4.1).
  decorators: [
    (Story) => (
      <div className="box-border inline-block rounded-md bg-surface-raised p-4">
        <Story />
      </div>
    ),
  ],
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

/** Without a link: text named by the product name. */
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
  render: () => <BrandLockup brandName={LIRO_BRAND.brandName} href="#home" />,
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

/** In a 56px header bar, light and dark side by side. */
export const InHeader: Story = {
  name: 'In a header',
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['light', 'dark'] as const).map((theme) => (
        <StoryProvider key={theme} colorScheme={theme}>
          <div
            data-liro-theme={theme}
            className="flex h-header items-center border-0 border-b border-solid border-default bg-surface-header px-6"
          >
            <BrandLockup {...args} />
          </div>
        </StoryProvider>
      ))}
    </div>
  ),
}

/** At phone width: the brand name alone. */
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

/** An Arabic product name, in a right-to-left page. */
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
