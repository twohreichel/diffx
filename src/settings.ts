import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { DEFAULT_CONTEXT, parseContextWidth, type ContextWidth } from './context.js'

const CONFIG_DIR = join(homedir(), '.config', 'diffx')
const SETTINGS_FILE = join(CONFIG_DIR, 'settings.json')

export interface Settings {
  staged: boolean
  untracked: boolean
  diffStyle: 'split' | 'unified'
  defaultTabSize: number
  context: ContextWidth
  browser?: string
}

const DEFAULTS: Settings = {
  staged: true,
  untracked: true,
  diffStyle: 'split',
  defaultTabSize: 4,
  context: DEFAULT_CONTEXT,
}

export function loadSettings(): Settings {
  try {
    const data = readFileSync(SETTINGS_FILE, 'utf-8')
    const stored = JSON.parse(data)
    return { ...DEFAULTS, ...stored, context: parseContextWidth(stored.context) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = loadSettings()
  const merged = { ...current, ...settings }
  mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2))
  return merged
}
