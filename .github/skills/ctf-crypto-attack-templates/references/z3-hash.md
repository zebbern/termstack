# Z3 Constraint Solving & Hash Attack Templates

## Basic Z3 Template

```python
from z3 import *

# Define variables
x = BitVec('x', 32)
y = BitVec('y', 32)

s = Solver()

# Add constraints
s.add(x + y == 0xdeadbeef)
s.add(x ^ y == 0xcafebabe)
s.add(x > 0)
s.add(y > 0)

if s.check() == sat:
    m = s.model()
    print(f'x = {hex(m[x].as_long())}')
    print(f'y = {hex(m[y].as_long())}')
else:
    print('No solution')
```

## Z3 for Key Recovery

```python
from z3 import *

def solve_key(target_output, encrypt_func_constraints):
    """
    Generic Z3 key recovery.
    Define symbolic key bytes and add constraints from the encryption logic.
    """
    key = [BitVec(f'k{i}', 8) for i in range(16)]
    s = Solver()

    # Constrain key to printable ASCII (common in CTF)
    for k in key:
        s.add(k >= 0x20, k <= 0x7e)

    # Add encryption constraints
    # ... (puzzle-specific logic here)

    if s.check() == sat:
        m = s.model()
        return bytes(m[k].as_long() for k in key)
    return None
```

## Z3 for Custom Cipher Reversal

```python
from z3 import *

# Example: reverse a series of XOR/rotate/add operations
flag = [BitVec(f'f{i}', 8) for i in range(32)]
s = Solver()

# Constrain flag format
s.add(flag[0] == ord('f'))
s.add(flag[1] == ord('l'))
s.add(flag[2] == ord('a'))
s.add(flag[3] == ord('g'))
s.add(flag[4] == ord('{'))
s.add(flag[31] == ord('}'))

# Printable ASCII constraint
for f in flag:
    s.add(f >= 0x20, f <= 0x7e)

# Add cipher logic constraints (reverse the operations)
encrypted = [0x12, 0x34, ...]  # Known ciphertext
for i in range(len(flag)):
    # Example: enc[i] = (flag[i] ^ 0x42) + i
    s.add(((flag[i] ^ 0x42) + i) & 0xff == encrypted[i])

if s.check() == sat:
    m = s.model()
    result = ''.join(chr(m[f].as_long()) for f in flag)
    print(f'Flag: {result}')
```

## Hash Length Extension

```bash
# Using hash_extender tool
hash_extender --data 'original_data' --secret-min 8 --secret-max 32 \
    --append 'admin=true' --signature <known_hash> --format sha256
```

```python
# Using hlextend (pip install hlextend)
import hlextend

sha = hlextend.new('sha256')
# Extend hash with admin=true, secret length guess = 16
new_data = sha.extend(b'admin=true', b'original_data', 16,
                       'known_hash_hex')
new_hash = sha.hexdigest()
print(f'New data: {new_data}')
print(f'New hash: {new_hash}')
```

## Hash Brute-Force (PIN/Short Secret)

```python
import hashlib
import itertools
import string

target_hash = '5d41402abc4b2a76b9719d911017c592'  # md5 of 'hello'

# Brute-force 4-digit PIN
for pin in range(10000):
    attempt = f'{pin:04d}'
    if hashlib.md5(attempt.encode()).hexdigest() == target_hash:
        print(f'[+] PIN: {attempt}')
        break

# Brute-force short string
charset = string.ascii_lowercase + string.digits
for length in range(1, 7):
    for combo in itertools.product(charset, repeat=length):
        attempt = ''.join(combo)
        if hashlib.sha256(attempt.encode()).hexdigest() == target_hash:
            print(f'[+] Found: {attempt}')
            break
```

## Baby-Step Giant-Step (Discrete Log)

```python
import math

def baby_giant(g, h, p):
    """Solve g^x = h mod p for x."""
    m = math.isqrt(p) + 1

    # Baby step: g^j for j in [0, m)
    table = {}
    power = 1
    for j in range(m):
        table[power] = j
        power = (power * g) % p

    # Giant step: h * (g^-m)^i
    factor = pow(g, -m, p)
    gamma = h
    for i in range(m):
        if gamma in table:
            return i * m + table[gamma]
        gamma = (gamma * factor) % p

    return None
```
