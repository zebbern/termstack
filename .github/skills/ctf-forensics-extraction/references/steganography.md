# Steganography Detection & Extraction Templates

## Image Stego Workflow

```bash
#!/bin/bash
IMAGE="$1"

echo "=== File Info ==="
file "$IMAGE"
exiftool "$IMAGE" 2>/dev/null

echo "=== Strings ==="
strings "$IMAGE" | grep -iE "flag|ctf|key|secret|password|base64" | head -20

echo "=== Binwalk ==="
binwalk "$IMAGE"

echo "=== zsteg (PNG/BMP) ==="
zsteg "$IMAGE" 2>/dev/null | head -30

echo "=== steghide (JPEG) ==="
steghide info "$IMAGE" 2>/dev/null
steghide extract -sf "$IMAGE" -p "" -f 2>/dev/null  # Empty password

echo "=== stegsolve alternative: bit planes ==="
python3 -c "
from PIL import Image
import sys
img = Image.open('$IMAGE')
pixels = list(img.getdata())
bits = ''.join(str(p[0] & 1) for p in pixels[:8000])
chars = [chr(int(bits[i:i+8], 2)) for i in range(0, len(bits)-7, 8)]
text = ''.join(c for c in chars if 32 <= ord(c) <= 126)
if 'flag' in text.lower():
    print(f'[LSB-R] {text[:200]}')
" 2>/dev/null
```

## Python LSB Extraction (All Channels)

```python
from PIL import Image
import re

def extract_lsb(image_path, bits=1):
    """Extract LSB data from image across R, G, B channels."""
    img = Image.open(image_path)
    pixels = list(img.getdata())

    results = {}

    # Per-channel extraction
    for channel_idx, channel_name in enumerate(['R', 'G', 'B']):
        bitstream = ''
        for pixel in pixels:
            for bit in range(bits):
                bitstream += str((pixel[channel_idx] >> bit) & 1)

        data = bytes(
            int(bitstream[i:i+8], 2)
            for i in range(0, len(bitstream) - 7, 8)
        )
        results[channel_name] = data

    # Combined RGB extraction (most common)
    bitstream = ''
    for pixel in pixels:
        for channel in range(3):
            for bit in range(bits):
                bitstream += str((pixel[channel] >> bit) & 1)

    data = bytes(int(bitstream[i:i+8], 2) for i in range(0, len(bitstream) - 7, 8))
    results['RGB'] = data

    # Check each result for flags
    for name, data in results.items():
        text = data.decode('latin-1')
        flag = re.search(r'flag\{[^}]+\}', text)
        if flag:
            print(f'[+] {name} LSB({bits}): {flag.group()}')
        elif text[:4] in ['PK\x03\x04', '\x89PNG', 'GIF8']:
            print(f'[+] {name} LSB({bits}): Embedded file detected ({text[:4]})')
            with open(f'extracted_{name}.bin', 'wb') as f:
                f.write(data)

    return results

# Usage
extract_lsb('challenge.png', bits=1)
extract_lsb('challenge.png', bits=2)  # Try higher bit planes too
```

## Audio Steganography

```bash
#!/bin/bash
AUDIO="$1"

echo "=== File Info ==="
file "$AUDIO"
exiftool "$AUDIO" 2>/dev/null

echo "=== Spectrogram (visual hidden message) ==="
sox "$AUDIO" -n spectrogram -o spectrogram.png 2>/dev/null && echo "Saved spectrogram.png"

echo "=== Strings ==="
strings "$AUDIO" | grep -iE "flag|ctf|key|secret" | head -20

echo "=== SSTV Decode ==="
# qsstv or sstv tools for Slow Scan TV signals

echo "=== LSB Audio ==="
python3 -c "
import wave
w = wave.open('$AUDIO', 'r')
frames = w.readframes(w.getnframes())
bits = ''.join(str(b & 1) for b in frames[:80000])
chars = [chr(int(bits[i:i+8], 2)) for i in range(0, len(bits)-7, 8)]
text = ''.join(c for c in chars if 32 <= ord(c) <= 126)
print(f'LSB: {text[:200]}')
" 2>/dev/null
```
