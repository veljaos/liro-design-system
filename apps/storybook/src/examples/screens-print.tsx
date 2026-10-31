import { BackButton, type PageBack } from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { ROUTES } from './example-shell'
import { FEATURED, INVOICES, type ExampleInvoice } from './examples-story-data'
import { FolioPdf } from './folio-pdf'

/*
 * Invoice F-2026-0412's PDF, opened from its page's "PDF": a bar with the way back and the
 * file's name above the document. The document is liro-folio's PDF; the Design System only shows
 * it (no React replica of a printed document). The examples have no PDF, so FolioPdf stands
 * in for it. Only the public entry point `@veljaos/ui`.
 */

/** A PDF as the application opens it: no shell, a bar with the way back above the document. */
function PdfScreen({
  fileName,
  detail,
  back,
}: {
  fileName: string
  detail: string
  back: PageBack
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
        <FolioPdf fileName={fileName} detail={detail} />
      </main>
    </div>
  )
}

function InvoicePdfScreen({ invoice }: { invoice: ExampleInvoice }) {
  return (
    <PdfScreen
      fileName={`${invoice.number}.pdf`}
      detail={`Invoice ${invoice.number} · ${invoice.customer}`}
      back={{ href: `#${ROUTES.invoice(invoice.number)}`, label: invoice.number }}
    />
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

const PRINTED = INVOICES.find((each) => each.number === FEATURED)

/** The PDF of the invoice the examples open (FEATURED). */
export const PRINT_ROUTES: ExampleRoute[] =
  PRINTED === undefined
    ? []
    : [
        {
          path: ROUTES.invoicePrint(PRINTED.number),
          render: () => <InvoicePdfScreen invoice={PRINTED} />,
        },
      ]
