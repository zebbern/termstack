---
name: param-miner
description: Discover hidden HTTP parameters in web applications that could reveal hidden functionality or vulnerabilities. Use when testing APIs, when looking for hidden parameters like admin or debug, or when the user mentions parameter discovery.
tags:
  - security
  - parameters
  - hidden-params
  - discovery
  - http
triggers:
  - hidden parameters
  - param miner
  - parameter discovery
  - find hidden params
---

# param-miner

## When to Use

- Need to discover hidden query parameters
- Testing APIs for undocumented parameters
- Looking for debug or admin parameters
- User mentions parameter fuzzing or discovery
- Testing for parameter pollution vulnerabilities
- Finding hidden functionality in web applications

## Quick Start

Discover parameters with Arjun:

```bash
arjun -u https://example.com/api/users
```

Fast parameter discovery with x8:

```bash
x8 -u "https://example.com/" -w params.txt
```

## Step-by-Step Process

### Step 1: Choose the Right Tool

**Tool Selection Guide:**

| Tool  | Speed    | Best For                               |
| ----- | -------- | -------------------------------------- |
| Arjun | Moderate | Ease of use, built-in wordlist         |
| x8    | Fast     | Large-scale scanning, custom templates |

### Step 2: Arjun - Basic Parameter Discovery

**Single URL Scan:**

```bash
# Basic GET parameter discovery
arjun -u https://example.com/api/endpoint

# Specify HTTP method
arjun -u https://example.com/api/endpoint -m POST

# JSON body parameters
arjun -u https://example.com/api/endpoint -m JSON

# XML body parameters
arjun -u https://example.com/api/endpoint -m XML
```

**Multiple URLs:**

```bash
# From file
arjun -i urls.txt

# Multiple URLs inline
arjun -u https://example.com/api/v1 -u https://example.com/api/v2
```

**Custom Wordlist:**

```bash
# Use custom parameter wordlist
arjun -u https://example.com/api -w custom_params.txt

# Combine with default wordlist
arjun -u https://example.com/api -w custom_params.txt --include
```

### Step 3: Arjun - Advanced Options

**With Authentication:**

```bash
# Add headers
arjun -u https://example.com/api --headers "Authorization: Bearer token123"

# Add cookies
arjun -u https://example.com/api --headers "Cookie: session=abc123"

# Multiple headers
arjun -u https://example.com/api --headers "Auth: token" "X-Custom: value"
```

**Output Options:**

```bash
# JSON output
arjun -u https://example.com/api -oJ output.json

# Text output
arjun -u https://example.com/api -oT output.txt

# Burp Suite format
arjun -u https://example.com/api -oB output.xml
```

**Rate Limiting:**

```bash
# Delay between requests (seconds)
arjun -u https://example.com/api -d 2

# Timeout per request
arjun -u https://example.com/api -t 10

# Number of threads
arjun -u https://example.com/api --threads 5
```

**Import from Burp:**

```bash
# Import Burp Suite exported requests
arjun -i burp_export.xml --import-burp
```

### Step 4: x8 - Basic Parameter Discovery

**Query Parameter Discovery:**

```bash
# Basic scan
x8 -u "https://example.com/" -w params.txt

# With existing parameters
x8 -u "https://example.com/?id=1" -w params.txt

# Custom injection point
x8 -u "https://example.com/?%s" -w params.txt
```

**Body Parameter Discovery:**

```bash
# POST with URL-encoded body
x8 -u "https://example.com/" -X POST -w params.txt

# POST with JSON body
x8 -u "https://example.com/" -X POST -b '{"x":{%s}}' -w params.txt

# Custom body template
x8 -u "https://example.com/" -X POST -b 'data=%s' -w params.txt
```

**Header Discovery:**

```bash
# Discover hidden headers
x8 -u "https://example.com" --headers -w headers.txt

# Target specific header value
x8 -u "https://example.com" --headers -H "Cookie: %s" -w params.txt

# X-Forwarded-For variations
x8 -u "https://example.com" --headers -H "X-Forwarded-For: %s" -w ips.txt
```

### Step 5: x8 - Advanced Options

**Multiple URLs:**

```bash
# Parallel URL checking
x8 -u "https://example1.com/" "https://example2.com/" -W 0 -w params.txt

# From file
x8 -u urls.txt -w params.txt
```

**Custom Templates:**

```bash
# Array parameter format
x8 -u "https://example.com/" --param-template "user[%k]=%v" -w params.txt

# Nested JSON
x8 -u "https://example.com/" -b '{"data":{"%k":"%v"}}' -w params.txt
```

**Request File:**

```bash
# Use raw request file
x8 -r request.txt -w params.txt --proto https --port 443

# With proxy
x8 -r request.txt -w params.txt -x http://127.0.0.1:8080
```

**Output Options:**

```bash
# Standard output
x8 -u "https://example.com/" -w params.txt -o results.txt

# JSON output
x8 -u "https://example.com/" -w params.txt -O json -o results.json

# URL format
x8 -u "https://example.com/" -w params.txt -O url -o results.txt
```

**Performance Tuning:**

```bash
# Concurrency per URL
x8 -u "https://example.com/" -w params.txt -c 5

# Delay between requests (ms)
x8 -u "https://example.com/" -w params.txt -d 100

# Request timeout
x8 -u "https://example.com/" -w params.txt --timeout 30
```

### Step 6: Parameter Verification

**x8 Verification:**

```bash
# Verify found parameters
x8 -u "https://example.com/" -w params.txt --verify

# Replay through proxy
x8 -u "https://example.com/" -w params.txt --replay-proxy http://127.0.0.1:8080

# All found params in one replay request
x8 -u "https://example.com/" -w params.txt --replay-proxy http://127.0.0.1:8080 --replay-once
```

**Recursion:**

```bash
# Recursive parameter discovery
x8 -u "https://example.com/" -w params.txt --recursion-depth 2
```

### Step 7: Common Parameter Patterns

**Custom Parameter Values:**

```bash
# x8 custom parameters (admin, debug, etc.)
x8 -u "https://example.com/" -w params.txt --custom-parameters "admin debug test dev"

# Custom values to test
x8 -u "https://example.com/" -w params.txt --custom-values "true false 1 0 yes no"
```

**Built-in Special Parameters:**

Default custom parameters checked by x8:

- admin, bot, captcha, debug
- disable, encryption, env, show
- sso, test, waf

### Step 8: Burp Suite Integration

**x8 with Burp (via Custom Send To):**

1. Install "Custom Send To" extension in Burp
2. Configure command:

```bash
x8 --progress-bar-len 20 -c 3 -r %R -w /path/to/wordlist --proto %T --port %P
```

3. Right-click request > Send to > x8

**Export Results to Burp:**

```bash
# Arjun Burp export
arjun -u https://example.com/api -oB burp_import.xml

# Import in Burp: Target > Import from file
```

## Parameter Wordlists

### Recommended Wordlists

| Source          | Size    | Best For            |
| --------------- | ------- | ------------------- |
| Arjun default   | 25,890  | General purpose     |
| SecLists params | Various | Comprehensive       |
| samlists        | Large   | CommonCrawl derived |
| Param Miner     | Headers | Header discovery    |

**Download Locations:**

```bash
# SecLists
git clone https://github.com/danielmiessler/SecLists

# samlists
git clone https://github.com/the-xentropy/samlists

# Arjun built-in
# Located at: arjun/db/
```

### Custom Wordlist Creation

```bash
# Extract params from JS files
cat js_files/*.js | grep -oE '[a-zA-Z_][a-zA-Z0-9_]*=' | sed 's/=//' | sort -u > custom_params.txt

# Combine wordlists
cat wordlist1.txt wordlist2.txt | sort -u > combined.txt
```

## Examples

### Example 1: Basic GET Parameter Discovery

**Scenario:** Find hidden parameters on an API endpoint

**Command:**

```bash
arjun -u https://api.acme.com/v1/users -m GET
```

**Output:**

```
[*] Probing the target for stability
[*] Analysing HTTP response for anomalies
[*] Analysing HTTP response for potential parameter names
[*] Logicforcing: 50-60 requests
[+] Valid parameters found: admin, debug, verbose, fields, expand
```

### Example 2: POST JSON Parameter Discovery

**Scenario:** Find hidden JSON body parameters

**Command:**

```bash
x8 -u "https://api.acme.com/v1/login" -X POST -b '{"username":"test","password":"test",%s}' -w params.txt -c 3
```

**Output:**

```
[+] https://api.acme.com/v1/login
    Method: POST
    Parameters found:
    - admin (reflected)
    - mfa_bypass (response changed)
    - debug (response code changed)
```

### Example 3: Header Discovery

**Scenario:** Find hidden headers that affect application behavior

**Command:**

```bash
x8 -u "https://acme.com/admin" --headers -w SecLists/Discovery/Web-Content/BurpSuite-ParamMiner/lowercase-headers -c 5
```

**Output:**

```
[+] https://acme.com/admin
    Headers found:
    - x-forwarded-for (response changed)
    - x-real-ip (response changed)
    - x-debug (response code: 200 -> 500)
```

### Example 4: Multi-URL Parallel Scan

**Scenario:** Scan multiple endpoints simultaneously

**Command:**

```bash
x8 -u urls.txt -W 0 -w params.txt -c 2 -O json -o results.json
```

**Output (results.json):**

```json
{
  "https://acme.com/api/v1/users": {
    "method": "GET",
    "parameters": ["admin", "include_deleted", "verbose"]
  },
  "https://acme.com/api/v1/orders": {
    "method": "GET",
    "parameters": ["status", "debug"]
  }
}
```

## Error Handling

| Error               | Cause              | Resolution                        |
| ------------------- | ------------------ | --------------------------------- |
| Rate limited        | Too many requests  | Add delay with `-d` flag          |
| Timeout             | Slow server        | Increase timeout value            |
| Connection refused  | Blocked IP         | Use proxy or reduce concurrency   |
| WAF blocking        | Security rules     | Try different wordlist, add delay |
| No parameters found | Clean endpoint     | Try different HTTP methods        |
| False positives     | Unstable responses | Use `--verify` flag               |

## Tool Reference

### Arjun Flags

| Flag             | Description                    |
| ---------------- | ------------------------------ |
| `-u, --url`      | Target URL                     |
| `-i, --import`   | Import URLs from file          |
| `-m, --method`   | HTTP method: GET/POST/JSON/XML |
| `-w, --wordlist` | Custom wordlist file           |
| `--headers`      | Custom headers                 |
| `-d, --delay`    | Delay between requests         |
| `-t, --timeout`  | Request timeout                |
| `--threads`      | Number of threads              |
| `-oJ`            | JSON output                    |
| `-oT`            | Text output                    |
| `-oB`            | Burp Suite XML output          |
| `--include`      | Include default wordlist       |
| `--stable`       | Prefer stability over speed    |

### x8 Flags

| Flag                  | Description               |
| --------------------- | ------------------------- |
| `-u, --url`           | Target URL(s) or file     |
| `-w, --wordlist`      | Parameter wordlist        |
| `-X, --method`        | HTTP method(s)            |
| `-b, --body`          | Request body template     |
| `-H`                  | Custom headers            |
| `-c`                  | Concurrency per URL       |
| `-W, --workers`       | Concurrent URL checks     |
| `-d, --delay`         | Delay in milliseconds     |
| `--timeout`           | Request timeout           |
| `-o, --output`        | Output file               |
| `-O, --output-format` | standard/json/url/request |
| `--headers`           | Header discovery mode     |
| `--verify`            | Verify found parameters   |
| `--encode`            | URL encode parameters     |
| `-r, --request`       | Raw request file          |
| `-x, --proxy`         | Proxy server              |
| `--replay-proxy`      | Replay proxy for results  |
| `--recursion-depth`   | Recursive discovery depth |
| `--custom-parameters` | Special params to check   |

## Best Practices

1. **Start with defaults** - Arjun's built-in wordlist catches common params
2. **Use appropriate method** - Match HTTP method to endpoint behavior
3. **Respect rate limits** - Add delays for production systems
4. **Verify findings** - Use `--verify` to confirm real parameters
5. **Try multiple methods** - Some params only work with POST/PUT
6. **Check headers too** - Hidden headers can bypass security
7. **Combine tools** - Use Arjun for quick scan, x8 for thorough check
8. **Document findings** - Export results for reporting

## References

- [Arjun GitHub](https://github.com/s0md3v/Arjun)
- [Arjun Wiki](https://github.com/s0md3v/Arjun/wiki)
- [x8 GitHub](https://github.com/Sh1Yo/x8)
- [x8 Documentation](https://sh1yo.art/x8docs/)
- [SecLists Parameters](https://github.com/danielmiessler/SecLists/tree/master/Discovery/Web-Content)
- [Param Miner (Burp)](https://portswigger.net/bappstore/17d2949a985c4b7ca092728dba871943)
