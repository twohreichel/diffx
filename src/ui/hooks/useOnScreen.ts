import { useEffect, useState, type RefObject } from 'react'

/**
 * True once the element has been in view, and from then on.
 *
 * Latching keeps work that was started for a file from being thrown away when
 * the file scrolls past. Where the browser has no observer, everything counts
 * as visible.
 */
export function useOnScreen(ref: RefObject<Element | null>): boolean {
  const [seen, setSeen] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (seen || !element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen])

  return seen
}
