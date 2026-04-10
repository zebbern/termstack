---
name: triage-findings
description: Deduplicate, prioritize, and rank vulnerability findings using CVSS, EPSS, and business context. Use when processing scan results, correlating multiple findings, determining remediation priority, or when the agent needs to organize discovered vulnerabilities.
tags:
  - security
  - triage
  - cvss
  - prioritization
  - deduplication
triggers:
  - triage findings
  - prioritize vulnerabilities
  - deduplicate findings
  - rank vulnerabilities
---

# triage-findings

## When to Use

- Processing vulnerability scan results that need prioritization
- Multiple findings need deduplication and correlation
- Determining which vulnerabilities to report first
- Correlating findings across different tools or endpoints
- Creating actionable remediation priority lists
- Filtering false positives from valid findings
- Assessing business impact of discovered vulnerabilities

## Quick Start

Basic triage workflow:

```markdown
## Findings Triage Summary

### Critical Priority (Immediate Action Required)

| CVE            | CVSS | EPSS  | KEV | Finding   | Affected |
| -------------- | ---- | ----- | --- | --------- | -------- |
| CVE-2024-XXXXX | 9.8  | 87.5% | Yes | RCE in... | server01 |

### High Priority

| CVE            | CVSS | EPSS  | KEV | Finding    | Affected        |
| -------------- | ---- | ----- | --- | ---------- | --------------- |
| CVE-2024-YYYYY | 8.1  | 23.4% | No  | SQLi in... | app.example.com |

### Deduplicated (Same Root Cause)

- CVE-2024-ZZZZZ: Found on 5 endpoints (single patch needed)

### False Positives Identified

- Finding X: Version mismatch (patched version detected)
```

## Step-by-Step Process

### Step 1: Collect All Findings

**Aggregate from multiple sources:**

```markdown
Sources to consolidate:

- Automated scanner results (Nuclei, Burp, etc.)
- Manual testing findings
- Exploit agent confirmed vulnerabilities
- Recon-discovered exposures

Capture for each finding:

1. Vulnerability type/name
2. CVE ID (if applicable)
3. Affected endpoint/asset
4. Evidence/proof
5. Tool that found it
6. Timestamp discovered
```

**Initial Data Structure:**

```json
{
  "findings": [
    {
      "id": "FIND-001",
      "cve": "CVE-2024-12345",
      "type": "SQL Injection",
      "endpoint": "https://example.com/api/search",
      "parameter": "q",
      "evidence": "Response time delay confirmed",
      "tool": "manual",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Step 2: Deduplicate Findings

**Deduplication Strategies:**

| Strategy   | When to Use                    | Example                      |
| ---------- | ------------------------------ | ---------------------------- |
| CVE-based  | Same CVE across hosts          | Log4j on 10 servers          |
| Root cause | Different symptoms, same issue | Multiple XSS from one sink   |
| Endpoint   | Same vuln, different params    | SQLi in ?id= and ?user=      |
| Component  | Shared vulnerable library      | jQuery 2.x across subdomains |

**Deduplication Process:**

```markdown
1. Group by CVE ID (exact match)
2. Group by vulnerability type + root cause
3. Group by affected component/library
4. Identify parent/child relationships
5. Mark as:
   - UNIQUE: Distinct vulnerability
   - DUPLICATE: Same as another finding
   - RELATED: Connected but separate
```

**Example Deduplication:**

```markdown
## Before Deduplication (15 findings)

- CVE-2024-1234 on server01
- CVE-2024-1234 on server02
- CVE-2024-1234 on server03
- SQLi in /api/users?id=
- SQLi in /api/orders?id=
- SQLi in /api/products?id=
- XSS in search field
- XSS in comment field
  ...

## After Deduplication (5 unique findings)

1. CVE-2024-1234 (3 affected hosts)
2. SQLi in ID parameters (3 endpoints, same sink)
3. XSS - Stored (2 injection points, different handlers)
   ...
```

### Step 3: Enrich with CVSS Scores

**CVSS 3.1 Severity Levels:**

| Score    | Severity | Priority      |
| -------- | -------- | ------------- |
| 9.0-10.0 | Critical | Immediate     |
| 7.0-8.9  | High     | 24-48 hours   |
| 4.0-6.9  | Medium   | 1-2 weeks     |
| 0.1-3.9  | Low      | Scheduled     |
| 0.0      | None     | Informational |

**Calculating Custom CVSS:**

```markdown
For findings without CVE, calculate CVSS manually:

Base Metrics:

- Attack Vector: N(etwork)/A(djacent)/L(ocal)/P(hysical)
- Attack Complexity: L(ow)/H(igh)
- Privileges Required: N(one)/L(ow)/H(igh)
- User Interaction: N(one)/R(equired)
- Scope: U(nchanged)/C(hanged)
- Confidentiality: N(one)/L(ow)/H(igh)
- Integrity: N(one)/L(ow)/H(igh)
- Availability: N(one)/L(ow)/H(igh)

Common Patterns:

- Unauthenticated RCE: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8
- Auth SQLi: CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H = 8.8
- Reflected XSS: CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N = 6.1
- Info Disclosure: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N = 5.3
```

### Step 4: Add EPSS Exploit Probability

**EPSS Overview:**

```markdown
Exploit Prediction Scoring System (EPSS) v4

- Probability score: 0% to 100%
- Predicts likelihood of exploitation in next 30 days
- Data-driven ML model updated daily
- Higher = more likely to be exploited

EPSS Thresholds:

- > 50%: Very high likelihood, prioritize immediately
- 10-50%: Significant likelihood, high priority
- 1-10%: Moderate likelihood, standard priority
- < 1%: Low likelihood, can be scheduled
```

**Fetching EPSS Scores:**

```bash
# Single CVE lookup
curl -s "https://api.first.org/data/v1/epss?cve=CVE-2024-12345"

# Multiple CVEs
curl -s "https://api.first.org/data/v1/epss?cve=CVE-2024-12345,CVE-2024-67890"

# Response format
{
  "data": [
    {
      "cve": "CVE-2024-12345",
      "epss": "0.87523",
      "percentile": "0.99421"
    }
  ]
}
```

**EPSS Integration:**

```markdown
| CVE           | CVSS Base | EPSS Score | EPSS Percentile | Priority    |
| ------------- | --------- | ---------- | --------------- | ----------- |
| CVE-2024-1234 | 9.8       | 87.5%      | 99th            | CRITICAL    |
| CVE-2024-5678 | 7.5       | 2.1%       | 65th            | MEDIUM      |
| CVE-2024-9012 | 9.1       | 0.3%       | 32nd            | HIGH (CVSS) |
```

### Step 5: Check CISA KEV Catalog

**Known Exploited Vulnerabilities:**

```markdown
CISA KEV Catalog Importance:

- Vulnerabilities actively exploited in the wild
- Federal agencies must remediate by deadline
- Highest priority for any organization
- If in KEV = Critical priority regardless of CVSS

KEV Check Process:

1. Download current KEV catalog (JSON)
2. Match CVE IDs against findings
3. Note remediation deadline
4. Flag as CRITICAL priority
```

**KEV Catalog Check:**

```bash
# Download KEV catalog
curl -s "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json" \
  -o kev.json

# Check if CVE is in KEV
jq '.vulnerabilities[] | select(.cveID=="CVE-2024-12345")' kev.json
```

**KEV Match Format:**

```markdown
## CISA KEV Match Found

**CVE-2024-12345** is in CISA Known Exploited Vulnerabilities catalog

- Vendor: Example Corp
- Product: Example Server
- Vulnerability: Remote Code Execution
- Date Added: 2024-01-10
- Due Date: 2024-01-31
- Notes: Active exploitation observed

**ACTION REQUIRED**: Remediate immediately (federal deadline applies)
```

### Step 6: Apply Prioritization Matrix

**Combined Scoring Matrix:**

```markdown
Priority Calculation:

CRITICAL (Score 100):

- In CISA KEV catalog, OR
- CVSS >= 9.0 AND EPSS > 50%

HIGH (Score 75-99):

- CVSS >= 9.0 with any EPSS, OR
- CVSS 7.0-8.9 AND EPSS > 10%, OR
- Confirmed exploitation in the wild

MEDIUM (Score 50-74):

- CVSS 7.0-8.9 with EPSS < 10%, OR
- CVSS 4.0-6.9 with any exploitation evidence, OR
- High business impact asset

LOW (Score 25-49):

- CVSS 4.0-6.9 with no exploitation evidence, OR
- CVSS < 4.0 on important assets

INFORMATIONAL (Score 0-24):

- CVSS < 4.0 on non-critical assets, OR
- Best practice violations
```

**Priority Score Formula:**

```markdown
Base Score = CVSS_Score \* 10

Multipliers:

- KEV listed: +50 (automatic CRITICAL)
- EPSS > 50%: +30
- EPSS 10-50%: +20
- EPSS 1-10%: +10
- High-value asset: +15
- Internet-facing: +10
- Contains sensitive data: +10

Final Priority = min(Base Score + Multipliers, 100)
```

### Step 7: Generate Triage Report

**Triage Output Template:**

```markdown
# Vulnerability Triage Report

**Date:** YYYY-MM-DD
**Scope:** [Target description]
**Total Findings:** X
**Unique Vulnerabilities:** Y
**Duplicates Removed:** Z

---

## Executive Summary

| Priority | Count | % of Total |
| -------- | ----- | ---------- |
| Critical | X     | X%         |
| High     | X     | X%         |
| Medium   | X     | X%         |
| Low      | X     | X%         |
| Info     | X     | X%         |

---

## Critical Findings (Immediate Action)

### CRIT-001: [Vulnerability Name]

| Attribute | Value                 |
| --------- | --------------------- |
| CVE       | CVE-YYYY-NNNNN        |
| CVSS      | 9.8 (Critical)        |
| EPSS      | 87.5%                 |
| KEV       | Yes (Due: YYYY-MM-DD) |
| Affected  | [endpoints]           |

**Evidence:** [Proof of vulnerability]

**Recommendation:** [Specific fix]

---

## High Priority Findings

[Similar format for High priority items]

---

## Deduplicated Findings Summary

| Finding        | Occurrences | Root Cause      |
| -------------- | ----------- | --------------- |
| CVE-2024-XXXXX | 5 servers   | Single patch    |
| XSS variants   | 3 endpoints | Output encoding |

---

## False Positives Excluded

| Finding   | Reason for Exclusion |
| --------- | -------------------- |
| [Finding] | [Justification]      |

---

## Remediation Priority Order

1. [CRIT-001] - CVE-2024-XXXXX - Patch immediately
2. [HIGH-001] - SQLi in API - Code fix required
3. [HIGH-002] - Outdated TLS - Config change
   ...
```

## Examples

### Example 1: Scan Results Triage

**Scenario:** Processing 50 findings from automated scanner

```markdown
# Triage: Nuclei Scan Results

**Input:** 50 findings from nuclei scan
**After Deduplication:** 23 unique vulnerabilities

## Priority Breakdown

### Critical (2)

1. **CVE-2024-29847** - Ivanti EPM RCE
   - CVSS: 10.0 | EPSS: 94.2% | KEV: Yes
   - Affected: epm.internal.example.com
   - Action: Patch to 2024 SU1 immediately

2. **CVE-2023-46747** - F5 BIG-IP RCE
   - CVSS: 9.8 | EPSS: 89.1% | KEV: Yes
   - Affected: lb01.example.com
   - Action: Apply hotfix + block mgmt port

### High (5)

1. **SQL Injection** - /api/v2/search
   - CVSS: 8.6 | No CVE (custom code)
   - EPSS: N/A | 3 endpoints affected
   - Action: Parameterized queries needed

2. **CVE-2024-21762** - FortiOS SSL VPN
   - CVSS: 9.6 | EPSS: 45.3% | KEV: No
   - Affected: vpn.example.com
   - Action: Upgrade FortiOS to 7.4.3+

[Continue for remaining findings...]

### Deduplicated (27 findings → grouped)

| Original Finding         | Count | Grouped As               |
| ------------------------ | ----- | ------------------------ |
| jQuery CVE-2020-11022    | 12    | LOW-001 (12 subdomains)  |
| Missing security headers | 8     | INFO-001 (all endpoints) |
| TLS 1.0 enabled          | 7     | MED-003 (7 servers)      |
```

### Example 2: Multi-Tool Correlation

**Scenario:** Correlating findings from Burp, Nuclei, and manual testing

```markdown
# Cross-Tool Triage Correlation

## Finding Correlation Matrix

| Vulnerability  | Burp | Nuclei | Manual | Status             |
| -------------- | ---- | ------ | ------ | ------------------ |
| SQLi in search | ✓    | ✓      | ✓      | CONFIRMED (3/3)    |
| XSS in profile | ✓    | ✗      | ✓      | CONFIRMED (2/3)    |
| SSRF attempt   | ✓    | ✗      | ✗      | NEEDS VERIFICATION |
| Log4Shell      | ✗    | ✓      | ✗      | FALSE POSITIVE     |

## Correlation Notes

### SQLi in Search (HIGH CONFIDENCE)

- Burp: Time-based blind SQLi confirmed
- Nuclei: Error-based detection triggered
- Manual: UNION-based extraction successful
- **Verdict:** CONFIRMED - Exploit exists

### XSS in Profile (MEDIUM CONFIDENCE)

- Burp: Reflected XSS in name field
- Manual: Stored XSS confirmed in bio field
- Nuclei: Template didn't trigger
- **Verdict:** CONFIRMED - Multiple vectors

### SSRF Attempt (LOW CONFIDENCE)

- Burp: Suspicious redirect behavior
- Not confirmed by other tools
- **Verdict:** NEEDS RETEST

### Log4Shell Detection (FALSE POSITIVE)

- Nuclei: Detected Log4j usage
- Verification: Version 2.17.1 (patched)
- **Verdict:** FALSE POSITIVE - Excluded
```

### Example 3: Business Context Triage

**Scenario:** Prioritizing based on asset criticality

```markdown
# Business-Contextualized Triage

## Asset Classification

| Asset                | Type       | Data Classification | Business Impact |
| -------------------- | ---------- | ------------------- | --------------- |
| payments.example.com | Production | PCI DSS             | Critical        |
| blog.example.com     | Production | Public              | Low             |
| staging.example.com  | Non-Prod   | Test Data           | Medium          |

## Adjusted Priorities

### Original vs. Adjusted

| Finding   | CVSS | Original Priority | Asset    | Adjusted Priority        |
| --------- | ---- | ----------------- | -------- | ------------------------ |
| XSS       | 6.1  | Medium            | payments | **HIGH** (PCI)           |
| RCE       | 9.8  | Critical          | staging  | **HIGH** (non-prod)      |
| SQLi      | 8.6  | High              | blog     | **MEDIUM** (public only) |
| Info Disc | 5.3  | Medium            | payments | **HIGH** (PCI data)      |

### Priority Adjustment Rules Applied

1. **PCI DSS systems**: +2 severity levels for any data exposure
2. **Non-production**: -1 severity level (still report)
3. **Public-only data**: -1 severity level
4. **Internet-facing**: +1 severity level
5. **Admin access**: +1 severity level

## Final Remediation Order

1. XSS on payments.example.com (PCI compliance risk)
2. Info Disclosure on payments.example.com (PCI data)
3. RCE on staging.example.com (lateral movement risk)
4. SQLi on blog.example.com (public content only)
```

## Error Handling

| Issue                 | Cause                          | Resolution                       |
| --------------------- | ------------------------------ | -------------------------------- |
| No CVE available      | Zero-day or custom code        | Calculate manual CVSS score      |
| EPSS not found        | New CVE not in database        | Use CVSS only, check again later |
| KEV check fails       | API/connectivity issue         | Use offline KEV JSON file        |
| Duplicate CVE IDs     | Same vuln, different endpoints | Group by CVE, list all affected  |
| Conflicting severity  | Tools report different CVSS    | Use NVD authoritative score      |
| Unknown asset context | No business classification     | Default to HIGH, flag for review |
| Stale findings        | Old scan results               | Re-verify before reporting       |

## Tool Reference

| Resource        | Purpose                   | URL                                      |
| --------------- | ------------------------- | ---------------------------------------- |
| NVD             | Authoritative CVSS        | nvd.nist.gov                             |
| FIRST EPSS      | Exploit probability       | first.org/epss                           |
| CISA KEV        | Exploited vulnerabilities | cisa.gov/known-exploited-vulnerabilities |
| CVSS Calculator | Manual scoring            | first.org/cvss/calculator/3.1            |
| CWE Database    | Vulnerability types       | cwe.mitre.org                            |

## Triage Decision Tree

```
START: New Finding
  │
  ├─ Has CVE? ─────────────────────────────┐
  │   │                                     │
  │   ├─ YES: Check CISA KEV               │
  │   │   │                                │
  │   │   ├─ In KEV? → CRITICAL            │
  │   │   │                                │
  │   │   └─ Not in KEV → Get EPSS         │
  │   │       │                            │
  │   │       ├─ EPSS > 50%? → Use CVSS+30 │
  │   │       ├─ EPSS 10-50%? → Use CVSS+20│
  │   │       └─ EPSS < 10%? → Use CVSS    │
  │   │                                     │
  │   └─ NO: Calculate Manual CVSS          │
  │       │                                 │
  │       └─ Apply business context         │
  │                                         │
  └─ Check for Duplicates ──────────────────┘
      │
      ├─ Exact duplicate? → Merge
      ├─ Same root cause? → Group
      └─ Unique? → Keep separate
          │
          └─ Apply Prioritization Matrix
              │
              └─ OUTPUT: Triaged Finding
```

## References

- [CVSS 3.1 Specification](https://www.first.org/cvss/v3.1/specification-document)
- [EPSS Model and API](https://www.first.org/epss/)
- [CISA KEV Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog)
- [NVD Vulnerability Database](https://nvd.nist.gov/)
- [CWE Database](https://cwe.mitre.org/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)
- [EPSS API Documentation](https://www.first.org/epss/api)
- [Vulnerability Prioritization Guide](https://www.cisa.gov/sites/default/files/publications/Cybersecurity_Vulnerability_Prioritization_508.pdf)
