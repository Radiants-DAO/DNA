// app/api/typefully/drafts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDraft, updateDraft } from '@/app/intern/lib/typefully';
import { transformDraft } from '@/app/intern/lib/transforms';
import { toggleTask } from '@/app/intern/lib/tasks';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const draftId = parseInt(id, 10);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const draft = await getDraft(draftId);
    const transformed = transformDraft(draft);

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check editor auth
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const draftId = parseInt(id, 10);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, taskIndex, scheduledDate, scratchpad_text } = body;

    // Handle task toggle action
    if (action === 'toggle_task' && typeof taskIndex === 'number') {
      const currentDraft = await getDraft(draftId);
      const newScratchpad = toggleTask(currentDraft.scratchpad_text, taskIndex);

      const updated = await updateDraft(draftId, {
        scratchpad_text: newScratchpad,
      });

      return NextResponse.json(transformDraft(updated));
    }

    // Handle reschedule action
    if (scheduledDate) {
      const updated = await updateDraft(draftId, {
        publish_at: `${scheduledDate}T18:00:00Z`,
      });

      return NextResponse.json(transformDraft(updated));
    }

    // Handle direct scratchpad update
    if (scratchpad_text !== undefined) {
      const updated = await updateDraft(draftId, {
        scratchpad_text,
      });

      return NextResponse.json(transformDraft(updated));
    }

    return NextResponse.json(
      { error: 'No valid update action provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}
