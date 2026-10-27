import { ChevronLeft, ChevronRight, Download, FileQuestion } from 'lucide-react'
import type { KeyboardEvent, ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogCloseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { EmptyState } from './empty-state'
import { Tooltip } from './popover'

/*
 * FilePreview (BUILD-PLAN P5.43): one file shown on the whole screen, with the previous and the
 * next file of its folder. The viewer is the application's: a PDF or an office file in
 * DocumentFrame (a viewer on another origin), a photo or a scan in PageViewer — the preview only
 * frames it.
 * - A full-screen sheet on every width (a phone's preview is full screen; a desktop's needs the
 *   room): a header with the file's name (the title, read in its own direction) and the
 *   application's line under it ("PDF · 2,4 MB · Milica Petrović"), then "3 of 12", Previous
 *   file / Next file (28px, chevrons that mirror in right-to-left; unavailable at the ends),
 *   Download (the document family) and the application's own actions (Share, Details), Close.
 *   ArrowLeft and ArrowRight outside the viewer go to the previous and next file by the reading
 *   direction (Appendix B.7).
 * - The body is the viewer, filling the rest of the screen; a file without a preview says so
 *   (`unavailable`: "This file cannot be previewed", with Download).
 * - Escape and Close return the focus to what opened it (the dialog's own rule).
 */

export interface FilePreviewProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The file's name: the title. */
  name: string
  /** A line under the name, from the application ("PDF · 2,4 MB · Milica Petrović"). */
  description?: ReactNode
  /** The file's place in its folder, from 1, and how many there are: "3 of 12". */
  index?: number
  total?: number
  /** The previous / next file; left out at the ends. */
  onPrevious?: () => void
  onNext?: () => void
  /** Downloads the file (the application fetches a short-lived link). */
  onDownload?: () => void
  /** The application's actions for the file, before Download (Share, Details). */
  actions?: ReactNode
  /** The viewer: DocumentFrame, PageViewer or the application's own. */
  children?: ReactNode
  /** The file cannot be shown: true for the provider's words, or the application's own. */
  unavailable?: ReactNode
}

/** A file on the whole screen with its folder's previous and next file. */
export function FilePreview(props: FilePreviewProps) {
  const { messages, format, direction } = useLiro()
  const hasPosition = props.index !== undefined && props.total !== undefined
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, iframe, [role="toolbar"]') !== null
    ) {
      return
    }
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward && props.onNext !== undefined) {
      event.preventDefault()
      props.onNext()
    } else if (event.key === backward && props.onPrevious !== undefined) {
      event.preventDefault()
      props.onPrevious()
    }
  }
  const Back = direction === 'rtl' ? ChevronRight : ChevronLeft
  const Forward = direction === 'rtl' ? ChevronLeft : ChevronRight
  const unavailable = props.unavailable !== undefined && props.unavailable !== false
  return (
    <Sheet
      {...(props.open === undefined ? {} : { open: props.open })}
      {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
    >
      <SheetContent
        side="full"
        data-slot="file-preview"
        onKeyDown={onKeyDown}
        {...(props.description === undefined ? { 'aria-describedby': undefined } : {})}
        className="overflow-hidden pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]"
      >
        <DialogHeader className="shrink-0 flex-wrap items-start gap-y-2 border-0 border-b border-solid border-default pt-[max(16px,env(safe-area-inset-top))]">
          <div className="flex min-w-0 flex-1 basis-60 flex-col gap-1">
            <DialogTitle className="leading-snug font-medium">
              <bdi dir="auto" className="break-words">
                {props.name}
              </bdi>
            </DialogTitle>
            {props.description !== undefined && (
              <DialogDescription className="text-xs">{props.description}</DialogDescription>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasPosition && (
              <span className={cn('text-sm text-secondary tabular-nums', TEXT_ISOLATE)}>
                {messages['files.position'](
                  props.index ?? 0,
                  format.number(String(props.index ?? 0)),
                  props.total ?? 0,
                  format.number(String(props.total ?? 0)),
                )}
              </span>
            )}
            {(props.onPrevious !== undefined || props.onNext !== undefined || hasPosition) && (
              <span className="flex items-center gap-1">
                <Tooltip label={messages['files.previous']}>
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="compact"
                    aria-label={messages['files.previous']}
                    disabled={props.onPrevious === undefined}
                    onClick={props.onPrevious}
                  >
                    <Back aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                </Tooltip>
                <Tooltip label={messages['files.next']}>
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="menu"
                    shape="compact"
                    aria-label={messages['files.next']}
                    disabled={props.onNext === undefined}
                    onClick={props.onNext}
                  >
                    <Forward aria-hidden="true" className="size-4" />
                  </ButtonPrimitive>
                </Tooltip>
              </span>
            )}
            {props.actions}
            {props.onDownload !== undefined && (
              <Button
                intent="download"
                label={messages['files.download']}
                onClick={props.onDownload}
              />
            )}
            <DialogCloseButton label={messages['dialog.close']} />
          </div>
        </DialogHeader>
        <div
          data-slot="file-preview-body"
          className="flex min-h-0 flex-1 flex-col overflow-auto bg-surface-sunken p-4"
        >
          {unavailable ? (
            <EmptyState
              icon={FileQuestion}
              title={messages['files.noPreview']}
              description={
                props.unavailable === true
                  ? messages['files.noPreviewDescription']
                  : props.unavailable
              }
              {...(props.onDownload === undefined
                ? {}
                : {
                    action: {
                      label: messages['files.download'],
                      icon: Download,
                      onClick: props.onDownload,
                    },
                  })}
              className={cn('my-auto', TEXT_DIRECTION)}
            />
          ) : (
            props.children
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
