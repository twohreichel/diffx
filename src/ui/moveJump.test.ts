// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jumpToMove } from './moveJump'
import type { MoveRun } from '../moves'

const run: MoveRun = { path: 'src/a.ts', side: 'additions', startLine: 40, lineCount: 7 }

function renderCard({ withRow }: { withRow: boolean }) {
  const card = document.createElement('div')
  card.id = `file-${run.path}`
  card.scrollIntoView = vi.fn()
  const host = document.createElement('div')
  const shadow = host.attachShadow({ mode: 'open' })
  const column = document.createElement('div')
  column.setAttribute('data-additions', '')
  if (withRow) {
    const row = document.createElement('div')
    row.setAttribute('data-column-number', '40')
    row.scrollIntoView = vi.fn()
    column.append(row)
  }
  shadow.append(column)
  card.append(host)
  document.body.append(card)
  return { card, row: shadow.querySelector('[data-column-number="40"]') }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('jumpToMove', () => {
  it('brings the counterpart row on screen', () => {
    const { row } = renderCard({ withRow: true })
    expect(jumpToMove(run)).toBe(true)
    expect(row!.scrollIntoView).toHaveBeenCalled()
  })

  it('falls back to the file while the row is outside the rendered window', () => {
    const { card } = renderCard({ withRow: false })
    expect(jumpToMove(run)).toBe(true)
    expect(card.scrollIntoView).toHaveBeenCalled()
  })

  it('reports nothing to jump to when the file is not on the page', () => {
    expect(jumpToMove(run)).toBe(false)
  })
})
