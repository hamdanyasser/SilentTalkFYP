/**
 * Forum Thread List Component
 *
 * Displays a list of forum threads with filtering, sorting, and pagination.
 */

import React, { useState, useEffect } from 'react'
import { ForumThread, GetThreadsRequest } from '../../types/forum'
import { getThreads } from '../../services/forumService'
import { Button, Stack } from '../../design-system'
import { ForumThreadCard } from '../ForumThreadCard'
import './ForumThreadList.css'

export interface ForumThreadListProps {
  tagId?: string
  authorId?: string
  search?: string
  limit?: number
  className?: string
  onThreadClick?: (thread: ForumThread) => void
}

type SortOption = 'recent' | 'popular' | 'votes' | 'replies'

export const ForumThreadList: React.FC<ForumThreadListProps> = ({
  tagId,
  authorId,
  search,
  limit = 20,
  className = '',
  onThreadClick,
}) => {
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [offset, setOffset] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  // Load threads
  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true)
      setError(null)

      try {
        const request: GetThreadsRequest = {
          limit,
          offset,
          sortBy,
          tagId,
          authorId,
          search,
          status: 'active',
        }

        const response = await getThreads(request)

        if (response.success) {
          setThreads(response.threads)
          setTotalCount(response.totalCount)
        } else {
          setError('Failed to load threads')
        }
      } catch (err) {
        setError('An error occurred while loading threads')
        console.error('Load threads error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [tagId, authorId, search, sortBy, offset, limit])

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort)
    setOffset(0)
  }

  // Handle pagination
  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      setOffset(offset + limit)
    }
  }

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit))
    }
  }

  const hasNextPage = offset + limit < totalCount
  const hasPrevPage = offset > 0
  const currentPage = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(totalCount / limit)

  return (
    <div className={`forum-thread-list ${className}`}>
      {/* Toolbar */}
      <div className="forum-thread-list__toolbar">
        <Stack gap={2} direction="horizontal" justify="space-between" align="center">
          <div className="forum-thread-list__count">
            {totalCount} {totalCount === 1 ? 'thread' : 'threads'}
          </div>

          <div className="forum-thread-list__sort">
            <label htmlFor="thread-sort" className="forum-thread-list__sort-label">
              Sort by:
            </label>
            <select
              id="thread-sort"
              className="forum-thread-list__sort-select"
              value={sortBy}
              onChange={e => handleSortChange(e.target.value as SortOption)}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="votes">Most Votes</option>
              <option value="replies">Most Replies</option>
            </select>
          </div>
        </Stack>
      </div>

      {/* Thread List */}
      {loading && (
        <div className="forum-thread-list__loading" role="status" aria-live="polite">
          Loading threads...
        </div>
      )}

      {error && (
        <div className="forum-thread-list__error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && threads.length === 0 && (
        <div className="forum-thread-list__empty">
          <p>No threads found.</p>
          {search && <p>Try adjusting your search terms.</p>}
        </div>
      )}

      {!loading && !error && threads.length > 0 && (
        <div className="forum-thread-list__items">
          {threads.map(thread => (
            <ForumThreadCard
              key={thread.id}
              thread={thread}
              onClick={() => onThreadClick?.(thread)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="forum-thread-list__pagination">
          <Stack gap={2} direction="horizontal" justify="center" align="center">
            <Button variant="ghost" onClick={handlePrevPage} disabled={!hasPrevPage}>
              Previous
            </Button>
            <div className="forum-thread-list__page-info">
              Page {currentPage} of {totalPages}
            </div>
            <Button variant="ghost" onClick={handleNextPage} disabled={!hasNextPage}>
              Next
            </Button>
          </Stack>
        </div>
      )}
    </div>
  )
}

export default ForumThreadList
