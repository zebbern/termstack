/**
 * AgLoop Hook: audit-logger.mjs
 * Trigger: UserPromptSubmit — fires when the user sends a chat message.
 * Logs the prompt to the audit trail. NEVER fails — must not block the user.
 */

import { join } from "node:path";
import {
  readStdin,
  writeStdout,
  readState,
  appendLog,
  ensureDir,
  truncate,
  AGLOOP_DIR,
  LOG_FILE,
} from "./_utils.mjs";

async function main() {
  let input = {};
  try {
    input = await readStdin();
  } catch {
    // Continue with defaults
  }

  const workspaceFolder = input.cwd || input.workspaceFolder || process.cwd();
  const agloopDir = join(workspaceFolder, AGLOOP_DIR);
  const logPath = join(agloopDir, LOG_FILE);
  const timestamp = new Date().toISOString();

  try {
    // Read current state for context (non-fatal if unavailable)
    const state = await readState(workspaceFolder);
    const phase = state?.current_phase || "unknown";
    const taskId = state?.current_task_id || null;

    const prompt = input.prompt || "";

    // Ensure .agloop directory exists
    await ensureDir(agloopDir);

    // Append log entry with truncated prompt
    await appendLog(logPath, {
      timestamp,
      agent: "hook:audit-logger",
      action: "prompt_received",
      task_id: taskId,
      phase,
      input_summary: truncate(prompt, 500),
      output_summary: "",
      status: "success",
      metadata: {
        prompt_length: prompt.length,
      },
    });

    // Output minimal response — must have a non-reserved key to prevent
    // VS Code from setting output=undefined (which crashes onSuccess handler)
    writeStdout({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: "Prompt logged" } });
  } catch {
    // NEVER fail — audit logging must not block the user
    writeStdout({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: "Logging failed (non-fatal)" } });
  }
}

main();
