import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { Diagram } from './diagram'
import { Position } from '@xyflow/react'
import { handleSides, labelTransform } from './diagram-nodes'
import { nextText, problemTarget } from './diagram-parts'
import {
  APPROVAL_CONNECTIONS,
  APPROVAL_LANES,
  APPROVAL_STEPS,
  LEAVE_CONNECTIONS,
  LEAVE_PROBLEMS,
  LEAVE_STEPS,
  NIGHTLY_CONNECTIONS,
  NIGHTLY_FAILED,
  NIGHTLY_STEPS,
} from './diagram-story-data'

function render(node: ReactNode, locale = 'en') {
  return renderToStaticMarkup(<LiroProvider locale={locale}>{node}</LiroProvider>)
}

const APPROVAL = { steps: APPROVAL_STEPS, connections: APPROVAL_CONNECTIONS }

describe('Diagram', () => {
  it('shows the steps as a list in the flow’s order, with lanes and what follows', () => {
    const html = render(
      <Diagram
        label="Approval"
        {...APPROVAL}
        lanes={APPROVAL_LANES}
        defaultView="steps"
        screen="desktop"
      />,
    )
    expect(html).toContain('<ol aria-label="Approval" data-slot="diagram-steps"')
    expect(html.indexOf('Invoice received')).toBeLessThan(html.indexOf('Check the invoice'))
    expect(html).toContain('Lane: Management')
    expect(html).toContain(
      'Next: Manager approves (Up to 100.000,00 RSD), Director approves (Above 100.000,00 RSD)',
    )
    expect(html).toContain('Show the diagram')
  })
  it('sums a run up and offers a failed step’s actions in the list', () => {
    const html = render(
      <Diagram
        label="Nightly"
        steps={NIGHTLY_STEPS}
        connections={NIGHTLY_CONNECTIONS}
        mode="run"
        run={NIGHTLY_FAILED}
        defaultView="steps"
        screen="desktop"
      />,
    )
    expect(html).toContain('5 of 11 steps done')
    expect(html).toContain('1 failed')
    expect(html).toContain('Started 02:00, stopped 02:01')
    expect(html).toContain('The bank did not answer in 30 s.')
    expect(html).toContain('aria-label="Retry: Import the savings account"')
    expect(html).toContain('Not reached')
  })
  it('lists the application’s problems with Go to', () => {
    const html = render(
      <Diagram
        label="Leave"
        steps={LEAVE_STEPS}
        connections={LEAVE_CONNECTIONS}
        problems={LEAVE_PROBLEMS}
        mode="edit"
        defaultView="steps"
        screen="desktop"
      />,
    )
    expect(html).toContain('3 problems')
    expect(html).toContain('aria-label="Go to Archive the request"')
    expect(html).toContain('Approved? → Record the leave: </span>A decision needs a default path.')
  })
  it('offers no editing on a phone', () => {
    const html = render(
      <Diagram
        label="Leave"
        steps={LEAVE_STEPS}
        connections={LEAVE_CONNECTIONS}
        mode="edit"
        defaultView="steps"
        screen="phone"
      />,
    )
    expect(html).toContain('Open this diagram on a larger screen to change it.')
    expect(html).not.toContain('Add a step')
  })
  it('shows loading, empty and error in the canvas’s place', () => {
    expect(render(<Diagram label="L" steps={[]} connections={[]} loading />)).toContain(
      'aria-label="Loading the diagram"',
    )
    expect(render(<Diagram label="L" steps={[]} connections={[]} />)).toContain('No steps yet')
    expect(
      render(<Diagram label="L" {...APPROVAL} error={{ onRetry: () => undefined }} />),
    ).toContain('The diagram could not be loaded.')
  })
})

describe('the parts', () => {
  it('writes what follows a step, the default flow named when it has no label', () => {
    const model = {
      steps: APPROVAL_STEPS,
      connections: APPROVAL_CONNECTIONS.map((each) =>
        each.id === 'c5' ? { id: 'c5', from: 'amount', to: 'manager', isDefault: true } : each,
      ),
    }
    expect(nextText(model, 'amount', messagesEn['diagram.nextStep'], 'Default', 'en')).toBe(
      'Manager approves (Default), Director approves (Above 100.000,00 RSD)',
    )
    expect(nextText(model, 'paid', messagesEn['diagram.nextStep'], 'Default', 'en')).toBeNull()
  })
  it('names what a problem is about', () => {
    expect(problemTarget(APPROVAL, { id: '1', stepId: 'check', message: 'x' })).toBe(
      'Check the invoice',
    )
    expect(problemTarget(APPROVAL, { id: '2', connectionId: 'c4', message: 'x' })).toBe(
      'Correct? → Return to the supplier',
    )
    expect(problemTarget(APPROVAL, { id: '3', message: 'x' })).toBeNull()
  })
  it('mirrors the handles and the labels’ places', () => {
    expect(handleSides('start-to-end', false)).toEqual({
      target: Position.Left,
      source: Position.Right,
    })
    expect(handleSides('start-to-end', true)).toEqual({
      target: Position.Right,
      source: Position.Left,
    })
    expect(handleSides('top-to-bottom', true)).toEqual({
      target: Position.Top,
      source: Position.Bottom,
    })
    expect(labelTransform(100, 50, Position.Left, false)).toBe(
      'translate(86px, 47px) translate(-100%, -100%)',
    )
    expect(labelTransform(100, 50, Position.Right, true)).toBe(
      'translate(114px, 47px) translate(0, -100%)',
    )
    expect(labelTransform(100, 50, Position.Top, true)).toBe(
      'translate(94px, 36px) translate(-100%, -100%)',
    )
  })
})
