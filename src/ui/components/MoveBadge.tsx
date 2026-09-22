import type { MovePair, MoveRun } from '../../moves'

interface MoveBadgeProps {
  pair: MovePair
  /** Which end of the pair this badge sits on. */
  role: 'from' | 'to'
  onJump: (run: MoveRun) => void
}

function state(pair: MovePair): string {
  if (pair.ambiguous) return 'more than one match'
  if (pair.kind === 'exact') return 'unchanged'
  const count = pair.changedLines.length
  return `${count} line${count === 1 ? '' : 's'} changed`
}

/** The paired marker on a moved block, and the way to its counterpart. */
export function MoveBadge({ pair, role, onJump }: MoveBadgeProps) {
  const counterpart = role === 'from' ? pair.to : pair.from
  const direction = role === 'from' ? 'moved to' : 'moved from'
  const lines = role === 'from' ? pair.from.lineCount : pair.to.lineCount

  return (
    <button
      className="move-badge"
      onClick={() => onJump(counterpart)}
      title="Jump to the counterpart of this block"
    >
      <span className="move-badge-glyph" aria-hidden="true">
        ⇄
      </span>
      <span className="move-badge-id">{pair.id}</span>
      <span>
        {lines} lines {direction} {counterpart.path}:{counterpart.startLine} — {state(pair)}
      </span>
    </button>
  )
}
