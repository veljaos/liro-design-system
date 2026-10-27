import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { CompactIconButton } from '../components/button'
import { CodeBlock } from '../components/code-block'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { IMPORT_LOG, SEF_RESPONSE, WEBHOOK_EXAMPLE } from '../components/trace-story-data'
import { settle } from '../primitives/story-helpers'
import { CodeHighlighting } from './code-highlighting'

/** The browser's clipboard in a story: it may refuse, as a real one can. */
function stubClipboard(works: boolean, copied: string[] = []) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: (text: string) => {
        copied.push(text)
        return works ? Promise.resolve() : Promise.reject(new Error('Not allowed'))
      },
    },
  })
}

/** Waits until every CodeBlock in the story has its highlighting. */
async function highlighted(canvasElement: HTMLElement) {
  await settle()
  await waitFor(async () => {
    for (const block of canvasElement.querySelectorAll('[data-slot="code-block"]')) {
      await expect(block).toHaveAttribute('data-ready', 'true')
    }
  })
}

const QUERY = `-- Invoices overdue more than 30 days on 14.10.2026.
SELECT number, customer, due_date, open_amount
FROM sales_invoices
WHERE status = 'issued'
  AND due_date < DATE '2026-09-14'
ORDER BY due_date;`

const DIFF = `--- a/payment-rules.json
+++ b/payment-rules.json
@@ -3,6 +3,7 @@
   "matchBy": "reference",
-  "tolerance": "0.00",
+  "tolerance": "1.00",
+  "currency": "RSD",
   "account": "2040",
   "autoPost": false
 }`

const TYPESCRIPT = `export async function sendInvoice(id: string): Promise<SendResult> {
  const invoice = await invoices.get(id)
  if (invoice.status !== 'issued') {
    throw new Error(\`Invoice \${invoice.number} is not issued\`)
  }
  // SEF answers within 30 s, or the call is retried.
  return sef.send(invoice, { timeout: 30_000, retries: 3 })
}`

const meta = {
  title: 'Components/Code/CodeBlock',
  component: CodeBlock,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** code, a payload, a query, terminal output or a diff, as the application ' +
          'gives it: an optional header (a file name or a label, the application’s actions, ' +
          '"Wrap lines"), Copy (the code only — no line numbers, no diff markers, no escape ' +
          'sequences; "Copied" announced), line numbers from a start line, added and removed ' +
          'lines (a tint and a + / − sign), highlighted lines, a height limit (the code scrolls ' +
          'inside and is a tab stop), a small size for tool output and logs, and a terminal’s ' +
          'colours (`language="ansi"`). The code is always left to right.\n\n' +
          '**Highlighting:** CodeBlock is in `@veljaos/ui` and draws plain text. Syntax ' +
          'highlighting is `@veljaos/ui/code` — Shiki with its JavaScript engine, each language ' +
          'loaded on first use — given once with `<CodeHighlighting>`, so an application that ' +
          'shows no code never loads it. Every colour is the Liro code theme (`--liro-code-*` from ' +
          'the tokens), never Shiki’s.\n\n' +
          '**When to use:** integration errors and payloads (HealthList’s details), automation ' +
          'run logs (Diagram’s run), API and webhook examples, code in an assistant’s answer. ' +
          '**When not:** a value to copy such as an account number or a link (ShareLinks, ' +
          'RecoveryCodes); a keyboard shortcut (ShortcutHint); formatted text (RichText).',
      },
    },
  },
  args: { code: SEF_RESPONSE, language: 'json', title: 'SEF response' },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <CodeHighlighting>
          <div className="max-w-[40rem]">
            <Story />
          </div>
        </CodeHighlighting>
      </ExampleProvider>
    ),
  ],
  play: ({ canvasElement }) => highlighted(canvasElement),
} satisfies Meta<typeof CodeBlock>

export default meta

type Story = StoryObj<typeof meta>

/** A payload with its title and Copy, highlighted with the Liro code theme. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await highlighted(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'SEF response' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Copy' })).toBeVisible()
    await expect(canvasElement.querySelector('[style*="--liro-code-"]')).not.toBeNull()
  },
}

/** Line numbers from a start line, the lines the application points at, a height limit. */
export const LineNumbers: Story = {
  name: 'Line numbers and highlighted lines',
  args: {
    code: TYPESCRIPT,
    language: 'ts',
    title: 'send-invoice.ts',
    lineNumbers: true,
    startLine: 41,
    highlightLines: [43, 44, 45],
    maxHeight: 200,
    actions: <CompactIconButton icon={Download} label="Download" />,
  },
}

/** A diff: added and removed lines with a tint and a sign; Copy takes the code after the change. */
export const Diff: Story = {
  args: { code: DIFF, language: 'diff', title: 'payment-rules.json', lineNumbers: true },
}

/** Terminal output in the small size: its colours from the Liro code theme. */
export const Terminal: Story = {
  name: 'Terminal output',
  args: { code: IMPORT_LOG, language: 'ansi', title: 'Nightly import', size: 'sm', wrap: true },
}

/** A failure's output: the danger border and title. */
export const Failure: Story = {
  args: {
    code: WEBHOOK_EXAMPLE,
    language: 'http',
    title: 'Webhook call · 502 Bad Gateway',
    tone: 'danger',
    wrap: true,
  },
}

/** Without a title: Copy floats over the end of the first line; plain text needs no highlighter. */
export const Plain: Story = {
  name: 'Without a header',
  tags: ['!dev'],
  render: () => <CodeBlock code="pnpm add @veljaos/ui" size="sm" />,
}

/** Long lines wrap with "Wrap lines" on; a long unbroken string breaks inside the box. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  args: {
    code: `{"description": "Payment for invoices F-2026-0371, F-2026-0384 and F-2026-0390 according to the contract of 12.03.2026. and its annex of 01.09.2026.", "reference": "${'97'.repeat(40)}"}`,
    title: 'A very long file name of an exported payload from the electronic invoicing system.json',
    wrap: true,
    wrapToggle: true,
  },
}

/** Empty: one empty line, still a labelled region with Copy. */
export const Empty: Story = {
  tags: ['!dev'],
  args: { code: '', title: 'response.txt', language: 'text' },
}

/** Phone width: the code scrolls sideways inside its box; the page never does. */
export const Phone: Story = {
  tags: ['!dev'],
  args: { code: QUERY, language: 'sql', title: 'Query', lineNumbers: true },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic page: the header right to left, the code left to right. */
export const Arabic: Story = {
  tags: ['!dev'],
  args: {
    code: '{\n  "الحالة": "مرفوض",\n  "code": 4012\n}',
    title: 'رد الخدمة',
    lineNumbers: true,
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <Story />
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  args: {
    code: '{\n  "状態": "却下",\n  "メッセージ": "買い手の税番号が登録されていません"\n}',
    title: 'サービスの応答',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <Story />
      </StoryProvider>
    ),
  ],
}

/** Copy: the code only goes to the clipboard and "Copied" is announced; a refusal says so. */
export const CopyInteraction: Story = {
  name: 'Copy, interaction',
  tags: ['interaction', '!dev'],
  args: { code: DIFF, language: 'diff', title: 'payment-rules.json', lineNumbers: true },
  play: async ({ canvasElement }) => {
    await highlighted(canvasElement)
    const canvas = within(canvasElement)
    const copied: string[] = []
    stubClipboard(true, copied)
    await userEvent.click(canvas.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Copied'))
    await expect(copied[0]).not.toContain('"tolerance": "0.00"')
    await expect(copied[0]?.startsWith('  "matchBy"')).toBe(true)
    stubClipboard(false)
    await userEvent.click(canvas.getByRole('button', { name: 'Copied' }))
    await waitFor(() =>
      expect(canvas.getByRole('status')).toHaveTextContent('The code could not be copied.'),
    )
  },
}

/** A block that scrolls is a tab stop; "Wrap lines" is a pressed toggle. */
export const KeyboardInteraction: Story = {
  name: 'Scroll and wrap, interaction',
  tags: ['interaction', '!dev'],
  args: {
    code: QUERY,
    language: 'sql',
    title: 'Query',
    wrapToggle: true,
    maxHeight: 96,
  },
  play: async ({ canvasElement }) => {
    await highlighted(canvasElement)
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: 'Query' })
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'))
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    await expect(region).toHaveFocus()
    const wrap = canvas.getByRole('button', { name: 'Wrap lines' })
    await expect(wrap).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(wrap)
    await expect(wrap).toHaveAttribute('aria-pressed', 'true')
  },
}
