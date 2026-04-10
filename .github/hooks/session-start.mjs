/**
 * AgLoop Hook: session-start.mjs
 * Trigger: SessionStart — fires when a new Copilot chat session begins.
 * Reads .agloop/state.json and injects context instructions for the agent.
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

async function main() {
  let input = {};
  try {
    input = await readStdin();
  } catch {
    // If stdin fails, continue with defaults
  }

  const workspaceFolder = input.cwd || input.workspaceFolder || process.cwd();
  const agloopDir = join(workspaceFolder, AGLOOP_DIR);
  const statePath = join(agloopDir, STATE_FILE);
  const logPath = join(agloopDir, LOG_FILE);
  const timestamp = new Date().toISOString();

  try {
    const state = await readState(workspaceFolder);

    if (state) {
      // Reset stop_hook_active for crash recovery
      state.stop_hook_active = false;

      // Write the corrected state back
      try {
        await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
      } catch {
        // Non-fatal — state may be read-only
      }

      // Calculate task progress
      const totalTasks = Array.isArray(state.tasks) ? state.tasks.length : 0;
      const doneTasks = Array.isArray(state.tasks)
        ? state.tasks.filter((t) => t.status === "done").length
        : 0;

      // Find current task title
      let currentTaskTitle = "";
      if (state.current_task_id && Array.isArray(state.tasks)) {
        const currentTask = state.tasks.find(
          (t) => t.id === state.current_task_id,
        );
        currentTaskTitle = currentTask ? currentTask.title : "";
      }

      // Compose last action info
      const lastAction = state.last_action
        ? `${state.last_action.action} by ${state.last_action.agent}`
        : "none";

      // Extract compaction context for richer recovery
      const cc = state.compaction_context || {};
      const compactionCount = cc.compaction_count || 0;
      const pendingDecision = cc.pending_decision || null;
      const lastDelegation = cc.last_delegation || {};

      // Build the instruction string
      const parts = [
        `AgLoop state loaded.`,
        `Phase: ${state.current_phase}.`,
        state.feature_name
          ? `Feature: ${truncate(state.feature_name, 200)}.`
          : null,
        `Progress: ${doneTasks}/${totalTasks} tasks.`,
        state.current_task_id
          ? `Current task: ${state.current_task_id}${currentTaskTitle ? " — " + truncate(currentTaskTitle, 100) : ""}.`
          : null,
        `Last action: ${lastAction}.`,
        compactionCount > 0
          ? `Context compacted ${compactionCount} time(s).`
          : null,
        pendingDecision
          ? `Pending decision: ${truncate(pendingDecision, 200)}.`
          : null,
        lastDelegation.agent
          ? `Last delegation: ${lastDelegation.agent} for ${lastDelegation.task_id || "none"}.`
          : null,
        `Read .agloop/state.json for full context including compaction_context. Resume from where you left off.`,
      ];

      const instructions = parts.filter(Boolean).join(" ");

      // Output the VS Code-native field first.
      // The flat `instructions` field is included as an optional compatibility aid.
      writeStdout({
        instructions,
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: instructions,
        },
      });

      // Append log entry
      await appendLog(logPath, {
        timestamp,
        agent: "hook:session-start",
        action: "state_loaded",
        task_id: state.current_task_id || null,
        phase: state.current_phase,
        input_summary: "Session started, existing state loaded",
        output_summary: truncate(instructions, 500),
        status: "success",
      });
    } else {
      // No state found
      const instructions =
        "No AgLoop state found. Ready for new task. User can start with /start or by describing a feature to build.";
      writeStdout({
        instructions,
        hookSpecificOutput: {
          hookEventName: "SessionStart",
          additionalContext: instructions,
        },
      });

      // Append log entry
      await appendLog(logPath, {
        timestamp,
        agent: "hook:session-start",
        action: "session_started",
        task_id: null,
        phase: "unknown",
        input_summary: "Session started, no existing state",
        output_summary: instructions,
        status: "success",
      });
    }
  } catch (err) {
    // Fail gracefully — never crash
    const errMsg = `AgLoop session-start encountered an error: ${err.message}. State may need manual inspection.`;
    writeStdout({
      instructions: errMsg,
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: errMsg,
      },
    });
  }
}

main();
