// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs'
import { useChangeMap } from './useChangeMap'

const PATCH = `diff --git a/app.py b/app.py
index a111b29..4154b18 100644
--- a/app.py
+++ b/app.py
@@ -1,4 +1,4 @@
 def first(value):
-    total = value + 1
+    total = value + 2
     return total
`

let parsed: FileDiffMetadata[] = []

describe('useChangeMap', () => {
  it('leaves the map empty until the diff has painted', async () => {
    parsed = (await parsePatchFiles(PATCH))[0].files
    const { result } = renderHook(() => useChangeMap(parsed, {}))
    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].entries.map((entry) => entry.name)).toEqual(['first'])
  })

  it('empties the map when the diff does', async () => {
    const { result } = renderHook(() => useChangeMap([], {}))
    await waitFor(() => expect(result.current).toEqual([]))
  })
})
