/**
 * GET /api/projects/[id]/preview/status
 * Returns the current preview status for the project.
 */

import { previewManager } from '@/lib/services/preview';
import { getProjectById } from '@/lib/services/project';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/utils/api-response';

interface RouteContext {
  params: Promise<{ project_id: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { project_id } = await params;

    if (!project_id || typeof project_id !== 'string' || !project_id.trim()) {
      return createErrorResponse('project_id is required', undefined, 400);
    }

    const project = await getProjectById(project_id);
    if (!project) {
      return createErrorResponse('Project not found', undefined, 404);
    }

    const preview = previewManager.getStatus(project_id);
    return createSuccessResponse(preview);
  } catch (error) {
    return handleApiError(error, 'API', 'Failed to fetch preview status');
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
