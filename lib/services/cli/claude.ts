/**
 * Claude Agent SDK Service - Claude Agent SDK Integration
 *
 * Interacts with projects using the Claude Agent SDK.
 */

import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import type { ClaudeSession, ClaudeResponse } from '@/types/backend';
import { streamManager } from '../stream';
import { serializeMessage, createRealtimeMessage } from '@/lib/serializers/chat';
import { updateProject, getProjectById } from '../project';
import { createMessage } from '../message';
import { CLAUDE_DEFAULT_MODEL, normalizeClaudeModelId, getClaudeModelDisplayName } from '@/lib/constants/claudeModels';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { previewManager, PreviewDiagnosticError } from '../preview';
import {
  markUserRequestAsRunning,
  markUserRequestAsCompleted,
  markUserRequestAsFailed,
} from '@/lib/services/user-requests';

type ToolAction = 'Edited' | 'Created' | 'Read' | 'Deleted' | 'Generated' | 'Searched' | 'Executed';

const TOOL_NAME_ACTION_MAP: Record<string, ToolAction> = {
  read: 'Read',
  read_file: 'Read',
  'read-file': 'Read',
  write: 'Created',
  write_file: 'Created',
  'write-file': 'Created',
  create_file: 'Created',
  edit: 'Edited',
  edit_file: 'Edited',
  'edit-file': 'Edited',
  update_file: 'Edited',
  apply_patch: 'Edited',
  patch_file: 'Edited',
  remove_file: 'Deleted',
  delete_file: 'Deleted',
  delete: 'Deleted',
  remove: 'Deleted',
  list_files: 'Searched',
  list: 'Searched',
  ls: 'Searched',
  glob: 'Searched',
  glob_files: 'Searched',
  search_files: 'Searched',
  grep: 'Searched',
  bash: 'Executed',
  run: 'Executed',
  run_bash: 'Executed',
  shell: 'Executed',
  todo_write: 'Generated',
  todo: 'Generated',
  plan_write: 'Generated',
};

const PROJECT_SNAPSHOT_IGNORED_DIRS = new Set([
  '.git',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const DEPENDENCY_MANIFEST_PATHS = new Set([
  'bun.lockb',
  'package-lock.json',
  'package.json',
  'pnpm-lock.yaml',
  'yarn.lock',
]);

const PREVIEW_RESTART_PATHS = new Set([
  ...DEPENDENCY_MANIFEST_PATHS,
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.ts',
  'tailwind.config.cjs',
  'tailwind.config.js',
  'tailwind.config.ts',
]);

const DISALLOWED_BASH_PATTERNS = [
  /\b(?:npm|pnpm|yarn|bun)\s+(?:install|add|update|upgrade|remove|ci)\b/i,
  /\b(?:npm|pnpm|yarn|bun)\s+run\s+(?:dev|build|start|test|lint|predev)\b/i,
  /\bnext\s+(?:dev|build|start)\b/i,
  /\brm\s+-rf\s+(?:\.next|node_modules)\b/i,
  /\brimraf\s+(?:\.next|node_modules)\b/i,
  /\bRemove-Item\b.*(?:\.next|node_modules)/i,
  /\bdel\b.*(?:\.next|node_modules)/i,
];

function normalizeBashCommand(input: Record<string, unknown>): string {
  const directCommand = input.command;
  if (typeof directCommand === 'string') {
    return directCommand.trim();
  }

  const nestedToolInput = input.toolInput;
  if (nestedToolInput && typeof nestedToolInput === 'object') {
    const nestedCommand = (nestedToolInput as Record<string, unknown>).command;
    if (typeof nestedCommand === 'string') {
      return nestedCommand.trim();
    }
  }

  return '';
}

function isDisallowedBashCommand(command: string): boolean {
  return DISALLOWED_BASH_PATTERNS.some((pattern) => pattern.test(command));
}

interface ProjectSnapshotEntry {
  mtimeMs: number;
  size: number;
}

type ProjectSnapshot = Map<string, ProjectSnapshotEntry>;

interface ProjectSnapshotDiff {
  created: string[];
  updated: string[];
  deleted: string[];
}

const normalizeAction = (value: unknown): ToolAction | undefined => {
  if (typeof value !== 'string') return undefined;
  const candidate = value.trim().toLowerCase();
  if (!candidate) return undefined;
  if (candidate.includes('edit') || candidate.includes('modify') || candidate.includes('update') || candidate.includes('patch')) {
    return 'Edited';
  }
  if (candidate.includes('write') || candidate.includes('create') || candidate.includes('add') || candidate.includes('append')) {
    return 'Created';
  }
  if (candidate.includes('read') || candidate.includes('open') || candidate.includes('view')) {
    return 'Read';
  }
  if (candidate.includes('delete') || candidate.includes('remove')) {
    return 'Deleted';
  }
  if (
    candidate.includes('search') ||
    candidate.includes('find') ||
    candidate.includes('list') ||
    candidate.includes('glob') ||
    candidate.includes('ls') ||
    candidate.includes('grep')
  ) {
    return 'Searched';
  }
  if (candidate.includes('generate') || candidate.includes('todo') || candidate.includes('plan')) {
    return 'Generated';
  }
  if (
    candidate.includes('execute') ||
    candidate.includes('exec') ||
    candidate.includes('run') ||
    candidate.includes('bash') ||
    candidate.includes('shell') ||
    candidate.includes('command')
  ) {
    return 'Executed';
  }
  return undefined;
};

const inferActionFromToolName = (toolName: unknown): ToolAction | undefined => {
  if (typeof toolName !== 'string') return undefined;
  const normalized = toolName.trim().toLowerCase();
  if (!normalized) return undefined;
  if (TOOL_NAME_ACTION_MAP[normalized]) {
    return TOOL_NAME_ACTION_MAP[normalized];
  }
  const suffix = normalized.split(':').pop() ?? normalized;
  if (suffix && TOOL_NAME_ACTION_MAP[suffix]) {
    return TOOL_NAME_ACTION_MAP[suffix];
  }
  return normalizeAction(normalized);
};

const pickFirstString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = pickFirstString(entry);
      if (candidate) return candidate;
    }
    return undefined;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const nestedKeys = ['path', 'filepath', 'filePath', 'file_path', 'target', 'value'];
    for (const key of nestedKeys) {
      if (key in obj) {
        const candidate = pickFirstString(obj[key]);
        if (candidate) return candidate;
      }
    }
  }
  return undefined;
};

const extractPathFromInput = (input: unknown, action?: ToolAction): string | undefined => {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as Record<string, unknown>;
  const candidateKeys = [
    'filePath',
    'file_path',
    'filepath',
    'path',
    'targetPath',
    'target_path',
    'target',
    'targets',
    'fullPath',
    'full_path',
    'destination',
    'destinationPath',
    'outputPath',
    'output_path',
    'glob',
    'pattern',
    'directory',
    'dir',
    'filename',
    'name',
  ];

  for (const key of candidateKeys) {
    if (key in record) {
      const result = pickFirstString(record[key]);
      if (result) {
        return result;
      }
    }
  }

  if (Array.isArray(record.targets)) {
    for (const target of record.targets as unknown[]) {
      const candidate = pickFirstString(target);
      if (candidate) {
        return candidate;
      }
    }
  }

  if (!action || action === 'Executed') {
    const commandKeys = ['command', 'cmd', 'shellCommand', 'shell_command'];
    for (const key of commandKeys) {
      if (key in record) {
        const candidate = pickFirstString(record[key]);
        if (candidate) {
          return candidate;
        }
      }
    }
  }

  return undefined;
};

const buildToolMetadata = (block: Record<string, unknown>): Record<string, unknown> => {
  const metadata: Record<string, unknown> = {};
  const toolName = pickFirstString(block.name) ?? (typeof block.name === 'string' ? block.name : undefined);
  const toolInput = block.input;
  const inputRecord = toolInput && typeof toolInput === 'object' ? (toolInput as Record<string, unknown>) : undefined;

  if (toolName) {
    metadata.toolName = toolName;
  }

  if (toolInput !== undefined) {
    metadata.toolInput = toolInput;
  }

  let action =
    normalizeAction(block.action) ??
    normalizeAction(block.operation) ??
    (inputRecord ? normalizeAction(inputRecord.action) ?? normalizeAction(inputRecord.operation) : undefined) ??
    inferActionFromToolName(toolName);

  const directPath =
    pickFirstString(block.filePath) ??
    pickFirstString(block.file_path) ??
    pickFirstString(block.targetPath) ??
    pickFirstString(block.target_path) ??
    pickFirstString(block.path);

  let filePath = directPath ?? extractPathFromInput(toolInput, action);

  if (!filePath && inputRecord) {
    filePath =
      extractPathFromInput(inputRecord, action) ??
      pickFirstString(inputRecord.filePath) ??
      pickFirstString(inputRecord.file_path);
  }

  if (!filePath && inputRecord) {
    const command =
      pickFirstString(inputRecord.command) ??
      pickFirstString(inputRecord.cmd) ??
      pickFirstString(inputRecord.shellCommand) ??
      pickFirstString(inputRecord.shell_command);
    if (command) {
      metadata.command = command;
      filePath = command;
      if (!action) {
        action = 'Executed';
      }
    }
  }

  if (filePath) {
    metadata.filePath = filePath;
  }

  if (action) {
    metadata.action = action;
  }

  const summary =
    pickFirstString(block.summary) ??
    pickFirstString(block.description) ??
    pickFirstString(block.result) ??
    pickFirstString(block.resultSummary) ??
    pickFirstString(block.result_summary) ??
    (inputRecord ? pickFirstString(inputRecord.summary) ?? pickFirstString(inputRecord.description) : undefined) ??
    pickFirstString(block.diff) ??
    pickFirstString(block.diffInfo) ??
    pickFirstString(block.diff_info);

  if (summary) {
    metadata.summary = summary;
  }

  return metadata;
};

interface ToolPlaceholderDetails {
  raw: string;
  toolName?: string;
  target?: string;
  summary?: string;
  action?: ToolAction;
  isResult: boolean;
}

const parseToolPlaceholderText = (text: string): ToolPlaceholderDetails | null => {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  let toolName: string | undefined;
  let target: string | undefined;
  let summary: string | undefined;
  let isResult = false;

  const bracketMatch = trimmed.match(/^\[Tool:\s*([^\]\n]+)\s*\](.*)$/i);
  if (bracketMatch) {
    toolName = bracketMatch[1]?.trim();
    const trailing = bracketMatch[2]?.trim();
    if (trailing) {
      target = trailing;
    }
  }

  const usingToolMatch = trimmed.match(/^Using tool:\s*([^\n]+?)(?:\s+on\s+(.+))?$/i);
  if (usingToolMatch) {
    toolName = toolName ?? usingToolMatch[1]?.trim();
    const maybeTarget = usingToolMatch[2]?.trim();
    if (maybeTarget) {
      target = maybeTarget;
    }
  }

  const toolResultMatch = trimmed.match(/^Tool result:\s*(.+)$/i);
  if (toolResultMatch) {
    summary = toolResultMatch[1]?.trim() || undefined;
    isResult = true;
  }

  if (!toolName && !target && !summary) {
    return null;
  }

  const action = inferActionFromToolName(toolName) ?? (isResult ? undefined : 'Executed');

  return {
    raw: trimmed,
    toolName,
    target,
    summary,
    action,
    isResult,
  };
};

const buildMetadataFromPlaceholder = (details: ToolPlaceholderDetails): Record<string, unknown> => {
  const metadata: Record<string, unknown> = {};

  if (details.toolName) {
    metadata.toolName = details.toolName;
    metadata.tool_name = details.toolName;
  }

  if (details.target) {
    metadata.filePath = details.target;
    metadata.file_path = details.target;
  }

  if (details.summary) {
    metadata.summary = details.summary;
  }

  const action = details.action ?? inferActionFromToolName(details.toolName);
  if (action) {
    metadata.action = action;
  }

  metadata.placeholderType = details.isResult ? 'result' : 'start';

  return metadata;
};

const mergeMetadata = (
  base: Record<string, unknown> | undefined,
  extension: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(extension)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

const normalizeSignatureValue = (value?: string | null): string => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : '';
};

const computeToolMessageSignature = (
  metadata: Record<string, unknown>,
  content: string,
  messageType: 'tool_use' | 'tool_result' = 'tool_use'
): string => {
  const meta = metadata ?? {};
  const toolName =
    pickFirstString(meta.toolName) ?? pickFirstString(meta.tool_name);
  const filePath =
    pickFirstString(meta.filePath) ??
    pickFirstString(meta.file_path) ??
    pickFirstString(meta.targetPath) ??
    pickFirstString(meta.target_path);
  const summary =
    pickFirstString(meta.summary) ??
    pickFirstString(meta.resultSummary) ??
    pickFirstString(meta.result_summary) ??
    pickFirstString(meta.description);
  const command = pickFirstString(meta.command);
  const action = pickFirstString(meta.action);

  return [
    normalizeSignatureValue(messageType),
    normalizeSignatureValue(toolName),
    normalizeSignatureValue(filePath),
    normalizeSignatureValue(summary),
    normalizeSignatureValue(command),
    normalizeSignatureValue(action),
    normalizeSignatureValue(content),
  ].join('|');
};

const createToolMessageContent = (details: ToolPlaceholderDetails): string => {
  if (details.isResult && details.summary) {
    return `Tool result: ${details.summary}`;
  }
  if (details.toolName) {
    const targetSegment = details.target ? ` on ${details.target}` : '';
    return `Using tool: ${details.toolName}${targetSegment}`;
  }
  return details.raw;
};

const dispatchToolMessage = async ({
  projectId,
  metadata,
  content,
  requestId,
  persist = true,
  isStreaming = false,
  messageType = 'tool_use',
  dedupeKey,
  dedupeStore,
}: {
  projectId: string;
  metadata: Record<string, unknown>;
  content: string;
  requestId?: string;
  persist?: boolean;
  isStreaming?: boolean;
  messageType?: 'tool_use' | 'tool_result';
  dedupeKey?: string;
  dedupeStore?: Set<string>;
}): Promise<void> => {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return;
  }

  const enrichedMetadata = {
    ...(metadata ?? {}),
  };

  if (requestId && !enrichedMetadata.requestId) {
    enrichedMetadata.requestId = requestId;
  }

  if (persist && dedupeStore && dedupeKey) {
    const normalizedKey = dedupeKey.trim();
    if (normalizedKey.length > 0) {
      if (dedupeStore.has(normalizedKey)) {
        return;
      }
      dedupeStore.add(normalizedKey);
    }
  }

  if (!persist) {
    const transientMetadata = {
      ...enrichedMetadata,
      isTransientToolMessage: true,
    };
    streamManager.publish(projectId, {
      type: 'message',
      data: createRealtimeMessage({
        projectId,
        role: 'tool',
        content: trimmedContent,
        messageType,
        metadata: transientMetadata,
        requestId,
        isStreaming,
      }),
    });
    return;
  }

  try {
    const savedMessage = await createMessage({
      projectId,
      role: 'tool',
      messageType,
      content: trimmedContent,
      metadata: enrichedMetadata,
      cliSource: 'claude',
    });

    streamManager.publish(projectId, {
      type: 'message',
      data: serializeMessage(savedMessage, {
        requestId,
        isStreaming,
        isFinal: !isStreaming,
      }),
    });
  } catch (error) {
    console.error('[ClaudeService] Failed to persist tool message:', error);
  }
};

const handleToolPlaceholderMessage = async (
  projectId: string,
  placeholderText: string,
  requestId: string | undefined,
  baseMetadata?: Record<string, unknown>,
  options?: { dedupeStore?: Set<string>; transformMetadata?: (m: Record<string, unknown>) => Record<string, unknown> }
): Promise<boolean> => {
  const details = parseToolPlaceholderText(placeholderText);
  if (!details) {
    return false;
  }

  let metadata = mergeMetadata(baseMetadata, buildMetadataFromPlaceholder(details));
  if (options?.transformMetadata) {
    metadata = options.transformMetadata(metadata);
  }
  const content = createToolMessageContent(details);
  const messageType: 'tool_use' | 'tool_result' = details.isResult ? 'tool_result' : 'tool_use';
  const signature = computeToolMessageSignature(metadata, content, messageType);

  await dispatchToolMessage({
    projectId,
    metadata,
    content,
    requestId,
    persist: true,
    isStreaming: false,
    messageType,
    dedupeKey: signature,
    dedupeStore: options?.dedupeStore,
  });

  return true;
};

function resolveModelId(model?: string | null): string {
  return normalizeClaudeModelId(model);
}

async function collectProjectSnapshot(projectPath: string): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = new Map();

  const walk = async (currentPath: string, relativeDir = ''): Promise<void> => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory() && PROJECT_SNAPSHOT_IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const entryPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(entryPath, nextRelative);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const stat = await fs.stat(entryPath);
      snapshot.set(nextRelative.replace(/\\/g, '/'), {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
      });
    }
  };

  await walk(projectPath);

  return snapshot;
}

function diffProjectSnapshots(before: ProjectSnapshot, after: ProjectSnapshot): ProjectSnapshotDiff {
  const created: string[] = [];
  const updated: string[] = [];
  const deleted: string[] = [];

  for (const [relativePath, afterEntry] of after.entries()) {
    const beforeEntry = before.get(relativePath);

    if (!beforeEntry) {
      created.push(relativePath);
      continue;
    }

    if (beforeEntry.size !== afterEntry.size || beforeEntry.mtimeMs !== afterEntry.mtimeMs) {
      updated.push(relativePath);
    }
  }

  for (const relativePath of before.keys()) {
    if (!after.has(relativePath)) {
      deleted.push(relativePath);
    }
  }

  return { created, updated, deleted };
}

function summarizeProjectSnapshotDiff(diff: ProjectSnapshotDiff): string {
  const segments: string[] = [];
  const formatPaths = (paths: string[]) => paths.slice(0, 5).join(', ');

  if (diff.created.length > 0) {
    segments.push(`created ${formatPaths(diff.created)}${diff.created.length > 5 ? ', …' : ''}`);
  }

  if (diff.updated.length > 0) {
    segments.push(`updated ${formatPaths(diff.updated)}${diff.updated.length > 5 ? ', …' : ''}`);
  }

  if (diff.deleted.length > 0) {
    segments.push(`deleted ${formatPaths(diff.deleted)}${diff.deleted.length > 5 ? ', …' : ''}`);
  }

  return segments.join('; ');
}

function collectChangedProjectPaths(diff: ProjectSnapshotDiff): string[] {
  return [...diff.created, ...diff.updated, ...diff.deleted];
}

/**
 * Execute command using Claude Agent SDK
 *
 * @param projectId - Project ID
 * @param projectPath - Project directory path
 * @param instruction - Command to pass to AI
 * @param model - Claude model to use (default: claude-sonnet-4-6)
 * @param sessionId - Previous session ID (maintains conversation context)
 * @param requestId - (Optional) User request tracking ID
 */
export async function executeClaude(
  projectId: string,
  projectPath: string,
  instruction: string,
  model: string = CLAUDE_DEFAULT_MODEL,
  sessionId?: string,
  requestId?: string
): Promise<void> {
  console.log(`\n========================================`);
  console.log(`[ClaudeService] 🚀 Starting Claude Agent SDK`);
  console.log(`[ClaudeService] Project: ${projectId}`);
  const resolvedModel = resolveModelId(model);
  const modelLabel = getClaudeModelDisplayName(resolvedModel);
  const aliasNote = resolvedModel !== model ? ` (alias for ${model})` : '';
  console.log(`[ClaudeService] Model: ${modelLabel} [${resolvedModel}]${aliasNote}`);
  console.log(`[ClaudeService] Session ID: ${sessionId || 'new session'}`);
  console.log(`[ClaudeService] Instruction: ${instruction.substring(0, 100)}...`);
  console.log(`========================================\n`);

  let hasMarkedTerminalStatus = false;
  let emittedCompletedStatus = false;

  const safeMarkRunning = async () => {
    if (!requestId) return;
    try {
      await markUserRequestAsRunning(requestId);
    } catch (error) {
      console.error(`[ClaudeService] Failed to mark request ${requestId} as running:`, error);
    }
  };

  const safeMarkCompleted = async () => {
    if (!requestId || hasMarkedTerminalStatus) return;
    try {
      await markUserRequestAsCompleted(requestId);
    } catch (error) {
      console.error(`[ClaudeService] Failed to mark request ${requestId} as completed:`, error);
    } finally {
      hasMarkedTerminalStatus = true;
    }
  };

  const safeMarkFailed = async (message?: string) => {
    if (!requestId || hasMarkedTerminalStatus) return;
    try {
      await markUserRequestAsFailed(requestId, message);
    } catch (error) {
      console.error(`[ClaudeService] Failed to mark request ${requestId} as failed:`, error);
    } finally {
      hasMarkedTerminalStatus = true;
    }
  };

  const publishStatus = (status: string, message?: string) => {
    streamManager.publish(projectId, {
      type: 'status',
      data: {
        status,
        ...(message ? { message } : {}),
        ...(requestId ? { requestId } : {}),
      },
    });
  };

  // Send start notification via SSE
  publishStatus('starting', 'Initializing Claude Agent SDK...');

  await safeMarkRunning();

  // Collect stderr from SDK process for better diagnostics
  const stderrBuffer: string[] = [];
  const placeholderHistory = new Map<string, Set<string>>();
  const persistedToolMessageSignatures = new Set<string>();
  const markPlaceholderHandled = (sessionKey: string, placeholder: string): boolean => {
    const normalized = placeholder.trim();
    if (!normalized) {
      return false;
    }
    let entries = placeholderHistory.get(sessionKey);
    if (!entries) {
      entries = new Set<string>();
      placeholderHistory.set(sessionKey, entries);
    }
    if (entries.has(normalized)) {
      return false;
    }
    entries.add(normalized);
    return true;
  };

  try {
    // Verify project exists (prevents foreign key constraint errors)
    console.log(`[ClaudeService] 🔍 Verifying project exists...`);
    const project = await getProjectById(projectId);
    if (!project) {
      const errorMessage = `Project not found: ${projectId}. Cannot create messages for non-existent project.`;
      console.error(`[ClaudeService] ❌ ${errorMessage}`);

      streamManager.publish(projectId, {
        type: 'error',
        error: errorMessage,
        data: requestId ? { requestId } : undefined,
      });

      throw new Error(errorMessage);
    }

    console.log(`[ClaudeService] ✅ Project verified: ${project.name}`);

    // Validate and prepare project path
    console.log(`[ClaudeService] 🔒 Validating project path...`);

    // Convert to absolute path
    const absoluteProjectPath = path.isAbsolute(projectPath)
      ? path.resolve(projectPath)
      : path.resolve(process.cwd(), projectPath);

    // Security: Verify project path is within allowed directory
    const allowedBasePath = path.resolve(process.cwd(), process.env.PROJECTS_DIR || './data/projects');
    const relativeToBase = path.relative(allowedBasePath, absoluteProjectPath);
    const isWithinBase =
      !relativeToBase.startsWith('..') && !path.isAbsolute(relativeToBase);
    if (!isWithinBase) {
      const errorMessage = `Security violation: Project path must be within ${allowedBasePath}. Got: ${absoluteProjectPath}`;
      console.error(`[ClaudeService] ❌ ${errorMessage}`);

      streamManager.publish(projectId, {
        type: 'error',
        error: errorMessage,
        data: requestId ? { requestId } : undefined,
      });

      throw new Error(errorMessage);
    }

    // Check project directory exists and create if needed
    try {
      await fs.access(absoluteProjectPath);
      console.log(`[ClaudeService] ✅ Project directory exists: ${absoluteProjectPath}`);
    } catch {
      console.log(`[ClaudeService] 📁 Creating project directory: ${absoluteProjectPath}`);
      await fs.mkdir(absoluteProjectPath, { recursive: true });
    }

    const snapshotBefore = await collectProjectSnapshot(absoluteProjectPath);

    // Helper: strip the project base path from tool metadata filePaths so the
    // chat UI displays clean project-relative paths (e.g. "/app/page.tsx"
    // instead of "/data/projects/93e48839-.../app/page.tsx").
    const projectPrefix = absoluteProjectPath.replace(/\\/g, '/').replace(/\/+$/, '');
    const stripProjectPath = (metadata: Record<string, unknown>): Record<string, unknown> => {
      const fp = metadata.filePath;
      if (typeof fp === 'string') {
        const normalized = fp.replace(/\\/g, '/');
        if (normalized.startsWith(projectPrefix + '/')) {
          metadata.filePath = normalized.slice(projectPrefix.length);
        } else if (normalized === projectPrefix) {
          metadata.filePath = '/';
        }
      }
      return metadata;
    };

    // Send ready notification via SSE
    publishStatus('ready', 'Project verified. Starting AI...');

    // Start Claude Agent SDK query
    console.log(`[ClaudeService] 🤖 Querying Claude Agent SDK...`);
    console.log(`[ClaudeService] 📁 Working Directory: ${absoluteProjectPath}`);
    const queryOptions: Options = {
      cwd: absoluteProjectPath,
      additionalDirectories: [absoluteProjectPath],
      model: resolvedModel,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      canUseTool: async (toolName, input) => {
        if (toolName.toLowerCase() === 'bash') {
          const bashCommand = normalizeBashCommand(input);
          if (bashCommand && isDisallowedBashCommand(bashCommand)) {
            console.log('[Claude:ToolGate] BLOCKED tool=%s command=%s', toolName, bashCommand);
            return {
              behavior: 'deny',
              message:
                'The platform manages installs, builds, tests, cleanup, and preview processes. Do not run shell commands for those tasks; edit project files and rely on the managed preview instead.',
            };
          }
        }

        // Enforce project-scoped file access for all file tools
        const fileToolNames = new Set(['read', 'write', 'edit', 'glob', 'grep', 'list', 'ls']);
        if (fileToolNames.has(toolName.toLowerCase()) && input && typeof input === 'object') {
          const inputRecord = input as Record<string, unknown>;
          const targetPath =
            (typeof inputRecord.file_path === 'string' && inputRecord.file_path) ||
            (typeof inputRecord.filePath === 'string' && inputRecord.filePath) ||
            (typeof inputRecord.path === 'string' && inputRecord.path) ||
            (typeof inputRecord.directory === 'string' && inputRecord.directory);
          if (targetPath && path.isAbsolute(targetPath)) {
            const resolved = path.resolve(targetPath);
            const rel = path.relative(absoluteProjectPath, resolved);
            if (rel.startsWith('..') || path.isAbsolute(rel)) {
              console.log(
                '[Claude:ToolGate] BLOCKED tool=%s path=%s (outside project scope)',
                toolName,
                targetPath
              );
              return {
                behavior: 'deny',
                message: `File operations are restricted to this project directory. "${targetPath}" is outside the project scope.`,
              };
            }
          }
        }

        return { behavior: 'allow' };
      },
      systemPrompt: `You are an expert web developer building a Next.js application.
Your project directory is: ${absoluteProjectPath}
All file operations are scoped to this directory. You are already in the correct project — do not search for or navigate to parent directories or other projects. Use only relative paths from the project root.
- This is an implementation task. You must make the required file changes in the current working directory before claiming completion.
- Use Next.js 15 App Router
- Use TypeScript
- Prefer the existing styling stack in the project. For fresh projects, default to plain CSS, CSS Modules, or inline styles unless the user explicitly asks for Tailwind CSS.
- If you add Tailwind CSS, use the compatible v3 stack for this platform: tailwindcss@3.4.17 with postcss@8.4.49 and autoprefixer@10.4.20, plus the classic \`@tailwind base;\`, \`@tailwind components;\`, and \`@tailwind utilities;\` directives. Do not use Tailwind v4-only syntax or \`@tailwindcss/postcss\`.
- Write clean, production-ready code
- Follow best practices
- The platform automatically installs dependencies and manages the preview dev server. Never run package managers or dev-server commands yourself. If you need a dependency, edit package.json with the required version and let the platform handle installation after your file changes.
- Never run build, test, clean, or framework lifecycle commands yourself (for example: npm/yarn/pnpm/bun commands, next build/dev/start, or project-wide validation shell commands). The platform owns installs, builds, and preview orchestration.
- Never delete or reset build artifacts, caches, or dependencies such as \`.next\`, \`node_modules\`, lockfiles, or generated manifests. Those files may be in active use by the managed preview.
- Keep all project files directly in the project root. Never scaffold frameworks into subdirectories (avoid commands like "mkdir new-app" or "create-next-app my-app"; run generators against the current directory instead).
- Never override ports or start your own development server processes. Rely on the managed preview service which assigns ports from the approved pool.
- When sharing a preview link, read the actual NEXT_PUBLIC_APP_URL (e.g. from .env/.env.local or project metadata) instead of assuming a default port.
- Prefer giving the user the live preview link that is actually running rather than written instructions.
- Before you say something is finished, verify the key files you changed by reading them back from this working directory instead of invoking local build/dev/test commands.
- Never claim that a feature is built, updated, or running unless you actually changed the project files in this workspace.`,
      stderr: (data: string) => {
        const line = String(data).trimEnd();
        if (!line) return;
        if (stderrBuffer.length > 200) stderrBuffer.shift();
        stderrBuffer.push(line);
        console.error(`[ClaudeSDK][stderr] ${line}`);
      },
    };

    if (sessionId) {
      queryOptions.resume = sessionId;
    }

    const response = query({
      prompt: instruction,
      options: queryOptions,
    });

    let currentSessionId: string | undefined = sessionId;

    interface AssistantStreamState {
      messageId: string;
      content: string;
      hasSentUpdate: boolean;
      finalized: boolean;
    }

    const assistantStreamStates = new Map<string, AssistantStreamState>();
    const completedStreamSessions = new Set<string>();

    // Handle streaming response
    for await (const message of response) {
      console.log('[ClaudeService] Message type:', message.type);

      if (message.type === 'stream_event') {
        const event: any = (message as any).event ?? {};
        const sessionKey = (message.session_id ?? message.uuid ?? 'default').toString();
        console.log('[ClaudeService] Stream event type:', event.type);

        let streamState = assistantStreamStates.get(sessionKey);

        switch (event.type) {
          case 'message_start': {
            const newState: AssistantStreamState = {
              messageId: randomUUID(),
              content: '',
              hasSentUpdate: false,
              finalized: false,
            };
            assistantStreamStates.set(sessionKey, newState);
            break;
          }
          case 'content_block_start': {
            const contentBlock = event.content_block;
            if (contentBlock && typeof contentBlock === 'object' && contentBlock.type === 'tool_use') {
              const metadata = stripProjectPath(buildToolMetadata(contentBlock as Record<string, unknown>));
              await dispatchToolMessage({
                projectId,
                metadata,
                content: `Using tool: ${contentBlock.name ?? 'tool'}`,
                requestId,
                persist: false,
                isStreaming: true,
              });
            }
            break;
          }
          case 'content_block_delta': {
            const delta = event.delta;
            let textChunk = '';

            if (typeof delta === 'string') {
              textChunk = delta;
            } else if (delta && typeof delta === 'object') {
              if (typeof delta.text === 'string') {
                textChunk = delta.text;
              } else if (typeof delta.delta === 'string') {
                textChunk = delta.delta;
              } else if (typeof delta.partial === 'string') {
                textChunk = delta.partial;
              }
            }

            if (typeof textChunk !== 'string' || textChunk.length === 0) {
              break;
            }

            if (!streamState || streamState.finalized) {
              streamState = {
                messageId: randomUUID(),
                content: '',
                hasSentUpdate: false,
                finalized: false,
              };
              assistantStreamStates.set(sessionKey, streamState);
            }

            streamState.content += textChunk;
            const trimmedContent = streamState.content.trim();
            const isPlaceholderLine =
              trimmedContent.length > 0 &&
              ((/^\[Tool:\s*.+\]$/i.test(trimmedContent) && !trimmedContent.includes('\n')) ||
                /^Using tool:/i.test(trimmedContent) ||
                /^Tool result:/i.test(trimmedContent));

            if (trimmedContent.length === 0) {
              streamState.content = '';
              streamState.hasSentUpdate = false;
              break;
            }

            if (isPlaceholderLine) {
              const shouldHandle = markPlaceholderHandled(sessionKey, trimmedContent);
              if (shouldHandle) {
                try {
                  await handleToolPlaceholderMessage(
                    projectId,
                    trimmedContent,
                    requestId,
                    undefined,
                    { dedupeStore: persistedToolMessageSignatures, transformMetadata: stripProjectPath }
                  );
                } catch (error) {
                  console.error('[ClaudeService] Failed to handle streaming tool placeholder:', error);
                }
              }
              streamState.content = '';
              streamState.hasSentUpdate = false;
              break;
            }

            streamState.hasSentUpdate = true;

            streamManager.publish(projectId, {
              type: 'message',
              data: createRealtimeMessage({
                id: streamState.messageId,
                projectId,
                role: 'assistant',
                content: streamState.content,
                messageType: 'chat',
                requestId,
                isStreaming: true,
              }),
            });
            break;
          }
          case 'message_stop': {
            if (streamState && streamState.hasSentUpdate && !streamState.finalized) {
              const trimmedContent = streamState.content.trim();
              const isPlaceholderLine =
                trimmedContent.length > 0 &&
                ((/^\[Tool:\s*.+\]$/i.test(trimmedContent) && !trimmedContent.includes('\n')) ||
                  /^Using tool:/i.test(trimmedContent) ||
                  /^Tool result:/i.test(trimmedContent));

              if (isPlaceholderLine) {
                const shouldHandle = markPlaceholderHandled(sessionKey, trimmedContent);
                if (shouldHandle) {
                  try {
                    await handleToolPlaceholderMessage(
                      projectId,
                      trimmedContent,
                      requestId,
                      undefined,
                      { dedupeStore: persistedToolMessageSignatures, transformMetadata: stripProjectPath }
                    );
                  } catch (error) {
                    console.error('[ClaudeService] Failed to handle tool placeholder on stop:', error);
                  }
                }
              }

              if (
                trimmedContent.length === 0 ||
                isPlaceholderLine
              ) {
                streamState.hasSentUpdate = false;
              }

              if (!streamState.hasSentUpdate) {
                streamState.content = '';
                assistantStreamStates.delete(sessionKey);
                break;
              }

              streamState.finalized = true;

              const savedMessage = await createMessage({
                id: streamState.messageId,
                projectId,
                role: 'assistant',
                messageType: 'chat',
                content: streamState.content,
                cliSource: 'claude',
              });

              streamManager.publish(projectId, {
                type: 'message',
                data: serializeMessage(savedMessage, {
                  isStreaming: false,
                  isFinal: true,
                  requestId,
                }),
              });

              completedStreamSessions.add(sessionKey);
            }

            assistantStreamStates.delete(sessionKey);
            break;
          }
          default:
            break;
        }

        continue;
      }

      // Handle by message type
      if (message.type === 'system' && message.subtype === 'init') {
        // Initialize session
        currentSessionId = message.session_id;
        console.log(`[ClaudeService] Session initialized: ${currentSessionId}`);

        // Save session ID to project
        if (currentSessionId) {
          await updateProject(projectId, {
            activeClaudeSessionId: currentSessionId,
          });
        }

        // Send connection notification via SSE
        streamManager.publish(projectId, {
          type: 'connected',
          data: {
            projectId,
            sessionId: currentSessionId,
            timestamp: new Date().toISOString(),
            connectionStage: 'assistant',
          },
        });
      } else if (message.type === 'assistant') {
        const sessionKey = (message.session_id ?? message.uuid ?? 'default').toString();
        if (completedStreamSessions.has(sessionKey)) {
          completedStreamSessions.delete(sessionKey);
          continue;
        }

        // Assistant message
        const assistantMessage = message.message;
        let content = '';

        // Extract content
        if (typeof assistantMessage.content === 'string') {
          content = assistantMessage.content;
        } else if (Array.isArray(assistantMessage.content)) {
          const parts: string[] = [];
          for (const block of assistantMessage.content as unknown[]) {
            if (!block || typeof block !== 'object') {
              continue;
            }

            const safeBlock = block as any;

            if (safeBlock.type === 'text') {
              const text = typeof safeBlock.text === 'string' ? safeBlock.text : '';
              const trimmed = text.trim();
              if (!trimmed) {
                continue;
              }

              const isPlaceholderLine =
                /^\[Tool:\s*/i.test(trimmed) ||
                /^Using tool:/i.test(trimmed) ||
                /^Tool result:/i.test(trimmed);

              if (isPlaceholderLine) {
                const shouldHandle = markPlaceholderHandled(sessionKey, trimmed);
                if (shouldHandle) {
                  try {
                    await handleToolPlaceholderMessage(
                      projectId,
                      trimmed,
                      requestId,
                      undefined,
                      { dedupeStore: persistedToolMessageSignatures, transformMetadata: stripProjectPath }
                    );
                  } catch (error) {
                    console.error('[ClaudeService] Failed to handle assistant tool placeholder:', error);
                  }
                }
                continue;
              }

              parts.push(text);
              continue;
            }

            if (safeBlock.type === 'tool_use') {
              const metadata = stripProjectPath(buildToolMetadata(safeBlock as Record<string, unknown>));
              const name = typeof safeBlock.name === 'string' ? safeBlock.name : pickFirstString(safeBlock.name);
              const toolContent = `Using tool: ${name ?? 'tool'}`;
              await dispatchToolMessage({
                projectId,
                metadata,
                content: toolContent,
                requestId,
                persist: true,
                isStreaming: false,
                messageType: 'tool_use',
                dedupeKey: computeToolMessageSignature(metadata, toolContent, 'tool_use'),
                dedupeStore: persistedToolMessageSignatures,
              });
              continue;
            }
          }

          content = parts.join('\n');
        }

        console.log('[ClaudeService] Assistant message:', content.substring(0, 100));

        // Save message to DB
        if (content) {
          const savedMessage = await createMessage({
            projectId,
            role: 'assistant',
            messageType: 'chat',
            content,
            // sessionId is Session table foreign key, so don't store Claude SDK session ID
            // Claude SDK session ID is stored in project.activeClaudeSessionId
            cliSource: 'claude',
          });

          // Send via SSE in real-time
          streamManager.publish(projectId, {
            type: 'message',
            data: serializeMessage(savedMessage, { requestId }),
          });
        }
      } else if (message.type === 'result') {
        // Final result
        console.log('[ClaudeService] Task completed:', message.subtype);
      }
    }

    const snapshotAfter = await collectProjectSnapshot(absoluteProjectPath);
    const snapshotDiff = diffProjectSnapshots(snapshotBefore, snapshotAfter);
    const hasProjectFileChanges =
      snapshotDiff.created.length > 0 ||
      snapshotDiff.updated.length > 0 ||
      snapshotDiff.deleted.length > 0;

    if (!hasProjectFileChanges) {
      throw new Error(
        'Claude completed without modifying any project files. This usually means it stayed in analysis mode or targeted the wrong workspace.'
      );
    }

    const changedPaths = collectChangedProjectPaths(snapshotDiff);
    const dependencyManifestChanged = changedPaths.some((relativePath) =>
      DEPENDENCY_MANIFEST_PATHS.has(relativePath)
    );
    const previewRestartRequired = changedPaths.some((relativePath) =>
      PREVIEW_RESTART_PATHS.has(relativePath)
    );

    const snapshotSummary = summarizeProjectSnapshotDiff(snapshotDiff);
    console.log(
      `[ClaudeService] ✅ Verified project file changes in ${absoluteProjectPath}: ${snapshotSummary}`
    );

    if (dependencyManifestChanged) {
      publishStatus('running', 'Installing updated dependencies...');
      await previewManager.installDependencies(projectId, { force: true });
    }

    if (previewRestartRequired) {
      publishStatus('running', 'Restarting preview...');
      const previewStatus = previewManager.getStatus(projectId);
      if (previewStatus.status !== 'stopped') {
        await previewManager.stop(projectId);
      }
      try {
        await previewManager.start(projectId);
      } catch (previewError) {
        if (previewError instanceof PreviewDiagnosticError) {
          const diagMessage = previewError.diagnostic.message;
          const diagDetail = previewError.diagnostic.detail ?? '';
          console.log(
            `[ClaudeService] Preview failed after code changes: ${diagMessage}${diagDetail ? ` — ${diagDetail}` : ''}`
          );
          publishStatus(
            'running',
            `Preview error detected, recovery in progress...`
          );
        } else {
          console.error('[ClaudeService] Preview restart failed:', previewError);
        }
        // Don't rethrow — preview failure shouldn't block the Claude response completion
        // The diagnostic is already published to the UI via publishPreviewEvent in preview.ts
      }
    }

    console.log('[ClaudeService] Streaming completed');
    await safeMarkCompleted();
    if (!emittedCompletedStatus) {
      publishStatus('completed', snapshotSummary);
      emittedCompletedStatus = true;
    }
  } catch (error) {
    console.error(`[ClaudeService] Failed to execute Claude:`, error);

    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;

      // Detect Claude Code CLI not installed
      if (errorMessage.includes('command not found') || errorMessage.includes('not found: claude')) {
        errorMessage = `Claude Code CLI is not installed.\n\nInstallation instructions:\n1. npm install -g @anthropic-ai/claude-code\n2. claude auth login`;
      }
      // Detect authentication failure
      else if (errorMessage.includes('not authenticated') || errorMessage.includes('authentication')) {
        errorMessage = `Claude Code CLI authentication required.\n\nAuthentication method:\nclaude auth login`;
      }
      // Credential authorization error (Claude Code credential vs API key)
      else if (
        errorMessage.includes('credential is only authorized') ||
        errorMessage.includes('not authorized for') ||
        /credential.*authorized/i.test(errorMessage) ||
        /api.*key.*invalid/i.test(errorMessage) ||
        /invalid.*api.*key/i.test(errorMessage)
      ) {
        errorMessage = `Your current credential is not authorized for this operation.\n\nThis typically happens when:\n- Using a Claude Code CLI credential for direct API calls\n- The API key is invalid or expired\n\nTo fix this:\n1. Set a valid API key in Settings → Environment Variables\n2. Or run: claude auth login`;
      }
      // Permission error
      else if (errorMessage.includes('permission') || errorMessage.includes('EACCES')) {
        errorMessage = `No file access permission. Please check project directory permissions.`;
      }
      // Token limit exceeded
      else if (errorMessage.includes('max_tokens')) {
        errorMessage = `Generation length is too long. Please shorten the prompt or split the request into smaller parts.`;
      }
      // Context window limit exceeded
      else if (
        errorMessage.includes('context_length_exceeded') ||
        errorMessage.includes('prompt is too long') ||
        /input.*exceeds.*context/i.test(errorMessage) ||
        /token.*limit.*exceeded/i.test(errorMessage) ||
        /context.*limit/i.test(errorMessage) ||
        /too many tokens/i.test(errorMessage)
      ) {
        errorMessage = `The conversation has exceeded the model's context window limit. Please try one of the following:\n\n1. Start a new conversation\n2. Use a shorter prompt\n3. Clear the conversation history and try again`;
      }
      // Generic process exit without details – attempt to surface last stderr lines
      else if (/process exited with code \d+/.test(errorMessage) && stderrBuffer.length > 0) {
        // Heuristics: extract likely actionable hints from stderr
        const tail = stderrBuffer.slice(-15).join('\n');
        // Common auth hints
        if (/auth\s+login|not\s+logged\s+in|sign\s+in/i.test(tail)) {
          errorMessage = `Claude Code CLI authentication required.\n\nAuthentication method:\nclaude auth login\n\nDetailed log:\n${tail}`;
        } else if (/credential.*authorized|not authorized|invalid.*api.*key|api.*key.*invalid/i.test(tail)) {
          errorMessage = `Your current credential is not authorized for this operation.\n\nThis typically happens when using a Claude Code CLI credential for direct API calls, or when the API key is invalid/expired.\n\nTo fix this:\n1. Set a valid API key in Settings → Environment Variables\n2. Or run: claude auth login\n\nDetailed log:\n${tail}`;
        } else if (/network|ENOTFOUND|ECONN|timeout/i.test(tail)) {
          errorMessage = `Failed to run Claude Code due to network error. Please check your network connection and try again.\n\nDetailed log:\n${tail}`;
        } else if (/permission|EACCES|EPERM|denied/i.test(tail)) {
          errorMessage = `Execution interrupted due to file access permission error. Please check project directory permissions.\n\nDetailed log:\n${tail}`;
        } else if (/model|unsupported|invalid\s+model/i.test(tail)) {
          errorMessage = `There is a problem with the model settings. Please try changing the model.\n\nDetailed log:\n${tail}`;
        } else if (/context.*(length|limit|window)|prompt.*too.*long|too many tokens|exceeds.*context/i.test(tail)) {
          errorMessage = `The conversation has exceeded the model's context window limit. Please try one of the following:\n\n1. Start a new conversation\n2. Use a shorter prompt\n3. Clear the conversation history and try again\n\nDetailed log:\n${tail}`;
        } else {
          errorMessage = `${errorMessage}\n\nDetailed log:\n${tail}`;
        }
      }
    }

    await safeMarkFailed(errorMessage);
    publishStatus('error', errorMessage);

    // Send error via SSE
    streamManager.publish(projectId, {
      type: 'error',
      error: errorMessage,
      data: requestId ? { requestId } : undefined,
    });

    throw new Error(errorMessage);
  }
}

/**
 * Initialize Next.js project with Claude Code
 *
 * @param projectId - Project ID
 * @param projectPath - Project directory path
 * @param initialPrompt - Initial prompt
 * @param model - Claude model to use (default: claude-sonnet-4-6)
 * @param requestId - (Optional) User request tracking ID
 */
export async function initializeNextJsProject(
  projectId: string,
  projectPath: string,
  initialPrompt: string,
  model: string = CLAUDE_DEFAULT_MODEL,
  requestId?: string
): Promise<void> {
  console.log(`[ClaudeService] Initializing Next.js project: ${projectId}`);

  // Next.js project creation command
  const fullPrompt = `
Use the existing Next.js 15 application in the current working directory and implement the following requirements directly in that project:
${initialPrompt}

Use App Router and TypeScript. Prefer the existing CSS setup unless the user explicitly requests Tailwind CSS. If you do add Tailwind, pin tailwindcss@3.4.17, postcss@8.4.49, and autoprefixer@10.4.20 with the classic Tailwind v3 PostCSS configuration.
Implement the requested features by editing project files in place.
Do not run install, build, dev, test, or cleanup commands yourself, and never delete \`.next\`, \`node_modules\`, lockfiles, or other build artifacts while the managed preview is active.
Do not stop after analysis or planning, and do not just describe the solution.
`.trim();

  await executeClaude(projectId, projectPath, fullPrompt, model, undefined, requestId);
}

/**
 * Apply changes to project
 *
 * @param projectId - Project ID
 * @param projectPath - Project directory path
 * @param instruction - Change request command
 * @param model - Claude model to use (default: claude-sonnet-4-6)
 * @param sessionId - Session ID
 * @param requestId - (Optional) User request tracking ID
 */
export async function applyChanges(
  projectId: string,
  projectPath: string,
  instruction: string,
  model: string = CLAUDE_DEFAULT_MODEL,
  sessionId?: string,
  requestId?: string
): Promise<void> {
  console.log(`[ClaudeService] Applying changes to project: ${projectId}`);
  await executeClaude(projectId, projectPath, instruction, model, sessionId, requestId);
}
