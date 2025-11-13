/**
 * API Performance Load Tests
 * Tests API endpoints to ensure p95 ≤ 200ms (NFR-001)
 *
 * Test scenarios:
 * - User authentication and registration
 * - Profile operations
 * - Video call session management
 * - Forum CRUD operations
 * - Resource library access
 * - Interpreter booking
 * - Real-time notifications
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'
import { getStages, getThresholds, getHttpOptions, addCorrelationHeaders } from './k6.config.js'

// Custom metrics
const apiSuccessRate = new Rate('api_success_rate')
const apiErrors = new Counter('api_errors')
const authDuration = new Trend('auth_duration')
const apiCallDuration = new Trend('api_call_duration')
const dbQueryDuration = new Trend('db_query_duration')

// Test configuration
export const options = {
  stages: getStages(__ENV.TEST_MODE || 'load'),
  thresholds: getThresholds({
    'http_req_duration{endpoint:auth}': ['p(95)<200'],
    'http_req_duration{endpoint:profile}': ['p(95)<150'],
    'http_req_duration{endpoint:video_session}': ['p(95)<200'],
    'http_req_duration{endpoint:forum}': ['p(95)<200'],
    'http_req_duration{endpoint:resources}': ['p(95)<150'],
    'http_req_duration{endpoint:booking}': ['p(95)<200'],
  }),
}

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'

// Test data generators
function generateUser() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return {
    email: `loadtest-${timestamp}-${random}@test.com`,
    password: 'TestPassword123!',
    username: `user_${timestamp}_${random}`,
    firstName: `Test${random}`,
    lastName: `User${timestamp}`,
  }
}

function generateForumPost() {
  return {
    title: `Load Test Post ${Date.now()}`,
    content: 'This is a load test forum post. '.repeat(10),
    category: ['general', 'support', 'announcements'][Math.floor(Math.random() * 3)],
    tags: ['test', 'performance', 'k6'],
  }
}

function generateBookingRequest(interpreterId) {
  const now = new Date()
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour duration

  return {
    interpreterId,
    type: 'video',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    topic: 'Load test session',
    specialRequirements: 'None',
  }
}

// Test scenario
export default function () {
  let authToken = null
  let userId = null
  let sessionId = `k6-session-${__VU}-${__ITER}`

  // Group 1: Authentication Flow
  group('Authentication', () => {
    const user = generateUser()
    const registerPayload = JSON.stringify(user)

    // Register user
    let options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'auth', operation: 'register' }

    const registerStart = Date.now()
    const registerRes = http.post(`${API_BASE_URL}/api/auth/register`, registerPayload, options)
    authDuration.add(Date.now() - registerStart)

    const registerSuccess = check(registerRes, {
      'register status is 201': r => r.status === 201,
      'register response has userId': r => {
        try {
          return JSON.parse(r.body).userId !== undefined
        } catch {
          return false
        }
      },
      'register response time < 500ms': r => r.timings.duration < 500,
    })

    apiSuccessRate.add(registerSuccess)
    if (!registerSuccess) {
      apiErrors.add(1)
      console.error(`Registration failed: ${registerRes.status} - ${registerRes.body}`)
      return // Skip rest if registration fails
    }

    if (registerRes.status === 201) {
      const registerData = JSON.parse(registerRes.body)
      authToken = registerData.token
      userId = registerData.userId
    }

    sleep(0.5)

    // Login user
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    })

    options = getHttpOptions()
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'auth', operation: 'login' }

    const loginStart = Date.now()
    const loginRes = http.post(`${API_BASE_URL}/api/auth/login`, loginPayload, options)
    authDuration.add(Date.now() - loginStart)

    const loginSuccess = check(loginRes, {
      'login status is 200': r => r.status === 200,
      'login response has token': r => {
        try {
          return JSON.parse(r.body).token !== undefined
        } catch {
          return false
        }
      },
      'login response time < 300ms': r => r.timings.duration < 300,
    })

    apiSuccessRate.add(loginSuccess)
    if (!loginSuccess) {
      apiErrors.add(1)
    }
  })

  if (!authToken) {
    console.error('Failed to obtain auth token, skipping authenticated tests')
    return
  }

  sleep(1)

  // Group 2: Profile Operations
  group('Profile Operations', () => {
    let options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'profile', operation: 'get' }

    const profileStart = Date.now()
    const getProfileRes = http.get(`${API_BASE_URL}/api/profile/${userId}`, options)
    apiCallDuration.add(Date.now() - profileStart)

    const profileSuccess = check(getProfileRes, {
      'get profile status is 200': r => r.status === 200,
      'get profile response time < 200ms': r => r.timings.duration < 200,
      'get profile has user data': r => {
        try {
          const data = JSON.parse(r.body)
          return data.userId === userId
        } catch {
          return false
        }
      },
    })

    apiSuccessRate.add(profileSuccess)
    if (!profileSuccess) apiErrors.add(1)

    sleep(0.3)

    // Update profile
    const updatePayload = JSON.stringify({
      bio: 'Performance test user bio',
      preferences: {
        theme: 'dark',
        notifications: true,
      },
    })

    options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'profile', operation: 'update' }

    const updateStart = Date.now()
    const updateRes = http.put(`${API_BASE_URL}/api/profile/${userId}`, updatePayload, options)
    apiCallDuration.add(Date.now() - updateStart)

    const updateSuccess = check(updateRes, {
      'update profile status is 200': r => r.status === 200,
      'update profile response time < 250ms': r => r.timings.duration < 250,
    })

    apiSuccessRate.add(updateSuccess)
    if (!updateSuccess) apiErrors.add(1)
  })

  sleep(1)

  // Group 3: Video Session Management
  group('Video Session Management', () => {
    const sessionPayload = JSON.stringify({
      type: 'peer-to-peer',
      maxParticipants: 2,
      duration: 60,
    })

    let options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'video_session', operation: 'create' }

    const createSessionStart = Date.now()
    const createSessionRes = http.post(
      `${API_BASE_URL}/api/video/session`,
      sessionPayload,
      options,
    )
    apiCallDuration.add(Date.now() - createSessionStart)

    let videoSessionId = null
    const createSuccess = check(createSessionRes, {
      'create session status is 201': r => r.status === 201,
      'create session response time < 300ms': r => r.timings.duration < 300,
      'create session has sessionId': r => {
        try {
          const data = JSON.parse(r.body)
          videoSessionId = data.sessionId
          return videoSessionId !== undefined
        } catch {
          return false
        }
      },
    })

    apiSuccessRate.add(createSuccess)
    if (!createSuccess) {
      apiErrors.add(1)
      return
    }

    sleep(0.5)

    // Get session details
    options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'video_session', operation: 'get' }

    const getSessionStart = Date.now()
    const getSessionRes = http.get(`${API_BASE_URL}/api/video/session/${videoSessionId}`, options)
    apiCallDuration.add(Date.now() - getSessionStart)

    const getSuccess = check(getSessionRes, {
      'get session status is 200': r => r.status === 200,
      'get session response time < 150ms': r => r.timings.duration < 150,
    })

    apiSuccessRate.add(getSuccess)
    if (!getSuccess) apiErrors.add(1)
  })

  sleep(1)

  // Group 4: Forum Operations
  group('Forum Operations', () => {
    // List forum posts
    let options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'forum', operation: 'list' }

    const listStart = Date.now()
    const listRes = http.get(`${API_BASE_URL}/api/forum/posts?page=1&limit=20`, options)
    apiCallDuration.add(Date.now() - listStart)

    const listSuccess = check(listRes, {
      'list posts status is 200': r => r.status === 200,
      'list posts response time < 200ms': r => r.timings.duration < 200,
    })

    apiSuccessRate.add(listSuccess)
    if (!listSuccess) apiErrors.add(1)

    sleep(0.3)

    // Create forum post
    const postPayload = JSON.stringify(generateForumPost())

    options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'forum', operation: 'create' }

    const createPostStart = Date.now()
    const createPostRes = http.post(`${API_BASE_URL}/api/forum/posts`, postPayload, options)
    apiCallDuration.add(Date.now() - createPostStart)

    let postId = null
    const createPostSuccess = check(createPostRes, {
      'create post status is 201': r => r.status === 201,
      'create post response time < 300ms': r => r.timings.duration < 300,
      'create post has postId': r => {
        try {
          const data = JSON.parse(r.body)
          postId = data.postId
          return postId !== undefined
        } catch {
          return false
        }
      },
    })

    apiSuccessRate.add(createPostSuccess)
    if (!createPostSuccess) apiErrors.add(1)

    if (postId) {
      sleep(0.3)

      // Get post details
      options = getHttpOptions(authToken)
      options = addCorrelationHeaders(options, sessionId)
      options.tags = { endpoint: 'forum', operation: 'get' }

      const getPostStart = Date.now()
      const getPostRes = http.get(`${API_BASE_URL}/api/forum/posts/${postId}`, options)
      dbQueryDuration.add(Date.now() - getPostStart)

      const getPostSuccess = check(getPostRes, {
        'get post status is 200': r => r.status === 200,
        'get post response time < 150ms': r => r.timings.duration < 150,
      })

      apiSuccessRate.add(getPostSuccess)
      if (!getPostSuccess) apiErrors.add(1)
    }
  })

  sleep(1)

  // Group 5: Resource Library
  group('Resource Library', () => {
    let options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'resources', operation: 'list' }

    const listResourcesStart = Date.now()
    const listResourcesRes = http.get(
      `${API_BASE_URL}/api/resources?category=tutorials&page=1&limit=20`,
      options,
    )
    apiCallDuration.add(Date.now() - listResourcesStart)

    const listSuccess = check(listResourcesRes, {
      'list resources status is 200': r => r.status === 200,
      'list resources response time < 150ms': r => r.timings.duration < 150,
    })

    apiSuccessRate.add(listSuccess)
    if (!listSuccess) apiErrors.add(1)

    sleep(0.3)

    // Search resources
    options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'resources', operation: 'search' }

    const searchStart = Date.now()
    const searchRes = http.get(`${API_BASE_URL}/api/resources/search?q=asl+basics`, options)
    apiCallDuration.add(Date.now() - searchStart)

    const searchSuccess = check(searchRes, {
      'search resources status is 200': r => r.status === 200,
      'search resources response time < 200ms': r => r.timings.duration < 200,
    })

    apiSuccessRate.add(searchSuccess)
    if (!searchSuccess) apiErrors.add(1)
  })

  sleep(1)

  // Group 6: Interpreter Booking
  group('Interpreter Booking', () => {
    // List interpreters
    let options = getHttpOptions(authToken)
    options = addCorrelationHeaders(options, sessionId)
    options.tags = { endpoint: 'booking', operation: 'list_interpreters' }

    const listInterpretersStart = Date.now()
    const listInterpretersRes = http.get(
      `${API_BASE_URL}/api/interpreters?page=1&limit=20`,
      options,
    )
    apiCallDuration.add(Date.now() - listInterpretersStart)

    let interpreterId = null
    const listSuccess = check(listInterpretersRes, {
      'list interpreters status is 200': r => r.status === 200,
      'list interpreters response time < 200ms': r => r.timings.duration < 200,
      'list has interpreters': r => {
        try {
          const data = JSON.parse(r.body)
          if (data.interpreters && data.interpreters.length > 0) {
            interpreterId = data.interpreters[0].id
            return true
          }
          return false
        } catch {
          return false
        }
      },
    })

    apiSuccessRate.add(listSuccess)
    if (!listSuccess) apiErrors.add(1)

    if (interpreterId) {
      sleep(0.5)

      // Check availability
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const dateStr = tomorrow.toISOString().split('T')[0]

      options = getHttpOptions(authToken)
      options = addCorrelationHeaders(options, sessionId)
      options.tags = { endpoint: 'booking', operation: 'check_availability' }

      const availStart = Date.now()
      const availRes = http.get(
        `${API_BASE_URL}/api/interpreters/${interpreterId}/availability?date=${dateStr}`,
        options,
      )
      apiCallDuration.add(Date.now() - availStart)

      const availSuccess = check(availRes, {
        'check availability status is 200': r => r.status === 200,
        'check availability response time < 150ms': r => r.timings.duration < 150,
      })

      apiSuccessRate.add(availSuccess)
      if (!availSuccess) apiErrors.add(1)

      sleep(0.3)

      // Create booking
      const bookingPayload = JSON.stringify(generateBookingRequest(interpreterId))

      options = getHttpOptions(authToken)
      options = addCorrelationHeaders(options, sessionId)
      options.tags = { endpoint: 'booking', operation: 'create' }

      const createBookingStart = Date.now()
      const createBookingRes = http.post(`${API_BASE_URL}/api/bookings`, bookingPayload, options)
      apiCallDuration.add(Date.now() - createBookingStart)

      const bookingSuccess = check(createBookingRes, {
        'create booking status is 201': r => r.status === 201,
        'create booking response time < 300ms': r => r.timings.duration < 300,
      })

      apiSuccessRate.add(bookingSuccess)
      if (!bookingSuccess) apiErrors.add(1)
    }
  })

  // Think time between iterations
  sleep(Math.random() * 3 + 2) // 2-5 seconds
}

/**
 * Setup function - runs once per VU at the start
 */
export function setup() {
  console.log(`Starting API performance test against ${API_BASE_URL}`)
  console.log(`Test mode: ${__ENV.TEST_MODE || 'load'}`)

  // Health check
  const healthRes = http.get(`${API_BASE_URL}/health`)
  if (healthRes.status !== 200) {
    throw new Error(`API health check failed: ${healthRes.status}`)
  }

  return { startTime: Date.now() }
}

/**
 * Teardown function - runs once after all VUs complete
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`API performance test completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration.values['p(95)']
  const p99 = data.metrics.http_req_duration.values['p(99)']
  const errorRate = data.metrics.http_req_failed.values.rate || 0
  const successRate = data.metrics.api_success_rate?.values.rate || 0

  console.log('\n=== API Performance Test Summary ===')
  console.log(`P95 Latency: ${p95.toFixed(2)}ms (Target: ≤200ms) - ${p95 <= 200 ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`P99 Latency: ${p99.toFixed(2)}ms (Target: ≤500ms) - ${p99 <= 500 ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}% (Target: <1%) - ${errorRate < 0.01 ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`Success Rate: ${(successRate * 100).toFixed(2)}% (Target: >99%) - ${successRate > 0.99 ? '✓ PASS' : '✗ FAIL'}`)

  return {
    'reports/api-performance.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
