import { ListTree } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { DialogBody, DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import {
  latinTag,
  legalContentsTree,
  legalHeadingIds,
  mapLegalText,
  serbianScript,
  transliterateCyrillicToLatin,
  transliterates,
} from './legal-logic'
import type { LegalNode } from './legal-model'
import { TreeView } from './tree-view'

/*
 * LegalContents: the table of contents of a legal act in a start-side
 * Drawer, opened by "Contents" — one pattern on every width. Inside, the
 * act's headings and articles as a TreeView, every heading open, the current entry selected
 * (surface.selected with the border.selected bar). Choosing an entry — the current one
 * included — closes the drawer and then calls `onNavigate(id)`, once the focus is free to move:
 * the page brings the entry into view and focuses its heading (LegalText's `revealNode`).
 */

export interface LegalContentsProps {
  /** The act's text, as given to LegalText. */
  nodes: readonly LegalNode[]
  /** The heading or article the reader is at, marked in the tree. */
  currentId?: string | null
  /**
   * An entry was chosen: its id. Called after the drawer has closed, so the page can move the
   * focus to the entry.
   */
  onNavigate: (id: string) => void
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * The element that opens it. Default: a "Contents" button; `null` for none, when the page
   * opens it itself (`open`).
   */
  trigger?: ReactElement | null
  /** The drawer's title and the tree's name. Default `messages['legal.contents']`. */
  title?: string
  /** The language tag of the act, as LegalText's (for `lang` and the transliteration). */
  lang?: string
  /** The script shown, as LegalText's: a Cyrillic act in Latin is transliterated here too. */
  script?: 'latin' | 'cyrillic'
  /** 'phone' draws the tree's touch rows (44px); default by the viewport. */
  layout?: 'desktop' | 'phone'
}

/** The table of contents of an act, in a start-side drawer. */
export function LegalContents(props: LegalContentsProps) {
  const { messages, locale } = useLiro()
  const title = props.title ?? messages['legal.contents']
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const setOpen = (next: boolean) => {
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }

  const script = props.script ?? serbianScript(props.lang) ?? 'latin'
  const latin = transliterates(props.lang, script)
  const nodes = useShownNodes(props.nodes, latin)
  const tree = useMemo(() => legalContentsTree(nodes), [nodes])
  const headings = useMemo(() => legalHeadingIds(nodes), [nodes])
  const textLang = latin && props.lang !== undefined ? latinTag(props.lang) : props.lang

  // The entry chosen: the drawer closes first, `onNavigate` follows once the focus is free.
  const chosen = useRef<string | null>(null)
  const choose = (id: string) => {
    chosen.current = id
    setOpen(false)
  }
  const chooseRef = useRef(choose)
  useEffect(() => {
    chooseRef.current = choose
  })

  // The current entry is already selected, so the tree reports no change when it is chosen
  // again: a press or Enter / Space on its row is caught here.
  const box = useRef<HTMLDivElement>(null)
  const currentId = props.currentId ?? null
  useEffect(() => {
    const element = box.current
    if (element === null || currentId === null) return
    const rowOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-tree-row]') : null
    const onClick = (event: MouseEvent) => {
      const row = rowOf(event.target)
      if (
        row?.dataset.treeRow === currentId &&
        event.target instanceof Element &&
        event.target.closest('[data-slot="tree-chevron"]') === null
      ) {
        chooseRef.current(currentId)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const row = rowOf(event.target)
      if (row?.dataset.treeRow === currentId && row === event.target) chooseRef.current(currentId)
    }
    element.addEventListener('click', onClick)
    element.addEventListener('keydown', onKeyDown)
    return () => {
      element.removeEventListener('click', onClick)
      element.removeEventListener('keydown', onKeyDown)
    }
  }, [currentId, open])

  const trigger =
    props.trigger === undefined ? (
      <Button family="neutral" icon={ListTree} label={messages['legal.contents']} />
    ) : (
      props.trigger
    )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger !== null && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        side="start"
        aria-describedby={undefined}
        data-slot="legal-contents"
        onCloseAutoFocus={(event) => {
          const id = chosen.current
          if (id === null) return
          // The page moves the focus to the entry chosen, not back to the trigger.
          chosen.current = null
          event.preventDefault()
          props.onNavigate(id)
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton label={messages['dialog.close']} />
        </DialogHeader>
        <DialogBody>
          <div ref={box} {...langAttribute(textLang, locale)}>
            <TreeView
              nodes={tree}
              label={title}
              selectionMode="single"
              selected={currentId === null ? [] : [currentId]}
              defaultExpanded={headings}
              onSelectedChange={(ids) => {
                const id = ids[0]
                if (id !== undefined) choose(id)
              }}
              {...(props.layout === undefined ? {} : { layout: props.layout })}
            />
          </div>
        </DialogBody>
      </SheetContent>
    </Sheet>
  )
}

/** The act's nodes as shown: transliterated to Latin when `latin`. */
function useShownNodes(nodes: readonly LegalNode[], latin: boolean): readonly LegalNode[] {
  return useMemo(
    () => (latin ? mapLegalText(nodes, transliterateCyrillicToLatin) : nodes),
    [latin, nodes],
  )
}
