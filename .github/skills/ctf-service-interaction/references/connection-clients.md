# Connection Clients & Flag Extraction Templates

## Robust Socket Client (ServiceClient)

```python
#!/usr/bin/env python3
import socket
import re
import time

HOST = 'challenge.ctf.com'
PORT = 1337
TIMEOUT = 10
FLAG_RE = re.compile(r'flag\{[^}]+\}', re.IGNORECASE)

class ServiceClient:
    def __init__(self, host, port, timeout=TIMEOUT):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.sock = None

    def connect(self):
        """Connect with retry."""
        for attempt in range(3):
            try:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.settimeout(self.timeout)
                self.sock.connect((self.host, self.port))
                return True
            except (socket.timeout, ConnectionRefusedError, OSError) as e:
                print(f'[!] Connect attempt {attempt + 1} failed: {e}')
                time.sleep(1)
        return False

    def recv_until(self, marker, max_bytes=65536):
        """Receive until marker found."""
        buf = b''
        while marker not in buf and len(buf) < max_bytes:
            try:
                chunk = self.sock.recv(4096)
                if not chunk:
                    break
                buf += chunk
            except socket.timeout:
                break
        return buf

    def recv_line(self):
        return self.recv_until(b'\n')

    def recv_all(self, timeout=2):
        self.sock.settimeout(timeout)
        buf = b''
        while True:
            try:
                chunk = self.sock.recv(4096)
                if not chunk:
                    break
                buf += chunk
            except socket.timeout:
                break
        self.sock.settimeout(self.timeout)
        return buf

    def send(self, data):
        if isinstance(data, str):
            data = data.encode()
        if not data.endswith(b'\n'):
            data += b'\n'
        self.sock.sendall(data)

    def sendrecv(self, data, recv_until=None):
        self.send(data)
        if recv_until:
            return self.recv_until(recv_until)
        return self.recv_all()

    def check_flag(self, data):
        text = data.decode('latin-1') if isinstance(data, bytes) else data
        match = FLAG_RE.search(text)
        if match:
            print(f'\n[FLAG] {match.group()}')
            return match.group()
        return None

    def close(self):
        if self.sock:
            self.sock.close()

# Usage
client = ServiceClient(HOST, PORT)
if client.connect():
    banner = client.recv_all()
    print(banner.decode())
    client.check_flag(banner)
    response = client.sendrecv('answer')
    client.check_flag(response)
    client.close()
```

## Pwntools Service Client

```python
from pwn import *
import re

HOST = 'challenge.ctf.com'
PORT = 1337
FLAG_RE = re.compile(rb'flag\{[^}]+\}', re.IGNORECASE)

def connect():
    return remote(HOST, PORT, timeout=10)

def find_flag(data):
    match = FLAG_RE.search(data)
    if match:
        flag = match.group().decode()
        log.success(f'Flag: {flag}')
        return flag
    return None

p = connect()
banner = p.recvuntil(b'> ', timeout=5)
log.info(f'Banner: {banner.decode()[:100]}')
find_flag(banner)

p.sendline(b'command')
response = p.recvall(timeout=5)
find_flag(response)
```

## Flag Extraction Patterns

```python
import re

FLAG_PATTERNS = [
    re.compile(rb'flag\{[^}]+\}', re.IGNORECASE),
    re.compile(rb'ctf\{[^}]+\}', re.IGNORECASE),
    re.compile(rb'FLAG\{[^}]+\}'),
    re.compile(rb'CTF\{[^}]+\}'),
    re.compile(rb'666c61677b[0-9a-f]+7d'),  # Hex "flag{...}"
    re.compile(rb'Zmxh[A-Za-z0-9+/]+=*'),   # Base64 "flag{"
]

def extract_flags(data):
    """Search binary data for all possible flag formats."""
    if isinstance(data, str):
        data = data.encode()
    flags = set()
    for pattern in FLAG_PATTERNS:
        for match in pattern.finditer(data):
            flag = match.group()
            try:
                decoded = bytes.fromhex(flag.decode())
                if b'flag{' in decoded:
                    flags.add(decoded.decode())
                    continue
            except (ValueError, UnicodeDecodeError):
                pass
            flags.add(flag.decode('latin-1'))
    return list(flags)
```

## UDP Interaction

```python
import socket

def udp_interact(host, port, messages):
    """Send/receive over UDP."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)
    results = []
    for msg in messages:
        if isinstance(msg, str):
            msg = msg.encode()
        sock.sendto(msg, (host, port))
        try:
            data, addr = sock.recvfrom(4096)
            results.append(data)
            print(f'[RECV] {data.decode("latin-1")[:100]}')
        except socket.timeout:
            results.append(None)
            print('[TIMEOUT]')
    sock.close()
    return results
```

## Timeout and Retry Wrapper

```python
from pwn import *
import time

def solve_with_retry(host, port, solve_fn, max_retries=5):
    """
    Wrap an entire solve in retry logic.
    solve_fn(p) should return the flag or None.
    """
    for attempt in range(max_retries):
        try:
            p = remote(host, port, timeout=15)
            result = solve_fn(p)
            if result:
                return result
            p.close()
        except (EOFError, TimeoutError) as e:
            log.warning(f'Attempt {attempt + 1} failed: {e}')
        except Exception as e:
            log.error(f'Unexpected error: {e}')
        finally:
            try:
                p.close()
            except Exception:
                pass
        time.sleep(1)
    log.error('All retries exhausted')
    return None
```
