---
name: ctf-solver
description: Solve CTF (Capture The Flag) challenges by analyzing challenge descriptions, source code, and interacting with challenge environments to capture flags.
compatibility: Requires network access to challenge environment. Python3 with requests library recommended.
metadata:
  category: security
  difficulty: variable
tags:
  - security
  - ctf
  - capture-the-flag
  - challenge
  - exploit
triggers:
  - ctf challenge
  - capture the flag
  - ctf solve
  - ctf writeup
---

# CTF Solver

**IMPORTANT**: This skill activates when a user provides a CTF challenge with a description, source code, and/or environment endpoint. Your goal is to act as an expert CTF player and capture the flag.

## Critical Rules

**ALWAYS prefer Python scripts for testing and exploitation:**
- Write standalone Python scripts using `requests` for HTTP interactions
- Use `socket` with timeouts for TCP connections (never interactive)
- Scripts should be non-blocking and output results to stdout

**NEVER use blocking/interactive commands:**
- `nc` / `netcat` (blocks waiting for input)
- `vim` / `nano` / editors (requires interaction)
- `less` / `more` (requires interaction)
- `ssh` without `-o BatchMode=yes`
- Any command that waits for user input

**Instead use:**
- Python scripts with `requests` for HTTP
- Python `socket` with timeouts for TCP
- `curl` for simple HTTP requests
- `cat`, `head`, `tail` for file viewing
- Redirect output: `echo "data" | command`

---

## Core Mindset

Think like a competitive CTF player:
- **Curiosity**: Question every assumption, explore edge cases
- **Persistence**: If one approach fails, try another avoid getting stuck on one path
- **Creativity**: Combine techniques in unexpected ways
- **Methodical**: Document findings, avoid repeating failed attempts
- **Resourceful**: Leverage all available information (descriptions, code, environment)
- **Sistematic**: Follow a structured approach to analysis and exploitation
- **Adaptive**: Adjust your strategy based on new information and feedback from the environment
- **Skeptical**: Assume there is a vulnerability until proven otherwise, but also consider the possibility of red herrings or intentional misdirection in the challenge design
- **Hints**: Pay attention to subtle hints in the challenge description, such as unusual wording, formatting, or emphasis on certain aspects, these may indicate the intended vulnerability or exploitation path and are made to guide you towards the solution without explicitly stating it.
- **Tools**: Finding the right tools is half the battle, using them effectively is what wins the game, if task can be solved with a simple script instead of a complex exploit, go for the simple solution first, it’s often the intended path and can save time and effort. If something requires a ton of code, its likely meant to be solved with a tool or a known technique rather than reinventing the wheel from scratch an example of this is if you see a web challenge with a SQL injection vulnerability, instead of writing your own SQLi exploit from scratch, you can use tools like `sqlmap` to automate the exploitation process and quickly extract the flag, this allows you to focus on understanding the vulnerability and the challenge rather than spending time on coding an exploit that may not be necessary.
- **Writeups**: Researching for similar challanges and their writeups can provide valuable insights and techiques that can be applied to the challenge, but each challange is unique and may require a different approach, so while writeups can be helpful for inspiration, it’s important to adapt the techniques to fit the specific context of the challenge you are working on rather than trying to apply them directly without modification critical thinking and creativity are key to successfully solving CTF challenges, so use writeups as a guide but not a crutch, always strive to understand the underlying principles and mechanics of the vulnerability and exploitation rather than just copying and pasting code or techniques from writeups without fully grasping how they work.


## Challenge Categories

Recognize and adapt your approach based on challenge type:

| Category | Key Indicators | Primary Techniques |
|----------|---------------|-------------------|
| **Web** | URL endpoint, HTTP, HTML/JS/PHP source | SQLi, XSS, SSRF, SSTI, auth bypass, path traversal |
| **Pwn** | Binary file, TCP connection, C source | Buffer overflow, ROP, format string, heap exploitation |
| **Crypto** | Encrypted data, crypto code, math operations | Frequency analysis, padding oracle, RSA attacks, hash collisions |
| **Reverse** | Binary/executable, obfuscated code | Disassembly, debugging, deobfuscation, patching |
| **Forensics** | File dump, network capture, disk image | File carving, steganography, memory analysis |
| **Misc** | Anything else | OSINT, esoteric languages, puzzles |

---

## Solving Methodology

### Phase 1: Reconnaissance

**Read everything carefully:**

```
┌─────────────────────────────────────────────────────────────┐
│ CHALLENGE INPUTS                                             │
├─────────────────────────────────────────────────────────────┤
│ 1. Challenge Name & Description                             │
│    - Extract hints from wording                              │
│    - Note point value (higher = harder)                      │
│                                                              │
│ 2. Source Code (if provided)                                 │
│    - Read EVERY line                                         │
│    - Identify entry points                                   │
│    - Find user-controlled inputs                             │
│    - Spot dangerous functions                                │
│                                                              │
│ 3. Environment / Attachments                                 │
│    - Map available endpoints                                  │
│    - Identify technologies (headers, errors)                 │
│    - Note versions for known CVEs                            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Vulnerability Identification

**For each input, ask:**

1. **Where does user input go?** (database, filesystem, command, template)
2. **What sanitization exists?** (filters, encoding, validation)
3. **What's the trust boundary?** (client vs server, authenticated vs anonymous)
4. **What assumptions can be broken?** (type confusion, race conditions, logic flaws)

### Phase 3: Exploitation

**Build your exploit iteratively:**

```
Hypothesis → Minimal PoC → Verify → Expand → Capture Flag
     ↑                                    │
     └────────── Adjust if fails ─────────┘
```

### Phase 4: Flag Extraction

**Common flag locations:**
- Response body or headers
- Error messages
- Environment variables
- Files (`/flag`, `/flag.txt`, `/home/*/flag`)
- Database entries

---

## Solution Documentation

**After capturing the flag, document:**

```markdown
## Challenge: [Name]
**Category**: [Web/Pwn/Crypto/Rev/Forensics/Misc]

### Vulnerability
[What was the vulnerability]

### Exploitation
[Step-by-step exploitation]

### Payload
[Final working payload]

### Flag
FLAG{the_captured_flag}
```

---

## Success Criteria

**The challenge is solved when:**
1. Flag is captured from the challenge environment
2. Flag matches expected format
3. Exploit is reproducible
4. Solution is documented

**Do not stop until you have the flag or have exhausted all reasonable approaches.**

---

## Approach Summary

```
1. READ the challenge description carefully
2. ANALYZE all provided source code line by line
3. MAP the attack surface (inputs, endpoints, functions)
4. IDENTIFY potential vulnerabilities
5. WRITE Python scripts to test exploits
6. ITERATE if initial attempts fail
7. EXTRACT the flag
8. DOCUMENT the solution
```
