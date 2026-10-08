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
  /** Tells assistive technology that a step of a Stepper is completed. */
  'stepper.completed': string
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
  'notifications.today': string
  'notifications.yesterday': string
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
  /** WorklistPage, below 62em: back to the list, and on to the next item. */
  'worklist.back': string
  'worklist.next': string
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
  /** MatchingView (P5.21): the button that matches the selection of both lists. */
  'matching.match': string
  /** Why "Match" cannot be used yet: nothing selected in one of the lists. */
  'matching.selectBoth': string
  /** The heading of the suggested matches. */
  'matching.suggestions': string
  /** The accessible name of a suggestion's "Match" button; `label` is the suggestion's, from the application. */
  'matching.acceptSuggestion': (label: string) => string
  /** The accessible name of a suggestion's dismiss button. */
  'matching.dismissSuggestion': (label: string) => string
  /** The heading of the matches made. */
  'matching.matched': string
  /** The button that takes a match apart; its accessible name adds the match's label. */
  'matching.unmatch': string
  'matching.unmatchItem': (label: string) => string
  /** For assistive technology, between the two sides of a match. */
  'matching.matchedWith': string
  /** The accessible name of a list's search field; `list` is the list's title. */
  'matching.search': (list: string) => string
  /** A list with nothing left in it. */
  'matching.empty': string
  /** The keys under the lists: Space selects, Enter matches, Escape clears. */
  'matching.select': string
  'matching.clear': string
  'matching.spaceKey': string
  'matching.enterKey': string
  'matching.escapeKey': string
  /** Phones: the accessible name of the switch between the two lists. */
  'matching.showList': string
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
  /** ImportWizard: the button that chooses the file. */
  'import.chooseFile': string
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
  /** The import's progress: the bar's name and "312 of 1.284". */
  'import.progress': string
  'import.progressText': (
    done: number,
    doneText: string,
    total: number,
    totalText: string,
  ) => string
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
}
