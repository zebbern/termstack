# Memory Analysis & Network Forensics Templates

## Volatility 2 — Profile Detection + Analysis

```bash
#!/bin/bash
DUMP="$1"

echo "=== Profile Detection ==="
vol.py -f "$DUMP" imageinfo 2>/dev/null

PROFILE="Win10x64_18362"  # Set from imageinfo output

echo "=== Process List ==="
vol.py -f "$DUMP" --profile=$PROFILE pslist

echo "=== Process Tree ==="
vol.py -f "$DUMP" --profile=$PROFILE pstree

echo "=== Network Connections ==="
vol.py -f "$DUMP" --profile=$PROFILE netscan

echo "=== Command History ==="
vol.py -f "$DUMP" --profile=$PROFILE cmdscan
vol.py -f "$DUMP" --profile=$PROFILE consoles

echo "=== File Scan ==="
vol.py -f "$DUMP" --profile=$PROFILE filescan | grep -i "flag\|secret\|password\|key\|\.txt\|\.doc\|\.pdf"
```

## Volatility 3 Equivalent

```bash
#!/bin/bash
DUMP="$1"

echo "=== OS Detection ==="
vol3 -f "$DUMP" banners.Banners

echo "=== Process List ==="
vol3 -f "$DUMP" windows.pslist.PsList

echo "=== Process Tree ==="
vol3 -f "$DUMP" windows.pstree.PsTree

echo "=== Network ==="
vol3 -f "$DUMP" windows.netscan.NetScan

echo "=== Command Line ==="
vol3 -f "$DUMP" windows.cmdline.CmdLine

echo "=== File Scan ==="
vol3 -f "$DUMP" windows.filescan.FileScan | grep -iE "flag|secret|password|key|\.txt|\.doc"

echo "=== Registry Hives ==="
vol3 -f "$DUMP" windows.registry.hivelist.HiveList

echo "=== Dump Suspicious Process ==="
# vol3 -f "$DUMP" windows.dumpfiles.DumpFiles --pid <PID>
# vol3 -f "$DUMP" windows.memmap.Memmap --pid <PID> --dump
```

## Targeted Extraction Python Script

```python
import subprocess
import re

def vol_extract(dump, profile, targets):
    """
    Run Volatility commands and extract specific artifacts.
    targets: list of {'plugin': str, 'grep': str, 'action': str}
    """
    results = {}

    for target in targets:
        plugin = target['plugin']
        grep = target.get('grep', '')

        cmd = ['vol.py', '-f', dump, '--profile', profile, plugin]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        output = result.stdout

        if grep:
            lines = [l for l in output.split('\n') if re.search(grep, l, re.IGNORECASE)]
            results[plugin] = lines
        else:
            results[plugin] = output

        print(f'[{plugin}] {len(output)} bytes output')

    return results

# Usage
targets = [
    {'plugin': 'pslist', 'grep': r'cmd|powershell|python|notepad'},
    {'plugin': 'filescan', 'grep': r'flag|secret|key|\.txt'},
    {'plugin': 'netscan', 'grep': r'ESTABLISHED|LISTENING'},
    {'plugin': 'cmdscan', 'grep': ''},
    {'plugin': 'clipboard', 'grep': ''},
    {'plugin': 'hashdump', 'grep': ''},
]

results = vol_extract('memory.dmp', 'Win10x64_18362', targets)
```

## Process Memory Dump + String Extraction

```bash
#!/bin/bash
DUMP="$1"
PROFILE="$2"
PID="$3"

mkdir -p "proc_${PID}"
vol.py -f "$DUMP" --profile="$PROFILE" memdump --pid="$PID" --dump-dir="proc_${PID}"

strings -n 8 "proc_${PID}/${PID}.dmp" > "proc_${PID}/strings_ascii.txt"
strings -n 8 -el "proc_${PID}/${PID}.dmp" > "proc_${PID}/strings_unicode.txt"

grep -iE "flag\{|ctf\{|password|secret|key=" "proc_${PID}/strings_ascii.txt"
grep -iE "flag\{|ctf\{|password|secret|key=" "proc_${PID}/strings_unicode.txt"
```

## HTTP Object Extraction from PCAP

```bash
#!/bin/bash
PCAP="$1"
OUTDIR="pcap_extract"
mkdir -p "$OUTDIR"

tshark -r "$PCAP" --export-objects http,"$OUTDIR/http" 2>/dev/null
echo "[HTTP] $(ls "$OUTDIR/http" 2>/dev/null | wc -l) files"

tshark -r "$PCAP" --export-objects smb,"$OUTDIR/smb" 2>/dev/null
echo "[SMB] $(ls "$OUTDIR/smb" 2>/dev/null | wc -l) files"

tshark -r "$PCAP" --export-objects tftp,"$OUTDIR/tftp" 2>/dev/null

tshark -r "$PCAP" -Y "ftp-data" -T fields -e ftp-data.command -e data > "$OUTDIR/ftp_data.txt"

echo "=== Protocol Summary ==="
tshark -r "$PCAP" -q -z io,phs
```

## TCP Stream Reconstruction

```python
from scapy.all import rdpcap, TCP, Raw
import os

def reconstruct_tcp_streams(pcap_file, output_dir='streams'):
    """Reconstruct all TCP streams from a PCAP."""
    os.makedirs(output_dir, exist_ok=True)
    packets = rdpcap(pcap_file)

    streams = {}
    for pkt in packets:
        if TCP in pkt and Raw in pkt:
            src = f"{pkt[TCP].sport}"
            dst = f"{pkt[TCP].dport}"
            key = tuple(sorted([(str(pkt['IP'].src), src), (str(pkt['IP'].dst), dst)]))
            if key not in streams:
                streams[key] = []
            streams[key].append(bytes(pkt[Raw].load))

    for idx, (key, data) in enumerate(streams.items()):
        combined = b''.join(data)
        outpath = f'{output_dir}/stream_{idx}_{key[0][1]}_{key[1][1]}.bin'
        with open(outpath, 'wb') as f:
            f.write(combined)
        print(f'Stream {idx}: {key} → {len(combined)} bytes')

    return streams
```

## DNS Exfiltration Detection

```python
from scapy.all import rdpcap, DNS, DNSQR
from collections import Counter
import base64

def extract_dns_exfil(pcap_file):
    """Detect and decode DNS exfiltration."""
    packets = rdpcap(pcap_file)
    queries = []

    for pkt in packets:
        if DNS in pkt and pkt[DNS].qr == 0:
            qname = pkt[DNSQR].qname.decode()
            queries.append(qname)

    print(f'[*] Total DNS queries: {len(queries)}')

    domains = Counter()
    for q in queries:
        parts = q.rstrip('.').split('.')
        if len(parts) >= 3:
            base = '.'.join(parts[-2:])
            domains[base] += 1

    print('[*] Top domains:')
    for domain, count in domains.most_common(10):
        print(f'  {count:>5} {domain}')

    for domain, count in domains.most_common(5):
        subdomains = []
        for q in queries:
            if q.rstrip('.').endswith(domain):
                parts = q.rstrip('.').split('.')
                sub = '.'.join(parts[:-2])
                if sub:
                    subdomains.append(sub)

        if subdomains:
            combined = ''.join(s.replace('.', '') for s in subdomains)
            print(f'\n[*] {domain} subdomains ({len(subdomains)} queries):')
            print(f'  Raw: {combined[:100]}')
            try:
                decoded = base64.b64decode(combined)
                print(f'  Base64: {decoded[:200]}')
            except Exception:
                try:
                    decoded = bytes.fromhex(combined)
                    print(f'  Hex: {decoded[:200]}')
                except Exception:
                    pass
```
