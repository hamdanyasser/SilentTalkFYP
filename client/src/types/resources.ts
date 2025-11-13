/**
 * Resource Library Types
 *
 * Types for tutorials, glossary, progress tracking, ratings, and resources.
 */

export type ResourceType = 'video' | 'pdf' | 'image' | 'document' | 'interactive'

export type ResourceCategory =
  | 'basics'
  | 'intermediate'
  | 'advanced'
  | 'fingerspelling'
  | 'grammar'
  | 'conversation'
  | 'deaf-culture'
  | 'interpreting'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export interface ResourceFile {
  id: string
  url: string
  filename: string
  mimeType: string
  size: number // bytes
  duration?: number // seconds for videos
  uploadedAt: Date
}

export interface Tutorial {
  id: string
  title: string
  description: string
  category: ResourceCategory
  difficulty: DifficultyLevel

  // Content
  content: string // Rich text content
  files: ResourceFile[] // Video, PDF, images, etc.
  thumbnail?: string

  // Metadata
  authorId: string
  authorName: string
  tags: string[]

  // Engagement
  viewCount: number
  downloadCount: number
  averageRating: number
  ratingCount: number
  userRating?: number // Current user's rating (1-5)

  // Progress
  estimatedDuration: number // minutes

  // Timestamps
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface TutorialProgress {
  userId: string
  tutorialId: string

  // Progress tracking
  isStarted: boolean
  isCompleted: boolean
  progress: number // 0-100 percentage
  lastPosition?: number // For video tutorials

  // Time tracking
  timeSpent: number // minutes
  startedAt: Date
  completedAt?: Date
  lastAccessedAt: Date

  // Notes
  notes?: string
  bookmarked: boolean
}

export interface TutorialReview {
  id: string
  tutorialId: string
  userId: string
  username: string
  userAvatarUrl?: string

  // Review content
  rating: number // 1-5
  title?: string
  comment?: string

  // Metadata
  isVerifiedPurchase?: boolean
  helpfulCount: number
  wasHelpful?: boolean // Current user marked as helpful

  // Timestamps
  createdAt: Date
  updatedAt?: Date
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  alternativeTerms?: string[] // Synonyms or alternative names

  // Content
  example?: string
  videoUrl?: string // Sign video
  imageUrl?: string // Sign illustration
  relatedTerms?: string[] // Related term IDs

  // Metadata
  category?: ResourceCategory
  addedBy?: string
  tags: string[]

  // Engagement
  viewCount: number

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

export interface ResourceCollection {
  id: string
  name: string
  description: string
  thumbnailUrl?: string

  // Content
  tutorialIds: string[]

  // Metadata
  authorId: string
  authorName: string
  isPublic: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// API Request/Response types

export interface GetTutorialsRequest {
  category?: ResourceCategory
  difficulty?: DifficultyLevel
  search?: string
  tags?: string[]
  authorId?: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'title'
}

export interface GetTutorialsResponse {
  success: boolean
  tutorials: Tutorial[]
  totalCount: number
}

export interface GetTutorialRequest {
  tutorialId: string
}

export interface GetTutorialResponse {
  success: boolean
  tutorial?: Tutorial
}

export interface CreateTutorialRequest {
  title: string
  description: string
  category: ResourceCategory
  difficulty: DifficultyLevel
  content: string
  files?: File[]
  tags: string[]
  estimatedDuration: number
}

export interface CreateTutorialResponse {
  success: boolean
  message?: string
  tutorial?: Tutorial
}

export interface UpdateTutorialRequest {
  tutorialId: string
  title?: string
  description?: string
  category?: ResourceCategory
  difficulty?: DifficultyLevel
  content?: string
  tags?: string[]
  estimatedDuration?: number
}

export interface UpdateTutorialResponse {
  success: boolean
  message?: string
  tutorial?: Tutorial
}

export interface DeleteTutorialRequest {
  tutorialId: string
}

export interface DeleteTutorialResponse {
  success: boolean
  message?: string
}

export interface RateTutorialRequest {
  tutorialId: string
  rating: number // 1-5
}

export interface RateTutorialResponse {
  success: boolean
  message?: string
  averageRating?: number
  ratingCount?: number
}

export interface ReviewTutorialRequest {
  tutorialId: string
  rating: number
  title?: string
  comment?: string
}

export interface ReviewTutorialResponse {
  success: boolean
  message?: string
  review?: TutorialReview
}

export interface GetReviewsRequest {
  tutorialId: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'helpful' | 'rating'
}

export interface GetReviewsResponse {
  success: boolean
  reviews: TutorialReview[]
  totalCount: number
}

export interface UpdateProgressRequest {
  tutorialId: string
  progress: number
  lastPosition?: number
  timeSpent?: number
  isCompleted?: boolean
  notes?: string
}

export interface UpdateProgressResponse {
  success: boolean
  message?: string
  progress?: TutorialProgress
}

export interface GetProgressRequest {
  tutorialId?: string
  userId?: string
}

export interface GetProgressResponse {
  success: boolean
  progress: TutorialProgress[]
}

export interface GetGlossaryRequest {
  search?: string
  category?: ResourceCategory
  letter?: string // Filter by first letter
  limit?: number
  offset?: number
}

export interface GetGlossaryResponse {
  success: boolean
  terms: GlossaryTerm[]
  totalCount: number
}

export interface GetGlossaryTermRequest {
  termId: string
}

export interface GetGlossaryTermResponse {
  success: boolean
  term?: GlossaryTerm
}

export interface CreateGlossaryTermRequest {
  term: string
  definition: string
  alternativeTerms?: string[]
  example?: string
  videoUrl?: string
  imageUrl?: string
  category?: ResourceCategory
  tags: string[]
}

export interface CreateGlossaryTermResponse {
  success: boolean
  message?: string
  term?: GlossaryTerm
}

export interface DownloadResourceRequest {
  resourceId: string
  fileId: string
}

export interface DownloadResourceResponse {
  success: boolean
  downloadUrl?: string
  message?: string
}

// Statistics types
export interface UserLearningStats {
  userId: string

  // Progress
  totalTutorials: number
  completedTutorials: number
  inProgressTutorials: number

  // Time
  totalTimeSpent: number // minutes
  averageTimePerTutorial: number

  // Engagement
  totalRatingsGiven: number
  totalReviewsWritten: number
  bookmarkedTutorials: number

  // Achievements
  completionRate: number // percentage
  currentStreak: number // days
  longestStreak: number
  lastActivityAt?: Date
}
