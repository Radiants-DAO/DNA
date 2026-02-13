/**
 * Runtime safety helpers for extension messaging.
 *
 * Chrome can invalidate extension contexts after a reload/update while old
 * content scripts or panel instances are still running. Calling runtime APIs
 * in that window throws synchronously. These wrappers keep UI code resilient.
 */

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isRuntimeMessagingError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('extension context invalidated') ||
    message.includes('disconnected port object') ||
    message.includes('receiving end does not exist')
  );
}

export function safeRuntimeConnect(
  name: string,
  onError?: (error: unknown) => void,
): chrome.runtime.Port | null {
  try {
    return chrome.runtime.connect({ name });
  } catch (error) {
    onError?.(error);
    return null;
  }
}

export function safePortPostMessage(
  port: chrome.runtime.Port | null | undefined,
  message: unknown,
  onError?: (error: unknown) => void,
): boolean {
  if (!port) return false;
  try {
    port.postMessage(message);
    return true;
  } catch (error) {
    onError?.(error);
    return false;
  }
}
