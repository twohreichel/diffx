import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseDifft } from './structural.js'
import { structuralCSS, structuralNotice } from './structuralView.js'

const sample = (name: string) =>
  parseDifft(JSON.parse(readFileSync(join(__dirname, '..', 'specs', '005-structural-diff', 'contracts', name), 'utf-8')))

describe('structuralCSS', () => {
  it('takes the change colour off every row', () => {
    const css = structuralCSS(sample('sample-difft-unchanged.json'))
    expect(css).toContain('[data-line-type="change-addition"][data-line][data-line-index]')
    expect(css).toContain('[data-line-type="change-deletion"][data-line][data-line-index]')
    expect(css).toContain('--diffs-bg-context')
  })

  it('gives the colour back to the lines that changed structurally', () => {
    const css = structuralCSS(sample('sample-difft.json'))
    expect(css).toContain('[data-line-type="change-deletion"][data-line="2"][data-line-index]')
    expect(css).toContain('[data-line-type="change-addition"][data-line="2"][data-line-index]')
    expect(css).toContain('var(--diffs-bg-addition)')
    expect(css.indexOf('[data-line="2"]')).toBeGreaterThan(css.indexOf('[data-line][data-line-index]'))
  })

  it('leaves a reformat without a single coloured row', () => {
    expect(structuralCSS(sample('sample-difft-unchanged.json'))).not.toContain('data-line="')
  })
})

describe('structuralNotice', () => {
  it('says a file only changed shape', () => {
    expect(structuralNotice(sample('sample-difft-unchanged.json'))).toContain('No structural change')
  })

  it('says when difftastic found no grammar', () => {
    expect(structuralNotice(sample('sample-difft-text.json'))).toContain('no grammar')
  })

  it('says nothing about an ordinary result', () => {
    expect(structuralNotice(sample('sample-difft.json'))).toBe('')
  })
})
