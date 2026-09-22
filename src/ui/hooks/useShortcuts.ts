import { useEffect, useRef } from 'react'

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** True while the event came from somewhere the user is entering text. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (TYPING_TAGS.has(target.tagName)) return true
  return target.closest('[contenteditable=""], [contenteditable="true"]') !== null
}

/**
 * Binds bare-key shortcuts on the document.
 *
 * Chords are left to the browser and the operating system, and a key pressed
 * inside a comment field reaches the field, not the shortcut.
 */
export function useShortcuts(handlers: Record<string, () => void>): void {
  const current = useRef(handlers)
  current.current = handlers

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      const handler = current.current[e.key]
      if (!handler) return
      e.preventDefault()
      handler()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
