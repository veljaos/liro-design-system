import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarDays } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { Bubble, BubbleContent, BubbleGroup } from './bubble'
import { Marker, MarkerContent, MarkerIcon } from './marker'
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from './message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './message-scroller'
import { internal, settle } from './story-helpers'

/*
 * The message primitives of P5.1 (shadcn/ui Bubble, Marker, Message and Message Scroller,
 * adapted): one story each.
 */
const meta = {
  title: 'Internal/Primitives/Messages',
  parameters: {
    docs: {
      description: {
        component: internal(
          'Bubble, Marker, Message and Message Scroller (shadcn/ui, radix-vega, fetched 2026-10-08). ' +
            'The Message family (MessageBubble, MessageList, MessageThread, MessageComposer) and ' +
            'AgentQuestion are built from them (P5.1).',
        ),
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The three neutral surfaces: raised (others), sunken (own), ghost (a larger part). */
export const BubbleStory: Story = {
  name: 'Bubble',
  render: () => (
    <BubbleGroup className="max-w-120">
      <Bubble>
        <BubbleContent>The concrete arrives at 7:30.</BubbleContent>
      </Bubble>
      <Bubble surface="sunken" align="end">
        <BubbleContent>Noted, I will tell the crew.</BubbleContent>
      </Bubble>
      <Bubble surface="ghost">
        <BubbleContent>A ghost bubble has no box.</BubbleContent>
      </Bubble>
    </BubbleGroup>
  ),
}

/** Meta text, a day separator between lines, and a line under. */
export const MarkerStory: Story = {
  name: 'Marker',
  render: () => (
    <div className="flex max-w-120 flex-col gap-4">
      <Marker>
        <MarkerIcon>
          <CalendarDays />
        </MarkerIcon>
        <MarkerContent>Edited 06.10.2026. 09:42</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Marker variant="border">
        <MarkerContent>Earlier messages</MarkerContent>
      </Marker>
    </div>
  ),
}

/** A message at the start with avatar, header and footer; one at the end. */
export const MessageStory: Story = {
  name: 'Message',
  render: () => (
    <div className="flex max-w-120 flex-col gap-3">
      <Message>
        <MessageAvatar>
          <span className="text-xs font-bold">DI</span>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader>
            <span className="font-semibold text-primary">Dragan Ilić</span>
            <span>09:12</span>
          </MessageHeader>
          <Bubble>
            <BubbleContent>Medic Lab asked to pay in two parts.</BubbleContent>
          </Bubble>
          <MessageFooter>Edited</MessageFooter>
        </MessageContent>
      </Message>
      <Message align="end">
        <MessageContent>
          <MessageHeader>
            <span>09:20</span>
          </MessageHeader>
          <Bubble surface="sunken" align="end">
            <BubbleContent>Fine, by 25.10.2026.</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  ),
}

/** A scrolling list opened at its end; the button returns there when scrolled up. */
export const MessageScrollerStory: Story = {
  name: 'Message Scroller',
  render: () => (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="h-60 max-w-120 rounded-md border border-solid border-default">
        <MessageScrollerViewport label="Site diary">
          <MessageScrollerContent className="p-3">
            {Array.from({ length: 20 }, (_, index) => (
              <MessageScrollerItem key={index} messageId={String(index)}>
                <Bubble
                  surface={index % 3 === 2 ? 'sunken' : 'raised'}
                  align={index % 3 === 2 ? 'end' : 'start'}
                >
                  <BubbleContent>Entry {String(index + 1)} of the site diary.</BubbleContent>
                </Bubble>
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton>Jump to latest</MessageScrollerButton>
      </MessageScroller>
    </MessageScrollerProvider>
  ),
  play: async ({ canvasElement }) => {
    const viewport = within(canvasElement).getByRole('region', { name: 'Site diary' })
    await expect(within(canvasElement).getByRole('log')).toBeInTheDocument()
    await expect(viewport).toHaveAttribute('tabindex', '0')
    await settle()
  },
}
