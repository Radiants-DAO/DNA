import { describe, expect, it } from 'vitest';
import { getFontDownloadHref } from '@/lib/asset-downloads';
import { GET as getLogoAsset } from '@/app/assets/logos/[assetFile]/route';
import { GET as getFontAsset } from '@/app/assets/fonts/[fontFile]/route';

describe('asset download helpers', () => {
  it('builds local font download paths', () => {
    expect(getFontDownloadHref('Joystix.woff2')).toBe('/assets/fonts/Joystix.woff2');
  });
});

describe('asset routes', () => {
  it('serves PNG logo downloads from the flat asset path', async () => {
    const response = await getLogoAsset(
      new Request('http://localhost/assets/logos/wordmark-cream.png'),
      { params: Promise.resolve({ assetFile: 'wordmark-cream.png' }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it('serves local font downloads from the radiants package', async () => {
    const response = await getFontAsset(
      new Request('http://localhost/assets/fonts/Joystix.woff2'),
      { params: Promise.resolve({ fontFile: 'Joystix.woff2' }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('font/woff2');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
});
