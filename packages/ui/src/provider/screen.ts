import { createContext, useContext } from 'react'

/*
 * The screen the components are drawn on. In an application it is the
 * browser's viewport, and nothing sets it. A frame that stands for a phone's screen inside a wider
 * page (the stories' PhoneFrame) sets it, so the components inside behave as on a phone:
 * - `phone`: usePhone() answers true (the frame is a phone's width whatever the window's);
 * - `element`: floating lists, menus and popovers keep inside it (Radix's collision boundary),
 *   as they keep inside the viewport on a real phone.
 * Fixed overlays (backdrops, dialogs, sheets) already cover the frame: it has a transform, so it
 * is their containing block. Internal: not exported from @veljaos/ui.
 */

export interface Screen {
  /** The frame's element; null until it is mounted. */
  element: HTMLElement | null
  /** The frame is a phone's screen. */
  phone: boolean
}

export const ScreenContext = createContext<Screen | null>(null)

/** The frame standing for the screen, or null in an application (the viewport). */
export function useScreen(): Screen | null {
  return useContext(ScreenContext)
}

/** 8px between a floating list, menu or popover and the screen's edges (Mantine's default). */
export const SCREEN_PADDING = 8

/**
 * Radix's collision props for a floating content: the screen's edges, 8px in. Inside a frame its
 * element is the boundary; in an application the viewport is (Radix's default).
 */
export function useCollision(): {
  collisionPadding: number
  collisionBoundary?: HTMLElement
} {
  const screen = useScreen()
  return screen?.element == null
    ? { collisionPadding: SCREEN_PADDING }
    : { collisionPadding: SCREEN_PADDING, collisionBoundary: screen.element }
}
