import { describe, it, expect } from 'vitest'
import { parsePatchFiles, type FileDiffMetadata } from '@pierre/diffs'
import { detectMoves } from './moves'

function parse(patch: string): FileDiffMetadata[] {
  return parsePatchFiles(patch).flatMap((p) => p.files)
}

/** A seven-line function moved from the top of the file to the bottom. */
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

describe('detectMoves exact', () => {
  it('pairs a block that left one place and appeared in another', () => {
    const moves = detectMoves(parse(MOVED_FUNCTION))
    expect(moves).toHaveLength(1)
    expect(moves[0]).toMatchObject({
      kind: 'exact',
      ambiguous: false,
      from: { path: 'src/app.ts', side: 'deletions', startLine: 1, lineCount: 7 },
      to: { path: 'src/app.ts', side: 'additions', startLine: 4, lineCount: 7 },
    })
    expect(moves[0].changedLines).toEqual([])
    expect(moves[0].id).toBeTruthy()
  })
})

/** The same function, re-indented into a class body at its new place. */
const REINDENTED = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,8 +1,8 @@
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
 class Holder {
+    function moved() {
+      const a = 1
+      const b = 2
+      const c = 3
+      return a + b + c
+    }
 }
`

const SHORT_MOVE = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,4 +1,4 @@
-const a = 1
-const b = 2
-const c = 3
 const keep = 0
+const a = 1
+const b = 2
+const c = 3
`

/** Six closing braces leaving one place and appearing in another. */
const BOILERPLATE = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,7 +1,7 @@
-}
-}
-}
-}
-}
-}
 const keep = 0
+}
+}
+}
+}
+}
+}
`

const CROSS_FILE = `diff --git a/src/a.ts b/src/a.ts
index 1111111..2222222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,7 +1,1 @@
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
 const keep = 0
diff --git a/src/b.ts b/src/b.ts
index 3333333..4444444 100644
--- a/src/b.ts
+++ b/src/b.ts
@@ -1,1 +1,7 @@
 const other = 0
+function moved() {
+  const a = 1
+  const b = 2
+  const c = 3
+  return a + b + c
+}
`

const IMPORT_REORDER = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,6 +1,6 @@
-import a from 'a'
-import b from 'b'
-import c from 'c'
-import d from 'd'
-import e from 'e'
+import e from 'e'
+import d from 'd'
+import c from 'c'
+import b from 'b'
+import a from 'a'
 const x = 1
`

describe('detectMoves guards', () => {
  it('follows a block that was re-indented on the way', () => {
    const moves = detectMoves(parse(REINDENTED))
    expect(moves).toHaveLength(1)
    expect(moves[0].kind).toBe('exact')
    expect(moves[0].to.startLine).toBe(2)
  })

  it('leaves a run below the minimum length alone', () => {
    expect(detectMoves(parse(SHORT_MOVE))).toEqual([])
  })

  it('reports the short run once the minimum allows it', () => {
    expect(detectMoves(parse(SHORT_MOVE), { minLines: 3 })).toHaveLength(1)
  })

  it('rejects repeated boilerplate, which carries no content to recognize', () => {
    expect(detectMoves(parse(BOILERPLATE), { minLines: 3 })).toEqual([])
  })

  it('leaves reordered imports alone, they never left their place', () => {
    expect(detectMoves(parse(IMPORT_REORDER), { minLines: 3 })).toEqual([])
  })
})

describe('detectMoves across files', () => {
  it('links a block that left one file and arrived in another', () => {
    const moves = detectMoves(parse(CROSS_FILE))
    expect(moves).toHaveLength(1)
    expect(moves[0].from.path).toBe('src/a.ts')
    expect(moves[0].to.path).toBe('src/b.ts')
    expect(moves[0].to.startLine).toBe(2)
  })
})

/** The same block removed from two places, arriving once. */
const AMBIGUOUS = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,14 +1,8 @@
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
 const keep = 0
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
 const tail = 1
+function moved() {
+  const a = 1
+  const b = 2
+  const c = 3
+  return a + b + c
+}
`

/** Moved and edited: one line inside the block reads differently. */
const MOVED_AND_EDITED = `diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,7 +1,7 @@
-function moved() {
-  const a = 1
-  const b = 2
-  const c = 3
-  return a + b + c
-}
 const keep = 0
+function moved() {
+  const a = 1
+  const b = 22
+  const c = 3
+  return a + b + c
+}
`

describe('detectMoves ambiguity', () => {
  it('pairs the nearest departure and says the choice was not unique', () => {
    const moves = detectMoves(parse(AMBIGUOUS))
    expect(moves).toHaveLength(1)
    expect(moves[0].ambiguous).toBe(true)
    expect(moves[0].from.startLine).toBe(1)
    expect(moves[0].to.startLine).toBe(3)
  })
})

describe('detectMoves modified', () => {
  it('reports the edited line inside a block that also moved', () => {
    const moves = detectMoves(parse(MOVED_AND_EDITED))
    expect(moves).toHaveLength(1)
    expect(moves[0].kind).toBe('modified')
    expect(moves[0].changedLines).toEqual([4])
  })

  it('leaves the block alone once the similarity floor is raised past it', () => {
    expect(detectMoves(parse(MOVED_AND_EDITED), { similarity: 0.9 })).toEqual([])
  })
})
