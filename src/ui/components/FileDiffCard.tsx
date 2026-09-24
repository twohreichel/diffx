import { useState, useRef, useEffect, memo } from 'react'
import { FileDiff } from '@pierre/diffs/react'
import type { DiffLineAnnotation, FileDiffMetadata, AnnotationSide } from '@pierre/diffs'
import type { ReviewComment } from '../../types'
import { CommentForm } from './CommentForm'
import { CommentBubble } from './CommentBubble'
import { hiddenAnnotations } from '../hiddenComments'
import { MAX_LINE_DIFF_LENGTH, lineDiffType, type LineDiffMode } from '../../lineDiff'
import { blinkCSS, rendererDiffStyle, type BlinkState, type ViewMode } from '../../blink'
import { movesCSS, type MovePair, type MoveRun } from '../../moves'
import { structuralCSS, structuralNotice } from '../../structuralView'
import { useOnScreen } from '../hooks/useOnScreen'
import { useStructural, type StructuralQuery, type StructuralState } from '../hooks/useStructural'
import { MoveBadge } from './MoveBadge'

const STRUCTURAL_LOADING = 'Comparing syntax trees…'

/** The one line a structural result gets, empty when it has nothing to add. */
function structuralLine(structural: StructuralState): string {
  if (structural.loading) return STRUCTURAL_LOADING
  if (structural.reason) return structural.reason
  return structural.result ? structuralNotice(structural.result) : ''
}

interface PendingComment {
  side: AnnotationSide
  lineNumber: number
}

interface MoveMarker {
  _move: MovePair
  role: 'from' | 'to'
}

type CardAnnotation = ReviewComment | { _pending: true } | MoveMarker

/** A badge on each end of a pair that has an end in this file. */
function moveAnnotations(moves: MovePair[], filePath: string): DiffLineAnnotation<MoveMarker>[] {
  return moves.flatMap((pair) => [
    ...(pair.from.path === filePath
      ? [{ side: 'deletions' as const, lineNumber: pair.from.startLine, metadata: { _move: pair, role: 'from' as const } }]
      : []),
    ...(pair.to.path === filePath
      ? [{ side: 'additions' as const, lineNumber: pair.to.startLine, metadata: { _move: pair, role: 'to' as const } }]
      : []),
  ])
}

interface FileDiffCardProps {
  id?: string
  fileDiff: FileDiffMetadata
  filePath: string
  annotations: DiffLineAnnotation<ReviewComment>[]
  moves: MovePair[]
  onJumpToMove: (run: MoveRun) => void
  structuralQuery: StructuralQuery
  structuralAvailable: boolean
  onStructuralResult: (filePath: string, unchanged: boolean) => void
  onToggleStructural: (filePath: string) => void
  diffStyle: ViewMode
  blinkState: BlinkState
  lineDiff: LineDiffMode
  tabSize: number
  softWrap: boolean
  viewed: boolean
  onViewedChange: (filePath: string, viewed: boolean) => void
  onAddComment: (filePath: string, side: AnnotationSide, lineNumber: number, lineContent: string, body: string) => void
  onDeleteComment: (id: string) => void
  onEditComment: (id: string, body: string) => void
  onCommentStatusChange: (id: string, status: ReviewComment['status']) => void
}

export const FileDiffCard = memo(function FileDiffCard({
  id,
  fileDiff,
  filePath,
  annotations,
  moves,
  onJumpToMove,
  structuralQuery,
  structuralAvailable,
  onStructuralResult,
  onToggleStructural,
  diffStyle,
  blinkState,
  lineDiff,
  tabSize,
  softWrap,
  viewed,
  onViewedChange,
  onAddComment,
  onDeleteComment,
  onEditComment,
  onCommentStatusChange,
}: FileDiffCardProps) {
  const [pending, setPending] = useState<PendingComment | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const onScreen = useOnScreen(card)

  const hidden = hiddenAnnotations(fileDiff, annotations)
  const blink = diffStyle === 'blink'

  // FR-010: the comparison is asked for per file, and only once the file is in
  // view — the whole diff mounts at once, but most of it is never looked at.
  const structural = useStructural(
    diffStyle === 'structural' && onScreen && fileDiff.prevObjectId && fileDiff.newObjectId
      ? { ...structuralQuery, path: filePath, oldOid: fileDiff.prevObjectId, newOid: fileDiff.newObjectId }
      : null,
  )
  const marked = structural.result && !structural.result.fellBack ? structural.result : null
  // Without a usable structural result the file keeps its line-based rows, and
  // the notice above them carries the reason.
  const fellBackToLines = diffStyle === 'structural' && marked === null && !structural.loading
  const notice = structuralLine(structural)

  useEffect(() => {
    if (structural.result) onStructuralResult(filePath, structural.result.unchanged)
  }, [filePath, structural.result, onStructuralResult])

  const getLineContent = (side: AnnotationSide, lineNumber: number): string => {
    const lines = side === 'additions' ? fileDiff.additionLines : fileDiff.deletionLines
    // Full (non-partial) diffs carry the entire file, so any line — including
    // expanded context outside hunks — can be addressed directly.
    if (!fileDiff.isPartial) {
      return lines[lineNumber - 1] ?? ''
    }
    const startKey = side === 'additions' ? 'additionStart' : 'deletionStart'
    const countKey = side === 'additions' ? 'additionCount' : 'deletionCount'
    const indexKey = side === 'additions' ? 'additionLineIndex' : 'deletionLineIndex'
    for (const hunk of fileDiff.hunks) {
      const start = hunk[startKey]
      const count = hunk[countKey]
      if (lineNumber >= start && lineNumber < start + count) {
        const index = hunk[indexKey] + (lineNumber - start)
        return lines[index] ?? ''
      }
    }
    return ''
  }

  const allAnnotations: DiffLineAnnotation<CardAnnotation>[] = [
    ...annotations,
    ...moveAnnotations(moves, filePath),
    ...(pending
      ? [
          {
            side: pending.side,
            lineNumber: pending.lineNumber,
            metadata: { _pending: true as const },
          },
        ]
      : []),
  ]

  return (
    <div className={`file-diff-card ${viewed ? 'file-diff-viewed' : ''}`} id={id} ref={card}>
      {viewed ? (
        <div className="file-diff-viewed-header">
          <span className="file-diff-viewed-name">{filePath}</span>
          <label className="viewed-label viewed-checked" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={viewed}
              onChange={(e) => onViewedChange(filePath, e.target.checked)}
            />
            Viewed
          </label>
        </div>
      ) : (
        <>
          {notice && <p className="structural-notice">{notice}</p>}
          <FileDiff<CardAnnotation>
            fileDiff={fileDiff}
            options={{
              diffStyle: fellBackToLines ? 'unified' : rendererDiffStyle(diffStyle),
              stickyHeader: true,
              expansionLineCount: 20,
              enableGutterUtility: true,
              theme: { dark: 'github-dark', light: 'github-light' },
              themeType: 'system',
              // Wrapped split columns share one grid through `display: contents`,
              // so hiding a column there would collapse the layout.
              overflow: softWrap && !blink ? 'wrap' : 'scroll',
              lineDiffType: lineDiffType(lineDiff),
              maxLineDiffLength: MAX_LINE_DIFF_LENGTH,
              // The renderer marks intra-line segments by background alone. The
              // underline adds the second, non-colour cue Constitution IX asks for.
              unsafeCSS:
                `:host { --diffs-tab-size: ${tabSize}; } [data-diff-span] { border-bottom: 2px solid var(--diffs-fg); }` +
                (blink ? blinkCSS(blinkState) : '') +
                movesCSS(moves, filePath) +
                (marked ? structuralCSS(marked) : ''),
            }}
            lineAnnotations={allAnnotations}
            renderHeaderMetadata={() => (
              <>
                {structuralAvailable && (
                  <button
                    className="btn btn-sm structural-toggle"
                    title={
                      diffStyle === 'structural'
                        ? 'Show the line-based rows for this file'
                        : 'Compare this file structurally, leaving the other files as they are'
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleStructural(filePath)
                    }}
                  >
                    {diffStyle === 'structural' ? 'Lines' : 'Structural'}
                  </button>
                )}
                {hidden.length > 0 && (
                  <span
                    className="hidden-comment-badge"
                    title={`${hidden.length} comment(s) on lines the current context width leaves out`}
                  >
                    {hidden.length} hidden
                  </span>
                )}
                <label className="viewed-label" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={viewed}
                    onChange={(e) => onViewedChange(filePath, e.target.checked)}
                  />
                  Viewed
                </label>
              </>
            )}
            renderAnnotation={(annotation) => {
              if ('_move' in annotation.metadata) {
                const marker = annotation.metadata
                return <MoveBadge pair={marker._move} role={marker.role} onJump={onJumpToMove} />
              }
              if ('_pending' in annotation.metadata) {
                return (
                  <CommentForm
                    onSubmit={(body) => {
                      const lineContent = getLineContent(pending!.side, pending!.lineNumber)
                      onAddComment(filePath, pending!.side, pending!.lineNumber, lineContent, body)
                      setPending(null)
                    }}
                    onCancel={() => setPending(null)}
                  />
                )
              }
              return (
                <CommentBubble
                  comment={annotation.metadata as ReviewComment}
                  onDelete={onDeleteComment}
                  onEdit={onEditComment}
                  onStatusChange={onCommentStatusChange}
                />
              )
            }}
            renderGutterUtility={(getHoveredLine) => (
              <button
                className="gutter-add-btn"
                onClick={() => {
                  const line = getHoveredLine()
                  if (line) {
                    setPending({ side: line.side, lineNumber: line.lineNumber })
                  }
                }}
              >
                +
              </button>
            )}
          />
        </>
      )}
    </div>
  )
})
