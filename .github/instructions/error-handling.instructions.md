---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.py,**/*.mjs"
---

# Error Handling — Structured Errors, Retry Policy & Escalation

These rules govern how errors are handled in code produced by AgLoop agents and within the agent framework itself. Silent failures are the primary cause of cascading bugs.

---

## 1. AGLOOP_ERROR_PATTERNS

> **Generic error handling** (try/catch, never swallow, structured errors) is covered by standard clean code practices. This section covers the AgLoop-specific patterns your implementation must follow.

### Preferred Result Pattern

When a function can fail in predictable ways, return a structured result rather than throwing:

```typescript
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function readState(path: string): Result<State> {
  // Return { ok: false, error: "..." } on expected failures
  // Throw only on truly unexpected failures
}
```

### Re-throw with AgLoop Context

When catching errors in AgLoop code, always wrap with context that includes the file path and operation:

```typescript
try {
  const state = JSON.parse(contents);
} catch (err) {
  throw new Error(
    `Failed to parse state.json at ${path}: ${err instanceof Error ? err.message : String(err)}`,
  );
}
```

### AgLoop Error Message Standard

Error messages must be actionable — name the file, the expected state, and the fix:

| Bad                | Good                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| `"Error occurred"` | `"Failed to read state.json: file not found at .agloop/state.json. Run /reset to create a fresh state."`    |
| `"Invalid input"`  | `"Task status 'running' is not valid. Expected one of: pending, in_progress, done, failed."`                |
| `"Parse error"`    | `"Failed to parse plan.yaml: unexpected token at line 42. Check for missing quotes or indentation errors."` |

- [P1-SHOULD] **Match the error handling pattern of the codebase.** If the project uses custom error classes, use them. Do not introduce a new error handling paradigm.

---

## 2. RETRY_POLICY

Retries recover from transient failures without escalation. But uncontrolled retries waste resources and mask persistent bugs.

### Retry Limits

- [P0-MUST] **Maximum 2 retries for most operations.** First attempt + 2 retries = 3 total attempts. After 3 failures, escalate.
- [P0-MUST] **0 retries for data-destructive operations.** File deletion, state reset, database drops — if these fail, escalate immediately. Do not retry an operation that could cause data loss.
- [P1-SHOULD] **1 retry for tool calls** (stricter than the general 2-retry rule). If a VS Code built-in tool (file read, grep search, terminal command) fails once, retry once with a different approach. If it fails again, escalate with `TOOL_FAILURE`. This is stricter than the general rule because tool failures indicate infrastructure issues, not transient errors.

> **Scope clarification:** Tool-call retries (1 retry, 2 total attempts) govern individual tool invocations during execution. Task-level retries tracked via `retry_count[task_id]` in `state.json` govern full executor re-attempts after verification failure (max 2 retries). These operate at different scopes and do not conflict.

### Backoff Strategy

- [P1-SHOULD] **No backoff for local file operations.** File reads/writes fail fast — retry immediately.
- [P1-SHOULD] **Exponential backoff for network operations.** If making HTTP requests or calling external services: wait 1s, then 2s, then 4s. Cap at 10s.
- [P2-MAY] Add jitter to backoff intervals to avoid thundering herd in concurrent scenarios.

### Fresh Context on Retry

- [P0-MUST] **On executor retry after verification failure, ALWAYS use a NEW subagent context.** Do not continue the failed executor's conversation. Launch a fresh subagent with:
  - The original task definition and acceptance criteria.
  - The `previous_failure` object containing: attempt number, failure report from verifier, specific failures, and fix instructions.
- [P0-MUST] The fresh subagent must read the failure report and address each specific failure. It must not repeat the same implementation approach that failed.
- [P1-SHOULD] Track retry count in `state.json` under `retry_count[task_id]`. When `retry_count >= 2`, do not retry further — escalate with `MAX_RETRIES_EXCEEDED`.

---

## 3. ESCALATION PROTOCOL

For the full escalation protocol (handle locally vs. escalate to coordinator), see `agent-communication.instructions.md` Section 5. Key rule: handle transient/non-blocking errors locally; escalate blocking dependencies, ambiguous requirements, repeated failures (>2 retries), security concerns, and tool infrastructure failures.
