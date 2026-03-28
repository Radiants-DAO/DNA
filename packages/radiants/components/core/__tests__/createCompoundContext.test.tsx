import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { createCompoundContext } from '../../shared/createCompoundContext';

describe('createCompoundContext', () => {
  test('returns the provided value from inside the compound tree', () => {
    const { Context, useCompoundContext } = createCompoundContext<{ label: string }>('Widget');

    function Reader() {
      const value = useCompoundContext();
      return <div>{value.label}</div>;
    }

    render(
      <Context value={{ label: 'ready' }}>
        <Reader />
      </Context>,
    );

    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  test('throws a stable error when used outside the provider', () => {
    const { useCompoundContext } = createCompoundContext<{ label: string }>('Widget', {
      errorMessage: 'Widget components must be used within Widget.Provider',
    });

    function Reader() {
      useCompoundContext();
      return null;
    }

    expect(() => render(<Reader />)).toThrow(
      'Widget components must be used within Widget.Provider',
    );
  });
});
