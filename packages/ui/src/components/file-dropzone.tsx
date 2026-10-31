import { Camera, CircleCheck, FileText, FileUp, Upload } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Field, FieldMessage, fieldProps, type FieldBaseProps } from './field'
import { checkFiles, type FileRejection } from './file-logic'
import { usePhone } from './use-phone'

export { acceptsFile, checkFiles } from './file-logic'
export type { FileFacts, FileRejection, FileRules, RejectionReason } from './file-logic'

/*
 * FileDropzone: choose files, or
 * drop them, with what is accepted shown BEFORE choosing.
 *
 * - The field frame (label, description, error) around a zone: radius md,
 *   a 1px dashed border.control border on the raised surface, 16px padding; in it a 20px Upload
 *   icon (text.secondary), the "Choose files" button (neutral default weight, the main way: a
 *   real button, so the keyboard and every pointer reach it) and "or drop them here"; under them,
 *   the accepted types and the size limit as the application writes them ("PDF, XML or JPG",
 *   "up to 10 MB"), 12px text.secondary, linked to the button with aria-describedby.
 * - Dropping is never the only way. While files are dragged over it the zone takes the neutral
 *   selection (surface.selected, a border.selected border), never blue. Dropping files from
 *   the operating system needs the browser's drop events: there is no dragged element of ours,
 *   so the dragging rule (pointer events, no HTML5 drag and drop) is not touched. Phones show no
 *   "drop" text (there is nothing to drop from).
 * - Every chosen or dropped file is checked again here (`checkFiles`, tested): a dropped file never
 *   passes through the input's `accept`, and the file dialog can be switched to "All files".
 *   Accepted files go to `onFiles`; rejected ones to `onReject` and, in the provider's words
 *   (`file.rejectedType`, `file.rejectedSize`, `file.rejectedCount`), under the zone in
 *   status.danger.fg until the next choice (`role="alert"`).
 * - `camera`: on phones a second neutral button, "Take a photo", opens the camera (an
 *   input with `capture="environment"`); the photo goes through the same checks.
 * - The files themselves (upload, scan, list) are the application's: AttachmentList shows them.
 * - It is an action, not a value: there is no read-only or disabled dropzone. When
 *   files cannot be added now, `unavailableReason` draws the zone grey, keeps "Choose files"
 *   focusable but unavailable (aria-disabled), ignores drops, and says why under the zone.
 * - `expected`: the documents the application expects, from its data — "Attach"
 *   and, one per line under the zone, each document's name (a 14px FileText) with "Required" or
 *   "Optional", the application's detail under it, and a success-toned check with "Attached"
 *   once the application says it is there. The list describes "Choose files"; the field is
 *   marked required when a document is (unless `required` says otherwise). Which file is which
 *   document, and whether one is missing, stays the application's.
 */

/** A document the application expects among the files. */
export interface ExpectedFile {
  key: string
  /** Its name, in the application's words ("Death certificate"). */
  label: string
  /** It must be attached (the application's rule): "Required"; otherwise "Optional". */
  required?: boolean
  /** A line about it, from the application ("A photo of the paper is enough"). */
  detail?: string
  /** The application has it among the files: a check and "Attached". */
  attached?: boolean
}

export interface FileDropzoneProps extends Omit<FieldBaseProps, 'readOnly'> {
  /**
   * Accepted types, as the `accept` attribute takes them: extensions (".pdf"), MIME types
   * ("application/pdf") or families ("image/*"). Left out: any type.
   */
  accept?: readonly string[]
  /** The accepted types in words, from the application ("PDF, XML or JPG"); shown before choosing. */
  acceptText?: string
  /** The largest size in bytes. */
  maxSize?: number
  /**
   * The size limit as the application writes it ("10 MB"); shown before choosing as "up to
   * 10 MB" (`messages['file.maxSize']`) and named in a rejection.
   */
  maxSizeText?: string
  /** Several files at once (default true). */
  multiple?: boolean
  /** How many files may be attached in all, counting `existing`. */
  maxFiles?: number
  /** How many are already attached (the list beside it). */
  existing?: number
  /** The accepted files, in the order chosen. */
  onFiles: (files: File[]) => void
  /** The files that were not taken, with why (also shown under the zone). */
  onReject?: (rejections: FileRejection[]) => void
  /** 'phone' hides the drop text; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  /**
   * On phones, "Take a photo" beside "Choose files": it opens the camera (an input with
   * `capture`), for a paper note or a receipt. The photo is checked as any other file.
   */
  camera?: boolean
  /**
   * Files cannot be added now, and why, from the application ("The period is closed."): the
   * zone is grey, "Choose files" is unavailable and the reason stands under the zone.
   */
  unavailableReason?: string
  /**
   * The documents the application expects, from its data (a request's proof: "Death
   * certificate", required): listed under the zone, each "Required" or "Optional", checked when
   * `attached`.
   */
  expected?: readonly ExpectedFile[]
}

/** The expected documents under the zone; `id` describes "Choose files". */
function ExpectedFiles({ id, files }: { id: string; files: readonly ExpectedFile[] }) {
  const { messages } = useLiro()
  return (
    <div id={id} data-slot="file-expected" className="flex flex-col gap-1">
      <p
        id={`${id}-title`}
        className={cn('m-0 text-xs font-medium text-secondary', TEXT_DIRECTION)}
      >
        {messages['file.expected']}
      </p>
      <ul aria-labelledby={`${id}-title`} className="m-0 flex list-none flex-col gap-1 p-0">
        {files.map((item) => {
          const Icon = item.attached === true ? CircleCheck : FileText
          return (
            <li key={item.key} className="flex min-w-0 items-start gap-1.5 text-sm">
              <Icon
                aria-hidden="true"
                className={cn(
                  'mt-0.5 size-3.5 shrink-0',
                  item.attached === true ? 'text-status-success-fg' : 'text-secondary',
                )}
              />
              <span className="flex min-w-0 flex-col">
                <span className={cn('min-w-0 break-words', TEXT_DIRECTION)}>
                  <span className="font-medium text-primary">{item.label}</span>
                  <span aria-hidden="true" className="px-1.5 text-secondary">
                    ·
                  </span>
                  <span className="sr-only">, </span>
                  <span
                    className={item.attached === true ? 'text-status-success-fg' : 'text-secondary'}
                  >
                    {item.attached === true
                      ? messages['file.expectedAttached']
                      : item.required === true
                        ? messages['file.expectedRequired']
                        : messages['file.expectedOptional']}
                  </span>
                </span>
                {item.detail !== undefined && item.detail !== '' && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {item.detail}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Choose files with a button, or drop them; what is accepted is said before choosing. */
export function FileDropzone(props: FileDropzoneProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const multiple = props.multiple ?? true
  const disabled = props.unavailableReason !== undefined && props.unavailableReason !== ''
  const reasonId = `${useId()}-reason`
  const input = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const camera = props.camera === true && phone
  const hintId = useId()
  const expectedId = `${hintId}-expected`
  const expected = props.expected ?? []
  const [dragging, setDragging] = useState(false)
  const depth = useRef(0)
  const [rejections, setRejections] = useState<FileRejection[]>([])

  const take = (files: File[]) => {
    if (files.length === 0) return
    const { accepted, rejected } = checkFiles(files, {
      ...(props.accept === undefined ? {} : { accept: props.accept }),
      ...(props.maxSize === undefined ? {} : { maxSize: props.maxSize }),
      ...(multiple
        ? {
            ...(props.maxFiles === undefined ? {} : { maxFiles: props.maxFiles }),
            ...(props.existing === undefined ? {} : { existing: props.existing }),
          }
        : { maxFiles: 1 }),
    })
    setRejections(rejected)
    if (accepted.length > 0) props.onFiles(accepted)
    if (rejected.length > 0) props.onReject?.(rejected)
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    take(Array.from(event.target.files ?? []))
    // The same file can be chosen again (after removing it from the list).
    event.target.value = ''
  }

  // The drop target listens natively: a drop target is not a control of its own (the button is),
  // so it has no role, and jsx-a11y does not allow handlers on an element without one. The
  // latest `take` and `disabled` are kept in refs, so the listeners are added once.
  const zone = useRef<HTMLDivElement>(null)
  const latest = useRef({ take, disabled })
  useLayoutEffect(() => {
    latest.current = { take, disabled }
  })
  useEffect(() => {
    const element = zone.current
    if (element === null) return
    const enter = (event: DragEvent) => {
      if (latest.current.disabled) return
      event.preventDefault()
      depth.current += 1
      setDragging(true)
    }
    const over = (event: DragEvent) => {
      if (latest.current.disabled) return
      // Without this the browser opens the file instead of dropping it here.
      event.preventDefault()
      if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'copy'
    }
    const leave = () => {
      depth.current = Math.max(depth.current - 1, 0)
      if (depth.current === 0) setDragging(false)
    }
    const dropped = (event: DragEvent) => {
      event.preventDefault()
      depth.current = 0
      setDragging(false)
      if (latest.current.disabled) return
      latest.current.take(Array.from(event.dataTransfer?.files ?? []))
    }
    element.addEventListener('dragenter', enter)
    element.addEventListener('dragover', over)
    element.addEventListener('dragleave', leave)
    element.addEventListener('drop', dropped)
    return () => {
      element.removeEventListener('dragenter', enter)
      element.removeEventListener('dragover', over)
      element.removeEventListener('dragleave', leave)
      element.removeEventListener('drop', dropped)
    }
  }, [])

  const hint = [
    props.acceptText,
    props.maxSizeText === undefined || props.maxSizeText === ''
      ? undefined
      : messages['file.maxSize'](props.maxSizeText),
  ].filter((part): part is string => part !== undefined && part !== '')
  const accept = props.accept === undefined ? undefined : props.accept.join(',')
  const reject = (rejection: FileRejection) => {
    const name = rejection.file.name
    if (rejection.reason === 'type')
      return messages['file.rejectedType'](name, props.acceptText ?? '')
    if (rejection.reason === 'size')
      return messages['file.rejectedSize'](name, props.maxSizeText ?? '')
    const max = multiple ? (props.maxFiles ?? 1) : 1
    return messages['file.rejectedCount'](name, max, format.number(String(max)))
  }
  return (
    <Field
      {...fieldProps({
        ...props,
        required: props.required ?? expected.some((item) => item.required === true),
      })}
      group
    >
      {(control) => (
        <div role="group" aria-labelledby={control.labelId} className="flex flex-col gap-1.5">
          {/* The drop target: drag events only (dropping is a shortcut; the button is the way). */}
          <div
            ref={zone}
            data-slot="file-dropzone"
            data-dragging={dragging || undefined}
            className={cn(
              'box-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-dashed p-4 transition-colors duration-(--liro-duration-fast) ease-standard',
              disabled
                ? 'border-default bg-surface-disabled'
                : dragging
                  ? 'border-solid border-selected bg-surface-selected'
                  : control.invalid
                    ? 'border-status-danger-fg bg-surface-raised'
                    : 'border-control bg-surface-raised',
            )}
          >
            <Upload
              aria-hidden="true"
              className={cn('size-5 shrink-0', disabled ? 'text-disabled' : 'text-secondary')}
            />
            <ButtonPrimitive
              family="neutral"
              emphasis="secondary"
              aria-disabled={disabled || undefined}
              aria-describedby={
                [
                  hint.length > 0 ? hintId : null,
                  expected.length > 0 ? expectedId : null,
                  disabled ? reasonId : null,
                  control.describedBy ?? null,
                ]
                  .filter((id) => id !== null)
                  .join(' ') || undefined
              }
              onClick={() => {
                if (!disabled) input.current?.click()
              }}
            >
              <FileUp aria-hidden="true" className="size-3.75 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['file.choose'](multiple)}</span>
            </ButtonPrimitive>
            {camera && (
              <ButtonPrimitive
                family="neutral"
                emphasis="secondary"
                aria-disabled={disabled || undefined}
                aria-describedby={disabled ? reasonId : undefined}
                onClick={() => {
                  if (!disabled) cameraInput.current?.click()
                }}
              >
                <Camera aria-hidden="true" className="size-3.75 shrink-0" />
                <span className={TEXT_DIRECTION}>{messages['file.takePhoto']}</span>
              </ButtonPrimitive>
            )}
            {!phone && (
              <span className={cn('text-sm', 'text-secondary', TEXT_DIRECTION)}>
                {messages['file.drop'](multiple)}
              </span>
            )}
            {hint.length > 0 && (
              <p
                id={hintId}
                className={cn('m-0 basis-full text-xs', 'text-secondary', TEXT_DIRECTION)}
              >
                {hint.map((part, index) => (
                  <span key={index}>
                    {index > 0 && (
                      <>
                        <span aria-hidden="true" className="px-1.5">
                          ·
                        </span>
                        <span className="sr-only">, </span>
                      </>
                    )}
                    {part}
                  </span>
                ))}
              </p>
            )}
            <input
              ref={input}
              type="file"
              hidden
              tabIndex={-1}
              multiple={multiple}
              disabled={disabled}
              {...(accept === undefined ? {} : { accept })}
              onChange={onChange}
            />
            {camera && (
              <input
                ref={cameraInput}
                type="file"
                hidden
                tabIndex={-1}
                accept="image/*"
                capture="environment"
                disabled={disabled}
                onChange={onChange}
              />
            )}
          </div>
          {expected.length > 0 && <ExpectedFiles id={expectedId} files={expected} />}
          {disabled && (
            <FieldMessage id={reasonId} tone="hint">
              {props.unavailableReason}
            </FieldMessage>
          )}
          {/* Always in the page, so a rejection is announced when it appears. */}
          <div role="alert" className="flex flex-col gap-1 empty:hidden">
            {rejections.map((rejection, index) => (
              <FieldMessage
                key={`${rejection.file.name}-${String(index)}`}
                id={`${hintId}-r${String(index)}`}
                tone="error"
              >
                {reject(rejection)}
              </FieldMessage>
            ))}
          </div>
        </div>
      )}
    </Field>
  )
}
