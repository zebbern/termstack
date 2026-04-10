---
name: retest-vuln
description: Verify vulnerability fixes, validate remediation effectiveness, and perform regression testing. Use when a fix has been deployed, patch verification is needed, or confirming vulnerability closure for bug bounty programs.
tags:
  - security
  - retest
  - verification
  - remediation
  - regression
triggers:
  - retest vulnerability
  - verify fix
  - remediation check
  - regression test vulnerability
---

# retest-vuln

## When to Use

- A vulnerability fix has been deployed and needs verification
- Bug bounty program requests retest before closing ticket
- Patch has been released and remediation must be confirmed
- Regression testing needed after application updates
- Verifying WAF/security control effectiveness
- Confirming all attack vectors for a vulnerability are addressed
- Closing out vulnerability reports with proof of fix
- Validating hotfix deployment in production

## Quick Start

Minimal retest workflow:

```bash
# 1. Confirm environment is patched version
curl -s https://target.com/version | grep -i version

# 2. Replay original proof-of-concept
curl -s "https://target.com/vuln?param=<script>alert(1)</script>"

# 3. Compare response - look for sanitization/blocking
# Before: <script>alert(1)</script> reflected
# After:  &lt;script&gt;alert(1)&lt;/script&gt; encoded
```

## Core Concepts

### Retest vs Original Test

| Aspect   | Original Test        | Retest Verification     |
| -------- | -------------------- | ----------------------- |
| Goal     | Find vulnerability   | Confirm fix works       |
| Approach | Exploratory          | Targeted replay         |
| Evidence | PoC showing impact   | Before/after comparison |
| Output   | Vulnerability report | Fix verification report |

### Verification Outcomes

| Result        | Meaning                             | Action                       |
| ------------- | ----------------------------------- | ---------------------------- |
| **FIXED**     | Vulnerability no longer exploitable | Close ticket, document proof |
| **PARTIAL**   | Some vectors fixed, others open     | Report remaining issues      |
| **NOT FIXED** | Original attack still works         | Escalate, provide details    |
| **REGRESSED** | Was fixed, now vulnerable again     | Alert immediately            |
| **BYPASS**    | Fix circumventable with variation   | Document bypass technique    |

## Step-by-Step Process

### Phase 1: Environment Verification

**CRITICAL**: Ensure you're testing the patched version.

```bash
# Check application version
curl -sI https://target.com | grep -i "x-version\|x-app-version\|server"

# Check for version in page source
curl -s https://target.com | grep -iE "version|build|release"

# Compare response headers with pre-fix baseline
diff <(curl -sI https://target.com) baseline_headers.txt

# Verify DNS resolves to correct IP (not cached)
nslookup target.com
dig target.com +short
```

**Environment Checklist**:

- [ ] Confirmed patched version deployed
- [ ] Cleared local browser cache
- [ ] Not using cached proxy responses
- [ ] Testing correct environment (prod vs staging)
- [ ] Fresh session/authentication state

### Phase 2: Baseline Capture

Save the original vulnerable behavior for comparison:

```bash
# Store original vulnerable request/response
cat > original_vuln.txt << 'EOF'
=== ORIGINAL VULNERABILITY ===
Date: 2024-01-15
Target: https://target.com/api/user?id=123
Method: GET
Payload: id=123' OR '1'='1
Response: 200 OK
Evidence: Returned all user records (SQL injection)
EOF

# Capture original response (if still available in archives)
curl -s "https://web.archive.org/web/*/target.com/api/user*"
```

### Phase 3: Direct Replay Test

Execute the exact original proof-of-concept:

```bash
# Replay original payload EXACTLY as documented
# Example: XSS vulnerability
curl -s "https://target.com/search?q=<script>alert('XSS')</script>" \
  -H "Cookie: session=YOUR_SESSION" \
  -o retest_response.html

# Check if payload is reflected/executed
grep -i "script>alert" retest_response.html

# Example: SQL Injection
curl -s "https://target.com/api/user?id=1' OR '1'='1" \
  -H "Authorization: Bearer TOKEN" \
  -o retest_sqli.json

# Check response for injection indicators
cat retest_sqli.json | jq '.users | length'
```

### Phase 4: Response Comparison

Analyze before vs after behavior:

```bash
# HTTP Status Code Comparison
echo "=== Status Code Check ==="
ORIGINAL_STATUS=200
RETEST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://target.com/vuln?payload=test")

if [ "$RETEST_STATUS" != "$ORIGINAL_STATUS" ]; then
  echo "Status changed: $ORIGINAL_STATUS -> $RETEST_STATUS"
fi

# Response Body Comparison
echo "=== Response Body Diff ==="
diff original_response.txt retest_response.txt

# Response Size Comparison
ORIG_SIZE=$(wc -c < original_response.txt)
NEW_SIZE=$(wc -c < retest_response.txt)
echo "Size change: $ORIG_SIZE -> $NEW_SIZE bytes"

# Header Comparison
diff <(curl -sI "https://target.com/endpoint") original_headers.txt
```

**Fix Indicators to Look For**:

| Vulnerability | Original Behavior   | Fixed Behavior        |
| ------------- | ------------------- | --------------------- |
| XSS           | Script executed     | HTML encoded, blocked |
| SQLi          | Data returned       | Error, empty, 403     |
| IDOR          | Other user's data   | 403 Forbidden         |
| LFI           | File contents shown | Path blocked, 400     |
| RCE           | Command output      | Sanitized, no exec    |
| SSRF          | Internal response   | Blocked, timeout      |

### Phase 5: Bypass Verification

Test if fix can be circumvented with payload variations:

```bash
# XSS Bypass Attempts
PAYLOADS=(
  "<script>alert(1)</script>"           # Original
  "<ScRiPt>alert(1)</ScRiPt>"            # Case variation
  "<script >alert(1)</script>"           # Space injection
  "<scr<script>ipt>alert(1)</script>"    # Nested tags
  "javascript:alert(1)"                  # Protocol handler
  "<img src=x onerror=alert(1)>"         # Event handler
  "<svg onload=alert(1)>"                # SVG event
  "{{constructor.constructor('alert(1)')()}}"  # Template injection
)

for payload in "${PAYLOADS[@]}"; do
  encoded=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$payload'))")
  response=$(curl -s "https://target.com/search?q=$encoded")

  if echo "$response" | grep -qi "alert"; then
    echo "BYPASS FOUND: $payload"
  fi
done

# SQLi Bypass Attempts
SQLI_PAYLOADS=(
  "' OR '1'='1"                          # Original
  "' OR '1'='1'--"                        # Comment
  "' OR 1=1#"                             # MySQL comment
  "'\tOR\t'1'='1"                         # Tab injection
  "' OR ''='"                             # Empty string
  "admin'--"                              # Login bypass
  "1; DROP TABLE users--"                 # Stacked queries
)

for payload in "${SQLI_PAYLOADS[@]}"; do
  curl -s "https://target.com/api/user?id=$payload" -o /dev/null -w "%{http_code}\n"
done
```

### Phase 6: Regression Testing

Check related functionality for similar issues:

```bash
# Test related endpoints
echo "=== Regression Check - Related Endpoints ==="

ENDPOINTS=(
  "/api/user"
  "/api/admin/user"
  "/api/v2/user"
  "/user/profile"
  "/admin/users"
)

for endpoint in "${ENDPOINTS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://target.com${endpoint}?id=1' OR '1'='1")
  echo "$endpoint: $status"
done

# Test same vulnerability type in other parameters
PARAMS=("id" "user_id" "userId" "uid" "account" "profile_id")

for param in "${PARAMS[@]}"; do
  response=$(curl -s "https://target.com/api/data?${param}=1' OR '1'='1")
  echo "Testing $param parameter..."
done
```

### Phase 7: Documentation

Create comprehensive fix verification report:

```markdown
# Vulnerability Retest Report

## Summary

| Field              | Value         |
| ------------------ | ------------- |
| Original Report ID | #12345        |
| Vulnerability Type | SQL Injection |
| Retest Date        | 2024-01-20    |
| Retest Result      | FIXED         |
| Tester             | agent_name    |

## Environment Verification

- Application Version: 2.1.5 (patched)
- Test Environment: Production
- IP Verified: 203.0.113.50

## Original Vulnerability

- Endpoint: /api/user
- Parameter: id
- Payload: `' OR '1'='1`
- Original Response: 200 OK, returned 500 records

## Retest Results

### Direct Replay

- Payload: `' OR '1'='1`
- Response: 400 Bad Request
- Body: "Invalid parameter format"
- Result: **BLOCKED**

### Bypass Attempts

| Payload       | Result      |
| ------------- | ----------- |
| `' OR '1'='1` | 400 Blocked |
| `' OR 1=1--`  | 400 Blocked |
| `admin'--`    | 400 Blocked |

### Regression Testing

| Endpoint        | Status |
| --------------- | ------ |
| /api/user       | Fixed  |
| /api/admin/user | Fixed  |
| /api/v2/user    | Fixed  |

## Conclusion

Vulnerability confirmed FIXED. Input validation implemented
correctly. All tested bypass attempts blocked.

## Evidence

[Screenshot: retest_evidence.png]
[HTTP Capture: retest_burp.xml]
```

## Examples

### Example 1: XSS Retest (Fixed)

**Scenario**: Reflected XSS was reported in search parameter

**Original Vulnerability**:

```http
GET /search?q=<script>alert('XSS')</script> HTTP/1.1
Host: target.com

Response:
<div>Results for: <script>alert('XSS')</script></div>
```

**Retest Commands**:

```bash
# Direct replay
curl -s "https://target.com/search?q=<script>alert('XSS')</script>"

# Output:
<div>Results for: &lt;script&gt;alert('XSS')&lt;/script&gt;</div>
```

**Analysis**:

```bash
# Check encoding
echo "Original: <script>alert('XSS')</script>"
echo "Now: &lt;script&gt;alert('XSS')&lt;/script&gt;"
echo "Result: HTML entities encoded - FIXED"
```

**Verification Result**: FIXED - Input is properly HTML encoded.

---

### Example 2: SQL Injection Retest (Partial Fix)

**Scenario**: SQLi in user lookup endpoint

**Original Vulnerability**:

```http
GET /api/user?id=1' OR '1'='1 HTTP/1.1

Response: 200 OK
{"users": [{"id":1,"name":"admin"}, {"id":2,"name":"user2"}, ...]}
```

**Retest Commands**:

```bash
# Test original payload
curl -s "https://target.com/api/user?id=1' OR '1'='1" | jq

# Output:
{"error": "Invalid input"}

# Test bypass payloads
curl -s "https://target.com/api/user?id=1/**/OR/**/1=1" | jq

# Output:
{"users": [{"id":1,"name":"admin"}, {"id":2,"name":"user2"}, ...]}
```

**Analysis**:

```bash
# Original blocked but bypass works
echo "Original payload: BLOCKED"
echo "Comment bypass: VULNERABLE"
echo "Result: PARTIAL FIX - Bypass exists"
```

**Verification Result**: PARTIAL - Basic payload blocked but SQL comment bypass succeeds.

---

### Example 3: IDOR Retest (Not Fixed)

**Scenario**: IDOR allowing access to other users' documents

**Original Vulnerability**:

```http
GET /api/documents/12345 HTTP/1.1
Authorization: Bearer user_a_token

Response: 200 OK
{"document": "User B's confidential data"}
```

**Retest Commands**:

```bash
# Authenticate as User A
TOKEN=$(curl -s -X POST https://target.com/login \
  -d '{"user":"userA","pass":"test"}' | jq -r '.token')

# Attempt to access User B's document
curl -s "https://target.com/api/documents/12345" \
  -H "Authorization: Bearer $TOKEN" | jq

# Output:
{
  "document": "User B's confidential data",
  "owner": "userB"
}
```

**Analysis**:

```bash
# Still returning other user's data
echo "Expected: 403 Forbidden"
echo "Actual: 200 OK with User B data"
echo "Result: NOT FIXED"
```

**Verification Result**: NOT FIXED - Authorization check still missing.

---

### Example 4: LFI Retest (Fixed with Bypass Found)

**Scenario**: Local file inclusion in file parameter

**Original Vulnerability**:

```http
GET /download?file=../../../../etc/passwd HTTP/1.1

Response: 200 OK
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
```

**Retest Commands**:

```bash
# Original payload
curl -s "https://target.com/download?file=../../../../etc/passwd"
# Output: {"error": "Invalid path"}

# Bypass attempts
curl -s "https://target.com/download?file=....//....//etc/passwd"
# Output: {"error": "Invalid path"}

curl -s "https://target.com/download?file=%2e%2e%2f%2e%2e%2fetc/passwd"
# Output: {"error": "Invalid path"}

curl -s "https://target.com/download?file=/var/www/app/../../../../etc/passwd"
# Output: root:x:0:0:root:/root:/bin/bash
```

**Analysis**:

```bash
# Absolute path bypass found
echo "Relative traversal: BLOCKED"
echo "URL encoding: BLOCKED"
echo "Absolute path base: VULNERABLE"
echo "Result: BYPASS FOUND"
```

**Verification Result**: BYPASS - Fix can be circumvented with absolute path technique.

---

### Example 5: SSRF Retest (Regressed)

**Scenario**: SSRF in URL import feature, previously fixed, now vulnerable again

**Original Fix Date**: 2024-01-01
**Regression Found**: 2024-01-20

**Original Vulnerability**:

```http
POST /api/import HTTP/1.1
{"url": "http://169.254.169.254/latest/meta-data/"}

Response: AWS metadata exposed
```

**Previous Retest (Fixed)**:

```bash
curl -s -X POST "https://target.com/api/import" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# Output (January 5):
{"error": "Internal IP addresses not allowed"}
```

**Current Retest (Regressed)**:

```bash
curl -s -X POST "https://target.com/api/import" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# Output (January 20):
{"data": "ami-id\nami-launch-index\nami-manifest-path..."}
```

**Analysis**:

```bash
# Compare with previous fix verification
echo "January 5 result: BLOCKED (Fixed)"
echo "January 20 result: VULNERABLE (Regressed)"
echo "Possible cause: Code rollback, feature update"
echo "Action: ESCALATE IMMEDIATELY"
```

**Verification Result**: REGRESSED - Previously fixed vulnerability is now exploitable again.

## Tool Integration

### Using Burp Suite for Retest

```python
# Burp Suite Python extension for automated retest
from burp import IBurpExtender, IContextMenuFactory

class BurpExtender(IBurpExtender, IContextMenuFactory):
    def registerExtenderCallbacks(self, callbacks):
        self._callbacks = callbacks
        self._helpers = callbacks.getHelpers()
        callbacks.registerContextMenuFactory(self)

    def createMenuItems(self, invocation):
        return [JMenuItem("Retest Vulnerability",
                actionPerformed=lambda e: self.retest(invocation))]

    def retest(self, invocation):
        messages = invocation.getSelectedMessages()
        for message in messages:
            # Replay request and compare
            response = self._callbacks.makeHttpRequest(
                message.getHttpService(),
                message.getRequest())
            # Analyze response differences
```

### Using ffuf for Parameter Retest

```bash
# Retest multiple payloads against fixed endpoint
ffuf -u "https://target.com/api/user?id=FUZZ" \
  -w payloads.txt \
  -mc all \
  -o retest_results.json

# Compare results
jq '.results[] | select(.status == 200)' retest_results.json
```

### Using nuclei for Regression Testing

```yaml
# retest-template.yaml
id: retest-sqli-user-endpoint

info:
  name: SQLi Retest - User Endpoint
  author: triage-agent
  severity: high

requests:
  - method: GET
    path:
      - "{{BaseURL}}/api/user?id=1' OR '1'='1"

    matchers-condition: and
    matchers:
      - type: status
        status:
          - 200

      - type: word
        words:
          - '"users":'
          - '"id":'
        condition: and
```

```bash
# Run regression test
nuclei -t retest-template.yaml -u https://target.com -o regression.txt
```

## Error Handling

| Issue                     | Cause                     | Resolution                        |
| ------------------------- | ------------------------- | --------------------------------- |
| Same response as before   | Testing wrong environment | Verify version, clear cache       |
| 403 on all requests       | WAF blocking tester IP    | Use different IP, check whitelist |
| Timeout on requests       | Rate limiting active      | Add delays between requests       |
| SSL errors                | Certificate changed       | Update CA bundle, check cert      |
| Authentication failures   | Session expired           | Re-authenticate, fresh tokens     |
| Different response format | API version changed       | Check API documentation           |
| Redirect to login         | Session requirements      | Include valid auth headers        |

## Cache Busting Techniques

```bash
# Ensure you're not getting cached responses

# Add cache-busting parameter
curl "https://target.com/endpoint?cachebust=$(date +%s)"

# Force no-cache headers
curl -H "Cache-Control: no-cache" \
     -H "Pragma: no-cache" \
     "https://target.com/endpoint"

# Clear CDN cache (if possible)
curl -X PURGE "https://target.com/endpoint"

# Use unique request identifier
curl -H "X-Request-ID: $(uuidgen)" "https://target.com/endpoint"
```

## Fix Verification Checklist

### Before Retesting

- [ ] Confirmed patch deployment date/time
- [ ] Verified correct environment (prod/staging)
- [ ] Cleared all local and proxy caches
- [ ] Have original vulnerability documentation
- [ ] Fresh authentication credentials
- [ ] Baseline responses saved

### During Retesting

- [ ] Direct replay of original PoC
- [ ] Multiple bypass attempts tested
- [ ] Response comparison documented
- [ ] Related endpoints checked (regression)
- [ ] Different user contexts tested

### After Retesting

- [ ] Clear determination: Fixed/Partial/Not Fixed/Bypass/Regressed
- [ ] Evidence captured (screenshots, HTTP logs)
- [ ] Report updated with retest results
- [ ] Timeline documented
- [ ] Next steps determined

## Platform-Specific Workflows

### HackerOne Retest Flow

1. Navigate to report marked for retest
2. Execute verification tests
3. Update report with findings
4. Select "Request Retest" or "Close as Resolved"
5. Include evidence of fix verification

### Bugcrowd Retest Flow

1. Access submission needing verification
2. Perform retest procedures
3. Update submission status
4. Provide fix confirmation or escalation

### Synack Red Team

1. Access mission retest queue
2. Verify fix implementation
3. Submit verification report
4. Update vulnerability status

## Output Format

### Fix Verification JSON

```json
{
  "retest_id": "RT-2024-001",
  "original_vuln_id": "VULN-12345",
  "retest_date": "2024-01-20T14:30:00Z",
  "target": "https://target.com/api/user",
  "vulnerability_type": "SQL Injection",
  "retest_result": "FIXED",
  "tests_performed": [
    {
      "test_type": "direct_replay",
      "payload": "' OR '1'='1",
      "original_response": "200 OK - Data returned",
      "current_response": "400 Bad Request",
      "result": "blocked"
    },
    {
      "test_type": "bypass_attempt",
      "payload": "' OR 1=1--",
      "response": "400 Bad Request",
      "result": "blocked"
    }
  ],
  "regression_tests": [
    { "endpoint": "/api/admin/user", "result": "fixed" },
    { "endpoint": "/api/v2/user", "result": "fixed" }
  ],
  "evidence": ["retest_screenshot.png", "http_capture.har"],
  "conclusion": "Vulnerability confirmed fixed. Input validation implemented.",
  "tester": "triage-agent"
}
```

## References

- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- OWASP Vulnerability Disclosure: https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html
- NIST SP 800-40 Rev 4 Patch Management: https://csrc.nist.gov/pubs/sp/800/40/r4/final
- HackerOne Retest Documentation: https://docs.hackerone.com/
- Bugcrowd Verification Guidelines: https://www.bugcrowd.com/
