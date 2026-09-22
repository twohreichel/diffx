import { useState, useRef, useEffect } from 'react'
import { GitBranch, Settings } from 'lucide-react'
import type { DiffOptions } from '../hooks/useDiff'
import { CONTEXT_STEPS, type ContextWidth } from '../../context'
import { LINE_DIFF_MODES, type LineDiffMode } from '../../lineDiff'
import { AUTO_BLINK_OPTIONS, parseAutoBlink, type AutoBlink, type BlinkState, type ViewMode } from '../../blink'

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  split: 'Split',
  unified: 'Unified',
  blink: 'Blink',
}

const BLINK_HINT = 'Space swaps before and after, n and p jump between changes'

const LINE_DIFF_LABELS: Record<LineDiffMode, string> = {
  word: 'Word',
  char: 'Character',
  off: 'Off',
}

interface ToolbarProps {
  repoName: string
  branch: string
  fileCount: number
  additions: number
  deletions: number
  commentCount: number
  diffStyle: ViewMode
  blinkState: BlinkState
  autoBlink: AutoBlink
  reducedMotion: boolean
  context: ContextWidth
  contextDisabled: boolean
  lineDiff: LineDiffMode
  diffOptions: DiffOptions
  defaultTabSize: number
  softWrap: boolean
  browser?: string
  customMode: boolean
  onDiffStyleChange: (style: ViewMode) => void
  onAutoBlinkChange: (interval: AutoBlink) => void
  onContextChange: (context: ContextWidth) => void
  onLineDiffChange: (mode: LineDiffMode) => void
  onDiffOptionsChange: (options: DiffOptions) => void
  onDefaultTabSizeChange: (size: number) => void
  onSoftWrapChange: (softWrap: boolean) => void
  onBrowserChange: (browser: string) => void
  onCopyComments: () => Promise<void>
}

export function Toolbar({
  repoName,
  branch,
  fileCount,
  additions,
  deletions,
  commentCount,
  diffStyle,
  blinkState,
  autoBlink,
  reducedMotion,
  context,
  contextDisabled,
  lineDiff,
  diffOptions,
  defaultTabSize,
  softWrap,
  browser,
  customMode,
  onDiffStyleChange,
  onAutoBlinkChange,
  onContextChange,
  onLineDiffChange,
  onDiffOptionsChange,
  onDefaultTabSizeChange,
  onSoftWrapChange,
  onBrowserChange,
  onCopyComments,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    await onCopyComments()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <h1 className="toolbar-title">{repoName}</h1>
        {branch && (
          <span className="toolbar-branch">
            <GitBranch size={12} />
            {branch}
          </span>
        )}
        <span className="toolbar-stat">
          {fileCount} file{fileCount !== 1 ? 's' : ''} changed
          {additions > 0 && <span className="stat-additions"> +{additions}</span>}
          {deletions > 0 && <span className="stat-deletions"> -{deletions}</span>}
        </span>
      </div>
      <div className="toolbar-right">
        <div className="toolbar-toggle">
          {(Object.keys(VIEW_MODE_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${diffStyle === mode ? 'btn-active' : ''}`}
              title={mode === 'blink' ? BLINK_HINT : undefined}
              onClick={() => onDiffStyleChange(mode)}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        {diffStyle === 'blink' && (
          <span
            className={`blink-state blink-state-${blinkState}`}
            role="status"
            aria-label="Blink state"
            title={BLINK_HINT}
          >
            {blinkState === 'before' ? 'BEFORE' : 'AFTER'}
          </span>
        )}
        <div
          className="toolbar-context"
          role="group"
          aria-label="Context"
          title={
            diffStyle === 'blink'
              ? 'Blink renders the whole file, so context does not apply'
              : contextDisabled
                ? 'Context does not apply: this diff contains only binary files'
                : 'Lines of unchanged context around each change'
          }
        >
          <span className="toolbar-context-label">Context</span>
          <div className="toolbar-toggle">
            {CONTEXT_STEPS.map((step) => (
              <button
                key={String(step)}
                data-context={step}
                className={`btn btn-sm ${context === step ? 'btn-active' : ''}`}
                aria-pressed={context === step}
                disabled={contextDisabled || diffStyle === 'blink'}
                onClick={() => onContextChange(step)}
              >
                {step === 'full' ? 'Full' : step}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-wrapper" ref={settingsRef}>
          <button
            className={`btn btn-sm settings-btn ${settingsOpen ? 'btn-active' : ''}`}
            onClick={() => setSettingsOpen(!settingsOpen)}
            title="Settings"
          >
            <Settings size={14} />
          </button>
          {settingsOpen && (
            <div className="settings-menu">
              {!customMode && (
                <>
                  <label className="settings-item">
                    <input
                      type="checkbox"
                      checked={diffOptions.staged}
                      onChange={(e) =>
                        onDiffOptionsChange({ ...diffOptions, staged: e.target.checked })
                      }
                    />
                    Show staged
                  </label>
                  <label className="settings-item">
                    <input
                      type="checkbox"
                      checked={diffOptions.untracked}
                      onChange={(e) =>
                        onDiffOptionsChange({ ...diffOptions, untracked: e.target.checked })
                      }
                    />
                    Show untracked
                  </label>
                </>
              )}
              <label className="settings-item">
                <input
                  type="checkbox"
                  checked={softWrap}
                  onChange={(e) => onSoftWrapChange(e.target.checked)}
                />
                Soft wrap
              </label>
              <div className="settings-item settings-item-spaced">
                <label htmlFor="line-diff-select">Intra-line diff</label>
                <select
                  id="line-diff-select"
                  className="settings-select"
                  value={lineDiff}
                  onChange={(e) => onLineDiffChange(e.target.value as LineDiffMode)}
                >
                  {LINE_DIFF_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {LINE_DIFF_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </div>
              {diffStyle === 'blink' && !reducedMotion && (
                <div className="settings-item settings-item-spaced">
                  <label htmlFor="auto-blink-select">Auto blink</label>
                  <select
                    id="auto-blink-select"
                    className="settings-select"
                    value={String(autoBlink)}
                    onChange={(e) => onAutoBlinkChange(parseAutoBlink(Number(e.target.value) || 'off'))}
                  >
                    {AUTO_BLINK_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option === 'off' ? 'Off' : `${option} ms`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="settings-item settings-item-spaced">
                <span>Default tab size</span>
                <select
                  className="settings-select"
                  value={defaultTabSize}
                  onChange={(e) => onDefaultTabSizeChange(Number(e.target.value))}
                >
                  <option value={2}>2</option>
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                </select>
              </div>
              <div className="settings-item settings-item-spaced">
                <span>Browser</span>
                <select
                  className="settings-select"
                  value={browser || ''}
                  onChange={(e) => {
                    onBrowserChange(e.target.value)
                    setSettingsOpen(false)
                  }}
                >
                  <option value="">Default</option>
                  <option value="chrome">Chrome</option>
                  <option value="firefox">Firefox</option>
                  <option value="edge">Edge</option>
                  <option value="brave">Brave</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleCopy}
          disabled={commentCount === 0}
        >
          {copied ? 'Copied!' : `Copy comments (${commentCount})`}
        </button>
      </div>
    </div>
  )
}
