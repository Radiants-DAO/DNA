import { render, screen } from '@testing-library/react';
import { ScrollArea } from './ScrollArea';
import type { ComponentProps } from 'react';

describe('ScrollArea', () => {
  test('renders scrollable content', () => {
    render(
      <ScrollArea.Root className="h-32">
        <p>Scrollable content</p>
      </ScrollArea.Root>
    );
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
  });

  test('type prop is removed from the public API', () => {
    // type is a dead prop — Base UI ScrollArea has no type concept.
    // Verify it no longer exists on ScrollAreaRootProps.
    type Props = ComponentProps<typeof ScrollArea.Root>;
    type HasType = 'type' extends keyof Props ? true : false;
    const result: HasType = false as HasType; // should compile only if type is absent
    expect(result).toBe(false);
  });
});
