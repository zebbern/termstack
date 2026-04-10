# File Extraction, Disk Image & Metadata Templates

## Binwalk Standard Extraction

```bash
#!/bin/bash
FILE="$1"

echo "[*] File type identification"
file "$FILE"
xxd "$FILE" | head -20

echo "[*] Entropy analysis"
binwalk -E "$FILE"

echo "[*] Signature scan"
binwalk "$FILE"

echo "[*] Recursive extraction"
binwalk -eM "$FILE"
# Results in _<filename>.extracted/

echo "[*] Checking extracted files"
find "_${FILE}.extracted" -type f | while read f; do
    echo "  $(file "$f")"
done
```

## Deep Extraction with Fallbacks

```bash
#!/bin/bash
FILE="$1"
OUTDIR="extracted_$(basename "$FILE")"
mkdir -p "$OUTDIR"

# Method 1: binwalk
echo "[1] binwalk extraction"
binwalk -eM --directory="$OUTDIR/binwalk" "$FILE" 2>/dev/null

# Method 2: foremost (file carving)
echo "[2] foremost carving"
foremost -i "$FILE" -o "$OUTDIR/foremost" 2>/dev/null

# Method 3: scalpel (configurable carving)
echo "[3] scalpel carving"
scalpel -b -o "$OUTDIR/scalpel" "$FILE" 2>/dev/null

# Method 4: dd manual extraction (if offset known)
# dd if="$FILE" bs=1 skip=OFFSET count=SIZE of="$OUTDIR/manual_extract"

# Compare results
echo "[*] Results:"
for d in "$OUTDIR"/*/; do
    count=$(find "$d" -type f 2>/dev/null | wc -l)
    echo "  $(basename "$d"): $count files"
done
```

## Python Binwalk Automation

```python
import subprocess
import os
import re

def extract_all(filepath):
    """Run binwalk + analyze extracted files."""
    result = subprocess.run(
        ['binwalk', '-eM', filepath],
        capture_output=True, text=True
    )
    print(result.stdout)

    extract_dir = f'_{os.path.basename(filepath)}.extracted'
    if not os.path.isdir(extract_dir):
        print('[-] No extraction directory created')
        return []

    extracted = []
    for root, dirs, files in os.walk(extract_dir):
        for f in files:
            path = os.path.join(root, f)
            file_type = subprocess.run(
                ['file', '-b', path], capture_output=True, text=True
            ).stdout.strip()
            size = os.path.getsize(path)
            extracted.append({'path': path, 'type': file_type, 'size': size})
            print(f'  [{size:>8}B] {file_type[:60]} → {path}')

    for item in extracted:
        if 'text' in item['type'].lower():
            with open(item['path'], 'r', errors='ignore') as fh:
                content = fh.read()
                flag = re.search(r'flag\{[^}]+\}', content)
                if flag:
                    print(f'[FLAG] {flag.group()} in {item["path"]}')

    return extracted
```

## Disk Image Analysis

```bash
#!/bin/bash
IMAGE="$1"

echo "=== Image Info ==="
file "$IMAGE"
fdisk -l "$IMAGE" 2>/dev/null

echo "=== Partition Table ==="
mmls "$IMAGE" 2>/dev/null

echo "=== File System ==="
fsstat "$IMAGE" 2>/dev/null | head -30

echo "=== File Listing ==="
fls -r "$IMAGE" 2>/dev/null | head -50

echo "=== Deleted Files ==="
fls -rd "$IMAGE" 2>/dev/null

echo "=== Mount and Search ==="
MOUNT_DIR=$(mktemp -d)
mount -o ro,loop "$IMAGE" "$MOUNT_DIR" 2>/dev/null
if [ $? -eq 0 ]; then
    find "$MOUNT_DIR" -type f -name "*flag*" -o -name "*secret*" -o -name "*.txt" 2>/dev/null
    grep -rl "flag{" "$MOUNT_DIR" 2>/dev/null
    umount "$MOUNT_DIR"
fi
rmdir "$MOUNT_DIR"
```

## Metadata Analysis

```python
import subprocess
import json
import re

def full_metadata(filepath):
    """Extract all metadata using exiftool."""
    result = subprocess.run(
        ['exiftool', '-j', filepath],
        capture_output=True, text=True
    )
    try:
        meta = json.loads(result.stdout)[0]
    except (json.JSONDecodeError, IndexError):
        meta = {}

    interesting = ['Comment', 'Author', 'Creator', 'Subject',
                   'Description', 'UserComment', 'GPSLatitude',
                   'GPSLongitude', 'XPComment', 'ImageDescription']

    for field in interesting:
        if field in meta and meta[field]:
            value = str(meta[field])
            print(f'[{field}] {value}')
            flag = re.search(r'flag\{[^}]+\}', value)
            if flag:
                print(f'[FLAG] {flag.group()}')

    return meta
```
