/**
 * Forum Page Component
 *
 * Main forum page that displays thread list, thread view, and new thread form.
 */

import React, { useState } from 'react'
import { ForumThread } from '../../types/forum'
import { ForumThreadList } from '../../components/ForumThreadList'
import { ForumThreadView } from '../../components/ForumThreadView'
import { NewThreadForm } from '../../components/NewThreadForm'
import { Button, Stack } from '../../design-system'
import './ForumPage.css'

type ViewMode = 'list' | 'thread' | 'new-thread'

export interface ForumPageProps {
  currentUserId?: string
  currentUserRole?: string
  className?: string
}

export const ForumPage: React.FC<ForumPageProps> = ({
  currentUserId,
  currentUserRole = 'user',
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // const [selectedTagId, setSelectedTagId] = useState<string | undefined>(undefined)

  // Handle thread click
  const handleThreadClick = (thread: ForumThread) => {
    setSelectedThreadId(thread.id)
    setViewMode('thread')
  }

  // Handle new thread
  const handleNewThread = () => {
    setViewMode('new-thread')
  }

  // Handle thread created
  const handleThreadCreated = (threadId: string) => {
    setSelectedThreadId(threadId)
    setViewMode('thread')
  }

  // Handle back to list
  const handleBackToList = () => {
    setViewMode('list')
    setSelectedThreadId(null)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is handled by ForumThreadList component via searchQuery prop
  }

  return (
    <div className={`forum-page ${className}`}>
      {/* Header */}
      <header className="forum-page__header">
        <div className="forum-page__header-content">
          <h1 className="forum-page__title">Community Forum</h1>
          <p className="forum-page__description">
            Join the conversation, ask questions, and share your knowledge with the community.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="forum-page__main">
        {/* List View */}
        {viewMode === 'list' && (
          <div className="forum-page__list-view">
            {/* Toolbar */}
            <div className="forum-page__toolbar">
              <Stack gap={3} direction="horizontal" justify="space-between" align="center" wrap>
                {/* Search */}
                <form className="forum-page__search" onSubmit={handleSearch}>
                  <input
                    type="search"
                    className="forum-page__search-input"
                    placeholder="Search threads..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    aria-label="Search threads"
                  />
                  <button type="submit" className="forum-page__search-button" aria-label="Search">
                    🔍
                  </button>
                </form>

                {/* New Thread Button */}
                <Button variant="primary" onClick={handleNewThread}>
                  + New Thread
                </Button>
              </Stack>
            </div>

            {/* Thread List */}
            <ForumThreadList search={searchQuery} onThreadClick={handleThreadClick} />
          </div>
        )}

        {/* Thread View */}
        {viewMode === 'thread' && selectedThreadId && (
          <ForumThreadView
            threadId={selectedThreadId}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onBack={handleBackToList}
          />
        )}

        {/* New Thread Form */}
        {viewMode === 'new-thread' && (
          <NewThreadForm onSuccess={handleThreadCreated} onCancel={handleBackToList} />
        )}
      </main>
    </div>
  )
}

export default ForumPage
