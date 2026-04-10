---
name: ctf-crypto-attack-templates
description: "Cryptographic attack templates for CTF challenges. Provides ready-to-run Python scripts for RSA attacks (small-e, Wiener, Hastad, common modulus, factorization), AES exploitation (ECB byte-at-a-time, CBC bit-flipping, padding oracle), hash attacks (length extension, collision), XOR key recovery, and Z3 constraint solving. Use when attacking RSA implementations, when exploiting block cipher misuse, when performing frequency analysis, when using Z3 for constraint satisfaction, or when automating crypto challenge solves."
tags:
  - ctf
  - crypto
  - rsa
  - aes
  - xor
  - z3
  - padding-oracle
  - hash
triggers:
  - rsa attack
  - crypto exploit
  - aes ecb cbc
  - padding oracle
  - xor decrypt
  - z3 solver
  - ctf crypto
  - hash attack
category: exploit
os: linux
---

# ctf-crypto-attack-templates

## When to Use

- Attacking RSA with known weaknesses (small e, small d, shared factors)
- Exploiting AES ECB mode (byte-at-a-time, block shuffling)
- Exploiting AES CBC mode (bit-flipping, IV manipulation, padding oracle)
- Recovering XOR keys from ciphertext (known plaintext, frequency analysis, repeating key)
- Using Z3 to solve constraint satisfaction problems in crypto challenges
- Performing hash length extension attacks
- Factoring RSA moduli using known methods
- Brute-forcing small keyspaces
- Implementing custom cipher analysis

## Quick Start

```python
from Crypto.Util.number import long_to_bytes, bytes_to_long, inverse, GCD
# RSA decrypt with known factors
n, e, c = ...  # Given values
p, q = ...     # Factored
phi = (p - 1) * (q - 1)
d = inverse(e, phi)
print(long_to_bytes(pow(c, d, n)))
```

```python
# XOR decrypt with known key
ct = bytes.fromhex('...')
key = b'secret'
pt = bytes(c ^ key[i % len(key)] for i, c in enumerate(ct))
print(pt)
```

## Attack Decision Tree

```
What type of crypto challenge?
│
├─ RSA (n, e, c given)
│   ├─ Factors known → Standard decrypt
│   ├─ e is small (3) → Cube root or Hastad broadcast
│   ├─ d is small → Wiener's attack
│   ├─ Same n, different e → Common modulus
│   └─ Factor n → factordb, Fermat, Pollard p-1, shared factor
│
├─ AES / Block cipher
│   ├─ ECB mode + oracle → Byte-at-a-time
│   ├─ CBC mode + controlled input → Bit-flipping
│   └─ CBC + padding error visible → Padding oracle
│
├─ XOR cipher
│   ├─ Single byte key → Brute-force (256 keys)
│   ├─ Repeating key → Hamming distance + per-position brute
│   └─ Known plaintext → Direct key recovery
│
├─ Custom cipher / keygen
│   └─ Z3 constraint solver
│
└─ Hash-based
    ├─ MAC with known data → Length extension
    └─ Short secret/PIN → Brute-force
```

## Technique Reference Files

Full templates with copy-paste code are in the `references/` directory — loaded on demand, not into context:

| Technique           | Reference File                                             | Key Templates                                                                                                     |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **RSA Attacks**     | [references/rsa-attacks.md](references/rsa-attacks.md)     | Standard decrypt, small-e, Hastad broadcast, Wiener, common modulus, factordb, Fermat, Pollard p-1, shared factor |
| **Symmetric & XOR** | [references/symmetric-xor.md](references/symmetric-xor.md) | ECB byte-at-a-time, CBC bit-flip, padding oracle, single-byte XOR, repeating-key XOR, known plaintext             |
| **Z3 & Hash**       | [references/z3-hash.md](references/z3-hash.md)             | Z3 basic, key recovery, cipher reversal, hash length extension, hash brute-force, baby-step giant-step            |

> **Usage**: When you need a specific technique, read the corresponding reference file for the full template.

## Common Pitfalls

- Always try `factordb` before implementing factorization from scratch
- Check if `e` and `phi` are coprime before computing `inverse(e, phi)`
- For padding oracle: handle false positives on second-to-last byte position
- XOR frequency analysis needs sufficient ciphertext length to be reliable
- Z3 BitVec width must match the actual data size (8 for bytes, 32 for ints, 64 for longs)

## Examples

### Example 1: RSA with Small e

```python
from Crypto.Util.number import long_to_bytes
import gmpy2
m, exact = gmpy2.iroot(c, 3)
if exact:
    print(long_to_bytes(int(m)))
```

### Example 2: Z3 License Key

```python
from z3 import *
key = [BitVec(f'k{i}', 8) for i in range(20)]
s = Solver()
s.add(key[0] + key[1] == 200)
s.add(key[2] ^ key[3] == 42)
if s.check() == sat:
    m = s.model()
    print(''.join(chr(m[k].as_long()) for k in key))
```
