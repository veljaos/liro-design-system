import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../primitives/avatar'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'

/*
 * PersonAvatar and PersonName (BUILD-PLAN P2.8), the previous Design System's, carried over
 * (owner's decision, 2026-09-28, docs/decisions.md "Display"): Mantine's light avatar, neutral
 * since P3.6 (surface.sunken with text.primary; blue is for actions), radius xl (16px), 38px (size 'md'), a photo when
 * given; decorative by default (the name is written beside it), unless `alt` is given. Initials
 * from the first letter of the FIRST and the LAST word ("Ana Marija Jovanović" → AJ, Appendix B.9;
 * the old code took the first two words).
 */

/**
 * The initials of a name: the first letter of the first and of the last word, in upper case in the
 * page's locale ("Ana Marija Jovanović" → "AJ", "Ćirić" → "Ć", "" → ""). Letters are whole code
 * points, so a letter outside the basic plane stays whole.
 */
export function initialsOf(name: string, locale: string): string {
  const words = name
    .trim()
    .split(/\s+/u)
    .filter((word) => word !== '')
  const first = words[0]
  if (first === undefined) return ''
  const letter = (word: string) => Array.from(word)[0] ?? ''
  const last = words.length > 1 ? words[words.length - 1] : undefined
  return (letter(first) + (last === undefined ? '' : letter(last))).toLocaleUpperCase(locale)
}

export interface PersonAvatarProps {
  /** The person's full name, from the application: the initials come from it. */
  name: string
  /** A photo's address; the initials show until it loads, and if it fails. */
  src?: string
  /** Makes the avatar speak: its text alternative. Default: decorative (the name is beside it). */
  alt?: string
  /** 'md' (38px, default) or 'sm' (26px, beside a name in a line of text). */
  size?: 'sm' | 'md'
  className?: string
}

/** A person's photo or initials. */
export function PersonAvatar({ name, src, alt, size = 'md', className }: PersonAvatarProps) {
  const { locale } = useLiro()
  const decorative = alt === undefined
  return (
    <Avatar
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': alt })}
      className={cn('rounded-xl', size === 'sm' && 'size-6.5', className)}
    >
      {src !== undefined && <AvatarImage src={src} alt={decorative ? '' : alt} />}
      <AvatarFallback
        className={cn('rounded-xl bg-surface-sunken text-primary', size === 'sm' && 'text-xs')}
      >
        {initialsOf(name, locale)}
      </AvatarFallback>
    </Avatar>
  )
}

export interface PersonNameProps {
  /** The person's full name, from the application. */
  name: string
  /** A line under the name (a role, an e-mail), from the application. */
  description?: ReactNode
  /** A photo for the avatar. */
  src?: string
  /** Shows the avatar before the name. Default: true. */
  withAvatar?: boolean
  className?: string
}

/**
 * A person's name, with their avatar and an optional line under it. Mantine defaults: a Group
 * (16px apart), the name 13px in text.primary, the line 12px in text.secondary; the avatar 26px
 * ('sm') beside a single line, 38px beside two.
 */
export function PersonName({
  name,
  description,
  src,
  withAvatar = true,
  className,
}: PersonNameProps) {
  return (
    <span className={cn('inline-flex max-w-full items-center gap-4 font-sans', className)}>
      {withAvatar && (
        <PersonAvatar
          name={name}
          {...(src === undefined ? {} : { src })}
          size={description === undefined ? 'sm' : 'md'}
        />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm text-primary">{name}</span>
        {description !== undefined && (
          <span className="truncate text-xs text-secondary">{description}</span>
        )}
      </span>
    </span>
  )
}
