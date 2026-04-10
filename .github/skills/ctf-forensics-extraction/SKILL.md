---
name: ctf-forensics-extraction
description: "Digital forensics extraction pipelines for CTF challenges — binwalk, Volatility, PCAP, steganography, disk images, metadata. Lean skill with on-demand reference files."
tags: [ctf, forensics, binwalk, volatility, pcap, steganography, file-carving, memory-analysis]
triggers:
  - forensics extraction
  - binwalk extract
  - volatility analysis
  - pcap reconstruct
  - steganography detect
  - memory dump
  - ctf forensics
  - file carving
category: analysis
os: linux
---

# ctf-forensics-extraction

## When to Use

- Extracting embedded files from composite binaries or firmware
- Analyzing memory dumps with Volatility (process lists, credentials, network)
- Reconstructing TCP sessions and extracting files from PCAP captures
- Detecting steganographic payloads in images or audio
- Mounting disk images and recovering deleted files
- Analyzing file metadata (EXIF, PDF, Office XML)

## Quick Start

```bash
# Binwalk: extract all embedded files
binwalk -eM suspicious.bin

# Volatility: identify profile + list processes
vol.py -f memory.dmp imageinfo
vol.py -f memory.dmp --profile=Win10x64 pslist

# PCAP: extract HTTP objects
tshark -r capture.pcap --export-objects http,exported/

# Image stego: quick LSB check
zsteg challenge.png 2>/dev/null | head -20
```

## Forensics Decision Tree

```
Challenge file received
│
├─ Binary blob / firmware / archive
│   ├─ binwalk -eM → recursive extract
│   ├─ foremost / scalpel → file carving
│   └─ Check entropy plot for encrypted sections
│
├─ Memory dump (.dmp, .raw, .mem)
│   ├─ Volatility: imageinfo → profile
│   ├─ pslist → pstree → suspicious processes
│   ├─ netscan → network connections
│   ├─ filescan + dumpfiles → recover files
│   └─ cmdscan / consoles → command history
│
├─ PCAP / network capture
│   ├─ tshark --export-objects → HTTP/SMB/TFTP files
│   ├─ scapy TCP stream reconstruction
│   └─ DNS exfiltration: subdomain → base64/hex decode
│
├─ Image / audio file
│   ├─ file + exiftool + strings → quick metadata
│   ├─ PNG/BMP: zsteg, LSB extraction
│   ├─ JPEG: steghide (try empty password)
│   ├─ Audio: spectrogram, SSTV, LSB
│   └─ binwalk → embedded files
│
└─ Disk image (.img, .dd, .E01)
    ├─ fdisk/mmls → partition table
    ├─ fls -rd → deleted files
    └─ mount -o ro,loop → search contents
```

## Technique Reference Files

> **Load only the reference you need** — don't read all at once.

| File | Contents | When to Load |
|------|----------|-------------|
| `references/file-extraction.md` | Binwalk pipelines (standard, deep, Python), disk image analysis, metadata extraction | Binary blobs, firmware, file carving, EXIF/metadata challenges |
| `references/memory-network.md` | Volatility v2/v3 chains, targeted extraction, process dump, PCAP reconstruction, DNS exfil | Memory dumps, network forensics, packet analysis |
| `references/steganography.md` | Image stego workflow, Python LSB (all channels/bits), audio stego | Hidden data in images or audio files |

## Common Pitfalls

- **Wrong Volatility profile** — always run `imageinfo` first; wrong profile = garbage output
- **Binwalk misses files** — try `foremost` and `scalpel` as fallbacks; also check entropy for encrypted sections
- **Steghide needs password** — try empty string first (`-p ""`), then common passwords, then brute-force with `stegcracker`
- **PCAP too large** — filter with display filters before export; `tshark -Y "http"` to narrow scope
- **LSB extraction wrong channel** — always try R, G, B individually AND combined RGB; also try 2-bit planes

## Examples

### Example 1: Firmware → Hidden Filesystem → Flag

```bash
binwalk -eM firmware.bin
# Found SquashFS at offset 0x40000
cd _firmware.bin.extracted/squashfs-root/
find . -name "*flag*" -o -name "*.txt" | xargs cat
grep -r "flag{" .
```

### Example 2: Memory Dump → Browser Credentials

```bash
vol.py -f memdump.raw imageinfo  # → Win7SP1x64
vol.py -f memdump.raw --profile=Win7SP1x64 pslist | grep -i "chrome\|firefox"
vol.py -f memdump.raw --profile=Win7SP1x64 filescan | grep -i "login\|password\|cookie"
# Dump the login data file, then use sqlite3 to read credentials
```

### Example 3: PCAP DNS Exfiltration

```bash
tshark -r traffic.pcap -Y "dns.qry.name" -T fields -e dns.qry.name | sort -u
# Suspicious: hex-encoded subdomains of evil.com
# → Load references/memory-network.md for Python DNS decoder
```
