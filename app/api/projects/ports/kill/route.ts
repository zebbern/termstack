/**
 * POST /api/projects/ports/kill
 * Stops the preview process for a specific project.
 * Body: { projectId: string }
 */

import { previewManager } from '@/lib/services/preview';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/utils/api-response';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = body?.projectId;

    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      return createErrorResponse('projectId is required', undefined, 400);
    }

    const result = await previewManager.stop(projectId.trim());
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error, 'API', 'Failed to kill port');
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
