---
name: nuclei-scan
description: Scan targets for vulnerabilities using Nuclei template-based scanner. Use when vulnerability assessment is needed, when scanning for CVEs or misconfigurations, when security testing web applications, APIs, or infrastructure, or when validating security findings.
tags:
  - security
  - nuclei
  - vulnerability-scanning
  - cve
  - misconfiguration
triggers:
  - nuclei scan
  - vulnerability scan
  - cve scan
  - nuclei templates
  - security scanning
---

# nuclei-scan

## When to Use

- When vulnerability scanning is needed against web applications or infrastructure
- When scanning for specific CVEs, misconfigurations, or exposures
- When security assessment requires template-based detection
- When validating potential vulnerabilities with real-world conditions
- When scanning for technology-specific vulnerabilities
- When automated security testing is required in CI/CD pipelines
- When generating vulnerability reports in various formats

## Quick Start

Scan a single target with all default templates:

```bash
nuclei -u https://example.com
```

## Step-by-Step Process

1. **Install Nuclei** (if needed):

   ```bash
   go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
   ```

2. **Update Templates** to get latest vulnerability checks:

   ```bash
   nuclei -update-templates
   ```

3. **Basic Scan** against target:

   ```bash
   nuclei -u https://target.com -o results.txt
   ```

4. **Targeted Scan** by severity and tags:

   ```bash
   nuclei -u https://target.com -s critical,high -tags cve -o findings.txt
   ```

5. **Export Results** in structured format:
   ```bash
   nuclei -u https://target.com -je results.json
   ```

## Examples

### Example 1: Single Target Quick Scan

**Scenario:** Basic vulnerability scan against one target

**Command:**

```bash
nuclei -u https://example.com
```

**Output:**

```
[CVE-2021-44228] [http] [critical] https://example.com/api
[git-config] [http] [medium] https://example.com/.git/config
[robots-txt] [http] [info] https://example.com/robots.txt
```

### Example 2: Bulk Scanning from File

**Scenario:** Scan multiple targets from a list

**Command:**

```bash
nuclei -l targets.txt -o results.txt
```

**Output:**

```
[2024-01-15 10:30:45] [CVE-2023-1234] [http] [high] https://app1.example.com/login
[2024-01-15 10:30:47] [exposed-panels] [http] [medium] https://app2.example.com/admin
[2024-01-15 10:30:49] [ssl-cert-expired] [ssl] [low] https://app3.example.com:443
```

### Example 3: Severity-Based Scanning

**Scenario:** Scan for critical and high severity vulnerabilities only

**Command:**

```bash
nuclei -u https://example.com -s critical,high -o critical-findings.txt
```

**Output:**

```
[CVE-2021-44228] [http] [critical] https://example.com/api [Log4Shell RCE]
[CVE-2023-22515] [http] [critical] https://example.com/confluence [Confluence Auth Bypass]
[CVE-2022-41040] [http] [high] https://example.com/owa [ProxyNotShell]
```

### Example 4: Tag-Based Scanning

**Scenario:** Scan for specific vulnerability types

**Command:**

```bash
nuclei -u https://example.com -tags cve,sqli,xss,rce
```

**Output:**

```
[sqli-error-based] [http] [high] https://example.com/search?q=test
[reflected-xss] [http] [medium] https://example.com/page?param=value
[CVE-2024-12345] [http] [critical] https://example.com/api/v1/users
```

### Example 5: Technology-Specific Scanning

**Scenario:** Scan for WordPress vulnerabilities

**Command:**

```bash
nuclei -u https://example.com -tags wordpress -o wp-findings.txt
```

**Output:**

```
[wordpress-version] [http] [info] https://example.com [WordPress 6.2.1]
[wp-plugin-vuln] [http] [high] https://example.com/wp-content/plugins/vuln-plugin
[wp-xmlrpc-enabled] [http] [medium] https://example.com/xmlrpc.php
```

### Example 6: Template Directory Scanning

**Scenario:** Scan using specific template directories

**Command:**

```bash
nuclei -u https://example.com -t cves/ -t exposures/ -t misconfigurations/
```

**Output:**

```
[CVE-2023-44487] [http] [high] https://example.com [HTTP/2 Rapid Reset]
[aws-credentials-exposed] [http] [critical] https://example.com/.env
[phpinfo-disclosure] [http] [low] https://example.com/phpinfo.php
```

### Example 7: JSON Export for Automation

**Scenario:** Export structured results for downstream processing

**Command:**

```bash
nuclei -u https://example.com -je results.json -silent
```

**Output (results.json):**

```json
{
  "template-id": "CVE-2021-44228",
  "info": {
    "name": "Apache Log4j RCE",
    "severity": "critical",
    "tags": ["cve", "cve2021", "rce", "log4j"]
  },
  "host": "https://example.com",
  "matched-at": "https://example.com/api/login",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Example 8: JSONL Output for Streaming

**Scenario:** Generate line-by-line JSON for real-time processing

**Command:**

```bash
nuclei -l targets.txt -j -o results.jsonl
```

**Output:**

```json
{"template-id":"git-config","severity":"medium","host":"https://app1.com","matched-at":"https://app1.com/.git/config"}
{"template-id":"CVE-2023-1234","severity":"high","host":"https://app2.com","matched-at":"https://app2.com/api"}
```

### Example 9: Markdown Report Generation

**Scenario:** Generate human-readable markdown report

**Command:**

```bash
nuclei -u https://example.com -me nuclei-report/
```

**Output (nuclei-report/index.md):**

```markdown
# Nuclei Scan Report

## Critical Findings

- [CVE-2021-44228] Apache Log4j RCE - https://example.com/api

## High Findings

- [SQL Injection] https://example.com/search?id=1
```

### Example 10: Rate-Limited Scanning

**Scenario:** Controlled scan rate for production targets

**Command:**

```bash
nuclei -u https://example.com -rl 50 -bs 10 -c 5 -o results.txt
```

**Output:**

```
[info] Rate limit set to 50 requests/second
[info] Bulk size: 10 hosts per template
[info] Concurrency: 5 templates parallel
[CVE-2023-1234] [http] [high] https://example.com/api
```

### Example 11: Exclude Specific Templates or Tags

**Scenario:** Skip certain checks during scan

**Command:**

```bash
nuclei -u https://example.com -tags cve -etags dos,fuzz -et cves/2020/ -o results.txt
```

**Output:**

```
[info] Excluding tags: dos, fuzz
[info] Excluding template directory: cves/2020/
[CVE-2023-44487] [http] [high] https://example.com
[CVE-2024-12345] [http] [critical] https://example.com/api
```

### Example 12: Custom Headers for Bug Bounty

**Scenario:** Include identification headers for program compliance

**Command:**

```bash
nuclei -l targets.txt -H "X-Bug-Bounty: HackerOne-username" -H "User-Agent: Nuclei-Scanner" -o findings.txt
```

**Output:**

```
[info] Custom headers applied to all requests
[CVE-2023-1234] [http] [high] https://target.com/api
[exposed-panel] [http] [medium] https://target.com/admin
```

### Example 13: Automatic Technology Detection

**Scenario:** Auto-detect technologies and run relevant templates

**Command:**

```bash
nuclei -u https://example.com -as -o tech-findings.txt
```

**Output:**

```
[tech-detect] Detected: nginx, php, wordpress
[info] Running templates matching detected technologies
[wordpress-vuln] [http] [high] https://example.com/wp-admin
[php-info-leak] [http] [low] https://example.com/info.php
```

### Example 14: SARIF Export for CI/CD

**Scenario:** Generate SARIF format for GitHub Actions integration

**Command:**

```bash
nuclei -u https://example.com -se results.sarif -s critical,high
```

**Output:**

```
[info] SARIF export enabled
[info] Scanning for critical,high severity
[CVE-2023-1234] [http] [critical] https://example.com/api
Results exported to: results.sarif
```

## Error Handling

| Error                           | Cause                 | Resolution                          |
| ------------------------------- | --------------------- | ----------------------------------- |
| `no templates found`            | Template path invalid | Run `nuclei -update-templates`      |
| `could not connect`             | Target unreachable    | Check URL, verify connectivity      |
| `rate limit exceeded`           | Too many requests     | Reduce `-rl` value                  |
| `template parsing error`        | Malformed YAML        | Use `nuclei -validate -t file.yaml` |
| `interactsh server error`       | OOB unavailable       | Use `-ni` to disable                |
| `context deadline exceeded`     | Timeout               | Increase `-timeout`                 |
| `signature verification failed` | Unsigned template     | Use `-dut` flag                     |

## Flag Reference

### Target Flags

| Flag                 | Description       |
| -------------------- | ----------------- |
| `-u/-target`         | Single target URL |
| `-l/-list`           | File with targets |
| `-eh/-exclude-hosts` | Hosts to skip     |
| `-sa/-scan-all-ips`  | Scan all DNS IPs  |
| `-resume`            | Resume scan       |

### Template Flags

| Flag                  | Description       |
| --------------------- | ----------------- |
| `-t/-templates`       | Template path/dir |
| `-w/-workflows`       | Workflow path/dir |
| `-nt/-new-templates`  | Latest only       |
| `-as/-automatic-scan` | Auto tech-detect  |
| `-tl`                 | List templates    |
| `-tgl`                | List tags         |

### Filtering Flags

| Flag                     | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `-tags`                  | Include by tag                                  |
| `-etags`                 | Exclude by tag                                  |
| `-s/-severity`           | Filter severity (critical,high,medium,low,info) |
| `-es`                    | Exclude severity                                |
| `-a/-author`             | Filter by author                                |
| `-id/-template-id`       | Specific template IDs                           |
| `-eid/-exclude-id`       | Exclude IDs                                     |
| `-it/-include-templates` | Force include                                   |
| `-et/-exclude-templates` | Force exclude                                   |
| `-tc`                    | DSL condition                                   |
| `-pt/-type`              | Protocol type (http,dns,ssl,tcp)                |

### Output Flags

| Flag                   | Description    |
| ---------------------- | -------------- |
| `-o/-output`           | Output file    |
| `-j/-jsonl`            | JSONL stdout   |
| `-je/-json-export`     | JSON file      |
| `-jle/-jsonl-export`   | JSONL file     |
| `-me/-markdown-export` | Markdown dir   |
| `-se/-sarif-export`    | SARIF file     |
| `-silent`              | Findings only  |
| `-ts/-timestamp`       | Add timestamps |

### Rate Control Flags

| Flag              | Default | Description        |
| ----------------- | ------- | ------------------ |
| `-rl/-rate-limit` | 150     | Requests/second    |
| `-bs/-bulk-size`  | 25      | Hosts parallel     |
| `-c/-concurrency` | 25      | Templates parallel |
| `-timeout`        | 10      | Seconds timeout    |
| `-retries`        | 1       | Retry count        |
| `-mhe`            | 30      | Max host errors    |

### Special Flags

| Flag          | Description       |
| ------------- | ----------------- |
| `-headless`   | Headless browser  |
| `-dast/-fuzz` | Fuzzing mode      |
| `-ni`         | Disable OOB       |
| `-H/-header`  | Custom header     |
| `-p/-proxy`   | HTTP/SOCKS5 proxy |
| `-debug`      | Debug mode        |
| `-stats`      | Statistics        |

## Common Tags

| Category  | Tags                                               |
| --------- | -------------------------------------------------- |
| CVEs      | `cve`, `cve2021`, `cve2022`, `cve2023`, `cve2024`  |
| Injection | `sqli`, `xss`, `xxe`, `ssti`, `rce`, `lfi`, `ssrf` |
| Auth      | `auth-bypass`, `default-login`, `weak-auth`        |
| Exposure  | `exposure`, `misconfig`, `disclosure`              |
| Tech      | `wordpress`, `nginx`, `apache`, `jira`             |
| Cloud     | `aws`, `azure`, `gcp`, `s3`                        |

## Severity Levels

| Level      | Description                            |
| ---------- | -------------------------------------- |
| `critical` | Immediate exploitation, severe impact  |
| `high`     | Significant impact, likely exploitable |
| `medium`   | Moderate impact, requires conditions   |
| `low`      | Minor impact, limited exploitation     |
| `info`     | Informational, no direct impact        |

## Advanced Template Conditions

Complex filtering using `-tc` flag:

```bash
# Severity equals critical
nuclei -tc "severity=='critical'" -l targets.txt

# Tags containing cve
nuclei -tc "contains(tags,'cve')" -l targets.txt

# Protocol type http
nuclei -tc "protocol=='http'" -l targets.txt

# Multiple conditions (AND)
nuclei -tc "contains(tags,'cve') && severity=='critical'" -l targets.txt

# Multiple conditions (OR)
nuclei -tc "contains(id,'xss') || contains(tags,'xss')" -l targets.txt
```

## Workflow Execution

```bash
# Run workflows
nuclei -u https://example.com -w workflows/
nuclei -l targets.txt -w workflows/wordpress-workflow.yaml -s critical,high
```

## Configuration File

Create `~/.config/nuclei/config.yaml`:

```yaml
header:
  - "X-Bug-Bounty: username"
tags: cve,exposure,misconfig
severity: critical,high,medium
rate-limit: 100
exclude-tags: dos,fuzz
```

## Proxy and Debug

```bash
nuclei -u https://example.com -p http://127.0.0.1:8080     # HTTP proxy
nuclei -u https://example.com -p socks5://127.0.0.1:1080  # SOCKS5 proxy
nuclei -u https://example.com -debug                       # Debug mode
nuclei -u https://example.com -tlog trace.log             # Trace log
```

## OOB and Headless

```bash
nuclei -u https://example.com -ni                          # Disable OOB
nuclei -u https://example.com -headless                    # Headless browser
nuclei -u https://example.com -headless -page-timeout 30   # With timeout
```

## Best Practices

1. **Layer severity** - Start critical/high, then expand
2. **Rate limit** - Use `-rl` flag for production targets
3. **Bug bounty headers** - Use `-H` for identification
4. **Export structured** - Use `-je`/`-jle` for automation
5. **Update regularly** - Run `nuclei -update-templates`
6. **Exclude dangerous** - Use `-etags dos,fuzz`
7. **Monitor progress** - Use `-stats` flag
8. **Resume scans** - Use `-resume` for checkpoints

## References

- [Nuclei Documentation](https://docs.projectdiscovery.io/tools/nuclei/overview)
- [Nuclei GitHub Repository](https://github.com/projectdiscovery/nuclei)
- [Nuclei Templates Repository](https://github.com/projectdiscovery/nuclei-templates)
- [Template Writing Guide](https://docs.projectdiscovery.io/templates/introduction)
