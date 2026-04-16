/**
 * GET /api/projects/ports
 * Returns all active preview processes across all projects.
 */

import { previewManager } from '@/lib/services/preview';
import { getProjectById } from '@/lib/services/project';
import { createSuccessResponse, handleApiError } from '@/lib/utils/api-response';

export async function GET() {
  try {
    const allStatuses = previewManager.getAllStatuses();

    const enriched = await Promise.all(
      allStatuses.map(async (entry) => {
        const project = await getProjectById(entry.projectId);
        return {
          projectId: entry.projectId,
          projectName: project?.name ?? entry.projectId,
          port: entry.port,
          url: entry.url,
          status: entry.status,
          pid: entry.pid ?? null,
          logCount: entry.logs.length,
          recentLogs: entry.logs.slice(-20),
          latestDiagnostic: entry.latestDiagnostic ?? null,
        };
      })
    );

    return createSuccessResponse(enriched);
  } catch (error) {
    return handleApiError(error, 'API', 'Failed to fetch active ports');
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
