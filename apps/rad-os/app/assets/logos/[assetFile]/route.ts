import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

type RouteContext = {
  params: Promise<{ assetFile: string }> | { assetFile: string };
};

const LOGO_DIR = path.resolve(process.cwd(), 'public/assets/logos');

function getContentType(assetFile: string) {
  return assetFile.endsWith('.png') ? 'image/png' : 'image/svg+xml; charset=utf-8';
}

function getSourceFileName(assetFile: string) {
  return assetFile.replace(/\.png$/i, '.svg');
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { assetFile } = await params;
  const contentType = getContentType(assetFile);
  const sourceFileName = getSourceFileName(assetFile);
  const sourcePath = path.join(LOGO_DIR, sourceFileName);

  try {
    const svg = await readFile(sourcePath);

    if (assetFile.endsWith('.png')) {
      const png = await sharp(svg).png().toBuffer();
      return new Response(new Uint8Array(png), {
        headers: {
          'content-type': contentType,
          'content-disposition': `attachment; filename="${assetFile}"`,
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return new Response(svg, {
      headers: {
        'content-type': contentType,
        'content-disposition': `attachment; filename="${assetFile}"`,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}
