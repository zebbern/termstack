---
applyTo: "**"
---

# Terminal instructions

If `PowerShell` keeps interfering with the quotes, use base64 encoding to bypass
all shell escaping issues.

IF a vulnerbility is found you must think this: "can this be used in a way that allows attackers to do something or access something they should not be able to?" If the answer is yes, then you have found a vulnerability. You should report it to the project maintainers and provide a proof of concept. If the answer is no then you have not found a vulnerability and you should move on to find something else. Do not report something as a vulnerability if it is not, as this can cause unnecessary panic and waste the time of the maintainers. Always be sure to verify your findings before reporting them.

## Environment

This workspace runs inside Visual Studio Code and your currently on a windows with powershell terminal. You also have access to kali-tools mcp which provides many tools and is recommended to use for all your terminal needs. Only if a tool is not available in kali-tools mcp should you consider using another option. Do not use wsl always prefer kali-tools mcp for consistency and reliability. If you cant reach a challange target its most likely because you are not using the kali-tools mcp terminal.

---

## Rules

- Do not send hastag comments in terminal as commands example: # example here
- Run long running commands in the background terminal such as nmap or fluff until completion, do not interrupt it the same rule applies to listening commands such as nc or sessions which is waiting for incoming connections, do not re-run the same command if it is already running in the terminal.
- Do not run commands such as echo "=== Submit 3 done ===" in the terminal as it is not a valid command and will do nothing but create noise in the terminal.

### Verify before executing

Always confirm a binary exists before using it. Assuming a tool is installed causes cascading failures that are harder to debug than the original task.

```bash
# preferred
which nmap && nmap -sV target
# avoid
nmap -sV target   # fails silently if nmap is missing
```

### Never use heredocs to write files

Heredoc file writes (`cat << EOF > file`) are a documented source of corruption in VS Code agent terminals — variables expand unexpectedly, indentation breaks delimiters, and template literals like `${x}` cause "Bad substitution" errors. Use the file editing tools instead.

```bash
# avoid — heredoc in terminal
cat << EOF > config.py
API_KEY = "${key}"
EOF

# preferred — use the file creation or str_replace tool
# (handled by the editor, not the shell)
```

### Stop on tool failure — never skip it

Agents that skip a failed tool result and continue anyway cause silent data corruption. If a command exits non-zero, stop and report the full error. Do not guess what the output would have been.

```bash
# preferred
result=$(nmap -sV 10.10.10.5) || { echo "nmap failed: $?"; exit 1; }

# avoid
nmap -sV 10.10.10.5   # ignoring exit code and continuing
```

### Never retry the same failing command more than twice

Retrying an identical failing command is the single most reported time-wasting agent behavior. After two failures, stop and explain what is wrong. Do not loop.

### Never run destructive commands without explicit confirmation

Real-world AI agent incidents in 2025–2026 trace directly to agents running destructive commands autonomously. These require user approval before running:

- `rm -rf`
- `dd`, `mkfs`, `fdisk`
- `> file` on any config or system file
- `chmod -R`, `chown -R`
- `kill`, `pkill`, `killall`
- Any `sudo` command not discussed in the current session
- Any command that deploys, publishes, or deletes

### Read the full error before acting

The error message contains the fix. Common errors agents misread:

| Error | Meaning | Do not |
|---|---|---|
| `ENOENT` | File/path does not exist | Retry. Find the correct path. |
| `spawn X ENOENT` | Binary `X` is not on PATH | Assume it is installed. |
| `ERR_INVALID_URL` | Network/proxy issue | Treat as a syntax error. |
| `lockfile found` | Previous process left state | Retry without cleaning up. |
| `Operation not permitted` | Missing capability or wrong env | Sudo blindly. |

### Be explicit — never rely on defaults

```bash
# preferred
bash -c "command"     # not sh -c
python3 script.py     # not python
pip install X --break-system-packages
/full/path/to/tool    # when PATH is uncertain
```

### Trust apt package names over assumed binary names

The apt package name often differs from the binary name. Always confirm.

```bash
# example: exiftool binary is in package libimage-exiftool-perl
apt search exiftool
```

### Do not follow outdated documentation verbatim

Package names, install paths, and command syntax change. If a documented command fails, check the current install method from the project's GitHub — do not retry the same broken command from old docs.

---

## File locations

| Purpose | Path |
|---|---|
| CTF workspace | `/home/kali3/aglooptest8/` |
| Tools | `/home/kali3/tools/` |
| Windows files | `/mnt/c/Users/Deobf/` |
| Volatility3 | `/home/kali3/tools/volatility3/vol.py` |
| Stegsolve | `/home/kali3/tools/stegsolve.jar` — run with `java -jar` |
| Wordlists | `/usr/share/wordlists/` |
