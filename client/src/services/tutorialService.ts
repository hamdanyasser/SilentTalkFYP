/**
 * Tutorial Service
 *
 * Handles tutorial CRUD operations, ratings, reviews, and progress tracking.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  Tutorial,
  TutorialProgress,
  TutorialReview,
  GetTutorialsRequest,
  GetTutorialsResponse,
  GetTutorialRequest,
  GetTutorialResponse,
  RateTutorialRequest,
  RateTutorialResponse,
  ReviewTutorialRequest,
  ReviewTutorialResponse,
  GetReviewsRequest,
  GetReviewsResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetProgressRequest,
  GetProgressResponse,
  UserLearningStats,
} from '../types/resources'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockTutorials: Tutorial[] = [
  {
    id: 'tutorial-1',
    title: 'Introduction to ASL Fingerspelling',
    description: 'Learn the ASL alphabet and practice fingerspelling common words and names.',
    category: 'fingerspelling',
    difficulty: 'beginner',
    content:
      "<p>This tutorial will teach you the basics of ASL fingerspelling. Fingerspelling is used to spell out words that don't have a specific sign, such as names, places, or technical terms.</p>",
    files: [
      {
        id: 'file-1',
        url: '/videos/fingerspelling-intro.mp4',
        filename: 'fingerspelling-intro.mp4',
        mimeType: 'video/mp4',
        size: 15000000,
        duration: 600,
        uploadedAt: new Date('2024-01-15'),
      },
      {
        id: 'file-2',
        url: '/pdfs/asl-alphabet.pdf',
        filename: 'asl-alphabet.pdf',
        mimeType: 'application/pdf',
        size: 500000,
        uploadedAt: new Date('2024-01-15'),
      },
    ],
    thumbnail: '/images/fingerspelling-thumb.jpg',
    authorId: 'instructor-1',
    authorName: 'Sarah Johnson',
    tags: ['alphabet', 'basics', 'practice'],
    viewCount: 1523,
    downloadCount: 342,
    averageRating: 4.7,
    ratingCount: 89,
    estimatedDuration: 30,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    publishedAt: new Date('2024-01-15'),
  },
  {
    id: 'tutorial-2',
    title: 'Basic ASL Grammar Rules',
    description: 'Understand the fundamental grammar structure of American Sign Language.',
    category: 'grammar',
    difficulty: 'intermediate',
    content:
      '<p>ASL has its own unique grammar that differs from English. This tutorial covers essential grammar rules including time-topic-comment structure, facial expressions, and classifiers.</p>',
    files: [
      {
        id: 'file-3',
        url: '/videos/grammar-basics.mp4',
        filename: 'grammar-basics.mp4',
        mimeType: 'video/mp4',
        size: 25000000,
        duration: 900,
        uploadedAt: new Date('2024-01-20'),
      },
    ],
    thumbnail: '/images/grammar-thumb.jpg',
    authorId: 'instructor-1',
    authorName: 'Sarah Johnson',
    tags: ['grammar', 'structure', 'intermediate'],
    viewCount: 987,
    downloadCount: 156,
    averageRating: 4.9,
    ratingCount: 45,
    estimatedDuration: 45,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    publishedAt: new Date('2024-01-20'),
  },
  {
    id: 'tutorial-3',
    title: 'Deaf Culture and Community',
    description: 'Learn about Deaf culture, history, and the Deaf community.',
    category: 'deaf-culture',
    difficulty: 'beginner',
    content:
      '<p>Understanding Deaf culture is essential for anyone learning ASL. This tutorial covers the history of Deaf education, cultural norms, and how to respectfully engage with the Deaf community.</p>',
    files: [
      {
        id: 'file-4',
        url: '/videos/deaf-culture.mp4',
        filename: 'deaf-culture.mp4',
        mimeType: 'video/mp4',
        size: 18000000,
        duration: 720,
        uploadedAt: new Date('2024-01-25'),
      },
      {
        id: 'file-5',
        url: '/pdfs/deaf-culture-guide.pdf',
        filename: 'deaf-culture-guide.pdf',
        mimeType: 'application/pdf',
        size: 800000,
        uploadedAt: new Date('2024-01-25'),
      },
    ],
    thumbnail: '/images/culture-thumb.jpg',
    authorId: 'instructor-2',
    authorName: 'David Martinez',
    tags: ['culture', 'history', 'community'],
    viewCount: 2134,
    downloadCount: 567,
    averageRating: 4.8,
    ratingCount: 134,
    estimatedDuration: 25,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    publishedAt: new Date('2024-01-25'),
  },
]

const mockProgress: Record<string, TutorialProgress> = {
  'tutorial-1': {
    userId: 'current-user',
    tutorialId: 'tutorial-1',
    isStarted: true,
    isCompleted: false,
    progress: 65,
    lastPosition: 390,
    timeSpent: 20,
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    bookmarked: true,
  },
}

const mockReviews: Record<string, TutorialReview[]> = {
  'tutorial-1': [
    {
      id: 'review-1',
      tutorialId: 'tutorial-1',
      userId: 'user-5',
      username: 'alicewonder',
      rating: 5,
      title: 'Excellent introduction to fingerspelling',
      comment:
        'This tutorial is perfect for beginners. The video demonstrations are clear and easy to follow.',
      helpfulCount: 12,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'review-2',
      tutorialId: 'tutorial-1',
      userId: 'user-6',
      username: 'bobsmith',
      rating: 4,
      title: 'Great content, could use more practice exercises',
      comment:
        'The tutorial covers the basics well, but I wish there were more interactive practice exercises included.',
      helpfulCount: 8,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ],
}

/**
 * Get tutorials with filtering and sorting
 */
export async function getTutorials(
  request: GetTutorialsRequest = {},
): Promise<GetTutorialsResponse> {
  try {
    await delay(400)

    let filtered = [...mockTutorials]

    // Filter by category
    if (request.category) {
      filtered = filtered.filter(t => t.category === request.category)
    }

    // Filter by difficulty
    if (request.difficulty) {
      filtered = filtered.filter(t => t.difficulty === request.difficulty)
    }

    // Search
    if (request.search) {
      const query = request.search.toLowerCase()
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by tags
    if (request.tags && request.tags.length > 0) {
      filtered = filtered.filter(t => request.tags!.some(tag => t.tags.includes(tag)))
    }

    // Filter by author
    if (request.authorId) {
      filtered = filtered.filter(t => t.authorId === request.authorId)
    }

    // Sort
    const sortBy = request.sortBy || 'recent'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.publishedAt!.getTime() - a.publishedAt!.getTime()
        case 'popular':
          return b.viewCount - a.viewCount
        case 'rating':
          return b.averageRating - a.averageRating
        case 'title':
          return a.title.localeCompare(b.title)
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
      tutorials: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get tutorials error:', error)
    return {
      success: false,
      tutorials: [],
      totalCount: 0,
    }
  }
}

/**
 * Get single tutorial by ID
 */
export async function getTutorial(request: GetTutorialRequest): Promise<GetTutorialResponse> {
  try {
    await delay(300)

    const tutorial = mockTutorials.find(t => t.id === request.tutorialId)

    if (!tutorial) {
      return {
        success: false,
      }
    }

    // Increment view count (in real app this would be on backend)
    tutorial.viewCount++

    return {
      success: true,
      tutorial,
    }
  } catch (error) {
    console.error('Get tutorial error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Rate a tutorial
 */
export async function rateTutorial(request: RateTutorialRequest): Promise<RateTutorialResponse> {
  try {
    await delay(300)

    if (request.rating < 1 || request.rating > 5) {
      return {
        success: false,
        message: 'Rating must be between 1 and 5',
      }
    }

    const tutorial = mockTutorials.find(t => t.id === request.tutorialId)

    if (!tutorial) {
      return {
        success: false,
        message: 'Tutorial not found',
      }
    }

    // Update rating (simplified - in real app would track per-user ratings)
    const oldTotal = tutorial.averageRating * tutorial.ratingCount
    tutorial.ratingCount++
    tutorial.averageRating = (oldTotal + request.rating) / tutorial.ratingCount
    tutorial.userRating = request.rating

    return {
      success: true,
      averageRating: tutorial.averageRating,
      ratingCount: tutorial.ratingCount,
    }
  } catch (error) {
    console.error('Rate tutorial error:', error)
    return {
      success: false,
      message: 'Failed to rate tutorial',
    }
  }
}

/**
 * Submit tutorial review
 */
export async function reviewTutorial(
  request: ReviewTutorialRequest,
): Promise<ReviewTutorialResponse> {
  try {
    await delay(400)

    if (request.rating < 1 || request.rating > 5) {
      return {
        success: false,
        message: 'Rating must be between 1 and 5',
      }
    }

    const newReview: TutorialReview = {
      id: `review-${Date.now()}`,
      tutorialId: request.tutorialId,
      userId: 'current-user',
      username: 'currentuser',
      rating: request.rating,
      title: request.title,
      comment: request.comment,
      helpfulCount: 0,
      createdAt: new Date(),
    }

    if (!mockReviews[request.tutorialId]) {
      mockReviews[request.tutorialId] = []
    }

    mockReviews[request.tutorialId].unshift(newReview)

    // Update tutorial rating
    await rateTutorial({ tutorialId: request.tutorialId, rating: request.rating })

    return {
      success: true,
      message: 'Review submitted successfully',
      review: newReview,
    }
  } catch (error) {
    console.error('Review tutorial error:', error)
    return {
      success: false,
      message: 'Failed to submit review',
    }
  }
}

/**
 * Get reviews for a tutorial
 */
export async function getReviews(request: GetReviewsRequest): Promise<GetReviewsResponse> {
  try {
    await delay(300)

    const reviews = mockReviews[request.tutorialId] || []

    // Sort
    const sortBy = request.sortBy || 'recent'
    reviews.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'helpful':
          return b.helpfulCount - a.helpfulCount
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 10
    const paginated = reviews.slice(offset, offset + limit)

    return {
      success: true,
      reviews: paginated,
      totalCount: reviews.length,
    }
  } catch (error) {
    console.error('Get reviews error:', error)
    return {
      success: false,
      reviews: [],
      totalCount: 0,
    }
  }
}

/**
 * Update tutorial progress
 */
export async function updateProgress(
  request: UpdateProgressRequest,
): Promise<UpdateProgressResponse> {
  try {
    await delay(300)

    const existingProgress = mockProgress[request.tutorialId]

    const progress: TutorialProgress = {
      userId: 'current-user',
      tutorialId: request.tutorialId,
      isStarted: true,
      isCompleted: request.isCompleted || false,
      progress: request.progress,
      lastPosition: request.lastPosition,
      timeSpent: (existingProgress?.timeSpent || 0) + (request.timeSpent || 0),
      startedAt: existingProgress?.startedAt || new Date(),
      completedAt: request.isCompleted ? new Date() : existingProgress?.completedAt,
      lastAccessedAt: new Date(),
      notes: request.notes || existingProgress?.notes,
      bookmarked: existingProgress?.bookmarked || false,
    }

    mockProgress[request.tutorialId] = progress

    return {
      success: true,
      message: 'Progress updated successfully',
      progress,
    }
  } catch (error) {
    console.error('Update progress error:', error)
    return {
      success: false,
      message: 'Failed to update progress',
    }
  }
}

/**
 * Get user's tutorial progress
 */
export async function getProgress(request: GetProgressRequest = {}): Promise<GetProgressResponse> {
  try {
    await delay(300)

    let progress = Object.values(mockProgress)

    // Filter by tutorial
    if (request.tutorialId) {
      progress = progress.filter(p => p.tutorialId === request.tutorialId)
    }

    return {
      success: true,
      progress,
    }
  } catch (error) {
    console.error('Get progress error:', error)
    return {
      success: false,
      progress: [],
    }
  }
}

/**
 * Get user learning statistics
 */
export async function getUserStats(): Promise<UserLearningStats> {
  try {
    await delay(300)

    const allProgress = Object.values(mockProgress)

    const completed = allProgress.filter(p => p.isCompleted).length
    const inProgress = allProgress.filter(p => p.isStarted && !p.isCompleted).length
    const totalTime = allProgress.reduce((sum, p) => sum + p.timeSpent, 0)

    return {
      userId: 'current-user',
      totalTutorials: allProgress.length,
      completedTutorials: completed,
      inProgressTutorials: inProgress,
      totalTimeSpent: totalTime,
      averageTimePerTutorial: allProgress.length > 0 ? totalTime / allProgress.length : 0,
      totalRatingsGiven: 15,
      totalReviewsWritten: 5,
      bookmarkedTutorials: allProgress.filter(p => p.bookmarked).length,
      completionRate: allProgress.length > 0 ? (completed / allProgress.length) * 100 : 0,
      currentStreak: 5,
      longestStreak: 12,
      lastActivityAt: new Date(),
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return {
      userId: 'current-user',
      totalTutorials: 0,
      completedTutorials: 0,
      inProgressTutorials: 0,
      totalTimeSpent: 0,
      averageTimePerTutorial: 0,
      totalRatingsGiven: 0,
      totalReviewsWritten: 0,
      bookmarkedTutorials: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
    }
  }
}
