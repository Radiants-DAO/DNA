import { readFile } from 'node:fs/promises';
import path from 'node:path';

type RouteContext = {
  params: Promise<{ fontFile: string }> | { fontFile: string };
};

const FONT_DIR = path.resolve(process.cwd(), '../../packages/radiants/fonts');

function getContentType(fontFile: string) {
  return fontFile.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { fontFile } = await params;
  const sourcePath = path.join(FONT_DIR, fontFile);

  try {
    const font = await readFile(sourcePath);

    return new Response(font, {
      headers: {
        'content-type': getContentType(fontFile),
        'content-disposition': `attachment; filename="${fontFile}"`,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
