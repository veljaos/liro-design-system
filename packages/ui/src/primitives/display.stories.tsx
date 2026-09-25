import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown, User } from 'lucide-react'
import { Avatar, AvatarFallback } from './avatar'
import { BUTTON_SHAPES, ButtonPrimitive } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { Progress } from './progress'
import { ScrollArea } from './scroll-area'
import { Separator } from './separator'
import { Skeleton } from './skeleton'
import { internal, settle } from './story-helpers'

/*
 * The small display primitives, one story each: separator, scroll area, skeleton, avatar,
 * progress and collapsible.
 */
const meta = {
  title: 'Internal/Primitives/Display',
  parameters: {
    docs: {
      description: {
        component: internal(
          'Separator, ScrollArea, Skeleton, Avatar, Progress and Collapsible. Card and SectionCard, PersonAvatar (P2.8), Skeleton and ProgressBar (P2.5).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** Horizontal between blocks, vertical between inline items. */
export const SeparatorStory: Story = {
  name: 'Separator',
  render: () => (
    <div className="flex max-w-80 flex-col gap-3 text-sm">
      <p className="m-0">Issued 25.09.2026</p>
      <Separator />
      <div className="flex h-5 items-center gap-3">
        <span>Draft</span>
        <Separator orientation="vertical" />
        <span>3 lines</span>
        <Separator orientation="vertical" />
        <span>EUR</span>
      </div>
    </div>
  ),
}

/** Scrollbars always shown here: the vertical one sits at the inline end. */
export const ScrollAreaStory: Story = {
  name: 'ScrollArea',
  render: () => (
    <ScrollArea type="always" className="h-40 w-64 rounded-md border border-default">
      <ul className="m-0 w-96 list-none p-3 text-sm">
        {Array.from({ length: 20 }, (_, index) => (
          <li key={index} className="py-1">
            Account {String(2000 + index)}: receivables from customers in the country
          </li>
        ))}
      </ul>
    </ScrollArea>
  ),
}

/** Placeholder shapes for a line of text, a title and an avatar. */
export const SkeletonStory: Story = {
  name: 'Skeleton',
  render: () => (
    <div aria-busy="true" className="flex max-w-80 items-center gap-3">
      <Skeleton className="size-9.5 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  ),
}

/** Initials and an icon when there is no picture. */
export const AvatarStory: Story = {
  name: 'Avatar',
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>
          <User role="img" aria-label="Unknown person" />
        </AvatarFallback>
      </Avatar>
    </div>
  ),
}

/** Empty, 40% and full. The bar fills from the leading edge in both directions. */
export const ProgressStory: Story = {
  name: 'Progress',
  render: () => (
    <div className="flex max-w-80 flex-col gap-4">
      {[0, 40, 100].map((value) => (
        <Progress key={value} value={value} aria-label={`Import ${String(value)}% done`} />
      ))}
    </div>
  ),
}

/** Open, with its trigger. */
export const CollapsibleStory: Story = {
  name: 'Collapsible',
  render: () => (
    <Collapsible defaultOpen className="flex max-w-80 flex-col gap-2">
      <CollapsibleTrigger asChild>
        <ButtonPrimitive emphasis="menu" className="group self-start">
          <ChevronDown
            aria-hidden="true"
            className={`${BUTTON_SHAPES.text.icon} transition-transform group-data-[state=closed]:-rotate-90 rtl:group-data-[state=closed]:rotate-90`}
          />
          <span>Payment terms</span>
        </ButtonPrimitive>
      </CollapsibleTrigger>
      <CollapsibleContent className="text-sm">
        Payment within 15 days of the invoice date, by bank transfer.
      </CollapsibleContent>
    </Collapsible>
  ),
}
