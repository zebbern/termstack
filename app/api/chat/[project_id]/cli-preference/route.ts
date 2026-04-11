import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectCliPreference,
  updateProjectCliPreference,
  getConversationCliPreference,
  setConversationCliPreference,
  clearConversationCliPreference,
} from '@/lib/services/project';

interface RouteContext {
  params: Promise<{ project_id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { project_id } = await params;
  const conversationId = request.nextUrl.searchParams.get('conversationId');

  if (conversationId) {
    const convPref = await getConversationCliPreference(project_id, conversationId);
    if (convPref) {
      return NextResponse.json({ success: true, data: convPref, level: 'conversation' });
    }
  }

  const preference = await getProjectCliPreference(project_id);
  if (!preference) {
    return NextResponse.json(
      { success: false, error: 'Project not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: preference, level: 'project' });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { project_id } = await params;
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 },
      );
    }

    const conversationId =
      typeof body.conversationId === 'string' ? body.conversationId.trim() || null
      : typeof body.conversation_id === 'string' ? body.conversation_id.trim() || null
      : null;

    const preferredCli =
      typeof body.preferredCli === 'string' ? body.preferredCli
      : typeof body.preferred_cli === 'string' ? body.preferred_cli
      : undefined;

    const selectedModel =
      typeof body.selectedModel === 'string' ? body.selectedModel
      : typeof body.selected_model === 'string' ? body.selected_model
      : undefined;

    if (conversationId) {
      if (preferredCli) {
        await setConversationCliPreference(project_id, conversationId, {
          preferredCli,
          selectedModel,
        });
        return NextResponse.json({
          success: true,
          data: { preferredCli, selectedModel },
          level: 'conversation',
        });
      } else {
        await clearConversationCliPreference(project_id, conversationId);
        return NextResponse.json({ success: true, cleared: true, level: 'conversation' });
      }
    }

    const update = {
      preferredCli,
      fallbackEnabled:
        typeof body.fallbackEnabled === 'boolean' ? body.fallbackEnabled
        : typeof body.fallback_enabled === 'boolean' ? body.fallback_enabled
        : undefined,
      selectedModel,
    };

    const updated = await updateProjectCliPreference(project_id, update);
    return NextResponse.json({ success: true, data: updated, level: 'project' });
  } catch (error) {
    console.error('[API] Failed to update CLI preference:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update CLI preference',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
