import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Direction } from 'radix-ui'
import { describe, expect, it } from 'vitest'
import { LiroProvider, localToday, useLiro } from './liro-provider'
import type { LiroMessages } from './messages'
import { messagesEn } from './messages.en'

function render(node: ReactNode): string {
  return renderToStaticMarkup(node)
}

function Messages() {
  const { messages, format } = useLiro()
  return (
    <output>
      {[
        messages['table.next'],
        messages['table.count'](1234, format.number('1234'), true),
        messages['action.unavailable']('closed period'),
      ].join('|')}
    </output>
  )
}

function Dates() {
  const { today, weekStartsOn } = useLiro()
  return <output>{`${today}|${String(weekStartsOn)}`}</output>
}

function Link() {
  const { linkComponent: LinkComponent } = useLiro()
  return <LinkComponent href="/things/1">Thing</LinkComponent>
}

function RadixDirection() {
  return <output>{Direction.useDirection()}</output>
}

describe('messages', () => {
  it('has English defaults for every key', () => {
    expect(messagesEn['table.previous']).toBe('Previous')
    expect(messagesEn['table.count'](1234, '1,234', true)).toBe('1,234 rows')
    expect(messagesEn['table.count'](1, '1', true)).toBe('1 row')
    expect(messagesEn['table.count'](10000, '10,000', false)).toBe('More than 10,000 rows')
    expect(messagesEn['action.unavailable']('closed period')).toBe('Unavailable: closed period')
  })

  it('makes a missing key a compile error', () => {
    // @ts-expect-error -- every key of LiroMessages is required; this object lacks all but one.
    const incomplete: LiroMessages = { 'table.next': 'Next' }
    expect(Object.keys(incomplete)).toHaveLength(1)
    expect(Object.keys(messagesEn).sort()).toEqual([
      'action.more',
      'action.moreOptions',
      'action.unavailable',
      'agent.mark',
      'agent.named',
      'agent.question',
      'alert.close',
      'attachment.download',
      'attachment.failed',
      'attachment.none',
      'attachment.quarantined',
      'attachment.remove',
      'attachment.retry',
      'attachment.retryLabel',
      'attachment.scanning',
      'attachment.uploading',
      'balance.balanced',
      'balance.credit',
      'balance.debit',
      'balance.difference',
      'balance.incomplete',
      'balance.label',
      'balance.unbalanced',
      'breadcrumbs.label',
      'bulk.clear',
      'bulk.confirmTitle',
      'bulk.selectAll',
      'bulk.selected',
      'bulkEdit.apply',
      'bulkEdit.confirm',
      'bulkEdit.confirmTitle',
      'bulkEdit.nothing',
      'bulkEdit.summary',
      'bulkEdit.title',
      'bulkEdit.unchanged',
      'calendar.navigation',
      'calendar.nextMonth',
      'calendar.nextYear',
      'calendar.previousMonth',
      'calendar.previousYear',
      'chart.billions',
      'chart.error',
      'chart.loading',
      'chart.millions',
      'chart.noData',
      'chart.retry',
      'chart.showChart',
      'chart.showTable',
      'chart.thousands',
      'code.box',
      'columns.button',
      'columns.moveDown',
      'columns.moveUp',
      'columns.title',
      'command.actions',
      'command.navigation',
      'command.noResults',
      'command.placeholder',
      'command.title',
      'confirm.deleteLabel',
      'confirm.deleteMessage',
      'confirm.deleteTitle',
      'confirm.reason',
      'confirm.reasonDetails',
      'confirm.typeToConfirm',
      'connection.failed',
      'connection.local',
      'connection.offline',
      'connection.online',
      'connection.retry',
      'connection.sending',
      'connection.sent',
      'correction.change',
      'correction.new',
      'correction.original',
      'day.today',
      'day.yesterday',
      'dialog.cancel',
      'dialog.close',
      'document.cancelReason',
      'document.cancelledBy',
      'document.cancelledTitle',
      'document.currency',
      'document.exchangeRate',
      'document.hidePanels',
      'document.panels',
      'document.rate',
      'document.rateDate',
      'document.rateLine',
      'document.showPanels',
      'due.inDays',
      'due.overdue',
      'due.settled',
      'due.today',
      'duplicate.createAnyway',
      'duplicate.existing',
      'duplicate.openExisting',
      'duplicate.reasonTitle',
      'duplicate.title',
      'empty.caseId',
      'empty.emptyDescription',
      'empty.emptyTitle',
      'empty.errorDescription',
      'empty.errorTitle',
      'empty.noResultsDescription',
      'empty.noResultsTitle',
      'environment.prefix',
      'field.clear',
      'field.invalidDate',
      'field.invalidNumber',
      'field.invalidRange',
      'field.loading',
      'field.noResults',
      'field.openCalendar',
      'field.rangeEnd',
      'field.rangeStart',
      'field.readOnly',
      'field.remove',
      'field.required',
      'field.selectedCount',
      'file.choose',
      'file.drop',
      'file.maxSize',
      'file.rejectedCount',
      'file.rejectedSize',
      'file.rejectedType',
      'filter.all',
      'filter.ascending',
      'filter.clearAll',
      'filter.clearSearch',
      'filter.descending',
      'filter.filters',
      'filter.from',
      'filter.no',
      'filter.pill',
      'filter.rangeFrom',
      'filter.rangeLabel',
      'filter.rangeTo',
      'filter.remove',
      'filter.search',
      'filter.sort',
      'filter.to',
      'filter.yes',
      'form.hasErrors',
      'form.leave',
      'form.leaveMessage',
      'form.leaveTitle',
      'form.stay',
      'form.unsaved',
      'frame.error',
      'frame.loading',
      'frame.nextPage',
      'frame.page',
      'frame.previousPage',
      'frame.retry',
      'frame.timeout',
      'frame.toolbar',
      'frame.zoom',
      'frame.zoomIn',
      'frame.zoomOut',
      'grid.addDeduction',
      'grid.addDiscount',
      'grid.addHeading',
      'grid.addLine',
      'grid.addText',
      'grid.cell',
      'grid.cellMessage',
      'grid.deleteKey',
      'grid.deleteLine',
      'grid.enterKey',
      'grid.headingCell',
      'grid.insertLine',
      'grid.internal',
      'grid.modifierKey',
      'grid.removeLine',
      'grid.textCell',
      'history.after',
      'history.before',
      'history.emptyDescription',
      'history.emptyTitle',
      'history.integration',
      'history.onBehalfOf',
      'history.showMore',
      'history.system',
      'impersonation.ended',
      'impersonation.exit',
      'impersonation.minutesLeft',
      'impersonation.reason',
      'impersonation.region',
      'impersonation.viewingAs',
      'import.cancel',
      'import.column',
      'import.columnFor',
      'import.duplicates',
      'import.field',
      'import.fixOrSkip',
      'import.leaveMessage',
      'import.leaveTitle',
      'import.line',
      'import.missingRequired',
      'import.noProblems',
      'import.notImported',
      'import.problems',
      'import.problemsOnly',
      'import.progress',
      'import.ready',
      'import.run',
      'import.sample',
      'import.skipInvalid',
      'import.stepCheck',
      'import.stepColumns',
      'import.stepFile',
      'import.stepImport',
      'import.suggested',
      'import.unusedColumns',
      'import.withErrors',
      'import.withWarnings',
      'job.cancel',
      'job.cancelled',
      'job.cancelling',
      'job.failures',
      'job.finished',
      'job.progress',
      'kanban.cancelled',
      'kanban.cardMenu',
      'kanban.column',
      'kanban.dropped',
      'kanban.emptyColumn',
      'kanban.instructions',
      'kanban.lifted',
      'kanban.moveCard',
      'kanban.moveDown',
      'kanban.moveTo',
      'kanban.moveToColumn',
      'kanban.moveUp',
      'kanban.moved',
      'launchpad.hidden',
      'launchpad.hide',
      'launchpad.moveEarlier',
      'launchpad.moveLater',
      'launchpad.show',
      'launchpad.showLabel',
      'lifecycle.step',
      'list.findView',
      'list.moreViews',
      'list.view',
      'list.views',
      'lookup.create',
      'lookup.createButton',
      'lookup.createTitle',
      'lookup.keyboardHint',
      'lookup.name',
      'lookup.oneOff',
      'lookup.oneOffKind',
      'lookup.price',
      'lookup.recent',
      'lookup.searchAll',
      'lookup.taxCategory',
      'lookup.unit',
      'matching.acceptSuggestion',
      'matching.clear',
      'matching.dismissSuggestion',
      'matching.empty',
      'matching.enterKey',
      'matching.escapeKey',
      'matching.match',
      'matching.matched',
      'matching.matchedWith',
      'matching.search',
      'matching.select',
      'matching.selectBoth',
      'matching.showList',
      'matching.spaceKey',
      'matching.suggestions',
      'matching.unmatch',
      'matching.unmatchItem',
      'mention.list',
      'message.emptyDescription',
      'message.emptyTitle',
      'message.failed',
      'message.jumpToLatest',
      'message.newMessages',
      'message.retry',
      'message.send',
      'message.sendHint',
      'message.sending',
      'message.you',
      'notes.free',
      'notes.templates',
      'notice.close',
      'notice.region',
      'notifications.all',
      'notifications.emptyDescription',
      'notifications.emptyTitle',
      'notifications.markAllRead',
      'notifications.markRead',
      'notifications.markUnread',
      'notifications.noMatchTitle',
      'notifications.settings',
      'notifications.show',
      'notifications.title',
      'notifications.unread',
      'notifications.unreadCount',
      'notifications.unreadFilter',
      'notifications.viewAll',
      'page.backTo',
      'page.sections',
      'panel.showAll',
      'panel.showFewer',
      'password.capsLock',
      'password.show',
      'period.all',
      'period.clear',
      'period.customRange',
      'period.lastMonth',
      'period.lastQuarter',
      'period.lastYear',
      'period.quarter',
      'period.thisMonth',
      'period.thisQuarter',
      'period.thisWeek',
      'period.today',
      'period.yearToDate',
      'permissions.allowed',
      'permissions.area',
      'permissions.cell',
      'permissions.notAllowed',
      'permissions.notApplicable',
      'presence.here',
      'presence.list',
      'presence.more',
      'preview.open',
      'questionnaire.back',
      'questionnaire.next',
      'questionnaire.notAnswered',
      'questionnaire.otherRequired',
      'questionnaire.progress',
      'questionnaire.progressLabel',
      'questionnaire.required',
      'questionnaire.review',
      'questionnaire.submit',
      'questionnaire.summaryTitle',
      'recovery.codes',
      'recovery.continue',
      'recovery.copied',
      'recovery.copy',
      'recovery.copyFailed',
      'recovery.download',
      'recovery.print',
      'recovery.saved',
      'recovery.shownOnce',
      'references.basedOn',
      'references.lead',
      'references.link',
      'references.listSeparator',
      'register.correctedBy',
      'register.correction',
      'register.corrects',
      'register.locked',
      'register.lockedEntry',
      'register.number',
      'register.periodLocked',
      'report.edit',
      'report.parameters',
      'report.run',
      'run.checks',
      'run.failed',
      'run.failedCount',
      'run.notRun',
      'run.passed',
      'run.passedCount',
      'run.periodLocked',
      'run.periodOpen',
      'run.preview',
      'run.rerun',
      'run.warning',
      'run.warningCount',
      'session.activeNow',
      'session.lastActive',
      'session.noOthers',
      'session.revoke',
      'session.revokeNamed',
      'session.revokeOthers',
      'session.thisDevice',
      'settings.saved',
      'setup.blocked',
      'setup.done',
      'setup.next',
      'setup.progress',
      'setup.todo',
      'shell.allCompanies',
      'shell.companies',
      'shell.findCompany',
      'shell.findCompanyHint',
      'shell.moduleTabs',
      'shell.noCompany',
      'shell.notifications',
      'shell.pinnedCompanies',
      'shell.recentCompanies',
      'shell.search',
      'shell.skipToContent',
      'shell.switchCompany',
      'shell.switchCompanyCommand',
      'shell.switchCompanyTitle',
      'shell.userMenu',
      'signIn.continue',
      'signIn.email',
      'signIn.or',
      'signing.attachments',
      'signing.decline',
      'signing.declineConfirm',
      'signing.declineTitle',
      'signing.declinedAt',
      'signing.document',
      'signing.notYourTurn',
      'signing.sign',
      'signing.signedAt',
      'signing.signers',
      'signing.summary',
      'signing.waiting',
      'signing.you',
      'specification.open',
      'specification.summary',
      'status.errorDescription',
      'status.errorTitle',
      'status.forbiddenDescription',
      'status.forbiddenTitle',
      'status.maintenanceDescription',
      'status.maintenanceTitle',
      'status.notFoundDescription',
      'status.notFoundTitle',
      'status.planRequiredDescription',
      'status.planRequiredTitle',
      'status.suspendedCompanyDescription',
      'status.suspendedCompanyTitle',
      'status.suspendedDescription',
      'status.suspendedTitle',
      'status.unauthenticatedDescription',
      'status.unauthenticatedTitle',
      'statutory.checkFailed',
      'statutory.checkPassed',
      'statutory.checkWarning',
      'statutory.checks',
      'statutory.checksFailed',
      'statutory.checksPassed',
      'statutory.checksWarnings',
      'statutory.computed',
      'statutory.description',
      'statutory.fieldValue',
      'statutory.goToField',
      'statutory.noSources',
      'statutory.number',
      'statutory.overridden',
      'statutory.overriddenBy',
      'statutory.saveOverride',
      'statutory.showSources',
      'statutory.sources',
      'statutory.useComputed',
      'stepper.completed',
      'stepper.step',
      'table.clearFilters',
      'table.count',
      'table.narrower',
      'table.next',
      'table.noMatch',
      'table.noRows',
      'table.previous',
      'table.resizeColumn',
      'table.rowActions',
      'table.selectAll',
      'table.selectRow',
      'table.updating',
      'table.wider',
      'text.join',
      'timeline.failed',
      'timeline.next',
      'value.change',
      'wizard.back',
      'wizard.finish',
      'wizard.next',
      'worklist.back',
      'worklist.detail',
      'worklist.next',
    ])
  })

  it('lets the application replace any message, including those that take a value', () => {
    const html = render(
      <LiroProvider
        locale="sr-Latn-RS"
        messages={{
          'table.next': 'Sledeće',
          'table.count': (_count, text, exact) => `${exact ? '' : 'Više od '}${text} redova`,
        }}
      >
        <Messages />
      </LiroProvider>,
    )
    expect(html).toContain('<output>Sledeće|1.234 redova|Unavailable: closed period</output>')
  })

  it('uses the English defaults outside a provider', () => {
    expect(render(<Messages />)).toBe('<output>Next|1,234 rows|Unavailable: closed period</output>')
  })
})

describe('today and weekStartsOn', () => {
  it('passes the given today, e.g. the tenant date', () => {
    expect(
      render(
        <LiroProvider locale="en" today="2026-03-15">
          <Dates />
        </LiroProvider>,
      ),
    ).toContain('<output>2026-03-15|0</output>')
  })

  it("defaults today to the device's local date", () => {
    expect(
      render(
        <LiroProvider locale="en">
          <Dates />
        </LiroProvider>,
      ),
    ).toContain(`<output>${localToday()}|0</output>`)
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('takes the first day of the week from the locale, or from the prop', () => {
    const at = (locale: string, weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6) =>
      render(
        <LiroProvider
          locale={locale}
          today="2026-03-15"
          {...(weekStartsOn === undefined ? {} : { weekStartsOn })}
        >
          <Dates />
        </LiroProvider>,
      )
    expect(at('sr-Latn-RS')).toContain('2026-03-15|1<')
    expect(at('ar')).toContain('2026-03-15|6<')
    expect(at('en', 1)).toContain('2026-03-15|1<')
  })
})

describe('linkComponent', () => {
  it('renders links as <a> by default', () => {
    expect(render(<Link />)).toBe('<a href="/things/1">Thing</a>')
  })

  it("renders links with the application's router link", () => {
    function RouterLink({ href, children }: { href: string; children: ReactNode }) {
      return (
        <a href={href} data-router="client">
          {children}
        </a>
      )
    }
    expect(
      render(
        <LiroProvider locale="en" linkComponent={RouterLink}>
          <Link />
        </LiroProvider>,
      ),
    ).toContain('<a href="/things/1" data-router="client">Thing</a>')
  })
})

describe('direction for Radix', () => {
  it('gives Radix primitives the direction of the provider', () => {
    expect(
      render(
        <LiroProvider locale="ar">
          <RadixDirection />
        </LiroProvider>,
      ),
    ).toContain('<output>rtl</output>')
    expect(
      render(
        <LiroProvider locale="ar" direction="ltr">
          <RadixDirection />
        </LiroProvider>,
      ),
    ).toContain('<output>ltr</output>')
  })
})
