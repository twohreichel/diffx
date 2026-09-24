export interface CommentReply {
  id: string
  body: string
  createdAt: number
}

export interface ReviewComment {
  id: string
  filePath: string
  side: 'deletions' | 'additions'
  lineNumber: number
  /** Last line of the range, absent while the comment sits on a single line. */
  endLine?: number
  lineContent: string
  body: string
  status: 'open' | 'resolved'
  createdAt: number
  replies: CommentReply[]
}

/** What a new comment needs before the server gives it an id. */
export interface NewComment {
  filePath: string
  side: ReviewComment['side']
  lineNumber: number
  endLine?: number
  lineContent: string
  body: string
}
