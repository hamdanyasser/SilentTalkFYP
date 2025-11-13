/**
 * Forum Thread View Component
 *
 * Displays a complete forum thread with content, replies, and interaction options.
 */

import React, { useState, useEffect } from 'react'
import { ForumThread, ForumReply as ForumReplyType } from '../../types/forum'
import { getThread, getReplies, vote, createReply } from '../../services/forumService'
import { reportContent } from '../../services/moderationService'
import { Button, Stack } from '../../design-system'
import { ForumReply } from '../ForumReply'
import { RichTextEditor } from '../RichTextEditor'
import './ForumThreadView.css'

export interface ForumThreadViewProps {
  threadId: string
  currentUserId?: string
  currentUserRole?: string
  onBack?: () => void
  onEdit?: (threadId: string) => void
  onDelete?: (threadId: string) => void
  className?: string
}

export const ForumThreadView: React.FC<ForumThreadViewProps> = ({
  threadId,
  currentUserId,
  currentUserRole = 'user',
  onBack,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [replies, setReplies] = useState<ForumReplyType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Load thread and replies
  useEffect(() => {
    const loadThreadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [threadRes, repliesRes] = await Promise.all([
          getThread({ threadId }),
          getReplies({ threadId, sortBy: 'oldest' }),
        ])

        if (threadRes.success && threadRes.thread) {
          setThread(threadRes.thread)
        } else {
          setError('Thread not found')
        }

        if (repliesRes.success) {
          setReplies(repliesRes.replies)
        }
      } catch (err) {
        setError('Failed to load thread')
        console.error('Load thread error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadThreadData()
  }, [threadId])

  // Handle thread vote
  const handleThreadVote = async (voteType: 'up' | 'down' | null) => {
    if (!thread) return

    try {
      const response = await vote({
        contentType: 'thread',
        contentId: thread.id,
        vote: voteType,
      })

      if (response.success && response.voteCount !== undefined) {
        setThread({
          ...thread,
          voteCount: response.voteCount,
          userVote: voteType,
        })
      }
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  // Handle reply vote
  const handleReplyVote = async (replyId: string, voteType: 'up' | 'down' | null) => {
    try {
      const response = await vote({
        contentType: 'reply',
        contentId: replyId,
        vote: voteType,
      })

      if (response.success && response.voteCount !== undefined) {
        setReplies(
          replies.map(r =>
            r.id === replyId ? { ...r, voteCount: response.voteCount, userVote: voteType } : r,
          ),
        )
      }
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  // Handle submit reply
  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setSubmitting(true)

    try {
      const response = await createReply({
        threadId,
        content: replyContent,
        parentReplyId: replyingTo || undefined,
      })

      if (response.success && response.reply) {
        setReplies([...replies, response.reply])
        setReplyContent('')
        setReplyingTo(null)
      } else {
        alert(response.message || 'Failed to post reply')
      }
    } catch (err) {
      console.error('Submit reply error:', err)
      alert('An error occurred while posting your reply')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle report
  const handleReport = async (contentId: string, contentType: 'thread' | 'reply') => {
    const reason = prompt('Why are you reporting this content?')
    if (!reason) return

    try {
      const response = await reportContent({
        contentType,
        contentId,
        reason: 'other',
        description: reason,
      })

      if (response.success) {
        alert('Content reported successfully')
      } else {
        alert(response.message || 'Failed to report content')
      }
    } catch (err) {
      console.error('Report error:', err)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className={`forum-thread-view ${className}`}>
        <div className="forum-thread-view__loading" role="status" aria-live="polite">
          Loading thread...
        </div>
      </div>
    )
  }

  if (error || !thread) {
    return (
      <div className={`forum-thread-view ${className}`}>
        <div className="forum-thread-view__error" role="alert">
          {error || 'Thread not found'}
        </div>
        {onBack && <Button onClick={onBack}>Go Back</Button>}
      </div>
    )
  }

  const canEdit =
    currentUserId === thread.authorId ||
    currentUserRole === 'moderator' ||
    currentUserRole === 'admin'
  const canDelete =
    currentUserId === thread.authorId ||
    currentUserRole === 'moderator' ||
    currentUserRole === 'admin'

  return (
    <div className={`forum-thread-view ${className}`}>
      {/* Header */}
      <div className="forum-thread-view__header">
        <Stack gap={2} direction="horizontal" align="center" wrap>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
          )}

          {thread.isPinned && (
            <span className="forum-thread-view__badge forum-thread-view__badge--pinned">
              📌 Pinned
            </span>
          )}
          {thread.isLocked && (
            <span className="forum-thread-view__badge forum-thread-view__badge--locked">
              🔒 Locked
            </span>
          )}
        </Stack>
      </div>

      {/* Thread */}
      <article className="forum-thread-view__thread">
        <h1 className="forum-thread-view__title">{thread.title}</h1>

        {/* Meta */}
        <div className="forum-thread-view__meta">
          <Stack gap={2} direction="horizontal" align="center">
            <div className="forum-thread-view__author">
              {thread.authorAvatarUrl && (
                <img
                  src={thread.authorAvatarUrl}
                  alt=""
                  className="forum-thread-view__avatar"
                  aria-hidden="true"
                />
              )}
              <span className="forum-thread-view__username">{thread.authorUsername}</span>
              <span className="forum-thread-view__reputation">{thread.authorReputation} pts</span>
            </div>
            <time dateTime={thread.createdAt.toISOString()}>{formatDate(thread.createdAt)}</time>
          </Stack>
        </div>

        {/* Tags */}
        {thread.tags.length > 0 && (
          <div className="forum-thread-view__tags">
            <Stack gap={1} direction="horizontal" wrap>
              {thread.tags.map(tag => (
                <span
                  key={tag.id}
                  className="forum-thread-view__tag"
                  style={tag.color ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                </span>
              ))}
            </Stack>
          </div>
        )}

        {/* Content */}
        <div
          className="forum-thread-view__content"
          dangerouslySetInnerHTML={{ __html: thread.content }}
        />

        {/* Stats and Actions */}
        <div className="forum-thread-view__footer">
          <Stack gap={3} direction="horizontal" align="center">
            {/* Votes */}
            <div className="forum-thread-view__votes">
              <button
                className={`forum-thread-view__vote-button ${thread.userVote === 'up' ? 'active' : ''}`}
                onClick={() => handleThreadVote(thread.userVote === 'up' ? null : 'up')}
                aria-label="Upvote"
              >
                ⬆
              </button>
              <span className="forum-thread-view__vote-count">{thread.voteCount}</span>
              <button
                className={`forum-thread-view__vote-button ${thread.userVote === 'down' ? 'active' : ''}`}
                onClick={() => handleThreadVote(thread.userVote === 'down' ? null : 'down')}
                aria-label="Downvote"
              >
                ⬇
              </button>
            </div>

            {/* Stats */}
            <div className="forum-thread-view__stat">💬 {thread.replyCount} replies</div>
            <div className="forum-thread-view__stat">👁️ {thread.viewCount} views</div>

            {/* Actions */}
            <div className="forum-thread-view__actions">
              {canEdit && onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(thread.id)}>
                  Edit
                </Button>
              )}
              {canDelete && onDelete && (
                <Button variant="ghost" size="sm" onClick={() => onDelete(thread.id)}>
                  Delete
                </Button>
              )}
              {currentUserId !== thread.authorId && (
                <Button variant="ghost" size="sm" onClick={() => handleReport(thread.id, 'thread')}>
                  Report
                </Button>
              )}
            </div>
          </Stack>
        </div>
      </article>

      {/* Replies */}
      <section className="forum-thread-view__replies">
        <h2 className="forum-thread-view__replies-title">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length > 0 && (
          <div className="forum-thread-view__replies-list">
            {replies.map(reply => (
              <ForumReply
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                onVote={handleReplyVote}
                onReport={replyId => handleReport(replyId, 'reply')}
                onReply={setReplyingTo}
              />
            ))}
          </div>
        )}

        {/* Reply Form */}
        {!thread.isLocked && (
          <div className="forum-thread-view__reply-form">
            <h3 className="forum-thread-view__reply-form-title">
              {replyingTo ? 'Reply to comment' : 'Add a reply'}
            </h3>

            <RichTextEditor
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write your reply..."
              minHeight={150}
              disabled={submitting}
            />

            <div className="forum-thread-view__reply-form-actions">
              <Stack gap={2} direction="horizontal">
                {replyingTo && (
                  <Button variant="ghost" onClick={() => setReplyingTo(null)} disabled={submitting}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || submitting}
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
              </Stack>
            </div>
          </div>
        )}

        {thread.isLocked && (
          <div className="forum-thread-view__locked-message">
            🔒 This thread is locked and cannot accept new replies.
          </div>
        )}
      </section>
    </div>
  )
}

export default ForumThreadView
