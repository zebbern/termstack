---
name: git-workflow
description: "Git workflow conventions: conventional commits, branch naming, PR templates, merge strategy, and changelog generation. Use when creating commits, branches, or pull requests."
tags:
  - development
  - git
  - commits
  - branching
  - pr
  - changelog
triggers:
  - git workflow
  - conventional commits
  - branch naming
  - changelog
  - merge strategy
---

# Git Workflow Skill

Practical patterns, examples, and edge case guidance for Git workflows. For the base rules, see `git.instructions.md`. This skill extends those rules with how-to guidance.

## WHEN_TO_USE

Apply this skill when:
- Writing commit messages for non-trivial changes (multi-scope, breaking changes, reverts).
- Handling complex merge/rebase scenarios.
- Preparing a release (tagging, changelog, version bumps).
- Reviewing Git history for consistency.

## Commit Message Examples

### Good vs Bad

```
# BAD: vague, no type, past tense
fixed stuff
updated code
changes

# BAD: too long, wrong mood, has period
feat(authentication): Added the new OAuth2 login flow for users to authenticate with Google and GitHub providers.

# GOOD: clear type, imperative, concise
feat(auth): add OAuth2 login flow
fix(api): handle null response from payment gateway
refactor(db): extract query builder into separate module

# GOOD: scoped to specific area
test(auth): add integration tests for login flow
build(deps): upgrade React to v19
ci(actions): add staging deployment workflow
```

### Multi-Scope Commits

When a change spans multiple scopes, pick the primary scope and mention others in the body:

```
feat(auth): add session refresh on token expiry

Affects auth, api, and middleware modules.
- Auth: add refreshToken() to session manager
- API: pass refresh token header on 401 retry
- Middleware: check token expiry before route handler
```

### Breaking Change Commits

```
feat(api)!: change pagination from offset to cursor-based

BREAKING CHANGE: All list endpoints now require `cursor` parameter
instead of `page`/`limit`. Responses include `nextCursor` instead
of `totalPages`.

Migration: Replace `?page=2&limit=20` with `?cursor=<nextCursor>&limit=20`.
```

### Revert Commits

```
revert: feat(auth): add OAuth2 login flow

This reverts commit abc1234.

Reason: OAuth provider rate-limiting caused login failures
under load. Reverting until rate-limit handling is implemented.
```

## Complex Merge Scenarios

### Feature Branch Behind Main

```bash
# Preferred: rebase onto main (clean linear history)
git fetch origin
git rebase origin/main

# If conflicts arise, resolve file-by-file
git status                    # see conflicted files
# edit files to resolve conflicts
git add <resolved-file>
git rebase --continue

# Abort if rebase becomes unmanageable
git rebase --abort
```

### When to Rebase vs Merge

| Scenario | Strategy | Why |
|----------|----------|-----|
| Feature branch behind main | Rebase | Clean linear history |
| Long-lived branch with shared collaborators | Merge | Preserves contributor history |
| Conflict-heavy divergence (10+ conflicts) | Merge | Safer, single conflict resolution |
| Pre-PR cleanup of local commits | Interactive rebase | Squash WIP commits |

### Interactive Rebase to Clean Up History

Before opening a PR, clean up work-in-progress commits:

```bash
# Squash last 4 commits into meaningful units
git rebase -i HEAD~4

# In the editor:
pick abc1234 feat(auth): add login form
squash def5678 wip: form validation
squash ghi9012 fix: typo in error message
squash jkl3456 wip: add tests

# Rewrite the combined commit message
feat(auth): add login form with validation

- Email/password form with client-side validation
- Error messages for invalid credentials
- Unit tests for form submission
```

### Resolving Merge Conflicts

1. **Understand both sides** — read the diff, not just the conflict markers.
2. **Keep the intent of both changes** when possible.
3. **Run tests after resolving** — a clean merge is not necessarily a correct merge.
4. **Never blindly accept "ours" or "theirs"** on non-trivial conflicts.

## Release Workflow

### Tagging a Release

```bash
# Create annotated tag (preferred over lightweight)
git tag -a v2.1.0 -m "Release v2.1.0: cursor pagination, OAuth2 flow"

# Push tag
git push origin v2.1.0
```

### Semantic Versioning from Commits

| Commit Type | Version Bump | Example |
|-------------|-------------|---------|
| `fix` | Patch (1.0.X) | `fix(api): handle null response` |
| `feat` | Minor (1.X.0) | `feat(auth): add OAuth2 login` |
| `BREAKING CHANGE` | Major (X.0.0) | `feat(api)!: change pagination` |
| `docs`, `style`, `refactor`, `test`, `ci`, `chore` | No bump | Internal changes |

### Changelog Generation from Commits

Structure generated changelogs by commit type:

```markdown
## [2.1.0] - 2026-02-23

### Added
- OAuth2 login flow (`feat(auth): add OAuth2 login flow`)
- User profile page (`feat(ui): add profile page`)

### Fixed
- Null response handling in payment gateway (`fix(api): handle null response`)

### Performance
- Added index on user_email column (`perf(search): add index on user_email`)

### Breaking Changes
- Pagination changed from offset to cursor-based (`feat(api)!: change pagination`)
```

### Hotfix Flow

```bash
# Branch from the release tag, not main
git checkout -b hotfix/payment-timeout v2.1.0

# Fix, commit, tag
git commit -m "fix(payments): increase gateway timeout to 30s"
git tag -a v2.1.1 -m "Hotfix: payment gateway timeout"

# Merge back to main AND the current release branch
git checkout main
git merge hotfix/payment-timeout
git checkout release/2.2.0
git merge hotfix/payment-timeout
git branch -d hotfix/payment-timeout
```

## Common Mistakes to Avoid

| Mistake | Why It's Bad | Fix |
|---------|-------------|-----|
| `git push --force` on shared branches | Rewrites history others depend on | Use `--force-with-lease` on personal branches only |
| Committing `.env`, secrets, or credentials | Exposed in history even after deletion | Add to `.gitignore` before first commit; use `git-filter-repo` to purge |
| Giant commits with unrelated changes | Impossible to review, revert, or bisect | One logical change per commit |
| Merge commits in feature branches | Noisy history, hard to rebase later | Rebase instead of merge to sync with main |
| Vague branch names (`fix/stuff`, `test`) | No context for reviewers or CI | Use descriptive kebab-case: `fix/login-redirect-loop` |
| Forgetting to delete merged branches | Branch clutter, confusion about active work | Delete immediately after merge |
| Committing generated files (build/, dist/) | Bloats repo, causes merge conflicts | Add to `.gitignore` |

## TROUBLESHOOTING

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

### Remove Sensitive Data from History

```bash
# Install git-filter-repo (preferred over filter-branch)
git filter-repo --path secrets.env --invert-paths
git push --force-with-lease
```

### Find Which Commit Introduced a Bug

```bash
git bisect start
git bisect bad                 # current commit is broken
git bisect good v2.0.0         # last known good version
# Git checks out middle commits — test each one
git bisect good                # or git bisect bad
# Repeat until the culprit is found
git bisect reset
```
