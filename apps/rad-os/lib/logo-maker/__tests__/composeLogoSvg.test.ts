import { describe, it, expect } from 'vitest';
import { composeLogoSvg } from '../composeLogoSvg';
import { BRAND_HEX } from '../colors';

describe('composeLogoSvg', () => {
  it('produces an svg with the requested width/height/viewBox', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'solid', color: 'cream' },
      width: 512,
      height: 512,
    });
    expect(out).toMatch(/<svg[^>]+width="512"[^>]+height="512"/);
    expect(out).toContain('viewBox="0 0 512 512"');
  });

  it('paints a solid bg rect when bg.kind === "solid"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'solid', color: 'cream' },
      width: 512,
      height: 512,
    });
    expect(out).toContain(`<rect width="512" height="512" fill="${BRAND_HEX.cream}"/>`);
  });

  it('omits the bg rect when bg.kind === "transparent"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'ink',
      bg: { kind: 'transparent' },
      width: 512,
      height: 512,
    });
    expect(out).not.toMatch(/<rect width="512" height="512"/);
  });

  it('uses the pattern fill when bg.kind === "pattern"', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'yellow',
      bg: {
        kind: 'pattern',
        pattern: 'checkerboard',
        fg: 'ink',
        bgColor: 'cream',
      },
      width: 512,
      height: 512,
    });
    expect(out).toContain('<defs>');
    expect(out).toMatch(/<pattern id="logo-bg-pattern"/);
    expect(out).toContain('fill="url(#logo-bg-pattern)"');
  });

  it('injects the logo fill color', () => {
    const out = composeLogoSvg({
      variant: 'mark',
      logoColor: 'yellow',
      bg: { kind: 'transparent' },
      width: 512,
      height: 512,
    });
    expect(out).toContain(`fill="${BRAND_HEX.yellow}"`);
  });
});
