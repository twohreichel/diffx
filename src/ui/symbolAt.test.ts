// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { symbolFromPath } from './symbolAt'

function element(text: string): Element {
  const span = document.createElement('span')
  span.textContent = text
  return span
}

describe('symbolFromPath', () => {
  it('reads the identifier the click landed on', () => {
    expect(symbolFromPath([element('render')])).toBe('render')
  })

  it('ignores the whitespace around the token', () => {
    expect(symbolFromPath([element('  render ')])).toBe('render')
  })

  it('says nothing for a whole line of code', () => {
    expect(symbolFromPath([element('const total = render(2)')])).toBeNull()
  })

  it('says nothing for punctuation', () => {
    expect(symbolFromPath([element('(')])).toBeNull()
  })

  it('says nothing for a number', () => {
    expect(symbolFromPath([element('42')])).toBeNull()
  })

  it('says nothing when the click reached no element', () => {
    expect(symbolFromPath([])).toBeNull()
  })
})
