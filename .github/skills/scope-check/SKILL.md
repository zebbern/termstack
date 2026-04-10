---
name: scope-check
description: Validate targets against bug bounty program scope, verify domain/IP ownership, check wildcard rules, and identify out-of-scope exclusions. Use when validating new targets, checking discovered assets, or before testing any endpoint.
tags:
  - security
  - scope
  - bug-bounty
  - target-validation
  - domain
triggers:
  - check scope
  - bug bounty scope
  - validate target
  - in scope
  - scope validation
---

# scope-check

## When to Use

- Before testing any new target or endpoint
- When discovered subdomains need scope validation
- Validating IP addresses against allowed CIDR ranges
- Checking if third-party services are in scope
- Verifying wildcard domain coverage
- Identifying out-of-scope exclusions

## Quick Start

```bash
# Check domain against wildcard scope
target="api.example.com"
echo "$target" | grep -qE "^[a-z0-9-]+\.example\.com$" && echo "IN SCOPE" || echo "OUT"

# Verify DNS resolves
dig +short "$target" | head -1

# Quick CIDR check
python3 -c "import ipaddress; print(ipaddress.ip_address('192.168.1.50') in ipaddress.ip_network('192.168.1.0/24'))"
```

## Core Concepts

### Scope Types

| Type         | Format         | Example           |
| ------------ | -------------- | ----------------- |
| Exact Domain | `domain.com`   | `api.example.com` |
| Wildcard     | `*.domain.com` | `*.example.com`   |
| CIDR Range   | `ip/prefix`    | `10.0.0.0/24`     |
| Single IP    | `ip`           | `203.0.113.50`    |

### Scope Decision Matrix

| Check                   | IN SCOPE   | OUT OF SCOPE   |
| ----------------------- | ---------- | -------------- |
| Domain matches wildcard | ✅ Proceed | ❌ Stop        |
| IP in CIDR range        | ✅ Proceed | ❌ Stop        |
| Explicitly excluded     | ❌ Stop    | N/A            |
| Third-party service     | ⚠️ Verify  | ❌ Likely out  |
| Private IP (RFC-1918)   | ⚠️ Verify  | ❌ Usually out |

## Step-by-Step Process

### Phase 1: Parse Scope Definition

```bash
cat > scope.json << 'EOF'
{
  "in_scope": {
    "domains": ["*.example.com", "api.example.com"],
    "ips": ["203.0.113.0/24"]
  },
  "out_of_scope": {
    "domains": ["*.staging.example.com", "mail.example.com"],
    "third_party": ["*.cloudfront.net", "*.amazonaws.com"]
  }
}
EOF

jq -r '.in_scope.domains[]' scope.json
jq -r '.out_of_scope.domains[]' scope.json
```

### Phase 2: Domain Validation

```bash
#!/bin/bash
check_domain() {
  local target="$1"
  local exclusions="mail.example.com staging"

  for exc in $exclusions; do
    if [[ "$target" == *"$exc"* ]]; then
      echo "OUT_OF_SCOPE: Matches exclusion"
      return 1
    fi
  done

  if [[ "$target" =~ ^[a-z0-9-]+\.example\.com$ ]]; then
    echo "IN_SCOPE: Matches *.example.com"
    return 0
  fi

  echo "OUT_OF_SCOPE: No match"
  return 1
}

check_domain "api.example.com"
```

### Phase 3: Wildcard Matching

```python
#!/usr/bin/env python3
def wildcard_match(target, pattern):
    """Check if target matches wildcard pattern"""
    if pattern.startswith('*.'):
        base = pattern[2:]
        if target.endswith(f'.{base}'):
            subdomain = target[:-len(base)-1]
            return '.' not in subdomain
    return target == pattern

print(wildcard_match("api.example.com", "*.example.com"))      # True
print(wildcard_match("deep.api.example.com", "*.example.com")) # False
```

### Phase 4: IP/CIDR Validation

```python
#!/usr/bin/env python3
import ipaddress

def ip_in_cidr(ip_str, cidr_str):
    """Check if IP is within CIDR range"""
    try:
        ip = ipaddress.ip_address(ip_str)
        network = ipaddress.ip_network(cidr_str, strict=False)
        return ip in network
    except ValueError:
        return False

def is_private_ip(ip_str):
    """Check RFC-1918 private ranges"""
    try:
        return ipaddress.ip_address(ip_str).is_private
    except ValueError:
        return False

print(ip_in_cidr("203.0.113.50", "203.0.113.0/24"))  # True
print(is_private_ip("10.0.0.1"))                     # True
```

### Phase 5: DNS Verification

```bash
#!/bin/bash
verify_dns() {
  local target="$1"
  local ip=$(dig +short A "$target" | head -1)

  if [ -z "$ip" ]; then
    echo "❌ DNS failed: No A record"
    return 1
  fi

  echo "✓ Resolves to: $ip"

  local cname=$(dig +short CNAME "$target")
  if [ -n "$cname" ]; then
    echo "⚠️ CNAME: $cname"
    case "$cname" in
      *cloudfront.net*|*cloudflare*|*akamai*)
        echo "⚠️ Third-party CDN - verify scope!"
        ;;
    esac
  fi
}

verify_dns "api.example.com"
```

### Phase 6: Full Validation

```python
#!/usr/bin/env python3
import json
import ipaddress

class ScopeValidator:
    def __init__(self, scope_file):
        with open(scope_file) as f:
            self.scope = json.load(f)

    def validate(self, target):
        try:
            ipaddress.ip_address(target)
            return self._check_ip(target)
        except ValueError:
            return self._check_domain(target)

    def _check_domain(self, domain):
        for exc in self.scope.get('out_of_scope', {}).get('domains', []):
            if self._wildcard_match(domain, exc):
                return {'status': 'OUT_OF_SCOPE', 'reason': f'Excluded: {exc}'}

        for pattern in self.scope.get('in_scope', {}).get('domains', []):
            if self._wildcard_match(domain, pattern):
                return {'status': 'IN_SCOPE', 'reason': f'Matches: {pattern}'}

        return {'status': 'OUT_OF_SCOPE', 'reason': 'No match'}

    def _check_ip(self, ip):
        ip_obj = ipaddress.ip_address(ip)

        if ip_obj.is_private:
            return {'status': 'NEEDS_REVIEW', 'reason': 'Private IP (RFC-1918)'}

        for cidr in self.scope.get('in_scope', {}).get('ips', []):
            if ip_obj in ipaddress.ip_network(cidr, strict=False):
                return {'status': 'IN_SCOPE', 'reason': f'In CIDR: {cidr}'}

        return {'status': 'OUT_OF_SCOPE', 'reason': 'No matching CIDR'}

    def _wildcard_match(self, target, pattern):
        if pattern.startswith('*.'):
            base = pattern[2:]
            return target.endswith(f'.{base}') and target.count('.') == pattern.count('.')
        return target == pattern
```

## Examples

### Example 1: Wildcard Domain Check

**Scope**: `*.example.com` (excluding `*.staging.example.com`)

```bash
targets=("api.example.com" "staging.api.example.com" "mail.example.com")

for t in "${targets[@]}"; do
  if [[ "$t" == *".staging."* ]]; then
    echo "❌ $t - excluded"
  elif [[ "$t" =~ ^[a-z0-9-]+\.example\.com$ ]]; then
    echo "✓ $t - in scope"
  else
    echo "❌ $t - out of scope"
  fi
done
```

### Example 2: CIDR Range Check

```python
import ipaddress

scope = "192.168.1.0/24"
excluded = "192.168.1.1"
network = ipaddress.ip_network(scope)

for ip in ["192.168.1.50", "192.168.1.1", "10.0.0.1"]:
    if ip == excluded:
        print(f"❌ {ip} - excluded")
    elif ipaddress.ip_address(ip) in network:
        print(f"✓ {ip} - in scope")
    else:
        print(f"❌ {ip} - out of scope")
```

### Example 3: Pre-Test Validation

```bash
#!/bin/bash
pretest_check() {
  local target="$1"

  echo "=== PRE-TEST: $target ==="

  ip=$(dig +short A "$target" | head -1)
  [ -z "$ip" ] && echo "❌ DNS failed" && return 1
  echo "✓ Resolves: $ip"

  if [[ "$ip" =~ ^(10\.|192\.168\.|172\.(1[6-9]|2|3[01])\.) ]]; then
    echo "⚠️ Private IP - verify authorization"
  fi

  cname=$(dig +short CNAME "$target")
  [ -n "$cname" ] && echo "⚠️ CNAME: $cname"

  [[ "$target" == *".example.com" ]] && echo "✓ In scope" || echo "❌ Out of scope"
}

pretest_check "api.example.com"
```

### Example 4: Third-Party Detection

```bash
target="cdn.example.com"
cname=$(dig +short CNAME "$target" | head -1)

third_parties="cloudfront.net cloudflare akamai fastly amazonaws.com github.io"

for tp in $third_parties; do
  if [[ "$cname" == *"$tp"* ]]; then
    echo "⚠️ Third-party detected: $tp"
    echo "   Verify if testing is authorized!"
    break
  fi
done
```

### Example 5: Bulk Asset Validation

```bash
#!/bin/bash
validate_assets() {
  local input_file="$1"
  local scope_pattern="$2"

  local in_count=0
  local out_count=0

  while read -r target; do
    [ -z "$target" ] && continue

    if [[ "$target" =~ $scope_pattern ]]; then
      echo "✓ IN: $target"
      ((in_count++))
    else
      echo "❌ OUT: $target"
      ((out_count++))
    fi
  done < "$input_file"

  echo "Summary: $in_count in-scope, $out_count out-of-scope"
}

validate_assets "targets.txt" "^[a-z0-9-]+\.example\.com$"
```

### Example 6: Pre-Exploitation Check

```python
#!/usr/bin/env python3
import socket
import ipaddress

def pre_exploit_check(target, scope_domains, scope_cidrs):
    """Complete pre-exploitation verification"""

    result = {"target": target, "checks": [], "safe_to_proceed": False}

    domain_ok = any(
        target.endswith(f".{d.lstrip('*.')}")
        for d in scope_domains if d.startswith('*.')
    ) or target in scope_domains

    result["checks"].append({
        "name": "domain_scope",
        "passed": domain_ok
    })

    try:
        ip = socket.gethostbyname(target)
        result["resolved_ip"] = ip
        result["checks"].append({"name": "dns_resolution", "passed": True})
    except socket.gaierror:
        result["checks"].append({"name": "dns_resolution", "passed": False})
        return result

    ip_obj = ipaddress.ip_address(ip)
    ip_ok = any(ip_obj in ipaddress.ip_network(c, strict=False) for c in scope_cidrs)
    result["checks"].append({"name": "ip_scope", "passed": ip_ok})

    if ip_obj.is_private:
        result["checks"].append({"name": "private_ip", "passed": False})

    result["safe_to_proceed"] = all(c["passed"] for c in result["checks"])
    return result

check = pre_exploit_check("api.example.com", ["*.example.com"], ["203.0.113.0/24"])
print(f"Safe to proceed: {check['safe_to_proceed']}")
```

### Example 7: Redirect Chain Validation

```python
#!/usr/bin/env python3
import requests
from urllib.parse import urlparse

def check_redirect_scope(url, scope_domains):
    """Follow redirects and verify all destinations are in scope"""

    result = {"original_url": url, "all_in_scope": True, "out_of_scope": []}

    try:
        response = requests.get(url, allow_redirects=True, timeout=10)

        for r in response.history:
            location = r.headers.get('Location', '')
            domain = urlparse(location).netloc

            in_scope = any(
                domain.endswith(d.lstrip('*.')) or domain == d
                for d in scope_domains
            )

            if not in_scope and domain:
                result["all_in_scope"] = False
                result["out_of_scope"].append(domain)

        result["final_url"] = response.url
    except requests.RequestException as e:
        result["error"] = str(e)

    return result

result = check_redirect_scope("https://example.com/redirect", ["*.example.com"])
print(f"All in scope: {result['all_in_scope']}")
```

## Error Handling

| Issue                  | Cause                | Resolution                |
| ---------------------- | -------------------- | ------------------------- |
| DNS resolution fails   | Domain doesn't exist | Verify target spelling    |
| Invalid CIDR format    | Malformed network    | Use `ip/prefix` format    |
| Scope file parse error | Invalid JSON         | Validate JSON syntax      |
| Private IP detected    | Internal network     | Confirm VPN authorization |
| Third-party CNAME      | External hosting     | Get explicit permission   |

## Output Format

```json
{
  "target": "api.example.com",
  "status": "IN_SCOPE",
  "reason": "Matches *.example.com",
  "resolved_ip": "203.0.113.50",
  "warnings": [],
  "safe_to_test": true
}
```

## CIDR Quick Reference

| CIDR | Hosts  | Range Example       |
| ---- | ------ | ------------------- |
| /32  | 1      | Single IP           |
| /24  | 254    | x.x.x.1-254         |
| /16  | 65,534 | x.x.0.1-255.254     |
| /8   | 16.7M  | x.0.0.1-255.255.254 |

## RFC-1918 Private Ranges

| Range                         | CIDR           | Class |
| ----------------------------- | -------------- | ----- |
| 10.0.0.0 - 10.255.255.255     | 10.0.0.0/8     | A     |
| 172.16.0.0 - 172.31.255.255   | 172.16.0.0/12  | B     |
| 192.168.0.0 - 192.168.255.255 | 192.168.0.0/16 | C     |

## Platform Scope Formats

### HackerOne

```
Asset Type: Domain
Identifier: *.example.com
Eligible for Bounty: Yes
```

### Bugcrowd

```
Target: *.example.com
Type: Website
Priority: P1
```

### Synack

```
Scope: example.com and subdomains
IP Range: 203.0.113.0/24
```

## Validation Checklist

- [ ] Target matches in-scope pattern
- [ ] Target not in exclusion list
- [ ] DNS resolves successfully
- [ ] IP not in private range (or VPN authorized)
- [ ] No third-party CNAME (or explicitly allowed)
- [ ] Redirect destinations stay in scope

## Advanced Techniques

### Deep Wildcard Matching

```python
#!/usr/bin/env python3
def deep_wildcard_match(target, pattern):
    """Handle ** patterns for any subdomain depth"""
    if pattern.startswith('**.'):
        base = pattern[3:]
        return target == base or target.endswith(f'.{base}')
    elif pattern.startswith('*.'):
        base = pattern[2:]
        if target.endswith(f'.{base}'):
            subdomain = target[:-len(base)-1]
            return '.' not in subdomain
    return target == pattern

# ** matches any depth
print(deep_wildcard_match("a.b.c.example.com", "**.example.com"))  # True
print(deep_wildcard_match("api.example.com", "**.example.com"))    # True

# * matches single level only
print(deep_wildcard_match("a.b.example.com", "*.example.com"))     # False
print(deep_wildcard_match("api.example.com", "*.example.com"))     # True
```

### IP Range Enumeration

```python
#!/usr/bin/env python3
import ipaddress

def enumerate_scope(cidr, excluded=None):
    """Get all IPs in CIDR excluding specified addresses"""
    excluded = set(excluded or [])
    network = ipaddress.ip_network(cidr, strict=False)
    return [str(ip) for ip in network.hosts() if str(ip) not in excluded]

hosts = enumerate_scope("203.0.113.0/28", ["203.0.113.1"])
print(f"Enumerated {len(hosts)} hosts")
```

### ASN Validation

```bash
#!/bin/bash
check_asn() {
  local ip="$1"
  local expected_asn="$2"

  asn=$(whois -h whois.cymru.com " -v $ip" | tail -1 | awk '{print $1}')

  if [ "$asn" = "$expected_asn" ]; then
    echo "✓ IP $ip belongs to ASN $expected_asn"
    return 0
  else
    echo "❌ IP $ip belongs to ASN $asn (expected $expected_asn)"
    return 1
  fi
}

check_asn "8.8.8.8" "AS15169"
```

## Common Patterns

### Exclusion Keywords

```bash
# Common out-of-scope patterns
exclusion_patterns=(
  "staging"
  "dev"
  "test"
  "internal"
  "corp"
  "admin"
  "vpn"
  "mail"
  "mx"
  "ns"
)
```

### Third-Party Indicators

| Provider   | CNAME Pattern      | Service Type |
| ---------- | ------------------ | ------------ |
| CloudFront | `*.cloudfront.net` | CDN          |
| Cloudflare | `*.cloudflare*`    | CDN/WAF      |
| Akamai     | `*.akamai*`        | CDN          |
| AWS        | `*.amazonaws.com`  | Cloud        |
| Azure      | `*.azure*`         | Cloud        |
| GitHub     | `*.github.io`      | Hosting      |
| Heroku     | `*.herokuapp.com`  | PaaS         |
| Netlify    | `*.netlify*`       | Hosting      |

## References

- RFC 1918: https://datatracker.ietf.org/doc/html/rfc1918
- CIDR: https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing
- ARIN: https://www.arin.net/
- HackerOne Scope: https://docs.hackerone.com/programs/defining-scope.html
- Bugcrowd Targets: https://docs.bugcrowd.com/customers/target-setup/
