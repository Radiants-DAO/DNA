// app/api/typefully/tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listTags, createTag } from '@/app/intern/lib/typefully';

const EDITOR_PASSWORD = process.env.INTERN_EDITOR_PASSWORD;

function isEditor(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-intern-auth');
  return authHeader === EDITOR_PASSWORD;
}

export async function GET() {
  try {
    const response = await listTags();
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isEditor(request)) {
    return NextResponse.json(
      { error: 'Editor access required' },
      { status: 401 }
    );
  }

  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tag = await createTag(name);
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
