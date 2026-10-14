/*
 * Sample payment orders for the PaymentOrderForm and QrCode stories and the examples (P5.40):
 * the three Serbian payment orders with their official labels, as an application passes them.
 * Every name, account and number is invented; the accounts and references carry valid control
 * numbers so the IPS QR codes are well formed. Not part of the package.
 */
import { ipsAccountText, ipsQrText, type IpsPayment } from '../components/ips-qr'
import type { PaymentOrderFormProps } from './payment-order'

/** Which order: payment (form 1), withdrawal (form 2) or transfer (form 3). */
export type OrderKind = 'payment' | 'withdrawal' | 'transfer'

/** One order's data, as the application keeps it. */
export interface OrderData {
  kind: OrderKind
  /** The payer (form 1), the one who withdraws (form 2), the debtor (form 3). */
  payer: string
  purpose: string
  /** The payee (forms 1 and 2), the creditor (form 3). */
  payee: string
  paymentCode: string
  currency: string
  /** A decimal string. */
  amount: string
  /** The debiting account (forms 2 and 3). */
  payerAccount?: string
  payerModel?: string
  payerReference?: string
  /** The crediting account (forms 1 and 3). */
  payeeAccount?: string
  payeeModel?: string
  payeeReference?: string
  urgent?: boolean
}

/** The official titles and labels (Serbian, Latin script). */
export const ORDER_LABELS = {
  payment: {
    title: 'NALOG ZA UPLATU',
    payer: 'uplatilac',
    purpose: 'svrha uplate',
    payee: 'primalac',
    signatures: ['pečat i potpis uplatioca', 'mesto i datum prijema', 'datum valute'],
    account: 'račun primaoca',
    reference: 'model i poziv na broj (odobrenje)',
  },
  withdrawal: {
    title: 'NALOG ZA ISPLATU',
    payer: 'isplatilac',
    purpose: 'svrha isplate',
    payee: 'primalac',
    signatures: ['pečat i potpis isplatioca', 'mesto i datum prijema', 'datum valute'],
    account: 'račun isplatioca',
    reference: 'model i poziv na broj (zaduženje)',
  },
  transfer: {
    title: 'NALOG ZA PRENOS',
    payer: 'dužnik – nalogodavac',
    purpose: 'svrha plaćanja',
    payee: 'poverilac – primalac',
    signatures: ['pečat i potpis nalogodavca', 'mesto i datum prijema', 'datum izvršenja'],
    account: 'račun dužnika – nalogodavca',
    reference: 'model i poziv na broj (zaduženje)',
    creditorAccount: 'račun poverioca – primaoca',
    creditorReference: 'model i poziv na broj (odobrenje)',
    urgent: 'hitno',
  },
  common: {
    paymentCode: 'šifra plaćanja',
    currency: 'valuta',
    amount: 'iznos',
    model: 'model',
    qrCaption: 'IPS QR',
  },
} as const

/** The IPS payment of an order that pays into an account (forms 1 and 3); null for form 2. */
export function orderPayment(order: OrderData): IpsPayment | null {
  if (order.kind === 'withdrawal' || order.payeeAccount === undefined) return null
  return {
    payeeAccount: order.payeeAccount,
    payeeName: order.payee,
    amount: order.amount,
    currency: order.currency,
    payerName: order.payer,
    paymentCode: order.paymentCode,
    purpose: order.purpose,
    ...(order.payeeModel === undefined ? {} : { model: order.payeeModel }),
    ...(order.payeeReference === undefined ? {} : { reference: order.payeeReference }),
  }
}

/** The IPS QR text of an order, or null (form 2, or a problem). */
export function orderQrText(order: OrderData): string | null {
  const payment = orderPayment(order)
  return payment === null ? null : ipsQrText(payment).text
}

const account = (value: string | undefined) => (value === undefined ? '' : ipsAccountText(value))

/** PaymentOrderForm's props for an order, with the official labels; the QR code if given. */
export function orderFormProps(
  order: OrderData,
  qrCode?: PaymentOrderFormProps['qrCode'],
): PaymentOrderFormProps {
  const labels = ORDER_LABELS[order.kind]
  const common = ORDER_LABELS.common
  const debit = {
    account: { label: labels.account, value: account(order.payerAccount) },
    model: { label: common.model, value: order.payerModel ?? '' },
    reference: { label: labels.reference, value: order.payerReference ?? '' },
  }
  const credit = {
    account: {
      label: order.kind === 'transfer' ? ORDER_LABELS.transfer.creditorAccount : labels.account,
      value: account(order.payeeAccount),
    },
    model: { label: common.model, value: order.payeeModel ?? '' },
    reference: {
      label: order.kind === 'transfer' ? ORDER_LABELS.transfer.creditorReference : labels.reference,
      value: order.payeeReference ?? '',
    },
  }
  return {
    title: labels.title,
    lang: 'sr-Latn',
    parties: [
      { label: labels.payer, value: order.payer },
      { label: labels.purpose, value: order.purpose, lines: 2 },
      { label: labels.payee, value: order.payee },
    ],
    signatures: labels.signatures,
    paymentCode: { label: common.paymentCode, value: order.paymentCode },
    currency: { label: common.currency, value: order.currency },
    amount: { label: common.amount, value: order.amount },
    accounts:
      order.kind === 'payment' ? [credit] : order.kind === 'withdrawal' ? [debit] : [debit, credit],
    ...(order.kind === 'transfer'
      ? { urgent: { label: ORDER_LABELS.transfer.urgent, checked: order.urgent === true } }
      : {}),
    ...(qrCode === undefined ? {} : { qrCode, qrCaption: common.qrCaption }),
  }
}

/** Kvadrat Gradnja pays Beton Mix's invoice 2026-1187 (form 3, a transfer). */
export const TRANSFER: OrderData = {
  kind: 'transfer',
  payer: 'Kvadrat Gradnja d.o.o.\nBulevar oslobođenja 12, Novi Sad',
  purpose: 'Plaćanje po računu 2026-1187',
  payee: 'Beton Mix d.o.o.\nRumenački put 40, Novi Sad',
  paymentCode: '221',
  currency: 'RSD',
  amount: '294000.00',
  payerAccount: '160000000012345654',
  payeeAccount: '265000000065432133',
  payeeModel: '97',
  payeeReference: '3520261187',
}

/** A customer pays Kvadrat Gradnja's invoice F-2026-0412 (form 1, a payment). */
export const PAYMENT: OrderData = {
  kind: 'payment',
  payer: 'Gradska toplana Novi Sad\nVladimira Nikolića 1, Novi Sad',
  purpose: 'Uplata po računu F-2026-0412',
  payee: 'Kvadrat Gradnja d.o.o.\nBulevar oslobođenja 12, Novi Sad',
  paymentCode: '289',
  currency: 'RSD',
  amount: '5003678.22',
  payeeAccount: '160000000012345654',
  payeeModel: '97',
  payeeReference: '942026041200',
}

/** Kvadrat Gradnja withdraws cash for the site's petty cash (form 2, a withdrawal). */
export const WITHDRAWAL: OrderData = {
  kind: 'withdrawal',
  payer: 'Kvadrat Gradnja d.o.o.\nBulevar oslobođenja 12, Novi Sad',
  purpose: 'Isplata gotovine za blagajnu gradilišta Liman 4',
  payee: 'Nikola Marković\nNovi Sad',
  paymentCode: '166',
  currency: 'RSD',
  amount: '40000.00',
  payerAccount: '160000000012345654',
  payerModel: '00',
  payerReference: 'BL-2026-041',
}

/** An empty form 1, to be filled in by hand. */
export const EMPTY_PAYMENT: OrderData = {
  kind: 'payment',
  payer: '',
  purpose: '',
  payee: '',
  paymentCode: '',
  currency: '',
  amount: '',
}
