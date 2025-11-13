/**
 * Forum Service
 *
 * Handles all forum-related API calls including threads, replies,
 * voting, tags, and search functionality.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  ForumThread,
  ForumReply,
  ForumTag,
  CreateThreadRequest,
  CreateThreadResponse,
  UpdateThreadRequest,
  UpdateThreadResponse,
  DeleteThreadRequest,
  DeleteThreadResponse,
  GetThreadsRequest,
  GetThreadsResponse,
  GetThreadRequest,
  GetThreadResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  UpdateReplyRequest,
  UpdateReplyResponse,
  DeleteReplyRequest,
  DeleteReplyResponse,
  GetRepliesRequest,
  GetRepliesResponse,
  VoteRequest,
  VoteResponse,
  GetTagsRequest,
  GetTagsResponse,
  SearchForumRequest,
  SearchForumResponse,
} from '../types/forum'
import { filterContent, validateThreadTitle, validatePostContent } from '../utils/contentFilter'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockTags: ForumTag[] = [
  {
    id: 'tag-1',
    name: 'Sign Language',
    slug: 'sign-language',
    description: 'Discussions about sign language learning and usage',
    color: '#3b82f6',
    threadCount: 25,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-2',
    name: 'Accessibility',
    slug: 'accessibility',
    description: 'Topics related to accessibility and assistive technology',
    color: '#10b981',
    threadCount: 18,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-3',
    name: 'Community',
    slug: 'community',
    description: 'General community discussions and announcements',
    color: '#8b5cf6',
    threadCount: 42,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'tag-4',
    name: 'Support',
    slug: 'support',
    description: 'Technical support and help requests',
    color: '#f59e0b',
    threadCount: 33,
    createdAt: new Date('2024-01-01'),
  },
]

const mockThreads: ForumThread[] = [
  {
    id: 'thread-1',
    title: 'Tips for Learning ASL as a Beginner',
    content:
      '<p>I just started learning ASL and would love to hear your tips and resources. What helped you most when starting out?</p>',
    authorId: 'user-1',
    authorUsername: 'johndoe',
    authorReputation: 150,
    status: 'active',
    isPinned: true,
    isLocked: false,
    tags: [mockTags[0], mockTags[2]],
    viewCount: 523,
    replyCount: 15,
    voteCount: 42,
    attachments: [],
    isFlagged: false,
    flagCount: 0,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'thread-2',
    title: 'Video Call Quality Issues',
    content:
      '<p>Has anyone else been experiencing video quality drops during calls? Looking for troubleshooting help.</p>',
    authorId: 'user-2',
    authorUsername: 'janedoe',
    authorReputation: 89,
    status: 'active',
    isPinned: false,
    isLocked: false,
    tags: [mockTags[3]],
    viewCount: 187,
    replyCount: 8,
    voteCount: 12,
    attachments: [],
    isFlagged: false,
    flagCount: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    lastActivityAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
]

const mockReplies: ForumReply[] = [
  {
    id: 'reply-1',
    threadId: 'thread-1',
    content:
      '<p>Welcome! I recommend starting with Lifeprint.com - it has great free resources for beginners.</p>',
    authorId: 'user-3',
    authorUsername: 'bobsmith',
    authorReputation: 234,
    depth: 0,
    status: 'published',
    isEdited: false,
    voteCount: 18,
    attachments: [],
    isFlagged: false,
    flagCount: 0,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
]

/**
 * Get threads with optional filtering
 */
export async function getThreads(request: GetThreadsRequest = {}): Promise<GetThreadsResponse> {
  try {
    await delay(500)

    let filtered = [...mockThreads]

    // Filter by tag
    if (request.tagId) {
      filtered = filtered.filter(thread => thread.tags.some(tag => tag.id === request.tagId))
    }

    // Filter by author
    if (request.authorId) {
      filtered = filtered.filter(thread => thread.authorId === request.authorId)
    }

    // Filter by status
    if (request.status) {
      filtered = filtered.filter(thread => thread.status === request.status)
    }

    // Search
    if (request.search) {
      const query = request.search.toLowerCase()
      filtered = filtered.filter(
        thread =>
          thread.title.toLowerCase().includes(query) ||
          thread.content.toLowerCase().includes(query),
      )
    }

    // Sort
    const sortBy = request.sortBy || 'recent'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
        case 'popular':
          return b.viewCount - a.viewCount
        case 'votes':
          return b.voteCount - a.voteCount
        case 'replies':
          return b.replyCount - a.replyCount
        default:
          return 0
      }
    })

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 20
    const paginated = filtered.slice(offset, offset + limit)

    return {
      success: true,
      threads: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get threads error:', error)
    return {
      success: false,
      threads: [],
      totalCount: 0,
    }
  }
}

/**
 * Get single thread
 */
export async function getThread(request: GetThreadRequest): Promise<GetThreadResponse> {
  try {
    await delay(300)

    const thread = mockThreads.find(t => t.id === request.threadId)

    if (!thread) {
      return {
        success: false,
      }
    }

    // Increment view count
    thread.viewCount++

    return {
      success: true,
      thread,
    }
  } catch (error) {
    console.error('Get thread error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Create new thread
 */
export async function createThread(request: CreateThreadRequest): Promise<CreateThreadResponse> {
  try {
    await delay(800)

    // Validate title
    const titleValidation = validateThreadTitle(request.title)
    if (!titleValidation.isValid) {
      return {
        success: false,
        message: titleValidation.errors.join(', '),
      }
    }

    // Validate content
    const contentValidation = validatePostContent(request.content)
    if (!contentValidation.isValid) {
      return {
        success: false,
        message: contentValidation.errors.join(', '),
      }
    }

    // Filter content
    const filtered = filterContent(request.content)
    if (!filtered.isClean) {
      return {
        success: false,
        message: `Content contains violations: ${filtered.violations.join(', ')}`,
      }
    }

    // Get tags
    const tags = mockTags.filter(tag => request.tags.includes(tag.id))

    const newThread: ForumThread = {
      id: `thread-${Date.now()}`,
      title: request.title,
      content: filtered.content,
      authorId: 'current-user',
      authorUsername: 'currentuser',
      authorReputation: 100,
      status: 'active',
      isPinned: false,
      isLocked: false,
      tags,
      viewCount: 1,
      replyCount: 0,
      voteCount: 0,
      attachments: [],
      isFlagged: false,
      flagCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    }

    mockThreads.unshift(newThread)

    return {
      success: true,
      message: 'Thread created successfully',
      thread: newThread,
    }
  } catch (error) {
    console.error('Create thread error:', error)
    return {
      success: false,
      message: 'Failed to create thread',
    }
  }
}

/**
 * Update thread
 */
export async function updateThread(request: UpdateThreadRequest): Promise<UpdateThreadResponse> {
  try {
    await delay(500)

    const thread = mockThreads.find(t => t.id === request.threadId)

    if (!thread) {
      return {
        success: false,
        message: 'Thread not found',
      }
    }

    // Check permissions (in real app)
    // if (thread.authorId !== currentUserId) {
    //   return { success: false, message: 'Unauthorized' }
    // }

    if (request.title) {
      const validation = validateThreadTitle(request.title)
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', '),
        }
      }
      thread.title = request.title
    }

    if (request.content) {
      const validation = validatePostContent(request.content)
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', '),
        }
      }

      const filtered = filterContent(request.content)
      if (!filtered.isClean) {
        return {
          success: false,
          message: `Content contains violations: ${filtered.violations.join(', ')}`,
        }
      }

      thread.content = filtered.content
    }

    if (request.tags) {
      thread.tags = mockTags.filter(tag => request.tags!.includes(tag.id))
    }

    thread.updatedAt = new Date()

    return {
      success: true,
      message: 'Thread updated successfully',
      thread,
    }
  } catch (error) {
    console.error('Update thread error:', error)
    return {
      success: false,
      message: 'Failed to update thread',
    }
  }
}

/**
 * Delete thread
 */
export async function deleteThread(request: DeleteThreadRequest): Promise<DeleteThreadResponse> {
  try {
    await delay(500)

    const index = mockThreads.findIndex(t => t.id === request.threadId)

    if (index === -1) {
      return {
        success: false,
        message: 'Thread not found',
      }
    }

    mockThreads.splice(index, 1)

    return {
      success: true,
      message: 'Thread deleted successfully',
    }
  } catch (error) {
    console.error('Delete thread error:', error)
    return {
      success: false,
      message: 'Failed to delete thread',
    }
  }
}

/**
 * Get replies for a thread
 */
export async function getReplies(request: GetRepliesRequest): Promise<GetRepliesResponse> {
  try {
    await delay(400)

    const filtered = mockReplies.filter(reply => reply.threadId === request.threadId)

    // Sort
    const sortBy = request.sortBy || 'oldest'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'votes':
          return b.voteCount - a.voteCount
        default:
          return 0
      }
    })

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 50
    const paginated = filtered.slice(offset, offset + limit)

    return {
      success: true,
      replies: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get replies error:', error)
    return {
      success: false,
      replies: [],
      totalCount: 0,
    }
  }
}

/**
 * Create reply
 */
export async function createReply(request: CreateReplyRequest): Promise<CreateReplyResponse> {
  try {
    await delay(600)

    // Validate content
    const validation = validatePostContent(request.content)
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      }
    }

    // Filter content
    const filtered = filterContent(request.content)
    if (!filtered.isClean) {
      return {
        success: false,
        message: `Content contains violations: ${filtered.violations.join(', ')}`,
      }
    }

    const newReply: ForumReply = {
      id: `reply-${Date.now()}`,
      threadId: request.threadId,
      content: filtered.content,
      authorId: 'current-user',
      authorUsername: 'currentuser',
      authorReputation: 100,
      parentReplyId: request.parentReplyId,
      depth: request.parentReplyId ? 1 : 0,
      status: 'published',
      isEdited: false,
      voteCount: 0,
      attachments: [],
      isFlagged: false,
      flagCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockReplies.push(newReply)

    // Update thread reply count
    const thread = mockThreads.find(t => t.id === request.threadId)
    if (thread) {
      thread.replyCount++
      thread.lastActivityAt = new Date()
    }

    return {
      success: true,
      message: 'Reply posted successfully',
      reply: newReply,
    }
  } catch (error) {
    console.error('Create reply error:', error)
    return {
      success: false,
      message: 'Failed to post reply',
    }
  }
}

/**
 * Update reply
 */
export async function updateReply(request: UpdateReplyRequest): Promise<UpdateReplyResponse> {
  try {
    await delay(500)

    const reply = mockReplies.find(r => r.id === request.replyId)

    if (!reply) {
      return {
        success: false,
        message: 'Reply not found',
      }
    }

    // Validate content
    const validation = validatePostContent(request.content)
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join(', '),
      }
    }

    // Filter content
    const filtered = filterContent(request.content)
    if (!filtered.isClean) {
      return {
        success: false,
        message: `Content contains violations: ${filtered.violations.join(', ')}`,
      }
    }

    reply.content = filtered.content
    reply.isEdited = true
    reply.editedAt = new Date()
    reply.updatedAt = new Date()

    return {
      success: true,
      message: 'Reply updated successfully',
      reply,
    }
  } catch (error) {
    console.error('Update reply error:', error)
    return {
      success: false,
      message: 'Failed to update reply',
    }
  }
}

/**
 * Delete reply
 */
export async function deleteReply(request: DeleteReplyRequest): Promise<DeleteReplyResponse> {
  try {
    await delay(500)

    const index = mockReplies.findIndex(r => r.id === request.replyId)

    if (index === -1) {
      return {
        success: false,
        message: 'Reply not found',
      }
    }

    const reply = mockReplies[index]
    mockReplies.splice(index, 1)

    // Update thread reply count
    const thread = mockThreads.find(t => t.id === reply.threadId)
    if (thread) {
      thread.replyCount = Math.max(0, thread.replyCount - 1)
    }

    return {
      success: true,
      message: 'Reply deleted successfully',
    }
  } catch (error) {
    console.error('Delete reply error:', error)
    return {
      success: false,
      message: 'Failed to delete reply',
    }
  }
}

/**
 * Vote on content
 */
export async function vote(request: VoteRequest): Promise<VoteResponse> {
  try {
    await delay(300)

    if (request.contentType === 'thread') {
      const thread = mockThreads.find(t => t.id === request.contentId)
      if (!thread) {
        return { success: false, message: 'Thread not found' }
      }

      // Remove previous vote if exists
      if (thread.userVote) {
        thread.voteCount -= thread.userVote === 'up' ? 1 : -1
      }

      // Apply new vote
      if (request.vote) {
        thread.voteCount += request.vote === 'up' ? 1 : -1
      }

      thread.userVote = request.vote

      return {
        success: true,
        voteCount: thread.voteCount,
      }
    } else {
      const reply = mockReplies.find(r => r.id === request.contentId)
      if (!reply) {
        return { success: false, message: 'Reply not found' }
      }

      // Remove previous vote if exists
      if (reply.userVote) {
        reply.voteCount -= reply.userVote === 'up' ? 1 : -1
      }

      // Apply new vote
      if (request.vote) {
        reply.voteCount += request.vote === 'up' ? 1 : -1
      }

      reply.userVote = request.vote

      return {
        success: true,
        voteCount: reply.voteCount,
      }
    }
  } catch (error) {
    console.error('Vote error:', error)
    return {
      success: false,
      message: 'Failed to vote',
    }
  }
}

/**
 * Get tags
 */
export async function getTags(request: GetTagsRequest = {}): Promise<GetTagsResponse> {
  try {
    await delay(300)

    let filtered = [...mockTags]

    // Search
    if (request.search) {
      const query = request.search.toLowerCase()
      filtered = filtered.filter(
        tag =>
          tag.name.toLowerCase().includes(query) || tag.description?.toLowerCase().includes(query),
      )
    }

    // Limit
    const limit = request.limit || 100
    filtered = filtered.slice(0, limit)

    return {
      success: true,
      tags: filtered,
    }
  } catch (error) {
    console.error('Get tags error:', error)
    return {
      success: false,
      tags: [],
    }
  }
}

/**
 * Search forum content
 */
export async function searchForum(request: SearchForumRequest): Promise<SearchForumResponse> {
  try {
    await delay(600)

    const query = request.query.toLowerCase()
    const threads: ForumThread[] = []
    const replies: ForumReply[] = []

    // Search threads
    if (
      request.contentType === 'threads' ||
      request.contentType === 'both' ||
      !request.contentType
    ) {
      mockThreads.forEach(thread => {
        if (
          thread.title.toLowerCase().includes(query) ||
          thread.content.toLowerCase().includes(query)
        ) {
          threads.push(thread)
        }
      })
    }

    // Search replies
    if (
      request.contentType === 'replies' ||
      request.contentType === 'both' ||
      !request.contentType
    ) {
      mockReplies.forEach(reply => {
        if (reply.content.toLowerCase().includes(query)) {
          replies.push(reply)
        }
      })
    }

    // Apply filters
    // Date filtering, tag filtering, etc. would go here

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 20
    const paginatedThreads = threads.slice(offset, offset + limit)
    const paginatedReplies = replies.slice(offset, offset + limit)

    return {
      success: true,
      threads: paginatedThreads,
      replies: paginatedReplies,
      totalCount: threads.length + replies.length,
    }
  } catch (error) {
    console.error('Search forum error:', error)
    return {
      success: false,
      threads: [],
      replies: [],
      totalCount: 0,
    }
  }
}
