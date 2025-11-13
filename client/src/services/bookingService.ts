/**
 * Booking Service
 *
 * Handles booking CRUD, conflict detection, confirmations, and notifications.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  Booking,
  BookingConflict,
  TimeSlot,
  AvailabilitySchedule,
  AvailabilityException,
  GetBookingsRequest,
  GetBookingsResponse,
  GetBookingRequest,
  GetBookingResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  UpdateBookingRequest,
  UpdateBookingResponse,
  CancelBookingRequest,
  CancelBookingResponse,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
  GetAvailabilityRequest,
  GetAvailabilityResponse,
  SendNotificationRequest,
  SendNotificationResponse,
} from '../types/booking'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock data
const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    clientId: 'user-1',
    clientName: 'John Doe',
    interpreterId: 'interpreter-1',
    interpreterName: 'Sarah Johnson',
    type: 'video',
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
    duration: 120,
    estimatedDuration: 120,
    meetingUrl: 'https://meet.silenttalk.com/booking-1',
    meetingId: 'meeting-123',
    purpose: 'Medical appointment interpretation',
    specializations: ['medical'],
    notes: 'Cardiology appointment, please review medical terminology beforehand.',
    status: 'confirmed',
    hourlyRate: 75,
    totalCost: 150,
    currency: 'USD',
    isPaid: false,
    reminderSent: false,
    confirmationSent: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    confirmedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'booking-2',
    clientId: 'user-1',
    clientName: 'John Doe',
    interpreterId: 'interpreter-3',
    interpreterName: 'Emily Chen',
    type: 'video',
    startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    duration: 60,
    estimatedDuration: 60,
    meetingUrl: 'https://meet.silenttalk.com/booking-2',
    purpose: 'Therapy session',
    specializations: ['mental-health'],
    status: 'pending',
    hourlyRate: 80,
    totalCost: 80,
    currency: 'USD',
    isPaid: false,
    reminderSent: false,
    confirmationSent: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

const mockAvailability: Record<string, AvailabilitySchedule[]> = {
  'interpreter-1': [
    {
      interpreterId: 'interpreter-1',
      dayOfWeek: 1, // Monday
      timeSlots: [
        {
          start: new Date('2024-01-01T09:00:00'),
          end: new Date('2024-01-01T17:00:00'),
        },
      ],
      isRecurring: true,
    },
    {
      interpreterId: 'interpreter-1',
      dayOfWeek: 2, // Tuesday
      timeSlots: [
        {
          start: new Date('2024-01-01T09:00:00'),
          end: new Date('2024-01-01T17:00:00'),
        },
      ],
      isRecurring: true,
    },
    {
      interpreterId: 'interpreter-1',
      dayOfWeek: 3, // Wednesday
      timeSlots: [
        {
          start: new Date('2024-01-01T09:00:00'),
          end: new Date('2024-01-01T17:00:00'),
        },
      ],
      isRecurring: true,
    },
  ],
}

const mockExceptions: AvailabilityException[] = []

/**
 * Check for booking conflicts
 */
function checkConflict(
  interpreterId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
): BookingConflict {
  const conflicts = mockBookings.filter(
    b =>
      b.interpreterId === interpreterId &&
      b.status !== 'cancelled' &&
      b.id !== excludeBookingId &&
      // Check for time overlap
      ((startTime >= b.startTime && startTime < b.endTime) ||
        (endTime > b.startTime && endTime <= b.endTime) ||
        (startTime <= b.startTime && endTime >= b.endTime)),
  )

  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      conflictingBookings: conflicts,
      message: `This interpreter is already booked during the requested time. Found ${conflicts.length} conflicting booking(s).`,
    }
  }

  return {
    hasConflict: false,
  }
}

/**
 * Get bookings with filtering
 */
export async function getBookings(request: GetBookingsRequest = {}): Promise<GetBookingsResponse> {
  try {
    await delay(400)

    let filtered = [...mockBookings]

    // Filter by user (client)
    if (request.userId) {
      filtered = filtered.filter(b => b.clientId === request.userId)
    }

    // Filter by interpreter
    if (request.interpreterId) {
      filtered = filtered.filter(b => b.interpreterId === request.interpreterId)
    }

    // Filter by status
    if (request.status) {
      filtered = filtered.filter(b => b.status === request.status)
    }

    // Filter by type
    if (request.type) {
      filtered = filtered.filter(b => b.type === request.type)
    }

    // Filter by date range
    if (request.startDate) {
      filtered = filtered.filter(b => b.startTime >= request.startDate!)
    }
    if (request.endDate) {
      filtered = filtered.filter(b => b.startTime <= request.endDate!)
    }

    // Sort
    const sortBy = request.sortBy || 'date'
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return a.startTime.getTime() - b.startTime.getTime()
        case 'status':
          return a.status.localeCompare(b.status)
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime()
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
      bookings: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get bookings error:', error)
    return {
      success: false,
      bookings: [],
      totalCount: 0,
    }
  }
}

/**
 * Get single booking by ID
 */
export async function getBooking(request: GetBookingRequest): Promise<GetBookingResponse> {
  try {
    await delay(300)

    const booking = mockBookings.find(b => b.id === request.bookingId)

    if (!booking) {
      return {
        success: false,
      }
    }

    return {
      success: true,
      booking,
    }
  } catch (error) {
    console.error('Get booking error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Create a new booking with conflict check
 */
export async function createBooking(request: CreateBookingRequest): Promise<CreateBookingResponse> {
  try {
    await delay(600)

    // Validation
    if (request.startTime < new Date()) {
      return {
        success: false,
        message: 'Cannot book in the past',
      }
    }

    if (request.endTime <= request.startTime) {
      return {
        success: false,
        message: 'End time must be after start time',
      }
    }

    const duration = (request.endTime.getTime() - request.startTime.getTime()) / (1000 * 60)

    if (duration < 30) {
      return {
        success: false,
        message: 'Minimum booking duration is 30 minutes',
      }
    }

    // Check for conflicts
    const conflict = checkConflict(request.interpreterId, request.startTime, request.endTime)

    if (conflict.hasConflict) {
      return {
        success: false,
        message: conflict.message,
        conflict,
      }
    }

    // Create booking
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      clientId: 'current-user',
      clientName: 'Current User',
      interpreterId: request.interpreterId,
      interpreterName: 'Interpreter Name', // Would be fetched from interpreter service
      type: request.type,
      startTime: request.startTime,
      endTime: request.endTime,
      duration,
      estimatedDuration: duration,
      location: request.location,
      meetingUrl:
        request.type === 'video' ? `https://meet.silenttalk.com/booking-${Date.now()}` : undefined,
      meetingId: request.type === 'video' ? `meeting-${Date.now()}` : undefined,
      purpose: request.purpose,
      specializations: request.specializations,
      notes: request.notes,
      status: 'pending',
      hourlyRate: 75, // Would be fetched from interpreter
      totalCost: (duration / 60) * 75,
      currency: 'USD',
      isPaid: false,
      reminderSent: false,
      confirmationSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockBookings.push(newBooking)

    return {
      success: true,
      message: 'Booking created successfully. Awaiting interpreter confirmation.',
      booking: newBooking,
    }
  } catch (error) {
    console.error('Create booking error:', error)
    return {
      success: false,
      message: 'Failed to create booking',
    }
  }
}

/**
 * Update an existing booking
 */
export async function updateBooking(request: UpdateBookingRequest): Promise<UpdateBookingResponse> {
  try {
    await delay(500)

    const booking = mockBookings.find(b => b.id === request.bookingId)

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      }
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return {
        success: false,
        message: `Cannot update ${booking.status} booking`,
      }
    }

    // If updating time, check for conflicts
    const startTime = request.startTime || booking.startTime
    const endTime = request.endTime || booking.endTime

    if (request.startTime || request.endTime) {
      const conflict = checkConflict(booking.interpreterId, startTime, endTime, booking.id)

      if (conflict.hasConflict) {
        return {
          success: false,
          message: conflict.message,
          conflict,
        }
      }
    }

    // Update booking
    if (request.startTime) booking.startTime = request.startTime
    if (request.endTime) booking.endTime = request.endTime
    if (request.notes) booking.notes = request.notes
    if (request.location) booking.location = request.location

    booking.duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)
    booking.totalCost = (booking.duration / 60) * booking.hourlyRate
    booking.updatedAt = new Date()
    booking.status = 'pending' // Reset to pending after update

    return {
      success: true,
      message: 'Booking updated successfully. Awaiting interpreter confirmation.',
      booking,
    }
  } catch (error) {
    console.error('Update booking error:', error)
    return {
      success: false,
      message: 'Failed to update booking',
    }
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(request: CancelBookingRequest): Promise<CancelBookingResponse> {
  try {
    await delay(400)

    const booking = mockBookings.find(b => b.id === request.bookingId)

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      }
    }

    if (booking.status === 'cancelled') {
      return {
        success: false,
        message: 'Booking is already cancelled',
      }
    }

    if (booking.status === 'completed') {
      return {
        success: false,
        message: 'Cannot cancel completed booking',
      }
    }

    booking.status = 'cancelled'
    booking.cancelledBy = 'current-user'
    booking.cancellationReason = request.reason
    booking.cancelledAt = new Date()
    booking.updatedAt = new Date()

    return {
      success: true,
      message: 'Booking cancelled successfully',
    }
  } catch (error) {
    console.error('Cancel booking error:', error)
    return {
      success: false,
      message: 'Failed to cancel booking',
    }
  }
}

/**
 * Confirm a booking (interpreter action)
 */
export async function confirmBooking(
  request: ConfirmBookingRequest,
): Promise<ConfirmBookingResponse> {
  try {
    await delay(400)

    const booking = mockBookings.find(b => b.id === request.bookingId)

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      }
    }

    if (booking.status !== 'pending') {
      return {
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`,
      }
    }

    booking.status = 'confirmed'
    booking.confirmedAt = new Date()
    booking.updatedAt = new Date()

    if (request.meetingUrl) {
      booking.meetingUrl = request.meetingUrl
    }

    return {
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    }
  } catch (error) {
    console.error('Confirm booking error:', error)
    return {
      success: false,
      message: 'Failed to confirm booking',
    }
  }
}

/**
 * Check availability for a specific time slot
 */
export async function checkAvailability(
  request: CheckAvailabilityRequest,
): Promise<CheckAvailabilityResponse> {
  try {
    await delay(300)

    const conflict = checkConflict(request.interpreterId, request.startTime, request.endTime)

    return {
      success: true,
      isAvailable: !conflict.hasConflict,
      conflict: conflict.hasConflict ? conflict : undefined,
      message: conflict.hasConflict
        ? conflict.message
        : 'Interpreter is available for this time slot',
    }
  } catch (error) {
    console.error('Check availability error:', error)
    return {
      success: false,
      isAvailable: false,
      message: 'Failed to check availability',
    }
  }
}

/**
 * Get interpreter availability schedule
 */
export async function getAvailability(
  request: GetAvailabilityRequest,
): Promise<GetAvailabilityResponse> {
  try {
    await delay(400)

    const availability = mockAvailability[request.interpreterId] || []
    const exceptions = mockExceptions.filter(e => e.interpreterId === request.interpreterId)

    // Get booked slots in date range
    const bookedSlots: TimeSlot[] = mockBookings
      .filter(
        b =>
          b.interpreterId === request.interpreterId &&
          b.status !== 'cancelled' &&
          b.startTime >= request.startDate &&
          b.startTime <= request.endDate,
      )
      .map(b => ({
        start: b.startTime,
        end: b.endTime,
      }))

    return {
      success: true,
      availability,
      exceptions,
      bookedSlots,
    }
  } catch (error) {
    console.error('Get availability error:', error)
    return {
      success: false,
      availability: [],
      exceptions: [],
      bookedSlots: [],
    }
  }
}

/**
 * Send notification for a booking
 */
export async function sendNotification(
  request: SendNotificationRequest,
): Promise<SendNotificationResponse> {
  try {
    await delay(300)

    const booking = mockBookings.find(b => b.id === request.bookingId)

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      }
    }

    // In real implementation, this would trigger email/SMS/push notifications
    console.log(`Sending ${request.type} notification to ${request.recipientId}`)

    // Update notification flags
    if (request.type === 'confirmation') {
      booking.confirmationSent = true
    } else if (request.type === 'reminder') {
      booking.reminderSent = true
    }

    return {
      success: true,
      message: `${request.type} notification sent successfully`,
    }
  } catch (error) {
    console.error('Send notification error:', error)
    return {
      success: false,
      message: 'Failed to send notification',
    }
  }
}
