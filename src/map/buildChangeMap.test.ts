import { describe, it, expect } from 'vitest'
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs'
import type { MovePair } from '../moves.js'
import { buildChangeMap } from './buildChangeMap.js'

const PATCH = `diff --git a/app.py b/app.py
index a111b29..4154b18 100644
--- a/app.py
+++ b/app.py
@@ -1,10 +1,15 @@
 import os
+import sys
 
 
 def first(value):
-    total = value + 1
+    total = value + 2
     return total
 
 
 def second(value):
     return value * 2
+
+
+def third(value):
+    return value - 1
diff --git a/tool.ts b/tool.ts
index bdf647f..a38664e 100644
--- a/tool.ts
+++ b/tool.ts
@@ -2,8 +2,4 @@ export function keep(value: number): number {
   return value + 1
 }
 
-export function drop(value: number): number {
-  return value - 1
-}
-
 export const last = 1
`

const MOVE: MovePair = {
  id: 'm1',
  from: { path: 'other.py', side: 'deletions', startLine: 40, lineCount: 4 },
  to: { path: 'app.py', side: 'additions', startLine: 12, lineCount: 4 },
  kind: 'exact',
  changedLines: [],
  ambiguous: false,
}

async function files(): Promise<FileDiffMetadata[]> {
  return (await parsePatchFiles(PATCH))[0].files
}

describe('buildChangeMap', () => {
  it('counts each symbol and sizes the bar against the largest entry', async () => {
    const map = buildChangeMap(await files())
    expect(map.map((group) => group.path)).toEqual(['app.py', 'tool.ts'])
    expect(map[0].added).toBe(6)
    expect(map[0].removed).toBe(1)
    expect(map[0].entries.map((entry) => [entry.name, entry.added, entry.removed, entry.magnitude])).toEqual([
      ['top level', 1, 0, 0.25],
      ['first', 1, 1, 0.5],
      ['third', 4, 0, 1],
    ])
    expect(map[1].entries.map((entry) => [entry.name, entry.magnitude])).toEqual([['drop', 1]])
  })

  it('tags an entry by what happened to it', async () => {
    const map = buildChangeMap(await files())
    expect(map[0].entries.map((entry) => entry.tags)).toEqual([['added'], ['modified'], ['added']])
    expect(map[1].entries[0].tags).toEqual(['removed'])
  })

  it('tags a symbol that a move pair arrived in, and only when moves are known', async () => {
    const parsed = await files()
    expect(buildChangeMap(parsed, { moves: [MOVE] })[0].entries[2].tags).toEqual(['added', 'moved'])
    expect(buildChangeMap(parsed)[0].entries[2].tags).toEqual(['added'])
  })

  it('sorts a structurally unchanged file last and tags its entries', async () => {
    const map = buildChangeMap(await files(), { structurallyUnchanged: new Set(['app.py']) })
    expect(map.map((group) => group.path)).toEqual(['tool.ts', 'app.py'])
    expect(map[1].structurallyUnchanged).toBe(true)
    expect(map[1].entries[0].tags).toEqual(['added', 'structurally-unchanged'])
  })

  it('falls back to one file-level entry for a language it cannot read', async () => {
    const parsed = await files()
    const renamed = { ...parsed[0], name: 'notes.txt' }
    const [group] = buildChangeMap([renamed])
    expect(group.named).toBe(false)
    expect(group.entries.map((entry) => [entry.name, entry.added, entry.removed])).toEqual([['top level', 6, 1]])
  })
})
