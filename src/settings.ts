import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { DEFAULT_CONTEXT, parseContextWidth, type ContextWidth } from './context.js'
import { DEFAULT_LINE_DIFF, parseLineDiffMode, type LineDiffMode } from './lineDiff.js'
import {
  DEFAULT_AUTO_BLINK,
  DEFAULT_VIEW_MODE,
  parseAutoBlink,
  parseViewMode,
  type AutoBlink,
  type ViewMode,
} from './blink.js'
import { DEFAULT_MOVE_SETTINGS, parseMinLines, parseSimilarity } from './moves.js'

const CONFIG_DIR = join(homedir(), '.config', 'diffx')
const SETTINGS_FILE = join(CONFIG_DIR, 'settings.json')

export interface Settings {
  staged: boolean
  untracked: boolean
  diffStyle: ViewMode
  defaultTabSize: number
  context: ContextWidth
  lineDiff: LineDiffMode
  autoBlink: AutoBlink
  moveMinLines: number
  moveSimilarity: number
  browser?: string
}

const DEFAULTS: Settings = {
  staged: true,
  untracked: true,
  diffStyle: DEFAULT_VIEW_MODE,
  defaultTabSize: 4,
  context: DEFAULT_CONTEXT,
  lineDiff: DEFAULT_LINE_DIFF,
  autoBlink: DEFAULT_AUTO_BLINK,
  moveMinLines: DEFAULT_MOVE_SETTINGS.minLines,
  moveSimilarity: DEFAULT_MOVE_SETTINGS.similarity,
}

export function loadSettings(): Settings {
  try {
    const data = readFileSync(SETTINGS_FILE, 'utf-8')
    const stored = JSON.parse(data)
    return {
      ...DEFAULTS,
      ...stored,
      context: parseContextWidth(stored.context),
      lineDiff: parseLineDiffMode(stored.lineDiff),
      diffStyle: parseViewMode(stored.diffStyle),
      autoBlink: parseAutoBlink(stored.autoBlink),
      moveMinLines: parseMinLines(stored.moveMinLines),
      moveSimilarity: parseSimilarity(stored.moveSimilarity),
    }
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
