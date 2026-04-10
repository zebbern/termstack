---
name: ssl-check
description: Analyze SSL/TLS configurations for security weaknesses and compliance. Use when testing HTTPS endpoints, when checking for TLS vulnerabilities, when validating certificates, or when auditing cipher suite configurations.
tags:
  - security
  - ssl
  - tls
  - certificate
  - encryption
  - compliance
triggers:
  - ssl check
  - tls analysis
  - certificate check
  - ssl configuration
  - tls security
---

# ssl-check

## When to Use

- Target has HTTPS endpoints requiring TLS security assessment
- Need to check for SSL/TLS vulnerabilities (Heartbleed, POODLE, BEAST, etc.)
- Validating certificate chain and trust configuration
- Auditing cipher suite strength and protocol versions
- Testing STARTTLS services (SMTP, IMAP, POP3, FTP)
- Checking compliance with Mozilla TLS configurations
- Verifying forward secrecy and modern TLS support

## Quick Start

Basic SSL/TLS scan with testssl.sh:

```bash
testssl.sh example.com
```

## Tools Overview

| Tool       | Type        | Best For                                                       |
| ---------- | ----------- | -------------------------------------------------------------- |
| testssl.sh | Bash script | Comprehensive testing, vulnerability checks, no dependencies   |
| sslyze     | Python      | Programmatic analysis, Mozilla compliance, concurrent scanning |

## Step-by-Step Process

### Phase 1: Initial Assessment with testssl.sh

1. **Run comprehensive scan**

   ```bash
   testssl.sh --json-pretty --severity LOW example.com
   ```

2. **Check specific vulnerabilities**

   ```bash
   testssl.sh -U example.com
   ```

3. **Analyze protocols and ciphers**
   ```bash
   testssl.sh -p -e example.com
   ```

### Phase 2: Deep Analysis with sslyze

1. **Full scan with JSON output**

   ```bash
   sslyze --json_out=scan_results.json example.com
   ```

2. **Check Mozilla compliance**

   ```bash
   sslyze --mozilla_config=intermediate example.com
   ```

3. **Multiple targets**
   ```bash
   sslyze target1.com target2.com target3.com
   ```

### Phase 3: Certificate Analysis

1. **Certificate chain validation**

   ```bash
   testssl.sh -S example.com
   ```

2. **Detailed certificate info**
   ```bash
   sslyze example.com --certinfo
   ```

## Examples

### Example 1: Full Vulnerability Scan

**Scenario:** Complete SSL/TLS security assessment

**Command:**

```bash
testssl.sh -U --json-pretty example.com
```

**Output:**

```json
{
  "id": "vulnerabilities",
  "finding": "not vulnerable",
  "severity": "OK",
  "cve": "CVE-2014-0160",
  "cwe": "CWE-126"
}
```

### Example 2: Protocol Version Check

**Scenario:** Verify only secure TLS versions are enabled

**Command:**

```bash
testssl.sh -p example.com
```

**Output:**

```
SSLv2      not offered
SSLv3      not offered
TLS 1      not offered
TLS 1.1    not offered
TLS 1.2    offered
TLS 1.3    offered (final)
```

### Example 3: Cipher Suite Analysis

**Scenario:** Enumerate all supported cipher suites

**Command:**

```bash
testssl.sh -E example.com
```

**Output:**

```
Hexcode  Cipher Suite Name (OpenSSL)       KeyExch.   Encryption  Bits
---------------------------------------------------------------------
 x1302   TLS_AES_256_GCM_SHA384            ECDH 253   AESGCM      256
 x1303   TLS_CHACHA20_POLY1305_SHA256      ECDH 253   ChaCha20    256
 x1301   TLS_AES_128_GCM_SHA256            ECDH 253   AESGCM      128
```

### Example 4: Certificate Chain Validation

**Scenario:** Analyze certificate deployment

**Command:**

```bash
testssl.sh -S example.com
```

**Output:**

```
Certificate Validity (UTC)    2024-01-01 00:00 --> 2025-01-01 23:59
Signature Algorithm           SHA256withRSA
Issuer                        Let's Encrypt Authority X3
Trust (hostname)              Ok via SAN
Chain of trust                Ok
```

### Example 5: Heartbleed Check

**Scenario:** Test for CVE-2014-0160

**Command:**

```bash
testssl.sh -H example.com
```

**Output:**

```
Heartbleed (CVE-2014-0160)    not vulnerable (OK)
```

### Example 6: POODLE Check

**Scenario:** Test for SSL POODLE vulnerability

**Command:**

```bash
testssl.sh -O example.com
```

**Output:**

```
POODLE, SSL (CVE-2014-3566)   not vulnerable (OK)
```

### Example 7: Mozilla Compliance Check

**Scenario:** Verify against Mozilla modern configuration

**Command:**

```bash
sslyze --mozilla_config=modern example.com
```

**Output:**

```
COMPLIANCE AGAINST MOZILLA TLS CONFIGURATION
--------------------------------------------
Checking results against Mozilla's "modern" configuration.

example.com:443: FAILED - Not compliant.
    * tls_versions: TLS 1.2 is supported, but not individual.
    * ciphers: TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 is not individual.
```

### Example 8: STARTTLS Mail Server Scan

**Scenario:** Test SMTP server TLS configuration

**Command:**

```bash
testssl.sh --starttls smtp smtp.example.com:587
```

**Output:**

```
Testing protocols via STARTTLS handshake

SSLv2      not offered
SSLv3      not offered
TLS 1.2    offered
TLS 1.3    offered (final)
```

### Example 9: sslyze STARTTLS Scan

**Scenario:** Test IMAP server with sslyze

**Command:**

```bash
sslyze --starttls imap imap.example.com:143
```

**Output:**

```
SCAN RESULTS FOR IMAP.EXAMPLE.COM:143
-------------------------------------
* TLS 1.3 Cipher Suites:
    TLS_AES_256_GCM_SHA384
    TLS_CHACHA20_POLY1305_SHA256
```

### Example 10: JSON Output for Automation

**Scenario:** Generate machine-parseable results

**Command:**

```bash
testssl.sh --json example.com -oJ results.json
```

**Output (results.json):**

```json
{
  "scanResult": [
    {
      "serverDefaults": {
        "cert_commonName": "example.com",
        "cert_notAfter": "2025-01-01"
      }
    }
  ]
}
```

### Example 11: Concurrent Multi-Target Scan

**Scenario:** Scan multiple hosts efficiently

**Command:**

```bash
sslyze target1.com target2.com target3.com --json_out=multi.json
```

**Output:**

```
Scanned 3 servers in 12.5 seconds.
```

### Example 12: Forward Secrecy Check

**Scenario:** Verify PFS cipher support

**Command:**

```bash
testssl.sh -f example.com
```

**Output:**

```
Forward Secrecy (PFS):  offered (OK)
  ECDHE-RSA-AES256-GCM-SHA384   ECDH 256
  ECDHE-RSA-AES128-GCM-SHA256   ECDH 256
  ECDHE-RSA-CHACHA20-POLY1305   ECDH 256
```

### Example 13: RC4 Cipher Detection

**Scenario:** Check for weak RC4 ciphers

**Command:**

```bash
testssl.sh -4 example.com
```

**Output:**

```
RC4 (CVE-2013-2566, CVE-2015-2808)  no RC4 ciphers detected (OK)
```

### Example 14: Mass Testing from File

**Scenario:** Batch scan multiple targets

**Command:**

```bash
testssl.sh --file targets.txt --parallel
```

**targets.txt:**

```
example1.com
example2.com:8443
https://example3.com/
```

## Vulnerability Reference

| Vulnerability | CVE            | testssl.sh Flag | sslyze ScanCommand      | Severity |
| ------------- | -------------- | --------------- | ----------------------- | -------- |
| Heartbleed    | CVE-2014-0160  | `-H`            | `HEARTBLEED`            | CRITICAL |
| CCS Injection | CVE-2014-0224  | `-I`            | `OPENSSL_CCS_INJECTION` | HIGH     |
| POODLE (SSL)  | CVE-2014-3566  | `-O`            | N/A                     | MEDIUM   |
| BEAST         | CVE-2011-3389  | `-A`            | N/A                     | MEDIUM   |
| CRIME         | CVE-2012-4929  | `-C`            | `TLS_COMPRESSION`       | MEDIUM   |
| BREACH        | CVE-2013-3587  | `-B`            | N/A                     | MEDIUM   |
| FREAK         | CVE-2015-0204  | `-F`            | N/A                     | HIGH     |
| LOGJAM        | CVE-2015-4000  | `-J`            | N/A                     | HIGH     |
| DROWN         | CVE-2016-0800  | `-D`            | N/A                     | HIGH     |
| SWEET32       | CVE-2016-2183  | `-W`            | N/A                     | MEDIUM   |
| ROBOT         | CVE-2017-13099 | `-BB`           | `ROBOT`                 | HIGH     |
| Ticketbleed   | CVE-2016-9244  | `-T`            | N/A                     | MEDIUM   |
| LUCKY13       | CVE-2013-0169  | `-L`            | N/A                     | LOW      |
| Renegotiation | CVE-2009-3555  | `-R`            | `SESSION_RENEGOTIATION` | MEDIUM   |

## Protocol Security Reference

| Protocol | Status      | testssl.sh | sslyze ScanCommand      |
| -------- | ----------- | ---------- | ----------------------- |
| SSL 2.0  | Deprecated  | `-p`       | `SSL_2_0_CIPHER_SUITES` |
| SSL 3.0  | Deprecated  | `-p`       | `SSL_3_0_CIPHER_SUITES` |
| TLS 1.0  | Deprecated  | `-p`       | `TLS_1_0_CIPHER_SUITES` |
| TLS 1.1  | Deprecated  | `-p`       | `TLS_1_1_CIPHER_SUITES` |
| TLS 1.2  | Acceptable  | `-p`       | `TLS_1_2_CIPHER_SUITES` |
| TLS 1.3  | Recommended | `-p`       | `TLS_1_3_CIPHER_SUITES` |

## testssl.sh Flag Reference

| Flag            | Description                            |
| --------------- | -------------------------------------- |
| `-p`            | Check TLS/SSL protocols                |
| `-e`            | Check each local cipher remotely       |
| `-E`            | Check ciphers per protocol             |
| `-s`            | Test standard cipher lists by strength |
| `-S`            | Server defaults and certificate info   |
| `-P`            | Server preference for protocol+cipher  |
| `-h`            | HTTP security headers                  |
| `-U`            | All vulnerability checks               |
| `-H`            | Heartbleed check                       |
| `-I`            | CCS injection check                    |
| `-O`            | POODLE check                           |
| `-A`            | BEAST check                            |
| `-C`            | CRIME check (TLS compression)          |
| `-B`            | BREACH check                           |
| `-F`            | FREAK check                            |
| `-J`            | LOGJAM check                           |
| `-D`            | DROWN check                            |
| `-W`            | SWEET32 check                          |
| `-BB`           | ROBOT check                            |
| `-T`            | Ticketbleed check                      |
| `-R`            | Renegotiation check                    |
| `-f`            | Forward secrecy check                  |
| `-4`            | RC4 cipher check                       |
| `--json`        | Flat JSON output                       |
| `--json-pretty` | Pretty JSON output                     |
| `--csv`         | CSV output                             |
| `--html`        | HTML output                            |
| `--severity`    | Filter by LOW/MEDIUM/HIGH/CRITICAL     |
| `--starttls`    | STARTTLS protocol (smtp/imap/pop3/ftp) |
| `--parallel`    | Parallel scanning for mass tests       |
| `--file`        | Read targets from file                 |

## sslyze Flag Reference

| Flag               | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `--mozilla_config` | Check against Mozilla config (modern/intermediate/old)        |
| `--json_out`       | Output results to JSON file                                   |
| `--starttls`       | STARTTLS protocol (smtp/imap/pop3/ftp/ldap/rdp/postgres/xmpp) |
| `--certinfo`       | Detailed certificate information                              |
| `--heartbleed`     | Test for Heartbleed vulnerability                             |
| `--robot`          | Test for ROBOT vulnerability                                  |
| `--compression`    | Test for TLS compression (CRIME)                              |
| `--fallback`       | Test for TLS_FALLBACK_SCSV                                    |
| `--reneg`          | Test for insecure renegotiation                               |

## Output Parsing

### Parse testssl.sh JSON with jq

```bash
# Extract all vulnerabilities
jq '.scanResult[].vulnerabilities[]' results.json

# Find critical issues
jq '.scanResult[] | select(.severity == "CRITICAL")' results.json

# Get certificate expiry
jq '.scanResult[].serverDefaults.cert_notAfter' results.json

# List supported protocols
jq '.scanResult[].protocols[] | select(.finding == "offered")' results.json

# Extract cipher suites
jq '.scanResult[].ciphers[] | select(.severity == "OK")' results.json
```

### Parse sslyze JSON

```bash
# Get server scan status
jq '.server_scan_results[].scan_status' results.json

# Extract certificate info
jq '.server_scan_results[].scan_result.certificate_info' results.json

# Check for Heartbleed
jq '.server_scan_results[].scan_result.heartbleed.result.is_vulnerable_to_heartbleed' results.json

# List TLS 1.3 ciphers
jq '.server_scan_results[].scan_result.tls_1_3_cipher_suites.result.accepted_cipher_suites[].cipher_suite.name' results.json
```

## Error Handling

| Error                             | Cause                         | Resolution                                  |
| --------------------------------- | ----------------------------- | ------------------------------------------- |
| `Connection refused`              | Port not open or filtered     | Verify port is accessible, check firewall   |
| `Connection timed out`            | Network issues or slow server | Use `--connect-timeout` to increase timeout |
| `hostname could not be resolved`  | DNS resolution failed         | Verify hostname, check DNS settings         |
| `Certificate verification failed` | Self-signed or invalid cert   | Expected for some targets, document finding |
| `No cipher suites in common`      | Server/client cipher mismatch | Server may have restricted cipher list      |
| `SSL routines:ssl3_read_bytes`    | Protocol mismatch             | Server may not support tested protocol      |
| `unable to find STARTTLS`         | STARTTLS not supported        | Service may use direct TLS instead          |
| `Proxy error`                     | Proxy configuration issue     | Verify `--proxy` settings if using proxy    |
| `command not found: testssl.sh`   | Tool not installed            | Install via package manager or clone repo   |
| `sslyze: command not found`       | Tool not installed            | Install via `pip install sslyze`            |

## Security Assessment Checklist

### Critical (Must Fix)

- [ ] SSL 2.0 disabled
- [ ] SSL 3.0 disabled
- [ ] TLS 1.0 disabled (if possible)
- [ ] Not vulnerable to Heartbleed
- [ ] Not vulnerable to ROBOT
- [ ] Not vulnerable to DROWN

### High Priority

- [ ] TLS 1.1 disabled (if possible)
- [ ] Not vulnerable to CCS Injection
- [ ] Not vulnerable to FREAK
- [ ] Not vulnerable to LOGJAM
- [ ] Forward secrecy enabled

### Medium Priority

- [ ] TLS compression disabled (CRIME)
- [ ] No SWEET32 vulnerable ciphers
- [ ] Secure renegotiation supported
- [ ] TLS_FALLBACK_SCSV supported

### Best Practices

- [ ] TLS 1.3 supported
- [ ] Strong cipher suites only
- [ ] Valid certificate chain
- [ ] Certificate not expiring soon
- [ ] HSTS header present

## References

- [testssl.sh Official Site](https://testssl.sh/)
- [testssl.sh GitHub](https://github.com/testssl/testssl.sh)
- [testssl.sh Man Page](https://testssl.sh/doc/testssl.1.html)
- [sslyze GitHub](https://github.com/nabla-c0d3/sslyze)
- [sslyze Documentation](https://nabla-c0d3.github.io/sslyze/documentation/)
- [Mozilla SSL Configuration](https://ssl-config.mozilla.org/)
- [OWASP TLS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html)
