import { AlertTriangle, Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { FieldLabelsHidden } from '../components/field'
import { Tabs } from '../components/navigation'
import { usePhone } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader } from './page-header'

/*
 * SettingsPage (P4.6, the owner's decision, docs/decisions.md "Settings page"): sections of
 * setting rows that save at once.
 * - Sections are cards (raised, border.default, radius lg) with a title (sm semibold
 *   text.secondary, padding md) — no description, no icon.
 * - Each row: the setting's name (13px semibold) and its description (xs text.secondary) at the
 *   start, the control (a switch, a select, a button) at the end; a 1px border.subtle line between
 *   rows; padding sm by md. On phones the control stands under the description. The row names its
 *   control once: a field's own label inside the control is for assistive technology only (P4.9;
 *   FieldLabelsHidden), so the name never shows twice.
 * - No Save button: a setting saves as soon as it changes (the application's work). After a
 *   successful save the row shows "Saved" with a 14px check in status.success.fg
 *   (`role="status"`); an error appears in the row in status.danger.fg with its icon
 *   (`role="alert"`, announced at once).
 * - Several groups of sections: tabs at the top, never a side navigation.
 * - The column (at most 960px) stands at the page's start, aligned with the header, and so do its
 *   tabs (P4.7, owner: business screens are start-aligned).
 */

/** One setting. */
export interface SettingRow {
  key: string
  /** The setting's name ("Send invoices to SEF automatically"). */
  label: string
  description?: string
  /**
   * The control: a SwitchField, a SelectField, a Button … Give a field its label (the row's name);
   * the row keeps it for assistive technology only, so the name is not written twice.
   */
  control: ReactNode
  /** 'saved' after a successful save; 'error' with `error` after a failed one. */
  state?: 'saved' | 'error'
  /** Why the save failed, from the application. */
  error?: string
}

export interface SettingsSection {
  key: string
  title: string
  rows: readonly SettingRow[]
}

/** A group of sections shown as one tab. */
export interface SettingsGroup {
  key: string
  label: string
  sections: readonly SettingsSection[]
}

export interface SettingsPageProps {
  title: string
  subtitle?: ReactNode
  /** One group: its sections are shown directly. Several: tabs at the top. */
  groups: readonly SettingsGroup[]
  /** The current tab (controlled), and its change. */
  group?: string
  onGroupChange?: (key: string) => void
  layout?: 'desktop' | 'phone'
  className?: string
}

function Row({ row, phone }: { row: SettingRow; phone: boolean }) {
  const { messages } = useLiro()
  return (
    <li
      data-slot="setting-row"
      className={cn(
        'flex gap-x-6 gap-y-2 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0',
        phone ? 'flex-col' : 'items-center justify-between',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {row.label}
        </span>
        {row.description !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{row.description}</span>
        )}
        {row.state === 'error' && row.error !== undefined && (
          <span
            role="alert"
            className="mt-1 flex items-center gap-1.5 text-xs text-status-danger-fg"
          >
            <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
            <span className={TEXT_DIRECTION}>{row.error}</span>
          </span>
        )}
      </div>
      <div className={cn('flex shrink-0 items-center', !phone && 'justify-end')}>
        {/* Always present (a live region), and without room of its own while empty. */}
        <span role="status" className="flex min-w-0 items-center">
          {row.state === 'saved' && (
            <span className="me-3 flex items-center gap-1 text-xs text-status-success-fg">
              <Check aria-hidden="true" className="size-3.5 shrink-0" />
              <span className={TEXT_DIRECTION}>{messages['settings.saved']}</span>
            </span>
          )}
        </span>
        <FieldLabelsHidden.Provider value={true}>{row.control}</FieldLabelsHidden.Provider>
      </div>
    </li>
  )
}

function Section({ section, phone }: { section: SettingsSection; phone: boolean }) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="overflow-hidden rounded-lg border border-solid border-default bg-surface-raised font-sans"
    >
      <h2
        id={titleId}
        className={cn('m-0 px-4 pt-4 pb-2 text-sm font-semibold text-secondary', TEXT_DIRECTION)}
      >
        {section.title}
      </h2>
      <ul className="m-0 list-none p-0">
        {section.rows.map((row) => (
          <Row key={row.key} row={row} phone={phone} />
        ))}
      </ul>
    </section>
  )
}

/** Settings in sections of rows that save at once; several groups as tabs. */
export function SettingsPage(props: SettingsPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const sections = (group: SettingsGroup) => (
    <div className="flex flex-col gap-4 pt-4">
      {group.sections.map((section) => (
        <Section key={section.key} section={section} phone={phone} />
      ))}
    </div>
  )
  const only = props.groups.length === 1 ? props.groups[0] : undefined
  return (
    <div
      data-slot="settings-page"
      className={cn(
        'box-border flex w-full max-w-240 flex-col',
        phone ? 'gap-2 p-4' : 'gap-4 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
      />
      {only !== undefined ? (
        sections(only)
      ) : (
        <Tabs
          label={props.title}
          items={props.groups.map((group) => ({
            value: group.key,
            label: group.label,
            content: sections(group),
          }))}
          {...(props.group === undefined ? {} : { value: props.group })}
          {...(props.onGroupChange === undefined ? {} : { onValueChange: props.onGroupChange })}
        />
      )}
    </div>
  )
}
