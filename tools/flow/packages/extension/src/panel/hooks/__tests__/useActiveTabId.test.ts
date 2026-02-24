import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveTabId } from '../useActiveTabId';

const mockQuery = vi.fn();
const mockOnActivated = { addListener: vi.fn(), removeListener: vi.fn() };
const mockOnRemoved = { addListener: vi.fn(), removeListener: vi.fn() };

vi.stubGlobal('chrome', {
  tabs: {
    query: mockQuery,
    onActivated: mockOnActivated,
    onRemoved: mockOnRemoved,
  },
  devtools: undefined,
});

describe('useActiveTabId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves tabId from chrome.tabs.query on mount', async () => {
    mockQuery.mockResolvedValue([{ id: 42, windowId: 1 }]);

    const { result } = renderHook(() => useActiveTabId());

    expect(result.current).toBeNull();

    await vi.waitFor(() => {
      expect(result.current).toBe(42);
    });
  });

  it('returns null when no active tab', async () => {
    mockQuery.mockResolvedValue([]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('returns null when tab has no id', async () => {
    mockQuery.mockResolvedValue([{ windowId: 1 }]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('registers onActivated listener', () => {
    mockQuery.mockResolvedValue([{ id: 1, windowId: 1 }]);

    renderHook(() => useActiveTabId());

    expect(mockOnActivated.addListener).toHaveBeenCalledTimes(1);
  });

  it('registers onRemoved listener', () => {
    mockQuery.mockResolvedValue([{ id: 1, windowId: 1 }]);

    renderHook(() => useActiveTabId());

    expect(mockOnRemoved.addListener).toHaveBeenCalledTimes(1);
  });

  it('updates tabId when onActivated fires in same window', async () => {
    mockQuery.mockResolvedValue([{ id: 1, windowId: 10 }]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBe(1);
    });

    const activatedHandler = mockOnActivated.addListener.mock.calls[0][0];
    act(() => {
      activatedHandler({ tabId: 99, windowId: 10 });
    });

    expect(result.current).toBe(99);
  });

  it('ignores onActivated from a different window', async () => {
    mockQuery.mockResolvedValue([{ id: 1, windowId: 10 }]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBe(1);
    });

    const activatedHandler = mockOnActivated.addListener.mock.calls[0][0];
    act(() => {
      activatedHandler({ tabId: 99, windowId: 20 });
    });

    // Should still be 1 — ignored the other-window activation
    expect(result.current).toBe(1);
  });

  it('clears tabId when active tab is removed', async () => {
    mockQuery.mockResolvedValue([{ id: 5, windowId: 1 }]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBe(5);
    });

    const removedHandler = mockOnRemoved.addListener.mock.calls[0][0];
    act(() => {
      removedHandler(5);
    });

    expect(result.current).toBeNull();
  });

  it('keeps tabId when a different tab is removed', async () => {
    mockQuery.mockResolvedValue([{ id: 5, windowId: 1 }]);

    const { result } = renderHook(() => useActiveTabId());

    await vi.waitFor(() => {
      expect(result.current).toBe(5);
    });

    const removedHandler = mockOnRemoved.addListener.mock.calls[0][0];
    act(() => {
      removedHandler(999);
    });

    expect(result.current).toBe(5);
  });

  it('cleans up listeners on unmount', () => {
    mockQuery.mockResolvedValue([{ id: 1, windowId: 1 }]);

    const { unmount } = renderHook(() => useActiveTabId());
    unmount();

    expect(mockOnActivated.removeListener).toHaveBeenCalledTimes(1);
    expect(mockOnRemoved.removeListener).toHaveBeenCalledTimes(1);
  });
});
