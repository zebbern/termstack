import fs from 'fs/promises';
import path from 'path';
import { loadGlobalSettings } from '../services/settings';
import type { MCPServerConfig } from '../services/settings';

async function writeFileIfMissing(filePath: string, contents: string) {
  try {
    await fs.access(filePath);
    return;
  } catch {
    // continue
  }
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, contents, 'utf8');
}

interface ScaffoldPackageVersions {
  next: string;
  react: string;
  reactDom: string;
  typescript: string;
  typesReact: string;
  typesNode: string;
  eslint: string;
  eslintConfigNext: string;
  postcss: string;
}

const DEFAULT_SCAFFOLD_PACKAGE_VERSIONS: ScaffoldPackageVersions = {
  next: '^15.5.6',
  react: '19.0.0',
  reactDom: '19.0.0',
  typescript: '^5.7.2',
  typesReact: '^19.0.0',
  typesNode: '^22.10.0',
  eslint: '^9.17.0',
  eslintConfigNext: '^15.5.6',
  postcss: '^8.4.49',
};

async function loadHostScaffoldPackageVersions(): Promise<ScaffoldPackageVersions> {
  try {
    const hostPackageJsonPath = path.resolve(process.cwd(), 'package.json');
    const hostPackageJsonRaw = await fs.readFile(hostPackageJsonPath, 'utf8');
    const hostPackageJson = JSON.parse(hostPackageJsonRaw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const hostNextVersion =
      hostPackageJson.dependencies?.next ??
      DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.next;
    const hostEslintConfigNextVersion =
      hostPackageJson.devDependencies?.['eslint-config-next'];

    return {
      next: hostNextVersion,
      react:
        hostPackageJson.dependencies?.react ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.react,
      reactDom:
        hostPackageJson.dependencies?.['react-dom'] ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.reactDom,
      typescript:
        hostPackageJson.devDependencies?.typescript ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.typescript,
      typesReact:
        hostPackageJson.devDependencies?.['@types/react'] ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.typesReact,
      typesNode:
        hostPackageJson.devDependencies?.['@types/node'] ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.typesNode,
      eslint:
        hostPackageJson.devDependencies?.eslint ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.eslint,
      eslintConfigNext:
        hostEslintConfigNextVersion === hostNextVersion
          ? hostEslintConfigNextVersion
          : hostNextVersion,
      postcss:
        hostPackageJson.devDependencies?.postcss ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.postcss,
    };
  } catch {
    return DEFAULT_SCAFFOLD_PACKAGE_VERSIONS;
  }
}

export async function scaffoldBasicNextApp(
  projectPath: string,
  projectId: string
) {
  await fs.mkdir(projectPath, { recursive: true });

  let enabledMcpServers: MCPServerConfig[] = [];
  try {
    const globalSettings = await loadGlobalSettings();
    enabledMcpServers = (globalSettings.mcp_servers || []).filter(s => s.enabled);
  } catch {
    // Global settings unavailable — skip MCP injection
  }

  const packageVersions = await loadHostScaffoldPackageVersions();

  const packageJson = {
    name: projectId,
    private: true,
    version: '0.1.0',
    scripts: {
      dev: 'node scripts/run-dev.js',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: packageVersions.next,
      react: packageVersions.react,
      'react-dom': packageVersions.reactDom,
    },
    devDependencies: {
      typescript: packageVersions.typescript,
      '@types/react': packageVersions.typesReact,
      '@types/node': packageVersions.typesNode,
      eslint: packageVersions.eslint,
      'eslint-config-next': packageVersions.eslintConfigNext,
      postcss: packageVersions.postcss,
    },
  };

  await writeFileIfMissing(
    path.join(projectPath, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'next.config.js'),
    `const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {};
nextConfig.outputFileTracingRoot = path.resolve(__dirname);

module.exports = nextConfig;
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'postcss.config.js'),
    `module.exports = {
  plugins: {},
};
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'tsconfig.json'),
    `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'next-env.d.ts'),
    `/// <reference types="next" />
/// <reference types="next/navigation-types/navigation" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'app/layout.tsx'),
    `import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'app/page.tsx'),
    `export default function Home() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '20px 1fr 20px',
      alignItems: 'center',
      justifyItems: 'center',
      minHeight: '100vh',
      padding: '80px',
      gap: '64px',
      fontFamily: 'var(--font-geist-sans)',
    }}>
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        gridRow: 2,
        alignItems: 'center',
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          Get started by editing
        </h1>
        <code style={{
          fontFamily: 'monospace',
          fontSize: '1rem',
          padding: '12px 20px',
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
        }}>
          app/page.tsx
        </code>
      </main>
      <footer style={{
        gridRow: 3,
        display: 'flex',
        gap: '24px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <a
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          Learn →
        </a>
        <a
          href="https://vercel.com/templates"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          Examples →
        </a>
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          Next.js →
        </a>
      </footer>
    </div>
  );
}
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'app/globals.css'),
    `:root {
  color-scheme: light;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'scripts/run-dev.js'),
    `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const nextCli = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

function parseCliArgs(argv) {
  const passthrough = [];
  let preferredPort;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--port' || arg === '-p') {
      const value = argv[i + 1];
      if (value && !value.startsWith('-')) {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed)) {
          preferredPort = parsed;
        }
        i += 1;
        continue;
      }
    } else if (arg.startsWith('--port=')) {
      const value = arg.slice('--port='.length);
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        preferredPort = parsed;
      }
      continue;
    } else if (arg.startsWith('-p=')) {
      const value = arg.slice('-p='.length);
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        preferredPort = parsed;
      }
      continue;
    }

    passthrough.push(arg);
  }

  return { preferredPort, passthrough };
}

function resolvePort(preferredPort) {
  const candidates = [
    preferredPort,
    process.env.PORT,
    process.env.WEB_PORT,
    process.env.PREVIEW_PORT_START,
    3100,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    const numeric =
      typeof candidate === 'number'
        ? candidate
        : Number.parseInt(String(candidate), 10);

    if (!Number.isNaN(numeric) && numeric > 0 && numeric <= 65535) {
      return numeric;
    }
  }

  return 3100;
}

(async () => {
  const argv = process.argv.slice(2);
  const { preferredPort, passthrough } = parseCliArgs(argv);
  const port = resolvePort(preferredPort);
  const url =
    process.env.NEXT_PUBLIC_APP_URL || \`http://localhost:\${port}\`;

  process.env.PORT = String(port);
  process.env.WEB_PORT = String(port);
  process.env.NEXT_PUBLIC_APP_URL = url;

  console.log(\`🚀 Starting Next.js dev server on \${url}\`);

  const child = spawn(
    process.execPath,
    [nextCli, 'dev', '--port', String(port), ...passthrough],
    {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: String(port),
        WEB_PORT: String(port),
        NEXT_PUBLIC_APP_URL: url,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    }
  );

  child.on('exit', (code) => {
    if (typeof code === 'number' && code !== 0) {
      console.error(\`❌ Next.js dev server exited with code \${code}\`);
      process.exit(code);
    }
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start Next.js dev server');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
})();
`
  );

  // Agent context files — auto-read by Claude Code, Codex, and Cursor on every session
  await writeFileIfMissing(
    path.join(projectPath, 'CLAUDE.md'),
    `# TermStack Project — Agent Rules

## Platform Constraints (never violate)

- Never run npm, yarn, pnpm, or bun commands. Edit package.json instead — the platform installs dependencies automatically.
- Never run next dev, next build, next start, or any dev-server command. The platform manages the preview process.
- Never delete or reset .next, node_modules, lockfiles, or generated manifests. They may be in active use.
- Never override ports or start your own server. The platform assigns ports from the approved pool (3100–3999).
- Keep all project files in the project root. Do not scaffold into subdirectories.
- Use only relative paths from the project root.

## Tech Stack

- Next.js 15 App Router + TypeScript (strict)
- Prefer the existing styling stack. For fresh projects, default to plain CSS or CSS Modules.
- If adding Tailwind CSS: use Tailwind v4 (tailwindcss@^4.2.2 + @tailwindcss/postcss@^4.2.2). Use @import "tailwindcss" in globals.css and @tailwindcss/postcss in postcss.config.js. Use @theme for customization instead of tailwind.config.*.

## Verification

- Read back changed files before claiming done.
- Never claim completion without actually modifying files.
- Never share a guessed preview URL. Read NEXT_PUBLIC_APP_URL from .env or project metadata.
`
  );

  await writeFileIfMissing(
    path.join(projectPath, 'AGENTS.md'),
    `# Agent Instructions

## Platform Constraints (never violate)

- Never run npm, yarn, pnpm, or bun commands. Edit package.json instead — the platform installs dependencies automatically.
- Never run next dev, next build, next start, or any dev-server command. The platform manages the preview process.
- Never delete or reset .next, node_modules, lockfiles, or generated manifests. They may be in active use.
- Never override ports or start your own server. The platform assigns ports from the approved pool (3100–3999).
- Keep all project files in the project root. Do not scaffold into subdirectories.
- Use only relative paths from the project root.

## Tech Stack

- Next.js 15 App Router + TypeScript (strict)
- Prefer the existing styling stack. For fresh projects, default to plain CSS or CSS Modules.
- If adding Tailwind CSS: use Tailwind v4 (tailwindcss@^4.2.2 + @tailwindcss/postcss@^4.2.2). Use @import "tailwindcss" in globals.css and @tailwindcss/postcss in postcss.config.js. Use @theme for customization instead of tailwind.config.*.

## Verification

- Read back changed files before claiming done.
- Never claim completion without actually modifying files.
- Never share a guessed preview URL. Read NEXT_PUBLIC_APP_URL from .env or project metadata.
`
  );

  await writeFileIfMissing(
    path.join(projectPath, '.cursor/rules/termstack.mdc'),
    `---
description: TermStack platform rules — apply to all files in this project
globs: ["**/*"]
alwaysApply: true
---

# TermStack Project — Agent Rules

## Platform Constraints (never violate)

- Never run npm, yarn, pnpm, or bun commands. Edit package.json instead — the platform installs dependencies automatically.
- Never run next dev, next build, next start, or any dev-server command. The platform manages the preview process.
- Never delete or reset .next, node_modules, lockfiles, or generated manifests. They may be in active use.
- Never override ports or start your own server. The platform assigns ports from the approved pool (3100–3999).
- Keep all project files in the project root. Do not scaffold into subdirectories.
- Use only relative paths from the project root.

## Tech Stack

- Next.js 15 App Router + TypeScript (strict)
- Prefer the existing styling stack. For fresh projects, default to plain CSS or CSS Modules.
- If adding Tailwind CSS: use Tailwind v4 (tailwindcss@^4.2.2 + @tailwindcss/postcss@^4.2.2). Use @import "tailwindcss" in globals.css and @tailwindcss/postcss in postcss.config.js. Use @theme for customization instead of tailwind.config.*.

## Verification

- Read back changed files before claiming done.
- Never claim completion without actually modifying files.
- Never share a guessed preview URL. Read NEXT_PUBLIC_APP_URL from .env or project metadata.
`
  );

  // Cursor: Tailwind v4 scoped rule — only triggers for CSS/component files
  await writeFileIfMissing(
    path.join(projectPath, '.cursor/rules/tailwind.mdc'),
    `---
description: Tailwind CSS v4 conventions for TermStack projects
globs: ["**/*.css", "**/*.tsx", "**/*.jsx"]
alwaysApply: false
---

# Tailwind CSS v4 — Cursor Rules

## Version
This project uses Tailwind CSS v4. Do NOT use v3 APIs.

## Setup
- postcss.config.js uses @tailwindcss/postcss (not tailwindcss or autoprefixer)
- globals.css uses @import "tailwindcss" (not @tailwind directives)
- Customization via @theme in CSS (not tailwind.config.*)

## Allowed
- @import "tailwindcss"
- @theme { --color-*: ...; --font-*: ...; }
- All standard Tailwind utility classes
- CSS-first configuration with @theme

## Forbidden (v3 legacy)
- @tailwind base / @tailwind components / @tailwind utilities
- tailwind.config.ts or tailwind.config.js
- autoprefixer in postcss.config.js (bundled in v4)
- theme() function in CSS (use CSS variables instead)

## Versions
- tailwindcss: ^4.2.2
- @tailwindcss/postcss: ^4.2.2
- postcss: ^8.4.49
`
  );

  // Claude Code skills — active capabilities, not just passive rules
  await writeFileIfMissing(
    path.join(projectPath, '.claude/skills/add-dependency/SKILL.md'),
    `---
name: add-dependency
description: How to properly add npm dependencies in a TermStack project. NEVER run npm/yarn/pnpm directly.
triggers:
  - "add dependency"
  - "install package"
  - "npm install"
  - "yarn add"
  - "pnpm add"
  - "need a library"
  - "add package"
---

# Adding Dependencies in TermStack

## The Rule

You MUST NEVER run npm install, yarn add, pnpm add, or bun add in a TermStack project.
The platform manages package installation automatically.

## The Correct Process

1. Read the current package.json to understand existing dependencies.
2. Edit package.json to add your dependency with the correct version:
   - Add to "dependencies" for runtime packages.
   - Add to "devDependencies" for build/dev-only packages.
3. Save the file — the platform detects the change and installs automatically.
4. Verify — read package.json back to confirm your edit was saved.

## Version Pinning Rules

- Use caret (^) prefix for most packages (e.g., "lodash": "^4.17.21").
- For Tailwind CSS specifically, use these versions:
  - "tailwindcss": "^4.2.2"
  - "@tailwindcss/postcss": "^4.2.2"

## Example — Adding axios

Edit package.json, adding to the "dependencies" object:

  "axios": "^1.7.0"

Then save. The platform handles the rest.

## Common Mistakes

- Running npm install <package> — BLOCKED by platform.
- Running yarn add <package> — BLOCKED by platform.
- Running npx create-... — BLOCKED by platform.
- Forgetting to use a valid semver range — causes install failures.
- Adding to wrong section (devDependencies vs dependencies).
`
  );

  await writeFileIfMissing(
    path.join(projectPath, '.claude/skills/check-preview/SKILL.md'),
    `---
name: check-preview
description: How to verify the TermStack preview is running and showing your changes correctly.
triggers:
  - "preview broken"
  - "preview not working"
  - "check preview"
  - "page is blank"
  - "white screen"
  - "nothing showing"
  - "verify changes"
---

# Checking Preview Status in TermStack

## Overview

The TermStack platform manages a Next.js dev server for your project. You cannot start,
stop, or restart it yourself. But you CAN verify your code is correct.

## How to Verify Your Changes

1. Read back every file you modified — confirm the content is what you intended.
2. Check for common error patterns:
   - Missing or incorrect imports.
   - TypeScript type errors (missing types, wrong argument counts).
   - Invalid JSX syntax (unclosed tags, wrong attribute names).
   - Referencing variables or functions that do not exist.
   - Missing dependencies in package.json for imported packages.
3. If you added a dependency, confirm it is in package.json with a valid version.
4. Read .env or project metadata for NEXT_PUBLIC_APP_URL to know the correct preview URL.

## What You CANNOT Do

- Run next dev, next build, or next start.
- Check localhost:3000 (platform uses ports 3100–3999).
- Start, stop, or restart the dev server.
- Access dev server logs directly.

## What You CAN Do

- Read and modify source files.
- Read .env for the correct preview URL.
- Read back files to verify changes were saved.
- Fix errors in your code proactively before claiming done.

## Fixing Preview Errors

If the user reports the preview is broken after your changes:

1. Re-read every file you touched — look for syntax errors.
2. Check that all imports resolve to real files or installed packages.
3. Verify TypeScript types are correct (no any-casts hiding real errors).
4. Check app/layout.tsx — a broken layout breaks every page.
5. If you added a dependency, verify the version exists on npm.
`
  );

  // Skill: fix build errors — auto-triggered on common error keywords
  await writeFileIfMissing(
    path.join(projectPath, '.claude/skills/fix-build-errors/SKILL.md'),
    `---
name: fix-build-errors
description: Diagnose and fix Next.js / TypeScript build errors in TermStack projects.
triggers:
  - "build error"
  - "compile error"
  - "type error"
  - "module not found"
  - "cannot find module"
  - "syntax error"
  - "unexpected token"
  - "is not assignable to"
  - "has no exported member"
  - "failed to compile"
---

# Fixing Build Errors in TermStack

## Triage Steps

1. Read the FULL error message — file path, line number, and error code.
2. Open the file at the indicated line.
3. Identify the root cause (do NOT just suppress the error with any-casts).

## Common Errors & Fixes

### Module not found
- Check the import path — is it relative or absolute?
- If importing a package, verify it is in package.json with the correct name.
- If importing a local file, verify the file exists at that path.

### Type errors
- Read the full type mismatch — understand what is expected vs. what is provided.
- Fix the source, not the symptom. Do not use ${'`as any`'} or ${'`@ts-ignore`'}.
- If a library types are wrong, add a .d.ts declaration file.

### JSX errors
- Check for unclosed tags, missing return statements, or fragments.
- Verify component names are PascalCase.
- Check that all used components are imported.

### Layout errors
- app/layout.tsx is critical — if it breaks, every page breaks.
- Must export default a function that accepts { children }.
- Must include <html> and <body> tags.

## After Fixing

1. Re-read the file to confirm the fix is saved.
2. Check if the same error pattern exists in other files.
3. Verify imports still resolve after your changes.
`
  );

  // Claude Code project settings — hard enforcement + PreToolUse hook
  const claudeSettings: Record<string, unknown> = {
    "$schema": "https://json.schemastore.org/claude-code-settings.json",
    "permissions": {
      "deny": [
        "Bash(npm *)",
        "Bash(yarn *)",
        "Bash(pnpm *)",
        "Bash(bun *)",
        "Bash(npx *)",
        "Bash(next dev*)",
        "Bash(next build*)",
        "Bash(next start*)",
        "Bash(rm -rf .next*)",
        "Bash(rm -rf node_modules*)"
      ]
    },
    "hooks": {
      "PreToolUse": [
        {
          "matcher": "Bash",
          "hooks": [
            {
              "type": "command",
              "command": "node .claude/hooks/validate-bash.mjs"
            }
          ]
        }
      ]
    }
  };
  if (enabledMcpServers.length > 0) {
    const claudeMcpServers: Record<string, any> = {};
    for (const server of enabledMcpServers) {
      const args = server.args.map(a => a.replace('{projectPath}', projectPath));
      claudeMcpServers[server.name] = {
        type: 'stdio',
        command: server.command,
        args,
        ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
      };
    }
    claudeSettings.mcpServers = claudeMcpServers;
  }
  await writeFileIfMissing(
    path.join(projectPath, '.claude/settings.json'),
    JSON.stringify(claudeSettings, null, 2) + '\n'
  );

  // Claude Code PreToolUse hook — validates Bash commands at runtime
  await writeFileIfMissing(
    path.join(projectPath, '.claude/hooks/validate-bash.mjs'),
    [
      '#!/usr/bin/env node',
      '// PreToolUse hook: validates Bash tool_input before execution.',
      '// Exit 0 = allow, Exit 2 = block (stderr shown to user).',
      '',
      'const BLOCKED_BINS = [',
      '  "npm", "yarn", "pnpm", "bun", "npx",',
      '  "next", "node_modules/.bin/next"',
      '];',
      '',
      'const PORT_RE = /(?:--port|--p|-p|PORT=|localhost:)(\\d+)/g;',
      'const VALID_PORT_MIN = 3100;',
      'const VALID_PORT_MAX = 3999;',
      '',
      'const DELETE_PATTERNS = [',
      '  /rm\\s+-rf\\s+\\.next/,',
      '  /rm\\s+-rf\\s+node_modules/,',
      '  /rm\\s+-rf\\s+package-lock/,',
      '  /rimraf\\s+\\.next/,',
      '  /rimraf\\s+node_modules/',
      '];',
      '',
      'async function main() {',
      '  let raw = "";',
      '  for await (const chunk of process.stdin) raw += chunk;',
      '  const input = JSON.parse(raw);',
      '  const cmd = (input.tool_input?.command ?? "").trim();',
      '  if (!cmd) process.exit(0);',
      '',
      '  // Check blocked binaries',
      '  const first = cmd.split(/[\\s;&|]+/)[0].replace(/^.*\\//, "");',
      '  if (BLOCKED_BINS.includes(first)) {',
      '    process.stderr.write(',
      '      `[TermStack] Blocked: "${first}" is not allowed. ` +',
      '      "Edit package.json instead of running package managers.\\n"',
      '    );',
      '    process.exit(2);',
      '  }',
      '',
      '  // Check port ranges',
      '  let m;',
      '  while ((m = PORT_RE.exec(cmd)) !== null) {',
      '    const port = parseInt(m[1], 10);',
      '    if (port < VALID_PORT_MIN || port > VALID_PORT_MAX) {',
      '      process.stderr.write(',
      '        `[TermStack] Blocked: port ${port} outside allowed range ` +',
      '        `${VALID_PORT_MIN}-${VALID_PORT_MAX}.\\n`',
      '      );',
      '      process.exit(2);',
      '    }',
      '  }',
      '',
      '  // Check destructive patterns',
      '  for (const pat of DELETE_PATTERNS) {',
      '    if (pat.test(cmd)) {',
      '      process.stderr.write(',
      '        "[TermStack] Blocked: deleting build artifacts or node_modules " +',
      '        "is not allowed.\\n"',
      '      );',
      '      process.exit(2);',
      '    }',
      '  }',
      '',
      '  // Check chained commands for blocked binaries',
      '  const parts = cmd.split(/[;&|]+/).map(s => s.trim());',
      '  for (const part of parts) {',
      '    const bin = part.split(/\\s+/)[0].replace(/^.*\\//, "");',
      '    if (BLOCKED_BINS.includes(bin)) {',
      '      process.stderr.write(',
      '        `[TermStack] Blocked: "${bin}" in chained command is not allowed.\\n`',
      '      );',
      '      process.exit(2);',
      '    }',
      '  }',
      '',
      '  process.exit(0);',
      '}',
      '',
      'main().catch(() => process.exit(0));',
      '',
    ].join('\n')
  );

  // Codex CLI configuration — feature flags + reasoning settings
  const codexTomlLines = [
    '# Codex CLI configuration for TermStack projects',
    '',
    '[features]',
    'child_agents_md = true   # Enable AGENTS.md subagent delegation',
    '',
    '[reasoning]',
    'plan_mode_reasoning_effort = "high"   # Maximize planning quality',
    '',
  ];
  if (enabledMcpServers.length > 0) {
    codexTomlLines.push('[mcp_servers]');
    for (const server of enabledMcpServers) {
      const args = server.args.map(a => a.replace('{projectPath}', projectPath));
      const argsStr = args.map(a => `"${a}"`).join(', ');
      const entry = `${server.name} = { command = "${server.command}", args = [${argsStr}]`;
      if (server.env && Object.keys(server.env).length > 0) {
        const envPairs = Object.entries(server.env).map(([k, v]) => `${k} = "${v}"`).join(', ');
        codexTomlLines.push(entry + `, env = { ${envPairs} } }`);
      } else {
        codexTomlLines.push(entry + ' }');
      }
    }
    codexTomlLines.push('');
  }
  await writeFileIfMissing(
    path.join(projectPath, '.codex/config.toml'),
    codexTomlLines.join('\n')
  );

  // Cursor MCP server configuration
  if (enabledMcpServers.length > 0) {
    const cursorServers: Record<string, any> = {};
    for (const server of enabledMcpServers) {
      const args = server.args.map(a => a.replace('{projectPath}', projectPath));
      cursorServers[server.name] = {
        type: 'stdio',
        command: server.command,
        args,
        ...(server.env && Object.keys(server.env).length > 0 && { env: server.env }),
      };
    }
    await writeFileIfMissing(
      path.join(projectPath, '.cursor', 'mcp.json'),
      JSON.stringify({ servers: cursorServers }, null, 2) + '\n'
    );
  }

  // Claude Code modular rules — auto-read at session start
  await writeFileIfMissing(
    path.join(projectPath, '.claude/rules/platform.md'),
    `---
description: TermStack platform constraints — always active
---

# Platform Rules

## Package Management
Never run package managers (npm, yarn, pnpm, bun, npx). Edit package.json and the platform installs automatically.

## Dev Server
Never run next dev, next build, or next start. The platform manages the preview on ports 3100–3999.

## Build Artifacts
Never delete .next, node_modules, lockfiles, or generated manifests.

## File Organization
Keep all files in the project root. Use relative paths only.

## Verification
Read back changed files before claiming done. Never guess preview URLs — read NEXT_PUBLIC_APP_URL.
`
  );

  await writeFileIfMissing(
    path.join(projectPath, '.claude/rules/tailwind.md'),
    `---
description: Tailwind CSS v4 rules for TermStack projects
paths:
  - "**/*.css"
  - "**/*.tsx"
  - "**/*.jsx"
---

# Tailwind CSS Rules

## Version
Use Tailwind CSS v4:
- tailwindcss@^4.2.2
- @tailwindcss/postcss@^4.2.2
- postcss@^8.4.49

## Setup
Add to postcss.config.js:
${'```'}js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
${'```'}

Add to app/globals.css (at the top):
${'```'}css
@import "tailwindcss";
${'```'}

## Customization
Use @theme in CSS instead of tailwind.config.*:
${'```'}css
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --font-display: "Inter", sans-serif;
}
${'```'}

## Do NOT use (v3 legacy)
- @tailwind base / @tailwind components / @tailwind utilities
- tailwind.config.ts / tailwind.config.js for new projects
- autoprefixer (bundled in v4)
`
  );

  // Claude Code subagent — restricted tool access for safe delegation
  await writeFileIfMissing(
    path.join(projectPath, '.claude/agents/termstack-dev.md'),
    `---
name: termstack-dev
description: Implementation agent for TermStack projects. Modifies source files, never runs commands.
tools:
  - Read
  - Edit
  - Write
  - MultiEdit
  - Glob
  - Grep
disallowedTools:
  - Bash
  - WebFetch
model: inherit
maxTurns: 15
---

You are the TermStack development agent. Your job is to implement features by modifying files.

## What You Can Do
- Read, create, and edit source files (TSX, TS, CSS, JSON)
- Search the codebase with Glob and Grep
- Follow the project rules in CLAUDE.md and .claude/rules/

## What You Cannot Do
- Run any shell commands (Bash is disallowed)
- Fetch external URLs
- Start servers or run package managers

## Working Style
- Make all requested changes in a single pass
- Read back files after editing to verify correctness
- Follow Next.js 15 App Router conventions
- Use TypeScript strictly — no any-casts
`
  );

  // Design system rules — generated only when DESIGN.md exists in the project
  const designMdPath = path.join(projectPath, 'DESIGN.md');
  try {
    await fs.access(designMdPath);
    await writeFileIfMissing(
      path.join(projectPath, '.claude/rules/design.md'),
      `---
description: Design system rules — active when DESIGN.md is present
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/*.css"
  - "**/*.ts"
---

# Design System — DESIGN.md

A DESIGN.md file exists in this project root. It is the **authoritative design system** for this project.

## Required Workflow

1. **Read DESIGN.md first** before writing any UI code.
2. Extract the exact color palette, typography, spacing scale, and component styles.
3. Apply them consistently across every component.

## Rules

- Use the exact hex/RGB/HSL values from DESIGN.md — never approximate.
- Match the font families, sizes, and weights specified.
- Follow the spacing scale (padding, margin, gap) from DESIGN.md.
- Use the component patterns (buttons, cards, inputs, navigation) described in DESIGN.md.
- If DESIGN.md specifies a dark mode palette, implement dark mode support.
- If DESIGN.md references a specific border-radius, shadow, or animation style, use it exactly.

## Do NOT

- Invent your own color palette or typography when DESIGN.md provides one.
- Use generic Tailwind defaults (e.g., \`bg-blue-500\`) when DESIGN.md specifies brand colors.
- Ignore the design system "because it's faster" — visual consistency is a hard requirement.
`
    );
  } catch {
    // No DESIGN.md — skip design rules generation (expected for projects without a design template)
  }
}
