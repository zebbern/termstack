# Encoding Detection & Multi-Layer Decoders

## Signature-Based Detection

```python
import re
import base64
import binascii

def detect_encoding(data):
    """Identify encoding type from string characteristics."""
    if isinstance(data, bytes):
        data = data.decode('latin-1')

    data = data.strip()
    detections = []

    # Base64 (standard)
    if re.match(r'^[A-Za-z0-9+/]+=*$', data) and len(data) % 4 == 0 and len(data) >= 4:
        try:
            decoded = base64.b64decode(data)
            if all(b < 128 for b in decoded):
                detections.append(('base64', decoded))
        except Exception:
            pass

    # Base64 URL-safe
    if re.match(r'^[A-Za-z0-9_-]+=*$', data) and len(data) % 4 in (0, 2, 3):
        try:
            decoded = base64.urlsafe_b64decode(data + '=' * (4 - len(data) % 4))
            detections.append(('base64url', decoded))
        except Exception:
            pass

    # Hex
    if re.match(r'^[0-9a-fA-F]+$', data) and len(data) % 2 == 0:
        try:
            decoded = bytes.fromhex(data)
            detections.append(('hex', decoded))
        except Exception:
            pass

    # Binary string
    if re.match(r'^[01\s]+$', data):
        bits = data.replace(' ', '')
        if len(bits) % 8 == 0:
            decoded = bytes(int(bits[i:i+8], 2) for i in range(0, len(bits), 8))
            detections.append(('binary', decoded))

    # Octal
    if re.match(r'^[0-7\s]+$', data) and ' ' in data:
        try:
            decoded = bytes(int(o, 8) for o in data.split())
            detections.append(('octal', decoded))
        except Exception:
            pass

    # Decimal (space-separated ASCII values)
    if re.match(r'^[\d\s]+$', data) and ' ' in data:
        try:
            values = [int(x) for x in data.split()]
            if all(0 <= v <= 127 for v in values):
                decoded = bytes(values)
                detections.append(('decimal_ascii', decoded))
        except Exception:
            pass

    # URL encoding
    if '%' in data:
        from urllib.parse import unquote
        decoded = unquote(data)
        if decoded != data:
            detections.append(('url', decoded.encode()))

    # ROT13
    decoded = data.translate(str.maketrans(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'
    ))
    if decoded != data and any(c.isalpha() for c in data):
        detections.append(('rot13', decoded.encode()))

    # Base32
    if re.match(r'^[A-Z2-7]+=*$', data) and len(data) % 8 == 0:
        try:
            decoded = base64.b32decode(data)
            detections.append(('base32', decoded))
        except Exception:
            pass

    # Base85 / ASCII85
    try:
        decoded = base64.b85decode(data)
        detections.append(('base85', decoded))
    except Exception:
        pass

    return detections

# Usage
data = '5a6d78685a33743052584e30665139'
for enc_type, decoded in detect_encoding(data):
    print(f'[{enc_type}] {decoded}')
```

## Printability Scoring

```python
def printability_score(data):
    """Score how likely decoded data is human-readable text."""
    if isinstance(data, str):
        data = data.encode('latin-1')
    printable = sum(1 for b in data if 32 <= b <= 126)
    return printable / len(data) if data else 0

def has_flag(data):
    """Check if data contains a flag pattern."""
    if isinstance(data, bytes):
        try:
            data = data.decode('latin-1')
        except Exception:
            return False
    import re
    return bool(re.search(r'flag\{|ctf\{|FLAG\{|CTF\{', data))
```

## Iterative Multi-Layer Decoder

```python
import base64
import re
from urllib.parse import unquote

def auto_decode(data, max_depth=20):
    """
    Automatically peel encoding layers until plaintext or flag is found.
    Returns list of (encoding, decoded_data) tuples showing the chain.
    """
    chain = []
    current = data if isinstance(data, str) else data.decode('latin-1')

    for depth in range(max_depth):
        # Check for flag at each layer
        if re.search(r'flag\{[^}]+\}', current, re.IGNORECASE):
            flag = re.search(r'flag\{[^}]+\}', current, re.IGNORECASE).group()
            chain.append(('FLAG_FOUND', flag))
            return chain

        decoded = False

        # Try each encoding in priority order
        # 1. Base64
        stripped = current.strip()
        if re.match(r'^[A-Za-z0-9+/]+=*$', stripped) and len(stripped) >= 4 and len(stripped) % 4 == 0:
            try:
                result = base64.b64decode(stripped)
                if printability_score(result) > 0.7:
                    chain.append(('base64', result.decode('latin-1')))
                    current = result.decode('latin-1')
                    decoded = True
                    continue
            except Exception:
                pass

        # 2. Hex
        if re.match(r'^[0-9a-fA-F]+$', stripped) and len(stripped) % 2 == 0 and len(stripped) >= 4:
            try:
                result = bytes.fromhex(stripped)
                if printability_score(result) > 0.5:
                    chain.append(('hex', result.decode('latin-1')))
                    current = result.decode('latin-1')
                    decoded = True
                    continue
            except Exception:
                pass

        # 3. URL encoding
        if '%' in current:
            result = unquote(current)
            if result != current:
                chain.append(('url', result))
                current = result
                decoded = True
                continue

        # 4. Binary
        if re.match(r'^[01\s]+$', stripped):
            bits = stripped.replace(' ', '')
            if len(bits) % 8 == 0:
                result = bytes(int(bits[i:i+8], 2) for i in range(0, len(bits), 8))
                if printability_score(result) > 0.7:
                    chain.append(('binary', result.decode('latin-1')))
                    current = result.decode('latin-1')
                    decoded = True
                    continue

        # 5. Base32
        if re.match(r'^[A-Z2-7]+=*$', stripped) and len(stripped) >= 8:
            try:
                result = base64.b32decode(stripped)
                if printability_score(result) > 0.5:
                    chain.append(('base32', result.decode('latin-1')))
                    current = result.decode('latin-1')
                    decoded = True
                    continue
            except Exception:
                pass

        # 6. ROT13
        result = stripped.translate(str.maketrans(
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'
        ))
        if has_flag(result):
            chain.append(('rot13', result))
            current = result
            decoded = True
            continue

        if not decoded:
            chain.append(('STUCK', current))
            break

    return chain
```

## ROT/Caesar Brute-Force

```python
def rot_bruteforce(text):
    """Try all 26 Caesar cipher shifts."""
    results = []
    for shift in range(26):
        decoded = ''
        for c in text:
            if c.isalpha():
                base = ord('A') if c.isupper() else ord('a')
                decoded += chr((ord(c) - base + shift) % 26 + base)
            else:
                decoded += c
        results.append((shift, decoded))
        if 'flag{' in decoded.lower():
            print(f'[+] ROT-{shift}: {decoded}')
    return results

rot_bruteforce('synt{grfg}')  # ROT-13 → flag{test}
```
