---
name: dns-recon
description: Perform comprehensive DNS reconnaissance including record enumeration, zone transfers, and reverse lookups. Use when gathering DNS information about a target, when checking for zone transfers, when mapping DNS infrastructure, or when the user asks about DNS records.
tags:
  - security
  - dns
  - reconnaissance
  - zone-transfer
  - enumeration
triggers:
  - dns recon
  - dns enumeration
  - zone transfer
  - dns records
  - dns reconnaissance
---

# dns-recon

## When to Use

- Need to enumerate DNS records for a domain
- Checking for DNS zone transfer vulnerabilities (AXFR)
- Performing reverse DNS lookups on IP ranges
- Validating subdomain lists against DNS
- Discovering mail servers, name servers, SOA records
- Mapping DNS infrastructure for attack surface
- Finding misconfigurations in DNS setup
- User asks about DNS records or name servers
- DNSSEC zone walking

## Quick Start

```bash
# Fast DNS resolution with dnsx
echo "example.com" | dnsx -silent -a -resp

# Comprehensive DNS enumeration with dnsrecon
dnsrecon -d example.com -t std

# Manual DNS query with dig
dig example.com ANY +noall +answer
```

## Step-by-Step Process

### Phase 1: Fast DNS Resolution (Dnsx)

1. **Resolve hosts from subdomain list:**

   ```bash
   cat subdomains.txt | dnsx -silent
   ```

2. **Get A records with responses:**

   ```bash
   cat subdomains.txt | dnsx -silent -a -resp
   ```

3. **Get multiple record types:**

   ```bash
   cat subdomains.txt | dnsx -silent -recon
   ```

4. **JSON output:**

   ```bash
   cat subdomains.txt | dnsx -silent -a -resp -json -o dns_records.json
   ```

5. **With custom resolvers:**
   ```bash
   cat subdomains.txt | dnsx -silent -r resolvers.txt -a -resp
   ```

### Phase 2: Comprehensive Enumeration (Dnsrecon)

1. **Standard enumeration:**

   ```bash
   dnsrecon -d example.com -t std
   ```

2. **Zone transfer attempt:**

   ```bash
   dnsrecon -d example.com -t axfr
   ```

3. **SRV record enumeration:**

   ```bash
   dnsrecon -d example.com -t srv
   ```

4. **Reverse lookup on range:**

   ```bash
   dnsrecon -r 192.168.1.0/24 -t rvl
   ```

5. **Brute force with wordlist:**

   ```bash
   dnsrecon -d example.com -D wordlist.txt -t brt
   ```

6. **DNSSEC zone walk:**

   ```bash
   dnsrecon -d example.com -t zonewalk
   ```

7. **JSON output:**
   ```bash
   dnsrecon -d example.com -t std -j dns_results.json
   ```

### Phase 3: Manual Inspection (Dig)

1. **Query all records:**

   ```bash
   dig example.com ANY +noall +answer
   ```

2. **Specific record types:**

   ```bash
   dig example.com A +short
   dig example.com MX +short
   dig example.com NS +short
   dig example.com TXT +short
   dig example.com SOA +short
   ```

3. **Zone transfer attempt:**

   ```bash
   dig @ns1.example.com example.com AXFR
   ```

4. **Trace DNS resolution:**

   ```bash
   dig example.com +trace
   ```

5. **Reverse lookup:**
   ```bash
   dig -x 93.184.216.34 +short
   ```

### Phase 4: Combine Results

```bash
# Get subdomains
subfinder -d example.com -silent -o subs.txt

# Resolve all with dnsx
cat subs.txt | dnsx -silent -a -resp -json -o dnsx_results.json

# Run dnsrecon for additional info
dnsrecon -d example.com -t std -j dnsrecon_results.json
```

## Examples

### Example 1: Basic DNS Resolution

**Scenario:** Validate subdomain list and get IPs

```bash
cat subdomains.txt | dnsx -silent -a -resp
```

**Output:**

```
www.example.com [93.184.216.34]
api.example.com [93.184.216.35]
mail.example.com [93.184.216.36]
```

### Example 2: Zone Transfer Check

**Scenario:** Test for AXFR vulnerability

```bash
dnsrecon -d example.com -t axfr
```

**Output:**

```
[*] Testing NS Servers for Zone Transfer
[*] Checking NS: ns1.example.com
[*] ns1.example.com Is vulnerable to Zone Transfer!
[*] Zone Transfer Success!
[+] NS ns1.example.com
[+] A www.example.com 93.184.216.34
[+] A admin.example.com 93.184.216.40
[+] MX mail.example.com 10
```

### Example 3: Comprehensive Enumeration

**Scenario:** Full DNS recon on target

```bash
dnsrecon -d example.com -t std
```

**Output:**

```
[*] Performing General Enumeration of Domain: example.com
[*] DNSSEC is configured for example.com
[-] All nameservers failed to answer the DNSSEC query
[*] SOA ns1.example.com admin.example.com 2024010101 7200 3600 1209600 86400
[*] NS ns1.example.com 93.184.216.1
[*] NS ns2.example.com 93.184.216.2
[*] MX mail.example.com 10
[*] A example.com 93.184.216.34
[*] AAAA example.com 2606:2800:220:1:248:1893:25c8:1946
[*] TXT "v=spf1 include:_spf.example.com ~all"
```

### Example 4: Extract CNAME Records

**Scenario:** Find CNAMEs for takeover candidates

```bash
cat subdomains.txt | dnsx -silent -cname -resp
```

**Output:**

```
support.example.com [hackerone.zendesk.com]
docs.example.com [example.github.io]
status.example.com [statuspage.io]
```

### Example 5: Reverse DNS on IP Range

**Scenario:** Find hostnames from IP range

```bash
dnsrecon -r 192.168.1.0/24 -t rvl
```

**Output:**

```
[*] Reverse Look-up of a Range
[*] Performing Reverse Lookup from 192.168.1.0 to 192.168.1.255
[+] PTR router.local 192.168.1.1
[+] PTR server1.local 192.168.1.10
[+] PTR printer.local 192.168.1.50
```

### Example 6: PTR from ASN

**Scenario:** Discover domains from ASN

```bash
echo AS17012 | dnsx -silent -resp-only -ptr
```

**Output:**

```
api.paypal.com
www.paypal.com
notify.paypal.com
```

### Example 7: SRV Record Discovery

**Scenario:** Find service records

```bash
dnsrecon -d example.com -t srv
```

**Output:**

```
[*] Enumerating SRV Records
[+] SRV _sip._tcp.example.com sip.example.com 5060 10
[+] SRV _xmpp._tcp.example.com xmpp.example.com 5222 10
[+] SRV _ldap._tcp.example.com ldap.example.com 389 10
```

### Example 8: Full Recon Pipeline

**Scenario:** Complete DNS reconnaissance

```bash
TARGET="example.com"
mkdir -p recon/$TARGET/dns

# Get nameservers
dig $TARGET NS +short > recon/$TARGET/dns/nameservers.txt

# Zone transfer attempt
dnsrecon -d $TARGET -t axfr -j recon/$TARGET/dns/axfr.json

# Standard enumeration
dnsrecon -d $TARGET -t std -j recon/$TARGET/dns/std.json

# Resolve subdomains
subfinder -d $TARGET -silent | dnsx -silent -a -resp -json -o recon/$TARGET/dns/resolved.json

# Summary
echo "DNS Recon Complete for $TARGET"
cat recon/$TARGET/dns/nameservers.txt
```

## Error Handling

| Error               | Cause                | Resolution                           |
| ------------------- | -------------------- | ------------------------------------ |
| `no results found`  | No DNS response      | Check domain exists                  |
| `SERVFAIL`          | Server failure       | Try different resolver               |
| `NXDOMAIN`          | Domain doesn't exist | Verify domain spelling               |
| `REFUSED`           | Query refused        | Use different DNS server             |
| `timeout`           | No response          | Increase timeout, check connectivity |
| `transfer failed`   | AXFR not allowed     | Zone transfer disabled (normal)      |
| `could not resolve` | DNS error            | Check network, try custom resolver   |

## Tool Reference

### Dnsx Flags

| Flag                    | Description                 |
| ----------------------- | --------------------------- |
| `-l, -list`             | Input file with hosts       |
| `-d, -domain`           | Domain for bruteforce       |
| `-w, -wordlist`         | Wordlist for bruteforce     |
| `-a`                    | Query A records (default)   |
| `-aaaa`                 | Query AAAA records          |
| `-cname`                | Query CNAME records         |
| `-ns`                   | Query NS records            |
| `-txt`                  | Query TXT records           |
| `-mx`                   | Query MX records            |
| `-soa`                  | Query SOA records           |
| `-ptr`                  | Query PTR records           |
| `-srv`                  | Query SRV records           |
| `-axfr`                 | Query AXFR                  |
| `-caa`                  | Query CAA records           |
| `-recon`                | Query all record types      |
| `-resp`                 | Display DNS response        |
| `-resp-only`            | Response only (no hostname) |
| `-json`                 | JSON output                 |
| `-o, -output`           | Output file                 |
| `-silent`               | Clean output                |
| `-r, -resolver`         | Custom resolvers            |
| `-t, -threads`          | Thread count (default 100)  |
| `-rl, -rate-limit`      | Rate limit                  |
| `-asn`                  | Display ASN info            |
| `-cdn`                  | Display CDN info            |
| `-wd, -wildcard-domain` | Wildcard filtering          |

### Dnsrecon Flags

| Flag                | Description                 |
| ------------------- | --------------------------- |
| `-d, --domain`      | Target domain               |
| `-n, --name_server` | Custom DNS server           |
| `-r, --range`       | IP range for reverse lookup |
| `-D, --dictionary`  | Wordlist for bruteforce     |
| `-t, --type`        | Enumeration type            |
| `-a`                | Perform AXFR with std       |
| `-s`                | SPF record reverse lookup   |
| `-k`                | crt.sh enumeration          |
| `-w`                | Deep whois analysis         |
| `-z`                | DNSSEC zone walk            |
| `-j, --json`        | JSON output file            |
| `-x, --xml`         | XML output file             |
| `-c, --csv`         | CSV output file             |
| `--threads`         | Thread count                |
| `--lifetime`        | Query timeout               |
| `-v, --verbose`     | Verbose output              |

### Dnsrecon Types (-t)

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `std`      | Standard enumeration (SOA, NS, A, AAAA, MX, SRV) |
| `axfr`     | Zone transfer test                               |
| `brt`      | Brute force with dictionary                      |
| `srv`      | SRV record enumeration                           |
| `rvl`      | Reverse lookup on range                          |
| `crt`      | crt.sh certificate search                        |
| `tld`      | TLD expansion                                    |
| `zonewalk` | DNSSEC zone walk                                 |
| `snoop`    | Cache snooping                                   |

### Dig Flags

| Flag             | Description           |
| ---------------- | --------------------- |
| `@server`        | Specify DNS server    |
| `+short`         | Short output          |
| `+noall +answer` | Only answer section   |
| `+trace`         | Trace resolution path |
| `-x IP`          | Reverse lookup        |
| `AXFR`           | Zone transfer request |
| `ANY`            | All record types      |

## Output Interpretation

### DNS Record Types

| Type  | Description        | Security Relevance |
| ----- | ------------------ | ------------------ |
| A     | IPv4 address       | Target IPs         |
| AAAA  | IPv6 address       | IPv6 targets       |
| CNAME | Canonical name     | Subdomain takeover |
| MX    | Mail exchange      | Email security     |
| NS    | Name server        | DNS infrastructure |
| TXT   | Text records       | SPF, DKIM, secrets |
| SOA   | Start of authority | Zone admin info    |
| SRV   | Service records    | Internal services  |
| PTR   | Pointer (reverse)  | Hostname discovery |
| CAA   | Cert authority     | SSL/TLS policy     |

### Dnsx JSON Output

```json
{
  "host": "www.example.com",
  "resolver": ["8.8.8.8:53"],
  "a": ["93.184.216.34"],
  "aaaa": ["2606:2800:220:1:248:1893:25c8:1946"],
  "cname": [],
  "status_code": "NOERROR"
}
```

### Common TXT Records

`v=spf1` (SPF), `v=DKIM1` (DKIM), `_dmarc` (DMARC), `google-site-verification`, `MS=` (Microsoft)

## Advanced Techniques

### Wildcard Detection

```bash
# Check for wildcard
dig randomnonexistent12345.example.com A +short

# Filter wildcards with dnsx
dnsx -l subdomains.txt -wd example.com -o filtered.txt
```

### Custom Resolvers

```bash
# Create resolver list
echo "8.8.8.8" > resolvers.txt
echo "1.1.1.1" >> resolvers.txt

# Use with dnsx
cat subs.txt | dnsx -r resolvers.txt -silent -a -resp
```

## Best Practices

1. **Start with dnsx** - Fast validation of subdomains
2. **Run dnsrecon std** - Comprehensive record enumeration
3. **Check zone transfers** - AXFR vulnerability test
4. **Extract CNAMEs** - Subdomain takeover candidates
5. **Manual dig** - Detailed inspection of interesting records

Use dnsx for bulk resolution (faster), dnsrecon for comprehensive enumeration. Set rate limits when scanning large lists. Use custom resolvers for reliability. Filter wildcards before processing results.

## Integration Examples

### Pipe to Subdomain Takeover Check

```bash
# Find dangling CNAMEs
cat subs.txt | dnsx -silent -cname -resp | grep -i "github\|herokuapp\|s3\|azure"
```

### Pipe to Httpx

```bash
# Resolve and probe
cat subs.txt | dnsx -silent | httpx -silent -sc -title
```

### Export for Reporting

```bash
# CSV export
dnsrecon -d example.com -t std -c dns_report.csv

# JSON processing
cat dnsx_results.json | jq -r '[.host, (.a | join(","))] | @csv'
```

## References

- [Dnsx](https://github.com/projectdiscovery/dnsx) | [Dnsrecon](https://github.com/darkoperator/dnsrecon) | [Dig Manual](https://linux.die.net/man/1/dig)
