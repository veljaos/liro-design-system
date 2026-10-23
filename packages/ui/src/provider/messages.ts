import type { IpsProblemCode } from '../components/ips-qr'

/**
 * The Design System's own strings: every text a component shows on its own, and nothing else
 * (BUILD-PLAN section 5). All other text comes in through props. A value is a string, or a
 * function where the text depends on a value, so that the application can supply its own
 * plural and gender rules. English defaults: `messages.en.ts`.
 */
export interface LiroMessages {
  /** Paging: go to the next rows. */
  'table.next': string
  /** Paging: go to the previous rows. */
  'table.previous': string
  /**
   * The number of rows: exact ("1,234 rows"), or a lower bound when the count stopped at a
   * threshold ("More than 10,000 rows"). Every message that shows a number receives the number
   * (for plural rules) and its text already written by the provider's `format.number` (P4.9).
   */
  'table.count': (count: number, text: string, exact: boolean) => string
  /** A table that has no rows yet. */
  'table.noRows': string
  'table.updating': string
  /** A table whose filters match no row. */
  'table.noMatch': string
  /** The action of the "no rows match" state that clears the table's filters. */
  'table.clearFilters': string
  /** The checkbox in the header that selects every row shown. */
  'table.selectAll': string
  /** The checkbox of one row; `label` names the row (from the application). */
  'table.selectRow': (label: string) => string
  /** The button that opens a row's actions menu; `label` names the row. */
  'table.rowActions': (label: string) => string
  /** The handle that resizes a column; `label` is the column's name. */
  'table.resizeColumn': (label: string) => string
  /** The resize popover's button that narrows the column; `label` is the column's name. */
  'table.narrower': (label: string) => string
  /** The resize popover's button that widens the column; `label` is the column's name. */
  'table.wider': (label: string) => string
  /** Marks a required field. */
  'field.required': string
  /** Announces a read-only field. */
  'field.readOnly': string
  /** A number or amount field whose text cannot be read as a number (shown under the field). */
  'field.invalidNumber': string
  /** A date field whose text cannot be read as a date (shown under the field). */
  'field.invalidDate': string
  /** A date range whose end is before its start (shown under the field). */
  'field.invalidRange': string
  /** The button that opens a date field's calendar. */
  'field.openCalendar': string
  /** Names the first date of a range for assistive technology. */
  'field.rangeStart': string
  /** Names the last date of a range for assistive technology. */
  'field.rangeEnd': string
  /** A searching field is waiting for its results. */
  'field.loading': string
  /** A searching field found nothing for the text typed. */
  'field.noResults': string
  /** The button that removes one chosen value (its label) from a multiple choice. */
  'field.remove': (label: string) => string
  'field.selectedCount': (count: number, text: string) => string
  /** The button that empties a field (a clearable SelectField). */
  'field.clear': string
  /** FilterBar: the search field's placeholder and accessible name. */
  'filter.search': string
  /** FilterBar: the button that empties the search field. */
  'filter.clearSearch': string
  /** FilterBar: the button that opens the filters drawer, and the drawer's title. */
  'filter.filters': string
  /** FilterBar: the button that clears every filter of the bar. */
  'filter.clearAll': string
  /** FilterBar: an active filter on its pill, its label and its value: "Status: Sent". */
  'filter.pill': (label: string, value: string) => string
  /** FilterBar: the button that removes one active filter (its label). */
  'filter.remove': (label: string) => string
  /** FilterBar: the two choices of a yes / no filter. */
  'filter.yes': string
  'filter.no': string
  /**
   * FilterBar: the short texts inside the two ends of a number range, at their start, and the
   * empty date range's placeholders ("From – To").
   */
  'filter.from': string
  'filter.to': string
  /**
   * FilterBar: the names of the two ends of a number range, with the filter's label and, for an
   * amount, its currency ("Total from (EUR)").
   */
  'filter.rangeFrom': (label: string, currency?: string) => string
  'filter.rangeTo': (label: string, currency?: string) => string
  /** FilterBar: an amount range's visible label, with its currency once ("Total (EUR)"). */
  'filter.rangeLabel': (label: string, currency: string) => string
  /** FilterBar: the empty value of a choice filter, meaning no filter ("All"; P4.9). */
  'filter.all': string
  /** FilterBar on phones: the sort button's text while nothing is sorted, and the start of its name. */
  'filter.sort': string
  /** FilterBar on phones: the two directions in the sort menu. */
  'filter.ascending': string
  'filter.descending': string
  /** Names the breadcrumb trail for assistive technology. */
  'breadcrumbs.label': string
  /** Names the command palette and its search field. */
  'command.title': string
  /** The placeholder of the command palette's search field. */
  'command.placeholder': string
  /** The heading of the palette's actions. */
  'command.actions': string
  /** The heading of the palette's places to go. */
  'command.navigation': string
  /** The palette found nothing. */
  'command.noResults': string
  /** The calendar's button that shows the previous month. */
  'calendar.previousMonth': string
  /** The calendar's button that shows the next month. */
  'calendar.nextMonth': string
  /** The month grid's button that shows the previous year. */
  'calendar.previousYear': string
  /** The month grid's button that shows the next year. */
  'calendar.nextYear': string
  /** Names the group of the calendar's month buttons. */
  'calendar.navigation': string
  /** A quarter and its year's name, e.g. "Q1 2025/26". quarter is 1 … 4. */
  'period.quarter': (quarter: number, text: string, year: string) => string
  /** Period presets. */
  'period.today': string
  'period.thisWeek': string
  'period.thisMonth': string
  'period.lastMonth': string
  'period.thisQuarter': string
  'period.lastQuarter': string
  'period.yearToDate': string
  'period.lastYear': string
  /** Removes the chosen period: all periods. */
  'period.clear': string
  /** A period field with no period chosen: all periods. */
  'period.all': string
  /** The caption over the calendar of a period field. */
  'period.customRange': string
  /** The button that dismisses a confirmation without acting. */
  'dialog.cancel': string
  /** The default question of a delete confirmation. */
  'confirm.deleteTitle': string
  /** The default text of a delete confirmation. */
  'confirm.deleteMessage': string
  /** The default label of a delete confirmation's button. */
  'confirm.deleteLabel': string
  /** The label of the field where the user types `text` to confirm an irreversible action. */
  'confirm.typeToConfirm': (text: string) => string
  /** The reason field of ReasonConfirmDialog, when the application gives no label. */
  'confirm.reason': string
  /** ReasonConfirmDialog's free text beside a list of reasons. */
  'confirm.reasonDetails': string
  /** The button that closes a dialog or a drawer. */
  'dialog.close': string
  /** A DueDate that is paid or otherwise closed. */
  'due.settled': string
  /** A DueDate that has passed, with the number of days. */
  'due.overdue': (days: number, text: string) => string
  /** A DueDate that is today. */
  'due.today': string
  /** A DueDate within the warning days, with the number of days left. */
  'due.inDays': (days: number, text: string) => string
  /** The button that opens the actions that do not fit. */
  'action.more': string
  /** Names the menu button of a split action (its main action's label). */
  'action.moreOptions': (label: string) => string
  /** How many rows are selected, in a BulkActionBar. */
  'bulk.selected': (count: number, text: string) => string
  /** Offers to select every row of the result. */
  'bulk.selectAll': (total: number, text: string) => string
  /** The button that clears the selection. */
  'bulk.clear': string
  /** The question before an action on the selection. */
  'bulk.confirmTitle': (count: number, text: string) => string
  /** The button that closes a dismissible alert or banner. */
  'alert.close': string
  /** EmptyState 'empty': nothing here yet. */
  'empty.emptyTitle': string
  'empty.emptyDescription': string
  /** EmptyState 'no-results': nothing matches the search or the filters. */
  'empty.noResultsTitle': string
  'empty.noResultsDescription': string
  /** EmptyState 'error' and ErrorState: loading failed. */
  'empty.errorTitle': string
  'empty.errorDescription': string
  /** Before the case number of an ErrorState. */
  'empty.caseId': string
  /** The button that closes a toast. */
  'notice.close': string
  /** Names the region where toasts appear, for assistive technology. */
  'notice.region': string
  /** SaveStatus (P5.90): beside the action while a routine save runs, and after it succeeded. */
  'save.saving': string
  'save.saved': string
  /** Tells assistive technology that a step of a Stepper is completed. */
  'stepper.completed': string
  /**
   * Stepper on phones (P5.23): where the user is, "Step 3 of 4", before " · " and the step's name
   * on the one line over its thin progress bar; the numbers already formatted.
   */
  'stepper.step': (step: number, stepText: string, total: number, totalText: string) => string
  /** An action that cannot be used, with the reason it is given. */
  'action.unavailable': (reason: string) => string
  /** EditableGrid: each cell's accessible name, its column and line: "Quantity, line 3". */
  'grid.cell': (column: string, line: number, text: string) => string
  /** EditableGrid: a message about one cell under its row: "Quantity: Enter a number". */
  'grid.cellMessage': (column: string, text: string) => string
  /** EditableGrid: the button that adds a line at the end. */
  'grid.addLine': string
  /** EditableGrid: the remove button of a line (its number). */
  'grid.removeLine': (line: number, text: string) => string
  /** EditableGrid: the names of the two row shortcuts shown beside "Add line". */
  'grid.insertLine': string
  'grid.deleteLine': string
  /**
   * EditableGrid: the keys of the row shortcuts as the user sees them. The application gives "⌘"
   * on a Mac; the grid accepts Ctrl and Cmd on every system.
   */
  'grid.modifierKey': string
  'grid.enterKey': string
  'grid.deleteKey': string
  /** FormTabs: the name of a tab whose fields have errors (its label). */
  'form.hasErrors': (label: string) => string
  /** FormActions: the bottom bar's note while the form has unsaved changes. */
  'form.unsaved': string
  /** useUnsavedChangesGuard: the question before leaving a form with unsaved changes. */
  'form.leaveTitle': string
  'form.leaveMessage': string
  /** useUnsavedChangesGuard: leave (and lose the changes), or stay on the form. */
  'form.leave': string
  'form.stay': string
  /** FormWizard: the buttons that go to the previous and the next step, and finish. */
  'wizard.back': string
  'wizard.next': string
  'wizard.finish': string
  /** The connection is lost. */
  'connection.offline': string
  /** AppShell: the link that skips the header and goes to the page's content. */
  'shell.skipToContent': string
  /** AppShell: the search button that opens the command palette. */
  'shell.search': string
  /** AppShell: the notifications button; `unread` is how many are unread (0: none). */
  'shell.notifications': (unread: number, text: string) => string
  /** AppShell: the user menu's button. */
  'shell.userMenu': string
  /** AppShell: names the row of module tabs. */
  'shell.moduleTabs': string
  /** Company switcher: the button's name (`company` is the current one), and its list. */
  'shell.switchCompany': (company: string) => string
  'shell.companies': string
  /** Company switcher: the search field shown when there are many companies, and its hint. */
  'shell.findCompany': string
  'shell.findCompanyHint': string
  /** Company switcher: the sections of the list. */
  'shell.pinnedCompanies': string
  'shell.recentCompanies': string
  'shell.allCompanies': string
  /** Company switcher: no company matches the search (`query` as typed). */
  'shell.noCompany': (query: string) => string
  /** The command palette's entry that opens the company switcher. */
  'shell.switchCompanyCommand': string
  /** The title of the full-screen company sheet on phones. */
  'shell.switchCompanyTitle': string
  /** NotificationsPanel and NotificationsPage: the title, the unread count (`text` formatted). */
  'notifications.title': string
  'notifications.unreadCount': (count: number, text: string) => string
  /** Names an unread notification for assistive technology (beside its dot). */
  'notifications.unread': string
  'notifications.markAllRead': string
  /** Mark one notification read or unread (`title` is the notification's). */
  'notifications.markRead': (title: string) => string
  'notifications.markUnread': (title: string) => string
  /** The panel's link to the NotificationsPage. */
  'notifications.viewAll': string
  /** NotificationsPage: the header's link to the notification settings. */
  'notifications.settings': string
  /** NotificationsPage: the All / Unread toggle, its name, and the empty filters' placeholder. */
  'notifications.all': string
  'notifications.unreadFilter': string
  'notifications.show': string
  /** NotificationsPage: the day headings. */
  'day.today': string
  'day.yesterday': string
  /** Nothing at all, and nothing that matches the filters. */
  'notifications.emptyTitle': string
  'notifications.emptyDescription': string
  'notifications.noMatchTitle': string
  /** Launchpad, editing mode: the buttons of a module card (`name` is the module's). */
  'launchpad.moveEarlier': (name: string) => string
  'launchpad.moveLater': (name: string) => string
  'launchpad.hide': (name: string) => string
  /** Launchpad, editing mode: the title over the hidden modules, and their "Show" button. */
  'launchpad.hidden': (count: number, text: string) => string
  'launchpad.showLabel': string
  /** ListPage: names the row of saved views. */
  'list.views': string
  /**
   * ListPage: the saved views that do not fit as tabs, in a "More" menu (desktop); on phones the
   * one select's text ("View: All"; `view` is the current view's name) and its search field,
   * shown above 7 views (P4.9).
   */
  'list.moreViews': string
  'list.view': (view: string) => string
  'list.findView': string
  /** ColumnChooser: its button, its title, and the move buttons of a column (`label`). */
  'columns.button': string
  'columns.title': string
  'columns.moveUp': (label: string) => string
  'columns.moveDown': (label: string) => string
  /** QuickPreview: opens the record's full page. */
  'preview.open': string
  /** WorklistPage: back to the list (below 62em), and to the previous and the next item. */
  'worklist.back': string
  'worklist.previous': string
  'worklist.next': string
  /**
   * WorklistPage: where the chosen item stands in the queue ("3 of 11"); the numbers already
   * written by `format.number` (`indexText`, `totalText`), the numbers kept for plural rules.
   */
  'worklist.position': (
    index: number,
    indexText: string,
    total: number,
    totalText: string,
  ) => string
  /** WorklistPage, from 62em: names the detail pane. */
  'worklist.detail': string
  /** PageHeader's back button: its name and tooltip (`list` is the list's name). */
  'page.backTo': (list: string) => string
  /** SectionBar: names the row of section links. */
  'page.sections': string
  /** LifecycleBar on phones: "Step 3 of 4: Sent to SEF". */
  'lifecycle.step': (
    step: number,
    stepText: string,
    total: number,
    totalText: string,
    label: string,
  ) => string
  /** DocumentPage: the button that hides or shows the side panels, and the panels' name. */
  'document.hidePanels': string
  'document.showPanels': string
  'document.panels': string
  /** Side-panel lists (ActivityList): show every entry ("Show all 5"), then only the latest. */
  'panel.showAll': (count: number, countText: string) => string
  'panel.showFewer': string
  /** ChangeableValue: the button that turns a value the system filled in into its field. */
  'value.change': (label: string) => string
  /** Charts: the button that shows the values as a table, and back as a chart. */
  'chart.showTable': string
  'chart.showChart': string
  /** Charts (P4.7a): no values in the period; a failed load and its retry; loading. */
  'chart.noData': string
  'chart.error': string
  'chart.retry': string
  'chart.loading': string
  /**
   * Axis ticks written short (P4.7a): `value` is the tick already divided and formatted
   * ("1,5"); the words are the Core's ("1,5 hilj.", "1,5 mil.").
   */
  'chart.thousands': (value: string) => string
  'chart.millions': (value: string) => string
  'chart.billions': (value: string) => string
  /** ReportPage: run the report; edit its parameters again; names the parameters. */
  'report.run': string
  'report.edit': string
  'report.parameters': string
  /** SettingsPage: a setting saved (shown in its row). */
  'settings.saved': string
  /** Status pages (P4.7): the default title and description of each kind. */
  'status.unauthenticatedTitle': string
  'status.unauthenticatedDescription': string
  'status.planRequiredTitle': string
  'status.planRequiredDescription': string
  'status.forbiddenTitle': string
  'status.forbiddenDescription': string
  'status.notFoundTitle': string
  'status.notFoundDescription': string
  'status.errorTitle': string
  'status.errorDescription': string
  'status.maintenanceTitle': string
  'status.maintenanceDescription': string
  /** A suspended page about the user's own account (the default subject). */
  'status.suspendedTitle': string
  'status.suspendedDescription': string
  /** A suspended page about a company the user works for (P4.9). */
  'status.suspendedCompanyTitle': string
  /** `company` is the company's name, from the application. */
  'status.suspendedCompanyDescription': (company: string) => string
  /** The accessible name of a hidden module's "Show" button. */
  'launchpad.show': (name: string) => string
  // ── P5 group F ──
  /** CandidateList (P5.23): shown when the application proposes nothing. */
  'candidates.empty': string
  /** BalanceBar (P5.21): the three values of a balanced entry and its state. */
  'balance.label': string
  'balance.debit': string
  'balance.credit': string
  'balance.difference': string
  'balance.balanced': string
  'balance.unbalanced': string
  /** An amount cannot be read or is missing, so the balance is not known. */
  'balance.incomplete': string
  /** PeriodicRunPage (P5.21): the checks of a step and their results. */
  'run.checks': string
  'run.passed': string
  'run.warning': string
  'run.failed': string
  'run.notRun': string
  /** Counts of check results: the number for plural rules and its text through `format.number`. */
  'run.passedCount': (count: number, text: string) => string
  'run.warningCount': (count: number, text: string) => string
  'run.failedCount': (count: number, text: string) => string
  /** The heading of the preview before posting. */
  'run.preview': string
  /** The period's lock state. */
  'run.periodOpen': string
  'run.periodLocked': string
  /** The button that runs the process again (it asks for a reason first). */
  'run.rerun': string
  // ── P5 group A ──
  /** Joins a few names or labels into one line ("Dragan Ilić, Ivana Stojanović"). */
  'text.join': (items: readonly string[]) => string
  /** AgentMark: names the machine marker after an agent's name (assistive technology, tooltip). */
  'agent.mark': string
  /** An agent's name where only text can mark it (an accessible name): "Liro agent (agent)". */
  'agent.named': (name: string) => string
  /** AgentQuestion: names the question an agent asks ("Question from Liro agent"). */
  'agent.question': (name: string) => string
  /** PresenceAvatars: the accessible name and tooltip, with the names already joined. */
  'presence.here': (names: string) => string
  /** PresenceAvatars: the overflow ("+3"); `text` is the count written by `format.number`. */
  'presence.more': (count: number, text: string) => string
  /** PresenceAvatars: the list of everyone here (the popover's name). */
  'presence.list': string
  /** HistoryList: the marker of a change made by the system or by an integration. */
  'history.system': string
  'history.integration': string
  /** HistoryList: a change made for someone else ("On behalf of Milica Petrović"). */
  'history.onBehalfOf': (name: string) => string
  /** HistoryList: the old and the new value of a field, for assistive technology. */
  'history.before': string
  'history.after': string
  /** HistoryList: loads the next, older entries. */
  'history.showMore': string
  /** HistoryList: no entries yet. */
  'history.emptyTitle': string
  'history.emptyDescription': string
  /** MessageBubble: the user's own messages, for assistive technology. */
  'message.you': string
  /** MessageComposer: the send button; its state while sending; the keys, shown under the field. */
  'message.send': string
  'message.sending': string
  'message.sendHint': string
  /** MessageBubble: a message that could not be sent, and its retry. */
  'message.failed': string
  'message.retry': string
  /** MessageList: the button back to the latest message; with the count of new ones. */
  'message.jumpToLatest': string
  'message.newMessages': (count: number, text: string) => string
  /** MessageList: no messages yet. */
  'message.emptyTitle': string
  'message.emptyDescription': string
  /** MentionCombobox: names the list of people that can be mentioned. */
  'mention.list': string
  /** Questionnaire: the buttons that move between questions and to the summary. */
  'questionnaire.next': string
  'questionnaire.back': string
  'questionnaire.review': string
  /** Questionnaire: the default of the final button (the application usually names it). */
  'questionnaire.submit': string
  /** Questionnaire: "3 of 9 answered"; the texts are written by `format.number`. */
  'questionnaire.progress': (
    answered: number,
    answeredText: string,
    total: number,
    totalText: string,
  ) => string
  /** Questionnaire: the progress bar's name. */
  'questionnaire.progressLabel': string
  /** Questionnaire: the summary's title, where any answer can be changed. */
  'questionnaire.summaryTitle': string
  /** Questionnaire: an optional question left without an answer, in the summary. */
  'questionnaire.notAnswered': string
  /** Questionnaire: a required question without an answer; an "Other" without its text. */
  'questionnaire.required': string
  'questionnaire.otherRequired': string

  // ── P5 group C ──
  /** EmailFirstForm (P5.6): the e-mail field's default label and the button that goes on. */
  'signIn.email': string
  'signIn.continue': string
  /** The divider between the provider buttons and the e-mail form ("or"). */
  'signIn.or': string
  /** PasswordField: the toggle that shows the typed password (its pressed state says shown). */
  'password.show': string
  /** PasswordField: a hint under the field while Caps Lock is on. */
  'password.capsLock': string
  /** CodeInput: one box's name, "Character 2 of 6"; numbers already written by `format.number`. */
  'code.box': (position: number, positionText: string, total: number, totalText: string) => string
  /** RecoveryCodes: the list's name and the heading of the downloaded and printed file. */
  'recovery.codes': string
  /** RecoveryCodes: the codes are shown once (a warning above them). */
  'recovery.shownOnce': string
  'recovery.copy': string
  /** Announced after the codes were copied. */
  'recovery.copied': string
  /** The browser refused to copy. */
  'recovery.copyFailed': string
  'recovery.download': string
  'recovery.print': string
  /** The confirmation that enables Continue. */
  'recovery.saved': string
  'recovery.continue': string
  /** SessionList (P5.6): the current device's mark, its state, another device's last activity. */
  'session.thisDevice': string
  'session.activeNow': string
  /** `when` is the date and time, already written by `format`. */
  'session.lastActive': (when: string) => string
  /** The button that ends another device's session; its name with the device. */
  'session.revoke': string
  'session.revokeNamed': (device: string) => string
  'session.revokeOthers': string
  /** No other device is signed in. */
  'session.noOthers': string
  /** KanbanBoard (P5.7): an empty column; the card's drag handle and its menu (named by title). */
  'kanban.emptyColumn': string
  'kanban.moveCard': (title: string) => string
  'kanban.cardMenu': (title: string) => string
  /** The menu's entries: a heading over the columns, a column entry, up and down. */
  'kanban.moveTo': string
  'kanban.moveToColumn': (column: string) => string
  'kanban.moveUp': string
  'kanban.moveDown': string
  /** The handle's description: how to move a card with the keyboard. */
  'kanban.instructions': string
  /**
   * Announcements while a card is moved with the keyboard: picked up, moved, dropped (the place
   * as "position of total"; numbers already written by `format.number`), cancelled.
   */
  'kanban.lifted': (title: string, column: string, position: string, total: string) => string
  'kanban.moved': (title: string, column: string, position: string, total: string) => string
  'kanban.dropped': (title: string, column: string, position: string, total: string) => string
  'kanban.cancelled': (title: string) => string
  /** Phones: the choice of the column shown. */
  'kanban.column': string
  /** PermissionMatrix (P5.21): a cell's checkbox name, its read-only states, the corner header. */
  'permissions.cell': (area: string, action: string) => string
  'permissions.allowed': string
  'permissions.notAllowed': string
  'permissions.notApplicable': string
  'permissions.area': string
  /** SetupChecklist (P5.21): "2 of 5 done"; numbers already written by `format.number`. */
  'setup.progress': (done: number, doneText: string, total: number, totalText: string) => string
  /** A step's state for assistive technology (the marker shows it). */
  'setup.done': string
  'setup.next': string
  'setup.todo': string
  'setup.blocked': string
  /** SignerList (P5.21): "1 of 3 signed"; numbers already written by `format.number`. */
  'signing.summary': (
    signed: number,
    signedText: string,
    total: number,
    totalText: string,
  ) => string
  /** A signer's state; `when` is the date and time, already written by `format`. */
  'signing.waiting': string
  'signing.signedAt': (when: string) => string
  'signing.declinedAt': (when: string) => string
  /** After the current user's name. */
  'signing.you': string
  'signing.sign': string
  'signing.decline': string
  /** The decline dialog's title and its confirm button. */
  'signing.declineTitle': string
  'signing.declineConfirm': string
  /** In order: the signer whose turn comes first. */
  'signing.notYourTurn': (name: string) => string
  /** SigningPage: its sections. */
  'signing.signers': string
  'signing.document': string
  'signing.attachments': string
  // ── P5 group E ──
  /** LookupDialog: how the keyboard moves through the results (under the table; the search's description). */
  'lookup.keyboardHint': string
  /** ImportWizard: the names of its four steps. */
  'import.stepFile': string
  'import.stepColumns': string
  'import.stepCheck': string
  'import.stepImport': string
  /** ImportWizard, column mapping: the headers and a column's states. */
  'import.field': string
  'import.column': string
  'import.sample': string
  'import.notImported': string
  'import.suggested': string
  /** The name of a field's column choice ("Column for Name"). */
  'import.columnFor': (field: string) => string
  /** The file's columns no field takes ("Not imported: Note, Phone 2"); joined by the component. */
  'import.unusedColumns': (columns: string) => string
  /** Next is unavailable while required fields have no column; `fields` joined by the component. */
  'import.missingRequired': (fields: string) => string
  /** The validation preview's counts, each with its noun; `text` is `count` through `format.number`. */
  'import.ready': (count: number, text: string) => string
  'import.withErrors': (count: number, text: string) => string
  'import.withWarnings': (count: number, text: string) => string
  'import.duplicates': (count: number, text: string) => string
  /** The preview's filter and the choice to leave invalid rows out. */
  'import.problemsOnly': string
  'import.skipInvalid': string
  /** Import is unavailable while rows have errors and they are not skipped. */
  'import.fixOrSkip': string
  /** The preview's columns: the line in the file, and the row's problems. */
  'import.line': string
  'import.problems': string
  /** The preview filtered to problems, and none left. */
  'import.noProblems': string
  /** The import button ("Import 1.198 rows"). */
  'import.run': (count: number, text: string) => string
  /** The import's progress: names its JobProgress. */
  'import.progress': string
  /** The phone's close button in the wizard's header, in place of Cancel (P5.23). */
  'import.cancel': string
  /** Asked before leaving once a file is chosen: the title and the message (P5.23). */
  'import.leaveTitle': string
  'import.leaveMessage': string
  /** BulkEditDrawer: the title ("Edit 24 records"), a field left as it is, and the summary. */
  'bulkEdit.title': (count: number, text: string) => string
  'bulkEdit.unchanged': string
  'bulkEdit.summary': string
  'bulkEdit.nothing': string
  /** The apply button, the confirmation's question and its button. */
  'bulkEdit.apply': (count: number, text: string) => string
  'bulkEdit.confirmTitle': (count: number, text: string) => string
  'bulkEdit.confirm': string
  /** DuplicateWarning: the default title, the list's name and the two choices. */
  'duplicate.title': string
  'duplicate.existing': string
  'duplicate.openExisting': string
  'duplicate.createAnyway': string
  /** The question when the application asks for a reason to create a duplicate. */
  'duplicate.reasonTitle': string
  /** RegisterPage: the entry number's header and the correction column. */
  'register.number': string
  'register.correction': string
  /** A correction refers to the entry it corrects, and the corrected entry to it. */
  'register.corrects': (number: string) => string
  'register.correctedBy': (number: string) => string
  /** A locked entry: the lock's name, and its row menu's one (unavailable) item. */
  'register.locked': string
  'register.lockedEntry': string
  /** A locked period ("January–June 2026 is locked"); the period is the application's text. */
  'register.periodLocked': (period: string) => string
  /**
   * DocumentSource (P5.23): the labels of a source document's date and total in a correcting or
   * cancelling document's header ("Issued 25.09.2026. · Total 186.420,35 RSD").
   */
  'document.sourceDate': string
  'document.sourceTotal': string
  /** StatutoryFormPage: the field number and description headers. */
  'statutory.number': string
  'statutory.description': string
  /** The amount opens its source documents: "1.234,00 RSD, sources of 3.2". */
  'statutory.showSources': (field: string, value: string) => string
  /** The drill-down: the documents' name, none, and the field's value line ("Field 3.2"). */
  'statutory.sources': string
  'statutory.noSources': string
  'statutory.fieldValue': (field: string) => string
  /** A manual override: the marker, who and when, the computed value, and the way back. */
  'statutory.overridden': string
  'statutory.overriddenBy': (who: string, when: string) => string
  'statutory.computed': (value: string) => string
  'statutory.useComputed': string
  /** Saves a value typed over the computed one. */
  'statutory.saveOverride': string
  /** Rule checks: the state before a rule's text, and the summary's counts with their noun. */
  'statutory.checkFailed': string
  'statutory.checkWarning': string
  'statutory.checkPassed': string
  'statutory.checksFailed': (count: number, text: string) => string
  'statutory.checksWarnings': (count: number, text: string) => string
  'statutory.checksPassed': (count: number, text: string) => string
  /** The summary's link to a field ("Go to 5.4"). */
  'statutory.goToField': (field: string) => string
  /** Names the checks summary. */
  'statutory.checks': string
  // ── P5 group B ──
  /** OfflineIndicator: announced politely once the connection returns. */
  'connection.online': string
  /** ConnectionState: a draft saved on this device only; `time` is `format.time`, or null. */
  'connection.local': (time: string | null) => string
  /** ConnectionState: the draft is being sent. */
  'connection.sending': string
  /** ConnectionState: the draft has been sent; `time` is `format.time`, or null. */
  'connection.sent': (time: string | null) => string
  /** ConnectionState: sending failed (the draft is still on this device). */
  'connection.failed': string
  /** ConnectionState: the button that sends a draft again. */
  'connection.retry': string
  /** EnvironmentMarker: read before the environment's name ("Environment: Sandbox"). */
  'environment.prefix': string
  /** ImpersonationBar: the bar's name as a region. */
  'impersonation.region': string
  /** ImpersonationBar: whose account is being used; `name` from the application. */
  'impersonation.viewingAs': (name: string) => string
  /** ImpersonationBar: why; `reason` from the application. */
  'impersonation.reason': (reason: string) => string
  /** ImpersonationBar: the time left; `text` is the minutes written by `format.number`. */
  'impersonation.minutesLeft': (minutes: number, text: string) => string
  /** ImpersonationBar: the session's time is over. */
  'impersonation.ended': string
  /** ImpersonationBar: the action that ends the session. */
  'impersonation.exit': string
  /** StatusTimeline: a step that failed, for assistive technology (its reason is shown). */
  'timeline.failed': string
  /** StatusTimeline: the name of the next-step block under the current state. */
  'timeline.next': string
  /** JobProgress: how far it has come ("312 of 1.284"), both counts through `format.number`. */
  'job.progress': (done: number, doneText: string, total: number, totalText: string) => string
  /** JobProgress: stops the job; and while it stops. */
  'job.cancel': string
  'job.cancelling': string
  /** JobProgress: the report's heading after the job finished or was cancelled. */
  'job.finished': string
  'job.cancelled': string
  /** JobProgress: the heading of the list of items that failed, with their reasons. */
  'job.failures': string
  /** FileDropzone: the button that opens the file dialog (one file or several). */
  'file.choose': (multiple: boolean) => string
  /** FileDropzone: beside the button, where dropping is possible. */
  'file.drop': (multiple: boolean) => string
  /** FileDropzone: the size limit before choosing; `limit` is the application's text ("10 MB"). */
  'file.maxSize': (limit: string) => string
  /** FileDropzone: a file of a type not accepted; `accepted` is the application's text. */
  'file.rejectedType': (name: string, accepted: string) => string
  /** FileDropzone: a file over the size limit; `limit` is the application's text ("10 MB"). */
  'file.rejectedSize': (name: string, limit: string) => string
  /** FileDropzone: a file beyond the number allowed; `text` is `max` through `format.number`. */
  'file.rejectedCount': (name: string, max: number, text: string) => string
  /**
   * AttachmentList: uploading, and what comes next; `percent` through `format.percent`, or null
   * while the progress is not known.
   */
  'attachment.uploading': (percent: string | null) => string
  /** AttachmentList: being checked for viruses, and what comes next. */
  'attachment.scanning': string
  /** AttachmentList: blocked after the check, and what to do. */
  'attachment.quarantined': string
  /** AttachmentList: the upload failed (the application's reason follows). */
  'attachment.failed': string
  /** AttachmentList: the accessible names of a file's buttons; `name` is the file's name. */
  'attachment.download': (name: string) => string
  'attachment.remove': (name: string) => string
  'attachment.retry': (name: string) => string
  /** AttachmentList: the visible label of the retry button. */
  'attachment.retryLabel': string
  /** AttachmentList: a list without files. */
  'attachment.none': string
  /** DocumentFrame: the toolbar's name and its buttons. */
  'frame.toolbar': string
  'frame.previousPage': string
  'frame.nextPage': string
  'frame.zoomIn': string
  'frame.zoomOut': string
  /** DocumentFrame: "Page 3 of 12", both numbers through `format.number`. */
  'frame.page': (page: number, pageText: string, count: number, countText: string) => string
  /** DocumentFrame: the zoom level for assistive technology; `text` through `format.percent`. */
  'frame.zoom': (text: string) => string
  /** DocumentFrame: while the viewer loads; when it failed, or did not answer in time. */
  'frame.loading': string
  'frame.error': string
  'frame.timeout': string
  /** DocumentFrame: loads the viewer again. */
  'frame.retry': string
  // ── P5 group D2 ──
  /** DocumentReferences (P5.18): the default lead ("Based on") and how a lead is written ("Based on:"). */
  'references.basedOn': string
  'references.lead': (label: string) => string
  /** Between two numbers of the same kind ("A-2026-038, A-2026-044"). */
  'references.listSeparator': string
  /** A reference's accessible name: its kind, number and, when given, its state. */
  'references.link': (kind: string, number: string, state: string | undefined) => string
  /** DocumentCurrency (P5.18): the labels of a foreign-currency document's currency block. */
  'document.currency': string
  'document.exchangeRate': string
  'document.rateDate': string
  /** The rate: "1 EUR = 117,1825 RSD"; `rateText` is already written by `format.number`. */
  'document.rate': (currency: string, homeCurrency: string, rateText: string) => string
  /** The rate line under the totals: the rate and where it comes from (the application's words). */
  'document.rateLine': (rate: string, source: string) => string
  /** CancellationBanner (P5.18): the title, who and when (both written by `format`), the reason. */
  'document.cancelledTitle': string
  /** Follows the title "Cancelled" (P5.23): "by Milica Petrović on 06.10.2026. at 11:20." */
  'document.cancelledBy': (name: string, dateText: string, timeText: string) => string
  'document.cancelReason': (reason: string) => string
  /** DocumentNotes (P5.18): the default labels of the template texts and the free note. */
  'notes.templates': string
  'notes.free': string
  /**
   * DocumentSpecification (P5.18): the summary row ("Specification of works: 300 positions,
   * 2.418.300,00 RSD"); `countText` and `amountText` are already written by `format`.
   */
  'specification.summary': (
    title: string,
    count: number,
    countText: string,
    amountText: string,
  ) => string
  'specification.open': string
  /** correctionColumns (P5.18): the default headers of a corrected value's three columns. */
  'correction.original': string
  'correction.change': string
  'correction.new': string
  // ── P5 group D1 ──
  /** LookupField: the heading over the recent records shown while nothing is typed. */
  'lookup.recent': string
  /**
   * LookupField: the entry that creates a catalogue record from the typed text. `kind` is the
   * kind's noun from the application ("service"); `query` the text typed.
   */
  'lookup.create': (kind: string, query: string) => string
  /** LookupField: the entry for a one-off line without a catalogue record (when allowed). */
  'lookup.oneOff': (query: string) => string
  /** The kind shown in a line filled with a one-off entry. */
  'lookup.oneOffKind': string
  /** LookupField: the last entry, which opens the application's full search. */
  'lookup.searchAll': string
  /** The panel that creates a catalogue record from a line: its title, from the kind's noun. */
  'lookup.createTitle': (kind: string) => string
  /** The panel's fields and its button. */
  'lookup.name': string
  'lookup.unit': string
  'lookup.price': string
  'lookup.taxCategory': string
  'lookup.createButton': string
  /** EditableGrid: the names of the one cell of a text line and of a section heading. */
  'grid.textCell': string
  'grid.headingCell': string
  /** EditableGrid "Add line ▾": the rarer line types. */
  'grid.addText': string
  'grid.addHeading': string
  'grid.addDiscount': string
  'grid.addDeduction': string
  /** EditableGrid: the note before a line's detail that never reaches the customer's document. */
  'grid.internal': string
  // P5.24 shifts
  /** ShiftPlanner: the header of the people column, the hours column and the coverage row. */
  'shifts.person': string
  'shifts.hours': string
  'shifts.coverage': string
  /** Planned hours: `text` is already written by `format.number` ("38,5 h"). */
  'shifts.hoursValue': (text: string) => string
  /** A day's coverage at the column's foot ("5 of 6"); both written by `format.number`. */
  'shifts.coverageValue': (plannedText: string, neededText: string | undefined) => string
  /**
   * A template's times for assistive technology ("22:00 to 06:00 the next day"); the times are
   * already written by `format.time`. Shown as "22:00–06:00 (+1)".
   */
  'shifts.timeRange': (startText: string, endText: string, nextDay: boolean) => string
  /** The visible mark after a time that ends the next day. */
  'shifts.nextDayMark': string
  /** A template's length, for display only ("8 h", "7 h 30 min"); texts from `format.number`. */
  'shifts.duration': (
    hours: number,
    hoursText: string,
    minutes: number,
    minutesText: string,
  ) => string
  /** A cell without an assignment. */
  'shifts.cellEmpty': string
  /** A cell inside the selected range (after its contents, in its name). */
  'shifts.inSelection': string
  /** A cell's name: the person, the day and what it holds (assignments and conflicts). */
  'shifts.cell': (name: string, dayText: string, contents: string) => string
  /** An assignment changed since the schedule was published. */
  'shifts.changed': string
  /** A conflict from the application, by its tone, with its words. */
  'shifts.conflictWarning': (text: string) => string
  'shifts.conflictDanger': (text: string) => string
  /** The summary of the conflicts shown, and its action that moves to the cell. */
  'shifts.conflicts': string
  'shifts.goTo': string
  'shifts.goToCell': (name: string, dayText: string) => string
  /** The palette of templates, its hint, and the grid's keyboard instructions. */
  'shifts.templates': string
  'shifts.paletteHint': string
  'shifts.instructions': string
  /** A template's key in the palette ("Key 1"), for assistive technology. */
  'shifts.key': (key: string) => string
  /** The cell menu: the heading over the templates, moving and removing one assignment. */
  'shifts.assign': string
  'shifts.moveTo': (label: string) => string
  'shifts.remove': (label: string) => string
  /** Announcements after a change (polite); counts written by `format.number`. */
  'shifts.assigned': (label: string, count: number, countText: string) => string
  'shifts.removed': (count: number, countText: string) => string
  'shifts.moved': (label: string, name: string, dayText: string) => string
  'shifts.selected': (count: number, countText: string) => string
  /** The menu button of a person's day on a phone. */
  'shifts.cellMenu': (name: string, dayText: string) => string
  /** The period's navigation and the phone's day switcher. */
  'shifts.previousPeriod': string
  'shifts.nextPeriod': string
  'shifts.today': string
  'shifts.previousDay': string
  'shifts.nextDay': string
  'shifts.day': string
  /** The view switch: one list of people, or grouped by one of the application's groupings. */
  'shifts.view': string
  'shifts.byPerson': string
  /** The schedule's state. */
  'shifts.draft': string
  'shifts.published': string
  'shifts.changedSincePublishing': string
  /** Publishing: the button, its confirmation and the counts from the application. */
  'shifts.publish': string
  'shifts.publishChanges': string
  'shifts.publishTitle': string
  'shifts.publishMessage': (
    shifts: number,
    shiftsText: string,
    people: number,
    peopleText: string,
  ) => string
  'shifts.publishConflicts': (count: number, countText: string) => string
  /** "Apply rotation…": the button and its dialog. */
  'shifts.applyRotation': string
  'shifts.rotationTitle': string
  'shifts.rotationPattern': string
  'shifts.rotationPeople': string
  'shifts.rotationStart': string
  'shifts.rotationEnd': string
  'shifts.rotationOffset': string
  'shifts.rotationOffsetValue': (days: number, daysText: string) => string
  'shifts.rotationSteps': string
  'shifts.dayOff': string
  'shifts.rotationApply': string
  'shifts.rotationSummary': (count: number, countText: string) => string
  'shifts.rotationNoPeople': string
  /** "Apply rotation…": the heading of what it will add, per person and day. */
  'shifts.rotationPreview': string
  /** The application's checks of the shifts it would add: "The checks found 2 conflicts". */
  'shifts.rotationConflicts': (count: number, countText: string) => string
  'shifts.rotationNoConflicts': string
  /** "Move to…": the dialog that moves one assignment without dragging. */
  'shifts.movePerson': string
  'shifts.moveDay': string
  'shifts.moveButton': string
  /** A plan without people. */
  'shifts.noPeople': string
  'shifts.noPeopleDescription': string
  /** MyShifts: the title, the weeks' headings, the swap action and the empty state. */
  'shifts.myShifts': string
  'shifts.thisWeek': string
  'shifts.nextWeek': string
  'shifts.week': (startText: string, endText: string) => string
  'shifts.requestSwap': string
  'shifts.noUpcoming': string
  'shifts.noUpcomingDescription': string
  /** ShiftSwapDialog: the request's title, fields, errors and button. */
  'swap.title': string
  'swap.shift': string
  'swap.who': string
  'swap.anyone': string
  'swap.colleague': string
  'swap.colleagueField': string
  'swap.colleagueRequired': string
  'swap.takeBack': string
  'swap.takeNone': string
  'swap.reason': string
  'swap.reasonRequired': string
  'swap.submit': string
  /** WorkingTimeBalance (P5.24 d): the plan's header and the table's columns. */
  'workingTime.period': string
  'workingTime.weeks': string
  'workingTime.week': (index: number, indexText: string) => string
  'workingTime.person': string
  'workingTime.planned': string
  'workingTime.worked': string
  'workingTime.difference': string
  'workingTime.average': string
  'workingTime.warnings': string
  'workingTime.noWarnings': string
  // P5.9 / P5.14 / P5.16
  /** TreeView and TreeTable: the row under an opened node whose children are being loaded. */
  'tree.loading': string
  /** The error row under a node whose children could not be loaded (without the application's words). */
  'tree.loadError': string
  /** The error row's button that asks for the children again. */
  'tree.retry': string
  /** TreeTable: the label of the totals row. */
  'tree.total': string
  /** MaskedValue: the hidden value for assistive technology; `label` names the value ("Salary"). */
  'masked.hidden': (label: string) => string
  /** MaskedValue: the button that asks to see the value, and its full name. */
  'masked.show': string
  'masked.showLabel': (label: string) => string
  /** MaskedValue: the button that hides the value again, and its full name. */
  'masked.hide': string
  'masked.hideLabel': (label: string) => string
  /** MaskedValue: the reason dialog's title. */
  'masked.revealTitle': (label: string) => string
  /** MaskedValue: the label of the list of reasons, or of the reason's text without a list. */
  'masked.reason': string
  /** MaskedValue: the last option of the list, which asks for the reason in words. */
  'masked.other': string
  /** MaskedValue: the label of the text field of "Other". */
  'masked.otherText': string
  /** MaskedValue: the note in the dialog that the access is recorded, after `masked.loggedTitle`. */
  'masked.logged': string
  /** MaskedValue: the value is on its way (after the reason was given). */
  'masked.loading': (label: string) => string
  /** MaskedValue: why the user may not see the value; `reason` is the application's. */
  'masked.notAllowed': (reason: string) => string
  /** PortalShell: names the sections' navigation (tabs, or the bottom bar on phones). */
  'portal.sections': string
  /** PortalShell: a section's name with its note ("Messages, 2 new"). */
  'portal.sectionNote': (label: string, note: string) => string
  /** PortalShell: the participant menu's button, named with the participant ("Account: Jovana Nikolić"). */
  'portal.menu': (name: string) => string
  // P5.13 / P5.24 ── AttendanceGrid and ClockRecordList
  /** AttendanceGrid: the header of the row headers' column, when the application gives none. */
  'attendance.rows': string
  /** The names of a weekend and of a holiday column, for assistive technology and the tooltip. */
  'attendance.weekend': string
  'attendance.holiday': string
  /** The visible marks of a holiday column, and of a weekend column without a date. */
  'attendance.holidayMark': string
  'attendance.weekendMark': string
  /** An empty cell, for assistive technology. */
  'attendance.noEntry': string
  /** Hours, already written by `format.number`: "8 h". */
  'attendance.hours': (hoursText: string) => string
  /** The bulk marks of a column ("Mark everyone: Present") and of a row ("Mark all: Present"). */
  'attendance.markColumn': (code: string) => string
  'attendance.markRow': (code: string) => string
  /** The code buttons' group, which marks the selection. */
  'attendance.markWith': string
  /** The toolbar's commands. */
  'attendance.clear': string
  'attendance.fill': string
  'attendance.fillKey': string
  /** Why filling waits: a selection of one cell. */
  'attendance.fillReason': string
  'attendance.copyWeek': string
  /** The number of selected cells, numbers already written by `format.number`. */
  'attendance.selected': (count: number, countText: string) => string
  /** The keyboard instructions, read with the grid. */
  'attendance.instructions': string
  /** A locked grid's line: the title before the application's reason. */
  'attendance.locked': string
  /** The correction of a locked cell: the button, the dialog and its fields. */
  'attendance.correct': string
  'attendance.current': string
  'attendance.code': string
  'attendance.noCode': string
  'attendance.hoursLabel': string
  'attendance.reason': string
  'attendance.saveCorrection': string
  /** A corrected cell: who, when (already written by `format.dateTime`) and why. */
  'attendance.corrected': (by: string, when: string, reason: string) => string
  /** The entry before the correction, already written as text. */
  'attendance.original': (entry: string) => string
  /** The heading of the list of corrections under the grid. */
  'attendance.corrections': string
  /** Phones: one person per screen. */
  'attendance.position': (
    index: number,
    indexText: string,
    total: number,
    totalText: string,
  ) => string
  'attendance.previousRow': string
  'attendance.nextRow': string
  'attendance.chooseRow': string
  /** ClockRecordList: the column headers. */
  'clock.person': string
  'clock.date': string
  'clock.in': string
  'clock.out': string
  'clock.duration': string
  'clock.source': string
  'clock.correction': string
  /** A duration in hours, already written by `format.number`. */
  'clock.hours': (hoursText: string) => string
  /** A record without a clock-out or without a clock-in, in words (never 0). */
  'clock.noClockOut': string
  'clock.noClockIn': string
  /** A clock-out on the day after the clock-in (a night shift). */
  'clock.nextDay': string
  /** Before a corrected record's original time, for assistive technology. */
  'clock.was': string
  /** Who corrected a record, when (already written by `format.dateTime`) and why. */
  'clock.corrected': (by: string, when: string, reason: string) => string
  /** The correction: the action, the drawer's title and its fields. */
  'clock.correct': string
  'clock.correctTitle': string
  'clock.time': string
  'clock.timeInvalid': string
  'clock.reason': string
  'clock.save': string
  // P5.8 Calendar and scheduling
  /** CalendarView: the button that goes to the period holding the provider's `today`. */
  'calendar.today': string
  /** CalendarView: the names of the previous and next buttons, by the view shown. */
  'calendar.previous': (view: 'day' | 'week' | 'month' | 'agenda') => string
  'calendar.next': (view: 'day' | 'week' | 'month' | 'agenda') => string
  /** CalendarView: the name of the view switcher, and of each view. */
  'calendar.view': string
  'calendar.day': string
  'calendar.week': string
  'calendar.month': string
  'calendar.agenda': string
  /** CalendarView: the month view's title from the month's name and the year ("October 2026"). */
  'calendar.monthTitle': (monthName: string, yearText: string) => string
  /** A range of dates or times: "12.10.2026. – 18.10.2026.", "09:00 – 09:30". */
  'calendar.range': (startText: string, endText: string) => string
  /** An event that lasts whole days. */
  'calendar.allDay': string
  /** A month cell's "+N more" line, and its accessible name with the day. */
  'calendar.more': (count: number, countText: string) => string
  'calendar.moreLabel': (count: number, countText: string, dateText: string) => string
  /** The day list's button that shows the day in the day view. */
  'calendar.openDay': string
  /** The agenda when the period has no events. */
  'calendar.noEvents': string
  /** An event's accessible name: its title, its time ("09:00 – 09:30" or all day) and its day. */
  'calendar.eventLabel': (title: string, timeText: string, dateText: string) => string
  /** The time grid's description for keyboard users. */
  'calendar.instructions': string
  /** A day marked as today (the day list, the agenda, the timetable). */
  'calendar.todayMark': string
  /** ResourceSchedule: the label of the phones' row chooser. */
  'schedule.resource': string
  /** ResourceSchedule: a booking's accessible name: title, row and time. */
  'schedule.bookingLabel': (title: string, resource: string, timeText: string) => string
  /** ResourceSchedule: how to move a booking with the keyboard (each booking's description). */
  'schedule.instructions': string
  /** ResourceSchedule announcements while a booking is moved with the keyboard. */
  'schedule.lifted': (title: string, resource: string, timeText: string) => string
  'schedule.moved': (title: string, resource: string, timeText: string) => string
  'schedule.dropped': (title: string, resource: string, timeText: string) => string
  'schedule.cancelled': (title: string) => string
  /** Added to an announcement when the place overlaps an unavailable time. */
  'schedule.unavailableHere': (reason: string) => string
  /** An unavailable time for assistive technology ("Unavailable: Lunch break, 12:00 – 12:30"). */
  'schedule.unavailable': (reason: string, timeText: string) => string
  /** The "Move to…" button of a booking (its name), the panel's title, its fields and button. */
  'schedule.moveTo': (title: string) => string
  'schedule.moveToTitle': string
  'schedule.day': string
  'schedule.start': string
  'schedule.move': string
  /** ResourceSchedule over several days: a booking's day and time ("Thu 15.10.2026., 09:00 – 09:30"). */
  'schedule.when': (dateText: string, timeText: string) => string
  /** A start time in the "Move to…" list that overlaps an unavailable time. */
  'schedule.optionUnavailable': (timeText: string, reason: string) => string
  /** SlotPicker: nothing free in the period. */
  'slots.none': string
  'slots.noneDescription': string
  /** SlotPicker: the name of the skeleton while slots load. */
  'slots.loading': string
  /** SlotPicker: a slot's accessible name: its time, its day, and its resource when grouped. */
  'slots.slotLabel': (timeText: string, dateText: string, resource: string | null) => string
  /** Timetable: the corner header over the periods, a free period. */
  'timetable.period': string
  'timetable.free': string
  /** Timetable: the label of the phones' day switcher. */
  'timetable.day': string
  // P5.10 / P5.11 touch, POS and warehouse
  /** PosShell: the status strip (its region, the register and the cashier), the queue, products. */
  'pos.status': string
  'pos.register': string
  'pos.cashier': string
  'pos.queued': (count: number, countText: string) => string
  'pos.products': string
  /** ProductGrid: the categories, "All", and a category without products. */
  'pos.categories': string
  'pos.allProducts': string
  'pos.noProducts': string
  'pos.noProductsDescription': string
  /** NumericKeypad: the group and the keys that are not digits. */
  'keypad.label': string
  'keypad.decimal': string
  'keypad.backspace': string
  'keypad.clear': string
  'keypad.enter': string
  /** CartPanel: the title, the count, the empty state, a line's controls, the total, the action. */
  'cart.title': string
  'cart.count': (count: number, countText: string) => string
  'cart.empty': string
  'cart.emptyDescription': string
  'cart.quantity': (name: string) => string
  'cart.remove': (name: string) => string
  'cart.each': (priceText: string) => string
  'cart.total': string
  'cart.charge': (amountText: string) => string
  /** PaymentDialog: the amounts, the methods, the card terminal and the end. */
  'payment.title': string
  'payment.due': string
  'payment.method': string
  'payment.cash': string
  'payment.card': string
  'payment.split': string
  'payment.tendered': string
  'payment.exact': string
  'payment.quickAmounts': string
  'payment.change': string
  'payment.remaining': string
  'payment.paid': string
  'payment.part': string
  'payment.addCash': string
  'payment.addCard': string
  'payment.cardStart': string
  'payment.cardWaiting': string
  'payment.cardWaitingHint': string
  'payment.cardCancel': string
  'payment.cardDeclined': string
  'payment.cardRetry': string
  'payment.cardApproved': string
  'payment.complete': string
  'payment.done': string
  /** ReceiptPreview: its name. */
  'receipt.title': string
  /** ScanField: the camera button and the words before a result for assistive technology. */
  'scan.camera': string
  'scan.success': string
  'scan.error': string
  /** QuantityStepper: the buttons and the limits. */
  'quantity.decrease': string
  'quantity.increase': string
  'quantity.belowMin': (minText: string) => string
  'quantity.aboveMax': (maxText: string) => string
  /** PickList and StockCount: changes kept on the device while offline. */
  'queue.waiting': (count: number, countText: string) => string
  /** PickList: progress, the current line and its steps, skipping, the route and its states. */
  'pick.progress': (done: number, doneText: string, total: number, totalText: string) => string
  'pick.progressLabel': string
  'pick.current': string
  'pick.location': string
  'pick.item': string
  'pick.toPick': string
  'pick.pickedOf': (pickedText: string, totalText: string) => string
  'pick.steps': string
  'pick.stepLocation': string
  'pick.stepItem': string
  'pick.stepQuantity': string
  'pick.stepDone': string
  'pick.scanLocation': string
  'pick.scanItem': string
  'pick.quantity': string
  'pick.confirm': string
  'pick.skip': string
  'pick.skipMessage': string
  'pick.route': string
  'pick.open': string
  'pick.picked': string
  'pick.short': string
  'pick.skipped': string
  'pick.allDone': string
  'pick.allDoneDescription': string
  'pick.finish': string
  'pick.empty': string
  'pick.emptyDescription': string
  /** StockCount: the location, the item being counted, the counted items and their differences. */
  'count.location': string
  'count.scanLocation': string
  'count.scanItem': string
  'count.noLocation': string
  'count.changeLocation': string
  'count.current': string
  'count.quantity': string
  'count.counted': string
  'count.expected': string
  'count.difference': string
  'count.items': string
  'count.noItems': string
  'count.noItemsDescription': string
  'count.finish': string
  // P5.15 / P5.12
  /** PrintPage: the page number in the bottom margin of every printed page ("Page 1 of 3"). */
  'print.pageNumber': (page: string, pages: string) => string
  /** PrintPage: the marker of a draft, at the top of the first page and across every page. */
  'print.draft': string
  /** PrintPage: a place and a date under a printed document ("Novi Sad, 10.10.2026."). */
  'print.placeAndDate': (place: string, date: string) => string
  /** CoursePage: names the outline (its navigation, the phone's button and drawer). */
  'course.outline': string
  /** CoursePage: the progress to completion ("7 of 12 lessons"). */
  'course.progress': (done: number, total: number, doneText: string, totalText: string) => string
  /** CoursePage: names the progress bar. */
  'course.progressLabel': string
  /** CoursePage: a module's lessons done ("3 of 4 done"). */
  'course.moduleProgress': (doneText: string, totalText: string) => string
  /** CoursePage: a lesson's state in the outline. */
  'course.done': string
  'course.locked': string
  /** CoursePage: a locked lesson's reason after the state ("Locked: finish module 1 first"). */
  'course.lockedReason': (reason: string) => string
  /** CoursePage: the action under a lesson, and the state once done. */
  'course.markDone': string
  'course.lessonDone': string
  /** CoursePage: the lesson pager at the bottom, and its navigation's name. */
  'course.previous': string
  'course.next': string
  'course.pager': string
  /** CoursePage: a course without lessons. */
  'course.empty': string
  'course.emptyDescription': string
  /** CoursePage: the completion block and its certificate. */
  'course.completed': string
  'course.downloadCertificate': string
  'course.certificatePreview': string
  /** QuizResult: the score ("8 of 10 correct"), the outcome and the answers' review. */
  'quiz.score': (correct: number, total: number, correctText: string, totalText: string) => string
  'quiz.passed': string
  'quiz.failed': string
  'quiz.review': string
  'quiz.correct': string
  'quiz.incorrect': string
  'quiz.yourAnswer': (answer: string) => string
  'quiz.correctAnswer': (answer: string) => string
  // P5.22 ── RichTextField and RichText
  /** Names the formatting toolbar of a rich text field. */
  'richText.toolbar': string
  /** The menu of block styles, and its three choices. */
  'richText.textStyle': string
  /** The style menu's button: "Text style: Normal text". */
  'richText.textStyleCurrent': (style: string) => string
  'richText.paragraph': string
  'richText.heading': string
  'richText.subheading': string
  /** The toolbar's toggles (their names and tooltips). */
  'richText.bold': string
  'richText.italic': string
  'richText.underline': string
  'richText.bulletList': string
  'richText.numberedList': string
  'richText.link': string
  'richText.clearFormatting': string
  /** The menu of merge fields, and the list "{{" opens. */
  'richText.insertMergeField': string
  'richText.mergeFields': string
  /** A merge field's pill, for assistive technology: "Merge field: Customer name". */
  'richText.mergeField': (label: string) => string
  /** The link dialog: its address field, hint, error and actions. */
  'richText.linkAddress': string
  'richText.linkHint': string
  'richText.linkInvalid': string
  'richText.linkApply': string
  'richText.linkRemove': string
  /** The counter under a field with `maxLength`: "120 / 2000"; the numbers written by `format.number`. */
  'richText.count': (countText: string, limitText: string) => string
  /** The counter for assistive technology: "120 of 2000 characters". */
  'richText.countLabel': (countText: string, limitText: string) => string
  /** Over the limit: "20 characters too many". */
  'richText.overLimit': (count: number, countText: string) => string
  // P5.25 RoomRack
  /** RoomRack: the search field's name and placeholder (it matches a number or a name). */
  'rack.search': string
  /** RoomRack: the names of the two groups of state chips. */
  'rack.occupancy': string
  'rack.housekeeping': string
  /** RoomRack, while a filter is set: "12 of 40 shown"; the numbers written by `format.number`. */
  'rack.shown': (shown: number, total: number, shownText: string, totalText: string) => string
  /** RoomRack: nothing matches the filter, and its action. */
  'rack.noMatches': string
  'rack.noMatchesDescription': string
  'rack.clearFilters': string
  /** RoomRack: no rooms at all. */
  'rack.empty': string
  'rack.emptyDescription': string
  /** RoomRack: how to move between the tiles (the description of the tile in the tab order). */
  'rack.instructions': string
  // P5.25 FloorPlan
  /** The Plan / List switch, and its two choices. */
  'floorPlan.view': string
  'floorPlan.plan': string
  'floorPlan.list': string
  /** The zoom buttons' group and their names. */
  'floorPlan.zoom': string
  'floorPlan.zoomIn': string
  'floorPlan.zoomOut': string
  'floorPlan.zoomFit': string
  /** Names the legend of the states. */
  'floorPlan.legend': string
  /** An item's capacity with its noun: "4 seats"; the number written by `format.number`. */
  'floorPlan.capacity': (count: number, countText: string) => string
  /** An item's accessible name: "Table 7, 19:30 · 4 guests, Reserved, 4 seats, Sala". */
  'floorPlan.itemName': (label: string, details: readonly string[]) => string
  /** A warning or a problem in words: "Warning: Overlaps Table 6". */
  'floorPlan.warning': (text: string) => string
  'floorPlan.problem': (text: string) => string
  /** The warnings' summary, its "Go to" and that button's name. */
  'floorPlan.warnings': string
  'floorPlan.goTo': string
  'floorPlan.goToItem': (label: string) => string
  /** The list's group of items in no area. */
  'floorPlan.noArea': string
  /** How the keys work, for assistive technology: choosing, and edit mode. */
  'floorPlan.instructions': string
  'floorPlan.editInstructions': string
  /** Announcements while an item is moved with the keys; x and y written by `format.number`. */
  'floorPlan.picked': (label: string, x: string, y: string) => string
  'floorPlan.moved': (label: string, x: string, y: string) => string
  'floorPlan.dropped': (label: string, x: string, y: string) => string
  'floorPlan.cancelled': (label: string) => string
  /** Announced when the palette adds an item. */
  'floorPlan.added': (label: string) => string
  /** The palette's label. */
  'floorPlan.add': string
  /** The chosen item's actions: their group's name and the buttons. */
  'floorPlan.itemActions': (label: string) => string
  'floorPlan.chosen': (count: number, countText: string) => string
  'floorPlan.moveTo': string
  'floorPlan.size': string
  'floorPlan.rotate': string
  'floorPlan.duplicate': string
  'floorPlan.remove': string
  /** The "Move to…" and "Size…" dialogs: titles, hint, fields, buttons and the range error. */
  /** The "Move to…" and "Size…" dialogs' titles: the action; the item is their subject (P5.28). */
  'floorPlan.moveTitle': string
  'floorPlan.sizeTitle': string
  'floorPlan.unitsHint': string
  'floorPlan.x': string
  'floorPlan.y': string
  'floorPlan.width': string
  'floorPlan.height': string
  'floorPlan.move': string
  'floorPlan.apply': string
  'floorPlan.outOfRange': (minText: string, maxText: string) => string
  /** A plan without items. */
  'floorPlan.empty': string
  'floorPlan.emptyDescription': string
  'floorPlan.emptyEditing': string
  // P5.25 SeatingChart
  /** The guest list's title, its count ("112 of 140 seated") and its search. */
  'seating.guests': string
  'seating.count': (seatedText: string, totalText: string) => string
  'seating.search': string
  /** The group of guests without a seat. */
  'seating.notSeated': string
  /** A table's taken seats: "8 of 10". */
  'seating.tableCount': (takenText: string, seatsText: string) => string
  /** A seat's name: "Table 3, seat 4". */
  'seating.seatName': (table: string, seatText: string) => string
  /** The seats' two states. */
  'seating.free': string
  'seating.taken': string
  /** Announcements of a seating reported. */
  'seating.seated': (name: string, seat: string) => string
  'seating.unseated': (name: string) => string
  /** An empty guest list, and a search that finds no one. */
  'seating.noGuests': string
  'seating.noGuestsDescription': string
  'seating.noMatch': string
  'seating.noMatchDescription': string
  /** A guest's menu: its name and entries. */
  'seating.guestActions': (name: string) => string
  'seating.seatAt': string
  'seating.unseat': string
  /** A seat's dialog: who sits there, and the list to choose from. */
  'seating.seatedHere': string
  'seating.chooseGuest': string
  /** "Seat at…": title, fields, the button, free seats and a full table. */
  /** "Seat at…": the action; the guest is the dialog's subject (P5.28). */
  'seating.seatAtTitle': string
  'seating.table': string
  'seating.seat': string
  'seating.seatButton': string
  'seating.freeSeats': (count: number, countText: string) => string
  'seating.tableFull': string
  /** An empty seat in a table's list. */
  'seating.emptySeat': string
  // P5.26 ── Diagram
  /** The kinds of step, as the palette, the steps list and the accessible names say them. */
  'diagram.start': string
  'diagram.end': string
  'diagram.task': string
  'diagram.userTask': string
  'diagram.serviceTask': string
  'diagram.subProcess': string
  'diagram.timer': string
  'diagram.message': string
  'diagram.exclusive': string
  'diagram.parallel': string
  /** A step's states in a run, in words beside their icons. */
  'diagram.done': string
  'diagram.running': string
  'diagram.waiting': string
  'diagram.failed': string
  'diagram.skipped': string
  'diagram.notReached': string
  /** A step's accessible name: "User task: Approve the invoice". */
  'diagram.stepName': (kind: string, label: string) => string
  /** The lane a step stands in: "Lane: Accounting". */
  'diagram.inLane': (lane: string) => string
  /** A connection's accessible name: "Connection from Check to Approve". */
  'diagram.connectionName': (from: string, to: string) => string
  /** The default flow out of a gateway. */
  'diagram.defaultFlow': string
  /** How the keyboard works, the steps' and the connections' description. */
  'diagram.instructions': string
  'diagram.editInstructions': string
  'diagram.connectionInstructions': string
  /** The view's controls. */
  'diagram.zoomIn': string
  'diagram.zoomOut': string
  'diagram.fitView': string
  'diagram.minimap': string
  /** The switch between the diagram and its steps as a list. */
  'diagram.showSteps': string
  'diagram.showDiagram': string
  /** The steps list: what follows a step ("Next: Approve, Reject"). */
  'diagram.next': (steps: string) => string
  /** The problems' heading ("3 problems") and the button that shows one. */
  'diagram.problems': (count: number, countText: string) => string
  'diagram.goTo': (label: string) => string
  'diagram.goToButton': string
  /** A step that follows, with its condition: "Approve (Above 100,000 RSD)". */
  'diagram.nextStep': (label: string, condition: string | undefined) => string
  /** A run's summary: "4 of 7 steps done"; the numbers written by `format.number`. */
  'diagram.runSummary': (done: number, total: number, doneText: string, totalText: string) => string
  'diagram.failedCount': (count: number, countText: string) => string
  /** A diagram without steps; in edit, how to begin. */
  'diagram.empty': string
  'diagram.emptyEdit': string
  'diagram.loading': string
  'diagram.error': string
  'diagram.retry': string
  /** On a phone, in place of editing. */
  'diagram.editOnLargerScreen': string
  /** The palette of kinds and its hint. */
  'diagram.palette': string
  'diagram.paletteHint': string
  /** The palette's entries: "Add: User task". */
  'diagram.addKind': (kind: string) => string
  /** What can be done with the chosen step or connection. */
  'diagram.chooseHint': string
  'diagram.addStepAfter': string
  'diagram.connectTo': string
  'diagram.rename': string
  'diagram.labelConnection': string
  'diagram.remove': string
  /** The dialogs: rename a step, connect it, label a connection. */
  'diagram.renameTitle': string
  'diagram.name': string
  'diagram.save': string
  'diagram.connectTitle': string
  'diagram.connectTarget': string
  'diagram.connectLabel': string
  'diagram.connect': string
  'diagram.noTargets': string
  'diagram.labelTitle': string
  'diagram.condition': string
  /** Announcements, after each change. */
  'diagram.added': (label: string) => string
  'diagram.removed': (label: string) => string
  'diagram.connected': (from: string, to: string) => string
  'diagram.chosen': (label: string) => string
  'diagram.released': (label: string) => string
  'diagram.moved': (label: string) => string
  'diagram.renamed': (label: string) => string
  'diagram.labelled': (label: string) => string
  /** A run step's name with its state: "Import the savings account: Failed". */
  'diagram.stepState': (label: string, state: string) => string
  /** A run step's action, named with its step: "Retry: Import the savings account". */
  'diagram.stepAction': (action: string, label: string) => string
  /** The label dialog's checkbox for a decision's connection. */
  'diagram.defaultWay': string
  // P5.27 legal search
  /** The name of the search results' list. */
  'legalSearch.results': string
  /** How many acts were found: "128 results", "More than 10.000 results" (not exact). */
  'legalSearch.count': (count: number, text: string, exact: boolean) => string
  /** The sort button: "Sort: Relevance". */
  'legalSearch.sortBy': (label: string) => string
  /** The link to the article a result matched in: "Found in Article 57". */
  'legalSearch.foundIn': (article: string) => string
  /** A result's gazette references after the gazette's name: "Illustrative Gazette No. 12/2016, 47/2018". */
  'legalSearch.gazette': (gazette: string, numbers: string) => string
  /** "Try again" after the search failed. */
  'legalSearch.retry': string
  /** GazetteIssues: an issue's day, its number of acts, "Show more issues", the empty state. */
  'gazette.published': (date: string) => string
  'gazette.acts': (count: number, text: string) => string
  'gazette.showMore': string
  'gazette.emptyTitle': string
  'gazette.emptyDescription': string
  // P5.27 legal text
  /** An article's copy-link button: "Copy link to Article 5"; the confirmation and the failure. */
  'legal.copyLink': (label: string) => string
  'legal.linkCopied': string
  'legal.copyFailed': string
  /** An article's menu (phones, or the application's actions): "Actions for Article 5". */
  'legal.articleActions': (label: string) => string
  /** The menu entries that select an article (the side panel narrows to it) and clear it. */
  'legal.select': string
  'legal.clearSelection': string
  /** A change mark: "Amended by No. 47/2018 · applies from 01.07.2018."; the label is data. */
  'legal.change': (label: string, date: string) => string
  /** An article not yet in force: "Applies from 01.01.2027.". */
  'legal.appliesFrom': (date: string) => string
  /** A deleted article's earlier text, collapsed. */
  'legal.showText': string
  'legal.hideText': string
  /** The footnotes' heading and a footnote mark's name: "Footnote 1". */
  'legal.footnotes': string
  'legal.footnote': (mark: string) => string
  /** A reference's preview button ("Preview of Article 5"), its missing text, its link. */
  'legal.preview': (text: string) => string
  'legal.previewMissing': string
  'legal.open': (label: string) => string
  /** The in-act search: the field, "3 of 12", no matches, previous and next. */
  'legal.search': string
  'legal.hits': (current: number, total: number, currentText: string, totalText: string) => string
  'legal.noHits': string
  'legal.previousHit': string
  'legal.nextHit': string
  /** The script switch of a Serbian act. */
  'legal.script': string
  'legal.latin': string
  'legal.cyrillic': string
  /** The table of contents: its button, drawer title and tree. */
  'legal.contents': string
  /** Compare: the marks (legend and labels), and the words assistive technology hears before one. */
  'legal.added': string
  'legal.deleted': string
  'legal.changed': string
  'legal.addedMark': string
  'legal.deletedMark': string
  /** Compare: the title, the summary, all or only the changes, the unchanged articles' count. */
  'legal.compareTitle': (from: string, to: string) => string
  'legal.compareSummary': (changed: string, added: string, removed: string) => string
  'legal.showAll': string
  'legal.showChanges': string
  'legal.unchanged': (count: number, countText: string) => string
  'legal.noChanges': string
  // P5.27 legal page
  /** The header's version line: "Version as of 11.10.2026."; the date written by `format.date`. */
  'legalPage.versionAsOf': (date: string) => string
  /** The version picker's label (for assistive technology; the line above names it). */
  'legalPage.version': string
  /** A version in the picker: its from–to range, "(current)" after the version in force. */
  'legalPage.versionOption': (range: string, current: boolean) => string
  /** The header's actions. */
  'legalPage.compareVersions': string
  'legalPage.copyCitation': string
  'legalPage.print': string
  /** Watch for changes, and its "on" state's action. */
  'legalPage.watch': string
  'legalPage.unwatch': string
  /** Bookmark the act, and its "on" state's action. */
  'legalPage.bookmark': string
  'legalPage.unbookmark': string
  /** Phones: the button that opens the side panels as a sheet, and the sheet's title. */
  'legalPage.details': string
  /** The act's text region while it loads. */
  'legalPage.loading': string
  /** The panels' names. */
  'legalPanel.versions': string
  'legalPanel.history': string
  'legalPanel.hierarchy': string
  'legalPanel.references': string
  'legalPanel.practice': string
  'legalPanel.notes': string
  /** A version's days: "01.07.2024. – 30.06.2026.", or "From 01.07.2024." for the current one. */
  'legalPanel.versionRange': (from: string, to: string | undefined) => string
  /** The marker of the version in force, and the words of a version without an amending act. */
  'legalPanel.current': string
  'legalPanel.original': string
  /** Opens the list of the other versions to compare the shown one with. */
  'legalPanel.compareWith': string
  /** An amending act's days. */
  'legalPanel.published': (date: string) => string
  'legalPanel.appliesFrom': (date: string) => string
  /** The label before the articles an amending act changed. */
  'legalPanel.changedArticles': string
  /** The hierarchy's two groups. */
  'legalPanel.higher': string
  'legalPanel.lower': string
  /** The references' two directions. */
  'legalPanel.refersTo': string
  'legalPanel.referredBy': string
  /** The practice filter: its label and the choice of every article. */
  'legalPanel.filterByArticle': string
  'legalPanel.allArticles': string
  /** A note's kind, a note on the whole act, and the button that adds a note. */
  'legalPanel.note': string
  'legalPanel.bookmark': string
  'legalPanel.wholeAct': string
  'legalPanel.addNote': string
  /** What a panel says when it has nothing to show. */
  'legalPanel.noVersions': string
  'legalPanel.noChanges': string
  'legalPanel.noHierarchy': string
  'legalPanel.noReferences': string
  'legalPanel.noPractice': string
  'legalPanel.noNotes': string
  /**
   * The panel narrowed to one article: "Article 57: changed twice, 3 court decisions, 1 opinion".
   * The counts as numbers (for plural rules) and as `format.number` writes them.
   */
  'legalPanel.articleSummary': (
    article: string,
    counts: { changes: number; decisions: number; opinions: number },
    texts: { changes: string; decisions: string; opinions: string },
  ) => string
  /** Leaves the narrowed panel. */
  'legalPanel.backToAct': string
  /** The printout's footnotes heading. */
  'legalPrint.footnotes': string
  // P5.25a FloorPlan
  /** An item's level in words, from the formatted percentage: "62,5% full". */
  'floorPlan.level': (percentText: string) => string
  // P5.28 docs
  /** The switch that shows the previous period under each value: "Compare with August 2026". */
  'statutory.compareWith': (period: string) => string
  /** Beside the switch while comparing: "September 2026, with August 2026 under each amount". */
  'statutory.comparing': (current: string, previous: string) => string
  /** Names a previous value for assistive technology, before the amount: "August 2026:". */
  'statutory.previousValue': (period: string) => string
  /**
   * A printed document's one prominent line, from the amount as `format.money` writes it and the
   * due date as `format.date` writes it (none: no date): "5.003.678,22 RSD due 21.10.2026.".
   */
  'print.amountDue': (amount: string, date: string | undefined) => string
  /** The button in an empty electronic signature field on screen (left off the paper). */
  'print.signHere': string
  // P5.28 dates
  /** The "now" marker of the time grids (CalendarView, ResourceSchedule, Timetable): "Now, 10:05". */
  'schedule.now': (timeText: string) => string
  // P5.28 screens
  /** MaskedValue: the start of the note that the access is recorded ("Access is logged."). */
  'masked.loggedTitle': string
  /** ClockRecordList: the correction drawer's record, under its title: "Nenad Ilić, 07.10.2026.". */
  'clock.correctSubject': (person: string, date: string) => string
  /** ChangeConfirmDialog: its Save button, and the same while a message is checked. */
  'change.save': string
  'change.saveAndNotify': string
  /** ChangeConfirmDialog: names the list of changes (old → new). */
  'change.changes': string
  /** ChangeConfirmDialog: before who the change concerns ("Concerns:"). */
  'change.affected': string
  /** ChangeConfirmDialog: names the group of "Notify …" checkboxes. */
  'change.notifyGroup': string
  /** FileDropzone on phones: the button that takes a photo with the camera. */
  'file.takePhoto': string
  /** AttendanceGrid: the correction dialog's action and record, "Nenad Ilić, Wed 7" (P5.28 item 6). */
  'attendance.correctAction': string
  'attendance.correctSubject': (row: string, column: string) => string
  /** ShiftPlanner: the move dialog's action; the shift goes under it (P5.28 item 6). */
  'shifts.moveAction': string
  /** PickList: the skip dialog's action; the item goes under it (P5.28 item 6). */
  'pick.skipAction': string
  // P5.28 left
  /** ShiftPlanner's move dialog: the shift it moves, under the action ("Morning · Ana Petrović, …"). */
  'shifts.moveSubject': (label: string, name: string, dayText: string) => string
  /** ShiftPlanner: the publish button while a message is checked (P5.28 item 9). */
  'shifts.publishAndNotify': string
  'shifts.publishChangesAndNotify': string
  // P5.28 pos
  /** A way to pay by a code the customer scans (an instant payment): start, wait, outcome. */
  'payment.qrStart': string
  'payment.qrWaiting': string
  'payment.qrHint': string
  'payment.qrCancel': string
  'payment.qrDeclined': string
  'payment.qrApproved': string
  /** The code's name for assistive technology. */
  'payment.qrCode': string
  /** Adds the keypad's amount as one more payment of the chosen way. */
  'payment.addPart': string
  /** Removes a part paid: "Remove Voucher". */
  'payment.removePart': (label: string) => string
  /** A cart line's edit button: "Edit Kapućino". */
  'cart.edit': (name: string) => string
  /** The till's queue could not be sent. */
  'pos.queueFailed': string
  /** ReceiptKindPicker's groups and a kind that cannot be chosen ("Copy: needs …"). */
  'receiptKind.type': string
  'receiptKind.transaction': string
  'receiptKind.unavailable': (label: string, reason: string) => string
  /** BuyerField's legend and parts. */
  'buyer.title': string
  'buyer.type': string
  'buyer.id': string
  'buyer.optionalType': string
  'buyer.optional': string
  /** ReceiptFinder: scan, search by number, date and total, the results. */
  'receiptFinder.scan': string
  'receiptFinder.searchBy': string
  'receiptFinder.orSearchBy': string
  'receiptFinder.number': string
  'receiptFinder.date': string
  'receiptFinder.total': string
  'receiptFinder.search': string
  'receiptFinder.results': string
  'receiptFinder.none': string
  'receiptFinder.noneDescription': string
  /** LineQuantityPicker: every line, "of 3 pc", the figure for what is chosen. */
  'lines.all': string
  'lines.of': (quantityText: string) => string
  'lines.chosenTotal': string
  /** AdvanceList. */
  'advances.title': string
  'advances.count': (count: number, countText: string) => string
  'advances.paidOn': (dateText: string) => string
  'advances.open': string
  'advances.paid': (amountText: string) => string
  'advances.choose': (number: string) => string
  'advances.refund': (number: string) => string
  'advances.chosenTotal': string
  'advances.empty': string
  /** ReceiptResult. */
  'receiptResult.title': string
  'receiptResult.waiting': string
  'receiptResult.code': string
  'receiptResult.deliver': string
  'receiptResult.sending': string
  'receiptResult.sent': string
  'receiptResult.failed': string
  // P5.28 floor
  /** FloorPlan's area switcher (P5.28 item 26). */
  'floorPlan.area': string
  'floorPlan.allAreas': string
  /** FloorPlan with `editing` on a phone (P5.28 item 27). */
  'floorPlan.editOnLarger': string
  /** SeatingChart's seat dialog: the action; the seat is its subject (P5.28 item 6). */
  'seating.seatTitle': string
  // P5.29 admin
  /** HealthList: the times under a monitored thing's figures, an action's name, nothing. */
  'health.lastSuccess': string
  'health.lastError': string
  'health.errorMessage': string
  'health.never': string
  'health.empty': string
  'health.actionNamed': (actionText: string, name: string) => string
  // P5.29 agent
  /**
   * SlaTimer (P5.30): a deadline in words. The texts are already written: `durationText` by
   * `sla.duration`, the numbers by `format.number`.
   */
  'sla.dueIn': (durationText: string) => string
  'sla.overdueBy': (durationText: string) => string
  /** Overdue, less than a minute after the deadline. */
  'sla.overdue': string
  'sla.paused': string
  'sla.met': string
  'sla.missedBy': (durationText: string) => string
  /**
   * A duration for display ("2 h 15 min", "40 min", "1 d 3 h"): the parts `durationParts` keeps,
   * the others are 0.
   */
  'sla.duration': (
    days: number,
    daysText: string,
    hours: number,
    hoursText: string,
    minutes: number,
    minutesText: string,
  ) => string
  /** The due instant under the words; `text` is the date and time ("14.10.2026. 10:30"). */
  'sla.dueAt': (text: string) => string
  /** The deadline's name before its words ("First response:"). */
  'sla.labelled': (label: string) => string
  /** A message only the team sees (MessageBubble `internal`): its visible mark. */
  'message.internal': string
  /** ReplyComposer (P5.30): its two modes, their group and the note's hint. */
  'composer.modes': string
  'composer.reply': string
  'composer.note': string
  'composer.noteHint': string
  /** The send button in each mode. */
  'composer.send': string
  'composer.addNote': string
  /** Ctrl/Cmd+Enter sends. */
  'composer.sendHint': string
  /** The saved replies' button, its search and its empty list. */
  'composer.savedReplies': string
  'composer.findSavedReply': string
  /** Attaching files to the message. */
  'composer.attach': string
  /** Asking the application for a link to insert (its own search). */
  'composer.insertLink': string
  // P5.29 portal
  /** SatisfactionRating (P5.30 d): the comment, Send, the missing choice and the thanks. */
  'rating.comment': string
  'rating.send': string
  'rating.required': string
  'rating.thanks': string
  'rating.given': (valueText: string, label: string) => string
  /** HelpfulFeedback (P5.30 e): "Was this helpful?", the answers, what was missing, the thanks. */
  'helpful.question': string
  'helpful.yes': string
  'helpful.no': string
  'helpful.thanks': string
  'helpful.why': string
  'helpful.send': string
  'helpful.commentThanks': string
  /** LinkSuggestions (P5.30 d): the count announced while the user types, and the search. */
  'suggestions.count': (count: number, countText: string) => string
  'suggestions.searching': string
  /** PageContents (P5.30 e). */
  'pageContents.title': string
  /** SearchResultList (P5.30 e): the count over the results, and Try again. */
  'searchResults.count': (count: number, countText: string) => string
  'searchResults.retry': string
  // P5.34 ai
  /** The assistant (P5.34): the AI-generated mark on every answer. */
  'assistant.generated': string
  /** An answer's states: nothing written yet, being written, Stop, stopped, Try again. */
  'assistant.thinking': string
  'assistant.writing': string
  'assistant.stop': string
  'assistant.stopped': string
  'assistant.retry': string
  /** The records an answer came from. */
  'assistant.sources': string
  /** The suggested follow-up questions under an answer. */
  'assistant.followUps': string
  /** Reporting a wrong answer: the button, the dialog's title, text and button, the thanks. */
  'assistant.report': string
  'assistant.reportTitle': string
  'assistant.reportMessage': string
  'assistant.reportSend': string
  'assistant.reported': string
  /** A proposed action: its mark, the note that it waits, its buttons and its outcomes. */
  'assistant.proposed': string
  'assistant.waits': string
  'assistant.confirm': string
  'assistant.dismiss': string
  'assistant.running': string
  'assistant.dismissed': string
  /** The question box: its name, the ask button and the keys. */
  'assistant.question': string
  'assistant.ask': string
  'assistant.askHint': string
  /** The user's question in a conversation, for assistive technology. */
  'assistant.youAsked': string
  /** The conversation's name, suggested and recent questions. */
  'assistant.conversation': string
  'assistant.suggested': string
  'assistant.recent': string
  /** The panel's and the page's buttons. */
  'assistant.newConversation': string
  'assistant.openPage': string
  'assistant.newQuestion': string
  /** The question box under an answer on the "Ask" page. */
  'assistant.followUp': string
  /** EmailPreview (P5.38): its name, the width and mail-client switches, the header's labels. */
  'emailPreview.label': string
  'emailPreview.width': string
  'emailPreview.desktop': string
  'emailPreview.phone': string
  'emailPreview.client': string
  'emailPreview.light': string
  'emailPreview.dark': string
  'emailPreview.from': string
  'emailPreview.to': string
  'emailPreview.subject': string
  /** ArticlePage (P5.39): the related articles, the tags, the date of the last change. */
  'article.related': string
  'article.tags': string
  'article.updated': (dateText: string) => string
  /** ShareLinks (P5.39). */
  'share.label': string
  'share.copy': string
  'share.copied': string
  'share.copyFailed': string
  /** NewsletterSignup (P5.39). */
  'newsletter.email': string
  'newsletter.subscribe': string
  'newsletter.required': string
  'newsletter.invalid': string
  'newsletter.sending': string
  'newsletter.thanks': string
  // P5.31 merge values
  /** A merge field without a value (the values were given): its pill's name. */
  'richText.mergeFieldMissing': (label: string) => string
  /** Under the text: the fields that still have no value, by their labels. */
  'richText.missingValues': (labels: readonly string[]) => string
  // P5.40 QR code and IPS QR
  /** QrCode: a text too long for any QR code. */
  'qr.tooLong': string
  /** An IPS QR problem of a field, by its label (`ipsQrText`'s problems). */
  'ips.problem': (code: IpsProblemCode, label: string, limit?: number) => string
  // P5.37 gantt
  /** Gantt (P5.37): the kinds of a row, before its name ("Phase: Structure"). */
  'gantt.kindPhase': string
  'gantt.kindTask': string
  'gantt.kindMilestone': string
  /** A row's accessible name: its kind and name. */
  'gantt.rowName': (kind: string, label: string) => string
  /** The phase a task stands in, after its name for assistive technology. */
  'gantt.inPhase': (phase: string) => string
  /** A row's progress in words ("60% done"); `percentText` is through `format.percent`. */
  'gantt.done': (percentText: string) => string
  /** The rows a row follows: "After: Excavation, Foundation slab". */
  'gantt.after': (names: string) => string
  /** The table's column headers. */
  'gantt.task': string
  'gantt.progress': string
  'gantt.planned': string
  'gantt.actual': string
  /** A row's menu of edits, named with the row. */
  'gantt.actions': (label: string) => string
  'gantt.move': string
  'gantt.changeDates': string
  'gantt.setProgress': string
  'gantt.dependencies': string
  /** The dialogs' titles: the action; the row goes bold under it (D22). */
  'gantt.moveTitle': string
  'gantt.datesTitle': string
  'gantt.progressTitle': string
  'gantt.dependenciesTitle': string
  /** Move: the new start, and where it will end. */
  'gantt.newStart': string
  'gantt.keepsLength': (endText: string) => string
  /** Change dates: the range of a task, the day of a milestone. */
  'gantt.dates': string
  'gantt.date': string
  /** Set progress: the field and its check. */
  'gantt.doneField': string
  'gantt.progressRange': string
  /** Dependencies: the rows it follows, the new one and how, Add, Remove, the empty lists. */
  'gantt.follows': string
  'gantt.followsNothing': string
  'gantt.addFollows': string
  'gantt.dependencyHow': string
  'gantt.addDependency': string
  'gantt.removeDependency': (name: string) => string
  'gantt.noCandidates': string
  /** The four kinds of dependency in a business user's words. */
  'gantt.finishToStart': string
  'gantt.startToStart': string
  'gantt.finishToFinish': string
  'gantt.startToFinish': string
  /** The dialogs' buttons. */
  'gantt.save': string
  'gantt.moveButton': string
  'gantt.close': string
  /** What was reported, announced politely. */
  'gantt.changedDates': (label: string, datesText: string) => string
  'gantt.changedProgress': (label: string, doneText: string) => string
  'gantt.addedDependency': (to: string, from: string) => string
  'gantt.removedDependency': (to: string, from: string) => string
  /** The views and the scale. */
  'gantt.view': string
  'gantt.timelineView': string
  'gantt.listView': string
  'gantt.scale': string
  'gantt.scaleDays': string
  'gantt.scaleMonths': string
  /** The top row of the days scale: "October 2026". */
  'gantt.monthYear': (month: string, year: string) => string
  /** The timeline's region and how to use it. */
  'gantt.timeline': (label: string) => string
  'gantt.timelineHint': string
  'gantt.dragHint': string
  /** The one "now" marker (D25): "Now, 14.10.2026. 09:40". */
  'gantt.now': (text: string) => string
  /** States. */
  'gantt.empty': string
  'gantt.loading': string
  'gantt.error': string
  'gantt.retry': string
  'gantt.editOnLargerScreen': string
  // P5.36 acct
  /** PlanComparison (P5.36): the current plan's mark, the feature column, included or not. */
  'plan.current': string
  'plan.feature': string
  'plan.included': string
  'plan.notIncluded': string
  /** UsageMeter (P5.36): an amount with its unit, "24 of 30", and an amount without a limit. */
  'usage.amount': (number: string, unit: string) => string
  'usage.ofLimit': (usedText: string, limitText: string) => string
  'usage.noLimit': (usedText: string) => string
  // P5.31 docs
  /** RecognizedField (P5.31): the application's confidence ("Confidence: 98%"). */
  'recognized.confidence': (text: string) => string
  /** A reading the application marks as uncertain. */
  'recognized.low': string
  /** The user changed a value that was read. */
  'recognized.changed': string
  /** The button that highlights where the value was read. */
  'recognized.showSource': string
  /** PageViewer (P5.31): the highlighted region, announced ("Highlighted: Total, page 1 of 2"). */
  'viewer.highlighted': (label: string, pageText: string) => string
  // P5.33 docs
  /** ValueComparison (P5.33): "2 of 5 differ" over the rows. */
  'comparison.count': (count: number, countText: string, total: number, totalText: string) => string
  /** A row's result: the two values are the same, or differ. */
  'comparison.same': string
  'comparison.differs': string
  /** The headings of the first and the last column. */
  'comparison.item': string
  'comparison.result': string
  /** No rows to compare. */
  'comparison.empty': string
  // P5.41 map
  /** AreaMap and LocationCheck (P5.41): how the keyboard moves the map (its description). */
  'map.keys': string
  /** The map's buttons. */
  'map.zoomIn': string
  'map.zoomOut': string
  'map.showAll': string
  /** The map's name for assistive technology: "Map: Illustrative zones of Novi Sad". */
  'map.name': (label: string) => string
  /** The list of areas beside the map, and the legend. */
  'map.areas': string
  'map.legend': string
  /** The area a point falls in: "Falls in: Zone II"; or none. */
  'map.fallsIn': (area: string) => string
  'map.fallsInNone': string
  /** The chosen area, announced. */
  'map.chosen': (area: string) => string
  /** States. */
  'map.empty': string
  'map.loading': string
  'map.error': string
  'map.retry': string
  /** LocationCheck: the four states, as the application decides them. */
  'location.inside': string
  'location.outside': string
  'location.unknown': string
  'location.denied': string
  /** Asking the application for the position, and while it answers. */
  'location.locate': string
  'location.locating': string
  /** The position's facts: its accuracy in metres and when it was taken. */
  'location.accuracy': (metresText: string) => string
  'location.takenAt': (timeText: string) => string
  /** The allowed area and the position, named on the map's list of shapes. */
  'location.allowed': string
  'location.position': string
  /** RegionChart (P5.41, maps in charts): how the keys move between the areas (its description). */
  'map.regionKeys': string
  /** An area without a value (hatched): never 0. */
  'map.noData': string
  /** A legend step's range, the numbers written by `format`: below the first break … */
  'map.stepBelow': (toText: string) => string
  /** … between two breaks … */
  'map.stepBetween': (fromText: string, toText: string) => string
  /** … and from the last break up. */
  'map.stepFrom': (fromText: string) => string
  /** The area the keys reached, announced: "Serbia: 412.000.000 RSD". */
  'map.areaValue': (area: string, valueText: string) => string
  // P5.42 org
  /** HierarchyChart (P5.42): a position without a person. */
  'hierarchy.vacant': string
  /** The toggle under a closed node, and under an open one. */
  'hierarchy.expand': (count: number, countText: string, name: string) => string
  'hierarchy.collapse': (name: string) => string
  /** The search field, and what it found ("2 of 5 found", "5 found", "Nothing found"). */
  'hierarchy.search': string
  'hierarchy.found': (index: number, indexText: string, count: number, countText: string) => string
  'hierarchy.foundCount': (count: number, countText: string) => string
  'hierarchy.notFound': string
  /** Showing one unit alone, the reasons it cannot be, the trail back and the whole chart. */
  'hierarchy.showUnit': string
  'hierarchy.unitReason': string
  'hierarchy.unitShown': string
  'hierarchy.path': string
  'hierarchy.showAll': string
  /** The size buttons. */
  'hierarchy.size': string
  'hierarchy.fit': string
  'hierarchy.actual': string
  /** Loading failed. */
  'hierarchy.retry': string
  // P5.43 files
  /** FileBrowser (P5.43): the quick places and the folder tree, and showing or hiding them. */
  'files.places': string
  'files.folders': string
  'files.showFolders': string
  'files.hideFolders': string
  /** The list and grid views, and the grid's sort menu. */
  'files.view': string
  'files.listView': string
  'files.gridView': string
  'files.sort': string
  /** The columns and facts of a file. */
  'files.name': string
  'files.owner': string
  'files.modified': string
  'files.created': string
  'files.size': string
  'files.type': string
  'files.links': string
  'files.location': string
  'files.retention': string
  'files.tags': string
  /** A folder's type, and its number of items ("12 items"). */
  'files.folder': string
  'files.items': (count: number, countText: string) => string
  /** After a name: shared with others, a favourite. */
  'files.shared': string
  'files.favourite': string
  /** The actions of the view. */
  'files.upload': string
  'files.uploadTitle': string
  'files.chooseFolder': string
  'files.newFolder': string
  'files.details': string
  'files.download': string
  /** One item: its checkbox, its menu, the phone's bottom sheet of actions. */
  'files.select': (name: string) => string
  'files.selectAll': string
  'files.actions': (name: string) => string
  'files.actionsTitle': string
  /** The way back to the parent folder on a phone ("Back to Contracts"). */
  'files.backTo': (folder: string) => string
  /** While searching: in this folder or everywhere. */
  'files.searchScope': string
  'files.searchEverywhere': string
  /** The states. */
  'files.empty': string
  'files.emptyDescription': string
  'files.noResults': string
  'files.noResultsDescription': string
  'files.noAccess': string
  'files.offline': string
  'files.offlineDescription': string
  'files.offlineReason': string
  'files.loadError': string
  'files.retry': string
  /** Dropping files from the computer onto the view. */
  'files.dropHere': (folder: string) => string
  /** Dragging items onto a folder: what moves, where it would land, a cancelled drag. */
  'files.dragging': (count: number, countText: string) => string
  'files.dropInto': (folder: string) => string
  'files.dragCancelled': string
  /** The uploads: "2 of 5 uploaded", clear the finished ones. */
  'files.uploads': string
  'files.uploadCounts': (done: number, doneText: string, total: number, totalText: string) => string
  'files.clearUploads': string
  /** The name of a new folder or a renamed item. */
  'files.nameLabel': string
  /** FilePreview: "3 of 12", the previous and next file, a file without a preview. */
  'files.position': (index: number, indexText: string, total: number, totalText: string) => string
  'files.previous': string
  'files.next': string
  'files.noPreview': string
  'files.noPreviewDescription': string
  /** FileDetails: the panels. */
  'files.versions': string
  'files.activity': string
  'files.signing': string
  'files.sharing': string
  /** FolderPickerDialog: the chosen destination, nothing chosen, and why a folder cannot be. */
  'folderPicker.destination': (path: string) => string
  'folderPicker.none': string
  'folderPicker.moving': string
  'folderPicker.here': string
  /** NameConflictDialog: the question, the three answers, "Apply to all", the progress. */
  'conflict.title': string
  'conflict.message': (folder: string) => string
  'conflict.choice': string
  'conflict.replace': string
  'conflict.replaceHint': string
  'conflict.keepBoth': string
  'conflict.keepBothHint': (name: string) => string
  'conflict.skip': string
  'conflict.skipHint': string
  'conflict.existing': string
  'conflict.incoming': string
  'conflict.applyToAll': (count: number, countText: string) => string
  'conflict.progress': (
    index: number,
    indexText: string,
    total: number,
    totalText: string,
  ) => string
  'conflict.continue': string
  'conflict.cancel': string
  /** ShareDialog: adding people, who has access, the link. */
  'sharing.title': string
  'sharing.add': string
  'sharing.level': string
  'sharing.addButton': string
  'sharing.who': string
  'sharing.onlyYou': string
  'sharing.owner': string
  'sharing.levelOf': (name: string) => string
  'sharing.remove': (name: string) => string
  'sharing.link': string
  'sharing.linkNone': string
  'sharing.createLink': string
  'sharing.linkAddress': string
  'sharing.expires': string
  'sharing.never': string
  'sharing.expiresTooSoon': string
  'sharing.password': string
  'sharing.passwordSet': string
  'sharing.revokeLink': string
  'sharing.revokeTitle': string
  'sharing.revokeMessage': string
  'sharing.done': string
  /** VersionList: the current version, restore, download, upload a new one, none. */
  'versions.current': string
  'versions.restore': string
  'versions.restoreOf': (label: string) => string
  'versions.restoreTitle': string
  'versions.restoreMessage': string
  'versions.download': (label: string) => string
  'versions.upload': string
  'versions.empty': string
  /** FileNameDialog: an empty name. */
  'files.nameRequired': string
  /** ShareDialog: saves the link's password. */
  'sharing.setPassword': string
  // ── P5.66 records ──
  /** DefinedForm: a required value missing — a value to write, an option to choose, a box to tick. */
  'definedForm.fill': string
  'definedForm.choose': string
  'definedForm.tick': string
  // P5.77 pivot
  /** Pivot: the field chooser, its areas and the field's actions. */
  'pivot.fields': string
  'pivot.areaFilters': string
  'pivot.areaColumns': string
  'pivot.areaRows': string
  'pivot.areaValues': string
  'pivot.available': string
  'pivot.areaEmpty': string
  'pivot.allUsed': string
  'pivot.fieldMenu': (field: string) => string
  'pivot.moveUp': string
  'pivot.moveDown': string
  'pivot.moveTo': (area: string) => string
  'pivot.remove': string
  'pivot.addField': (field: string) => string
  'pivot.addTo': (field: string, area: string) => string
  'pivot.addToArea': (area: string) => string
  'pivot.aggregationOf': (field: string) => string
  'pivot.filterOf': (field: string) => string
  'pivot.allValues': string
  'pivot.done': string
  /** Pivot: the grid's states, its keys and its actions. */
  'pivot.chooseValueTitle': string
  'pivot.chooseValueDescription': string
  'pivot.chooseFields': string
  'pivot.noDataTitle': string
  'pivot.noDataDescription': string
  'pivot.retry': string
  'pivot.expandAll': string
  'pivot.collapseAll': string
  'pivot.export': string
  'pivot.drillHint': string
  'pivot.gridHint': string
  // P5.78 auto: RuleBuilder
  /** RuleBuilder: the blocks, the fields' labels, the joins, the add buttons, the empty lists. */
  'rule.when': string
  'rule.if': string
  'rule.then': string
  'rule.trigger': string
  'rule.match': string
  'rule.groupMatch': string
  'rule.all': string
  'rule.any': string
  'rule.and': string
  'rule.or': string
  'rule.field': string
  'rule.operator': string
  'rule.value': string
  'rule.action': string
  'rule.fieldFirst': string
  'rule.addCondition': string
  'rule.addGroup': string
  'rule.addToGroup': string
  'rule.addAction': string
  'rule.noConditions': string
  'rule.noActions': string
  'rule.summary': string
  /** RuleBuilder: an item's name from its number written by `format` ("Condition 2"). */
  'rule.condition': (numberText: string) => string
  /** A condition inside a group ("Group 1, condition 2"). */
  'rule.groupCondition': (groupText: string, numberText: string) => string
  'rule.group': (numberText: string) => string
  'rule.actionName': (numberText: string) => string
  /** RuleBuilder: an item's tools, named with the item. */
  'rule.moveUp': (item: string) => string
  'rule.moveDown': (item: string) => string
  'rule.remove': (item: string) => string
  // P5.79 auto: ValueComparison chooses the values to keep
  /** ValueComparison with `chosen`: how many differing rows have a value chosen. */
  'comparison.chosenCount': (
    count: number,
    countText: string,
    total: number,
    totalText: string,
  ) => string
  /** ValueComparison with `chosen`: a differing row without a choice, and one with. */
  'comparison.choose': string
  'comparison.chosen': string
  // ── P5.81 reports ──
  /** DashboardGrid: the handle that moves a card ("Move: Revenue") and its instructions. */
  'dashboardGrid.moveCard': (title: string) => string
  'dashboardGrid.instructions': string
  /** Announcements while a card is moved with the keyboard or its menu (position of total). */
  'dashboardGrid.lifted': (title: string, position: string, total: string) => string
  'dashboardGrid.moved': (title: string, position: string, total: string) => string
  'dashboardGrid.dropped': (title: string, position: string, total: string) => string
  'dashboardGrid.cancelled': (title: string) => string
  /** A card's menu ("Options: Revenue") and its entries. */
  'dashboardGrid.cardMenu': (title: string) => string
  'dashboardGrid.moveEarlier': string
  'dashboardGrid.moveLater': string
  'dashboardGrid.moveFirst': string
  'dashboardGrid.moveLast': string
  /** The size button: its visible text is the size, its name "Medium, size of Revenue". */
  'dashboardGrid.sizeOf': (size: string, title: string) => string
  'dashboardGrid.size': string
  'dashboardGrid.resized': (title: string, size: string) => string
  /** Removing a card ("Remove: Revenue") and its announcement. */
  'dashboardGrid.remove': (title: string) => string
  'dashboardGrid.removed': (title: string) => string
  /** The grid without cards. */
  'dashboardGrid.empty': string
}
