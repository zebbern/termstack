---
name: cloud-enum
description: Enumerate public cloud storage buckets and resources across AWS, Azure, GCP, and other providers. Use when targeting cloud infrastructure, when discovering misconfigured storage, or when the user mentions S3 buckets or cloud assets.
tags:
  - security
  - cloud
  - enumeration
  - aws
  - azure
  - gcp
  - s3
  - bucket
triggers:
  - cloud enumeration
  - s3 bucket
  - cloud storage scan
  - azure blob
  - gcp bucket
---

# cloud-enum

## When to Use

- Target organization uses cloud infrastructure (AWS, Azure, GCP)
- Need to discover misconfigured storage buckets
- User mentions S3 buckets, Azure Blob, GCP Storage
- Looking for data exposure via public cloud resources
- Enumerating cloud-hosted applications and services
- Reconnaissance phase of cloud-based targets

## Quick Start

Enumerate S3 buckets for a keyword:

```bash
s3scanner -bucket-file keywords.txt -enumerate
```

Multi-cloud enumeration with cloud_enum:

```bash
cloud_enum.py -k targetcompany -k targetcompany.com
```

## Step-by-Step Process

### Step 1: Generate Keyword List

Create a keyword file with target variations:

```bash
# Create keywords.txt with target variations
cat > keywords.txt << 'EOF'
targetcompany
targetcompany-prod
targetcompany-dev
targetcompany-staging
targetcompany-backup
targetcompany-assets
targetcompany-uploads
targetcompany-data
target-company
target.company
EOF
```

**Keyword Generation Tips:**

- Company name variations (dashes, dots, no separator)
- Product/service names
- Domain name without TLD
- Acquisitions and subsidiaries
- Environment indicators (dev, prod, staging, test)
- Common suffixes (backup, assets, uploads, data, logs)

### Step 2: AWS S3 Bucket Enumeration

**Using S3Scanner:**

```bash
# Basic scan with enumeration
s3scanner -bucket-file keywords.txt -enumerate

# Multi-threaded scan
s3scanner -bucket-file keywords.txt -threads 10

# Output as JSON for parsing
s3scanner -bucket-file keywords.txt -json

# Save to database
s3scanner -bucket-file keywords.txt -db -enumerate
```

**S3Scanner Output:**

```
[bucket_exists] OPEN | images-backup | us-east-1 | AuthUsers: [], AllUsers: [READ]
[bucket_exists] OPEN | customer-data-prod | us-west-2 | AuthUsers: [FULL_CONTROL], AllUsers: [READ, WRITE]
[bucket_exists] PROTECTED | internal-docs | eu-west-1
```

**Permission Types:**
| Permission | Description | Risk Level |
|------------|-------------|------------|
| READ | List and download objects | High |
| WRITE | Upload objects to bucket | Critical |
| READ_ACP | Read bucket ACL | Medium |
| WRITE_ACP | Modify bucket ACL | Critical |
| FULL_CONTROL | All permissions | Critical |

### Step 3: Multi-Cloud Enumeration

**Using cloud_enum:**

```bash
# Basic multi-cloud scan
cloud_enum.py -k targetcompany

# Multiple keywords
cloud_enum.py -k targetcompany -k targetproduct -k target.com

# From keyword file
cloud_enum.py -kf keywords.txt

# Custom mutations file
cloud_enum.py -k targetcompany -m custom_mutations.txt

# Specific cloud only
cloud_enum.py -k targetcompany --disable-azure --disable-gcp

# Increased threads
cloud_enum.py -k targetcompany -t 10

# Quick scan (no mutations)
cloud_enum.py -k targetcompany -qs

# Save results
cloud_enum.py -k targetcompany -l results.txt -f json
```

**cloud_enum Resources Discovered:**

| Provider | Resource Types                                              |
| -------- | ----------------------------------------------------------- |
| AWS      | S3 buckets, awsapps (WorkMail, WorkDocs, Connect)           |
| Azure    | Storage accounts, Blob containers, databases, VMs, web apps |
| GCP      | Buckets, Firebase databases, App Engine, Cloud Functions    |

### Step 4: GCP-Specific Enumeration

```bash
# Using S3Scanner with GCP provider
s3scanner -bucket targetcompany -provider gcp -enumerate

# GCP bucket URL format
# https://storage.googleapis.com/BUCKET_NAME
# https://BUCKET_NAME.storage.googleapis.com

# Test GCP bucket access
curl -s https://storage.googleapis.com/targetcompany-backup
```

**GCP Permission Check:**

```bash
# List objects (if readable)
gsutil ls gs://targetcompany-backup/

# Check bucket ACL
gsutil acl get gs://targetcompany-backup/
```

### Step 5: Azure Blob Enumeration

```bash
# Azure Blob URL formats
# https://ACCOUNT.blob.core.windows.net/CONTAINER
# https://ACCOUNT.blob.core.windows.net/CONTAINER/BLOB

# Test Azure container access
curl -s "https://targetcompany.blob.core.windows.net/backup?restype=container&comp=list"
```

**Azure Resource Discovery:**

```bash
# cloud_enum discovers Azure resources:
# - Storage accounts: targetcompany.blob.core.windows.net
# - Databases: targetcompany.database.windows.net
# - VMs: targetcompany.cloudapp.azure.com
# - Web apps: targetcompany.azurewebsites.net
```

### Step 6: DigitalOcean/Other Providers

```bash
# DigitalOcean Spaces
s3scanner -bucket targetcompany -provider digitalocean -enumerate

# Linode Object Storage
s3scanner -bucket targetcompany -provider linode -enumerate

# Custom S3-compatible endpoint
# Requires config.yml with custom provider settings
s3scanner -bucket targetcompany -provider custom -enumerate
```

**Custom Provider Config (config.yml):**

```yaml
providers:
  custom:
    address_style: "path"
    endpoint_format: "https://$REGION.example.com"
    insecure: false
    regions:
      - "us-east-1"
      - "eu-west-1"
```

### Step 7: Verify and Enumerate Objects

**Object Enumeration (if readable):**

```bash
# S3Scanner with enumeration
s3scanner -bucket found-bucket -enumerate

# AWS CLI (if accessible)
aws s3 ls s3://found-bucket/ --no-sign-request

# List recursively
aws s3 ls s3://found-bucket/ --no-sign-request --recursive

# Download specific file
aws s3 cp s3://found-bucket/sensitive.txt . --no-sign-request
```

**Check for Interesting Files:**

```bash
# Common sensitive files to look for
# - .env, .git, config.json, credentials
# - backup.sql, dump.sql, database.db
# - private.key, id_rsa, .pem
# - .xlsx, .csv with customer data
```

### Step 8: Parse and Report Results

**JSON Output Processing:**

```bash
# S3Scanner JSON output
s3scanner -bucket-file keywords.txt -json | jq '.bucket | select(.exists==1)'

# Filter open buckets
s3scanner -bucket-file keywords.txt -json | jq 'select(.bucket.permissions != null)'

# Extract bucket names and regions
s3scanner -bucket-file keywords.txt -json | jq -r '[.bucket.name, .bucket.region] | @tsv'
```

**cloud_enum Log Formats:**

```bash
# Text format (default)
cloud_enum.py -k target -l results.txt -f text

# JSON format
cloud_enum.py -k target -l results.json -f json

# CSV format
cloud_enum.py -k target -l results.csv -f csv
```

## Permission Matrix

### AWS S3 Permissions

| ACL          | Grantee            | Risk | Finding                   |
| ------------ | ------------------ | ---- | ------------------------- |
| READ         | AllUsers           | P1   | Public bucket listing     |
| WRITE        | AllUsers           | P1   | Public upload allowed     |
| READ         | AuthenticatedUsers | P2   | Any AWS account can read  |
| WRITE        | AuthenticatedUsers | P2   | Any AWS account can write |
| FULL_CONTROL | AllUsers           | P1   | Complete takeover         |

### Azure Blob Permissions

| Access Level | Description           | Risk  |
| ------------ | --------------------- | ----- |
| Private      | No anonymous access   | Safe  |
| Blob         | Anonymous blob read   | P2-P3 |
| Container    | Anonymous list + read | P1-P2 |

### GCP Bucket Permissions

| IAM Role              | Risk  | Description         |
| --------------------- | ----- | ------------------- |
| allUsers: Reader      | P1-P2 | Public read access  |
| allUsers: Writer      | P1    | Public write access |
| allAuthenticatedUsers | P2    | Any Google account  |

## Examples

### Example 1: Basic AWS S3 Scan

**Scenario:** Find open S3 buckets for target company

**Command:**

```bash
echo -e "acmecorp\nacmecorp-backup\nacmecorp-uploads" > keywords.txt
s3scanner -bucket-file keywords.txt -enumerate
```

**Output:**

```
[bucket_exists] OPEN | acmecorp-backup | us-east-1 | AllUsers: [READ]
[bucket_exists] NOT_EXIST | acmecorp
[bucket_exists] PROTECTED | acmecorp-uploads | us-west-2
```

### Example 2: Multi-Cloud Discovery

**Scenario:** Enumerate all cloud resources for target

**Command:**

```bash
cloud_enum.py -k acmecorp -k acme-corp -k acmecorp.io -t 10 -l findings.json -f json
```

**Output:**

```
[+] Checking for AWS S3 buckets
[OPEN] http://acmecorp-backup.s3.amazonaws.com
[PROTECTED] http://acmecorp-internal.s3.amazonaws.com

[+] Checking for Azure Storage
[OPEN CONTAINER] https://acmecorp.blob.core.windows.net/public

[+] Checking for GCP buckets
[PROTECTED] https://storage.googleapis.com/acmecorp-prod
```

### Example 3: GCP-Specific Enumeration

**Scenario:** Target uses GCP infrastructure

**Command:**

```bash
s3scanner -bucket-file gcp_keywords.txt -provider gcp -enumerate -threads 8
```

**Output:**

```
[bucket_exists] OPEN | acmecorp-assets | | AllUsers: [READ]
[bucket_exists] OPEN | acmecorp-staging | | AllUsers: [READ, WRITE]
```

### Example 4: Object Enumeration

**Scenario:** List objects in discovered open bucket

**Command:**

```bash
aws s3 ls s3://acmecorp-backup/ --no-sign-request --recursive | head -50
```

**Output:**

```
2024-01-15 10:30:00    1048576 database/backup.sql
2024-01-15 10:30:00      256 config/.env
2024-01-15 10:30:00    512000 exports/customers.csv
```

## Wordlists and Mutations

### Common Bucket Suffixes

```
-backup
-backups
-bak
-data
-dev
-development
-staging
-stage
-test
-testing
-prod
-production
-assets
-static
-uploads
-files
-media
-images
-docs
-documents
-logs
-archive
-public
-private
-internal
-external
-api
-web
-app
```

### Environment Patterns

```
{company}-{env}
{company}.{env}
{company}{env}
{env}-{company}
{env}.{company}
```

## Error Handling

| Error             | Cause                     | Resolution                           |
| ----------------- | ------------------------- | ------------------------------------ |
| Rate limited      | Too many requests         | Reduce threads, add delays           |
| Access Denied     | Bucket exists but private | Note as protected, try auth          |
| NoSuchBucket      | Bucket doesn't exist      | Expected for most keywords           |
| Timeout           | DNS/network issues        | Check connectivity, use --nameserver |
| InvalidBucketName | Invalid characters        | Review keyword format                |
| AllAccessDisabled | Bucket ACL blocks all     | Bucket secured correctly             |

## Tool Reference

### S3Scanner Flags

| Flag           | Description                                                 |
| -------------- | ----------------------------------------------------------- |
| `-bucket`      | Single bucket name to check                                 |
| `-bucket-file` | File with bucket names (one per line)                       |
| `-provider`    | aws, gcp, digitalocean, linode, dreamhost, scaleway, custom |
| `-enumerate`   | List all objects in accessible buckets                      |
| `-threads`     | Number of concurrent threads (default: 4)                   |
| `-json`        | Output in JSON format                                       |
| `-db`          | Save results to PostgreSQL                                  |
| `-verbose`     | Enable debug logging                                        |

### cloud_enum Flags

| Flag                | Description                             |
| ------------------- | --------------------------------------- |
| `-k, --keyword`     | Target keyword (can use multiple times) |
| `-kf, --keyfile`    | File with keywords (one per line)       |
| `-m, --mutations`   | Custom mutations wordlist               |
| `-b, --brute`       | Wordlist for container/function names   |
| `-t, --threads`     | HTTP threads (default: 5)               |
| `-ns, --nameserver` | Custom DNS server                       |
| `-l, --logfile`     | Output file path                        |
| `-f, --format`      | text, json, or csv                      |
| `--disable-aws`     | Skip AWS checks                         |
| `--disable-azure`   | Skip Azure checks                       |
| `--disable-gcp`     | Skip GCP checks                         |
| `-qs, --quickscan`  | No mutations or second-level scans      |

## Best Practices

1. **Start with variations** - Generate comprehensive keyword list
2. **Use mutations** - Include common suffixes and patterns
3. **Respect rate limits** - Start with low threads, increase gradually
4. **Document everything** - Save JSON output for reporting
5. **Verify findings** - Confirm access before reporting
6. **Check all providers** - Target may use multiple clouds
7. **Look for sensitive data** - Enumerate objects when accessible
8. **Stay in scope** - Only test authorized targets

## References

- [S3Scanner GitHub](https://github.com/sa7mon/S3Scanner)
- [cloud_enum GitHub](https://github.com/initstring/cloud_enum)
- [AWS S3 Security](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security.html)
- [Azure Blob Security](https://docs.microsoft.com/en-us/azure/storage/blobs/security-recommendations)
- [GCP Cloud Storage Security](https://cloud.google.com/storage/docs/access-control)
- [OWASP Cloud Security](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Cloud_Architecture_Cheat_Sheet.html)
