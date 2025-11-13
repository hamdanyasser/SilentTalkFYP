/**
 * Forum Thread Card Component
 *
 * Displays a summary card for a forum thread with metadata, tags, and engagement metrics.
 */

import React from 'react'
import { ForumThread } from '../../types/forum'
import { Stack } from '../../design-system'
import './ForumThreadCard.css'

export interface ForumThreadCardProps {
  thread: ForumThread
  onClick?: () => void
  className?: string
}

export const ForumThreadCard: React.FC<ForumThreadCardProps> = ({
  thread,
  onClick,
  className = '',
}) => {
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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`forum-thread-card ${thread.isPinned ? 'pinned' : ''} ${thread.isLocked ? 'locked' : ''} ${thread.isFlagged ? 'flagged' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <article>
        {/* Header */}
        <div className="forum-thread-card__header">
          <Stack gap={2} direction="horizontal" align="center">
            {/* Status badges */}
            {thread.isPinned && (
              <span
                className="forum-thread-card__badge forum-thread-card__badge--pinned"
                title="Pinned"
              >
                📌
              </span>
            )}
            {thread.isLocked && (
              <span
                className="forum-thread-card__badge forum-thread-card__badge--locked"
                title="Locked"
              >
                🔒
              </span>
            )}
            {thread.isFlagged && (
              <span
                className="forum-thread-card__badge forum-thread-card__badge--flagged"
                title="Flagged"
              >
                🚩
              </span>
            )}

            {/* Author */}
            <div className="forum-thread-card__author">
              {thread.authorAvatarUrl && (
                <img
                  src={thread.authorAvatarUrl}
                  alt=""
                  className="forum-thread-card__avatar"
                  aria-hidden="true"
                />
              )}
              <span className="forum-thread-card__username">{thread.authorUsername}</span>
              <span className="forum-thread-card__reputation" title="Reputation">
                {thread.authorReputation} pts
              </span>
            </div>

            {/* Time */}
            <time className="forum-thread-card__time" dateTime={thread.createdAt.toISOString()}>
              {formatDate(thread.createdAt)}
            </time>
          </Stack>
        </div>

        {/* Title */}
        <h3 className="forum-thread-card__title">{thread.title}</h3>

        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="forum-thread-card__tags" aria-label="Thread tags">
            <Stack gap={1} direction="horizontal" wrap>
              {thread.tags.map(tag => (
                <span
                  key={tag.id}
                  className="forum-thread-card__tag"
                  style={tag.color ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                </span>
              ))}
            </Stack>
          </div>
        )}

        {/* Footer - Engagement metrics */}
        <div className="forum-thread-card__footer">
          <Stack gap={3} direction="horizontal" align="center">
            <div className="forum-thread-card__stat" title="Votes">
              <span className="forum-thread-card__stat-icon" aria-hidden="true">
                ⬆️
              </span>
              <span className="forum-thread-card__stat-value">
                {formatNumber(thread.voteCount)}
              </span>
            </div>

            <div className="forum-thread-card__stat" title="Replies">
              <span className="forum-thread-card__stat-icon" aria-hidden="true">
                💬
              </span>
              <span className="forum-thread-card__stat-value">
                {formatNumber(thread.replyCount)}
              </span>
            </div>

            <div className="forum-thread-card__stat" title="Views">
              <span className="forum-thread-card__stat-icon" aria-hidden="true">
                👁️
              </span>
              <span className="forum-thread-card__stat-value">
                {formatNumber(thread.viewCount)}
              </span>
            </div>

            <div className="forum-thread-card__activity">
              Last activity {formatDate(thread.lastActivityAt)}
            </div>
          </Stack>
        </div>
      </article>
    </div>
  )
}

export default ForumThreadCard
