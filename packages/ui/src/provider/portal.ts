import { createContext, useContext } from 'react'

/**
 * Where overlays (dialogs, menus, popovers, tooltips) render. LiroProvider puts an empty element
 * inside its own wrapper, so an overlay inherits the theme, `dir` and `lang` of the provider
 * instead of the document body's. Internal: not exported from @veljaos/ui.
 */
export const PortalContainerContext = createContext<HTMLElement | null>(null)

/** The nearest provider's overlay container; null outside a provider (Radix then uses the body). */
export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext)
}
