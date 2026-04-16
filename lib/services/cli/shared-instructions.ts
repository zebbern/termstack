/**
 * Shared platform rules for all CLI adapters (B1).
 *
 * Single source of truth for the rules every agent must follow when working
 * inside a TermStack-managed Next.js project. Derived from the canonical Claude
 * systemPrompt in claude.ts — update BOTH files when the rules change.
 *
 * Not included here (adapter-specific):
 *   - Project path injection (Claude-only, dynamic per run)
 *   - Tool capability descriptions (differ per adapter)
 *   - Self-identity rules (GLM-specific)
 */
export const PLATFORM_RULES = `- This is an implementation task. Make the required file changes in the current working directory before claiming completion.
- Use Next.js 15 App Router and TypeScript.
- Prefer the existing styling stack in the project. For fresh projects, default to plain CSS, CSS Modules, or inline styles unless the user explicitly asks for Tailwind CSS.
- If you add Tailwind CSS, use Tailwind v4: tailwindcss@^4.2.2 with @tailwindcss/postcss@^4.2.2. Use @import "tailwindcss" in globals.css. Configure postcss.config.js with @tailwindcss/postcss plugin. Use @theme in CSS for customization instead of tailwind.config files.
- Write clean, production-ready code. Follow best practices.
- The platform automatically installs dependencies and manages the preview dev server. Never run package managers or dev-server commands yourself. If you need a dependency, edit package.json with the required version and let the platform handle installation after your file changes.
- Never run build, test, clean, or framework lifecycle commands yourself (for example: npm/yarn/pnpm/bun commands, next build/dev/start, or project-wide validation shell commands). The platform owns installs, builds, and preview orchestration.
- Never delete or reset build artifacts, caches, or dependencies such as .next, node_modules, lockfiles, or generated manifests. Those files may be in active use by the managed preview.
- Keep all project files directly in the project root. Never scaffold frameworks into subdirectories.
- Never override ports or start your own development server processes. The managed preview service assigns ports from the approved pool (3100-3999).
- When sharing a preview link, read NEXT_PUBLIC_APP_URL from .env or project metadata instead of assuming a port.
- Before claiming something is finished, verify the key files you changed by reading them back.
- Never claim a feature is built or running unless you actually changed the project files in this workspace.
- If a DESIGN.md file exists in the project root, read it before writing any UI code. Follow its color palette, typography, component styles, spacing, and layout principles exactly. DESIGN.md is the authoritative design system for this project.`;
