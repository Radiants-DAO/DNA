import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '@/components/apps/pretext/primitive-registry';

const mockMarkdownToPretextBlocks = vi.hoisted(() =>
  vi.fn((markdown: string) => [{ type: 'paragraph' as const, text: markdown }]),
);

vi.mock('@/hooks/useContainerSize', () => ({
  useContainerSize: () => [{ current: null }, { width: 777, height: 555 }] as const,
}));

vi.mock('@/components/apps/pretext/markdown', () => ({
  markdownToPretextBlocks: mockMarkdownToPretextBlocks,
}));

import { PretextDocumentView } from '@/components/apps/pretext/PretextDocumentView';
import { PretextPreviewFrame } from '@/components/apps/pretext/PretextPreviewFrame';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PretextDocumentView', () => {
  it('renders the editorial primitive', () => {
    render(
      <PretextDocumentView
        markdown="# Hello"
        settings={createDefaultSettings('editorial')}
      />,
    );

    expect(
      screen.getByTestId('pretext-primitive-editorial'),
    ).toBeInTheDocument();
  });

  it('renders the broadsheet primitive', () => {
    render(
      <PretextDocumentView
        markdown="# Hello"
        settings={createDefaultSettings('broadsheet')}
      />,
    );

    expect(
      screen.getByTestId('pretext-primitive-broadsheet'),
    ).toBeInTheDocument();
  });

  it('renders the book primitive', () => {
    render(
      <PretextDocumentView
        markdown="# Hello"
        settings={createDefaultSettings('book')}
      />,
    );

    expect(screen.getByTestId('pretext-primitive-book')).toBeInTheDocument();
  });

  it('memoizes normalized blocks when markdown is unchanged', () => {
    const settings = createDefaultSettings('editorial');
    const view = render(
      <PretextDocumentView
        markdown="# Hello"
        settings={settings}
        containerWidth={720}
        containerHeight={900}
      />,
    );

    expect(mockMarkdownToPretextBlocks).toHaveBeenCalledTimes(1);

    view.rerender(
      <PretextDocumentView
        markdown="# Hello"
        settings={{ ...settings, title: 'Updated title' }}
        containerWidth={800}
        containerHeight={640}
      />,
    );

    expect(mockMarkdownToPretextBlocks).toHaveBeenCalledTimes(1);
  });
});

describe('PretextPreviewFrame', () => {
  it('passes measured width and height into the primitive view', () => {
    const view = render(
      <PretextPreviewFrame
        markdown="# Hello"
        settings={createDefaultSettings('editorial')}
      />,
    );

    const primitive = within(view.container).getByTestId(
      'pretext-primitive-editorial',
    );
    expect(primitive).toHaveAttribute('data-container-width', '777');
    expect(primitive).toHaveAttribute('data-container-height', '555');
  });
});
