import { buildLlmsFullMarkdown, buildPanelMarkdown, getCanonicalSiteUrl } from '../lib/llm-docs';

export const revalidate = 3600;

export function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const panel = requestUrl.searchParams.get('panel') ?? undefined;
  const tab = requestUrl.searchParams.get('tab') ?? undefined;
  const siteUrl = getCanonicalSiteUrl();

  const body = panel
    ? buildPanelMarkdown(panel, tab, siteUrl) ?? buildLlmsFullMarkdown(siteUrl)
    : buildLlmsFullMarkdown(siteUrl);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
