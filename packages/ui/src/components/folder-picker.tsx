import { FolderInput } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { UnavailableAction } from './actions'
import { Button } from './button'
import { Dialog } from './dialog'
import { blockedFolders, folderPath, pickerTree } from './file-browser-logic'
import { findTreeNode, type TreeNode } from './tree-logic'
import { TreeView } from './tree-view'

/*
 * FolderPicker and FolderPickerDialog (BUILD-PLAN P5.43): choose the folder to move or copy
 * files to — the keyboard's and the menu's way for every drag onto a folder (WCAG 2.5.7).
 * - FolderPicker is TreeView with one choice (the neutral selection, D17): the application's
 *   folders, opened where needed (lazy children through `onLoadChildren`). The folders being
 *   moved and every folder inside them cannot be chosen and say why (`moving`,
 *   `blockedFolders`); a folder the application closes says its own reason (`disabledReason`).
 * - FolderPickerDialog asks once: the action as its title ("Move to"), what is moved bold under
 *   it (`subject`, D22: "Ugovor_Stanogradnja.pdf" or "3 items"), the picker, then the
 *   destination in words ("Destination: Company documents / Contracts / 2026") or why the button
 *   cannot be used yet (nothing chosen; the items are already there, `from`), and Cancel / the
 *   action (main last). A returned promise keeps the dialog busy until it settles.
 */

export interface FolderPickerProps {
  /** The folders, from the application. */
  nodes: readonly TreeNode[]
  /** The chosen folder's id. */
  value: string | null
  onChange: (id: string) => void
  /** Names the tree. Default `messages['files.folders']`. */
  label?: string
  /** The ids of folders being moved: they and their folders cannot be chosen. */
  moving?: readonly string[]
  /** The folders open at first. Default: the chosen folder's ancestors. */
  defaultExpanded?: readonly string[]
  /** A folder whose children are not loaded yet was opened: the application loads them. */
  onLoadChildren?: (id: string) => void
  /** The tree scrolls inside this height. Default "18rem". */
  maxHeight?: string
  /** 'phone' draws the touch rows; default by the viewport. */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** The folders as a tree with one choice; moved folders cannot be chosen. */
export function FolderPicker(props: FolderPickerProps) {
  const { messages } = useLiro()
  const moving = props.moving
  const nodes = useMemo(
    () =>
      moving === undefined || moving.length === 0
        ? props.nodes
        : pickerTree(
            props.nodes,
            blockedFolders(props.nodes, moving),
            messages['folderPicker.moving'],
          ),
    [props.nodes, moving, messages],
  )
  const defaultExpanded =
    props.defaultExpanded ??
    (props.value === null ? [] : folderPath(props.nodes, props.value).slice(0, -1))
  return (
    <TreeView
      nodes={nodes}
      label={props.label ?? messages['files.folders']}
      selectionMode="single"
      selected={props.value === null ? [] : [props.value]}
      onSelectedChange={(ids) => {
        const id = ids[0]
        if (id !== undefined) props.onChange(id)
      }}
      defaultExpanded={defaultExpanded}
      {...(props.onLoadChildren === undefined ? {} : { onLoadChildren: props.onLoadChildren })}
      maxHeight={props.maxHeight ?? '18rem'}
      {...(props.layout === undefined ? {} : { layout: props.layout })}
      className={cn(
        'rounded-md border border-solid border-default bg-surface-raised p-1',
        props.className,
      )}
    />
  )
}

/** A folder's path in words, from the loaded tree: "Company documents / Contracts / 2026". */
export function folderPathText(nodes: readonly TreeNode[], id: string): string {
  return folderPath(nodes, id)
    .map((each) => findTreeNode(nodes, each)?.label ?? each)
    .join(' / ')
}

export interface FolderPickerDialogProps extends Omit<
  FolderPickerProps,
  'value' | 'onChange' | 'className'
> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The action, from the application ("Move to", "Copy to"). */
  title: string
  /** What is moved or copied, bold under the title ("Ugovor.pdf", "3 items"). */
  subject?: ReactNode
  /** A line under the title, from the application. */
  description?: ReactNode
  /** The confirm button's text ("Move here", "Copy here"). */
  confirmLabel: string
  /** The folder the items are in now: it cannot be chosen as the destination. */
  from?: string | null
  /** The folder chosen at first. Default `from`. */
  defaultValue?: string | null
  /** Moves or copies to the chosen folder; a returned promise keeps the dialog busy. */
  onConfirm: (folderId: string) => void | Promise<void>
}

/** Choose a destination folder for a move or a copy, in one dialog. */
export function FolderPickerDialog(props: FolderPickerDialogProps) {
  const { messages } = useLiro()
  const reasonId = useId()
  const [value, setValue] = useState<string | null>(props.defaultValue ?? props.from ?? null)
  const [busy, setBusy] = useState(false)
  const reason =
    value === null
      ? messages['folderPicker.none']
      : value === props.from
        ? messages['folderPicker.here']
        : null
  const confirm = () => {
    if (value === null || reason !== null) return
    const result = props.onConfirm(value)
    if (!(result instanceof Promise)) return
    setBusy(true)
    const done = () => {
      setBusy(false)
    }
    result.then(done, done)
  }
  const { open, onOpenChange } = props
  return (
    <Dialog
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
      title={props.title}
      {...(props.subject === undefined ? {} : { subject: props.subject })}
      {...(props.description === undefined ? {} : { description: props.description })}
      dismissible={!busy}
      actions={
        <>
          <Button
            intent="cancel"
            label={messages['dialog.cancel']}
            disabled={busy}
            onClick={() => onOpenChange?.(false)}
          />
          {reason === null ? (
            <Button
              family="primary"
              icon={FolderInput}
              emphasis="primary"
              label={props.confirmLabel}
              disabled={busy}
              onClick={confirm}
            />
          ) : (
            <UnavailableAction
              family="primary"
              icon={FolderInput}
              emphasis="primary"
              label={props.confirmLabel}
              reason={reason}
              reasonId={reasonId}
            />
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <FolderPicker
          nodes={props.nodes}
          value={value}
          onChange={setValue}
          {...(props.label === undefined ? {} : { label: props.label })}
          {...(props.moving === undefined ? {} : { moving: props.moving })}
          {...(props.defaultExpanded === undefined
            ? {}
            : { defaultExpanded: props.defaultExpanded })}
          {...(props.onLoadChildren === undefined ? {} : { onLoadChildren: props.onLoadChildren })}
          {...(props.maxHeight === undefined ? {} : { maxHeight: props.maxHeight })}
          {...(props.layout === undefined ? {} : { layout: props.layout })}
        />
        <p
          id={reasonId}
          aria-live="polite"
          className={cn(
            'm-0 text-sm',
            reason === null ? 'text-primary' : 'text-secondary',
            TEXT_DIRECTION,
          )}
        >
          {reason ??
            (value === null
              ? ''
              : messages['folderPicker.destination'](folderPathText(props.nodes, value)))}
        </p>
      </div>
    </Dialog>
  )
}
