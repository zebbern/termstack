---
name: synack-report
category: reporter
tags:
  - synack
  - red-team
  - vulnerability-report
  - pentest
  - srt
triggers:
  - synack submission
  - synack report
  - srt vulnerability
  - red team report
  - synack finding
os: cross-platform
---

# SYNACK-REPORT

## Purpose

Generate professional vulnerability reports following Synack Red Team (SRT) format and standards. Synack operates differently from traditional bug bounty programs - it's an elite, vetted researcher community with higher quality expectations, mission-based work, and premium payouts.

## When to Use

- Submitting vulnerability to Synack LaunchPoint platform
- Documenting finding from Synack target assessment
- Preparing professional pentest-quality report
- Mission work requiring detailed documentation
- Creating finding for Synack client review

## Synack Platform Overview

### Key Differences from Bug Bounty

| Aspect      | Synack SRT                 | Traditional Bug Bounty |
| ----------- | -------------------------- | ---------------------- |
| Access      | Vetted researchers only    | Public programs        |
| Work Type   | Missions + Vulnerabilities | Vulnerabilities only   |
| Payment     | Premium rates              | Variable/competitive   |
| Disclosure  | NDA protected              | Often public           |
| Quality Bar | Professional pentest       | Basic requirements     |
| Legal       | Full safe harbor           | Program-dependent      |
| Support     | Dedicated staff            | Community-based        |

### Work Types

**1. Vulnerability Findings**

- Individual vulnerability discoveries
- Paid per accepted finding
- Based on VRT severity rating

**2. Mission Work**

- Structured assessment tasks
- Hourly compensation
- Checklist-based methodology
- Consistent income stream

## Quick Start

Basic Synack vulnerability report template:

```markdown
# [VRT Category]: [Vulnerability Description]

## Summary

[One paragraph describing the vulnerability, location, and impact]

## VRT Classification

- **Category:** [Primary VRT Category]
- **Subcategory:** [VRT Subcategory]
- **CVSS Score:** X.X (Critical/High/Medium/Low)

## Affected Asset

- **Target:** [Target codename]
- **URL:** https://target.com/vulnerable/endpoint
- **Parameter:** [Affected parameter]
- **Method:** GET/POST

## Steps to Reproduce

1. Navigate to [URL]
2. Perform [action]
3. Observe [result]

## Proof of Concept

[HTTP requests, screenshots, video]

## Impact

[Security and business impact assessment]

## Remediation

[Professional fix recommendations]
```

## VRT (Vulnerability Rating Taxonomy)

### VRT Categories

Synack uses standardized vulnerability classification:

| Category                | Description                   | Typical Severity |
| ----------------------- | ----------------------------- | ---------------- |
| Server-Side Injection   | SQLi, Command Injection, SSTI | Critical-High    |
| Authentication          | Broken auth, session issues   | Critical-High    |
| Authorization           | IDOR, privilege escalation    | High-Medium      |
| Cross-Site Scripting    | XSS (all types)               | High-Medium      |
| Cryptography            | Weak crypto, key exposure     | High-Medium      |
| Information Disclosure  | Data leaks, errors            | Medium-Low       |
| Server Misconfiguration | Headers, configs              | Medium-Low       |
| Network Security        | TLS, DNS issues               | Medium-Low       |

### VRT Subcategories

**Server-Side Injection:**

```
- SQL Injection
  - Boolean-based Blind
  - Error-based
  - UNION-based
  - Time-based Blind
  - Out-of-Band
- OS Command Injection
- LDAP Injection
- Server-Side Template Injection
- XML External Entity (XXE)
- Server-Side Request Forgery (SSRF)
```

**Authentication:**

```
- Authentication Bypass
- Weak Password Policy
- Password Reset Flaws
- Session Fixation
- Session Management Issues
- Credential Stuffing
- Brute Force
- Default Credentials
```

**Authorization:**

```
- Insecure Direct Object Reference (IDOR)
- Privilege Escalation (Horizontal)
- Privilege Escalation (Vertical)
- Missing Function Level Access Control
- Forced Browsing
```

**Cross-Site Scripting:**

```
- Stored XSS
- Reflected XSS
- DOM-based XSS
- Self-XSS (typically N/A)
```

## CVSS Scoring for Synack

### Base Metrics Reference

| Metric                   | Values  | Description               |
| ------------------------ | ------- | ------------------------- |
| Attack Vector (AV)       | N/A/L/P | Network reach required    |
| Attack Complexity (AC)   | L/H     | Special conditions needed |
| Privileges Required (PR) | N/L/H   | Authentication level      |
| User Interaction (UI)    | N/R     | Victim participation      |
| Scope (S)                | U/C     | Impact beyond component   |
| Confidentiality (C)      | H/L/N   | Data exposure             |
| Integrity (I)            | H/L/N   | Data modification         |
| Availability (A)         | H/L/N   | Service disruption        |

### Severity to Payout (Approximate)

| CVSS     | Rating   | Typical Payout Range |
| -------- | -------- | -------------------- |
| 9.0-10.0 | Critical | $5,000 - $30,000+    |
| 7.0-8.9  | High     | $2,000 - $10,000     |
| 4.0-6.9  | Medium   | $500 - $3,000        |
| 0.1-3.9  | Low      | $100 - $500          |

_Note: Payouts vary significantly by target and client._

### Common CVSS Vectors

```
# Remote Code Execution
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H  # 10.0 Critical

# SQL Injection (Full DB Access)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # 9.1 Critical

# Authentication Bypass
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # 9.1 Critical

# Stored XSS (Admin Target)
CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N  # 8.4 High

# IDOR (Sensitive Data)
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:N  # 7.1 High

# Reflected XSS
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  # 6.1 Medium

# SSRF (Internal Only)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N  # 5.8 Medium

# Information Disclosure
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N  # 5.3 Medium
```

## Report Writing Standards

### Professional Quality Expectations

Synack expects pentest-level reporting:

1. **Clear Technical Writing**
   - Concise, professional language
   - No speculation or uncertainty
   - Factual, evidence-based claims

2. **Complete Documentation**
   - Every step reproducible
   - All evidence attached
   - No assumptions about reviewer knowledge

3. **Accurate Classification**
   - Correct VRT category
   - Justified CVSS score
   - Realistic impact assessment

### Report Sections

#### 1. Title

Format: `[VRT Category]: [Specific Vulnerability]`

**Examples:**

```
SQL Injection: Boolean-based Blind SQLi in User Search
Authentication: Session Token Not Invalidated on Password Change
Authorization: IDOR Allows Access to Other Users' Documents
XSS: Stored XSS in Profile Bio Affects All Visitors
```

#### 2. Summary

Single paragraph covering:

- Vulnerability type and technical details
- Exact location (endpoint, parameter)
- Exploitation method
- Impact scope

**Example:**

```markdown
## Summary

A boolean-based blind SQL injection vulnerability exists in the user
search functionality at `/api/v2/users/search`. The `query` parameter
is concatenated directly into a SQL statement, allowing extraction of
database contents through conditional responses. An unauthenticated
attacker can enumerate all user records including email addresses,
password hashes, and API keys affecting approximately 50,000 users.
```

#### 3. VRT Classification

```markdown
## VRT Classification

- **Category:** Server-Side Injection
- **Subcategory:** SQL Injection - Boolean-based Blind
- **CVSS 3.1 Score:** 9.1 (Critical)
- **Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N
```

#### 4. Affected Asset

```markdown
## Affected Asset

- **Target:** ACME-WEB-01
- **Environment:** Production
- **URL:** https://app.target.com/api/v2/users/search
- **Method:** GET
- **Parameter:** query
- **Authentication:** None required
```

#### 5. Steps to Reproduce

```markdown
## Steps to Reproduce

### Prerequisites

- Browser with developer tools or Burp Suite
- Network access to target

### Reproduction Steps

1. **Access the search endpoint**
```

GET https://app.target.com/api/v2/users/search?query=test

```

2. **Inject boolean condition (true)**
```

GET /api/v2/users/search?query=test' AND '1'='1 HTTP/1.1
Host: app.target.com

```
Response: 200 OK with results

3. **Inject boolean condition (false)**
```

GET /api/v2/users/search?query=test' AND '1'='2 HTTP/1.1
Host: app.target.com

```
Response: 200 OK with no results

4. **Extract data using conditional queries**
```

GET /api/v2/users/search?query=test' AND SUBSTRING(username,1,1)='a HTTP/1.1

```
Response varies based on condition truth
```

#### 6. Proof of Concept

````markdown
## Proof of Concept

### HTTP Request (True Condition)

```http
GET /api/v2/users/search?query=test'+AND+'1'%3d'1 HTTP/1.1
Host: app.target.com
Accept: application/json
```
````

### HTTP Response (True - Results Returned)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"results": [{"id": 1, "name": "Test User"}], "count": 1}
```

### HTTP Request (False Condition)

```http
GET /api/v2/users/search?query=test'+AND+'1'%3d'2 HTTP/1.1
Host: app.target.com
Accept: application/json
```

### HTTP Response (False - No Results)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"results": [], "count": 0}
```

### Automated Extraction (sqlmap)

```bash
sqlmap -u "https://app.target.com/api/v2/users/search?query=test" \
  --technique=B --level=3 --risk=2 --dump
```

### Screenshots

[Attach annotated screenshots demonstrating the vulnerability]

````

#### 7. Impact Assessment

```markdown
## Impact

### Technical Impact
- **Confidentiality:** HIGH - Complete database read access
- **Integrity:** HIGH - Potential data modification via stacked queries
- **Availability:** LOW - DoS possible through resource-intensive queries

### Business Impact
- Exposure of ~50,000 user records including PII
- Password hashes vulnerable to offline cracking
- API keys could enable further attacks
- Regulatory compliance impact (GDPR, CCPA)
- Potential credential stuffing attacks

### Attack Scenarios
1. Extract all user credentials and API keys
2. Use credentials for account takeover
3. Access sensitive business data via compromised accounts
4. Lateral movement using extracted API keys
````

#### 8. Remediation

````markdown
## Remediation

### Immediate Fix

Implement parameterized queries:

**Vulnerable Code:**

```python
query = f"SELECT * FROM users WHERE name LIKE '%{user_input}%'"
cursor.execute(query)
```
````

**Secure Code:**

```python
query = "SELECT * FROM users WHERE name LIKE %s"
cursor.execute(query, (f'%{user_input}%',))
```

### Additional Recommendations

1. Implement input validation (whitelist characters)
2. Apply least privilege to database accounts
3. Enable SQL query logging for monitoring
4. Deploy WAF rules for SQL injection patterns
5. Conduct security code review of similar endpoints

### References

- OWASP SQL Injection Prevention Cheat Sheet
- CWE-89: SQL Injection

````

## Mission Report Guidelines

For mission-based work:

```markdown
# Mission Report: [Mission Name]

## Mission Details
- **Mission ID:** [ID]
- **Target:** [Target Name]
- **Date:** [Completion Date]
- **Time Spent:** [Hours]

## Checklist Completion

### [Category 1]
- [x] Item 1 - Completed, no findings
- [x] Item 2 - Finding identified (see Vuln #1)
- [x] Item 3 - Not applicable (reason)

### [Category 2]
- [x] Item 4 - Completed
...

## Findings Summary
| # | Severity | VRT Category | Status |
|---|----------|--------------|--------|
| 1 | Medium | XSS - Reflected | New |
| 2 | Low | Info Disclosure | New |

## Detailed Findings

### Finding #1: [Title]
[Full vulnerability report format]
````

## Quality Checklist

Before submitting to Synack:

- [ ] VRT category accurately assigned
- [ ] CVSS score properly calculated
- [ ] Title follows `[Category]: [Description]` format
- [ ] Summary is one concise paragraph
- [ ] Steps reproducible by any researcher
- [ ] All HTTP requests/responses included
- [ ] Screenshots are clear and annotated
- [ ] Impact is realistic, not exaggerated
- [ ] Remediation is professional and actionable
- [ ] No scope violations
- [ ] Report reads at professional pentest level

## Common Rejection Reasons

| Reason                | Prevention                    |
| --------------------- | ----------------------------- |
| Duplicate             | Check existing findings first |
| Out of scope          | Verify target before testing  |
| Not reproducible      | Test on clean session         |
| Insufficient severity | Document full impact chain    |
| Poor quality          | Follow professional standards |
| Theoretical           | Provide working PoC           |
| Self-XSS              | Demonstrate victim impact     |

## References

- Synack Red Team: https://www.synack.com/red-team/
- Synack Knowledge Base: https://www.synack.com/knowledge-base/
- CVSS 3.1 Calculator: https://www.first.org/cvss/calculator/3.1
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
