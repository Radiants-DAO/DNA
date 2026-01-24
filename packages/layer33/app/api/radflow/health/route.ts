import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function getProjectInfo() {
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return {
      name: pkg.name || 'unknown',
      version: pkg.version || '0.0.0',
    };
  } catch {
    return { name: 'unknown', version: '0.0.0' };
  }
}

export async function GET() {
  const project = getProjectInfo();
  return NextResponse.json(
    {
      ok: true,
      project: project.name,
      version: project.version,
      bridgeVersion: '0.1.0',
      timestamp: Date.now(),
    },
    { headers: corsHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export const dynamic = 'force-dynamic';
