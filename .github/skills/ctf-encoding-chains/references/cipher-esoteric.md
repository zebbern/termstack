# Cipher, Esoteric Encoding & Pipeline Templates

## Generic Substitution Cipher Solver

```python
def frequency_analysis(text):
    """Rank characters by frequency for substitution cipher analysis."""
    from collections import Counter
    # English letter frequency order
    english_freq = 'etaoinshrdlcumwfgypbvkjxqz'

    letters_only = ''.join(c.lower() for c in text if c.isalpha())
    freq = Counter(letters_only)
    ranked = [c for c, _ in freq.most_common()]

    # Build substitution map: most frequent cipher letter → 'e', etc.
    mapping = {}
    for cipher_char, plain_char in zip(ranked, english_freq):
        mapping[cipher_char] = plain_char
        mapping[cipher_char.upper()] = plain_char.upper()

    decoded = ''.join(mapping.get(c, c) for c in text)
    return decoded, mapping
```

## XOR Frequency Analysis

```python
def xor_frequency_attack(ct, key_len):
    """
    Break repeating-key XOR using frequency analysis.
    Assumes English plaintext.
    """
    english_freq = {
        'a': 8.167, 'b': 1.492, 'c': 2.782, 'd': 4.253, 'e': 12.702,
        'f': 2.228, 'g': 2.015, 'h': 6.094, 'i': 6.966, 'j': 0.153,
        'k': 0.772, 'l': 4.025, 'm': 2.406, 'n': 6.749, 'o': 7.507,
        'p': 1.929, 'q': 0.095, 'r': 5.987, 's': 6.327, 't': 9.056,
        'u': 2.758, 'v': 0.978, 'w': 2.360, 'x': 0.150, 'y': 1.974,
        'z': 0.074, ' ': 13.0
    }

    def score_text(text):
        score = 0
        for byte in text:
            c = chr(byte).lower()
            score += english_freq.get(c, -1)
        return score

    key = bytearray()
    for pos in range(key_len):
        column = bytes(ct[i] for i in range(pos, len(ct), key_len))
        best_score = -1
        best_key = 0
        for k in range(256):
            decrypted = bytes(b ^ k for b in column)
            s = score_text(decrypted)
            if s > best_score:
                best_score = s
                best_key = k
        key.append(best_key)

    return key
```

## Morse Code

```python
MORSE_CODE = {
    '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E',
    '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J',
    '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O',
    '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T',
    '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y',
    '--..': 'Z', '-----': '0', '.----': '1', '..---': '2',
    '...--': '3', '....-': '4', '.....': '5', '-....': '6',
    '--...': '7', '---..': '8', '----.': '9',
    '/': ' ', '': ''
}

def decode_morse(morse_text):
    """Decode morse code. Words separated by ' / ' or '  ', letters by ' '."""
    words = morse_text.strip().split(' / ') if ' / ' in morse_text else morse_text.strip().split('  ')
    decoded = []
    for word in words:
        letters = word.strip().split(' ')
        decoded.append(''.join(MORSE_CODE.get(l, '?') for l in letters))
    return ' '.join(decoded)

def normalize_morse(data):
    """Normalize various morse representations."""
    data = data.replace('•', '.').replace('−', '-').replace('–', '-')
    data = data.replace('_', '-').replace('*', '.').replace('/', ' / ')
    return data
```

## Esoteric Encodings

### Braille

```python
BRAILLE = {
    '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e', '⠋': 'f',
    '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j', '⠅': 'k', '⠇': 'l',
    '⠍': 'm', '⠝': 'n', '⠕': 'o', '⠏': 'p', '⠟': 'q', '⠗': 'r',
    '⠎': 's', '⠞': 't', '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x',
    '⠽': 'y', '⠵': 'z', '⠀': ' '
}

def decode_braille(text):
    return ''.join(BRAILLE.get(c, c) for c in text)
```

### NATO Phonetic Alphabet

```python
NATO = {
    'alpha': 'a', 'bravo': 'b', 'charlie': 'c', 'delta': 'd',
    'echo': 'e', 'foxtrot': 'f', 'golf': 'g', 'hotel': 'h',
    'india': 'i', 'juliet': 'j', 'kilo': 'k', 'lima': 'l',
    'mike': 'm', 'november': 'n', 'oscar': 'o', 'papa': 'p',
    'quebec': 'q', 'romeo': 'r', 'sierra': 's', 'tango': 't',
    'uniform': 'u', 'victor': 'v', 'whiskey': 'w', 'xray': 'x',
    'yankee': 'y', 'zulu': 'z'
}

def decode_nato(text):
    words = text.lower().split()
    return ''.join(NATO.get(w, '?') for w in words)
```

### Base Conversion (Arbitrary)

```python
def base_convert(value, from_base, to_base=10):
    """Convert between arbitrary bases."""
    if isinstance(value, str):
        decimal = int(value, from_base)
    else:
        decimal = value

    if to_base == 10:
        return decimal

    if decimal == 0:
        return '0'
    digits = []
    while decimal:
        digits.append(str(decimal % to_base))
        decimal //= to_base
    return ''.join(reversed(digits))

# Common in CTF: base2, base8, base10, base16, base36, base58, base62
```

## Pipeline Builder

```python
def decode_pipeline(data, operations):
    """
    Apply a sequence of decoding operations.
    operations: list of ('encoding_type', optional_params)
    """
    import base64
    from urllib.parse import unquote

    decoders = {
        'base64': lambda d, **kw: base64.b64decode(d),
        'base32': lambda d, **kw: base64.b32decode(d),
        'base85': lambda d, **kw: base64.b85decode(d),
        'hex': lambda d, **kw: bytes.fromhex(d if isinstance(d, str) else d.decode()),
        'url': lambda d, **kw: unquote(d if isinstance(d, str) else d.decode()).encode(),
        'rot13': lambda d, **kw: (d if isinstance(d, str) else d.decode()).translate(
            str.maketrans(
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'
            )).encode(),
        'xor': lambda d, **kw: bytes(b ^ kw.get('key', 0) for b in (d if isinstance(d, bytes) else d.encode())),
        'reverse': lambda d, **kw: (d[::-1] if isinstance(d, bytes) else d[::-1].encode()),
        'binary': lambda d, **kw: bytes(
            int((d if isinstance(d, str) else d.decode()).replace(' ', '')[i:i+8], 2)
            for i in range(0, len((d if isinstance(d, str) else d.decode()).replace(' ', '')), 8)
        ),
    }

    current = data
    for step in operations:
        if isinstance(step, tuple):
            op, kwargs = step[0], step[1] if len(step) > 1 else {}
        else:
            op, kwargs = step, {}

        decoder = decoders.get(op)
        if decoder:
            current = decoder(current, **kwargs)
            if isinstance(current, bytes):
                try:
                    current = current.decode()
                except UnicodeDecodeError:
                    pass
            print(f'  [{op}] → {str(current)[:80]}')
        else:
            print(f'  [UNKNOWN: {op}]')

    return current

# Usage
result = decode_pipeline(
    'NjI2MTczNjUzNjM0N2I2NjZjNjE2Nzdk',
    ['base64', 'hex']
)
print(f'Final: {result}')
```
