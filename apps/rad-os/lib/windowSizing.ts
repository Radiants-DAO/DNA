export const WINDOW_SIZES = {
  sm: { width: '30rem', height: '25rem' },
  md: { width: '48rem', height: '36rem' },
  lg: { width: '69rem', height: '50rem' },
  xl: { width: '86rem', height: '60rem' },
} as const;

export type WindowSizeTier = keyof typeof WINDOW_SIZES;
export type WindowSize = { width: string; height: string };

export function resolveWindowSize(size: WindowSizeTier | WindowSize): WindowSize {
  return typeof size === 'string' ? WINDOW_SIZES[size] : size;
}

export function remToPx(value: string): number {
  const rem = Number.parseFloat(value);
  if (typeof document !== 'undefined') {
    return rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  }
  return rem * 16;
}
