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
  it('fetches from a non-default basePath for compatibility', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
    });

    vi.stubGlobal('fetch', fetchMock);

    render(
      React.createElement(Icon, {
        name: 'search',
        size: 24,
        basePath: 'https://cdn.example/icons/',
        'aria-label': 'Search',
      }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        'https://cdn.example/icons/24px/interface-essential-search-1.svg',
      ),
    );

    const wrapper = await screen.findByLabelText('Search');
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper).toHaveStyle({ width: '24px', height: '24px' });
    expect(wrapper.querySelector('svg')).not.toBeNull();
  });
});
