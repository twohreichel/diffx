import { describe, it, expect } from 'vitest'
import { parsePatchFiles } from '@pierre/diffs'
import {
  AUTO_BLINK_OPTIONS,
  DEFAULT_AUTO_BLINK,
  DEFAULT_VIEW_MODE,
  VIEW_MODES,
  blinkCSS,
  changeRegions,
  parseAutoBlink,
  parseViewMode,
  regionLine,
  rendererDiffStyle,
  stepRegion,
  toggleBlink,
} from './blink'

// One modification, one pure addition, one pure deletion.
const PATCH = `diff --git a/app.ts b/app.ts
index 1111111..2222222 100644
--- a/app.ts
+++ b/app.ts
@@ -1,5 +1,6 @@
 const a = 1
-const b = 2
+const b = 3
 const c = 4
 const d = 5
+const e = 6
 const f = 7
@@ -8,3 +9,2 @@
 const g = 8
-const h = 9
 const i = 10
`

function parsedFiles() {
  return parsePatchFiles(PATCH).flatMap((parsed) => parsed.files)
}

describe('view mode', () => {
  it('offers split, unified, blink and structural', () => {
    expect(VIEW_MODES).toEqual(['split', 'unified', 'blink', 'structural'])
  })

  it('starts on split', () => {
    expect(DEFAULT_VIEW_MODE).toBe('split')
  })

  it('renders blink through the split renderer', () => {
    expect(rendererDiffStyle('blink')).toBe('split')
    expect(rendererDiffStyle('split')).toBe('split')
    expect(rendererDiffStyle('unified')).toBe('unified')
  })

  it('keeps the before and after columns in structural mode', () => {
    expect(rendererDiffStyle('structural')).toBe('split')
  })

  it('keeps a stored mode and rejects an unknown one', () => {
    expect(parseViewMode('blink')).toBe('blink')
    expect(parseViewMode('structural')).toBe('structural')
    for (const raw of [undefined, null, '', 'flicker', 7]) {
      expect(parseViewMode(raw)).toBe('split')
    }
  })
})

describe('blink state', () => {
  it('alternates between the two states', () => {
    expect(toggleBlink('before')).toBe('after')
    expect(toggleBlink('after')).toBe('before')
  })

  it('hides the additions column while the before state is on screen', () => {
    const css = blinkCSS('before')
    expect(css).toMatch(/\[data-additions\][^}]*display:\s*none/)
    expect(css).not.toMatch(/\[data-deletions\][^}]*display:\s*none/)
  })

  it('hides the deletions column while the after state is on screen', () => {
    const css = blinkCSS('after')
    expect(css).toMatch(/\[data-deletions\][^}]*display:\s*none/)
    expect(css).not.toMatch(/\[data-additions\][^}]*display:\s*none/)
  })

  it('widens the remaining column to the whole pane', () => {
    // Beating the package rule needs its two-attribute selector, not one.
    expect(blinkCSS('after')).toMatch(
      /\[data-diff-type="split"\]\[data-overflow="scroll"\]\{grid-template-columns:\s*1fr\}/,
    )
  })
})

describe('auto blink', () => {
  it('offers off and the three intervals', () => {
    expect(AUTO_BLINK_OPTIONS).toEqual(['off', 400, 800, 1600])
  })

  it('is off until asked for', () => {
    expect(DEFAULT_AUTO_BLINK).toBe('off')
  })

  it('keeps a stored interval and rejects an unknown one', () => {
    expect(parseAutoBlink(1600)).toBe(1600)
    for (const raw of [undefined, null, 'fast', 250, 0]) {
      expect(parseAutoBlink(raw)).toBe('off')
    }
  })
})

describe('change regions', () => {
  it('finds every changed run in the file', () => {
    expect(changeRegions(parsedFiles())).toEqual([
      { file: 'app.ts', additionLine: 2, deletionLine: 2 },
      { file: 'app.ts', additionLine: 5, deletionLine: 4 },
      { file: 'app.ts', additionLine: 9, deletionLine: 9 },
    ])
  })

  it('anchors a run to the line before it on the side that lacks one', () => {
    const [, added, removed] = changeRegions(parsedFiles())
    expect(regionLine(added, 'after')).toBe(5)
    expect(regionLine(added, 'before')).toBe(4)
    expect(regionLine(removed, 'before')).toBe(9)
    expect(regionLine(removed, 'after')).toBe(9)
  })

  it('ignores a file with no hunks', () => {
    expect(changeRegions([{ name: 'logo.png', hunks: [] }])).toEqual([])
  })
})

describe('region navigation', () => {
  it('starts at the first region going forward and the last going back', () => {
    expect(stepRegion(3, -1, 1)).toBe(0)
    expect(stepRegion(3, -1, -1)).toBe(2)
  })

  it('walks in both directions', () => {
    expect(stepRegion(3, 0, 1)).toBe(1)
    expect(stepRegion(3, 2, -1)).toBe(1)
  })

  it('wraps at both ends', () => {
    expect(stepRegion(3, 2, 1)).toBe(0)
    expect(stepRegion(3, 0, -1)).toBe(2)
  })

  it('has nowhere to go without regions', () => {
    expect(stepRegion(0, -1, 1)).toBe(-1)
  })
})
