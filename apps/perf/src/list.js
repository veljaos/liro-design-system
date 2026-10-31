import { createElement as h } from 'react'
import { InvoiceList } from '../../storybook/src/examples/screens-core'
import { renderScreen } from './screen'

renderScreen(h(InvoiceList, { phone: true }))
