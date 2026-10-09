import { useRef, useState, type SyntheticEvent } from 'react'
import {
  DialogBody,
  DialogCloseButton,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { taxCategoryText, type TaxCategory, type UnitOfMeasure } from './line-types'
import type { LookupCreateKind, LookupOption } from './lookup-logic'
import { MoneyField } from './number-field'
import { SelectField } from './select-field'
import { TextField } from './text-field'

/*
 * The "+ Create …" panel of LookupField (BUILD-PLAN P5.18, P5.19): a catalogue record made from a
 * document line without leaving the document. A Drawer at the end (AGENTS.md D14: a short edit
 * with the document still visible; a popover inside a 28px grid cell would cover the lines around
 * it and, being non-modal, would let the focus leave a half-filled record), titled "New <kind>",
 * with the name (the text typed), the unit of measure, the price and the tax category; Cancel,
 * then Create (the main action last). The application saves: `onCreate` returns a promise of the
 * new record (or null when it did not save, with its `errors` shown under the fields); while it
 * runs, the panel cannot be closed. The fields are the Design System's; their names are the
 * provider's messages. The focus starts in the name and returns where the application says.
 */

/** What the panel reports: the kind and the values entered. */
export interface LookupDraft {
  kind: string
  name: string
  /** The unit's standard code, or null. */
  unit: string | null
  /** A decimal string, or null. */
  price: string | null
  /** The tax category's value, or null. */
  taxCategory: string | null
}

/** The application's messages about the values entered, by field. */
export type LookupDraftErrors = Partial<Record<'name' | 'unit' | 'price' | 'taxCategory', string>>

export interface LookupCreateDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The kind being created (its noun names the panel: "New service"). */
  kind: LookupCreateKind
  /** The text typed in the field: the name to start from. */
  initialName: string
  /** The units of measure to choose from, from the Core. */
  units: readonly UnitOfMeasure[]
  /** The tax categories to choose from, from the Core. */
  taxCategories: readonly TaxCategory[]
  /** The price's currency, e.g. "RSD". */
  currency: string
  /** The unit chosen at first (its code). */
  defaultUnit?: string
  /** The tax category chosen at first (its value). */
  defaultTaxCategory?: string
  /** Saves the record; resolves with it, or with null when it was not saved (see `errors`). */
  onCreate: (draft: LookupDraft) => Promise<LookupOption | null>
  /** The record was created: the application fills the line with it. */
  onCreated?: (option: LookupOption) => void
  /** Messages about the values, from the application, shown under their fields. */
  errors?: LookupDraftErrors
  /** Where the focus goes when the panel closes (the field it was opened from). */
  onCloseFocus?: () => void
}

function DraftForm(
  props: LookupCreateDrawerProps & { pending: boolean; setPending: (pending: boolean) => void },
) {
  const { messages, format } = useLiro()
  const [name, setName] = useState(props.initialName)
  const [unit, setUnit] = useState(props.defaultUnit ?? '')
  const [price, setPrice] = useState<string | null>(null)
  const [taxCategory, setTaxCategory] = useState(props.defaultTaxCategory ?? '')
  const { pending, setPending } = props
  const errors = props.errors ?? {}
  const percent = (value: string) => format.percent(value)

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    props
      .onCreate({
        kind: props.kind.kind,
        name: name.trim(),
        unit: unit === '' ? null : unit,
        price,
        taxCategory: taxCategory === '' ? null : taxCategory,
      })
      .then(
        (option) => {
          setPending(false)
          if (option === null) return
          props.onCreated?.(option)
          props.onOpenChange(false)
        },
        () => {
          setPending(false)
        },
      )
  }

  return (
    <form noValidate onSubmit={submit} className="contents">
      <DialogBody>
        <TextField
          label={messages['lookup.name']}
          required
          value={name}
          onChange={setName}
          {...(errors.name === undefined ? {} : { error: errors.name })}
        />
        <SelectField
          label={messages['lookup.unit']}
          options={props.units}
          value={unit}
          onChange={setUnit}
          {...(errors.unit === undefined ? {} : { error: errors.unit })}
        />
        <MoneyField
          label={messages['lookup.price']}
          currency={props.currency}
          value={price}
          onChange={setPrice}
          {...(errors.price === undefined ? {} : { error: errors.price })}
        />
        <SelectField
          label={messages['lookup.taxCategory']}
          options={props.taxCategories.map((category) => ({
            value: category.value,
            label: taxCategoryText(category, percent),
          }))}
          value={taxCategory}
          onChange={setTaxCategory}
          {...(errors.taxCategory === undefined ? {} : { error: errors.taxCategory })}
        />
        <DialogFooter>
          <Button
            intent="cancel"
            label={messages['dialog.cancel']}
            disabled={pending}
            onClick={() => {
              props.onOpenChange(false)
            }}
          />
          <Button
            intent="create"
            type="submit"
            label={messages['lookup.createButton']}
            disabled={pending}
          />
        </DialogFooter>
      </DialogBody>
    </form>
  )
}

/**
 * Creates a catalogue record from the text typed in a LookupField (a document line's "+ Create
 * service “…”"), then hands it back to fill the line. The application saves and validates.
 */
export function LookupCreateDrawer(props: LookupCreateDrawerProps) {
  const { messages } = useLiro()
  const panel = useRef<HTMLDivElement>(null)
  // While the application saves, the panel stays.
  const [pending, setPending] = useState(false)
  const keep = (event: Event) => {
    if (pending) event.preventDefault()
  }
  return (
    <Sheet
      open={props.open}
      onOpenChange={(next) => {
        if (!next && pending) return
        props.onOpenChange(next)
      }}
    >
      <SheetContent
        ref={panel}
        side="end"
        aria-describedby={undefined}
        aria-busy={pending || undefined}
        onEscapeKeyDown={keep}
        onPointerDownOutside={keep}
        onInteractOutside={keep}
        onOpenAutoFocus={(event) => {
          // The name takes the focus, its text selected, ready to be corrected.
          event.preventDefault()
          const input = panel.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')
          input?.focus({ preventScroll: true })
          input?.select()
        }}
        onCloseAutoFocus={(event) => {
          if (props.onCloseFocus === undefined) return
          event.preventDefault()
          props.onCloseFocus()
        }}
      >
        <DialogHeader>
          <DialogTitle>{messages['lookup.createTitle'](props.kind.noun)}</DialogTitle>
          {!pending && <DialogCloseButton label={messages['dialog.close']} />}
        </DialogHeader>
        <DraftForm {...props} pending={pending} setPending={setPending} />
      </SheetContent>
    </Sheet>
  )
}
