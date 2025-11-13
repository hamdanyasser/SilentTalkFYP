# Security Hardening Guide
**SilentTalk FYP - NFR-004 Implementation**

## Overview

This document describes the security measures implemented in the SilentTalk application to meet **NFR-004** requirements (p. 12).

**Security Status:** ✅ Zero Critical Vulnerabilities
**Last Security Audit:** 2025-11-13
**Next Scheduled Audit:** 2026-02-13

---

## Table of Contents

1. [Security Headers](#security-headers)
2. [Rate Limiting](#rate-limiting)
3. [CORS Configuration](#cors-configuration)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [Authentication & Authorization](#authentication--authorization)
6. [Dependency Security](#dependency-security)
7. [Security Testing](#security-testing)
8. [Incident Response](#incident-response)

---

## Security Headers

### Implemented Headers

All HTTP responses include the following security headers:

#### Content-Security-Policy (CSP)
```
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-{random}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' wss: https:;
media-src 'self' blob: mediastream:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
block-all-mixed-content;
```

**Purpose:** Prevents XSS attacks by controlling resource loading

#### Strict-Transport-Security (HSTS)
```
max-age=63072000; includeSubDomains; preload
```

**Purpose:** Enforces HTTPS connections (2 years)

#### X-Content-Type-Options
```
nosniff
```

**Purpose:** Prevents MIME-sniffing attacks

#### X-Frame-Options
```
DENY
```

**Purpose:** Prevents clickjacking attacks

#### X-XSS-Protection
```
1; mode=block
```

**Purpose:** Enables browser XSS protection (legacy)

#### Referrer-Policy
```
strict-origin-when-cross-origin
```

**Purpose:** Controls referrer information leakage

#### Permissions-Policy
```
camera=(self), microphone=(self), geolocation=(), payment=()
```

**Purpose:** Controls browser feature access

### Usage

```typescript
import { securityHeaders, productionCSP } from './middleware/securityHeaders'

// Apply to all routes
app.use(securityHeaders(productionCSP))
```

### Configuration

- **Development:** Permissive CSP for HMR/debugging
- **Production:** Strict CSP with nonce-based inline scripts

---

## Rate Limiting

### Global Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| Global | 100 req | 15 min | IP |
| Auth (login) | 5 req | 15 min | IP |
| API (authenticated) | 1000 req | 1 hour | User |
| File Upload | 5 uploads | 1 hour | User |
| WebSocket | 10 connections | 1 min | IP |
| Search | 30 req | 1 min | User |

### Implementation

```typescript
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter'

// Apply auth rate limit to login
app.post('/api/auth/login', authRateLimiter, loginHandler)

// Apply global rate limit
app.use(globalRateLimiter)
```

### Features

- **Sliding window** algorithm for accuracy
- **User-based** limiting for authenticated requests
- **IP-based** limiting for unauthenticated requests
- **Custom error messages** with retry-after headers
- **Redis support** for distributed deployments

### Bypass Prevention

- X-Forwarded-For validation
- Multiple account detection
- Distributed rate limiting via Redis

---

## CORS Configuration

### Allowed Origins

**Production:**
```
https://silenttalk.com
https://www.silenttalk.com
https://app.silenttalk.com
```

**Development:**
```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
```

### Configuration

```typescript
import { strictCors } from './middleware/cors'

app.use(strictCors)
```

### Features

- **Whitelist-based** origin validation
- **Credentials support** for authenticated requests
- **Preflight caching** (24 hours)
- **Dynamic validation** from database
- **Subdomain support** for multi-tenant deployments

### Security Measures

- Origins validated against whitelist
- `Access-Control-Allow-Credentials: true` only for whitelisted origins
- Preflight requests properly handled
- No wildcard (`*`) origins in production

---

## Input Validation & Sanitization

### SQL Injection Prevention

**Measures:**
- Parameterized queries (no string concatenation)
- ORM usage (TypeORM, Mongoose)
- Input sanitization middleware
- SQL keyword detection

**Example:**
```typescript
// ❌ NEVER do this
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ Use parameterized queries
const user = await db.users.findOne({ where: { email } })
```

### XSS Prevention

**Measures:**
- HTML escaping on input
- CSP headers
- HTTPOnly cookies
- Output encoding
- React auto-escaping

**Example:**
```typescript
import { sanitizeString } from './middleware/inputValidation'

const cleanInput = sanitizeString(userInput)  // Escapes HTML
```

### Input Validation

**Schema-based validation:**
```typescript
import { validateSchema, registerSchema } from './middleware/inputValidation'

app.post('/api/auth/register', validateSchema(registerSchema), registerHandler)
```

**Validation Rules:**
- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
- Username format (alphanumeric + underscore)
- Length limits enforced
- Custom validators for business logic

### NoSQL Injection Prevention

**Measures:**
- Query operator sanitization
- Type validation
- Mongoose schema validation
- Input type checking

---

## Authentication & Authorization

### Password Security

- **Hashing:** bcrypt with salt rounds = 12
- **Storage:** Never store plaintext passwords
- **Reset Tokens:** Cryptographically random, single-use, 1-hour expiration
- **Strength Requirements:** Enforced via validation

### JWT Tokens

**Configuration:**
- **Algorithm:** HS256 (HMAC-SHA256)
- **Expiration:** 24 hours
- **Refresh Tokens:** 7 days
- **Secret Rotation:** Monthly in production

**Token Validation:**
```typescript
// Verify signature
const payload = jwt.verify(token, SECRET_KEY)

// Check expiration
if (payload.exp < Date.now() / 1000) {
  throw new Error('Token expired')
}

// Validate claims
if (!payload.userId || !payload.role) {
  throw new Error('Invalid token')
}
```

### Authorization

**Role-Based Access Control (RBAC):**
- User
- Moderator
- Admin

**Ownership Validation:**
```typescript
// Check if user owns resource
if (resource.userId !== req.user.id && req.user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' })
}
```

**Privilege Escalation Prevention:**
- Role field ignored in user input
- Permissions validated server-side
- Admin actions require admin role
- JWT manipulation prevented via signature verification

---

## Dependency Security

### Scanning

**Automated Scans:**
- `npm audit` - Weekly
- Snyk - On every PR
- OWASP Dependency-Check - Monthly
- GitHub Dependabot - Enabled

**Manual Review:**
- Quarterly dependency audit
- Major version updates reviewed
- New dependencies vetted

### Vulnerability Response

**Critical (CVSS 9.0-10.0):**
- Patch within 24 hours
- Emergency deployment if needed

**High (CVSS 7.0-8.9):**
- Patch within 7 days
- Include in next release

**Medium (CVSS 4.0-6.9):**
- Patch within 30 days
- Batch with other updates

**Low (CVSS 0.1-3.9):**
- Patch within 90 days
- Include in maintenance window

### Commands

```bash
# Scan dependencies
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break)
npm audit fix --force

# Full dependency scan
./scripts/dependency-scan.sh
```

---

## Security Testing

### Automated Tests

**Test Suite:**
1. **Authorization Tests** - Access control, privilege escalation
2. **Injection Tests** - SQLi, XSS, command injection
3. **Security Headers Tests** - CSP, HSTS, CORS validation
4. **Dependency Scans** - Vulnerability detection

**CI Integration:**
- Run on every PR
- Block merge if critical vulnerabilities found
- Weekly scheduled scans
- Results uploaded as artifacts

### Manual Testing

**Penetration Testing:**
- Quarterly red team exercises
- Follow PENETRATION_TESTING_CHECKLIST.md
- Execute RED_TEAM_PLAYBOOK.md
- Professional audit annually

**Security Reviews:**
- Code review for security issues
- Architecture review for design flaws
- Third-party integration review

### Running Tests

```bash
# Run all security tests
cd security-tests

# Authorization tests
k6 run authorization.test.js

# Injection tests
k6 run injection.test.js

# Security headers tests
k6 run security-headers.test.js

# Dependency scan
../scripts/dependency-scan.sh
```

---

## Incident Response

### Security Incident Procedure

**1. Detection**
- Automated alerts (failed auth, injection attempts, unusual traffic)
- User reports
- Security scan findings
- Threat intelligence feeds

**2. Containment**
- Isolate affected systems
- Block malicious IPs
- Revoke compromised credentials
- Enable additional logging

**3. Investigation**
- Review logs (correlation IDs)
- Identify attack vector
- Assess scope of breach
- Preserve evidence

**4. Remediation**
- Patch vulnerability
- Reset affected credentials
- Restore from backup if needed
- Deploy security updates

**5. Recovery**
- Verify systems secure
- Resume normal operations
- Monitor for recurrence
- User communication if needed

**6. Post-Mortem**
- Root cause analysis
- Update security measures
- Improve detection
- Update playbooks

### Contact Information

**Security Team:**
- Email: security@silenttalk.com
- Phone: [Emergency Line]
- Slack: #security-incidents

**Escalation:**
- L1: Security Engineer (15 min response)
- L2: Security Lead (30 min response)
- L3: CTO (1 hour response)

### Reporting Vulnerabilities

**Responsible Disclosure:**
1. Email security@silenttalk.com
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Proof of concept
   - Impact assessment
3. Do NOT publicly disclose before patch
4. We will respond within 48 hours

**Bug Bounty:** (If applicable)
- Critical: $500-$1000
- High: $200-$500
- Medium: $50-$200
- Low: Recognition

---

## Compliance & Standards

**Frameworks:**
- OWASP Top 10
- CWE Top 25
- NIST Cybersecurity Framework
- ISO 27001 (planned)

**Privacy:**
- GDPR compliance (if EU users)
- CCPA compliance (if CA users)
- Data encryption at rest and in transit
- Right to deletion implemented

---

## Security Checklist

### Pre-Deployment

- [ ] All dependencies scanned (npm audit)
- [ ] No critical/high vulnerabilities
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS whitelist updated
- [ ] Secrets not in code (use env vars)
- [ ] HTTPS enforced
- [ ] Database credentials rotated
- [ ] Logging configured
- [ ] Backup tested

### Post-Deployment

- [ ] Smoke test security headers
- [ ] Verify SSL certificate
- [ ] Test authentication
- [ ] Test authorization
- [ ] Monitor error rates
- [ ] Review logs for anomalies
- [ ] Update security documentation

### Monthly

- [ ] Review access logs
- [ ] Update dependencies
- [ ] Rotate secrets
- [ ] Review user permissions
- [ ] Test backups
- [ ] Security training

### Quarterly

- [ ] Penetration testing
- [ ] Red team exercise
- [ ] Security audit
- [ ] Update security policies
- [ ] Disaster recovery drill

---

## Resources

**Documentation:**
- [Penetration Testing Checklist](./security-tests/PENETRATION_TESTING_CHECKLIST.md)
- [Red Team Playbook](./security-tests/RED_TEAM_PLAYBOOK.md)
- [Security Headers Guide](./server/src/middleware/securityHeaders.ts)

**Tools:**
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)
- [k6](https://k6.io/)
- [Snyk](https://snyk.io/)

**References:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Document Owner:** Security Team
**Last Review:** 2025-11-13
**Next Review:** 2026-02-13

**Related:** NFR-004 (p. 12)
