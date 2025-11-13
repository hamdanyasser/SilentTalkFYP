# GDPR Compliance Documentation

**SilentTalk FYP - General Data Protection Regulation Compliance**

This document outlines our compliance with the General Data Protection Regulation (GDPR) - EU 2016/679.

---

## Table of Contents

1. [Overview](#overview)
2. [Legal Basis for Processing](#legal-basis-for-processing)
3. [Data Subject Rights](#data-subject-rights)
4. [Data Protection Principles](#data-protection-principles)
5. [Technical and Organizational Measures](#technical-and-organizational-measures)
6. [Data Processing Activities](#data-processing-activities)
7. [Data Retention](#data-retention)
8. [Data Breach Response](#data-breach-response)
9. [Third-Party Processors](#third-party-processors)
10. [International Data Transfers](#international-data-transfers)
11. [Compliance Monitoring](#compliance-monitoring)

---

## Overview

### Data Controller

**Organization**: Silent Talk FYP
**Address**: [Your Address]
**Email**: privacy@silenttalk.com
**DPO Contact**: dpo@silenttalk.com

### Scope

This compliance framework applies to all processing of personal data of:
- Users located in the European Economic Area (EEA)
- Users located in the United Kingdom
- Any data subject exercising their rights under GDPR

---

## Legal Basis for Processing

We process personal data under the following legal bases:

### 1. Consent (Article 6(1)(a))

**Processing Activities:**
- Marketing communications
- Optional analytics tracking
- Cookie placement (non-essential)
- Data sharing with third parties

**How We Obtain Consent:**
- Explicit opt-in checkboxes (not pre-checked)
- Clear and plain language
- Separate consent for each purpose
- Easy withdrawal mechanism

**Consent Records:**
- User ID and consent ID
- Timestamp of consent
- Consent type and purpose
- IP address and user agent (for proof)
- Withdrawal timestamp (if applicable)

**Location in Code:**
- `server/src/controllers/privacy.controller.ts` - `updateConsent()`
- `client/src/components/Privacy/CookieConsent.tsx`
- Database table: `consents`

### 2. Contract (Article 6(1)(b))

**Processing Activities:**
- User account creation and management
- Service delivery (sign language practice, messaging)
- Live interpretation booking and fulfillment
- Payment processing

**Justification:**
Processing is necessary to perform the contract with the user or to take steps at the user's request before entering into a contract.

### 3. Legal Obligation (Article 6(1)(c))

**Processing Activities:**
- Tax record keeping
- Law enforcement requests (where legally required)
- Financial transaction records

**Justification:**
Processing is necessary to comply with legal obligations under applicable laws.

### 4. Legitimate Interests (Article 6(1)(f))

**Processing Activities:**
- Fraud prevention and detection
- Network and information security
- Internal analytics (anonymized)
- Service improvement and optimization

**Balancing Test:**
- Our legitimate interest: Protecting users and improving service
- User's interests and rights: Privacy and data protection
- Mitigation: Anonymization, pseudonymization, minimal data collection

**Documentation:**
- Legitimate Interest Assessment (LIA) conducted and documented
- Location: `docs/LIA_REPORT.md`

---

## Data Subject Rights

We provide mechanisms for data subjects to exercise all GDPR rights:

### Article 15 - Right of Access

**Implementation:**
- User dashboard showing all personal data
- API endpoint: `GET /api/privacy/settings`
- Response time: Immediate (real-time access)

**Process:**
1. User logs in and navigates to Privacy Settings
2. System displays all stored personal data
3. User can view data in structured format

### Article 16 - Right to Rectification

**Implementation:**
- Profile editing functionality
- API endpoints for updating user information
- Response time: Immediate

**Process:**
1. User navigates to profile settings
2. Updates incorrect information
3. System validates and saves changes

### Article 17 - Right to Erasure (Right to be Forgotten)

**Implementation:**
- Account deletion functionality
- API endpoint: `POST /api/privacy/delete-account`
- Grace period: 30 days
- Response time: 30 days maximum

**Process:**
1. User requests account deletion
2. System schedules deletion for 30 days later
3. User receives confirmation email
4. User can cancel within 30 days
5. After 30 days, account is permanently deleted

**Code Location:**
- `server/src/services/privacy.service.ts` - `createDeletionRequest()`
- `server/src/jobs/data-retention.job.ts` - `processScheduledDeletions()`

**Exceptions:**
- Data retained for legal compliance (e.g., tax records)
- Data retention for legal claims (up to statute of limitations)
- Anonymized aggregated data (no longer personal data)

### Article 18 - Right to Restriction of Processing

**Implementation:**
- Temporarily suspend account feature
- Mark records for restricted processing
- Response time: 72 hours

**Process:**
1. User requests processing restriction
2. Manual review by DPO
3. Account marked as restricted
4. Limited processing applied

### Article 20 - Right to Data Portability

**Implementation:**
- Data export functionality
- API endpoint: `POST /api/privacy/export`
- Formats: JSON, CSV (in ZIP)
- Response time: 15 minutes (asynchronous processing)

**Process:**
1. User requests data export
2. System gathers all personal data
3. Export file generated in chosen format
4. Download link sent via email
5. File available for 7 days

**Code Location:**
- `server/src/services/privacy.service.ts` - `createExportRequest()`
- Database table: `export_requests`

**Data Included:**
- Account information (email, username, created date)
- Profile data
- Practice sessions history
- Messages (sent and received)
- Live interpretation bookings
- Friends/connections
- Privacy settings
- Consent records
- Activity logs (last 90 days)

### Article 21 - Right to Object

**Implementation:**
- Privacy settings toggles
- Marketing opt-out
- Analytics opt-out
- Response time: Immediate

**Process:**
1. User navigates to Privacy Settings
2. Disables specific processing activities
3. System immediately applies preferences

### Article 22 - Right Not to be Subject to Automated Decision-Making

**Implementation:**
- No fully automated decisions with legal effects
- All significant decisions involve human review
- Users can request human review of any automated decision

**Current Automated Processing:**
- Content moderation (with human appeal process)
- Friend suggestions (no legal effect)
- None of these have legal or similarly significant effects

---

## Data Protection Principles

### Article 5 - Principles Relating to Processing of Personal Data

#### (a) Lawfulness, Fairness, and Transparency

**Implementation:**
- Clear privacy policy in plain language
- Transparent data processing notices
- Lawful bases documented for each processing activity

**Verification:**
- Privacy policy reviewed annually
- Legal basis recorded in processing register
- User-facing notices tested for clarity

#### (b) Purpose Limitation

**Implementation:**
- Specific purposes defined for each data category
- No secondary use without additional legal basis
- Purpose documented in data processing register

**Example Purposes:**
- Email: Account verification, communication, password reset
- Usage data: Service improvement, security monitoring
- Messages: Service delivery, message history

#### (c) Data Minimization

**Implementation:**
- Only collect data necessary for specified purpose
- Optional fields clearly marked
- Progressive disclosure (only ask when needed)

**Examples:**
- Profile photo: Optional
- Bio: Optional
- Email: Required (for account verification)
- Location: Not collected

#### (d) Accuracy

**Implementation:**
- User can update information at any time
- Email verification required
- Regular prompts to review profile information

**Process:**
- Annual email asking users to review and update profile
- Inactive accounts flagged for review
- Disputed data investigated and corrected

#### (e) Storage Limitation

**Implementation:**
- Data retention policies defined and enforced
- Automated cleanup jobs
- Regular reviews of stored data

**Retention Periods:**
- Active account data: Retained while account is active
- Messages: 2 years after send date
- Practice sessions: 1 year after session date
- Activity logs: 90 days
- Backups: 30 days
- Deleted account data: 30 days grace period, then permanent deletion

**Code Location:**
- `server/src/jobs/data-retention.job.ts`
- Scheduled daily at 2:00 AM

#### (f) Integrity and Confidentiality

**Implementation:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Access controls and authentication
- Security monitoring and logging

**Technical Measures:**
- Database encryption
- HTTPS only
- JWT token authentication
- Role-based access control (RBAC)
- Security headers (HSTS, CSP, etc.)

**Organizational Measures:**
- Staff training on data protection
- Access granted on need-to-know basis
- Regular security audits
- Incident response plan

---

## Technical and Organizational Measures

### Article 32 - Security of Processing

#### Encryption

**At Rest:**
- Database: AES-256 encryption
- File storage: Server-side encryption (S3/Azure Blob)
- Backups: Encrypted with separate keys

**In Transit:**
- TLS 1.3 minimum for all connections
- HTTPS enforced (HSTS headers)
- Secure WebSocket (WSS) for real-time communication

**Code Location:**
- `infrastructure/aws/terraform/main.tf` - RDS encryption
- `server/src/config/database.ts` - SSL mode required
- `.github/workflows/ci.yml` - Security scanning

#### Pseudonymization

**Implementation:**
- Internal user IDs (UUIDs) instead of personal identifiers
- Hashed email addresses in logs
- Anonymized analytics data

**Example:**
```typescript
// Instead of logging email
logger.info(`User ${user.email} logged in`);

// Log anonymized ID
logger.info(`User ${user.id} logged in`);
```

#### Access Controls

**Authentication:**
- Strong password requirements (min 8 chars, mixed case, numbers, symbols)
- Multi-factor authentication (MFA) available
- Account lockout after failed attempts
- Session timeout after inactivity

**Authorization:**
- Role-based access control (RBAC)
- Principle of least privilege
- Administrative actions logged and audited

**Staff Access:**
- Production database access restricted to DBA
- PII access requires business justification
- All access logged and monitored

#### Logging and Monitoring

**Security Logs:**
- Authentication attempts
- Authorization failures
- Data access (who accessed what, when)
- Administrative actions
- API requests (with IP, user agent)

**Retention:**
- Security logs: 1 year
- Activity logs: 90 days
- Audit logs: 5 years (for compliance)

**Monitoring:**
- Real-time alerts for suspicious activity
- Daily log review
- Quarterly security audits

#### Regular Testing

**Security Testing:**
- Automated vulnerability scanning (weekly)
- Penetration testing (annually)
- Dependency updates (weekly)
- Security patch deployment (within 48 hours)

**Code Location:**
- `.github/workflows/ci.yml` - Security scanning
- `.github/workflows/smoke-tests.yml` - Automated testing

---

## Data Processing Activities

### Record of Processing Activities (Article 30)

#### Processing Activity: User Account Management

**Controller**: SilentTalk FYP
**Purpose**: Provide user accounts for service access
**Legal Basis**: Contract (Article 6(1)(b))
**Categories of Data**: Email, username, password (hashed), created date
**Categories of Recipients**: None (internal only)
**Retention Period**: Active account: indefinite; Deleted account: 30 days
**Technical Measures**: Encryption, access controls, MFA

#### Processing Activity: Sign Language Practice

**Controller**: SilentTalk FYP
**Purpose**: Provide sign language learning service
**Legal Basis**: Contract (Article 6(1)(b))
**Categories of Data**: Practice session data, progress tracking, video recordings (temporary)
**Categories of Recipients**: None
**Retention Period**: 1 year after session
**Technical Measures**: Encryption, temporary storage only

#### Processing Activity: Direct Messaging

**Controller**: SilentTalk FYP
**Purpose**: Enable user communication
**Legal Basis**: Contract (Article 6(1)(b))
**Categories of Data**: Message content, timestamps, sender/recipient
**Categories of Recipients**: Message recipients only
**Retention Period**: 2 years after send date
**Technical Measures**: End-to-end encryption option, access controls

#### Processing Activity: Live Interpretation Booking

**Controller**: SilentTalk FYP
**Purpose**: Facilitate sign language interpretation services
**Legal Basis**: Contract (Article 6(1)(b))
**Categories of Data**: Booking details, interpreter info, session notes
**Categories of Recipients**: Assigned interpreter
**Retention Period**: 3 years (for legal compliance)
**Technical Measures**: Encryption, interpreter confidentiality agreements

#### Processing Activity: Analytics

**Controller**: SilentTalk FYP
**Purpose**: Service improvement, performance monitoring
**Legal Basis**: Consent (Article 6(1)(a)) or Legitimate Interest (Article 6(1)(f))
**Categories of Data**: Usage statistics, feature adoption, performance metrics
**Categories of Recipients**: Internal analytics team only
**Retention Period**: 90 days (anonymized after that)
**Technical Measures**: Anonymization, aggregation, access controls

#### Processing Activity: Marketing Communications

**Controller**: SilentTalk FYP
**Purpose**: Send promotional emails about features and updates
**Legal Basis**: Consent (Article 6(1)(a))
**Categories of Data**: Email, name, communication preferences
**Categories of Recipients**: Email service provider (AWS SES / SendGrid)
**Retention Period**: Until consent withdrawn
**Technical Measures**: Easy unsubscribe, consent tracking

---

## Data Retention

### Retention Schedule

| Data Category | Retention Period | Deletion Method | Legal Basis |
|--------------|------------------|-----------------|-------------|
| Active user accounts | Indefinite | Manual deletion by user | Contract |
| Deleted user accounts (grace period) | 30 days | Automated deletion job | Right to erasure |
| Messages | 2 years | Automated deletion job | Business necessity |
| Practice sessions | 1 year | Automated deletion job | Business necessity |
| Activity logs | 90 days | Automated deletion job | Security |
| Audit logs | 5 years | Automated deletion job | Legal obligation |
| Backups | 30 days | Automated rotation | Business continuity |
| Tax records | 7 years | Manual deletion | Legal obligation |
| Unverified accounts | 30 days | Automated deletion job | Data minimization |
| Anonymized accounts | 1 year | Automated deletion job | Legal compliance |
| Data export files | 7 days | Automated deletion job | Data portability |

### Automated Retention Jobs

**Implementation:**
- Daily cron job at 2:00 AM
- Code: `server/src/jobs/data-retention.job.ts`
- Logging: All deletions logged with count and timestamp
- Monitoring: Alerts if job fails

**Testing:**
- Monthly dry-run to verify deletion logic
- Quarterly review of retention policies
- Annual audit of deleted vs. retained data

---

## Data Breach Response

### Article 33 - Notification to Supervisory Authority

**Timeline**: Within 72 hours of becoming aware of a breach

**Process**:
1. **Detection** (0-4 hours)
   - Automated monitoring alerts
   - Manual discovery reported to DPO
   - Incident logged in breach register

2. **Assessment** (4-24 hours)
   - Determine scope and severity
   - Identify affected data subjects
   - Assess risk to rights and freedoms
   - Determine if notification required

3. **Containment** (0-48 hours)
   - Stop the breach
   - Secure affected systems
   - Preserve evidence
   - Document remediation steps

4. **Notification** (24-72 hours)
   - Notify supervisory authority if required
   - Prepare notification to data subjects if required
   - Document decision if not notifying

**Notification Content**:
- Nature of the breach
- Categories and approximate number of affected data subjects
- Categories and approximate number of affected records
- Name and contact details of DPO
- Likely consequences of the breach
- Measures taken or proposed to address the breach

**Contact**: Irish Data Protection Commission (Lead Supervisory Authority)
- Email: info@dataprotection.ie
- Phone: +353 (0)761 104 800

### Article 34 - Communication to Data Subject

**Timeline**: Without undue delay

**Threshold**: High risk to rights and freedoms of data subjects

**Notification Content**:
- Nature of the breach in clear and plain language
- Name and contact details of DPO
- Likely consequences of the breach
- Measures taken or proposed to mitigate adverse effects

**Method**:
- Email to affected users
- In-app notification
- Public notice (if unable to contact individuals)

**Exceptions** (no notification required if):
- Appropriate technical and organizational protection measures applied (e.g., encryption)
- Subsequent measures ensure high risk no longer likely
- It would involve disproportionate effort (then public communication instead)

### Breach Register

**Location**: `docs/BREACH_REGISTER.md`

**Records**:
- Date and time of breach
- Facts of breach
- Effects of breach
- Remedial action taken
- Whether supervisory authority notified
- Whether data subjects notified
- Evidence of compliance with notification timeline

---

## Third-Party Processors

### Article 28 - Processor

We use the following third-party processors:

#### AWS (Amazon Web Services)

**Services**: Infrastructure (EC2, RDS, S3, CloudFront)
**Data Processed**: All user data stored on our platform
**Location**: EU region (Ireland)
**DPA**: AWS GDPR Data Processing Addendum
**Standard Contractual Clauses**: Yes (for non-EU data transfers)
**Certification**: ISO 27001, SOC 2, PCI DSS

#### SendGrid / AWS SES

**Services**: Email delivery
**Data Processed**: Email addresses, email content
**Location**: EU region
**DPA**: SendGrid Data Processing Agreement
**Purpose**: Transactional and marketing emails

#### Stripe

**Services**: Payment processing
**Data Processed**: Payment card information (tokenized)
**Location**: EU
**DPA**: Stripe Data Processing Agreement
**Certification**: PCI DSS Level 1

#### Datadog (optional)

**Services**: Monitoring and logging
**Data Processed**: Application logs, performance metrics
**Location**: EU region
**DPA**: Datadog Data Processing Agreement
**Pseudonymization**: Yes (user IDs only, no PII in logs)

### Processor Requirements

All processors must:
- Sign Data Processing Agreement (DPA)
- Implement appropriate technical and organizational measures
- Only process data on our documented instructions
- Ensure confidentiality of personnel
- Notify us of any data breaches
- Assist with data subject rights requests
- Delete or return data at end of contract
- Allow audits and inspections

### Sub-Processors

Processors must:
- Obtain our written authorization before engaging sub-processors
- Impose same data protection obligations on sub-processors
- Remain fully liable for sub-processor's performance

---

## International Data Transfers

### Article 44-50 - Transfers of Personal Data to Third Countries

**Primary Data Location**: EU (Ireland for AWS, Azure West Europe)

**Transfers Outside EEA**:

#### To USA

**Mechanism**: Standard Contractual Clauses (SCCs)
**Processors**: AWS (US support team), SendGrid (US servers for non-EU users)
**Safeguards**:
- EU-approved Standard Contractual Clauses (2021)
- Additional technical measures (encryption)
- Regular review of processor's data protection practices

**Schrems II Compliance**:
- Transfer Impact Assessment (TIA) conducted
- Supplementary measures implemented:
  - Encryption at rest and in transit
  - Pseudonymization where possible
  - Access controls limiting US government access
- Documentation: `docs/TIA_REPORT.md`

#### To UK

**Mechanism**: Adequacy decision (UK adequacy decision from EU)
**Note**: No additional safeguards required while adequacy decision in place

### User Choice

Users can request data residency:
- Option to store data in EU-only regions
- Option to disable features that require non-EU transfers
- Transparency about where data is processed

---

## Compliance Monitoring

### Privacy by Design and by Default (Article 25)

**Implementation**:
- Default privacy settings: Most restrictive
- Progressive disclosure of personal information
- Data minimization in design phase
- Privacy impact assessments for new features

**Examples**:
- Profile visibility default: Friends only
- Marketing emails default: Opt-out
- Analytics tracking default: Opt-in
- Public profile default: No

### Data Protection Impact Assessment (DPIA) - Article 35

**When Required**:
- Systematic and extensive profiling
- Processing special category data at scale
- Systematic monitoring of public areas at large scale
- New technologies with high risk

**Process**:
1. Describe processing operations and purposes
2. Assess necessity and proportionality
3. Identify risks to rights and freedoms
4. Measure to address risks
5. Consult DPO and (if needed) supervisory authority

**Completed DPIAs**:
- Video recording for sign language practice (completed 2025-01-15)
- Live interpretation service (completed 2025-02-01)

**Location**: `docs/DPIAs/`

### Regular Audits

**Internal Audits**:
- Quarterly review of data processing activities
- Monthly review of data retention job logs
- Weekly security log review
- Annual comprehensive compliance audit

**External Audits**:
- Annual third-party privacy audit
- Bi-annual penetration testing
- ISO 27001 certification audit (annual)

### Staff Training

**Mandatory Training**:
- GDPR fundamentals (all staff, annually)
- Data protection practices (all staff, annually)
- Secure coding practices (developers, quarterly)
- Incident response (all staff, annually)

**Training Records**:
- Staff member name
- Training completed
- Date completed
- Next due date

---

## Documentation and Records

### Required Documentation

1. ✅ Record of Processing Activities (Article 30) - This document
2. ✅ Data Protection Impact Assessments (Article 35) - `docs/DPIAs/`
3. ✅ Data Breach Register (Article 33) - `docs/BREACH_REGISTER.md`
4. ✅ DPO Contact Information (Article 37) - privacy@silenttalk.com
5. ✅ Data Processing Agreements with Processors (Article 28) - `docs/DPAs/`
6. ✅ Transfer Impact Assessments (Schrems II) - `docs/TIA_REPORT.md`
7. ✅ Privacy Policy (Article 13/14) - `docs/PRIVACY_POLICY.md`
8. ✅ Cookie Policy - `docs/COOKIE_POLICY.md`
9. ✅ Consent Records (Article 7) - Database table `consents`
10. ✅ Staff Training Records - `docs/training_records.xlsx`

### Review Schedule

| Document | Review Frequency | Last Reviewed | Next Review |
|----------|------------------|---------------|-------------|
| Privacy Policy | Annually | 2025-01-15 | 2026-01-15 |
| Cookie Policy | Annually | 2025-01-15 | 2026-01-15 |
| GDPR Compliance Doc | Quarterly | 2025-11-13 | 2026-02-13 |
| Processing Register | Quarterly | 2025-11-13 | 2026-02-13 |
| DPIAs | Annually | 2025-02-01 | 2026-02-01 |
| DPAs | Upon renewal | Various | Various |

---

## Contact

### Data Protection Officer (DPO)

**Email**: dpo@silenttalk.com
**Responsibilities**:
- Monitor GDPR compliance
- Advise on data protection
- Cooperate with supervisory authority
- Point of contact for data subjects and authority

### Supervisory Authority

**Irish Data Protection Commission**
- Address: 21 Fitzwilliam Square South, Dublin 2, D02 RD28, Ireland
- Email: info@dataprotection.ie
- Phone: +353 (0)761 104 800
- Website: https://www.dataprotection.ie

---

**Version**: 1.0.0
**Last Updated**: 2025-11-13
**Next Review**: 2026-02-13
**Approved By**: Data Protection Officer
