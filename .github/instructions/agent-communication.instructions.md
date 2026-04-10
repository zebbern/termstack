---
applyTo: "agloop"
---

# Agent Communication — Delegation, Results, Handoffs & Escalation

These rules govern how agents communicate within the AgLoop framework. Precise communication produces precise results. Vague communication produces vague results.

## 0. USER_COMMUNICATION_BOUNDARY

- [P0-MUST] Only the Coordinator communicates with the user.
- [P0-MUST] All user-facing clarifications, approval requests, status summaries, blocker notifications, and completion handoff messages must go through `discord/discord_ask`, `discord/discord_embed`, or `discord/discord_notify`.
- [P0-MUST] Subagents never communicate with the user directly and never assume approval has already been granted.
- [P0-MUST] The coordinator must not treat work as complete until it has sent a completion summary and used `discord/discord_ask`.
- [P0-MUST] The coordinator never decides the session is finished on its own; the user ends the session.

---

## 1. DELEGATION_PROTOCOL

Every delegation from the Coordinator to a subagent MUST include structured parameters. The format consists of **base parameters** (common to all delegations) plus **agent-specific parameters**.

### Base Parameters (required for ALL delegations)

- [P0-MUST] Every delegation includes all 8 base fields. No field may be omitted or left empty.

```yaml
base_params:
  task_id: "string | null — current task ID being worked on (null for non-task phases)"
  feature_name: "string — verbatim user request (NEVER paraphrased)"
  feature_description: "string — expanded description from research phase"
  current_phase: "string — current phase of the agentic loop"
  current_state_summary: "string — compressed snapshot: phase, completed task count, current task, blockers"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"
```

### Agent-Specific Parameters

#### Researcher Delegation

```yaml
researcher_params:
  complexity_level:
    "enum: simple | medium | complex"
    # simple = 1 pass (small feature, familiar codebase)
    # medium = 2 passes (moderate feature, some unknowns)
    # complex = 3 passes (large feature, cross-cutting concerns)
  research_mode:
    "enum: codebase_only | codebase_plus_latest_guidance"
    # codebase_only = skip latest docs fetch (familiar stack, no unknowns)
    # codebase_plus_latest_guidance = fetch latest docs + official sources (default)
  focus_areas: ["string — specific areas to research"]
  known_patterns: ["string — patterns already identified to verify/extend"]
  workspace_root: "string — absolute path to workspace root"
```

#### Planner Delegation

```yaml
planner_params:
  research_findings: "object — full research_output from Researcher"
  context_map: "object — the context_map section from research"
  latest_guidance: "object — latest_guidance section from research (official sources, date-verified takeaways)"
  constraints: ["string — constraints from research or user"]
  revision_feedback:
    "object | null — critic's feedback if this is a plan revision"
    # { iteration, objection, suggested_fix, previous_plan_path }
```

#### Critic Delegation

```yaml
critic_params:
  plan_yaml_path: "string — path to plan.yaml to review"
  feature_name: "string — verbatim user request for specification compliance checks"
  iteration_number: "number — which critique iteration (1, 2, or 3)"
  max_iterations: 3
  previous_objections:
    [
      "{ iteration, objection, response, resolved, objection_category, severity }",
    ]
  research_findings: "object — research output for context"
```

#### Executor Delegation

```yaml
executor_params:
  task_definition: "{ id, title, description, files_to_modify, files_to_read }"
  acceptance_criteria: ["string — each criterion the executor must satisfy"]
  context_map: "object — relevant portion of the research context map"
  anti_laziness_checklist: ["string — non-negotiable implementation rules"]
  specification_adherence:
    required_patterns: ["string — patterns that MUST be used"]
    forbidden_patterns: ["string — patterns that MUST NOT be used"]
    tech_choices: ["string — locked-in technology decisions"]
  previous_failure:
    "object | null — failure report if retrying after verification failure"
    # { attempt_number, failure_report, specific_failures, fix_instructions }
```

#### Verifier Delegation

```yaml
verifier_params:
  task_definition: "{ id, title, description }"
  acceptance_criteria: ["string — each criterion to verify"]
  executor_result: "{ files_modified, summary, acceptance_criteria_confirmation }"
  review_depth: "enum: full | standard | lightweight"
  specification_adherence:
    required_patterns: ["string — patterns that MUST be present"]
    forbidden_patterns: ["string — patterns that MUST NOT be present"]
    tech_choices: ["string — locked-in technology decisions to verify"]
```

---

## 2. RESULT_BLOCKS

- [P0-MUST] Every subagent response **MUST** end with a RESULT block. No exceptions.
- [P0-MUST] A response without a RESULT block is malformed and treated as `FAILED` with `TOOL_FAILURE`.

### Required Format

```markdown
## RESULT

- **Status**: COMPLETE | PARTIAL | FAILED
- **Failed Reason**: (if PARTIAL or FAILED) one of:
  DEPENDENCY_MISSING | DESIGN_INCOMPATIBLE | TEST_REGRESSION |
  AMBIGUOUS_REQUIREMENT | TOOL_FAILURE | CONTEXT_INSUFFICIENT |
  VERIFICATION_FAILED | MAX_RETRIES_EXCEEDED
- **Files Modified**: [list of relative paths] or "none"
- **Key Decisions**: [bullet list of decisions made during execution]
- **Deliverables**: [specific outputs produced — files, plans, verdicts]
- **Needs Followup**: [agent_name: reason] or "none"
- **Blockers**: [anything preventing completion] or "none"
````

### Field Rules

- [P0-MUST] `Status` must be exactly one of: `COMPLETE`, `PARTIAL`, or `FAILED`.
- [P0-MUST] `Failed Reason` is mandatory when Status is `PARTIAL` or `FAILED`. Must be one of the 8 enumerated values.
- [P0-MUST] `Files Modified` must list every file created, modified, or deleted. Never omit files.
- [P1-SHOULD] `Key Decisions` entries must be specific and actionable (e.g., "Used Zustand instead of Context API per plan requirements"), not vague (e.g., "Made some changes").
- [P1-SHOULD] `Deliverables` must reference specific artifacts: file paths, plan.yaml, verdict decisions.
- [P1-SHOULD] `Needs Followup` must name the exact agent type and reason (e.g., "verifier: task-003 needs security review due to auth changes").

### RESULT Parsing Rules (Coordinator Action Table)

| Status     | Failed Reason           | Coordinator Action                                                  |
| ---------- | ----------------------- | ------------------------------------------------------------------- |
| `COMPLETE` | —                       | Update state.json → advance to next phase/task                      |
| `PARTIAL`  | any                     | Log partial completion → attempt to continue with available results |
| `FAILED`   | `CONTEXT_INSUFFICIENT`  | Retry with more context (max 2 retries)                             |
| `FAILED`   | `VERIFICATION_FAILED`   | Launch fresh executor with failure report                           |
| `FAILED`   | `MAX_RETRIES_EXCEEDED`  | Mark task as `failed`, log, move to next independent task           |
| `FAILED`   | `DEPENDENCY_MISSING`    | Check if dependency can be resolved, else mark task `failed`        |
| `FAILED`   | `AMBIGUOUS_REQUIREMENT` | Escalate to user for clarification                                  |
| `FAILED`   | `TOOL_FAILURE`          | Retry once with same parameters, then mark `failed`                 |
| `FAILED`   | `DESIGN_INCOMPATIBLE`   | Return to plan phase for task redesign                              |
| `FAILED`   | `TEST_REGRESSION`       | Launch fresh executor with regression report                        |

---

## 3. HANDOFF_RULES

Handoffs define how work flows between agents. All coordination flows through the Coordinator — no lateral communication.

- [P0-MUST] **Phase transitions are Coordinator-only.** Only the Coordinator changes `current_phase` in state.json. Subagents never transition phases.
- [P0-MUST] **No lateral subagent communication.** Subagents never delegate to other subagents. The flow is always: Coordinator → Subagent → RESULT → Coordinator → next Subagent.
- [P0-MUST] **Subagent completion protocol**: Subagent completes work → returns RESULT block → Coordinator parses RESULT → Coordinator routes to next action.
- [P0-MUST] **One task per delegation.** Each Executor delegation handles exactly one task. Never batch multiple tasks into a single delegation.
- [P1-SHOULD] **Fresh context on retry.** When retrying a failed task, launch a NEW subagent instance (fresh context window), not a continued conversation. Pass the failure report as `previous_failure` parameter.
- [P1-SHOULD] **No accumulated state in subagents.** Subagents do not carry state between delegations. Each delegation is a fresh start with all necessary context provided in the delegation parameters.

### Handoff Sequence by Phase

| From Phase | To Phase   | Handoff Trigger                                                      | Data Passed Forward                                   |
| ---------- | ---------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| `init`     | `research` | User provides feature description                                    | `feature_name`, `complexity_level`                    |
| `research` | `plan`     | Researcher COMPLETE + user approval via `discord/discord_ask`                | `research_findings`, `context_map`, `latest_guidance` |
| `plan`     | `critique` | Planner COMPLETE                                                     | `plan_yaml_path`, `iteration=1`                       |
| `critique` | `plan`     | Critic REVISE (iteration < 3)                                        | `objection`, `suggested_fix`                          |
| `critique` | `execute`  | Critic APPROVE + user approval via `discord/discord_ask`                     | First task via topological sort                       |
| `execute`  | `verify`   | Executor COMPLETE                                                    | `executor_result` for current task                    |
| `verify`   | `execute`  | Verifier PASS + more tasks                                           | Next task via topological sort                        |
| `verify`   | `execute`  | Verifier FAIL + retries < 2                                          | Same task + `previous_failure`                        |
| `verify`   | `complete` | Verifier PASS + all tasks done + user confirmation via `discord/discord_ask` | Completion summary                                    |

> **Iteration mapping:** State `iteration` is 0-based (0–3); Critic `iteration_number` is 1-based (1–3). When delegating to Critic: `iteration_number = state.iteration + 1`. The Critic must not return REVISE when `iteration_number == max_iterations` (3). The `iteration < 3` constraint in the "Critic REVISE" row is enforced by the Coordinator before delegating — it prevents a 4th critique iteration.

---

## 4. CONTEXT_PASSING

Context is the quality multiplier of delegation. Too little context produces guesswork. Too much context wastes the subagent's context window.

### What MUST Be Passed

- [P0-MUST] **Verbatim user request.** Never paraphrase, summarize, or interpret the user's original feature request. Pass it exactly as stated in `feature_name`.
- [P0-MUST] **State summary.** Current phase, number of completed tasks vs. total, current task ID, any active blockers. Compressed — not the full state.json dump.
- [P0-MUST] **Locked decisions.** Any technology choices, architectural decisions, or constraints that are non-negotiable (from plan, user, or prior agent decisions).
- [P0-MUST] **Task-specific context.** For Executor: task definition, acceptance criteria, files to modify, files to read. For Verifier: executor result, evidence to check against.
- [P1-SHOULD] **Research findings.** When delegating to Planner or Critic, include the Researcher's context map and key findings.

### What MUST NOT Be Passed

- [P0-MUST] **Never pass the entire state.json dump** as-is to subagents. Compress it into a summary. Subagents that need specific state fields should read state.json themselves.
- [P0-MUST] **Never pass previous agent conversation history.** Each subagent gets fresh context. Pass results and decisions, not the conversation that produced them.
- [P1-SHOULD] **Avoid passing irrelevant files.** Only include files in `files_to_read` that are directly relevant to the task. Do not dump the entire codebase context.
- [P1-SHOULD] **Avoid passing redundant information.** If the plan.yaml path is provided, don't also inline the full plan contents — the subagent can read the file.

---

## 5. ERROR_ESCALATION

Subagents must decide whether to handle an error locally or escalate it to the Coordinator via the RESULT block.

### Handle Locally (subagent resolves without escalating)

- [P1-SHOULD] **Minor tool failures**: A file read fails but an alternative path exists. Retry or use a fallback.
- [P1-SHOULD] **Partial results available**: Some acceptance criteria are met, others need a different approach — try the alternative approach before giving up.
- [P1-SHOULD] **Workaround possible**: A library API changed but the same result can be achieved differently. Implement the workaround and note it in `Key Decisions`.
- [P1-SHOULD] **Non-blocking warnings**: Code quality issues that don't prevent functionality. Log as warnings, continue implementation.

### Escalate to Coordinator (return FAILED or PARTIAL with clear reason)

- [P0-MUST] **Missing dependencies**: A task requires output from a task that isn't `done`. Return `FAILED` with `DEPENDENCY_MISSING`.
- [P0-MUST] **Ambiguous requirements**: The acceptance criteria are contradictory, unclear, or incomplete. Return `FAILED` with `AMBIGUOUS_REQUIREMENT`. Include what's ambiguous and what clarification is needed.
- [P0-MUST] **Tool failures after retry**: A critical tool (e.g., file write, terminal command) fails twice with the same error. Return `FAILED` with `TOOL_FAILURE`.
- [P0-MUST] **Blocking issues**: Cannot proceed without coordinator intervention (e.g., need a different review depth, need a different task decomposition).
- [P0-MUST] **Repeated failure (>2 retries)**: If you've retried an operation more than twice without success, escalate rather than continuing to burn context.
- [P0-MUST] **Security concerns**: If implementation would introduce a security vulnerability (SQL injection, credential exposure, etc.), STOP and escalate immediately.

### Escalation Format

- [P0-MUST] When escalating, always include:
  1. The **original error** (exact error message or failure description).
  2. **What was attempted** (actions taken before escalating).
  3. **Why local resolution failed** (why the subagent cannot handle this).
  4. **Suggested resolution** (what the coordinator should do next).
