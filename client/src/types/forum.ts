/**
 * Forum System Types
 *
 * Types for forum threads, replies, moderation, tags, votes,
 * reputation, and content management.
 */

export type ThreadStatus = 'active' | 'locked' | 'archived' | 'deleted' | 'flagged'

export type ContentStatus = 'published' | 'draft' | 'hidden' | 'deleted' | 'flagged'

export type ModerationAction =
  | 'approve'
  | 'reject'
  | 'lock'
  | 'unlock'
  | 'pin'
  | 'unpin'
  | 'archive'
  | 'delete'
  | 'flag'
  | 'unflag'
  | 'warn'
  | 'ban'

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate-speech'
  | 'violence'
  | 'misinformation'
  | 'inappropriate-content'
  | 'copyright'
  | 'other'

export type UserRole = 'user' | 'moderator' | 'admin'

export interface ForumTag {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  threadCount: number
  createdAt: Date
}

export interface ForumAttachment {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number // bytes
  uploadedBy: string
  uploadedAt: Date
}

export interface ForumThread {
  id: string
  title: string
  content: string // Rich text content
  authorId: string
  authorUsername: string
  authorAvatarUrl?: string
  authorReputation: number

  // Status
  status: ThreadStatus
  isPinned: boolean
  isLocked: boolean

  // Tags
  tags: ForumTag[]

  // Engagement
  viewCount: number
  replyCount: number
  voteCount: number
  userVote?: 'up' | 'down' | null

  // Attachments
  attachments: ForumAttachment[]

  // Moderation
  isFlagged: boolean
  flagCount: number
  moderatedBy?: string
  moderatedAt?: Date
  moderationReason?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  lastActivityAt: Date
}

export interface ForumReply {
  id: string
  threadId: string
  content: string // Rich text content
  authorId: string
  authorUsername: string
  authorAvatarUrl?: string
  authorReputation: number

  // Parent reply (for nested replies)
  parentReplyId?: string
  depth: number

  // Status
  status: ContentStatus
  isEdited: boolean
  editedAt?: Date

  // Engagement
  voteCount: number
  userVote?: 'up' | 'down' | null

  // Attachments
  attachments: ForumAttachment[]

  // Moderation
  isFlagged: boolean
  flagCount: number
  moderatedBy?: string
  moderatedAt?: Date
  moderationReason?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface ForumReport {
  id: string
  contentType: 'thread' | 'reply'
  contentId: string
  reason: ReportReason
  description: string
  reportedBy: string
  reportedByUsername: string

  // Status
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: Date
  resolution?: string

  // Timestamps
  createdAt: Date
}

export interface UserReputation {
  userId: string
  username: string
  reputation: number
  threadCount: number
  replyCount: number
  upvotesReceived: number
  downvotesReceived: number
  helpfulReplies: number
  acceptedAnswers: number
  badges: string[]
  joinedAt: Date
}

export interface ModerationLog {
  id: string
  action: ModerationAction
  contentType: 'thread' | 'reply' | 'user'
  contentId: string
  moderatorId: string
  moderatorUsername: string
  reason?: string
  details?: string
  createdAt: Date
}

// API Request/Response types

export interface CreateThreadRequest {
  title: string
  content: string
  tags: string[] // tag IDs
  attachments?: File[]
}

export interface CreateThreadResponse {
  success: boolean
  message?: string
  thread?: ForumThread
}

export interface UpdateThreadRequest {
  threadId: string
  title?: string
  content?: string
  tags?: string[]
}

export interface UpdateThreadResponse {
  success: boolean
  message?: string
  thread?: ForumThread
}

export interface DeleteThreadRequest {
  threadId: string
  reason?: string
}

export interface DeleteThreadResponse {
  success: boolean
  message?: string
}

export interface GetThreadsRequest {
  limit?: number
  offset?: number
  tagId?: string
  authorId?: string
  search?: string
  sortBy?: 'recent' | 'popular' | 'votes' | 'replies'
  status?: ThreadStatus
}

export interface GetThreadsResponse {
  success: boolean
  threads: ForumThread[]
  totalCount: number
}

export interface GetThreadRequest {
  threadId: string
}

export interface GetThreadResponse {
  success: boolean
  thread?: ForumThread
}

export interface CreateReplyRequest {
  threadId: string
  content: string
  parentReplyId?: string
  attachments?: File[]
}

export interface CreateReplyResponse {
  success: boolean
  message?: string
  reply?: ForumReply
}

export interface UpdateReplyRequest {
  replyId: string
  content: string
}

export interface UpdateReplyResponse {
  success: boolean
  message?: string
  reply?: ForumReply
}

export interface DeleteReplyRequest {
  replyId: string
  reason?: string
}

export interface DeleteReplyResponse {
  success: boolean
  message?: string
}

export interface GetRepliesRequest {
  threadId: string
  limit?: number
  offset?: number
  sortBy?: 'oldest' | 'newest' | 'votes'
}

export interface GetRepliesResponse {
  success: boolean
  replies: ForumReply[]
  totalCount: number
}

export interface VoteRequest {
  contentType: 'thread' | 'reply'
  contentId: string
  vote: 'up' | 'down' | null
}

export interface VoteResponse {
  success: boolean
  message?: string
  voteCount?: number
}

export interface ReportContentRequest {
  contentType: 'thread' | 'reply'
  contentId: string
  reason: ReportReason
  description: string
}

export interface ReportContentResponse {
  success: boolean
  message?: string
  reportId?: string
}

export interface ModerateContentRequest {
  contentType: 'thread' | 'reply'
  contentId: string
  action: ModerationAction
  reason?: string
}

export interface ModerateContentResponse {
  success: boolean
  message?: string
}

export interface GetReportsRequest {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  contentType?: 'thread' | 'reply'
  limit?: number
  offset?: number
}

export interface GetReportsResponse {
  success: boolean
  reports: ForumReport[]
  totalCount: number
}

export interface GetTagsRequest {
  search?: string
  limit?: number
}

export interface GetTagsResponse {
  success: boolean
  tags: ForumTag[]
}

export interface GetUserReputationRequest {
  userId: string
}

export interface GetUserReputationResponse {
  success: boolean
  reputation?: UserReputation
}

export interface SearchForumRequest {
  query: string
  contentType?: 'threads' | 'replies' | 'both'
  tagIds?: string[]
  authorId?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface SearchForumResponse {
  success: boolean
  threads: ForumThread[]
  replies: ForumReply[]
  totalCount: number
}

// Content filtering
export interface ContentFilter {
  bannedWords: string[]
  bannedPatterns: RegExp[]
  maxLength: number
  allowHtml: boolean
  allowedHtmlTags: string[]
}

export interface FilteredContent {
  content: string
  isClean: boolean
  violations: string[]
  modified: boolean
}

// Reputation rules
export interface ReputationRules {
  threadCreated: number
  replyCreated: number
  upvoteReceived: number
  downvoteReceived: number
  replyAccepted: number
  replyMarkedHelpful: number
  contentRemoved: number
  userWarned: number
  userBanned: number
}

export const DEFAULT_REPUTATION_RULES: ReputationRules = {
  threadCreated: 5,
  replyCreated: 2,
  upvoteReceived: 10,
  downvoteReceived: -2,
  replyAccepted: 25,
  replyMarkedHelpful: 15,
  contentRemoved: -10,
  userWarned: -25,
  userBanned: -100,
}
