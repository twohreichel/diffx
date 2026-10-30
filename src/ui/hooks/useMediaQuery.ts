import { useEffect, useState } from 'react'

function mediaQueryList(query: string): MediaQueryList | undefined {
  return typeof window === 'undefined' ? undefined : window.matchMedia?.(query)
}

/** True while the CSS media query matches. Without `matchMedia` it never matches. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => mediaQueryList(query)?.matches ?? false)

  useEffect(() => {
    const list = mediaQueryList(query)
    if (!list) return
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}
