/**
 * WebRTC Multi-Party Synthetic Load Test
 * Tests real-time communication performance under load
 *
 * Scenarios:
 * - Peer-to-peer video calls (2 participants)
 * - Group video calls (3-8 participants)
 * - Large meetings (8-20 participants)
 * - Connection establishment time
 * - Media quality metrics (bitrate, packet loss, jitter)
 * - Signaling server performance
 */

import { check, sleep, group } from 'k6'
import ws from 'k6/ws'
import http from 'k6/http'
import { Rate, Counter, Trend } from 'k6/metrics'
import { getStages, getThresholds, getHttpOptions, addCorrelationHeaders } from './k6.config.js'

// Custom metrics
const webrtcConnectionTime = new Trend('webrtc_connection_time')
const signalingLatency = new Trend('signaling_latency')
const mediaQuality = new Trend('media_quality_score')
const connectionFailures = new Counter('connection_failures')
const activeConnections = new Counter('active_connections')
const messagesSent = new Counter('messages_sent')
const messagesReceived = new Counter('messages_received')
const connectionSuccessRate = new Rate('connection_success_rate')

// Test configuration
export const options = {
  stages: getStages(__ENV.TEST_MODE || 'load'),
  thresholds: getThresholds({
    webrtc_connection_time: ['p(95)<1000', 'p(99)<2000'],
    signaling_latency: ['p(95)<100', 'p(99)<200'],
    media_quality_score: ['avg>0.8'], // 0-1 scale
    connection_success_rate: ['rate>0.98'],
  }),
}

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'
const WS_BASE_URL = __ENV.WS_BASE_URL || 'ws://localhost:5000'

/**
 * Simulate WebRTC session types
 */
const SESSION_TYPES = {
  PEER_TO_PEER: { participants: 2, bandwidth: 1.5, duration: 300 }, // 1.5 Mbps, 5 min
  SMALL_GROUP: { participants: 4, bandwidth: 2.5, duration: 600 }, // 2.5 Mbps, 10 min
  MEDIUM_GROUP: { participants: 8, bandwidth: 4.0, duration: 900 }, // 4.0 Mbps, 15 min
  LARGE_GROUP: { participants: 20, bandwidth: 6.0, duration: 1800 }, // 6.0 Mbps, 30 min
}

/**
 * Generate synthetic WebRTC statistics
 */
function generateWebRTCStats(sessionType, duration) {
  const baseLatency = 50 + Math.random() * 50 // 50-100ms base
  const congestion = Math.min(duration / sessionType.duration, 1) // Increases over time
  const participantLoad = sessionType.participants / 20 // Normalized load

  return {
    audio: {
      bitrate: Math.max(0, 64 + Math.random() * 32 - congestion * 20), // kbps
      packetLoss: Math.min(5, Math.random() * 2 + congestion * 3), // %
      jitter: Math.min(30, 5 + Math.random() * 10 + congestion * 10), // ms
      latency: baseLatency + participantLoad * 50, // ms
    },
    video: {
      bitrate: Math.max(0, sessionType.bandwidth * 1000 - congestion * 500), // kbps
      packetLoss: Math.min(5, Math.random() * 1.5 + congestion * 2), // %
      jitter: Math.min(50, 10 + Math.random() * 20 + congestion * 15), // ms
      latency: baseLatency + participantLoad * 70, // ms
      frameRate: Math.max(15, 30 - congestion * 10), // fps
      resolution: congestion < 0.3 ? '720p' : congestion < 0.7 ? '480p' : '360p',
    },
    connection: {
      state: congestion < 0.9 ? 'connected' : 'degraded',
      quality: Math.max(0, 1 - congestion * 0.5 - Math.random() * 0.2), // 0-1
      bandwidth: sessionType.bandwidth * (1 - congestion * 0.3), // Mbps
    },
  }
}

/**
 * Calculate media quality score (0-1)
 */
function calculateQualityScore(stats) {
  const audioScore =
    (100 - stats.audio.packetLoss) / 100 * 0.3 + // 30% weight
    Math.max(0, 1 - stats.audio.jitter / 50) * 0.2 // 20% weight

  const videoScore =
    (100 - stats.video.packetLoss) / 100 * 0.3 + // 30% weight
    stats.video.frameRate / 30 * 0.2 // 20% weight

  return audioScore + videoScore
}

/**
 * Simulate WebRTC signaling via WebSocket
 */
function simulateSignaling(sessionId, participantId, sessionType) {
  const url = `${WS_BASE_URL}/signaling?session=${sessionId}&participant=${participantId}`
  const connectionStart = Date.now()
  let connected = false
  let offerReceived = false
  let answerSent = false

  const res = ws.connect(
    url,
    {
      headers: {
        'X-Session-ID': sessionId,
        'X-Participant-ID': participantId,
        'X-Test-Run': 'k6-webrtc-test',
      },
    },
    function (socket) {
      socket.on('open', () => {
        connected = true
        const connectionTime = Date.now() - connectionStart
        webrtcConnectionTime.add(connectionTime)
        activeConnections.add(1)

        // Send join message
        const joinStart = Date.now()
        socket.send(
          JSON.stringify({
            type: 'join',
            sessionId,
            participantId,
            sessionType: sessionType.participants === 2 ? 'peer-to-peer' : 'group',
            capabilities: {
              audio: true,
              video: true,
              dataChannel: true,
            },
          }),
        )
        messagesSent.add(1)
        signalingLatency.add(Date.now() - joinStart)
      })

      socket.on('message', msg => {
        messagesReceived.add(1)
        const messageStart = Date.now()

        try {
          const data = JSON.parse(msg)

          switch (data.type) {
            case 'offer':
              offerReceived = true
              // Simulate processing offer and sending answer
              sleep(0.05) // 50ms processing time
              socket.send(
                JSON.stringify({
                  type: 'answer',
                  sessionId,
                  participantId,
                  sdp: 'mock-sdp-answer',
                }),
              )
              messagesSent.add(1)
              answerSent = true
              break

            case 'ice-candidate':
              // Acknowledge ICE candidate
              socket.send(
                JSON.stringify({
                  type: 'ice-candidate-received',
                  sessionId,
                  participantId,
                }),
              )
              messagesSent.add(1)
              break

            case 'participant-joined':
              // Another participant joined
              console.log(
                `Participant ${data.participantId} joined session ${sessionId}`,
              )
              break

            case 'stats-request':
              // Server requesting stats
              const stats = generateWebRTCStats(sessionType, Date.now() - connectionStart)
              socket.send(
                JSON.stringify({
                  type: 'stats',
                  sessionId,
                  participantId,
                  stats,
                  timestamp: Date.now(),
                }),
              )
              messagesSent.add(1)

              // Calculate and record quality score
              const qualityScore = calculateQualityScore(stats)
              mediaQuality.add(qualityScore)
              break
          }

          signalingLatency.add(Date.now() - messageStart)
        } catch (error) {
          console.error(`Error processing message: ${error}`)
        }
      })

      socket.on('close', () => {
        activeConnections.add(-1)
      })

      socket.on('error', e => {
        console.error(`WebSocket error: ${e}`)
        connectionFailures.add(1)
      })

      // Keep connection alive for session duration
      socket.setTimeout(() => {
        // Send periodic stats updates
        for (let i = 0; i < 10; i++) {
          if (socket) {
            const stats = generateWebRTCStats(sessionType, i * 1000)
            socket.send(
              JSON.stringify({
                type: 'stats',
                sessionId,
                participantId,
                stats,
                timestamp: Date.now(),
              }),
            )
            messagesSent.add(1)

            const qualityScore = calculateQualityScore(stats)
            mediaQuality.add(qualityScore)
          }
          sleep(1)
        }

        // Gracefully leave
        socket.send(
          JSON.stringify({
            type: 'leave',
            sessionId,
            participantId,
          }),
        )
        messagesSent.add(1)
        socket.close()
      }, 10000) // 10 second test connection
    },
  )

  const signalingSuccess = check(res, {
    'websocket connected': () => connected,
    'offer received': () => offerReceived,
    'answer sent': () => answerSent,
    'connection time < 2s': () => Date.now() - connectionStart < 2000,
  })

  connectionSuccessRate.add(signalingSuccess)
  if (!signalingSuccess) {
    connectionFailures.add(1)
  }

  return signalingSuccess
}

/**
 * Main test scenario
 */
export default function () {
  const sessionId = `session-${__VU}-${__ITER}-${Date.now()}`
  const participantId = `participant-${__VU}-${Date.now()}`

  // Determine session type based on iteration
  const sessionTypes = Object.values(SESSION_TYPES)
  const sessionType = sessionTypes[__ITER % sessionTypes.length]

  group('WebRTC Session Lifecycle', () => {
    // Step 1: Create session via API
    group('Create Session', () => {
      const payload = JSON.stringify({
        type: sessionType.participants === 2 ? 'peer-to-peer' : 'group',
        maxParticipants: sessionType.participants,
        bandwidth: sessionType.bandwidth,
      })

      let options = getHttpOptions()
      options = addCorrelationHeaders(options, sessionId)

      const createStart = Date.now()
      const createRes = http.post(`${API_BASE_URL}/api/video/session`, payload, options)

      const createSuccess = check(createRes, {
        'create session status is 201': r => r.status === 201,
        'create session response time < 300ms': r => r.timings.duration < 300,
        'session has id': r => {
          try {
            return JSON.parse(r.body).sessionId !== undefined
          } catch {
            return false
          }
        },
      })

      if (!createSuccess) {
        console.error(`Failed to create session: ${createRes.status}`)
        connectionFailures.add(1)
        return
      }
    })

    sleep(0.5)

    // Step 2: Establish WebRTC connection via signaling
    group('WebRTC Signaling', () => {
      const signalingSuccess = simulateSignaling(sessionId, participantId, sessionType)

      if (!signalingSuccess) {
        console.error(`Signaling failed for session ${sessionId}`)
        return
      }
    })

    sleep(1)

    // Step 3: Get session stats via API
    group('Get Session Stats', () => {
      let options = getHttpOptions()
      options = addCorrelationHeaders(options, sessionId)

      const statsRes = http.get(`${API_BASE_URL}/api/video/session/${sessionId}/stats`, options)

      check(statsRes, {
        'get stats status is 200': r => r.status === 200,
        'get stats response time < 200ms': r => r.timings.duration < 200,
      })
    })
  })

  // Simulate multiple participants for group calls
  if (sessionType.participants > 2) {
    group('Multi-Party Participants', () => {
      const additionalParticipants = Math.min(3, sessionType.participants - 1)

      for (let i = 0; i < additionalParticipants; i++) {
        const additionalParticipantId = `${participantId}-peer-${i}`
        simulateSignaling(sessionId, additionalParticipantId, sessionType)
        sleep(0.5)
      }
    })
  }

  // Think time between sessions
  sleep(Math.random() * 2 + 1)
}

/**
 * Setup function
 */
export function setup() {
  console.log(`Starting WebRTC load test against ${WS_BASE_URL}`)
  console.log(`Test mode: ${__ENV.TEST_MODE || 'load'}`)

  // Verify WebSocket endpoint is available
  const healthRes = http.get(`${API_BASE_URL}/health`)
  if (healthRes.status !== 200) {
    throw new Error(`API health check failed: ${healthRes.status}`)
  }

  return { startTime: Date.now() }
}

/**
 * Teardown function
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`WebRTC load test completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const connectionTime = data.metrics.webrtc_connection_time.values
  const signalingP95 = data.metrics.signaling_latency?.values['p(95)'] || 0
  const avgQuality = data.metrics.media_quality_score?.values.avg || 0
  const successRate = data.metrics.connection_success_rate?.values.rate || 0
  const failures = data.metrics.connection_failures?.values.count || 0

  console.log('\n=== WebRTC Load Test Summary ===')
  console.log(
    `Connection Time P95: ${connectionTime['p(95)'].toFixed(2)}ms (Target: <1000ms) - ${connectionTime['p(95)'] < 1000 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Connection Time P99: ${connectionTime['p(99)'].toFixed(2)}ms (Target: <2000ms) - ${connectionTime['p(99)'] < 2000 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Signaling Latency P95: ${signalingP95.toFixed(2)}ms (Target: <100ms) - ${signalingP95 < 100 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Average Media Quality: ${(avgQuality * 100).toFixed(2)}% (Target: >80%) - ${avgQuality > 0.8 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Connection Success Rate: ${(successRate * 100).toFixed(2)}% (Target: >98%) - ${successRate > 0.98 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(`Total Connection Failures: ${failures}`)

  return {
    'reports/webrtc-load.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
