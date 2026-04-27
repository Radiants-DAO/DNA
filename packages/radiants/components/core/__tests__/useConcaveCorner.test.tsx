import { act, render, screen, waitFor } from '@testing-library/react';
import { prepareCornerProfile } from '@rdna/pixel';
import { afterEach, describe, expect, it } from 'vitest';
import { useConcaveCorner } from '../useConcaveCorner';

function ConcaveCornerProbe({ shape }: { shape?: string }) {
  const props = useConcaveCorner({
    corner: 'br',
    radiusPx: 8,
    shape,
  });

  return (
    <output
      data-testid="concave-corner"
      data-class-name={props.className}
      data-mask={props.style['--px-concave-mask']}
      data-size={props.style['--px-concave-s']}
    />
  );
}

async function setDocumentCornerShape(value?: string) {
  await act(async () => {
    if (value === undefined) {
      delete document.documentElement.dataset.cornerShape;
    } else {
      document.documentElement.dataset.cornerShape = value;
    }

    await Promise.resolve();
  });
}

describe('useConcaveCorner', () => {
  afterEach(async () => {
    await setDocumentCornerShape();
  });

  it('uses html data-corner-shape for theme-bound concave corners', async () => {
    await setDocumentCornerShape('chamfer');

    render(<ConcaveCornerProbe />);

    const output = screen.getByTestId('concave-corner');
    expect(output).toHaveAttribute('data-class-name', 'pixel-concave-corner pixel-concave-br');
    expect(output).toHaveAttribute(
      'data-mask',
      prepareCornerProfile('chamfer', 8).cover.br.maskImage,
    );
    expect(output).toHaveAttribute('data-size', 'calc(9px * var(--pixel-scale, 1))');
  });

  it('updates theme-bound concave corners when html data-corner-shape changes', async () => {
    await setDocumentCornerShape('circle');

    render(<ConcaveCornerProbe />);
    await setDocumentCornerShape('scallop');

    await waitFor(() => {
      expect(screen.getByTestId('concave-corner')).toHaveAttribute(
        'data-mask',
        prepareCornerProfile('scallop', 8).cover.br.maskImage,
      );
    });
  });

  it('lets a fixed shape override html data-corner-shape', async () => {
    await setDocumentCornerShape('circle');

    render(<ConcaveCornerProbe shape="chamfer" />);

    expect(screen.getByTestId('concave-corner')).toHaveAttribute(
      'data-mask',
      prepareCornerProfile('chamfer', 8).cover.br.maskImage,
    );
  });
});
