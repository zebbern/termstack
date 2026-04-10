---
name: delegation-protocol
description: "Defines the structured delegation protocol for coordinator-to-subagent communication. Includes base parameter requirements, agent-specific parameters, anti-laziness checklists, and RESULT block parsing. Use when delegating work to subagents."
disable-model-invocation: true
argument-hint: "Target agent and task context for delegation"
tags:
  - agloop
  - delegation
  - subagent
  - handoff
  - coordination
---

# Delegation Protocol

## When to Use This Skill

Load this skill when:

- The coordinator is composing a delegation to any subagent
- Building the parameter set for a researcher, planner, critic, executor, or verifier delegation
- Parsing a subagent's RESULT block to determine next actions
- Customizing the anti-laziness checklist for a specific task
- Deciding the review depth before delegating to the verifier

## Delegation Anatomy

Every delegation from the coordinator to a subagent consists of four parts:

```
delegation = base_params
           + agent_specific_params
           + anti_laziness_checklist
           + specification_adherence
```

All four parts are **required** for executor and verifier delegations. For researcher, planner, and critic delegations, `anti_laziness_checklist` and `specification_adherence` may be omitted (but `base_params` and `agent_specific_params` are always required).

### Base Parameters (All Delegations)

Every delegation includes these 8 fields — no exceptions:

```yaml
base_params:
  task_id:
    "string | null"
    # Current task being worked on. Null during research/plan/critique phases.
  feature_name:
    "string"
    # Verbatim user request — never paraphrase or abbreviate.
  feature_description:
    "string"
    # Expanded description from research phase. Empty string before research.
  current_phase:
    "string"
    # Current phase of the agentic loop (init, research, plan, critique, execute, verify, complete).
  current_state_summary:
    "string"
    # Compressed snapshot: "Phase: execute, Task: task-003 (3/7 done), Last: task-002 verified PASS"
  plan_path:
    ".agloop/plan.yaml"
    # Path to plan file (even if it doesn't exist yet).
  state_path:
    ".agloop/state.json"
    # Path to state file.
  log_path:
    ".agloop/log.json"
    # Path to log file.
```

## Per-Agent Delegation Templates

### Researcher Delegation

```yaml
# --- Base Parameters ---
base_params:
  task_id: null
  feature_name: "{verbatim user request}"
  feature_description: ""
  current_phase: "research"
  current_state_summary: "Phase: research, 0/0 tasks, starting fresh"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"

# --- Agent-Specific Parameters ---
researcher_params:
  complexity_level:
    "medium"
    # simple: 1 research pass (small feature, familiar codebase)
    # medium: 2 passes (moderate feature, some unknowns)
    # complex: 3 passes (large feature, cross-cutting concerns)
  research_mode:
    "codebase_plus_latest_guidance"
    # codebase_only: research only the workspace codebase
    # codebase_plus_latest_guidance: also fetch latest library/framework guidance via context7
  focus_areas:
    - "specific areas to research, e.g. 'authentication patterns in src/auth/'"
    - "integration points for the new feature"
  known_patterns:
    - "patterns already identified that researcher should verify/extend"
  workspace_root: "{absolute path to workspace root}"
```

**Expected output contract:**

```yaml
research_output:
  context_map:
    primary_files: [{ path, role, key_exports }]
    secondary_files: [{ path, role }]
    test_files: [{ path, coverage }]
    patterns_to_follow: [{ pattern, example_file, description }]
    suggested_sequence: ["ordered implementation steps"]
  findings:
    architecture_notes: "string"
    dependencies: ["string"]
    constraints: ["string"]
    risks: ["string"]
  passes_completed: 2
  confidence: "medium | high"
```

### Planner Delegation

```yaml
# --- Base Parameters ---
base_params:
  task_id: null
  feature_name: "{verbatim user request}"
  feature_description: "{from research findings}"
  current_phase: "plan"
  current_state_summary: "Phase: plan, research complete, creating implementation plan"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"

# --- Agent-Specific Parameters ---
planner_params:
  research_findings: "{full research_output object from researcher}"
  context_map: "{context_map section from research}"
  latest_guidance:
    "{latest_guidance section from research — only present when research_mode was codebase_plus_latest_guidance}"
  constraints:
    - "constraints from research or user, e.g. 'must use existing auth system'"
  revision_feedback:
    null
    # Non-null on revision (from critic):
    # {
    #   iteration: 1,
    #   objection: "string — critic's strongest objection",
    #   suggested_fix: "string — how to address it",
    #   previous_plan_path: ".agloop/plan.yaml"
    # }
```

**Expected output contract:**

```yaml
planner_output:
  plan_yaml_path: ".agloop/plan.yaml"
  plan_md_path: ".agloop/plan.md"
  task_count: 5
  estimated_total_effort: "2 small, 2 medium, 1 large"
  critical_risks: ["risk summary strings"]
```

### Critic Delegation

```yaml
# --- Base Parameters ---
base_params:
  task_id: null
  feature_name: "{verbatim user request}"
  feature_description: "{expanded description}"
  current_phase: "critique"
  current_state_summary: "Phase: critique, iteration 1/3, reviewing plan"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"

# --- Agent-Specific Parameters ---
critic_params:
  plan_yaml_path: ".agloop/plan.yaml"
  iteration_number:
    1
    # Which critique iteration (1, 2, or 3)
  max_iterations: 3
  previous_objections:
    - iteration: 0
      objection: ""
      response: ""
      resolved: true
      objection_category: ""
      severity: ""
    # Empty on first iteration. Populated with past objections on subsequent iterations.
  feature_name: "{original user request for specification compliance check}"
  research_findings: "{research output for context}"
```

**Expected output contract:**

```yaml
critic_output:
  verdict: "APPROVE | REVISE"
  objection: "string | null"
  objection_category: "feasibility | gap | risk | edge_case | specification_compliance | null"
  severity: "blocking | major | minor | null"
  suggested_fix: "string | null"
  specification_compliance:
    compliant: true
    violations: []
  end_game_synthesis: # Only on APPROVE or final iteration
    resilience_verdict: "robust | acceptable | fragile"
    strongest_arguments: ["why this plan will succeed"]
    remaining_vulnerabilities: ["known weaknesses accepted"]
    overall_assessment: "summary judgment"
```

### Executor Delegation

```yaml
# --- Base Parameters ---
base_params:
  task_id: "task-003"
  feature_name: "{verbatim user request}"
  feature_description: "{expanded description}"
  current_phase: "execute"
  current_state_summary: "Phase: execute, Task: task-003 (2/7 done), implementing search handler"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"

# --- Agent-Specific Parameters ---
executor_params:
  task_definition:
    id: "task-003"
    title: "Add search API endpoint with pagination"
    description: "Create GET /api/search endpoint that accepts query, page, and page_size parameters. Returns paginated results matching the query. Use existing handler pattern from users.ts."
    files_to_modify:
      - "src/api/handlers/search.ts"
      - "src/types/api.ts"
      - "src/config/routes.ts"
    files_to_read:
      - "src/api/handlers/users.ts"
      - "src/services/searchService.ts"
      - "src/middleware/auth.ts"
  acceptance_criteria:
    - "GET /api/search?q=test&page=1&page_size=10 returns 200 with { results: [], total: number, page: number }"
    - "Missing query parameter returns 400 with { error: 'Query parameter q is required' }"
    - "page_size > 100 returns 400 with { error: 'page_size must be between 1 and 100' }"
    - "Route registered in src/config/routes.ts with auth middleware"
  context_map:
    # Relevant portion of the research context map
    primary_files: [...]
    patterns_to_follow: [...]

# --- Anti-Laziness Checklist ---
anti_laziness_checklist:
  - "DO NOT skip any acceptance criterion. Confirm each one individually."
  - "DO NOT leave TODO comments, placeholder implementations, or stub functions."
  - "DO NOT return until every requirement is fully implemented."
  - "You MUST create/modify ALL files listed in files_to_modify."
  - "You MUST handle ALL error cases, not just the happy path."
  - "You MUST follow existing codebase patterns identified in context_map."

# --- Specification Adherence ---
specification_adherence:
  required_patterns:
    - "Use zod for input validation"
    - "Follow handler pattern from users.ts"
    - "Return { data, meta, error } envelope"
  forbidden_patterns:
    - "DO NOT use raw SQL — use Prisma ORM"
    - "DO NOT use any for TypeScript types"
    - "DO NOT import entire lodash — use specific imports"
  tech_choices:
    - "Express.js handler (not Fastify, not Koa)"
    - "Zod validation (not Joi, not Yup)"

# --- Previous Failure (only on retry) ---
previous_failure:
  null
  # Non-null on fresh-context retry:
  # {
  #   attempt_number: 2,
  #   failure_report: "Verifier found page_size validation missing",
  #   specific_failures: ["page_size > 100 returns 500 instead of 400"],
  #   fix_instructions: "Add zod validation for page_size: z.number().min(1).max(100)"
  # }
```

**Expected output contract:**

```yaml
executor_output:
  files_modified:
    ["src/api/handlers/search.ts", "src/types/api.ts", "src/config/routes.ts"]
  files_deleted: []
  acceptance_criteria_confirmation:
    - criterion: "GET /api/search?q=test returns 200 with results"
      met: true
      evidence: "Handler returns res.json({ data: results, meta: { total, page }, error: null })"
    - criterion: "Missing q returns 400"
      met: true
      evidence: "Zod validation rejects missing q param, handler returns 400 with error"
  summary: "Created search endpoint following users.ts handler pattern with zod validation and Prisma query"
  warnings:
    [
      "Search query currently does exact match — may need full-text search for production",
    ]
```

### Verifier Delegation

```yaml
# --- Base Parameters ---
base_params:
  task_id: "task-003"
  feature_name: "{verbatim user request}"
  feature_description: "{expanded description}"
  current_phase: "verify"
  current_state_summary: "Phase: verify, Task: task-003, executor reported COMPLETE, awaiting verification"
  plan_path: ".agloop/plan.yaml"
  state_path: ".agloop/state.json"
  log_path: ".agloop/log.json"

# --- Agent-Specific Parameters ---
verifier_params:
  task_definition:
    id: "task-003"
    title: "Add search API endpoint with pagination"
    description: "..."
  acceptance_criteria:
    - "GET /api/search?q=test&page=1&page_size=10 returns 200 with { results: [], total: number, page: number }"
    - "Missing query parameter returns 400 with { error: 'Query parameter q is required' }"
    - "page_size > 100 returns 400 with { error: 'page_size must be between 1 and 100' }"
    - "Route registered in src/config/routes.ts with auth middleware"
  executor_result:
    files_modified:
      ["src/api/handlers/search.ts", "src/types/api.ts", "src/config/routes.ts"]
    summary: "Created search endpoint with zod validation and Prisma query"
    acceptance_criteria_confirmation:
      - criterion: "..."
        met: true
        evidence: "..."
  review_depth:
    "standard"
    # full: security-sensitive, high-priority, large effort
    # standard: typical tasks
    # lightweight: docs/config only

# --- Specification Adherence ---
specification_adherence:
  required_patterns:
    - "Uses zod for input validation"
    - "Follows handler pattern from users.ts"
    - "Returns { data, meta, error } envelope"
  forbidden_patterns:
    - "No raw SQL — must use Prisma ORM"
    - "No 'any' TypeScript types"
  tech_choices:
    - "Express.js handler (not Fastify, not Koa)"
    - "Zod validation (not Joi, not Yup)"
```

## Anti-Laziness Enforcement

### The Complete Checklist

This checklist is included in **every executor delegation** — no exceptions:

```markdown
## Anti-Laziness Enforcement

You MUST satisfy ALL of the following. Partial work is NOT acceptable.

- [ ] DO NOT leave any TODO comments in the code
- [ ] DO NOT use placeholder implementations or stub functions
- [ ] DO NOT skip any acceptance criterion — confirm each one individually
- [ ] DO NOT return until every requirement is fully implemented
- [ ] You MUST create or modify ALL files listed in files_to_modify
- [ ] You MUST handle ALL error cases, not just the happy path
- [ ] You MUST follow existing codebase patterns (from context_map)
- [ ] You MUST use the specified technologies — do NOT substitute alternatives
- [ ] You MUST NOT use any forbidden patterns listed in specification_adherence
- [ ] Confirm each acceptance criterion with evidence before returning RESULT
```

### Customization Per Task

Add task-specific enforcement items after the standard checklist:

```markdown
### Task-Specific Enforcement

- [ ] You MUST add input validation using zod (not manual if/else checks)
- [ ] You MUST include the auth middleware on the new route
- [ ] Error responses MUST use the { error: string } format, not plain text
```

### DO NOT / MUST Pattern Usage

Structure enforcement rules using explicit DO NOT and MUST language:

```
DO NOT:
- Use patterns from specification_adherence.forbidden_patterns
- Skip error handling for any code path
- Assume types — declare them explicitly
- Import patterns that differ from the existing codebase

MUST:
- Use patterns from specification_adherence.required_patterns
- Follow the example in context_map.patterns_to_follow
- Handle both success and failure cases
- Confirm each criterion in the RESULT block
```

## RESULT Block Parsing

### Format

Every subagent response MUST end with:

```markdown
## RESULT

- **Status**: COMPLETE | PARTIAL | FAILED
- **Failed Reason**: (if PARTIAL/FAILED) DEPENDENCY_MISSING | DESIGN_INCOMPATIBLE |
  TEST_REGRESSION | AMBIGUOUS_REQUIREMENT | TOOL_FAILURE | CONTEXT_INSUFFICIENT |
  VERIFICATION_FAILED | MAX_RETRIES_EXCEEDED
- **Files Modified**: [list of relative paths] or "none"
- **Key Decisions**: [bullet list of decisions made]
- **Deliverables**: [specific outputs — files, plans, verdicts]
- **Needs Followup**: [agent_name: reason] or "none"
- **Blockers**: [anything preventing completion] or "none"
```

### Coordinator Response to RESULT Status

| Status     | Failed Reason           | Coordinator Action                                                  |
| ---------- | ----------------------- | ------------------------------------------------------------------- |
| `COMPLETE` | —                       | Update state.json → advance to next phase/task                      |
| `PARTIAL`  | any                     | Log partial completion → use available results → continue           |
| `FAILED`   | `CONTEXT_INSUFFICIENT`  | Retry with more context (max 2 retries)                             |
| `FAILED`   | `VERIFICATION_FAILED`   | Launch fresh executor with failure report (new context window)      |
| `FAILED`   | `MAX_RETRIES_EXCEEDED`  | Mark task as `failed`, log, move to next independent task           |
| `FAILED`   | `DEPENDENCY_MISSING`    | Check if dependency task exists → if not, return to plan            |
| `FAILED`   | `TOOL_FAILURE`          | Retry once → if still fails, mark failed                            |
| `FAILED`   | `AMBIGUOUS_REQUIREMENT` | Log ambiguity, attempt interpretation, escalate to user if critical |
| `FAILED`   | `DESIGN_INCOMPATIBLE`   | Return to plan phase for redesign                                   |
| `FAILED`   | `TEST_REGRESSION`       | Delegate to executor to fix regression, then re-verify              |

### Parsing Procedure

```
1. Find "## RESULT" marker in subagent response
2. Extract Status line → determine branch
3. If COMPLETE:
   a. Extract Files Modified → update state.tasks[current].result.files_modified
   b. Extract Deliverables → log what was produced
   c. Advance to next phase
4. If PARTIAL:
   a. Log what was completed
   b. Evaluate if partial output is sufficient to proceed
   c. If sufficient → treat as COMPLETE with warning
   d. If insufficient → retry
5. If FAILED:
   a. Extract Failed Reason → look up in table above
   b. Extract Blockers → log specific issues
   c. Execute the corresponding recovery action
```

## Common Failure Modes

The 8 most common ways delegations fail, how to detect them, and how to prevent them:

| #   | Failure Mode                             | Detection                                                           | Prevention                                                                           |
| --- | ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | **Coordinator does implementation work** | Coordinator reads source files for analysis or writes code directly | Cardinal Rule: ONLY use agent. Never read files for analysis.                  |
| 2   | **Monolithic delegation**                | Sending multiple tasks or entire features to one subagent           | One task per executor delegation. Keep scope atomic.                                 |
| 3   | **Trusting self-assessment**             | Executor says "I verified it works" without evidence                | Verifier is ALWAYS a separate delegation. Evidence-based only.                       |
| 4   | **Giving up after one failure**          | Task fails once, immediately marked as blocked                      | Retry with fresh context (new subagent). Up to 2 retries.                            |
| 5   | **Specification substitution**           | Agent uses a familiar pattern instead of the specified one          | Include forbidden_patterns, required_patterns, and tech_choices in every delegation. |
| 6   | **Vague delegation**                     | "Please implement the search feature" with no details               | Include file lists, acceptance criteria, anti-laziness checklist, and constraints.   |
| 7   | **Context window exhaustion**            | Coordinator does analysis, reads files, loses orchestration quality | Subagents get fresh context windows. Coordinator only orchestrates.                  |
| 8   | **Infinite stop-hook loop**              | Stop hook keeps blocking termination                                | stop_hook_active flag. First stop attempt blocks and re-arms the escape hatch; only a later user-driven stop attempt should be allowed. |

## Review Depth Decision Tree

The coordinator determines `review_depth` before delegating to the verifier:

```
Step 1: Is the task security-sensitive?
  Keywords: auth, login, password, token, JWT, crypto, encryption,
            SQL, query, injection, validation, sanitize, CORS, CSRF
  → YES: review_depth = "full"
  → NO: Go to Step 2

Step 2: Is the task high-priority or complex?
  Indicators: estimated_effort = "large", or task is on the critical path
              (many other tasks depend on it)
  → YES: review_depth = "full"
  → NO: Go to Step 3

Step 3: Is the task documentation/config only?
  Indicators: files_to_modify contains only .md, .json, .yaml, .env, .config files
              No source code changes
  → YES: review_depth = "lightweight"
  → NO: review_depth = "standard"
```

## Verification

A well-formed delegation satisfies ALL of these checks:

1. **Base params complete**: All 7 base_params fields are present and populated
2. **Feature name verbatim**: `feature_name` matches the original user request exactly
3. **Agent params present**: Agent-specific parameters include all required fields
4. **Criteria included**: For executor/verifier delegations, acceptance_criteria is non-empty
5. **Anti-laziness present**: For executor delegations, the full anti-laziness checklist is included
6. **Specification adherence**: required_patterns and forbidden_patterns are specified
7. **Context sufficient**: Files to read and context map are provided for executor
8. **Previous failure attached**: If this is a retry, previous_failure object includes specific fix instructions
9. **Review depth set**: For verifier delegations, review_depth is explicitly set using the decision tree
10. **Single task scope**: Executor delegations contain exactly one task, not multiple
