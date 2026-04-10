---
name: code-review
description: "Provides verification checklists for code review including acceptance criteria validation, specification compliance checking, OWASP security patterns, and evidence-based assessment. Use when verifying task implementation quality."
disable-model-invocation: true
argument-hint: "Task ID or files to review"
tags:
  - review
  - verification
  - checklist
  - acceptance-criteria
  - quality
---

# Code Review

## When to Use This Skill

Load this skill when:

- Verifying a task's implementation against its acceptance criteria (Verifier agent)
- Conducting specification compliance checks on executor output
- Performing security review on high-risk task implementations
- Deciding the appropriate review depth for a task

## Review Depth Tiers

The coordinator determines review depth before delegating to the verifier. Use this decision tree:

```
Is the task security-sensitive (auth, crypto, input validation, SQL)?
  → YES: review_depth = "full"
  → NO: Is the task high-priority OR complex (estimated_effort = "large")?
    → YES: review_depth = "full"
    → NO: Is the task documentation/config only?
      → YES: review_depth = "lightweight"
      → NO: review_depth = "standard"
```

### Full Review

**When:** Security-sensitive tasks, high-priority tasks, large effort tasks.

**Procedure:**

1. Read every file in `files_modified` line-by-line
2. Verify each acceptance criterion with concrete evidence
3. Run all relevant tests and capture output
4. Check for regressions (other files not broken, existing tests still pass)
5. OWASP security scan (see OWASP Quick Reference below)
6. Specification compliance check (required patterns present, forbidden patterns absent)
7. Code quality assessment (naming, function size, error handling, DRY)

**Evidence required:** File content excerpts, test output transcripts, command results.

### Standard Review

**When:** Typical tasks with moderate risk.

**Procedure:**

1. Check each acceptance criterion individually with evidence
2. Verify file changes match `files_to_modify` from the plan
3. Spot-check code quality (naming, obvious anti-patterns, error handling)
4. Verify no obvious regressions (quick scan of modified files' dependents)
5. Specification compliance check

**Evidence required:** Per-criterion evidence (file content or command output proving pass/fail).

### Lightweight Review

**When:** Documentation changes, configuration updates, low-risk tasks.

**Procedure:**

1. Verify listed files exist
2. Check basic content correctness (file non-empty, expected structure present)
3. Verify no unintended changes to other files

**Evidence required:** File existence confirmation, basic content snippets.

## Verification Methodology

### Per-Criterion Evidence Gathering

For every acceptance criterion in the task definition:

```
1. IDENTIFY — Read the criterion text carefully
2. LOCATE — Find the relevant code/file/output
3. EXAMINE — Read the actual file content (never trust claims)
4. EVIDENCE — Capture concrete proof
5. JUDGE — Determine PASS or FAIL based on evidence
6. RECORD — Document the criterion, result, and evidence
```

**Critical rule:** NEVER trust the executor's self-assessment. Always verify independently.

### Specification Compliance

Check that the implementation follows locked-in decisions:

```
required_patterns:
  For each pattern in specification_adherence.required_patterns:
    1. Search for the pattern in modified files
    2. Verify it is correctly applied (not just present, but correct)
    3. Record: pattern name, found in file(s), correctly applied (yes/no)

forbidden_patterns:
  For each pattern in specification_adherence.forbidden_patterns:
    1. Search for the pattern in modified files
    2. If found → FAIL with specific location
    3. Record: pattern name, found (yes/no), location if found

tech_choices:
  For each choice in specification_adherence.tech_choices:
    1. Verify the correct technology is used (not a substitute)
    2. Record: choice name, implemented correctly (yes/no)
```

### Code Quality Assessment

For `full` and `standard` review depths:

| Category       | Check                                                           | Example                                                |
| -------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| Naming         | Variables/functions have descriptive, intention-revealing names | `getUserById` not `get`, `isActive` not `flag`         |
| Functions      | Single responsibility, under 40 lines, max 4 params             | Split large functions, use options objects             |
| Error handling | All errors caught and handled, no empty catch blocks            | Meaningful error messages, proper recovery             |
| DRY            | No duplicated logic across files                                | Extract shared utilities                               |
| Patterns       | Follows existing codebase conventions                           | Match naming, structure, and style of surrounding code |
| Completeness   | No TODOs, no placeholders, no stub functions                    | Every function fully implemented                       |

### Regression Check

```
1. Identify files that import from or depend on modified files
2. Check that modified exports haven't changed in breaking ways
3. If tests exist for modified files, verify they still pass
4. Check build/type-check status (run tsc or equivalent)
5. Record: what was checked, passed (yes/no), details
```

## Evidence Types

### File Content Evidence

Read the actual file and extract the relevant section:

```
criterion: "File exports rateLimitMiddleware function"
result: pass
evidence: |
  src/middleware/rateLimit.ts:15 —
  export function rateLimitMiddleware(options: RateLimitOptions): Middleware {
    // ... full implementation present (42 lines)
  }
```

### Test Output Evidence

Run the test and capture results:

```
criterion: "All search tests pass"
result: pass
evidence: |
  $ npm test -- --grep "search"
  ✓ returns paginated results (23ms)
  ✓ handles empty query (5ms)
  ✓ validates page_size parameter (8ms)
  3 passing (36ms)
```

### Command Result Evidence

Run a command and capture output:

```
criterion: "TypeScript compiles without errors"
result: pass
evidence: |
  $ npx tsc --noEmit
  (exit code 0, no output)
```

### Structural Check Evidence

Verify file existence, exports, or configuration:

```
criterion: "Config file includes search endpoint"
result: pass
evidence: |
  File exists: src/config/routes.ts
  Line 24: { path: '/api/search', handler: searchHandler }
```

## OWASP Quick Reference

For `full` review depth, check against the OWASP Top 10:

| #   | Vulnerability                   | What to Check                                                                                                |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | **Injection**                   | User input included in SQL, shell commands, or eval? Use parameterized queries, avoid string concatenation.  |
| 2   | **Broken Authentication**       | Credentials hardcoded? Session handling secure? Passwords hashed with bcrypt/argon2?                         |
| 3   | **Sensitive Data Exposure**     | API keys, tokens, or PII in logs/responses? HTTPS enforced? Sensitive headers set?                           |
| 4   | **XML External Entities (XXE)** | XML parsing configured to disable external entities? DTD processing disabled?                                |
| 5   | **Broken Access Control**       | Authorization checked on every endpoint? Role-based access enforced? Direct object references protected?     |
| 6   | **Security Misconfiguration**   | Default credentials? Verbose error messages in production? Unnecessary features enabled? CORS misconfigured? |
| 7   | **Cross-Site Scripting (XSS)**  | User input rendered without escaping? innerHTML used? Content-Security-Policy set?                           |
| 8   | **Insecure Deserialization**    | Untrusted data deserialized? JSON.parse on user input without schema validation?                             |
| 9   | **Known Vulnerabilities**       | Dependencies with CVEs? Outdated packages? `npm audit` clean?                                                |
| 10  | **Insufficient Logging**        | Security events logged? Failed auth attempts tracked? Audit trail present?                                   |

## Common Verification Pitfalls

Avoid these mistakes that lead to false PASS verdicts:

| Pitfall                               | Description                                                     | Prevention                                                   |
| ------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| **Trusting executor self-assessment** | Accepting "I implemented it" without reading the actual file    | Always read modified files. Never trust claims.              |
| **Only checking happy path**          | Verifying the success case but not error/edge cases             | Check at least one error case per criterion                  |
| **Not verifying file changes**        | Assuming files were modified because they're listed             | Read each file in `files_modified`, confirm changes exist    |
| **Accepting "I tested it"**           | Trusting verbal claim of test execution without captured output | Run the test yourself and capture output                     |
| **Overlooking missing files**         | Not checking that ALL `files_to_modify` were actually changed   | Cross-reference plan's `files_to_modify` with actual changes |
| **Surface-level code scan**           | Glancing at code structure without reading logic                | Read the implementation, trace the logic flow                |
| **Ignoring specification adherence**  | Not checking required/forbidden patterns                        | Explicitly search for each pattern                           |
| **Partial criterion check**           | Marking a criterion as PASS when only part of it is satisfied   | Break compound criteria into individual checks               |

## Verification Output Format

The verifier must produce this exact output structure:

```yaml
verifier_output:
  verdict: "PASS | FAIL"
  criteria_results:
    - criterion: "GET /api/search returns 200 with results array"
      result: "pass"
      evidence: "Response body: { results: [...], total: 42 }. Status: 200."
    - criterion: "Invalid query returns 400 with error message"
      result: "pass"
      evidence: "GET /api/search?page=-1 returns 400: { error: 'Invalid page number' }"
  specification_compliance:
    compliant: true
    violations: []
  code_quality:
    issues:
      - "Function searchHandler is 52 lines — consider extracting validation logic"
  regression_check:
    passed: true
    details: "Existing tests pass (npm test: 47 passing). TypeScript compiles (tsc --noEmit: clean)."
  overall_summary: "All 4 acceptance criteria verified with evidence. Code quality is good with one minor suggestion. No regressions detected."
  failure_details: null
```

**On FAIL verdict**, `failure_details` must include:

- Which criteria failed and why
- Specific file and line references
- Exact fix instructions for the executor retry

```yaml
failure_details: |
  FAILED criterion: "Invalid query returns 400 with error message"
  Issue: GET /api/search?page=-1 returns 500 instead of 400.
  Location: src/api/search.ts:34 — missing input validation before query execution.
  Fix: Add parameter validation at the start of the handler function.
  Validate: page >= 1, page_size between 1-100, q is a non-empty string.
```

## Verification

A thorough verification meets ALL of these criteria:

1. **Every acceptance criterion checked**: No criterion is skipped or assumed
2. **Evidence is concrete**: Every PASS/FAIL includes file content, test output, or command results
3. **Independence verified**: No evidence relies solely on executor's self-assessment
4. **Specification compliance checked**: Required patterns confirmed present, forbidden patterns confirmed absent
5. **Appropriate depth applied**: Review depth matches the task's risk profile
6. **Regressions considered**: For full/standard, existing functionality confirmed unbroken
7. **Failure details are actionable**: If FAIL, the executor can fix the issue from the details alone
8. **Output format correct**: verifier_output follows the exact schema above
