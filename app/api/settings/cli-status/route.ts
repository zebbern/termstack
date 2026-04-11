/**
 * CLI Status API Route
 * GET /api/settings/cli-status - Check CLI installation status
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { CLIStatus } from '@/types/backend';
import { CODEX_MODEL_DEFINITIONS } from '@/lib/constants/codexModels';
import { QWEN_MODEL_DEFINITIONS } from '@/lib/constants/qwenModels';
import { GLM_MODEL_DEFINITIONS } from '@/lib/constants/glmModels';
import { CURSOR_MODEL_DEFINITIONS } from '@/lib/constants/cursorModels';

const execAsync = promisify(exec);

// --- CLI check result caching & request deduplication ---

type CliCheckResult = { installed: boolean; version?: string; error?: string };

const cliCache = new Map<string, { result: CliCheckResult; timestamp: number }>();
const cliChecksInProgress = new Map<string, Promise<CliCheckResult>>();
const CLI_CACHE_TTL = 60_000; // 60 seconds

async function getCachedCliStatus(
  cliName: string,
  checkFn: () => Promise<CliCheckResult>,
  forceRefresh: boolean,
): Promise<CliCheckResult> {
  if (!forceRefresh) {
    const cached = cliCache.get(cliName);
    if (cached && Date.now() - cached.timestamp < CLI_CACHE_TTL) {
      return cached.result;
    }
  }

  const inProgress = cliChecksInProgress.get(cliName);
  if (inProgress) {
    return inProgress;
  }

  const promise = checkFn().then((result) => {
    cliCache.set(cliName, { result, timestamp: Date.now() });
    cliChecksInProgress.delete(cliName);
    return result;
  }).catch((err) => {
    cliChecksInProgress.delete(cliName);
    const fallback: CliCheckResult = {
      installed: false,
      error: err instanceof Error ? err.message : 'Check failed',
    };
    cliCache.set(cliName, { result: fallback, timestamp: Date.now() });
    return fallback;
  });

  cliChecksInProgress.set(cliName, promise);
  return promise;
}

// --- Individual CLI check functions ---

async function checkClaudeCodeCLI(): Promise<CliCheckResult> {
  try {
    const { stdout } = await execAsync('claude --version');
    const version = stdout.trim();
    return { installed: true, version };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'Failed to check CLI',
    };
  }
}

async function checkCodexCLI(): Promise<CliCheckResult> {
  const executable = process.platform === 'win32' ? 'codex.cmd' : 'codex';
  try {
    const { stdout } = await execAsync(`${executable} --version`);
    const version = stdout.trim();
    return { installed: true, version: version || 'installed' };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'Failed to check Codex CLI',
    };
  }
}

async function checkCursorCLI(): Promise<CliCheckResult> {
  const executable = process.platform === 'win32' ? 'cursor-agent.cmd' : 'cursor-agent';
  try {
    const { stdout, stderr } = await execAsync(`${executable} --version`);
    const output = `${stdout.trim()} ${stderr.trim()}`.trim();
    const version = output.length > 0 ? output : 'installed';
    return { installed: true, version };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'Failed to check Cursor CLI',
    };
  }
}

async function checkQwenCLI(): Promise<CliCheckResult> {
  const executable = process.platform === 'win32' ? 'qwen.cmd' : 'qwen';
  try {
    const { stdout } = await execAsync(`${executable} --version`);
    const version = stdout.trim();
    return { installed: true, version: version || 'installed' };
  } catch (error) {
    return {
      installed: false,
      error: error instanceof Error ? error.message : 'Failed to check Qwen CLI',
    };
  }
}

/**
 * GET /api/settings/cli-status
 * Check CLI installation status.
 * Supports ?refresh=true to bypass the 60-second cache.
 */
export async function GET(request: NextRequest) {
  try {
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    const [claudeStatus, codexStatus, cursorStatus, qwenStatus] = await Promise.all([
      getCachedCliStatus('claude', checkClaudeCodeCLI, forceRefresh),
      getCachedCliStatus('codex', checkCodexCLI, forceRefresh),
      getCachedCliStatus('cursor', checkCursorCLI, forceRefresh),
      getCachedCliStatus('qwen', checkQwenCLI, forceRefresh),
    ]);

    const status: CLIStatus = {
      claude: {
        installed: claudeStatus.installed,
        version: claudeStatus.version,
        checking: false,
        error: claudeStatus.error,
      },
      codex: {
        installed: codexStatus.installed,
        version: codexStatus.version,
        checking: false,
        error: codexStatus.error,
        models: CODEX_MODEL_DEFINITIONS.map(model => model.id),
      },
      cursor: {
        installed: cursorStatus.installed,
        version: cursorStatus.version,
        checking: false,
        error: cursorStatus.error,
        models: CURSOR_MODEL_DEFINITIONS.map((model) => model.id),
      },
      gemini: {
        installed: false,
        checking: false,
      },
      qwen: {
        installed: qwenStatus.installed,
        version: qwenStatus.version,
        checking: false,
        error: qwenStatus.error,
        models: QWEN_MODEL_DEFINITIONS.map((model) => model.id),
      },
      glm: {
        installed: claudeStatus.installed,
        version: claudeStatus.version,
        checking: false,
        error: claudeStatus.error,
        models: GLM_MODEL_DEFINITIONS.map((model) => model.id),
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('[API] Failed to check CLI status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check CLI status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
