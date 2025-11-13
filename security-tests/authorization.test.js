/**
 * Authorization Security Tests
 * Tests access control, privilege escalation, and authorization bypasses (NFR-004)
 *
 * Test Coverage:
 * - Role-based access control (RBAC)
 * - Resource ownership validation
 * - Privilege escalation prevention
 * - Horizontal authorization bypass
 * - Vertical authorization bypass
 * - Token validation
 * - Session management
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Counter, Rate } from 'k6/metrics'

const authorizationViolations = new Counter('authorization_violations')
const authorizationSuccess = new Rate('authorization_success_rate')
const privilegeEscalationAttempts = new Counter('privilege_escalation_attempts')

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'

/**
 * Test users with different roles
 */
const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'AdminPassword123!',
    expectedRole: 'admin',
  },
  moderator: {
    email: 'moderator@test.com',
    password: 'ModeratorPassword123!',
    expectedRole: 'moderator',
  },
  user: {
    email: 'user@test.com',
    password: 'UserPassword123!',
    expectedRole: 'user',
  },
  otherUser: {
    email: 'otheruser@test.com',
    password: 'OtherUserPassword123!',
    expectedRole: 'user',
  },
}

/**
 * Create test user if not exists
 */
function createTestUser(userType) {
  const user = TEST_USERS[userType]
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
    username: userType,
    firstName: 'Test',
    lastName: userType,
  })

  const res = http.post(`${API_BASE_URL}/api/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  // Return existing user or newly created
  if (res.status === 201 || res.status === 409) {
    return true
  }

  return false
}

/**
 * Login and get auth token
 */
function login(userType) {
  const user = TEST_USERS[userType]
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  })

  const res = http.post(`${API_BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 200) {
    try {
      const data = JSON.parse(res.body)
      return {
        token: data.token,
        userId: data.userId,
        role: data.role,
      }
    } catch (e) {
      return null
    }
  }

  return null
}

/**
 * Test Options
 */
export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    authorization_success_rate: ['rate>0.95'], // 95% of authorization checks should pass
    authorization_violations: ['count<10'], // Less than 10 violations
  },
}

/**
 * Setup - Create test users
 */
export function setup() {
  console.log('Creating test users...')

  Object.keys(TEST_USERS).forEach(userType => {
    createTestUser(userType)
  })

  return { startTime: Date.now() }
}

/**
 * Main test scenario
 */
export default function () {
  // Test 1: Unauthenticated Access Control
  group('Unauthenticated Access Control', () => {
    // Should deny access to protected endpoints
    const protectedEndpoints = [
      '/api/profile/me',
      '/api/forum/posts',
      '/api/video/session',
      '/api/bookings',
      '/api/interpreters',
    ]

    protectedEndpoints.forEach(endpoint => {
      const res = http.get(`${API_BASE_URL}${endpoint}`)

      const success = check(res, {
        [`${endpoint} denies unauthenticated access`]: r => r.status === 401,
      })

      authorizationSuccess.add(success)
      if (!success) authorizationViolations.add(1)
    })
  })

  sleep(1)

  // Test 2: Role-Based Access Control (RBAC)
  group('Role-Based Access Control', () => {
    const adminAuth = login('admin')
    const userAuth = login('user')

    if (!adminAuth || !userAuth) {
      console.error('Failed to login test users')
      return
    }

    // Admin-only endpoints
    const adminEndpoints = [
      { method: 'GET', path: '/api/admin/users' },
      { method: 'GET', path: '/api/admin/stats' },
      { method: 'DELETE', path: '/api/admin/user/123' },
      { method: 'POST', path: '/api/admin/roles' },
    ]

    adminEndpoints.forEach(endpoint => {
      // Admin should have access
      const adminRes = http.request(
        endpoint.method,
        `${API_BASE_URL}${endpoint.path}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${adminAuth.token}`,
          },
        },
      )

      const adminHasAccess = check(adminRes, {
        [`Admin can access ${endpoint.path}`]: r => r.status !== 403,
      })

      authorizationSuccess.add(adminHasAccess)

      // Regular user should NOT have access
      const userRes = http.request(
        endpoint.method,
        `${API_BASE_URL}${endpoint.path}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${userAuth.token}`,
          },
        },
      )

      const userDenied = check(userRes, {
        [`User denied access to ${endpoint.path}`]: r => r.status === 403,
      })

      authorizationSuccess.add(userDenied)
      if (!userDenied) {
        privilegeEscalationAttempts.add(1)
        authorizationViolations.add(1)
      }
    })
  })

  sleep(1)

  // Test 3: Resource Ownership Validation
  group('Resource Ownership Validation', () => {
    const userAuth = login('user')
    const otherUserAuth = login('otherUser')

    if (!userAuth || !otherUserAuth) {
      console.error('Failed to login test users')
      return
    }

    // Create a post as user
    const createPostPayload = JSON.stringify({
      title: 'Test Post for Authorization',
      content: 'This is a test post to verify resource ownership',
      category: 'test',
    })

    const createRes = http.post(`${API_BASE_URL}/api/forum/posts`, createPostPayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAuth.token}`,
      },
    })

    let postId = null
    if (createRes.status === 201) {
      try {
        postId = JSON.parse(createRes.body).postId
      } catch (e) {
        console.error('Failed to parse post creation response')
      }
    }

    if (postId) {
      // User should be able to update their own post
      const updatePayload = JSON.stringify({
        title: 'Updated Test Post',
        content: 'Updated content',
      })

      const userUpdateRes = http.put(
        `${API_BASE_URL}/api/forum/posts/${postId}`,
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userAuth.token}`,
          },
        },
      )

      const userCanUpdate = check(userUpdateRes, {
        'User can update own post': r => r.status === 200,
      })

      authorizationSuccess.add(userCanUpdate)

      // Other user should NOT be able to update the post
      const otherUserUpdateRes = http.put(
        `${API_BASE_URL}/api/forum/posts/${postId}`,
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${otherUserAuth.token}`,
          },
        },
      )

      const otherUserDenied = check(otherUserUpdateRes, {
        'Other user denied update to post': r => r.status === 403,
      })

      authorizationSuccess.add(otherUserDenied)
      if (!otherUserDenied) authorizationViolations.add(1)

      // User should be able to delete their own post
      const userDeleteRes = http.del(`${API_BASE_URL}/api/forum/posts/${postId}`, null, {
        headers: {
          Authorization: `Bearer ${userAuth.token}`,
        },
      })

      const userCanDelete = check(userDeleteRes, {
        'User can delete own post': r => r.status === 200 || r.status === 204,
      })

      authorizationSuccess.add(userCanDelete)
    }
  })

  sleep(1)

  // Test 4: Horizontal Privilege Escalation Prevention
  group('Horizontal Privilege Escalation', () => {
    const userAuth = login('user')
    const otherUserAuth = login('otherUser')

    if (!userAuth || !otherUserAuth) {
      console.error('Failed to login test users')
      return
    }

    // Try to access other user's profile
    const profileRes = http.get(`${API_BASE_URL}/api/profile/${otherUserAuth.userId}`, {
      headers: {
        Authorization: `Bearer ${userAuth.token}`,
      },
    })

    // Should be denied or return limited information
    const prevented = check(profileRes, {
      'Cannot access other user full profile': r =>
        r.status === 403 || (r.status === 200 && !r.body.includes('email')),
    })

    authorizationSuccess.add(prevented)
    if (!prevented) {
      privilegeEscalationAttempts.add(1)
      authorizationViolations.add(1)
    }

    // Try to modify other user's settings
    const settingsPayload = JSON.stringify({
      notifications: false,
      theme: 'dark',
    })

    const settingsRes = http.put(
      `${API_BASE_URL}/api/users/${otherUserAuth.userId}/settings`,
      settingsPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAuth.token}`,
        },
      },
    )

    const settingsDenied = check(settingsRes, {
      'Cannot modify other user settings': r => r.status === 403,
    })

    authorizationSuccess.add(settingsDenied)
    if (!settingsDenied) {
      privilegeEscalationAttempts.add(1)
      authorizationViolations.add(1)
    }
  })

  sleep(1)

  // Test 5: Vertical Privilege Escalation Prevention
  group('Vertical Privilege Escalation', () => {
    const userAuth = login('user')

    if (!userAuth) {
      console.error('Failed to login user')
      return
    }

    // Try to modify own role (should be prevented)
    const rolePayload = JSON.stringify({
      role: 'admin',
    })

    const roleRes = http.put(
      `${API_BASE_URL}/api/users/${userAuth.userId}/role`,
      rolePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAuth.token}`,
        },
      },
    )

    const roleDenied = check(roleRes, {
      'Cannot escalate own role to admin': r => r.status === 403,
    })

    authorizationSuccess.add(roleDenied)
    if (!roleDenied) {
      privilegeEscalationAttempts.add(1)
      authorizationViolations.add(1)
    }

    // Try to grant admin permissions
    const permissionPayload = JSON.stringify({
      permissions: ['delete_any_post', 'ban_users', 'view_admin_panel'],
    })

    const permissionRes = http.put(
      `${API_BASE_URL}/api/users/${userAuth.userId}/permissions`,
      permissionPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAuth.token}`,
        },
      },
    )

    const permissionDenied = check(permissionRes, {
      'Cannot grant admin permissions': r => r.status === 403,
    })

    authorizationSuccess.add(permissionDenied)
    if (!permissionDenied) {
      privilegeEscalationAttempts.add(1)
      authorizationViolations.add(1)
    }
  })

  sleep(1)

  // Test 6: Token Validation
  group('Token Validation', () => {
    // Invalid token format
    const invalidTokenRes = http.get(`${API_BASE_URL}/api/profile/me`, {
      headers: {
        Authorization: 'Bearer invalid.token.here',
      },
    })

    const invalidDenied = check(invalidTokenRes, {
      'Invalid token rejected': r => r.status === 401,
    })

    authorizationSuccess.add(invalidDenied)
    if (!invalidDenied) authorizationViolations.add(1)

    // Expired token (if you have a test expired token)
    const expiredTokenRes = http.get(`${API_BASE_URL}/api/profile/me`, {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE1MTYyMzkwMjJ9.invalid',
      },
    })

    const expiredDenied = check(expiredTokenRes, {
      'Expired token rejected': r => r.status === 401,
    })

    authorizationSuccess.add(expiredDenied)
    if (!expiredDenied) authorizationViolations.add(1)

    // Missing Authorization header
    const noTokenRes = http.get(`${API_BASE_URL}/api/profile/me`)

    const noTokenDenied = check(noTokenRes, {
      'Missing token rejected': r => r.status === 401,
    })

    authorizationSuccess.add(noTokenDenied)
    if (!noTokenDenied) authorizationViolations.add(1)
  })

  sleep(1)

  // Test 7: Session Management
  group('Session Management', () => {
    const userAuth = login('user')

    if (!userAuth) {
      console.error('Failed to login user')
      return
    }

    // Logout should invalidate token
    const logoutRes = http.post(`${API_BASE_URL}/api/auth/logout`, null, {
      headers: {
        Authorization: `Bearer ${userAuth.token}`,
      },
    })

    check(logoutRes, {
      'Logout successful': r => r.status === 200 || r.status === 204,
    })

    // Try to use token after logout
    const afterLogoutRes = http.get(`${API_BASE_URL}/api/profile/me`, {
      headers: {
        Authorization: `Bearer ${userAuth.token}`,
      },
    })

    const tokenInvalidated = check(afterLogoutRes, {
      'Token invalidated after logout': r => r.status === 401,
    })

    authorizationSuccess.add(tokenInvalidated)
    if (!tokenInvalidated) authorizationViolations.add(1)
  })

  sleep(2)
}

/**
 * Teardown
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`Authorization tests completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const violations = data.metrics.authorization_violations?.values.count || 0
  const successRate = data.metrics.authorization_success_rate?.values.rate || 0
  const escalationAttempts = data.metrics.privilege_escalation_attempts?.values.count || 0

  console.log('\n=== Authorization Security Test Summary ===')
  console.log(
    `Success Rate: ${(successRate * 100).toFixed(2)}% (Target: >95%) - ${successRate > 0.95 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Authorization Violations: ${violations} (Target: <10) - ${violations < 10 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(`Privilege Escalation Attempts Detected: ${escalationAttempts}`)

  if (violations > 0) {
    console.log('\n⚠️  Authorization vulnerabilities detected!')
    console.log('Review logs for details on failed authorization checks.')
  }

  return {
    'security-reports/authorization-test.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
