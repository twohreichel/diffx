import { useState, useRef, useEffect } from 'react'

interface CommentFormProps {
  lineNumber: number
  endLine: number
  onSubmit: (body: string) => void
  onCancel: () => void
}

export function CommentForm({ lineNumber, endLine, onSubmit, onCancel }: CommentFormProps) {
  const [body, setBody] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = body.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="comment-form">
      {endLine > lineNumber ? (
        <span className="comment-form-range">{`Lines ${lineNumber}–${endLine}`}</span>
      ) : (
        <span className="comment-form-range">{`Line ${lineNumber} — shift-click the gutter to cover more lines`}</span>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Leave a review comment..."
        rows={3}
      />
      <div className="comment-form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!body.trim()}>
          Comment
        </button>
      </div>
    </div>
  )
}
