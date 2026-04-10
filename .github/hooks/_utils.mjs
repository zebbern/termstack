/**
 * Shared utilities for AgLoop hook scripts.
 * All hook scripts import from this module.
 */

import {
  readFile,
  writeFile,
  readdir,
  mkdir,
  appendFile,
} from "node:fs/promises";
import { join, dirname } from "node:path";

// ── Constants ──────────────────────────────────────────────────────────────────

export const AGLOOP_DIR = ".agloop";
export const STATE_FILE = "state.json";
export const PLAN_FILE = "plan.yaml";
export const LOG_FILE = "log.json";
export const CHECKPOINTS_DIR = "checkpoints";

// ── stdin / stdout ─────────────────────────────────────────────────────────────

/**
 * Read all of stdin as a string, parse as JSON, and return the object.
 * Returns an empty object if stdin is empty or unparseable.
 *
 * Includes a safety timeout (default 3s) to prevent hanging if the parent
 * process never closes the stdin pipe. This ensures the hook always produces
 * stdout before VS Code's hook timeout kills the process.
 */
export function readStdin(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const chunks = [];
    let resolved = false;

    function finish(data) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(data);
    }

    function parseChunks() {
      const raw = chunks.join("");
      if (!raw.trim()) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }

    // Safety timeout — resolve with whatever data we've collected so far.
    // This prevents the hook from hanging if stdin is never closed.
    const timer = setTimeout(() => finish(parseChunks()), timeoutMs);

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => finish(parseChunks()));
    process.stdin.on("error", () => finish({}));

    // If stdin is already ended (piped empty), handle the edge case
    if (process.stdin.readableEnded) {
      finish(parseChunks());
    }
  });
}

/**
 * JSON.stringify data and write to stdout.
 */
export function writeStdout(data) {
  process.stdout.write(JSON.stringify(data) + "\n");
}

// ── File I/O ───────────────────────────────────────────────────────────────────

/**
 * Try to read and parse a JSON file. Returns fallback if the file doesn't exist
 * or can't be parsed.
 */
export async function safeReadJson(filePath, fallback = null) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

/**
 * Append a JSON log entry to the log file (JSON Lines format).
 * Creates the file and parent directory if they don't exist.
 */
export async function appendLog(logPath, entry) {
  try {
    await ensureDir(dirname(logPath));
    const line = JSON.stringify(entry) + "\n";
    await appendFile(logPath, line, "utf8");
  } catch {
    // Logging must never crash the hook
  }
}

/**
 * Read .agloop/state.json with error recovery.
 * If the main state file is corrupted, attempts to restore from the latest checkpoint.
 * Returns null if no state can be recovered.
 */
export async function readState(workspaceFolder) {
  const agloopDir = join(workspaceFolder, AGLOOP_DIR);
  const statePath = join(agloopDir, STATE_FILE);

  // Try reading the primary state file
  const state = await safeReadJson(statePath);
  if (
    state &&
    typeof state === "object" &&
    state.current_phase &&
    Array.isArray(state.tasks)
  ) {
    return state;
  }

  // State is missing or corrupted — try the latest checkpoint
  try {
    const checkpointsDir = join(agloopDir, CHECKPOINTS_DIR);
    const files = await readdir(checkpointsDir);
    const jsonFiles = files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    for (const file of jsonFiles) {
      const checkpoint = await safeReadJson(join(checkpointsDir, file));
      if (!checkpoint || typeof checkpoint !== "object") continue;
      // New format: state fields at root level with _checkpoint metadata
      if (checkpoint.current_phase && Array.isArray(checkpoint.tasks)) {
        const { _checkpoint, ...state } = checkpoint;
        return state;
      }
      // Legacy format: state nested under .state
      if (checkpoint.state?.current_phase) {
        return checkpoint.state;
      }
    }
  } catch {
    // No checkpoints available
  }

  return null;
}

// ── String Helpers ─────────────────────────────────────────────────────────────

/**
 * Truncate a string to maxLen characters. Appends "..." if truncated.
 */
export function truncate(str, maxLen) {
  if (typeof str !== "string") return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

// ── Directory Helpers ──────────────────────────────────────────────────────────

/**
 * Create a directory recursively if it does not exist.
 */
export async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch {
    // Directory already exists or cannot be created — non-fatal
  }
}
