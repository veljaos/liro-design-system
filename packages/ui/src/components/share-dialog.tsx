import { Globe, KeyRound, Link2, Plus, Trash2, UserRound, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button, CompactIconButton } from './button'
import { SwitchField } from './checkbox-field'
import { ComboboxField, type ComboboxOption } from './combobox-field'
import { ConfirmDialog } from './confirm-dialog'
import { DateField } from './date-field'
import { Dialog } from './dialog'
import { expiresTooSoon } from './file-browser-logic'
import { PasswordField } from './password-field'
import { SelectField } from './select-field'
import { ShareLinks } from './share-links'

/*
 * ShareDialog (BUILD-PLAN P5.43): who may open a file or a folder, and a link for anyone else.
 * Every person, role, portal, access level and rule is the application's; the dialog shows them
 * and reports what the user asks.
 * - The title "Share" with the item bold under it (D22), then three parts:
 *   1. **Add**: one search among the application's people, roles and client portals
 *      (ComboboxField, searched by name), the access level ("View", "Edit": the
 *      application's levels) and Add. `addUnavailable` replaces them with the reason.
 *   2. **Who has access**: a row per person, role or portal — a neutral icon by kind (a person, a
 *      role, a portal), the name, the application's detail and where the access comes from ("From
 *      the folder Contracts"); the owner says "Owner"; a fixed access shows its level and why it
 *      cannot change; any other has its level (a SelectField named "Access for <name>") and a
 *      28px "Remove access: <name>". Removing is reversible (add again): it does not ask.
 *   3. **Link**: none yet — what a link does and "Create link"; a link — its address with Copy
 *      link (ShareLinks), "Expires" (a DateField; a day not after today is an error, never sent),
 *      "Protect with a password" (a switch; turning it on asks for the password, which is used
 *      once and not kept), and "Revoke link" (destructive, asks first). `linkUnavailable` says why
 *      a link cannot be made ("Employee files are never shared by link.").
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
}

const KIND_ICONS = { person: UserRound, role: Users, portal: Globe } as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h3 className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>{title}</h3>
      {children}
    </section>
  )
}

function Reason({ children }: { children: ReactNode }) {
  return <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{children}</p>
}

/** Share a file or folder with people, roles or a portal, and by a link. */
export function ShareDialog(props: ShareDialogProps) {
  const { messages, today } = useLiro()
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
              props.onLevelChange !== undefined
            return (
              <li
                key={access.id}
                className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-0 border-b border-solid border-subtle py-2 last:border-b-0"
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
                    <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>
                      {access.fixedReason}
                    </span>
                  )}
                </span>
                {access.owner === true ? (
                  <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>
                    {messages['sharing.owner']}
                  </span>
                ) : editable ? (
                  <span className="flex items-center gap-1">
                    <SelectField
                      label={messages['sharing.levelOf'](access.name)}
                      hideLabel
                      className="w-28"
                      options={props.levels}
                      value={access.level}
                      onChange={(value) => props.onLevelChange?.(access.id, value)}
                    />
                    {props.onRevoke !== undefined && (
                      <CompactIconButton
                        family="destructive"
                        icon={X}
                        label={messages['sharing.remove'](access.name)}
                        onClick={() => props.onRevoke?.(access)}
                      />
                    )}
                  </span>
                ) : (
                  <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{levelLabel}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )

  const passwordOn = link?.password === true || settingPassword
  const linkPart = (
    <Section title={messages['sharing.link']}>
      {props.linkUnavailable !== undefined ? (
        <Reason>{props.linkUnavailable}</Reason>
      ) : link === null ? (
        <div className="flex flex-col items-start gap-2">
          <Reason>{messages['sharing.linkNone']}</Reason>
          {props.onCreateLink !== undefined && (
            <Button
              family="neutral"
              icon={Link2}
              label={messages['sharing.createLink']}
              onClick={props.onCreateLink}
            />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p dir="ltr" className="m-0 font-mono text-xs break-all text-primary">
            {link.url}
          </p>
          <ShareLinks url={link.url} label={messages['sharing.linkAddress']} />
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
          {props.onRevokeLink !== undefined && (
            <div>
              <Button
                family="destructive"
                icon={Trash2}
                label={messages['sharing.revokeLink']}
                onClick={() => {
                  setRevoking(true)
                }}
              />
            </div>
          )}
        </div>
      )}
    </Section>
  )

  return (
    <>
      <Dialog
        {...(props.open === undefined ? {} : { open: props.open })}
        {...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen })}
        {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
        title={props.title ?? messages['sharing.title']}
        subject={props.subject}
        size="wide"
        {...(props.description === undefined ? {} : { description: props.description })}
        actions={
          <Button
            intent="confirm"
            label={messages['sharing.done']}
            onClick={() => props.onOpenChange?.(false)}
          />
        }
      >
        <div className="flex flex-col gap-5">
          {add}
          {who}
          {linkPart}
        </div>
      </Dialog>
      <ConfirmDialog
        open={revoking}
        onOpenChange={setRevoking}
        family="destructive"
        actionIcon={Trash2}
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
