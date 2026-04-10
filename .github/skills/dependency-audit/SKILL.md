---
name: dependency-audit
description: "Dependency auditing: vulnerability scanning, license compliance, outdated package detection, and update strategies. Use when checking or updating project dependencies."
tags:
  - development
  - dependencies
  - audit
  - vulnerability
  - license
  - outdated
triggers:
  - audit dependencies
  - dependency vulnerabilities
  - outdated packages
  - license compliance
  - npm audit
---

# Dependency Audit Skill

Procedures for auditing dependencies across ecosystems.

## WHEN_TO_USE

Apply this skill when scanning for dependency vulnerabilities, checking license compliance, identifying outdated packages, or planning a dependency update strategy.

## Vulnerability Scanning

### Node.js
```bash
npm audit                          # Basic audit
npm audit --json                   # JSON output for parsing
npm audit fix                      # Auto-fix compatible updates
npm audit fix --force              # Force fix (may include breaking changes)
npx better-npm-audit audit         # Enhanced audit with severity filtering
```

### Python
```bash
pip-audit                          # Scan installed packages
pip-audit -r requirements.txt      # Scan requirements file
pip-audit --format json            # JSON output
safety check                       # Alternative scanner
```

### General Tools
```bash
npx snyk test                      # Snyk vulnerability scan
trivy fs .                         # Trivy filesystem scan
grype .                            # Grype vulnerability scan
```

## License Compatibility

### Permissive Licenses (generally safe)
- MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD

### Copyleft Licenses (require review)
- GPL-2.0, GPL-3.0 — require derivative work to be GPL-licensed.
- LGPL-2.1, LGPL-3.0 — dynamic linking usually OK, static linking triggers copyleft.
- AGPL-3.0 — network use triggers copyleft. Avoid in SaaS unless intentional.
- MPL-2.0 — file-level copyleft. Modified files must stay MPL.

### Compatibility Matrix

| Your License | Can use MIT | Can use Apache | Can use GPL | Can use AGPL |
|-------------|-------------|----------------|-------------|--------------|
| MIT | Yes | Yes | No | No |
| Apache-2.0 | Yes | Yes | No | No |
| GPL-3.0 | Yes | Yes | Yes | No |
| AGPL-3.0 | Yes | Yes | Yes | Yes |

### Check Commands
```bash
npx license-checker --summary      # Node.js license summary
npx license-checker --failOn "GPL" # Fail on GPL licenses
pip-licenses                        # Python license listing
```

## Outdated Package Detection

```bash
npm outdated                        # Node.js outdated packages
pip list --outdated                  # Python outdated packages
```

## Update Strategies

1. **Patch updates** (x.x.PATCH): Apply immediately. Low risk.
2. **Minor updates** (x.MINOR.x): Apply in batches. Test before merging.
3. **Major updates** (MAJOR.x.x): Treat as a migration. Review changelog, test thoroughly.

### Process
1. Run audit to identify vulnerable/outdated packages.
2. Classify updates by risk (patch / minor / major).
3. Apply patch updates first, test.
4. Apply minor updates in batches, test.
5. Plan major updates as separate migration tasks.
6. Re-run audit to verify all issues resolved.
