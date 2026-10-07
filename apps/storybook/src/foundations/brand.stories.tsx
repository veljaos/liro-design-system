import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrandLockup, LiroProvider } from '@veljaos/ui'
import type { ReactNode } from 'react'
import icon from '@veljaos/tokens/brand/icon.svg'
import iconDark from '@veljaos/tokens/brand/icon-dark.svg'
import iconDarkWhite from '@veljaos/tokens/brand/icon-dark-white.svg'
import iconLight from '@veljaos/tokens/brand/icon-light.svg'
import iconMonoBlack from '@veljaos/tokens/brand/icon-mono-black.svg'
import iconMonoWhite from '@veljaos/tokens/brand/icon-mono-white.svg'
import appleTouchIcon from '@veljaos/tokens/brand/web/apple-touch-icon.png'
import favicon from '@veljaos/tokens/brand/web/favicon.ico'
import faviconSvg from '@veljaos/tokens/brand/web/favicon.svg'
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

type Surface = 'light' | 'dark'

interface BrandFile {
  /** The path under `@veljaos/tokens/brand/`. */
  name: string
  src: string
  /** What it is for. */
  use: string
  /** The backgrounds it is made for (P4.0: each surface shows only its own versions). */
  on: readonly Surface[]
}

const WORDMARKS: BrandFile[] = [
  { name: 'wordmark-light.svg', src: wordmarkLight, use: 'Brand blue', on: ['light'] },
  { name: 'wordmark-neutral.svg', src: wordmarkNeutral, use: 'Text colour', on: ['light'] },
  {
    name: 'wordmark-mono-black.svg',
    src: wordmarkMonoBlack,
    use: 'Black, for print and fax',
    on: ['light'],
  },
  { name: 'wordmark-mono-white.svg', src: wordmarkMonoWhite, use: 'White', on: ['dark'] },
]

const ICONS: BrandFile[] = [
  {
    name: 'icon.svg',
    src: icon,
    use: 'Brand tile (the installed app)',
    on: ['light', 'dark'],
  },
  { name: 'icon-light.svg', src: iconLight, use: 'Light tile, blue mark', on: ['light'] },
  { name: 'icon-dark.svg', src: iconDark, use: 'Dark tile, light blue mark', on: ['dark'] },
  { name: 'icon-dark-white.svg', src: iconDarkWhite, use: 'Dark tile, white mark', on: ['dark'] },
  { name: 'icon-mono-black.svg', src: iconMonoBlack, use: 'The mark alone, black', on: ['light'] },
  { name: 'icon-mono-white.svg', src: iconMonoWhite, use: 'The mark alone, white', on: ['dark'] },
]

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 font-sans text-primary">
      <h2 className="m-0 text-h2">{title}</h2>
      <p className="bidi-content m-0 max-w-3xl text-secondary">{intro}</p>
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
      <code dir="ltr" className="self-start font-mono text-secondary">
        {file.name}
      </code>
      <span className="bidi-content text-tertiary">{file.use}</span>
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

/** Each surface with only the versions made for it. */
export const Versions: Story = {
  render: () => (
    <Page
      title="Versions"
      intro="Each surface shows only the versions made for it. The icon.svg brand tile works on both. There is no coloured wordmark for dark backgrounds: use the white one there."
    >
      <OnBothThemes>
        {(theme) => (
          <>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {WORDMARKS.filter((file) => file.on.includes(theme)).map((file) => (
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
              {ICONS.filter((file) => file.on.includes(theme)).map((file) => (
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

/**
 * The application lockup (P4.0, owner): BrandLockup from `@veljaos/ui`, the name as text — no
 * icon — as the header, the status pages and the sign-in screen show it.
 */
export const Lockup: Story = {
  render: () => (
    <Page
      title="App lockup"
      intro="The application's name in the header: text, no icon. Space Grotesk in the brand's text colour, the brand bold and the product name regular, one line; both names are data. Below 48em only the brand name. The wordmark and icon files are for documents, e-mail, the favicon and the installed app."
    >
      <OnBothThemes>
        {(theme) => (
          <LiroProvider locale="en" colorScheme={theme}>
            {/* On the header's surface, where it stands (on the grey page it would not reach
                4.5:1). */}
            <div className="flex flex-col items-start gap-6 rounded-md border border-solid border-default bg-surface-header p-4">
              <BrandLockup brandName="Liro" productName="Business Apps" compact={false} />
              <BrandLockup brandName="Liro" productName="Business Apps" size="lg" compact={false} />
              <BrandLockup brandName="Liro" productName="Business Apps" compact />
            </div>
          </LiroProvider>
        )}
      </OnBothThemes>
    </Page>
  ),
}

/**
 * The browser tab's favicon (P4.7b, drawn by the owner): the small mark redrawn from the logo's
 * rule — a centre dot and rings, the dots larger toward the bottom-left and smaller toward the
 * top-right — on a transparent background, brand blue, lighter in a dark browser. The
 * installed-app icons keep the blue tile and the full sphere.
 */
export const Favicon: Story = {
  render: () => (
    <Page
      title="Favicon"
      intro="web/favicon.svg at 16 and 32 px on a light and a dark tab bar. It follows the browser's colour scheme: brand-blue dots (blue 6) in a light browser, the lighter blue (blue 4) in a dark one. web/favicon.ico holds 16, 32 and 48 px; favicon-16.png and favicon-32.png are the same mark as PNG files. Drawn by the owner from the logo's rule; the full sphere stays for 48 px and up."
    >
      <OnBothThemes>
        {() => (
          <div className="flex items-center gap-6">
            {[16, 32].map((size) => (
              <span key={size} className="flex items-center gap-2 text-xs text-secondary">
                <img
                  src={faviconSvg}
                  alt={`Liro favicon, ${String(size)} px`}
                  width={size}
                  height={size}
                />
                <code dir="ltr" className="font-mono">
                  {size} px
                </code>
              </span>
            ))}
          </div>
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
