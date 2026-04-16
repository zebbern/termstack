'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  FolderKanban,
  Home,
  Layers3,
  Loader2,
  Menu,
  Palette,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Terminal,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import ConsolePanel from '@/components/console/ConsolePanel';
import { getDefaultModelForCli, getModelDefinitionsForCli, normalizeModelId } from '@/lib/constants/cliModels';
import { fetchCliStatusSnapshot } from '@/hooks/useCLI';
import DeleteProjectModal from '@/components/modals/DeleteProjectModal';
import { ProjectSettings } from '@/components/settings/ProjectSettings';
import type { Project } from '@/types/client/project';
import { DESIGN_CATALOG, DESIGN_CATEGORIES, getDesignsByCategory } from '@/data/design-catalog';

const designsByCategory = getDesignsByCategory();

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type HomeView = 'home' | 'projects';

type GlobalSettingsPayload = {
  default_cli?: string;
  cli_settings?: Record<string, { model?: string }>;
};

type CliStatusEntry = {
  available?: boolean;
  installed?: boolean;
  configured?: boolean;
};

type CliOption = {
  id: string;
  label: string;
  description: string;
  available: boolean;
};

const CLI_REGISTRY: Array<Omit<CliOption, 'available'>> = [
  { id: 'claude', label: 'Claude Code', description: 'Best for polished product builds' },
  { id: 'codex', label: 'Codex CLI', description: 'Fast iteration with OpenAI models' },
  { id: 'cursor', label: 'Cursor Agent', description: 'Multi-model workspace agent' },
  { id: 'qwen', label: 'Qwen Coder', description: 'Open-source coding workflow' },
  { id: 'glm', label: 'GLM CLI', description: 'Claude-compatible GLM runtime' },
];

const NAV_ITEMS: Array<{ id: HomeView; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
];

const SECONDARY_ITEMS = [
  { label: 'Workflows', icon: Workflow },
  { label: 'Templates', icon: Layers3 },
];

function formatRelativeTime(value?: string | null) {
  if (!value) {
    return 'No activity yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'No activity yet';
  }

  const diffMs = date.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60000);
  const hours = Math.round(diffMs / 3600000);
  const days = Math.round(diffMs / 86400000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute');
  }
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour');
  }
  return formatter.format(days, 'day');
}

function formatStatus(status?: string | null) {
  if (!status) {
    return 'unknown';
  }

  return status.replace(/_/g, ' ');
}

function deriveProjectName(prompt: string) {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Untitled project';
  }

  const firstSentence = normalized.split(/[.!?]/)[0]?.trim() || normalized;
  const trimmed = firstSentence.slice(0, 56).trim();
  return trimmed.length > 0 ? trimmed : 'Untitled project';
}

export default function HomePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [view, setView] = useState<HomeView>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [composerPrompt, setComposerPrompt] = useState('');
  const [selectedCli, setSelectedCli] = useState('claude');
  const [selectedModel, setSelectedModel] = useState(getDefaultModelForCli('claude'));
  const [cliOptions, setCliOptions] = useState<CliOption[]>(() =>
    CLI_REGISTRY.map((option) => ({ ...option, available: true })),
  );
  const [globalSettings, setGlobalSettings] = useState<GlobalSettingsPayload | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState('');

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/projects`, { cache: 'no-store' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to load projects');
      }

      const payload = await response.json();
      const nextProjects = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setProjects(nextProjects);
    } catch (loadError) {
      console.error('[HomePage] Failed to load projects:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true);

    try {
      const [settingsResponse, cliStatuses] = await Promise.all([
        fetch(`${API_BASE}/api/settings/global`, { cache: 'no-store' }),
        fetchCliStatusSnapshot(),
      ]);

      const settings = settingsResponse.ok
        ? ((await settingsResponse.json()) as GlobalSettingsPayload)
        : null;

      const nextCliOptions = CLI_REGISTRY.map((option) => {
        const entry = cliStatuses[option.id] as CliStatusEntry | undefined;
        return {
          ...option,
          available: entry?.available ?? entry?.installed ?? entry?.configured ?? true,
        };
      });

      const fallbackCli = nextCliOptions.find((option) => option.available)?.id ?? 'claude';
      const defaultCli = settings?.default_cli && nextCliOptions.some((option) => option.id === settings.default_cli)
        ? settings.default_cli
        : fallbackCli;

      setCliOptions(nextCliOptions);
      setGlobalSettings(settings);
      setSelectedCli(defaultCli);
      setSelectedModel(
        normalizeModelId(
          defaultCli,
          settings?.cli_settings?.[defaultCli]?.model ?? getDefaultModelForCli(defaultCli),
        ),
      );
    } catch (configError) {
      console.error('[HomePage] Failed to load config:', configError);
      setCliOptions(CLI_REGISTRY.map((option) => ({ ...option, available: true })));
      setSelectedCli('claude');
      setSelectedModel(getDefaultModelForCli('claude'));
    } finally {
      setIsLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadProjects(), loadConfig()]);
  }, [loadProjects, loadConfig]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const filteredProjects = useMemo(() => {
    const query = projectSearch.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      const haystack = [project.name, project.description, project.initialPrompt, project.preferredCli]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [projectSearch, projects]);

  const modelOptions = useMemo(() => getModelDefinitionsForCli(selectedCli), [selectedCli]);

  useEffect(() => {
    if (!modelOptions.some((option) => option.id === selectedModel)) {
      const savedModel = globalSettings?.cli_settings?.[selectedCli]?.model;
      setSelectedModel(normalizeModelId(selectedCli, savedModel ?? getDefaultModelForCli(selectedCli)));
    }
  }, [globalSettings, modelOptions, selectedCli, selectedModel]);

  const latestProjects = useMemo(() => filteredProjects.slice(0, 12), [filteredProjects]);

  const resetComposer = useCallback(() => {
    setView('home');
    setComposerPrompt('');

    const defaultCli = globalSettings?.default_cli && cliOptions.some((option) => option.id === globalSettings.default_cli)
      ? globalSettings.default_cli
      : cliOptions.find((option) => option.available)?.id ?? 'claude';

    setSelectedCli(defaultCli);
    setSelectedModel(
      normalizeModelId(
        defaultCli,
        globalSettings?.cli_settings?.[defaultCli]?.model ?? getDefaultModelForCli(defaultCli),
      ),
    );

    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [cliOptions, globalSettings]);

  const handleOpenProject = useCallback((project: Project) => {
    setIsSidebarOpen(false);
    router.push(`/${project.id}/chat`);
  }, [router]);

  const handleCreateProject = useCallback(async () => {
    const prompt = composerPrompt.trim();
    if (!prompt || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const projectId = crypto.randomUUID();
    const projectName = deriveProjectName(prompt);

    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: projectName,
          description: prompt,
          initialPrompt: prompt,
          preferredCli: selectedCli,
          selectedModel,
          designTemplate: selectedDesign || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to create project');
      }

      await loadProjects();
      const params = new URLSearchParams({ cli: selectedCli, model: selectedModel, initial_prompt: prompt });
      router.push(`/${projectId}/chat?${params.toString()}`);
    } catch (createError) {
      console.error('[HomePage] Failed to create project:', createError);
      setSubmitError(createError instanceof Error ? createError.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  }, [composerPrompt, isSubmitting, loadProjects, router, selectedCli, selectedModel, selectedDesign]);

  const handleDeleteProject = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/api/projects/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to delete project');
      }

      setDeleteTarget(null);
      await loadProjects();
    } catch (deleteError) {
      console.error('[HomePage] Failed to delete project:', deleteError);
      alert(deleteError instanceof Error ? deleteError.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, loadProjects]);

  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="relative min-h-screen">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-4 top-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[rgba(11,14,18,0.92)] text-[var(--app-text)] shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)] ${
            isSidebarOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-[rgba(0,0,0,0.58)] transition ${
            isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="Close sidebar overlay"
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[248px] max-w-[calc(100vw-1rem)] flex-col border-r border-[var(--app-border)] bg-[#060708] px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.52)] transition-transform duration-200 ease-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-end gap-2 px-1">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-md p-2 text-[var(--app-muted)] transition hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-text)]"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-md p-2 text-[var(--app-muted)] transition hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-text)]"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              resetComposer();
              setIsSidebarOpen(false);
            }}
            className="mb-3 inline-flex items-center justify-between rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5 text-sm font-medium text-[var(--app-text)] transition hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-2)]"
          >
            <span>New Chat</span>
            <Plus className="h-4 w-4 text-[var(--app-muted)]" />
          </button>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setView(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-[rgba(255,255,255,0.08)] text-[var(--app-text)]'
                      : 'text-[var(--app-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-text)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {SECONDARY_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--app-muted)]"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => { setIsConsoleOpen((prev) => !prev); setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isConsoleOpen
                  ? 'bg-[rgba(255,255,255,0.06)] text-[var(--app-text)]'
                  : 'text-[var(--app-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-text)]'
              }`}
            >
              <Terminal className="h-4 w-4" />
              <span>Console</span>
            </button>
          </nav>

          <div className="mt-8 flex-1 overflow-y-auto">
            <div className="mb-2 flex items-center justify-between px-3">
              <div className="text-xs font-medium text-[var(--app-muted)]">Recent chats</div>
              <button
                type="button"
                onClick={() => void loadProjects()}
                className="rounded-md p-1.5 text-[var(--app-muted)] transition hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-text)]"
                aria-label="Refresh chats"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingProjects ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <label className="mx-1 mb-2 flex items-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-sm text-[var(--app-muted)]">
              <Search className="h-3.5 w-3.5" />
              <input
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Search chats"
                className="w-full border-0 bg-transparent text-[var(--app-text)] text-xs outline-none placeholder:text-[var(--app-muted)]"
              />
            </label>
            <div className="space-y-1">
              {isLoadingProjects ? (
                <div className="px-3 py-6 text-sm text-[var(--app-muted)]">Loading chats...</div>
              ) : latestProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--app-border)] px-3 py-6 text-center text-sm text-[var(--app-muted)]">
                  No chats yet.
                </div>
              ) : (
                latestProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition hover:border-[var(--app-border)] hover:bg-[var(--app-surface)]"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenProject(project)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm text-[var(--app-text)]">{project.name}</div>
                      <div className="truncate text-xs text-[var(--app-muted)]">
                        {formatRelativeTime(project.lastActiveAt)} · {formatStatus(project.status)}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(project)}
                      className="rounded-md p-1.5 text-[var(--app-muted)] opacity-0 transition hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--app-danger)] group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="min-h-screen bg-[#0a0c0f]">
          <div className="flex min-h-screen flex-col px-4 py-20 sm:px-6 lg:px-10 lg:py-24">
            {view === 'home' ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-[42rem]">
                  <div className="mx-auto max-w-2xl text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--app-text)] sm:text-4xl lg:text-[2.55rem]">
                      What do you want to create?
                    </h1>
                    <p className="mt-3 text-sm text-[var(--app-muted)] sm:text-base">
                      github.com/zebbern
                    </p>
                  </div>

                  <div className="mx-auto mt-6 max-w-xl overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
                    <div className="border-b border-[var(--app-border)] px-4 py-3">
                      <textarea
                        ref={textareaRef}
                        value={composerPrompt}
                        onChange={(event) => setComposerPrompt(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void handleCreateProject();
                          }
                        }}
                        rows={3}
                        placeholder="Ask termstack to build.."
                        className="w-full resize-none border-0 bg-transparent text-base leading-6 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
                      />
                    </div>

                    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          value={selectedCli}
                          onChange={(event) => {
                            const nextCli = event.target.value;
                            setSelectedCli(nextCli);
                            setSelectedModel(
                              normalizeModelId(
                                nextCli,
                                globalSettings?.cli_settings?.[nextCli]?.model ?? getDefaultModelForCli(nextCli),
                              ),
                            );
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
                        >
                          {cliOptions.map((option) => (
                            <option key={option.id} value={option.id} disabled={!option.available}>
                              {option.label}{option.available ? '' : ' (unavailable)'}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedModel}
                          onChange={(event) => setSelectedModel(event.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
                          disabled={isLoadingConfig}
                        >
                          {modelOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedDesign}
                          onChange={(event) => setSelectedDesign(event.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text)] outline-none"
                        >
                          <option value="">No design template</option>
                          {DESIGN_CATEGORIES.map((category) => (
                            <optgroup key={category} label={category}>
                              {(designsByCategory[category] ?? []).map((tmpl) => (
                                <option key={tmpl.id} value={tmpl.id}>
                                  {tmpl.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCreateProject()}
                        disabled={!composerPrompt.trim() || isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--app-text)] px-4 py-2.5 text-sm font-medium text-[#050608] transition hover:bg-white disabled:cursor-not-allowed disabled:bg-[rgba(255,255,255,0.18)] disabled:text-[var(--app-muted)]"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                        Start build
                      </button>
                    </div>
                  </div>

                  {submitError ? (
                    <div className="mx-auto mt-4 max-w-xl rounded-lg border border-[rgba(255,125,115,0.25)] bg-[rgba(255,125,115,0.08)] px-4 py-3 text-sm text-[var(--app-danger)]">
                      {submitError}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold text-[var(--app-text)]">Projects</h2>
                  <p className="mt-1 text-sm text-[var(--app-muted)]">
                    Open an existing chat, continue an active build, or clean up old workspaces.
                  </p>
                </div>

                {error ? (
                  <div className="mb-4 rounded-lg border border-[rgba(255,125,115,0.25)] bg-[rgba(255,125,115,0.08)] px-4 py-3 text-sm text-[var(--app-danger)]">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-3 xl:grid-cols-2">
                  {filteredProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--app-border)] px-5 py-10 text-sm text-[var(--app-muted)]">
                      {isLoadingProjects ? 'Loading projects...' : 'No projects match the current filter.'}
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <article
                        key={project.id}
                        className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="truncate text-base font-medium text-[var(--app-text)]">{project.name}</div>
                            <div className="mt-1 line-clamp-2 text-sm text-[var(--app-muted)]">
                              {project.description?.trim() || project.initialPrompt?.trim() || 'No description yet.'}
                            </div>
                          </div>
                          <div className="rounded-full border border-[var(--app-border)] px-2.5 py-1 text-xs text-[var(--app-muted)]">
                            {formatStatus(project.status)}
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--app-muted)]">
                          <span>
                            {project.preferredCli
                              ? CLI_REGISTRY.find((option) => option.id === project.preferredCli)?.label ?? project.preferredCli
                              : 'Builder'}
                          </span>
                          <span>{project.selectedModel || getDefaultModelForCli(project.preferredCli ?? 'claude')}</span>
                          <span>{formatRelativeTime(project.lastActiveAt)}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenProject(project)}
                            className="rounded-lg bg-[var(--app-text)] px-3 py-2 text-sm font-medium text-[#050608] transition hover:bg-white"
                          >
                            Open chat
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(project)}
                            className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-2)] px-3 py-2 text-sm text-[var(--app-text)] transition hover:border-[rgba(255,125,115,0.3)] hover:text-[var(--app-danger)]"
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <ConsolePanel
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />

      <DeleteProjectModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={() => {
          void handleDeleteProject();
        }}
        projectName={deleteTarget?.name ?? ''}
        isDeleting={isDeleting}
      />

      <ProjectSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        projectId="global-settings"
        projectName="Global Settings"
        initialTab="ai-assistant"
      />
    </main>
  );
}
