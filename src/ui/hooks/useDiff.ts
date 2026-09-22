import { useState, useEffect } from 'react'
import type { ContextWidth } from '../../context'
import type { DifftAvailability } from '../../structural'

export interface BinaryFileInfo {
  path: string
  type: 'added' | 'deleted' | 'changed' | 'untracked'
}

interface DiffData {
  patch: string
  repoName: string
  branch: string
  customMode: boolean
  binaryFiles: BinaryFileInfo[]
  tabSizeMap: Record<string, number>
  untrackedFiles: string[]
  structural: DifftAvailability
}

/** Until the server has answered, the structural mode stays out of reach. */
const UNKNOWN_DIFFT: DifftAvailability = { available: false, reason: 'Looking for difftastic…' }

export interface DiffOptions {
  staged: boolean
  untracked: boolean
  context: ContextWidth
}

export function useDiff(options: DiffOptions) {
  const [data, setData] = useState<DiffData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/diff?staged=${options.staged}&untracked=${options.untracked}&context=${options.context}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [options.staged, options.untracked, options.context])

  return {
    patch: data?.patch ?? null,
    repoName: data?.repoName ?? '',
    branch: data?.branch ?? '',
    customMode: data?.customMode ?? false,
    binaryFiles: data?.binaryFiles ?? [],
    tabSizeMap: data?.tabSizeMap ?? {},
    untrackedFiles: data?.untrackedFiles ?? [],
    structural: data?.structural ?? UNKNOWN_DIFFT,
    loading,
    error,
  }
}
