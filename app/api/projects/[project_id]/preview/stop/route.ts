/**
 * POST /api/projects/[id]/preview/stop
 * Stops the development server for the project if it is running.
 */

import { previewManager } from '@/lib/services/preview';
import { getProjectById } from '@/lib/services/project';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/utils/api-response';

interface RouteContext {
  params: Promise<{ project_id: string }>;
}

export async function POST(
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

    const preview = await previewManager.stop(project_id);
    return createSuccessResponse(preview);
  } catch (error) {
    return handleApiError(error, 'API', 'Failed to stop preview');
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
