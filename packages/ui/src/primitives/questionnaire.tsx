import { Questionnaire as QuestionnairePrimitive } from '@shadcn/react/questionnaire'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { TEXT_DIRECTION } from './classes'
import { cn } from './cn'

/*
 * Questionnaire (shadcn/ui `questionnaire`, registry style radix-vega, fetched 2026-10-08; on the
 * unstyled `@shadcn/react/questionnaire` 0.3.1, adapted as the P2.1 primitives). A form of
 * questions shown one at a time: each question a fieldset with its legend, its choices as real
 * radio buttons or checkboxes, and its error; the number keys choose a choice while the user is
 * not typing (`shortcuts="numbers"`), and the item whose turn it is takes the focus when it
 * changes (a controlled `item`).
 *
 * Adapted:
 * - Liro meanings. A choice is a 44px row (shadcn's min-h-11, the touch target) with a 1px
 *   border.default line, radius md, padding 12px 16px, 13px text; surface.hover under the pointer;
 *   **a chosen choice is the neutral selection (D17): surface.selected with a border.selected
 *   line** (shadcn: the primary colour at 40%); its radio or checkbox is the Liro control (20px,
 *   border.control, filled with brand.solid when checked — checked controls stay blue); the
 *   keyboard focus is the Liro focus ring around the whole row. Disabled: surface.disabled and
 *   text.disabled, no opacity (Appendix B.6). Invalid: the danger border (Fields, "The error
 *   look").
 * - The number shortcut is drawn as ShortcutHint's key (Kbd 'xs', 12px), at the row's end.
 * - No text of its own: shadcn's "Previous", "Next", "Skip", "Submit", the progress text
 *   ("Question 1 of 5") and the error's default ("Choose an answer to continue.") come from the
 *   component that uses it. Its navigation parts (Previous, Next, Skip, Submit), its Progress and
 *   its Input are not kept: the Liro Questionnaire moves along a branching path and asks with the
 *   Design System's own fields and buttons (components/questionnaire.tsx).
 * - Logical properties only (`ms-auto`, `text-start`); text direction from the content.
 */

export function Questionnaire({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Root>) {
  return (
    <QuestionnairePrimitive.Root
      data-slot="questionnaire"
      className={cn('m-0 flex w-full min-w-0 flex-col gap-4 font-sans', className)}
      {...props}
    />
  )
}

export function QuestionnaireItem({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Item>) {
  return (
    <QuestionnairePrimitive.Item
      data-slot="questionnaire-item"
      className={cn('m-0 flex min-w-0 flex-col gap-3 border-0 p-0 outline-none', className)}
      {...props}
    />
  )
}

export function QuestionnaireTitle({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Title>) {
  return (
    <QuestionnairePrimitive.Title
      data-slot="questionnaire-title"
      className={cn(
        'float-none m-0 w-full p-0 text-lg font-semibold break-words text-primary',
        TEXT_DIRECTION,
        className,
      )}
      {...props}
    />
  )
}

export function QuestionnaireDescription({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Description>) {
  return (
    <QuestionnairePrimitive.Description
      data-slot="questionnaire-description"
      className={cn('m-0 -mt-2 text-sm text-secondary', TEXT_DIRECTION, className)}
      {...props}
    />
  )
}

export function QuestionnaireChoices({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Choices>) {
  return (
    <QuestionnairePrimitive.Choices
      data-slot="questionnaire-choices"
      className={cn('grid min-w-0 gap-2', className)}
      {...props}
    />
  )
}

export function QuestionnaireChoice({
  children,
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Choice>) {
  return (
    <QuestionnairePrimitive.Choice
      data-slot="questionnaire-choice"
      className={cn(
        'group/choice relative box-border flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-solid border-default bg-surface-raised px-4 py-3 text-start text-sm text-primary transition-colors duration-(--liro-duration-fast) ease-standard select-none hover:bg-surface-hover',
        'has-[>input:focus-visible]:outline-2 has-[>input:focus-visible]:outline-offset-2 has-[>input:focus-visible]:outline-focus has-[>input:focus-visible]:outline-solid',
        'data-checked:border-selected data-checked:bg-surface-selected data-checked:hover:bg-surface-selected',
        'data-invalid:border-status-danger-fg',
        'data-disabled:cursor-not-allowed data-disabled:border-default data-disabled:bg-surface-disabled data-disabled:text-disabled',
        className,
      )}
      {...props}
    >
      <QuestionnairePrimitive.ChoiceInput
        data-slot="questionnaire-choice-input"
        className="absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        data-slot="questionnaire-choice-indicator"
        className="pointer-events-none relative flex size-5 shrink-0 items-center justify-center rounded-sm border border-solid border-control bg-surface-raised text-on-accent group-data-checked/choice:border-transparent group-data-checked/choice:bg-brand-solid group-data-disabled/choice:border-default group-data-disabled/choice:bg-surface-disabled group-data-[type=radio]/choice:rounded-full"
      >
        <span className="hidden size-2 rounded-full bg-current group-data-checked/choice:group-data-[type=radio]/choice:block" />
        <Check
          strokeWidth={3}
          className="hidden size-3 group-data-checked/choice:group-data-[type=checkbox]/choice:block"
        />
      </span>
      <QuestionnairePrimitive.ChoiceLabel
        data-slot="questionnaire-choice-label"
        className={cn('flex min-w-0 flex-1 flex-col gap-0.5 pt-px break-words', TEXT_DIRECTION)}
      >
        {children}
      </QuestionnairePrimitive.ChoiceLabel>
      <QuestionnairePrimitive.ChoiceShortcut
        data-slot="questionnaire-choice-shortcut"
        className="pointer-events-none ms-auto hidden shrink-0 rounded-sm border border-b-[3px] border-solid border-default bg-surface-hover px-[0.45em] py-[0.12em] text-center font-mono text-xs leading-[1.55] font-bold text-secondary group-data-[shortcut]/choice:inline-block"
      />
    </QuestionnairePrimitive.Choice>
  )
}

export function QuestionnaireChoiceDescription({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="questionnaire-choice-description"
      className={cn('text-xs text-secondary', className)}
      {...props}
    />
  )
}

export function QuestionnaireError({
  className,
  ...props
}: ComponentProps<typeof QuestionnairePrimitive.Error>) {
  return (
    <QuestionnairePrimitive.Error
      data-slot="questionnaire-error"
      className={cn('m-0 text-xs text-status-danger-fg', TEXT_DIRECTION, className)}
      {...props}
    />
  )
}
