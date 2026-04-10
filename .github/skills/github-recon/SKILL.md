---
name: github-recon
description: Scan Git repositories, GitHub organizations, and source code for leaked secrets, API keys, credentials, and sensitive data. Use when analyzing source code security, when checking for credential exposure, or when the user mentions secret scanning or credential leaks.
tags:
  - security
  - github
  - secrets
  - reconnaissance
  - git-leaks
  - trufflehog
triggers:
  - github recon
  - git secrets
  - leaked credentials
  - trufflehog
  - git leak scan
---

# github-recon

## When to Use

- Need to scan Git repositories for leaked secrets
- User mentions API keys, credentials, or secrets in code
- Analyzing target's public GitHub repositories
- Checking commit history for exposed credentials
- Pre-commit secret scanning setup needed
- Need to validate if leaked credentials are still active

## Quick Start

Scan a GitHub repository for verified secrets:

```bash
trufflehog git https://github.com/target/repo --results=verified
```

Scan a local directory:

```bash
gitleaks git -v path/to/repo
```

## Step-by-Step Process

### Step 1: Choose the Right Tool

**Tool Selection Guide:**

| Tool        | Best For                              |
| ----------- | ------------------------------------- |
| TruffleHog  | Verified secrets with API validation  |
| Gitleaks    | Fast local scanning with custom rules |
| git-secrets | Pre-commit AWS credential prevention  |

### Step 2: TruffleHog - Git Repository Scan

**Scan Public GitHub Repository:**

```bash
# Scan single repository
trufflehog git https://github.com/target/repo --results=verified

# Scan with all result types
trufflehog git https://github.com/target/repo --results=verified,unknown,unverified

# JSON output for processing
trufflehog git https://github.com/target/repo --results=verified --json
```

**Scan GitHub Organization:**

```bash
# Scan entire organization
trufflehog github --org=targetorg --results=verified

# With authentication for private repos
trufflehog github --org=targetorg --token=ghp_xxxx --results=verified

# Include issues and PR comments
trufflehog github --repo=https://github.com/target/repo --issue-comments --pr-comments
```

**Scan Local Repository:**

```bash
# Clone and scan
git clone https://github.com/target/repo
trufflehog git file://repo --results=verified,unknown
```

### Step 3: TruffleHog - Additional Sources

**Scan Filesystem:**

```bash
trufflehog filesystem path/to/directory
trufflehog filesystem path/to/file1.txt path/to/file2.txt
```

**Scan S3 Bucket:**

```bash
trufflehog s3 --bucket=target-bucket --results=verified,unknown
```

**Scan Docker Image:**

```bash
trufflehog docker --image target/image:tag --results=verified
```

**Scan from stdin:**

```bash
cat suspicious_file.txt | trufflehog stdin
```

### Step 4: Gitleaks - Git Repository Scan

**Basic Git Scan:**

```bash
# Scan current directory
gitleaks git -v

# Scan specific repository
gitleaks git -v path/to/repo

# Scan with JSON output
gitleaks git -v --report-path findings.json --report-format json
```

**Scan Commit Range:**

```bash
# Scan specific commit range
gitleaks git -v --log-opts="--all commitA..commitB" path/to/repo

# Scan since specific commit
gitleaks git -v --log-opts="--since=2024-01-01" path/to/repo
```

**Directory/File Scan:**

```bash
# Scan directory
gitleaks dir -v path/to/directory

# Scan from stdin
cat file.txt | gitleaks stdin -v
```

### Step 5: Gitleaks - Advanced Features

**Create Baseline Report:**

```bash
# Generate baseline
gitleaks git --report-path baseline.json

# Scan ignoring baseline
gitleaks git --baseline-path baseline.json --report-path new_findings.json
```

**Enable Archive Scanning:**

```bash
# Scan nested archives (zip, tar, etc.)
gitleaks git -v --max-archive-depth 3
```

**Enable Decoding:**

```bash
# Decode base64, hex, percent-encoded secrets
gitleaks git -v --max-decode-depth 2
```

**Custom Configuration:**

```bash
# Use custom config
gitleaks git -v -c custom_gitleaks.toml

# Enable only specific rules
gitleaks git -v --enable-rule aws-access-key --enable-rule github-pat
```

### Step 6: git-secrets - AWS Focus

**Install and Configure:**

```bash
# Install hooks for repository
cd /path/to/repo
git secrets --install
git secrets --register-aws
```

**Scan Repository:**

```bash
# Scan all files
git secrets --scan

# Scan specific file
git secrets --scan /path/to/file

# Scan entire history
git secrets --scan-history

# Scan recursively
git secrets --scan -r /path/to/directory
```

**Add Custom Patterns:**

```bash
# Add prohibited pattern
git secrets --add 'password\s*=\s*.+'

# Add literal pattern
git secrets --add --literal 'api_key=SECRET123'

# Add allowed pattern (false positive)
git secrets --add --allowed 'EXAMPLE_KEY'
```

### Step 7: Parse and Analyze Results

**TruffleHog JSON Processing:**

```bash
# Extract verified secrets
trufflehog git https://github.com/target/repo --json 2>/dev/null | jq 'select(.Verified==true)'

# Get unique detector types
trufflehog git https://github.com/target/repo --json 2>/dev/null | jq -r '.DetectorName' | sort -u

# Extract file paths with secrets
trufflehog git https://github.com/target/repo --json 2>/dev/null | jq -r '.SourceMetadata.Data.Git.file'
```

**Gitleaks Report Analysis:**

```bash
# Parse JSON report
cat findings.json | jq '.[] | {rule: .RuleID, file: .File, line: .StartLine}'

# Count by rule type
cat findings.json | jq -r '.[].RuleID' | sort | uniq -c | sort -rn
```

### Step 8: CI/CD Integration

**GitHub Actions with TruffleHog:**

```yaml
name: TruffleHog Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: trufflesecurity/trufflehog@main
        with:
          extra_args: --results=verified,unknown
```

**GitHub Actions with Gitleaks:**

```yaml
name: Gitleaks Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Secret Types Detected

### High Priority Credentials

| Type           | Pattern                                | Risk |
| -------------- | -------------------------------------- | ---- |
| AWS Access Key | `AKIA[A-Z0-9]{16}`                     | P1   |
| GitHub PAT     | `ghp_[a-zA-Z0-9]{36}`                  | P1   |
| Google API Key | `AIza[a-zA-Z0-9_-]{35}`                | P1   |
| Private Key    | `-----BEGIN.*PRIVATE KEY-----`         | P1   |
| JWT Token      | `eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+` | P2   |
| Slack Token    | `xox[baprs]-[a-zA-Z0-9-]+`             | P2   |
| Stripe Key     | `sk_live_[a-zA-Z0-9]{24,}`             | P1   |
| Database URL   | `postgres://.*:.*@`                    | P1   |

### TruffleHog Detector Categories

- **Cloud:** AWS, GCP, Azure, DigitalOcean, Heroku
- **Version Control:** GitHub, GitLab, Bitbucket
- **Payment:** Stripe, Square, PayPal, Braintree
- **Communication:** Slack, Discord, Twilio, SendGrid
- **Database:** MongoDB, PostgreSQL, MySQL, Redis

## Examples

### Example 1: Scan GitHub Organization

**Scenario:** Scan all repositories in a target organization

**Command:**

```bash
trufflehog github --org=acmecorp --results=verified --json | tee acme_secrets.json
```

**Output:**

```json
{
  "SourceMetadata": {
    "Data": {
      "Github": {
        "repository": "acmecorp/backend",
        "file": "config/database.yml"
      }
    }
  },
  "DetectorType": 2,
  "DetectorName": "AWS",
  "Verified": true,
  "Raw": "AKIAIOSFODNN7EXAMPLE"
}
```

### Example 2: Local Repository Deep Scan

**Scenario:** Scan local repo with archive and decode support

**Command:**

```bash
gitleaks git -v --max-archive-depth 2 --max-decode-depth 2 --report-path findings.json
```

**Output:**

```
Finding:     "password": "SuperSecret123!"
Secret:      SuperSecret123!
RuleID:      generic-password
Entropy:     3.85
File:        config/settings.json
Line:        45
Commit:      abc123def456
Fingerprint: abc123def456:config/settings.json:generic-password:45
```

### Example 3: Commit History Analysis

**Scenario:** Scan entire Git history for any exposed secrets

**Command:**

```bash
git secrets --scan-history
```

**Output:**

```
config/.env:3:AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[ERROR] Matched prohibited pattern

Possible mitigations:
- Mark false positives as allowed using: git secrets --add --allowed ...
- List your configured patterns: git config --get-all secrets.patterns
```

### Example 4: Multi-Source Reconnaissance

**Scenario:** Comprehensive secret scan across multiple sources

**Commands:**

```bash
# GitHub repos
trufflehog github --org=targetorg --results=verified > github_secrets.json

# S3 buckets (if accessible)
trufflehog s3 --bucket=targetorg-backup --results=verified >> s3_secrets.json

# Docker images
trufflehog docker --image targetorg/app:latest --results=verified >> docker_secrets.json
```

## Configuration Examples

### Gitleaks Custom Config

```toml
# custom_gitleaks.toml
title = "Custom Gitleaks Config"

[extend]
useDefault = true
disabledRules = ["generic-api-key"]

[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''CUSTOM_[A-Z0-9]{32}'''
keywords = ["CUSTOM_"]

[[allowlists]]
description = "Test files"
paths = [
  '''test/.*''',
  '''.*_test\.go'''
]
```

### TruffleHog Custom Detectors

```yaml
# custom_detectors.yaml
detectors:
  - name: CustomAPIKey
    keywords:
      - "CUSTOM_KEY"
    regex:
      secretKey: "CUSTOM_KEY_[A-Za-z0-9]{24}"
    verify:
      - endpoint: "https://api.example.com/verify"
        method: GET
        headers:
          Authorization: "Bearer {secretKey}"
```

## Error Handling

| Error                | Cause                           | Resolution                                  |
| -------------------- | ------------------------------- | ------------------------------------------- |
| Rate limited         | Too many GitHub API requests    | Use `--token` for authentication            |
| Repository not found | Invalid URL or private repo     | Check URL or provide auth token             |
| No secrets found     | Clean repository or wrong scope | Try `--results=verified,unknown,unverified` |
| Permission denied    | Private repository              | Use personal access token                   |
| Timeout              | Large repository                | Use `--since-commit` to limit scope         |

## Tool Reference

### TruffleHog Flags

| Flag                  | Description                           |
| --------------------- | ------------------------------------- |
| `--results`           | Filter: verified, unknown, unverified |
| `--json`              | JSON output format                    |
| `--no-verification`   | Skip credential validation            |
| `--concurrency`       | Number of workers (default: 20)       |
| `--fail`              | Exit code 183 if results found        |
| `--include-detectors` | Comma-separated detector list         |
| `--exclude-detectors` | Exclude specific detectors            |
| `--since-commit`      | Start scanning from commit            |
| `--branch`            | Specific branch to scan               |

### Gitleaks Flags

| Flag                  | Description                  |
| --------------------- | ---------------------------- |
| `-v, --verbose`       | Verbose output               |
| `-c, --config`        | Custom config file path      |
| `-r, --report-path`   | Output report file           |
| `-f, --report-format` | json, csv, junit, sarif      |
| `--baseline-path`     | Ignore findings in baseline  |
| `--max-archive-depth` | Scan nested archives         |
| `--max-decode-depth`  | Decode encoded secrets       |
| `--enable-rule`       | Enable specific rules only   |
| `--exit-code`         | Custom exit code on findings |

### git-secrets Flags

| Flag              | Description                |
| ----------------- | -------------------------- |
| `--install`       | Install git hooks          |
| `--scan`          | Scan files for secrets     |
| `--scan-history`  | Scan entire commit history |
| `--register-aws`  | Add AWS patterns           |
| `--add`           | Add prohibited pattern     |
| `--add --allowed` | Add allowed pattern        |
| `--add-provider`  | Add secret provider        |
| `-r, --recursive` | Recursive directory scan   |

## Best Practices

1. **Use verified results** - Focus on `--results=verified` for confirmed leaks
2. **Create baselines** - Ignore known false positives with baseline reports
3. **Scan commit history** - Secrets may exist in old commits even if removed
4. **Check multiple sources** - GitHub, Docker images, S3, local files
5. **Validate findings** - Verify credentials are actually functional
6. **Report responsibly** - Follow disclosure guidelines for found secrets
7. **Use in CI/CD** - Prevent new secrets from being committed

## References

- [TruffleHog GitHub](https://github.com/trufflesecurity/trufflehog)
- [Gitleaks GitHub](https://github.com/gitleaks/gitleaks)
- [git-secrets GitHub](https://github.com/awslabs/git-secrets)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
