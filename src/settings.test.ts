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

  it('leaves the other settings untouched', () => {
    writeSettings({ diffStyle: 'unified', defaultTabSize: 2 })
    const settings = loadSettings()
    expect(settings.diffStyle).toBe('unified')
    expect(settings.defaultTabSize).toBe(2)
    expect(settings.staged).toBe(true)
  })
})
