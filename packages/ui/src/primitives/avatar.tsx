import { Avatar as AvatarPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from './cn'

/*
 * An avatar (shadcn/ui avatar, adapted; Mantine Avatar.css, size 'md'): a 38px circle; the
 * picture covers it; without one, the fallback (initials or an icon) is bold, 16px (Mantine:
 * 38 / 2.5 = 15.2px; the nearest A.5 size), in the neutral tone (Mantine's default is the light
 * gray variant). shadcn/ui's avatar group is left to the components that need it (P2.8, P5.2).
 */

export function Avatar({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        'relative flex size-9.5 shrink-0 overflow-hidden rounded-full select-none',
        className,
      )}
      {...props}
    />
  )
}

export function AvatarImage({ className, ...props }: ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn('block size-full object-cover', className)}
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        'flex size-full items-center justify-center rounded-full bg-status-neutral-bg font-sans text-lg leading-none font-bold text-status-neutral-fg [&>svg]:size-[70%]',
        className,
      )}
      {...props}
    />
  )
}
