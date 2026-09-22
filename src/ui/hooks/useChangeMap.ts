import { useEffect, useState } from 'react'
import type { FileDiffMetadata } from '@pierre/diffs'
import { buildChangeMap, type ChangeMapInputs, type FileGroup } from '../../map/buildChangeMap'

/**
 * The change map of the current diff, built once the diff itself is on screen.
 *
 * Attribution walks every hunk of every file, which is work the reader is not
 * waiting for — the map arrives a frame later and never holds up the rows (FR-009).
 */
export function useChangeMap(files: FileDiffMetadata[], inputs: ChangeMapInputs): FileGroup[] {
  const [groups, setGroups] = useState<FileGroup[]>([])
  const { moves, structurallyUnchanged } = inputs

  useEffect(() => {
    const handle = setTimeout(() => setGroups(buildChangeMap(files, { moves, structurallyUnchanged })), 0)
    return () => clearTimeout(handle)
  }, [files, moves, structurallyUnchanged])

  return groups
}
