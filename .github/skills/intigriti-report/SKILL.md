---
name: intigriti-report
category: reporter
tags:
  - intigriti
  - bug-bounty
  - vulnerability-report
  - disclosure
  - cvss
triggers:
  - intigriti submission
  - intigriti report
  - vulnerability report
  - bug bounty report
  - security disclosure
os: cross-platform
---

# INTIGRITI-REPORT

## Purpose

Generate professional vulnerability reports following Intigriti's bug bounty platform format. This skill provides templates, CVSS scoring guidance, and best practices for maximizing acceptance rates and bounty payouts.

## When to Use

- Vulnerability confirmed and needs formal documentation
- Submitting to Intigriti bug bounty program
- Need to calculate CVSS severity score
- Creating professional disclosure documentation
- Documenting proof of concept with impact analysis
- Preparing vulnerability for triage review

## Quick Start

Basic Intigriti vulnerability report template:

```markdown
# [Vulnerability Type] in [Component] at [Endpoint]

## Summary

[One paragraph: what, where, how, impact]

## Severity

**CVSS 3.1 Score:** X.X (Critical/High/Medium/Low)
**Vector:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

## Affected Asset

- **Domain:** example.com
- **Endpoint:** /api/v1/vulnerable
- **In Scope:** Yes

## Steps to Reproduce

1. Navigate to [URL]
2. Perform [action]
3. Observe [result]

## Proof of Concept

[HTTP requests, screenshots, video link]

## Impact

[Business and security impact]

## Remediation

[Recommended fix]
```

## Report Structure

### 1. Title

Format: `[Vulnerability Type] in [Component] at [Location]`

**Good Titles:**

```
SQL Injection in Search API at /api/v1/search
Stored XSS in User Profile Bio Field
Authentication Bypass via Password Reset Token Reuse
IDOR Exposes Private Documents via /api/files/{id}
SSRF to Internal AWS Metadata Service
```

**Avoid:**

```
Bug found                    # Too vague
XSS                          # No context
Security issue in login      # Unclear vulnerability
```

### 2. Summary

One paragraph covering:

- What vulnerability type
- Where it exists (endpoint, parameter)
- How it can be exploited
- What's at risk (data, accounts, systems)

**Example:**

```markdown
## Summary

A SQL injection vulnerability exists in the user search API endpoint
`/api/v1/users/search`. The `q` parameter is directly concatenated into
a database query without sanitization, allowing attackers to extract
sensitive data including user credentials, personal information, and
payment details. Authentication is not required to exploit this
vulnerability, affecting all 100,000+ registered users.
```

### 3. Severity Assessment

#### CVSS 3.1 Base Metrics

| Metric                   | Values                                     | Description                        |
| ------------------------ | ------------------------------------------ | ---------------------------------- |
| Attack Vector (AV)       | N=Network, A=Adjacent, L=Local, P=Physical | How attacker reaches target        |
| Attack Complexity (AC)   | L=Low, H=High                              | Conditions beyond attacker control |
| Privileges Required (PR) | N=None, L=Low, H=High                      | Authentication needed              |
| User Interaction (UI)    | N=None, R=Required                         | Victim participation               |
| Scope (S)                | U=Unchanged, C=Changed                     | Impact beyond component            |
| Confidentiality (C)      | H=High, L=Low, N=None                      | Data exposure                      |
| Integrity (I)            | H=High, L=Low, N=None                      | Data modification                  |
| Availability (A)         | H=High, L=Low, N=None                      | Service disruption                 |

#### Severity Ratings

| Rating   | Score    | Typical Bounty Range |
| -------- | -------- | -------------------- |
| Critical | 9.0-10.0 | €5,000 - €50,000+    |
| High     | 7.0-8.9  | €1,500 - €15,000     |
| Medium   | 4.0-6.9  | €500 - €3,000        |
| Low      | 0.1-3.9  | €50 - €500           |

#### Common CVSS Vectors

```
# Remote Code Execution (Unauthenticated)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H  # 10.0 Critical

# SQL Injection (Data Extraction)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N  # 9.1 Critical

# Stored XSS (Admin Impact)
CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N  # 8.4 High

# IDOR (Read Other Users' Data)
CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N  # 6.5 Medium

# Reflected XSS
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  # 6.1 Medium

# CSRF (Sensitive Action)
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:H/A:N  # 6.5 Medium

# Information Disclosure
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N  # 5.3 Medium

# Open Redirect
CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N  # 6.1 Medium

# SSRF (Internal Access)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N  # 5.8 Medium

# SSRF (Cloud Metadata)
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:N  # 8.6 High
```

### 4. Affected Asset

Always verify scope before submitting:

```markdown
## Affected Asset

- **Domain:** app.example.com
- **Asset Type:** Web Application
- **Endpoint:** POST /api/v1/users/search
- **Parameter:** q (query string)
- **In Scope:** Yes (per program policy)
- **Discovered:** 2025-01-10
```

### 5. Steps to Reproduce

Clear, numbered steps anyone can follow:

```markdown
## Steps to Reproduce

1. **Navigate to the vulnerable endpoint**
```

GET https://app.example.com/search

````

2. **Open browser DevTools or Burp Suite to intercept requests**

3. **Enter a search query and capture the request**
```http
GET /api/v1/users/search?q=test HTTP/1.1
Host: app.example.com
````

4. **Modify the query parameter with SQL injection payload**

   ```http
   GET /api/v1/users/search?q=test' UNION SELECT username,password FROM users-- HTTP/1.1
   Host: app.example.com
   ```

5. **Send the modified request**

6. **Observe database contents in response**
   ```json
   {
     "results": [{ "username": "admin", "password": "5f4dcc3b5aa765d61..." }]
   }
   ```

````

**Best Practices:**
- Use placeholder domain (target.com/example.com)
- Include exact URLs and parameters
- Show complete HTTP requests
- Redact sensitive tokens
- Specify tools used (Burp Suite, browser)
- Add timing if relevant

### 6. Proof of Concept

Include all supporting evidence:

```markdown
## Proof of Concept

### HTTP Request
```http
POST /api/v1/users/search HTTP/1.1
Host: app.example.com
Content-Type: application/json
Cookie: session=[REDACTED]

{"q": "admin' UNION SELECT username,password FROM users--"}
````

### HTTP Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "results": [
    {"username": "admin", "password": "hashed_value"}
  ]
}
```

### Screenshots

[Attach annotated screenshots highlighting the vulnerability]

### Video PoC (Optional)

[Link to unlisted video demonstrating exploitation]

````

### 7. Impact Analysis

**Impact Framework:**

```markdown
## Impact

### Direct Impact
- **Data at Risk:** [Specific data types exposed]
- **Accounts Affected:** [Number/type of users]
- **Systems Compromised:** [Components affected]

### Business Impact
- **Compliance:** [GDPR, PCI-DSS, HIPAA implications]
- **Reputation:** [Customer trust impact]
- **Financial:** [Potential losses]

### Attack Scenarios
An attacker exploiting this vulnerability could:
1. Extract all user credentials from the database
2. Access payment information including credit card details
3. Modify or delete user accounts
4. Escalate to administrative privileges
````

### 8. Remediation

Provide actionable fix recommendations:

````markdown
## Remediation

### Immediate Fix

Use parameterized queries/prepared statements:

**Vulnerable:**

```python
query = f"SELECT * FROM users WHERE name = '{user_input}'"
```
````

**Fixed:**

```python
query = "SELECT * FROM users WHERE name = %s"
cursor.execute(query, (user_input,))
```

### Additional Recommendations

1. Implement input validation and sanitization
2. Apply principle of least privilege to database accounts
3. Enable SQL query logging for detection
4. Consider Web Application Firewall (WAF) rules

````

## Intigriti Platform Guidelines

### Submission Checklist

- [ ] Vulnerability is in scope
- [ ] Not a known issue or duplicate
- [ ] Clear reproduction steps provided
- [ ] Impact clearly documented
- [ ] PoC evidence attached
- [ ] No unauthorized access beyond PoC
- [ ] Confidentiality maintained

### Common Rejection Reasons

| Reason | Prevention |
|--------|------------|
| Out of scope | Check program policy before testing |
| Duplicate | Search disclosed reports first |
| Insufficient impact | Document business impact clearly |
| Cannot reproduce | Test steps on clean environment |
| Missing PoC | Always include screenshots/requests |
| Theoretical only | Demonstrate actual exploitation |

### Response Timeline

| Status | Typical Timeframe |
|--------|-------------------|
| Triage | 1-5 business days |
| Validation | 5-10 business days |
| Bounty Decision | 10-30 business days |
| Payment | 30-60 days after acceptance |

### Communication Best Practices

1. **Be Professional** - Clear, concise, respectful
2. **Be Patient** - Allow time for triage
3. **Be Responsive** - Answer clarification requests promptly
4. **Be Helpful** - Offer to assist with reproduction
5. **Don't Over-Test** - Stop once vulnerability confirmed

## Report Templates by Vulnerability Type

### SQL Injection Template

```markdown
# SQL Injection in [Component] at [Endpoint]

## Summary
SQL injection in the [parameter] parameter allows extraction of database contents.

## Severity
CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N (9.1 Critical)

## Steps to Reproduce
1. Navigate to [endpoint]
2. Inject payload: `' UNION SELECT...--`
3. Observe extracted data

## Impact
Full database compromise, credential theft, data exfiltration

## Remediation
Use parameterized queries
````

### XSS Template

```markdown
# [Stored/Reflected] XSS in [Component] at [Endpoint]

## Summary

Cross-site scripting via [parameter] allows JavaScript execution in victim browsers.

## Severity

CVSS:3.1/AV:N/AC:L/PR:[N/L]/UI:R/S:C/C:L/I:L/A:N (5.4-6.1 Medium)

## Steps to Reproduce

1. Navigate to [endpoint]
2. Inject payload: `<script>alert(document.domain)</script>`
3. [Trigger for victim]

## Impact

Session hijacking, account takeover, phishing

## Remediation

Output encoding, Content Security Policy
```

### IDOR Template

```markdown
# IDOR in [Component] - Access to Other Users' [Resource]

## Summary

Insecure direct object reference allows accessing other users' [resources].

## Severity

CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:[N/L/H]/A:N (6.5-8.1)

## Steps to Reproduce

1. Authenticate as User A
2. Access [endpoint] with User B's ID
3. Observe unauthorized data access

## Impact

Privacy violation, data breach, horizontal privilege escalation

## Remediation

Implement proper authorization checks
```

## Quality Checklist

Before submitting, verify:

- [ ] Title is descriptive and specific
- [ ] Summary explains vulnerability clearly
- [ ] CVSS score is accurate and justified
- [ ] Asset is in program scope
- [ ] Steps are reproducible by anyone
- [ ] PoC evidence is complete
- [ ] Impact is realistic, not exaggerated
- [ ] Remediation is actionable
- [ ] No sensitive data exposed unnecessarily
- [ ] Report is professional and well-formatted

## References

- Intigriti Platform: https://www.intigriti.com
- CVSS 3.1 Calculator: https://www.first.org/cvss/calculator/3.1
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- CWE Database: https://cwe.mitre.org/
