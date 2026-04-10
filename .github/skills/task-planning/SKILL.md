---
name: task-planning
description: "Guides agents through DAG task decomposition, dependency analysis, effort estimation, and pre-mortem failure analysis. Use when creating or revising implementation plans from feature requirements."
disable-model-invocation: true
argument-hint: "Feature requirements or critic feedback to plan from"
tags:
  - agloop
  - planning
  - dag
  - decomposition
  - estimation
---

# Task Planning

## When to Use This Skill

Load this skill when:

- Creating an implementation plan from feature requirements (Planner agent)
- Revising a plan after critic feedback (Planner agent, revision mode)
- Validating a plan's structure before approving it (Coordinator)
- Checking plan integrity (dependency cycles, missing criteria)

## DAG Decomposition Methodology

### Step 1: Identify Atomic Deliverables

Decompose the feature into the smallest independently testable units of work. Each task must be a **deliverable**, not a module or abstraction.

**Good task titles** (deliverable-focused):

- "Add search API endpoint returning paginated results"
- "Create user profile page with avatar upload"
- "Implement rate limiting middleware for public endpoints"

**Bad task titles** (module/abstraction-focused):

- "Create SearchHandler class"
- "Set up database schema"
- "Write utility functions"

**Decomposition rules:**

1. Each task produces something a user or developer can observe or test
2. Each task modifies 1-5 files (if more, split it)
3. Each task has clear start and end states
4. Each task can be verified independently of future tasks

### Step 2: Map Dependencies

For every task, ask: "What must be DONE before this task can START?"

```
dependency_rules:
  - A task depends on another ONLY if it literally cannot be implemented without the other's output
  - Shared utilities are a dependency; shared concepts are NOT
  - Database schema tasks typically come first
  - API endpoints depend on their data layer
  - UI components depend on their API endpoints
  - Integration tests depend on the components they test
```

### Step 3: Check for Cycles

If task A → B → C → A exists, the plan is invalid. To detect:

```
algorithm: topological_sort
  1. Build adjacency list from depends_on fields
  2. Compute in-degree for each task
  3. Initialize queue with all tasks where in-degree = 0
  4. While queue is not empty:
     a. Dequeue task, add to sorted order
     b. For each dependent: decrement in-degree
     c. If in-degree reaches 0, enqueue it
  5. If sorted order length < total tasks → CYCLE EXISTS
     - Remaining tasks form the cycle — redesign their dependencies
```

**Cycle resolution strategies:**

- Extract shared dependency into its own task
- Merge tightly coupled tasks into one
- Use interface/contract as the dependency boundary instead of implementation

### Step 4: Topological Ordering

Order tasks so that every task appears after all its dependencies. Within the same dependency level, order by:

1. Foundation tasks first (fewer dependents → more dependents)
2. Lower task ID as tiebreaker (preserves planner intent)

## Pre-Mortem Analysis Framework

Before execution begins, assume the project has FAILED. Identify why.

### Failure Mode Identification

For each task and for the project as a whole, identify potential failure modes:

| Category     | Example Modes                                                       |
| ------------ | ------------------------------------------------------------------- |
| Integration  | API contract mismatch, incompatible data formats, version conflicts |
| Data         | Migration failures, data loss, schema drift, concurrent access      |
| Performance  | N+1 queries, unbounded fetches, missing indexes, memory leaks       |
| Security     | Injection points, auth bypass, data exposure, CSRF                  |
| Edge Cases   | Empty states, max limits, Unicode input, concurrent mutations       |
| Dependencies | External API down, library breaking change, missing peer deps       |
| Scope        | Underestimated complexity, hidden requirements, ambiguous specs     |

### Likelihood × Impact Scoring

For each failure mode, assess:

```
likelihood: low | medium | high
  low    = unlikely given the codebase and approach
  medium = possible, has happened in similar projects
  high   = probable without explicit mitigation

impact: low | medium | high | critical
  low      = cosmetic issue, easy fix
  medium   = feature degraded, user-visible but recoverable
  high     = feature broken, requires significant rework
  critical = data loss, security breach, or cascading failures
```

**Mitigation required if:** likelihood ≥ medium OR impact ≥ high.

### Pre-Mortem Template

```yaml
pre_mortem:
  overall_risk_level: medium # low | medium | high | critical
  critical_failure_modes:
    - mode: "Database migration fails on existing data with NULL values"
      likelihood: medium
      impact: high
      mitigation: "Add NOT NULL with DEFAULT in migration, backfill script, test with production data snapshot"
    - mode: "Search endpoint returns unbounded results on empty query"
      likelihood: high
      impact: medium
      mitigation: "Enforce max page_size=100, require at least one filter parameter"
  assumptions:
    - "PostgreSQL 14+ is available in all environments"
    - "Existing auth middleware handles JWT validation"
    - "No concurrent schema migrations are running"
```

## Task Writing Standards

### Required Fields

Every task in `plan.yaml` must have ALL of these fields:

| Field                 | Type     | Description                                  |
| --------------------- | -------- | -------------------------------------------- |
| `id`                  | string   | Format: `task-NNN` (zero-padded to 3 digits) |
| `title`               | string   | Deliverable-focused, action-verb start       |
| `description`         | string   | Detailed requirements for the implementer    |
| `depends_on`          | string[] | Task IDs this depends on (empty if none)     |
| `acceptance_criteria` | string[] | Specific, verifiable criteria (≥1)           |
| `failure_modes`       | object[] | Per-task risk analysis                       |
| `estimated_effort`    | enum     | `small` \| `medium` \| `large`               |
| `files_to_modify`     | string[] | Relative paths to create/modify              |
| `files_to_read`       | string[] | Relative paths for context                   |
| `specification_adherence` | object | `{ required_patterns[], forbidden_patterns[], tech_choices[] }` |

### Acceptance Criteria Standards

Criteria must be **specific and verifiable** — a verifier must be able to confirm pass/fail with evidence.

**Good criteria:**

- "GET /api/search?q=test returns 200 with JSON body containing `results` array"
- "File `src/middleware/rateLimit.ts` exports `rateLimitMiddleware` function"
- "Error response for invalid input returns 400 with `{ error: string }` body"
- "Component renders loading skeleton when `isLoading` is true"

**Bad criteria:**

- "Search works correctly"
- "Error handling is implemented"
- "Code is clean and well-structured"
- "Performance is acceptable"

### Effort Estimation Guidelines

```
small:  1-2 files, simple logic, clear pattern to follow
        Examples: add a config value, create a simple utility, update a type
        Typical time: 1 executor delegation

medium: 3-5 files, moderate complexity, some design decisions
        Examples: new API endpoint with validation, component with state management
        Typical time: 1-2 executor delegations

large:  6+ files, complex logic, cross-cutting concerns
        Examples: auth system, search with indexing, real-time sync
        Typical time: 2-3 executor delegations (consider splitting)
```

**Rule:** If estimated_effort is `large`, consider splitting into smaller tasks.

## plan.yaml Output Format

```yaml
plan_id: "plan-YYYYMMDD-HHmmss"
feature: "verbatim user request"
created_at: "2026-03-01T14:30:22.000Z"
updated_at: "2026-03-01T14:30:22.000Z"
status: "draft"

pre_mortem:
  overall_risk_level: medium
  critical_failure_modes:
    - mode: "description of what could go wrong"
      likelihood: medium
      impact: high
      mitigation: "prevention or recovery strategy"
  assumptions:
    - "assumption the plan depends on"

tasks:
  - id: "task-001"
    title: "Deliverable-focused title"
    description: "Detailed requirements for implementer"
    depends_on: []
    acceptance_criteria:
      - "Specific, verifiable criterion"
    failure_modes:
      - mode: "what could go wrong"
        likelihood: low
        impact: medium
        mitigation: "how to handle it"
    estimated_effort: small
    files_to_modify:
      - "src/path/to/file.ts"
    files_to_read:
      - "src/path/to/context.ts"
    specification_adherence:
      required_patterns:
        - "pattern that must be followed"
      forbidden_patterns:
        - "pattern that must not appear"
      tech_choices:
        - "technology choice constraint"

dag_edges:
  - ["task-001", "task-002"]

critique_history: []
```

## plan.md Output Format

```markdown
# Implementation Plan: {feature_name}

**Created:** {created_at}
**Status:** {status}
**Risk Level:** {overall_risk_level}

## Summary

{1-3 paragraph summary of the approach}

## Pre-Mortem Analysis

### Critical Risks

| Risk   | Likelihood   | Impact   | Mitigation   |
| ------ | ------------ | -------- | ------------ |
| {mode} | {likelihood} | {impact} | {mitigation} |

### Assumptions

- {assumption}

## Task Plan

### Task {id}: {title}

- **Effort:** {estimated_effort}
- **Depends on:** {depends_on or "none"}
- **Files:** {files_to_modify}
- **Acceptance Criteria:**
  1. {criterion}

## Dependency Graph

{text-based DAG visualization}

## Critique History

{iterations with objections and responses}
```

## Verification

A valid plan satisfies ALL of these checks:

1. **Structural integrity**: Every `depends_on` references an existing task ID
2. **No cycles**: Topological sort produces a valid ordering of all tasks
3. **Criteria completeness**: Every task has ≥1 acceptance criterion
4. **Criteria quality**: Every criterion is specific and verifiable (no vague language)
5. **Pre-mortem present**: `pre_mortem` section exists with ≥1 failure mode and ≥1 assumption
6. **DAG edges consistent**: `dag_edges` matches the `depends_on` fields in tasks
7. **Effort estimated**: Every task has a valid `estimated_effort`
8. **Files specified**: Every task has non-empty `files_to_modify`
9. **IDs sequential**: Task IDs follow `task-NNN` format, are unique, and sequentially ordered
10. **No orphans**: Every task is either a root (no deps) or reachable from a root via the DAG
