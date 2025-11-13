/**
 * Video call related types
 * Maps to FR-003: Video Conferencing
 */

export interface Participant {
  userId: string;
  displayName: string;
  profileImageUrl?: string;
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  peerId?: string;
}

export interface Call {
  callId: string;
  initiatorId: string;
  initiatorName: string;
  startTime: string;
  endTime?: string;
  status: 'Scheduled' | 'Active' | 'Ended' | 'Cancelled';
  isRecording: boolean;
  sessionId?: string;
  participants: Participant[];
}

export interface CreateCallRequest {
  participantIds: string[];
  enableRecording: boolean;
}

export interface WebRTCPeer {
  userId: string;
  peerId: string;
  peer: any; // SimplePeer instance
  stream?: MediaStream;
}
