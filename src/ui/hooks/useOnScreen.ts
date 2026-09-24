import { useEffect, useState, type RefObject } from 'react'

/**
 * True once the element has been in view, and from then on.
 *
 * Latching keeps work that was started for a file from being thrown away when
 * the file scrolls past. Where the browser has no observer, everything counts
 * as visible. A caller that has no use for the answer passes `enabled: false`
 * and pays neither for the observer nor for the render its first hit causes.
 */
export function useOnScreen(ref: RefObject<Element | null>, enabled = true): boolean {
  const [seen, setSeen] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!enabled || seen || !element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, seen, enabled])

  return seen
}
