import type { MouseEventHandler, ReactNode } from 'react'

/**
 * Placeholder that proves packaging end to end (P0.2).
 * P1.3 replaces it with the real Button (`intent`, or `family` + `icon` + `label`).
 */
export interface ButtonProps {
  children: ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
}

export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-md bg-brand-solid px-4 text-brand-on-solid hover:bg-brand-solid-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus active:bg-brand-solid-active"
    >
      {children}
    </button>
  )
}
