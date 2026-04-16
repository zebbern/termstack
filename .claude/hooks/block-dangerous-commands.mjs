#!/usr/bin/env node

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString());

const command = input?.tool_input?.command ?? '';
if (!command) process.exit(0);

function deny(reason) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason
  }));
  process.exit(2);
}

// --- Git dangerous patterns ---

// Push to main/master
if (/\bgit\s+push\b.*\b(main|master)\b/.test(command)) {
  deny('Direct push to main/master is not allowed. Use a feature branch and PR.');
}

// Bare push on main/master (e.g., already on main branch)
if (/\bgit\s+push\b/.test(command) && /\b(origin\s+)?(main|master)\b/.test(command)) {
  deny('Direct push to main/master is not allowed. Use a feature branch and PR.');
}

// Force push (but allow --force-with-lease)
if (/\bgit\s+push\b.*--force\b/.test(command) && !/--force-with-lease/.test(command)) {
  deny('Force push is dangerous. Use --force-with-lease instead.');
}

// Reset --hard
if (/\bgit\s+reset\b.*--hard\b/.test(command)) {
  deny('git reset --hard destroys uncommitted changes. Stash or commit first.');
}

// Clean -f
if (/\bgit\s+clean\b.*-f/.test(command)) {
  deny('git clean -f permanently deletes untracked files. Review with git clean -n first.');
}

// --- Filesystem dangerous patterns ---

// rm -rf on root, home, or parent directories
if (/\brm\s+-rf\s+(\/|~|\.\.)/.test(command) || /\brm\s+-rf\s+\/$/.test(command)) {
  deny('rm -rf on root, home, or parent directories is extremely dangerous.');
}

// --- Database dangerous patterns ---

// DROP TABLE/DATABASE/SCHEMA
if (/\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i.test(command)) {
  deny('DROP TABLE/DATABASE/SCHEMA is destructive. Confirm this is intentional.');
}

// DELETE FROM without WHERE
if (/\bDELETE\s+FROM\b/i.test(command) && !/\bWHERE\b/i.test(command)) {
  deny('DELETE FROM without WHERE clause will delete all rows. Add a WHERE clause.');
}

// TRUNCATE TABLE
if (/\bTRUNCATE\s+TABLE\b/i.test(command)) {
  deny('TRUNCATE TABLE deletes all rows. Confirm this is intentional.');
}

// --- System dangerous patterns ---

// chmod 777
if (/\bchmod\s+777\b/.test(command)) {
  deny('chmod 777 makes files world-writable. Use more restrictive permissions.');
}

// curl/wget piped to shell
if (/\b(curl|wget)\b.*\|\s*(ba)?sh\b/.test(command)) {
  deny('Piping curl/wget to shell is dangerous. Download first, review, then execute.');
}

// Destructive disk operations
if (/\b(mkfs|dd\s+if=)/.test(command)) {
  deny('Destructive disk operation detected. Confirm target device carefully.');
}

// --- Publishing patterns ---

if (/\b(npm|yarn|pnpm|bun)\s+publish\b/.test(command)) {
  deny('Package publishing must be done intentionally, not by an AI agent.');
}

if (/\bcargo\s+publish\b/.test(command)) {
  deny('Cargo publish must be done intentionally, not by an AI agent.');
}

if (/\bgem\s+push\b/.test(command)) {
  deny('Gem push must be done intentionally, not by an AI agent.');
}

if (/\btwine\s+upload\b/.test(command)) {
  deny('Twine upload must be done intentionally, not by an AI agent.');
}

process.exit(0);
