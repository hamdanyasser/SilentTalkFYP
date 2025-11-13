/**
 * Forum Reply Component
 *
 * Displays a single reply in a forum thread with voting, actions, and nested replies.
 */

import React, { useState } from 'react'
import { ForumReply as ForumReplyType } from '../../types/forum'
import { Button, Stack } from '../../design-system'
import './ForumReply.css'

export interface ForumReplyProps {
  reply: ForumReplyType
  currentUserId?: string
  currentUserRole?: string
  onVote?: (replyId: string, vote: 'up' | 'down' | null) => void
  onEdit?: (replyId: string) => void
  onDelete?: (replyId: string) => void
  onReport?: (replyId: string) => void
  onReply?: (parentReplyId: string) => void
  className?: string
}

export const ForumReply: React.FC<ForumReplyProps> = ({
  reply,
  currentUserId,
  currentUserRole = 'user',
  onVote,
  onEdit,
  onDelete,
  onReport,
  onReply,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false)

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const canEdit =
    currentUserId === reply.authorId ||
    currentUserRole === 'moderator' ||
    currentUserRole === 'admin'
  const canDelete =
    currentUserId === reply.authorId ||
    currentUserRole === 'moderator' ||
    currentUserRole === 'admin'
  const isAuthor = currentUserId === reply.authorId

  return (
    <article
      className={`forum-reply ${reply.isFlagged ? 'flagged' : ''} ${reply.status === 'deleted' ? 'deleted' : ''} ${className}`}
      style={{ marginLeft: `${reply.depth * 40}px` }}
    >
      {/* Header */}
      <div className="forum-reply__header">
        <Stack gap={2} direction="horizontal" align="center">
          {/* Author */}
          <div className="forum-reply__author">
            {reply.authorAvatarUrl && (
              <img
                src={reply.authorAvatarUrl}
                alt=""
                className="forum-reply__avatar"
                aria-hidden="true"
              />
            )}
            <span className="forum-reply__username">{reply.authorUsername}</span>
            <span className="forum-reply__reputation" title="Reputation">
              {reply.authorReputation} pts
            </span>
          </div>

          {/* Time */}
          <time className="forum-reply__time" dateTime={reply.createdAt.toISOString()}>
            {formatDate(reply.createdAt)}
          </time>

          {reply.isEdited && reply.editedAt && (
            <span
              className="forum-reply__edited"
              title={`Edited ${reply.editedAt.toLocaleString()}`}
            >
              (edited)
            </span>
          )}

          {/* Badges */}
          {isAuthor && <span className="forum-reply__badge">Author</span>}
          {reply.isFlagged && (
            <span className="forum-reply__badge forum-reply__badge--flagged" title="Flagged">
              🚩
            </span>
          )}
        </Stack>
      </div>

      {/* Content */}
      {reply.status === 'deleted' ? (
        <div className="forum-reply__content forum-reply__content--deleted">
          [This reply has been deleted]
        </div>
      ) : (
        <div className="forum-reply__content" dangerouslySetInnerHTML={{ __html: reply.content }} />
      )}

      {/* Footer - Actions */}
      {reply.status !== 'deleted' && (
        <div className="forum-reply__footer">
          <Stack gap={2} direction="horizontal" align="center">
            {/* Vote buttons */}
            <div className="forum-reply__votes">
              <button
                className={`forum-reply__vote-button ${reply.userVote === 'up' ? 'active' : ''}`}
                onClick={() => onVote?.(reply.id, reply.userVote === 'up' ? null : 'up')}
                aria-label="Upvote"
                title="Upvote"
              >
                ⬆
              </button>
              <span className="forum-reply__vote-count">{reply.voteCount}</span>
              <button
                className={`forum-reply__vote-button ${reply.userVote === 'down' ? 'active' : ''}`}
                onClick={() => onVote?.(reply.id, reply.userVote === 'down' ? null : 'down')}
                aria-label="Downvote"
                title="Downvote"
              >
                ⬇
              </button>
            </div>

            {/* Reply button */}
            {onReply && (
              <Button variant="ghost" size="sm" onClick={() => onReply(reply.id)}>
                Reply
              </Button>
            )}

            {/* More actions */}
            <div className="forum-reply__actions">
              <button
                className="forum-reply__actions-toggle"
                onClick={() => setShowActions(!showActions)}
                aria-label="More actions"
                aria-expanded={showActions}
              >
                ⋯
              </button>

              {showActions && (
                <div className="forum-reply__actions-menu" role="menu">
                  {canEdit && onEdit && (
                    <button
                      className="forum-reply__action"
                      onClick={() => {
                        onEdit(reply.id)
                        setShowActions(false)
                      }}
                      role="menuitem"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && onDelete && (
                    <button
                      className="forum-reply__action forum-reply__action--danger"
                      onClick={() => {
                        onDelete(reply.id)
                        setShowActions(false)
                      }}
                      role="menuitem"
                    >
                      Delete
                    </button>
                  )}
                  {onReport && !isAuthor && (
                    <button
                      className="forum-reply__action"
                      onClick={() => {
                        onReport(reply.id)
                        setShowActions(false)
                      }}
                      role="menuitem"
                    >
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </Stack>
        </div>
      )}
    </article>
  )
}

export default ForumReply
