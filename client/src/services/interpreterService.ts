/**
 * Interpreter Service
 *
 * Handles interpreter directory, search, ratings, and statistics.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  Interpreter,
  BookingRating,
  InterpreterStats,
  GetInterpretersRequest,
  GetInterpretersResponse,
  GetInterpreterRequest,
  GetInterpreterResponse,
  GetRatingsRequest,
  GetRatingsResponse,
  RateInterpreterRequest,
  RateInterpreterResponse,
  GetInterpreterStatsRequest,
  GetInterpreterStatsResponse,
} from '../types/booking'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockInterpreters: Interpreter[] = [
  {
    id: 'interpreter-1',
    userId: 'user-101',
    firstName: 'Sarah',
    lastName: 'Johnson',
    displayName: 'Sarah Johnson',
    avatarUrl: '/avatars/sarah.jpg',
    bio: 'Certified ASL interpreter with 10+ years of experience in medical and educational settings. Passionate about accessibility and Deaf advocacy.',
    certifications: [
      {
        id: 'cert-1',
        name: 'NIC Certified',
        issuingOrganization: 'RID',
        level: 'certified',
        issueDate: new Date('2015-06-01'),
        verified: true,
      },
      {
        id: 'cert-2',
        name: 'Specialist Certificate: Legal',
        issuingOrganization: 'RID',
        level: 'certified',
        issueDate: new Date('2018-03-15'),
        verified: true,
      },
    ],
    yearsOfExperience: 12,
    specializations: ['medical', 'legal', 'educational'],
    languages: ['ASL', 'English'],
    hourlyRate: 75,
    currency: 'USD',
    availableForVideo: true,
    availableInPerson: true,
    serviceRadius: 50,
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
    },
    averageRating: 4.9,
    totalRatings: 127,
    completedBookings: 156,
    isAvailableNow: true,
    responseTime: 15,
    isActive: true,
    isVerified: true,
    joinedAt: new Date('2020-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: 'interpreter-2',
    userId: 'user-102',
    firstName: 'David',
    lastName: 'Martinez',
    displayName: 'David Martinez',
    avatarUrl: '/avatars/david.jpg',
    bio: 'Experienced interpreter specializing in business and technical interpretation. CODA with native fluency in ASL.',
    certifications: [
      {
        id: 'cert-3',
        name: 'CI and CT',
        issuingOrganization: 'RID',
        level: 'certified',
        issueDate: new Date('2016-09-01'),
        verified: true,
      },
    ],
    yearsOfExperience: 8,
    specializations: ['business', 'technical', 'general'],
    languages: ['ASL', 'English'],
    hourlyRate: 65,
    currency: 'USD',
    availableForVideo: true,
    availableInPerson: false,
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA',
    },
    averageRating: 4.8,
    totalRatings: 89,
    completedBookings: 102,
    isAvailableNow: false,
    responseTime: 30,
    isActive: true,
    isVerified: true,
    joinedAt: new Date('2020-06-20'),
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'interpreter-3',
    userId: 'user-103',
    firstName: 'Emily',
    lastName: 'Chen',
    displayName: 'Emily Chen',
    avatarUrl: '/avatars/emily.jpg',
    bio: 'Mental health specialist interpreter with expertise in therapeutic settings and crisis intervention.',
    certifications: [
      {
        id: 'cert-4',
        name: 'CDI',
        issuingOrganization: 'RID',
        level: 'certified',
        issueDate: new Date('2017-11-01'),
        verified: true,
      },
      {
        id: 'cert-5',
        name: 'Mental Health Interpreter',
        issuingOrganization: 'ASLMHIC',
        level: 'certified',
        issueDate: new Date('2019-05-15'),
        verified: true,
      },
    ],
    yearsOfExperience: 6,
    specializations: ['mental-health', 'medical', 'general'],
    languages: ['ASL', 'English'],
    hourlyRate: 80,
    currency: 'USD',
    availableForVideo: true,
    availableInPerson: true,
    serviceRadius: 30,
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
    },
    averageRating: 5.0,
    totalRatings: 45,
    completedBookings: 52,
    isAvailableNow: true,
    responseTime: 20,
    isActive: true,
    isVerified: true,
    joinedAt: new Date('2021-03-10'),
    lastActiveAt: new Date(),
  },
]

const mockRatings: Record<string, BookingRating[]> = {
  'interpreter-1': [
    {
      id: 'rating-1',
      bookingId: 'booking-101',
      interpreterId: 'interpreter-1',
      raterId: 'user-201',
      raterName: 'Alice Wonder',
      overallRating: 5,
      professionalismRating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      accuracyRating: 5,
      comment:
        'Sarah was absolutely wonderful! Very professional and her interpretation was clear and accurate. Highly recommend!',
      wouldRecommend: true,
      isVerified: true,
      helpfulCount: 12,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'rating-2',
      bookingId: 'booking-102',
      interpreterId: 'interpreter-1',
      raterId: 'user-202',
      raterName: 'Bob Smith',
      overallRating: 5,
      professionalismRating: 5,
      punctualityRating: 5,
      communicationRating: 4,
      accuracyRating: 5,
      comment: 'Great interpreter, arrived early and was very prepared.',
      wouldRecommend: true,
      isVerified: true,
      helpfulCount: 8,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ],
}

/**
 * Get interpreters with filtering and sorting
 */
export async function getInterpreters(
  request: GetInterpretersRequest = {},
): Promise<GetInterpretersResponse> {
  try {
    await delay(400)

    let filtered = [...mockInterpreters]

    // Filter by search (name, bio, specializations)
    if (request.search) {
      const query = request.search.toLowerCase()
      filtered = filtered.filter(
        i =>
          i.displayName.toLowerCase().includes(query) ||
          i.bio.toLowerCase().includes(query) ||
          i.specializations.some(s => s.toLowerCase().includes(query)) ||
          i.location?.city.toLowerCase().includes(query),
      )
    }

    // Filter by specialization
    if (request.specialization) {
      filtered = filtered.filter(i => i.specializations.includes(request.specialization!))
    }

    // Filter by certification level
    if (request.certificationLevel) {
      filtered = filtered.filter(i =>
        i.certifications.some(c => c.level === request.certificationLevel),
      )
    }

    // Filter by minimum rating
    if (request.minRating) {
      filtered = filtered.filter(i => i.averageRating >= request.minRating!)
    }

    // Filter by video availability
    if (request.availableForVideo !== undefined) {
      filtered = filtered.filter(i => i.availableForVideo === request.availableForVideo)
    }

    // Filter by in-person availability
    if (request.availableInPerson !== undefined) {
      filtered = filtered.filter(i => i.availableInPerson === request.availableInPerson)
    }

    // Filter by minimum years of experience
    if (request.minYearsExperience) {
      filtered = filtered.filter(i => i.yearsOfExperience >= request.minYearsExperience!)
    }

    // Filter by location (simple city match)
    if (request.location) {
      const location = request.location.toLowerCase()
      filtered = filtered.filter(
        i =>
          i.location?.city.toLowerCase().includes(location) ||
          i.location?.state.toLowerCase().includes(location),
      )
    }

    // Filter by availability at specific time (simplified - check isAvailableNow)
    if (request.dateTime) {
      filtered = filtered.filter(i => i.isAvailableNow)
    }

    // Sort
    const sortBy = request.sortBy || 'rating'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.averageRating - a.averageRating
        case 'experience':
          return b.yearsOfExperience - a.yearsOfExperience
        case 'rate':
          return a.hourlyRate - b.hourlyRate
        case 'availability':
          return (b.isAvailableNow ? 1 : 0) - (a.isAvailableNow ? 1 : 0)
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
      interpreters: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get interpreters error:', error)
    return {
      success: false,
      interpreters: [],
      totalCount: 0,
    }
  }
}

/**
 * Get single interpreter by ID
 */
export async function getInterpreter(
  request: GetInterpreterRequest,
): Promise<GetInterpreterResponse> {
  try {
    await delay(300)

    const interpreter = mockInterpreters.find(i => i.id === request.interpreterId)

    if (!interpreter) {
      return {
        success: false,
      }
    }

    return {
      success: true,
      interpreter,
    }
  } catch (error) {
    console.error('Get interpreter error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Rate an interpreter after a booking
 */
export async function rateInterpreter(
  request: RateInterpreterRequest,
): Promise<RateInterpreterResponse> {
  try {
    await delay(400)

    // Validate ratings (1-5)
    const ratings = [
      request.overallRating,
      request.professionalismRating,
      request.punctualityRating,
      request.communicationRating,
      request.accuracyRating,
    ]

    if (ratings.some(r => r < 1 || r > 5)) {
      return {
        success: false,
        message: 'All ratings must be between 1 and 5',
      }
    }

    const interpreter = mockInterpreters.find(i => i.id === request.interpreterId)

    if (!interpreter) {
      return {
        success: false,
        message: 'Interpreter not found',
      }
    }

    const newRating: BookingRating = {
      id: `rating-${Date.now()}`,
      bookingId: request.bookingId,
      interpreterId: request.interpreterId,
      raterId: 'current-user',
      raterName: 'Current User',
      overallRating: request.overallRating,
      professionalismRating: request.professionalismRating,
      punctualityRating: request.punctualityRating,
      communicationRating: request.communicationRating,
      accuracyRating: request.accuracyRating,
      comment: request.comment,
      wouldRecommend: request.wouldRecommend,
      isVerified: true,
      helpfulCount: 0,
      createdAt: new Date(),
    }

    if (!mockRatings[request.interpreterId]) {
      mockRatings[request.interpreterId] = []
    }

    mockRatings[request.interpreterId].unshift(newRating)

    // Update interpreter's average rating
    const oldTotal = interpreter.averageRating * interpreter.totalRatings
    interpreter.totalRatings++
    interpreter.averageRating = (oldTotal + request.overallRating) / interpreter.totalRatings

    return {
      success: true,
      message: 'Rating submitted successfully',
      rating: newRating,
    }
  } catch (error) {
    console.error('Rate interpreter error:', error)
    return {
      success: false,
      message: 'Failed to submit rating',
    }
  }
}

/**
 * Get ratings for an interpreter
 */
export async function getRatings(request: GetRatingsRequest): Promise<GetRatingsResponse> {
  try {
    await delay(300)

    const ratings = mockRatings[request.interpreterId] || []

    // Sort
    const sortBy = request.sortBy || 'recent'
    ratings.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'rating':
          return b.overallRating - a.overallRating
        case 'helpful':
          return b.helpfulCount - a.helpfulCount
        default:
          return 0
      }
    })

    // Pagination
    const offset = request.offset || 0
    const limit = request.limit || 10
    const paginated = ratings.slice(offset, offset + limit)

    // Calculate stats
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach(r => {
      ratingBreakdown[r.overallRating] = (ratingBreakdown[r.overallRating] || 0) + 1
    })

    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length : 0

    return {
      success: true,
      ratings: paginated,
      totalCount: ratings.length,
      stats: {
        averageRating,
        totalRatings: ratings.length,
        ratingBreakdown,
      },
    }
  } catch (error) {
    console.error('Get ratings error:', error)
    return {
      success: false,
      ratings: [],
      totalCount: 0,
    }
  }
}

/**
 * Get interpreter statistics
 */
export async function getInterpreterStats(
  request: GetInterpreterStatsRequest,
): Promise<GetInterpreterStatsResponse> {
  try {
    await delay(300)

    const interpreter = mockInterpreters.find(i => i.id === request.interpreterId)

    if (!interpreter) {
      return {
        success: false,
      }
    }

    const ratings = mockRatings[request.interpreterId] || []
    const ratingBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach(r => {
      ratingBreakdown[r.overallRating] = (ratingBreakdown[r.overallRating] || 0) + 1
    })

    const stats: InterpreterStats = {
      interpreterId: request.interpreterId,
      totalBookings: interpreter.completedBookings + 10, // Include cancelled
      completedBookings: interpreter.completedBookings,
      cancelledBookings: 5,
      upcomingBookings: 3,
      averageRating: interpreter.averageRating,
      totalRatings: interpreter.totalRatings,
      ratingBreakdown: ratingBreakdown as InterpreterStats['ratingBreakdown'],
      acceptanceRate: 95,
      completionRate: 97,
      averageResponseTime: interpreter.responseTime,
      onTimePercentage: 98,
      totalEarnings: interpreter.completedBookings * interpreter.hourlyRate * 2, // Avg 2 hrs
      currency: interpreter.currency,
      averageBookingValue: interpreter.hourlyRate * 2,
      totalHoursWorked: interpreter.completedBookings * 2,
      averageBookingDuration: 120, // minutes
      firstBookingAt: new Date(interpreter.joinedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
      lastBookingAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }

    return {
      success: true,
      stats,
    }
  } catch (error) {
    console.error('Get interpreter stats error:', error)
    return {
      success: false,
    }
  }
}
