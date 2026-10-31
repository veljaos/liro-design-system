import { Archive, Link2, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import { KeyValueList, type KeyValueItem } from './cards'
import { momentText, sizeText, type FileEntry } from './file-browser-logic'
import { EntryMarks, FileIcon } from './file-entry-parts'
import { ActivityList, type ActivityEntry } from './panel-lists'
import { SidePanels, type SidePanel } from './side-panels'
import { StatusBadge } from './status-badge'

/*
 * FileDetails: everything about one file or folder, in the details column of
 * a files page (ListPage with the file components, the files recipe; a Drawer on phones): its icon and name (h2) with the application's marks, its
 * actions, then SidePanels, each collapsible:
 * - Details: type, size, owner, created, modified, location (through `format`), and the
 *   retention label exactly in the application's words ("Keep until 2036", with an Archive icon),
 *   tags as neutral badges, and any facts of the application's own (`facts`);
 * - Linked to: the records the file belongs to, as links (invoice F-2026-0412, an employee file);
 * - Signing: the application's SignerList (signed state, Sign);
 * - Versions: the application's VersionList;
 * - Sharing: who has access, with Share (the application's);
 * - Activity: who did what, newest first (ActivityList).
 * Which panels are open is the application's (`open`) or the component's (`defaultOpen`).
 */

export interface FileDetailsProps {
  entry: FileEntry
  /** When it was created: an ISO instant or YYYY-MM-DD. */
  created?: string
  /** The retention label, in the application's words ("Keep until 2036"). */
  retention?: string
  /** Tags, in the application's words. */
  tags?: readonly string[]
  /** Further facts of the application's own, after the standard ones. */
  facts?: readonly KeyValueItem[]
  /** The file's actions (Download, Share), under its name. */
  actions?: ReactNode
  /** The signing: a SignerList. */
  signing?: ReactNode
  /** The versions: a VersionList. */
  versions?: ReactNode
  /** How many versions, after the panel's name. */
  versionCount?: number
  /** Who has access: the application's summary and its Share. */
  sharing?: ReactNode
  /** What happened to it, newest first. */
  activity?: readonly ActivityEntry[]
  /** The open panels' keys ('details', 'links', 'signing', 'versions', 'sharing', 'activity'). */
  open?: readonly string[]
  /** The panels open at first. Default: details, links and signing. */
  defaultOpen?: readonly string[]
  onOpenChange?: (open: string[]) => void
  /** Closes the details (a 28px X at the end of the name; left out in a Drawer, which has its own). */
  onClose?: () => void
  className?: string
}

/** One file's or folder's facts, links, signing, versions, sharing and activity. */
export function FileDetails(props: FileDetailsProps) {
  const { messages, format, linkComponent: Link } = useLiro()
  const [innerOpen, setInnerOpen] = useState<readonly string[]>(
    props.defaultOpen ?? ['details', 'links', 'signing'],
  )
  const open = props.open ?? innerOpen
  const entry = props.entry
  const size = sizeText(format, messages, entry)

  const items: KeyValueItem[] = [
    {
      key: 'type',
      label: messages['files.type'],
      value: entry.typeLabel ?? (entry.kind === 'folder' ? messages['files.folder'] : undefined),
    },
    ...(entry.kind === 'folder' && entry.itemCount !== undefined
      ? [
          {
            key: 'items',
            label: messages['files.size'],
            value: messages['files.items'](entry.itemCount, format.number(String(entry.itemCount))),
            numeric: true,
          },
        ]
      : [{ key: 'size', label: messages['files.size'], value: size, numeric: true }]),
    { key: 'owner', label: messages['files.owner'], value: entry.owner },
    ...(props.created === undefined
      ? []
      : [
          {
            key: 'created',
            label: messages['files.created'],
            value: <span className="bidi-isolate">{momentText(format, props.created)}</span>,
            numeric: true,
          },
        ]),
    {
      key: 'modified',
      label: messages['files.modified'],
      value:
        entry.modified === undefined ? undefined : (
          <span className="bidi-isolate">{momentText(format, entry.modified)}</span>
        ),
      numeric: true,
    },
    ...(entry.location === undefined
      ? []
      : [{ key: 'location', label: messages['files.location'], value: entry.location }]),
    ...(props.retention === undefined
      ? []
      : [
          {
            key: 'retention',
            label: messages['files.retention'],
            value: (
              <span className="inline-flex items-center gap-1.5">
                <Archive aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
                <span className={TEXT_DIRECTION}>{props.retention}</span>
              </span>
            ),
          },
        ]),
    ...(props.tags === undefined || props.tags.length === 0
      ? []
      : [
          {
            key: 'tags',
            label: messages['files.tags'],
            value: (
              <span className="inline-flex flex-wrap gap-1">
                {props.tags.map((tag) => (
                  <StatusBadge key={tag} label={tag} tone="neutral" />
                ))}
              </span>
            ),
          },
        ]),
    ...(props.facts ?? []),
  ]

  const links = entry.links ?? []
  const panels: SidePanel[] = [
    {
      key: 'details',
      title: messages['files.details'],
      content: <KeyValueList items={items} columns={1} />,
    },
    ...(links.length === 0
      ? []
      : [
          {
            key: 'links',
            title: messages['files.links'],
            count: links.length,
            content: (
              <ul aria-label={messages['files.links']} className="m-0 flex list-none flex-col p-0">
                {links.map((link) => (
                  <li
                    key={link.key}
                    data-slot="panel-row"
                    className="flex min-w-0 items-center gap-2 border-0 border-b border-solid border-subtle py-2 last:border-b-0"
                  >
                    <Link2 aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
                    <Link
                      href={link.href}
                      className={cn(
                        'inline-flex min-h-6 min-w-0 items-center rounded-sm text-sm text-link underline visited:text-link hover:text-link',
                        FOCUS_RING,
                        TEXT_DIRECTION,
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          },
        ]),
    ...(props.signing === undefined
      ? []
      : [{ key: 'signing', title: messages['files.signing'], content: props.signing }]),
    ...(props.versions === undefined
      ? []
      : [
          {
            key: 'versions',
            title: messages['files.versions'],
            ...(props.versionCount === undefined ? {} : { count: props.versionCount }),
            content: props.versions,
          },
        ]),
    ...(props.sharing === undefined
      ? []
      : [{ key: 'sharing', title: messages['files.sharing'], content: props.sharing }]),
    ...(props.activity === undefined || props.activity.length === 0
      ? []
      : [
          {
            key: 'activity',
            title: messages['files.activity'],
            content: (
              <ActivityList items={props.activity} label={messages['files.activity']} limit={3} />
            ),
          },
        ]),
  ]

  return (
    <div
      data-slot="file-details"
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <FileIcon entry={entry} className="mt-0.5 size-6" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="m-0 text-h3 font-semibold text-primary">
              <bdi dir="auto" className="break-words">
                {entry.name}
              </bdi>
            </h2>
            <span className="flex flex-wrap items-center gap-1.5 empty:hidden">
              <EntryMarks entry={entry} />
            </span>
          </div>
          {props.onClose !== undefined && (
            <CompactIconButton icon={X} label={messages['dialog.close']} onClick={props.onClose} />
          )}
        </div>
        {props.actions !== undefined && (
          <div className="flex flex-wrap items-center gap-2">{props.actions}</div>
        )}
      </div>
      <SidePanels
        panels={panels}
        open={open}
        onOpenChange={(next) => {
          setInnerOpen(next)
          props.onOpenChange?.(next)
        }}
      />
    </div>
  )
}
