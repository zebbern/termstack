import fs from 'fs/promises';
import path from 'path';

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
  autoprefixer: string;
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
  autoprefixer: '^10.4.20',
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
      autoprefixer:
        hostPackageJson.devDependencies?.autoprefixer ??
        DEFAULT_SCAFFOLD_PACKAGE_VERSIONS.autoprefixer,
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
      autoprefixer: packageVersions.autoprefixer,
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
- If adding Tailwind CSS: use v3 stack (tailwindcss@3.4.17 + postcss@8.4.49 + autoprefixer@10.4.20). Use classic @tailwind base/components/utilities directives, NOT @import "tailwindcss" (v4 syntax).

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
- If adding Tailwind CSS: use v3 stack (tailwindcss@3.4.17 + postcss@8.4.49 + autoprefixer@10.4.20). Use classic @tailwind base/components/utilities directives, NOT @import "tailwindcss" (v4 syntax).

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
- If adding Tailwind CSS: use v3 stack (tailwindcss@3.4.17 + postcss@8.4.49 + autoprefixer@10.4.20). Use classic @tailwind base/components/utilities directives, NOT @import "tailwindcss" (v4 syntax).

## Verification

- Read back changed files before claiming done.
- Never claim completion without actually modifying files.
- Never share a guessed preview URL. Read NEXT_PUBLIC_APP_URL from .env or project metadata.
`
  );
}
