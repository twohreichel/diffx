import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const home = mkdtempSync(join(tmpdir(), 'diffx-settings-'))
vi.mock('node:os', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:os')>()),
  homedir: () => home,
}))

const { loadSettings } = await import('./settings.js')

const settingsFile = join(home, '.config', 'diffx', 'settings.json')

function writeSettings(raw: unknown): void {
  mkdirSync(join(home, '.config', 'diffx'), { recursive: true })
  writeFileSync(settingsFile, JSON.stringify(raw))
}

describe('loadSettings', () => {
  beforeEach(() => rmSync(settingsFile, { force: true }))
  afterEach(() => rmSync(settingsFile, { force: true }))

  it('defaults the context width to three lines', () => {
    expect(loadSettings().context).toBe(3)
  })

  it('keeps a stored width', () => {
    writeSettings({ context: 'full' })
    expect(loadSettings().context).toBe('full')
    writeSettings({ context: 0 })
    expect(loadSettings().context).toBe(0)
  })

  it('falls back to the default for a width outside the range', () => {
    writeSettings({ context: 99 })
    expect(loadSettings().context).toBe(3)
    writeSettings({ context: 'everything' })
    expect(loadSettings().context).toBe(3)
  })

  it('defaults intra-line granularity to word', () => {
    expect(loadSettings().lineDiff).toBe('word')
  })

  it('keeps a stored granularity and rejects an unknown one', () => {
    writeSettings({ lineDiff: 'char' })
    expect(loadSettings().lineDiff).toBe('char')
    writeSettings({ lineDiff: 'grapheme' })
    expect(loadSettings().lineDiff).toBe('word')
  })

  it('defaults the view mode to split and auto blink to off', () => {
    const settings = loadSettings()
    expect(settings.diffStyle).toBe('split')
    expect(settings.autoBlink).toBe('off')
  })

  it('keeps a stored blink mode and interval, and rejects unknown ones', () => {
    writeSettings({ diffStyle: 'blink', autoBlink: 1600 })
    const settings = loadSettings()
    expect(settings.diffStyle).toBe('blink')
    expect(settings.autoBlink).toBe(1600)
    writeSettings({ diffStyle: 'flicker', autoBlink: 250 })
    const fallback = loadSettings()
    expect(fallback.diffStyle).toBe('split')
    expect(fallback.autoBlink).toBe('off')
  })

  it('defaults the move thresholds to five lines and 0.8 similarity', () => {
    const settings = loadSettings()
    expect(settings.moveMinLines).toBe(5)
    expect(settings.moveSimilarity).toBe(0.8)
  })

  it('keeps stored move thresholds and rejects unknown ones', () => {
    writeSettings({ moveMinLines: 20, moveSimilarity: 1 })
    const settings = loadSettings()
    expect(settings.moveMinLines).toBe(20)
    expect(settings.moveSimilarity).toBe(1)
    writeSettings({ moveMinLines: 7, moveSimilarity: 0.55 })
    const fallback = loadSettings()
    expect(fallback.moveMinLines).toBe(5)
    expect(fallback.moveSimilarity).toBe(0.8)
  })

  it('compares comments along with the code unless told otherwise', () => {
    expect(loadSettings().ignoreComments).toBe(false)
  })

  it('keeps a stored ignore-comments choice', () => {
    writeSettings({ ignoreComments: true })
    expect(loadSettings().ignoreComments).toBe(true)
  })

  it('leaves the other settings untouched', () => {
    writeSettings({ diffStyle: 'unified', defaultTabSize: 2 })
    const settings = loadSettings()
    expect(settings.diffStyle).toBe('unified')
    expect(settings.defaultTabSize).toBe(2)
    expect(settings.staged).toBe(true)
  })
})
