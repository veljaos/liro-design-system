import { PenLine, X } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import {
  SIGNATURE_SIZE,
  boxAtPoint,
  firstFreeSpot,
  keepOnPage,
  nudgeBox,
  placementFits,
  toTopLeft,
  type DocumentArea,
  type PdfBox,
} from './document-areas'
import { PageViewer } from './page-viewer'
import { regionBox, type ViewerPage } from './page-viewer-logic'
import { RadioGroupField } from './radio-group-field'

/*
 * SignaturePlacer: where each signer signs a document shown as page images. One box per signer,
 * labelled with the signer's name, in the size the data gives (190 × 48 points by default).
 * - The signer is chosen in a list; a press (a tap on a phone) on the page puts that signer's box
 *   there, a drag moves it, and the arrow keys move the focused box (5 points, Shift 50), so no
 *   placement needs a pointer. "Place on this page" finds the first free spot.
 * - Or one of the document's empty signature areas is taken as it is.
 * - A box stays inside its page and never stands over an area or another signer's box; a move that
 *   would is refused and said.
 * - It reports each signer's box in PDF points from the page's bottom-left corner
 *   (`onChange(signerId, { page, x, y, width, height })`), the convention of the renderer's areas.
 * Props in, callbacks out: it never calls a service.
 */

/** A person who signs. */
export interface SignatureSigner {
  id: string
  name: string
}

export interface SignaturePlacerProps {
  /** Names the document's pages ("Annex 2 to the employment contract"). */
  label: string
  /** The document's pages as images, each with its size in PDF points. */
  pages: readonly ViewerPage[]
  /** The document's own areas (PDF points, bottom-left); its signature areas can be taken. */
  areas?: readonly DocumentArea[]
  signers: readonly SignatureSigner[]
  /** Each signer's box, by signer id: PDF points from the page's bottom-left corner, or null. */
  value: Readonly<Record<string, PdfBox | null | undefined>>
  onChange: (signerId: string, box: PdfBox | null) => void
  /** The box's size in points. Default 190 × 48. */
  boxSize?: { width: number; height: number }
  /** The signer being placed (controlled). Default: the first signer. */
  activeSigner?: string
  onActiveSignerChange?: (signerId: string) => void
  /** Adds "Download PDF" to the viewer's toolbar. */
  onDownload?: () => void
  /** Layout classes. */
  className?: string
}

/** A signer's box as it moves under the pointer, before it is let go. */
interface Drag {
  signerId: string
  startX: number
  startY: number
  origin: PdfBox
  box: PdfBox
}

/** Where each signer signs: one box per signer, placed by pointer, touch, keys or an area. */
export function SignaturePlacer(props: SignaturePlacerProps) {
  const { messages, format } = useLiro()
  const hintId = useId()
  const size = props.boxSize ?? SIGNATURE_SIZE
  const [innerActive, setInnerActive] = useState(props.signers[0]?.id ?? '')
  const active = props.activeSigner ?? innerActive
  const [page, setPage] = useState(1)
  const [said, setSaid] = useState('')
  const [drag, setDrag] = useState<Drag | null>(null)
  const layer = useRef<HTMLDivElement>(null)
  const areas = props.areas ?? []
  const signatureAreas = areas.filter((area) => area.kind === 'signature')

  const choose = (signerId: string) => {
    setInnerActive(signerId)
    props.onActiveSignerChange?.(signerId)
  }
  const nameOf = (signerId: string) =>
    props.signers.find((signer) => signer.id === signerId)?.name ?? signerId
  const sizeOf = (pageNumber: number) => props.pages[pageNumber - 1]
  const points = (value: number) => format.number(String(Math.round(value)))
  const where = (box: PdfBox) =>
    messages['signature.where'](format.number(String(box.page)), points(box.x), points(box.y))

  /** Everything a signer's box may not overlap: the areas it does not take, the others' boxes. */
  const obstacles = (signerId: string, box: PdfBox | null): PdfBox[] => [
    ...areas.filter((area) => box === null || !sameBox(area, box)),
    ...props.signers
      .filter((signer) => signer.id !== signerId)
      .flatMap((signer) => {
        const other = props.value[signer.id]
        return other === null || other === undefined ? [] : [other]
      }),
  ]
  const commit = (signerId: string, box: PdfBox | null, note?: string) => {
    props.onChange(signerId, box)
    setSaid(
      note ??
        (box === null
          ? messages['signature.removed'](nameOf(signerId))
          : messages['signature.placed'](nameOf(signerId), where(box))),
    )
  }
  const tryPlace = (signerId: string, box: PdfBox) => {
    const pageSize = sizeOf(box.page)
    if (pageSize === undefined) return false
    const others = obstacles(signerId, box)
    if (!placementFits(box, pageSize, others)) {
      setSaid(messages['signature.noRoom'])
      return false
    }
    commit(signerId, box)
    return true
  }

  const onLayerPointerDown = (event: PointerEvent<HTMLDivElement>, pageNumber: number) => {
    if (event.target !== event.currentTarget || active === '') return
    const pageSize = sizeOf(pageNumber)
    const rect = event.currentTarget.getBoundingClientRect()
    if (pageSize === undefined || rect.width === 0 || rect.height === 0) return
    tryPlace(
      active,
      boxAtPoint(
        pageNumber,
        {
          fx: (event.clientX - rect.left) / rect.width,
          fy: (event.clientY - rect.top) / rect.height,
        },
        size,
        pageSize,
      ),
    )
  }

  const onBoxPointerDown = (event: PointerEvent<HTMLDivElement>, signerId: string, box: PdfBox) => {
    if (signerId !== active) choose(signerId)
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ signerId, startX: event.clientX, startY: event.clientY, origin: box, box })
  }
  const onBoxPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag === null) return
    const rect = layer.current?.getBoundingClientRect()
    const pageSize = sizeOf(drag.origin.page)
    if (rect === undefined || rect.width === 0 || pageSize === undefined) return
    const dx = ((event.clientX - drag.startX) / rect.width) * pageSize.width
    const dy = ((event.clientY - drag.startY) / rect.height) * pageSize.height
    setDrag({
      ...drag,
      box: keepOnPage({ ...drag.origin, x: drag.origin.x + dx, y: drag.origin.y - dy }, pageSize),
    })
  }
  const onBoxPointerUp = () => {
    if (drag === null) return
    if (!sameBox(drag.box, drag.origin)) tryPlace(drag.signerId, drag.box)
    setDrag(null)
  }
  const onBoxKeyDown = (event: KeyboardEvent<HTMLDivElement>, signerId: string, box: PdfBox) => {
    const pageSize = sizeOf(box.page)
    if (pageSize === undefined) return
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      commit(signerId, null)
      return
    }
    const next = nudgeBox(box, event.key, event.shiftKey, pageSize)
    if (next === null) return
    event.preventDefault()
    event.stopPropagation()
    if (sameBox(next, box)) return
    tryPlace(signerId, next)
  }

  const activeBox = props.value[active] ?? null
  const placeHere = () => {
    const pageSize = sizeOf(page)
    if (pageSize === undefined || active === '') return
    const spot = firstFreeSpot(page, size, pageSize, obstacles(active, null))
    if (spot === null) setSaid(messages['signature.noRoom'])
    else commit(active, spot)
  }
  const takenAreas = new Set(
    props.signers.flatMap((signer) => {
      const box = props.value[signer.id]
      if (box === null || box === undefined) return []
      return signatureAreas.filter((area) => sameBox(area, box)).map((area) => area.name)
    }),
  )

  // The empty signature areas the active signer can take: none another signer already took.
  const freeAreas = signatureAreas.filter(
    (area) => !takenAreas.has(area.name) || (activeBox !== null && sameBox(area, activeBox)),
  )

  return (
    <div
      data-slot="signature-placer"
      className={cn('flex flex-col gap-4 font-sans md:flex-row', props.className)}
    >
      <div className="flex flex-col gap-4 md:w-72 md:shrink-0">
        <RadioGroupField
          label={messages['signature.signers']}
          value={active}
          onChange={choose}
          options={props.signers.map((signer) => {
            const box = props.value[signer.id]
            return {
              value: signer.id,
              label: signer.name,
              description:
                box === null || box === undefined ? messages['signature.notPlaced'] : where(box),
            }
          })}
        />
        <p id={hintId} className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {messages['signature.hint']}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            family="neutral"
            icon={PenLine}
            label={messages['signature.placeOnPage']}
            onClick={placeHere}
          />
          {activeBox !== null && (
            <Button
              family="neutral"
              icon={X}
              label={messages['signature.remove']}
              onClick={() => {
                commit(active, null)
              }}
            />
          )}
        </div>
        {freeAreas.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm font-medium text-primary">{messages['signature.areas']}</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {freeAreas.map((area) => {
                return (
                  <li key={area.name}>
                    <Button
                      family="neutral"
                      emphasis="secondary"
                      icon={PenLine}
                      label={messages['signature.useArea'](
                        area.label ?? area.name,
                        format.number(String(area.page)),
                      )}
                      onClick={() => {
                        setPage(area.page)
                        tryPlace(active, {
                          page: area.page,
                          x: area.x,
                          y: area.y,
                          width: area.width,
                          height: area.height,
                        })
                      }}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <p role="status" className="sr-only">
          {said}
        </p>
      </div>
      <PageViewer
        label={props.label}
        pages={props.pages}
        areas={areas}
        page={page}
        onPageChange={setPage}
        className="h-[36rem] min-w-0 flex-1"
        {...(props.onDownload === undefined ? {} : { onDownload: props.onDownload })}
        overlay={(shown) => (
          <div
            ref={layer}
            data-slot="signature-layer"
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={(event) => {
              onLayerPointerDown(event, shown.number)
            }}
          >
            {props.signers.map((signer) => {
              const placed = drag?.signerId === signer.id ? drag.box : props.value[signer.id]
              if (placed?.page !== shown.number) return null
              const box = regionBox(toTopLeft(placed, shown.height), shown)
              if (box === null) return null
              const isActive = signer.id === active
              const dragging = drag?.signerId === signer.id
              const blocked =
                dragging && !placementFits(placed, shown, obstacles(signer.id, placed))
              return (
                <div
                  key={signer.id}
                  role="button"
                  tabIndex={isActive ? 0 : -1}
                  aria-roledescription={messages['signature.box']}
                  aria-label={messages['signature.boxLabel'](signer.name, where(placed))}
                  aria-describedby={hintId}
                  data-slot="signature-box"
                  data-active={isActive ? '' : undefined}
                  className={cn(
                    'absolute box-border flex cursor-grab touch-none items-center justify-center rounded-xs border-2 border-solid p-1 select-none active:cursor-grabbing',
                    isActive
                      ? 'z-[2] border-brand bg-brand-subtle/80'
                      : 'z-[1] border-strong bg-surface-raised/80',
                    blocked && 'border-status-danger-fg bg-status-danger-bg/80',
                    FOCUS_RING,
                  )}
                  style={{
                    insetInlineStart: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                  }}
                  onPointerDown={(event) => {
                    onBoxPointerDown(event, signer.id, placed)
                  }}
                  onPointerMove={onBoxPointerMove}
                  onPointerUp={onBoxPointerUp}
                  onPointerCancel={() => {
                    setDrag(null)
                  }}
                  onKeyDown={(event) => {
                    onBoxKeyDown(event, signer.id, placed)
                  }}
                >
                  <span
                    className={cn(
                      'flex min-w-0 items-center gap-1 text-xs font-medium text-primary',
                      TEXT_ISOLATE,
                    )}
                  >
                    <PenLine aria-hidden="true" className="size-3 shrink-0" />
                    <span className="truncate">{signer.name}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      />
    </div>
  )
}

/** Whether two boxes are the same rectangle on the same page (to within a hundredth of a point). */
function sameBox(a: PdfBox, b: PdfBox): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) < 0.01
  return (
    a.page === b.page &&
    near(a.x, b.x) &&
    near(a.y, b.y) &&
    near(a.width, b.width) &&
    near(a.height, b.height)
  )
}
