---
name: ctf-encoding-chains
description: "Encoding detection and multi-layer decoding chains for CTF challenges. Provides Python templates for automated encoding identification, iterative base64/hex/binary/URL/rot13 decoding, XOR brute-force with frequency analysis, nested encoding unwrapping, custom alphabet detection, and esoteric encoding systems. Use when encountering unknown encodings in CTF data, when peeling multi-layer encoding wrappers, when brute-forcing XOR keys using character frequency, or when building automated decoders for misc/crypto challenges."
tags:
  - ctf
  - encoding
  - base64
  - hex
  - xor
  - decoding
  - frequency-analysis
  - cipher
triggers:
  - decode encoding
  - base64 decode
  - hex decode
  - encoding chain
  - multi-layer encoding
  - frequency analysis
  - unknown encoding
  - ctf misc decode
category: analysis
os: linux
---

# ctf-encoding-chains

## When to Use

- Encountering data in unknown encoding format(s)
- Peeling multiple layers of encoding (e.g., base64 → hex → rot13 → flag)
- Brute-forcing XOR keys using frequency analysis or known plaintext
- Identifying encoding type from raw bytes or strings
- Decoding esoteric/unusual encoding schemes (Morse, Braille, NATO)
- Processing flag fragments that use different encodings
- Automating trial-and-error decoding pipelines
- Working with custom alphabets or substitution ciphers

## Quick Start

```python
import base64

# Auto-detect and decode
data = 'ZmxhZ3t0ZXN0fQ=='
print(base64.b64decode(data))  # b'flag{test}'
```

```python
# Iterative multi-layer decoder
from encoding_chains import auto_decode
result = auto_decode('NjI2MTczNjUzNjM0N2I2NjZjNjE2Nzdk')
# Detects: base64 → hex → ASCII → 'base64{flag}'
```

## Encoding Identification Checklist

```
Unknown data?
│
├─ Only [A-Za-z0-9+/]=  → Base64
├─ Only [0-9a-fA-F]     → Hex
├─ Only [01] (groups of 8) → Binary
├─ Only [A-Z2-7]=       → Base32
├─ Contains %XX          → URL encoding
├─ .- and spaces         → Morse code
├─ Unicode dots (⠁⠃⠉)   → Braille
├─ Word list (alpha bravo) → NATO
├─ Looks like English but wrong letters → ROT13 / Caesar / Substitution
└─ Nested layers         → Use auto_decode() iteratively
```

## Technique Reference Files

Full templates with copy-paste code are in the `references/` directory — loaded on demand, not into context:

| Technique                | Reference File                                                       | Key Templates                                                                                                    |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Detection & Decoders** | [references/detection-decoders.md](references/detection-decoders.md) | Signature-based detection, printability scoring, iterative multi-layer auto_decode, ROT/Caesar brute-force       |
| **Ciphers & Esoteric**   | [references/cipher-esoteric.md](references/cipher-esoteric.md)       | Substitution cipher solver, XOR frequency analysis, Morse code, Braille, NATO, base conversion, pipeline builder |

> **Usage**: When you need a specific technique, read the corresponding reference file for the full template.

## Common Pitfalls

- Base64 detection can false-positive on hex strings — check `len % 4 == 0` and decode validity
- Printability scoring threshold matters: 0.7 for readable text, 0.5 for mixed content
- ROT13 is just ROT with shift=13, but always try all 26 shifts for Caesar
- XOR frequency analysis needs sufficient ciphertext length (>100 bytes)
- Multi-layer decoding can loop if two encodings produce each other — cap depth at 20

## Examples

### Example 1: Triple-Encoded Flag

```python
data = 'VjJ4a1UxTnRWa2RUYms1cVVsUkdXRlpyVmtkT1JscDFXa2M1VjAxV1ducFZNbmhMWVdzeFJXRkdXbGRpYTNCMg=='
chain = auto_decode(data)
for enc, val in chain:
    print(f'{enc}: {val[:80]}')
```

### Example 2: XOR + Base64

```python
import base64
ct = base64.b64decode('GhscHR4JCw==')
for key in range(256):
    pt = bytes(b ^ key for b in ct)
    if b'flag' in pt:
        print(f'Key: {hex(key)}, Flag: {pt.decode()}')
```
