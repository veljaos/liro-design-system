import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CSSProperties } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { notice, NoticeView, Toaster } from './notice'

const meta = {
  title: 'Components/Feedback/Toast',
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** telling the user that something happened, without stopping them: ' +
          '"Invoice saved", "Could not send the e-mail". Place `<Toaster />` once inside ' +
          'LiroProvider and call `notice.success | info | warning | error | loading(message, ' +
          '{ title })`. Success, info and warning close by themselves (3.5, 4 and 6 seconds); ' +
          'an error stays until the user closes it (Appendix B.8: successes disappear, errors ' +
          'wait). `notice.loading` stays, without a close button, until `notice.update(id, ' +
          'kind, message)` turns it into the result. Bottom right, bottom left in ' +
          'right-to-left; at most four at a time.\n\n' +
          '**When not:** a problem with a field (its error, under the field); something the ' +
          'user must decide (ConfirmDialog); a lasting state of the page (Alert or Banner).',
      },
    },
  },
  play: settle,
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof meta>

const WIDTH = { '--width': '440px' } as CSSProperties

/** Every kind, with and without a title (drawn in place, so the picture does not depend on time). */
export const Kinds: Story = {
  render: () => (
    <div className="flex max-w-full flex-col gap-4" style={WIDTH}>
      <NoticeView id="a" kind="success" message="Invoice F-114 saved." />
      <NoticeView id="b" kind="info" title="New version" message="Reload to use the new version." />
      <NoticeView id="c" kind="warning" message="The exchange rate is from yesterday." />
      <NoticeView
        id="d"
        kind="error"
        title="Not sent"
        message="The e-mail server did not answer."
      />
      <NoticeView id="e" kind="loading" message="Sending 24 invoices…" />
    </div>
  ),
}

/** With an action: "Undo" before the close button, only when the application can undo. */
export const WithAction: Story = {
  name: 'With an action (Undo)',
  render: () => (
    <div className="flex max-w-full flex-col gap-4" style={WIDTH}>
      <NoticeView
        id="a"
        kind="success"
        message="UF-2026-1187 approved."
        action={{ label: 'Undo', onClick: () => undefined }}
      />
      <NoticeView
        id="b"
        kind="info"
        message="UF-2026-1186 rejected: Wrong quantity on line 2."
        action={{ label: 'Undo', onClick: () => undefined }}
      />
    </div>
  ),
}

/** Loading, then its result; an error stays until closed with its button. */
export const LoadingThenResult: Story = {
  name: 'Loading, then the result',
  tags: ['interaction'],
  render: () => (
    <div className="flex min-h-100 flex-wrap items-start gap-3">
      <Button
        intent="save"
        label="Send"
        onClick={() => {
          const id = notice.loading('Sending 24 invoices…')
          window.setTimeout(() => {
            notice.update(id, 'error', 'The e-mail server did not answer.', { title: 'Not sent' })
          }, 300)
        }}
      />
      <Toaster />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Send' }))
    const loading = await body.findByText('Sending 24 invoices…')
    await waitFor(() => expect(loading).toBeVisible())
    await expect(body.queryByRole('button', { name: 'Close' })).toBeNull()
    const error = await body.findByRole('alert')
    await expect(error).toHaveTextContent('The e-mail server did not answer.')
    await waitFor(() => expect(within(error).getByRole('button', { name: 'Close' })).toBeVisible())
    await settle()
  },
}

/** Close an error with its button (keyboard: Tab to it, Enter). */
export const CloseWithButton: Story = {
  name: 'Close an error',
  tags: ['interaction'],
  render: () => (
    <div className="flex min-h-60 items-start gap-3">
      <Button
        intent="confirm"
        label="Show an error"
        onClick={() => notice.error('The period is closed.')}
      />
      <Toaster />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Show an error' }))
    const error = await body.findByRole('alert')
    await userEvent.click(within(error).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(body.queryByRole('alert')).toBeNull())
  },
}

/** Long title and message at phone width: the text wraps inside the toast. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div
      className="flex w-[390px] max-w-full flex-col gap-4"
      style={{ '--width': '358px' } as CSSProperties}
    >
      <NoticeView id="a" kind="error" title={LONG.label} message={LONG.error} />
      <NoticeView id="b" kind="success" message={LONG.description} />
    </div>
  ),
}

/** Arabic sample text, right to left: the icon at the start (right), the close button at the end. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-full flex-col gap-4" style={WIDTH}>
      <NoticeView id="a" kind="success" message={ARABIC.description} />
      <NoticeView id="b" kind="error" title={ARABIC.label} message={ARABIC.error} />
      <NoticeView id="c" kind="loading" message={ARABIC.value} />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-full flex-col gap-4" style={WIDTH}>
      <NoticeView id="a" kind="success" message={JAPANESE.description} />
      <NoticeView id="b" kind="error" title={JAPANESE.label} message={JAPANESE.error} />
      <NoticeView id="c" kind="warning" message={JAPANESE.value} />
    </div>
  ),
}
