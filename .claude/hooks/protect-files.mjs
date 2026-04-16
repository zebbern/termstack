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

const base = basename(filePath);

// Protected file patterns
const protectedBasenames = [
  /^\.env$/,
  /^\.env\..+$/,
  /\.pem$/,
  /\.key$/,
  /\.crt$/,
  /\.p12$/,
  /\.pfx$/,
  /^id_rsa$/,
  /^id_ed25519$/,
  /^credentials\.json$/,
  /^\.npmrc$/,
  /^\.pypirc$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /\.gen\.ts$/,
  /\.generated\..+$/,
  /\.min\.js$/,
  /\.min\.css$/,
];

for (const pattern of protectedBasenames) {
  if (pattern.test(base)) {
    deny(`Protected file: ${base} matches ${pattern}`);
  }
}

// Sensitive directories and paths
const sensitivePaths = [
  /^\.git\//,
  /\/\.git\//,
  /^secrets\//,
  /\/secrets\//,
  /^\.env$/,
  /\/\.env$/,
  /^\.env\./,
  /\/\.env\./,
  /^\.claude\/hooks\//,
  /^\.claude\/settings\.json$/,
];

const normalized = filePath.replace(/\\/g, '/');
for (const pattern of sensitivePaths) {
  if (pattern.test(normalized)) {
    deny(`Sensitive path: ${filePath}`);
  }
}

process.exit(0);
