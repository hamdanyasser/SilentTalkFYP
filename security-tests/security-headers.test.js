/**
 * Security Headers Validation Tests
 * Tests security headers configuration (NFR-004)
 *
 * Test Coverage:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

import http from 'k6/http'
import { check, group } from 'k6'
import { Counter, Rate } from 'k6/metrics'

const securityHeadersPresent = new Rate('security_headers_present_rate')
const missingHeaders = new Counter('missing_security_headers')
const weakHeaders = new Counter('weak_security_headers')

const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000'
const WEB_BASE_URL = __ENV.WEB_BASE_URL || 'http://localhost:3000'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    security_headers_present_rate: ['rate>0.95'], // 95% of required headers should be present
    missing_security_headers: ['count<2'], // Less than 2 missing headers
  },
}

/**
 * Check CSP header
 */
function checkCSP(headers) {
  const csp = headers['Content-Security-Policy'] || headers['content-security-policy']

  if (!csp) {
    console.error('❌ Content-Security-Policy header missing')
    missingHeaders.add(1)
    return false
  }

  const checks = {
    'CSP has default-src': csp.includes('default-src'),
    'CSP has script-src': csp.includes('script-src'),
    'CSP has style-src': csp.includes('style-src'),
    'CSP has img-src': csp.includes('img-src'),
    'CSP has object-src': csp.includes('object-src'),
    'CSP has frame-ancestors': csp.includes('frame-ancestors'),
    "CSP prevents unsafe-inline in script-src": !csp.match(/script-src[^;]*'unsafe-inline'/),
    "CSP prevents unsafe-eval in script-src": !csp.match(/script-src[^;]*'unsafe-eval'/),
  }

  let allPass = true
  Object.entries(checks).forEach(([name, passed]) => {
    if (!passed) {
      console.warn(`⚠️  ${name}: FAIL`)
      weakHeaders.add(1)
      allPass = false
    }
  })

  return allPass
}

/**
 * Check HSTS header
 */
function checkHSTS(headers) {
  const hsts = headers['Strict-Transport-Security'] || headers['strict-transport-security']

  if (!hsts) {
    console.error('❌ Strict-Transport-Security header missing')
    missingHeaders.add(1)
    return false
  }

  const checks = {
    'HSTS has max-age': hsts.includes('max-age='),
    'HSTS max-age >= 1 year': /max-age=(\d+)/.test(hsts) && parseInt(hsts.match(/max-age=(\d+)/)[1]) >= 31536000,
    'HSTS includes includeSubDomains': hsts.includes('includeSubDomains'),
    'HSTS includes preload': hsts.includes('preload'),
  }

  let allPass = true
  Object.entries(checks).forEach(([name, passed]) => {
    if (!passed) {
      console.warn(`⚠️  ${name}: FAIL`)
      weakHeaders.add(1)
      allPass = false
    }
  })

  return allPass
}

/**
 * Main test
 */
export default function () {
  let headersPassed = 0
  let headersTotal = 0

  // Test API endpoints
  group('API Security Headers', () => {
    const res = http.get(`${API_BASE_URL}/health`)

    headersTotal += 10 // Total number of header checks

    // Content-Security-Policy
    if (checkCSP(res.headers)) {
      console.log('✓ Content-Security-Policy configured correctly')
      headersPassed++
    }
    securityHeadersPresent.add(res.headers['Content-Security-Policy'] ? 1 : 0)

    // Strict-Transport-Security
    if (checkHSTS(res.headers)) {
      console.log('✓ Strict-Transport-Security configured correctly')
      headersPassed++
    }
    securityHeadersPresent.add(res.headers['Strict-Transport-Security'] ? 1 : 0)

    // X-Content-Type-Options
    const xContentType = check(res, {
      'X-Content-Type-Options present': r =>
        r.headers['X-Content-Type-Options'] === 'nosniff' ||
        r.headers['x-content-type-options'] === 'nosniff',
    })
    if (xContentType) {
      console.log('✓ X-Content-Type-Options: nosniff')
      headersPassed++
    } else {
      console.error('❌ X-Content-Type-Options missing or incorrect')
      missingHeaders.add(1)
    }
    securityHeadersPresent.add(xContentType)

    // X-Frame-Options
    const xFrame = check(res, {
      'X-Frame-Options present': r => {
        const value = r.headers['X-Frame-Options'] || r.headers['x-frame-options']
        return value === 'DENY' || value === 'SAMEORIGIN'
      },
    })
    if (xFrame) {
      console.log('✓ X-Frame-Options: DENY or SAMEORIGIN')
      headersPassed++
    } else {
      console.error('❌ X-Frame-Options missing or incorrect')
      missingHeaders.add(1)
    }
    securityHeadersPresent.add(xFrame)

    // X-XSS-Protection
    const xXSS = check(res, {
      'X-XSS-Protection present': r => {
        const value = r.headers['X-XSS-Protection'] || r.headers['x-xss-protection']
        return value === '1; mode=block' || value === '1'
      },
    })
    if (xXSS) {
      console.log('✓ X-XSS-Protection enabled')
      headersPassed++
    } else {
      console.warn('⚠️  X-XSS-Protection missing (legacy but recommended)')
      weakHeaders.add(1)
    }
    securityHeadersPresent.add(xXSS)

    // Referrer-Policy
    const referrer = check(res, {
      'Referrer-Policy present': r => {
        const value = r.headers['Referrer-Policy'] || r.headers['referrer-policy']
        return (
          value === 'no-referrer' ||
          value === 'strict-origin-when-cross-origin' ||
          value === 'strict-origin'
        )
      },
    })
    if (referrer) {
      console.log('✓ Referrer-Policy configured')
      headersPassed++
    } else {
      console.error('❌ Referrer-Policy missing')
      missingHeaders.add(1)
    }
    securityHeadersPresent.add(referrer)

    // Permissions-Policy
    const permissions = check(res, {
      'Permissions-Policy present': r =>
        r.headers['Permissions-Policy'] || r.headers['permissions-policy'],
    })
    if (permissions) {
      console.log('✓ Permissions-Policy configured')
      headersPassed++
    } else {
      console.warn('⚠️  Permissions-Policy missing (recommended)')
      weakHeaders.add(1)
    }
    securityHeadersPresent.add(permissions)

    // X-Powered-By should NOT be present
    const noPoweredBy = check(res, {
      'X-Powered-By removed': r => !r.headers['X-Powered-By'] && !r.headers['x-powered-by'],
    })
    if (noPoweredBy) {
      console.log('✓ X-Powered-By header removed')
      headersPassed++
    } else {
      console.warn('⚠️  X-Powered-By header exposes technology stack')
      weakHeaders.add(1)
    }

    // Server header should not expose version
    const server = res.headers['Server'] || res.headers['server']
    if (server && (server.includes('/') || server.includes('.'))) {
      console.warn(`⚠️  Server header exposes version: ${server}`)
      weakHeaders.add(1)
    } else {
      console.log('✓ Server header does not expose version')
      headersPassed++
    }

    // Cache-Control for sensitive endpoints
    const cacheControl = check(res, {
      'Cache-Control present': r => r.headers['Cache-Control'] || r.headers['cache-control'],
    })
    if (cacheControl) {
      console.log('✓ Cache-Control header present')
      headersPassed++
    }
  })

  // Test CORS headers
  group('CORS Security', () => {
    const res = http.get(`${API_BASE_URL}/api/health`, {
      headers: {
        Origin: 'https://evil.com',
      },
    })

    const corsBlocked = check(res, {
      'CORS blocks unauthorized origins': r => {
        const allowOrigin = r.headers['Access-Control-Allow-Origin']
        return !allowOrigin || allowOrigin !== 'https://evil.com'
      },
    })

    if (corsBlocked) {
      console.log('✓ CORS blocks unauthorized origins')
    } else {
      console.error('❌ CORS allows unauthorized origin')
      missingHeaders.add(1)
    }

    securityHeadersPresent.add(corsBlocked)
  })

  // Test for security misconfigurations
  group('Security Misconfigurations', () => {
    const res = http.get(`${API_BASE_URL}/api/health`)

    // Check for sensitive information in headers
    const sensitiveHeaderPatterns = [
      { name: 'X-AspNet-Version', message: 'ASP.NET version exposed' },
      { name: 'X-AspNetMvc-Version', message: 'ASP.NET MVC version exposed' },
      { name: 'X-Powered-By', message: 'Technology stack exposed' },
    ]

    sensitiveHeaderPatterns.forEach(pattern => {
      if (res.headers[pattern.name]) {
        console.warn(`⚠️  ${pattern.message}: ${res.headers[pattern.name]}`)
        weakHeaders.add(1)
      }
    })

    // Check for insecure cookies (if set-cookie header exists)
    const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie']
    if (setCookie) {
      const secureCookie = setCookie.toLowerCase().includes('secure')
      const httpOnlyCookie = setCookie.toLowerCase().includes('httponly')
      const sameSiteCookie = setCookie.toLowerCase().includes('samesite')

      if (!secureCookie) {
        console.warn('⚠️  Cookie missing Secure flag')
        weakHeaders.add(1)
      }

      if (!httpOnlyCookie) {
        console.warn('⚠️  Cookie missing HttpOnly flag')
        weakHeaders.add(1)
      }

      if (!sameSiteCookie) {
        console.warn('⚠️  Cookie missing SameSite attribute')
        weakHeaders.add(1)
      }

      if (secureCookie && httpOnlyCookie && sameSiteCookie) {
        console.log('✓ Cookies properly secured')
      }
    }
  })

  console.log(`\n=== Security Headers Score: ${headersPassed}/${headersTotal} ===\n`)
}

/**
 * Handle summary
 */
export function handleSummary(data) {
  const presenceRate = data.metrics.security_headers_present_rate?.values.rate || 0
  const missing = data.metrics.missing_security_headers?.values.count || 0
  const weak = data.metrics.weak_security_headers?.values.count || 0

  console.log('\n=== Security Headers Test Summary ===')
  console.log(
    `Headers Presence Rate: ${(presenceRate * 100).toFixed(2)}% (Target: >95%) - ${presenceRate > 0.95 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(
    `Missing Headers: ${missing} (Target: <2) - ${missing < 2 ? '✓ PASS' : '✗ FAIL'}`,
  )
  console.log(`Weak Headers: ${weak}`)

  if (missing > 0 || weak > 0) {
    console.log('\n⚠️  Security header issues detected!')
    console.log('Review the logs above for specific recommendations.')
  }

  return {
    'security-reports/security-headers-test.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(data, null, 2),
  }
}
