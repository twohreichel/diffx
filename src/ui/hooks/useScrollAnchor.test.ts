// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { collectAnchorRows } from './useScrollAnchor'

/** Builds the card-plus-shadow-root shape the diff renderer produces. */
function renderCard(file: string, lines: { number?: string; type: string; top: number }[]) {
  const card = document.createElement('div')
  card.className = 'file-diff-card'
  card.id = `file-${file}`
  const host = document.createElement('div')
  card.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })
  for (const line of lines) {
    const gutter = document.createElement('div')
    if (line.number !== undefined) gutter.dataset.columnNumber = line.number
    gutter.dataset.lineType = line.type
    gutter.getBoundingClientRect = () => ({ top: line.top }) as DOMRect
    shadow.appendChild(gutter)
  }
  document.body.appendChild(card)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('collectAnchorRows', () => {
  it('reads file, line, side and position off the rendered rows', () => {
    renderCard('src/app.ts', [
      { number: '10', type: 'change-deletion', top: 40 },
      { number: '11', type: 'change-addition', top: 60 },
    ])
    expect(collectAnchorRows(document)).toEqual([
      { file: 'src/app.ts', line: 10, side: 'deletion', top: 40 },
      { file: 'src/app.ts', line: 11, side: 'addition', top: 60 },
    ])
  })

  it('marks both plain and expanded context as context', () => {
    renderCard('src/app.ts', [
      { number: '8', type: 'context', top: 20 },
      { number: '9', type: 'context-expanded', top: 30 },
    ])
    expect(collectAnchorRows(document).map((row) => row.side)).toEqual(['context', 'context'])
  })

  it('skips rows that carry no line number', () => {
    renderCard('src/app.ts', [{ type: 'change-addition', top: 40 }])
    expect(collectAnchorRows(document)).toEqual([])
  })

  it('keeps the rows of different files apart', () => {
    renderCard('src/a.ts', [{ number: '1', type: 'change-addition', top: 10 }])
    renderCard('src/b.ts', [{ number: '1', type: 'change-addition', top: 90 }])
    expect(collectAnchorRows(document).map((row) => row.file)).toEqual(['src/a.ts', 'src/b.ts'])
  })
})
