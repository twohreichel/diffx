import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_CONTEXT, type ContextWidth } from '../../context'
import { DEFAULT_LINE_DIFF, type LineDiffMode } from '../../lineDiff'
import { DEFAULT_AUTO_BLINK, DEFAULT_VIEW_MODE, type AutoBlink, type ViewMode } from '../../blink'
import { DEFAULT_MOVE_SETTINGS } from '../../moves'
import { DEFAULT_TAG_FILTER, type TagFilter } from '../../map/buildChangeMap'

export interface Settings {
  staged: boolean
  untracked: boolean
  diffStyle: ViewMode
  defaultTabSize: number
  context: ContextWidth
  lineDiff: LineDiffMode
  autoBlink: AutoBlink
  moveMinLines: number
  moveSimilarity: number
  ignoreComments: boolean
  mapOpen: boolean
  mapTag: TagFilter
  mapPath: string
  softWrap: boolean
  browser?: string
}

const DEFAULTS: Settings = {
  staged: true,
  untracked: true,
  diffStyle: DEFAULT_VIEW_MODE,
  defaultTabSize: 4,
  context: DEFAULT_CONTEXT,
  lineDiff: DEFAULT_LINE_DIFF,
  autoBlink: DEFAULT_AUTO_BLINK,
  moveMinLines: DEFAULT_MOVE_SETTINGS.minLines,
  moveSimilarity: DEFAULT_MOVE_SETTINGS.similarity,
  ignoreComments: false,
  mapOpen: false,
  mapTag: DEFAULT_TAG_FILTER,
  mapPath: '',
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
