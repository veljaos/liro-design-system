import { useImperativeHandle, useRef, useState, type ReactNode, type Ref } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLangAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { CheckboxField, SwitchField } from './checkbox-field'
import { DateField } from './date-field'
import {
  definedFormState,
  definedEmptyValue,
  definedMissingKind,
  type DefinedField,
  type DefinedSection,
  type DefinedValue,
  type DefinedValues,
} from './defined-form-logic'
import { FormFullWidth, FormSection } from './form-layout'
import { focusFirstInvalid } from './form-logic'
import { MultiSelectField } from './multi-select-field'
import { MoneyField, NumberField } from './number-field'
import { RadioGroupField } from './radio-group-field'
import { SelectField } from './select-field'
import { TextAreaField, TextField } from './text-field'

export {
  definedConditionFields,
  definedConditionHolds,
  DEFINED_FIELD_TYPES,
  definedFormState,
  definedFormProblems,
  definedEmptyValue,
  definedFieldIds,
  definedFieldRequired,
  definedValueFilled,
  definedMissingKind,
} from './defined-form-logic'
export type {
  DefinedCondition,
  DefinedField,
  DefinedFieldState,
  DefinedFieldType,
  DefinedFormState,
  DefinedOption,
  DefinedSection,
  DefinedSectionState,
  DefinedValue,
  DefinedValues,
} from './defined-form-logic'

/*
 * DefinedForm (BUILD-PLAN P5.66): a form drawn from the application's field definitions — the
 * JSON the application keeps for a document type, a report to an authority, a request. The
 * definitions are data (types, labels, options, required, sections, conditions; the logic and its
 * rules in defined-form-logic.ts); the form is the library's own parts, so it looks and behaves
 * as every hand-written form: FormSection cards (title, description, 1–3 columns by their own
 * width, one on phones, `collapsible`), TextField, TextAreaField, NumberField, MoneyField,
 * DateField, SelectField, MultiSelectField, RadioGroupField, CheckboxField and SwitchField, and a
 * `custom` field the application draws itself (`renderCustom`: lines in an EditableGrid, a lookup).
 * - **Conditions** show and hide fields and sections and make fields required as the user types;
 *   a hidden field keeps its value but is not submitted.
 * - **Required** fields carry the mark; a missing one says so under it in words ("Fill in this
 *   field.", "Choose an option.", "Tick this to go on.") — from the moment `showMissing` is set,
 *   or after the application's `check()` (the handle), which also moves the focus to the first
 *   problem (opening a folded section first) and returns the submitted values. A number or a date
 *   that cannot be read keeps the field's own message and blocks `check()` too.
 * - **The application's own checks** come back as `errors` by field id and are shown under their
 *   fields, before a missing value's words.
 * - `readOnly` shows the whole form as text (a document numbered or sent for signature).
 * - `lang`: the language of the definitions' texts when it is not the page's ("sr-Latn" on an
 *   English page): labels, hints, section titles and every option carry it (D15), select and
 *   multiselect options through their `lang`.
 * Nothing is computed, saved or rendered as a document here: the preview of the document is the
 * application's (DocumentFrame beside the form).
 */

/** What a custom field receives to draw itself. */
export interface DefinedCustomControl {
  value: DefinedValue
  onChange: (value: DefinedValue) => void
  /** The error to show under it (the application's, or the missing value's words). */
  error: string | undefined
  required: boolean
  readOnly: boolean
}

/** What `check()` found. */
export interface DefinedFormCheck {
  /** Nothing missing and nothing unreadable. */
  valid: boolean
  /** The ids of the required fields shown that are empty. */
  missing: readonly string[]
  /** The ids of the number, amount and date fields shown whose text cannot be read. */
  unreadable: readonly string[]
  /** The values of the fields shown (the ones to submit). */
  values: Readonly<Record<string, DefinedValue>>
}

/** The handle: the application checks the form before it previews, saves or sends it. */
export interface DefinedFormHandle {
  /** Shows every missing value, focuses the first problem, and says what it found. */
  check: () => DefinedFormCheck
}

export interface DefinedFormProps {
  /** The definitions: sections of fields, from the application. */
  sections: readonly DefinedSection[]
  /** Controlled values by field id (context values the conditions read may be added). */
  values?: DefinedValues
  /** Uncontrolled initial values. */
  defaultValues?: DefinedValues
  /** Called with every value (hidden ones kept) and the id of the field that changed. */
  onChange?: (values: DefinedValues, fieldId: string) => void
  /** The application's own problems, by field id, shown under the fields. */
  errors?: Readonly<Record<string, string>>
  /** Shows the missing values from the start (a draft opened again, a step already tried). */
  showMissing?: boolean
  /** The whole form as text that can be copied, not changed. */
  readOnly?: boolean
  /** Draws a field of type 'custom'. Without it such a field is left out. */
  renderCustom?: (field: DefinedField, control: DefinedCustomControl) => ReactNode
  /** The language of the definitions' texts, when not the page's (D15). */
  lang?: string
  /** The heading level of the section titles. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6
  ref?: Ref<DefinedFormHandle>
  className?: string
}

/** A text of the definitions, marked with its language when it differs from the page's. */
function Defined({ text, lang }: { text: string | undefined; lang: { lang?: string } }) {
  if (text === undefined) return undefined
  if (lang.lang === undefined) return text
  return (
    <span {...lang} className={TEXT_DIRECTION}>
      {text}
    </span>
  )
}

const asText = (value: DefinedValue | undefined): string | null =>
  typeof value === 'string' ? value : null

const asList = (value: DefinedValue | undefined): readonly string[] =>
  Array.isArray(value) ? (value as readonly string[]) : []

/** A form drawn from field definitions, with conditions and required checks. */
export function DefinedForm({ ref, ...props }: DefinedFormProps) {
  const { messages } = useLiro()
  const lang = useLangAttribute(props.lang)
  const root = useRef<HTMLDivElement>(null)
  const [inner, setInner] = useState<DefinedValues>(props.defaultValues ?? {})
  const values = props.values ?? inner
  const [checked, setChecked] = useState(false)
  const [unreadable, setUnreadable] = useState<ReadonlySet<string>>(new Set())
  const state = definedFormState(props.sections, values)
  const showMissing = props.showMissing === true || checked
  const { onChange } = props

  const change = (id: string, value: DefinedValue) => {
    const next = { ...values, [id]: value }
    if (props.values === undefined) setInner(next)
    onChange?.(next, id)
  }

  const validity = (id: string, valid: boolean) => {
    setUnreadable((current) => {
      if (valid === !current.has(id)) return current
      const next = new Set(current)
      if (valid) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useImperativeHandle(
    ref,
    () => ({
      check: () => {
        setChecked(true)
        const shown = state.sections.flatMap((section) =>
          section.fields.map((each) => each.field.id),
        )
        const blocked = shown.filter((id) => unreadable.has(id))
        // The errors are drawn on the next render; the focus follows them.
        requestAnimationFrame(() => {
          if (root.current !== null) focusFirstInvalid(root.current)
        })
        return {
          valid: state.missing.length === 0 && blocked.length === 0,
          missing: state.missing,
          unreadable: blocked,
          values: state.submitted,
        }
      },
    }),
    [state, unreadable],
  )

  const missingText = (field: DefinedField) => {
    const kind = definedMissingKind(field.type)
    if (kind === 'choose') return messages['definedForm.choose']
    if (kind === 'tick') return messages['definedForm.tick']
    return messages['definedForm.fill']
  }

  return (
    <div
      ref={root}
      data-slot="defined-form"
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      {state.sections.map(({ section, fields }) => (
        <FormSection
          key={section.id}
          title={<Defined text={section.title} lang={lang} />}
          {...(section.description === undefined
            ? {}
            : { description: <Defined text={section.description} lang={lang} /> })}
          columns={section.columns ?? 2}
          headingLevel={props.headingLevel ?? 3}
          {...(section.collapsible === true ? { collapsible: true } : {})}
        >
          {fields.map(({ field, required, missing }) => {
            const own = props.errors?.[field.id]
            const error = own ?? (showMissing && missing ? missingText(field) : undefined)
            const readOnly = props.readOnly === true || field.readOnly === true
            const value = values[field.id] ?? definedEmptyValue(field.type)
            const base = {
              label: <Defined text={field.label} lang={lang} />,
              ...(field.description === undefined
                ? {}
                : { description: <Defined text={field.description} lang={lang} /> }),
              ...(error === undefined ? {} : { error }),
              required: required && !readOnly,
              readOnly,
              ...(field.disabledReason === undefined || readOnly
                ? {}
                : { disabled: true, disabledReason: field.disabledReason }),
            }
            const hint = field.placeholder === undefined ? {} : { placeholder: field.placeholder }
            const set = (next: DefinedValue) => {
              change(field.id, next)
            }
            const entry = {
              value: asText(value),
              onChange: set,
              onValidityChange: (valid: boolean) => {
                validity(field.id, valid)
              },
            }
            let control: ReactNode
            switch (field.type) {
              case 'text':
              case 'email':
                control = (
                  <TextField
                    {...base}
                    {...hint}
                    type={field.type}
                    {...(field.direction === undefined ? {} : { direction: field.direction })}
                    value={asText(value) ?? ''}
                    onChange={set}
                  />
                )
                break
              case 'textarea':
                control = (
                  <TextAreaField
                    {...base}
                    {...hint}
                    {...(field.rows === undefined ? {} : { rows: field.rows })}
                    value={asText(value) ?? ''}
                    onChange={set}
                  />
                )
                break
              case 'number':
                control = (
                  <NumberField
                    {...base}
                    {...hint}
                    {...entry}
                    {...(field.decimals === undefined ? {} : { decimals: field.decimals })}
                  />
                )
                break
              case 'money':
                control = (
                  <MoneyField
                    {...base}
                    {...hint}
                    {...entry}
                    currency={field.currency ?? ''}
                    {...(field.decimals === undefined ? {} : { decimals: field.decimals })}
                  />
                )
                break
              case 'date':
                control = <DateField {...base} {...hint} {...entry} />
                break
              case 'select':
                control = (
                  <SelectField
                    {...base}
                    {...hint}
                    options={(field.options ?? []).map((option) => ({
                      value: option.value,
                      label: option.label,
                      ...(option.disabled === true ? { disabled: true } : {}),
                      ...(option.group === undefined ? {} : { group: option.group }),
                      ...(lang.lang === undefined ? {} : { lang: lang.lang }),
                    }))}
                    value={asText(value) ?? ''}
                    clearable={!required}
                    onChange={(next) => {
                      set(next === '' ? null : next)
                    }}
                  />
                )
                break
              case 'multiselect':
                control = (
                  <MultiSelectField
                    {...base}
                    {...hint}
                    options={(field.options ?? []).map((option) => ({
                      value: option.value,
                      label: option.label,
                      ...(option.disabled === true ? { disabled: true } : {}),
                      ...(lang.lang === undefined ? {} : { lang: lang.lang }),
                    }))}
                    value={asList(value)}
                    onChange={set}
                  />
                )
                break
              case 'radio':
                control = (
                  <RadioGroupField
                    {...base}
                    options={(field.options ?? []).map((option) => ({
                      value: option.value,
                      label: <Defined text={option.label} lang={lang} />,
                      ...(option.description === undefined
                        ? {}
                        : { description: <Defined text={option.description} lang={lang} /> }),
                      ...(option.disabled === true ? { disabled: true } : {}),
                    }))}
                    value={asText(value) ?? ''}
                    onChange={set}
                  />
                )
                break
              case 'checkbox':
                control = <CheckboxField {...base} checked={value === true} onChange={set} />
                break
              case 'switch':
                control = <SwitchField {...base} checked={value === true} onChange={set} />
                break
              case 'custom':
                control =
                  props.renderCustom?.(field, {
                    value,
                    onChange: set,
                    error,
                    required,
                    readOnly,
                  }) ?? null
                break
            }
            if (control === null) return null
            const wide = field.fullWidth === true || field.type === 'custom'
            return wide ? (
              <FormFullWidth key={field.id}>{control}</FormFullWidth>
            ) : (
              <div key={field.id} className="min-w-0">
                {control}
              </div>
            )
          })}
        </FormSection>
      ))}
    </div>
  )
}
