import { describe, expect, it } from 'vitest'
import {
  ipsAccountText,
  ipsAccountValid,
  ipsAmount,
  ipsProblemsOf,
  ipsQrText,
  ipsReferenceValid,
  normalizeIpsAccount,
} from './ips-qr'

describe('accounts', () => {
  it('fills the short form with zeros and checks the control number (MOD 97-10)', () => {
    expect(normalizeIpsAccount('845-400484-87')).toBe('845000000040048487')
    expect(normalizeIpsAccount('845000000040484987')).toBe('845000000040484987')
    expect(normalizeIpsAccount('845 0000000404849 87'.replace(/ /g, ''))).toBe('845000000040484987')
    expect(normalizeIpsAccount('84-5')).toBeNull()
    expect(ipsAccountValid('845000000040484987')).toBe(true)
    expect(ipsAccountValid('845000000040484988')).toBe(false)
    expect(ipsAccountText('845000000040484987')).toBe('845-0000000404849-87')
  })
})

describe('ipsAmount', () => {
  it('writes the decimal comma and two decimals, never rounding (D4)', () => {
    expect(ipsAmount('294000.5')).toBe('RSD294000,50')
    expect(ipsAmount('3596.13')).toBe('RSD3596,13')
    expect(ipsAmount('1000')).toBe('RSD1000,00')
    expect(ipsAmount('0.01')).toBe('RSD0,01')
    expect(ipsAmount('12.3400')).toBe('RSD12,34')
    expect(ipsAmount('12.345')).toBeNull()
    expect(ipsAmount('0')).toBeNull()
    expect(ipsAmount('-5')).toBeNull()
    expect(ipsAmount('1,5')).toBeNull()
    expect(ipsAmount('100000000000000')).toBeNull()
    expect(ipsAmount('99999999999999.99')).toBe('RSD99999999999999,99')
  })
})

describe('ipsReferenceValid', () => {
  it('checks model 97 and leaves the others', () => {
    expect(ipsReferenceValid('97', '163220000111111111000')).toBe(true)
    expect(ipsReferenceValid('97', '173220000111111111000')).toBe(false)
    expect(ipsReferenceValid('00', '2026-1187')).toBe(true)
    expect(ipsReferenceValid('11', '123')).toBe(true)
  })
})

describe('ipsQrText', () => {
  it('writes the tags in the standard order (a known valid code)', () => {
    expect(
      ipsQrText({
        payeeAccount: '845000000040484987',
        payeeName: 'JP EPS BEOGRAD',
        amount: '3596.13',
        paymentCode: '189',
        purpose: 'Uplata po racunu',
        model: '97',
        reference: '163220000111111111000',
      }),
    ).toEqual({
      text: 'K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3596,13|SF:189|S:Uplata po racunu|RO:97163220000111111111000',
      problems: [],
    })
  })

  it('writes a point-of-sale code with its merchant category and reference', () => {
    const result = ipsQrText({
      kind: 'PT',
      payeeAccount: '845-400484-87',
      payeeName: 'Pekara Zlatni klas, Novi Sad',
      amount: '240',
      merchantCategory: '5462',
      paymentCode: '221',
      paymentReference: '1234567890123456789',
    })
    expect(result.problems).toEqual([])
    expect(result.text).toBe(
      'K:PT|V:01|C:1|R:845000000040048487|N:Pekara Zlatni klas, Novi Sad|I:RSD240,00|SF:221|M:5462|RP:1234567890123456789',
    )
  })

  it('keeps the payer, a reference without a model as 00, and new lines in names', () => {
    const result = ipsQrText({
      payeeAccount: '845000000040484987',
      payeeName: 'Beton Mix d.o.o.\nNovi Sad',
      payerName: 'Kvadrat Gradnja d.o.o.',
      amount: '294000.00',
      paymentCode: '221',
      reference: '2026-1187',
    })
    expect(result.text).toBe(
      'K:PR|V:01|C:1|R:845000000040484987|N:Beton Mix d.o.o.\nNovi Sad|I:RSD294000,00|P:Kvadrat Gradnja d.o.o.|SF:221|RO:002026-1187',
    )
  })

  it('names every problem by field and gives no text', () => {
    const result = ipsQrText({
      kind: 'PT',
      payeeAccount: '845000000040484988',
      payeeName: 'A|B',
      amount: '1.234',
      paymentCode: '389',
      purpose: 'x'.repeat(36),
      oneTimeCode: '12',
      model: '97',
      reference: '173220000111111111000',
    })
    expect(result.text).toBeNull()
    expect(result.problems).toEqual([
      { field: 'payeeAccount', code: 'account' },
      { field: 'payeeName', code: 'characters' },
      { field: 'amount', code: 'amount' },
      { field: 'paymentCode', code: 'paymentCode' },
      { field: 'purpose', code: 'tooLong', limit: 35 },
      { field: 'merchantCategory', code: 'required' },
      { field: 'oneTimeCode', code: 'digits', limit: 5 },
      { field: 'reference', code: 'reference' },
    ])
    expect(ipsProblemsOf(result.problems, 'amount')).toEqual([{ field: 'amount', code: 'amount' }])
  })

  it('asks for what is required: account, name, amount and, on a bill, the payment code', () => {
    expect(ipsQrText({ payeeAccount: '', payeeName: ' ', amount: '' }).problems).toEqual([
      { field: 'payeeAccount', code: 'required' },
      { field: 'payeeName', code: 'required' },
      { field: 'amount', code: 'required' },
      { field: 'paymentCode', code: 'required' },
    ])
  })
})
