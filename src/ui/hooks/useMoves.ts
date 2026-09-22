import { useEffect, useState } from 'react'
import type { FileDiffMetadata } from '@pierre/diffs'
import { DEFAULT_MOVE_SETTINGS, detectMoves, type MovePair, type MoveSettings } from '../../moves'

/** Runs the scan off the render path, so the first paint never waits for it. */
function whenIdle(run: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(run)
    return () => window.cancelIdleCallback(handle)
  }
  const handle = window.setTimeout(run, 0)
  return () => window.clearTimeout(handle)
}

/** The moved blocks of the current diff, detected after the diff is on screen. */
export function useMoves(files: FileDiffMetadata[], settings: Partial<MoveSettings>): MovePair[] {
  const [moves, setMoves] = useState<MovePair[]>([])
  const { minLines, similarity } = { ...DEFAULT_MOVE_SETTINGS, ...settings }

  useEffect(() => {
    setMoves([])
    return whenIdle(() => setMoves(detectMoves(files, { minLines, similarity })))
  }, [files, minLines, similarity])

  return moves
}
