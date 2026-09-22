import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LINE_DIFF,
  LINE_DIFF_MODES,
  lineDiffType,
  parseLineDiffMode,
} from './lineDiff'

describe('LINE_DIFF_MODES', () => {
  it('offers word, character and off', () => {
    expect(LINE_DIFF_MODES).toEqual(['word', 'char', 'off'])
  })

  it('starts at word granularity', () => {
    expect(DEFAULT_LINE_DIFF).toBe('word')
  })
})

describe('lineDiffType', () => {
  it('joins adjacent segments at word granularity', () => {
    expect(lineDiffType('word')).toBe('word-alt')
  })

  it('passes character granularity through', () => {
    expect(lineDiffType('char')).toBe('char')
  })

  it('turns the renderer emphasis off', () => {
    expect(lineDiffType('off')).toBe('none')
  })
})

describe('parseLineDiffMode', () => {
  it('keeps every stored mode', () => {
    for (const mode of LINE_DIFF_MODES) {
      expect(parseLineDiffMode(mode)).toBe(mode)
    }
  })

  it('falls back to the default for anything else', () => {
    for (const raw of [undefined, null, '', 'none', 'word-alt', 3, {}]) {
      expect(parseLineDiffMode(raw)).toBe(DEFAULT_LINE_DIFF)
    }
  })
})
