import { describe, expect, it } from 'vitest';
import { FONTS } from '@/components/apps/typography-playground/typography-data';

describe('typography font downloads', () => {
  it('uses local download URLs for bundled fonts', () => {
    for (const font of FONTS) {
      expect(font.downloadUrl).toMatch(/^\/assets\/fonts\//);
      expect(font.linkOut).toBe(false);
    }
  });
});
