import { cdp } from './cdpBridge';
import { resolveSelectedNodeId } from './elementResolver';

type ImageFormat = 'png' | 'jpeg' | 'webp';

const FORMAT_MIME: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Capture a full-page or clipped screenshot via CDP Page.captureScreenshot.
 * Returns a data URL string.
 */
export async function captureScreenshot(options?: {
  format?: ImageFormat;
  quality?: number;
  clip?: { x: number; y: number; width: number; height: number; scale: number };
}): Promise<string> {
  const format = options?.format || 'png';

  const result = await cdp('Page.captureScreenshot', {
    format,
    quality: options?.quality,
    clip: options?.clip,
  }) as { data: string };

  return `data:${FORMAT_MIME[format]};base64,${result.data}`;
}

/**
 * Capture a screenshot of the currently selected element.
 * Uses DOM.getBoxModel to get precise element bounds, then clips the screenshot.
 *
 * Returns null if no element is selected or CDP is unavailable.
 */
export async function captureSelectedElement(options?: {
  format?: ImageFormat;
  quality?: number;
}): Promise<string | null> {
  const nodeId = await resolveSelectedNodeId();
  if (!nodeId) return null;

  try {
    const { model } = await cdp('DOM.getBoxModel', { nodeId }) as {
      model: {
        /** Quad: [x1, y1, x2, y2, x3, y3, x4, y4] — 4 corners */
        content: number[];
        width: number;
        height: number;
      };
    };

    // Content quad: [topLeftX, topLeftY, topRightX, topRightY, bottomRightX, bottomRightY, bottomLeftX, bottomLeftY]
    const x = model.content[0];
    const y = model.content[1];
    const width = model.content[2] - model.content[0];
    const height = model.content[5] - model.content[1];

    if (width <= 0 || height <= 0) return null;

    // Query device pixel ratio for accurate screenshots
    const dpr = await getDevicePixelRatio();

    return captureScreenshot({
      format: options?.format,
      quality: options?.quality,
      clip: { x, y, width, height, scale: dpr },
    });
  } catch (e) {
    console.error('[screenshotService] Failed to capture element:', e);
    return null;
  }
}

/** Get device pixel ratio from the inspected page. */
async function getDevicePixelRatio(): Promise<number> {
  return new Promise((resolve) => {
    chrome.devtools.inspectedWindow.eval(
      'window.devicePixelRatio || 1',
      (result: unknown) => {
        resolve(typeof result === 'number' ? result : 1);
      },
    );
  });
}
