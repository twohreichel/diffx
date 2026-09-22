import { describe, it, expect } from 'vitest'
import {
  CONTEXT_STEPS,
  DEFAULT_CONTEXT,
  FULL_CONTEXT_LINE_CAP,
  contextArgs,
  estimateTotalLines,
  hasContextFlag,
  parseContextWidth,
  stepContext,
} from './context.js'

describe('contextArgs', () => {
  it('maps a numeric width to a single -U flag', () => {
    expect(contextArgs(0)).toEqual(['-U0'])
    expect(contextArgs(3)).toEqual(['-U3'])
    expect(contextArgs(10)).toEqual(['-U10'])
  })

  it('maps full to a width no file reaches, so git emits every line', () => {
    expect(contextArgs('full')).toEqual(['-U1000000'])
  })
})

describe('parseContextWidth', () => {
  it('accepts every step of the range', () => {
    expect(parseContextWidth('0')).toBe(0)
    expect(parseContextWidth('3')).toBe(3)
    expect(parseContextWidth('10')).toBe(10)
    expect(parseContextWidth('full')).toBe('full')
  })

  it('falls back to the default for anything else', () => {
    expect(parseContextWidth(undefined)).toBe(DEFAULT_CONTEXT)
    expect(parseContextWidth('')).toBe(DEFAULT_CONTEXT)
    expect(parseContextWidth('7')).toBe(DEFAULT_CONTEXT)
    expect(parseContextWidth('-1')).toBe(DEFAULT_CONTEXT)
    expect(parseContextWidth('1e3')).toBe(DEFAULT_CONTEXT)
    expect(parseContextWidth('FULL')).toBe(DEFAULT_CONTEXT)
  })
})

describe('stepContext', () => {
  it('walks the range one step at a time', () => {
    expect(stepContext(0, 1)).toBe(3)
    expect(stepContext(3, 1)).toBe(10)
    expect(stepContext(10, 1)).toBe('full')
    expect(stepContext('full', -1)).toBe(10)
  })

  it('is a no-op at both ends', () => {
    expect(stepContext(0, -1)).toBe(0)
    expect(stepContext('full', 1)).toBe('full')
  })

  it('covers the whole declared range', () => {
    expect(CONTEXT_STEPS).toEqual([0, 3, 10, 'full'])
  })
})

describe('hasContextFlag', () => {
  it('recognises every spelling git accepts', () => {
    expect(hasContextFlag(['-U0'])).toBe(true)
    expect(hasContextFlag(['-U', '5'])).toBe(true)
    expect(hasContextFlag(['--unified'])).toBe(true)
    expect(hasContextFlag(['--unified=8'])).toBe(true)
    expect(hasContextFlag(['-u'])).toBe(true)
    expect(hasContextFlag(['HEAD~1', '--stat', '-U2'])).toBe(true)
  })

  it('does not fire on unrelated arguments', () => {
    expect(hasContextFlag([])).toBe(false)
    expect(hasContextFlag(['HEAD~1', '--stat'])).toBe(false)
    expect(hasContextFlag(['--unified-is-not-a-flag'])).toBe(false)
    expect(hasContextFlag(['-w'])).toBe(false)
  })
})

describe('estimateTotalLines', () => {
  it('takes the furthest line a hunk reaches, per file', () => {
    const files = [
      { hunks: [{ additionStart: 1, additionCount: 8 }, { additionStart: 40, additionCount: 12 }] },
      { hunks: [{ additionStart: 5, additionCount: 3 }] },
    ]
    expect(estimateTotalLines(files)).toBe(51 + 7)
  })

  it('is zero for a file without hunks', () => {
    expect(estimateTotalLines([{ hunks: [] }])).toBe(0)
  })

  it('stays under the cap for an ordinary change', () => {
    const files = [{ hunks: [{ additionStart: 1, additionCount: 200 }] }]
    expect(estimateTotalLines(files)).toBeLessThan(FULL_CONTEXT_LINE_CAP)
  })
})
