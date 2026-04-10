---
applyTo: "**/.agloop/**,**/.github/hooks/**"
---

# State Protocol — `.agloop/state.json` Management

These rules govern how agents interact with the AgLoop runtime state. State management is foundational — errors here cascade to every phase.

---

## 1. STATE_FILE_FORMAT

The `.agloop/state.json` file conforms to `agloop-state-v1`. All agents working with state must know this schema.

### Schema Fields

| Field                 | Type           | Required | Default             | Constraints                                                                                                                                                                                          |
| --------------------- | -------------- | -------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$schema`             | string         | yes      | `"agloop-state-v1"` | Literal value, used for version detection                                                                                                                                                            |
| `feature_name`        | string         | yes      | `""`                | Non-empty after init phase, max 500 chars                                                                                                                                                            |
| `feature_description` | string         | no       | `""`                | Set after research phase completes                                                                                                                                                                   |
| `complexity_level`    | enum           | yes      | `"medium"`          | One of: `simple`, `medium`, `complex`. Set during init based on feature scope                                                                                                                        |
| `mode`                | enum           | no       | `"standard"`        | One of: `standard`, `ctf`. When `ctf`, the lifecycle skips to `ctf_delegate` phase                                                                                                                   |
| `current_phase`       | enum           | yes      | `"init"`            | One of: `init`, `research`, `plan`, `critique`, `execute`, `verify`, `complete`, `ctf_delegate`                                                                                                      |
| `iteration`           | number         | yes      | `0`                 | Range: 0 ≤ n ≤ 3. Tracks plan↔critique loop count                                                                                                                                                    |
| `current_task_id`     | string \| null | yes      | `null`              | Must reference an existing task ID or be null                                                                                                                                                        |
| `tasks`               | array          | yes      | `[]`                | Populated after plan phase. See Task sub-schema below                                                                                                                                                |
| `stop_hook_active`    | boolean        | yes      | `false`             | True while stop hook is firing (prevents infinite loops)                                                                                                                                             |
| `last_action`         | object         | yes      | —                   | Updated on every agent action. Fields: `agent`, `action`, `timestamp`, `task_id`                                                                                                                     |
| `phase_history`       | array          | yes      | `[]`                | Append-only. Each entry: `{ phase, entered_at, exited_at }`                                                                                                                                          |
| `retry_count`         | object         | yes      | `{}`                | Keys are task IDs (e.g. `"task-001"`), values are integers ≥ 0                                                                                                                                       |
| `previous_objections` | array          | yes      | `[]`                | Critic objections from plan↔critique loop. Each: `{ iteration, objection, response, resolved, objection_category, severity }`. Reset on new plan phase                                               |
| `compaction_context`  | object         | yes      | —                   | Recovery context for surviving context compaction. Sub-fields: `last_delegation`, `last_result_summary`, `research_digest`, `plan_digest`, `critique_digest`, `pending_decision`, `compaction_count` |

### Task Sub-Schema

Each entry in the `tasks` array:

| Field                     | Type           | Required | Constraints                                                                                                                    |
| ------------------------- | -------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`                      | string         | yes      | Format: `task-NNN` (zero-padded to 3 digits)                                                                                   |
| `title`                   | string         | yes      | Deliverable-focused, non-empty                                                                                                 |
| `description`             | string         | yes      | Detailed requirements for the implementer                                                                                      |
| `status`                  | enum           | yes      | One of: `pending`, `in_progress`, `done`, `failed`                                                                             |
| `depends_on`              | string[]       | yes      | All referenced IDs must exist in the tasks array                                                                               |
| `acceptance_criteria`     | string[]       | yes      | At least 1 criterion per task                                                                                                  |
| `failure_modes`           | array          | yes      | Each: `{ mode, likelihood, impact, mitigation }`                                                                               |
| `specification_adherence` | object         | yes      | `{ required_patterns: [], forbidden_patterns: [], tech_choices: [] }`                                                          |
| `files_to_modify`         | string[]       | yes      | File paths the executor should create/modify                                                                                   |
| `files_to_read`           | string[]       | yes      | Context files the executor should read                                                                                         |
| `estimated_effort`        | string         | yes      | One of: `small`, `medium`, `large`                                                                                             |
| `result`                  | object \| null | yes      | Set by executor. `{ files_modified, files_deleted, acceptance_criteria_confirmation, summary, warnings, verified }`            |
| `verification`            | object \| null | yes      | Set by verifier. PASS: `{ verdict, criteria_results, specification_compliance, overall_summary }`. FAIL adds `failure_details` |

---

## 2. READ_PROTOCOL

- [P0-MUST] Resolve the state path: `{workspace_root}/.agloop/state.json`.
- [P0-MUST] Check file existence before reading. If missing and `current_phase` is NOT `init`, **STOP** — report `FAILED` with `CONTEXT_INSUFFICIENT`.
- [P0-MUST] Parse the file as JSON. If parsing fails (malformed JSON), enter the Recovery Protocol (Section 5).
- [P0-MUST] Validate `$schema` equals `"agloop-state-v1"`. If schema version is unrecognized, **STOP** and report `FAILED` with `CONTEXT_INSUFFICIENT`.
- [P0-MUST] Validate required fields exist: `current_phase`, `current_task_id`, `tasks`, `iteration`, `stop_hook_active`, `last_action`, `phase_history`, `retry_count`.
- [P1-SHOULD] Validate enum values: `current_phase` is one of the 8 valid phases, every `tasks[].status` is one of the 4 valid statuses.
- [P1-SHOULD] Validate referential integrity: `current_task_id` (if non-null) exists in `tasks`, all `depends_on` IDs exist in `tasks`.

---

## 3. WRITE_PROTOCOL

- [P0-MUST] Follow a strict **read-modify-write** pattern:
  1. **Read** the current state from disk (fresh read, not cached).
  2. **Modify** the in-memory object with your changes.
  3. **Validate** the modified state before writing (see validation rules below).
  4. **Write** the complete state object back to disk.
- [P0-MUST] **Never write a partial state.** Every write must contain ALL schema fields. Omitting fields corrupts state for downstream agents.
- [P0-MUST] **Never write stale state.** Always read the latest state from disk before modifying. Do not modify a cached copy from an earlier read.
- [P0-MUST] Update `last_action` on every write: set `agent`, `action`, `timestamp` (ISO 8601), and `task_id`.

### Pre-Write Validation Checks

- [P0-MUST] `current_task_id` (if non-null) must reference an existing task in the `tasks` array.
- [P0-MUST] `current_phase` must be a valid enum value.
- [P0-MUST] All `depends_on` references must point to existing task IDs.
- [P0-MUST] `iteration` must be between 0 and 3 inclusive.
- [P1-SHOULD] No task should have `status: "in_progress"` unless it matches `current_task_id`.
- [P1-SHOULD] `phase_history` entries must be chronologically ordered by `entered_at`.
- [P1-SHOULD] `retry_count` values must be non-negative integers.

### Append to Log

- [P0-MUST] After every state write, append a corresponding entry to `.agloop/log.json` with: `timestamp`, `agent`, `action`, `task_id`, `phase`, `input_summary`, `output_summary`, `status`.

---

## 4. CHECKPOINT_PROTOCOL

Checkpoints are point-in-time copies of `state.json` used for crash recovery and context compaction survival.

### When to Checkpoint

- [P0-MUST] **Phase transitions**: Create a checkpoint every time `current_phase` changes. These are the most important recovery points.
- [P0-MUST] **Pre-compaction**: When the PreCompact hook fires (VS Code is about to compact agent context), checkpoint state so it can be restored in the next session.
- [P1-SHOULD] **Before /reset**: Archive the current state with type `reset` before wiping state.

### How to Checkpoint

- [P0-MUST] Copy the current `state.json` to `.agloop/checkpoints/{type}-{ISO-timestamp}.json`.
  - `{type}` is one of: `phase-transition`, `pre-compact`, `reset`.
  - `{ISO-timestamp}` format: `YYYYMMDD-HHmmss` (e.g., `20260301-143022`).
- [P1-SHOULD] Include checkpoint metadata as a top-level `_checkpoint` field in the saved file:
  ```json
  {
    "_checkpoint": {
      "type": "phase-transition",
      "trigger": "plan → critique",
      "created_at": "2026-03-01T14:30:22.456Z",
      "human_summary": "Plan phase complete. 6 tasks generated. Entering first critique iteration."
    }
  }
  ```

### Retention Policy

- [P1-SHOULD] Keep the **10 most recent** checkpoints (any type). If fewer than 5 of these are `reset` checkpoints, retain additional older `reset` checkpoints until at least 5 are preserved (total may exceed 10). Example: 12 checkpoints exist (6 reset, 6 phase-transition) → keep all 6 reset + 4 newest phase-transition = 10 total.
- [P2-MAY] Prune older checkpoints when creating a new one by deleting the oldest non-reset checkpoint beyond the retention limit.

---

## 5. RECOVERY_PROTOCOL

Recovery is triggered when `state.json` is missing or corrupted (fails JSON parse).

### Recovery Steps

- [P0-MUST] **Step 1**: Check `.agloop/checkpoints/` for available checkpoints.
- [P0-MUST] **Step 2**: If checkpoints exist, select the most recent checkpoint file (by timestamp in filename).
- [P0-MUST] **Step 3**: Parse the checkpoint. If it also fails to parse, try the next most recent. Repeat until a valid checkpoint is found or all are exhausted.
- [P0-MUST] **Step 4**: If a valid checkpoint is found, copy it to `.agloop/state.json` (stripping the `_checkpoint` metadata field). Log the recovery action.
- [P0-MUST] **Step 5**: If NO valid checkpoint exists, report `FAILED` with `CONTEXT_INSUFFICIENT` and recommend the user run `/reset` to create a fresh state.

### Post-Recovery Validation

- [P1-SHOULD] After restoring from a checkpoint, validate the restored state using the Read Protocol (Section 2).
- [P1-SHOULD] Log the recovery with: which checkpoint was used, how old it is, and what phase/task was restored.
- [P1-SHOULD] If the restored state is significantly stale (e.g., multiple tasks behind), warn in the log that some work may need to be re-executed.
