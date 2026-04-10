---
name: header-analysis
description: Analyze HTTP security headers for misconfigurations and missing security controls using httpx. Use when security header assessment is needed, when checking for clickjacking or XSS protections, when validating OWASP compliance, or when identifying information disclosure.
tags:
  - security
  - http-headers
  - csp
  - hsts
  - security-headers
triggers:
  - http headers
  - security headers
  - header analysis
  - csp check
  - hsts check
  - missing headers
---

# header-analysis

## When to Use

- When security header assessment is needed on web targets
- When checking for missing security headers (HSTS, CSP, X-Frame-Options)
- When identifying information disclosure via Server/X-Powered-By headers
- When validating compliance with OWASP Secure Headers recommendations
- When analyzing CORS configuration for security issues
- When reviewing Content Security Policy effectiveness
- When assessing TLS/SSL security configuration
- When bulk scanning targets for header security posture

## Quick Start

Extract all response headers from a target:

```bash
httpx -u https://example.com -include-response-header -json
```

## Step-by-Step Process

1. **Install httpx** (if needed):

   ```bash
   go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
   ```

2. **Extract Headers** from target:

   ```bash
   httpx -u https://target.com -include-response-header -json -o headers.json
   ```

3. **Parse Security Headers** using jq:

   ```bash
   cat headers.json | jq '.header'
   ```

4. **Check for Missing Headers**:

   ```bash
   cat headers.json | jq 'select(.header["strict-transport-security"] == null)'
   ```

5. **Generate Report** of findings:
   ```bash
   httpx -l targets.txt -include-response-header -json -o full-scan.json
   ```

## Examples

### Example 1: Basic Header Extraction

**Scenario:** Extract all HTTP response headers from a single target

**Command:**

```bash
httpx -u https://example.com -include-response-header -json -silent
```

**Output:**

```json
{
  "url": "https://example.com",
  "status_code": 200,
  "header": {
    "content-type": ["text/html; charset=UTF-8"],
    "server": ["nginx/1.18.0"],
    "strict-transport-security": ["max-age=31536000; includeSubDomains"],
    "x-frame-options": ["SAMEORIGIN"],
    "x-content-type-options": ["nosniff"]
  }
}
```

### Example 2: Bulk Header Analysis

**Scenario:** Scan multiple targets for security headers

**Command:**

```bash
httpx -l targets.txt -include-response-header -json -o bulk-headers.json -threads 50
```

**Output:**

```
https://app1.example.com [200]
https://app2.example.com [200]
https://api.example.com [200]
```

### Example 3: Check for Missing HSTS

**Scenario:** Find targets missing Strict-Transport-Security header

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["strict-transport-security"] == null) | .url'
```

**Output:**

```
https://insecure-app.example.com
https://legacy.example.com
https://dev.example.com
```

### Example 4: Check for Missing CSP

**Scenario:** Identify targets without Content-Security-Policy

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["content-security-policy"] == null) | .url'
```

**Output:**

```
https://app-without-csp.example.com
https://old-portal.example.com
```

### Example 5: Check for Missing X-Frame-Options

**Scenario:** Find targets vulnerable to clickjacking

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["x-frame-options"] == null and .header["content-security-policy"] == null) | .url'
```

**Output:**

```
https://vulnerable-to-clickjacking.example.com
```

### Example 6: Server Version Disclosure

**Scenario:** Find targets leaking server version information

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header.server[0] | test("/[0-9]")) | {url, server: .header.server[0]}'
```

**Output:**

```json
{"url": "https://app1.example.com", "server": "nginx/1.18.0"}
{"url": "https://app2.example.com", "server": "Apache/2.4.41"}
{"url": "https://api.example.com", "server": "Microsoft-IIS/10.0"}
```

### Example 7: X-Powered-By Detection

**Scenario:** Find targets with X-Powered-By header revealing technology

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["x-powered-by"] != null) | {url, powered_by: .header["x-powered-by"][0]}'
```

**Output:**

```json
{"url": "https://php-app.example.com", "powered_by": "PHP/7.4.3"}
{"url": "https://express-app.example.com", "powered_by": "Express"}
{"url": "https://aspnet-app.example.com", "powered_by": "ASP.NET"}
```

### Example 8: CORS Misconfiguration Check

**Scenario:** Find permissive CORS configurations

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["access-control-allow-origin"][0] == "*") | .url'
```

**Output:**

```
https://api-with-wildcard-cors.example.com
https://public-api.example.com
```

### Example 9: CSP Policy Extraction

**Scenario:** Extract and review Content-Security-Policy values

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["content-security-policy"] != null) | {url, csp: .header["content-security-policy"][0]}'
```

**Output:**

```json
{
  "url": "https://secure-app.example.com",
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
}
```

### Example 10: Weak CSP Detection

**Scenario:** Find CSP policies with unsafe-inline or unsafe-eval

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["content-security-policy"][0] | test("unsafe-inline|unsafe-eval")) | {url, csp: .header["content-security-policy"][0]}'
```

**Output:**

```json
{
  "url": "https://weak-csp-app.example.com",
  "csp": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
}
```

### Example 11: HSTS Configuration Analysis

**Scenario:** Extract and analyze HSTS header values

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["strict-transport-security"] != null) | {url, hsts: .header["strict-transport-security"][0]}'
```

**Output:**

```json
{"url": "https://well-configured.example.com", "hsts": "max-age=31536000; includeSubDomains; preload"}
{"url": "https://weak-hsts.example.com", "hsts": "max-age=86400"}
{"url": "https://no-subdomains.example.com", "hsts": "max-age=31536000"}
```

### Example 12: TLS Certificate Analysis

**Scenario:** Extract TLS certificate and protocol information

**Command:**

```bash
httpx -u https://example.com -tls-grab -json -silent
```

**Output:**

```json
{
  "url": "https://example.com",
  "tls": {
    "cipher": "TLS_AES_128_GCM_SHA256",
    "version": "tls1.3",
    "subject_dn": "CN=example.com",
    "issuer_dn": "CN=R3, O=Let's Encrypt, C=US",
    "not_before": "2024-01-01T00:00:00Z",
    "not_after": "2024-04-01T00:00:00Z"
  }
}
```

### Example 13: Referrer-Policy Check

**Scenario:** Identify missing or weak Referrer-Policy headers

**Command:**

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["referrer-policy"] == null or .header["referrer-policy"][0] == "unsafe-url") | .url'
```

**Output:**

```
https://no-referrer-policy.example.com
https://leaky-referrer.example.com
```

### Example 14: Complete Security Header Audit

**Scenario:** Comprehensive check for all OWASP-recommended headers

**Command:**

```bash
httpx -l targets.txt -include-response-header -json -o audit.json

# Then analyze with script:
cat audit.json | jq -r '
  .url as $url |
  {
    url: $url,
    hsts: (.header["strict-transport-security"] != null),
    csp: (.header["content-security-policy"] != null),
    xfo: (.header["x-frame-options"] != null),
    xcto: (.header["x-content-type-options"] != null),
    referrer: (.header["referrer-policy"] != null),
    permissions: (.header["permissions-policy"] != null)
  }'
```

**Output:**

```json
{"url": "https://secure.example.com", "hsts": true, "csp": true, "xfo": true, "xcto": true, "referrer": true, "permissions": true}
{"url": "https://partial.example.com", "hsts": true, "csp": false, "xfo": true, "xcto": true, "referrer": false, "permissions": false}
{"url": "https://insecure.example.com", "hsts": false, "csp": false, "xfo": false, "xcto": false, "referrer": false, "permissions": false}
```

## Error Handling

| Error                   | Cause                         | Resolution                                    |
| ----------------------- | ----------------------------- | --------------------------------------------- |
| `Connection refused`    | Target not reachable          | Verify URL and network connectivity           |
| `TLS handshake error`   | Certificate issues            | Check certificate validity or use `-tls-grab` |
| `Empty header response` | Target doesn't return headers | Verify target responds correctly              |
| `JSON parse error`      | Malformed output              | Ensure `-json` flag is used correctly         |
| `Rate limited`          | Too many requests             | Add `-rate-limit 10` to reduce speed          |
| `Timeout exceeded`      | Slow target response          | Increase timeout with `-timeout 30`           |

## Security Headers Reference

### Headers to ADD (OWASP Recommended)

| Header                         | Recommended Value                     | Purpose                        |
| ------------------------------ | ------------------------------------- | ------------------------------ |
| `Strict-Transport-Security`    | `max-age=31536000; includeSubDomains` | Force HTTPS, prevent downgrade |
| `Content-Security-Policy`      | `default-src 'self'; ...`             | Prevent XSS, injection attacks |
| `X-Frame-Options`              | `DENY` or `SAMEORIGIN`                | Prevent clickjacking           |
| `X-Content-Type-Options`       | `nosniff`                             | Prevent MIME sniffing          |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`     | Control referrer information   |
| `Permissions-Policy`           | `geolocation=(), camera=()`           | Restrict browser features      |
| `Cross-Origin-Opener-Policy`   | `same-origin`                         | Isolate browsing context       |
| `Cross-Origin-Resource-Policy` | `same-origin`                         | Prevent cross-origin reads     |
| `Cross-Origin-Embedder-Policy` | `require-corp`                        | Enable cross-origin isolation  |
| `Cache-Control`                | `no-store, max-age=0`                 | Prevent sensitive data caching |

### Headers to REMOVE (Information Disclosure)

| Header                  | Risk                  | Action                |
| ----------------------- | --------------------- | --------------------- |
| `Server` (with version) | Version disclosure    | Remove or genericize  |
| `X-Powered-By`          | Technology disclosure | Remove entirely       |
| `X-AspNet-Version`      | Framework disclosure  | Remove in web.config  |
| `X-AspNetMvc-Version`   | Framework disclosure  | Remove in global.asax |
| `X-Generator`           | CMS disclosure        | Remove or disable     |
| `X-Drupal-Cache`        | CMS disclosure        | Disable in settings   |
| `X-Runtime`             | Framework disclosure  | Remove entirely       |

## Vulnerability Mapping

| Missing Header              | Vulnerability            | CVSS Impact |
| --------------------------- | ------------------------ | ----------- |
| `X-Frame-Options`           | Clickjacking             | Medium      |
| `Content-Security-Policy`   | XSS, code injection      | High        |
| `Strict-Transport-Security` | MITM, protocol downgrade | High        |
| `X-Content-Type-Options`    | MIME type confusion      | Medium      |
| `Referrer-Policy`           | Information leakage      | Low-Medium  |
| Server version disclosure   | Targeted attacks         | Low-Medium  |
| Permissive CORS             | Cross-origin data theft  | Medium-High |

## httpx Header Options Reference

| Flag                       | Description             | Example                          |
| -------------------------- | ----------------------- | -------------------------------- |
| `-include-response-header` | Include headers in JSON | `-include-response-header -json` |
| `-irh`                     | Short form of above     | `-irh -json`                     |
| `-include-response`        | Include full response   | `-include-response -json`        |
| `-tls-grab`                | Extract TLS/SSL info    | `-tls-grab -json`                |
| `-web-server`              | Show server header      | `-web-server`                    |
| `-extract-regex`           | Extract custom patterns | `-extract-regex "Server: (.+)"`  |
| `-match-string`            | Match header values     | `-match-string "nginx"`          |
| `-filter-string`           | Filter by header value  | `-filter-string "cloudflare"`    |

## jq Parsing Patterns

| Pattern           | Purpose              | Example                                                      |
| ----------------- | -------------------- | ------------------------------------------------------------ |
| Check existence   | Find missing headers | `jq 'select(.header["hsts"] == null) \| .url'`               |
| Extract value     | Get header content   | `jq -r '.header["header-name"][0]'`                          |
| Filter by pattern | Match header values  | `jq 'select(.header["server"][0] \| test("nginx"))'`         |
| Count missing     | Statistics           | `jq -s '[.[] \| select(.header["hsts"] == null)] \| length'` |

## Output Parsing

### Extract All Missing HSTS

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r 'select(.header["strict-transport-security"] == null) | .url' > missing-hsts.txt
```

### Generate Security Score

```bash
cat audit.json | jq -r '
  . as $r |
  (
    (if $r.header["strict-transport-security"] then 1 else 0 end) +
    (if $r.header["content-security-policy"] then 1 else 0 end) +
    (if $r.header["x-frame-options"] then 1 else 0 end) +
    (if $r.header["x-content-type-options"] then 1 else 0 end) +
    (if $r.header["referrer-policy"] then 1 else 0 end)
  ) as $score |
  "\($r.url): \($score)/5 headers present"
'
```

### Export to CSV

```bash
httpx -l targets.txt -include-response-header -json | \
  jq -r '[.url, .header["strict-transport-security"][0] // "MISSING", .header["content-security-policy"][0] // "MISSING"] | @csv' > headers.csv
```

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [httpx Documentation](https://docs.projectdiscovery.io/tools/httpx/)
- [MDN HTTP Headers Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [SecurityHeaders.com](https://securityheaders.com/)
- [OWASP Headers JSON Reference](https://owasp.org/www-project-secure-headers/ci/headers_add.json)
