/**
 * Moderation Service
 *
 * Handles moderation actions, reports, and moderation logs.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  ForumReport,
  ModerationLog,
  UserReputation,
  ModerateContentRequest,
  ModerateContentResponse,
  ReportContentRequest,
  ReportContentResponse,
  GetReportsRequest,
  GetReportsResponse,
  GetUserReputationRequest,
  GetUserReputationResponse,
  DEFAULT_REPUTATION_RULES,
} from '../types/forum'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockReports: ForumReport[] = [
  {
    id: 'report-1',
    contentType: 'reply',
    contentId: 'reply-5',
    reason: 'spam',
    description: 'This reply appears to be spam advertising',
    reportedBy: 'user-5',
    reportedByUsername: 'alicewonder',
    status: 'pending',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'report-2',
    contentType: 'thread',
    contentId: 'thread-10',
    reason: 'inappropriate-content',
    description: 'Contains inappropriate content',
    reportedBy: 'user-6',
    reportedByUsername: 'charliebrown',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
]

const mockModerationLogs: ModerationLog[] = [
  {
    id: 'log-1',
    action: 'delete',
    contentType: 'reply',
    contentId: 'reply-3',
    moderatorId: 'mod-1',
    moderatorUsername: 'moderator1',
    reason: 'spam',
    details: 'Removed spam content',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

const mockUserReputations: Record<string, UserReputation> = {
  'user-1': {
    userId: 'user-1',
    username: 'johndoe',
    reputation: 150,
    threadCount: 5,
    replyCount: 23,
    upvotesReceived: 42,
    downvotesReceived: 3,
    helpfulReplies: 8,
    acceptedAnswers: 2,
    badges: ['helpful', 'contributor'],
    joinedAt: new Date('2024-01-15'),
  },
  'user-2': {
    userId: 'user-2',
    username: 'janedoe',
    reputation: 89,
    threadCount: 3,
    replyCount: 12,
    upvotesReceived: 18,
    downvotesReceived: 1,
    helpfulReplies: 4,
    acceptedAnswers: 1,
    badges: ['contributor'],
    joinedAt: new Date('2024-02-01'),
  },
}

/**
 * Report content for moderation
 */
export async function reportContent(request: ReportContentRequest): Promise<ReportContentResponse> {
  try {
    await delay(500)

    // Check if already reported by this user
    const existingReport = mockReports.find(
      r =>
        r.contentType === request.contentType &&
        r.contentId === request.contentId &&
        r.reportedBy === 'current-user',
    )

    if (existingReport) {
      return {
        success: false,
        message: 'You have already reported this content',
      }
    }

    const newReport: ForumReport = {
      id: `report-${Date.now()}`,
      contentType: request.contentType,
      contentId: request.contentId,
      reason: request.reason,
      description: request.description,
      reportedBy: 'current-user',
      reportedByUsername: 'currentuser',
      status: 'pending',
      createdAt: new Date(),
    }

    mockReports.unshift(newReport)

    return {
      success: true,
      message: 'Content reported successfully. Our moderators will review it shortly.',
      reportId: newReport.id,
    }
  } catch (error) {
    console.error('Report content error:', error)
    return {
      success: false,
      message: 'Failed to report content',
    }
  }
}

/**
 * Get reports (moderator only)
 */
export async function getReports(request: GetReportsRequest = {}): Promise<GetReportsResponse> {
  try {
    await delay(400)

    let filtered = [...mockReports]

    // Filter by status
    if (request.status) {
      filtered = filtered.filter(r => r.status === request.status)
    }

    // Filter by content type
    if (request.contentType) {
      filtered = filtered.filter(r => r.contentType === request.contentType)
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 20
    const paginated = filtered.slice(offset, offset + limit)

    return {
      success: true,
      reports: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get reports error:', error)
    return {
      success: false,
      reports: [],
      totalCount: 0,
    }
  }
}

/**
 * Moderate content (moderator only)
 */
export async function moderateContent(
  request: ModerateContentRequest,
): Promise<ModerateContentResponse> {
  try {
    await delay(600)

    // Check permissions (in real app)
    // if (!currentUser.isModerator) {
    //   return { success: false, message: 'Unauthorized' }
    // }

    // Create moderation log
    const log: ModerationLog = {
      id: `log-${Date.now()}`,
      action: request.action,
      contentType: request.contentType,
      contentId: request.contentId,
      moderatorId: 'current-moderator',
      moderatorUsername: 'moderator1',
      reason: request.reason,
      createdAt: new Date(),
    }

    mockModerationLogs.unshift(log)

    // In real app, this would update the actual content
    // For now, just simulate success

    return {
      success: true,
      message: `Content ${request.action}d successfully`,
    }
  } catch (error) {
    console.error('Moderate content error:', error)
    return {
      success: false,
      message: 'Failed to moderate content',
    }
  }
}

/**
 * Get user reputation
 */
export async function getUserReputation(
  request: GetUserReputationRequest,
): Promise<GetUserReputationResponse> {
  try {
    await delay(300)

    const reputation = mockUserReputations[request.userId]

    if (!reputation) {
      // Return default reputation for new users
      return {
        success: true,
        reputation: {
          userId: request.userId,
          username: 'unknown',
          reputation: 0,
          threadCount: 0,
          replyCount: 0,
          upvotesReceived: 0,
          downvotesReceived: 0,
          helpfulReplies: 0,
          acceptedAnswers: 0,
          badges: [],
          joinedAt: new Date(),
        },
      }
    }

    return {
      success: true,
      reputation,
    }
  } catch (error) {
    console.error('Get user reputation error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Calculate reputation change based on action
 */
export function calculateReputationChange(action: string, count: number = 1): number {
  const rules = DEFAULT_REPUTATION_RULES

  switch (action) {
    case 'thread_created':
      return rules.threadCreated * count
    case 'reply_created':
      return rules.replyCreated * count
    case 'upvote_received':
      return rules.upvoteReceived * count
    case 'downvote_received':
      return rules.downvoteReceived * count
    case 'reply_accepted':
      return rules.replyAccepted * count
    case 'reply_marked_helpful':
      return rules.replyMarkedHelpful * count
    case 'content_removed':
      return rules.contentRemoved * count
    case 'user_warned':
      return rules.userWarned * count
    case 'user_banned':
      return rules.userBanned * count
    default:
      return 0
  }
}

/**
 * Update user reputation (in real app would call API)
 */
export async function updateUserReputation(
  userId: string,
  action: string,
  count: number = 1,
): Promise<boolean> {
  try {
    await delay(200)

    const change = calculateReputationChange(action, count)

    if (mockUserReputations[userId]) {
      mockUserReputations[userId].reputation += change
      mockUserReputations[userId].reputation = Math.max(0, mockUserReputations[userId].reputation)
    }

    return true
  } catch (error) {
    console.error('Update reputation error:', error)
    return false
  }
}

/**
 * Get moderation logs (moderator only)
 */
export async function getModerationLogs(limit: number = 50): Promise<ModerationLog[]> {
  try {
    await delay(400)

    return mockModerationLogs.slice(0, limit)
  } catch (error) {
    console.error('Get moderation logs error:', error)
    return []
  }
}

/**
 * Check if user can moderate
 */
export function canModerate(userRole: string): boolean {
  return userRole === 'moderator' || userRole === 'admin'
}

/**
 * Check if user can edit content
 */
export function canEdit(contentAuthorId: string, currentUserId: string, userRole: string): boolean {
  // User can edit their own content or moderators can edit any content
  return contentAuthorId === currentUserId || canModerate(userRole)
}

/**
 * Check if user can delete content
 */
export function canDelete(
  contentAuthorId: string,
  currentUserId: string,
  userRole: string,
): boolean {
  // User can delete their own content or moderators can delete any content
  return contentAuthorId === currentUserId || canModerate(userRole)
}
