#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname, extname, basename } from 'path';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString());

const filePath = input?.tool_input?.file_path ?? '';
if (!filePath || !existsSync(filePath)) process.exit(0);

const ext = extname(filePath).toLowerCase();
const base = basename(filePath);

function findProjectRoot() {
  const markers = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', '.git'];
  let dir = process.cwd();
  while (true) {
    for (const marker of markers) {
      if (existsSync(join(dir, marker))) return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

function hasBinary(name) {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function hasLocalBinary(root, name) {
  const binPath = join(root, 'node_modules', '.bin', name);
  return existsSync(binPath) || existsSync(binPath + '.cmd');
}

function fileContains(filePath, text) {
  try {
    return readFileSync(filePath, 'utf8').includes(text);
  } catch {
    return false;
  }
}

function runFormatter(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 10000 });
  } catch {
    // Formatting failures are non-blocking
  }
}

const root = findProjectRoot();

// JavaScript/TypeScript/JSON/CSS extensions
const webExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.css']);
const prettierExts = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss', '.md', '.yaml', '.yml', '.html']);

// Try Biome
if (webExts.has(ext) && hasLocalBinary(root, 'biome')) {
  const hasBiomeConfig = existsSync(join(root, 'biome.json')) || existsSync(join(root, 'biome.jsonc'));
  if (hasBiomeConfig) {
    runFormatter(`npx biome format --write "${filePath}"`);
    process.exit(0);
  }
}

// Try Prettier
if (prettierExts.has(ext) && hasLocalBinary(root, 'prettier')) {
  const prettierConfigs = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    '.prettierrc.json5',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.mjs',
    '.prettierrc.toml',
    'prettier.config.js',
    'prettier.config.cjs',
    'prettier.config.mjs',
  ];

  let hasPrettierConfig = prettierConfigs.some(c => existsSync(join(root, c)));

  if (!hasPrettierConfig) {
    try {
      const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
      if (pkg.prettier) hasPrettierConfig = true;
    } catch {
      // no package.json or malformed
    }
  }

  if (hasPrettierConfig) {
    runFormatter(`npx prettier --write "${filePath}"`);
    process.exit(0);
  }
}

// Try Ruff (Python)
if (ext === '.py' && hasBinary('ruff')) {
  const hasRuffConfig = existsSync(join(root, 'ruff.toml')) ||
    existsSync(join(root, '.ruff.toml')) ||
    (existsSync(join(root, 'pyproject.toml')) && fileContains(join(root, 'pyproject.toml'), '[tool.ruff]'));

  if (hasRuffConfig) {
    runFormatter(`ruff format "${filePath}"`);
    runFormatter(`ruff check --fix "${filePath}"`);
    process.exit(0);
  }
}

// Try Black (Python)
if (ext === '.py' && hasBinary('black')) {
  const hasBlackConfig = existsSync(join(root, 'pyproject.toml')) &&
    fileContains(join(root, 'pyproject.toml'), '[tool.black]');

  if (hasBlackConfig) {
    runFormatter(`black --quiet "${filePath}"`);
    if (hasBinary('isort')) {
      runFormatter(`isort --quiet "${filePath}"`);
    }
    process.exit(0);
  }
}

// rustfmt (Rust)
if (ext === '.rs') {
  runFormatter(`rustfmt "${filePath}"`);
  process.exit(0);
}

// gofmt (Go)
if (ext === '.go') {
  runFormatter(`gofmt -w "${filePath}"`);
  process.exit(0);
}

process.exit(0);
