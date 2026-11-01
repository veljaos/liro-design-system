import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
} from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { CheckboxField, SwitchField } from './checkbox-field'
import { DialogHeading } from './dialog'
import { RadioGroupField } from './radio-group-field'
import { SelectField } from './select-field'
import { usePhone } from './use-phone'
import type { Intent } from './intents'

/*
 * DocumentOptionsDialog ("Print / Export"): the options of a document before it is printed or
 * exported, every choice and its options from the application. By default only the document's
 * type and the main actions show ("Download PDF", "Print", the main one last); language (one, or
 * two for a bilingual document), marks (Copy, Draft, Confidential), the QR code, the signature
 * mode and the paper are under "More options". "Remember for this document type" shows when the
 * application keeps the choice. `preview` is the application's (a PageViewer it updates from
 * `onChange`). A dialog on a desktop, a full-screen sheet on phones. It renders nothing itself.
 */

/** One choice of an option, from the application. */
export interface DocumentOption {
  value: string
  label: string
  /** The choice's own language, when its name is in it ("Srpski (ćirilica)"). */
  lang?: string
}

/** The options chosen. */
export interface DocumentOptionsValue {
  type: string
  /** One language, or two for a bilingual document. */
  languages: readonly string[]
  marks: readonly string[]
  qr: boolean
  signature: string
  paper: string
}

/** An action at the dialog's foot; the main one is last. */
export interface DocumentOptionsAction {
  id: string
  label: string
  /** Its intent ('print', 'download', 'pdf', 'export'): its icon and colour. */
  intent: Intent
  onClick: (value: DocumentOptionsValue) => void
}

export interface DocumentOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The document the dialog acts on, bold under the title ("Invoice F-2026-0412"). */
  subject?: string
  /** The title. Default `messages['documentOptions.title']` ("Print or export"). */
  title?: string
  types: readonly DocumentOption[]
  /** The languages to choose from; none hides the choice. */
  languages?: readonly DocumentOption[]
  /** 2 offers a second language for a bilingual document. Default 1. */
  maxLanguages?: 1 | 2
  /** The status marks to choose from (Copy, Draft, Confidential); none hides them. */
  marks?: readonly DocumentOption[]
  /** Offers the QR code on and off. */
  qr?: boolean
  /** The signature modes (a handwritten line, an e-signature); none hides the choice. */
  signatureModes?: readonly DocumentOption[]
  /** The papers (A4, A5, a thermal roll's width); none hides the choice. */
  papers?: readonly DocumentOption[]
  value: DocumentOptionsValue
  onChange: (value: DocumentOptionsValue) => void
  /** "Remember for this document type": shown when the application keeps the choice. */
  remember?: { checked: boolean; onChange: (checked: boolean) => void }
  /** The application's preview of the document with these options (a PageViewer). */
  preview?: ReactNode
  /** The actions, the main one last ("Print", "Download PDF"). */
  actions: readonly DocumentOptionsAction[]
  /** "More options" open at first. */
  defaultExpanded?: boolean
  /** 'phone' forces the full-screen sheet; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

/** The options of a document before it is printed or exported: type first, the rest folded. */
export function DocumentOptionsDialog(props: DocumentOptionsDialogProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const Root = phone ? Sheet : DialogRoot
  return (
    <Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <OptionsBody {...props} phone={phone} />}
    </Root>
  )
}

function OptionsBody(props: DocumentOptionsDialogProps & { phone: boolean }) {
  const { messages } = useLiro()
  const moreId = useId()
  const [expanded, setExpanded] = useState(props.defaultExpanded ?? false)
  const { value } = props
  const set = (patch: Partial<DocumentOptionsValue>) => {
    props.onChange({ ...value, ...patch })
  }
  const options = (choices: readonly DocumentOption[]) =>
    choices.map((choice) => ({
      value: choice.value,
      label: choice.label,
      ...(choice.lang === undefined ? {} : { lang: choice.lang }),
    }))
  const languages = props.languages ?? []
  const marks = props.marks ?? []
  const signatureModes = props.signatureModes ?? []
  const papers = props.papers ?? []
  const hasMore =
    languages.length > 0 ||
    marks.length > 0 ||
    props.qr === true ||
    signatureModes.length > 0 ||
    papers.length > 0
  const second = value.languages[1] ?? ''
  const typeLabel = props.types.find((type) => type.value === value.type)?.label ?? value.type

  const fields = (
    <div className="flex flex-col gap-4">
      <SelectField
        label={messages['documentOptions.type']}
        options={options(props.types)}
        value={value.type}
        onChange={(type) => {
          set({ type })
        }}
      />
      {hasMore && (
        <div className="flex flex-col gap-4">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={moreId}
            onClick={() => {
              setExpanded(!expanded)
            }}
            className={cn(
              'flex min-h-6 w-fit cursor-pointer items-center gap-1 rounded-sm border-0 bg-transparent p-0 font-sans text-sm font-medium text-link',
              FOCUS_RING,
            )}
          >
            {expanded ? messages['documentOptions.fewer'] : messages['documentOptions.more']}
            <ChevronDown
              aria-hidden="true"
              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
            />
          </button>
          {expanded && (
            <div id={moreId} className="flex flex-col gap-4">
              {languages.length > 0 && (
                <SelectField
                  label={messages['documentOptions.language']}
                  options={options(languages)}
                  value={value.languages[0] ?? ''}
                  onChange={(language) => {
                    set({
                      languages: second === '' ? [language] : [language, second],
                    })
                  }}
                />
              )}
              {languages.length > 1 && props.maxLanguages === 2 && (
                <SelectField
                  label={messages['documentOptions.secondLanguage']}
                  options={[
                    { value: '', label: messages['documentOptions.noSecondLanguage'] },
                    ...options(
                      languages.filter((language) => language.value !== value.languages[0]),
                    ),
                  ]}
                  value={second}
                  onChange={(language) => {
                    const first = value.languages[0] ?? ''
                    set({ languages: language === '' ? [first] : [first, language] })
                  }}
                />
              )}
              {marks.length > 0 && (
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="mb-2 p-0 text-sm font-medium text-primary">
                    {messages['documentOptions.marks']}
                  </legend>
                  {marks.map((mark) => (
                    <CheckboxField
                      key={mark.value}
                      label={mark.label}
                      checked={value.marks.includes(mark.value)}
                      onChange={(checked) => {
                        set({
                          marks: checked
                            ? [...value.marks, mark.value]
                            : value.marks.filter((each) => each !== mark.value),
                        })
                      }}
                    />
                  ))}
                </fieldset>
              )}
              {props.qr === true && (
                <SwitchField
                  label={messages['documentOptions.qr']}
                  checked={value.qr}
                  onChange={(qr) => {
                    set({ qr })
                  }}
                />
              )}
              {signatureModes.length > 0 && (
                <RadioGroupField
                  label={messages['documentOptions.signature']}
                  options={options(signatureModes)}
                  value={value.signature}
                  onChange={(signature) => {
                    set({ signature })
                  }}
                />
              )}
              {papers.length > 0 && (
                <RadioGroupField
                  label={messages['documentOptions.paper']}
                  options={options(papers)}
                  value={value.paper}
                  onChange={(paper) => {
                    set({ paper })
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}
      {props.remember !== undefined && (
        <CheckboxField
          label={messages['documentOptions.remember'](typeLabel)}
          checked={props.remember.checked}
          onChange={props.remember.onChange}
        />
      )}
    </div>
  )

  const parts = (
    <>
      <DialogHeader>
        <DialogTitle>
          <DialogHeading
            title={props.title ?? messages['documentOptions.title']}
            {...(props.subject === undefined ? {} : { subject: props.subject })}
          />
        </DialogTitle>
        <DialogCloseButton label={messages['dialog.close']} />
      </DialogHeader>
      <DialogBody className="min-h-0 flex-1">
        {props.preview === undefined ? (
          fields
        ) : (
          <div className={cn('flex gap-6', props.phone ? 'flex-col' : 'flex-row')}>
            <div className={props.phone ? undefined : 'w-72 shrink-0'}>{fields}</div>
            <div className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{props.preview}</div>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button
          intent="cancel"
          label={messages['dialog.cancel']}
          onClick={() => {
            props.onOpenChange(false)
          }}
        />
        {props.actions.map((action, index) => (
          <Button
            key={action.id}
            intent={action.intent}
            label={action.label}
            {...(index === props.actions.length - 1 ? {} : { emphasis: 'secondary' as const })}
            onClick={() => {
              action.onClick(value)
            }}
          />
        ))}
      </DialogFooter>
    </>
  )

  if (props.phone) {
    return (
      <SheetContent
        side="full"
        aria-describedby={undefined}
        className="pb-[env(safe-area-inset-bottom)]"
      >
        {parts}
      </SheetContent>
    )
  }
  return (
    <DialogContent
      aria-describedby={undefined}
      className={props.preview === undefined ? 'w-120' : 'w-240'}
    >
      {parts}
    </DialogContent>
  )
}
