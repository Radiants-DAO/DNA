import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PixelCodeOutput } from '../PixelCodeOutput';

describe('PixelCodeOutput', () => {
  it('shows icon mapping patch output while icon mapping mode is active', () => {
    const { container } = render(
      <PixelCodeOutput
        mode="icons"
        grid={null}
        iconMappingActive
        iconMappingOutput={[
          'export const ICON_24_TO_16_PATCH = {',
          "  'interface-essential-search-1': 'search',",
          '} as const;',
        ].join('\n')}
      />,
    );

    expect(screen.getByText('MAPPINGS')).toBeInTheDocument();
    expect(screen.getByText(/interface-essential-search-1/)).toBeInTheDocument();
    expect(screen.queryByText('Collapse')).not.toBeInTheDocument();
    expect(container.querySelector('[data-rdna="ctrl-panel"]')).toBeNull();
  });
});
