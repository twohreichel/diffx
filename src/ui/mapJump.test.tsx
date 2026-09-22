// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { entryTarget, jumpToMove } from './moveJump'
import { ChangeMap } from './components/ChangeMap'
import type { FileGroup, SymbolEntry } from '../map/buildChangeMap'

const gained: SymbolEntry = {
  file: 'src/app.ts',
  name: 'render',
  kind: 'function',
  firstChangedLine: 42,
  added: 4,
  removed: 1,
  magnitude: 1,
  tags: ['modified'],
}

const lost: SymbolEntry = { ...gained, name: 'drop', firstChangedLine: 12, added: 0, removed: 3, tags: ['removed'] }

const group: FileGroup = {
  path: 'src/app.ts',
  added: 4,
  removed: 4,
  magnitude: 1,
  structurallyUnchanged: false,
  named: true,
  entries: [gained, lost],
}

function renderCard(line: number) {
  const card = document.createElement('div')
  card.id = 'file-src/app.ts'
  card.scrollIntoView = vi.fn()
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const column = document.createElement('div')
  column.setAttribute('data-additions', '')
  const row = document.createElement('div')
  row.setAttribute('data-column-number', String(line))
  row.scrollIntoView = vi.fn()
  column.append(row)
  shadow.append(column)
  card.append(host)
  document.body.append(card)
  return row
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('entryTarget', () => {
  it('aims at the new side of a symbol that gained lines', () => {
    expect(entryTarget(gained)).toEqual({ path: 'src/app.ts', side: 'additions', startLine: 42 })
  })

  it('aims at the old side of a symbol that only lost lines', () => {
    expect(entryTarget(lost)).toEqual({ path: 'src/app.ts', side: 'deletions', startLine: 12 })
  })
})

describe('clicking a map entry', () => {
  it('scrolls to the first changed line of that symbol', async () => {
    const row = renderCard(42)
    render(
      <ChangeMap
        groups={[group]}
        filter={{ tag: 'all', path: '' }}
        onFilterChange={vi.fn()}
        onSelect={(entry) => jumpToMove(entryTarget(entry))}
        onClose={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByText('render'))

    expect(row.scrollIntoView).toHaveBeenCalled()
  })
})
