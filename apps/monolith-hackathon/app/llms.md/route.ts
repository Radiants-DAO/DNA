import { buildLlmsMarkdown, getCanonicalSiteUrl } from '../lib/llm-docs';

export const revalidate = 3600;

export function GET() {
  const body = buildLlmsMarkdown(getCanonicalSiteUrl());

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
