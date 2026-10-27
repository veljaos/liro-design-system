import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  KeyRound,
  Lock,
  Plus,
  UserRound,
  Users,
} from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
} from '../primitives/dialog'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { Button, IconButton } from './button'
import { SwitchField } from './checkbox-field'
import { ComboboxField, type ComboboxOption } from './combobox-field'
import { ConfirmDialog } from './confirm-dialog'
import { DateField } from './date-field'
import { DialogHeading, dialogHeaderClass } from './dialog'
import { expiresTooSoon } from './file-browser-logic'
import { PasswordField } from './password-field'
import { SelectField } from './select-field'
import { usePhone } from './use-phone'

/*
 * ShareDialog (BUILD-PLAN P5.43): who may open a file or a folder, and a link for anyone else.
 * Every person, role, portal, access level and rule is the application's; the dialog shows them
 * and reports what the user asks.
 * - The title "Share" with the item bold under it (D22), then three parts (P5.93 item 21, the
 *   owner's fourth review: the familiar pattern of the big file services):
 *   1. **Add people or roles**: one search among the application's people, roles and client
 *      portals (ComboboxField, searched by name), the access level ("View", "Edit": the
 *      application's levels) and **Invite**. `addUnavailable` replaces them with the reason.
 *   2. **People with access**: a row per person, role or portal — a neutral icon by kind, the
 *      name, the application's detail and where the access comes from ("From the folder
 *      Contracts"); the owner says "Owner"; a fixed access shows its level and why it cannot
 *      change; any other has an access menu — its level as the button ("Editor, access for
 *      <name>"), the levels as a radio group, then "Remove access" (reversible: add again; it
 *      does not ask).
 *   3. **General access**: Restricted or Anyone with the link, with what each means in words.
 *      Choosing "Anyone with the link" creates the link (`onCreateLink`); going back to
 *      Restricted turns it off after one confirmation, because it reaches the people who have
 *      the link (`onRevokeLink`). With a link: its address in a box with a Copy icon button
 *      beside it and an inline "Copied", then "Expires" (a DateField; a day not after today is an
 *      error, never sent) and "Password" (a switch; turning it on asks for the password, used
 *      once and not kept). `linkUnavailable` says why a link cannot be made ("Employee files are
 *      never shared by link.") and keeps it Restricted.
 * - Phones: a full-screen sheet (`layout`, D19).
 * - "Done" closes it: every change is reported as it is made (`onAdd`, `onLevelChange`,
 *   `onRevoke`, `onCreateLink`, `onLinkChange`, `onRevokeLink`); saving is the application's.
 */

/** Who can be given access: a person, a role, or a client's portal. */
export type ShareKind = 'person' | 'role' | 'portal'

/** Someone or something the application offers to share with. */
export interface ShareCandidate {
  id: string
  /** Its name, with what tells it apart ("Snežana Jelić, Knjigovodstvo Jelić"). */
  label: string
}

/** A level of access, in the application's words ("View", "Edit"). */
export interface ShareLevel {
  value: string
  label: string
}

/** One who has access now. */
export interface ShareAccess {
  id: string
  name: string
  kind: ShareKind
  /** A second line from the application (an e-mail, the members of a role). */
  detail?: string
  /** The level's value (one of `levels`). */
  level: string
  /** The owner: "Owner" in place of a level. */
  owner?: boolean
  /** Where the access comes from, in the application's words ("From the folder Contracts"). */
  inherited?: string
  /** The access cannot be changed here, and why. */
  fixedReason?: string
}

/** The external link, as the application keeps it. */
export interface ShareLinkState {
  url: string
  /** The last day it opens (YYYY-MM-DD), or null: it does not expire. */
  expires: string | null
  /** It asks for a password. */
  password: boolean
}

export interface ShareDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The item shared, bold under the title. */
  subject: ReactNode
  /** Default `messages['sharing.title']`. */
  title?: string
  /** A line under the title from the application ("Milica Petrović sees this folder in …"). */
  description?: ReactNode
  /** The access levels, from the application. */
  levels: readonly ShareLevel[]
  /** Who can be added (searched locally by name). */
  candidates: readonly ShareCandidate[]
  /** Adds a person, role or portal at a level. */
  onAdd?: (candidateId: string, level: string) => void
  /** Adding is not possible here, and why. */
  addUnavailable?: string
  /** Who has access now. */
  access: readonly ShareAccess[]
  onLevelChange?: (accessId: string, level: string) => void
  onRevoke?: (access: ShareAccess) => void
  /** The link, or null when there is none. */
  link?: ShareLinkState | null
  onCreateLink?: () => void
  /** A change of the link: its expiry, or its password (null removes it). */
  onLinkChange?: (change: { expires?: string | null; password?: string | null }) => void
  onRevokeLink?: () => void
  /** A link cannot be made, and why. */
  linkUnavailable?: string
  /** 'phone' shows a full-screen sheet; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

const KIND_ICONS = { person: UserRound, role: Users, portal: Globe } as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-2">
      <h3 id={id} className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {title}
      </h3>
      {children}
    </section>
  )
}

function Reason({ children }: { children: ReactNode }) {
  return <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{children}</p>
}

/** One person's access: the level as a menu button; its radio items, then Remove access. */
function AccessMenu({
  access,
  levels,
  onLevelChange,
  onRevoke,
}: {
  access: ShareAccess
  levels: readonly ShareLevel[]
  onLevelChange: ((accessId: string, level: string) => void) | undefined
  onRevoke: ((access: ShareAccess) => void) | undefined
}) {
  const { messages } = useLiro()
  const levelLabel = levels.find((each) => each.value === access.level)?.label ?? access.level
  return (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          aria-label={messages['sharing.levelMenu'](levelLabel, access.name)}
          className="shrink-0 gap-1 pe-2"
        >
          <span className={TEXT_DIRECTION}>{levelLabel}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </ButtonPrimitive>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onLevelChange !== undefined && (
          <DropdownMenuRadioGroup
            value={access.level}
            onValueChange={(value) => {
              onLevelChange(access.id, value)
            }}
          >
            {levels.map((level) => (
              <DropdownMenuRadioItem key={level.value} value={level.value} check>
                {level.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
        {onLevelChange !== undefined && onRevoke !== undefined && <DropdownMenuSeparator />}
        {onRevoke !== undefined && (
          <DropdownMenuItem
            className="text-status-danger-fg data-highlighted:bg-status-danger-bg"
            onSelect={() => {
              onRevoke(access)
            }}
          >
            <span className={TEXT_DIRECTION}>{messages['sharing.removeAccess']}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </MenuRoot>
  )
}

/** The link in a box, its Copy icon button beside it and an inline "Copied". */
function LinkBox({ url }: { url: string }) {
  const { messages } = useLiro()
  const [copied, setCopied] = useState<'copied' | 'failed' | null>(null)
  useEffect(() => {
    if (copied === null) return
    const timer = setTimeout(() => {
      setCopied(null)
    }, 4000)
    return () => {
      clearTimeout(timer)
    }
  }, [copied])
  const copy = () => {
    try {
      void navigator.clipboard.writeText(url).then(
        () => {
          setCopied('copied')
        },
        () => {
          setCopied('failed')
        },
      )
    } catch {
      setCopied('failed')
    }
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <p
        dir="ltr"
        aria-label={messages['sharing.linkAddress']}
        className="m-0 min-w-0 flex-1 basis-48 rounded-sm border border-solid border-default bg-surface-sunken px-3 py-2 font-mono text-xs break-all text-primary"
      >
        {url}
      </p>
      <IconButton family="neutral" icon={Copy} label={messages['share.copy']} onClick={copy} />
      {/* Inline, beside the button: what the copy did ("Copied"), gone after a few seconds. */}
      <span
        role="status"
        className={cn(
          'flex items-center gap-1 text-xs',
          copied === 'failed' ? 'text-status-danger-fg' : 'text-secondary',
        )}
      >
        {copied === 'copied' && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
        {copied !== null && (
          <span className={TEXT_DIRECTION}>
            {copied === 'copied' ? messages['sharing.copied'] : messages['share.copyFailed']}
          </span>
        )}
      </span>
    </div>
  )
}

/** Share a file or folder with people, roles or a portal, and by a link. */
export function ShareDialog(props: ShareDialogProps) {
  const { messages, today } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const descriptionId = useId()
  const [innerOpen, setInnerOpen] = useState(props.defaultOpen ?? false)
  const open = props.open ?? innerOpen
  const [candidate, setCandidate] = useState<ComboboxOption | null>(null)
  const [level, setLevel] = useState(props.levels[0]?.value ?? '')
  const [settingPassword, setSettingPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [revoking, setRevoking] = useState(false)
  const [expiresError, setExpiresError] = useState(false)
  const link = props.link ?? null
  const options: ComboboxOption[] = props.candidates.map((each) => ({
    value: each.id,
    label: each.label,
  }))
  const setOpen = (next: boolean) => {
    setInnerOpen(next)
    props.onOpenChange?.(next)
  }

  const add = (
    <Section title={messages['sharing.add']}>
      {props.addUnavailable !== undefined ? (
        <Reason>{props.addUnavailable}</Reason>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <ComboboxField
            label={messages['sharing.add']}
            hideLabel
            className="min-w-48 flex-1"
            options={options}
            value={candidate}
            onChange={setCandidate}
          />
          <SelectField
            label={messages['sharing.level']}
            hideLabel
            className="w-32"
            options={props.levels}
            value={level}
            onChange={setLevel}
          />
          <Button
            family="primary"
            icon={Plus}
            label={messages['sharing.addButton']}
            onClick={() => {
              if (candidate === null) return
              props.onAdd?.(candidate.value, level)
              setCandidate(null)
            }}
          />
        </div>
      )}
    </Section>
  )

  const who = (
    <Section title={messages['sharing.who']}>
      {props.access.length === 0 ? (
        <Reason>{messages['sharing.onlyYou']}</Reason>
      ) : (
        <ul aria-label={messages['sharing.who']} className="m-0 flex list-none flex-col p-0">
          {props.access.map((access) => {
            const Icon = KIND_ICONS[access.kind]
            const levelLabel =
              props.levels.find((each) => each.value === access.level)?.label ?? access.level
            const editable =
              access.owner !== true &&
              access.fixedReason === undefined &&
              (props.onLevelChange !== undefined || props.onRevoke !== undefined)
            return (
              <li
                key={access.id}
                className="flex min-w-0 items-center gap-3 border-0 border-b border-solid border-subtle py-2 last:border-b-0"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-secondary">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
                    {access.name}
                  </span>
                  {access.detail !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {access.detail}
                    </span>
                  )}
                  {access.inherited !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {access.inherited}
                    </span>
                  )}
                  {access.fixedReason !== undefined && (
                    <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                      {access.fixedReason}
                    </span>
                  )}
                </span>
                {access.owner === true ? (
                  <span className={cn('shrink-0 text-sm text-secondary', TEXT_DIRECTION)}>
                    {messages['sharing.owner']}
                  </span>
                ) : editable ? (
                  <AccessMenu
                    access={access}
                    levels={props.levels}
                    onLevelChange={props.onLevelChange}
                    onRevoke={props.onRevoke}
                  />
                ) : (
                  <span className={cn('shrink-0 text-sm text-secondary', TEXT_DIRECTION)}>
                    {levelLabel}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )

  const passwordOn = link?.password === true || settingPassword
  const anyone = link !== null
  const generalChangeable =
    props.linkUnavailable === undefined &&
    (anyone ? props.onRevokeLink !== undefined : props.onCreateLink !== undefined)
  const general = (
    <Section title={messages['sharing.general']}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-secondary">
          {anyone ? (
            <Globe aria-hidden="true" className="size-4" />
          ) : (
            <Lock aria-hidden="true" className="size-4" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <SelectField
            label={messages['sharing.general']}
            hideLabel
            className="max-w-64"
            readOnly={!generalChangeable}
            options={[
              { value: 'restricted', label: messages['sharing.restricted'] },
              { value: 'anyone', label: messages['sharing.anyone'] },
            ]}
            value={anyone ? 'anyone' : 'restricted'}
            onChange={(value) => {
              if (value === 'anyone' && !anyone) props.onCreateLink?.()
              if (value === 'restricted' && anyone) setRevoking(true)
            }}
          />
          <Reason>
            {props.linkUnavailable ??
              (anyone ? messages['sharing.anyoneHint'] : messages['sharing.restrictedHint'])}
          </Reason>
        </div>
      </div>
      {link !== null && props.linkUnavailable === undefined && (
        <div className="flex min-w-0 flex-col gap-3 ps-11">
          <LinkBox url={link.url} />
          <div className={cn('grid min-w-0 gap-3', phone ? 'grid-cols-1' : 'grid-cols-2')}>
            <DateField
              label={messages['sharing.expires']}
              {...(link.expires === null ? { description: messages['sharing.never'] } : {})}
              value={link.expires}
              {...(expiresError ? { error: messages['sharing.expiresTooSoon'] } : {})}
              onChange={(value) => {
                const tooSoon = expiresTooSoon(value, today)
                setExpiresError(tooSoon)
                if (!tooSoon) props.onLinkChange?.({ expires: value })
              }}
            />
            <SwitchField
              label={messages['sharing.password']}
              {...(link.password ? { description: messages['sharing.passwordSet'] } : {})}
              checked={passwordOn}
              onChange={(checked) => {
                if (checked) {
                  setSettingPassword(true)
                  return
                }
                setSettingPassword(false)
                setPassword('')
                if (link.password) props.onLinkChange?.({ password: null })
              }}
            />
          </div>
          {settingPassword && !link.password && (
            <div className="flex flex-wrap items-end gap-2">
              <PasswordField
                label={messages['sharing.password']}
                autoComplete="new-password"
                className="min-w-48 flex-1"
                value={password}
                onChange={setPassword}
              />
              <Button
                family="neutral"
                icon={KeyRound}
                label={messages['sharing.setPassword']}
                onClick={() => {
                  if (password === '') return
                  props.onLinkChange?.({ password })
                  setPassword('')
                  setSettingPassword(false)
                }}
              />
            </div>
          )}
        </div>
      )}
    </Section>
  )

  const title = props.title ?? messages['sharing.title']
  const content = (
    <>
      <DialogHeader className={dialogHeaderClass(props.subject)}>
        <DialogTitle>
          <DialogHeading title={title} subject={props.subject} />
        </DialogTitle>
        <DialogCloseButton label={messages['dialog.close']} />
      </DialogHeader>
      <DialogBody className={cn(phone && 'flex-1')}>
        {props.description !== undefined && (
          <DialogDescription id={descriptionId}>{props.description}</DialogDescription>
        )}
        <div className="flex flex-col gap-5">
          {add}
          {who}
          {general}
        </div>
        <DialogFooter>
          <Button
            intent="confirm"
            label={messages['sharing.done']}
            onClick={() => {
              setOpen(false)
            }}
          />
        </DialogFooter>
      </DialogBody>
    </>
  )
  const describedBy = props.description === undefined ? undefined : descriptionId

  return (
    <>
      {phone ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="full"
            aria-describedby={describedBy}
            data-slot="share-dialog"
            className="pb-[env(safe-area-inset-bottom)]"
          >
            {content}
          </SheetContent>
        </Sheet>
      ) : (
        <DialogRoot open={open} onOpenChange={setOpen}>
          <DialogContent aria-describedby={describedBy} data-slot="share-dialog" className="w-150">
            {content}
          </DialogContent>
        </DialogRoot>
      )}
      <ConfirmDialog
        open={revoking}
        onOpenChange={setRevoking}
        family="caution"
        actionIcon={Lock}
        title={messages['sharing.revokeTitle']}
        subject={props.subject}
        message={messages['sharing.revokeMessage']}
        confirmLabel={messages['sharing.revokeLink']}
        onConfirm={() => {
          props.onRevokeLink?.()
          setRevoking(false)
        }}
      />
    </>
  )
}
