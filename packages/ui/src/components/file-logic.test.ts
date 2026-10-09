import { describe, expect, it } from 'vitest'
import { acceptsFile, attachmentOffers, checkFiles } from './file-logic'

const pdf = { name: 'Ugovor 12-2026.PDF', type: 'application/pdf', size: 2_400_000 }
const xml = { name: 'F-2026-0418.xml', type: 'text/xml', size: 48_000 }
const photo = { name: 'gradiliste.jpg', type: 'image/jpeg', size: 3_100_000 }
const big = { name: 'snimak.pdf', type: 'application/pdf', size: 12_000_000 }
const noType = { name: 'izvod-188.sta', type: '', size: 9_000 }

describe('acceptsFile', () => {
  it('matches extensions in any case, MIME types and families', () => {
    expect(acceptsFile(pdf, ['.pdf'])).toBe(true)
    expect(acceptsFile(pdf, ['application/pdf'])).toBe(true)
    expect(acceptsFile(photo, ['image/*'])).toBe(true)
    expect(acceptsFile(xml, ['.pdf', 'image/*'])).toBe(false)
    expect(acceptsFile(xml, [' .XML '])).toBe(true)
  })

  it('accepts anything without a list, and never a typeless file by MIME', () => {
    expect(acceptsFile(noType, undefined)).toBe(true)
    expect(acceptsFile(noType, [])).toBe(true)
    expect(acceptsFile(noType, ['application/*'])).toBe(false)
    expect(acceptsFile(noType, ['.sta'])).toBe(true)
  })

  it('does not take a name without an extension or a dot file for an extension', () => {
    expect(acceptsFile({ name: 'pdf', type: '' }, ['.pdf'])).toBe(false)
    expect(acceptsFile({ name: '.pdf', type: '' }, ['.pdf'])).toBe(false)
  })
})

describe('checkFiles', () => {
  it('checks the type first, then the size, keeping the order chosen', () => {
    const result = checkFiles([pdf, xml, big, photo], {
      accept: ['.pdf', 'image/*'],
      maxSize: 10_000_000,
    })
    expect(result.accepted).toEqual([pdf, photo])
    expect(result.rejected).toEqual([
      { file: xml, reason: 'type' },
      { file: big, reason: 'size' },
    ])
  })

  it('counts the files already attached against the limit', () => {
    const result = checkFiles([pdf, photo, xml], { maxFiles: 5, existing: 3 })
    expect(result.accepted).toEqual([pdf, photo])
    expect(result.rejected).toEqual([{ file: xml, reason: 'count' }])
    expect(checkFiles([pdf], { maxFiles: 2, existing: 4 }).rejected).toEqual([
      { file: pdf, reason: 'count' },
    ])
  })

  it('does not let a rejected file use up the count', () => {
    const result = checkFiles([xml, pdf], { accept: ['.pdf'], maxFiles: 1 })
    expect(result.accepted).toEqual([pdf])
  })
})

describe('attachmentOffers', () => {
  const all = { canDownload: true, canRemove: true, canRetry: true }

  it('downloads only an available file', () => {
    expect(attachmentOffers('available', all).download).toBe(true)
    for (const state of ['uploading', 'scanning', 'quarantined', 'failed'] as const) {
      expect(attachmentOffers(state, all).download).toBe(false)
    }
    expect(attachmentOffers('available', { ...all, canDownload: false }).download).toBe(false)
  })

  it('removes whenever the application allows it, retries only a failed upload', () => {
    expect(attachmentOffers('quarantined', all).remove).toBe(true)
    expect(attachmentOffers('available', { ...all, canRemove: false }).remove).toBe(false)
    expect(attachmentOffers('failed', all).retry).toBe(true)
    expect(attachmentOffers('failed', { ...all, canRetry: false }).retry).toBe(false)
    expect(attachmentOffers('scanning', all).retry).toBe(false)
    expect(attachmentOffers('uploading', all).progress).toBe(true)
    expect(attachmentOffers('scanning', all).progress).toBe(false)
  })
})
