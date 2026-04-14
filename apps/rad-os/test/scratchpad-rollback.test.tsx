import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/dynamic', () => ({
  default: () =>
    function ScratchpadEditorMock(props: { initialContent: unknown[] }) {
      return (
        <div
          data-testid="scratchpad-editor-mock"
          data-block-count={Array.isArray(props.initialContent) ? props.initialContent.length : -1}
        />
      );
    },
}));

import { ScratchpadApp } from '@/components/apps/ScratchpadApp';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Scratchpad rollback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('restores the BlockNote editing surface instead of the markdown-first pretext UI', () => {
    render(<ScratchpadApp windowId="scratchpad" />);

    expect(screen.getByTestId('scratchpad-editor-mock')).toBeInTheDocument();
    expect(screen.queryByLabelText('Markdown source')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New Editorial' }),
    ).not.toBeInTheDocument();
  });

  it('drops regression-era pretext drafts and boots into a fresh BlockNote doc', () => {
    localStorage.setItem(
      'rados-scratchpad-docs',
      JSON.stringify([
        {
          kind: 'pretext',
          id: 'pretext-1',
          title: 'Throwaway Test Draft',
          markdown: '# Throwaway',
          settings: {
            version: 1,
            id: 'pretext-1',
            title: 'Throwaway Test Draft',
            slug: 'throwaway-test-draft',
            primitive: 'editorial',
            preview: {
              windowWidth: 720,
              windowHeight: 900,
              density: 'comfortable',
            },
            primitiveSettings: {
              primitive: 'editorial',
              dropCap: true,
              pullquote: false,
              columnCount: 1,
            },
            assets: {},
          },
          updatedAt: Date.now(),
        },
      ]),
    );
    localStorage.setItem('rados-scratchpad-active', 'pretext-1');

    render(<ScratchpadApp windowId="scratchpad" />);

    expect(screen.getByTestId('scratchpad-editor-mock')).toBeInTheDocument();
    expect(screen.queryByText('Throwaway Test Draft')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Markdown source')).not.toBeInTheDocument();
  });
});
