/**
 * AgLoop Hook: subagent-tracker.mjs
 * Trigger: SubagentStart and SubagentStop (same script, different CLI arg).
 * Logs subagent lifecycle events to the audit log.
 */

import { join } from "node:path";
import {
  readStdin,
  writeStdout,
  readState,
  appendLog,
  ensureDir,
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
    // Determine action from CLI argument
    const cliArg = process.argv[2];
    const action =
      cliArg === "start" ? "subagent_started" : "subagent_completed";
    const actionLabel = cliArg === "start" ? "started" : "completed";

    // Read current state for context (non-fatal if unavailable)
    const state = await readState(workspaceFolder);
    const phase = state?.current_phase || "unknown";
    const taskId = input.taskId || state?.current_task_id || null;
    const agentName = input.agentName || "unknown";

    // Ensure .agloop directory exists
    await ensureDir(agloopDir);

    // Append log entry
    await appendLog(logPath, {
      timestamp,
      agent: "hook:subagent-tracker",
      action,
      task_id: taskId,
      phase,
      input_summary: `Subagent ${agentName} ${actionLabel}`,
      output_summary: "",
      status: "success",
    });

    // Output response — inject context for SubagentStart if applicable
    if (cliArg === "start" && agentName !== "unknown") {
      writeStdout({
        hookSpecificOutput: {
          hookEventName: "SubagentStart",
          additionalContext: `AgLoop context: phase=${phase}, task=${taskId || "none"}, agent=${agentName}`,
        },
      });
    } else {
      // Must include a non-reserved key so VS Code doesn't set output=undefined
      writeStdout({ hookSpecificOutput: {} });
    }
  } catch {
    // Never crash — must still include a non-reserved key
    writeStdout({ hookSpecificOutput: {} });
  }
}

main();
