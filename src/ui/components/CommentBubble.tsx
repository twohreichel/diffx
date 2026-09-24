import { useState, useEffect } from 'react'
import { UserCircle, CheckCircle2, Bot, Pencil, RotateCcw } from 'lucide-react'
import type { ReviewComment } from '../../types'
import { timeAgo } from '../utils'

interface CommentBubbleProps {
  comment: ReviewComment
  onDelete: (id: string) => void
  onEdit: (id: string, body: string) => void
  onStatusChange: (id: string, status: ReviewComment['status']) => void
}

export function CommentBubble({ comment, onDelete, onEdit, onStatusChange }: CommentBubbleProps) {
  const [, setTick] = useState(0)
  const [draft, setDraft] = useState<string | null>(null)
  const isResolved = comment.status === 'resolved'

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  const save = () => {
    const trimmed = draft?.trim()
    if (trimmed) onEdit(comment.id, trimmed)
    setDraft(null)
  }

  return (
    <div className={`comment-bubble ${isResolved ? 'comment-resolved' : ''}`} id={`comment-${comment.id}`}>
      <div className="comment-bubble-header">
        <UserCircle size={18} className="comment-bubble-avatar" />
        <span className="comment-bubble-time">{timeAgo(comment.createdAt)}</span>
        {comment.endLine !== undefined && comment.endLine !== comment.lineNumber && (
          <span className="comment-bubble-range">
            Lines {comment.lineNumber}–{comment.endLine}
          </span>
        )}
        {isResolved && (
          <span className="comment-bubble-resolved">
            <CheckCircle2 size={14} />
            Resolved
          </span>
        )}
        <button
          className="comment-bubble-action"
          aria-label="Edit comment"
          onClick={() => setDraft(comment.body)}
          title="Edit comment"
        >
          <Pencil size={13} />
        </button>
        <button
          className="comment-bubble-action"
          aria-label={isResolved ? 'Reopen comment' : 'Mark as resolved'}
          onClick={() => onStatusChange(comment.id, isResolved ? 'open' : 'resolved')}
          title={isResolved ? 'Reopen comment' : 'Mark as resolved'}
        >
          {isResolved ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
        </button>
        <button
          className="comment-bubble-delete"
          aria-label="Delete comment"
          onClick={() => onDelete(comment.id)}
          title="Delete comment"
        >
          &times;
        </button>
      </div>
      {draft === null ? (
        <div className="comment-bubble-body">{comment.body}</div>
      ) : (
        <div className="comment-form">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
              if (e.key === 'Escape') setDraft(null)
            }}
            rows={3}
          />
          <div className="comment-form-actions">
            <button className="btn btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save} disabled={!draft.trim()}>
              Save
            </button>
          </div>
        </div>
      )}
      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="comment-reply">
              <div className="comment-reply-header">
                <Bot size={16} className="comment-reply-avatar" />
                <span className="comment-bubble-time">{timeAgo(reply.createdAt)}</span>
              </div>
              <div className="comment-reply-body">{reply.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
