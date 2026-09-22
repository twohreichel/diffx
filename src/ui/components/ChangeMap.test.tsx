// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FileGroup, SymbolEntry } from '../../map/buildChangeMap'
import { ChangeMap } from './ChangeMap'

const first: SymbolEntry = {
  file: 'src/app.ts',
  name: 'first',
  kind: 'function',
  firstChangedLine: 6,
  added: 1,
  removed: 1,
  magnitude: 0.5,
  tags: ['modified'],
}

const third: SymbolEntry = {
  file: 'src/app.ts',
  name: 'third',
  kind: 'function',
  firstChangedLine: 12,
  added: 4,
  removed: 0,
  magnitude: 1,
  tags: ['added', 'moved'],
}

const code: FileGroup = {
  path: 'src/app.ts',
  added: 5,
  removed: 1,
  magnitude: 1,
  structurallyUnchanged: false,
  named: true,
  entries: [first, third],
}

const notes: FileGroup = {
  path: 'notes.txt',
  added: 2,
  removed: 0,
  magnitude: 0.3,
  structurallyUnchanged: false,
  named: false,
  entries: [
    { file: 'notes.txt', name: 'top level', kind: 'toplevel', firstChangedLine: 1, added: 2, removed: 0, magnitude: 0.3, tags: ['added'] },
  ],
}

function renderMap(groups: FileGroup[], props: Partial<Parameters<typeof ChangeMap>[0]> = {}) {
  const onSelect = vi.fn()
  const onFilterChange = vi.fn()
  render(
    <ChangeMap
      groups={groups}
      filter={{ tag: 'all', path: '' }}
      onFilterChange={onFilterChange}
      onSelect={onSelect}
      onClose={vi.fn()}
      {...props}
    />,
  )
  return { onSelect, onFilterChange }
}

describe('ChangeMap', () => {
  it('lists the changed symbols under their file', () => {
    renderMap([code, notes])
    expect(screen.getByText('src/app.ts')).toBeInTheDocument()
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('third')).toBeInTheDocument()
    expect(screen.getByText('top level')).toBeInTheDocument()
  })

  it('shows what happened to a symbol', () => {
    renderMap([code])
    expect(screen.getByText('moved')).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeInTheDocument()
    expect(screen.getByText('-1')).toBeInTheDocument()
  })

  it('hands the chosen symbol back', async () => {
    const { onSelect } = renderMap([code])
    await userEvent.click(screen.getByText('third'))
    expect(onSelect).toHaveBeenCalledWith(third)
  })

  it('says when it cannot name the symbols of a file', () => {
    renderMap([notes])
    expect(screen.getByText(/no symbol patterns/i)).toBeInTheDocument()
  })

  it('reports a changed filter', async () => {
    const { onFilterChange } = renderMap([code])
    await userEvent.type(screen.getByPlaceholderText(/filter path/i), 'a')
    expect(onFilterChange).toHaveBeenCalledWith({ path: 'a' })
    await userEvent.selectOptions(screen.getByLabelText(/change kind/i), 'moved')
    expect(onFilterChange).toHaveBeenCalledWith({ tag: 'moved' })
  })

  it('says so while nothing matches the filter', () => {
    renderMap([], { filter: { tag: 'moved', path: '' } })
    expect(screen.getByText(/no symbol matches/i)).toBeInTheDocument()
  })
})
