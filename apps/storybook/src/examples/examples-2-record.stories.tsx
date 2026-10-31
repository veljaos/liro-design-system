import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { BC_ROUTES } from './data-BC'

const meta = {
  title: 'Examples/F2 Record',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'F2 Record (DetailPage / RecordFormPage / SettingsPage): a record viewed and edited as a whole — the employee record in one view / edit mode with Cancel – Save, and My profile as a SettingsPage saved at once.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/**
 * An employee's record: header, key figures, then Personal, Employment, Leave and Payroll as
 * text; one Edit turns the whole record into fields.
 */
export const EmployeeScreen: Story = {
  name: 'Employee record',
  render: () => <ExampleApp start={ROUTES.employee} />,
}

/** Edit: the same sections as fields (Leave stays read-only), Cancel and Save in the bottom bar. */
export const EmployeeEdit: Story = {
  name: 'Employee record, editing',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.employee} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await settle()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Address' }), ', stan 4')
    await expect(canvas.getByText('Unsaved changes')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible()
  },
}

export const EmployeePhone: Story = {
  name: 'Employee record, phone',
  render: () => <OnPhone start={ROUTES.employee} />,
}

/** Settles, checks, and on a phone checks that no page scrolls sideways. */
function identityPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/** Waits until every toast is gone, so the checks never end on one fading. */
async function noToasts() {
  notice.dismiss()
  await waitFor(
    async () => {
      await expect(document.querySelector('[data-sonner-toast]')).toBeNull()
    },
    { timeout: 5000 },
  )
}

/** Types a whole code into CodeInput's boxes from the first. */
async function typeCode(root: HTMLElement, code: string) {
  await userEvent.click(within(root).getByRole('textbox', { name: /Character 1 of 6/ }))
  await userEvent.keyboard(code)
}

/**
 * Milica Petrović's own profile (SettingsPage, opened from the user menu's "Profile"):
 * Preferences — her name and e-mail as the administrator set them, the interface language (each
 * language in its own name, `lang` on the option) and the theme, saved at once.
 */
const PROFILE_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'My profile' })).toBeVisible()
  await expect(canvas.getByRole('tab', { name: 'Preferences', selected: true })).toBeVisible()
  await expect(canvas.getByRole('combobox', { name: 'Language' })).toHaveTextContent('English')
}

export const MyProfile: Story = {
  name: 'My profile',
  render: () => <ExampleApp start={BC_ROUTES.preferences} />,
  play: identityPlay(PROFILE_CHECK),
}

export const MyProfilePhone: Story = {
  name: 'My profile, phone',
  render: () => <OnPhone start={BC_ROUTES.preferences} />,
  play: identityPlay(PROFILE_CHECK, true),
}

/** From the user menu: Profile opens My profile. */
export const MyProfileFromMenu: Story = {
  name: 'My profile, from the user menu, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Account' }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Profile' }))
    await expect(await canvas.findByRole('heading', { level: 1, name: 'My profile' })).toBeVisible()
    // A language chosen saves at once.
    await userEvent.click(canvas.getByRole('combobox', { name: 'Language' }))
    await userEvent.click(
      await within(document.body).findByRole('option', { name: 'Srpski (latinica)' }),
    )
    await expect(await canvas.findByText('Saved')).toBeVisible()
    await settle()
  },
}

/** Off → Turn on → the code → the recovery codes kept → on. */
export const MyProfileTurnOnFlow: Story = {
  name: 'My profile, turn on two-factor sign-in, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BC_ROUTES.twoFactorOff} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Turn on' }))
    const dialog = await body.findByRole('dialog', { name: 'Turn on two-factor sign-in' })
    // An incomplete code is refused.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Turn on' }))
    // The message comes in under the boxes; the check waits for it to arrive.
    await waitFor(async () => {
      await expect(within(dialog).getByText(/The code is wrong/)).toBeVisible()
    })
    await typeCode(dialog, '314159')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Turn on' }))
    const codes = await body.findByRole('dialog', { name: 'Save your recovery codes' })
    await userEvent.click(within(codes).getByRole('checkbox', { name: 'I have saved these codes' }))
    await userEvent.click(within(codes).getByRole('button', { name: 'Continue' }))
    await waitFor(async () => {
      await expect(canvas.getByText(/On since/)).toBeVisible()
    })
    await noToasts()
  },
}

/** Add a passkey (the browser's step is the Core's), name it, then remove another. */
export const MyProfilePasskeysFlow: Story = {
  name: 'My profile, add and remove a passkey, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BC_ROUTES.security} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Add a passkey' }))
    const dialog = await body.findByRole('dialog', { name: 'Passkey added' })
    const name = within(dialog).getByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Office computer')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await expect(await canvas.findByText('Office computer')).toBeVisible()
    const removes = canvas.getAllByRole('button', { name: 'Remove' })
    const first = removes[0]
    if (first === undefined) throw new Error('No passkey to remove')
    await userEvent.click(first)
    const confirm = await body.findByRole('alertdialog', { name: /Remove passkey/ })
    await expect(confirm).toHaveTextContent('YubiKey 5C NFC')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Remove' }))
    await waitFor(async () => {
      await expect(canvas.queryByText('YubiKey 5C NFC')).toBeNull()
    })
    await noToasts()
  },
}

/** Sign out one device, then every other one: only this device stays. */
export const MyProfileDevicesFlow: Story = {
  name: 'My profile, sign out devices, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BC_ROUTES.devices} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out: Safari on iPad' }))
    await waitFor(async () => {
      await expect(canvas.queryByText('Safari on iPad')).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Sign out all other devices' }))
    await expect(await canvas.findByText('No other device is signed in.')).toBeVisible()
    await noToasts()
  },
}
