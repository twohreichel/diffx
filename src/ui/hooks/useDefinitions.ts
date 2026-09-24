import { useCallback, useRef, useState } from 'react'
import type { Definition } from '../../definitions'

/** The open definition popup: the name, the answer, and whether it is there yet. */
export interface Lookup {
  name: string
  loading: boolean
  definitions: Definition[]
}

interface Definitions {
  lookup: Lookup | null
  find: (name: string) => void
  close: () => void
}

/** Asks the server where a name is declared, one name at a time. */
export function useDefinitions(): Definitions {
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const open = useRef<string | null>(null)

  const find = useCallback((name: string) => {
    open.current = name
    setLookup({ name, loading: true, definitions: [] })
    fetch(`/api/definitions?name=${encodeURIComponent(name)}`)
      .then((res) => res.json() as Promise<{ definitions?: Definition[] }>)
      // A second click while the first search runs wins, so a late answer is dropped.
      .then((body) => {
        if (open.current === name) setLookup({ name, loading: false, definitions: body.definitions ?? [] })
      })
      .catch(() => {
        if (open.current === name) setLookup({ name, loading: false, definitions: [] })
      })
  }, [])

  const close = useCallback(() => {
    open.current = null
    setLookup(null)
  }, [])

  return { lookup, find, close }
}
