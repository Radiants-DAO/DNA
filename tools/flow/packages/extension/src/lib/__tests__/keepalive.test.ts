import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  recordTabActivity,
  removeTab,
  handleAlarm,
  onTabSleep,
  getActiveTabCount,
  SLEEP_TIMEOUT_MS,
  _resetForTesting,
} from '../keepalive';

describe('keepalive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetForTesting();
    vi.stubGlobal('chrome', {
      alarms: {
        create: vi.fn(),
        clear: vi.fn(),
      },
    });
  });

  afterEach(() => {
    _resetForTesting();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('tracks tab activity', () => {
    recordTabActivity(1);
    expect(getActiveTabCount()).toBe(1);
    recordTabActivity(2);
    expect(getActiveTabCount()).toBe(2);
  });

  it('starts alarm when first tab is recorded', () => {
    recordTabActivity(1);
    expect(chrome.alarms.create).toHaveBeenCalledWith(
      'flow-keepalive',
      expect.objectContaining({ periodInMinutes: expect.any(Number) }),
    );
  });

  it('fires onSleep callback for idle tabs', () => {
    const sleepFn = vi.fn();
    onTabSleep(sleepFn);

    recordTabActivity(1);
    recordTabActivity(2);

    // Advance time past sleep timeout
    vi.advanceTimersByTime(SLEEP_TIMEOUT_MS + 1000);

    handleAlarm({ name: 'flow-keepalive', scheduledTime: Date.now() });

    expect(sleepFn).toHaveBeenCalledWith(1);
    expect(sleepFn).toHaveBeenCalledWith(2);
    expect(getActiveTabCount()).toBe(0);
  });

  it('does not fire sleep for recently active tabs', () => {
    const sleepFn = vi.fn();
    onTabSleep(sleepFn);

    recordTabActivity(1);
    vi.advanceTimersByTime(SLEEP_TIMEOUT_MS - 1000);

    // Tab 1 sends activity, resetting its timer
    recordTabActivity(1);

    vi.advanceTimersByTime(2000);

    handleAlarm({ name: 'flow-keepalive', scheduledTime: Date.now() });

    expect(sleepFn).not.toHaveBeenCalled();
    expect(getActiveTabCount()).toBe(1);
  });

  it('removeTab clears tab and stops alarm when empty', () => {
    recordTabActivity(1);
    removeTab(1);
    expect(getActiveTabCount()).toBe(0);
    expect(chrome.alarms.clear).toHaveBeenCalledWith('flow-keepalive');
  });

  it('ignores unrelated alarms', () => {
    const sleepFn = vi.fn();
    onTabSleep(sleepFn);

    recordTabActivity(1);
    vi.advanceTimersByTime(SLEEP_TIMEOUT_MS + 1000);

    handleAlarm({ name: 'some-other-alarm', scheduledTime: Date.now() });
    expect(sleepFn).not.toHaveBeenCalled();
  });
});
