# TermStack — Project Instructions

## Commands

```bash
# Build
npm run build            # Next.js production build

# Type check
npx tsc --noEmit         # TypeScript type checking (zero-emission)

# Dev server
npm run dev              # Next.js dev server (Electron host)

# Database
npx prisma generate      # Regenerate Prisma client after schema changes
npx prisma db push       # Push schema changes to database
```

## Architecture

TermStack is an Electron + Next.js desktop app that generates websites using 5 CLI agents (Claude Code SDK, Codex, Cursor, Qwen, GLM).

- `lib/services/cli/` — 5 CLI agent adapters. Each adapter calls its CLI tool to generate website code.
  - `shared-instructions.ts` exports `PLATFORM_RULES` — the single source of truth for all agent instructions.
- `lib/utils/scaffold.ts` — Generates project files for new Next.js projects (CLAUDE.md, settings.json, rules, skills, hooks, .codex/config.toml, .cursor/rules/).
- `lib/services/preview.ts` — Handles iframe preview with multi-layer error recovery (compile errors, runtime errors, hydration, network, module resolution).
- `pages/` — Next.js pages router (the TermStack app UI itself).
- `components/` — React components for the TermStack UI.
- `electron/` — Electron main process, window management, IPC.
- `prisma/` — Database schema for projects, messages, settings.
- `contexts/` — React contexts for app state.
- `hooks/` — React hooks.

## Key Decisions

- **Tailwind CSS v4** (not v3): Uses `@import "tailwindcss"` and `@theme` blocks in CSS. No tailwind.config.ts. No `@tailwind` directives.
- **PLATFORM_RULES single source of truth**: All 5 CLI adapters import from `shared-instructions.ts`. Never duplicate rules.
- **Port pool 3100-3999**: Generated projects use ports in this range. Never use 3000 (reserved for TermStack), 8080, or other common ports.
- **No npm/yarn in generated projects**: The platform auto-installs dependencies by writing to package.json. Agents must never run `npm install` or `yarn add`.
- **No deleting .next or node_modules**: The platform manages these directories. Agents must never delete them.
- **Next.js 15 App Router**: Generated projects use the App Router pattern (app/ directory, page.tsx, layout.tsx).

## Domain Knowledge

- **Agent/Adapter**: Each of the 5 CLI tools (Claude, Codex, Cursor, Qwen, GLM) has an adapter in `lib/services/cli/` that translates TermStack's API into CLI invocations.
- **Scaffold**: The initial file structure generated when a user creates a new project. Managed by `scaffold.ts`.
- **Preview**: The iframe-based live preview of the generated website. Managed by `preview.ts`.
- **PLATFORM_RULES**: The shared instruction set that all agents follow to avoid breaking generated projects.

## Workflow

- Run `npx tsc --noEmit` after making code changes to catch type errors
- When modifying scaffold.ts, verify the generated file content is syntactically valid
- When modifying an adapter, ensure PLATFORM_RULES is still imported and used
- Prefer fixing root causes over workarounds

## Don'ts

- Don't modify generated projects' node_modules or .next directories
- Don't run npm install/yarn add in generated project contexts
- Don't use ports outside 3100-3999 for generated projects
- Don't duplicate PLATFORM_RULES content — import from shared-instructions.ts
- Don't modify `*.gen.ts` or `*.generated.*` files
