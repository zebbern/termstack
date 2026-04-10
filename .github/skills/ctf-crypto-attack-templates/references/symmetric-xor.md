# Symmetric Cipher & XOR Attack Templates

## AES ECB Byte-at-a-Time Oracle

```python
import requests

url = 'http://challenge.ctf.com:8080/encrypt'
BLOCK_SIZE = 16

def oracle(plaintext):
    """Send plaintext, get ciphertext back."""
    r = requests.post(url, data={'data': plaintext.hex()})
    return bytes.fromhex(r.text)

def ecb_byte_at_a_time():
    """Recover secret appended after our input: AES_ECB(input || secret)."""
    known = b''

    # Detect secret length
    base_len = len(oracle(b''))
    for i in range(1, BLOCK_SIZE + 1):
        if len(oracle(b'A' * i)) > base_len:
            secret_len = base_len - i
            break

    for pos in range(secret_len):
        block_idx = pos // BLOCK_SIZE
        pad_len = BLOCK_SIZE - 1 - (pos % BLOCK_SIZE)
        padding = b'A' * pad_len

        # Build lookup table
        prefix = padding + known
        target_block = oracle(padding)[block_idx * BLOCK_SIZE:(block_idx + 1) * BLOCK_SIZE]

        for byte in range(256):
            test = prefix + bytes([byte])
            # Only need to check the relevant block
            ct = oracle(test[-BLOCK_SIZE + 1:] if len(test) > BLOCK_SIZE else padding + test)
            if ct[:BLOCK_SIZE] == target_block:
                known += bytes([byte])
                print(f'[+] {known}')
                break

    return known
```

## AES CBC Bit-Flipping

```python
def cbc_bit_flip(ciphertext, block_size, target_block_idx, target_byte_idx, current_byte, desired_byte):
    """
    Flip a byte in block N-1 to change decrypted byte in block N.
    Modifies ciphertext in-place.
    """
    ct = bytearray(ciphertext)
    # XOR the byte in the PREVIOUS block
    flip_pos = (target_block_idx - 1) * block_size + target_byte_idx
    ct[flip_pos] ^= current_byte ^ desired_byte
    return bytes(ct)

# Example: Change ";admin=false" to ";admin=true;"
# If we control block 1, and target is in block 2:
ct = bytearray(ciphertext)
# Flip 'f' to 't' at position in previous block
ct[prev_block_offset] ^= ord('f') ^ ord('t')
# Flip 'a' to 'r' etc.
```

## AES Padding Oracle Attack

```python
import requests

BLOCK_SIZE = 16

def padding_oracle(iv, ct):
    """Returns True if padding is valid."""
    r = requests.post(url, data={'iv': iv.hex(), 'ct': ct.hex()})
    return 'padding' not in r.text.lower()  # Adjust based on error message

def decrypt_block(prev_block, target_block):
    """Decrypt one block using padding oracle."""
    intermediate = bytearray(BLOCK_SIZE)
    decrypted = bytearray(BLOCK_SIZE)

    for byte_pos in range(BLOCK_SIZE - 1, -1, -1):
        pad_val = BLOCK_SIZE - byte_pos

        # Set already-known bytes to produce correct padding
        crafted = bytearray(BLOCK_SIZE)
        for k in range(byte_pos + 1, BLOCK_SIZE):
            crafted[k] = intermediate[k] ^ pad_val

        # Brute-force current byte
        for guess in range(256):
            crafted[byte_pos] = guess
            if padding_oracle(bytes(crafted), target_block):
                # Avoid false positive on second-to-last byte
                if byte_pos == BLOCK_SIZE - 1:
                    crafted[byte_pos - 1] ^= 1
                    if not padding_oracle(bytes(crafted), target_block):
                        continue
                intermediate[byte_pos] = guess ^ pad_val
                decrypted[byte_pos] = intermediate[byte_pos] ^ prev_block[byte_pos]
                break

    return bytes(decrypted)

def full_decrypt(iv, ciphertext):
    """Decrypt full ciphertext using padding oracle."""
    blocks = [iv]
    for i in range(0, len(ciphertext), BLOCK_SIZE):
        blocks.append(ciphertext[i:i + BLOCK_SIZE])

    plaintext = b''
    for i in range(1, len(blocks)):
        plaintext += decrypt_block(blocks[i - 1], blocks[i])
        print(f'[+] Block {i}: {plaintext}')

    # Remove PKCS7 padding
    pad_len = plaintext[-1]
    return plaintext[:-pad_len]
```

## Single-Byte XOR Brute-Force

```python
def single_byte_xor(ct):
    """Try all 256 possible single-byte keys."""
    results = []
    for key in range(256):
        pt = bytes(b ^ key for b in ct)
        # Score by printable ASCII ratio
        score = sum(1 for b in pt if 32 <= b <= 126) / len(pt)
        results.append((score, key, pt))

    results.sort(reverse=True)
    return results[0]  # (score, key, plaintext)

ct = bytes.fromhex('...')
score, key, pt = single_byte_xor(ct)
print(f'Key: {hex(key)}, Plaintext: {pt}')
```

## Repeating-Key XOR (Vigenère-style)

```python
from itertools import cycle

def repeating_xor_decrypt(ct, keylen_range=(2, 40)):
    """Find key length via Hamming distance, then brute-force each position."""
    def hamming(a, b):
        return sum(bin(x ^ y).count('1') for x, y in zip(a, b))

    # Step 1: Find key length
    scores = []
    for kl in range(keylen_range[0], keylen_range[1]):
        blocks = [ct[i:i + kl] for i in range(0, len(ct) - kl, kl)][:4]
        if len(blocks) < 2:
            continue
        dist = sum(hamming(blocks[i], blocks[i + 1]) for i in range(len(blocks) - 1))
        normalized = dist / (len(blocks) - 1) / kl
        scores.append((normalized, kl))
    scores.sort()
    best_kl = scores[0][1]
    print(f'[+] Likely key length: {best_kl}')

    # Step 2: Break each position independently
    key = bytearray()
    for pos in range(best_kl):
        column = bytes(ct[i] for i in range(pos, len(ct), best_kl))
        _, k, _ = single_byte_xor(column)
        key.append(k)
    print(f'[+] Key: {key}')

    # Step 3: Decrypt
    pt = bytes(c ^ k for c, k in zip(ct, cycle(key)))
    return pt

ct = bytes.fromhex('...')
print(repeating_xor_decrypt(ct))
```

## Known Plaintext XOR

```python
def xor_known_plaintext(ct, known_pt, known_offset=0):
    """Recover key bytes using known plaintext at known offset."""
    key_fragment = bytes(c ^ p for c, p in zip(ct[known_offset:], known_pt))
    print(f'[+] Key fragment: {key_fragment}')
    return key_fragment

# Common known plaintexts in CTF:
# - 'flag{' at start
# - HTTP headers: 'HTTP/1.', 'GET /', 'POST '
# - File headers: PNG (89504e47), ZIP (504b0304), PDF (%PDF)
```
