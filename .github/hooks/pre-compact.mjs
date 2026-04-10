/**
 * AgLoop Hook: pre-compact.mjs
 * Trigger: PreCompact — fires before VS Code truncates conversation context.
 * Creates a checkpoint of the current state and injects recovery instructions.
 */

import { join } from "node:path";
import { readFile, writeFile, readdir, unlink } from "node:fs/promises";
import {
  readStdin,
  writeStdout,
  readState,
  safeReadJson,
  appendLog,
  ensureDir,
  truncate,
  AGLOOP_DIR,
  STATE_FILE,
  PLAN_FILE,
  LOG_FILE,
  CHECKPOINTS_DIR,
} from "./_utils.mjs";

/**
 * Prune old checkpoints: keep the 10 most recent (any type), then pad to
 * at least 5 reset checkpoints by retaining additional older resets.
 */
async function pruneCheckpoints(checkpointsDir) {
  try {
    const files = await readdir(checkpointsDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

    const all = [];
    for (const file of jsonFiles) {
      const checkpoint = await safeReadJson(join(checkpointsDir, file));
      // Support both new format (_checkpoint.type) and legacy (checkpoint_type)
      const cpType =
        checkpoint?._checkpoint?.type || checkpoint?.checkpoint_type;
      all.push({ file, type: cpType || "unknown" });
    }

    // Sort by filename descending (newest first — filenames are timestamp-based)
    all.sort((a, b) => b.file.localeCompare(a.file));

    // Step 1: Keep the 10 most recent of any type
    const kept = new Set(all.slice(0, 10).map((c) => c.file));

    // Step 2: Ensure at least 5 reset checkpoints are kept
    const keptResets = all.filter(
      (c) => kept.has(c.file) && c.type === "reset",
    ).length;
    if (keptResets < 5) {
      const additionalResets = all
        .filter((c) => !kept.has(c.file) && c.type === "reset")
        .slice(0, 5 - keptResets);
      for (const r of additionalResets) {
        kept.add(r.file);
      }
    }

    // Step 3: Delete everything not in the kept set
    for (const { file } of all) {
      if (!kept.has(file)) {
        try {
          await unlink(join(checkpointsDir, file));
        } catch {
          // Non-fatal
        }
      }
    }
  } catch {
    // Non-fatal — compaction is best-effort
  }
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
  const logPath = join(agloopDir, LOG_FILE);
  const checkpointsDir = join(agloopDir, CHECKPOINTS_DIR);
  const timestamp = new Date().toISOString();
  // VS Code provides transcript_path in hook input (2026 docs) — path to full
  // conversation history JSON. We can extract recent turns for richer context.
  const transcriptPath = input.transcript_path || null;

  try {
    const state = await readState(workspaceFolder);

    if (!state) {
      writeStdout({
        continue: true,
        instructions: "No AgLoop state to checkpoint.",
        systemMessage: "No AgLoop state to checkpoint.",
      });
      return;
    }

    // Calculate task progress
    const totalTasks = Array.isArray(state.tasks) ? state.tasks.length : 0;
    const doneTasks = Array.isArray(state.tasks)
      ? state.tasks.filter((t) => t.status === "done").length
      : 0;

    // Find current task info
    let currentTaskTitle = "";
    if (state.current_task_id && Array.isArray(state.tasks)) {
      const currentTask = state.tasks.find(
        (t) => t.id === state.current_task_id,
      );
      currentTaskTitle = currentTask ? currentTask.title : "";
    }

    // Increment compaction count in state
    if (!state.compaction_context) {
      state.compaction_context = {
        last_delegation: {
          agent: null,
          task_id: null,
          delegation_summary: null,
          expected_output: null,
        },
        last_result_summary: null,
        research_digest: null,
        plan_digest: null,
        critique_digest: null,
        pending_decision: null,
        compaction_count: 0,
      };
    }
    state.compaction_context.compaction_count =
      (state.compaction_context.compaction_count || 0) + 1;

    // Write updated state back (with incremented compaction count)
    const statePath = join(agloopDir, STATE_FILE);
    try {
      await writeFile(statePath, JSON.stringify(state, null, 2), "utf8");
    } catch {
      // Non-fatal — state write failure should not crash the hook
    }

    // Create checkpoint directory
    await ensureDir(checkpointsDir);

    // Extract last conversation turns from transcript (if available)
    // VS Code provides transcript_path in hook input — full conversation JSON.
    // We extract the last few assistant messages to preserve recent reasoning.
    let recentTurns = null;
    if (transcriptPath) {
      try {
        const transcriptRaw = await readFile(transcriptPath, "utf8");
        const transcript = JSON.parse(transcriptRaw);
        // Extract last 3 assistant messages (compressed) for recovery context
        const assistantMsgs = (Array.isArray(transcript) ? transcript : [])
          .filter(
            (t) => t.role === "assistant" && typeof t.content === "string",
          )
          .slice(-3)
          .map((t) => truncate(t.content, 300));
        if (assistantMsgs.length > 0) {
          recentTurns = assistantMsgs;
        }
      } catch {
        // Non-fatal — transcript may not exist or be readable
      }
    }

    // Write checkpoint file
    // Filename format per state-protocol Section 4: {type}-{YYYYMMDD-HHmmss}.json
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, "0");
    const isoTs = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
    const checkpointFilename = `pre-compact-${isoTs}.json`;
    // Checkpoint structure per state-protocol Section 4:
    // Full state at root level + _checkpoint metadata wrapper
    const checkpoint = {
      _checkpoint: {
        type: "pre-compact",
        trigger: "pre-compact event",
        created_at: timestamp,
        human_summary: `Phase: ${state.current_phase}, Task: ${state.current_task_id || "none"}, Progress: ${doneTasks}/${totalTasks}`,
        plan_summary: {
          status: state.current_phase || "unknown",
          task_count: totalTasks,
          completed_count: doneTasks,
        },
        recent_turns: recentTurns,
      },
      ...state,
    };

    try {
      await writeFile(
        join(checkpointsDir, checkpointFilename),
        JSON.stringify(checkpoint, null, 2),
        "utf8",
      );
    } catch {
      // Write failed — continue with in-memory state for instructions
    }

    // Prune old checkpoints
    await pruneCheckpoints(checkpointsDir);

    // Compose recovery instruction
    const lastAction = state.last_action
      ? `${state.last_action.action} by ${state.last_action.agent}`
      : "none";

    const cc = state.compaction_context || {};
    const lastDelegation = cc.last_delegation
      ? `${cc.last_delegation.agent || "none"} for ${cc.last_delegation.task_id || "none"}: ${truncate(cc.last_delegation.delegation_summary || "no summary", 150)}`
      : "none";
    const pendingDecision = cc.pending_decision
      ? truncate(cc.pending_decision, 200)
      : "none";
    const compactionNum = cc.compaction_count || 1;

    const instructions = [
      `AGLOOP STATE RECOVERY (compaction #${compactionNum}):`,
      `- Feature: ${state.feature_name || "unnamed"}`,
      `- Phase: ${state.current_phase}`,
      `- Progress: ${doneTasks}/${totalTasks} tasks complete`,
      state.current_task_id
        ? `- Current Task: ${state.current_task_id} — ${truncate(currentTaskTitle, 100)}`
        : "- Current Task: none",
      `- Last Action: ${lastAction}`,
      `- Last Delegation: ${lastDelegation}`,
      `- Pending Decision: ${pendingDecision}`,
      `- Last Result: ${truncate(cc.last_result_summary || "none", 200)}`,
      cc.research_digest
        ? `- Research Digest: ${truncate(cc.research_digest, 200)}`
        : null,
      cc.plan_digest
        ? `- Plan Digest: ${truncate(typeof cc.plan_digest === "string" ? cc.plan_digest : JSON.stringify(cc.plan_digest), 200)}`
        : null,
      cc.critique_digest
        ? `- Critique Digest: ${truncate(typeof cc.critique_digest === "string" ? cc.critique_digest : JSON.stringify(cc.critique_digest), 200)}`
        : null,
      "- CRITICAL: Read .agloop/state.json IMMEDIATELY. It contains compaction_context with full recovery data.",
      "- Plan file: .agloop/plan.yaml | Research file: .agloop/research_findings.json",
      "- Resume the agentic loop from the current phase. Do NOT restart from init.",
    ]
      .filter(Boolean)
      .join("\n");

    // Output follows VS Code PreCompact API (continue + systemMessage) and
    // hookSpecificOutput wrapper for consistency with other AgLoop hooks.
    writeStdout({
      continue: true,
      instructions,
      systemMessage: instructions,
      hookSpecificOutput: {
        hookEventName: "PreCompact",
        additionalContext: instructions,
      },
    });

    // Append log entry
    await appendLog(logPath, {
      timestamp,
      agent: "hook:pre-compact",
      action: "checkpoint_created",
      task_id: state.current_task_id || null,
      phase: state.current_phase,
      input_summary: "Pre-compact checkpoint triggered",
      output_summary: `Checkpoint saved: ${checkpointFilename}. ${doneTasks}/${totalTasks} tasks done.`,
      status: "success",
    });
  } catch (err) {
    // Fail gracefully
    const errMsg = `AgLoop pre-compact encountered an error: ${err.message}. State may need manual inspection.`;
    writeStdout({
      continue: true,
      instructions: errMsg,
      systemMessage: errMsg,
    });
  }
}

main();
