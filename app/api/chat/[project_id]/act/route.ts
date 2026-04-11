/**
 * AI Action API Route
 * POST /api/chat/[project_id]/act - Execute AI command
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectById,
  updateProject,
  updateProjectActivity,
  getConversationCliPreference,
  setConversationCliPreference,
} from '@/lib/services/project';
import { createMessage } from '@/lib/services/message';
import { initializeNextJsProject as initializeClaudeProject, applyChanges as applyClaudeChanges } from '@/lib/services/cli/claude';
import { initializeNextJsProject as initializeCodexProject, applyChanges as applyCodexChanges } from '@/lib/services/cli/codex';
import { initializeNextJsProject as initializeCursorProject, applyChanges as applyCursorChanges } from '@/lib/services/cli/cursor';
import { initializeNextJsProject as initializeQwenProject, applyChanges as applyQwenChanges } from '@/lib/services/cli/qwen';
import { initializeNextJsProject as initializeGLMProject, applyChanges as applyGLMChanges } from '@/lib/services/cli/glm';
import { getDefaultModelForCli, normalizeModelId } from '@/lib/constants/cliModels';
import { streamManager } from '@/lib/services/stream';
import type { ChatActRequest } from '@/types/backend';
import { generateProjectId } from '@/lib/utils';
import { previewManager } from '@/lib/services/preview';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { serializeMessage } from '@/lib/serializers/chat';
import {
  upsertUserRequest,
  markUserRequestAsProcessing,
} from '@/lib/services/user-requests';

interface RouteContext {
  params: Promise<{ project_id: string }>;
}

function coerceString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const PROJECTS_DIR = process.env.PROJECTS_DIR || './data/projects';
const PROJECTS_DIR_ABSOLUTE = path.isAbsolute(PROJECTS_DIR)
  ? PROJECTS_DIR
  : path.resolve(process.cwd(), PROJECTS_DIR);

function resolveAssetsPath(projectId: string): string {
  return path.join(PROJECTS_DIR_ABSOLUTE, projectId, 'assets');
}

function isPathInsideDirectory(targetPath: string, directoryPath: string): boolean {
  const relativePath = path.relative(directoryPath, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function toClientAssetPath(projectId: string, projectRoot: string, absolutePath: string): string {
  const resolvedAbsolutePath = path.resolve(absolutePath);
  const assetsPath = path.resolve(resolveAssetsPath(projectId));
  if (isPathInsideDirectory(resolvedAbsolutePath, assetsPath)) {
    return `assets/${path.basename(resolvedAbsolutePath)}`;
  }

  const projectUploadsPath = path.resolve(path.join(projectRoot, 'public', 'uploads'));
  const hostUploadsPath = path.resolve(path.join(process.cwd(), 'public', 'uploads'));

  if (
    isPathInsideDirectory(resolvedAbsolutePath, projectUploadsPath) ||
    isPathInsideDirectory(resolvedAbsolutePath, hostUploadsPath)
  ) {
    return `uploads/${path.basename(resolvedAbsolutePath)}`;
  }

  return path.basename(resolvedAbsolutePath);
}

function ensureAbsoluteAssetPath(
  projectId: string,
  projectRoot: string,
  inputPath: string,
): { absolutePath: string; clientPath: string } {
  const normalized = path.normalize(inputPath);
  if (path.isAbsolute(normalized)) {
    const absolutePath = path.resolve(normalized);
    return {
      absolutePath,
      clientPath: toClientAssetPath(projectId, projectRoot, absolutePath).replace(/\\/g, '/'),
    };
  }

  const projectBase = path.join(PROJECTS_DIR_ABSOLUTE, projectId);
  const allowedRoots = [
    resolveAssetsPath(projectId),
    path.join(projectRoot, 'public', 'uploads'),
    path.join(process.cwd(), 'public', 'uploads'),
  ].map((allowedRoot) => path.resolve(allowedRoot));

  const candidatePaths = [
    path.resolve(projectBase, normalized),
    path.resolve(process.cwd(), normalized),
  ];

  const absolutePath = candidatePaths.find((candidatePath) =>
    allowedRoots.some((allowedRoot) => isPathInsideDirectory(candidatePath, allowedRoot)),
  );

  if (!absolutePath) {
    throw new Error('Image path must resolve inside the project asset directories.');
  }

  return {
    absolutePath,
    clientPath: toClientAssetPath(projectId, projectRoot, absolutePath).replace(/\\/g, '/'),
  };
}

function resolveProjectRoot(projectId: string, repoPath?: string | null): string {
  if (repoPath) {
    return path.isAbsolute(repoPath) ? repoPath : path.resolve(process.cwd(), repoPath);
  }
  return path.join(PROJECTS_DIR_ABSOLUTE, projectId);
}

async function mirrorAssetToPublic(
  projectRoot: string,
  filename: string,
  sourcePath: string,
): Promise<{ publicUrl: string | null }> {
  const resolvedSourcePath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(process.cwd(), sourcePath);
  const hostUploadsDir = path.join(process.cwd(), 'public', 'uploads');
  let hostPublicUrl: string | null = null;

  try {
    await fs.mkdir(hostUploadsDir, { recursive: true });
    const destinationPath = path.join(hostUploadsDir, filename);
    try {
      await fs.access(destinationPath);
    } catch {
      await fs.copyFile(resolvedSourcePath, destinationPath);
    }
    hostPublicUrl = `/uploads/${filename}`;
  } catch (error) {
    console.warn('[API] Failed to mirror asset into application public/uploads:', error);
  }

  try {
    const uploadsDir = path.join(projectRoot, 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const destinationPath = path.join(uploadsDir, filename);
    try {
      await fs.access(destinationPath);
    } catch {
      await fs.copyFile(resolvedSourcePath, destinationPath);
    }
    return { publicUrl: hostPublicUrl };
  } catch (error) {
    console.warn('[API] Failed to mirror asset into project public/uploads:', error);
    return { publicUrl: hostPublicUrl };
  }
}

function inferExtensionFromMime(mime?: string): string {
  if (!mime) return '.png';
  const normalized = mime.toLowerCase();
  if (normalized.includes('png')) return '.png';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg';
  if (normalized.includes('gif')) return '.gif';
  if (normalized.includes('webp')) return '.webp';
  if (normalized.includes('svg')) return '.svg';
  return '.png';
}

async function materializeBase64Image(
  projectId: string,
  projectRoot: string,
  base64: string,
  nameHint?: string,
  mimeType?: string,
): Promise<{ absolutePath: string; path: string; filename: string; publicUrl: string | null }> {
  const buffer = Buffer.from(base64, 'base64');
  const extension = inferExtensionFromMime(mimeType);
  const safeName = nameHint && nameHint.trim() ? nameHint.trim() : `image-${randomUUID()}`;
  const filename = `${safeName.replace(/[^a-zA-Z0-9-_]/g, '-') || 'image'}-${randomUUID()}${extension}`;
  const assetsDir = resolveAssetsPath(projectId);
  await fs.mkdir(assetsDir, { recursive: true });
  const absolutePath = path.join(assetsDir, filename);
  await fs.writeFile(absolutePath, buffer);
  const mirror = await mirrorAssetToPublic(projectRoot, filename, absolutePath);
  return {
    absolutePath,
    path: `assets/${filename}`,
    filename,
    publicUrl: mirror.publicUrl,
  };
}

type RawImageAttachment = Record<string, unknown>;

async function normalizeImageAttachment(
  projectId: string,
  projectRoot: string,
  raw: RawImageAttachment,
  index: number,
): Promise<{ name: string; path: string; absolutePath: string; url: string; publicUrl?: string } | null> {
  const name = typeof raw.name === 'string' && raw.name.trim().length > 0 ? raw.name.trim() : `Image ${index + 1}`;
  const providedUrl = typeof raw.url === 'string' && raw.url.trim().length > 0 ? raw.url.trim() : undefined;
  const providedPublicUrl =
    typeof raw.public_url === 'string' && raw.public_url.trim().length > 0
      ? raw.public_url.trim()
      : typeof raw.publicUrl === 'string' && raw.publicUrl.trim().length > 0
      ? raw.publicUrl.trim()
      : undefined;

  const pathValue = typeof raw.path === 'string' && raw.path.trim().length > 0 ? raw.path.trim() : null;

  const base64DataCandidate =
    typeof raw.base64_data === 'string'
      ? raw.base64_data
      : typeof raw.base64Data === 'string'
      ? raw.base64Data
      : null;

  const mimeTypeCandidate =
    typeof raw.mime_type === 'string'
      ? raw.mime_type
      : typeof raw.mimeType === 'string'
      ? raw.mimeType
      : undefined;

  if (pathValue) {
    try {
      const resolvedPath = ensureAbsoluteAssetPath(projectId, projectRoot, pathValue);
      await fs.stat(resolvedPath.absolutePath);
      const filename = path.basename(resolvedPath.absolutePath);
      let effectivePublicUrl = providedPublicUrl;
      if (!effectivePublicUrl) {
        const mirror = await mirrorAssetToPublic(projectRoot, filename, resolvedPath.absolutePath);
        effectivePublicUrl = mirror.publicUrl ?? undefined;
      }
      return {
        name,
        path: resolvedPath.clientPath,
        absolutePath: resolvedPath.absolutePath,
        url: providedUrl ?? `/api/assets/${projectId}/${filename}`,
        publicUrl: effectivePublicUrl,
      };
    } catch {
      // fall through and try to materialize if base64 present
    }
  }

  if (base64DataCandidate) {
    try {
      const materialized = await materializeBase64Image(
        projectId,
        projectRoot,
        base64DataCandidate,
        name,
        mimeTypeCandidate,
      );
      return {
        name,
        path: materialized.path,
        absolutePath: materialized.absolutePath,
        url: providedUrl ?? `/api/assets/${projectId}/${materialized.filename}`,
        publicUrl: providedPublicUrl ?? materialized.publicUrl ?? undefined,
      };
    } catch (error) {
      console.error('[API] Failed to materialize base64 image:', error);
      return null;
    }
  }

  return null;
}

/**
 * POST /api/chat/[project_id]/act
 * Execute AI command
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { project_id } = await params;
    const rawBody = await request.json().catch(() => ({}));
    const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as ChatActRequest &
      Record<string, unknown>;

    const project = await getProjectById(project_id);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 },
      );
    }

    const legacyBody = body as Record<string, unknown>;
    const projectRoot = resolveProjectRoot(project_id, project.repoPath);
    const rawInstruction = typeof body.instruction === 'string' ? body.instruction : '';
    const instructionWithoutLegacyPaths = rawInstruction.replace(/\n*Image #\d+ path: [^\n]+/g, '').trim();

    const rawImages: RawImageAttachment[] = Array.isArray((body as Record<string, unknown>).images)
      ? ((body as Record<string, unknown>).images as RawImageAttachment[])
      : Array.isArray(legacyBody['images'])
      ? (legacyBody['images'] as RawImageAttachment[])
      : [];

    const processedImages: {
      name: string;
      path: string;
      absolutePath: string;
      url: string;
      publicUrl?: string;
    }[] = [];
    for (let index = 0; index < rawImages.length; index += 1) {
      const normalized = await normalizeImageAttachment(project_id, projectRoot, rawImages[index], index);
      if (normalized) {
        processedImages.push(normalized);
      }
    }

    const displayInstruction =
      instructionWithoutLegacyPaths ||
      (processedImages.length > 0
        ? `[Attached ${processedImages.length} image${processedImages.length === 1 ? '' : 's'}]`
        : '');

    let imageSection = '';
    if (processedImages.length > 0) {
      const imageLines = processedImages.map((image) => `- ${image.absolutePath}`);
      imageSection = [
        '[The user has attached the following image(s). Use the Read tool to view each file so you can see what they contain:]',
        ...imageLines,
      ].join('\n');
    }
    const agentInstruction = [instructionWithoutLegacyPaths, imageSection]
      .filter((segment) => segment && segment.trim().length > 0)
      .join('\n\n')
      .trim();

    if (!agentInstruction) {
      return NextResponse.json(
        { success: false, error: 'instruction or images are required' },
        { status: 400 },
      );
    }

    const explicitCliPref =
      coerceString((body as Record<string, unknown>).cliPreference) ??
      coerceString(legacyBody['cli_preference']);

    const conversationId =
      coerceString(body.conversationId) ?? coerceString(legacyBody['conversation_id']);

    let cliPreferenceRaw: string;
    if (explicitCliPref) {
      cliPreferenceRaw = explicitCliPref;
    } else if (conversationId) {
      const convPref = await getConversationCliPreference(project_id, conversationId);
      cliPreferenceRaw = convPref?.preferredCli ?? project.preferredCli ?? 'claude';
    } else {
      cliPreferenceRaw = project.preferredCli ?? 'claude';
    }
    const cliPreference = cliPreferenceRaw.toLowerCase();

    const selectedModelRaw =
      coerceString(body.selectedModel) ??
      coerceString(legacyBody['selected_model']) ??
      project.selectedModel ??
      getDefaultModelForCli(cliPreference);
    const selectedModel = normalizeModelId(cliPreference, selectedModelRaw);

    const requestId =
      coerceString(body.requestId) ??
      coerceString(legacyBody['request_id']) ??
      generateProjectId();

    const isInitialPrompt =
      body.isInitialPrompt === true ||
      legacyBody['is_initial_prompt'] === true ||
      legacyBody['is_initial_prompt'] === 'true';

    const metadata =
      processedImages.length > 0
        ? {
            attachments: processedImages.map((image) => ({
              name: image.name,
              url: image.url,
              publicUrl: image.publicUrl,
              path: image.path,
            })),
          }
        : undefined;

    console.log('📸 Creating message with attachments:', {
      projectId: project_id,
      hasAttachments: processedImages.length > 0,
      attachmentsCount: processedImages.length,
      metadataKeys: metadata ? Object.keys(metadata) : [],
      metadataString: JSON.stringify(metadata, null, 2)
    });

    const userMessage = await createMessage({
      projectId: project_id,
      role: 'user',
      messageType: 'chat',
      content: displayInstruction,
      conversationId: conversationId ?? undefined,
      cliSource: cliPreference,
      metadata,
      requestId: requestId,
    });

    console.log('📸 Message created successfully:', {
      messageId: userMessage.id,
      hasMetadata: Boolean(metadata),
      metadataType: metadata ? typeof metadata : 'undefined',
      metadataKeys: metadata ? Object.keys(metadata) : [],
      metadataString: metadata ? JSON.stringify(metadata, null, 2) : undefined,
      metadataJsonLength: userMessage.metadataJson ? userMessage.metadataJson.length : 0,
    });

    if (requestId) {
      try {
        const storedInstruction = displayInstruction || agentInstruction;

        await upsertUserRequest({
          id: requestId,
          projectId: project_id,
          instruction: storedInstruction,
          cliPreference,
        });
        await markUserRequestAsProcessing(requestId);
      } catch (error) {
        console.error('[API] Failed to record user request metadata:', error);
      }
    }

    streamManager.publish(project_id, {
      type: 'message',
      data: serializeMessage(userMessage, { requestId }),
    });

    await updateProjectActivity(project_id);

    const projectPath = projectRoot;

    const existingSelected = normalizeModelId(project.preferredCli ?? 'claude', project.selectedModel ?? undefined);

    if (
      project.preferredCli !== cliPreference ||
      existingSelected !== selectedModel
    ) {
      try {
        await updateProject(project_id, {
          preferredCli: cliPreference,
          selectedModel,
        });
      } catch (error) {
        console.error('[API] Failed to persist project CLI/model settings:', error);
      }
    }

    // Persist conversation-level CLI preference when user explicitly switches
    if (conversationId && explicitCliPref) {
      try {
        await setConversationCliPreference(project_id, conversationId, {
          preferredCli: cliPreference,
          selectedModel,
        });
      } catch (error) {
        console.error('[API] Failed to persist conversation CLI preference:', error);
      }
    }

    try {
      const status = previewManager.getStatus(project_id);
      if (!status.url) {
        previewManager.start(project_id).catch((error) => {
          console.warn('[API] Failed to auto-start preview (will continue):', error);
        });
      }
    } catch (error) {
      console.warn('[API] Preview auto-start check failed (will continue):', error);
    }

    if (isInitialPrompt) {
      const executor =
        cliPreference === 'codex'
          ? initializeCodexProject
          : cliPreference === 'cursor'
          ? initializeCursorProject
          : cliPreference === 'qwen'
          ? initializeQwenProject
          : cliPreference === 'glm'
          ? initializeGLMProject
          : initializeClaudeProject;

      executor(
        project_id,
        projectPath,
        agentInstruction,
        selectedModel,
        requestId,
      ).catch((error) => {
        console.error('[API] Failed to initialize project:', error);
      });
    } else {
      const executor =
        cliPreference === 'codex'
          ? applyCodexChanges
          : cliPreference === 'cursor'
          ? applyCursorChanges
          : cliPreference === 'qwen'
          ? applyQwenChanges
          : cliPreference === 'glm'
          ? applyGLMChanges
          : applyClaudeChanges;

      const sessionId =
        cliPreference === 'claude'
          ? project.activeClaudeSessionId || undefined
          : cliPreference === 'cursor'
          ? project.activeCursorSessionId || undefined
          : undefined;

      executor(
        project_id,
        projectPath,
        agentInstruction,
        selectedModel,
        sessionId,
        requestId,
      ).catch((error) => {
        console.error('[API] Failed to execute AI:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'AI execution started',
      requestId,
      userMessageId: userMessage.id,
      conversationId: conversationId ?? null,
    });
  } catch (error) {
    console.error('[API] Failed to execute AI:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute AI',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
