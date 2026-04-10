---
applyTo: "**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.py,**/*.mjs"
---

# Quality Standards — Code Quality Rules for Implementation Agents

These rules apply to all code produced within the AgLoop framework. There is no "draft" or "prototype" mode — every output is production-ready.

---

## 1. CODE_QUALITY

- [P0-MUST] **No TODOs in production code.** Every `TODO`, `FIXME`, `HACK`, `XXX` comment is a failure. If something needs doing, do it now or report `FAILED`.
- [P0-MUST] **No placeholder implementations.** Functions like `function search() { return []; }` or `// placeholder` are never acceptable. Every function performs its intended operation.
- [P0-MUST] **No stub functions.** `throw new Error('Not implemented')` or `pass` in place of real logic is never acceptable.
- [P0-MUST] **No deferred work.** "I'll leave this for later", "This can be added in a future PR", "Skipping for now" — none of these are valid within an AgLoop execution.
- [P0-MUST] **Every code path must be handled.** Happy path, error cases, edge cases, and boundary conditions. If acceptance criteria don't mention error cases, handle them anyway — it is implicit.
- [P0-MUST] **Test all edge cases.** Empty inputs, null values, boundary values, malformed data, concurrent access (where applicable). Do not assume inputs are always valid.
- [P1-SHOULD] Run lint and typecheck commands (if available in the project) after code changes to catch regressions immediately.

> **Naming, function design, and general clean code conventions** follow standard clean-code practices (meaningful names, small focused functions, DRY, single responsibility). This file covers AgLoop-specific quality constraints.

---

## 2. PATTERNS

- [P0-MUST] **Follow existing codebase patterns.** The Researcher's context map identifies the conventions, import styles, error handling approach, and file structure of the target codebase. Match them. If no context map was provided (e.g., user-invoked agent, skipped research phase), scan the target files for existing patterns before implementing.
- [P0-MUST] **Do not introduce conflicting patterns.** If the codebase uses Zustand for state management, do not introduce Redux. If it uses `async/await`, do not use `.then()` chains. If it uses named exports, do not use default exports.
- [P1-SHOULD] **Match file structure.** If existing API routes follow `src/api/{resource}/route.ts`, new routes must follow the same structure. If components use `src/components/{ComponentName}/{ComponentName}.tsx`, new components must follow suit.
- [P1-SHOULD] **Match import style.** If the codebase uses path aliases (`@/components/...`), use them. If it uses relative imports, use relative imports. Do not mix styles.
- [P1-SHOULD] **Match error handling approach.** If the codebase uses custom error classes, use them. If it uses error codes with a utility function, use that pattern. Do not invent a new error handling mechanism.
- [P1-SHOULD] **Check specification adherence.** Every Executor delegation includes `required_patterns` and `forbidden_patterns`. Cross-check your implementation against both lists before returning RESULT.

---

## 3. TASK_SCOPING

- [P0-MUST] **Only build what the current task requires.** Do not add features, parameters, or abstractions "for future use." The plan defines scope — respect it.
- [P1-SHOULD] **Scope your changes.** Only modify files listed in `files_to_modify`. If you discover a file needs changes that isn't listed, note it in `Key Decisions` and justify the deviation.
- [P1-SHOULD] **Do not add unused exports, dead code, or speculative interfaces.** Every line of code must serve the current task's acceptance criteria.
