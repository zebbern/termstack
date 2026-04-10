---
name: ctf-service-interaction
description: "Network service interaction patterns for CTF — socket clients, multi-round solvers, flag extraction, PoW solvers. Lean skill with on-demand reference files."
tags: [ctf, socket, networking, service-interaction, flag-extraction, proof-of-work, automation, tcp]
triggers:
  - socket interaction
  - tcp service
  - flag extraction
  - round solver
  - proof of work
  - netcat challenge
  - ctf service
  - remote connection
category: exploit
os: linux
---

# ctf-service-interaction

## When to Use

- Connecting to a TCP/UDP service that presents a challenge
- Solving multi-round math, trivia, or puzzle challenges
- Extracting flags from verbose or noisy service output
- Handling unreliable connections with retries and timeouts
- Solving proof-of-work requirements before accessing challenges
- Automating repetitive send/receive patterns

## Quick Start

```python
from pwn import *

p = remote('challenge.ctf.com', 1337)
p.recvuntil(b'> ')
p.sendline(b'answer')
print(p.recvall(timeout=2))
```

```python
import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('challenge.ctf.com', 1337))
s.settimeout(5)
print(s.recv(4096).decode())
s.send(b'answer\n')
print(s.recv(4096).decode())
```

## Interaction Decision Tree

```
Service challenge received
│
├─ Single request/response
│   └─ pwntools: remote() → recvuntil() → sendline()
│
├─ Multi-round (math, trivia, crypto)
│   ├─ Identify round format with first recv
│   ├─ Parse with regex, compute answer
│   └─ Loop: recvline → parse → sendline (load solvers-pow.md)
│
├─ Proof-of-Work required first
│   ├─ SHA256 prefix → solve_pow_sha256_prefix()
│   ├─ Bit-count → solve_pow_bits()
│   └─ Hashcash → solve_hashcash()
│   (all in solvers-pow.md)
│
├─ Unreliable / rate-limited
│   ├─ Wrap in retry loop with backoff
│   └─ Use solve_with_retry() from connection-clients.md
│
└─ Custom protocol / complex state
    └─ Use ServiceClient class from connection-clients.md
```

## Technique Reference Files

> **Load only the reference you need** — don't read all at once.

| File | Contents | When to Load |
|------|----------|-------------|
| `references/connection-clients.md` | ServiceClient class, pwntools client, flag extraction patterns, UDP interaction, retry wrapper | Custom protocols, unreliable connections, flag hunting |
| `references/solvers-pow.md` | Math solver, base conversion, string/crypto rounds, SHA256/bit-count/hashcash PoW | Multi-round challenges, proof-of-work gates |

## Common Pitfalls

- **Missing newline** — most services expect `\n` terminated input; pwntools `sendline()` adds it, raw sockets don't
- **Timeout too short** — set generous timeouts (5-10s) initially; reduce after understanding service speed
- **Wrong encoding** — use `latin-1` for binary-safe decode, `utf-8` only when certain
- **PoW brute-force too slow** — try random nonces instead of sequential; use `os.urandom` for speed
- **Rate limiting** — add `time.sleep(0.1)` between connections for brute-force challenges

## Examples

### Example 1: Arithmetic Server (100 Rounds)

```python
from pwn import *
import re

p = remote('math.ctf.com', 1337)
for _ in range(100):
    q = p.recvline().decode()
    m = re.search(r'(\d+) ([+\-*]) (\d+)', q)
    a, op, b = int(m[1]), m[2], int(m[3])
    ans = {'+': a+b, '-': a-b, '*': a*b}[op]
    p.sendline(str(ans).encode())
print(p.recvall(timeout=5).decode())
```

### Example 2: PoW Then Exploit

```python
from pwn import *

p = remote('challenge.ctf.com', 1337)
pow_challenge = p.recvline().decode()
# Load references/solvers-pow.md for solve_pow_sha256_prefix()
solution = solve_pow_sha256_prefix(pow_challenge.split("'")[1], '00000')
p.sendline(solution.encode())
p.sendline(b'exploit_payload')
p.interactive()
```

### Example 3: Rate-Limited PIN Brute Force

```python
from pwn import *
import time

for pin in range(10000):
    p = remote('challenge.ctf.com', 1337, timeout=5)
    p.recvuntil(b'PIN: ')
    p.sendline(f'{pin:04d}'.encode())
    resp = p.recvline(timeout=3)
    if b'Correct' in resp or b'flag' in resp:
        print(f'PIN: {pin:04d}')
        print(p.recvall(timeout=5).decode())
        break
    p.close()
    time.sleep(0.1)
```
