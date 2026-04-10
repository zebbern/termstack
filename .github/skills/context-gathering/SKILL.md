---
name: context-gathering
description: "Guides multi-pass codebase research using semantic search, grep, and file exploration. Produces structured context maps with primary files, secondary files, patterns, and implementation sequences. Use when researching a codebase before implementation."
disable-model-invocation: true
argument-hint: "Feature or area of codebase to research"
tags:
  - agloop
  - research
  - codebase
  - search
  - exploration
---

# Context Gathering

## When to Use This Skill

Load this skill when:

- Researching a codebase before creating an implementation plan (Researcher agent)
- Gathering context for a specific task during execution (Executor, if unfamiliar area)
- Building a context map of file relationships and patterns
- Determining the complexity level for a feature request

## Multi-Pass Research Methodology

Research uses 1-3 passes depending on complexity. Each pass builds on the previous one's findings.

### Pass 1: Broad Semantic Search (Always Required)

**Goal:** Understand the project architecture, directory structure, framework, and high-level patterns.

**Actions:**

1. **Project structure scan** — `list_dir` on root, `src/`, and key directories
2. **Framework detection** — Read `package.json`, `tsconfig.json`, framework configs
3. **Architecture overview** — `semantic_search` for main entry points, routing, data flow
4. **Existing conventions** — Identify naming patterns, file organization, import style
5. **Key configuration** — Read environment configs, build configs, database configs

**Search queries for Pass 1:**

```
semantic_search: "main entry point application setup"
semantic_search: "routing configuration endpoints"
semantic_search: "database connection configuration"
file_search: "**/*.config.*"
file_search: "**/package.json"
```

**Output from Pass 1:**

- Framework and language identified
- Directory structure mapped
- Key config files listed
- Initial patterns observed
- Areas of interest flagged for Pass 2

### Pass 2: Targeted Grep (Medium+ Complexity)

**Goal:** Find specific patterns, function signatures, import chains, error handling conventions, and configuration details relevant to the feature.

**Actions:**

1. **Pattern matching** — `grep_search` for specific function names, types, interfaces
2. **Import chain tracing** — Find who imports what, dependency relationships
3. **Error handling patterns** — How errors are handled in similar code
4. **Test patterns** — What testing framework, test structure, mock patterns
5. **Similar features** — Find existing code that does something similar to the requested feature

**Search queries for Pass 2:**

```
grep_search: "export function|export const|export class" (in target directory)
grep_search: "import.*from.*{target_module}"
grep_search: "catch|throw|Error" (in relevant files)
grep_search: "describe|it|test|expect" (in test files)
file_search: "**/*.test.*" or "**/*.spec.*"
```

**Output from Pass 2:**

- Specific functions and types cataloged
- Import dependency graph for relevant modules
- Error handling conventions documented
- Test patterns identified
- Similar existing features found (with file paths)

### Pass 3: Deep Read (Complex Features Only)

**Goal:** Deeply understand critical files, trace data flow through the system, and examine edge cases.

**Actions:**

1. **Critical file examination** — use the workspace file-read tool on every primary file, line-by-line
2. **Data flow tracing** — Follow data from API entry point through business logic to persistence
3. **State management analysis** — How state flows, where mutations happen, what triggers updates
4. **Edge case discovery** — Boundary conditions, error paths, race conditions
5. **Integration points** — External APIs, databases, message queues, file systems

**Output from Pass 3:**

- Detailed understanding of each critical file's purpose and structure
- Data flow diagram (conceptual)
- State management patterns documented
- Edge cases and potential issues identified
- Integration point contracts documented

## Complexity Detection

Determine the research depth needed before starting:

### Simple (1 Pass)

**Indicators:**

- Small change to a well-understood area
- Familiar patterns (e.g., add another CRUD endpoint like existing ones)
- Modifying 1-2 files
- Clear, direct implementation path

**Examples:** Add a config value, create a utility function matching existing patterns, update a type definition.

### Medium (2 Passes)

**Indicators:**

- New feature area with some unknowns
- Moderate number of files (3-5)
- Need to understand existing patterns before implementing
- Some integration with existing systems

**Examples:** New API endpoint with validation and database interaction, component with state management, middleware addition.

### Complex (3 Passes)

**Indicators:**

- Cross-cutting concern affecting multiple subsystems
- Large feature with many dependencies
- Unfamiliar codebase or technology
- Integration with external systems
- Security-sensitive functionality

**Examples:** Authentication system, search with indexing, real-time data sync, payment processing.

## Search Strategy Hierarchy

Use tools in this priority order — start with the highest applicable tool:

| Priority | Tool              | Best For                 | When to Use                             |
| -------- | ----------------- | ------------------------ | --------------------------------------- |
| 1        | `semantic_search` | Conceptual understanding | "Find code that handles authentication" |
| 2        | `grep_search`     | Exact patterns           | "Find all files importing UserService"  |
| 3        | `file_search`     | File discovery           | "Find all test files"                   |
| 4        | File read tool      | Deep understanding       | "Understand this specific file's logic" |
| 5        | `list_dir`        | Structure mapping        | "What's in the src/api/ directory?"     |

**Rules:**

- Start broad (semantic), narrow down (grep), then deep dive (read)
- Parallelize independent searches in the same pass
- Deduplicate results between passes — don't re-search what you already found
- Stop when you have sufficient confidence — more research has diminishing returns

## Context Map Output Format

The researcher must produce a structured context map in this format:

```yaml
context_map:
  primary_files:
    - path: "src/api/handlers/search.ts"
      role: "Main handler for search endpoint — this is where the new feature will be added"
      key_exports:
        - "searchHandler"
        - "SearchOptions"
    - path: "src/services/searchService.ts"
      role: "Business logic layer for search — orchestrates query building and result formatting"
      key_exports:
        - "SearchService"
        - "performSearch"

  secondary_files:
    - path: "src/middleware/auth.ts"
      role: "Authentication middleware — search endpoint must use this"
    - path: "src/types/api.ts"
      role: "Shared API types — add new SearchRequest/SearchResponse types here"
    - path: "src/config/routes.ts"
      role: "Route configuration — register new endpoint here"

  test_files:
    - path: "src/api/handlers/__tests__/search.test.ts"
      coverage: "Unit tests for search handler — 4 existing tests"
    - path: "tests/integration/api/search.integration.test.ts"
      coverage: "Integration tests with database — 2 existing tests"

  patterns_to_follow:
    - pattern: "Handler pattern"
      example_file: "src/api/handlers/users.ts"
      description: "All handlers use async (req, res) => {} with try/catch, validate input with zod, call service layer"
    - pattern: "Service pattern"
      example_file: "src/services/userService.ts"
      description: "Services are classes with injected dependencies, methods return Result<T, Error>"
    - pattern: "Error handling"
      example_file: "src/middleware/errorHandler.ts"
      description: "Errors thrown as AppError(status, message), caught by global error handler"

  suggested_sequence:
    - "1. Add SearchRequest/SearchResponse types to src/types/api.ts"
    - "2. Create SearchService in src/services/searchService.ts following userService pattern"
    - "3. Create search handler in src/api/handlers/search.ts following users.ts pattern"
    - "4. Register route in src/config/routes.ts"
    - "5. Add unit tests following existing test patterns"
```

## Hybrid Retrieval Pattern

The recommended approach combines multiple search tools for comprehensive coverage:

```
1. SEMANTIC SEARCH — Find conceptually related code
   → "authentication middleware", "search implementation"
   → Produces: initial file list with relevance scores

2. GREP SEARCH — Find exact patterns and references
   → "import.*SearchService", "export.*search"
   → Produces: precise file matches, line numbers

3. MERGE & DEDUPLICATE — Combine results
   → Remove duplicate file paths
   → Rank by: appeared in both searches > semantic only > grep only

4. RELATIONSHIP DISCOVERY — Map connections
   → For each primary file: who imports it? what does it import?
   → Build informal dependency graph

5. READ IMPORTANT FILES — Deep examination
   → Read primary files and key secondary files
   → Understand implementation details, not just signatures

6. ANALYZE GAPS — Identify what's missing
   → Are there areas the feature touches that weren't covered?
   → Are there patterns used elsewhere that weren't found?
   → Any external dependencies or config not yet examined?

7. REPORT — Structured output
   → Context map in the format above
   → Findings summary
   → Confidence assessment
```

## Structured Research Output

The full research output follows this format:

```yaml
research_output:
  tldr: "One-sentence summary of findings, e.g., 'Express API with PostgreSQL, uses repository pattern, auth via JWT middleware'"

  research_metadata:
    confidence: "high" # low | medium | high
    coverage: "85%" # estimated % of relevant code examined
    gaps:
      - "Did not examine WebSocket integration — may be relevant if real-time search is needed"
    passes_completed: 2

  context_map:
    # ... (full context map as shown above)

  findings:
    architecture_notes: |
      Express API with layered architecture: handlers → services → repositories.
      PostgreSQL via Prisma ORM. Redis for caching. JWT auth middleware on all protected routes.
    dependencies:
      - "prisma 5.x — ORM for database access"
      - "zod 3.x — input validation in handlers"
      - "redis 4.x — response caching"
    constraints:
      - "All endpoints must go through auth middleware"
      - "Database queries must use Prisma (no raw SQL)"
      - "Response format must match existing { data, meta, error } envelope"
    risks:
      - "Search on large datasets may need database indexing"
      - "Full-text search may require PostgreSQL tsvector or Elasticsearch"

  open_questions:
    - "Should search results be cached? If so, what TTL?"
    - "Does the feature need pagination or infinite scroll?"
```

## Verification

Research is complete and valid when:

1. **Confidence ≥ medium**: Researcher has enough context to support planning
2. **Coverage ≥ 70%**: Most relevant code areas have been examined
3. **Gaps documented**: Any unexamined areas are explicitly listed
4. **Context map populated**: Primary files, secondary files, and patterns are identified
5. **Sequence suggested**: An ordered implementation approach is proposed
6. **Patterns found**: At least one existing pattern to follow is identified with an example file
7. **No fabricated files**: Every file path in the context map actually exists in the workspace
8. **Findings coherent**: Architecture notes, dependencies, and constraints are consistent with each other
9. **Open questions listed**: Unresolved ambiguities are documented, not ignored
10. **Pass count matches complexity**: Simple → 1 pass, Medium → 2 passes, Complex → 3 passes
