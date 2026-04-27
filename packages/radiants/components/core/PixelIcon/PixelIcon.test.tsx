import { render } from '@testing-library/react';

import { preparePixelIcon } from '@rdna/pixel/icons';
import { getPixelIcon } from '../../../pixel-icons/registry';
import { PixelIcon } from './PixelIcon';

const sampleGrid = {
  name: 'sample-16',
  width: 16,
  height: 16,
  bits:
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000011110000' +
    '0000000011110000' +
    '0000000011110000' +
    '0000000011110000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000' +
    '0000000000000000',
} as const;

const rectangularGrid = {
  name: 'sample-rect',
  width: 6,
  height: 4,
  bits:
    '111000' +
    '111000' +
    '000111' +
    '000111',
} as const;

describe('PixelIcon', () => {
  test('renders a single host CSS mask from a supplied PixelGrid', () => {
    const { container } = render(<PixelIcon grid={sampleGrid} />);

    const host = container.firstElementChild as HTMLElement | null;
    expect(host).toBeInTheDocument();
    expect(host?.tagName).toBe('SPAN');
    expect(host?.querySelector('svg')).toBeNull();
    expect(host?.style.maskImage || host?.style.webkitMaskImage).toContain('data:image/svg+xml');
    expect(host?.style.maskRepeat).toBe('no-repeat');
    expect(host?.style.backgroundColor).toBe('currentcolor');
  });

  test('resolves a named icon from the registry seed set', () => {
    const registryEntry = getPixelIcon('caret');
    const preparedIcon = preparePixelIcon('caret');

    expect(registryEntry).toBeDefined();
    expect(registryEntry?.name).toBe('caret');
    expect(registryEntry?.maskImage).toBe(preparedIcon?.maskImage);

    const { container } = render(<PixelIcon name="caret" />);
    const host = container.firstElementChild as HTMLElement | null;

    expect(host).toBeInTheDocument();
    expect(host?.style.maskImage || host?.style.webkitMaskImage).toContain('data:image/svg+xml');
  });

  test('inherits color through currentColor', () => {
    const { container } = render(
      <PixelIcon
        grid={sampleGrid}
        // eslint-disable-next-line rdna/no-hardcoded-colors -- reason:test-fixture-value owner:design-system expires:2027-01-01 issue:DNA-999
        style={{ color: 'rgb(12, 34, 56)' }}
      />,
    );

    const host = container.firstElementChild as HTMLElement | null;
    expect(host?.style.color).toBe('rgb(12, 34, 56)');
    expect(host?.style.backgroundColor).toBe('currentcolor');
  });

  test('honors explicit size and scale props', () => {
    const { container: scaled } = render(<PixelIcon grid={sampleGrid} scale={2} />);
    const scaledHost = scaled.firstElementChild as HTMLElement | null;

    expect(scaledHost?.style.width).toBe('32px');
    expect(scaledHost?.style.height).toBe('32px');

    const { container: sized } = render(<PixelIcon grid={sampleGrid} size={40} />);
    const sizedHost = sized.firstElementChild as HTMLElement | null;

    expect(sizedHost?.style.width).toBe('40px');
    expect(sizedHost?.style.height).toBe('40px');
  });

  test('preserves rectangular grid aspect ratio when size is not overridden', () => {
    const { container } = render(<PixelIcon grid={rectangularGrid} scale={2} />);
    const host = container.firstElementChild as HTMLElement | null;
    const maskImage = host?.style.maskImage || host?.style.webkitMaskImage || '';
    const decoded = decodeURIComponent(
      maskImage.replace(/^url\("data:image\/svg\+xml,/, '').replace(/"\)$/, ''),
    );

    expect(host?.style.width).toBe('12px');
    expect(host?.style.height).toBe('8px');
    expect(decoded).toContain("width='6'");
    expect(decoded).toContain("height='4'");
  });
});
