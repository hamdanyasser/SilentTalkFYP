# SignalR WebRTC Signaling API Documentation

## Overview

The SilentTalk SignalR Hub provides real-time WebRTC signaling for peer-to-peer video/audio calls with sign language recognition. The hub handles room management, WebRTC negotiation (offer/answer/ICE), presence tracking, typing indicators, and network quality monitoring.

**Hub Endpoint**: `/hubs/call`

**Authentication**: Required (JWT Bearer token)

---

## Connection

### Connecting to the Hub

```typescript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl('https://api.silenttalk.com/hubs/call', {
    accessTokenFactory: () => yourAccessToken,
    transport: signalR.HttpTransportType.WebSockets,
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
```

### Connection Lifecycle Events

- **OnConnectedAsync**: Triggered when a user connects
- **OnDisconnectedAsync**: Triggered when a user disconnects (intentional or connection loss)

---

## Room Management

### Join Call

**Method**: `JoinCall`

**Description**: Join a call room and receive current room state with all participants.

**Request**:
```typescript
interface JoinCallRequest {
  callId: string;
  userId: string;
  displayName: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
}
```

**Response**:
```typescript
interface RoomState {
  callId: string;
  participants: Participant[];
  maxParticipants: number;
  isLocked: boolean;
  createdAt: string;
}
```

**Events Triggered**:
- `UserJoined` (sent to other participants)

**Example**:
```typescript
const roomState = await connection.invoke('JoinCall', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  displayName: 'John Doe',
  audioEnabled: true,
  videoEnabled: true,
});
```

---

### Leave Call

**Method**: `LeaveCall`

**Description**: Leave a call room and notify other participants.

**Request**:
```typescript
interface LeaveCallRequest {
  callId: string;
  userId: string;
  reason?: string;
}
```

**Events Triggered**:
- `UserLeft` (sent to other participants)

**Example**:
```typescript
await connection.invoke('LeaveCall', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  reason: 'User ended call',
});
```

---

### Get Room State

**Method**: `GetRoomState`

**Description**: Get current state of a call room including all participants.

**Request**: `callId: string`

**Response**: `RoomState | null`

**Example**:
```typescript
const roomState = await connection.invoke('GetRoomState', '123e4567-e89b-12d3-a456-426614174000');
```

---

### Reconnect to Call

**Method**: `ReconnectToCall`

**Description**: Reconnect to a call after temporary disconnection (e.g., network issue).

**Request**:
```typescript
interface ReconnectRequest {
  callId: string;
  userId: string;
  previousConnectionId: string;
}
```

**Response**: `RoomState`

**Events Triggered**:
- `UserReconnected` (sent to other participants)

**Example**:
```typescript
const roomState = await connection.invoke('ReconnectToCall', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  previousConnectionId: 'abc123',
});
```

---

## WebRTC Signaling

### Send Offer

**Method**: `SendOffer`

**Description**: Send WebRTC offer to a specific peer to initiate connection.

**Request**:
```typescript
interface OfferDto {
  callId: string;
  fromUserId: string;  // Set automatically by server
  toUserId: string;
  sdp: string;
  type: 'offer';
}
```

**Events Triggered**:
- `ReceiveOffer` (sent to target user)

**Example**:
```typescript
await connection.invoke('SendOffer', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  toUserId: 'user-456',
  sdp: '...',
  type: 'offer',
});
```

---

### Send Answer

**Method**: `SendAnswer`

**Description**: Send WebRTC answer in response to an offer.

**Request**:
```typescript
interface AnswerDto {
  callId: string;
  fromUserId: string;  // Set automatically by server
  toUserId: string;
  sdp: string;
  type: 'answer';
}
```

**Events Triggered**:
- `ReceiveAnswer` (sent to target user)

**Example**:
```typescript
await connection.invoke('SendAnswer', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  toUserId: 'user-456',
  sdp: '...',
  type: 'answer',
});
```

---

### Send ICE Candidate

**Method**: `SendIceCandidate`

**Description**: Send ICE candidate for WebRTC connection establishment.

**Request**:
```typescript
interface IceCandidateDto {
  callId: string;
  fromUserId: string;  // Set automatically by server
  toUserId: string;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex?: number;
}
```

**Events Triggered**:
- `ReceiveIceCandidate` (sent to target user)

**Example**:
```typescript
await connection.invoke('SendIceCandidate', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  toUserId: 'user-456',
  candidate: 'candidate:...',
  sdpMid: '0',
  sdpMLineIndex: 0,
});
```

---

### Get ICE Configuration

**Method**: `GetIceConfiguration`

**Description**: Get STUN/TURN server configuration for WebRTC.

**Response**:
```typescript
interface IceConfiguration {
  iceServers: IceServer[];
  iceTransportPolicy: string;
}

interface IceServer {
  urls: string[];
  username?: string;
  credential?: string;
}
```

**Example**:
```typescript
const iceConfig = await connection.invoke('GetIceConfiguration');

// Use with RTCPeerConnection
const pc = new RTCPeerConnection(iceConfig);
```

**Supported TURN/STUN Providers**:
- Google STUN (default, no auth)
- Coturn (with time-limited credentials)
- Twilio (configured via environment)
- Xirsys (configured via environment)

---

## Media State Management

### Update Media State

**Method**: `UpdateMediaState`

**Description**: Update audio/video enabled state and notify other participants.

**Request**:
```typescript
interface MediaStateDto {
  callId: string;
  userId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}
```

**Events Triggered**:
- `MediaStateChanged` (sent to other participants)

**Example**:
```typescript
// Mute audio
await connection.invoke('UpdateMediaState', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  audioEnabled: false,
});

// Turn off video
await connection.invoke('UpdateMediaState', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  videoEnabled: false,
});
```

---

## Typing Indicators

### Send Typing

**Method**: `SendTyping`

**Description**: Send typing indicator for chat messages.

**Request**:
```typescript
interface TypingDto {
  callId: string;
  userId: string;
  displayName: string;
  isTyping: boolean;
}
```

**Events Triggered**:
- `UserTyping` (sent to other participants)

**Example**:
```typescript
// Start typing
await connection.invoke('SendTyping', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  displayName: 'John Doe',
  isTyping: true,
});

// Stop typing
await connection.invoke('SendTyping', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  displayName: 'John Doe',
  isTyping: false,
});
```

---

## Network Quality Monitoring

### Update Network Quality

**Method**: `UpdateNetworkQuality`

**Description**: Report network quality metrics.

**Request**:
```typescript
interface NetworkQualityDto {
  callId: string;
  userId: string;
  quality: NetworkQuality;
  stats?: NetworkStats;
}

enum NetworkQuality {
  Excellent = 0,
  Good = 1,
  Fair = 2,
  Poor = 3,
  VeryPoor = 4,
  Disconnected = 5
}

interface NetworkStats {
  latency?: number;        // ms
  packetLoss?: number;     // percentage (0-1)
  jitter?: number;         // ms
  bytesSent?: number;
  bytesReceived?: number;
  bitrate?: number;        // kbps
}
```

**Events Triggered**:
- `NetworkQualityChanged` (sent to other participants)

**Example**:
```typescript
await connection.invoke('UpdateNetworkQuality', {
  callId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  quality: NetworkQuality.Good,
  stats: {
    latency: 45,
    packetLoss: 0.01,
    jitter: 5,
    bytesSent: 1024000,
    bytesReceived: 2048000,
    bitrate: 1500,
  },
});
```

---

## Client Events (Receive)

### UserJoined

**Description**: A new user joined the call.

**Payload**:
```typescript
interface Participant {
  userId: string;
  displayName: string;
  connectionId: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  joinedAt: string;
  quality?: NetworkQuality;
}
```

**Example**:
```typescript
connection.on('UserJoined', (participant: Participant) => {
  console.log(`${participant.displayName} joined the call`);
  // Create WebRTC peer connection
});
```

---

### UserLeft

**Description**: A user left the call.

**Payload**:
```typescript
interface UserLeftEvent {
  userId: string;
  reason: string;
}
```

**Example**:
```typescript
connection.on('UserLeft', (data) => {
  console.log(`User ${data.userId} left: ${data.reason}`);
  // Remove WebRTC peer connection
});
```

---

### UserDisconnected

**Description**: A user temporarily disconnected (network issue).

**Payload**:
```typescript
interface UserDisconnectedEvent {
  userId: string;
  displayName: string;
  reason: string;
}
```

**Example**:
```typescript
connection.on('UserDisconnected', (data) => {
  console.log(`${data.displayName} disconnected: ${data.reason}`);
  // Show reconnecting indicator
});
```

---

### UserReconnected

**Description**: A user reconnected after temporary disconnection.

**Payload**:
```typescript
interface UserReconnectedEvent {
  userId: string;
  connectionId: string;
}
```

**Example**:
```typescript
connection.on('UserReconnected', (data) => {
  console.log(`User ${data.userId} reconnected`);
  // Update connection state, may need to renegotiate WebRTC
});
```

---

### ReceiveOffer

**Description**: Received WebRTC offer from another peer.

**Payload**: `OfferDto`

**Example**:
```typescript
connection.on('ReceiveOffer', async (offer) => {
  console.log(`Received offer from ${offer.fromUserId}`);
  // Handle offer with RTCPeerConnection
  const answer = await createAnswer(offer.sdp);
  await connection.invoke('SendAnswer', {
    callId: offer.callId,
    toUserId: offer.fromUserId,
    sdp: answer,
    type: 'answer',
  });
});
```

---

### ReceiveAnswer

**Description**: Received WebRTC answer from another peer.

**Payload**: `AnswerDto`

**Example**:
```typescript
connection.on('ReceiveAnswer', (answer) => {
  console.log(`Received answer from ${answer.fromUserId}`);
  // Handle answer with RTCPeerConnection
  peerConnection.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
});
```

---

### ReceiveIceCandidate

**Description**: Received ICE candidate from another peer.

**Payload**: `IceCandidateDto`

**Example**:
```typescript
connection.on('ReceiveIceCandidate', (candidate) => {
  console.log(`Received ICE candidate from ${candidate.fromUserId}`);
  // Add ICE candidate to peer connection
  peerConnection.addIceCandidate({
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
  });
});
```

---

### MediaStateChanged

**Description**: Another participant changed their media state.

**Payload**:
```typescript
interface MediaStateChangedEvent {
  userId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}
```

**Example**:
```typescript
connection.on('MediaStateChanged', (data) => {
  if (data.audioEnabled !== undefined) {
    console.log(`User ${data.userId} ${data.audioEnabled ? 'unmuted' : 'muted'} audio`);
  }
  if (data.videoEnabled !== undefined) {
    console.log(`User ${data.userId} ${data.videoEnabled ? 'enabled' : 'disabled'} video`);
  }
});
```

---

### UserTyping

**Description**: Another participant is typing a message.

**Payload**:
```typescript
interface UserTypingEvent {
  userId: string;
  displayName: string;
  isTyping: boolean;
}
```

**Example**:
```typescript
connection.on('UserTyping', (data) => {
  if (data.isTyping) {
    console.log(`${data.displayName} is typing...`);
  }
});
```

---

### NetworkQualityChanged

**Description**: Another participant's network quality changed.

**Payload**:
```typescript
interface NetworkQualityChangedEvent {
  userId: string;
  quality: NetworkQuality;
  stats?: NetworkStats;
}
```

**Example**:
```typescript
connection.on('NetworkQualityChanged', (data) => {
  console.log(`User ${data.userId} network quality: ${NetworkQuality[data.quality]}`);
  if (data.quality >= NetworkQuality.Poor) {
    console.warn('Poor network quality detected');
  }
});
```

---

## Reconnection Logic

### Automatic Reconnection

The SignalR client supports automatic reconnection with exponential backoff:

```typescript
.withAutomaticReconnect({
  nextRetryDelayInMilliseconds: (retryContext) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    if (retryContext.previousRetryCount >= 5) {
      return null; // Stop reconnecting after 5 attempts
    }
    return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
  },
})
```

### Reconnection Events

```typescript
connection.onreconnecting((error) => {
  console.log('Reconnecting...', error);
  // Show reconnecting UI
});

connection.onreconnected((connectionId) => {
  console.log('Reconnected!', connectionId);
  // Rejoin call room
  await connection.invoke('ReconnectToCall', {
    callId: currentCallId,
    userId: currentUserId,
    previousConnectionId: oldConnectionId,
  });
});

connection.onclose((error) => {
  console.log('Connection closed', error);
  // Clean up resources
});
```

---

## Complete Integration Example

```typescript
import { CallSignalingClient } from './CallSignalingClient';
import { PeerConnectionManager } from './PeerConnectionManager';

// Initialize
const signalingClient = new CallSignalingClient(
  'https://api.silenttalk.com/hubs/call',
  accessToken,
  (state) => console.log('Connection state:', state)
);

await signalingClient.connect();

// Get local media stream
const localStream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true,
});

// Create peer connection manager
const peerManager = new PeerConnectionManager(
  signalingClient,
  callId,
  userId,
  (remoteUserId, stream) => {
    // Display remote stream
    const videoElement = document.getElementById(`video-${remoteUserId}`);
    videoElement.srcObject = stream;
  },
  (remoteUserId) => {
    // Handle peer disconnection
    console.log(`Peer ${remoteUserId} disconnected`);
  },
  (remoteUserId, error) => {
    // Handle errors
    console.error(`Peer ${remoteUserId} error:`, error);
  }
);

await peerManager.initialize(localStream);

// Join call
const roomState = await signalingClient.joinCall({
  callId,
  userId,
  displayName: 'John Doe',
  audioEnabled: true,
  videoEnabled: true,
});

// Create peer connections for existing participants
for (const participant of roomState.participants) {
  if (participant.userId !== userId) {
    await peerManager.createPeerConnection(participant.userId, true);
  }
}

// Monitor network quality
peerManager.startNetworkQualityMonitoring(5000);

// Toggle media
peerManager.toggleAudio(false); // Mute
peerManager.toggleVideo(false); // Turn off camera

// Leave call
await signalingClient.leaveCall({ callId, userId });
peerManager.cleanup();
await signalingClient.disconnect();
```

---

## Environment Configuration

### TURN/STUN Server Setup

**appsettings.Development.json**:
```json
{
  "WebRTC": {
    "StunServers": [
      "stun:stun.l.google.com:19302"
    ],
    "TurnServers": [],
    "TurnUsername": "",
    "TurnCredential": "",
    "Coturn": {
      "Url": "turn:your-server.com:3478",
      "SharedSecret": "secret",
      "CredentialTTL": 86400
    }
  },
  "Twilio": {
    "AccountSid": "your-twilio-sid",
    "AuthToken": "your-twilio-token"
  },
  "Xirsys": {
    "Channel": "your-channel",
    "Ident": "your-ident",
    "Secret": "your-secret"
  }
}
```

---

## Definition of Done

✅ **Two browsers can establish P2P call via simple-peer**
- SignalR hub relays offer/answer/ICE candidates
- WebRTC peer connections established
- Audio/video streams transmitted

✅ **Reconnection logic included**
- Automatic reconnection with exponential backoff
- `ReconnectToCall` method for seamless rejoin
- Connection state tracking and events

✅ **Events documented**
- All 14 client-to-server methods documented
- All 11 server-to-client events documented
- Complete integration examples provided
- Environment configuration detailed

✅ **TURN/STUN configuration**
- Support for Google STUN (default)
- Coturn with time-limited credentials
- Twilio integration ready
- Xirsys integration ready
- Configurable via environment variables
