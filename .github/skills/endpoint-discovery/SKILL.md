---
name: endpoint-discovery
description: Discovers URLs, endpoints, and paths from web applications using katana, gospider, and gau. Use when needing to enumerate application endpoints, find hidden paths, gather historical URLs, or map web application structure during reconnaissance.
tags:
  - security
  - endpoints
  - urls
  - discovery
  - katana
  - gospider
triggers:
  - discover endpoints
  - find urls
  - endpoint discovery
  - web crawl
  - path discovery
---

# endpoint-discovery

## When to Use

- Target domain identified and need to discover all endpoints
- Looking for hidden or forgotten paths and parameters
- Need historical URLs from archived sources
- Mapping web application structure for testing
- Finding JavaScript files containing API endpoints
- Preparing endpoint list for parameter fuzzing
- Discovering forms, inputs, and interactive elements

## Quick Start

Active crawl with katana on a single target:

```bash
katana -u https://example.com -d 3 -silent
```

## Tools Overview

### Katana (Primary - Active Crawling)

ProjectDiscovery's next-generation web crawler with standard and headless modes for JavaScript rendering.

**Best For:** Modern web applications, SPAs, JavaScript-heavy sites

### Gospider (Speed - Parallel Crawling)

Fast web spider with parallel site processing and third-party source integration.

**Best For:** Large-scale crawling, multiple targets, quick enumeration

### GAU (Passive - Historical URLs)

Fetches known URLs from Wayback Machine, Common Crawl, AlienVault OTX, and URLScan without making requests to target.

**Best For:** Passive reconnaissance, historical endpoint discovery, stealthy enumeration

## Step-by-Step Process

### Step 1: Passive Historical Discovery with GAU

Start with passive enumeration to avoid detection:

```bash
echo example.com | gau --threads 5 --o gau-urls.txt
```

Include subdomains in the search:

```bash
echo example.com | gau --subs --threads 5 --o gau-all.txt
```

Filter by specific providers:

```bash
echo example.com | gau --providers wayback,commoncrawl --o wayback-urls.txt
```

### Step 2: Filter Historical Results

Remove static files and duplicates:

```bash
cat gau-urls.txt | grep -v -E '\.(css|js|png|jpg|gif|svg|woff|ico)$' | sort -u > filtered-urls.txt
```

Extract only endpoints with parameters:

```bash
cat gau-urls.txt | grep '?' | sort -u > params-urls.txt
```

### Step 3: Active Crawling with Katana

Standard crawl with default depth:

```bash
katana -u https://example.com -d 3 -o katana-urls.txt
```

Enable JavaScript file crawling:

```bash
katana -u https://example.com -jc -d 3 -o katana-js.txt
```

### Step 4: Headless Mode for SPAs

For JavaScript-heavy applications:

```bash
katana -u https://example.com -headless -d 3 -o headless-urls.txt
```

With no-sandbox for root users:

```bash
katana -u https://example.com -headless -no-sandbox -d 3 -o headless-urls.txt
```

### Step 5: Scope Control

Limit crawling to root domain and subdomains:

```bash
katana -u https://example.com -fs rdn -d 3 -o scoped-urls.txt
```

Crawl only specific subdomain:

```bash
katana -u https://api.example.com -fs fqdn -d 3 -o api-urls.txt
```

### Step 6: Known Files Discovery

Crawl robots.txt and sitemap.xml:

```bash
katana -u https://example.com -kf all -d 3 -o known-files.txt
```

### Step 7: Parallel Crawling with Gospider

Single site with concurrent requests:

```bash
gospider -s https://example.com -c 10 -d 2 -o output/
```

Multiple sites in parallel:

```bash
gospider -S sites.txt -c 10 -d 2 -t 5 -o output/
```

### Step 8: Third-Party Sources

Gospider with archive sources:

```bash
gospider -s https://example.com -c 10 -d 1 --other-source -o output/
```

With subdomains from third-party:

```bash
gospider -s https://example.com -c 10 --other-source --include-subs -o output/
```

### Step 9: Combine All Results

Merge and deduplicate findings:

```bash
cat gau-urls.txt katana-urls.txt output/* | sort -u > all-endpoints.txt
```

Extract unique paths:

```bash
cat all-endpoints.txt | unfurl paths | sort -u > unique-paths.txt
```

## Examples

### Example 1: Basic Katana Crawl

**Scenario:** Crawl a website with default settings

**Command:**

```bash
katana -u https://example.com -silent
```

**Output:**

```
https://example.com/
https://example.com/about
https://example.com/contact
https://example.com/login
https://example.com/api/v1/users
https://example.com/static/js/main.js
```

### Example 2: JavaScript Endpoint Extraction

**Scenario:** Parse JavaScript files for hidden endpoints

**Command:**

```bash
katana -u https://example.com -jc -d 3 -silent
```

**Output:**

```
https://example.com/
https://example.com/api/auth/login
https://example.com/api/auth/register
https://example.com/api/users/profile
https://example.com/api/admin/dashboard
https://example.com/static/js/app.bundle.js
```

### Example 3: GAU Historical Discovery

**Scenario:** Find historical URLs without active scanning

**Command:**

```bash
echo hackerone.com | gau --threads 5
```

**Output:**

```
https://hackerone.com/
https://hackerone.com/reports/12345
https://hackerone.com/api/v1/programs
https://hackerone.com/users/settings
https://hackerone.com/admin/panel
https://hackerone.com/.git/config
```

### Example 4: GAU with Date Range

**Scenario:** Get URLs from specific time period

**Command:**

```bash
echo example.com | gau --from 202301 --to 202312 --o 2023-urls.txt
```

**Output:**

```
https://example.com/legacy-admin
https://example.com/old-api/v1
https://example.com/backup/db.sql
https://example.com/test/phpinfo.php
```

### Example 5: Gospider Parallel Crawl

**Scenario:** Crawl multiple sites simultaneously

**Command:**

```bash
gospider -S sites.txt -c 10 -d 2 -t 20 -o output/
```

**Output (output/example_com):**

```
[url] - [code-200] - https://example.com/
[url] - [code-200] - https://example.com/login
[form] - https://example.com/search?q=
[javascript] - https://example.com/static/app.js
[linkfinder] - [from: https://example.com/static/app.js] - /api/internal/users
```

### Example 6: Gospider with Third-Party Sources

**Scenario:** Include archive data in crawl

**Command:**

```bash
gospider -s https://example.com -c 10 --other-source -o output/
```

**Output:**

```
[wayback] - https://example.com/old-endpoint
[commoncrawl] - https://example.com/archived-page
[alienvault] - https://example.com/exposed-api
[url] - [code-200] - https://example.com/
```

### Example 7: Headless Mode for SPA

**Scenario:** Crawl React/Angular application

**Command:**

```bash
katana -u https://spa.example.com -headless -d 3 -silent
```

**Output:**

```
https://spa.example.com/
https://spa.example.com/dashboard
https://spa.example.com/settings/profile
https://spa.example.com/api/graphql
https://spa.example.com/admin/users
```

### Example 8: Extract Parameters Only

**Scenario:** Find all URLs with query parameters

**Command:**

```bash
katana -u https://example.com -d 3 -f qurl -silent
```

**Output:**

```
https://example.com/search?q=test
https://example.com/products?id=123&category=electronics
https://example.com/user?id=1&action=view
https://example.com/api/items?page=1&limit=10
```

### Example 9: JSON Output for Automation

**Scenario:** Get structured output for pipeline processing

**Command:**

```bash
katana -u https://example.com -d 2 -jsonl -silent
```

**Output:**

```json
{"timestamp":"2024-01-15T10:30:00","endpoint":"https://example.com/","status_code":200}
{"timestamp":"2024-01-15T10:30:01","endpoint":"https://example.com/login","status_code":200}
{"timestamp":"2024-01-15T10:30:02","endpoint":"https://example.com/api/v1","status_code":401}
```

### Example 10: GAU JSON Output

**Scenario:** Get historical URLs in JSON format

**Command:**

```bash
echo example.com | gau --json --threads 5
```

**Output:**

```json
{"url":"https://example.com/","source":"wayback"}
{"url":"https://example.com/admin","source":"commoncrawl"}
{"url":"https://example.com/api/keys","source":"otx"}
```

### Example 11: Filter by Status Code

**Scenario:** Get only successful URLs from GAU

**Command:**

```bash
echo example.com | gau --mc 200,301 --threads 5
```

**Output:**

```
https://example.com/
https://example.com/about
https://example.com/contact
```

### Example 12: Blacklist Extensions

**Scenario:** Skip static files during discovery

**GAU:**

```bash
echo example.com | gau --blacklist png,jpg,gif,css,woff --o filtered.txt
```

**Gospider:**

```bash
gospider -s https://example.com --blacklist ".(png|jpg|gif|css)" -o output/
```

### Example 13: Katana Form Extraction

**Scenario:** Extract all forms and input fields

**Command:**

```bash
katana -u https://example.com -fx -d 2 -jsonl -silent | jq '.forms'
```

**Output:**

```json
{
  "action": "/login",
  "method": "POST",
  "inputs": ["username", "password", "csrf_token"]
}
```

### Example 14: Full Pipeline

**Scenario:** Complete endpoint discovery workflow

**Command:**

```bash
# Passive first
echo example.com | gau --threads 5 > gau.txt

# Active crawl
katana -u https://example.com -jc -d 3 -silent >> katana.txt

# Parallel with sources
gospider -s https://example.com --other-source -q >> gospider.txt

# Combine and dedupe
cat gau.txt katana.txt gospider.txt | sort -u > all-endpoints.txt
```

## Scope Control Reference

### Katana Field Scope Options

| Option | Scope                    | Example           |
| ------ | ------------------------ | ----------------- |
| `rdn`  | Root domain + subdomains | `*.example.com`   |
| `fqdn` | Exact subdomain only     | `www.example.com` |
| `dn`   | Domain keyword           | `example`         |

### Custom Scope with Regex

**In-scope regex:**

```bash
katana -u https://example.com -cs 'login|admin|api' -d 3
```

**Out-of-scope regex:**

```bash
katana -u https://example.com -cos 'logout|signout' -d 3
```

## Rate Control

| Tool     | Concurrency   | Rate Limit | Delay          |
| -------- | ------------- | ---------- | -------------- |
| Katana   | `-c 10`       | `-rl 150`  | `-rd 1`        |
| Gospider | `-c 10`       | `-t 5`     | `-k 1`         |
| GAU      | `--threads 5` | N/A        | `--timeout 60` |

## Error Handling

| Error                        | Cause              | Resolution                  |
| ---------------------------- | ------------------ | --------------------------- |
| `context deadline exceeded`  | Slow target        | Increase `--timeout`        |
| `connection refused`         | Target down        | Verify target is accessible |
| `too many open files`        | System limit       | Reduce concurrency (`-c`)   |
| `no results from providers`  | No historical data | Use active crawling instead |
| `headless browser not found` | Chrome missing     | Install Chrome or use `-sc` |
| `permission denied`          | Sandbox issues     | Use `-no-sandbox` flag      |
| `rate limited`               | Too fast           | Reduce `-rl` or add `-rd`   |

## Output Formats

| Tool     | Plain          | JSON     | Notes                         |
| -------- | -------------- | -------- | ----------------------------- |
| Katana   | `-o file.txt`  | `-jsonl` | Also `-sr` for full responses |
| Gospider | `-o dir/`      | `--json` | Creates folder per target     |
| GAU      | `--o file.txt` | `--json` | Includes source info          |

## Tool Reference

### Key Flags Summary

| Tool     | Key Flags                                                                               |
| -------- | --------------------------------------------------------------------------------------- |
| Katana   | `-u` `-list` `-d` `-jc` `-headless` `-kf` `-fs` `-cs` `-cos` `-silent` `-jsonl`         |
| Gospider | `-s` `-S` `-c` `-d` `-t` `-a` `--js` `--sitemap` `--robots` `-q` `--json`               |
| GAU      | `--providers` `--subs` `--from` `--to` `--blacklist` `--mc` `--fc` `--threads` `--json` |

## Best Practices

1. **Start passive** - Use GAU first to avoid detection
2. **Scope properly** - Use `-fs` to stay in scope
3. **Enable JS crawling** - Many endpoints hide in JavaScript
4. **Use headless for SPAs** - Required for React/Angular sites
5. **Combine sources** - Multiple tools find different endpoints
6. **Filter results** - Remove static files and duplicates
7. **Respect rate limits** - Avoid getting blocked
8. **Save raw output** - Keep original data for reference

## References

- [Katana GitHub](https://github.com/projectdiscovery/katana)
- [Katana Documentation](https://docs.projectdiscovery.io/tools/katana/overview)
- [Gospider GitHub](https://github.com/jaeles-project/gospider)
- [GAU GitHub](https://github.com/lc/gau)
- [Wayback Machine API](https://archive.org/help/wayback_api.php)
- [Common Crawl](https://commoncrawl.org/)
