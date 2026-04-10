---
name: devops-cicd
description: "CI/CD and DevOps patterns: GitHub Actions workflows, Docker best practices, environment configuration, and deployment checklists. Use when configuring pipelines, containers, or deployments."
tags:
  - development
  - devops
  - ci-cd
  - github-actions
  - docker
  - deployment
triggers:
  - ci cd pipeline
  - github actions
  - docker build
  - deployment pipeline
  - devops setup
---

# DevOps & CI/CD Skill

Patterns for pipelines, containers, and deployment.

## WHEN_TO_USE

Apply this skill when configuring CI/CD pipelines, writing Dockerfiles, setting up GitHub Actions workflows, or preparing deployment checklists. Reference the patterns here before creating new pipeline or container configurations.

## GitHub Actions Workflow Pattern

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

### Key Practices
- Pin action versions to specific commits or major tags (`@v4`).
- Use `concurrency` to cancel superseded runs.
- Cache dependencies (`cache: 'npm'`, `cache: 'pip'`).
- Run lint before test, test before build. Fail fast.

## Docker Best Practices

```dockerfile
# Multi-stage build
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### Rules
- Use multi-stage builds to minimize image size.
- Run as non-root user.
- Include `.dockerignore` (node_modules, .git, .env, tests).
- Pin base image versions. Never use `latest`.
- Add HEALTHCHECK for orchestrator integration.
- One process per container.

## Environment Configuration

```
.env.example          # Template with all required variables (committed)
.env                  # Local overrides (gitignored)
.env.test             # Test environment (gitignored)
```

### Rules
- Never commit `.env` files with real values.
- Document every variable in `.env.example` with comments.
- Validate all environment variables at startup — fail fast if missing.
- Use typed config objects, not raw `process.env` access throughout code.

## Deployment Checklist

Pre-deploy:
- [ ] All tests pass on CI.
- [ ] No critical or high vulnerability alerts.
- [ ] Database migrations tested and reversible.
- [ ] Environment variables configured for target environment.
- [ ] Feature flags set correctly.

Deploy:
- [ ] Deploy to staging first. Verify.
- [ ] Deploy to production with rollback plan ready.
- [ ] Monitor error rates and latency for 15 minutes post-deploy.

Post-deploy:
- [ ] Verify health checks pass.
- [ ] Run smoke tests against production.
- [ ] Notify team of successful deployment.
