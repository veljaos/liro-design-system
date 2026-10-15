/*
 * Payment orders of Kvadrat Gradnja d.o.o. (P5.40): the data of the order screen — the payment
 * codes (šifre plaćanja), the three orders the screen starts from, and the checks the application
 * runs. Every name, account and number is invented; accounts and references carry valid control
 * numbers.
 */
import {
  ipsAccountValid,
  ipsQrText,
  normalizeIpsAccount,
  type IpsProblem,
  type IpsProblemCode,
} from '@veljaos/ui'
import {
  orderPayment,
  PAYMENT,
  TRANSFER,
  WITHDRAWAL,
  type OrderData,
  type OrderKind,
} from '../../../../packages/ui/src/templates/payment-order-story-data'

export { PAYMENT, TRANSFER, WITHDRAWAL, type OrderData, type OrderKind }

/** The order screen's routes. */
export const AD_ROUTES = {
  transfer: '/banking/payment-orders',
  payment: '/banking/payment-orders?kind=payment',
  withdrawal: '/banking/payment-orders?kind=withdrawal',
  /** The transfer with two mistakes, checked: the problems under their fields. */
  problems: '/banking/payment-orders?problems',
}

/** The base payment codes; 1xx is cash, 2xx is non-cash (the same purposes). */
const PURPOSES: [string, string][] = [
  ['20', 'Promet robe i usluga – međufazna potrošnja'],
  ['21', 'Promet robe i usluga – finalna potrošnja'],
  ['22', 'Usluge javnih preduzeća'],
  ['23', 'Investicije u objekte i opremu'],
  ['24', 'Investicije – ostalo'],
  ['26', 'Zakupnine'],
  ['40', 'Zarade i druga primanja zaposlenih'],
  ['53', 'Uplata javnih prihoda izuzev poreza i doprinosa po odbitku'],
  ['54', 'Uplata poreza i doprinosa po odbitku'],
  ['60', 'Premije osiguranja i nadoknada štete'],
  ['65', 'Uplata pazara'],
  ['66', 'Isplata gotovine'],
  ['70', 'Kratkoročni krediti'],
  ['76', 'Otplata kratkoročnih kredita'],
  ['84', 'Platne kartice'],
  ['89', 'Transakcije po nalogu građana'],
  ['90', 'Druge transakcije'],
]

/** The payment codes offered: cash ones for payment and withdrawal orders first. */
export function paymentCodes(kind: OrderKind): { value: string; label: string }[] {
  const cash = PURPOSES.map(([code, label]) => ({
    value: `1${code}`,
    label: `1${code} · ${label}`,
  }))
  const nonCash = PURPOSES.map(([code, label]) => ({
    value: `2${code}`,
    label: `2${code} · ${label}`,
  }))
  return kind === 'transfer' ? [...nonCash, ...cash] : [...cash, ...nonCash]
}

/** The reference models offered. */
export const MODELS = [
  { value: '', label: 'No model' },
  { value: '97', label: '97' },
  { value: '22', label: '22' },
  { value: '11', label: '11' },
  { value: '00', label: '00' },
]

/** The fields of an order a problem can stand under. */
export type OrderField =
  | 'payer'
  | 'purpose'
  | 'payee'
  | 'paymentCode'
  | 'amount'
  | 'payerAccount'
  | 'payerReference'
  | 'payeeAccount'
  | 'payeeReference'

/** One problem of an order, under its field. */
export interface OrderProblem {
  field: OrderField
  code: IpsProblemCode
  limit?: number
}

const FROM_IPS: Partial<Record<IpsProblem['field'], OrderField>> = {
  payeeAccount: 'payeeAccount',
  payeeName: 'payee',
  amount: 'amount',
  payerName: 'payer',
  paymentCode: 'paymentCode',
  purpose: 'purpose',
  reference: 'payeeReference',
}

/**
 * The application's checks of an order: the IPS rules for what is paid into an account (forms 1
 * and 3), and the debited account, the payer and the amount of a withdrawal or transfer.
 */
export function orderProblems(order: OrderData): OrderProblem[] {
  const problems: OrderProblem[] = []
  if (order.payer.trim() === '') problems.push({ field: 'payer', code: 'required' })
  if (order.kind !== 'payment') {
    const account = normalizeIpsAccount(order.payerAccount ?? '')
    if ((order.payerAccount ?? '').trim() === '') {
      problems.push({ field: 'payerAccount', code: 'required' })
    } else if (account === null || !ipsAccountValid(account)) {
      problems.push({ field: 'payerAccount', code: 'account' })
    }
  }
  const payment = orderPayment(order)
  if (payment === null) {
    // A withdrawal: only the payee, the code and the amount besides the account.
    if (order.payee.trim() === '') problems.push({ field: 'payee', code: 'required' })
    if (!/^[12]\d{2}$/u.test(order.paymentCode)) {
      problems.push({
        field: 'paymentCode',
        code: order.paymentCode === '' ? 'required' : 'paymentCode',
      })
    }
    const amount = ipsQrText({ payeeAccount: '', payeeName: '', amount: order.amount }).problems
    const amountProblem = amount.find((problem) => problem.field === 'amount')
    if (amountProblem !== undefined) problems.push({ field: 'amount', code: amountProblem.code })
    return problems
  }
  for (const problem of ipsQrText(payment).problems) {
    const field = FROM_IPS[problem.field]
    if (field === undefined) continue
    if (field === 'payer' && problems.some((each) => each.field === 'payer')) continue
    problems.push({
      field,
      code: problem.code,
      ...(problem.limit === undefined ? {} : { limit: problem.limit }),
    })
  }
  return problems
}

/** The transfer with two mistakes: a wrong control number and an amount with three decimals. */
export const TRANSFER_WITH_PROBLEMS: OrderData = {
  ...TRANSFER,
  payeeAccount: '265-0000000654321-34',
  amount: '294000.005',
}
