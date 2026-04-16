#!/usr/bin/env node

import { basename } from 'path';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString());

const filePath = input?.tool_input?.file_path ?? '';
if (!filePath) process.exit(0);

function deny(reason) {
  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason
  }));
  process.exit(2);
}

const normalized = filePath.replace(/\\/g, '/');
const base = basename(filePath);

// Dependency and build directories
const blockedDirs = [
  /^node_modules\//,
  /\/node_modules\//,
  /^vendor\//,
  /\/vendor\//,
  /^dist\//,
  /\/dist\//,
  /^build\//,
  /\/build\//,
  /^\.next\//,
  /\/\.next\//,
  /^__pycache__\//,
  /\/__pycache__\//,
  /^\.venv\//,
  /\/\.venv\//,
  /^venv\//,
  /\/venv\//,
];

for (const pattern of blockedDirs) {
  if (pattern.test(normalized)) {
    deny(`Build/dependency directory: ${filePath}`);
  }
}

// Binary and archive extensions
const blockedExtensions = new Set([
  '.wasm', '.so', '.dylib', '.dll', '.exe', '.o', '.a',
  '.zip', '.tar', '.tgz', '.rar', '.7z',
  '.mp4', '.mov', '.avi', '.mkv',
  '.mp3', '.wav', '.flac',
  '.pyc', '.pyo', '.class',
]);

const ext = base.includes('.') ? '.' + base.split('.').pop().toLowerCase() : '';

// Handle compound extensions like .tar.gz and .tar.bz2
if (normalized.endsWith('.tar.gz') || normalized.endsWith('.tar.bz2')) {
  deny(`Binary/archive file: ${filePath}`);
}

if (blockedExtensions.has(ext)) {
  deny(`Binary/archive file: ${filePath}`);
}

process.exit(0);
