---
name: tech-fingerprint
description: Identify technologies, frameworks, and software versions running on web targets. Use when you need to discover the technology stack of a website, when mapping attack surface for known CVEs, when identifying CMS or framework versions, or when the user asks about what technologies a site is running.
tags:
  - security
  - fingerprint
  - technology
  - detection
  - version
triggers:
  - technology fingerprint
  - tech stack detection
  - identify technology
  - version detection
  - wappalyzer
---

# tech-fingerprint

## When to Use

- Need to identify what technologies a website is running
- Discovering CMS platforms (WordPress, Drupal, Joomla)
- Finding JavaScript frameworks (React, Angular, Vue)
- Identifying web servers and their versions
- Mapping attack surface for known vulnerabilities
- Looking for outdated software with CVEs
- User asks "what is this site built with?"
- Preparing for targeted vulnerability scanning
- Building technology profiles for multiple targets

## Quick Start

```bash
# Fast fingerprint with httpx
echo "https://example.com" | httpx -silent -td -sc -title

# Deep fingerprint with WhatWeb
whatweb -a 3 https://example.com
```

## Step-by-Step Process

### Phase 1: Quick Technology Detection (Httpx)

1. **Basic tech detection:**

   ```bash
   echo "https://example.com" | httpx -silent -td
   ```

2. **With status and title:**

   ```bash
   cat urls.txt | httpx -silent -td -sc -title
   ```

3. **Full fingerprint output:**

   ```bash
   cat urls.txt | httpx -silent -td -sc -title -server -json -o fingerprint.json
   ```

4. **WordPress detection:**

   ```bash
   cat urls.txt | httpx -silent -wp -json -o wordpress.json
   ```

5. **CPE detection for CVE mapping:**
   ```bash
   cat urls.txt | httpx -silent -cpe -json -o cpe.json
   ```

### Phase 2: Deep Fingerprinting (WhatWeb)

1. **Stealthy scan (single request):**

   ```bash
   whatweb -a 1 https://example.com
   ```

2. **Aggressive scan (version detection):**

   ```bash
   whatweb -a 3 https://example.com
   ```

3. **Heavy scan (full enumeration):**

   ```bash
   whatweb -a 4 https://example.com
   ```

4. **JSON output:**

   ```bash
   whatweb --log-json=results.json https://example.com
   ```

5. **Scan from file:**

   ```bash
   whatweb -i urls.txt --log-json=whatweb.json
   ```

6. **Verbose with plugin info:**
   ```bash
   whatweb -v https://example.com
   ```

### Phase 3: Combine Results

```bash
# Run both tools
cat urls.txt | httpx -silent -td -json -o httpx_tech.json
whatweb -i urls.txt --log-json=whatweb_tech.json

# Extract unique technologies
cat httpx_tech.json | jq -r '.tech[]?' | sort -u > technologies.txt
```

### Phase 4: Filter High-Value Targets

```bash
# Find WordPress sites
cat httpx_tech.json | jq -r 'select(.tech | contains(["WordPress"])) | .url'

# Find specific framework
cat httpx_tech.json | jq -r 'select(.tech | contains(["Laravel"])) | .url'

# Find outdated Apache
whatweb -i urls.txt -a 3 | grep -i "apache/2.2"
```

## Examples

### Example 1: Quick Technology Scan

**Scenario:** Fast tech detection across many targets

```bash
subfinder -d example.com -silent | httpx -silent -td -sc -title
```

**Output:**

```
https://www.example.com [200] [Example Domain] [nginx,PHP,WordPress]
https://api.example.com [200] [API] [nginx,Node.js,Express]
https://shop.example.com [200] [Shop] [Apache,PHP,Magento]
```

### Example 2: WordPress Detection

**Scenario:** Find WordPress sites and their plugins/themes

```bash
cat urls.txt | httpx -silent -wp -json | jq
```

**Output:**

```json
{
  "url": "https://blog.example.com",
  "wordpress": {
    "version": "6.4.2",
    "plugins": ["contact-form-7", "yoast-seo", "woocommerce"],
    "themes": ["flavor"]
  }
}
```

### Example 3: Deep Version Detection

**Scenario:** Get exact software versions for CVE research

```bash
whatweb -a 3 https://example.com
```

**Output:**

```
https://example.com [200 OK] Apache[2.4.41], Country[US], HTML5, HTTPServer[Ubuntu Linux][Apache/2.4.41 (Ubuntu)], IP[93.184.216.34], JQuery[3.5.1], PHP[7.4.3], PoweredBy[PHP/7.4.3], Script[text/javascript], Title[Example Domain], X-Powered-By[PHP/7.4.3]
```

### Example 4: JSON Pipeline

**Scenario:** Structured output for further processing

```bash
whatweb -a 3 --log-json=tech.json https://example.com
cat tech.json | jq '.plugins | keys[]'
```

**Output:**

```
Apache
HTML5
HTTPServer
JQuery
PHP
Title
```

### Example 5: CPE for Vulnerability Mapping

**Scenario:** Get CPE identifiers for CVE database lookups

```bash
echo "https://example.com" | httpx -silent -cpe -json | jq '.cpe'
```

**Output:**

```json
["cpe:/a:apache:http_server:2.4.41", "cpe:/a:php:php:7.4.3"]
```

### Example 6: Filter by Technology

**Scenario:** Find all sites running specific technology

```bash
# Find React apps
cat urls.txt | httpx -silent -td -json | jq -r 'select(.tech | contains(["React"])) | .url'

# Find PHP sites
cat urls.txt | httpx -silent -td -json | jq -r 'select(.tech | any(. | test("PHP"))) | .url'
```

### Example 7: WhatWeb Specific Plugin

**Scenario:** Check only for specific technology

```bash
whatweb -p wordpress,joomla,drupal https://example.com
```

**Output:**

```
https://example.com [200 OK] WordPress[6.4.2]
```

### Example 8: Comprehensive Recon Pipeline

**Scenario:** Full technology fingerprinting workflow

```bash
TARGET="example.com"
mkdir -p recon/$TARGET

# Discover subdomains
subfinder -d $TARGET -silent -o recon/$TARGET/subs.txt

# Probe live hosts with tech detection
cat recon/$TARGET/subs.txt | httpx -silent -td -sc -title -server -json -o recon/$TARGET/httpx.json

# Deep scan with WhatWeb on live hosts
cat recon/$TARGET/httpx.json | jq -r '.url' | whatweb -i /dev/stdin -a 3 --log-json=recon/$TARGET/whatweb.json

# Summary
echo "Technologies found:"
cat recon/$TARGET/httpx.json | jq -r '.tech[]?' | sort | uniq -c | sort -rn
```

## Error Handling

| Error                       | Cause                | Resolution                           |
| --------------------------- | -------------------- | ------------------------------------ |
| `no tech detected`          | No fingerprint match | Try WhatWeb with higher aggression   |
| `context deadline exceeded` | Timeout              | Increase timeout with `-timeout`     |
| `could not connect`         | Host unreachable     | Verify host is live with httpx first |
| `rate limit`                | Too many requests    | Use `-rl` rate limit flag            |
| `no plugins matched`        | WhatWeb no match     | Try `-a 3` or `-a 4` aggression      |
| `permission denied`         | Access blocked       | Check if WAF is blocking             |
| `SSL error`                 | Certificate issue    | Add `-no-https` or check cert        |

## Tool Reference

### Httpx Technology Flags

| Flag                | Description                              |
| ------------------- | ---------------------------------------- |
| `-td, -tech-detect` | Detect technologies (wappalyzer dataset) |
| `-cpe`              | Display CPE identifiers                  |
| `-wp, -wordpress`   | Detect WordPress plugins/themes          |
| `-server`           | Display web server header                |
| `-sc, -status-code` | Display status code                      |
| `-title`            | Display page title                       |
| `-favicon`          | Display favicon hash                     |
| `-jarm`             | Display JARM fingerprint                 |
| `-json`             | JSON output format                       |
| `-o, -output`       | Output file                              |
| `-silent`           | Clean output only                        |
| `-t, -threads`      | Number of threads (default 50)           |
| `-rl, -rate-limit`  | Requests per second                      |
| `-timeout`          | Timeout in seconds (default 10)          |

### WhatWeb Flags

| Flag                 | Description              |
| -------------------- | ------------------------ |
| `-a, --aggression`   | Aggression level (1-4)   |
| `-i, --input-file`   | Input file with URLs     |
| `-v, --verbose`      | Verbose output           |
| `--log-json=FILE`    | JSON output file         |
| `--log-brief=FILE`   | Brief greppable output   |
| `--log-xml=FILE`     | XML output file          |
| `-p, --plugins`      | Select specific plugins  |
| `-l, --list-plugins` | List all plugins         |
| `-I, --info-plugins` | Detailed plugin info     |
| `-t, --max-threads`  | Max threads (default 25) |
| `--wait=SECONDS`     | Wait between requests    |
| `-U, --user-agent`   | Custom user agent        |
| `--cookie`           | Set cookies              |
| `--proxy`            | Use proxy                |

### WhatWeb Aggression Levels

| Level | Description | Requests | Use Case                        |
| ----- | ----------- | -------- | ------------------------------- |
| 1     | Stealthy    | 1        | Public websites, passive recon  |
| 3     | Aggressive  | Several  | Version detection (if L1 match) |
| 4     | Heavy       | Many     | Full enumeration, thorough scan |

## Output Interpretation

### Httpx JSON Output

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "url": "https://example.com",
  "status_code": 200,
  "title": "Example Site",
  "webserver": "nginx/1.18.0",
  "tech": ["nginx", "PHP", "WordPress", "MySQL"],
  "cpe": ["cpe:/a:nginx:nginx:1.18.0"]
}
```

| Field         | Description                    |
| ------------- | ------------------------------ |
| `url`         | Target URL                     |
| `status_code` | HTTP response code             |
| `title`       | HTML page title                |
| `webserver`   | Server header value            |
| `tech`        | Detected technologies array    |
| `cpe`         | CPE identifiers for CVE lookup |

### WhatWeb JSON Output

```json
{
  "target": "https://example.com",
  "http_status": 200,
  "plugins": {
    "Apache": { "version": ["2.4.41"] },
    "PHP": { "version": ["7.4.3"] },
    "WordPress": { "version": ["6.4.2"] },
    "JQuery": { "version": ["3.5.1"] }
  }
}
```

| Field         | Description                   |
| ------------- | ----------------------------- |
| `target`      | Scanned URL                   |
| `http_status` | HTTP status code              |
| `plugins`     | Matched plugins with versions |
| `version`     | Detected version numbers      |

### Common Technologies by Category

| Category    | Technologies                            |
| ----------- | --------------------------------------- |
| Web Servers | nginx, Apache, IIS, LiteSpeed, Caddy    |
| Languages   | PHP, Python, Ruby, Node.js, Java, .NET  |
| CMS         | WordPress, Drupal, Joomla, Magento      |
| Frameworks  | Laravel, Django, Rails, Express, Spring |
| JavaScript  | React, Angular, Vue, jQuery, Next.js    |
| CDN/WAF     | Cloudflare, Akamai, AWS CloudFront      |

## Advanced Techniques

### Custom Fingerprint File

```bash
# Use custom fingerprint rules with httpx
httpx -u https://example.com -td -cff custom_fingerprints.json
```

### Favicon Hash Matching

```bash
# Get favicon hash for identification
echo "https://example.com" | httpx -silent -favicon

# Match known favicon hashes
httpx -l urls.txt -favicon -mfc 1494302000  # Match specific hash
```

### JARM Fingerprinting

```bash
# TLS fingerprint for server identification
echo "https://example.com" | httpx -silent -jarm
```

### Certificate Analysis

```bash
# Extract tech info from TLS certificates
echo "https://example.com" | httpx -silent -tls-grab -json | jq '.tls'
```

### Grep-Based Filtering

```bash
# WhatWeb grep for specific patterns
whatweb -g "admin" https://example.com

# Search for version patterns
whatweb -a 3 https://example.com | grep -oE "[a-zA-Z]+/[0-9.]+"
```

## Best Practices

### Recommended Workflow

1. **Start with httpx** - Fast tech detection across many targets
2. **Filter interesting targets** - WordPress, outdated software
3. **Deep scan with WhatWeb** - Version detection on filtered targets
4. **Extract CPEs** - Map to CVE database
5. **Document findings** - JSON output for processing

### Performance Tips

- Use httpx `-silent` for clean pipeline output
- Set rate limits with `-rl` for large scans
- Use WhatWeb `-a 1` for initial pass, `-a 3` for follow-up
- Use `-json` output for programmatic processing
- Run httpx first (faster), then WhatWeb on filtered targets
- Use `--no-cookies` in WhatWeb for faster high-volume scans

### Accuracy Tips

- WhatWeb `-a 3` provides better version detection
- Combine multiple tools for comprehensive coverage
- Check both HTTP and HTTPS versions
- Some technologies only detectable via specific paths
- Favicon hashes can identify technologies missed by other methods

## Integration Examples

### Pipe to Nuclei

```bash
# Scan WordPress sites for WP-specific CVEs
cat urls.txt | httpx -silent -td -json | \
  jq -r 'select(.tech | contains(["WordPress"])) | .url' | \
  nuclei -t cves/wordpress/
```

### Pipe to Searchsploit

```bash
# Find exploits for detected technologies
whatweb -a 3 https://example.com --log-brief=- | \
  grep -oE "[A-Za-z]+/[0-9.]+" | \
  while read tech; do searchsploit "$tech"; done
```

### Export for Reporting

```bash
# Generate CSV report
cat httpx_tech.json | jq -r '[.url, (.tech | join(";"))] | @csv' > tech_report.csv
```

## References

- [Httpx GitHub](https://github.com/projectdiscovery/httpx)
- [Httpx Docs](https://docs.projectdiscovery.io/tools/httpx/overview)
- [WhatWeb GitHub](https://github.com/urbanadventurer/WhatWeb)
- [WhatWeb Wiki](https://github.com/urbanadventurer/WhatWeb/wiki)
- [Wappalyzer Technologies](https://www.wappalyzer.com/technologies/)
- [CPE Dictionary](https://nvd.nist.gov/products/cpe)
