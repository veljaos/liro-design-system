import { useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { KeyValueList } from './cards'
import { changedFields, toggleChanging } from './catalog-logic'
import { CheckboxField } from './checkbox-field'
import { ConfirmDialog } from './confirm-dialog'
import { Drawer } from './dialog'

/*
 * BulkEditDrawer (BUILD-PLAN P5.19, "edit several records at once"): the step after a selection
 * on a catalogue list — BulkActionBar "Edit 24 records" → this Drawer → one ConfirmDialog with
 * the count (D14: a short edit with the list still visible).
 * - Each field that can be set for all the selected records is a checkbox with the field's name,
 *   "Leave unchanged" under it by default (nothing is changed unless asked); ticking it shows the
 *   application's field (its label hidden: the checkbox names it) to give the new value.
 * - "What will change": each ticked field and its new value in the application's words, or
 *   "Choose at least one field to change."; Apply ("Apply to 24 records") stays disabled until a
 *   field is ticked.
 * - Apply asks once, with the count ("Change 24 records?") and the same summary; the confirm
 *   runs `onApply` (a promise keeps the dialog working until it settles), then the drawer closes.
 * The application keeps the values and validates them; the drawer decides nothing about them.
 */

/** One field that can be set for every selected record. */
export interface BulkEditField {
  id: string
  /** The field's name ("Payment term"). */
  label: string
  /** The application's field for the new value (its label hidden, `hideLabel`). */
  editor: ReactNode
  /** The new value in words, for the summary ("30 days"); "—" while empty. */
  valueText?: string
}

export interface BulkEditDrawerProps {
  /** Controlled: the application opens it from the BulkActionBar and closes it. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** How many records are selected. */
  count: number
  /** The drawer's title; default `messages['bulkEdit.title']` ("Edit 24 records"). */
  title?: string
  /** The fields that can be set for all. */
  fields: readonly BulkEditField[]
  /** The ids of the fields being changed (ticked); every other field is left unchanged. */
  changing: readonly string[]
  onChangingChange: (ids: string[]) => void
  /**
   * Applies the change to the selected records (after the confirmation). A promise keeps the
   * confirmation working until it settles; on success the drawer closes.
   */
  onApply: () => void | Promise<void>
}

/** Several records changed at once: tick the fields to change, see what will change, confirm. */
export function BulkEditDrawer(props: BulkEditDrawerProps) {
  const { messages, format } = useLiro()
  const [confirming, setConfirming] = useState(false)
  const countText = format.number(String(props.count))
  const changed = changedFields(props.fields, props.changing)
  const summary =
    changed.length === 0 ? (
      <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
        {messages['bulkEdit.nothing']}
      </p>
    ) : (
      <KeyValueList
        columns={1}
        items={changed.map((field) => ({
          key: field.id,
          label: field.label,
          value: field.valueText,
        }))}
      />
    )
  return (
    <>
      <Drawer
        side="end"
        open={props.open}
        onOpenChange={props.onOpenChange}
        title={props.title ?? messages['bulkEdit.title'](props.count, countText)}
        actions={
          <>
            <Button
              intent="cancel"
              label={messages['dialog.cancel']}
              onClick={() => {
                props.onOpenChange(false)
              }}
            />
            <Button
              intent="save"
              label={messages['bulkEdit.apply'](props.count, countText)}
              disabled={changed.length === 0}
              onClick={() => {
                setConfirming(true)
              }}
            />
          </>
        }
      >
        <div className="flex flex-col">
          {props.fields.map((field) => {
            const on = props.changing.includes(field.id)
            return (
              <div
                key={field.id}
                data-slot="bulk-edit-field"
                className="flex flex-col gap-2 border-0 border-b border-solid border-subtle py-3 first:pt-0"
              >
                <CheckboxField
                  label={field.label}
                  {...(on ? {} : { description: messages['bulkEdit.unchanged'] })}
                  checked={on}
                  onChange={(checked) => {
                    props.onChangingChange(
                      toggleChanging(props.fields, props.changing, field.id, checked),
                    )
                  }}
                />
                {on && <div className="ps-8">{field.editor}</div>}
              </div>
            )
          })}
        </div>
        <section aria-label={messages['bulkEdit.summary']} className="flex flex-col gap-2">
          <h3 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {messages['bulkEdit.summary']}
          </h3>
          {summary}
        </section>
      </Drawer>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        intent="save"
        title={messages['bulkEdit.confirmTitle'](props.count, countText)}
        message={changed
          .map((field) => messages['filter.pill'](field.label, field.valueText ?? '—'))
          .join(', ')}
        confirmLabel={messages['bulkEdit.confirm']}
        onConfirm={async () => {
          await props.onApply()
          props.onOpenChange(false)
        }}
      />
    </>
  )
}
