/**
 * Call System Types
 *
 * Types for video/audio calls, participants, quality settings,
 * call history, and call controls.
 */

export type CallStatus = 'idle' | 'connecting' | 'ringing' | 'active' | 'ended' | 'failed'

export type CallType = 'video' | 'audio'

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected'

export type VideoQuality = '360p' | '480p' | '720p' | '1080p'

export type VirtualBackgroundType = 'none' | 'blur' | 'image' | 'video'

export type ParticipantRole = 'host' | 'participant' | 'interpreter'

export interface CallParticipant {
  id: string
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  role: ParticipantRole

  // Media state
  isCameraOn: boolean
  isMicOn: boolean
  isScreenSharing: boolean

  // Video/audio streams
  videoTrack?: MediaStreamTrack
  audioTrack?: MediaStreamTrack
  screenTrack?: MediaStreamTrack

  // Network quality
  networkQuality: NetworkQuality
  latency: number // ms

  // UI state
  isPinned: boolean
  isSpeaking: boolean
  volume: number // 0-100

  // Metadata
  joinedAt: Date
}

export interface CallSettings {
  // Video settings
  videoEnabled: boolean
  videoQuality: VideoQuality
  virtualBackground: VirtualBackgroundType
  virtualBackgroundUrl?: string
  mirrorVideo: boolean

  // Audio settings
  audioEnabled: boolean
  noiseSuppression: boolean
  echoCancellation: boolean
  autoGainControl: boolean

  // Quality settings
  adaptiveQuality: boolean
  maxBitrate: number // kbps

  // Features
  captionsEnabled: boolean
  screenShareEnabled: boolean
  recordingEnabled: boolean
  chatEnabled: boolean

  // Layout
  gridLayout: boolean // true = grid, false = spotlight
  showNetworkIndicators: boolean
  showCaptions: boolean
}

export interface CallState {
  // Call info
  callId: string
  callType: CallType
  status: CallStatus
  startTime?: Date
  endTime?: Date
  duration: number // seconds

  // Participants
  participants: CallParticipant[]
  localParticipant: CallParticipant
  pinnedParticipantId?: string

  // Settings
  settings: CallSettings

  // Network
  averageNetworkQuality: NetworkQuality
  connectionState: RTCPeerConnectionState

  // Recording
  isRecording: boolean
  recordingStartTime?: Date
  recordingConsent: boolean

  // Chat
  unreadMessageCount: number

  // Errors
  error?: string
}

export interface CallMessage {
  id: string
  callId: string
  senderId: string
  senderName: string
  message: string
  timestamp: Date
  isSystemMessage: boolean
}

export interface CallLog {
  id: string
  callId: string
  callType: CallType

  // Participants
  participantIds: string[]
  participantNames: string[]

  // Timing
  startTime: Date
  endTime: Date
  duration: number // seconds

  // Quality metrics
  averageNetworkQuality: NetworkQuality
  videoQuality: VideoQuality

  // Features used
  hadScreenShare: boolean
  hadRecording: boolean
  hadCaptions: boolean

  // Metadata
  notes?: string
}

export interface CallHistoryEntry {
  id: string
  callId: string
  callType: CallType

  // Other participant (for 1-on-1 calls) or group info
  contactId?: string
  contactName: string
  contactAvatarUrl?: string
  participantCount: number

  // Timing
  startTime: Date
  duration: number

  // Status
  status: 'completed' | 'missed' | 'declined' | 'failed'
  direction: 'incoming' | 'outgoing'

  // Features
  hadScreenShare: boolean
  hadRecording: boolean

  // Quality
  quality: NetworkQuality
}

// API Request/Response types
export interface StartCallRequest {
  contactIds: string[]
  callType: CallType
  settings?: Partial<CallSettings>
}

export interface StartCallResponse {
  success: boolean
  message?: string
  callId?: string
  callState?: CallState
}

export interface JoinCallRequest {
  callId: string
  settings?: Partial<CallSettings>
}

export interface JoinCallResponse {
  success: boolean
  message?: string
  callState?: CallState
}

export interface EndCallRequest {
  callId: string
  reason?: string
}

export interface EndCallResponse {
  success: boolean
  message?: string
}

export interface UpdateCallSettingsRequest {
  callId: string
  settings: Partial<CallSettings>
}

export interface UpdateCallSettingsResponse {
  success: boolean
  message?: string
  settings?: CallSettings
}

export interface ToggleMediaRequest {
  callId: string
  mediaType: 'camera' | 'microphone' | 'screen'
  enabled: boolean
}

export interface ToggleMediaResponse {
  success: boolean
  message?: string
}

export interface PinParticipantRequest {
  callId: string
  participantId: string
  pin: boolean
}

export interface PinParticipantResponse {
  success: boolean
  message?: string
}

export interface SendCallMessageRequest {
  callId: string
  message: string
}

export interface SendCallMessageResponse {
  success: boolean
  message?: string
  callMessage?: CallMessage
}

export interface GetCallHistoryRequest {
  limit?: number
  offset?: number
  contactId?: string
  startDate?: Date
  endDate?: Date
}

export interface GetCallHistoryResponse {
  success: boolean
  entries: CallHistoryEntry[]
  totalCount: number
}

export interface GetCallLogRequest {
  callId: string
}

export interface GetCallLogResponse {
  success: boolean
  log?: CallLog
}

export interface RecordingConsentRequest {
  callId: string
  consent: boolean
}

export interface RecordingConsentResponse {
  success: boolean
  message?: string
}

// SignalR Events for real-time call updates
export interface SignalRCallEvents {
  // Participant events
  onParticipantJoined: (participant: CallParticipant) => void
  onParticipantLeft: (participantId: string) => void
  onParticipantUpdated: (participant: CallParticipant) => void

  // Media events
  onMediaToggled: (participantId: string, mediaType: string, enabled: boolean) => void
  onScreenShareStarted: (participantId: string) => void
  onScreenShareStopped: (participantId: string) => void

  // Network events
  onNetworkQualityChanged: (participantId: string, quality: NetworkQuality) => void

  // Recording events
  onRecordingStarted: () => void
  onRecordingStopped: () => void
  onRecordingConsentRequested: () => void

  // Chat events
  onMessageReceived: (message: CallMessage) => void

  // Call events
  onCallEnded: (reason: string) => void
  onCallError: (error: string) => void

  // Methods to invoke on server
  toggleMedia: (mediaType: string, enabled: boolean) => Promise<void>
  sendMessage: (message: string) => Promise<void>
  updateSettings: (settings: Partial<CallSettings>) => Promise<void>
  pinParticipant: (participantId: string, pin: boolean) => Promise<void>
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  endCall: () => Promise<void>
}

// Network statistics
export interface NetworkStats {
  latency: number // ms
  jitter: number // ms
  packetLoss: number // percentage
  bandwidth: number // kbps
  quality: NetworkQuality
}

// Quality adaptation
export interface QualityAdaptation {
  currentQuality: VideoQuality
  targetQuality: VideoQuality
  reason: 'network' | 'cpu' | 'manual'
  timestamp: Date
}
