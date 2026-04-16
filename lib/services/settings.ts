import fs from 'fs/promises';
import path from 'path';
import { getDefaultModelForCli, normalizeModelId } from '@/lib/constants/cliModels';

const DATA_DIR = process.env.SETTINGS_DIR || path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'global-settings.json');

export type CLISettings = Record<string, Record<string, unknown>>;

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  enabled: boolean;
  isPreset?: boolean;
}

export const MCP_PRESETS: MCPServerConfig[] = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem@latest', '{projectPath}'],
    enabled: false,
    isPreset: true,
  },
  {
    name: 'playwright',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    enabled: false,
    isPreset: true,
  },
  {
    name: 'sequential-thinking',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking@latest'],
    enabled: false,
    isPreset: true,
  },
  {
    name: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github@latest'],
    env: { GITHUB_TOKEN: '' },
    enabled: false,
    isPreset: true,
  },
];

export interface GlobalSettings {
  default_cli: string;
  cli_settings: CLISettings;
  mcp_servers: MCPServerConfig[];
}

const DEFAULT_SETTINGS: GlobalSettings = {
  default_cli: 'claude',
  cli_settings: {
    claude: {
      model: getDefaultModelForCli('claude'),
    },
    codex: {
      model: getDefaultModelForCli('codex'),
    },
    cursor: {
      model: getDefaultModelForCli('cursor'),
    },
    qwen: {
      model: getDefaultModelForCli('qwen'),
    },
    glm: {
      model: getDefaultModelForCli('glm'),
    },
  },
  mcp_servers: [],
};

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readSettingsFile(): Promise<GlobalSettings | null> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as GlobalSettings;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const defaultCli = typeof parsed.default_cli === 'string'
      ? parsed.default_cli
      : DEFAULT_SETTINGS.default_cli;

    const cliSettings =
      typeof parsed.cli_settings === 'object' && parsed.cli_settings !== null
        ? parsed.cli_settings
        : {};

    return {
      default_cli: typeof parsed.default_cli === 'string' ? parsed.default_cli : DEFAULT_SETTINGS.default_cli,
      cli_settings: {
        ...DEFAULT_SETTINGS.cli_settings,
        ...cliSettings,
      },
      mcp_servers: Array.isArray(parsed.mcp_servers) ? parsed.mcp_servers : [],
    };
  } catch (error) {
    return null;
  }
}

async function writeSettings(settings: GlobalSettings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

export async function loadGlobalSettings(): Promise<GlobalSettings> {
  const existing = await readSettingsFile();
  if (existing) {
    const merged: GlobalSettings = {
      default_cli: existing.default_cli ?? DEFAULT_SETTINGS.default_cli,
      cli_settings: {
        ...DEFAULT_SETTINGS.cli_settings,
        ...(existing.cli_settings ?? {}),
      },
      mcp_servers: existing.mcp_servers || [],
    };
    return merged;
  }

  await writeSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export function normalizeCliSettings(settings: unknown): CLISettings | undefined {
  if (!settings || typeof settings !== 'object') {
    return undefined;
  }

  const normalized: CLISettings = {};
  for (const [cli, config] of Object.entries(settings)) {
    if (config && typeof config === 'object') {
      normalized[cli] = {
        ...(config as Record<string, unknown>),
      };
      const model = normalized[cli].model as string | undefined;
      if (model) {
        normalized[cli].model = normalizeModelId(cli, model);
      }
    }
  }
  return normalized;
}

export async function updateGlobalSettings(partial: Partial<GlobalSettings>): Promise<GlobalSettings> {
  const current = await loadGlobalSettings();

  const cliSettings = normalizeCliSettings(partial.cli_settings);

  const next: GlobalSettings = {
    default_cli: partial.default_cli ?? current.default_cli,
    cli_settings: { ...current.cli_settings },
    mcp_servers: partial.mcp_servers !== undefined ? partial.mcp_servers : current.mcp_servers,
  };

  if (cliSettings) {
    for (const [cli, config] of Object.entries(cliSettings)) {
      next.cli_settings[cli] = {
        ...(current.cli_settings[cli] ?? {}),
        ...config,
      };
    }
  }

  await writeSettings(next);
  return next;
}
