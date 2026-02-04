// app/api/typefully/drafts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listDrafts, createDraft } from '@/app/intern/lib/typefully';
import { transformDraft } from '@/app/intern/lib/transforms';
import { DEFAULT_TASK_TEMPLATE } from '@/app/intern/types/typefully';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const response = await listDrafts(limit, offset);
    const drafts = response.results.map(transformDraft);

    return NextResponse.json({
      drafts,
      count: response.count,
      limit: response.limit,
      offset: response.offset,
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check editor auth
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { title, brief, scheduledDate, tags } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Build the draft request
    const draftRequest = {
      platforms: {
        x: {
          enabled: true as const,
          posts: [{ text: brief || title }],
        },
      },
      draft_title: title,
      scratchpad_text: DEFAULT_TASK_TEMPLATE,
      tags: tags || [],
      publish_at: scheduledDate ? `${scheduledDate}T18:00:00Z` : undefined,
    };

    const created = await createDraft(draftRequest);
    const transformed = transformDraft(created);

    return NextResponse.json(transformed, { status: 201 });
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}
