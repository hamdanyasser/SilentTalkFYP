# Data Processing Agreement (DPA)

**Template for Third-Party Processors**

---

## Parties

**Data Controller** ("Controller"):
- Name: SilentTalk FYP
- Address: [Your Address]
- Email: privacy@silenttalk.com
- Contact: Data Protection Officer

**Data Processor** ("Processor"):
- Name: [Processor Name]
- Address: [Processor Address]
- Email: [Processor Email]
- Contact: [Processor DPO/Privacy Contact]

**Effective Date**: [Date]

---

## 1. Definitions

**1.1** Terms used in this Agreement shall have the meanings set forth in the GDPR and as follows:

- **"GDPR"** means Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the free movement of such data.

- **"Personal Data"** means any information relating to an identified or identifiable natural person processed by the Processor on behalf of the Controller.

- **"Processing"** means any operation or set of operations performed on Personal Data.

- **"Data Subject"** means an identified or identifiable natural person.

- **"Sub-Processor"** means any third party engaged by the Processor to process Personal Data.

- **"Supervisory Authority"** means an independent public authority established by an EU Member State.

- **"Data Breach"** means a breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Personal Data.

---

## 2. Subject Matter and Duration

**2.1 Subject Matter**

This Agreement governs the Processor's processing of Personal Data on behalf of the Controller in connection with:

[Describe the services provided by the Processor]

**Example**: Cloud infrastructure services including compute, storage, and database hosting for the SilentTalk application.

**2.2 Duration**

This Agreement shall remain in force for the duration of the Main Agreement between the parties, and shall automatically terminate upon termination of the Main Agreement, unless otherwise specified.

---

## 3. Scope and Nature of Processing

**3.1 Categories of Data Subjects**

The Personal Data processed concerns the following categories of data subjects:

- [ ] Users of the SilentTalk application
- [ ] Sign language learners
- [ ] Interpreters
- [ ] Customer service contacts
- [ ] Website visitors
- [ ] Other: _______________________

**3.2 Types of Personal Data**

The Personal Data processed includes:

- [ ] **Identification data**: Name, email, username, user ID
- [ ] **Contact data**: Email address, phone number
- [ ] **Account data**: Password (hashed), authentication tokens
- [ ] **Usage data**: Login times, IP addresses, user agent strings
- [ ] **Content data**: Messages, practice session recordings, uploaded files
- [ ] **Payment data**: Credit card information (tokenized), billing address
- [ ] **Profile data**: Profile picture, bio, preferences
- [ ] **Communication data**: Email correspondence, support tickets
- [ ] **Technical data**: Device information, cookies, log files
- [ ] **Other**: _______________________

**3.3 Special Categories of Personal Data**

Does processing include special categories of Personal Data under Article 9 GDPR?

- [ ] NO - No special category data is processed
- [ ] YES - The following special categories are processed:
  - [ ] Racial or ethnic origin
  - [ ] Political opinions
  - [ ] Religious or philosophical beliefs
  - [ ] Trade union membership
  - [ ] Genetic data
  - [ ] Biometric data
  - [ ] Health data
  - [ ] Sex life or sexual orientation data

If YES, additional safeguards must be documented: _______________________

**3.4 Nature and Purpose of Processing**

The Processor shall process Personal Data only for the following purposes:

1. Providing infrastructure and hosting services for the SilentTalk application
2. Storing and retrieving Personal Data as instructed by the Controller
3. Performing backups and disaster recovery
4. Monitoring system performance and security
5. Other: _______________________

**3.5 Duration of Processing**

Processing will continue for the duration of the Main Agreement and for a period of [30 days] thereafter to allow for data return or destruction.

---

## 4. Processor's Obligations

**4.1 Process Only on Instructions**

The Processor shall:
- Process Personal Data only on documented instructions from the Controller
- Immediately inform the Controller if instructions violate GDPR or other EU/Member State data protection law
- Not process Personal Data for its own purposes

**4.2 Confidentiality**

The Processor shall ensure that persons authorized to process Personal Data:
- Are bound by confidentiality obligations or under appropriate statutory obligation of confidentiality
- Receive appropriate training on data protection
- Process Personal Data only as necessary to provide the services

**4.3 Security Measures (Article 32)**

The Processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including:

**Technical Measures:**
- [ ] Pseudonymization and encryption of Personal Data
- [ ] Ability to ensure ongoing confidentiality, integrity, availability, and resilience of processing systems
- [ ] Ability to restore availability and access to Personal Data in a timely manner in the event of a physical or technical incident
- [ ] Regular testing, assessment, and evaluation of effectiveness of security measures

**Organizational Measures:**
- [ ] Access control (physical and logical)
- [ ] Data protection by design and by default
- [ ] Incident response plan
- [ ] Business continuity and disaster recovery plans
- [ ] Staff training and awareness programs
- [ ] Regular security audits and assessments

**Specific Security Measures for this Agreement:**

1. **Encryption**:
   - At rest: AES-256 encryption for all stored data
   - In transit: TLS 1.3 for all data transmission
   - Backups: Encrypted with separate encryption keys

2. **Access Control**:
   - Role-based access control (RBAC)
   - Multi-factor authentication (MFA) for administrative access
   - Access logs maintained for all Personal Data access
   - Principle of least privilege enforced

3. **Network Security**:
   - Firewalls and intrusion detection systems
   - DDoS protection
   - Network segmentation
   - VPN for remote access

4. **Monitoring and Logging**:
   - 24/7 security monitoring
   - Automated threat detection
   - Security Information and Event Management (SIEM)
   - Log retention for [90 days]

5. **Physical Security**:
   - Secure data centers with controlled access
   - Environmental controls (temperature, humidity, fire suppression)
   - Backup power systems
   - 24/7 surveillance

6. **Certifications**:
   - [ ] ISO 27001
   - [ ] SOC 2 Type II
   - [ ] PCI DSS
   - [ ] Other: _______________________

**4.4 Sub-Processors**

**Current Sub-Processors:**

| Sub-Processor Name | Service Provided | Location | DPA in Place |
|--------------------|------------------|----------|--------------|
| [Name] | [Service] | [Country] | [Yes/No] |

The Processor shall:
- Obtain Controller's prior written authorization before engaging any sub-processor
- Provide Controller with at least [30 days] notice of any intended changes to sub-processors
- Ensure sub-processors are bound by same data protection obligations as in this Agreement
- Remain fully liable to Controller for sub-processor's performance

**Controller's General Authorization:**

The Controller hereby provides general authorization for the Processor to engage the sub-processors listed above, subject to the conditions in this section.

**Objection to Sub-Processors:**

The Controller may object to a new or replacement sub-processor on reasonable grounds relating to data protection within [14 days] of notification. If Controller objects, parties shall work together in good faith to find a solution, which may include Processor not using the sub-processor or Controller terminating the affected services.

**4.5 Data Subject Rights**

The Processor shall, taking into account the nature of the processing, assist the Controller by appropriate technical and organizational measures, insofar as possible, for the fulfillment of the Controller's obligation to respond to requests for exercising data subject rights under Chapter III of GDPR:

- [ ] Right of access (Article 15)
- [ ] Right to rectification (Article 16)
- [ ] Right to erasure (Article 17)
- [ ] Right to restriction of processing (Article 18)
- [ ] Right to data portability (Article 20)
- [ ] Right to object (Article 21)
- [ ] Rights related to automated decision-making (Article 22)

**Response Time**: The Processor shall provide assistance within [48 hours] of Controller's request.

**Fee**: The Processor [may / may not] charge a reasonable fee for such assistance.

**4.6 Data Breach Notification**

The Processor shall:
- Notify the Controller without undue delay, and in any event within [24 hours], after becoming aware of a Data Breach
- Provide the following information to the Controller:
  - Description of the nature of the breach
  - Categories and approximate number of data subjects concerned
  - Categories and approximate number of Personal Data records concerned
  - Likely consequences of the breach
  - Measures taken or proposed to address the breach and mitigate its adverse effects
- Cooperate with the Controller and take reasonable steps to remediate the breach

**Contact for Breach Notification**:
- Email: security@controller.com
- Phone: [Emergency contact number]
- Available: 24/7

**4.7 Data Protection Impact Assessment and Prior Consultation**

The Processor shall assist the Controller in ensuring compliance with the obligations pursuant to Articles 35 and 36 of GDPR (Data Protection Impact Assessment and Prior Consultation), taking into account the nature of the processing and the information available to the Processor.

**4.8 Deletion or Return of Personal Data**

Upon termination of this Agreement, the Processor shall, at the choice of the Controller:

- [ ] Delete all Personal Data (including copies) within [30 days]
- [ ] Return all Personal Data to the Controller in a commonly used format within [30 days]

**Exception**: The Processor may retain Personal Data to the extent required by EU or Member State law. In such case, the Processor shall:
- Inform the Controller of that legal requirement
- Continue to ensure confidentiality of the retained Personal Data
- Delete the Personal Data as soon as the legal requirement lapses

**Certification**: Upon completion of deletion or return, the Processor shall provide written certification to the Controller.

**4.9 Audit Rights**

The Processor shall make available to the Controller all information necessary to demonstrate compliance with the obligations laid down in Article 28 GDPR and allow for and contribute to audits, including inspections, conducted by the Controller or another auditor mandated by the Controller.

**Audit Procedures:**
- Controller must provide [30 days] advance written notice
- Audits may be conducted [annually] unless Controller has reasonable grounds to believe non-compliance
- Audits shall be conducted during normal business hours
- Controller shall maintain confidentiality of Processor's confidential information
- Processor may charge a reasonable fee for audit support exceeding [2 days per year]

**Alternative Compliance Verification:**
- Processor may provide copies of independent audit reports (e.g., SOC 2 Type II, ISO 27001)
- Such reports may satisfy Controller's audit requirements if they cover the relevant controls

---

## 5. Controller's Obligations

**5.1 Lawfulness of Instructions**

The Controller represents and warrants that:
- Its processing instructions comply with GDPR and other applicable laws
- It has obtained all necessary consents and legal bases for the processing
- It has provided appropriate privacy notices to data subjects

**5.2 Accuracy of Instructions**

The Controller shall provide clear, complete, and accurate instructions regarding the processing of Personal Data.

**5.3 Cooperation**

The Controller shall cooperate with the Processor to enable compliance with this Agreement and GDPR.

---

## 6. Liability and Indemnification

**6.1 Liability**

Each party's liability under this Agreement shall be subject to the limitation of liability provisions in the Main Agreement.

**6.2 Processor Liability to Data Subjects (Article 82 GDPR)**

The Processor shall be liable for damage caused by processing only where:
- It has not complied with obligations specifically directed to processors in GDPR, or
- It has acted outside or contrary to lawful instructions of the Controller

**6.3 Indemnification**

Each party shall indemnify the other for losses arising from its breach of this Agreement, including:
- Fines imposed by supervisory authorities
- Compensation to data subjects under Article 82 GDPR
- Legal costs and expenses

---

## 7. International Data Transfers

**7.1 Transfer Mechanism**

If Processor transfers Personal Data outside the European Economic Area (EEA), it shall ensure an adequate level of protection through one of the following mechanisms:

- [ ] Adequacy decision (Article 45 GDPR)
  - Country: _______________________

- [ ] Standard Contractual Clauses (Article 46(2)(c) GDPR)
  - Version: EU Commission SCCs 2021
  - Appendix attached: Yes

- [ ] Binding Corporate Rules (Article 46(2)(b) GDPR)
  - Approved by: _______________________

- [ ] Certification mechanism (Article 46(2)(f) GDPR)
  - Certification: _______________________

**7.2 Additional Safeguards (Schrems II Compliance)**

For transfers to countries without adequacy decision, the Processor has implemented the following supplementary measures:

- [ ] Encryption of Personal Data at rest and in transit
- [ ] Pseudonymization where possible
- [ ] Access controls limiting access by third-country authorities
- [ ] Technical measures to prevent access by third-country authorities
- [ ] Organizational measures (e.g., policies against disclosure)
- [ ] Contractual measures with sub-processors

**7.3 Transfer Impact Assessment**

The Processor has conducted a Transfer Impact Assessment (TIA) to evaluate the level of protection in the third country, considering:
- The laws and practices of the third country
- Any relevant contractual safeguards
- Any technical and organizational measures

**TIA Available**: [ ] Yes [ ] No
**If yes, provided to Controller**: [ ] Yes [ ] No [ ] Upon request

**7.4 Locations of Processing**

Primary processing location(s): _______________________

Sub-processor locations: _______________________

---

## 8. Cooperation with Supervisory Authority

**8.1 Cooperation**

The Processor shall cooperate with the supervisory authority in the performance of its tasks, including providing requested information.

**8.2 Notification**

The Processor shall notify the Controller immediately if:
- A supervisory authority conducts an investigation involving the processing
- The Processor receives any formal inquiry from a supervisory authority
- The Processor becomes aware of any non-compliance with GDPR

---

## 9. Term and Termination

**9.1 Term**

This Agreement shall commence on the Effective Date and continue until terminated in accordance with this section or the Main Agreement.

**9.2 Termination**

This Agreement may be terminated:
- Upon termination of the Main Agreement
- By either party if the other party materially breaches this Agreement and fails to remedy within [30 days] of written notice
- Immediately by the Controller if continuation would result in violation of GDPR

**9.3 Effect of Termination**

Upon termination:
- Processor shall delete or return all Personal Data as specified in Section 4.8
- This Agreement shall survive to the extent necessary to complete deletion/return and for any ongoing obligations

---

## 10. General Provisions

**10.1 Entire Agreement**

This Agreement, together with the Main Agreement, constitutes the entire agreement between the parties regarding the processing of Personal Data.

**10.2 Amendments**

This Agreement may only be amended by written agreement of both parties, except that Processor may amend to comply with changes in GDPR or other applicable law upon notice to Controller.

**10.3 Severability**

If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.

**10.4 Governing Law**

This Agreement shall be governed by the laws of [Ireland] without regard to conflict of law principles.

**10.5 Jurisdiction**

Any disputes arising from this Agreement shall be subject to the exclusive jurisdiction of the courts of [Ireland].

**10.6 Order of Precedence**

In the event of conflict between this Agreement and the Main Agreement, this Agreement shall prevail regarding the processing of Personal Data.

---

## 11. Signatures

**DATA CONTROLLER**

Signature: ___________________________
Name: _______________________________
Title: _______________________________
Date: _______________________________

**DATA PROCESSOR**

Signature: ___________________________
Name: _______________________________
Title: _______________________________
Date: _______________________________

---

## Appendices

### Appendix A: Description of Processing

**Subject Matter**: [Description]

**Duration**: [Duration]

**Nature and Purpose**: [Description]

**Type of Personal Data**: [List]

**Categories of Data Subjects**: [List]

**Obligations and Rights of Controller**: [As specified in Main Agreement]

### Appendix B: Security Measures

[Detailed description of technical and organizational measures implemented by Processor]

### Appendix C: Sub-Processors

[List of authorized sub-processors with details]

### Appendix D: Standard Contractual Clauses (if applicable)

[Attach EU Commission approved SCCs]

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Next Review**: 2026-11-13

---

## Instructions for Use

1. **Complete Bracket Fields**: Replace all [bracketed] fields with specific information
2. **Check Boxes**: Check all applicable boxes
3. **Review Appendices**: Complete all appendices with detailed information
4. **Legal Review**: Have legal counsel review before signing
5. **Both Parties Sign**: Ensure both parties execute the agreement
6. **Retain Copies**: Keep executed copy with Main Agreement
7. **Annual Review**: Review annually and update as needed

## Notes

- This template is based on Article 28 GDPR requirements
- It incorporates post-Schrems II considerations for international transfers
- It should be customized for each processor relationship
- Legal counsel should review all agreements
- Keep updated as GDPR guidance evolves
