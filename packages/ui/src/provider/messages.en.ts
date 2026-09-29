import { formatDecimal } from './format'
import type { LiroMessages } from './messages'

/**
 * English defaults for every Design System string. The type makes a missing key a compile error;
 * LiroProvider's `messages` replaces any of them.
 */
export const messagesEn: LiroMessages = {
  'table.next': 'Next',
  'table.previous': 'Previous',
  'table.count': (count, exact) => {
    const number = formatDecimal(String(count), 'comma-dot')
    if (!exact) return `More than ${number} rows`
    return count === 1 ? '1 row' : `${number} rows`
  },
  'table.noRows': 'Nothing here yet',
  'table.noMatch': 'No rows match',
  'field.required': 'Required',
  'field.readOnly': 'Read-only',
  'field.invalidDate': 'Enter a date',
  'field.invalidNumber': 'Enter a number',
  'field.invalidRange': 'The end is before the start',
  'field.openCalendar': 'Choose a date',
  'field.rangeStart': 'Start',
  'field.rangeEnd': 'End',
  'field.loading': 'Loading…',
  'field.noResults': 'Nothing found',
  'field.remove': (label) => `Remove ${label}`,
  'breadcrumbs.label': 'Breadcrumbs',
  'command.title': 'Search and commands',
  'command.placeholder': 'Search…',
  'command.actions': 'Actions',
  'command.navigation': 'Go to',
  'command.noResults': 'Nothing found',
  'calendar.previousMonth': 'Previous month',
  'calendar.nextMonth': 'Next month',
  'calendar.navigation': 'Months',
  'calendar.previousYear': 'Previous year',
  'calendar.nextYear': 'Next year',
  'period.quarter': (quarter, year) => `Q${String(quarter)} ${year}`,
  'period.today': 'Today',
  'period.thisWeek': 'This week',
  'period.thisMonth': 'This month',
  'period.lastMonth': 'Last month',
  'period.thisQuarter': 'This quarter',
  'period.lastQuarter': 'Last quarter',
  'period.yearToDate': 'Year to date',
  'period.lastYear': 'Last year',
  'period.clear': 'Clear',
  'period.all': 'All periods',
  'period.customRange': 'Custom range',
  'dialog.close': 'Close',
  'due.settled': 'Settled',
  'due.overdue': (days) => (days === 1 ? '1 day overdue' : `${String(days)} days overdue`),
  'due.today': 'Due today',
  'due.inDays': (days) => (days === 1 ? 'Due in 1 day' : `Due in ${String(days)} days`),
  'alert.close': 'Close',
  'empty.emptyTitle': 'Nothing here yet',
  'empty.emptyDescription': 'When something is added, it appears here.',
  'empty.noResultsTitle': 'Nothing matches',
  'empty.noResultsDescription': 'Try other words, or clear some filters.',
  'empty.errorTitle': 'This could not be loaded',
  'empty.errorDescription': 'Something went wrong on our side. Try again in a moment.',
  'empty.caseId': 'Case number:',
  'dialog.cancel': 'Cancel',
  'confirm.deleteTitle': 'Delete this item?',
  'confirm.deleteMessage': 'This cannot be undone.',
  'confirm.deleteLabel': 'Delete',
  'confirm.typeToConfirm': (text) => `Type ${text} to confirm`,
  'action.more': 'More actions',
  'action.moreOptions': (label) => `More options: ${label}`,
  'bulk.selected': (count) => `${formatDecimal(String(count), 'comma-dot')} selected`,
  'bulk.selectAll': (total) => `Select all ${formatDecimal(String(total), 'comma-dot')}`,
  'bulk.clear': 'Clear the selection',
  'bulk.confirmTitle': (count) =>
    count === 1
      ? 'Apply to 1 item?'
      : `Apply to ${formatDecimal(String(count), 'comma-dot')} items?`,
  'notice.close': 'Close',
  'notice.region': 'Notifications',
  'stepper.completed': 'Completed',
  'action.unavailable': (reason) => `Unavailable: ${reason}`,
  'connection.offline': 'Offline',
}
