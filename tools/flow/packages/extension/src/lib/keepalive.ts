/**
 * Keepalive alarm manager for MV3 service worker lifecycle.
 *
 * - Fires a periodic alarm (every 25s) to keep the service worker alive
 *   while tabs are actively using Flow.
 * - Tracks per-tab activity timestamps.
 * - When a tab is idle for SLEEP_TIMEOUT_MS, fires the onSleep callback.
 * - When no tabs remain active, stops the alarm so the worker can sleep.
 */

const ALARM_NAME = 'flow-keepalive';
const ALARM_PERIOD_MINUTES = 25 / 60; // 25 seconds, under MV3's 30s threshold
export const SLEEP_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const lastActivityByTab = new Map<number, number>();
let sleepCallback: ((tabId: number) => void) | null = null;
let alarmRunning = false;

export function onTabSleep(callback: (tabId: number) => void): void {
  sleepCallback = callback;
}

export function recordTabActivity(tabId: number): void {
  lastActivityByTab.set(tabId, Date.now());
  if (!alarmRunning) {
    startKeepalive();
  }
}

export function removeTab(tabId: number): void {
  lastActivityByTab.delete(tabId);
  if (lastActivityByTab.size === 0) {
    stopKeepalive();
  }
}

export function handleAlarm(alarm: chrome.alarms.Alarm): void {
  if (alarm.name !== ALARM_NAME) return;

  const now = Date.now();
  const sleepyTabs: number[] = [];

  for (const [tabId, lastActivity] of lastActivityByTab) {
    if (now - lastActivity > SLEEP_TIMEOUT_MS) {
      sleepyTabs.push(tabId);
    }
  }

  for (const tabId of sleepyTabs) {
    lastActivityByTab.delete(tabId);
    sleepCallback?.(tabId);
  }

  if (lastActivityByTab.size === 0) {
    stopKeepalive();
  }
}

export function startKeepalive(): void {
  if (alarmRunning) return;
  alarmRunning = true;
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
}

export function stopKeepalive(): void {
  if (!alarmRunning) return;
  alarmRunning = false;
  chrome.alarms.clear(ALARM_NAME);
}

/** Get the number of active tabs (for testing). */
export function getActiveTabCount(): number {
  return lastActivityByTab.size;
}

/** Reset all state (for testing only). */
export function _resetForTesting(): void {
  lastActivityByTab.clear();
  sleepCallback = null;
  alarmRunning = false;
}
