/**
 * RadFlow Health Endpoint - App Router
 *
 * This file is automatically created by RadFlow in the target project at:
 * app/api/__radflow/health/route.ts
 *
 * DO NOT EDIT - This file is managed by RadFlow
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: '0.1.0',
    timestamp: Date.now(),
  });
}

// Prevent static optimization so we always get fresh timestamp
export const dynamic = 'force-dynamic';
