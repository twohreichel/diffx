// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { FileDiffMetadata } from '@pierre/diffs'
import { FileTree } from './FileTree'

function file(name: string): FileDiffMetadata {
  return {
    name,
    type: 'change',
    hunks: [],
    splitLineCount: 0,
    unifiedLineCount: 0,
    isPartial: true,
    deletionLines: [],
    additionLines: [],
  }
}

function renderTree(structurallyUnchanged: string[]) {
  render(
    <FileTree
      files={[file('src/app.ts'), file('src/other.ts')]}
      activeFile={null}
      commentCounts={{}}
      viewedFiles={new Set()}
      untrackedFiles={new Set()}
      structurallyUnchanged={new Set(structurallyUnchanged)}
      onFileClick={vi.fn()}
    />,
  )
}

describe('FileTree structural marks', () => {
  it('marks the file whose change is formatting only', () => {
    renderTree(['src/app.ts'])
    const marked = screen.getAllByTitle(/only formatting/i)
    expect(marked).toHaveLength(1)
    expect(marked[0].closest('.ft-file')).toHaveTextContent('app.ts')
  })

  it('leaves every other file unmarked', () => {
    renderTree([])
    expect(screen.queryByTitle(/only formatting/i)).toBeNull()
  })
})
