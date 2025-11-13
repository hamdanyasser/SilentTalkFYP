/**
 * Live Interpretation Booking Types
 *
 * Types for interpreters, bookings, availability, and ratings.
 */

export type InterpreterSpecialization =
  | 'general'
  | 'medical'
  | 'legal'
  | 'educational'
  | 'business'
  | 'technical'
  | 'mental-health'

export type CertificationLevel = 'certified' | 'provisionally-certified' | 'apprentice' | 'student'

export type BookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'

export type BookingType = 'video' | 'in-person'

export interface Certification {
  id: string
  name: string
  issuingOrganization: string
  level: CertificationLevel
  issueDate: Date
  expiryDate?: Date
  verified: boolean
}

export interface Interpreter {
  id: string
  userId: string

  // Profile
  firstName: string
  lastName: string
  displayName: string
  avatarUrl?: string
  bio: string

  // Credentials
  certifications: Certification[]
  yearsOfExperience: number
  specializations: InterpreterSpecialization[]
  languages: string[] // Sign languages (ASL, BSL, etc.)

  // Service details
  hourlyRate: number
  currency: string
  availableForVideo: boolean
  availableInPerson: boolean
  serviceRadius?: number // miles for in-person
  location?: {
    city: string
    state: string
    country: string
  }

  // Ratings
  averageRating: number
  totalRatings: number
  completedBookings: number

  // Availability
  isAvailableNow: boolean
  responseTime: number // average response time in minutes

  // Status
  isActive: boolean
  isVerified: boolean

  // Timestamps
  joinedAt: Date
  lastActiveAt: Date
}

export interface TimeSlot {
  start: Date
  end: Date
}

export interface AvailabilitySchedule {
  interpreterId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  timeSlots: TimeSlot[]
  isRecurring: boolean
}

export interface AvailabilityException {
  id: string
  interpreterId: string
  date: Date
  reason: string
  isUnavailable: boolean // true = unavailable, false = special availability
  timeSlots?: TimeSlot[] // For special availability
}

export interface Booking {
  id: string

  // Participants
  clientId: string
  clientName: string
  clientAvatarUrl?: string
  interpreterId: string
  interpreterName: string
  interpreterAvatarUrl?: string

  // Booking details
  type: BookingType
  startTime: Date
  endTime: Date
  duration: number // minutes
  estimatedDuration: number

  // Location (for in-person)
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    additionalInfo?: string
  }

  // Meeting details (for video)
  meetingUrl?: string
  meetingId?: string

  // Purpose
  purpose: string
  specializations?: InterpreterSpecialization[]
  notes?: string

  // Status
  status: BookingStatus
  cancelledBy?: string
  cancellationReason?: string
  cancelledAt?: Date

  // Payment
  hourlyRate: number
  totalCost: number
  currency: string
  isPaid: boolean
  paymentId?: string

  // Notifications
  reminderSent: boolean
  confirmationSent: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  completedAt?: Date
}

export interface BookingRating {
  id: string
  bookingId: string
  interpreterId: string

  // Rater
  raterId: string
  raterName: string

  // Rating
  overallRating: number // 1-5
  professionalismRating: number
  punctualityRating: number
  communicationRating: number
  accuracyRating: number

  // Review
  comment?: string
  wouldRecommend: boolean

  // Response
  interpreterResponse?: string
  respondedAt?: Date

  // Metadata
  isVerified: boolean // verified booking
  helpfulCount: number

  // Timestamps
  createdAt: Date
  updatedAt?: Date
}

export interface BookingConflict {
  hasConflict: boolean
  conflictingBookings?: Booking[]
  message?: string
}

export interface InterpreterStats {
  interpreterId: string

  // Bookings
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  upcomingBookings: number

  // Ratings
  averageRating: number
  totalRatings: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }

  // Performance
  acceptanceRate: number // percentage
  completionRate: number
  averageResponseTime: number // minutes
  onTimePercentage: number

  // Revenue
  totalEarnings: number
  currency: string
  averageBookingValue: number

  // Time
  totalHoursWorked: number
  averageBookingDuration: number

  // Timestamps
  firstBookingAt?: Date
  lastBookingAt?: Date
}

// API Request/Response types

export interface GetInterpretersRequest {
  search?: string
  specialization?: InterpreterSpecialization
  certificationLevel?: CertificationLevel
  minRating?: number
  availableForVideo?: boolean
  availableInPerson?: boolean
  location?: string
  dateTime?: Date // Check availability at specific time
  maxDistance?: number // miles
  minYearsExperience?: number
  limit?: number
  offset?: number
  sortBy?: 'rating' | 'experience' | 'rate' | 'availability'
}

export interface GetInterpretersResponse {
  success: boolean
  interpreters: Interpreter[]
  totalCount: number
}

export interface GetInterpreterRequest {
  interpreterId: string
}

export interface GetInterpreterResponse {
  success: boolean
  interpreter?: Interpreter
}

export interface GetAvailabilityRequest {
  interpreterId: string
  startDate: Date
  endDate: Date
}

export interface GetAvailabilityResponse {
  success: boolean
  availability: AvailabilitySchedule[]
  exceptions: AvailabilityException[]
  bookedSlots: TimeSlot[]
}

export interface CheckAvailabilityRequest {
  interpreterId: string
  startTime: Date
  endTime: Date
}

export interface CheckAvailabilityResponse {
  success: boolean
  isAvailable: boolean
  conflict?: BookingConflict
  message?: string
}

export interface CreateBookingRequest {
  interpreterId: string
  type: BookingType
  startTime: Date
  endTime: Date
  purpose: string
  specializations?: InterpreterSpecialization[]
  notes?: string
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    additionalInfo?: string
  }
}

export interface CreateBookingResponse {
  success: boolean
  message?: string
  booking?: Booking
  conflict?: BookingConflict
}

export interface UpdateBookingRequest {
  bookingId: string
  startTime?: Date
  endTime?: Date
  notes?: string
  location?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    additionalInfo?: string
  }
}

export interface UpdateBookingResponse {
  success: boolean
  message?: string
  booking?: Booking
  conflict?: BookingConflict
}

export interface CancelBookingRequest {
  bookingId: string
  reason: string
}

export interface CancelBookingResponse {
  success: boolean
  message?: string
}

export interface ConfirmBookingRequest {
  bookingId: string
  meetingUrl?: string
}

export interface ConfirmBookingResponse {
  success: boolean
  message?: string
  booking?: Booking
}

export interface GetBookingsRequest {
  userId?: string
  interpreterId?: string
  status?: BookingStatus
  type?: BookingType
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  sortBy?: 'date' | 'status' | 'created'
}

export interface GetBookingsResponse {
  success: boolean
  bookings: Booking[]
  totalCount: number
}

export interface GetBookingRequest {
  bookingId: string
}

export interface GetBookingResponse {
  success: boolean
  booking?: Booking
}

export interface RateInterpreterRequest {
  bookingId: string
  interpreterId: string
  overallRating: number
  professionalismRating: number
  punctualityRating: number
  communicationRating: number
  accuracyRating: number
  comment?: string
  wouldRecommend: boolean
}

export interface RateInterpreterResponse {
  success: boolean
  message?: string
  rating?: BookingRating
}

export interface GetRatingsRequest {
  interpreterId: string
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'rating' | 'helpful'
}

export interface GetRatingsResponse {
  success: boolean
  ratings: BookingRating[]
  totalCount: number
  stats?: {
    averageRating: number
    totalRatings: number
    ratingBreakdown: Record<number, number>
  }
}

export interface GetInterpreterStatsRequest {
  interpreterId: string
}

export interface GetInterpreterStatsResponse {
  success: boolean
  stats?: InterpreterStats
}

export interface SendNotificationRequest {
  bookingId: string
  type: 'confirmation' | 'reminder' | 'cancellation' | 'update'
  recipientId: string
}

export interface SendNotificationResponse {
  success: boolean
  message?: string
}
