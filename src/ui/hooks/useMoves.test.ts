// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { parsePatchFiles } from '@pierre/diffs'
import { useMoves } from './useMoves'

const MOVED_FUNCTION = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,10 +1,10 @@
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
-
 function keep() {
   return 0
 }
+
+function moved() {
+  const a = 1
+  const b = 2
+  const c = 3
+  return a + b + c
+}
`

const files = parsePatchFiles(MOVED_FUNCTION).flatMap((p) => p.files)

describe('useMoves', () => {
  it('holds nothing back on the first render and reports the pair after it', async () => {
    const { result } = renderHook(() => useMoves(files, {}))
    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].kind).toBe('exact')
  })

  it('detects again when a threshold changes', async () => {
    const { result, rerender } = renderHook(({ minLines }) => useMoves(files, { minLines }), {
      initialProps: { minLines: 20 },
    })
    await waitFor(() => expect(result.current).toEqual([]))
    rerender({ minLines: 5 })
    await waitFor(() => expect(result.current).toHaveLength(1))
  })
})
