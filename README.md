# Termstack

_Connect a supported CLI. Build in a live workspace. Deploy when ready._

## What is termstack?

termstack is an open-source browser and desktop workspace for AI-assisted app building. It connects a supported coding CLI to a real Next.js project, lets you describe what you want in natural language, and keeps the chat, file changes, tool output, and live preview in the same loop.

Instead of generating a static mockup, termstack edits an actual project directory that you can inspect, rerun, and deploy when the result is ready. GitHub, Vercel, and Supabase hooks are built in for the cases where you want to move from local iteration to a real deployment.

To get started, authenticate at least one supported CLI, launch termstack, create a project, and start describing what you want to build.

## Features

- **Bring your own coding agent**: Use Claude Code, Codex CLI, Cursor CLI, Qwen Code, or Z.AI GLM inside the same workspace
- **Natural language to code**: Describe the product you want and let the selected agent edit a real Next.js project
- **Preview-first workflow**: Watch changes land in the live preview while you inspect the generated files
- **Project-local state**: Keep messages, settings, tokens, and service connections scoped to each project
- **Deploy hooks when you need them**: Connect GitHub, Vercel, and Supabase without leaving the app
- **Desktop support**: Run the same workflow in the Electron wrapper on macOS, Windows, and Linux

## Demo Example _(coming soon)_

## Supported AI Coding Agents

termstack supports multiple AI coding agents, giving you the flexibility to choose the best tool for your needs:

- **Claude Code** - Anthropic's advanced AI coding agent
- **Codex CLI** - OpenAI's powerful coding agent
- **Cursor CLI** - Powerful multi-model AI agent
- **Qwen Code** - Alibaba's open-source coding CLI
- **Z.AI GLM-4.6** - Zhipu AI's coding agent

### Claude Code (Recommended)

**[Claude Code](https://docs.anthropic.com/en/docs/claude-code/setup)** - Anthropic's advanced AI coding agent with Claude Opus 4.6

- **Features**: Deep codebase awareness, Unix philosophy, direct terminal integration
- **Context**: Native 200k tokens
- **Pricing**: Included with Claude Pro/Max/Team/Enterprise plans, or Anthropic API key
- **Installation**:

  ```bash
  npm install -g @anthropic-ai/claude-code
  claude  # then > /login
  ```

### Codex CLI

**[Codex CLI](https://github.com/openai/codex)** - OpenAI's powerful coding agent with GPT-5 support

- **Features**: High reasoning capabilities, local execution, multiple operating modes (interactive, auto-edit, full-auto)
- **Context**: Varies by model
- **Pricing**: Included with ChatGPT Plus/Pro/Business/Edu/Enterprise plans (from $20/month)
- **Installation**:

  ```bash
  npm install -g @openai/codex
  codex  # login with ChatGPT account
  ```

### Cursor CLI

**[Cursor CLI](https://cursor.com/en/cli)** - Powerful AI agent with access to cutting-edge models

- **Features**: Multi-model support (Anthropic, OpenAI), AGENTS.md support
- **Context**: Model dependent
- **Pricing**: Free tier available, Pro from $20/month (credit-based system)
- **Installation**:

  ```bash
  curl https://cursor.com/install -fsS | bash
  cursor-agent login
  ```

### Qwen Code

**[Qwen Code](https://github.com/QwenLM/qwen-code)** - Alibaba's open-source CLI for Qwen3-Coder models

- **Features**: 256K-1M token context, multiple model sizes (0.5B to 480B), Apache 2.0 license
- **Context**: 256K native, 1M with extrapolation
- **Pricing**: Completely free and open-source
- **Installation**:

  ```bash
  npm install -g @qwen-code/qwen-code@latest
  qwen --version
  ```

### Z.AI GLM-4.6

**[Z.AI GLM-4.6](https://z.ai/subscribe)** - Zhipu AI's coding agent powered by GLM-4.6

- **Features**: Strong reasoning capabilities and cost-efficient, code generation and understanding
- **Context**: 200K tokens
- **Pricing**: Starting from $3/month (GLM Coding Lite) to $30/month (GLM Coding Max), with 50% off first month
- **Installation**: See [Quick Start Guide](https://docs.z.ai/devpack/quick-start)

## Deployment & Data Services

**Database & Deployment:**

- **[Supabase](https://supabase.com/)**: Connect production-ready PostgreSQL database directly to your project.
- **[Vercel](https://vercel.com/)**: Publish your work immediately with one-click deployment

termstack itself is open-source. Any CLI subscription or hosting cost depends on the external services you choose to connect.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 20+
- At least one supported CLI already installed and authenticated
- Git

## Quick Start

Get termstack running on your local machine in minutes:

```bash
# Clone the repository
git clone https://github.com/zebbern/termstack.git
cd termstack

# Install all dependencies
npm install

# Start development server
npm run dev
```

Your application will be available at <http://localhost:3000>

**Note**: Ports are automatically detected. If the default port is in use, the next available port will be assigned.

## Setup

The `npm install` command automatically handles the complete setup:

1. **Port Configuration**: Detects available ports and creates `.env` files
2. **Dependencies**: Installs all required Node.js packages
3. **Database Setup**: SQLite database auto-creates at `data/cc.db` on first run

### Desktop App (Electron)

Build and run termstack as a desktop application:

```bash
# Development mode
npm run dev:desktop

# Build desktop app
npm run build:desktop

# Package for specific platforms
npm run package:mac      # macOS
npm run package:win      # Windows
npm run package:linux    # Linux
```

### Helpful Commands

```bash
npm run check-cli       # Check local Claude CLI availability
npm run type-check      # Run TypeScript without emitting files
npm run prisma:generate # Regenerate the Prisma client
npm run prisma:push     # Push the current Prisma schema to the local DB
npm run prisma:reset    # Reset the local Prisma database (destructive)
```

## Usage

### Getting Started with Development

1. **Connect Claude Code**: Link your Claude Code CLI to enable AI assistance
2. **Describe Your Project**: Use natural language to describe what you want to build
3. **AI Generation**: Watch as the AI generates your project structure and code
4. **Live Preview**: See changes instantly with hot reload functionality
5. **Deploy**: Push to production with Vercel integration

### Database Operations

termstack uses SQLite for local development. The database automatically initializes on first run.

## Troubleshooting

### Database migration conflicts

If you upgraded from a previous termstack version and run into database errors, reset the Prisma database so it matches the latest schema:

```bash
npm run prisma:reset
```

The command drops and recreates the local database, so back up any data you need before running it.

### Port Already in Use

The application automatically finds available ports. Check the generated `.env` file to see which ports were assigned.

### Claude Code Permission Issues (Windows/WSL)

If you encounter the error: `Error output dangerously skip permissions cannot be used which is root sudo privileges for security reasons`

**Solution:**

1. Do not run Claude Code with `sudo` or as root user
2. Ensure proper file ownership in WSL:

   ```bash
   # Check current user
   whoami

   # Change ownership of project directory to current user
   sudo chown -R $(whoami):$(whoami) ~/termstack
   ```

3. If using WSL, make sure you're running Claude Code from your user account, not root
4. Verify Claude Code installation permissions:

   ```bash
   # Reinstall Claude Code without sudo
   npm install -g @anthropic-ai/claude-code --unsafe-perm=false
   ```

## Integration Guide

### GitHub

**Get Token:** [GitHub Personal Access Tokens](https://github.com/settings/tokens) → Generate new token (classic) → Select `repo` scope

**Connect:** Settings → Service Integrations → GitHub → Enter token → Create or connect repository

### Vercel

**Get Token:** [Vercel Account Settings](https://vercel.com/account/tokens) → Create Token

**Connect:** Settings → Service Integrations → Vercel → Enter token → Create new project for deployment

### Supabase

**Get Credentials:** [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API

- Project URL: `https://xxxxx.supabase.co`
- Anon Key: Public key for client-side
- Service Role Key: Secret key for server-side
