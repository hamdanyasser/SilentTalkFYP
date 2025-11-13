/**
 * Call History Service
 *
 * Handles storage and retrieval of call history and call logs.
 * Currently uses mock implementation - replace with real API calls.
 */

import {
  CallHistoryEntry,
  CallLog,
  GetCallHistoryRequest,
  GetCallHistoryResponse,
  GetCallLogRequest,
  GetCallLogResponse,
} from '../types/call'

// Simulated delay for mock API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock call history data
const mockCallHistory: CallHistoryEntry[] = [
  {
    id: 'call-hist-1',
    callId: 'call-001',
    callType: 'video',
    contactId: '1',
    contactName: 'John Doe',
    contactAvatarUrl: undefined,
    participantCount: 2,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    duration: 900, // 15 minutes
    status: 'completed',
    direction: 'outgoing',
    hadScreenShare: true,
    hadRecording: false,
    quality: 'good',
  },
  {
    id: 'call-hist-2',
    callId: 'call-002',
    callType: 'video',
    contactId: '2',
    contactName: 'Jane Doe',
    contactAvatarUrl: undefined,
    participantCount: 2,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    duration: 1800, // 30 minutes
    status: 'completed',
    direction: 'incoming',
    hadScreenShare: false,
    hadRecording: true,
    quality: 'excellent',
  },
  {
    id: 'call-hist-3',
    callId: 'call-003',
    callType: 'audio',
    contactId: '1',
    contactName: 'John Doe',
    contactAvatarUrl: undefined,
    participantCount: 2,
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    duration: 600, // 10 minutes
    status: 'completed',
    direction: 'outgoing',
    hadScreenShare: false,
    hadRecording: false,
    quality: 'fair',
  },
  {
    id: 'call-hist-4',
    callId: 'call-004',
    callType: 'video',
    contactId: '3',
    contactName: 'Bob Smith',
    contactAvatarUrl: undefined,
    participantCount: 2,
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    duration: 0,
    status: 'missed',
    direction: 'incoming',
    hadScreenShare: false,
    hadRecording: false,
    quality: 'poor',
  },
  {
    id: 'call-hist-5',
    callId: 'call-005',
    callType: 'video',
    contactId: '2',
    contactName: 'Jane Doe',
    contactAvatarUrl: undefined,
    participantCount: 3,
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    duration: 3600, // 1 hour
    status: 'completed',
    direction: 'outgoing',
    hadScreenShare: true,
    hadRecording: true,
    quality: 'good',
  },
]

// Mock call logs
const mockCallLogs: Record<string, CallLog> = {
  'call-001': {
    id: 'log-001',
    callId: 'call-001',
    callType: 'video',
    participantIds: ['current-user', '1'],
    participantNames: ['You', 'John Doe'],
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 900000),
    duration: 900,
    averageNetworkQuality: 'good',
    videoQuality: '720p',
    hadScreenShare: true,
    hadRecording: false,
    hadCaptions: true,
    notes: 'Discussed project requirements',
  },
  'call-002': {
    id: 'log-002',
    callId: 'call-002',
    callType: 'video',
    participantIds: ['current-user', '2'],
    participantNames: ['You', 'Jane Doe'],
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1800000),
    duration: 1800,
    averageNetworkQuality: 'excellent',
    videoQuality: '1080p',
    hadScreenShare: false,
    hadRecording: true,
    hadCaptions: true,
  },
}

/**
 * Get call history
 */
export async function getCallHistory(
  request: GetCallHistoryRequest = {},
): Promise<GetCallHistoryResponse> {
  try {
    // TODO: Replace with real API call
    await delay(500)

    let filtered = [...mockCallHistory]

    // Filter by contact
    if (request.contactId) {
      filtered = filtered.filter(entry => entry.contactId === request.contactId)
    }

    // Filter by date range
    if (request.startDate) {
      filtered = filtered.filter(entry => entry.startTime >= request.startDate!)
    }
    if (request.endDate) {
      filtered = filtered.filter(entry => entry.startTime <= request.endDate!)
    }

    // Sort by start time (most recent first)
    filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

    // Apply pagination
    const offset = request.offset || 0
    const limit = request.limit || 50
    const paginated = filtered.slice(offset, offset + limit)

    return {
      success: true,
      entries: paginated,
      totalCount: filtered.length,
    }
  } catch (error) {
    console.error('Get call history error:', error)
    return {
      success: false,
      entries: [],
      totalCount: 0,
    }
  }
}

/**
 * Get call log details
 */
export async function getCallLog(request: GetCallLogRequest): Promise<GetCallLogResponse> {
  try {
    // TODO: Replace with real API call
    await delay(300)

    const log = mockCallLogs[request.callId]

    if (!log) {
      return {
        success: false,
      }
    }

    return {
      success: true,
      log,
    }
  } catch (error) {
    console.error('Get call log error:', error)
    return {
      success: false,
    }
  }
}

/**
 * Add call to history
 */
export async function addCallToHistory(entry: Omit<CallHistoryEntry, 'id'>): Promise<boolean> {
  try {
    // TODO: Replace with real API call
    await delay(200)

    const newEntry: CallHistoryEntry = {
      id: `call-hist-${Date.now()}`,
      ...entry,
    }

    mockCallHistory.unshift(newEntry)
    return true
  } catch (error) {
    console.error('Add call to history error:', error)
    return false
  }
}

/**
 * Delete call from history
 */
export async function deleteCallFromHistory(callId: string): Promise<boolean> {
  try {
    // TODO: Replace with real API call
    await delay(200)

    const index = mockCallHistory.findIndex(entry => entry.callId === callId)
    if (index !== -1) {
      mockCallHistory.splice(index, 1)
      return true
    }
    return false
  } catch (error) {
    console.error('Delete call from history error:', error)
    return false
  }
}

/**
 * Clear all call history
 */
export async function clearCallHistory(): Promise<boolean> {
  try {
    // TODO: Replace with real API call
    await delay(200)

    mockCallHistory.length = 0
    return true
  } catch (error) {
    console.error('Clear call history error:', error)
    return false
  }
}

/**
 * Get call statistics
 */
export async function getCallStatistics(): Promise<{
  totalCalls: number
  totalDuration: number
  videoCallCount: number
  audioCallCount: number
  averageDuration: number
  missedCallCount: number
}> {
  try {
    await delay(300)

    const totalCalls = mockCallHistory.length
    const totalDuration = mockCallHistory.reduce((sum, entry) => sum + entry.duration, 0)
    const videoCallCount = mockCallHistory.filter(entry => entry.callType === 'video').length
    const audioCallCount = mockCallHistory.filter(entry => entry.callType === 'audio').length
    const missedCallCount = mockCallHistory.filter(entry => entry.status === 'missed').length
    const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0

    return {
      totalCalls,
      totalDuration,
      videoCallCount,
      audioCallCount,
      averageDuration,
      missedCallCount,
    }
  } catch (error) {
    console.error('Get call statistics error:', error)
    return {
      totalCalls: 0,
      totalDuration: 0,
      videoCallCount: 0,
      audioCallCount: 0,
      averageDuration: 0,
      missedCallCount: 0,
    }
  }
}
