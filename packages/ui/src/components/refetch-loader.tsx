import { useLiro } from '../provider/liro-provider'

/*
 * The refetch loader (P3.6): a 14px oval in a slot that is always reserved, so showing or hiding
 * it never moves anything, and a polite live region that announces "Updating…" when a refetch
 * starts. DataTable draws it above the table at the end; a container that draws its own row
 * above the table (RegisterPage, ImportWizard's check step, P5.23) draws it there and turns DataTable's slot off. Internal.
 */
export function RefetchLoader({ active }: { active: boolean }) {
  const { messages } = useLiro()
  return (
    <span
      role="status"
      aria-live="polite"
      data-slot="refetch-loader"
      className="flex size-3.5 shrink-0 items-center justify-center"
    >
      {active && (
        <>
          <span
            aria-hidden="true"
            className="box-border size-3.5 animate-liro-spin rounded-full border-[1.75px] border-solid border-brand border-s-transparent motion-reduce:animate-none"
          />
          <span className="sr-only">{messages['table.updating']}</span>
        </>
      )}
    </span>
  )
}
