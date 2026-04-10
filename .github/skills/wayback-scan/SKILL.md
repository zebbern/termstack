---
name: wayback-scan
category: scanner
tags:
  - wayback
  - archive
  - url-extraction
  - historical-data
  - endpoint-discovery
  - reconnaissance
triggers:
  - wayback machine
  - waybackurls
  - archived urls
  - historical urls
  - gau
  - waymore
  - url extraction
os: cross-platform
---

# WAYBACK-SCAN

## Purpose

Extract historical URLs and archived responses from web archives to discover hidden endpoints, forgotten parameters, sensitive files, and changes over time. Archive sources contain URLs that may no longer be linked on live sites but remain accessible or reveal attack surface.

## Tools

### waybackurls

- **Description**: Simple Go tool to fetch URLs from Wayback Machine
- **Version**: 0.1.0
- **Language**: Go
- **Install**: `go install github.com/tomnomnom/waybackurls@latest`
- **GitHub**: https://github.com/tomnomnom/waybackurls

### gau (getallurls)

- **Description**: Multi-source URL fetcher with filtering
- **Version**: 2.2.4
- **Language**: Go
- **Install**: `go install github.com/lc/gau/v2/cmd/gau@latest`
- **GitHub**: https://github.com/lc/gau

### waymore

- **Description**: Comprehensive archive URL extractor with response download
- **Version**: 7.5
- **Language**: Python
- **Install**: `pip install waymore`
- **GitHub**: https://github.com/xnl-h4ck3r/waymore

## Installation

### waybackurls Installation

```bash
# Install via go
go install github.com/tomnomnom/waybackurls@latest

# Verify installation
waybackurls -h
```

### gau Installation

```bash
# Install via go
go install github.com/lc/gau/v2/cmd/gau@latest

# Install from source
git clone https://github.com/lc/gau.git
cd gau/cmd
go build
sudo mv gau /usr/local/bin/

# Verify installation
gau --version
```

### waymore Installation

```bash
# Install via pip
pip install waymore

# Install from source
pip install git+https://github.com/xnl-h4ck3r/waymore.git -v

# Upgrade existing installation
pip install --upgrade waymore

# Verify installation
waymore --version
```

## Data Sources

| Source          | waybackurls | gau | waymore   |
| --------------- | ----------- | --- | --------- |
| Wayback Machine | ✅          | ✅  | ✅        |
| Common Crawl    | ❌          | ✅  | ✅        |
| Alien Vault OTX | ❌          | ✅  | ✅        |
| URLScan.io      | ❌          | ✅  | ✅        |
| VirusTotal      | ❌          | ✅  | ✅        |
| Intelligence X  | ❌          | ❌  | ✅ (paid) |

## CLI Reference

### waybackurls Options

```
Usage: cat domains.txt | waybackurls > urls.txt

Options:
  -dates        Show date of fetch in output
  -get-versions Get all versions of each URL
  -no-subs      Don't include subdomains
```

### gau Options

```
Usage: gau [options] domain

Options:
  --blacklist   Extensions to skip (png,jpg,gif)
  --config      Alternate config file path
  --fc          Status codes to filter (404,302)
  --from        Fetch from date (YYYYMM)
  --ft          MIME types to filter
  --fp          Remove duplicate parameters
  --json        Output as JSON
  --mc          Status codes to match (200,500)
  --mt          MIME types to match
  --o           Output filename
  --providers   Sources to use (wayback,commoncrawl,otx,urlscan)
  --proxy       HTTP/SOCKS5 proxy
  --retries     HTTP client retries
  --timeout     HTTP timeout in seconds
  --subs        Include subdomains
  --threads     Worker count
  --to          Fetch to date (YYYYMM)
  --verbose     Verbose output
  --version     Show version
```

### waymore Options

```
Usage: waymore -i domain [options]

Options:
  -i            Target domain or file of domains
  -mode         U (URLs), R (Responses), B (Both)
  -oU           Output file for URLs
  -oR           Output directory for responses
  -n            Exclude subdomains
  -f            Don't filter initial links
  -fc           Filter status codes
  -ft           Filter MIME types
  -mc           Match status codes
  -mt           Match MIME types
  -l            Response limit (default 5000)
  -from         From date (YYYYMM)
  -to           To date (YYYYMM)
  -ci           Capture interval (h/d/m)
  -ko           Keywords only filter
  -xwm          Exclude Wayback Machine
  -xcc          Exclude Common Crawl
  -xav          Exclude Alien Vault
  -xus          Exclude URLScan
  -xvt          Exclude VirusTotal
  -t            Timeout (default 30)
  -p            Processes/threads (default 2)
  -v            Verbose output
  --check-only  Estimate time without running
```

## Workflows

### Quick URL Extraction (waybackurls)

```bash
# Single domain
echo "example.com" | waybackurls > urls.txt

# Multiple domains
cat domains.txt | waybackurls > all_urls.txt

# With timestamps
echo "example.com" | waybackurls -dates > urls_dated.txt

# Exclude subdomains
echo "example.com" | waybackurls -no-subs > main_domain_urls.txt
```

### Multi-Source Extraction (gau)

```bash
# Basic usage
gau example.com

# Filter unwanted extensions
gau --blacklist png,jpg,gif,css,woff,svg,ttf example.com

# Specific date range
gau --from 202201 --to 202312 example.com

# Match only 200 responses
gau --mc 200 example.com

# Include subdomains
gau --subs example.com

# Use specific providers only
gau --providers wayback,urlscan example.com

# Output to file
gau --o urls.txt example.com

# Multiple domains
cat domains.txt | gau --threads 5 > all_urls.txt
```

### Comprehensive Extraction (waymore)

```bash
# URLs only mode
waymore -i example.com -mode U -v

# Download archived responses
waymore -i example.com -mode B -l 1000 -v

# Specific date range
waymore -i example.com -from 2020 -to 202312 -mode U

# Filter for specific extensions
waymore -i example.com -ko "\.js(\?|$)" -mode U

# Exclude sources
waymore -i example.com -xcc -xvt -mode U

# Custom output paths
waymore -i example.com -oU ~/recon/urls.txt -oR ~/recon/responses/

# Check estimated time first
waymore -i example.com --check-only
```

### Filtering by Content Type

```bash
# JavaScript files only (gau)
gau --mt application/javascript example.com

# JavaScript files (waymore)
waymore -i example.com -ko "\.js(\?|$)" -mode U

# HTML pages only
gau --mt text/html example.com

# Filter out images and styles
gau --blacklist png,jpg,gif,css,ico,svg example.com
```

### Date-Based Historical Analysis

```bash
# Get URLs from 2020
gau --from 202001 --to 202012 example.com > urls_2020.txt

# Compare years
waymore -i example.com -from 2019 -to 2019 -mode U -oU urls_2019.txt
waymore -i example.com -from 2023 -to 2023 -mode U -oU urls_2023.txt

# Find new endpoints
comm -13 <(sort urls_2019.txt) <(sort urls_2023.txt) > new_endpoints.txt
```

## Response Download (waymore)

### Download Archived Responses

```bash
# Download first 500 responses
waymore -i example.com -mode R -l 500 -v

# Download both URLs and responses
waymore -i example.com -mode B -l 1000

# One response per day (reduce duplicates)
waymore -i example.com -mode B -ci d -l 500

# One response per month (historical view)
waymore -i example.com -mode B -ci m -l 100
```

### Response Analysis

```bash
# After downloading responses, search for secrets
grep -rE "(api_key|password|secret|token)" ~/.config/waymore/results/example.com/

# Find JavaScript files
find ~/.config/waymore/results/example.com/ -name "*.js" -type f

# Extract inline JavaScript
waymore -i example.com -mode B -oijs

# Use with trufflehog
trufflehog filesystem ~/.config/waymore/results/example.com/

# Use with gf patterns
find ~/.config/waymore/results/example.com/ -type f -exec cat {} \; | gf secrets
```

## Output Processing

### Deduplication and Sorting

```bash
# Remove duplicates
cat urls.txt | sort -u > unique_urls.txt

# Remove query strings for unique paths
cat urls.txt | cut -d'?' -f1 | sort -u > unique_paths.txt

# Count by extension
cat urls.txt | grep -oE '\.[a-zA-Z0-9]+(\?|$)' | sort | uniq -c | sort -rn
```

### URL Filtering with grep

```bash
# JavaScript files
cat urls.txt | grep -E "\.js(\?|$)" > js_files.txt

# API endpoints
cat urls.txt | grep -iE "(api|graphql|rest|v[0-9])" > api_endpoints.txt

# Config/sensitive files
cat urls.txt | grep -iE "\.(json|xml|yml|yaml|config|env|bak)" > config_files.txt

# Admin/internal paths
cat urls.txt | grep -iE "(admin|internal|staging|dev|test)" > internal_paths.txt
```

### Parameter Extraction

```bash
# Extract unique parameters with unfurl
cat urls.txt | unfurl keys | sort -u > params.txt

# URLs with specific parameter
cat urls.txt | grep "debug=" > debug_urls.txt

# Count parameter occurrences
cat urls.txt | unfurl keys | sort | uniq -c | sort -rn | head -20
```

## Integration Patterns

### Pipeline with Other Tools

```bash
# waybackurls -> httpx (check live)
echo "example.com" | waybackurls | httpx -silent -mc 200 > live_urls.txt

# gau -> nuclei
gau --mc 200 example.com | nuclei -t exposures/

# waymore -> linkfinder
waymore -i example.com -mode U
cat ~/.config/waymore/results/example.com/waymore.txt | \
    grep "\.js" | httpx -silent | \
    while read url; do python linkfinder.py -i "$url" -o cli; done

# Subdomain enumeration -> wayback
subfinder -d example.com -silent | waybackurls | sort -u > all_historical_urls.txt
```

### Comprehensive Recon Workflow

```bash
#!/bin/bash
# wayback_recon.sh - Full wayback reconnaissance

DOMAIN="$1"
OUTPUT_DIR="./wayback_$DOMAIN"
mkdir -p "$OUTPUT_DIR"

echo "[*] Running waybackurls..."
echo "$DOMAIN" | waybackurls > "$OUTPUT_DIR/waybackurls.txt"

echo "[*] Running gau..."
gau --blacklist png,jpg,gif,css,woff,svg "$DOMAIN" > "$OUTPUT_DIR/gau.txt"

echo "[*] Merging and deduplicating..."
cat "$OUTPUT_DIR/waybackurls.txt" "$OUTPUT_DIR/gau.txt" | sort -u > "$OUTPUT_DIR/all_urls.txt"

echo "[*] Extracting interesting files..."
grep -iE "\.js(\?|$)" "$OUTPUT_DIR/all_urls.txt" > "$OUTPUT_DIR/js_files.txt"
grep -iE "\.(json|xml|config)" "$OUTPUT_DIR/all_urls.txt" > "$OUTPUT_DIR/config_files.txt"
grep -iE "(api|graphql)" "$OUTPUT_DIR/all_urls.txt" > "$OUTPUT_DIR/api_endpoints.txt"

echo "[*] Complete! Results in $OUTPUT_DIR/"
wc -l "$OUTPUT_DIR"/*.txt
```

### Continuous Monitoring

```bash
# waymore new links file for monitoring
waymore -i example.com -mode U -nlf

# Compare with previous run
diff -u previous_urls.txt ~/.config/waymore/results/example.com/waymore.txt > changes.diff
```

## Configuration

### gau Configuration File

Location: `$HOME/.gau.toml`

```toml
# ~/.gau.toml
retries = 5
threads = 10
timeout = 45
blacklist = ["png", "jpg", "gif", "css", "ico", "svg", "woff", "ttf"]
providers = ["wayback", "commoncrawl", "otx", "urlscan"]

[urlscan]
apikey = "your-urlscan-api-key"

[alienvault]
apikey = "your-alienvault-api-key"
```

### waymore Configuration File

Location: `~/.config/waymore/config.yml`

```yaml
# config.yml
FILTER_CODE: "301,302"
FILTER_MIME: "text/css,image/jpeg,image/png,image/gif"
FILTER_URL: ".css,.jpg,.png,.gif,.ico,.svg,.woff"
FILTER_KEYWORDS: "admin,api,config,backup"
URLSCAN_API_KEY: "your-urlscan-api-key"
DEFAULT_OUTPUT_DIR: "~/.config/waymore"
```

## Troubleshooting

### Rate Limiting

```bash
# gau - increase timeout and retries
gau --timeout 60 --retries 10 example.com

# waymore - adjust rate limit wait time
waymore -i example.com -wrlr 5 -urlr 2 -mode U

# Use fewer providers to reduce load
gau --providers wayback example.com
waymore -i example.com -xcc -xvt -xav -mode U
```

### Large Domains

```bash
# waymore - check time estimate first
waymore -i example.com --check-only

# Limit requests
waymore -i example.com -lr 10000 -mode U

# gau - limit threads
gau --threads 2 example.com

# Process in chunks
waymore -i example.com -from 2020 -to 2020 -mode U -oU urls_2020.txt
waymore -i example.com -from 2021 -to 2021 -mode U -oU urls_2021.txt
```

### Memory Issues (waymore)

```bash
# Set memory threshold
waymore -i example.com -m 80 -mode B

# Reduce parallel processes
waymore -i example.com -p 1 -mode B

# Limit response downloads
waymore -i example.com -l 1000 -mode B
```

## Security Considerations

- Archive data may contain sensitive information (credentials, API keys, PII)
- Respect rate limits - archive services are community resources
- Some URLs may no longer exist - verify with live checks
- Downloaded responses may contain malware - scan before analysis
- Historical data may be outdated - verify current state

## References

- waybackurls: https://github.com/tomnomnom/waybackurls
- gau: https://github.com/lc/gau
- waymore: https://github.com/xnl-h4ck3r/waymore
- Wayback Machine API: https://archive.org/help/wayback_api.php
- Common Crawl: https://commoncrawl.org/
- URLScan API: https://urlscan.io/docs/api/
