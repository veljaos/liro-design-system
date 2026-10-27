import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { AssistantAnswer } from './assistant-answer'
import { ChainOfThought, Plan, Queue, Reasoning, Sources, Subagent, Task, Trace } from './trace'

function render(node: ReactNode) {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('Trace', () => {
  it('says each status in words and shimmers only a running title', () => {
    const html = render(
      <Trace
        label="Steps"
        steps={[
          { id: 'a', title: 'Read statement 188' },
          { id: 'b', title: 'Matching payments', status: 'running' },
          { id: 'c', title: 'Post the matches', status: 'pending' },
          { id: 'd', title: 'Could not read account 2040', status: 'error' },
        ]}
      />,
    )
    expect(html).toContain('aria-label="Steps"')
    expect(html).toContain(', In progress')
    expect(html).toContain(', Not started')
    expect(html).toContain(', Failed')
    expect(html.match(/liro-shimmer/g)).toHaveLength(1)
    expect(html).toContain('role="status"')
  })

  it('opens a row with detail or steps, and links a row with href', () => {
    const html = render(
      <Trace
        steps={[
          { id: 'a', title: 'Read the payload', detail: 'Body' },
          { id: 'b', title: 'Opened the rate list', href: 'https://nbs.rs' },
          { id: 'c', title: 'Opened invoice F-2026-0412', href: '#/sales/invoices/F-2026-0412' },
        ]}
      />,
    )
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('(opens in a new tab)')
    expect(html).toContain('href="#/sales/invoices/F-2026-0412"')
  })
})

describe('the patterns', () => {
  it('Reasoning is open while thinking and closed once done', () => {
    const thinking = render(<Reasoning status="running">Checking the ledger</Reasoning>)
    expect(thinking).toContain('Thinking…')
    expect(thinking).toContain('aria-expanded="true"')
    const done = render(
      <Reasoning status="done" duration="5 s">
        Checked
      </Reasoning>,
    )
    expect(done).toContain('Thought for 5 s')
    expect(done).toContain('aria-expanded="false"')
  })

  it('Plan counts its done steps, Queue its groups', () => {
    expect(
      render(
        <Plan
          title="Close September"
          steps={[
            { id: '1', title: 'Matched the bank' },
            { id: '2', title: 'Posting depreciation', status: 'running' },
            { id: '3', title: 'Run the trial balance', status: 'pending' },
          ]}
        />,
      ),
    ).toContain('1 of 3 done')
    expect(
      render(
        <Queue
          title="Lines to match"
          items={[
            { id: '1', title: 'Line 4', done: true },
            { id: '2', title: 'Line 5', done: false },
          ]}
        />,
      ),
    ).toContain('1 to do · 1 completed')
  })

  it('Sources removes duplicates and counts the records', () => {
    const html = render(
      <Sources
        items={[
          { id: 'f', label: 'Invoice F-2026-0412', href: '#/sales/invoices/F-2026-0412' },
          { id: 'f', label: 'Invoice F-2026-0412', href: '#/sales/invoices/F-2026-0412' },
          { id: 'a', label: 'Account 2040', href: '#/accounts/2040' },
        ]}
      />,
    )
    expect(html).toContain('Used 2 records')
  })

  it('Task, ChainOfThought and Subagent are one line until opened', () => {
    const steps = [{ id: '1', title: 'Read statement 188' }]
    expect(render(<ChainOfThought title="Checked 3 invoices" steps={steps} />)).toContain(
      'aria-expanded="false"',
    )
    expect(render(<Task title="Matched the statement" steps={steps} />)).toContain(
      'aria-expanded="false"',
    )
    const subagent = render(
      <Subagent name="Bank matcher" title="Matched 12 lines" duration="42 s" steps={steps} />,
    )
    expect(subagent).toContain('Bank matcher · 42 s')
    expect(subagent).toContain('aria-expanded="false"')
  })
})

describe('AssistantAnswer', () => {
  it('shows a code block and its work, and the sources as one line', () => {
    const html = render(
      <AssistantAnswer
        work={<Reasoning status="done" duration="3 s" />}
        blocks={[
          { kind: 'code', code: 'SELECT 1', language: 'sql', title: 'Query' },
          { kind: 'sources', items: [{ id: 's', label: 'Sales invoices', href: '#/sales' }] },
        ]}
      />,
    )
    expect(html).toContain('data-slot="code-block"')
    expect(html).toContain('Query')
    expect(html).toContain('Thought for 3 s')
    expect(html).toContain('Used 1 record')
  })
})
