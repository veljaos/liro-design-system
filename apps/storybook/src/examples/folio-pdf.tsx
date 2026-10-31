import { FileText } from 'lucide-react'
import { Button } from '@veljaos/ui'

/*
 * A printed document in the examples: the PDF liro-folio renders, which the Design System
 * only shows. The examples have no PDF to show, so they draw a neutral stand-in in its place: a
 * page-shaped card with the file's name, "PDF from liro-folio" and "Download PDF". A real
 * application shows the PDF itself (FilePreview, DocumentFrame) or its page images (PageViewer).
 * Never the document's paper layout drawn in React.
 */

export interface FolioPdfProps {
  /** The PDF's file name ("F-2026-0412.pdf"). */
  fileName: string
  /** What the document is, under the name ("Invoice · 2 pages"). */
  detail?: string
  onDownload?: () => void
}

/** liro-folio's PDF, as the examples stand it in: a page-shaped card with "Download PDF". */
export function FolioPdf({ fileName, detail, onDownload }: FolioPdfProps) {
  return (
    <figure
      data-slot="folio-pdf"
      aria-label={`${fileName}, PDF from liro-folio`}
      className="m-0 mx-auto box-border flex aspect-[210/297] w-full max-w-[30rem] flex-col items-center justify-center gap-3 rounded-lg border border-solid border-default bg-surface-raised p-6 text-center font-sans shadow-xs"
    >
      <FileText aria-hidden="true" className="size-10 text-secondary" strokeWidth={1.5} />
      <figcaption className="flex min-w-0 max-w-full flex-col gap-1">
        <span className="bidi-content text-md font-semibold text-primary">{fileName}</span>
        {detail !== undefined && (
          <span className="bidi-content text-sm text-secondary">{detail}</span>
        )}
        <span className="text-sm text-secondary">PDF from liro-folio</span>
      </figcaption>
      <Button
        intent="download"
        label="Download PDF"
        onClick={() => {
          onDownload?.()
        }}
      />
    </figure>
  )
}
