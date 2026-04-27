import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BitmapIcon } from '../icons/BitmapIcon.tsx';
import {
  BITMAP_ICONS_16,
  BITMAP_ICONS_24,
  bitmapIconSource,
  bitmapIconSource16,
  bitmapIconSource24,
  getBitmapIcon,
} from '../icons';

describe('generated bitmap icon registry', () => {
  it('exposes browseable converted icon sources alongside the registry maps', () => {
    expect(bitmapIconSource16.length).toBe(Object.keys(BITMAP_ICONS_16).length);
    expect(bitmapIconSource24.length).toBe(Object.keys(BITMAP_ICONS_24).length);
    expect(bitmapIconSource.length).toBe(
      bitmapIconSource16.length + bitmapIconSource24.length,
    );

    expect(bitmapIconSource16.find((entry) => entry.name === 'close')).toBe(
      getBitmapIcon('close', 16),
    );
    expect(
      bitmapIconSource24.find(
        (entry) => entry.name === 'coding-apps-websites-music-player',
      ),
    ).toBe(getBitmapIcon('coding-apps-websites-music-player', 24));
  });

  it('bakes a large set of 16px and 24px icons', () => {
    expect(Object.keys(BITMAP_ICONS_16).length).toBeGreaterThan(200);
    expect(Object.keys(BITMAP_ICONS_24).length).toBeGreaterThan(500);
  });

  it('contains a known-good 16px icon with a mask URI', () => {
    const entry = getBitmapIcon('close', 16);
    expect(entry).toBeDefined();
    expect(entry!.size).toBe(16);
    expect(entry!.width).toBe(16);
    expect(entry!.height).toBe(16);
    expect(entry!.path).toMatch(/^M/);
    expect(entry!.maskImage).toContain('data:image/svg+xml');
  });

  it('contains a known-good 24px icon trimmed to the 21x21 live area', () => {
    const entry = getBitmapIcon('coding-apps-websites-music-player', 24);
    expect(entry).toBeDefined();
    expect(entry!.size).toBe(24);
    expect(entry!.width).toBe(21);
    expect(entry!.height).toBe(21);
    expect(entry!.maskImage).toContain('data:image/svg+xml');
  });

  it('returns undefined for a missing name', () => {
    expect(getBitmapIcon('definitely-not-a-real-icon', 16)).toBeUndefined();
    expect(getBitmapIcon('definitely-not-a-real-icon', 24)).toBeUndefined();
  });

  it('returns undefined when looking up a 16px name at 24px (separate sets)', () => {
    // "close" exists in the 16px set but not the 24px set.
    expect(getBitmapIcon('close', 24)).toBeUndefined();
  });
});

describe('BitmapIcon', () => {
  it('renders a span with mask-image style for a known 16px icon', () => {
    const html = renderToStaticMarkup(<BitmapIcon name="close" size={16} />);
    expect(html).toContain('<span');
    expect(html).toContain('data-rdna="bitmap-icon"');
    expect(html).toContain('data-icon="close"');
    expect(html).toContain('data-size="16"');
    expect(html).toContain('mask-image');
    expect(html).toContain('data:image/svg+xml');
    // Outer box is 16×16
    expect(html).toMatch(/width:\s*16px/);
    expect(html).toMatch(/height:\s*16px/);
    // aria-hidden defaults to true when no label
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders a 24px icon with the 21×21 live area inset by 1px 1px', () => {
    const html = renderToStaticMarkup(
      <BitmapIcon name="coding-apps-websites-music-player" size={24} />,
    );
    expect(html).toContain('data-size="24"');
    // Outer box is 24×24
    expect(html).toMatch(/width:\s*24px/);
    expect(html).toMatch(/height:\s*24px/);
    // Mask is positioned 1px 1px into the 24-slot
    expect(html).toMatch(/mask-position:\s*1px 1px/);
    // Mask size matches the 21×21 live area
    expect(html).toMatch(/mask-size:\s*21px 21px/);
  });

  it('renders nothing for an unknown icon name', () => {
    const html = renderToStaticMarkup(<BitmapIcon name="not-real-icon" size={16} />);
    expect(html).toBe('');
  });

  it('exposes aria-label and role=img when a label is provided', () => {
    const html = renderToStaticMarkup(
      <BitmapIcon name="close" size={16} aria-label="Close" />,
    );
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('role="img"');
    expect(html).not.toContain('aria-hidden');
  });

  it('applies a provided className', () => {
    const html = renderToStaticMarkup(
      <BitmapIcon name="close" size={16} className="text-head" />,
    );
    expect(html).toContain('class="text-head"');
  });
});
