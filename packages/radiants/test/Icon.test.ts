import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Icon } from '../icons/Icon';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Icon', () => {
  it.each([
    { name: 'search', label: 'Search', size: 24 },
    { name: 'chevron-left', label: 'Chevron Left', size: 24 },
    { name: 'interface-essential-eraser', label: 'Eraser', size: 24 },
  ])('renders $name through the default importer path', async ({ name, label, size }) => {
    render(
      React.createElement(Icon, {
        name,
        size,
        'aria-label': label,
      }),
    );

    await waitFor(() => {
      const element = screen.getByLabelText(label);
      expect(element.tagName.toLowerCase()).toBe('svg');
      expect(element.querySelector('path')).not.toBeNull();
    });

    expect(screen.getByLabelText(label)).toHaveAttribute('width', `${size}`);
    expect(screen.getByLabelText(label)).toHaveAttribute('height', `${size}`);
  });

  it('ignores deprecated basePath and still renders through the generated importer path', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      React.createElement(Icon, {
        name: 'search',
        size: 24,
        basePath: 'https://cdn.example/icons/',
        'aria-label': 'Search',
      }),
    );

    await waitFor(() => {
      const element = screen.getByLabelText('Search');
      expect(element.tagName.toLowerCase()).toBe('svg');
      expect(element.querySelector('path')).not.toBeNull();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
