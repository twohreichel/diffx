import { useEffect, useState } from 'react'
import type { StructuralFile, StructuralResponse } from '../../structural'

/** What the server needs beyond the file version itself. */
export interface StructuralQuery {
  staged: boolean
  untracked: boolean
  ignoreComments: boolean
}

export interface StructuralRequest extends StructuralQuery {
  path: string
  oldOid: string
  newOid: string
}

export interface StructuralState {
  loading: boolean
  result: StructuralFile | null
  reason: string | null
}

const IDLE: StructuralState = { loading: false, result: null, reason: null }
const REFUSED = 'Structural comparison is unavailable for this file.'

function query(request: StructuralRequest): string {
  return new URLSearchParams({
    path: request.path,
    oldOid: request.oldOid,
    newOid: request.newOid,
    staged: String(request.staged),
    untracked: String(request.untracked),
    ignoreComments: String(request.ignoreComments),
  }).toString()
}

/**
 * The structural result for one file, asked for only while that file is open.
 *
 * The request is aborted as soon as its file is left, so the next file never
 * waits behind the comparison of the one before it.
 */
export function useStructural(request: StructuralRequest | null): StructuralState {
  const [state, setState] = useState<StructuralState>(IDLE)
  const search = request === null ? null : query(request)

  useEffect(() => {
    if (search === null) {
      setState(IDLE)
      return
    }
    setState({ loading: true, result: null, reason: null })
    const controller = new AbortController()
    fetch(`/api/structural?${search}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<StructuralResponse>) : null))
      .then((body) => {
        setState({ loading: false, result: body?.result ?? null, reason: body ? body.reason ?? null : REFUSED })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [search])

  return state
}
