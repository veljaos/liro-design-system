import { createElement as h } from 'react'
import { FEATURED, INVOICES } from '../../storybook/src/examples/examples-story-data'
import { Invoice } from '../../storybook/src/examples/screens-core'
import { renderScreen } from './screen'

const invoice = INVOICES.find((each) => each.number === FEATURED)
if (invoice === undefined) throw new Error('perf: the featured invoice is missing')
renderScreen(h(Invoice, { phone: true, invoice }))
