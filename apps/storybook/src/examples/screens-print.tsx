import { BackButton, type PageBack } from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { ROUTES } from './example-shell'
import { FEATURED, INVOICES, type ExampleInvoice } from './examples-story-data'
import { ANNEX_AREAS, FolioPdfWithOptions, FolioSignaturePlacement } from './folio-pdf'

/*
 * Invoice F-2026-0412's PDF, opened from its page's "PDF": a bar with the way back and the
 * file's name above the document. The document is liro-folio's PDF; the Design System only shows
 * it (no React replica of a printed document): its page images in the page viewer, and
 * "Download PDF" asks for the document's options first. Only the public entry point `@veljaos/ui`.
 */

/** A PDF as the application opens it: no shell, a bar with the way back above the document. */
function PdfScreen({
  fileName,
  detail,
  back,
  optionsOpen,
}: {
  fileName: string
  detail: string
  back: PageBack
  optionsOpen: boolean
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2">
        <BackButton back={back} />
        <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          {fileName}
        </p>
      </header>
      <main className="box-border flex min-w-0 flex-1 flex-col p-4 sm:p-8">
        <FolioPdfWithOptions fileName={fileName} subject={detail} optionsOpen={optionsOpen} />
      </main>
    </div>
  )
}

function InvoicePdfScreen({
  invoice,
  optionsOpen = false,
}: {
  invoice: ExampleInvoice
  optionsOpen?: boolean
}) {
  return (
    <PdfScreen
      optionsOpen={optionsOpen}
      fileName={`${invoice.number}.pdf`}
      detail={`Invoice ${invoice.number}`}
      back={{ href: `#${ROUTES.invoice(invoice.number)}`, label: invoice.number }}
    />
  )
}

/**
 * HR places the signatures on annex ANX-2026-014 before it goes out for signing: one box per
 * signer, by press, drag, keys or an empty field, and the coordinates the application keeps.
 */
function AnnexSignaturesScreen() {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2">
        <BackButton back={{ href: `#${ROUTES.home}`, label: 'Home' }} />
        <h1 className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          ANX-2026-014: place the signatures
        </h1>
      </header>
      <main className="box-border flex min-w-0 flex-1 flex-col p-4 sm:p-8">
        <FolioSignaturePlacement
          fileName="ANX-2026-014.pdf"
          signers={[
            { id: 'nikola', name: 'Nikola Marković' },
            { id: 'director', name: 'Nenad Kovačević' },
          ]}
          areas={ANNEX_AREAS}
        />
      </main>
    </div>
  )
}

/** The annex's signature placement, as HR opens it before sending the annex for signing. */
export const ANNEX_SIGNATURES_ROUTE = '/hr/documents/ANX-2026-014/signatures'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const PRINTED = INVOICES.find((each) => each.number === FEATURED)

/** The PDF of the invoice the examples open (FEATURED), and the annex's signature placement. */
export const PRINT_ROUTES: ExampleRoute[] = [
  ...(PRINTED === undefined
    ? []
    : [
        {
          path: ROUTES.invoicePrint(PRINTED.number),
          render: () => <InvoicePdfScreen invoice={PRINTED} />,
        },
        {
          path: `${ROUTES.invoicePrint(PRINTED.number)}?options=open`,
          render: () => <InvoicePdfScreen invoice={PRINTED} optionsOpen />,
        },
      ]),
  { path: ANNEX_SIGNATURES_ROUTE, render: () => <AnnexSignaturesScreen /> },
]
