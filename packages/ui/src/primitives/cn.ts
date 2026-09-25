import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge told about the Liro theme (@veljaos/tokens/theme.css), so that a class passed in
 * replaces the class it conflicts with, and nothing else. Without this, `font-regular` would be
 * read as a font family and remove `font-sans`, and `text-h1` would be read as a colour and
 * remove `text-primary`.
 */
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      'font-weight': ['regular'],
      font: ['sans', 'brand', 'mono'],
      leading: ['base'],
      tracking: ['heading', 'body', 'caps'],
      ease: ['standard', 'decelerate', 'accelerate'],
    },
    classGroups: {
      h: [{ h: ['control', 'control-sm', 'header'] }],
      'min-h': [{ 'min-h': ['control', 'control-sm', 'header'] }],
      'max-w': [{ 'max-w': ['content'] }],
    },
  },
})

/** Joins classes (clsx) and lets a later class replace an earlier one it conflicts with. */
export function cn(...inputs: ClassValue[]): string {
  return merge(clsx(inputs))
}
