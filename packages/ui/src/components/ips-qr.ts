/*
 * IPS QR (P5.40): the text of the Serbian instant-payment QR code of the National Bank of Serbia
 * (IPS NBS), written from a payment's data and checked against the standard's rules — the same
 * text a bank's app reads to fill in a payment order. A national payment standard is a format,
 * like a locale's digits: the library writes it, the application decides what is paid, to whom
 * and how much (D1, D4).
 *
 * The text is tag:value pairs joined by "|", in the standard's order
 * K|V|C|R|N|I|P|SF|S|M|JS|RO|RL|RP, UTF-8:
 * - K the kind: PR (a printed bill or invoice), PT (shown by the merchant at a point of sale),
 *   PK (shown by the buyer at a point of sale), EK (e-commerce); V 01; C 1 (UTF-8).
 * - R the payee's account, 18 digits (bank 3, account 13, control 2; a short form with dashes is
 *   filled with zeros), its control number checked (ISO 7064 MOD 97-10).
 * - N the payee's name and place (at most 70 characters, 3 lines); P the payer's (70).
 * - I the currency and amount, "RSD294000,50": the decimal comma always, no thousands separator,
 *   at least 0,01 and at most 14 whole digits. Written from the decimal string without rounding:
 *   an amount with more than two decimals is a problem, never cut (D4).
 * - SF the payment code (3 digits, the first 1 or 2; required for PR); S the purpose (35).
 * - M the merchant category (4 digits; required for PT, PK and EK); JS a one-time code (5 digits).
 * - RO the model and reference number (35 at most; model 97's control number checked); RL the
 *   payee's reference (140); RP the point-of-sale reference (19 digits).
 * Names, purpose and references use Latin letters (Serbian ones included), digits and common
 * punctuation; "|" is never allowed (it separates the tags).
 */

/** The QR code's kind (K). */
export type IpsQrKind = 'PR' | 'PT' | 'PK' | 'EK'

/** A payment as the application gives it; every value a string. */
export interface IpsPayment {
  /** PR (default): a printed bill; PT / PK: a point of sale; EK: e-commerce. */
  kind?: IpsQrKind
  /** The payee's account: 18 digits, or the short form "160-123456-90". */
  payeeAccount: string
  /** The payee's name and place (up to 3 lines). */
  payeeName: string
  /** The amount as a decimal string ("294000.50"). */
  amount: string
  /** The currency code. Default 'RSD'. */
  currency?: string
  /** The payer's name and address. */
  payerName?: string
  /** The payment code, 3 digits ("289"). */
  paymentCode?: string
  /** The purpose of the payment. */
  purpose?: string
  /** The merchant category code, 4 digits (points of sale and e-commerce). */
  merchantCategory?: string
  /** The payer's one-time code, 5 digits. */
  oneTimeCode?: string
  /** The reference number's model ("97", "22", "11", "00"); none is written as "00". */
  model?: string
  /** The reference number (poziv na broj), without its model. */
  reference?: string
  /** The payee's reference in free form. */
  payeeReference?: string
  /** The point-of-sale reference, 19 digits. */
  paymentReference?: string
}

/** What is wrong with a field. */
export type IpsProblemCode =
  | 'required'
  | 'account'
  | 'amount'
  | 'tooLong'
  | 'tooManyLines'
  | 'characters'
  | 'digits'
  | 'paymentCode'
  | 'reference'

/** One problem: the field, what is wrong, and the limit where there is one. */
export interface IpsProblem {
  field: keyof IpsPayment
  code: IpsProblemCode
  /** For 'tooLong': the most characters; for 'digits': how many digits. */
  limit?: number
}

/** The text of the QR code, or null with the problems that stop it. */
export interface IpsQrResult {
  text: string | null
  problems: IpsProblem[]
}

/** The characters names, the purpose and references may use (Latin, Serbian letters too). */
const ALLOWED = /^[A-Za-zŠĐŽČĆšđžčć0-9 (){}[\]<>/.,:;!@#$%^&?„”“"`’‘'_~=+\-\n]*$/u

/** "160-123456-90" → "160000000012345690"; 18 digits stay; null for anything else. */
export function normalizeIpsAccount(input: string): string | null {
  const compact = input.replace(/\s/gu, '')
  if (/^\d{18}$/u.test(compact)) return compact
  const parts = compact.split('-')
  if (parts.length !== 3) return null
  const [bank = '', account = '', control = ''] = parts
  if (!/^\d{3}$/u.test(bank) || !/^\d{1,13}$/u.test(account) || !/^\d{2}$/u.test(control)) {
    return null
  }
  return `${bank}${account.padStart(13, '0')}${control}`
}

/** The remainder of a long digit string divided by 97, digit by digit (no big numbers). */
function mod97(digits: string): number {
  let rest = 0
  for (const digit of digits) rest = (rest * 10 + Number(digit)) % 97
  return rest
}

/** An 18-digit account's control number (its last two digits) is right: 98 − (first 16 · 100 mod 97). */
export function ipsAccountValid(account: string): boolean {
  if (!/^\d{18}$/u.test(account)) return false
  return 98 - mod97(`${account.slice(0, 16)}00`) === Number(account.slice(16))
}

/**
 * A reference number is right for its model: model 97's first two digits are the control number
 * of the rest (letters count as 10–35, ISO 7064 MOD 97-10); the other models are not checked.
 */
export function ipsReferenceValid(model: string, reference: string): boolean {
  const compact = reference.replace(/[\s-]/gu, '').toUpperCase()
  if (model !== '97') return true
  if (!/^\d{2}[0-9A-Z]+$/u.test(compact)) return false
  // Letters count as 10–35 (A = 10); the string holds only ASCII digits and letters here.
  const digits = compact.slice(2).replace(/[A-Z]/gu, (char) => String(char.charCodeAt(0) - 55))
  return 98 - mod97(`${digits}00`) === Number(compact.slice(0, 2))
}

/**
 * "294000.5" → "RSD294000,50": the decimal comma, two decimals, no separators. Null when the
 * amount is not a positive decimal string, has more than two decimals that are not zero, is under
 * 0,01 or has more than 14 whole digits — never rounded.
 */
export function ipsAmount(amount: string, currency = 'RSD'): string | null {
  const match = /^(\d+)(?:\.(\d+))?$/u.exec(amount.trim())
  if (match === null || !/^[A-Z]{3}$/u.test(currency)) return null
  const whole = (match[1] ?? '').replace(/^0+(?=\d)/u, '')
  const decimals = (match[2] ?? '').replace(/0+$/u, '')
  if (decimals.length > 2 || whole.length > 14) return null
  if (/^0+$/u.test(whole) && /^0*$/u.test(decimals)) return null
  return `${currency}${whole},${decimals.padEnd(2, '0')}`
}

function checkText(
  problems: IpsProblem[],
  field: keyof IpsPayment,
  value: string | undefined,
  limit: number,
  lines = 1,
): string | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const text = value.trim()
  if (text.length > limit) problems.push({ field, code: 'tooLong', limit })
  if (text.split('\n').length > lines) problems.push({ field, code: 'tooManyLines', limit: lines })
  if (!ALLOWED.test(text)) problems.push({ field, code: 'characters' })
  return text
}

function checkDigits(
  problems: IpsProblem[],
  field: keyof IpsPayment,
  value: string | undefined,
  count: number,
): string | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const text = value.trim()
  if (!new RegExp(`^\\d{${String(count)}}$`, 'u').test(text)) {
    problems.push({ field, code: 'digits', limit: count })
  }
  return text
}

/** The QR code's text for a payment, or the problems that stop it (each field's, in order). */
export function ipsQrText(payment: IpsPayment): IpsQrResult {
  const problems: IpsProblem[] = []
  const kind = payment.kind ?? 'PR'

  let account: string | null = null
  if (payment.payeeAccount.trim() === '') problems.push({ field: 'payeeAccount', code: 'required' })
  else {
    account = normalizeIpsAccount(payment.payeeAccount)
    if (account === null || !ipsAccountValid(account)) {
      problems.push({ field: 'payeeAccount', code: 'account' })
    }
  }

  if (payment.payeeName.trim() === '') problems.push({ field: 'payeeName', code: 'required' })
  const payee = checkText(problems, 'payeeName', payment.payeeName, 70, 3)

  let amount: string | null = null
  if (payment.amount.trim() === '') problems.push({ field: 'amount', code: 'required' })
  else {
    amount = ipsAmount(payment.amount, payment.currency ?? 'RSD')
    if (amount === null) problems.push({ field: 'amount', code: 'amount' })
  }

  const payer = checkText(problems, 'payerName', payment.payerName, 70, 3)

  const code = payment.paymentCode?.trim() ?? ''
  if (code === '') {
    if (kind === 'PR') problems.push({ field: 'paymentCode', code: 'required' })
  } else if (!/^[12]\d{2}$/u.test(code))
    problems.push({ field: 'paymentCode', code: 'paymentCode' })

  const purpose = checkText(problems, 'purpose', payment.purpose, 35)

  const merchant = payment.merchantCategory?.trim() ?? ''
  if (merchant === '' && kind !== 'PR') {
    problems.push({ field: 'merchantCategory', code: 'required' })
  }
  checkDigits(problems, 'merchantCategory', payment.merchantCategory, 4)
  const oneTime = checkDigits(problems, 'oneTimeCode', payment.oneTimeCode, 5)

  let reference: string | undefined
  const number = payment.reference?.replace(/\s/gu, '') ?? ''
  if (number !== '') {
    const model = payment.model?.trim() === '' || payment.model === undefined ? '00' : payment.model
    // Model 97's number is written as digits and letters only (its dashes are for people).
    reference = `${model}${model === '97' ? number.replace(/-/gu, '') : number}`
    if (!/^\d{2}$/u.test(model) || !ipsReferenceValid(model, number)) {
      problems.push({ field: 'reference', code: 'reference' })
    } else if (reference.length > 35)
      problems.push({ field: 'reference', code: 'tooLong', limit: 35 })
    else if (!ALLOWED.test(reference)) problems.push({ field: 'reference', code: 'characters' })
  }
  const payeeReference = checkText(problems, 'payeeReference', payment.payeeReference, 140)
  const pos = checkDigits(problems, 'paymentReference', payment.paymentReference, 19)

  if (problems.length > 0 || account === null || amount === null || payee === undefined) {
    return { text: null, problems }
  }
  const tags: [string, string | undefined][] = [
    ['K', kind],
    ['V', '01'],
    ['C', '1'],
    ['R', account],
    ['N', payee],
    ['I', amount],
    ['P', payer],
    ['SF', code === '' ? undefined : code],
    ['S', purpose],
    ['M', merchant === '' ? undefined : merchant],
    ['JS', oneTime],
    ['RO', reference],
    ['RL', payeeReference],
    ['RP', pos],
  ]
  return {
    text: tags
      .filter((tag): tag is [string, string] => tag[1] !== undefined)
      .map(([tag, value]) => `${tag}:${value}`)
      .join('|'),
    problems,
  }
}

/** The problems of one field (to show under it). */
export function ipsProblemsOf(
  problems: readonly IpsProblem[],
  field: keyof IpsPayment,
): IpsProblem[] {
  return problems.filter((problem) => problem.field === field)
}

/** An 18-digit account written as on a payment order: "160-0000000123456-90". */
export function ipsAccountText(account: string): string {
  const normalized = normalizeIpsAccount(account)
  if (normalized === null) return account
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 16)}-${normalized.slice(16)}`
}
