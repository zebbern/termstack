---
name: js-analysis
description: Analyze JavaScript files to discover hidden endpoints, API keys, secrets, and sensitive data. Use when testing web applications, when user mentions JavaScript analysis, or when looking for hidden API endpoints.
tags:
  - security
  - javascript
  - analysis
  - api-keys
  - secrets
  - endpoints
triggers:
  - analyze javascript
  - js analysis
  - find api keys
  - javascript secrets
  - js endpoints
---

# js-analysis

## When to Use

- Need to discover hidden API endpoints from JavaScript files
- User mentions JavaScript analysis or JS file scanning
- Looking for API keys, tokens, or secrets in client-side code
- Analyzing single-page applications (SPAs)
- Reverse engineering frontend applications
- Finding undocumented API routes and parameters

## Quick Start

Extract endpoints from a JavaScript file:

```bash
python linkfinder.py -i https://example.com/app.js -o cli
```

Find secrets in JavaScript files:

```bash
python SecretFinder.py -i https://example.com/app.js -o cli
```

## Step-by-Step Process

### Step 1: Identify JavaScript Files

**Methods to Find JS Files:**

```bash
# From page source
curl -s https://example.com | grep -oE 'src="[^"]*\.js"' | sed 's/src="//;s/"$//'

# Using browser dev tools
# Network tab > Filter by JS

# From Burp proxy history
# Filter by file extension .js

# From wayback machine
waybackurls example.com | grep "\.js$" | sort -u

# Using gau
gau example.com | grep "\.js$" | sort -u
```

**Common JS File Locations:**

```
/static/js/
/assets/js/
/dist/
/build/
/bundle.js
/app.js
/main.js
/vendor.js
/chunk-*.js
```

### Step 2: LinkFinder - Endpoint Discovery

**Basic Usage:**

```bash
# Scan single JS file
python linkfinder.py -i https://example.com/app.js -o results.html

# CLI output (fast mode)
python linkfinder.py -i https://example.com/app.js -o cli

# Save to file
python linkfinder.py -i https://example.com/app.js -o cli > endpoints.txt
```

**Scan Entire Domain:**

```bash
# Enumerate all JS files on domain
python linkfinder.py -i https://example.com -d -o cli

# With output file
python linkfinder.py -i https://example.com -d -o domain_endpoints.html
```

**Filter Results:**

```bash
# Only API endpoints
python linkfinder.py -i https://example.com/app.js -r "^/api/" -o cli

# Admin routes
python linkfinder.py -i https://example.com/app.js -r "/admin" -o cli

# User-related endpoints
python linkfinder.py -i https://example.com/app.js -r "/user|/account|/profile" -o cli
```

**Scan Local Files:**

```bash
# Single file
python linkfinder.py -i /path/to/app.js -o cli

# Folder with wildcard
python linkfinder.py -i '/path/to/js/*.js' -o results.html

# All JS files recursively (with find)
find /path/to/js -name "*.js" -exec python linkfinder.py -i {} -o cli \;
```

**Burp Suite Integration:**

```bash
# Export from Burp: Target > Save selected items
python linkfinder.py -i burpfile.xml -b -o results.html
```

### Step 3: SecretFinder - Secret Discovery

**Basic Usage:**

```bash
# Scan single JS file
python SecretFinder.py -i https://example.com/app.js -o cli

# HTML output
python SecretFinder.py -i https://example.com/app.js -o results.html

# Save to file
python SecretFinder.py -i https://example.com/app.js -o cli > secrets.txt
```

**Scan Entire Domain:**

```bash
# Extract all JS files and scan
python SecretFinder.py -i https://example.com -e -o cli
```

**With Authentication:**

```bash
# Add cookies
python SecretFinder.py -i https://example.com/app.js -c "session=abc123; token=xyz" -o cli

# Add headers
python SecretFinder.py -i https://example.com/app.js -H "Authorization:Bearer token\nX-Custom:value" -o cli

# With proxy
python SecretFinder.py -i https://example.com/app.js -p 127.0.0.1:8080 -o cli
```

**Filter JS Files:**

```bash
# Ignore specific files
python SecretFinder.py -i https://example.com -e -g "jquery;bootstrap;google" -o cli

# Process only specific files
python SecretFinder.py -i https://example.com -e -n "app.js;main.js;bundle.js" -o cli
```

**Custom Regex:**

```bash
# Use custom pattern
python SecretFinder.py -i https://example.com/app.js -r 'api_key=[a-zA-Z0-9]{32}' -o cli
```

**Burp Suite Integration:**

```bash
# Process Burp export
python SecretFinder.py -i burpfile.xml -b -o results.html
```

### Step 4: Scan Local JS Files

**Download JS Files First:**

```bash
# Download single file
curl -o app.js https://example.com/static/js/app.js

# Download multiple files
while read url; do
  filename=$(basename "$url")
  curl -o "js_files/$filename" "$url"
done < js_urls.txt
```

**Scan Downloaded Files:**

```bash
# LinkFinder on folder
python linkfinder.py -i 'js_files/*.js' -o cli

# SecretFinder on folder
python SecretFinder.py -i js_files/ -o cli
```

### Step 5: Analyze Webpack/Bundled Files

**Extract Source Maps:**

```bash
# Check for source map reference
grep -r "sourceMappingURL" *.js

# Download source map if available
curl -o app.js.map https://example.com/static/js/app.js.map
```

**Unpack Source Maps:**

```bash
# Using unwebpack-sourcemap
unwebpack-sourcemap app.js.map -o unpacked/

# Scan unpacked files
python linkfinder.py -i 'unpacked/**/*.js' -o cli
python SecretFinder.py -i unpacked/ -o cli
```

**Beautify Minified JS:**

```bash
# Using js-beautify
js-beautify -f minified.js -o beautified.js

# Then scan
python linkfinder.py -i beautified.js -o cli
```

### Step 6: Combine with Other Tools

**With gau/waybackurls:**

```bash
# Get historical JS files
gau example.com | grep "\.js$" | sort -u > js_urls.txt

# Scan each URL
while read url; do
  echo "=== $url ===" >> results.txt
  python linkfinder.py -i "$url" -o cli >> results.txt 2>/dev/null
done < js_urls.txt
```

**With httpx:**

```bash
# Verify JS files exist
cat js_urls.txt | httpx -silent -mc 200 > valid_js.txt

# Scan valid files
while read url; do
  python SecretFinder.py -i "$url" -o cli
done < valid_js.txt
```

### Step 7: Parse and Process Results

**Extract Unique Endpoints:**

```bash
# From LinkFinder CLI output
python linkfinder.py -i https://example.com/app.js -o cli | sort -u > endpoints.txt

# Filter by pattern
cat endpoints.txt | grep -E "^/api/" > api_endpoints.txt
```

**Build Full URLs:**

```bash
# Prepend base URL
cat endpoints.txt | sed 's|^|https://example.com|' > full_urls.txt
```

**Test Endpoints:**

```bash
# Check which endpoints exist
cat full_urls.txt | httpx -silent -mc 200,201,301,302,401,403 > valid_endpoints.txt
```

### Step 8: Document Findings

**Report Format:**

```markdown
## JavaScript Analysis Results

### Target: example.com

### JS Files Analyzed

- https://example.com/static/js/app.js
- https://example.com/static/js/vendor.js

### Endpoints Discovered

| Endpoint          | Method | Parameters |
| ----------------- | ------ | ---------- |
| /api/users        | GET    | id, limit  |
| /api/admin/config | GET    | -          |

### Secrets Found

| Type    | Value       | File      |
| ------- | ----------- | --------- |
| AWS Key | AKIA...     | app.js    |
| API Key | sk*live*... | vendor.js |
```

## Secret Patterns Reference

### Built-in SecretFinder Patterns

| Pattern Name          | Regex                                                     | Risk     |
| --------------------- | --------------------------------------------------------- | -------- |
| google_api            | `AIza[0-9A-Za-z-_]{35}`                                   | High     |
| google_oauth          | `ya29\.[0-9A-Za-z\-_]+`                                   | High     |
| aws_access_key        | `A[SK]IA[0-9A-Z]{16}`                                     | Critical |
| aws_url               | `s3\.amazonaws.com`                                       | Medium   |
| facebook_access_token | `EAACEdEose0cBA[0-9A-Za-z]+`                              | High     |
| authorization_bearer  | `bearer\s*[a-zA-Z0-9_\-\.=:_\+\/]+`                       | High     |
| authorization_basic   | `basic\s*[a-zA-Z0-9=:_\+\/-]+`                            | High     |
| stripe_api            | `sk_live_[0-9a-zA-Z]{24}`                                 | Critical |
| twilio_api            | `SK[0-9a-fA-F]{32}`                                       | High     |
| mailgun_api           | `key-[0-9a-zA-Z]{32}`                                     | High     |
| json_web_token        | `ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*` | High     |
| rsa_private_key       | `-----BEGIN RSA PRIVATE KEY-----`                         | Critical |

### Custom Patterns to Add

```python
# Add to SecretFinder.py _regex dictionary
'slack_token': r'xox[baprs]-[a-zA-Z0-9-]+',
'github_token': r'ghp_[a-zA-Z0-9]{36}',
'discord_token': r'[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}',
'heroku_api': r'[h|H][e|E][r|R][o|O][k|K][u|U].*[0-9A-F]{8}-[0-9A-F]{4}',
'firebase_url': r'https://[a-z0-9-]+\.firebaseio\.com',
```

## Examples

### Example 1: Basic JS Endpoint Discovery

**Scenario:** Extract all endpoints from a single JS file

**Command:**

```bash
python linkfinder.py -i https://acme.com/static/app.js -o cli
```

**Output:**

```
/api/v1/users
/api/v1/products
/api/v1/orders/{id}
/admin/dashboard
/graphql
/socket.io
/health
/api/internal/debug
```

### Example 2: Domain-Wide Secret Scan

**Scenario:** Find all secrets across a domain's JS files

**Command:**

```bash
python SecretFinder.py -i https://acme.com -e -g "jquery;bootstrap;analytics" -o cli
```

**Output:**

```
[google_api] AIzaSyC3example_api_key_here123
  File: https://acme.com/static/js/maps.js

[stripe_api] stripe_live_example_key_redacted
  File: https://acme.com/static/js/checkout.js

[json_web_token] eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  File: https://acme.com/static/js/auth.js
```

### Example 3: Filter API Endpoints

**Scenario:** Extract only API-related endpoints

**Command:**

```bash
python linkfinder.py -i https://acme.com -d -r "^/api/|graphql|/v[0-9]/" -o cli
```

**Output:**

```
/api/v1/auth/login
/api/v1/auth/register
/api/v2/users/me
/graphql
/api/internal/metrics
```

### Example 4: Authenticated Scan

**Scenario:** Scan JS files requiring authentication

**Command:**

```bash
python SecretFinder.py -i https://acme.com/dashboard -e \
  -c "session_id=abc123; auth_token=xyz789" \
  -H "Authorization:Bearer eyJhbGc..." \
  -o cli
```

**Output:**

```
[aws_access_key] AKIAIOSFODNN7EXAMPLE
  File: https://acme.com/static/js/admin.js

[authorization_bearer] Bearer admin_super_secret_token
  File: https://acme.com/static/js/config.js
```

## Error Handling

| Error              | Cause                     | Resolution                    |
| ------------------ | ------------------------- | ----------------------------- |
| Connection refused | Target unreachable        | Check URL, try with proxy     |
| 403 Forbidden      | WAF or access control     | Add valid cookies/headers     |
| SSL Error          | Certificate issue         | Use `-k` or add CA cert       |
| Empty output       | No patterns matched       | Try with `-r` custom regex    |
| Timeout            | Large file or slow server | Download file locally first   |
| Encoding error     | Non-UTF8 file             | Download and convert encoding |

## Tool Reference

### LinkFinder Flags

| Flag            | Description                      |
| --------------- | -------------------------------- |
| `-i, --input`   | Input URL, file, or folder       |
| `-o, --output`  | cli for stdout, or filename.html |
| `-r, --regex`   | Filter results with regex        |
| `-d, --domain`  | Analyze entire domain            |
| `-b, --burp`    | Parse Burp export file           |
| `-c, --cookies` | Add cookies to requests          |

### SecretFinder Flags

| Flag            | Description                      |
| --------------- | -------------------------------- |
| `-i, --input`   | Input URL, file, or folder       |
| `-o, --output`  | cli for stdout, or filename.html |
| `-e, --extract` | Extract all JS from page         |
| `-r, --regex`   | Custom regex pattern             |
| `-b, --burp`    | Parse Burp export file           |
| `-c, --cookie`  | Add cookies                      |
| `-H, --headers` | Add headers (Name:Value\n)       |
| `-p, --proxy`   | Set proxy (host:port)            |
| `-g, --ignore`  | Ignore JS files (string;string)  |
| `-n, --only`    | Process only specific JS files   |

## Best Practices

1. **Start with domain scan** - Use `-d` or `-e` to find all JS files
2. **Filter noise** - Ignore vendor libraries (jquery, bootstrap)
3. **Use CLI output** - Faster and easier to process
4. **Combine tools** - LinkFinder for endpoints, SecretFinder for secrets
5. **Check source maps** - May reveal original source code
6. **Test found endpoints** - Verify with httpx or curl
7. **Save results** - Document all findings for reporting
8. **Scan historical** - Use wayback/gau for old JS versions

## References

- [LinkFinder GitHub](https://github.com/GerbenJavado/LinkFinder)
- [SecretFinder GitHub](https://github.com/m4ll0k/SecretFinder)
- [JS Beautifier](https://github.com/beautify-web/js-beautify)
- [OWASP Testing Guide - JS Analysis](https://owasp.org/www-project-web-security-testing-guide/)
