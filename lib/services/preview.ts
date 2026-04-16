/**
 * PreviewManager - Handles per-project development servers (live preview)
 */

import { spawn, type ChildProcess, type SpawnOptions } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { findAvailablePort } from '@/lib/utils/ports';
import { getProjectById, updateProject, updateProjectStatus } from './project';
import { streamManager } from './stream';
import { scaffoldBasicNextApp } from '@/lib/utils/scaffold';
import { PREVIEW_CONFIG } from '@/lib/config/constants';
import type { Project } from '@/types/backend';
import type { PreviewDiagnosticCategory, PreviewEventInfo } from '@/types';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const yarnCommand = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';
const bunCommand = process.platform === 'win32' ? 'bun.exe' : 'bun';

type PackageManagerId = 'npm' | 'pnpm' | 'yarn' | 'bun';

const PACKAGE_MANAGER_COMMANDS: Record<
  PackageManagerId,
  { command: string; installArgs: string[] }
> = {
  npm: { command: npmCommand, installArgs: ['install'] },
  pnpm: { command: pnpmCommand, installArgs: ['install'] },
  yarn: { command: yarnCommand, installArgs: ['install'] },
  bun: { command: bunCommand, installArgs: ['install'] },
};

const LOG_LIMIT = PREVIEW_CONFIG.LOG_LIMIT;
const PREVIEW_FALLBACK_PORT_START = PREVIEW_CONFIG.FALLBACK_PORT_START;
const PREVIEW_FALLBACK_PORT_END = PREVIEW_CONFIG.FALLBACK_PORT_END;
const PREVIEW_MAX_PORT = 65_535;
const ANSI_ESCAPE_PATTERN = /\u001b\[[0-9;]*m/g;
const SAFE_AUTO_INSTALL_PACKAGES = new Set([
  // Core React/Next
  'next',
  'react',
  'react-dom',
  '@next/font',
  '@next/mdx',
  // Styling
  'tailwindcss',
  'autoprefixer',
  'postcss',
  'tailwind-merge',
  'clsx',
  'class-variance-authority',
  'cva',
  // UI Component Libraries
  'lucide-react',
  'react-icons',
  '@heroicons/react',
  '@phosphor-icons/react',
  // Animation
  'framer-motion',
  'motion',
  '@react-spring/web',
  // State & Data
  'zustand',
  'jotai',
  'swr',
  'zod',
  // Utility
  'lodash',
  'date-fns',
  'dayjs',
  'axios',
  'nanoid',
  'uuid',
  'slugify',
  // Markdown / Content
  'react-markdown',
  'remark-gfm',
  'rehype-raw',
  'gray-matter',
  // Forms
  'react-hook-form',
  '@hookform/resolvers',
  // Toast / Notifications
  'sonner',
  'react-hot-toast',
  // Misc React utilities
  'cmdk',
  'vaul',
  'input-otp',
  'embla-carousel-react',
  'react-day-picker',
  'react-resizable-panels',
  'recharts',
  'next-themes',
]);

const SAFE_AUTO_INSTALL_PREFIXES = [
  '@radix-ui/',
  '@tanstack/',
  '@headlessui/',
  '@tailwindcss/',
  '@shadcn/',
];

function isSafeAutoInstallPackage(packageName: string): boolean {
  if (SAFE_AUTO_INSTALL_PACKAGES.has(packageName)) {
    return true;
  }
  return SAFE_AUTO_INSTALL_PREFIXES.some((prefix) => packageName.startsWith(prefix));
}

const INSTALL_RETRY_DELAYS = [3000, 6000]; // 2 retries: 3s then 6s

const MAX_RECOVERY_ATTEMPTS = 2;
const RECOVERY_COOLDOWN_MS = 10_000; // 10 seconds between recovery attempts
const RECOVERY_SUCCESS_RESET_MS = 30_000; // Reset counter after 30s of stable running

const CIRCUIT_BREAKER_MAX_ATTEMPTS = 5;
const CIRCUIT_BREAKER_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

type PreviewLifecycleStage= 'dependency-install' | 'build' | 'startup' | 'running';

type DeterministicFix =
  | {
      kind: 'install-packages';
      packages: string[];
      reason: string;
    }
  | {
      kind: 'reinstall-dependencies';
      reason: string;
    }
  | {
      kind: 'kill-port-and-retry';
      port: number;
      reason: string;
    }
  | {
      kind: 'restart-process';
      reason: string;
    }
  | {
      kind: 'clear-cache-and-retry';
      reason: string;
    };

interface RetainedPreviewState {
  port: number | null;
  url: string | null;
  status: PreviewStatus;
  logs: string[];
  latestDiagnostic: PreviewEventInfo | null;
  pid: number | null;
}

export class PreviewDiagnosticError extends Error {
  public readonly diagnostic: PreviewEventInfo;

  constructor(diagnostic: PreviewEventInfo) {
    super(diagnostic.message);
    this.name = 'PreviewDiagnosticError';
    this.diagnostic = diagnostic;
  }
}

function shouldUseCommandShell(command: string): boolean {
  return process.platform === 'win32' && /\.(cmd|bat)$/i.test(command);
}

function splitLogLines(chunk: Buffer | string): string[] {
  return chunk
    .toString()
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function stripAnsi(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, '');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizePreviewErrorBody(value: string): string {
  return decodeHtmlEntities(stripAnsi(value))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPreviewDiagnosticFromBody(body: string): PreviewEventInfo | null {
  const normalized = normalizePreviewErrorBody(body);
  if (!normalized) {
    return null;
  }

  const missingModuleMatch = normalized.match(/Module not found:?\s*Can't resolve ['"`]([^'"`]+)['"`]/i);
  if (missingModuleMatch?.[1]) {
    return createPreviewDiagnostic(
      'build',
      'error',
      `Missing dependency: ${missingModuleMatch[1]}`,
      normalized.slice(0, 400)
    );
  }

  if (/Event handlers cannot be passed to Client Component props/i.test(normalized)) {
    return createPreviewDiagnostic(
      'runtime-error',
      'error',
      'Event handlers cannot be passed to Client Component props.',
      normalized.slice(0, 400)
    );
  }

  const runtimeMessageMatch = normalized.match(/Error:\s*(.+?)(?: digest:|$)/i);
  if (runtimeMessageMatch?.[1]) {
    return createPreviewDiagnostic(
      'runtime-error',
      'error',
      runtimeMessageMatch[1].trim().slice(0, 220),
      normalized.slice(0, 400)
    );
  }

  return null;
}

function appendLinesWithLimit(target: string[], lines: string[]): void {
  lines.forEach((line) => {
    target.push(line);
    if (target.length > LOG_LIMIT) {
      target.shift();
    }
  });
}

function resolveProjectPath(project: Project, projectId: string): string {
  return project.repoPath
    ? path.resolve(project.repoPath)
    : path.join(process.cwd(), 'projects', projectId);
}

function createPreviewDiagnostic(
  category: PreviewDiagnosticCategory,
  severity: PreviewEventInfo['severity'],
  message: string,
  detail?: string
): PreviewEventInfo {
  return {
    category,
    severity,
    message,
    ...(detail ? { detail } : {}),
    timestamp: new Date().toISOString(),
  };
}

function normalizeModulePackage(specifier: string): string | null {
  const cleaned = specifier.trim().replace(/^['"`]|['"`]$/g, '');
  if (
    cleaned.length === 0 ||
    cleaned.startsWith('.') ||
    cleaned.startsWith('/') ||
    cleaned.startsWith('node:') ||
    cleaned.startsWith('http://') ||
    cleaned.startsWith('https://')
  ) {
    return null;
  }

  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  if (cleaned.startsWith('@')) {
    if (parts.length < 2) {
      return null;
    }
    return `${parts[0]}/${parts[1]}`;
  }

  return parts[0];
}

function extractMissingPackagesFromLogs(logs: string[]): string[] {
  const joined = logs.slice(-200).map(stripAnsi).join('\n');
  const matches = new Set<string>();
  const patterns = [
    /Can't resolve ['"`]([^'"`]+)['"`]/gi,
    /Cannot find module ['"`]([^'"`]+)['"`]/gi,
    /Cannot find package ['"`]([^'"`]+)['"`]/gi,
  ];

  patterns.forEach((pattern) => {
    for (const match of joined.matchAll(pattern)) {
      const normalized = normalizeModulePackage(match[1] ?? '');
      if (normalized && isSafeAutoInstallPackage(normalized)) {
        matches.add(normalized);
      }
    }
  });

  return Array.from(matches);
}

function detectDeterministicFix(logs: string[]): DeterministicFix | null {
  const missingPackages = extractMissingPackagesFromLogs(logs);
  if (missingPackages.length > 0) {
    return {
      kind: 'install-packages',
      packages: missingPackages,
      reason: `Detected missing dependency imports: ${missingPackages.join(', ')}.`,
    };
  }

  const joined = logs.slice(-200).join('\n');
  if (
    /next(?:\.cmd)?\s+is not recognized/i.test(joined) ||
    /next:\s+not found/i.test(joined) ||
    /Cannot find module ['"`]next['"`]/i.test(joined) ||
    /ENOENT.*node_modules/i.test(joined)
  ) {
    return {
      kind: 'reinstall-dependencies',
      reason: 'Core preview dependencies appear missing or incomplete.',
    };
  }

  const portConflict = detectPortConflict(logs);
  if (portConflict) {
    return portConflict;
  }

  return null;
}

/**
 * Fallback fix detection from a PreviewDiagnosticError's diagnostic.
 * Used when log-based detection fails due to a race condition: the HTTP probe
 * can receive a 500 response (with the error in the body) before stderr
 * delivers the corresponding log lines to the parent process.
 */
function extractDeterministicFixFromDiagnostic(error: unknown): DeterministicFix | null {
  if (!(error instanceof PreviewDiagnosticError)) {
    return null;
  }
  const msg = error.diagnostic?.message ?? '';
  const match = msg.match(/^Missing dependency:\s*(.+)$/i);
  if (match?.[1]) {
    const normalized = normalizeModulePackage(match[1]);
    if (normalized && isSafeAutoInstallPackage(normalized)) {
      return {
        kind: 'install-packages',
        packages: [normalized],
        reason: `Detected missing dependency from HTTP probe diagnostic: ${normalized}`,
      };
    }
  }

  // Check for port conflict in the diagnostic message or detail
  const messageText = `${msg} ${error.diagnostic?.detail ?? ''}`.toLowerCase();
  if (messageText.includes('eaddrinuse') || messageText.includes('address already in use')) {
    const portMatch = messageText.match(/(?:port|address)\s*(?:already in use\s*)?(?:::)?(\d+)/i)
      ?? messageText.match(/eaddrinuse\s*(?:::)?(\d+)/i);
    if (portMatch?.[1]) {
      return {
        kind: 'kill-port-and-retry',
        port: parseInt(portMatch[1], 10),
        reason: `Port conflict detected: ${portMatch[1]} is already in use`,
      };
    }
  }

  return null;
}

function detectPortConflict(logs: string[]): DeterministicFix | null {
  const joined = logs.slice(-100).map(stripAnsi).join('\n');
  const portMatch = joined.match(
    /(?:EADDRINUSE|address already in use|port\s+(\d+)\s+is already in use).*?(?::(\d+))?/i
  );
  if (!portMatch) {
    return null;
  }
  const port = Number.parseInt(portMatch[1] ?? portMatch[2] ?? '0', 10);
  if (port <= 0 || port > 65535) {
    return null;
  }
  return {
    kind: 'kill-port-and-retry',
    port,
    reason: `Port ${port} is already in use (EADDRINUSE). Will attempt to terminate the stale process and retry.`,
  };
}

function extractRuntimeErrorFromLines(lines: string[]): { message: string; detail?: string } | null {
  const relevant = lines.map(stripAnsi).filter((line) => line.trim().length > 0);
  for (let index = 0; index < relevant.length; index += 1) {
    const line = relevant[index];
    const nextLine = relevant[index + 1];
    const nextNextLine = relevant[index + 2];

    const nextDetail = [nextLine, nextNextLine]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .trim();

    const nextMessageMatch = line.match(/(?:⨯\s*)?Error:\s*(.+)$/i);
    if (nextMessageMatch?.[1]) {
      return {
        message: nextMessageMatch[1].trim(),
        detail: nextDetail || undefined,
      };
    }

    if (/Unhandled Runtime Error/i.test(line)) {
      return {
        message: nextLine?.trim() || 'Unhandled runtime error in preview.',
        detail: nextNextLine?.trim() || undefined,
      };
    }
  }

  return null;
}

interface ExitClassification {
  cause: 'oom' | 'segfault' | 'abort' | 'signal-kill' | 'unexpected-exit' | 'clean-exit';
  message: string;
  recoverable: boolean;
}

function classifyExitCode(code: number | null, signal: NodeJS.Signals | null): ExitClassification {
  if (code === 0 || signal === 'SIGTERM') {
    return { cause: 'clean-exit', message: 'Process exited normally.', recoverable: false };
  }

  if (signal === 'SIGKILL' || code === 137) {
    return {
      cause: 'oom',
      message: 'Process was killed (likely out of memory). Try reducing memory usage or closing other applications.',
      recoverable: false,
    };
  }

  if (code === 134 || signal === 'SIGABRT') {
    return {
      cause: 'abort',
      message: 'Process aborted (SIGABRT). This may indicate a fatal assertion or memory issue.',
      recoverable: false,
    };
  }

  if (code === 139 || signal === 'SIGSEGV') {
    return {
      cause: 'segfault',
      message: 'Process crashed with a segmentation fault. This is likely a bug in a native module.',
      recoverable: false,
    };
  }

  if (signal) {
    return {
      cause: 'signal-kill',
      message: `Process was terminated by signal ${signal}.`,
      recoverable: true,
    };
  }

  return {
    cause: 'unexpected-exit',
    message: `Process exited unexpectedly with code ${code}.`,
    recoverable: true,
  };
}

interface InstallFailureClassification {
  cause: 'dependency-conflict' | 'network-timeout' | 'package-not-found' | 'corrupted-lockfile' | 'integrity-error' | 'permission-error' | 'unknown';
  message: string;
  transient: boolean;
}

function classifyInstallFailure(errorOutput: string): InstallFailureClassification {
  const text = errorOutput.toLowerCase();

  if (text.includes('eresolve') || text.includes('could not resolve dependency')) {
    return {
      cause: 'dependency-conflict',
      message: 'Dependency version conflict detected. Check package.json for incompatible version ranges.',
      transient: false,
    };
  }

  if (text.includes('etimedout') || text.includes('err_socket_timeout') || text.includes('econnreset') || text.includes('econnrefused') || text.includes('fetch failed')) {
    return {
      cause: 'network-timeout',
      message: 'Network timeout during dependency installation. This may be a transient issue.',
      transient: true,
    };
  }

  if (text.includes('code e404') || text.includes('404 not found')) {
    return {
      cause: 'package-not-found',
      message: 'One or more packages could not be found in the registry. Check package names and versions.',
      transient: false,
    };
  }

  if (text.includes('unexpected end of json') || text.includes('invalid json') || text.includes('unexpected token')) {
    return {
      cause: 'corrupted-lockfile',
      message: 'Package lockfile appears corrupted. Deleting and reinstalling may fix this.',
      transient: false,
    };
  }

  if (text.includes('eintegrity') || text.includes('integrity checksum failed')) {
    return {
      cause: 'integrity-error',
      message: 'Package integrity check failed. The npm/pnpm cache may be corrupted.',
      transient: false,
    };
  }

  if (text.includes('eacces') || text.includes('permission denied')) {
    return {
      cause: 'permission-error',
      message: 'Permission denied during installation. Check file system permissions.',
      transient: false,
    };
  }

  return {
    cause: 'unknown',
    message: 'Dependency installation failed for an unknown reason.',
    transient: false,
  };
}

function extractBuildErrorFromLines(lines: string[]): { message: string; detail?: string } | null {
  const relevant = lines.map(stripAnsi).filter((line) => line.trim().length > 0);
  const joined = relevant.join('\n');

  const missingModuleMatch = joined.match(/Module not found[\s\S]*?Can't resolve ['"`]([^'"`]+)['"`]/i);
  if (missingModuleMatch?.[1]) {
    return {
      message: `Missing dependency: ${missingModuleMatch[1]}`,
      detail: relevant.slice(0, 6).join(' '),
    };
  }

  if (/Failed to compile/i.test(joined)) {
    return {
      message: 'Preview build failed during compilation.',
      detail: relevant.slice(0, 6).join(' '),
    };
  }

  for (let index = 0; index < relevant.length; index += 1) {
    const line = relevant[index];
    const nextLine = relevant[index + 1];
    const detail = [nextLine, relevant[index + 2]]
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .join(' ')
      .trim();

    if (/Module not found/i.test(line)) {
      return {
        message: 'Preview build failed due to a missing module.',
        detail: detail || line.trim(),
      };
    }

    if (/Failed to compile/i.test(line)) {
      return {
        message: 'Preview build failed during compilation.',
        detail: detail || line.trim(),
      };
    }
  }

  return null;
}

const ROOT_ALLOWED_FILES = new Set([
  '.DS_Store',
  '.editorconfig',
  '.env',
  '.env.development',
  '.env.local',
  '.env.production',
  '.eslintignore',
  '.eslintrc',
  '.eslintrc.cjs',
  '.eslintrc.js',
  '.eslintrc.json',
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  '.prettierrc',
  '.prettierrc.cjs',
  '.prettierrc.js',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  'LICENSE',
  'README',
  'README.md',
  'package-lock.json',
  'pnpm-lock.yaml',
  'poetry.lock',
  'requirements.txt',
  'yarn.lock',
]);
const ROOT_ALLOWED_DIR_PREFIXES = ['.'];
const ROOT_ALLOWED_DIRS = new Set([
  '.git',
  '.idea',
  '.vscode',
  '.github',
  '.husky',
  '.pnpm-store',
  '.turbo',
  '.next',
  'node_modules',
]);
const ROOT_OVERWRITABLE_FILES = new Set([
  '.gitignore',
  '.eslintignore',
  '.env',
  '.env.development',
  '.env.local',
  '.env.production',
  '.npmrc',
  '.nvmrc',
  '.prettierignore',
  'README',
  'README.md',
  'README.txt',
]);

type PreviewStatus = 'starting' | 'running' | 'stopped' | 'error';

interface PreviewProcess {
  process: ChildProcess | null;
  port: number;
  url: string;
  status: PreviewStatus;
  logs: string[];
  startedAt: Date;
  latestDiagnostic: PreviewEventInfo | null;
  stage: PreviewLifecycleStage;
  isStopping: boolean;
  recoveryAttempts: number;
  lastRecoveryAt: number | null;
}

interface EnvOverrides {
  port?: number;
  url?: string;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function parsePort(value?: string): number | null {
  if (!value) return null;
  const numeric = Number.parseInt(stripQuotes(value), 10);
  if (Number.isFinite(numeric) && numeric > 0 && numeric <= 65535) {
    return numeric;
  }
  return null;
}

async function readPackageJson(
  projectPath: string
): Promise<Record<string, any> | null> {
  try {
    const raw = await fs.readFile(path.join(projectPath, 'package.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function collectEnvOverrides(projectPath: string): Promise<EnvOverrides> {
  const overrides: EnvOverrides = {};
  const files = ['.env.local', '.env'];

  for (const fileName of files) {
    const filePath = path.join(projectPath, fileName);
    try {
      const contents = await fs.readFile(filePath, 'utf8');
      const lines = contents.split(/\r?\n/);
      let candidateUrl: string | null = null;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#') || !line.includes('=')) {
          continue;
        }

        const [rawKey, ...rawValueParts] = line.split('=');
        const key = rawKey.trim();
        const rawValue = rawValueParts.join('=');
        const value = stripQuotes(rawValue);

        if (!overrides.port && (key === 'PORT' || key === 'WEB_PORT')) {
          const parsed = parsePort(value);
          if (parsed) {
            overrides.port = parsed;
          }
        }

        if (!overrides.url && key === 'NEXT_PUBLIC_APP_URL' && value) {
          candidateUrl = value;
        }
      }

      if (!overrides.url && candidateUrl) {
        overrides.url = candidateUrl;
      }

      if (!overrides.port && overrides.url) {
        try {
          const parsedUrl = new URL(overrides.url);
          if (parsedUrl.port) {
            const parsedPort = parsePort(parsedUrl.port);
            if (parsedPort) {
              overrides.port = parsedPort;
            }
          }
        } catch {
          // Ignore invalid URL formats
        }
      }

      if (overrides.port && overrides.url) {
        break;
      }
    } catch {
      // Missing env file is fine; skip
    }
  }

  return overrides;
}

function resolvePreviewBounds(): { start: number; end: number } {
  const envStartRaw = Number.parseInt(process.env.PREVIEW_PORT_START || '', 10);
  const envEndRaw = Number.parseInt(process.env.PREVIEW_PORT_END || '', 10);

  const start = Number.isInteger(envStartRaw)
    ? Math.max(1, envStartRaw)
    : PREVIEW_FALLBACK_PORT_START;

  let end = Number.isInteger(envEndRaw)
    ? Math.min(PREVIEW_MAX_PORT, envEndRaw)
    : PREVIEW_FALLBACK_PORT_END;

  if (end < start) {
    end = Math.min(start + (PREVIEW_FALLBACK_PORT_END - PREVIEW_FALLBACK_PORT_START), PREVIEW_MAX_PORT);
  }

  return { start, end };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function directoryExists(targetPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(targetPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function parsePackageManagerField(value: unknown): PackageManagerId | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const [rawName] = value.split('@');
  const name = rawName.trim().toLowerCase();
  if (name === 'npm' || name === 'pnpm' || name === 'yarn' || name === 'bun') {
    return name as PackageManagerId;
  }
  return null;
}

function isCommandNotFound(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as NodeJS.ErrnoException;
  return err.code === 'ENOENT';
}

async function detectPackageManager(projectPath: string): Promise<PackageManagerId> {
  const packageJson = await readPackageJson(projectPath);
  const fromField = parsePackageManagerField(packageJson?.packageManager);
  if (fromField) {
    return fromField;
  }

  if (await fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fileExists(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fileExists(path.join(projectPath, 'bun.lockb'))) {
    return 'bun';
  }
  if (await fileExists(path.join(projectPath, 'package-lock.json'))) {
    return 'npm';
  }
  return 'npm';
}

async function runInstallWithPreferredManager(
  projectPath: string,
  env: NodeJS.ProcessEnv,
  logger: (chunk: Buffer | string) => void
): Promise<void> {
  const manager = await detectPackageManager(projectPath);
  const { command, installArgs } = PACKAGE_MANAGER_COMMANDS[manager];

  logger(`[PreviewManager] Installing dependencies using ${manager}.`);
  try {
    await appendCommandLogs(command, installArgs, projectPath, env, logger);
  } catch (error) {
    if (manager !== 'npm' && isCommandNotFound(error)) {
      logger(
        `[PreviewManager] ${command} unavailable. Falling back to npm install.`
      );
      await appendCommandLogs(
        PACKAGE_MANAGER_COMMANDS.npm.command,
        PACKAGE_MANAGER_COMMANDS.npm.installArgs,
        projectPath,
        env,
        logger
      );
      return;
    }
    throw error;
  }
}

async function installPackagesWithPreferredManager(
  projectPath: string,
  env: NodeJS.ProcessEnv,
  packages: string[],
  logger: (chunk: Buffer | string) => void
): Promise<void> {
  const manager = await detectPackageManager(projectPath);
  const { command } = PACKAGE_MANAGER_COMMANDS[manager];
  const installArgs =
    manager === 'npm'
      ? ['install', '--save', ...packages]
      : ['add', ...packages];

  logger(
    `[PreviewManager] Installing missing package${packages.length === 1 ? '' : 's'}: ${packages.join(', ')}`
  );

  try {
    await appendCommandLogs(command, installArgs, projectPath, env, logger);
  } catch (error) {
    if (manager !== 'npm' && isCommandNotFound(error)) {
      logger(
        `[PreviewManager] ${command} unavailable. Falling back to npm install for ${packages.join(', ')}`
      );
      await appendCommandLogs(
        PACKAGE_MANAGER_COMMANDS.npm.command,
        ['install', '--save', ...packages],
        projectPath,
        env,
        logger
      );
      return;
    }
    throw error;
  }
}

async function isLikelyNextProject(dirPath: string): Promise<boolean> {
  const pkgPath = path.join(dirPath, 'package.json');
  try {
    const pkgRaw = await fs.readFile(pkgPath, 'utf8');
    const pkg = JSON.parse(pkgRaw);
    const deps = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
    if (typeof deps.next === 'string') {
      return true;
    }
    if (pkg.scripts && typeof pkg.scripts === 'object') {
      const scriptValues = Object.values(pkg.scripts as Record<string, unknown>);
      if (
        scriptValues.some(
          (value) =>
            typeof value === 'string' &&
            (value.includes('next dev') || value.includes('next start'))
        )
      ) {
        return true;
      }
    }
  } catch {
    // ignore
  }

  const configCandidates = [
    'next.config.js',
    'next.config.cjs',
    'next.config.mjs',
    'next.config.ts',
  ];
  for (const candidate of configCandidates) {
    if (await fileExists(path.join(dirPath, candidate))) {
      return true;
    }
  }

  const appDirCandidates = [
    'app',
    path.join('src', 'app'),
    'pages',
    path.join('src', 'pages'),
  ];
  for (const candidate of appDirCandidates) {
    if (await directoryExists(path.join(dirPath, candidate))) {
      return true;
    }
  }

  return false;
}

function isAllowedRootFile(name: string): boolean {
  if (ROOT_ALLOWED_FILES.has(name)) {
    return true;
  }
  if (name.endsWith('.md') || name.startsWith('.env.')) {
    return true;
  }
  return false;
}

function isAllowedRootDirectory(name: string): boolean {
  if (ROOT_ALLOWED_DIRS.has(name)) {
    return true;
  }
  return ROOT_ALLOWED_DIR_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function isOverwritableRootFile(name: string): boolean {
  if (ROOT_OVERWRITABLE_FILES.has(name)) {
    return true;
  }
  if (name.startsWith('.env.') || name.endsWith('.md')) {
    return true;
  }
  return false;
}

async function ensureProjectRootStructure(
  projectPath: string,
  log: (message: string) => void
): Promise<void> {
  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const hasRootPackageJson = entries.some(
    (entry) => entry.isFile() && entry.name === 'package.json'
  );
  if (hasRootPackageJson) {
    return;
  }

  const candidateDirs: { name: string; path: string }[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (entry.name === 'node_modules') {
      continue;
    }
    const dirPath = path.join(projectPath, entry.name);
    // quick skip for empty directory
    const isCandidate = await isLikelyNextProject(dirPath);
    if (isCandidate) {
      candidateDirs.push({ name: entry.name, path: dirPath });
    }
  }

  if (candidateDirs.length === 0) {
    return;
  }

  if (candidateDirs.length > 1) {
    const dirNames = candidateDirs.map((dir) => dir.name).join(', ');
    throw new Error(
      `Multiple potential Next.js projects detected in subdirectories (${dirNames}). Please move the desired project files to the project root.`
    );
  }

  const candidate = candidateDirs[0];
  const { name: nestedName, path: nestedPath } = candidate;

  for (const entry of entries) {
    if (entry.name === nestedName) {
      continue;
    }
    if (entry.isDirectory()) {
      if (!isAllowedRootDirectory(entry.name)) {
        throw new Error(
          `Cannot normalize project structure because directory "${entry.name}" exists alongside "${nestedName}". Move project files to the root manually.`
        );
      }
      continue;
    }

    if (!isAllowedRootFile(entry.name)) {
      throw new Error(
        `Cannot normalize project structure because file "${entry.name}" exists alongside "${nestedName}". Move project files to the root manually.`
      );
    }
  }

  // Remove nested node_modules and root node_modules (if any) to avoid conflicts during move.
  await fs.rm(path.join(nestedPath, 'node_modules'), { recursive: true, force: true });
  await fs.rm(path.join(projectPath, 'node_modules'), { recursive: true, force: true });

  const nestedEntries = await fs.readdir(nestedPath, { withFileTypes: true });
  for (const nestedEntry of nestedEntries) {
    const sourcePath = path.join(nestedPath, nestedEntry.name);
    const destinationPath = path.join(projectPath, nestedEntry.name);
    if (await pathExists(destinationPath)) {
      if (nestedEntry.isFile() && isOverwritableRootFile(nestedEntry.name)) {
        await fs.rm(destinationPath, { force: true });
        await fs.rename(sourcePath, destinationPath);
        log(
          `Replaced existing root file "${nestedEntry.name}" with the version from "${nestedName}".`
        );
        continue;
      }
      throw new Error(
        `Cannot move "${nestedEntry.name}" from "${nestedName}" because "${nestedEntry.name}" already exists in the project root.`
      );
    }
    await fs.rename(sourcePath, destinationPath);
  }

  await fs.rm(nestedPath, { recursive: true, force: true });
  log(
    `Detected Next.js project inside subdirectory "${nestedName}". Contents moved to the project root.`
  );
}

async function waitForPreviewReadySingle(
  url: string,
  log: (chunk: Buffer | string) => void,
  timeoutMs: number,
  initialIntervalMs: number,
  maxIntervalMs: number,
  getAbortDiagnostic?: () => PreviewEventInfo | null
): Promise<boolean> {
  const start = Date.now();
  let attempts = 0;
  let intervalMs = initialIntervalMs;

  while (Date.now() - start < timeoutMs) {
    const abortDiagnostic = getAbortDiagnostic?.();
    if (abortDiagnostic) {
      throw new PreviewDiagnosticError(abortDiagnostic);
    }

    attempts += 1;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        log(
          Buffer.from(
            `[PreviewManager] Preview server responded after ${attempts} attempt(s).`
          )
        );
        return true;
      }
      if (response.status === 405 || response.status === 501 || response.status >= 500) {
        const getResponse = await fetch(url, { method: 'GET' });
        if (getResponse.ok) {
          log(
            Buffer.from(
              `[PreviewManager] Preview server responded to GET after ${attempts} attempt(s).`
            )
          );
          return true;
        }

        const body = await getResponse.text().catch(() => '');
        const diagnostic = extractPreviewDiagnosticFromBody(body);
        if (diagnostic) {
          log(
            Buffer.from(
              `[PreviewManager] Preview probe detected ${diagnostic.category} issue: ${diagnostic.message}`
            )
          );
          throw new PreviewDiagnosticError(diagnostic);
        }
      }
    } catch (error) {
      if (error instanceof PreviewDiagnosticError) {
        throw error;
      }
      if (attempts === 1) {
        log(
          Buffer.from(
            `[PreviewManager] Waiting for preview server at ${url} (${error instanceof Error ? error.message : String(error)
            }).`
          )
        );
      }
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    intervalMs = Math.min(intervalMs * 2, maxIntervalMs);
  }

  return false;
}

async function waitForPreviewReady(
  url: string,
  log: (chunk: Buffer | string) => void,
  timeoutMs = PREVIEW_CONFIG.STARTUP_TIMEOUT,
  maxRetries = PREVIEW_CONFIG.READY_MAX_RETRIES,
  getAbortDiagnostic?: () => PreviewEventInfo | null
) {
  const totalAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    const ready = await waitForPreviewReadySingle(
      url,
      log,
      timeoutMs,
      PREVIEW_CONFIG.READY_INITIAL_POLL_MS,
      PREVIEW_CONFIG.READY_MAX_POLL_MS,
      getAbortDiagnostic
    );

    if (ready) {
      return;
    }

    if (attempt < totalAttempts) {
      console.warn(
        `[PreviewManager] Preview server at ${url} timed out after ${timeoutMs}ms (attempt ${attempt}/${totalAttempts}). Retrying...`
      );
      log(
        Buffer.from(
          `[PreviewManager] Timeout on attempt ${attempt}/${totalAttempts}. Retrying...`
        )
      );
    }
  }

  console.error(
    `[PreviewManager] Preview server at ${url} failed to respond after ${totalAttempts} attempt(s) (${timeoutMs}ms each). Giving up.`
  );
  throw new Error(
    `Preview server at ${url} did not become ready after ${totalAttempts} attempts (${timeoutMs}ms timeout each)`
  );
}

async function appendCommandLogs(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  logger: (chunk: Buffer | string) => void
) {
  const useShell = shouldUseCommandShell(command);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: useShell,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    child.stdout?.on('data', logger);
    child.stderr?.on('data', logger);

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`${command} ${args.join(' ')} exited with code ${code}`)
        );
      }
    });
  });
}

async function ensureDependencies(
  projectPath: string,
  env: NodeJS.ProcessEnv,
  logger: (chunk: Buffer | string) => void
) {
  try {
    await fs.access(path.join(projectPath, 'node_modules'));
    return;
  } catch {
    // node_modules missing, fall back to npm install
  }

  await runInstallWithPreferredManager(projectPath, env, logger);
}

async function captureCommandOutput(
  command: string,
  args: string[]
): Promise<string> {
  const useShell = shouldUseCommandShell(command);
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: useShell,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0 || (process.platform === 'win32' && !stdout.trim())) {
        resolve(stdout);
        return;
      }

      reject(
        new Error(
          stderr.trim() || `${command} ${args.join(' ')} exited with code ${code}`
        )
      );
    });
  });
}

async function getListeningProcessIdsForPort(port: number): Promise<number[]> {
  if (!Number.isInteger(port) || port <= 0) {
    return [];
  }

  try {
    const output =
      process.platform === 'win32'
        ? await captureCommandOutput('powershell.exe', [
            '-NoProfile',
            '-Command',
            `$pids = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($pids) { $pids -join ',' }`,
          ])
        : await captureCommandOutput('lsof', [
            '-ti',
            `tcp:${port}`,
            '-sTCP:LISTEN',
          ]);

    return output
      .split(/[,\r\n]+/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);
  } catch (error) {
    console.warn(
      `[PreviewManager] Failed to inspect port ${port}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return [];
  }
}

async function terminateProcessById(pid: number): Promise<void> {
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  if (process.platform === 'win32') {
    await captureCommandOutput('powershell.exe', [
      '-NoProfile',
      '-Command',
      `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`,
    ]);
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== 'ESRCH') {
      throw error;
    }
  }
}

async function terminateProcessesListeningOnPort(port: number): Promise<void> {
  const processIds = await getListeningProcessIdsForPort(port);
  for (const pid of processIds) {
    // eslint-disable-next-line no-await-in-loop
    await terminateProcessById(pid);
  }
}

export interface PreviewInfo {
  port: number | null;
  url: string | null;
  status: PreviewStatus;
  logs: string[];
  pid?: number;
  latestDiagnostic?: PreviewEventInfo | null;
}

class PreviewManager {
  private processes = new Map<string, PreviewProcess>();
  private retainedStates = new Map<string, RetainedPreviewState>();
  private installing = new Map<string, Promise<void>>();
  private starting = new Map<string, Promise<PreviewInfo>>();
  private recovering = new Map<string, Promise<void>>();
  private restartBudgets = new Map<string, { count: number; windowStart: number }>();
  private circuitBreaker = new Map<string, { attempts: number; windowStart: number }>();

  private isSameDiagnostic(
    left: PreviewEventInfo | null | undefined,
    right: PreviewEventInfo | null | undefined
  ): boolean {
    if (!left || !right) {
      return false;
    }
    return (
      left.category === right.category &&
      left.message === right.message &&
      left.detail === right.detail &&
      left.severity === right.severity
    );
  }

  private canAutoRestart(projectId: string): boolean {
    const MAX_RESTARTS = 2;
    const WINDOW_MS = 60_000;

    const budget = this.restartBudgets.get(projectId);
    const now = Date.now();

    if (!budget || now - budget.windowStart > WINDOW_MS) {
      this.restartBudgets.set(projectId, { count: 1, windowStart: now });
      return true;
    }

    if (budget.count < MAX_RESTARTS) {
      budget.count += 1;
      return true;
    }

    return false;
  }

  private isCircuitBreakerOpen(projectId: string): boolean {
    const state = this.circuitBreaker.get(projectId);
    if (!state) {
      return false;
    }
    if (Date.now() - state.windowStart > CIRCUIT_BREAKER_WINDOW_MS) {
      return false;
    }
    return state.attempts > CIRCUIT_BREAKER_MAX_ATTEMPTS;
  }

  private recordCircuitBreakerAttempt(projectId: string): void {
    const now = Date.now();
    const state = this.circuitBreaker.get(projectId);
    if (!state || now - state.windowStart > CIRCUIT_BREAKER_WINDOW_MS) {
      this.circuitBreaker.set(projectId, { attempts: 1, windowStart: now });
      return;
    }
    state.attempts += 1;
  }

  private maybePublishRuntimeDiagnostic(
    projectId: string,
    processInfo: PreviewProcess,
    lines: string[]
  ): void {
    if (processInfo.stage !== 'running' && processInfo.status !== 'running') {
      return;
    }

    const extracted = extractRuntimeErrorFromLines(lines);
    if (!extracted) {
      return;
    }

    const diagnostic = createPreviewDiagnostic(
      'runtime-error',
      'error',
      extracted.message,
      extracted.detail
    );

    if (this.isSameDiagnostic(processInfo.latestDiagnostic, diagnostic)) {
      return;
    }

    this.publishPreviewEvent(projectId, 'preview_error', diagnostic, processInfo);
  }

  private maybeRecoverRuntimeBuildError(
    projectId: string,
    processInfo: PreviewProcess,
    lines: string[]
  ): void {
    if (processInfo.stage !== 'running') {
      return;
    }
    if (processInfo.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return;
    }
    if (this.recovering.has(projectId)) {
      return;
    }

    if (this.isCircuitBreakerOpen(projectId)) {
      console.log(`[PreviewManager:Recovery] Circuit breaker open for ${projectId} — skipping runtime recovery`);
      const diagnostic = createPreviewDiagnostic(
        'runtime-error',
        'error',
        'Too many recovery attempts. Manual intervention needed.',
        'Recovery circuit breaker triggered — automatic recovery disabled for 5 minutes'
      );
      this.publishPreviewEvent(projectId, 'preview_error', diagnostic, processInfo);
      return;
    }

    const buildError = extractBuildErrorFromLines(processInfo.logs.slice(-80));
    if (!buildError) {
      return;
    }

    const fix = detectDeterministicFix(processInfo.logs);
    if (!fix) {
      console.log('[PreviewManager:Recovery] Runtime build error detected but no deterministic fix available');
      const diagnostic = createPreviewDiagnostic('runtime-error', 'error', buildError.message, buildError.detail);
      if (!this.isSameDiagnostic(processInfo.latestDiagnostic, diagnostic)) {
        this.publishPreviewEvent(projectId, 'preview_error', diagnostic, processInfo);
      }
      return;
    }

    console.log('[PreviewManager:Recovery] Runtime build error detected, fix selected:', fix.kind, fix.reason);
    this.recordCircuitBreakerAttempt(projectId);
    processInfo.recoveryAttempts++;
    processInfo.lastRecoveryAt = Date.now();

    const diagnostic = createPreviewDiagnostic('runtime-error', 'error', buildError.message, buildError.detail);
    if (!this.isSameDiagnostic(processInfo.latestDiagnostic, diagnostic)) {
      this.publishPreviewEvent(projectId, 'preview_error', diagnostic, processInfo);
    }

    appendLinesWithLimit(processInfo.logs, [
      '[PreviewManager] Triggering runtime recovery: ' + fix.reason,
    ]);
    this.captureRetainedState(projectId, processInfo);

    const recoveryPromise = (async () => {
      try {
        processInfo.isStopping = true;
        try {
          processInfo.process?.kill('SIGTERM');
        } catch {
          // Ignore kill failures
        }
        await terminateProcessesListeningOnPort(processInfo.port);
        this.processes.delete(projectId);

        const project = await getProjectById(projectId);
        if (!project) {
          console.error('[PreviewManager:Recovery] Project not found during runtime recovery');
          return;
        }
        const retainedState = this.retainedStates.get(projectId);
        if (!retainedState) {
          console.error('[PreviewManager:Recovery] No retained state for runtime recovery');
          return;
        }
        await this.applyDeterministicFix(projectId, project, fix, retainedState);

        console.log('[PreviewManager:Recovery] Runtime recovery applied, restarting preview');
        await this._doStart(projectId, project);
      } catch (error) {
        console.error(
          '[PreviewManager:Recovery] Runtime recovery failed:',
          error instanceof Error ? error.message : String(error)
        );
        const failDiagnostic = createPreviewDiagnostic(
          'runtime-error',
          'error',
          'Automatic recovery failed. Manual intervention may be needed.',
          error instanceof Error ? error.message : String(error)
        );
        this.publishPreviewEvent(projectId, 'preview_error', failDiagnostic);
      } finally {
        this.recovering.delete(projectId);
      }
    })();
    this.recovering.set(projectId, recoveryPromise);
  }

  private maybeHandleStartupBuildFailure(
    projectId: string,
    processInfo: PreviewProcess,
    lines: string[]
  ): void {
    if (processInfo.stage !== 'startup' || processInfo.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return;
    }

    if (this.isCircuitBreakerOpen(projectId)) {
      console.log(`[PreviewManager:Recovery] Circuit breaker open for ${projectId} — skipping startup recovery`);
      return;
    }

    const buildError = extractBuildErrorFromLines(processInfo.logs.slice(-80));
    if (!buildError) {
      return;
    }

    const diagnostic = createPreviewDiagnostic('build', 'error', buildError.message, buildError.detail);
    if (!this.isSameDiagnostic(processInfo.latestDiagnostic, diagnostic)) {
      this.publishPreviewEvent(projectId, 'preview_error', diagnostic, processInfo);
    }
    this.captureRetainedState(projectId, processInfo);

    const fix = detectDeterministicFix(processInfo.logs);
    if (!fix) {
      console.log('[PreviewManager:Recovery] Startup build error detected but no deterministic fix available');
      return;
    }

    console.log('[PreviewManager:Recovery] Startup build error detected, fix selected:', fix.kind, fix.reason);
    this.recordCircuitBreakerAttempt(projectId);
    processInfo.recoveryAttempts++;
    processInfo.lastRecoveryAt = Date.now();
    processInfo.status = 'error';
    processInfo.isStopping = true;
    appendLinesWithLimit(processInfo.logs, [
      `[PreviewManager] Triggering deterministic recovery: ${fix.reason}`,
    ]);
    this.captureRetainedState(projectId, processInfo);

    void (async () => {
      try {
        processInfo.process?.kill('SIGTERM');
      } catch {
        // Ignore kill failures; waitForPreviewReady will still time out if needed.
      }

      try {
        await terminateProcessesListeningOnPort(processInfo.port);
      } catch (error) {
        console.warn(
          `[PreviewManager] Failed to terminate preview port ${processInfo.port} during recovery: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    })();
  }

  private getLogger(projectId: string, processInfo: PreviewProcess) {
    return (chunk: Buffer | string) => {
      const lines = splitLogLines(chunk);
      appendLinesWithLimit(processInfo.logs, lines);
      this.maybeHandleStartupBuildFailure(projectId, processInfo, lines);
      this.maybePublishRuntimeDiagnostic(projectId, processInfo, lines);
      this.maybeRecoverRuntimeBuildError(projectId, processInfo, lines);

      // Reset recovery budget after stable running period
      if (
        processInfo.stage === 'running' &&
        processInfo.recoveryAttempts > 0 &&
        processInfo.lastRecoveryAt !== null &&
        Date.now() - processInfo.lastRecoveryAt > RECOVERY_SUCCESS_RESET_MS
      ) {
        processInfo.recoveryAttempts = 0;
        processInfo.lastRecoveryAt = null;
      }
    };
  }

  private setRetainedState(projectId: string, state: RetainedPreviewState): void {
    this.retainedStates.set(projectId, {
      ...state,
      logs: state.logs.slice(-LOG_LIMIT),
      latestDiagnostic: state.latestDiagnostic ?? null,
      pid: state.pid ?? null,
    });
  }

  private clearRetainedState(projectId: string): void {
    this.retainedStates.delete(projectId);
  }

  private captureRetainedState(projectId: string, processInfo: PreviewProcess): void {
    this.setRetainedState(projectId, {
      port: processInfo.port,
      url: processInfo.url,
      status: processInfo.status,
      logs: [...processInfo.logs],
      latestDiagnostic: processInfo.latestDiagnostic,
      pid: processInfo.process?.pid ?? null,
    });
  }

  private getRetainedLogger(projectId: string) {
    return (chunk: Buffer | string) => {
      const existing = this.retainedStates.get(projectId) ?? {
        port: null,
        url: null,
        status: 'error' as PreviewStatus,
        logs: [],
        latestDiagnostic: null,
        pid: null,
      };
      const nextLogs = [...existing.logs];
      appendLinesWithLimit(nextLogs, splitLogLines(chunk));
      this.setRetainedState(projectId, {
        ...existing,
        logs: nextLogs,
      });
    };
  }

  private publishPreviewEvent(
    projectId: string,
    eventType: 'preview_error' | 'preview_success',
    diagnostic: PreviewEventInfo,
    processInfo?: PreviewProcess | null
  ): void {
    if (processInfo) {
      processInfo.latestDiagnostic = diagnostic;
    } else {
      const existing = this.retainedStates.get(projectId);
      if (existing) {
        this.setRetainedState(projectId, {
          ...existing,
          latestDiagnostic: diagnostic,
        });
      }
    }

    streamManager.publish(projectId, {
      type: eventType,
      data: diagnostic,
    });
  }

  private async cleanupFailedProcess(projectId: string): Promise<void> {
    const processInfo = this.processes.get(projectId);
    if (!processInfo) {
      return;
    }

    processInfo.isStopping = true;

    try {
      processInfo.process?.kill('SIGTERM');
    } catch {
      // Ignore cleanup kill failures.
    }

    await terminateProcessesListeningOnPort(processInfo.port);
    this.processes.delete(projectId);
  }

  private async applyDeterministicFix(
    projectId: string,
    project: Project,
    fix: DeterministicFix,
    retainedState: RetainedPreviewState
  ): Promise<void> {
    console.log('[PreviewManager:Recovery] Applying fix:', fix.kind, 'for project', projectId);
    const projectPath = resolveProjectPath(project, projectId);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'development',
      ...(retainedState.port ? { PORT: String(retainedState.port), WEB_PORT: String(retainedState.port) } : {}),
      ...(retainedState.url ? { NEXT_PUBLIC_APP_URL: retainedState.url } : {}),
    };
    const logger = this.getRetainedLogger(projectId);

    let message: string;

    switch (fix.kind) {
      case 'install-packages':
        await installPackagesWithPreferredManager(projectPath, env, fix.packages, logger);
        message = `Applied deterministic fix and installed ${fix.packages.join(', ')}. Retrying preview startup.`;
        break;
      case 'reinstall-dependencies':
        await runInstallWithPreferredManager(projectPath, env, logger);
        message = 'Applied deterministic fix and reinstalled dependencies. Retrying preview startup.';
        break;
      case 'kill-port-and-retry':
        await terminateProcessesListeningOnPort(fix.port);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        message = `Killed processes on port ${fix.port}. Retrying preview startup.`;
        break;
      case 'restart-process':
        message = 'Restarting preview process. Retrying preview startup.';
        break;
      case 'clear-cache-and-retry':
        await fs.rm(path.join(projectPath, '.next'), { recursive: true, force: true });
        message = 'Cleared .next cache directory. Retrying preview startup.';
        break;
    }

    const diagnostic = createPreviewDiagnostic('build', 'warning', message, fix.reason);
    this.publishPreviewEvent(projectId, 'preview_success', diagnostic);
  }

  private async maybeRecoverFromFailure(
    projectId: string,
    project: Project,
    caughtError?: unknown
  ): Promise<boolean> {
    const retainedState = this.retainedStates.get(projectId);
    if (!retainedState) {
      return false;
    }

    const fix =
      detectDeterministicFix(retainedState.logs) ??
      extractDeterministicFixFromDiagnostic(caughtError);
    if (!fix) {
      console.log('[PreviewManager:Recovery] Post-failure recovery attempted but no fix found');
      return false;
    }

    console.log('[PreviewManager:Recovery] Post-failure recovery, fix selected:', fix.kind, fix.reason);
    await this.cleanupFailedProcess(projectId);
    await this.applyDeterministicFix(projectId, project, fix, retainedState);
    return true;
  }

  public async installDependencies(
    projectId: string,
    options?: { force?: boolean }
  ): Promise<{ logs: string[] }> {
    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const projectPath = project.repoPath
      ? path.resolve(project.repoPath)
      : path.join(process.cwd(), 'projects', projectId);

    await fs.mkdir(projectPath, { recursive: true });

    const logs: string[] = [];
    const record = (message: string) => {
      const formatted = `[PreviewManager] ${message}`;
      console.log(formatted);
      logs.push(formatted);
    };
    const forceInstall = options?.force === true;

    await ensureProjectRootStructure(projectPath, record);

    try {
      await fs.access(path.join(projectPath, 'package.json'));
    } catch {
      record(`Bootstrapping minimal Next.js app for project ${projectId}`);
      await scaffoldBasicNextApp(projectPath, projectId);
    }

    const hadNodeModules = await directoryExists(path.join(projectPath, 'node_modules'));
    if (forceInstall) {
      record('Dependency manifest changed. Reinstalling dependencies.');
    }

    const collectFromChunk = (chunk: Buffer | string) => {
      chunk
        .toString()
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .forEach((line) => record(line));
    };

    // Use a per-project lock to avoid concurrent install commands
    const runInstall = async () => {
      const installPromise = (async () => {
        try {
          const hasNodeModules = await directoryExists(path.join(projectPath, 'node_modules'));
          if (forceInstall || !hasNodeModules) {
            await runInstallWithPreferredManager(
              projectPath,
              { ...process.env },
              collectFromChunk
            );
          }
        } finally {
          this.installing.delete(projectId);
        }
      })();
      this.installing.set(projectId, installPromise);
      await installPromise;
    };

    // If an install is already in progress, wait for it; otherwise start one
    const existing = this.installing.get(projectId);
    if (existing) {
      record('Dependency installation already in progress; waiting for completion.');
      await existing;
    } else {
      await runInstall();
    }

    if (forceInstall) {
      record('Dependency reinstallation completed.');
    } else if (hadNodeModules) {
      record('Dependencies already installed. Skipped install command.');
    } else {
      record('Dependency installation completed.');
    }

    return { logs };
  }

  public async start(projectId: string): Promise<PreviewInfo> {
    // Fast path: already running
    const existing = this.processes.get(projectId);
    if (existing && existing.status !== 'error') {
      return this.toInfo(existing);
    }

    // If a start is already in progress for this project, wait for it
    const pendingStart = this.starting.get(projectId);
    if (pendingStart) {
      return pendingStart;
    }

    const project = await getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const recoveredPreview = await this.recoverPersistedPreview(projectId, project);
    if (recoveredPreview) {
      return recoveredPreview;
    }

    this.clearRetainedState(projectId);

    const startPromise = (async () => {
      try {
        return await this._doStart(projectId, project);
      } catch (error) {
        const recovered = await this.maybeRecoverFromFailure(projectId, project, error);
        if (!recovered) {
          throw error;
        }
        return this._doStart(projectId, project);
      } finally {
        this.starting.delete(projectId);
      }
    })();
    this.starting.set(projectId, startPromise);
    return startPromise;
  }

  private async recoverPersistedPreview(
    projectId: string,
    project: Project
  ): Promise<PreviewInfo | null> {
    if (!project.previewUrl || !project.previewPort) {
      return null;
    }

    const recoveredProcess: PreviewProcess = {
      process: null,
      port: project.previewPort,
      url: project.previewUrl,
      status: 'starting',
      logs: [],
      startedAt: new Date(),
      latestDiagnostic: null,
      stage: 'startup',
      isStopping: false,
      recoveryAttempts: 0,
      lastRecoveryAt: null,
    };
    const log = this.getLogger(projectId, recoveredProcess);
    log(
      Buffer.from(
        '[PreviewManager] Found persisted preview metadata. Checking if the preview is still reachable.'
      )
    );

    const reachable = await waitForPreviewReadySingle(
      recoveredProcess.url,
      log,
      2_000,
      150,
      500
    );

    if (!reachable) {
      log(
        Buffer.from(
          '[PreviewManager] Persisted preview was unreachable. Clearing stale preview metadata.'
        )
      );
      await updateProject(projectId, {
        previewUrl: null,
        previewPort: null,
      });
      await updateProjectStatus(projectId, 'idle');
      return null;
    }

    recoveredProcess.status = 'running';
    recoveredProcess.stage = 'running';
    this.processes.set(projectId, recoveredProcess);
    await updateProjectStatus(projectId, 'running');
    log(
      Buffer.from(
        '[PreviewManager] Recovered preview from persisted metadata after app restart.'
      )
    );
    this.publishPreviewEvent(
      projectId,
      'preview_success',
      createPreviewDiagnostic('ready', 'info', 'Recovered preview from persisted metadata.', recoveredProcess.url),
      recoveredProcess
    );
    return this.toInfo(recoveredProcess);
  }

  private async _doStart(projectId: string, project?: Project): Promise<PreviewInfo> {
    // Re-check after acquiring the lock (another concurrent call may have started it)
    const existing = this.processes.get(projectId);
    if (existing && existing.status !== 'error') {
      return this.toInfo(existing);
    }

    // Clean up stale/errored process before starting fresh
    if (existing && existing.status === 'error') {
      try {
        existing.process?.kill('SIGTERM');
      } catch {
        // Process may already be dead
      }
      this.processes.delete(projectId);
    }

    const resolvedProject = project ?? await getProjectById(projectId);
    if (!resolvedProject) {
      throw new Error('Project not found');
    }

    const projectPath = resolveProjectPath(resolvedProject, projectId);

    await fs.mkdir(projectPath, { recursive: true });

    const pendingLogs: string[] = [];
    const queueLog = (message: string) => {
      const formatted = `[PreviewManager] ${message}`;
      console.log(formatted);
      pendingLogs.push(formatted);
    };

    await ensureProjectRootStructure(projectPath, queueLog);

    try {
      await fs.access(path.join(projectPath, 'package.json'));
    } catch {
      console.log(
        `[PreviewManager] Bootstrapping minimal Next.js app for project ${projectId}`
      );
      await scaffoldBasicNextApp(projectPath, projectId);
    }

    const previewBounds = resolvePreviewBounds();
    const preferredPort = await findAvailablePort(
      previewBounds.start,
      previewBounds.end
    );

    const initialUrl = `http://localhost:${preferredPort}`;

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(preferredPort),
      WEB_PORT: String(preferredPort),
      NEXT_PUBLIC_APP_URL: initialUrl,
    };

    const previewProcess: PreviewProcess = {
      process: null,
      port: preferredPort,
      url: initialUrl,
      status: 'starting',
      logs: [],
      startedAt: new Date(),
      latestDiagnostic: null,
      stage: 'dependency-install',
      isStopping: false,
      recoveryAttempts: 0,
      lastRecoveryAt: null,
    };

    const log = this.getLogger(projectId, previewProcess);
    const flushPendingLogs = () => {
      if (pendingLogs.length === 0) {
        return;
      }
      const entries = pendingLogs.splice(0);
      entries.forEach((entry) => log(Buffer.from(entry)));
    };
    flushPendingLogs();

    // Ensure dependencies with the same per-project lock used by installDependencies
    const ensureWithLock = async () => {
      // If node_modules exists, skip
      if (await directoryExists(path.join(projectPath, 'node_modules'))) {
        return;
      }
      const existing = this.installing.get(projectId);
      if (existing) {
        log(Buffer.from('[PreviewManager] Dependency installation already in progress; waiting...'));
        await existing;
        return;
      }
      const installPromise = (async () => {
        try {
          // Double-check just before install
          if (!(await directoryExists(path.join(projectPath, 'node_modules')))) {
            await runInstallWithPreferredManager(projectPath, env, log);
          }
        } finally {
          this.installing.delete(projectId);
        }
      })();
      this.installing.set(projectId, installPromise);
      await installPromise;
    };

    // Dependency install with retry for transient failures
    previewProcess.stage = 'dependency-install';
    let lastInstallError: unknown = null;
    let installAttempt = 0;
    const maxInstallAttempts = 1 + INSTALL_RETRY_DELAYS.length; // 1 initial + 2 retries

    while (installAttempt < maxInstallAttempts) {
      try {
        await ensureWithLock();
        lastInstallError = null;
        break;
      } catch (error) {
        lastInstallError = error;
        installAttempt++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const classification = classifyInstallFailure(errorMessage);

        // On integrity/corrupted lockfile errors: clean and retry
        if (
          (classification.cause === 'integrity-error' || classification.cause === 'corrupted-lockfile') &&
          installAttempt < maxInstallAttempts
        ) {
          appendLinesWithLimit(previewProcess.logs, [
            `[PreviewManager] ${classification.message} Cleaning cache and retrying (attempt ${installAttempt + 1}/${maxInstallAttempts})...`,
          ]);
          try {
            const lockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
            for (const lockfile of lockfiles) {
              try {
                await fs.unlink(path.join(projectPath, lockfile));
              } catch {
                // Lockfile may not exist
              }
            }
            await fs.rm(path.join(projectPath, 'node_modules'), { recursive: true, force: true });
          } catch {
            // Best-effort cleanup
          }
          await new Promise((resolve) => setTimeout(resolve, INSTALL_RETRY_DELAYS[installAttempt - 1] ?? 3000));
          continue;
        }

        // On transient errors (network timeout): retry after delay
        if (classification.transient && installAttempt < maxInstallAttempts) {
          appendLinesWithLimit(previewProcess.logs, [
            `[PreviewManager] ${classification.message} Retrying (attempt ${installAttempt + 1}/${maxInstallAttempts})...`,
          ]);
          await new Promise((resolve) => setTimeout(resolve, INSTALL_RETRY_DELAYS[installAttempt - 1] ?? 3000));
          continue;
        }

        // Permanent failure: don't retry
        previewProcess.status = 'error';
        const diagnostic = createPreviewDiagnostic(
          'dependency-install',
          'error',
          classification.message,
          errorMessage
        );
        this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
        this.captureRetainedState(projectId, previewProcess);
        throw error;
      }
    }

    // If we exhausted retries
    if (lastInstallError) {
      previewProcess.status = 'error';
      const errorMessage = lastInstallError instanceof Error ? lastInstallError.message : String(lastInstallError);
      const classification = classifyInstallFailure(errorMessage);
      const diagnostic = createPreviewDiagnostic(
        'dependency-install',
        'error',
        `${classification.message} (failed after ${maxInstallAttempts} attempts)`,
        errorMessage
      );
      this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
      this.captureRetainedState(projectId, previewProcess);
      throw lastInstallError;
    }

    const packageJson = await readPackageJson(projectPath);
    const hasPredev = Boolean(packageJson?.scripts?.predev);

    if (hasPredev) {
      try {
        previewProcess.stage = 'build';
        await appendCommandLogs(npmCommand, ['run', 'predev'], projectPath, env, log);
      } catch (error) {
        previewProcess.status = 'error';
        const diagnostic = createPreviewDiagnostic(
          'build',
          'error',
          'Project pre-build step failed before preview startup.',
          error instanceof Error ? error.message : String(error)
        );
        this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
        this.captureRetainedState(projectId, previewProcess);
        throw error;
      }
    }

    const overrides = await collectEnvOverrides(projectPath);

    if (overrides.port) {
      if (
        overrides.port < previewBounds.start ||
        overrides.port > previewBounds.end
      ) {
        queueLog(
          `Ignoring project-specified port ${overrides.port} because it falls outside the allowed preview range ${previewBounds.start}-${previewBounds.end}.`
        );
        delete overrides.port;
      }
    }

    if (overrides.url) {
      try {
        const parsed = new URL(overrides.url);
        if (parsed.port) {
          const parsedPort = parsePort(parsed.port);
          if (
            parsedPort &&
            (parsedPort < previewBounds.start ||
              parsedPort > previewBounds.end)
          ) {
            queueLog(
              `Ignoring project-specified NEXT_PUBLIC_APP_URL (${overrides.url}) because port ${parsed.port} is outside the allowed preview range ${previewBounds.start}-${previewBounds.end}.`
            );
            delete overrides.url;
          }
        }
      } catch {
        queueLog(
          `Ignoring project-specified NEXT_PUBLIC_APP_URL (${overrides.url}) because it could not be parsed as a valid URL.`
        );
        delete overrides.url;
      }
    }

    flushPendingLogs();

    if (overrides.port && overrides.port !== previewProcess.port) {
      previewProcess.port = overrides.port;
      env.PORT = String(overrides.port);
      env.WEB_PORT = String(overrides.port);
      log(
        Buffer.from(
          `[PreviewManager] Detected project-specified port ${overrides.port}.`
        )
      );
    }

    const effectivePort = previewProcess.port;
    let resolvedUrl: string = `http://localhost:${effectivePort}`;
    if (typeof overrides.url === 'string' && overrides.url.trim().length > 0) {
      resolvedUrl = overrides.url.trim();
    }

    env.NEXT_PUBLIC_APP_URL = resolvedUrl;
    previewProcess.url = resolvedUrl;

    const runDevScriptPath = path.join(projectPath, 'scripts', 'run-dev.js');
    const nextCliPath = path.join(projectPath, 'node_modules', 'next', 'dist', 'bin', 'next');
    const hasRunDevScript = await fileExists(runDevScriptPath);
    const hasNextCli = hasRunDevScript ? false : await fileExists(nextCliPath);

    const spawnOptions: SpawnOptions = {
      cwd: projectPath,
      env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    };

    const child: ChildProcess = hasRunDevScript
      ? spawn(process.execPath, [runDevScriptPath], spawnOptions)
      : hasNextCli
        ? spawn(process.execPath, [nextCliPath, 'dev'], spawnOptions)
        : spawn(npmCommand, ['run', 'dev'], {
            ...spawnOptions,
            shell: process.platform === 'win32',
          });

    previewProcess.process = child;
    previewProcess.stage = 'startup';
    this.processes.set(projectId, previewProcess);

    child.stdout?.on('data', (chunk: Buffer | string) => {
      log(chunk);
      if (previewProcess.status === 'starting') {
        previewProcess.status = 'running';
      }
    });

    child.stderr?.on('data', (chunk: Buffer | string) => {
      log(chunk);
    });

    child.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      const exitedWhileStopping = previewProcess.isStopping || signal === 'SIGTERM';
      previewProcess.status = exitedWhileStopping || code === 0 ? 'stopped' : 'error';
      this.processes.delete(projectId);
      updateProject(projectId, {
        previewUrl: null,
        previewPort: null,
      }).catch((error) => {
        console.error('[PreviewManager] Failed to reset project preview:', error);
      });
      updateProjectStatus(projectId, 'idle').catch((error) => {
        console.error('[PreviewManager] Failed to reset project status:', error);
      });
      log(
        Buffer.from(
          `Preview process exited (code: ${code ?? 'null'}, signal: ${
            signal ?? 'null'
          })`
        )
      );

      if (previewProcess.status === 'error') {
        const exitInfo = classifyExitCode(code, signal);
        const category: PreviewDiagnosticCategory =
          previewProcess.stage === 'running' ? 'runtime-exit' : previewProcess.stage;
        const diagnostic = createPreviewDiagnostic(
          category,
          'error',
          exitInfo.message,
          `Exit code: ${code ?? 'null'}, signal: ${signal ?? 'null'}, cause: ${exitInfo.cause}, recoverable: ${exitInfo.recoverable}`
        );
        this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
        this.captureRetainedState(projectId, previewProcess);

        // Auto-restart if the crash happened during runtime and is recoverable
        if (previewProcess.stage === 'running' && exitInfo.recoverable) {
          if (this.isCircuitBreakerOpen(projectId)) {
            console.log(`[PreviewManager:Recovery] Circuit breaker open for ${projectId} — skipping auto-restart`);
            const cbDiagnostic = createPreviewDiagnostic(
              'runtime-exit',
              'error',
              'Too many recovery attempts. Manual intervention needed.',
              'Recovery circuit breaker triggered — automatic recovery disabled for 5 minutes'
            );
            this.publishPreviewEvent(projectId, 'preview_error', cbDiagnostic);
          } else if (this.canAutoRestart(projectId)) {
            this.recordCircuitBreakerAttempt(projectId);
            console.log(`[PreviewManager:Recovery] Auto-restarting crashed preview process for ${projectId} after 2s delay`);
            appendLinesWithLimit(previewProcess.logs, [
              '[PreviewManager] Auto-restarting crashed preview process after 2s delay',
            ]);
            setTimeout(() => {
              this.start(projectId).catch((restartError) => {
                console.error(
                  '[PreviewManager:Recovery] Auto-restart failed:',
                  restartError instanceof Error ? restartError.message : String(restartError)
                );
              });
            }, 2000);
          } else {
            console.log('[PreviewManager:Recovery] Restart budget exhausted for', projectId, '— not auto-restarting');
            const budgetDiagnostic = createPreviewDiagnostic(
              'runtime-exit',
              'error',
              'Preview crashed repeatedly. Automatic restart disabled to prevent loops. Please restart manually.',
              `${exitInfo.message} (restart budget exhausted)`
            );
            this.publishPreviewEvent(projectId, 'preview_error', budgetDiagnostic);
          }
        }

        return;
      }

      if (!exitedWhileStopping) {
        this.clearRetainedState(projectId);
      }
    });

    child.on('error', (error: Error) => {
      previewProcess.status = 'error';
      log(Buffer.from(`Preview process failed: ${error.message}`));
      if (previewProcess.latestDiagnostic) {
        return;
      }

      // Check if this is a port conflict error
      const errorText = error.message.toLowerCase();
      const isPortConflict = errorText.includes('eaddrinuse') || errorText.includes('address already in use');

      const message = isPortConflict
        ? `Port ${previewProcess.port} is already in use by another process.`
        : 'Preview process crashed during startup.';

      const diagnostic = createPreviewDiagnostic(
        previewProcess.stage === 'running' ? 'runtime-exit' : previewProcess.stage,
        'error',
        message,
        error.message
      );
      this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
      this.captureRetainedState(projectId, previewProcess);
    });

    try {
      await waitForPreviewReady(
        previewProcess.url,
        log,
        PREVIEW_CONFIG.STARTUP_TIMEOUT,
        PREVIEW_CONFIG.READY_MAX_RETRIES,
        () => (previewProcess.status === 'error' ? previewProcess.latestDiagnostic : null)
      );
    } catch (error) {
      previewProcess.status = 'error';
      log(
        Buffer.from(
          `[PreviewManager] ${error instanceof Error ? error.message : String(error)}`
        )
      );
      if (!previewProcess.latestDiagnostic) {
        const diagnostic =
          error instanceof PreviewDiagnosticError
            ? error.diagnostic
            : createPreviewDiagnostic(
                'startup',
                'error',
                'Preview did not become reachable.',
                error instanceof Error ? error.message : String(error)
              );
        this.publishPreviewEvent(projectId, 'preview_error', diagnostic, previewProcess);
        this.captureRetainedState(projectId, previewProcess);
      }
      throw error;
    }

    previewProcess.stage = 'running';

    await updateProject(projectId, {
      previewUrl: previewProcess.url,
      previewPort: previewProcess.port,
      status: 'running',
    });

    this.publishPreviewEvent(
      projectId,
      'preview_success',
      createPreviewDiagnostic('ready', 'info', 'Preview is ready.', previewProcess.url),
      previewProcess
    );
    this.clearRetainedState(projectId);

    return this.toInfo(previewProcess);
  }

  public async stop(projectId: string): Promise<PreviewInfo> {
    const processInfo = this.processes.get(projectId);
    const project = await getProjectById(projectId);
    const previewPort = processInfo?.port ?? project?.previewPort ?? null;
    this.clearRetainedState(projectId);

    if (!processInfo) {
      if (previewPort) {
        try {
          await terminateProcessesListeningOnPort(previewPort);
        } catch (error) {
          console.error('[PreviewManager] Failed to stop persisted preview process:', error);
        }
      }
      if (project) {
        await updateProject(projectId, {
          previewUrl: null,
          previewPort: null,
        });
        await updateProjectStatus(projectId, 'idle');
      }
      return {
        port: null,
        url: null,
        status: 'stopped',
        logs: [],
        latestDiagnostic: null,
      };
    }

    processInfo.isStopping = true;

    try {
      processInfo.process?.kill('SIGTERM');
    } catch (error) {
      console.error('[PreviewManager] Failed to stop preview process:', error);
    }

    if (previewPort) {
      try {
        await terminateProcessesListeningOnPort(previewPort);
      } catch (error) {
        console.error('[PreviewManager] Failed to stop preview process by port:', error);
      }
    }

    this.processes.delete(projectId);
    await updateProject(projectId, {
      previewUrl: null,
      previewPort: null,
    });
    await updateProjectStatus(projectId, 'idle');

    return {
      port: null,
      url: null,
      status: 'stopped',
      logs: processInfo.logs,
      latestDiagnostic: null,
    };
  }

  public getStatus(projectId: string): PreviewInfo {
    const processInfo = this.processes.get(projectId);
    if (!processInfo) {
      const retainedState = this.retainedStates.get(projectId);
      if (retainedState) {
        return {
          port: retainedState.port,
          url: retainedState.url,
          status: retainedState.status,
          logs: [...retainedState.logs],
          pid: retainedState.pid ?? undefined,
          latestDiagnostic: retainedState.latestDiagnostic,
        };
      }
      return {
        port: null,
        url: null,
        status: 'stopped',
        logs: [],
        latestDiagnostic: null,
      };
    }
    return this.toInfo(processInfo);
  }

  public getLogs(projectId: string): string[] {
    const processInfo = this.processes.get(projectId);
    return processInfo ? [...processInfo.logs] : [];
  }

  public getAllStatuses(): Array<PreviewInfo & { projectId: string }> {
    const results: Array<PreviewInfo & { projectId: string }> = [];
    for (const [projectId, processInfo] of this.processes) {
      results.push({ projectId, ...this.toInfo(processInfo) });
    }
    for (const [projectId, retainedState] of this.retainedStates) {
      if (this.processes.has(projectId)) {
        continue;
      }
      results.push({
        projectId,
        port: retainedState.port,
        url: retainedState.url,
        status: retainedState.status,
        logs: [...retainedState.logs],
        pid: retainedState.pid ?? undefined,
        latestDiagnostic: retainedState.latestDiagnostic,
      });
    }
    return results;
  }

  private toInfo(processInfo: PreviewProcess): PreviewInfo {
    return {
      port: processInfo.port,
      url: processInfo.url,
      status: processInfo.status,
      logs: [...processInfo.logs],
      pid: processInfo.process?.pid,
      latestDiagnostic: processInfo.latestDiagnostic,
    };
  }
}

const globalPreviewManager = globalThis as unknown as {
  __termstack_preview_manager__?: PreviewManager;
};

export const previewManager: PreviewManager =
  globalPreviewManager.__termstack_preview_manager__ ??
  (globalPreviewManager.__termstack_preview_manager__ = new PreviewManager());
