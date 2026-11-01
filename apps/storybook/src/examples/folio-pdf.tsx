import { useState } from 'react'
import {
  DocumentOptionsDialog,
  KeyValueList,
  PageViewer,
  SaveStatus,
  SignaturePlacer,
  type DocumentArea,
  type DocumentOptionsValue,
  type PdfBox,
  type SignatureSigner,
} from '@veljaos/ui'
import {
  A4_SAMPLE,
  samplePages,
} from '../../../../packages/ui/src/components/sample-pages-story-data'

/*
 * A printed document in the examples: liro-folio's output, which the Design System only shows.
 * The examples have no PDF, so they show neutral sample pages (grey lines and blocks, marked
 * "Sample page") in their real page sizes, with the areas the renderer returns. Never the
 * document's paper layout drawn in React.
 */

/** liro-folio's pages, as the examples stand them in: neutral sample pages in a PageViewer. */
export function FolioPdf({
  fileName,
  pages = 1,
  areas,
  onDownload,
}: {
  /** The PDF's file name ("F-2026-0412.pdf"): the viewer's name. */
  fileName: string
  pages?: number
  areas?: readonly DocumentArea[]
  onDownload?: () => void
}) {
  return (
    <PageViewer
      label={`${fileName}, PDF from liro-folio`}
      pages={
        pages === 2
          ? A4_SAMPLE
          : samplePages(pages, A4_SAMPLE[0] ?? { width: 595.28, height: 841.89 })
      }
      {...(areas === undefined ? {} : { areas })}
      {...(onDownload === undefined ? {} : { onDownload })}
      className="h-[min(48rem,calc(100dvh-8rem))] w-full"
    />
  )
}

/** The annex's areas as liro-folio returns them: the two empty signature fields on page 2. */
export const ANNEX_AREAS: DocumentArea[] = [
  {
    name: 'employee-signature',
    kind: 'signature',
    page: 2,
    x: 56,
    y: 96,
    width: 190,
    height: 48,
    label: "Employee's signature",
  },
  {
    name: 'director-signature',
    kind: 'signature',
    page: 2,
    x: 349.28,
    y: 96,
    width: 190,
    height: 48,
    label: "Director's signature",
  },
]

const TYPES = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'delivery-note', label: 'Delivery note' },
  { value: 'proforma', label: 'Proforma invoice' },
]
const LANGUAGES = [
  { value: 'sr-Latn', label: 'Srpski (latinica)', lang: 'sr-Latn' },
  { value: 'sr-Cyrl', label: 'Српски (ћирилица)', lang: 'sr-Cyrl' },
  { value: 'en', label: 'English', lang: 'en' },
]

/**
 * A document's PDF with "Download PDF", which asks for the document's options first (type,
 * languages, marks, QR code, signature mode, paper); the application renders and downloads.
 */
export function FolioPdfWithOptions({
  fileName,
  subject,
  optionsOpen = false,
}: {
  fileName: string
  subject: string
  /** The options dialog open at first. */
  optionsOpen?: boolean
}) {
  const [open, setOpen] = useState(optionsOpen)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')
  const [value, setValue] = useState<DocumentOptionsValue>({
    type: 'invoice',
    languages: ['sr-Latn'],
    marks: [],
    qr: true,
    signature: 'line',
    paper: 'a4',
  })
  const [remember, setRemember] = useState(true)
  return (
    <div className="flex flex-col gap-2">
      <FolioPdf
        fileName={fileName}
        pages={2}
        onDownload={() => {
          setOpen(true)
        }}
      />
      {status === 'saved' && <SaveStatus state="saved" savedText={`${fileName} downloaded`} />}
      <DocumentOptionsDialog
        open={open}
        onOpenChange={setOpen}
        subject={subject}
        types={TYPES}
        languages={LANGUAGES}
        maxLanguages={2}
        marks={[
          { value: 'copy', label: 'Copy' },
          { value: 'draft', label: 'Draft' },
          { value: 'confidential', label: 'Confidential' },
        ]}
        qr
        signatureModes={[
          { value: 'line', label: 'Handwritten signature line' },
          { value: 'e-signature', label: 'E-signature field' },
        ]}
        papers={[
          { value: 'a4', label: 'A4' },
          { value: 'a5', label: 'A5' },
        ]}
        value={value}
        onChange={setValue}
        remember={{ checked: remember, onChange: setRemember }}
        actions={[
          {
            id: 'print',
            label: 'Print',
            intent: 'print',
            onClick: () => {
              setOpen(false)
            },
          },
          {
            id: 'download',
            label: 'Download PDF',
            intent: 'download',
            onClick: () => {
              setOpen(false)
              setStatus('saved')
            },
          },
        ]}
      />
    </div>
  )
}

/**
 * Placing the signatures on a document before it goes out for signing: one box per signer, and
 * what the application gets back, in PDF points from the page's bottom-left corner.
 */
export function FolioSignaturePlacement({
  fileName,
  signers,
  areas,
}: {
  fileName: string
  signers: readonly SignatureSigner[]
  areas: readonly DocumentArea[]
}) {
  const [value, setValue] = useState<Record<string, PdfBox | null>>({})
  return (
    <div className="flex flex-col gap-4">
      <SignaturePlacer
        label={`${fileName}, PDF from liro-folio`}
        pages={A4_SAMPLE}
        areas={areas}
        signers={signers}
        value={value}
        onChange={(signerId, box) => {
          setValue((current) => ({ ...current, [signerId]: box }))
        }}
      />
      <KeyValueList
        columns={1}
        items={signers.map((signer) => {
          const box = value[signer.id]
          return {
            label: `${signer.name}: signature position`,
            value:
              box === null || box === undefined
                ? '—'
                : `Page ${String(box.page)}, x ${String(box.x)} pt, y ${String(box.y)} pt, ${String(box.width)} × ${String(box.height)} pt`,
          }
        })}
      />
    </div>
  )
}
