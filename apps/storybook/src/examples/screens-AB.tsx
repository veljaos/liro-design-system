import { History, RotateCcw, Send } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Button,
  ConfirmDialog,
  DataTable,
  Dialog,
  Drawer,
  EmailPreview,
  EmptyState,
  instantText,
  ListPage,
  notice,
  PageHeader,
  SectionCard,
  SelectField,
  Tabs,
  TextField,
  Toaster,
  useLiro,
  type DataTableColumn,
  type EmailPreviewScheme,
  type EmailPreviewWidth,
} from '@veljaos/ui'
import { RichText, RichTextField } from '../../../../packages/ui/src/rich-text'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  AB_ROUTES,
  AB_TODAY,
  findTemplate,
  INVOICE_VERSIONS,
  LANGS,
  MERGE_FIELDS,
  SAMPLE,
  SAMPLES,
  SENDER,
  TEMPLATES,
  TEST_ADDRESS,
  type Lang,
  type Template,
  type Variant,
} from './data-AB'

/*
 * Group AB (P5.38): Kvadrat Gradnja d.o.o.'s e-mail and notification templates, kept by its
 * administrator. The list (ListPage), then one template: its language variants as tabs (English,
 * Serbian Latin, Serbian Cyrillic), the subject and the body on RichTextField with merge fields
 * as pills, the preview with sample data (EmailPreview: desktop or phone width, light or dark
 * mail client), "Send test", the versions. The e-mail is as simple as the printouts (D27).
 */

const CRUMBS_BASE = [{ label: 'Company settings' }]

function TemplatesShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={AB_TODAY}>
      <Shell phone={phone} crumbs={[...CRUMBS_BASE, ...crumbs]}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function langLabel(code: Lang): string {
  return LANGS.find((each) => each.code === code)?.label ?? code
}

/** The languages a template has, in the order of LANGS. */
function LanguagesText({ template }: { template: Template }) {
  return (
    <span className="bidi-content">
      {LANGS.filter((each) => template.variants[each.code] !== undefined)
        .map((each) => each.code)
        .join(' · ')}
    </span>
  )
}

// ── 1. The list ──────────────────────────────────────────────────────────────────────────────

const VIEWS = [
  { id: 'all', label: 'All', count: TEMPLATES.length },
  {
    id: 'active',
    label: 'Active',
    count: TEMPLATES.filter((each) => each.state === 'Active').length,
  },
  {
    id: 'draft',
    label: 'Drafts',
    count: TEMPLATES.filter((each) => each.state === 'Draft').length,
  },
]

function TemplateLink({ template }: { template: Template }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link
      href={`#${AB_ROUTES.template(template.id)}`}
      className="bidi-content font-medium text-link no-underline visited:text-link hover:underline"
    >
      {template.name}
    </Link>
  )
}

function Changed({ template }: { template: Template }) {
  const { format } = useLiro()
  return (
    <span className="bidi-content">{`${format.date(template.changed)} · ${template.changedBy}`}</span>
  )
}

const COLUMNS: DataTableColumn<Template>[] = [
  { id: 'name', header: 'Template', cell: (each) => <TemplateLink template={each} /> },
  { id: 'sent', header: 'Sent when', cell: (each) => each.sentWhen },
  { id: 'languages', header: 'Languages', cell: (each) => <LanguagesText template={each} /> },
  { id: 'changed', header: 'Last changed', cell: (each) => <Changed template={each} /> },
  { id: 'state', header: 'State', cell: (each) => statusBadge(each.state) },
]

export function TemplateList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState('all')
  const rows =
    view === 'active'
      ? TEMPLATES.filter((each) => each.state === 'Active')
      : view === 'draft'
        ? TEMPLATES.filter((each) => each.state === 'Draft')
        : TEMPLATES
  return (
    <TemplatesShell phone={phone} crumbs={[{ label: 'E-mail templates' }]}>
      <Frame phone={phone}>
        <ListPage
          layout={phone ? 'phone' : 'desktop'}
          title="E-mail templates"
          titleHidden={false}
          actions={<Button intent="create" label="New template" />}
          views={VIEWS}
          view={view}
          onViewChange={setView}
        >
          <DataTable
            label="E-mail templates"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={COLUMNS}
            rows={rows}
            getRowId={(each) => each.id}
            getRowLabel={(each) => each.name}
            count={rows.length}
            onRowClick={(each) => {
              navigate(AB_ROUTES.template(each.id))
            }}
            mobile={{
              title: (each) => each.name,
              subtitle: (each) => each.sentWhen,
              badge: (each) => statusBadge(each.state),
              details: ['languages', 'changed'],
            }}
          />
        </ListPage>
      </Frame>
    </TemplatesShell>
  )
}

// ── 2. One template ──────────────────────────────────────────────────────────────────────────

/** The sender's logo in the e-mail: the company's name in its letters, black. */
function SenderLogo() {
  return <span className="font-brand text-md font-bold text-primary">Kvadrat Gradnja</span>
}

/** One language's subject, body and preview. */
function VariantEditor({
  phone,
  lang,
  variant,
  onChange,
  width,
  scheme,
}: {
  phone: boolean
  lang: Lang
  variant: Variant
  onChange: (variant: Variant) => void
  width: EmailPreviewWidth
  scheme: EmailPreviewScheme
}) {
  const [previewWidth, setPreviewWidth] = useState(width)
  const [previewScheme, setPreviewScheme] = useState(scheme)
  return (
    <div className={phone ? 'flex flex-col gap-4' : 'grid grid-cols-2 items-start gap-6'}>
      <SectionCard title="Message" headingLevel={2}>
        <div className="flex flex-col gap-4">
          <TextField
            label="Subject"
            value={variant.subject}
            description="A field is written {{field}}, for example {{invoice.number}}."
            onChange={(subject) => {
              onChange({ ...variant, subject })
            }}
          />
          <RichTextField
            label="Body"
            defaultValue={variant.body}
            mergeFields={MERGE_FIELDS}
            minRows={8}
            description="“{{” or the toolbar’s Field menu inserts a field."
            onChange={(value) => {
              onChange({ ...variant, body: value.json })
            }}
          />
        </div>
      </SectionCard>
      <SectionCard
        title="Preview"
        description={`With sample data: ${SAMPLE.customer}, invoice ${SAMPLE.invoice}`}
        headingLevel={2}
      >
        <EmailPreview
          layout={phone ? 'phone' : 'desktop'}
          lang={lang}
          from={`${SENDER.name} <${SENDER.address}>`}
          to={`${SAMPLE.customer} <${SAMPLE.email}>`}
          subject={variant.subject}
          logo={<SenderLogo />}
          footer={SENDER.footer}
          width={previewWidth}
          onWidthChange={setPreviewWidth}
          scheme={previewScheme}
          onSchemeChange={setPreviewScheme}
        >
          <RichText
            value={variant.body}
            mergeFields={MERGE_FIELDS}
            className="flex flex-col gap-4 text-sm"
          />
        </EmailPreview>
      </SectionCard>
    </div>
  )
}

function VersionsList({ onRestore }: { onRestore: (version: number) => void }) {
  const { format } = useLiro()
  return (
    <ol aria-label="Versions" className="m-0 flex list-none flex-col p-0">
      {INVOICE_VERSIONS.map((each, index) => (
        <li
          key={each.version}
          className="flex flex-col gap-2 border-0 border-b border-solid border-subtle py-3 last:border-b-0"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="bidi-content text-sm font-semibold text-primary">{`Version ${String(each.version)}`}</span>
            {index === 0 && <span className="bidi-content text-xs text-secondary">Current</span>}
          </div>
          <p className="bidi-content m-0 text-sm text-primary">{each.note}</p>
          <p className="bidi-content m-0 text-xs text-tertiary">
            {`${instantText(format, each.at)} · ${each.by}`}
          </p>
          {index > 0 && (
            <div className="flex">
              <Button
                family="neutral"
                icon={RotateCcw}
                label={`Restore version ${String(each.version)}`}
                onClick={() => {
                  onRestore(each.version)
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

export function TemplateEditor({
  phone,
  id,
  lang: startLang = 'en',
  open,
  width,
  scheme = 'light',
}: {
  phone: boolean
  id: string
  lang?: Lang
  /** A part of the page open at first: the versions or the test dialog. */
  open?: 'versions' | 'test'
  width?: EmailPreviewWidth
  scheme?: EmailPreviewScheme
}) {
  const { format } = useLiro()
  const template = findTemplate(id)
  const [variants, setVariants] = useExampleState(`ab-${id}`, () => template?.variants ?? {})
  const [lang, setLang] = useState<Lang>(startLang)
  const [versionsOpen, setVersionsOpen] = useState(open === 'versions')
  const [testOpen, setTestOpen] = useState(open === 'test')
  const [testAddress, setTestAddress] = useState(TEST_ADDRESS)
  const [sample, setSample] = useState('toplana')
  const [restoring, setRestoring] = useState<number | null>(null)
  if (template === undefined) {
    return (
      <TemplatesShell phone={phone} crumbs={[{ label: 'E-mail templates' }]}>
        <EmptyState title="This template does not exist" />
      </TemplatesShell>
    )
  }
  const preview = width ?? (phone ? 'phone' : 'desktop')
  return (
    <TemplatesShell
      phone={phone}
      crumbs={[{ label: 'E-mail templates', href: `#${AB_ROUTES.list}` }, { label: template.name }]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title={template.name}
          back={{ label: 'E-mail templates', href: `#${AB_ROUTES.list}` }}
          status={statusBadge(template.state)}
          subtitle={`${template.sentWhen} · Version ${String(template.version)}, changed ${format.date(template.changed)} by ${template.changedBy}`}
          actions={
            <ActionGroup
              actions={[
                {
                  key: 'versions',
                  label: 'Versions',
                  family: 'neutral',
                  icon: History,
                  onClick: () => {
                    setVersionsOpen(true)
                  },
                },
                {
                  key: 'test',
                  label: 'Send test',
                  family: 'neutral',
                  icon: Send,
                  onClick: () => {
                    setTestOpen(true)
                  },
                },
                {
                  key: 'save',
                  label: 'Save',
                  intent: 'save',
                  onClick: () => {
                    notice.success(
                      `${template.name} saved as version ${String(template.version + 1)}`,
                    )
                  },
                },
              ]}
            />
          }
        />
        <Tabs
          label="Language"
          value={lang}
          onValueChange={(value) => {
            const next = LANGS.find((each) => each.code === value)
            if (next !== undefined) setLang(next.code)
          }}
          items={LANGS.map((each) => {
            const variant = variants[each.code]
            return {
              value: each.code,
              label: <span lang={each.code}>{each.label}</span>,
              content:
                variant === undefined ? (
                  <SectionCard headingLevel={2}>
                    <EmptyState
                      title={`No ${each.label} version yet`}
                      description="Customers who chose this language get the English e-mail until you add it."
                      action={{
                        label: 'Start from English',
                        onClick: () => {
                          const english = variants.en
                          if (english !== undefined) {
                            setVariants({ ...variants, [each.code]: english })
                          }
                        },
                      }}
                    />
                  </SectionCard>
                ) : (
                  <VariantEditor
                    phone={phone}
                    lang={each.code}
                    variant={variant}
                    width={preview}
                    scheme={scheme}
                    onChange={(next) => {
                      setVariants({ ...variants, [each.code]: next })
                    }}
                  />
                ),
            }
          })}
        />
      </Frame>
      {/* At page level, outside the Tabs (D16). */}
      <Drawer
        side="end"
        title="Versions"
        subject={template.name}
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
      >
        <VersionsList onRestore={setRestoring} />
      </Drawer>
      <ConfirmDialog
        open={restoring !== null}
        onOpenChange={(next) => {
          if (!next) setRestoring(null)
        }}
        family="neutral"
        actionIcon={RotateCcw}
        title={`Restore version ${String(restoring ?? 0)}`}
        subject={template.name}
        message={`Its subject and body in every language become version ${String(template.version + 1)}. The current version stays in the list.`}
        confirmLabel="Restore"
        onConfirm={() => {
          notice.success(
            `Version ${String(restoring ?? 0)} restored as version ${String(template.version + 1)}`,
          )
          setRestoring(null)
          setVersionsOpen(false)
        }}
      />
      <Dialog
        title="Send test"
        subject={`${template.name} · ${langLabel(lang)}`}
        open={testOpen}
        onOpenChange={setTestOpen}
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setTestOpen(false)
              }}
            />
            <Button
              family="primary"
              icon={Send}
              emphasis="primary"
              label="Send test"
              onClick={() => {
                notice.success(`Test e-mail sent to ${testAddress}`)
                setTestOpen(false)
              }}
            />
          </>
        }
      >
        <TextField
          label="Send to"
          type="email"
          autoComplete="email"
          value={testAddress}
          onChange={setTestAddress}
        />
        <SelectField label="Sample data" options={SAMPLES} value={sample} onChange={setSample} />
        <p className="bidi-content m-0 text-sm text-secondary">
          The test uses the text as it is now, saved or not, and says “Test” in its subject.
        </p>
      </Dialog>
    </TemplatesShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AB_ROUTES: ExampleRoute[] = [
  { path: AB_ROUTES.list, render: (phone) => <TemplateList phone={phone} /> },
  ...TEMPLATES.map((template) => ({
    path: AB_ROUTES.template(template.id),
    render: (phone: boolean) => <TemplateEditor phone={phone} id={template.id} />,
  })),
  {
    path: AB_ROUTES.versions,
    render: (phone) => <TemplateEditor phone={phone} id="invoice" open="versions" />,
  },
  {
    path: AB_ROUTES.sendTest,
    render: (phone) => <TemplateEditor phone={phone} id="invoice" open="test" />,
  },
  {
    path: AB_ROUTES.darkPhone,
    render: (phone) => <TemplateEditor phone={phone} id="invoice" width="phone" scheme="dark" />,
  },
  {
    path: AB_ROUTES.cyrillic,
    render: (phone) => <TemplateEditor phone={phone} id="invoice" lang="sr-Cyrl" />,
  },
  {
    path: AB_ROUTES.missing,
    render: (phone) => <TemplateEditor phone={phone} id="welcome" lang="sr-Cyrl" />,
  },
]
