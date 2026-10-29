import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { Y_ROUTES } from './data-Y'

const meta = {
  title: 'Examples/Shell',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          "The shells every screen sits in (docs/floorplans.md): AuthShell (sign in with its password and two-factor steps), AppShell (the home page, the bell's notifications, a page that does not exist) and PortalShell (the employee portal). The walk-through signs in and clicks through a list, a document, a worklist and the overview, as one application linked through the provider's `linkComponent`.",
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/**
 * The whole path: sign in (the e-mail, the password and the two-factor code), open Sales from
 * the home page, preview and open F-2026-0412, back to the list, the notifications, bank
 * statement 188 from its notification, home, the overview.
 * The same invoice shows the same total in the list, on its page and in the overview.
 */
export const WalkThrough: Story = {
  name: 'Walk-through',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.signIn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    // P5.63: the password, then the two-factor code (group BD).
    await userEvent.type(await canvas.findByLabelText('Password'), 'correct horse battery')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }))
    await userEvent.click(await canvas.findByRole('textbox', { name: /Character 1 of 6/ }))
    await userEvent.keyboard('314159')
    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Sales/ }))
    await settle()
    const row = await canvas.findByRole('row', { name: /F-2026-0412/ })
    await expect(row).toHaveTextContent('185.954,00')
    await userEvent.click(row)
    await settle()
    const drawer = within(document.body).getByRole('dialog', { name: 'F-2026-0412' })
    await userEvent.click(within(drawer).getByRole('button', { name: 'Open' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'F-2026-0412' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('185.954,00')
    await expect(canvasElement).toHaveTextContent('135.954,00')
    await userEvent.click(canvas.getByRole('link', { name: 'Back to Invoices' }))
    await settle()
    await expect(await canvas.findByRole('row', { name: /F-2026-0412/ })).toBeVisible()
    // The bell: the panel, then "View all" opens the notifications page.
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 2 unread' }))
    await settle()
    await userEvent.click(within(document.body).getByRole('link', { name: 'View all' }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Notifications' }),
    ).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'Today' })).toBeVisible()
    // Opening a notification goes to its record and marks it read.
    await userEvent.click(canvas.getByRole('link', { name: /UF-2026-1187 from EPS Snabdevanje/ }))
    await settle()
    await expect(
      await canvas.findByRole('button', { name: 'Notifications, 1 unread' }),
    ).toBeVisible()
    // The bank statement from its notification, then the overview from the home page.
    await userEvent.click(canvas.getByRole('button', { name: 'Notifications, 1 unread' }))
    await settle()
    await userEvent.click(within(document.body).getByRole('link', { name: 'View all' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Bank statement 188 imported/ }))
    await settle()
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Statement 188' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: 'Liro Business Apps' }))
    await settle()
    await userEvent.click(await canvas.findByRole('link', { name: /Overview/ }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
    const largest = canvas.getByRole('link', { name: 'F-2026-0412' }).closest('tr')
    await expect(largest).toHaveTextContent('185.954,00')
    await expect(largest).toHaveTextContent('135.954,00')
  },
}

/** Sign-in (AuthShell). Continue opens the home page. */
export const SignInScreen: Story = {
  name: 'Sign in',
  render: () => <ExampleApp start={ROUTES.signIn} />,
}

export const SignInPhone: Story = {
  name: 'Sign in, phone',
  render: () => <OnPhone start={ROUTES.signIn} />,
}

/** The home page: the modules; Sales, Purchasing, Overview and Employees open their examples. */
export const HomeScreen: Story = {
  name: 'Home',
  render: () => <ExampleApp start={ROUTES.home} />,
}

export const HomePhone: Story = {
  name: 'Home, phone',
  render: () => <OnPhone start={ROUTES.home} />,
}

/** Every notification of every company, grouped by day, with filters (from the bell's "View all"). */
export const NotificationsExample: Story = {
  name: 'Notifications',
  render: () => <ExampleApp start={ROUTES.notifications} />,
}

export const NotificationsPhone: Story = {
  name: 'Notifications, phone',
  render: () => <OnPhone start={ROUTES.notifications} />,
}

export const NotFoundScreen: Story = {
  name: 'Not found (404)',
  render: () => <ExampleApp start="/banking" />,
}

export const NotFoundPhone: Story = {
  name: 'Not found (404), phone',
  render: () => <OnPhone start="/banking" />,
}

/** An employee portal story's checks, and on a phone that nothing scrolls sideways. */
function employeePlay(
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

/**
 * The employee portal of Kvadrat Gradnja d.o.o. (P5.35, PortalShell) as Nikola Marković, a site
 * worker on Liman 4, sees it on 14.10.2026: the annex waiting for his signature, his latest
 * payslip, the leave left, his next shift (changed to a night pour) and his details.
 */
const EMPLOYEE_HOME_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Hello, Nikola' })).toBeVisible()
  await expect(canvas.getByRole('link', { name: 'September 2026' })).toBeVisible()
  await expect(canvas.getByRole('button', { name: 'Open the annex' })).toBeVisible()
}

export const EmployeePortal: Story = {
  name: 'Employee portal',
  render: () => <ExampleApp start={Y_ROUTES.home} />,
  play: employeePlay(EMPLOYEE_HOME_CHECK),
}

export const EmployeePortalPhone: Story = {
  name: 'Employee portal, phone',
  render: () => <OnPhone start={Y_ROUTES.home} />,
  play: employeePlay(EMPLOYEE_HOME_CHECK, true),
}

/** Every common question, with search and categories (P5.94 item 20). */
const QUESTIONS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Common questions' })).toBeVisible()
  await expect(canvas.getByRole('searchbox', { name: 'Search questions' })).toBeVisible()
  await expect(
    canvas.getByRole('button', { name: 'I changed my ID card. Do I have to tell my employer?' }),
  ).toBeVisible()
}

export const EmployeeQuestions: Story = {
  name: 'Employee portal, common questions',
  tags: ['!dev'],
  render: () => <ExampleApp start={Y_ROUTES.questions} />,
  play: employeePlay(QUESTIONS_CHECK),
}

export const EmployeeQuestionsPhone: Story = {
  name: 'Employee portal, common questions, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={Y_ROUTES.questions} />,
  play: employeePlay(QUESTIONS_CHECK, true),
}

/** Paid leave for a death in the family: Kind, Reason (5 days), the proof it needs (P5.94 item 3). */
const LEAVE_PROOF_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('combobox', { name: 'Reason' })).toHaveTextContent(
    'Death of a family member',
  )
  const expected = canvas.getByRole('list', { name: 'Attach' })
  await expect(within(expected).getByText('Death certificate')).toBeVisible()
  await expect(within(expected).getByText('Required')).toBeVisible()
}

export const EmployeeLeaveProof: Story = {
  name: 'Employee portal, paid leave with proof',
  tags: ['!dev'],
  render: () => <ExampleApp start={Y_ROUTES.newLeaveOf('paid', 'death')} />,
  play: employeePlay(LEAVE_PROOF_CHECK),
}

export const EmployeeLeaveProofPhone: Story = {
  name: 'Employee portal, paid leave with proof, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={Y_ROUTES.newLeaveOf('paid', 'death')} />,
  play: employeePlay(async (canvasElement) => {
    await LEAVE_PROOF_CHECK(canvasElement)
    await expect(within(canvasElement).getByRole('button', { name: 'Take a photo' })).toBeVisible()
  }, true),
}

/** A file as a browser gives it (the content is not read). */
function photo(name: string): File {
  const made = new File(['x'], name, { type: 'image/jpeg' })
  Object.defineProperty(made, 'size', { value: 1_900_000 })
  return made
}

/**
 * Request paid leave from the home page (P5.94 items 2 and 3; on a phone started filled in, as a
 * common question starts it): Kind, Reason, the dates typed the quick way, Send says what is missing, the certificate attached, sent; the request's page shows
 * the proof to whoever opens it.
 */
async function requestPaidLeave(canvasElement: HTMLElement, fromHome: boolean) {
  await settle()
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  if (fromHome) {
    await userEvent.click(canvas.getByRole('button', { name: 'Request leave' }))
    await userEvent.click(await canvas.findByRole('combobox', { name: 'Kind' }))
    await userEvent.click(await body.findByRole('option', { name: 'Paid leave' }))
    await userEvent.click(await canvas.findByRole('combobox', { name: 'Reason' }))
    await userEvent.click(await body.findByRole('option', { name: 'Death of a family member' }))
  }
  await expect(await canvas.findByText('Up to 5 working days')).toBeVisible()
  // The dates typed, no calendar: "19.10." and "23.10." in this year.
  // On a phone the list is a sheet over the page: the page answers again once it has closed.
  await settle()
  await userEvent.click(await canvas.findByRole('textbox', { name: 'Dates Start' }))
  await userEvent.keyboard('19.10.')
  await userEvent.tab()
  await userEvent.keyboard('23.10.')
  await userEvent.tab()
  await expect(canvas.getByRole('textbox', { name: 'Dates Start' })).toHaveValue('19.10.2026.')
  await expect(await canvas.findByText('5 working days')).toBeVisible()
  await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
  await expect(await canvas.findByText('Attach: Death certificate.')).toBeVisible()
  const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')
  if (input === null) throw new Error('No file input')
  await userEvent.upload(input, photo('Death certificate.jpg'))
  await expect(await canvas.findByText('Attached')).toBeVisible()
  await userEvent.click(canvas.getByRole('button', { name: 'Send request' }))
  await expect(await canvas.findByText('Request sent')).toBeVisible()
  const sent = await canvas.findByRole('link', { name: /Paid leave · Death of a family member/ })
  await expect(canvasElement).toHaveTextContent('1 attachment')
  await userEvent.click(sent)
  await expect(await canvas.findByRole('heading', { level: 1, name: 'LR-2026-032' })).toBeVisible()
  const proof = canvas.getByRole('list', { name: 'Proof sent with LR-2026-032' })
  await expect(within(proof).getByText('Death certificate.jpg')).toBeVisible()
  await expect(canvasElement).toHaveTextContent('Snežana Popović (site manager) approves next')
  await settle()
}

export const EmployeeLeaveProofFlow: Story = {
  name: 'Employee portal, request paid leave with proof, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Y_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await requestPaidLeave(canvasElement, true)
  },
}

export const EmployeeLeaveProofFlowPhone: Story = {
  name: 'Employee portal, request paid leave with proof, phone, interaction',
  tags: ['interaction', '!dev'],
  // Started filled in, as the common question "A family member died" starts it.
  render: () => <OnPhone start={Y_ROUTES.newLeaveOf('paid', 'death')} />,
  play: async ({ canvasElement }) => {
    await requestPaidLeave(canvasElement, false)
  },
}

/**
 * A common question starts its request (P5.94 item 20): "All questions", a search, the card
 * opened, "Report a change of address" opens the change request on the address with its proof.
 */
export const EmployeeQuestionFlow: Story = {
  name: 'Employee portal, a common question starts its request, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={Y_ROUTES.home} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('link', { name: 'All questions' }))
    await userEvent.type(
      await canvas.findByRole('searchbox', { name: 'Search questions' }),
      'adresa',
    )
    await expect(await canvas.findByText('1 question')).toBeVisible()
    const card = canvas.getByRole('button', { name: 'What do I need to change my address?' })
    await userEvent.click(card)
    await userEvent.click(canvas.getByRole('button', { name: 'Report a change of address' }))
    const drawer = await body.findByRole('dialog', { name: 'Request a change' })
    // The drawer slides in: its content is seen once the animation ends.
    await settle()
    await expect(within(drawer).getByRole('combobox', { name: 'What changes' })).toHaveTextContent(
      'Address',
    )
    await expect(within(drawer).getByText('Proof of the new address')).toBeVisible()
    await settle()
  },
}

/** Types a whole code into CodeInput's boxes from the first. */
async function typeCode(root: HTMLElement, code: string) {
  await userEvent.click(within(root).getByRole('textbox', { name: /Character 1 of 6/ }))
  await userEvent.keyboard(code)
}

/** E-mail → password → a wrong, then a right code → the home page. */
export const SignInTwoFactorFlow: Story = {
  name: 'Sign in with two-factor, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.signIn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await userEvent.type(await canvas.findByLabelText('Password'), 'correct horse battery')
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }))
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Two-factor sign-in' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }))
    await expect(canvas.getByText(/The code is wrong or has expired/)).toBeVisible()
    await typeCode(canvasElement, '314159')
    await userEvent.click(canvas.getByRole('button', { name: 'Verify' }))
    await expect(await canvas.findByRole('link', { name: /Sales/ })).toBeVisible()
    await settle()
  },
}
