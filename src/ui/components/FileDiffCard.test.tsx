// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { FileDiffMetadata } from '@pierre/diffs'
import { blinkCSS } from '../../blink'
import { movesCSS, type MovePair } from '../../moves'
import type { StructuralFile, StructuralResponse } from '../../structural'
import { structuralCSS } from '../../structuralView'

const captured: { options?: Record<string, unknown>; annotations?: { lineNumber: number; metadata: unknown }[] } = {}

vi.mock('@pierre/diffs/react', () => ({
  FileDiff: (props: {
    options: Record<string, unknown>
    lineAnnotations: { lineNumber: number; metadata: unknown }[]
  }) => {
    captured.options = props.options
    captured.annotations = props.lineAnnotations
    return <div data-testid="file-diff" />
  },
}))

const { FileDiffCard } = await import('./FileDiffCard')

const fileDiff: FileDiffMetadata = {
  name: 'src/app.ts',
  type: 'change',
  hunks: [],
  splitLineCount: 0,
  unifiedLineCount: 0,
  isPartial: true,
  deletionLines: [],
  additionLines: [],
}

function renderCard(overrides: Partial<Parameters<typeof FileDiffCard>[0]> = {}) {
  render(
    <FileDiffCard
      fileDiff={fileDiff}
      filePath="src/app.ts"
      annotations={[]}
      moves={[]}
      onJumpToMove={vi.fn()}
      structuralQuery={{ staged: true, untracked: true, ignoreComments: false }}
      onStructuralResult={vi.fn()}
      diffStyle="split"
      blinkState="after"
      lineDiff="word"
      tabSize={4}
      softWrap={false}
      viewed={false}
      onViewedChange={vi.fn()}
      onAddComment={vi.fn()}
      onDeleteComment={vi.fn()}
      {...overrides}
    />,
  )
  return captured.options!
}

beforeEach(() => {
  captured.options = undefined
  captured.annotations = undefined
})

describe('FileDiffCard intra-line options', () => {
  it.each(['split', 'unified'] as const)('asks for word emphasis in %s', (diffStyle) => {
    expect(renderCard({ diffStyle }).lineDiffType).toBe('word-alt')
  })

  it.each(['split', 'unified'] as const)('asks for character emphasis in %s', (diffStyle) => {
    expect(renderCard({ diffStyle, lineDiff: 'char' }).lineDiffType).toBe('char')
  })

  it('turns emphasis off on request', () => {
    expect(renderCard({ lineDiff: 'off' }).lineDiffType).toBe('none')
  })

  it('diffs inside lines up to two thousand characters', () => {
    expect(renderCard().maxLineDiffLength).toBe(2000)
  })

  it('carries the emphasis by an underline as well as a background', () => {
    expect(renderCard().unsafeCSS).toMatch(/\[data-diff-span\][^}]*border-bottom/)
  })
})

describe('FileDiffCard blink options', () => {
  it('renders blink through the split renderer', () => {
    expect(renderCard({ diffStyle: 'blink' }).diffStyle).toBe('split')
  })

  it('leaves one state of the split grid on screen', () => {
    const css = renderCard({ diffStyle: 'blink', blinkState: 'before' }).unsafeCSS as string
    expect(css).toContain(blinkCSS('before'))
  })

  it('adds nothing to the other modes', () => {
    const css = renderCard({ diffStyle: 'split', blinkState: 'before' }).unsafeCSS as string
    expect(css).not.toContain('display:none')
  })

  it('ignores soft wrap, which the hidden column cannot survive', () => {
    expect(renderCard({ diffStyle: 'blink', softWrap: true }).overflow).toBe('scroll')
    expect(renderCard({ diffStyle: 'split', softWrap: true }).overflow).toBe('wrap')
  })
})

const localMove: MovePair = {
  id: 'M1',
  from: { path: 'src/app.ts', side: 'deletions', startLine: 12, lineCount: 7 },
  to: { path: 'src/app.ts', side: 'additions', startLine: 40, lineCount: 7 },
  kind: 'exact',
  changedLines: [],
  ambiguous: false,
}

const foreignMove: MovePair = {
  ...localMove,
  id: 'M2',
  from: { path: 'src/other.ts', side: 'deletions', startLine: 3, lineCount: 6 },
  to: { path: 'src/other.ts', side: 'additions', startLine: 90, lineCount: 6 },
}

describe('FileDiffCard moved blocks', () => {
  it('marks the moved lines of this file', () => {
    const css = renderCard({ moves: [localMove] }).unsafeCSS as string
    expect(css).toContain(movesCSS([localMove], 'src/app.ts'))
  })

  it('badges both ends of a pair that stays inside the file', () => {
    renderCard({ moves: [localMove] })
    expect(captured.annotations).toEqual([
      { side: 'deletions', lineNumber: 12, metadata: { _move: localMove, role: 'from' } },
      { side: 'additions', lineNumber: 40, metadata: { _move: localMove, role: 'to' } },
    ])
  })

  it('leaves the ends that belong to other files alone', () => {
    renderCard({ moves: [foreignMove] })
    expect(captured.annotations).toEqual([])
    expect(renderCard({ moves: [foreignMove] }).unsafeCSS as string).not.toContain('data-column-number')
  })
})

const withOids: FileDiffMetadata = { ...fileDiff, prevObjectId: '1111111', newObjectId: '2222222' }

const changed: StructuralFile = {
  path: 'src/app.ts',
  language: 'TypeScript',
  unchanged: false,
  fellBack: false,
  changes: [{ before: { lineNumber: 2, ranges: [{ start: 4, end: 9 }] }, after: { lineNumber: 2, ranges: [{ start: 4, end: 9 }] } }],
}

function serve(body: StructuralResponse) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(body)))))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FileDiffCard structural mode', () => {
  it('leaves the server alone outside structural mode', () => {
    serve({ available: true, result: changed })
    renderCard({ fileDiff: withOids, diffStyle: 'split' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('colours only the rows difftastic reports for the open file', async () => {
    serve({ available: true, result: changed })
    renderCard({ fileDiff: withOids, diffStyle: 'structural' })
    await waitFor(() => expect(captured.options!.unsafeCSS as string).toContain(structuralCSS(changed)))
    expect(captured.options!.diffStyle).toBe('split')
  })

  it('says when a file only changed shape', async () => {
    serve({ available: true, result: { ...changed, unchanged: true, changes: [] } })
    renderCard({ fileDiff: withOids, diffStyle: 'structural' })
    expect(await screen.findByText(/No structural change/)).toBeInTheDocument()
  })

  it('reports a formatting-only change so the tree can mark it', async () => {
    serve({ available: true, result: { ...changed, unchanged: true, changes: [] } })
    const onStructuralResult = vi.fn()
    renderCard({ fileDiff: withOids, diffStyle: 'structural', onStructuralResult })
    await waitFor(() => expect(onStructuralResult).toHaveBeenCalledWith('src/app.ts', true))
  })

  it('reports a file that did change structurally', async () => {
    serve({ available: true, result: changed })
    const onStructuralResult = vi.fn()
    renderCard({ fileDiff: withOids, diffStyle: 'structural', onStructuralResult })
    await waitFor(() => expect(onStructuralResult).toHaveBeenCalledWith('src/app.ts', false))
  })

  it('falls back to the unified rows and names the reason', async () => {
    serve({ available: true, reason: 'difftastic result could not be read' })
    renderCard({ fileDiff: withOids, diffStyle: 'structural' })
    expect(await screen.findByText(/could not be read/)).toBeInTheDocument()
    expect(captured.options!.diffStyle).toBe('unified')
    expect(captured.options!.unsafeCSS as string).not.toContain('data-line-type')
  })
})
