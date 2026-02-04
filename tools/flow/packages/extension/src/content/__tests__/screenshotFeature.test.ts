import { describe, it, expect } from 'vitest';
import { buildScreenshotRequest } from '../features/screenshot';

describe('screenshot feature', () => {
  it('creates the request message', () => {
    expect(buildScreenshotRequest().kind).toBe('screenshot:request');
  });

  it('includes timestamp', () => {
    const request = buildScreenshotRequest();
    expect(request.timestamp).toBeDefined();
  });
});
