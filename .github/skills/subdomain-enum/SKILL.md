---
name: subdomain-enum
description: Enumerate subdomains for a target domain using passive and active reconnaissance techniques. Use when starting reconnaissance on a new target, when you need to discover the attack surface, when expanding scope from a root domain, or when the user provides a domain to investigate.
tags:
  - security
  - subdomain
  - enumeration
  - dns
  - reconnaissance
triggers:
  - subdomain enumeration
  - find subdomains
  - subdomain scan
  - subdomain discovery
---

# subdomain-enum

## When to Use

- Starting reconnaissance on a new target domain
- Need to discover all subdomains for attack surface mapping
- Expanding scope from a single root domain
- User provides a domain and asks about subdomains
- Building initial target list for vulnerability scanning
- Need to find hidden or forgotten subdomains
- Preparing for web application testing
- Asset discovery phase of bug bounty hunting

## Quick Start

```bash
# Fast passive enumeration with subfinder
subfinder -d example.com -silent -o subdomains.txt

# Validate live subdomains with httpx
cat subdomains.txt | httpx -silent -o live_subdomains.txt
```

## Step-by-Step Process

### Phase 1: Fast Passive Enumeration (Subfinder)

1. **Basic enumeration:**

   ```bash
   subfinder -d example.com -o subfinder_results.txt
   ```

2. **Silent mode for clean output:**

   ```bash
   subfinder -d example.com -silent -o subdomains.txt
   ```

3. **Use all sources (comprehensive):**

   ```bash
   subfinder -d example.com -all -o subdomains_all.txt
   ```

4. **JSON output:**

   ```bash
   subfinder -d example.com -silent -oJ -o subdomains.json
   ```

5. **Multiple domains from file:**

   ```bash
   subfinder -dL domains.txt -o all_subdomains.txt
   ```

6. **Recursive enumeration:**
   ```bash
   subfinder -d example.com -recursive -o recursive_subs.txt
   ```

### Phase 2: Deep Enumeration (Amass)

1. **Passive only:**

   ```bash
   amass enum -passive -d example.com -o amass_passive.txt
   ```

2. **Active enumeration:**

   ```bash
   amass enum -active -d example.com -o amass_active.txt
   ```

3. **With brute forcing:**

   ```bash
   amass enum -brute -d example.com -o amass_brute.txt
   ```

4. **JSON output:**
   ```bash
   amass enum -d example.com -json amass_results.json
   ```

### Phase 3: Validation (Httpx)

1. **Basic probe:**

   ```bash
   cat subdomains.txt | httpx -silent -o live_hosts.txt
   ```

2. **With status codes:**

   ```bash
   cat subdomains.txt | httpx -silent -sc -o live_with_status.txt
   ```

3. **Full information:**

   ```bash
   cat subdomains.txt | httpx -silent -sc -title -td -o detailed_hosts.txt
   ```

4. **JSON output:**

   ```bash
   cat subdomains.txt | httpx -silent -json -o httpx_results.json
   ```

5. **With technology detection:**
   ```bash
   cat subdomains.txt | httpx -silent -td -json -o tech_results.json
   ```

### Phase 4: Combine Results

```bash
cat subfinder_results.txt amass_passive.txt | sort -u > all_subdomains.txt
```

## Examples

### Example 1: Quick Bug Bounty Recon

**Scenario:** Fast subdomain discovery for a bug bounty target

```bash
subfinder -d hackerone.com -silent -o subs.txt
cat subs.txt | httpx -silent -sc -title
```

**Output:**

```
https://www.hackerone.com [200] [HackerOne | Bug Bounty Platform]
https://api.hackerone.com [401] [Unauthorized]
https://docs.hackerone.com [200] [HackerOne Platform Documentation]
https://support.hackerone.com [200] [HackerOne]
```

### Example 2: Comprehensive Enumeration

**Scenario:** Thorough discovery with multiple tools

```bash
# Fast scan
subfinder -d target.com -all -o subfinder.txt

# Deep scan
amass enum -passive -d target.com -o amass.txt

# Combine
cat subfinder.txt amass.txt | sort -u > all_subs.txt

# Validate
cat all_subs.txt | httpx -silent -sc -title -td -json -o final.json
```

### Example 3: Recursive Discovery

**Scenario:** Find sub-subdomains

```bash
subfinder -d example.com -recursive -o recursive.txt
```

**Output:**

```
api.example.com
dev.api.example.com
staging.api.example.com
internal.corp.example.com
```

### Example 4: JSON Pipeline

**Scenario:** Structured output for processing

```bash
subfinder -d example.com -silent -oJ -o subs.json
cat subs.json | jq -r '.host' | httpx -silent -json -o httpx.json
cat httpx.json | jq -r 'select(.status_code == 200) | .url'
```

### Example 5: Filter Interesting Targets

**Scenario:** Find high-value subdomains

```bash
subfinder -d target.com -silent -o subs.txt
grep -iE "(admin|dev|staging|test|api|internal|jenkins|jira)" subs.txt > interesting.txt
cat interesting.txt | httpx -silent -sc -title
```

**Output:**

```
https://admin.target.com [403] [Forbidden]
https://dev.target.com [200] [Development Environment]
https://jenkins.target.com [200] [Jenkins]
```

### Example 6: Rate-Limited Scan

**Scenario:** Avoid detection

```bash
subfinder -d target.com -rl 5 -t 2 -o subs.txt
cat subs.txt | httpx -silent -rl 10 -t 25 -o live.txt
```

### Example 7: Technology-Focused

**Scenario:** Find specific tech stacks

```bash
subfinder -d example.com -silent | httpx -silent -td -json -o tech.json
cat tech.json | jq 'select(.tech | contains(["WordPress"]))'
```

## Error Handling

| Error                       | Cause                 | Resolution                     |
| --------------------------- | --------------------- | ------------------------------ |
| `no results found`          | No indexed subdomains | Try amass brute force          |
| `context deadline exceeded` | Timeout               | Increase `-timeout`            |
| `rate limit exceeded`       | Too many requests     | Use `-rl` flag                 |
| `could not resolve host`    | DNS failure           | Check resolvers                |
| `no sources configured`     | Missing API keys      | Configure provider-config.yaml |
| `connection refused`        | Blocked               | Use rate limiting              |
| `too many open files`       | Resource limit        | Reduce `-t` threads            |

## Tool Reference

### Subfinder Flags

| Flag                    | Description            |
| ----------------------- | ---------------------- |
| `-d, -domain`           | Target domain          |
| `-dL, -list`            | File with domains      |
| `-all`                  | Use all sources        |
| `-recursive`            | Recursive enumeration  |
| `-o, -output`           | Output file            |
| `-oJ, -json`            | JSON output            |
| `-silent`               | Clean output           |
| `-rl, -rate-limit`      | Requests per second    |
| `-t`                    | Concurrent threads     |
| `-timeout`              | Timeout seconds        |
| `-r, -resolvers`        | Custom resolvers       |
| `-nW, -active`          | Active subdomains only |
| `-config`               | Config file path       |
| `-pc, -provider-config` | API keys config        |

### Amass Flags

| Flag       | Description        |
| ---------- | ------------------ |
| `-d`       | Target domain      |
| `-passive` | Passive only       |
| `-active`  | Include active     |
| `-brute`   | Enable brute force |
| `-o`       | Output file        |
| `-json`    | JSON output        |
| `-config`  | Config file        |
| `-w`       | Wordlist for brute |

### Httpx Flags

| Flag                | Description         |
| ------------------- | ------------------- |
| `-l, -list`         | Input file          |
| `-sc, -status-code` | Show status code    |
| `-title`            | Show page title     |
| `-td, -tech-detect` | Detect technologies |
| `-ip`               | Show IP address     |
| `-cdn`              | Show CDN detection  |
| `-o, -output`       | Output file         |
| `-json`             | JSON output         |
| `-silent`           | Clean output        |
| `-mc, -match-code`  | Match status codes  |
| `-fc, -filter-code` | Filter status codes |
| `-t, -threads`      | Thread count        |
| `-rl, -rate-limit`  | Requests per second |

## Advanced Techniques

### Wildcard Detection

```bash
# Check for wildcard
dig randomnonexistent123456.example.com +short

# Filter wildcards
subfinder -d example.com -nW -o filtered.txt
```

### Certificate Transparency

```bash
# Query CT logs directly
curl -s "https://crt.sh/?q=%25.example.com&output=json" | jq -r '.[].name_value' | sort -u
```

### ASN Discovery

```bash
# Find domains by ASN
amass intel -asn 12345 -o asn_domains.txt
```

### Continuous Monitoring

```bash
# Baseline
subfinder -d example.com -silent -o baseline.txt

# Check for new
subfinder -d example.com -silent -o current.txt
diff baseline.txt current.txt > new_subs.txt
```

## API Key Configuration

### Subfinder (`~/.config/subfinder/provider-config.yaml`)

```yaml
binaryedge:
  - your_api_key
censys:
  - your_api_id:your_api_secret
chaos:
  - your_api_key
github:
  - your_github_token
securitytrails:
  - your_api_key
shodan:
  - your_api_key
virustotal:
  - your_api_key
```

### Amass (`~/.config/amass/config.yaml`)

```yaml
datasources:
  SecurityTrails:
    apikey: your_api_key
  Shodan:
    apikey: your_api_key
  VirusTotal:
    apikey: your_api_key
```

## Best Practices

### Recommended Workflow

1. **Start with subfinder** - Fast, passive, low noise
2. **Run amass passive** - Additional sources
3. **Run amass active** - DNS brute forcing (if allowed)
4. **Combine and deduplicate** - Merge all results
5. **Validate with httpx** - Find live hosts
6. **Filter interesting** - Focus on valuable targets

### Performance Tips

- Use `-silent` for cleaner pipeline output
- Set `-rl` rate limits for large domains
- Use `-json` for programmatic processing
- Run subfinder first (faster), then amass (thorough)
- Increase timeouts for slow networks
- Use custom resolvers for better DNS resolution

### Common Wordlists

| Wordlist                           | Size | Use Case      |
| ---------------------------------- | ---- | ------------- |
| `subdomains-top1million-5000.txt`  | 5K   | Quick         |
| `subdomains-top1million-20000.txt` | 20K  | Standard      |
| `dns-Jhaddix.txt`                  | 2.2M | Comprehensive |

## Output Interpretation

### Subfinder JSON Output

```json
{
  "host": "api.example.com",
  "input": "example.com",
  "source": "alienvault"
}
```

| Field    | Description               |
| -------- | ------------------------- |
| `host`   | Discovered subdomain      |
| `input`  | Original target domain    |
| `source` | Data source that found it |

### Httpx JSON Output

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "url": "https://api.example.com",
  "input": "api.example.com",
  "status_code": 200,
  "title": "API Documentation",
  "webserver": "nginx/1.18.0",
  "tech": ["nginx", "PHP"],
  "content_length": 12345,
  "host": "93.184.216.34",
  "port": "443",
  "scheme": "https"
}
```

| Field            | Description           |
| ---------------- | --------------------- |
| `url`            | Full URL of the host  |
| `status_code`    | HTTP response code    |
| `title`          | HTML page title       |
| `webserver`      | Server header value   |
| `tech`           | Detected technologies |
| `content_length` | Response size         |
| `host`           | IP address            |

### Status Code Meanings

| Code    | Meaning       | Interest Level             |
| ------- | ------------- | -------------------------- |
| 200     | OK            | High - Active site         |
| 301/302 | Redirect      | Medium - Check destination |
| 401     | Unauthorized  | High - Protected resource  |
| 403     | Forbidden     | High - Hidden content      |
| 404     | Not Found     | Low - May not exist        |
| 500     | Server Error  | Medium - Misconfigured     |
| 502/503 | Gateway Error | Medium - Backend issues    |

## Integration Examples

### Pipe to Nuclei

```bash
subfinder -d example.com -silent | httpx -silent | nuclei -t cves/
```

### Pipe to Katana

```bash
subfinder -d example.com -silent | httpx -silent | katana -silent
```

### Pipe to Naabu

```bash
subfinder -d example.com -silent | naabu -silent -top-ports 100
```

### Full Recon Pipeline

```bash
# Complete subdomain enumeration pipeline
TARGET="example.com"
OUTDIR="recon/${TARGET}"
mkdir -p "$OUTDIR"

# Enumerate
subfinder -d "$TARGET" -all -o "$OUTDIR/subfinder.txt"
amass enum -passive -d "$TARGET" -o "$OUTDIR/amass.txt"

# Combine and dedupe
cat "$OUTDIR"/*.txt | sort -u > "$OUTDIR/all_subs.txt"

# Validate and fingerprint
cat "$OUTDIR/all_subs.txt" | httpx -silent -sc -title -td -json -o "$OUTDIR/live.json"

# Summary
echo "Found $(wc -l < $OUTDIR/all_subs.txt) subdomains"
echo "Live hosts: $(wc -l < $OUTDIR/live.json)"
```

## References

- [Subfinder](https://github.com/projectdiscovery/subfinder) | [Amass](https://github.com/owasp-amass/amass) | [Httpx](https://github.com/projectdiscovery/httpx) | [SecLists DNS](https://github.com/danielmiessler/SecLists/tree/master/Discovery/DNS)
