/**
 * AgLoop Hook: stop-guard.mjs
 * Trigger: Stop — fires when the agent attempts to end its turn.
 * THIS IS THE MOST CRITICAL SCRIPT — it prevents autonomous session termination.
 *
 * Exit code 0 = allow stop
 * Exit code 2 = block stop (VS Code convention)
 */

import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import {
  readStdin,
  writeStdout,
  readState,
  safeReadJson,
  appendLog,
  truncate,
  AGLOOP_DIR,
  STATE_FILE,
  LOG_FILE,
} from "./_utils.mjs";

/**
 * Write state.json to disk. Non-fatal on failure.
 */
async function writeState(statePath, state) {
  try {
    await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Non-fatal — state write failure should not crash the hook
  }
}

/**
 * Allow stop: reset stop_hook_active, write state, output allow, exit 0.
 * Output format follows the VS Code hookSpecificOutput wrapper (2026 docs)
 * and also includes equivalent flat fields when harmless.
 */
async function allowStop(statePath, state, logPath, timestamp, reason) {
  if (state) {
    state.stop_hook_active = false;
    await writeState(statePath, state);
  }

  writeStdout({
    decision: "allow",
    hookSpecificOutput: {
      hookEventName: "Stop",
      decision: "allow",
      reason: reason || "Stop allowed",
    },
  });

  await appendLog(logPath, {
    timestamp,
    agent: "hook:stop-guard",
    action: "stop_allowed",
    task_id: state?.current_task_id || null,
    phase: state?.current_phase || "unknown",
    input_summary: "Stop event received",
    output_summary: reason || "Stop allowed",
    status: "success",
  });

  process.exit(0);
}

/**
 * Block stop: output block with reason, exit 2.
 * Output format follows the VS Code hookSpecificOutput wrapper (2026 docs)
 * and also includes equivalent flat fields when harmless.
 */
async function blockStop(state, logPath, timestamp, reason) {
  writeStdout({
    decision: "block",
    reason,
    hookSpecificOutput: {
      hookEventName: "Stop",
      decision: "block",
      reason,
    },
  });

  await appendLog(logPath, {
    timestamp,
    agent: "hook:stop-guard",
    action: "stop_blocked",
    task_id: state?.current_task_id || null,
    phase: state?.current_phase || "unknown",
    input_summary: "Stop event received",
    output_summary: truncate(reason, 500),
    status: "success",
  });

  process.exit(2);
}

async function main() {
  let input = {};
  try {
    input = await readStdin();
  } catch {
    // Continue with defaults
  }

  const workspaceFolder = input.cwd || input.workspaceFolder || process.cwd();
  const agloopDir = join(workspaceFolder, AGLOOP_DIR);
  const statePath = join(agloopDir, STATE_FILE);
  const logPath = join(agloopDir, LOG_FILE);
  const timestamp = new Date().toISOString();

  try {
    // Step 1-2: Check if state.json exists
    const state = await safeReadJson(statePath);

    if (!state || typeof state !== "object" || !state.current_phase) {
      // No valid state → allow stop
      writeStdout({
        hookSpecificOutput: {
          hookEventName: "Stop",
          decision: "allow",
          reason: "No valid AgLoop state found",
        },
      });
      process.exit(0);
      return;
    }

    // Step 4: Check stop_hook_active from BOTH stdin (VS Code native) and state.json
    // VS Code provides stop_hook_active in hook input per 2026 docs.
    // Our state.json flag is a custom fallback mechanism.
    if (input.stop_hook_active === true || state.stop_hook_active === true) {
      await allowStop(
        statePath,
        state,
        logPath,
        timestamp,
        "stop_hook_active was true — escape hatch triggered",
      );
      return;
    }

    // Step 5: Set stop_hook_active = true and write to disk
    state.stop_hook_active = true;
    await writeState(statePath, state);

    const tasks = Array.isArray(state.tasks) ? state.tasks : [];

    if (state.current_phase === "init" && tasks.length === 0) {
      await allowStop(
        statePath,
        state,
        logPath,
        timestamp,
        "Phase is init with no tasks — no work started",
      );
      return;
    }

    // Step 7: Count remaining tasks
    const remaining = tasks.filter((t) => t.status !== "done").length;

    if (remaining > 0) {
      const reason = `AgLoop: ${remaining} tasks remaining. Current phase: ${state.current_phase}. Current task: ${state.current_task_id || "none"}. The agentic loop must continue — read .agloop/state.json and resume.`;
      await blockStop(state, logPath, timestamp, reason);
      return;
    }

    const reason =
      state.current_phase === "complete" || remaining === 0
        ? "AgLoop: work appears complete, but the session must remain active until the user stops it. Summarize through Discord, use discord_ask, and wait. A subsequent stop attempt will use the escape hatch."
        : `AgLoop: ${remaining} tasks remaining. Current phase: ${state.current_phase}. Current task: ${state.current_task_id || "none"}. The agentic loop must continue — read .agloop/state.json and resume.`;

    await blockStop(state, logPath, timestamp, reason);
  } catch (err) {
    // Error handling: fail-open to prevent lock-in
    writeStdout({
      hookSpecificOutput: {
        hookEventName: "Stop",
        decision: "allow",
        reason: `Error in stop-guard: ${err.message}. Failing open.`,
      },
    });

    await appendLog(logPath, {
      timestamp,
      agent: "hook:stop-guard",
      action: "stop_allowed",
      task_id: null,
      phase: "unknown",
      input_summary: "Stop event received",
      output_summary: `Error in stop-guard: ${err.message}. Failing open (allowing stop).`,
      status: "failure",
    });

    process.exit(0);
  }
}

main();
