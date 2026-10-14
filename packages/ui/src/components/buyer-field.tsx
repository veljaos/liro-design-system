import { useId, useState } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ComboboxField } from './combobox-field'
import { RequiredMark } from './field'
import { FormGrid } from './form-layout'
import { SelectField } from './select-field'
import { TextField } from './text-field'

/*
 * BuyerField (P5.28 item 21c). Who the buyer is, for a sale that names one: the kind of their ID
 * (a list from the application: a tax number, a personal number, a passport, a corporate card…),
 * the ID itself, and an optional second field (the buyer's own reference: a cost centre, an
 * order number), also with its kind. Every list, word and rule is the application's data: whether
 * a buyer is required (`required` with the application's reason as the description — "A deferred
 * payment needs the buyer."), what an ID must look like (a type's `hint`, shown under the ID), and
 * whether it is right (`errors`, the application checks). The field computes and checks nothing.
 * - A `fieldset` named by its legend (`label`, " *" when required); the type and the ID side by
 *   side when the field is 36rem wide (FormGrid), stacked on phones. The ID is written left to right in every
 *   language (`direction="ltr"`, P3.6c), as codes are.
 * - The type is a SelectField, or a searchable ComboboxField when there are more than ten kinds
 *   (P5.28 item 3).
 * - The optional field appears when the application gives its kinds (`optionalTypes`).
 * - Read-only shows the chosen values as text; disabled with the application's reason.
 */

/** A kind of ID, from the application. */
export interface BuyerIdType {
  value: string
  label: string
  /** What the ID looks like ("9 digits"), shown under the ID while this kind is chosen. */
  hint?: string
}

/** The buyer as entered: each kind's value and the text. */
export interface BuyerValue {
  typeId: string
  id: string
  optionalTypeId?: string
  optional?: string
}

export interface BuyerFieldProps {
  /** The ID's kinds, in the application's order. */
  types: readonly BuyerIdType[]
  /** The optional field's kinds; without them there is no optional field. */
  optionalTypes?: readonly BuyerIdType[]
  /** Controlled value. */
  value?: BuyerValue
  /** Uncontrolled initial value. */
  defaultValue?: BuyerValue
  onChange?: (value: BuyerValue) => void
  /** Default: `messages['buyer.title']`. */
  label?: string
  /** A hint under the legend; when required, the application's reason ("A deferred payment needs the buyer."). */
  description?: string
  /** The buyer is required by the application's rules. */
  required?: boolean
  /** The application's checks, under each part. */
  errors?: { type?: string; id?: string; optional?: string }
  readOnly?: boolean
  disabled?: boolean
  disabledReason?: string
  /** Defaults: `messages['buyer.type']`, `['buyer.id']`, `['buyer.optionalType']`, `['buyer.optional']`. */
  typeLabel?: string
  idLabel?: string
  optionalTypeLabel?: string
  optionalLabel?: string
  className?: string
}

/** Above this many kinds the type is a searchable combobox (P5.28 item 3). */
export const BUYER_TYPES_SEARCHABLE_FROM = 11

const EMPTY: BuyerValue = { typeId: '', id: '' }

/** The buyer's ID with its kind, and an optional field; every rule is the application's. */
export function BuyerField(props: BuyerFieldProps) {
  const { messages } = useLiro()
  const legendId = useId()
  const [inner, setInner] = useState<BuyerValue>(props.defaultValue ?? EMPTY)
  const value = props.value ?? inner
  const change = (next: BuyerValue) => {
    setInner(next)
    props.onChange?.(next)
  }
  const chosen = props.types.find((each) => each.value === value.typeId)
  const optionalChosen = props.optionalTypes?.find((each) => each.value === value.optionalTypeId)
  const common = {
    ...(props.readOnly === true ? { readOnly: true } : {}),
    ...(props.disabled === true ? { disabled: true } : {}),
  }

  const typeField = (
    kinds: readonly BuyerIdType[],
    label: string,
    current: string | undefined,
    onPick: (id: string) => void,
    error: string | undefined,
    required: boolean,
  ) =>
    kinds.length >= BUYER_TYPES_SEARCHABLE_FROM ? (
      <ComboboxField
        label={label}
        options={kinds.map((kind) => ({ value: kind.value, label: kind.label }))}
        value={(() => {
          const kind = kinds.find((each) => each.value === current)
          return kind === undefined ? null : { value: kind.value, label: kind.label }
        })()}
        onChange={(option) => {
          onPick(option?.value ?? '')
        }}
        required={required}
        {...common}
        {...(error === undefined ? {} : { error })}
      />
    ) : (
      <SelectField
        label={label}
        options={kinds.map((kind) => ({ value: kind.value, label: kind.label }))}
        value={current ?? ''}
        onChange={onPick}
        required={required}
        {...common}
        {...(error === undefined ? {} : { error })}
      />
    )

  return (
    <fieldset
      aria-labelledby={legendId}
      data-slot="buyer-field"
      className={cn('m-0 flex min-w-0 flex-col gap-4 border-0 p-0 font-sans', props.className)}
    >
      <legend id={legendId} className="contents">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {props.label ?? messages['buyer.title']}
          {props.required === true && <RequiredMark />}
        </span>
      </legend>
      {props.description !== undefined && (
        <p className={cn('m-0 -mt-2 text-xs text-secondary', TEXT_DIRECTION)}>
          {props.description}
        </p>
      )}
      {props.disabled === true && props.disabledReason !== undefined && (
        <p className={cn('m-0 -mt-2 text-xs text-secondary', TEXT_DIRECTION)}>
          {props.disabledReason}
        </p>
      )}
      <FormGrid columns={2}>
        {typeField(
          props.types,
          props.typeLabel ?? messages['buyer.type'],
          value.typeId,
          (typeId) => {
            change({ ...value, typeId })
          },
          props.errors?.type,
          props.required === true,
        )}
        <TextField
          label={props.idLabel ?? messages['buyer.id']}
          direction="ltr"
          value={value.id}
          onChange={(id) => {
            change({ ...value, id })
          }}
          required={props.required === true}
          {...common}
          {...(chosen?.hint === undefined ? {} : { description: chosen.hint })}
          {...(props.errors?.id === undefined ? {} : { error: props.errors.id })}
        />
      </FormGrid>
      {props.optionalTypes !== undefined && props.optionalTypes.length > 0 && (
        <FormGrid columns={2}>
          {typeField(
            props.optionalTypes,
            props.optionalTypeLabel ?? messages['buyer.optionalType'],
            value.optionalTypeId,
            (optionalTypeId) => {
              change({ ...value, optionalTypeId })
            },
            undefined,
            false,
          )}
          <TextField
            label={props.optionalLabel ?? messages['buyer.optional']}
            direction="ltr"
            value={value.optional ?? ''}
            onChange={(optional) => {
              change({ ...value, optional })
            }}
            {...common}
            {...(optionalChosen?.hint === undefined ? {} : { description: optionalChosen.hint })}
            {...(props.errors?.optional === undefined ? {} : { error: props.errors.optional })}
          />
        </FormGrid>
      )}
    </fieldset>
  )
}
