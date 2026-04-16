/**
 * Project Service - Project management logic
 */

import { prisma } from '@/lib/db/client';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types/backend';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { normalizeModelId, getDefaultModelForCli } from '@/lib/constants/cliModels';

const PROJECTS_DIR = process.env.PROJECTS_DIR || './data/projects';
const PROJECTS_DIR_ABSOLUTE = path.isAbsolute(PROJECTS_DIR)
  ? PROJECTS_DIR
  : path.resolve(process.cwd(), PROJECTS_DIR);

/**
 * Retrieve all projects
 */
export async function getAllProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    orderBy: {
      lastActiveAt: 'desc',
    },
  });
  return projects.map(project => ({
    ...project,
    selectedModel: normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined),
  })) as Project[];
}

/**
 * Retrieve project by ID
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    where: { id },
  });
  if (!project) return null;
  return {
    ...project,
    selectedModel: normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined),
  } as Project;
}

/**
 * Create new project
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  // Create project directory
  const projectPath = path.join(PROJECTS_DIR_ABSOLUTE, input.project_id);
  await fs.mkdir(projectPath, { recursive: true });

  // Fetch DESIGN.md via getdesign CLI if a design template was selected
  if (input.designTemplate) {
    const brand = input.designTemplate.replace(/[^a-zA-Z0-9._-]/g, '');
    if (brand) {
      try {
        // getdesign CLI walks up directories to find package.json as "root".
        // Without an anchor, it writes DESIGN.md to the TermStack repo root.
        const anchorPath = path.join(projectPath, 'package.json');
        try { await fs.access(anchorPath); } catch {
          await fs.writeFile(anchorPath, '{"name":"project","version":"0.0.1"}');
        }

        const result = execSync(`npx --yes getdesign@latest add ${brand}`, {
          cwd: projectPath,
          timeout: 60_000,
          stdio: 'pipe',
          shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
          env: { ...process.env, npm_config_yes: 'true' },
        });
        const output = result.toString().trim();
        console.log(`[ProjectService] getdesign output for "${brand}":`, output.slice(-200));

        // Verify DESIGN.md was actually created
        const designPath = path.join(projectPath, 'DESIGN.md');
        try {
          await fs.access(designPath);
          console.log(`[ProjectService] ✓ DESIGN.md created at ${designPath}`);
        } catch {
          // getdesign may put it in a subdirectory — move it to root
          const subPath = path.join(projectPath, brand, 'DESIGN.md');
          try {
            await fs.access(subPath);
            await fs.rename(subPath, designPath);
            await fs.rmdir(path.join(projectPath, brand)).catch(() => {});
            console.log(`[ProjectService] ✓ DESIGN.md moved from ${brand}/ to root`);
          } catch {
            console.warn(`[ProjectService] DESIGN.md not found at root or ${brand}/ after getdesign`);
          }
        }
      } catch (designError: unknown) {
        const err = designError as { stderr?: Buffer; message?: string };
        const stderr = err.stderr ? err.stderr.toString().slice(-500) : '';
        console.warn(`[ProjectService] getdesign failed for "${brand}": ${err.message || 'unknown'}${stderr ? `\nstderr: ${stderr}` : ''}`);
      }
    }
  }

  // Create project in database
  const project = await prisma.project.create({
    data: {
      id: input.project_id,
      name: input.name,
      description: input.description,
      initialPrompt: input.initialPrompt,
      repoPath: projectPath,
      preferredCli: input.preferredCli || 'claude',
      selectedModel: normalizeModelId(input.preferredCli || 'claude', input.selectedModel ?? getDefaultModelForCli(input.preferredCli || 'claude')),
      designTemplate: input.designTemplate || null,
      status: 'idle',
      templateType: 'nextjs',
      lastActiveAt: new Date(),
      previewUrl: null,
      previewPort: null,
    },
  });

  console.log(`[ProjectService] Created project: ${project.id}`);
  return {
    ...project,
    selectedModel: normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined),
  } as Project;
}

/**
 * Update project
 */
export async function updateProject(
  id: string,
  input: UpdateProjectInput
): Promise<Project> {
  const existing = await prisma.project.findUnique({
    where: { id },
    select: { preferredCli: true },
  });
  const targetCli = input.preferredCli ?? existing?.preferredCli ?? 'claude';
  const normalizedModel = input.selectedModel
    ? normalizeModelId(targetCli, input.selectedModel)
    : undefined;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...input,
      ...(input.selectedModel
        ? { selectedModel: normalizedModel }
        : {}),
      updatedAt: new Date(),
    },
  });

  console.log(`[ProjectService] Updated project: ${id}`);
  return {
    ...project,
    selectedModel: normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined),
  } as Project;
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<void> {
  // Delete project directory
  const project = await getProjectById(id);
  if (project?.repoPath) {
    try {
      await fs.rm(project.repoPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[ProjectService] Failed to delete project directory:`, error);
    }
  }

  // Delete project from database (related data automatically deleted via Cascade)
  await prisma.project.delete({
    where: { id },
  });

  console.log(`[ProjectService] Deleted project: ${id}`);
}

/**
 * Update project activity time
 */
export async function updateProjectActivity(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: {
      lastActiveAt: new Date(),
    },
  });
}

/**
 * Update project status
 */
export async function updateProjectStatus(
  id: string,
  status: 'idle' | 'running' | 'stopped' | 'error'
): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: {
      status,
      updatedAt: new Date(),
    },
  });
  console.log(`[ProjectService] Updated project status: ${id} -> ${status}`);
}

export interface ProjectCliPreference {
  preferredCli: string;
  fallbackEnabled: boolean;
  selectedModel: string | null;
}

export async function getProjectCliPreference(projectId: string): Promise<ProjectCliPreference | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      preferredCli: true,
      fallbackEnabled: true,
      selectedModel: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    preferredCli: project.preferredCli ?? 'claude',
    fallbackEnabled: project.fallbackEnabled ?? false,
    selectedModel: normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined),
  };
}

export async function updateProjectCliPreference(
  projectId: string,
  input: Partial<ProjectCliPreference>
): Promise<ProjectCliPreference> {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { preferredCli: true },
  });
  const targetCli = input.preferredCli ?? existing?.preferredCli ?? 'claude';

  const result = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.preferredCli ? { preferredCli: input.preferredCli } : {}),
      ...(typeof input.fallbackEnabled === 'boolean'
        ? { fallbackEnabled: input.fallbackEnabled }
        : {}),
      ...(input.selectedModel
        ? { selectedModel: normalizeModelId(targetCli, input.selectedModel) }
        : input.selectedModel === null
        ? { selectedModel: null }
        : {}),
      updatedAt: new Date(),
    },
    select: {
      preferredCli: true,
      fallbackEnabled: true,
      selectedModel: true,
    },
  });

  return {
    preferredCli: result.preferredCli ?? 'claude',
    fallbackEnabled: result.fallbackEnabled ?? false,
    selectedModel: normalizeModelId(result.preferredCli ?? 'claude', result.selectedModel ?? undefined),
  };
}

interface ConversationCliPreference {
  preferredCli: string;
  selectedModel?: string;
}

export async function getConversationCliPreference(
  projectId: string,
  conversationId: string
): Promise<ConversationCliPreference | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { settings: true },
  });
  if (!project?.settings) return null;

  try {
    const settings = JSON.parse(project.settings);
    const prefs = settings?.conversationCliPreferences?.[conversationId];
    return prefs ?? null;
  } catch {
    return null;
  }
}

export async function setConversationCliPreference(
  projectId: string,
  conversationId: string,
  preference: ConversationCliPreference
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { settings: true },
  });

  let settings: Record<string, unknown> = {};
  if (project?.settings) {
    try {
      settings = JSON.parse(project.settings);
    } catch {
      settings = {};
    }
  }

  if (!settings.conversationCliPreferences) {
    settings.conversationCliPreferences = {};
  }
  (settings.conversationCliPreferences as Record<string, ConversationCliPreference>)[conversationId] = preference;

  await prisma.project.update({
    where: { id: projectId },
    data: { settings: JSON.stringify(settings) },
  });
}

export async function clearConversationCliPreference(
  projectId: string,
  conversationId: string
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { settings: true },
  });
  if (!project?.settings) return;

  try {
    const settings = JSON.parse(project.settings);
    if (settings?.conversationCliPreferences?.[conversationId]) {
      delete settings.conversationCliPreferences[conversationId];
      await prisma.project.update({
        where: { id: projectId },
        data: { settings: JSON.stringify(settings) },
      });
    }
  } catch {
    // Silently ignore parse errors on clear
  }
}
