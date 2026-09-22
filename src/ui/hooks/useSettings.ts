import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CONTEXT, type ContextWidth } from '../../context'
import { DEFAULT_LINE_DIFF, type LineDiffMode } from '../../lineDiff'

export interface Settings {
  staged: boolean
  untracked: boolean
  diffStyle: 'split' | 'unified'
  defaultTabSize: number
  context: ContextWidth
  lineDiff: LineDiffMode
  softWrap: boolean
  browser?: string
}

const DEFAULTS: Settings = {
  staged: true,
  untracked: true,
  diffStyle: 'split',
  defaultTabSize: 4,
  context: DEFAULT_CONTEXT,
  lineDiff: DEFAULT_LINE_DIFF,
  softWrap: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      return next
    })
  }, [])

  return { settings, loaded, updateSettings }
}
