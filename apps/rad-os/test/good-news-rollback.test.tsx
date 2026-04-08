import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoodNewsApp } from '@/components/apps/GoodNewsApp';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('GoodNews rollback', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  it('does not render through the shared broadsheet wrapper', () => {
    render(<GoodNewsApp windowId="goodnews" />);

    expect(
      screen.queryByTestId('pretext-primitive-broadsheet'),
    ).not.toBeInTheDocument();
  });
});
