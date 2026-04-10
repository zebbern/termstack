---
name: port-scan
description: Discovers open ports and services on target hosts using naabu, masscan, and nmap. Use when needing to identify attack surface, discover running services, find non-standard ports, or enumerate network infrastructure during reconnaissance phase.
tags:
  - security
  - port-scan
  - nmap
  - naabu
  - network
  - services
triggers:
  - port scan
  - nmap scan
  - open ports
  - service discovery
  - network scan
---

# port-scan

## When to Use

- Target domain or IP discovered and need to find open ports
- Subdomain enumeration complete and ready to scan hosts
- Need to identify running services for vulnerability assessment
- Looking for non-standard ports that may expose admin panels
- Preparing targets for service-specific vulnerability scanning
- Building comprehensive attack surface map of infrastructure

## Quick Start

Fast port scan with naabu on top 100 ports:

```bash
naabu -host example.com -top-ports 100 -silent
```

## Tools Overview

### Naabu (Primary - Fast Discovery)

ProjectDiscovery's Go-based port scanner. Optimized for speed and reliability with CDN/WAF awareness.

**Best For:** Initial fast enumeration, CDN detection, pipeline integration

### Masscan (Speed - Large Scale)

Asynchronous TCP port scanner capable of Internet-scale scanning. Uses custom TCP/IP stack.

**Best For:** Large IP ranges, high-speed sweeps, initial broad discovery

### Nmap (Detail - Service Detection)

Industry-standard network scanner with service detection, OS fingerprinting, and scripting engine.

**Best For:** Service version detection, detailed analysis, script-based enumeration

## Step-by-Step Process

### Step 1: Initial Fast Scan with Naabu

Start with naabu for quick enumeration of common ports:

```bash
naabu -host example.com -top-ports 100 -o naabu-ports.txt
```

For multiple hosts from file:

```bash
naabu -list hosts.txt -top-ports 100 -o discovered-ports.txt
```

With JSON output for structured data:

```bash
naabu -host example.com -top-ports 100 -json -o ports.json
```

### Step 2: Extended Port Range Discovery

Scan all ports on promising targets:

```bash
naabu -host example.com -p - -rate 1000 -o all-ports.txt
```

Scan specific port ranges:

```bash
naabu -host example.com -p 1-1000,8000-9000,3389 -o custom-ports.txt
```

### Step 3: CDN/WAF Aware Scanning

Exclude CDN IPs to avoid scanning protected infrastructure:

```bash
naabu -host example.com -top-ports 1000 -exclude-cdn -display-cdn -o filtered-ports.txt
```

### Step 4: High-Speed Scanning with Masscan

For large IP ranges, use masscan for speed:

```bash
masscan 10.0.0.0/8 -p80,443,8080,8443 --rate 10000 -oL masscan-results.txt
```

Full port scan on smaller ranges:

```bash
masscan 192.168.1.0/24 -p1-65535 --rate 5000 -oG masscan-grep.txt
```

### Step 5: Service Version Detection with Nmap

After discovering open ports, identify services:

```bash
nmap -sV -p 80,443,8080 example.com -oX nmap-services.xml
```

For stealth scanning with version detection:

```bash
nmap -sS -sV -p 80,443 --open example.com -oX nmap-results.xml
```

### Step 6: Comprehensive Service Analysis

Full service and script scan on discovered ports:

```bash
nmap -sV -sC -p 22,80,443,8080 example.com -oA nmap-full
```

With OS detection:

```bash
nmap -sS -sV -O -p 80,443 example.com -oX nmap-os.xml
```

### Step 7: Combine Tools in Pipeline

Use naabu to discover, nmap to enumerate:

```bash
naabu -host example.com -top-ports 100 -silent | nmap -sV -iL - -oX services.xml
```

Naabu has built-in nmap integration:

```bash
naabu -host example.com -top-ports 100 -nmap-cli "nmap -sV -oX nmap-output.xml"
```

## Examples

### Example 1: Basic Host Port Scan

**Scenario:** Scan a single domain for common web ports

**Command:**

```bash
naabu -host hackerone.com -p 80,443,8080,8443 -silent
```

**Output:**

```
hackerone.com:80
hackerone.com:443
hackerone.com:8443
```

### Example 2: Subdomain List Scanning

**Scenario:** Scan all discovered subdomains for open ports

**Command:**

```bash
naabu -list subdomains.txt -top-ports 100 -json -o ports.json
```

**Output (ports.json):**

```json
{"ip":"104.16.99.52","port":80,"host":"www.example.com"}
{"ip":"104.16.99.52","port":443,"host":"www.example.com"}
{"ip":"192.168.1.10","port":22,"host":"admin.example.com"}
{"ip":"192.168.1.10","port":8080,"host":"admin.example.com"}
```

### Example 3: Full Port Range Scan

**Scenario:** Discover all open ports on high-value target

**Command:**

```bash
naabu -host admin.example.com -p - -rate 2000 -o all-ports.txt
```

**Output (all-ports.txt):**

```
admin.example.com:22
admin.example.com:80
admin.example.com:443
admin.example.com:3306
admin.example.com:8080
admin.example.com:9090
```

### Example 4: CDN Detection and Filtering

**Scenario:** Identify CDN-protected hosts and scan direct IPs only

**Command:**

```bash
naabu -host example.com -top-ports 100 -exclude-cdn -display-cdn -silent
```

**Output:**

```
[cdn] example.com [cloudflare]
admin.example.com:22
admin.example.com:8080
api.example.com:443
api.example.com:8443
```

### Example 5: High-Speed Network Sweep

**Scenario:** Quickly scan large network for web services

**Command:**

```bash
masscan 10.0.0.0/16 -p80,443,8000-8100 --rate 50000 -oL sweep.txt
```

**Output (sweep.txt):**

```
open tcp 80 10.0.1.15 1609459200
open tcp 443 10.0.1.15 1609459200
open tcp 8080 10.0.2.30 1609459201
open tcp 80 10.0.5.100 1609459202
```

### Example 6: Masscan with JSON Output

**Scenario:** Large-scale scan with structured output

**Command:**

```bash
masscan 192.168.0.0/16 -p22,80,443,3389 --rate 10000 -oJ masscan.json
```

**Output (masscan.json):**

```json
{"ip": "192.168.1.50", "timestamp": "1609459200", "ports": [{"port": 22, "proto": "tcp", "status": "open"}]}
{"ip": "192.168.1.50", "timestamp": "1609459200", "ports": [{"port": 80, "proto": "tcp", "status": "open"}]}
{"ip": "192.168.2.100", "timestamp": "1609459201", "ports": [{"port": 443, "proto": "tcp", "status": "open"}]}
```

### Example 7: Service Version Detection

**Scenario:** Identify exact service versions on open ports

**Command:**

```bash
nmap -sV -p 22,80,443,8080 example.com -oX services.xml
```

**Output:**

```
PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
80/tcp   open  http       nginx 1.18.0
443/tcp  open  ssl/http   nginx 1.18.0
8080/tcp open  http-proxy Apache Tomcat 9.0.50
```

### Example 8: Nmap Script Scanning

**Scenario:** Run default scripts for additional enumeration

**Command:**

```bash
nmap -sV -sC -p 80,443 example.com --open -oX nmap-scripts.xml
```

**Output:**

```
PORT    STATE SERVICE  VERSION
80/tcp  open  http     nginx 1.18.0
| http-title: Example Domain
|_Requested resource was https://example.com/
443/tcp open  ssl/http nginx 1.18.0
| ssl-cert: Subject: commonName=example.com
| Not valid after:  2025-01-15T00:00:00
```

### Example 9: UDP Port Scanning

**Scenario:** Discover UDP services (DNS, SNMP, etc.)

**Naabu UDP scan:**

```bash
naabu -host example.com -p u:53,161,500,1194 -o udp-ports.txt
```

**Nmap UDP scan:**

```bash
nmap -sU -p 53,161,500 example.com -oX udp-services.xml
```

**Output:**

```
PORT    STATE         SERVICE
53/udp  open          domain
161/udp open|filtered snmp
500/udp open|filtered isakmp
```

### Example 10: Stealth SYN Scan

**Scenario:** Low-profile reconnaissance scan

**Command:**

```bash
nmap -sS -Pn -T2 --top-ports 100 example.com -oX stealth.xml
```

**Output:**

```
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https
```

### Example 11: IPv6 Port Scanning

**Scenario:** Scan IPv6 addresses for open ports

**Command:**

```bash
naabu -host example.com -p 80,443 -ip-version 6 -silent
```

**Output:**

```
2606:4700::6810:6434:80
2606:4700::6810:6434:443
```

### Example 12: Passive Port Enumeration

**Scenario:** Discover ports without active scanning using Shodan

**Command:**

```bash
naabu -host example.com -passive -silent
```

**Output:**

```
example.com:22
example.com:80
example.com:443
example.com:8443
```

### Example 13: Pipeline Integration

**Scenario:** Combine port scanning with service detection

**Command:**

```bash
cat hosts.txt | naabu -silent -top-ports 100 | httpx -silent -status-code
```

**Output:**

```
http://example.com:80 [200]
https://example.com:443 [301]
http://admin.example.com:8080 [401]
```

### Example 14: Naabu with Nmap Integration

**Scenario:** Automatic service detection on discovered ports

**Command:**

```bash
naabu -host example.com -top-ports 100 -nmap-cli "nmap -sV -oX nmap.xml"
```

**Output:**

```
[INF] Found 4 ports on host example.com (104.16.99.52)
example.com:80
example.com:443
example.com:8080
example.com:8443
[INF] Running nmap command: nmap -sV -p 80,443,8080,8443 104.16.99.52
```

## Scan Types Reference

### TCP Scan Types

| Type      | Flag  | Description            | Use Case                |
| --------- | ----- | ---------------------- | ----------------------- |
| SYN Scan  | `-sS` | Half-open stealth scan | Default, requires root  |
| Connect   | `-sT` | Full TCP connection    | Unprivileged users      |
| ACK Scan  | `-sA` | Firewall rule mapping  | Identify filtered ports |
| FIN Scan  | `-sF` | Stealth bypass         | IDS evasion             |
| Xmas Scan | `-sX` | Stealth bypass         | IDS evasion             |

### UDP Scanning

| Tool    | Flag          | Notes                 |
| ------- | ------------- | --------------------- |
| Naabu   | `-p u:53,161` | Prefix port with `u:` |
| Nmap    | `-sU`         | Slower, needs root    |
| Masscan | `-pU:53,161`  | Uses `U:` prefix      |

## Timing and Rate Control

| Tool    | Slow         | Medium         | Fast            | Max              |
| ------- | ------------ | -------------- | --------------- | ---------------- |
| Naabu   | `-rate 100`  | `-rate 1000`   | `-rate 5000`    | `-rate 10000`    |
| Nmap    | `-T1`        | `-T3`          | `-T4`           | `-T5`            |
| Masscan | `--rate 100` | `--rate 10000` | `--rate 100000` | `--rate 1000000` |

## Error Handling

| Error                      | Cause                 | Resolution                           |
| -------------------------- | --------------------- | ------------------------------------ |
| `Could not set up libpcap` | Missing libpcap       | Install: `apt install libpcap-dev`   |
| `Permission denied`        | Root required for SYN | Run with sudo or use `-sT`           |
| `Host seems down`          | ICMP blocked          | Add `-Pn` flag                       |
| `No route to host`         | Network unreachable   | Check connectivity and routing       |
| `pcap_sendpacket failed`   | Interface issue       | Specify interface with `-i`          |
| `Rate limit exceeded`      | Too aggressive        | Reduce `--rate` value                |
| `Connection refused`       | Port closed           | Expected for closed ports            |
| `Filtered`                 | Firewall blocking     | Port is filtered, try different scan |

## Output Formats

### Naabu Output Options

| Flag          | Format     | Description            |
| ------------- | ---------- | ---------------------- |
| `-o file.txt` | Plain text | One result per line    |
| `-json`       | JSON Lines | Structured JSON output |
| `-csv`        | CSV        | Comma-separated values |

### Masscan Output Options

| Flag            | Format   | Description          |
| --------------- | -------- | -------------------- |
| `-oL file.txt`  | List     | Simple list format   |
| `-oG file.txt`  | Grepable | Nmap grepable format |
| `-oX file.xml`  | XML      | Nmap XML format      |
| `-oJ file.json` | JSON     | JSON format          |

### Nmap Output Options

| Flag           | Format   | Description       |
| -------------- | -------- | ----------------- |
| `-oN file.txt` | Normal   | Human-readable    |
| `-oG file.txt` | Grepable | grep-friendly     |
| `-oX file.xml` | XML      | Machine-readable  |
| `-oA basename` | All      | All three formats |

## Tool Reference

### Key Flags Summary

| Tool    | Key Flags                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------- |
| Naabu   | `-host` `-list` `-p` `-top-ports` `-rate` `-exclude-cdn` `-nmap-cli` `-json` `-silent` `-passive` |
| Masscan | `-p` `--rate` `--banners` `--source-ip` `--excludefile` `-oL` `-oG` `-oX` `-oJ`                   |
| Nmap    | `-sS` `-sT` `-sU` `-sV` `-sC` `-O` `-p` `-T0-T5` `-Pn` `--open` `-oN/-oG/-oX/-oA`                 |

## Common Port Groups

| Category | Ports                      |
| -------- | -------------------------- |
| Web      | 80,443,8080,8443,8000,8888 |
| Admin    | 22,3389,5900,2222          |
| Database | 3306,5432,1433,27017,6379  |
| Mail     | 25,110,143,465,587,993,995 |

## Best Practices

1. **Start with passive** - Use `-passive` first to avoid detection
2. **Rate limit** - Start low, increase gradually
3. **Exclude CDNs** - Use `-exclude-cdn` to avoid protected IPs
4. **Verify results** - Cross-reference with multiple tools
5. **Use pipelines** - Combine tools for efficiency
6. **Save all output** - Use JSON for automation
7. **Service detection last** - Only on confirmed open ports
8. **Respect scope** - Stay within authorized targets

## References

- [Naabu GitHub](https://github.com/projectdiscovery/naabu)
- [Naabu Documentation](https://docs.projectdiscovery.io/tools/naabu/overview)
- [Masscan GitHub](https://github.com/robertdavidgraham/masscan)
- [Nmap Reference Guide](https://nmap.org/book/man.html)
- [Nmap Port Scanning](https://nmap.org/book/port-scanning.html)
- [Nmap Service Detection](https://nmap.org/book/man-version-detection.html)
