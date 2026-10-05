import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import icon from '@veljaos/tokens/brand/icon.svg'
import iconDark from '@veljaos/tokens/brand/icon-dark.svg'
import iconDarkWhite from '@veljaos/tokens/brand/icon-dark-white.svg'
import iconLight from '@veljaos/tokens/brand/icon-light.svg'
import iconMonoBlack from '@veljaos/tokens/brand/icon-mono-black.svg'
import iconMonoWhite from '@veljaos/tokens/brand/icon-mono-white.svg'
import appleTouchIcon from '@veljaos/tokens/brand/web/apple-touch-icon.png'
import favicon from '@veljaos/tokens/brand/web/favicon.ico'
import icon512 from '@veljaos/tokens/brand/web/icon-512.png'
import iconMaskable from '@veljaos/tokens/brand/web/icon-maskable-512.png'
import wordmarkLight from '@veljaos/tokens/brand/wordmark-light.svg'
import wordmarkMonoBlack from '@veljaos/tokens/brand/wordmark-mono-black.svg'
import wordmarkMonoWhite from '@veljaos/tokens/brand/wordmark-mono-white.svg'
import wordmarkNeutral from '@veljaos/tokens/brand/wordmark-neutral.svg'

/*
 * The Liro brand files of `@veljaos/tokens/brand` (P3.7), the Core's default brand. Components
 * never import them: AppShell, AuthShell and the status pages take the logo through props, and
 * the application passes these files.
 */

interface BrandFile {
  /** The path under `@veljaos/tokens/brand/`. */
  name: string
  src: string
  /** What it is for. */
  use: string
}

const WORDMARKS: BrandFile[] = [
  { name: 'wordmark-light.svg', src: wordmarkLight, use: 'Brand blue, on light backgrounds' },
  { name: 'wordmark-neutral.svg', src: wordmarkNeutral, use: 'Text colour, on light backgrounds' },
  { name: 'wordmark-mono-black.svg', src: wordmarkMonoBlack, use: 'Black, for print and fax' },
  { name: 'wordmark-mono-white.svg', src: wordmarkMonoWhite, use: 'White, on dark backgrounds' },
]

const ICONS: BrandFile[] = [
  { name: 'icon.svg', src: icon, use: 'Brand tile (also web/favicon.svg)' },
  { name: 'icon-light.svg', src: iconLight, use: 'Light tile' },
  { name: 'icon-dark.svg', src: iconDark, use: 'Dark tile, light blue mark' },
  { name: 'icon-dark-white.svg', src: iconDarkWhite, use: 'Dark tile, white mark' },
  { name: 'icon-mono-black.svg', src: iconMonoBlack, use: 'The mark alone, black' },
  { name: 'icon-mono-white.svg', src: iconMonoWhite, use: 'The mark alone, white' },
]

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 font-sans text-primary">
      <h2 className="m-0 text-h2">{title}</h2>
      <p className="m-0 max-w-3xl text-secondary">{intro}</p>
      {children}
    </div>
  )
}

/** The same content on the light and the dark surface, whatever the catalogue's theme. */
function OnBothThemes({ children }: { children: (theme: 'light' | 'dark') => ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(['light', 'dark'] as const).map((theme) => (
        <section
          key={theme}
          aria-label={theme === 'light' ? 'On light' : 'On dark'}
          data-liro-theme={theme}
          className="flex flex-col gap-4 rounded-md border border-solid border-default bg-surface-page p-4 text-primary"
        >
          <h3 className="m-0 text-h5">{theme === 'light' ? 'On light' : 'On dark'}</h3>
          {children(theme)}
        </section>
      ))}
    </div>
  )
}

function Caption({ file }: { file: BrandFile }) {
  return (
    <span className="flex flex-col text-xs">
      <code dir="ltr" className="font-mono text-secondary">
        {file.name}
      </code>
      <span className="text-tertiary">{file.use}</span>
    </span>
  )
}

const meta = {
  title: 'Foundations/Brand',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**What for:** the Liro brand files in `@veljaos/tokens/brand/` (import them as ' +
          "`@veljaos/tokens/brand/<file>`): the Core's default wordmark, icons and web icons. " +
          '**How:** an application passes them to AppShell, AuthShell and the status pages ' +
          'through their logo props; no component imports them. `brand/web/` is the set for a ' +
          "page's head: favicon.ico (16, 32, 48), favicon.svg, apple-touch-icon.png (180), " +
          'icon-192.png, icon-512.png, icon-maskable-512.png and site.webmanifest. All SVGs are ' +
          'outlines (no live text or fonts).',
      },
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Every version of the wordmark and the icon on light and on dark. */
export const Versions: Story = {
  render: () => (
    <Page
      title="Versions"
      intro="The wordmark and the icon in every version, on the light and the dark surface. There is no coloured wordmark for dark backgrounds yet: use the white monochrome wordmark there."
    >
      <OnBothThemes>
        {() => (
          <>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {WORDMARKS.map((file) => (
                <li key={file.name} className="flex flex-col gap-1">
                  <img
                    src={file.src}
                    alt={`Liro (${file.name})`}
                    className="h-10 w-auto self-start"
                  />
                  <Caption file={file} />
                </li>
              ))}
            </ul>
            <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3">
              {ICONS.map((file) => (
                <li key={file.name} className="flex flex-col gap-1">
                  <img src={file.src} alt={`Liro (${file.name})`} className="size-16" />
                  <Caption file={file} />
                </li>
              ))}
            </ul>
          </>
        )}
      </OnBothThemes>
    </Page>
  ),
}

const SIZES = [16, 32, 180, 512] as const

/** The icon at the sizes it is used: tab (16, 32), home screen (180), install (512). */
export const IconSizes: Story = {
  name: 'Icon sizes',
  render: () => (
    <Page
      title="Icon sizes"
      intro="icon.svg at 16, 32, 180 and 512 px, then the raster files at their own sizes: favicon.ico (16), apple-touch-icon.png (180) and icon-512.png."
    >
      <ul className="m-0 flex list-none flex-wrap items-end gap-6 p-0">
        {SIZES.map((size) => (
          <li key={size} className="flex flex-col items-start gap-1">
            <img src={icon} alt={`Liro icon, ${String(size)} px`} width={size} height={size} />
            <code dir="ltr" className="font-mono text-xs text-secondary">
              {size} px
            </code>
          </li>
        ))}
      </ul>
      <ul className="m-0 flex list-none flex-wrap items-end gap-6 p-0">
        {[
          { name: 'web/favicon.ico', src: favicon, size: 16 },
          { name: 'web/apple-touch-icon.png', src: appleTouchIcon, size: 180 },
          { name: 'web/icon-512.png', src: icon512, size: 512 },
        ].map((file) => (
          <li key={file.name} className="flex flex-col items-start gap-1">
            <img src={file.src} alt={file.name} width={file.size} height={file.size} />
            <code dir="ltr" className="font-mono text-xs text-secondary">
              {file.name}
            </code>
          </li>
        ))}
      </ul>
    </Page>
  ),
}

/**
 * The maskable icon: an installed app's launcher may cut it to any shape inside the safe zone, a
 * circle of 40% of its size around the centre (W3C manifest, "maskable").
 */
export const Maskable: Story = {
  render: () => (
    <Page
      title="Maskable icon"
      intro="web/icon-maskable-512.png with its safe zone (the dashed circle, radius 40%): the mark stays inside it. On the right, cut to a circle as a launcher may."
    >
      <div className="flex flex-wrap items-start gap-6">
        <figure className="relative m-0 size-[512px]">
          <img src={iconMaskable} alt="Liro maskable icon, 512 px" width={512} height={512} />
          <span
            aria-hidden="true"
            className="absolute inset-[10%] rounded-full border-2 border-dashed border-current text-on-accent"
          />
        </figure>
        <img
          src={iconMaskable}
          alt="Liro maskable icon, cut to a circle"
          width={256}
          height={256}
          className="rounded-full"
        />
      </div>
    </Page>
  ),
}
