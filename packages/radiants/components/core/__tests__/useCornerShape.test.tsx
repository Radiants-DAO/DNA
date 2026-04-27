import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useCornerShape } from '../useCornerShape';

function CornerShapeProbe() {
  const cornerShape = useCornerShape();
  return <output data-testid="corner-shape">{cornerShape}</output>;
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

describe('useCornerShape', () => {
  afterEach(async () => {
    await setDocumentCornerShape();
  });

  it('falls back to circle when html data-corner-shape is missing', () => {
    render(<CornerShapeProbe />);

    expect(screen.getByTestId('corner-shape')).toHaveTextContent('circle');
  });

  it('reads the current html data-corner-shape value', async () => {
    await setDocumentCornerShape('chamfer');

    render(<CornerShapeProbe />);

    expect(screen.getByTestId('corner-shape')).toHaveTextContent('chamfer');
  });

  it('preserves non-empty custom html data-corner-shape values', async () => {
    await setDocumentCornerShape('test-custom-shape');

    render(<CornerShapeProbe />);

    expect(screen.getByTestId('corner-shape')).toHaveTextContent('test-custom-shape');
  });

  it('falls back to circle when html data-corner-shape is empty', async () => {
    await setDocumentCornerShape('');

    render(<CornerShapeProbe />);

    expect(screen.getByTestId('corner-shape')).toHaveTextContent('circle');
  });

  it('updates when html data-corner-shape changes', async () => {
    await setDocumentCornerShape('circle');

    render(<CornerShapeProbe />);
    expect(screen.getByTestId('corner-shape')).toHaveTextContent('circle');

    await setDocumentCornerShape('scallop');

    await waitFor(() => {
      expect(screen.getByTestId('corner-shape')).toHaveTextContent('scallop');
    });
  });
});
