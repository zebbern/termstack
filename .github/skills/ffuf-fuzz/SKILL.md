---
name: ffuf-fuzz
description: Perform web fuzzing for content discovery, parameter enumeration, and virtual host detection using ffuf. Use when directory or file discovery is needed, when fuzzing parameters for hidden endpoints, when enumerating virtual hosts, or when brute-forcing authentication.
tags:
  - security
  - fuzzing
  - ffuf
  - content-discovery
  - brute-force
triggers:
  - fuzz
  - ffuf
  - content discovery
  - directory brute
  - parameter fuzzing
  - web fuzzing
---

# ffuf-fuzz

## When to Use

- When directory and file enumeration is needed on web targets
- When discovering hidden endpoints, paths, or backup files
- When fuzzing GET or POST parameters for injection points
- When enumerating virtual hosts (vhost discovery)
- When brute-forcing login forms or authentication endpoints
- When testing for parameter tampering vulnerabilities
- When discovering API endpoints or routes
- When extension-based file discovery is required

## Quick Start

Basic directory fuzzing against a target:

```bash
ffuf -w /usr/share/wordlists/dirb/common.txt -u https://example.com/FUZZ
```

## Step-by-Step Process

1. **Install ffuf** (if needed):

   ```bash
   go install github.com/ffuf/ffuf/v2@latest
   ```

2. **Basic Directory Discovery**:

   ```bash
   ffuf -w wordlist.txt -u https://target.com/FUZZ
   ```

3. **Filter False Positives** using auto-calibration:

   ```bash
   ffuf -w wordlist.txt -u https://target.com/FUZZ -ac
   ```

4. **Save Results** in structured format:

   ```bash
   ffuf -w wordlist.txt -u https://target.com/FUZZ -o results.json -of json
   ```

5. **Review and Refine** with specific filters:
   ```bash
   ffuf -w wordlist.txt -u https://target.com/FUZZ -mc 200,301,302 -fs 0
   ```

## Examples

### Example 1: Basic Directory Discovery

**Scenario:** Find hidden directories on a web server

**Command:**

```bash
ffuf -w /usr/share/wordlists/dirb/common.txt -u https://example.com/FUZZ -c
```

**Output:**

```
admin                   [Status: 301, Size: 178, Words: 6, Lines: 8]
api                     [Status: 200, Size: 1245, Words: 89, Lines: 42]
backup                  [Status: 403, Size: 276, Words: 20, Lines: 10]
config                  [Status: 301, Size: 178, Words: 6, Lines: 8]
uploads                 [Status: 301, Size: 178, Words: 6, Lines: 8]
```

### Example 2: Extension-Based File Discovery

**Scenario:** Find files with specific extensions

**Command:**

```bash
ffuf -w wordlist.txt -u https://example.com/FUZZ -e .php,.bak,.txt,.old,.zip -c
```

**Output:**

```
config.php              [Status: 200, Size: 0, Words: 1, Lines: 1]
database.bak            [Status: 200, Size: 45678, Words: 2341, Lines: 890]
readme.txt              [Status: 200, Size: 1234, Words: 200, Lines: 45]
backup.zip              [Status: 200, Size: 89012, Words: 1, Lines: 1]
```

### Example 3: Virtual Host Discovery

**Scenario:** Enumerate subdomains/vhosts via Host header fuzzing

**Command:**

```bash
ffuf -w subdomains.txt -u https://10.10.10.10 -H "Host: FUZZ.example.com" -fs 4242
```

**Output:**

```
admin                   [Status: 200, Size: 8901, Words: 456, Lines: 123]
api                     [Status: 200, Size: 2345, Words: 89, Lines: 34]
dev                     [Status: 200, Size: 6789, Words: 321, Lines: 98]
staging                 [Status: 200, Size: 5432, Words: 234, Lines: 67]
```

### Example 4: GET Parameter Name Fuzzing

**Scenario:** Discover hidden GET parameters

**Command:**

```bash
ffuf -w params.txt -u "https://example.com/page?FUZZ=test" -fs 4242 -c
```

**Output:**

```
id                      [Status: 200, Size: 5678, Words: 234, Lines: 78]
debug                   [Status: 200, Size: 8901, Words: 456, Lines: 123]
admin                   [Status: 200, Size: 2345, Words: 89, Lines: 34]
redirect                [Status: 302, Size: 0, Words: 1, Lines: 1]
```

### Example 5: GET Parameter Value Fuzzing

**Scenario:** Fuzz values for a known parameter

**Command:**

```bash
ffuf -w values.txt -u "https://example.com/user?id=FUZZ" -fc 404,401 -c
```

**Output:**

```
1                       [Status: 200, Size: 1234, Words: 89, Lines: 23]
100                     [Status: 200, Size: 1456, Words: 92, Lines: 25]
admin                   [Status: 200, Size: 2345, Words: 156, Lines: 45]
```

### Example 6: POST Data Fuzzing

**Scenario:** Fuzz POST body parameters for authentication bypass

**Command:**

```bash
ffuf -w passwords.txt -X POST -d "username=admin&password=FUZZ" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u https://example.com/login -fc 401 -c
```

**Output:**

```
admin123                [Status: 302, Size: 0, Words: 1, Lines: 1]
password1               [Status: 302, Size: 0, Words: 1, Lines: 1]
```

### Example 7: JSON Body Fuzzing

**Scenario:** Fuzz JSON API parameters

**Command:**

```bash
ffuf -w payloads.txt -X POST -H "Content-Type: application/json" \
  -d '{"username":"admin","role":"FUZZ"}' \
  -u https://example.com/api/user -mr "success" -c
```

**Output:**

```
admin                   [Status: 200, Size: 234, Words: 12, Lines: 5]
superuser               [Status: 200, Size: 234, Words: 12, Lines: 5]
```

### Example 8: Multi-Wordlist Clusterbomb

**Scenario:** Test all username/password combinations

**Command:**

```bash
ffuf -w users.txt:USER -w passwords.txt:PASS \
  -X POST -d "user=USER&pass=PASS" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u https://example.com/login -fc 401 -c
```

**Output:**

```
[USER: admin] [PASS: secret123]  [Status: 302, Size: 0, Words: 1, Lines: 1]
[USER: test] [PASS: test]        [Status: 302, Size: 0, Words: 1, Lines: 1]
```

### Example 9: Pitchfork Mode (Parallel Lists)

**Scenario:** Test paired credentials (username1+password1, username2+password2)

**Command:**

```bash
ffuf -mode pitchfork -w users.txt:USER -w passwords.txt:PASS \
  -X POST -d "user=USER&pass=PASS" \
  -u https://example.com/login -fc 401 -c
```

**Output:**

```
[USER: john] [PASS: john123]     [Status: 302, Size: 0, Words: 1, Lines: 1]
[USER: admin] [PASS: admin456]   [Status: 302, Size: 0, Words: 1, Lines: 1]
```

### Example 10: Recursive Directory Scanning

**Scenario:** Discover nested directory structures

**Command:**

```bash
ffuf -w wordlist.txt -u https://example.com/FUZZ -recursion -recursion-depth 2 -c
```

**Output:**

```
admin                   [Status: 301, Size: 178, Words: 6, Lines: 8]
admin/config            [Status: 200, Size: 1234, Words: 89, Lines: 23]
admin/users             [Status: 301, Size: 178, Words: 6, Lines: 8]
admin/users/list        [Status: 200, Size: 5678, Words: 234, Lines: 78]
api                     [Status: 301, Size: 178, Words: 6, Lines: 8]
api/v1                  [Status: 200, Size: 890, Words: 45, Lines: 12]
```

### Example 11: Auto-Calibration for False Positive Elimination

**Scenario:** Let ffuf determine optimal filters automatically

**Command:**

```bash
ffuf -w wordlist.txt -u https://example.com/FUZZ -ac -c
```

**Output:**

```
[INFO] Auto-calibration: Response size 4242 filtered
admin                   [Status: 200, Size: 8901, Words: 456, Lines: 123]
backup                  [Status: 200, Size: 2345, Words: 89, Lines: 34]
```

### Example 12: Time-Based Detection (SQL Injection)

**Scenario:** Detect time-based vulnerabilities using response timing

**Command:**

```bash
ffuf -w sqli-payloads.txt -X POST -H "Content-Type: application/json" \
  -d '{"id":"FUZZ"}' -u https://example.com/api/lookup -mt ">5000" -c
```

**Output:**

```
' OR SLEEP(5)--         [Status: 200, Size: 123, Words: 8, Lines: 3, Time: 5234ms]
1; WAITFOR DELAY '0:0:5'  [Status: 200, Size: 123, Words: 8, Lines: 3, Time: 5189ms]
```

### Example 13: Replay Matches Through Proxy

**Scenario:** Send matching requests to Burp Suite for analysis

**Command:**

```bash
ffuf -w wordlist.txt -u https://example.com/FUZZ -replay-proxy http://127.0.0.1:8080 -c
```

**Output:**

```
[INFO] Matched requests will be replayed through proxy
admin                   [Status: 200, Size: 8901, Words: 456, Lines: 123]
api                     [Status: 200, Size: 2345, Words: 89, Lines: 34]
```

### Example 14: JSON Output for Automation

**Scenario:** Export results in JSON for pipeline integration

**Command:**

```bash
ffuf -w wordlist.txt -u https://example.com/FUZZ -o results.json -of json -c
```

**Output File (results.json):**

```json
{
  "results": [
    {
      "input": { "FUZZ": "admin" },
      "position": 45,
      "status": 200,
      "length": 8901,
      "words": 456,
      "lines": 123,
      "content-type": "text/html",
      "redirectlocation": "",
      "url": "https://example.com/admin",
      "duration": 234567890,
      "host": "example.com"
    }
  ],
  "config": {
    "url": "https://example.com/FUZZ",
    "method": "GET"
  }
}
```

## Error Handling

| Error                       | Cause                    | Resolution                                             |
| --------------------------- | ------------------------ | ------------------------------------------------------ |
| `Wordlist not found`        | Invalid wordlist path    | Verify path exists and is readable                     |
| `Connection refused`        | Target not reachable     | Check target URL and network connectivity              |
| `Too many open files`       | Thread count too high    | Reduce threads with `-t 10` or increase ulimit         |
| `Context deadline exceeded` | Request timeout          | Increase timeout with `-timeout 30`                    |
| `No results`                | Filters too aggressive   | Try `-mc all` to see all responses, then adjust        |
| `Rate limited (429)`        | Too many requests        | Add delay with `-p 0.5` or reduce rate with `-rate 50` |
| `SSL certificate error`     | Invalid/self-signed cert | Target may need `-k` flag (not available, use proxy)   |
| `403 on all requests`       | WAF or firewall blocking | Use `-sf` to stop on 95% 403 responses                 |

## Matchers and Filters Reference

### Matchers (Include Results)

| Flag     | Description             | Example                |
| -------- | ----------------------- | ---------------------- |
| `-mc`    | Match HTTP status codes | `-mc 200,301,302,403`  |
| `-ml`    | Match by line count     | `-ml 10-50`            |
| `-mw`    | Match by word count     | `-mw 100-500`          |
| `-ms`    | Match by response size  | `-ms 1000-5000`        |
| `-mr`    | Match by regex pattern  | `-mr "success\|admin"` |
| `-mt`    | Match by response time  | `-mt ">5000"`          |
| `-mmode` | Matcher logic (and/or)  | `-mmode and`           |

### Filters (Exclude Results)

| Flag     | Description              | Example           |
| -------- | ------------------------ | ----------------- |
| `-fc`    | Filter HTTP status codes | `-fc 404,403,500` |
| `-fl`    | Filter by line count     | `-fl 0,10`        |
| `-fw`    | Filter by word count     | `-fw 1-5`         |
| `-fs`    | Filter by response size  | `-fs 0,4242`      |
| `-fr`    | Filter by regex pattern  | `-fr "not found"` |
| `-ft`    | Filter by response time  | `-ft "<100"`      |
| `-fmode` | Filter logic (and/or)    | `-fmode and`      |

## Input Options Reference

| Flag       | Description                      | Example                  |
| ---------- | -------------------------------- | ------------------------ |
| `-w`       | Wordlist with optional keyword   | `-w list.txt:KEYWORD`    |
| `-u`       | Target URL with FUZZ placeholder | `-u https://target/FUZZ` |
| `-e`       | Extensions to append             | `-e .php,.bak,.txt`      |
| `-mode`    | Multi-wordlist mode              | `-mode pitchfork`        |
| `-request` | Raw HTTP request file            | `-request req.txt`       |
| `-enc`     | Encode keywords                  | `-enc "FUZZ:urlencode"`  |
| `-ic`      | Ignore wordlist comments         | `-ic`                    |

## HTTP Options Reference

| Flag               | Description               | Example                            |
| ------------------ | ------------------------- | ---------------------------------- |
| `-H`               | Custom header             | `-H "Authorization: Bearer token"` |
| `-X`               | HTTP method               | `-X POST`                          |
| `-d`               | POST data body            | `-d "param=FUZZ"`                  |
| `-b`               | Cookies                   | `-b "session=abc123"`              |
| `-r`               | Follow redirects          | `-r`                               |
| `-x`               | Proxy URL                 | `-x http://127.0.0.1:8080`         |
| `-timeout`         | Request timeout (seconds) | `-timeout 30`                      |
| `-recursion`       | Enable recursive scanning | `-recursion`                       |
| `-recursion-depth` | Max recursion depth       | `-recursion-depth 3`               |

## Output Options Reference

| Flag    | Description                  | Example                           |
| ------- | ---------------------------- | --------------------------------- |
| `-o`    | Output file path             | `-o results.json`                 |
| `-of`   | Output format                | `-of json` (json/html/md/csv/all) |
| `-od`   | Output directory for matches | `-od ./results/`                  |
| `-json` | JSONlines to stdout          | `-json`                           |
| `-v`    | Verbose (full URLs)          | `-v`                              |
| `-c`    | Colorize output              | `-c`                              |
| `-s`    | Silent mode                  | `-s`                              |

## General Options Reference

| Flag            | Description                 | Example                               |
| --------------- | --------------------------- | ------------------------------------- |
| `-ac`           | Auto-calibrate filters      | `-ac`                                 |
| `-t`            | Concurrent threads          | `-t 50`                               |
| `-rate`         | Requests per second         | `-rate 100`                           |
| `-p`            | Delay between requests      | `-p 0.5` or `-p "0.1-1.0"`            |
| `-maxtime`      | Max total runtime (seconds) | `-maxtime 300`                        |
| `-maxtime-job`  | Max per-job runtime         | `-maxtime-job 60`                     |
| `-sf`           | Stop on 95% 403 responses   | `-sf`                                 |
| `-sa`           | Stop on all errors          | `-sa`                                 |
| `-replay-proxy` | Replay matches to proxy     | `-replay-proxy http://127.0.0.1:8080` |

## Multi-Wordlist Modes

| Mode          | Description                | Use Case                              |
| ------------- | -------------------------- | ------------------------------------- |
| `clusterbomb` | All combinations (default) | Credential stuffing, parameter combos |
| `pitchfork`   | Parallel iteration         | Paired username/password lists        |
| `sniper`      | Single position at a time  | Testing one parameter point           |

## Interactive Mode Commands

When ffuf is running, press ENTER to pause and access interactive mode:

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `fc [value]`      | Reconfigure status code filter |
| `fs [value]`      | Reconfigure size filter        |
| `fw [value]`      | Reconfigure word count filter  |
| `fl [value]`      | Reconfigure line count filter  |
| `rate [value]`    | Adjust requests per second     |
| `show`            | Display current results        |
| `savejson [file]` | Save matches to JSON file      |
| `resume`          | Resume scanning                |
| `restart`         | Restart from beginning         |

## Common Wordlists

| Wordlist                        | Location                               | Use Case                     |
| ------------------------------- | -------------------------------------- | ---------------------------- |
| common.txt                      | `/usr/share/wordlists/dirb/common.txt` | General directory discovery  |
| directory-list-2.3-medium.txt   | `/usr/share/wordlists/dirbuster/`      | Comprehensive directory scan |
| raft-large-words.txt            | SecLists                               | Large word-based discovery   |
| burp-parameter-names.txt        | SecLists                               | Parameter name fuzzing       |
| subdomains-top1million-5000.txt | SecLists                               | Virtual host discovery       |

## Output Parsing

### Parse JSON Results with jq

```bash
# Extract successful URLs
cat results.json | jq -r '.results[] | select(.status == 200) | .url'

# Get high-value findings (large responses)
cat results.json | jq -r '.results[] | select(.length > 5000) | .url'

# Count by status code
cat results.json | jq -r '.results[].status' | sort | uniq -c
```

### JSONlines Processing

```bash
# Real-time filtering during scan
ffuf -w wordlist.txt -u https://example.com/FUZZ -json | \
  jq -r 'select(.status == 200) | .url'

# Save only interesting results
ffuf -w wordlist.txt -u https://example.com/FUZZ -json | \
  jq -r 'select(.length > 1000)' > interesting.jsonl
```

## References

- [ffuf GitHub Repository](https://github.com/ffuf/ffuf)
- [ffuf Wiki](https://github.com/ffuf/ffuf/wiki)
- [SecLists Wordlists](https://github.com/danielmiessler/SecLists)
- [ffuf Releases](https://github.com/ffuf/ffuf/releases)
