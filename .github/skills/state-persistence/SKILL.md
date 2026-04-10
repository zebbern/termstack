---
name: state-persistence
description: "Provides patterns for reading, writing, and recovering AgLoop state from state.json and plan.yaml. Includes checkpoint management and corruption recovery. Use when implementing state management logic or hook scripts."
disable-model-invocation: true
argument-hint: "State operation to perform (read, write, checkpoint, recover)"
tags:
  - agloop
  - state
  - json
  - checkpoint
  - recovery
  - persistence
---

# State Persistence

## When to Use This Skill

Load this skill when:

- Reading or writing `.agloop/state.json` (any agent, hook scripts)
- Implementing hook scripts that interact with state files
- Creating or restoring checkpoints (pre-compact hook, session-start hook)
- Recovering from corrupted or missing state
- Appending entries to `.agloop/log.json`
- Reading or validating `.agloop/plan.yaml`

## state.json Schema Reference

The single source of truth for the agentic loop's runtime state. Every agent reads it before acting. Only the coordinator mutates it.

### Field Reference

| Field                         | Type         | Required | Default             | Constraints                                                             |
| ----------------------------- | ------------ | -------- | ------------------- | ----------------------------------------------------------------------- |
| `$schema`                     | string       | yes      | `"agloop-state-v1"` | Literal value                                                           |
| `feature_name`                | string       | yes      | `""`                | Non-empty after init, max 500 chars                                     |
| `feature_description`         | string       | no       | `""`                | Set after research phase                                                |
| `complexity_level`             | enum         | yes      | `"medium"`          | `simple \| medium \| complex`. Set during init based on feature scope  |
| `current_phase`               | enum         | yes      | `"init"`            | `init \| research \| plan \| critique \| execute \| verify \| complete` |
| `iteration`                   | number       | yes      | `0`                 | 0 ≤ n ≤ 3                                                               |
| `current_task_id`             | string\|null | yes      | `null`              | Must reference existing task or null                                    |
| `tasks`                       | array        | yes      | `[]`                | Populated after plan phase                                              |
| `tasks[].id`                  | string       | yes      | —                   | Format: `task-NNN`                                                      |
| `tasks[].title`               | string       | yes      | —                   | Deliverable-focused                                                     |
| `tasks[].description`         | string       | yes      | —                   | Detailed requirements                                                   |
| `tasks[].status`              | enum         | yes      | `"pending"`         | `pending \| in_progress \| done \| failed`                             |
| `tasks[].depends_on`          | string[]     | yes      | `[]`                | All referenced IDs must exist                                           |
| `tasks[].acceptance_criteria` | string[]     | yes      | —                   | ≥1 criterion per task                                                   |
| `tasks[].failure_modes`       | object[]     | yes      | `[]`                | Each: mode, likelihood, impact, mitigation                              |
| `tasks[].result`              | object\|null | yes      | `null`              | Set by executor                                                         |
| `tasks[].verification`        | object\|null | yes      | `null`              | Set by verifier                                                         |
| `stop_hook_active`            | boolean      | yes      | `false`             | Prevents infinite stop-hook loops                                       |
| `last_action`                 | object       | yes      | —                   | Updated on every agent action                                           |
| `last_action.agent`           | string       | yes      | —                   | Which agent performed the action                                        |
| `last_action.action`          | string       | yes      | —                   | What was done                                                           |
| `last_action.timestamp`       | string       | yes      | —                   | ISO 8601                                                                |
| `last_action.task_id`         | string\|null | yes      | —                   | Related task or null                                                    |
| `phase_history`               | array        | yes      | `[]`                | Append-only phase transitions                                           |
| `retry_count`                 | object       | yes      | `{}`                | Keys: task IDs, values: integers ≥ 0                                    |
| `previous_objections`         | array        | yes      | `[]`                | Critic objections from plan↔critique loop. Each: `{ iteration, objection, response, resolved, objection_category, severity }`. Reset on new plan phase |
| `compaction_context`          | object       | yes      | —                   | Recovery context for compaction survival. Sub-fields: `last_delegation`, `last_result_summary`, `research_digest`, `plan_digest`, `critique_digest`, `pending_decision`, `compaction_count` |

### Task Result Schema

Set by the executor after task completion:

```json
{
  "files_modified": ["src/api/search.ts", "src/api/search.test.ts"],
  "files_deleted": [],
  "acceptance_criteria_confirmation": [
    {
      "criterion": "GET /api/search returns 200 with results array",
      "met": true,
      "evidence": "Handler returns res.json({ data: results, meta: { total, page }, error: null })"
    }
  ],
  "summary": "Implemented search endpoint with pagination and filtering",
  "warnings": [],
  "verified": false
}
```

### Task Verification Schema

Set by the verifier after task verification:

```json
{
  "verdict": "PASS",
  "criteria_results": [
    {
      "criterion": "GET /api/search returns 200 with results array",
      "result": "pass",
      "evidence": "Response: { results: [...], total: 42, page: 1 }"
    }
  ],
  "specification_compliance": {
    "required_patterns": { "compliant": true, "violations": [] },
    "forbidden_patterns": { "compliant": true, "violations": [] },
    "tech_choices": { "compliant": true, "violations": [] }
  },
  "overall_summary": "All acceptance criteria met, specification compliant"
}
```

On FAIL, the verifier adds a `failure_details` field with specific failure information.
```

## Read-Modify-Write Pattern

**Every state mutation must follow this exact pattern.** Never read and write without validation.

### Step-by-Step Procedure

```javascript
// 1. READ — Load current state from disk
const raw = await fs.readFile(".agloop/state.json", "utf-8");

// 2. PARSE — Convert to object with error handling
let state;
try {
  state = JSON.parse(raw);
} catch (err) {
  // State corrupted — attempt checkpoint recovery
  return await recoverFromCheckpoint(workspaceFolder);
}

// 3. VALIDATE — Confirm state structure before using
if (!state.$schema || state.$schema !== "agloop-state-v1") {
  throw new Error("Invalid state schema version");
}
if (
  ![
    "init",
    "research",
    "plan",
    "critique",
    "execute",
    "verify",
    "complete",
  ].includes(state.current_phase)
) {
  throw new Error(`Invalid phase: ${state.current_phase}`);
}

// 4. MODIFY — Apply changes to the in-memory object
state.current_phase = "execute";
state.current_task_id = "task-001";
state.last_action = {
  agent: "agloop",
  action: "phase_transition",
  timestamp: new Date().toISOString(),
  task_id: "task-001",
};
state.phase_history.push({
  phase: "execute",
  entered_at: new Date().toISOString(),
  exited_at: null,
});

// 5. VALIDATE AGAIN — Confirm changes are consistent
if (state.current_task_id) {
  const taskExists = state.tasks.some((t) => t.id === state.current_task_id);
  if (!taskExists) throw new Error(`Task ${state.current_task_id} not found`);
}

// 6. WRITE ATOMICALLY — Write to temp file, then rename
const tmpPath = ".agloop/state.json.tmp";
await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), "utf-8");
await fs.rename(tmpPath, ".agloop/state.json");
```

### Critical Rules

- **Never write without reading first** — always base writes on current disk state
- **Double-validate** — validate before modification AND before writing
- **Atomic writes** — write to `.tmp` file then rename to prevent corruption on crash
- **No partial updates** — always write the complete state object

## plan.yaml Schema Reference

Produced by the Planner agent, consumed by Coordinator, Critic, Executor, and Verifier.

### Field Reference

| Field                               | Type   | Required | Constraints                                                     |
| ----------------------------------- | ------ | -------- | --------------------------------------------------------------- |
| `plan_id`                           | string | yes      | Format: `plan-YYYYMMDD-HHmmss`                                  |
| `feature`                           | string | yes      | Non-empty, verbatim user request                                |
| `created_at`                        | string | yes      | ISO 8601                                                        |
| `updated_at`                        | string | yes      | ISO 8601, ≥ created_at                                          |
| `status`                            | enum   | yes      | `draft \| under_review \| approved \| in_progress \| completed` |
| `pre_mortem.overall_risk_level`     | enum   | yes      | `low \| medium \| high \| critical`                             |
| `pre_mortem.critical_failure_modes` | array  | yes      | ≥1 entry                                                        |
| `pre_mortem.assumptions`            | array  | yes      | ≥1 entry                                                        |
| `tasks`                             | array  | yes      | ≥1 task                                                         |
| `tasks[].id`                        | string | yes      | Format: `task-NNN`, unique                                      |
| `tasks[].depends_on`                | array  | yes      | All referenced IDs must exist                                   |
| `tasks[].acceptance_criteria`       | array  | yes      | ≥1 criterion per task                                           |
| `tasks[].estimated_effort`          | enum   | yes      | `small \| medium \| large`                                      |
| `dag_edges`                         | array  | yes      | Each edge: `[from_id, to_id]`, both must exist                  |
| `critique_history`                  | array  | yes      | Empty initially                                                 |

## log.json Append Pattern

The execution log uses **JSON Lines format** — one JSON object per line, no surrounding array. This enables efficient appending without reading the entire file.

### Append Procedure

```javascript
// CORRECT: Append a single line to log.json (JSON Lines format)
async function appendLog(logPath, entry) {
  // Ensure required fields
  const logEntry = {
    timestamp: entry.timestamp || new Date().toISOString(),
    agent: entry.agent,
    action: entry.action,
    task_id: entry.task_id || null,
    phase: entry.phase,
    input_summary: truncate(entry.input_summary || "", 500),
    output_summary: truncate(entry.output_summary || "", 500),
    status: entry.status || "success",
    ...(entry.metadata ? { metadata: entry.metadata } : {}),
  };

  // Append as a single line — do NOT overwrite
  const line = JSON.stringify(logEntry) + "\n";
  await fs.appendFile(logPath, line, "utf-8");
}

// WRONG: Do NOT do this — it reads and rewrites the entire file
// const log = JSON.parse(await fs.readFile(logPath));
// log.push(entry);
// await fs.writeFile(logPath, JSON.stringify(log));
```

### Log Entry Fields

| Field            | Type         | Required | Constraints                     |
| ---------------- | ------------ | -------- | ------------------------------- |
| `timestamp`      | string       | yes      | ISO 8601 with milliseconds      |
| `agent`          | string       | yes      | Agent or hook identifier        |
| `action`         | string       | yes      | One of the defined action types |
| `task_id`        | string\|null | yes      | Existing task ID or null        |
| `phase`          | string       | yes      | Current phase name              |
| `input_summary`  | string       | yes      | Max 500 chars                   |
| `output_summary` | string       | yes      | Max 500 chars                   |
| `status`         | enum         | yes      | `success \| failure \| skipped` |
| `metadata`       | object       | no       | Free-form key-value pairs       |

### Reading Log Entries

```javascript
// Read JSON Lines file
async function readLog(logPath) {
  const raw = await fs.readFile(logPath, "utf-8");
  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}
```

## Checkpoint Management

### When to Create Checkpoints

| Trigger                                  | Checkpoint Type    | Created By              |
| ---------------------------------------- | ------------------ | ----------------------- |
| Phase transition (e.g., plan → critique) | `phase-transition` | Coordinator             |
| Pre-compaction event                     | `pre-compact`      | pre-compact hook script |
| User invokes /reset                      | `reset`            | Coordinator             |

### Checkpoint File Format

Location: `.agloop/checkpoints/{type}-{ISO-timestamp}.json`

```json
{
  "checkpoint_type": "phase-transition",
  "timestamp": "2026-03-01T14:45:00.000Z",
  "trigger": "phase: plan → critique",
  "state": {
    "...full state.json contents at time of checkpoint"
  },
  "plan_summary": {
    "status": "under_review",
    "task_count": 5,
    "completed_count": 0
  },
  "human_summary": "Phase: critique, Feature: Add search API, Progress: 0/5 tasks"
}
```

### Checkpoint Creation Procedure

```javascript
async function createCheckpoint(workspaceFolder, type, trigger) {
  const checkpointDir = path.join(workspaceFolder, ".agloop", "checkpoints");
  await fs.mkdir(checkpointDir, { recursive: true });

  const state = JSON.parse(
    await fs.readFile(
      path.join(workspaceFolder, ".agloop", "state.json"),
      "utf-8",
    ),
  );

  const doneTasks = state.tasks.filter((t) => t.status === "done").length;
  const checkpoint = {
    checkpoint_type: type,
    timestamp: new Date().toISOString(),
    trigger: trigger,
    state: state,
    plan_summary: {
      status: state.current_phase,
      task_count: state.tasks.length,
      completed_count: doneTasks,
    },
    human_summary: `Phase: ${state.current_phase}, Feature: ${state.feature_name}, Progress: ${doneTasks}/${state.tasks.length} tasks`,
  };

  const filename = `${type}-${checkpoint.timestamp.replace(/[:.]/g, "-")}.json`;
  await fs.writeFile(
    path.join(checkpointDir, filename),
    JSON.stringify(checkpoint, null, 2),
    "utf-8",
  );

  // Prune old checkpoints
  await pruneCheckpoints(checkpointDir);
}
```

### Retention Policy

- Keep the **10 most recent** checkpoints (any type). If fewer than 5 of these are `reset` checkpoints, retain additional older `reset` checkpoints until at least 5 are preserved (total may exceed 10).
- Compact older checkpoints when creating a new one by deleting beyond the retention limit.

### Compaction Procedure

```javascript
async function compactCheckpoints(checkpointDir) {
  const files = await fs.readdir(checkpointDir);
  const checkpoints = [];

  for (const file of files) {
    const content = JSON.parse(
      await fs.readFile(path.join(checkpointDir, file), "utf-8"),
    );
    checkpoints.push({
      file,
      type: content.checkpoint_type,
      timestamp: content.timestamp,
    });
  }

  // Sort by timestamp descending (newest first)
  checkpoints.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Step 1: Keep the 10 most recent of any type
  const kept = new Set(checkpoints.slice(0, 10).map((c) => c.file));

  // Step 2: Ensure at least 5 reset checkpoints are preserved
  const keptResets = checkpoints.filter(
    (c) => kept.has(c.file) && c.type === "reset",
  ).length;
  if (keptResets < 5) {
    const additionalResets = checkpoints
      .filter((c) => !kept.has(c.file) && c.type === "reset")
      .slice(0, 5 - keptResets);
    for (const r of additionalResets) {
      kept.add(r.file);
    }
  }

  // Step 3: Delete everything not in the kept set
  for (const { file } of checkpoints) {
    if (!kept.has(file)) {
      await fs.unlink(path.join(checkpointDir, file));
    }
  }
}
```

## Recovery Procedures

### State Corrupted (JSON parse fails)

```
1. List files in .agloop/checkpoints/
2. Sort by timestamp descending (newest first)
3. For each checkpoint (newest to oldest):
   a. Parse checkpoint JSON
   b. If valid → restore checkpoint.state to .agloop/state.json
   c. Log recovery action
   d. Output: "State recovered from checkpoint {timestamp}"
   e. STOP
4. If no valid checkpoint found:
   a. Create fresh initial state
   b. Log: "State corrupted, no valid checkpoints, starting fresh"
   c. Set current_phase = "init"
```

### Plan Missing (plan.yaml not found)

```
1. Check current_phase in state.json
2. If phase is plan, critique, execute, or verify:
   a. Set current_phase = "plan" in state.json
   b. Log: "Plan missing, returning to plan phase"
   c. Coordinator will re-delegate to Planner
3. If phase is init or research:
   a. No action needed — plan hasn't been created yet
4. If phase is complete:
  a. No action needed for the plan itself — plan execution is finished
  b. The session may still remain active until the user stops it
```

### Log Corrupted (invalid JSON Lines)

```
1. Attempt to read line by line
2. Skip invalid lines, keep valid entries
3. If entire file is corrupt or empty:
   a. Rename to log.json.corrupt.{timestamp}
   b. Create fresh log.json
   c. Append recovery entry: { action: "log_recovered", ... }
4. Do NOT block operations — logging is non-critical
```

## Initial State Template

Use this template when creating a fresh `.agloop/state.json`:

```json
{
  "$schema": "agloop-state-v1",
  "feature_name": "",
  "feature_description": "",
  "current_phase": "init",
  "iteration": 0,
  "current_task_id": null,
  "tasks": [],
  "stop_hook_active": false,
  "last_action": {
    "agent": "agloop",
    "action": "initialized",
    "timestamp": "",
    "task_id": null
  },
  "phase_history": [],
  "retry_count": {}
}
```

**Note:** Set `last_action.timestamp` to the current ISO 8601 timestamp when creating.

## Verification

State operations are correct when:

1. **Schema compliance**: Every state.json write includes all required fields with correct types
2. **Phase validity**: `current_phase` is always one of the 7 valid phases
3. **Task references**: `current_task_id` always references an existing task or is null
4. **Dependency integrity**: All `depends_on` IDs reference existing tasks
5. **Append-only log**: `log.json` is never overwritten — only appended to
6. **Atomic writes**: State writes use temp file + rename pattern
7. **Double validation**: State is validated before modification AND before writing
8. **Checkpoint created**: Checkpoints exist for every phase transition and pre-compaction
9. **Recovery works**: If state.json is deleted, the latest checkpoint can restore it
10. **No data loss**: Phase history is append-only, retry counts only increment
