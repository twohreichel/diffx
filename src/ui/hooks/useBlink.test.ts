// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useBlink } from './useBlink'
import type { ChangeRegion } from '../../blink'

const REGIONS: ChangeRegion[] = [
  { file: 'src/app.ts', additionLine: 12, deletionLine: 12 },
  { file: 'src/app.ts', additionLine: 40, deletionLine: 38 },
]

/** Builds the scroll container and the card-plus-shadow-root the renderer produces. */
function renderPane(rows: { column: 'additions' | 'deletions'; number: string; top: number }[]) {
  const scroller = document.createElement('div')
  scroller.className = 'main-scroll'
  scroller.getBoundingClientRect = () => ({ top: 100 }) as DOMRect
  Object.defineProperty(scroller, 'clientHeight', { value: 600, configurable: true })
  scroller.scrollTop = 0

  const card = document.createElement('div')
  card.className = 'file-diff-card'
  card.id = 'file-src/app.ts'
  const host = document.createElement('div')
  card.appendChild(host)
  const shadow = host.attachShadow({ mode: 'open' })
  for (const column of ['deletions', 'additions'] as const) {
    const code = document.createElement('code')
    code.setAttribute(`data-${column}`, '')
    for (const row of rows.filter((r) => r.column === column)) {
      const gutter = document.createElement('div')
      gutter.dataset.columnNumber = row.number
      gutter.getBoundingClientRect = () => ({ top: row.top }) as DOMRect
      code.appendChild(gutter)
    }
    shadow.appendChild(code)
  }

  scroller.appendChild(card)
  document.body.appendChild(scroller)
  return scroller
}

function press(key: string): void {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  })
}

function setup(overrides: Partial<Parameters<typeof useBlink>[0]> = {}) {
  return renderHook(() =>
    useBlink({ enabled: true, regions: REGIONS, autoBlink: 'off', reducedMotion: false, ...overrides }),
  )
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('useBlink toggle', () => {
  it('starts on the after state, which is what the other modes show', () => {
    expect(setup().result.current.blinkState).toBe('after')
  })

  it('swaps the state on the space bar', () => {
    const { result } = setup()
    press(' ')
    expect(result.current.blinkState).toBe('before')
    press(' ')
    expect(result.current.blinkState).toBe('after')
  })

  it('leaves the space bar alone outside blink mode', () => {
    const { result } = setup({ enabled: false })
    press(' ')
    expect(result.current.blinkState).toBe('after')
  })
})

describe('useBlink navigation', () => {
  it('brings the next change to the upper third of the pane', () => {
    const scroller = renderPane([
      { column: 'additions', number: '12', top: 300 },
      { column: 'additions', number: '40', top: 900 },
    ])
    setup()
    press('n')
    // 300 - 100 - 600/3
    expect(scroller.scrollTop).toBe(0)
    press('n')
    expect(scroller.scrollTop).toBe(600)
  })

  it('reads the column the state shows, so the position holds across a toggle', () => {
    const scroller = renderPane([
      { column: 'additions', number: '12', top: 300 },
      { column: 'deletions', number: '12', top: 300 },
    ])
    setup()
    press(' ')
    press('n')
    expect(scroller.scrollTop).toBe(0)
  })

  it('wraps backwards to the last change', () => {
    const scroller = renderPane([
      { column: 'additions', number: '12', top: 300 },
      { column: 'additions', number: '40', top: 900 },
    ])
    setup()
    press('p')
    expect(scroller.scrollTop).toBe(600)
  })

  it('keeps the state it was in while navigating', () => {
    renderPane([{ column: 'deletions', number: '12', top: 300 }])
    const { result } = setup()
    press(' ')
    press('n')
    expect(result.current.blinkState).toBe('before')
  })
})

describe('useBlink auto blink', () => {
  it('alternates on the chosen interval', () => {
    vi.useFakeTimers()
    const { result } = setup({ autoBlink: 800 })
    act(() => void vi.advanceTimersByTime(800))
    expect(result.current.blinkState).toBe('before')
    act(() => void vi.advanceTimersByTime(800))
    expect(result.current.blinkState).toBe('after')
  })

  it('stops on any key, as a reader reaching for the keyboard expects', () => {
    vi.useFakeTimers()
    const { result } = setup({ autoBlink: 400 })
    press('j')
    act(() => void vi.advanceTimersByTime(4000))
    expect(result.current.blinkState).toBe('after')
  })

  it('never starts for a reader who asked for no motion', () => {
    vi.useFakeTimers()
    const { result } = setup({ autoBlink: 400, reducedMotion: true })
    act(() => void vi.advanceTimersByTime(4000))
    expect(result.current.blinkState).toBe('after')
  })

  it('never starts outside blink mode', () => {
    vi.useFakeTimers()
    const { result } = setup({ autoBlink: 400, enabled: false })
    act(() => void vi.advanceTimersByTime(4000))
    expect(result.current.blinkState).toBe('after')
  })
})
